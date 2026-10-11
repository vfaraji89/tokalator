import * as path from 'path';
import * as vscode from 'vscode';
import { ContextMonitor } from './core/contextMonitor';
import { ContextDashboardProvider, type CompanionBadge } from './webview/contextDashboardProvider';
import { ContextChatParticipant } from './chat/contextChatParticipant';
import { loadPricingCatalog, refreshPricingCatalog } from './core/pricingCatalog';
import { applyRemotePayload } from './core/catalogStore';
import { WorkspaceSecurityScanner } from './core/workspaceSecurityScanner';
import { PriceWatchService, priceWatchReport } from './core/priceWatch';
import { ClaudeCodeTracker } from './core/claudeCodeTracker';
import { AgentUsageTracker } from './core/agents/agentTracker';
import { AGENT_LABELS, type AgentId } from './core/agents/types';
import { detectProject, planAgentFiles, planSkill, writePlanned } from './core/workspaceSetup';
import { hooksReportMarkdown, readHooks, removeHook, scopeLabel, setHooksPaused, type HookEntry } from './core/claudeHooks';
import { dependencyReportMarkdown, dependencySummary, runDependencyCheck, severityCounts, type DependencyReport } from './core/dependencyCheck';
import type { AgentSummary } from './core/agents/summary.pure';
import { askForImprovement, maybeAskForFeedback, maybeAskUseCase, maybeOfferSurvey, runSurvey } from './core/feedback';
import { Telemetry } from './core/telemetry';
import { writeCodeMaps } from './core/codeMaps';

let monitorRef: ContextMonitor | undefined;
const log = vscode.window.createOutputChannel('Tokalator');

/** Creates missing agent files after the user picks them; existing files are never touched. */
async function generateFiles(kind: 'agents' | 'skill', opts?: { apply?: boolean }): Promise<string[]> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) {
    vscode.window.showWarningMessage('Tokalator: open a folder first.');
    return [];
  }
  const facts = detectProject(root);
  const plan = kind === 'skill' ? planSkill(root, facts) : planAgentFiles(root, facts);
  if (plan.length === 0) {
    vscode.window.showInformationMessage('Tokalator: no build, test, lint or type check commands found (package.json scripts, pyproject.toml, go.mod, Cargo.toml or Makefile). Add them, then generate the checks skill.');
    return [];
  }
  const missing = plan.filter(f => !f.exists);
  if (missing.length === 0) {
    const open = await vscode.window.showInformationMessage(`Tokalator: ${plan.map(f => f.path).join(', ')} already exist. Nothing was changed.`, 'Open');
    if (open) await vscode.window.showTextDocument(vscode.Uri.file(path.join(root, plan[0].path)));
    return [];
  }
  let chosen = missing;
  if (!opts?.apply) {
    const kept = plan.filter(f => f.exists).map(f => f.path);
    const picks = await vscode.window.showQuickPick(missing.map(f => ({ label: f.path, description: f.readBy, picked: true, file: f })), {
      canPickMany: true,
      title: kind === 'skill' ? 'Checks skill: where should agents find it?' : 'Agent instructions: files to create',
      placeHolder: kept.length ? `Kept as is: ${kept.join(', ')}` : 'Existing files are never overwritten',
    });
    if (!picks?.length) return [];
    chosen = picks.map(p => p.file);
  }
  const written = writePlanned(root, chosen);
  if (written.length) {
    await vscode.window.showTextDocument(vscode.Uri.file(path.join(root, written[0])), { preview: false });
    vscode.window.showInformationMessage(`Tokalator: created ${written.join(', ')}. Review and edit it to fit your project.`);
  }
  return written;
}

