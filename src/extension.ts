import * as vscode from 'vscode';
import { ContextMonitor } from './core/contextMonitor';
import { ContextDashboardProvider } from './webview/contextDashboardProvider';
import { ContextChatParticipant } from './chat/contextChatParticipant';

// Module-level reference so deactivate() can save session
let monitorRef: ContextMonitor | undefined;

/** Current extension version from package.json */
const EXTENSION_VERSION = '0.4.0';

/** Key for storing last-seen version in globalState */
const VERSION_STATE_KEY = 'tokalator.lastSeenVersion';

/** Release highlights keyed by version — shown in the "What's New" notification */
const RELEASE_HIGHLIGHTS: Record<string, string[]> = {
  '0.4.0': [
    '🔐 Secret Guardrail — detects API keys & credentials before they leak into AI context',
    '💰 Cost Estimation — per-turn dollar costs, caching savings, monthly projections',
    '📊 Prompt Caching Analysis — Anthropic 90%, OpenAI 50%, Google 75% discount rates',
    '🎨 Improved theme compatibility for all VS Code themes',
  ],
};

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
 *  5. Auto-update notification for new features
 */

/** Show a "What's New" notification when the extension updates to a new version */
async function showWhatsNew(context: vscode.ExtensionContext): Promise<void> {
  const lastSeen = context.globalState.get<string>(VERSION_STATE_KEY);

  if (lastSeen === EXTENSION_VERSION) {
    return; // Already seen this version
  }

  // Always persist the current version (first install or upgrade)
  await context.globalState.update(VERSION_STATE_KEY, EXTENSION_VERSION);

  if (!lastSeen) {
    return; // First install — don't show "what's new" on fresh installs
  }

  // Extension was updated — show highlights
  const highlights = RELEASE_HIGHLIGHTS[EXTENSION_VERSION];
  if (!highlights || highlights.length === 0) {
    return;
  }

  const summary = highlights[0]; // Lead with the top highlight
  const response = await vscode.window.showInformationMessage(
    `Tokalator updated to v${EXTENSION_VERSION}: ${summary}`,
    'What\'s New',
    'Changelog',
    'Dismiss',
  );

  if (response === 'What\'s New') {
    // Show all highlights in a detailed notification
    const detail = highlights.map(h => `  • ${h}`).join('\n');
    vscode.window.showInformationMessage(
      `Tokalator v${EXTENSION_VERSION}\n\n${detail}`,
      { modal: true },
    );
  } else if (response === 'Changelog') {
    vscode.env.openExternal(
      vscode.Uri.parse('https://marketplace.visualstudio.com/items/vfaraji89.tokalator/changelog'),
    );
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {

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

  // Show "What's New" notification on version upgrade
  showWhatsNew(context);

  console.log('Tokalator is now active');

  // Force an initial refresh now that all listeners (status bar, dashboard) are registered
  await monitor.refresh();
}

export function deactivate(): void {
  monitorRef?.saveSessionSummary();
}
