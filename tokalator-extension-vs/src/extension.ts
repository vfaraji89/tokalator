import * as vscode from 'vscode';
import { ContextMonitor } from './core/contextMonitor';
import { ContextDashboardProvider } from './webview/contextDashboardProvider';
import { ContextChatParticipant } from './chat/contextChatParticipant';
import { loadPricingCatalog, refreshPricingCatalog } from './core/pricingCatalog';
import { applyRemotePayload } from './core/catalogStore';
import { WorkspaceSecurityScanner } from './core/workspaceSecurityScanner';
import { PriceWatchService } from './core/priceWatch';
import { ClaudeCodeTracker } from './core/claudeCodeTracker';
import { askForImprovement, maybeAskForFeedback, maybeAskUseCase } from './core/feedback';
import { Telemetry } from './core/telemetry';
import { writeCodeMaps } from './core/codeMaps';

let monitorRef: ContextMonitor | undefined;
const log = vscode.window.createOutputChannel('Tokalator');

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export interface TokalatorApi {
  monitor: ContextMonitor;
  dashboard: ContextDashboardProvider;
  chat: ContextChatParticipant;
  claudeCode: ClaudeCodeTracker;
  telemetry: Telemetry;
  priceWatch?: PriceWatchService;
  applyCatalog: typeof applyRemotePayload;
}

