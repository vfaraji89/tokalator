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

    const snapshot = this.monitor.getLatestSnapshot();
    if (snapshot) {
      this.postSnapshot(snapshot);
    }
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

    this.view.webview.postMessage({ type: 'snapshot', data: serialized });
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
      --bg: var(--vscode-sideBar-background);
      --fg: var(--vscode-sideBar-foreground);
      --border: var(--vscode-sideBarSectionHeader-border);
      --low: #4ec9b0;
      --medium: #dcdcaa;
      --high: #f44747;
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --btn-hover: var(--vscode-button-hoverBackground);
      --list-hover: var(--vscode-list-hoverBackground);
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
    .budget-level.low { background: rgba(78,201,176,0.15); color: var(--low); }
    .budget-level.medium { background: rgba(220,220,170,0.15); color: var(--medium); }
    .budget-level.high { background: rgba(244,71,71,0.15); color: var(--high); }
    .budget-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
    .budget-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .budget-tokens { font-size: 11px; opacity: 0.7; margin-top: 4px; }

    .stats {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .stat {
      background: rgba(255,255,255,0.05);
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 11px;
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
      opacity: 0.6;
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
    .tab-dot.high { background: var(--low); }
    .tab-dot.med { background: var(--medium); }
    .tab-dot.low { background: var(--high); }
    .tab-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tab-name.active { font-weight: 600; }
    .tab-tokens { font-size: 10px; opacity: 0.5; }
    .tab-actions {
      display: flex;
      gap: 2px;
    }
    .tab-actions button {
      background: none;
      border: none;
      color: var(--fg);
      cursor: pointer;
      font-size: 11px;
      padding: 2px 4px;
      border-radius: 3px;
      opacity: 0.7;
    }
    .tab-actions button:hover { opacity: 1; background: rgba(255,255,255,0.1); }

    .action-btn {
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      width: 100%;
      margin-top: 8px;
    }
    .action-btn:hover { background: var(--btn-hover); }
    .action-btn.secondary {
      background: rgba(255,255,255,0.08);
      color: var(--fg);
    }

    .notes {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 8px;
    }
    .notes li { margin-bottom: 2px; }

    .empty { text-align: center; opacity: 0.4; padding: 20px; font-size: 12px; }

    .model-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      padding: 0 2px;
    }
    .model-selector label {
      font-size: 11px;
      opacity: 0.6;
      white-space: nowrap;
    }
    .model-selector select {
      flex: 1;
      background: var(--card-bg);
      color: var(--fg);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 11px;
      cursor: pointer;
      outline: none;
    }
    .model-selector select:hover { border-color: rgba(255,255,255,0.25); }
    .model-selector select:focus { border-color: var(--accent); }

    .workspace-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 6px 8px;
      background: var(--card-bg);
      border-radius: 6px;
      font-size: 11px;
      margin-top: 6px;
    }
    .ws-warn { color: #f59e0b; }
    .ws-ok { color: #22c55e; opacity: 0.8; }
    .tokenizer { color: #60a5fa; font-style: italic; }

    .breakdown-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2px 8px;
      font-size: 11px;
      margin-bottom: 8px;
    }
    .breakdown-label { opacity: 0.7; }
    .breakdown-value { text-align: right; font-variant-numeric: tabular-nums; }
    .breakdown-bar {
      grid-column: 1 / -1;
      height: 4px;
      border-radius: 2px;
      background: rgba(255,255,255,0.08);
      margin: 2px 0 4px;
      overflow: hidden;
    }
    .breakdown-bar-fill {
      height: 100%;
      border-radius: 2px;
    }
    .breakdown-bar-fill.files { background: #60a5fa; }
    .breakdown-bar-fill.system { background: #a78bfa; }
    .breakdown-bar-fill.conversation { background: #f59e0b; }
    .breakdown-bar-fill.output { background: #6b7280; }

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
      background: #60a5fa;
      opacity: 0.7;
      position: relative;
    }
    .growth-bar:last-child { opacity: 1; }
    .growth-bar:hover { opacity: 1; }
    .growth-label {
      font-size: 10px;
      opacity: 0.5;
      display: flex;
      justify-content: space-between;
    }
    .suggestion {
      font-size: 11px;
      color: #f59e0b;
      margin-top: 4px;
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

    function relClass(score) {
      if (score >= 0.6) return 'high';
      if (score >= 0.3) return 'med';
      return 'low';
    }

    function render(s) {
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

        \${budgetBreakdown ? \`
          <div class="section">
            <div class="section-title">Budget Breakdown</div>
            <div class="breakdown-grid">
              <span class="breakdown-label">Files</span>
              <span class="breakdown-value">~\${fmtTokens(budgetBreakdown.files)}</span>
              <span class="breakdown-label">System</span>
              <span class="breakdown-value">~\${fmtTokens(budgetBreakdown.systemPrompt)}</span>
              <span class="breakdown-label">Instructions</span>
              <span class="breakdown-value">~\${fmtTokens(budgetBreakdown.instructions)}</span>
              <span class="breakdown-label">Conversation</span>
              <span class="breakdown-value">~\${fmtTokens(budgetBreakdown.conversation)}</span>
              <span class="breakdown-label">Output reserve</span>
              <span class="breakdown-value">~\${fmtTokens(budgetBreakdown.outputReservation)}</span>
            </div>
            <div class="breakdown-bar">
              <div style="display:flex;height:100%">
                <div class="breakdown-bar-fill files" style="width:\${Math.round((budgetBreakdown.files/totalEstimatedTokens)*100)}%"></div>
                <div class="breakdown-bar-fill system" style="width:\${Math.round(((budgetBreakdown.systemPrompt+budgetBreakdown.instructions)/totalEstimatedTokens)*100)}%"></div>
                <div class="breakdown-bar-fill conversation" style="width:\${Math.round((budgetBreakdown.conversation/totalEstimatedTokens)*100)}%"></div>
                <div class="breakdown-bar-fill output" style="width:\${Math.round((budgetBreakdown.outputReservation/totalEstimatedTokens)*100)}%"></div>
              </div>
            </div>
          </div>
        \` : ''}

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
      const safeUri = encodeURIComponent(t.uri);
      const pinBtn = t.isPinned
        ? '<button title="Unpin" onclick="event.stopPropagation(); unpin(\\'' + safeUri + '\\')">\u{1F4CC}</button>'
        : '<button title="Pin" onclick="event.stopPropagation(); pin(\\'' + safeUri + '\\')">\u{1F4CD}</button>';

      return \`
        <li class="tab-item" ondblclick="openFile('\${safeUri}')">
          <div class="tab-dot \${relClass(t.relevanceScore)}"></div>
          <span class="tab-name \${t.isActive ? 'active' : ''}">\${t.label}\${t.isDirty ? ' •' : ''}</span>
          <span class="tab-tokens">~\${fmtTokens(t.estimatedTokens)}</span>
          <div class="tab-actions">
            \${pinBtn}
            \${!t.isActive ? '<button title="Close" onclick="event.stopPropagation(); closeTab(\\'' + safeUri + '\\')">✕</button>' : ''}
          </div>
        </li>
      \`;
    }

    function optimize() { vscode.postMessage({ command: 'optimize' }); }
    function pin(uri) { vscode.postMessage({ command: 'pin', uri: decodeURIComponent(uri) }); }
    function unpin(uri) { vscode.postMessage({ command: 'unpin', uri: decodeURIComponent(uri) }); }
    function closeTab(uri) { vscode.postMessage({ command: 'closeTab', uri: decodeURIComponent(uri) }); }
    function openFile(uri) { vscode.postMessage({ command: 'openFile', uri: decodeURIComponent(uri) }); }
    function resetTurns() { vscode.postMessage({ command: 'resetTurns' }); }
    function setModel(modelId) { vscode.postMessage({ command: 'setModel', modelId }); }

    window.addEventListener('message', e => {
      if (e.data.type === 'snapshot') render(e.data.data);
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