async function showDependencyReport(report: DependencyReport, root: string): Promise<void> {
  const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: dependencyReportMarkdown(report, root) });
  await vscode.commands.executeCommand('markdown.showPreview', doc.uri).then(undefined, () => vscode.window.showTextDocument(doc));
  if (!report.commands.length) return;
  const pick = await vscode.window.showInformationMessage(`Tokalator: ${dependencySummary(report)}.`, 'Run a safe update…');
  if (!pick) return;
  const choice = await vscode.window.showQuickPick(report.commands.map(c => ({ label: c.cmd, description: path.relative(root, c.dir) || '.', detail: c.what, c })), { title: 'Runs in a terminal so you can watch it. Review the changes and run your tests afterwards.' });
  if (!choice) return;
  const term = vscode.window.createTerminal({ name: 'Tokalator: dependencies', cwd: choice.c.dir });
  term.show();
  term.sendText(choice.c.cmd);
}

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
  agents: AgentUsageTracker;
  telemetry: Telemetry;
  priceWatch?: PriceWatchService;
  applyCatalog: typeof applyRemotePayload;
  setCompanionBadge: (badge: CompanionBadge | null) => void;
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
  const agents = new AgentUsageTracker(context.storageUri ? path.dirname(context.storageUri.fsPath) : undefined);
  const dashboardProvider = new ContextDashboardProvider(context.extensionUri, monitor, claudeCode, agents, context.globalState);
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
    priceWatch.setAgentUsage(() => ({ ...agents.getSummaries(), 'claude-code': claudeCode.getSummary() }));
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
    register('tokalator.generateAgentFiles', (opts?: { apply?: boolean }) => generateFiles('agents', opts)),
    register('tokalator.generateSkill', (opts?: { apply?: boolean }) => generateFiles('skill', opts)),
    register('tokalator.dependencyCheck', async (opts?: { silent?: boolean }) => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) return;
      const report = await vscode.window.withProgress({ location: opts?.silent ? vscode.ProgressLocation.Window : vscode.ProgressLocation.Notification, title: 'Tokalator: checking dependencies' }, () => runDependencyCheck(root));
      const c = severityCounts(report.vulnerabilities);
      const alert = c.critical + c.high > 0 || report.runtimes.some(r => r.status === 'eol');
      dashboardProvider.setDependencies({ summary: dependencySummary(report), alert });
      void context.workspaceState.update('tokalator.dependencyCheck.at', Date.now());
      if (opts?.silent) {
        if (alert && (await vscode.window.showWarningMessage(`Tokalator: ${dependencySummary(report)}.`, 'Show Report')) === 'Show Report') await showDependencyReport(report, root);
        return report;
      }
      await showDependencyReport(report, root);
      return report;
    }),
    register('tokalator.hooksReport', async () => {
      const state = readHooks(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
      const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: hooksReportMarkdown(state, claudeCode.getToolUsage()?.hookRuns ?? []) });
      await vscode.commands.executeCommand('markdown.showPreview', doc.uri).then(undefined, () => vscode.window.showTextDocument(doc));
    }),
    register('tokalator.toggleHooksPause', async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) return;
      const paused = readHooks(root).files.some(f => f.scope === 'local' && f.disableAllHooks);
      try {
        const file = setHooksPaused(root, !paused);
        dashboardProvider.refreshHooks();
        vscode.window.showInformationMessage(paused ? 'Tokalator: hooks resumed for you in this project.' : `Tokalator: all Claude Code hooks paused for you in this project (disableAllHooks in ${path.relative(root, file)}). New Claude Code sessions pick this up.`);
      } catch (err) {
        vscode.window.showWarningMessage(`Tokalator: nothing was changed. ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
    register('tokalator.removeHook', async (entry?: HookEntry) => {
      if (!entry) return;
      const ok = await vscode.window.showWarningMessage(`Remove this ${entry.event} hook?`, { modal: true, detail: `${entry.matcher ? `Matcher: ${entry.matcher}\n` : ''}${entry.command}\n\nFrom ${scopeLabel(entry.scope)}: ${entry.file}\nOther settings in the file are kept.` }, 'Remove');
      if (ok !== 'Remove') return;
      try {
        removeHook(entry);
        dashboardProvider.refreshHooks();
      } catch (err) {
        vscode.window.showWarningMessage(`Tokalator: nothing was changed. ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
    register('tokalator.priceWatch', async () => {
      if (!priceWatchRef) return;
      const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: priceWatchReport(priceWatchRef, AGENT_LABELS) });
      await vscode.commands.executeCommand('markdown.showPreview', doc.uri).then(undefined, () => vscode.window.showTextDocument(doc));
      priceWatchRef.acknowledge();
    }),
    register('tokalator.pinFile', (uri?: vscode.Uri) => {
      const target = uri instanceof vscode.Uri ? uri : vscode.window.activeTextEditor?.document.uri;
      if (target) return dashboardProvider.pinFile(target);
    }),
    register('tokalator.unpinFile', (uri?: vscode.Uri) => {
      const target = uri instanceof vscode.Uri ? uri : vscode.window.activeTextEditor?.document.uri;
      if (target) monitor.unpinFile(target.toString());
    }),
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
        'Show Details',
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
            : `Tokalator: updated ${applied.join(', ')}. Still not fully covered: ${gaps.slice(0, 3).join(', ')}${gaps.length > 3 ? '…' : ''}. Run Secure Workspace again for details.`);
        } catch (err) {
          vscode.window.showWarningMessage(`Tokalator: nothing was written. ${err instanceof Error ? err.message : String(err)}.`);
        }
      } else if (choice === 'Show Details') {
        const mark = (ok: boolean) => (ok ? 'Yes' : '**No**');
        const content = [
          `# Secure Workspace: ${audit.score}/100`, '',
          '| Secret file | Claude Code deny rule | VS Code search exclusion | Git ignored |', '|---|---|---|---|',
          ...audit.coverage.map(c => `| \`${c.file}\` | ${mark(c.claude)} | ${mark(c.search)} | ${mark(c.gitignored)} |`), '',
          '- Claude Code: `Read(...)` deny rules in `.claude/settings.json` block the file.',
          '- GitHub Copilot: `.github/instructions/secret-files.instructions.md` asks it not to read them, and search exclusion keeps them out of workspace search.',
          '- Codex: has no file-level deny setting. Keep the Security rule in `AGENTS.md` (Agent Instructions adds it).', '',
          'Apply All merges these settings without replacing existing ones, then checks again.',
        ].join('\n');
        const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content });
        await vscode.commands.executeCommand('markdown.showPreview', doc.uri).then(undefined, () => vscode.window.showTextDocument(doc));
      }
    }),
  );

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBar.command = 'tokalator.dashboard.focus';
  statusBar.text = '$(loading~spin) Tokalator';
  statusBar.tooltip = 'Tokalator: initializing';
  statusBar.show();
  context.subscriptions.push(statusBar);

  monitor.onDidUpdateSnapshot(snapshot => {
    const summaries = { ...agents.getSummaries(), ...(claudeCode.getSummary() ? { 'claude-code': claudeCode.getSummary() } : {}) } as Partial<Record<AgentId, AgentSummary | null>>;
    const live = (id: string) => {
      const sum = summaries[id as AgentId];
      return sum?.session && sum.session.contextTokens > 0 && Date.now() - Date.parse(sum.lastActivityAt ?? '') < 30 * 60_000 ? sum : null;
    };
    const recent = Object.keys(summaries).filter(live).sort((x, y) => String(live(y)?.lastActivityAt).localeCompare(String(live(x)?.lastActivityAt)));
    const followed = dashboardProvider.followedAgent();
    const id = followed && live(followed) ? followed : recent[0];
    const sum = id ? live(id) : null;
    const estimate = `Open files estimate: ~${fmtTokens(snapshot.totalEstimatedTokens)} of ${fmtTokens(snapshot.windowCapacity)} for ${snapshot.modelLabel}`;
    if (sum?.session) {
      const s = sum.session, name = AGENT_LABELS[id as AgentId];
      const fill = s.contextWindow > 0 ? s.contextTokens / s.contextWindow : 0;
      const icon = fill >= 0.8 ? '$(error)' : fill >= 0.5 ? '$(warning)' : '$(check)';
      statusBar.text = s.contextWindow > 0
        ? `${icon} Tokalator ${fmtTokens(s.contextTokens)} / ${fmtTokens(s.contextWindow)} · ${name}`
        : `$(question) Tokalator ${fmtTokens(s.contextTokens)} · ${name}`;
      statusBar.tooltip = [
        `Tokalator · ${name} session`,
        `Context: ${fmtTokens(s.contextTokens)}${s.contextWindow > 0 ? ` of ${fmtTokens(s.contextWindow)} (${(fill * 100).toFixed(1)}%)` : ', window unknown'}`,
        `${s.turnCount} turns${s.model ? ` · ${s.model}` : ''}`,
        'Read from the agent\'s session log.',
        estimate,
        'Click to open the dashboard',
      ].join('\n');
    } else {
      statusBar.text = `$(file) Tokalator ~${fmtTokens(snapshot.totalEstimatedTokens)} open files`;
      statusBar.tooltip = `Tokalator · no agent session in the last 30 minutes\n${estimate}\n${snapshot.tabs.length} tabs, ${snapshot.pinnedFiles.size} pinned\nClick to open the dashboard`;
    }
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
    register('tokalator.survey', () => runSurvey(context.globalState, telemetry)),
    register('tokalator.showAgents', () => dashboardProvider.showAllAgents()),
    register('tokalator.openInEditor', () => dashboardProvider.openInEditor()),
    register('tokalator.gettingStarted', () => vscode.commands.executeCommand('workbench.action.openWalkthrough', `${context.extension.id}#gettingStarted`, false)),
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
    later(30_000, async () => {
      const last = context.workspaceState.get<number>('tokalator.dependencyCheck.at', 0);
      if (vscode.workspace.getConfiguration('tokalator').get<boolean>('dependencyCheck.auto') && Date.now() - last > 24 * 3_600_000) {
        await vscode.commands.executeCommand('tokalator.dependencyCheck', { silent: true });
      }
    });
    later(300_000, () => maybeAskUseCase(context.globalState, telemetry));
    later(900_000, () => maybeOfferSurvey(context.globalState, telemetry));
    later(15_000, () => telemetry.flush());
    const flushTimer = setInterval(() => void telemetry.flush().catch(() => undefined), 6 * 3_600_000);
    flushTimer.unref?.();
    context.subscriptions.push({ dispose: () => clearInterval(flushTimer) });
  }

  return { monitor, dashboard: dashboardProvider, chat: chatParticipant, claudeCode, agents, telemetry, priceWatch: priceWatchRef, applyCatalog: applyRemotePayload, setCompanionBadge: badge => dashboardProvider.setCompanionBadge(badge) };
  } catch (err) {
    log.appendLine('[activate] FATAL: ' + String(err));
    log.show();
    return undefined;
  }
}

export function deactivate(): void {
  monitorRef?.saveSessionSummary();
}
