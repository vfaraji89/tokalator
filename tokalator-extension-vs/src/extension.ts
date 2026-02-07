import * as vscode from 'vscode';
import { ContextMonitor } from './core/contextMonitor';
import { ContextDashboardProvider } from './webview/contextDashboardProvider';
import { ContextChatParticipant } from './chat/contextChatParticipant';

/**
 * Tokalator - Count your tokens like beads on an abacus.
 *
 * Activates:
 *  1. ContextMonitor — core engine tracking editor state
 *  2. ContextDashboardProvider — sidebar webview panel
 *  3. ContextChatParticipant — @tokens chat commands
 *  4. Commands — refresh, optimize, clearPins
 */
export function activate(context: vscode.ExtensionContext): void {

  // 1. Core monitor (with persistence for pinned files)
  const monitor = new ContextMonitor(context.workspaceState);
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

  // Status bar item showing quick budget level
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBar.command = 'tokalator.refresh';
  statusBar.tooltip = 'Tokalator — Click to refresh token count';
  context.subscriptions.push(statusBar);

  monitor.onDidUpdateSnapshot(snapshot => {
    const level = snapshot.budgetLevel;
    const icon = level === 'low' ? '$(check)'
      : level === 'medium' ? '$(warning)'
      : '$(error)';
    statusBar.text = `${icon} ${snapshot.tabs.length} tabs · ${level}`;
    statusBar.show();
  });

  console.log('Tokalator is now active');
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
