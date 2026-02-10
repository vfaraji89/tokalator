import * as vscode from 'vscode';
import { ContextMonitor } from './core/contextMonitor';
import { ContextDashboardProvider } from './webview/contextDashboardProvider';
import { ContextChatParticipant } from './chat/contextChatParticipant';

// Module-level reference so deactivate() can save session
let monitorRef: ContextMonitor | undefined;

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

/**
 * Tokalator - Count your tokens like beads on an abacus.
 *
 * Activates:
 *  1. ContextMonitor — core engine tracking editor state
 *  2. ContextDashboardProvider — sidebar webview panel
 *  3. ContextChatParticipant — @tokalator chat commands
 *  4. Commands — refresh, optimize, clearPins
 */
export function activate(context: vscode.ExtensionContext): void {

  // 1. Core monitor (with persistence for pinned files)
  const monitor = new ContextMonitor(context.workspaceState);
  monitorRef = monitor;
  context.subscriptions.push(monitor);

  // 2. Sidebar dashboard
  const dashboardProvider = new ContextDashboardProvider(context.extensionUri, monitor);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ContextDashboardProvider.viewType,
      dashboardProvider,
    ),
  );

  // 3. Chat participant
  const chatParticipant = new ContextChatParticipant(monitor);
  context.subscriptions.push(chatParticipant);

  // 4. Commands
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

  // Status bar item — live token count preview
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBar.command = 'tokalator.refresh';
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

  // Show last session summary on activation
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

  console.log('Tokalator is now active');
}

export function deactivate(): void {
  monitorRef?.saveSessionSummary();
}
