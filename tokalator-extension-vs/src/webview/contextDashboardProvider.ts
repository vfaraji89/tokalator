import * as vscode from 'vscode';
import { ContextMonitor } from '../core/contextMonitor';
import type { ContextSnapshot } from '../core/types';
import { compareAcrossModels, defaultOutputFor } from '../core/pricing';
import { getCatalogMeta, onDidChangeCatalog, getActiveCatalog } from '../core/catalogStore';

export class ContextDashboardProvider implements vscode.WebviewViewProvider, vscode.Disposable {

  public static readonly viewType = 'tokalator.dashboard';

  private view?: vscode.WebviewView;
  private readonly _snapshotListener: vscode.Disposable;
  private readonly _catalogListener: vscode.Disposable;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly monitor: ContextMonitor,
  ) {
    this._snapshotListener = this.monitor.onDidUpdateSnapshot(snapshot => {
      this.postSnapshot(snapshot);
    });
    this._catalogListener = onDidChangeCatalog(() => {
      const snapshot = this.monitor.getLatestSnapshot();
      if (snapshot) { this.postSnapshot(snapshot); }
    });
  }

  dispose(): void {
    this._snapshotListener.dispose();
    this._catalogListener.dispose();
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

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const snapshot = this.monitor.getLatestSnapshot();
        if (snapshot) {
          this.postSnapshot(snapshot);
        }
      }
    });

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

        case 'refreshPricing': {
          await vscode.commands.executeCommand('tokalator.refreshPricing');
          break;
        }

        case 'terminologyGen': {
          await vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /terminology-gen' });
          break;
        }

        case 'proFeature': {
          const action = await vscode.window.showInformationMessage(
            `${message.feature} is a Tokalator Pro feature. Upgrade for secure workspaces, SKILL.md generation, AI settings, and more.`,
            'Learn More'
          );
          if (action === 'Learn More') {
            vscode.env.openExternal(vscode.Uri.parse('https://tokalator.ai'));
          }
          break;
        }
      }
    });

    const snapshot = this.monitor.getLatestSnapshot();
    if (snapshot) {
      this.postSnapshot(snapshot);
    }
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
      models: this.monitor.getModels().map(m => ({ id: m.id, label: m.label, provider: m.provider, contextWindow: m.contextWindow, rotThreshold: m.rotThreshold, inputCostPerMTok: m.inputCostPerMTok, outputCostPerMTok: m.outputCostPerMTok })),
      tokenizerType: snapshot.tokenizerType,
      tokenizerLabel: snapshot.tokenizerLabel,
      turnHistory: snapshot.turnHistory,
      budgetBreakdown: snapshot.budgetBreakdown,
      costEstimate: snapshot.costEstimate,
    };

    const catalog = getActiveCatalog();
    const inputTokens = snapshot.totalEstimatedTokens;
    const priceCompare = compareAcrossModels(catalog, inputTokens, p => defaultOutputFor(p));
    const catalogMeta = getCatalogMeta();

    const lastSession = this.monitor.getLastSession();
    this.view.webview.postMessage({ type: 'snapshot', data: { ...serialized, priceCompare, catalogMeta }, lastSession });
  }

  private getHtml(_webview: vscode.Webview): string {
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
      --input-bg: var(--vscode-input-background, var(--vscode-sideBar-background, #1e1e1e));
      --input-fg: var(--vscode-input-foreground, var(--vscode-foreground, #cccccc));
      --input-border: var(--vscode-input-border, transparent);
      --badge-bg: var(--vscode-badge-background, #4d4d4d);
      --badge-fg: var(--vscode-badge-foreground, #ffffff);
      --desc-fg: var(--vscode-descriptionForeground, var(--vscode-foreground, #cccccc));
      --link-fg: var(--vscode-textLink-foreground, #58a6ff);
      --free-green: var(--vscode-charts-green, #3fb950);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--fg); background: var(--bg); padding: 10px; }

    .hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .hdr-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .hdr-icon svg { width: 100%; height: 100%; }
    .hdr-title { font-weight: 700; font-size: 13px; }
    .hdr-badge { background: var(--free-green); color: #fff; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 8px; letter-spacing: 1px; }
    @keyframes beadSlide1 {
      0%, 22% { transform: translateX(0); }
      30%, 48% { transform: translateX(2px); }
      56%, 100% { transform: translateX(0); }
    }
    @keyframes beadSlide2 {
      0%, 38% { transform: translateX(0); }
      46%, 64% { transform: translateX(-1.5px); }
      72%, 100% { transform: translateX(0); }
    }
    @keyframes beadSlide3 {
      0%, 54% { transform: translateX(0); }
      62%, 80% { transform: translateX(2.5px); }
      88%, 100% { transform: translateX(0); }
    }
    .hdr-icon .bead-row { animation: 4s ease-in-out infinite; }
    .hdr-icon .bead-row-1 { animation-name: beadSlide1; }
    .hdr-icon .bead-row-2 { animation-name: beadSlide2; }
    .hdr-icon .bead-row-3 { animation-name: beadSlide3; }

    .model-active { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 4px 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; font-size: 11px; }
    .model-active-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--desc-fg); }
    .model-active-name { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .model-active-sync { font-size: 9px; color: var(--free-green); font-weight: 600; }

    .ce-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .ce-stat { display: flex; flex-direction: column; gap: 1px; }
    .ce-val { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .ce-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--desc-fg); }

    .meter { padding: 8px; border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .meter.low { background: color-mix(in srgb, var(--low) 12%, var(--bg)); color: var(--low); border: 1px solid color-mix(in srgb, var(--low) 25%, transparent); }
    .meter.medium { background: color-mix(in srgb, var(--medium) 12%, var(--bg)); color: var(--medium); border: 1px solid color-mix(in srgb, var(--medium) 25%, transparent); }
    .meter.high { background: color-mix(in srgb, var(--high) 12%, var(--bg)); color: var(--high); border: 1px solid color-mix(in srgb, var(--high) 25%, transparent); }
    .meter-level { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .meter-tokens { font-size: 12px; }

    .pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .pill { background: var(--card-bg); border: 1px solid var(--border); padding: 3px 7px; border-radius: 6px; font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; }

    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; font-size: 12px; }
    .card-title { font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--desc-fg); margin-bottom: 4px; }

    .cost-total { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .cost-grid { display: grid; grid-template-columns: 1fr auto auto; gap: 2px 8px; font-size: 11px; }
    .cost-label { color: var(--desc-fg); }
    .cost-val { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
    .cost-tok { text-align: right; font-variant-numeric: tabular-nums; color: var(--fg); }
    .cost-sep { grid-column: 1 / -1; border-top: 1px solid var(--border); margin: 2px 0; }
    .cost-rate { font-size: 10px; color: var(--desc-fg); margin-top: 3px; }

    .bar-wrap { height: 6px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 3px; overflow: hidden; margin: 4px 0 6px; }
    .bar-fill { height: 100%; border-radius: 2px; }

    .sec { margin-bottom: 8px; border-top: 1px solid var(--border); padding-top: 8px; }
    .sec-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--desc-fg); margin-bottom: 6px; }

    .feat-panel { border: 1px solid color-mix(in srgb, var(--free-green) 40%, var(--border)); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .feat-hdr { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
    .feat-hdr-label { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .feat-btn { display: flex; align-items: center; gap: 6px; padding: 5px 7px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); cursor: pointer; margin-bottom: 4px; transition: border-color 0.15s; }
    .feat-btn:last-child { margin-bottom: 0; }
    .feat-btn:hover { border-color: var(--free-green); }
    .feat-btn.locked { opacity: 0.6; }
    .feat-btn.locked:hover { border-color: var(--medium); opacity: 0.8; }
    .feat-btn-icon { font-size: 13px; flex-shrink: 0; }
    .feat-btn-info { flex: 1; min-width: 0; }
    .feat-btn-name { font-size: 11px; font-weight: 600; color: var(--fg); display: flex; align-items: center; gap: 4px; }
    .feat-btn-desc { font-size: 9px; color: var(--desc-fg); }
    .feat-btn-arrow { font-size: 11px; color: var(--desc-fg); }
    .tag-new { background: var(--free-green); color: #fff; font-size: 8px; font-weight: 800; padding: 0px 4px; border-radius: 6px; letter-spacing: 0.5px; }
    .tag-pro { background: var(--badge-bg); color: var(--badge-fg); font-size: 8px; font-weight: 700; padding: 0px 4px; border-radius: 6px; letter-spacing: 0.5px; }

    .tab-list { list-style: none; }
    .tab-item { display: flex; align-items: center; padding: 3px 4px; border-radius: 4px; cursor: pointer; gap: 6px; font-size: 11px; }
    .tab-item:hover { background: var(--list-hover); }
    .tab-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .tab-dot.hi { background: var(--low); } .tab-dot.md { background: var(--medium); } .tab-dot.lo { background: var(--high); }
    .tab-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tab-name.active { font-weight: 600; }
    .tab-tok { font-size: 10px; opacity: 0.8; }
    .tab-btns { display: flex; gap: 1px; }
    .tab-btns button { background: none; border: none; color: var(--fg); cursor: pointer; font-size: 11px; padding: 1px 4px; border-radius: 3px; }
    .tab-btns button:hover { background: var(--list-hover); }

    .act-btn { background: var(--btn-bg); color: var(--btn-fg); border: none; padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: 500; cursor: pointer; width: 100%; margin-top: 6px; }
    .act-btn:hover { background: var(--btn-hover); }
    .act-btn.sec-btn { background: var(--card-bg); color: var(--fg); border: 1px solid var(--border); }
    .act-btn.sec-btn:hover { background: var(--list-hover); }

    .empty { text-align: center; color: var(--desc-fg); padding: 20px; font-size: 12px; }
    .err { color: var(--high); text-align: center; padding: 12px; font-size: 11px; }

    .compare-tbl { width: 100%; border-collapse: collapse; }
    .compare-tbl th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--desc-fg); font-weight: 500; text-align: left; padding: 2px 3px; border-bottom: 1px solid var(--border); }
    .compare-tbl th:not(:first-child) { text-align: right; }
    .compare-tbl td { padding: 2px 3px; font-size: 10px; font-variant-numeric: tabular-nums; }
    .compare-tbl td:not(:first-child) { text-align: right; }
    .compare-tbl .act td { font-weight: 600; }
    .compare-tbl .cheap td:last-child { color: var(--low); }
    .cmp-toggle { display:flex; align-items:center; justify-content:space-between; cursor:pointer; user-select:none; }
    .cmp-toggle:hover .cmp-plus { color: var(--accent); }
    .cmp-plus { font-size:14px; font-weight:700; width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:3px; color:var(--desc-fg); transition:color 0.15s,transform 0.3s; }
    .cmp-body { max-height:0; overflow:hidden; transition:max-height 0.4s ease; }
    .cmp-body.open { max-height:500px; }

    .workspace-info { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; margin-bottom: 8px; }
    .ws-warn { color: var(--medium); font-weight: 600; }
    .ws-ok { color: var(--low); font-weight: 500; }

    /* High Contrast theme overrides */
    body[data-vscode-theme-kind="vscode-high-contrast"],
    body[data-vscode-theme-kind="vscode-high-contrast-light"] {
      --card-bg: transparent;
      --border: var(--vscode-contrastBorder, #6fc3df);
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .meter,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .meter {
      background: transparent !important;
      border-color: var(--vscode-contrastBorder, #6fc3df) !important;
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .pill,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .pill,
    body[data-vscode-theme-kind="vscode-high-contrast"] .card,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .card,
    body[data-vscode-theme-kind="vscode-high-contrast"] .workspace-info,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .workspace-info,
    body[data-vscode-theme-kind="vscode-high-contrast"] .bar-wrap,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .bar-wrap,
    body[data-vscode-theme-kind="vscode-high-contrast"] .model-active,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .model-active,
    body[data-vscode-theme-kind="vscode-high-contrast"] .feat-panel,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .feat-panel,
    body[data-vscode-theme-kind="vscode-high-contrast"] .feat-btn,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .feat-btn {
      background: transparent !important;
      border-color: var(--vscode-contrastBorder, #6fc3df) !important;
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .act-btn,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .act-btn,
    body[data-vscode-theme-kind="vscode-high-contrast"] .tab-btns button,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .tab-btns button {
      border: 1px solid var(--vscode-contrastBorder, #6fc3df) !important;
    }
    body[data-vscode-theme-kind="vscode-high-contrast"] .tab-item:hover,
    body[data-vscode-theme-kind="vscode-high-contrast-light"] .tab-item:hover {
      outline: 1px solid var(--vscode-contrastBorder, #6fc3df);
    }
  </style>
</head>
<body>
  <div id="app"><div class="empty">Loading...</div></div>
  <script nonce="${nonce}">
    var vscode = acquireVsCodeApi();
    var app = document.getElementById('app');
    function fmt(n) { if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return ''+n; }
    function fmtC(n) { if (n < 0.001) return '<$0.001'; if (n < 0.01) return '$'+n.toFixed(4); if (n < 1) return '$'+n.toFixed(3); return '$'+n.toFixed(2); }
    function ago(iso) { var m=Math.floor((Date.now()-new Date(iso).getTime())/60000); if(m<60) return m+'m ago'; var h=Math.floor(m/60); if(h<24) return h+'h ago'; return Math.floor(h/24)+'d ago'; }
    function rc(s) { return s >= 0.6 ? 'hi' : s >= 0.3 ? 'md' : 'lo'; }

    function render(s, ls) {
      try {
        var t = s.tabs || [], bl = s.budgetLevel || 'low', tot = s.totalEstimatedTokens || 0, cap = s.windowCapacity || 200000;
        var turns = s.chatTurnCount || 0, pins = (s.pinnedFiles || []).length, reasons = s.healthReasons || [];
        var mid = s.modelId || '', models = s.models || [], ce = s.costEstimate;
        var bd = s.budgetBreakdown, diag = s.diagnosticsSummary || {errors:0};
        var tl = s.tokenizerLabel || '', wfc = s.workspaceFileCount || 0, wft = s.workspaceFileTokens || 0;
        var th = 0.3, rel = t.filter(function(x){return x.relevanceScore>=th||x.isActive||x.isPinned;});
        var dist = t.filter(function(x){return x.relevanceScore<th&&!x.isActive&&!x.isPinned;});

        // Header with animated calc icon and FREE badge
        var html = '<div class="hdr"><span class="hdr-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="var(--fg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
          '<line x1="4.5" y1="8" x2="19.5" y2="8" stroke-width="1" opacity="0.4"/>' +
          '<line x1="4.5" y1="12" x2="19.5" y2="12" stroke-width="1" opacity="0.4"/>' +
          '<line x1="4.5" y1="16" x2="19.5" y2="16" stroke-width="1" opacity="0.4"/>' +
          '<g class="bead-row bead-row-1" fill="#e3120b" stroke="none">' +
          '<circle cx="8" cy="8" r="1.7"/><circle cx="12" cy="8" r="1.7"/><circle cx="16" cy="8" r="1.7" fill="var(--fg)" opacity="0.3"/>' +
          '</g>' +
          '<g class="bead-row bead-row-2" fill="#e3120b" stroke="none">' +
          '<circle cx="8" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7" fill="var(--fg)" opacity="0.3"/><circle cx="16" cy="12" r="1.7" fill="var(--fg)" opacity="0.3"/>' +
          '</g>' +
          '<g class="bead-row bead-row-3" fill="#e3120b" stroke="none">' +
          '<circle cx="8" cy="16" r="1.7" fill="var(--fg)" opacity="0.3"/><circle cx="12" cy="16" r="1.7"/><circle cx="16" cy="16" r="1.7"/>' +
          '</g>' +
          '</svg></span><span class="hdr-title">Tokalator</span><span class="hdr-badge">FREE</span></div>';

        // Last session
        if (ls && ls.totalTurns > 0) {
          html += '<div class="card"><div class="card-title">Last Session <span style="float:right;font-weight:400">'+ago(ls.endedAt)+'</span></div>';
          html += '<span>'+ls.modelLabel+'</span> &middot; <span>'+ls.totalTurns+' turns</span> &middot; <span>peak '+fmt(ls.peakTokens)+'</span></div>';
        }

        // Active model (auto-detected from Copilot chat — read-only)
        var mLabel = mid, rot = 0;
        for (var mi = 0; mi < models.length; mi++) { if (models[mi].id === mid) { mLabel = models[mi].label; rot = models[mi].rotThreshold || 0; break; } }
        html += '<div class="model-active" title="Auto-detected from your active Copilot chat model"><span class="model-active-label">Model</span><span class="model-active-name">'+(mLabel||'—')+'</span><span class="model-active-sync">&#x21BB; auto</span></div>';

        // Budget meter with context %
        var pct = cap > 0 ? Math.round((tot/cap)*100) : 0;
        html += '<div class="meter '+bl+'"><span class="meter-level">'+bl.toUpperCase()+'</span><span class="meter-tokens">~'+fmt(tot)+' / '+fmt(cap)+' ('+pct+'%)</span></div>';

        // Context Engineering stats — projections only from measured turn history (no fabricated numbers)
        var gh = s.turnHistory || [];
        var hasGrowth = gh.length >= 2;
        var growth = hasGrowth ? Math.round((gh[gh.length-1].inputTokens - gh[0].inputTokens)/(gh.length-1)) : 0;
        var outResv = (bd && bd.outputReservation) ? bd.outputReservation : 0;
        var tLeftTxt = (hasGrowth && growth > 0) ? '~'+Math.max(Math.floor((cap - tot - outResv)/growth), 0) : '\\u2014';
        html += '<div class="card"><div class="card-title">Context Engineering</div><div class="ce-grid">';
        html += '<div class="ce-stat"><span class="ce-val">'+pct+'%</span><span class="ce-lbl">context used</span></div>';
        html += '<div class="ce-stat"><span class="ce-val">'+turns+(rot>0?' / '+rot:'')+'</span><span class="ce-lbl">'+(rot>0?'turns to rot':'turns')+'</span></div>';
        html += '<div class="ce-stat"><span class="ce-val">'+(growth>0?'+'+fmt(growth):'\\u2014')+'</span><span class="ce-lbl">tokens/turn</span></div>';
        html += '<div class="ce-stat"><span class="ce-val">'+tLeftTxt+'</span><span class="ce-lbl">turns left</span></div>';
        html += '</div></div>';

        // Cost estimate
        if (ce) {
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--low) 30%, var(--border))">';
          html += '<div class="card-title" style="color:var(--low)">API Cost Simulation</div>';
          html += '<div class="cost-total">'+fmtC(ce.totalCost)+'</div>';
          html += '<div class="cost-grid">';
          html += '<span class="cost-label">Input</span><span class="cost-tok">~'+fmt(ce.inputTokens)+'</span><span class="cost-val">'+fmtC(ce.inputCost)+'</span>';
          html += '<span class="cost-label">Output (max)</span><span class="cost-tok">~'+fmt(ce.outputTokens)+'</span><span class="cost-val">'+fmtC(ce.outputCost)+'</span>';
          html += '<div class="cost-sep"></div>';
          html += '<span class="cost-label" style="font-weight:600">Total</span><span class="cost-tok"></span><span class="cost-val">'+fmtC(ce.totalCost)+'</span>';
          html += '</div>';
          html += '<div class="cost-rate">Rate: $'+ce.inputCostPerMTok+'/MTok in, $'+ce.outputCostPerMTok+'/MTok out</div>';
          html += '</div>';
        }

        // Next turn preview — only when growth is measured (avoids fabricated projections)
        if (hasGrowth && growth > 0) {
          var nextIn = tot + growth, nextPct = Math.min((nextIn/cap)*100,100).toFixed(1);
          var warn = nextPct >= 90 ? 'High risk of overflow' : nextPct >= 75 ? 'Approaching limit' : '';
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--accent)">Next Turn Preview</div>';
          html += '+~'+fmt(growth)+' &#8594; ~'+fmt(nextIn)+' ('+nextPct+'%)';
          if (warn) html += '<div style="color:var(--medium);font-weight:600;margin-top:2px">'+warn+'</div>';
          html += '</div>';
        }

        // Stats pills
        html += '<div class="pills">';
        html += '<span class="pill">'+t.length+' open</span>';
        html += '<span class="pill">'+pins+' pinned</span>';
        if (wfc > 0) html += '<span class="pill">'+wfc+' in project</span>';
        if (diag.errors > 0) html += '<span class="pill">'+diag.errors+' errors</span>';
        if (tl) html += '<span class="pill" style="color:var(--accent)">'+tl+'</span>';
        html += '</div>';

        // Workspace info
        if (wfc > 0) {
          html += '<div class="workspace-info">';
          html += '<span>Project: ~'+fmt(wft)+' tokens across '+wfc+' files</span>';
          if (wft > cap) html += '<span class="ws-warn">Exceeds context window</span>';
          else html += '<span class="ws-ok">Fits in context window</span>';
          html += '</div>';
        }

        // Feature panel
        html += '<div class="feat-panel">';
        html += '<div class="feat-hdr"><span style="color:var(--free-green)">&#x2B21;</span><span class="feat-hdr-label" style="color:var(--free-green)">Features</span></div>';
        html += '<div class="feat-btn" data-action="terminologyGen"><span class="feat-btn-icon">&#x1F4D6;</span><div class="feat-btn-info"><div class="feat-btn-name">Generate Glossary <span class="tag-new">NEW</span></div><div class="feat-btn-desc">Compress repeated terminology into a glossary</div></div><span class="feat-btn-arrow">&#8594;</span></div>';
        html += '<div class="feat-btn locked" data-action="proFeature" data-feature="Secure Workspace"><span class="feat-btn-icon">&#x1F512;</span><div class="feat-btn-info"><div class="feat-btn-name">Secure Workspace <span class="tag-pro">PRO</span></div><div class="feat-btn-desc">Protect secrets from AI agents</div></div><span class="feat-btn-arrow">&#8594;</span></div>';
        html += '<div class="feat-btn locked" data-action="proFeature" data-feature="Generate SKILL.md"><span class="feat-btn-icon">&#x1F512;</span><div class="feat-btn-info"><div class="feat-btn-name">Generate SKILL.md <span class="tag-pro">PRO</span></div><div class="feat-btn-desc">Package domain expertise for agents</div></div><span class="feat-btn-arrow">&#8594;</span></div>';
        html += '<div class="feat-btn locked" data-action="proFeature" data-feature="Generate AI Settings"><span class="feat-btn-icon">&#x1F512;</span><div class="feat-btn-info"><div class="feat-btn-name">Generate AI Settings <span class="tag-pro">PRO</span></div><div class="feat-btn-desc">GitHub + VS Code agent configs</div></div><span class="feat-btn-arrow">&#8594;</span></div>';
        html += '</div>';

        // Budget breakdown
        if (bd) {
          var total = tot || 1;
          var fp = Math.round((bd.files/total)*100), sp = Math.round(((bd.systemPrompt+bd.instructions)/total)*100);
          var cp = Math.round((bd.conversation/total)*100), op = Math.round((bd.outputReservation/total)*100);
          html += '<div class="sec"><div class="sec-title">Budget Breakdown</div>';
          html += '<div style="display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:11px">';
          html += '<span>Files</span><span style="text-align:right">~'+fmt(bd.files)+'</span>';
          html += '<span>System</span><span style="text-align:right">~'+fmt(bd.systemPrompt)+'</span>';
          html += '<span>Instructions</span><span style="text-align:right">~'+fmt(bd.instructions)+'</span>';
          html += '<span>Conversation</span><span style="text-align:right">~'+fmt(bd.conversation)+'</span>';
          html += '<span>Output reserve</span><span style="text-align:right">~'+fmt(bd.outputReservation)+'</span>';
          html += '</div>';
          html += '<div class="bar-wrap"><div style="display:flex;height:100%"><div class="bar-fill" style="width:'+fp+'%;background:var(--accent)"></div><div class="bar-fill" style="width:'+sp+'%;background:#bc8cff"></div><div class="bar-fill" style="width:'+cp+'%;background:var(--medium)"></div><div class="bar-fill" style="width:'+op+'%;background:#8b949e"></div></div></div>';
          html += '</div>';
        }

        // Context growth
        if (s.turnHistory && s.turnHistory.length > 0) {
          var hist = s.turnHistory;
          html += '<div class="sec"><div class="sec-title">Context Growth ('+hist.length+' turns)</div>';
          html += '<div style="display:flex;align-items:flex-end;gap:2px;height:28px;margin-bottom:4px">';
          for (var i = 0; i < hist.length; i++) {
            var pct = Math.max(5, Math.round((hist[i].inputTokens/cap)*100));
            html += '<div style="flex:1;min-width:3px;height:'+pct+'%;border-radius:2px 2px 0 0;background:var(--accent);opacity:'+(i===hist.length-1?'1':'0.5')+'" title="T'+hist[i].turn+': ~'+fmt(hist[i].inputTokens)+'"></div>';
          }
          html += '</div>';
          html += '<div style="display:flex;justify-content:space-between;font-size:10px"><span>T1: ~'+fmt(hist[0].inputTokens)+'</span><span>T'+hist[hist.length-1].turn+': ~'+fmt(hist[hist.length-1].inputTokens)+'</span></div>';
          if (hist.length >= 2) html += '<div style="font-size:11px;color:var(--medium);font-weight:500;margin-top:2px">+'+fmt(Math.round((hist[hist.length-1].inputTokens-hist[0].inputTokens)/(hist.length-1)))+'/turn avg</div>';
          html += '</div>';
        }

        // File list
        html += '<div class="sec"><div class="sec-title">Files ('+rel.length+')</div><ul class="tab-list">';
        if (rel.length === 0) { html += '<li class="empty">No files open</li>'; }
        else { for (var j = 0; j < rel.length; j++) html += tabHtml(rel[j]); }
        html += '</ul></div>';

        // Low relevance
        if (dist.length > 0) {
          html += '<div class="sec"><div class="sec-title">Low Relevance ('+dist.length+')</div><ul class="tab-list">';
          for (var k = 0; k < dist.length; k++) html += tabHtml(dist[k]);
          html += '</ul><button class="act-btn" data-action="optimize">Close '+dist.length+' Low-Relevance Tabs</button></div>';
        }

        // Price compare (collapsible, with "vs Current")
        if (s.priceCompare && s.priceCompare.length > 0) {
          var curCost = null;
          for (var ci=0; ci<s.priceCompare.length; ci++) {
            if (s.priceCompare[ci].modelId === mid) { curCost = s.priceCompare[ci].totalCost; break; }
          }
          var winMap = {};
          for (var wi=0; wi<models.length; wi++) { winMap[models[wi].id] = models[wi].contextWindow; }

          var rows = s.priceCompare.map(function(c,i) {
            var cls = (c.modelId===mid?' act':'')+(i===0?' cheap':'');
            var win = winMap[c.modelId] || 0;
            var savTxt = '';
            if (curCost !== null && c.modelId !== mid) {
              var diff = c.totalCost - curCost;
              if (diff < 0) savTxt = '<span style="color:var(--low)">'+fmtC(Math.abs(diff))+'</span>';
              else if (diff > 0) savTxt = '<span style="color:var(--high)">+'+fmtC(diff)+'</span>';
              else savTxt = '—';
            } else if (c.modelId === mid) {
              savTxt = '<span style="color:var(--accent)">current</span>';
            }
            return '<tr class="'+cls+'"><td>'+c.label+'</td><td>'+fmt(win)+'</td><td>'+fmtC(c.totalCost)+'</td><td>'+savTxt+'</td></tr>';
          }).join('');
          var meta = s.catalogMeta || {};
          var sync = (meta.source==='remote'?'Remote':'Bundled') + (meta.lastSyncAt?' '+ago(meta.lastSyncAt):'');
          html += '<div class="card">';
          html += '<div class="cmp-toggle" data-action="toggleCompare"><div class="card-title" style="margin-bottom:0">Price Compare <span style="font-weight:400;font-size:9px">'+sync+' <button style="background:none;border:none;color:var(--link-fg);cursor:pointer;font-size:10px;text-decoration:underline" data-action="refreshPricing">Refresh</button></span></div><span class="cmp-plus" id="cmpPlus">+</span></div>';
          html += '<div class="cmp-body" id="cmpBody" style="margin-top:6px">';
          html += '<table class="compare-tbl"><thead><tr><th>Model</th><th>Window</th><th>Cost</th><th>vs Current</th></tr></thead><tbody>'+rows+'</tbody></table>';
          html += '</div></div>';
        }

        // Health notes
        if (reasons.length > 0) {
          html += '<ul style="font-size:11px;margin-top:6px;padding-left:16px">';
          for (var r = 0; r < reasons.length; r++) html += '<li style="margin-bottom:3px">'+reasons[r]+'</li>';
          html += '</ul>';
        }

        if (turns > 0) html += '<button class="act-btn sec-btn" data-action="resetTurns">Reset Turn Counter</button>';

        app.innerHTML = html;
      } catch (e) {
        app.innerHTML = '<div class="err">Render error: ' + e.message + '</div>';
      }
    }

    function tabHtml(t) {
      var u = encodeURIComponent(t.uri);
      var pin = t.isPinned
        ? '<button title="Unpin" data-action="unpin" data-uri="'+u+'">&#x1F4CC;</button>'
        : '<button title="Pin" data-action="pin" data-uri="'+u+'">&#x1F4CD;</button>';
      var cls = !t.isActive ? '<button title="Close" data-action="closeTab" data-uri="'+u+'">&#x2715;</button>' : '';
      return '<li class="tab-item" data-action="openFile" data-uri="'+u+'"><div class="tab-dot '+rc(t.relevanceScore)+'"></div><span class="tab-name'+(t.isActive?' active':'')+'">'+t.label+(t.isDirty?' &bull;':'')+'</span><span class="tab-tok">~'+fmt(t.estimatedTokens)+'</span><div class="tab-btns">'+pin+cls+'</div></li>';
    }

    document.addEventListener('click', function(e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var a = el.dataset.action, u = el.dataset.uri ? decodeURIComponent(el.dataset.uri) : undefined;
      switch (a) {
        case 'pin': e.stopPropagation(); vscode.postMessage({command:'pin',uri:u}); break;
        case 'unpin': e.stopPropagation(); vscode.postMessage({command:'unpin',uri:u}); break;
        case 'closeTab': e.stopPropagation(); vscode.postMessage({command:'closeTab',uri:u}); break;
        case 'optimize': vscode.postMessage({command:'optimize'}); break;
        case 'resetTurns': vscode.postMessage({command:'resetTurns'}); break;
        case 'refreshPricing': vscode.postMessage({command:'refreshPricing'}); break;
        case 'terminologyGen': vscode.postMessage({command:'terminologyGen'}); break;
        case 'proFeature': vscode.postMessage({command:'proFeature',feature:el.dataset.feature||''}); break;
        case 'toggleCompare':
          var body = document.getElementById('cmpBody');
          var plus = document.getElementById('cmpPlus');
          if (body) { body.classList.toggle('open'); }
          if (plus) { plus.textContent = body && body.classList.contains('open') ? '\\u2212' : '+'; }
          break;
      }
    });
    document.addEventListener('dblclick', function(e) {
      var el = e.target.closest('[data-action="openFile"]');
      if (el && el.dataset.uri) vscode.postMessage({command:'openFile',uri:decodeURIComponent(el.dataset.uri)});
    });

    var lastSes = null;
    window.addEventListener('message', function(e) {
      if (e.data.type === 'snapshot') {
        if (e.data.lastSession) lastSes = e.data.lastSession;
        render(e.data.data, lastSes);
      }
    });

    setTimeout(function() {
      document.querySelectorAll('.bead-row').forEach(function(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
      });
    }, 50);
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
