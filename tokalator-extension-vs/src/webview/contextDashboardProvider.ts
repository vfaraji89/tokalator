import * as vscode from 'vscode';
import { ContextMonitor } from '../core/contextMonitor';
import { ContextSnapshot, TabInfo } from '../core/types';

/**
 * WebviewViewProvider for the Tokalator sidebar panel.
 * Shows a simplified token budget dashboard.
 */
export class ContextDashboardProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'tokalator.dashboard';

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly monitor: ContextMonitor,
  ) {
    this.monitor.onDidUpdateSnapshot(snapshot => {
      this.postSnapshot(snapshot);
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    // Keep webview alive when the sidebar is collapsed / user switches panels
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const snapshot = this.monitor.getLatestSnapshot();
        if (snapshot) {
          this.postSnapshot(snapshot);
        }
      }
    });

    // Clear reference when the webview is disposed (panel closed completely)
    webviewView.onDidDispose(() => {
      this.view = undefined;
    });

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'optimize': {
          const closed = await this.monitor.optimizeTabs();
          vscode.window.showInformationMessage(
            closed.length > 0
              ? `Closed ${closed.length} tabs: ${closed.join(', ')}`
              : 'All tabs are relevant'
          );
          this.monitor.refresh();
          break;
        }

        case 'pin': {
          this.monitor.pinFile(message.uri);
          break;
        }

        case 'unpin': {
          this.monitor.unpinFile(message.uri);
          break;
        }

        case 'closeTab': {
          const allTabs = vscode.window.tabGroups.all.flatMap(g => g.tabs);
          const targetTab = allTabs.find(t => {
            if (t.input instanceof vscode.TabInputText) {
              return t.input.uri.toString() === message.uri;
            }
            return false;
          });
          if (targetTab) {
            await vscode.window.tabGroups.close(targetTab);
          }
          this.monitor.refresh();
          break;
        }

        case 'openFile': {
          const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(message.uri));
          await vscode.window.showTextDocument(doc);
          break;
        }

        case 'refresh': {
          this.monitor.refresh();
          break;
        }

        case 'resetTurns': {
          this.monitor.resetChatTurns();
          break;
        }

        case 'setModel': {
          this.monitor.setModel(message.modelId);
          break;
        }
      }
    });

    // Post existing snapshot immediately, then force a fresh refresh
    const snapshot = this.monitor.getLatestSnapshot();
    if (snapshot) {
      this.postSnapshot(snapshot);
    }
    // Trigger a fresh snapshot in case data changed while panel was hidden
    this.monitor.refresh();
  }

  private postSnapshot(snapshot: ContextSnapshot): void {
    if (!this.view) { return; }

    const serialized = {
      ...snapshot,
      pinnedFiles: Array.from(snapshot.pinnedFiles),
      tabs: snapshot.tabs.map(t => ({
        ...t,
        uri: t.uri.toString(),
      })),
      activeFile: snapshot.activeFile
        ? { ...snapshot.activeFile, uri: snapshot.activeFile.uri.toString() }
        : null,
      models: this.monitor.getModels().map(m => ({ id: m.id, label: m.label, provider: m.provider, contextWindow: m.contextWindow })),
      tokenizerType: snapshot.tokenizerType,
      tokenizerLabel: snapshot.tokenizerLabel,
      turnHistory: snapshot.turnHistory,
      budgetBreakdown: snapshot.budgetBreakdown,
    };

    const lastSession = this.monitor.getLastSession();
    this.view.webview.postMessage({ type: 'snapshot', data: serialized, lastSession });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tokalator</title>
  <style>
    :root {
      /* GitHub Primer-aligned palette with VS Code theme fallbacks */
      --bg: var(--vscode-sideBar-background, var(--vscode-editor-background, #1e1e1e));
      --fg: var(--vscode-sideBar-foreground, var(--vscode-foreground, #cccccc));
      --border: var(--vscode-sideBarSectionHeader-border, var(--vscode-panel-border, rgba(128,128,128,0.2)));
      --low: var(--vscode-charts-green, #3fb950);
      --medium: var(--vscode-charts-yellow, #d29922);
      --high: var(--vscode-charts-red, #f85149);
      --btn-bg: var(--vscode-button-background, #0078d4);
      --btn-fg: var(--vscode-button-foreground, #ffffff);
      --btn-hover: var(--vscode-button-hoverBackground, #026ec1);
      --list-hover: var(--vscode-list-hoverBackground, rgba(128,128,128,0.1));
      --card-bg: rgba(255,255,255,0.03);
      --accent: var(--vscode-focusBorder, #58a6ff);
      --input-bg: var(--vscode-input-background, var(--vscode-sideBar-background, var(--vscode-editor-background, #1e1e1e)));
      --input-fg: var(--vscode-input-foreground, var(--vscode-sideBar-foreground, var(--vscode-foreground, #cccccc)));
      --input-border: var(--vscode-input-border, transparent);
      --badge-bg: var(--vscode-badge-background, #4d4d4d);
      --badge-fg: var(--vscode-badge-foreground, #ffffff);
      --desc-fg: var(--vscode-descriptionForeground, var(--vscode-sideBar-foreground, var(--vscode-foreground, #cccccc)));
      --chart-blue: var(--vscode-charts-blue, #58a6ff);
      --chart-purple: var(--vscode-charts-purple, #bc8cff);
      --chart-orange: var(--vscode-charts-orange, #d29922);
      --chart-grey: var(--vscode-disabledForeground, #8b949e);
      --link-fg: var(--vscode-textLink-foreground, #58a6ff);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--fg);
      background: var(--bg);
      padding: 12px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .header-icon { font-size: 20px; }
    .header-title { font-weight: 600; font-size: 14px; }

    .budget-level {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      text-align: center;
    }
    .budget-level.low { background: color-mix(in srgb, var(--low) 12%, var(--bg)); color: var(--low); border: 1px solid color-mix(in srgb, var(--low) 25%, transparent); }
    .budget-level.medium { background: color-mix(in srgb, var(--medium) 12%, var(--bg)); color: var(--medium); border: 1px solid color-mix(in srgb, var(--medium) 25%, transparent); }
    .budget-level.high { background: color-mix(in srgb, var(--high) 12%, var(--bg)); color: var(--high); border: 1px solid color-mix(in srgb, var(--high) 25%, transparent); }
    .budget-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .budget-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .budget-tokens { font-size: 12px; margin-top: 4px; }

    .stats {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .stat {
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 5px 8px;
      border-radius: 6px;
      font-size: 11px;
      color: var(--fg);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .section {
      margin-bottom: 12px;
      border-top: 1px solid var(--border);
      padding-top: 10px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--desc-fg);
      margin-bottom: 8px;
    }

    .tab-list { list-style: none; }
    .tab-item {
      display: flex;
      align-items: center;
      padding: 5px 6px;
      border-radius: 4px;
      cursor: pointer;
      gap: 8px;
      font-size: 12px;
    }
    .tab-item:hover { background: var(--list-hover); }
    .tab-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .tab-dot.high { background: var(--low); opacity: 0.9; }
    .tab-dot.med { background: var(--medium); opacity: 0.9; }
    .tab-dot.low { background: var(--high); opacity: 0.9; }
    .tab-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tab-name.active { font-weight: 600; }
    .tab-tokens { font-size: 11px; color: var(--fg); opacity: 0.8; }
    .tab-actions {
      display: flex;
      gap: 2px;
    }
    .tab-actions button {
      background: none;
      border: none;
      color: var(--fg);
      cursor: pointer;
      font-size: 12px;
      padding: 2px 5px;
      border-radius: 3px;
    }
    .tab-actions button:hover { background: var(--list-hover); }

    .action-btn {
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      margin-top: 8px;
      transition: background 0.1s;
    }
    .action-btn:hover { background: var(--btn-hover); }
    .action-btn.secondary {
      background: var(--card-bg);
      color: var(--fg);
      border: 1px solid var(--border);
    }
    .action-btn.secondary:hover {
      background: var(--list-hover);
    }

    .notes {
      font-size: 12px;
      color: var(--fg);
      margin-top: 8px;
    }
    .notes li { margin-bottom: 4px; }

    .empty { text-align: center; color: var(--desc-fg); padding: 20px; font-size: 12px; }

    .model-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      padding: 0 2px;
    }
    .model-selector label {
      font-size: 12px;
      color: var(--fg);
      white-space: nowrap;
    }
    .model-selector select {
      flex: 1;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 11px;
      cursor: pointer;
      outline: none;
    }
    .model-selector select:hover { border-color: var(--accent); }
    .model-selector select:focus { border-color: var(--accent); }

    .workspace-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 10px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 12px;
      margin-top: 8px;
      color: var(--fg);
    }
    .ws-warn { color: var(--medium); font-weight: 600; }
    .ws-ok { color: var(--low); font-weight: 500; }
    .tokenizer { color: var(--chart-blue); font-weight: 500; }

    .breakdown-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 4px 12px;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .breakdown-label { color: var(--fg); }
    .breakdown-value { text-align: right; font-variant-numeric: tabular-nums; color: var(--fg); font-weight: 500; }
    .breakdown-bar {
      grid-column: 1 / -1;
      height: 6px;
      border-radius: 3px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      margin: 4px 0 6px;
      overflow: hidden;
    }
    .breakdown-bar-fill {
      height: 100%;
      border-radius: 2px;
    }
    .breakdown-bar-fill.files { background: var(--chart-blue); }
    .breakdown-bar-fill.system { background: var(--chart-purple); }
    .breakdown-bar-fill.conversation { background: var(--chart-orange); }
    .breakdown-bar-fill.output { background: var(--chart-grey); }

    .growth-bars {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 32px;
      margin-bottom: 6px;
    }
    .growth-bar {
      flex: 1;
      min-width: 4px;
      border-radius: 2px 2px 0 0;
      background: var(--chart-blue);
      opacity: 0.6;
      position: relative;
      transition: opacity 0.15s;
    }
    .growth-bar:last-child { opacity: 1; }
    .growth-bar:hover { opacity: 1; }
    .growth-label {
      font-size: 11px;
      color: var(--fg);
      display: flex;
      justify-content: space-between;
    }
    .suggestion {
      font-size: 12px;
      color: var(--medium);
      font-weight: 500;
      margin-top: 4px;
    }

    .last-session {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .last-session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .last-session-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--desc-fg);
    }
    .last-session-time {
      font-size: 11px;
      color: var(--desc-fg);
    }
    .last-session-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .last-session-stat {
      color: var(--fg);
    }

    .preview-box {
      background: var(--card-bg);
      border: 1px solid color-mix(in srgb, var(--chart-blue) 40%, var(--border));
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .preview-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--chart-blue);
      margin-bottom: 4px;
    }
    .preview-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .preview-stat {
      color: var(--fg);
    }
    .preview-warn {
      color: var(--chart-orange);
      font-weight: 600;
      margin-top: 4px;
    }

    /* High Contrast theme overrides — VS Code sets data-vscode-theme-kind on <body> */
    body[data-vscode-theme-kind="vscode-high-contrast"],
    body[data-vscode-theme-kind="vscode-high-contrast-light"] {
      --card-bg: transparent;
      --border: var(--vscode-contrastBorder, #6fc3df);
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .budget-level,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .budget-level {
      background: transparent !important;
      border-color: var(--vscode-contrastBorder, #6fc3df) !important;
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .stat,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .stat,
    body[data-vscode-theme-kind="vscode-high-contrast"] .last-session,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .last-session,
    body[data-vscode-theme-kind="vscode-high-contrast"] .preview-box,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .preview-box,
    body[data-vscode-theme-kind="vscode-high-contrast"] .workspace-info,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .workspace-info,
    body[data-vscode-theme-kind="vscode-high-contrast"] .breakdown-bar,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .breakdown-bar,
    body[data-vscode-theme-kind="vscode-high-contrast"] .model-selector select,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .model-selector select {
      background: transparent !important;
      border-color: var(--vscode-contrastBorder, #6fc3df) !important;
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .action-btn,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .action-btn,
    body[data-vscode-theme-kind="vscode-high-contrast"] .tab-actions button,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .tab-actions button {
      border: 1px solid var(--vscode-contrastBorder, #6fc3df) !important;
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .tab-item:hover,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .tab-item:hover {
      outline: 1px solid var(--vscode-contrastBorder, #6fc3df);
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .action-btn.secondary,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .action-btn.secondary {
      border-color: var(--vscode-contrastBorder, #6fc3df) !important;
    }
  </style>
</head>
<body>
  <div id="app"><div class="empty">Loading...</div></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const app = document.getElementById('app');

    function fmtTokens(n) {
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    }

    function formatTimeAgo(iso) {
      var ms = Date.now() - new Date(iso).getTime();
      var mins = Math.floor(ms / 60000);
      if (mins < 60) return mins + 'm ago';
      var hours = Math.floor(mins / 60);
      if (hours < 24) return hours + 'h ago';
      var days = Math.floor(hours / 24);
      return days + 'd ago';
    }

    function relClass(score) {
      if (score >= 0.6) return 'high';
      if (score >= 0.3) return 'med';
      return 'low';
    }

    function render(s, lastSession) {
      const { tabs, budgetLevel, totalEstimatedTokens, windowCapacity, chatTurnCount,
              healthReasons, pinnedFiles, diagnosticsSummary, modelId, modelLabel,
              models, workspaceFileCount, workspaceFileTokens, tokenizerType, tokenizerLabel,
              turnHistory, budgetBreakdown } = s;

      const threshold = 0.3;
      const relevant = tabs.filter(t => t.relevanceScore >= threshold || t.isActive || t.isPinned);
      const distractors = tabs.filter(t => t.relevanceScore < threshold && !t.isActive && !t.isPinned);

      const modelOptions = (models || []).map(m =>
        '<option value="' + m.id + '"' + (m.id === modelId ? ' selected' : '') + '>' + m.label + ' (' + fmtTokens(m.contextWindow) + ')' + '</option>'
      ).join('');

      app.innerHTML = \`
        <div class="header">
          <span class="header-icon">🧮</span>
          <span class="header-title">Tokalator</span>
        </div>

        \${lastSession && lastSession.totalTurns > 0 ? \`
          <div class="last-session">
            <div class="last-session-header">
              <span class="last-session-title">Last Session</span>
              <span class="last-session-time">\${formatTimeAgo(lastSession.endedAt)}</span>
            </div>
            <div class="last-session-stats">
              <span class="last-session-stat">\${lastSession.modelLabel}</span>
              <span class="last-session-stat">\${lastSession.totalTurns} turns</span>
              <span class="last-session-stat">peak \${fmtTokens(lastSession.peakTokens)}</span>
              <span class="last-session-stat">\${lastSession.tabCount} tabs</span>
            </div>
          </div>
        \` : ''}

        <div class="model-selector">
          <label>Model</label>
          <select onchange="setModel(this.value)">
            \${modelOptions}
          </select>
        </div>

        <div class="budget-level \${budgetLevel}">
          <div class="budget-label">Token Budget</div>
          <div class="budget-value">\${budgetLevel.toUpperCase()}</div>
          <div class="budget-tokens">~\${fmtTokens(totalEstimatedTokens)} / \${fmtTokens(windowCapacity)}</div>
        </div>

        \${(function() {
          var perTurn = 800;
          var nextInput = totalEstimatedTokens + perTurn;
          var nextPct = Math.min((nextInput / windowCapacity) * 100, 100).toFixed(1);
          var remaining = Math.max(windowCapacity - nextInput, 0);
          var turnsLeft = Math.floor(remaining / perTurn);
          var warn = nextPct >= 90 ? 'High risk of overflow on next turn' : nextPct >= 75 ? 'Approaching context limit' : '';
          return '<div class="preview-box">' +
            '<div class="preview-title">🔮 Next Turn Preview</div>' +
            '<div class="preview-stats">' +
            '<span class="preview-stat">+~' + fmtTokens(perTurn) + '</span>' +
            '<span class="preview-stat">→ ~' + fmtTokens(nextInput) + ' (' + nextPct + '%)</span>' +
            '<span class="preview-stat">~' + turnsLeft + ' turns left</span>' +
            '</div>' +
            (warn ? '<div class="preview-warn">⚠️ ' + warn + '</div>' : '') +
            '</div>';
        })()}

        <div class="stats">
          <div class="stat">\${tabs.length} open</div>
          <div class="stat">\${pinnedFiles.length} pinned</div>
          <div class="stat">\${chatTurnCount} turns</div>
          \${workspaceFileCount > 0 ? '<div class="stat">' + workspaceFileCount + ' in project</div>' : ''}
          \${diagnosticsSummary.errors > 0 ? '<div class="stat">' + diagnosticsSummary.errors + ' errors</div>' : ''}
          \${tokenizerLabel ? '<div class="stat tokenizer">' + tokenizerLabel + '</div>' : ''}
        </div>

        \${workspaceFileCount > 0 ? \`
          <div class="workspace-info">
            <span>Project: ~\${fmtTokens(workspaceFileTokens)} tokens across \${workspaceFileCount} files</span>
            \${workspaceFileTokens > windowCapacity
              ? '<span class="ws-warn">Exceeds context window — not all files can be attached</span>'
              : '<span class="ws-ok">Fits in context window</span>'
            }
          </div>
        \` : ''}

        \${(function() {
          if (!budgetBreakdown) return '';
          var total = totalEstimatedTokens || 1;
          var filesPct = Math.round((budgetBreakdown.files / total) * 100);
          var sysPct = Math.round(((budgetBreakdown.systemPrompt + budgetBreakdown.instructions) / total) * 100);
          var convPct = Math.round((budgetBreakdown.conversation / total) * 100);
          var outPct = Math.round((budgetBreakdown.outputReservation / total) * 100);
          return '<div class="section">' +
            '<div class="section-title">Budget Breakdown</div>' +
            '<div class="breakdown-grid">' +
            '<span class="breakdown-label">Files</span>' +
            '<span class="breakdown-value">~' + fmtTokens(budgetBreakdown.files) + '</span>' +
            '<span class="breakdown-label">System</span>' +
            '<span class="breakdown-value">~' + fmtTokens(budgetBreakdown.systemPrompt) + '</span>' +
            '<span class="breakdown-label">Instructions</span>' +
            '<span class="breakdown-value">~' + fmtTokens(budgetBreakdown.instructions) + '</span>' +
            '<span class="breakdown-label">Conversation</span>' +
            '<span class="breakdown-value">~' + fmtTokens(budgetBreakdown.conversation) + '</span>' +
            '<span class="breakdown-label">Output reserve</span>' +
            '<span class="breakdown-value">~' + fmtTokens(budgetBreakdown.outputReservation) + '</span>' +
            '</div>' +
            '<div class="breakdown-bar">' +
            '<div style="display:flex;height:100%">' +
            '<div class="breakdown-bar-fill files" style="width:' + filesPct + '%"></div>' +
            '<div class="breakdown-bar-fill system" style="width:' + sysPct + '%"></div>' +
            '<div class="breakdown-bar-fill conversation" style="width:' + convPct + '%"></div>' +
            '<div class="breakdown-bar-fill output" style="width:' + outPct + '%"></div>' +
            '</div>' +
            '</div>' +
            '</div>';
        })()}

        \${turnHistory && turnHistory.length > 0 ? \`
          <div class="section">
            <div class="section-title">Context Growth (\${turnHistory.length} turns)</div>
            <div class="growth-bars">
              \${turnHistory.map(function(t) {
                var pct = Math.max(5, Math.round((t.inputTokens / windowCapacity) * 100));
                return '<div class="growth-bar" style="height:' + pct + '%" title="Turn ' + t.turn + ': ~' + fmtTokens(t.inputTokens) + '"></div>';
              }).join('')}
            </div>
            <div class="growth-label">
              <span>T1: ~\${fmtTokens(turnHistory[0].inputTokens)}</span>
              <span>T\${turnHistory[turnHistory.length-1].turn}: ~\${fmtTokens(turnHistory[turnHistory.length-1].inputTokens)}</span>
            </div>
            \${turnHistory.length >= 2 ? '<div class="suggestion">+' + fmtTokens(Math.round((turnHistory[turnHistory.length-1].inputTokens - turnHistory[0].inputTokens) / (turnHistory.length-1))) + '/turn avg growth</div>' : ''}
          </div>
        \` : ''}

        <div class="section">
          <div class="section-title">Files (\${relevant.length})</div>
          <ul class="tab-list">
            \${relevant.length === 0 ? '<li class="empty">No files open</li>' :
              relevant.map(t => renderTab(t)).join('')}
          </ul>
        </div>

        \${distractors.length > 0 ? \`
          <div class="section">
            <div class="section-title">Low Relevance (\${distractors.length})</div>
            <ul class="tab-list">
              \${distractors.map(t => renderTab(t)).join('')}
            </ul>
            <button class="action-btn" onclick="optimize()">
              Close \${distractors.length} Low-Relevance Tabs
            </button>
          </div>
        \` : ''}

        <ul class="notes">
          \${healthReasons.map(r => '<li>' + r + '</li>').join('')}
        </ul>

        \${chatTurnCount > 0 ? '<button class="action-btn secondary" onclick="resetTurns()">Reset Turn Counter</button>' : ''}
      \`;
    }

    function renderTab(t) {
      var safeUri = encodeURIComponent(t.uri);
      var q = "&apos;";
      var pinBtn = t.isPinned
        ? '<button title="Unpin" onclick="event.stopPropagation(); unpin(' + q + safeUri + q + ')">\u{1F4CC}</button>'
        : '<button title="Pin" onclick="event.stopPropagation(); pin(' + q + safeUri + q + ')">\u{1F4CD}</button>';
      var closeBtn = !t.isActive
        ? '<button title="Close" onclick="event.stopPropagation(); closeTab(' + q + safeUri + q + ')">✕</button>'
        : '';

      return '<li class="tab-item" ondblclick="openFile(' + q + safeUri + q + ')">' +
        '<div class="tab-dot ' + relClass(t.relevanceScore) + '"></div>' +
        '<span class="tab-name ' + (t.isActive ? 'active' : '') + '">' + t.label + (t.isDirty ? ' •' : '') + '</span>' +
        '<span class="tab-tokens">~' + fmtTokens(t.estimatedTokens) + '</span>' +
        '<div class="tab-actions">' + pinBtn + closeBtn + '</div>' +
        '</li>';
    }

    function optimize() { vscode.postMessage({ command: 'optimize' }); }
    function pin(uri) { vscode.postMessage({ command: 'pin', uri: decodeURIComponent(uri) }); }
    function unpin(uri) { vscode.postMessage({ command: 'unpin', uri: decodeURIComponent(uri) }); }
    function closeTab(uri) { vscode.postMessage({ command: 'closeTab', uri: decodeURIComponent(uri) }); }
    function openFile(uri) { vscode.postMessage({ command: 'openFile', uri: decodeURIComponent(uri) }); }
    function resetTurns() { vscode.postMessage({ command: 'resetTurns' }); }
    function setModel(modelId) { vscode.postMessage({ command: 'setModel', modelId }); }

    let lastSessionData = null;
    window.addEventListener('message', e => {
      if (e.data.type === 'snapshot') {
        if (e.data.lastSession) lastSessionData = e.data.lastSession;
        render(e.data.data, lastSessionData);
      }
    });
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