export async function activate(context: vscode.ExtensionContext): Promise<TokalatorApi | undefined> {
  try {

  void loadPricingCatalog(context);

  const version: string = context.extension.packageJSON.version;
  const telemetry = new Telemetry(context.globalState, version);
  const register = (id: string, fn: (...args: any[]) => unknown) =>
    vscode.commands.registerCommand(id, (...args: any[]) => {
      telemetry.count('cmd:' + id.replace('tokalator.', ''));
      return fn(...args);
    });

  const monitor = new ContextMonitor(context.workspaceState);
  monitorRef = monitor;
  context.subscriptions.push(monitor);

  const claudeCode = new ClaudeCodeTracker();
  const dashboardProvider = new ContextDashboardProvider(context.extensionUri, monitor, claudeCode);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ContextDashboardProvider.viewType,
      dashboardProvider,
    ),
  );

  const chatParticipant = new ContextChatParticipant(monitor);
  context.subscriptions.push(chatParticipant);

  const analytics = monitor.getUsageAnalytics();
  let priceWatchRef: PriceWatchService | undefined;
  if (analytics) {
    const priceWatch = new PriceWatchService(context.globalState, analytics);
    priceWatchRef = priceWatch;
    context.subscriptions.push(priceWatch);
    chatParticipant.setPriceWatch(priceWatch);
    dashboardProvider.setPriceWatch(priceWatch);

    priceWatch.onDidDetectChange(changeset => {
      const inputChanges = changeset.changes.filter(c => c.field === 'input');
      if (inputChanges.length === 0) return;
      const labels = inputChanges.map(c => c.label).slice(0, 3).join(', ');
      const suffix = inputChanges.length > 3 ? ` and ${inputChanges.length - 3} more` : '';
      vscode.window.showInformationMessage(
        `Tokalator: Pricing changed for ${labels}${suffix}. Use @tokalator /pricewatch for impact analysis.`,
        'Show Impact',
      ).then(choice => {
        if (choice === 'Show Impact') {
          vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /pricewatch' });
        }
      });
    });
  }

  context.subscriptions.push(
    register('tokalator.refresh', () => {
      monitor.refresh();
    }),
  );

  context.subscriptions.push(
    register('tokalator.optimize', async () => {
      const closed = await monitor.optimizeTabs();
      if (closed.length > 0) {
        vscode.window.showInformationMessage(
          `Closed ${closed.length} low-relevance tabs: ${closed.join(', ')}`,
        );
      } else {
        vscode.window.showInformationMessage('All tabs are relevant — nothing to close');
      }
    }),
  );

  context.subscriptions.push(
    register('tokalator.clearPins', () => {
      monitor.clearPins();
      vscode.window.showInformationMessage('All pinned files cleared');
    }),
  );

  context.subscriptions.push(
    register('tokalator.refreshPricing', async () => {
      await refreshPricingCatalog(context);
      vscode.window.showInformationMessage('Tokalator pricing catalog refreshed');
    }),
  );

  context.subscriptions.push(
    register('tokalator.secure', async () => {
      const scanner = new WorkspaceSecurityScanner();
      const audit = await scanner.audit();
      dashboardProvider.setSecurity(audit);
      if (audit.level === 'protected') {
        vscode.window.showInformationMessage(audit.foundSecrets.length
          ? `Tokalator: all ${audit.foundSecrets.length} secret file(s) are covered for Claude Code, VS Code search, and git.`
          : 'Tokalator: no secret files found in this workspace.');
        return;
      }
      const gaps = audit.coverage.filter(c => !(c.claude && c.search && c.gitignored));
      const detail = [
        `${gaps.length} of ${audit.foundSecrets.length} secret file(s) are not fully protected:`,
        '',
        ...gaps.slice(0, 6).map(c => `•  ${c.file}  (missing: ${[!c.claude && 'Claude Code deny rule', !c.search && 'search exclusion', !c.gitignored && 'git ignore'].filter(Boolean).join(', ')})`),
        ...(gaps.length > 6 ? [`•  and ${gaps.length - 6} more`] : []),
        '',
        'Apply All adds Claude Code Read deny rules, VS Code search exclusions, .gitignore entries, and a Copilot instruction, then checks again. Existing settings are merged, never replaced.',
      ].join('\n');
      const choice = await vscode.window.showWarningMessage(
        `Secure Workspace: ${audit.score}/100`,
        { modal: true, detail },
        'Apply All',
        'Preview in Chat',
      );
      if (choice === 'Apply All') {
        try {
          const applied = await scanner.applyAll();
          await new Promise(r => setTimeout(r, 800));
          const after = await new WorkspaceSecurityScanner().audit();
          dashboardProvider.setSecurity(after);
          const gaps = after.coverage.filter(c => !(c.claude && c.search && c.gitignored)).map(c => c.file);
          vscode.window.showInformationMessage(gaps.length === 0
            ? `Tokalator: updated ${applied.join(', ')}. Verified: all ${after.foundSecrets.length} secret file(s) are now covered.`
            : `Tokalator: updated ${applied.join(', ')}. Still not fully covered: ${gaps.slice(0, 3).join(', ')}${gaps.length > 3 ? '…' : ''}. Run @tokalator /secure for details.`);
        } catch (err) {
          vscode.window.showWarningMessage(`Tokalator: nothing was written. ${err instanceof Error ? err.message : String(err)}.`);
        }
      } else if (choice === 'Preview in Chat') {
        vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /secure' });
      }
    }),
  );

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBar.command = 'tokalator.refresh';
  statusBar.text = '$(loading~spin) Tokalator';
  statusBar.tooltip = 'Tokalator — initializing...';
  statusBar.show();
  context.subscriptions.push(statusBar);

  monitor.onDidUpdateSnapshot(snapshot => {
    const level = snapshot.budgetLevel;
    const icon = level === 'low' ? '$(check)'
      : level === 'medium' ? '$(warning)'
      : '$(error)';
    const used = fmtTokens(snapshot.totalEstimatedTokens);
    const cap = fmtTokens(snapshot.windowCapacity);
    const pct = snapshot.usagePercent.toFixed(1);
    statusBar.text = `${icon} ${used} / ${cap} (${pct}%) · ${snapshot.modelLabel}`;
    statusBar.tooltip = `Tokalator — ${snapshot.tabs.length} tabs, ${snapshot.pinnedFiles.size} pinned, ${snapshot.chatTurnCount} turns\nClick to refresh`;
    statusBar.show();
  });

  const lastSession = monitor.getLastSession();
  if (lastSession && lastSession.totalTurns > 0) {
    const ago = formatTimeAgo(lastSession.endedAt);
    vscode.window.showInformationMessage(
      `Tokalator: Last session ${ago} — ${lastSession.modelLabel}, ${lastSession.totalTurns} turns, peak ${fmtTokens(lastSession.peakTokens)}`,
      'Show Dashboard',
    ).then(choice => {
      if (choice === 'Show Dashboard') {
        vscode.commands.executeCommand('tokalator.dashboard.focus');
      }
    });
  }

  await monitor.refresh();
  log.appendLine('Tokalator activated');

  setTimeout(() => {
    (async () => {
      const scanner = new WorkspaceSecurityScanner();
      const audit = await scanner.audit();
      if (audit.uncovered > 0 && !audit.coverage.some(c => c.claude || c.search)) {
        const example = audit.coverage.find(c => !c.claude)?.file ?? audit.foundSecrets[0];
        const choice = await vscode.window.showWarningMessage(
          `Tokalator: AI agents can read ${audit.uncovered} secret file(s) here, including ${example}.`,
          'Review and protect',
          'Not now',
        );
        if (choice === 'Review and protect') {
          vscode.commands.executeCommand('tokalator.secure');
        }
      }
    })().catch(err => log.appendLine('[security-scan] failed: ' + String(err)));
  }, 5000);

  chatParticipant.setTelemetry(telemetry);
  dashboardProvider.setTelemetry(telemetry);
  telemetry.count('activate');
  telemetry.count('model:' + monitor.getActiveModel().id);

  context.subscriptions.push(
    register('tokalator.feedback', () => askForImprovement(version, telemetry)),
    register('tokalator.codeMaps', async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) { vscode.window.showWarningMessage('Tokalator: open a folder to generate code maps.'); return; }
      try {
        const r = writeCodeMaps(root);
        const choice = await vscode.window.showInformationMessage(
          `Tokalator: ${r.updated.length ? 'updated ' + r.updated.join(' and ') : 'code maps are current'} (${r.symbolCount} symbols across ${r.fileCount} files).`,
          'Open SITE-MAP.md',
        );
        if (choice) await vscode.window.showTextDocument(vscode.Uri.joinPath(vscode.Uri.file(root), 'SITE-MAP.md'));
      } catch (err) {
        vscode.window.showWarningMessage(`Tokalator: code maps not written. ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
    register('tokalator.telemetryShow', async () => {
      const doc = await vscode.workspace.openTextDocument({
        language: 'json',
        content: JSON.stringify({ enabled: telemetry.enabled, privacy: 'https://tokalator.ai/privacy#telemetry', pending: telemetry.pending() }, null, 2),
      });
      await vscode.window.showTextDocument(doc, { preview: true });
    }),
    register('tokalator.telemetryExport', async () => {
      try {
        const doc = await vscode.workspace.openTextDocument({ language: 'json', content: JSON.stringify(await telemetry.exportData(), null, 2) });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (err) {
        vscode.window.showWarningMessage(`Tokalator: could not export telemetry data (${err instanceof Error ? err.message : String(err)}).`);
      }
    }),
    register('tokalator.telemetryDelete', async () => {
      const ok = await telemetry.deleteData();
      vscode.window.showInformationMessage(ok
        ? 'Tokalator: your telemetry data was deleted and a new anonymous ID will be used.'
        : 'Tokalator: local telemetry data was deleted. The server could not be reached; run this command again later to delete server data.');
    }),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('tokalator.telemetry.enabled') && !telemetry.enabled) void telemetry.clearLocal();
    }),
    vscode.env.onDidChangeTelemetryEnabled(enabled => {
      if (!enabled) void telemetry.clearLocal();
    }),
  );

  if (context.extensionMode === vscode.ExtensionMode.Production) {
    const later = (ms: number, fn: () => Promise<void>) => setTimeout(() => void fn().catch(() => undefined), ms);
    later(120_000, () => telemetry.maybeAskConsent());
    later(60_000, () => maybeAskForFeedback(context.globalState, version, telemetry));
    later(300_000, () => maybeAskUseCase(context.globalState, telemetry));
    later(15_000, () => telemetry.flush());
    const flushTimer = setInterval(() => void telemetry.flush().catch(() => undefined), 6 * 3_600_000);
    flushTimer.unref?.();
    context.subscriptions.push({ dispose: () => clearInterval(flushTimer) });
  }

  return { monitor, dashboard: dashboardProvider, chat: chatParticipant, claudeCode, telemetry, priceWatch: priceWatchRef, applyCatalog: applyRemotePayload };
  } catch (err) {
    log.appendLine('[activate] FATAL: ' + String(err));
    log.show();
    return undefined;
  }
}

export function deactivate(): void {
  monitorRef?.saveSessionSummary();
}
