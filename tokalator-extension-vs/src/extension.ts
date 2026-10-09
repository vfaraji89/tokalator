import * as vscode from 'vscode';
import { ContextMonitor } from './core/contextMonitor';
import { ContextDashboardProvider } from './webview/contextDashboardProvider';
import { ContextChatParticipant } from './chat/contextChatParticipant';
import { loadPricingCatalog, refreshPricingCatalog } from './core/pricingCatalog';
import { WorkspaceSecurityScanner } from './core/workspaceSecurityScanner';
import { PriceWatchService } from './core/priceWatch';

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

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {

  void loadPricingCatalog(context);

  const monitor = new ContextMonitor(context.workspaceState);
  monitorRef = monitor;
  context.subscriptions.push(monitor);

  const dashboardProvider = new ContextDashboardProvider(context.extensionUri, monitor);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ContextDashboardProvider.viewType,
      dashboardProvider,
    ),
  );

  const chatParticipant = new ContextChatParticipant(monitor);
  context.subscriptions.push(chatParticipant);

  const analytics = monitor.getUsageAnalytics();
  if (analytics) {
    const priceWatch = new PriceWatchService(context.globalState, analytics);
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
    vscode.commands.registerCommand('tokalator.refresh', () => {
      monitor.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tokalator.optimize', async () => {
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
    vscode.commands.registerCommand('tokalator.clearPins', () => {
      monitor.clearPins();
      vscode.window.showInformationMessage('All pinned files cleared');
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tokalator.refreshPricing', async () => {
      await refreshPricingCatalog(context);
      vscode.window.showInformationMessage('Tokalator pricing catalog refreshed');
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tokalator.secure', async () => {
      const scanner = new WorkspaceSecurityScanner();
      const audit = await scanner.audit();
      if (audit.level === 'protected') {
        vscode.window.showInformationMessage('Tokalator: Workspace is fully protected (score: 100/100)');
        return;
      }
      const choice = await vscode.window.showWarningMessage(
        `Tokalator: Security score ${audit.score}/100. ${audit.missingConfigs.length} config(s) missing.`,
        'Apply All',
        'Preview in Chat',
      );
      if (choice === 'Apply All') {
        try {
          const applied = await scanner.applyAll();
          vscode.window.showInformationMessage(`Tokalator: Generated ${applied.length} security config(s)`);
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
      if (audit.level === 'unprotected' && audit.missingConfigs.length > 0) {
        const choice = await vscode.window.showWarningMessage(
          `Tokalator: AI agents can read your secret files. ${audit.missingConfigs.length} security config(s) missing.`,
          'Secure Workspace',
          'Dismiss',
        );
        if (choice === 'Secure Workspace') {
          vscode.commands.executeCommand('tokalator.secure');
        }
      }
    })().catch(err => log.appendLine('[security-scan] failed: ' + String(err)));
  }, 5000);

  } catch (err) {
    log.appendLine('[activate] FATAL: ' + String(err));
    log.show();
  }
}

export function deactivate(): void {
  monitorRef?.saveSessionSummary();
}
