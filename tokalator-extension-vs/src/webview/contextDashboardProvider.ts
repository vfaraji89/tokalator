import { randomBytes } from 'crypto';
import * as vscode from 'vscode';
import { ContextMonitor } from '../core/contextMonitor';
import type { ContextSnapshot } from '../core/types';
import { getCatalogMeta, onDidChangeCatalog } from '../core/catalogStore';
import { getFeaturedModels } from '../core/modelProfiles';
import type { PriceWatchService, RateChangeset, PriceWatchImpact } from '../core/priceWatch';

/**
 * WebviewViewProvider for the Tokalator sidebar panel.
 * Shows a simplified token budget dashboard.
 */
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

  private priceWatch: PriceWatchService | null = null;
  setPriceWatch(pw: PriceWatchService): void { this.priceWatch = pw; }

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

        case 'refreshPricing': {
          await vscode.commands.executeCommand('tokalator.refreshPricing');
          break;
        }

        case 'secure': {
          await vscode.commands.executeCommand('tokalator.secure');
          break;
        }

        case 'skillGen': {
          await vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /skill-gen' });
          break;
        }

        case 'settingsGen': {
          await vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /settings-gen' });
          break;
        }

        case 'switchModel': {
          if (message.modelId) {
            await this.monitor.setModel(message.modelId, 'detected');
          }
          break;
        }

        case 'pricewatch': {
          await vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /pricewatch' });
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
    try {

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
      models: getFeaturedModels(this.monitor.getModels()).map(m => ({ id: m.id, label: m.label, provider: m.provider, contextWindow: m.contextWindow, inputCostPerMTok: m.inputCostPerMTok, outputCostPerMTok: m.outputCostPerMTok })),
      detectedModels: this.monitor.getDetectedModels(),
      tokenizerType: snapshot.tokenizerType,
      tokenizerLabel: snapshot.tokenizerLabel,
      turnHistory: snapshot.turnHistory,
      budgetBreakdown: snapshot.budgetBreakdown,
      costEstimate: snapshot.costEstimate,
    };

    const catalogMeta = getCatalogMeta();

    const lastSession = this.monitor.getLastSession();
    const modelUsageLog = this.monitor.getModelUsageLog();
    const usageInsights = this.monitor.getUsageInsights();
    const priceWatchData = this.priceWatch ? {
      changelog: this.priceWatch.getChangelog(),
      latest: this.priceWatch.getLatestChangeset(),
      impact: this.priceWatch.getImpact(),
      hasUnacked: this.priceWatch.hasUnacknowledged(),
    } : null;
    this.view.webview.postMessage({ type: 'snapshot', data: { ...serialized, catalogMeta, modelUsageLog, usageInsights, priceWatchData }, lastSession });
    } catch (err) {
      console.error('Tokalator: postSnapshot failed', err);
    }
  }

  private getHtml(_webview: vscode.Webview): string {
    const nonce = getNonce();

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; form-action 'none'; base-uri 'none';">
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
      --desc-fg: var(--vscode-descriptionForeground, var(--vscode-foreground, #cccccc));
      --link-fg: var(--vscode-textLink-foreground, #58a6ff);
      --pro-red: #e3120b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--fg); background: var(--bg); padding: 10px; }

    .hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .hdr-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .hdr-icon svg { width: 100%; height: 100%; }
    .hdr-title { font-weight: 700; font-size: 13px; }
    .hdr-badge { background: var(--pro-red); color: #fff; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 8px; letter-spacing: 1px; }
    /* Calculator button press animation */
    @keyframes btnPress {
      0%, 100% { opacity: 0.25; }
      50% { opacity: 0.75; }
    }
    @keyframes screenGlow {
      0%, 80% { opacity: 0.35; }
      90% { opacity: 0.7; }
      100% { opacity: 0.35; }
    }
    .hdr-icon .calc-btn { animation: btnPress 0.35s ease both; }
    .hdr-icon .btn-1 { animation-delay: 0.3s; }
    .hdr-icon .btn-2 { animation-delay: 0.55s; }
    .hdr-icon .btn-3 { animation-delay: 0.8s; }
    .hdr-icon .btn-4 { animation-delay: 1.05s; }
    .hdr-icon .btn-5 { animation-delay: 1.3s; }
    .hdr-icon .btn-6 { animation-delay: 1.55s; }
    .hdr-icon .btn-7 { animation-delay: 1.8s; }
    .hdr-icon .btn-8 { animation-delay: 2.05s; }
    .hdr-icon .btn-eq { animation-delay: 2.3s; animation-duration: 0.5s; }
    .hdr-icon .calc-screen { animation: screenGlow 3s ease 2.5s both; }

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

    .pro-panel { border: 1px solid color-mix(in srgb, var(--pro-red) 40%, var(--border)); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .pro-hdr { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
    .pro-hdr-label { font-weight: 700; font-size: 11px; color: var(--pro-red); text-transform: uppercase; letter-spacing: 0.5px; }
    .pro-btn { display: flex; align-items: center; gap: 6px; padding: 5px 7px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); cursor: pointer; margin-bottom: 4px; transition: border-color 0.15s; }
    .pro-btn:last-child { margin-bottom: 0; }
    .pro-btn:hover { border-color: var(--pro-red); }
    .pro-btn-icon { font-size: 13px; flex-shrink: 0; }
    .pro-btn-info { flex: 1; min-width: 0; }
    .pro-btn-name { font-size: 11px; font-weight: 600; color: var(--fg); }
    .pro-btn-desc { font-size: 9px; color: var(--desc-fg); }
    .pro-btn-arrow { font-size: 11px; color: var(--desc-fg); }

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
    .detect-chip { font-size:10px; padding:2px 6px; border-radius:4px; border:1px solid var(--border); background:var(--bg); cursor:pointer; color:var(--fg); transition:border-color 0.15s; }
    .detect-chip:hover { border-color:var(--accent); color:var(--accent); }

    .usage-stat { display:flex; justify-content:space-between; align-items:baseline; font-size:11px; padding:2px 0; }
    .usage-stat-label { color:var(--desc-fg); }
    .usage-stat-val { font-weight:600; font-variant-numeric:tabular-nums; }
    .usage-highlight { font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; margin-bottom:2px; }
    .usage-sub { font-size:10px; color:var(--desc-fg); margin-bottom:6px; }

  </style>
</head>
<body>
  <div id="app"><div class="empty">Loading...</div></div>
  <script nonce="${nonce}">
    var vscode = acquireVsCodeApi();
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    var app = document.getElementById('app');
    function fmt(n) { if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return ''+n; }
    function fmtC(n) { if (n < 0.001) return '<$0.001'; if (n < 0.01) return '$'+n.toFixed(4); if (n < 1) return '$'+n.toFixed(3); return '$'+n.toFixed(2); }
    function ago(iso) { var m=Math.floor((Date.now()-new Date(iso).getTime())/60000); if(m<60) return m+'m ago'; var h=Math.floor(m/60); if(h<24) return h+'h ago'; return Math.floor(h/24)+'d ago'; }
    function rc(s) { return s >= 0.6 ? 'hi' : s >= 0.3 ? 'md' : 'lo'; }

    function render(s, ls) {
      try {
        var t = s.tabs || [], bl = s.budgetLevel || 'low', tot = s.totalEstimatedTokens || 0, cap = s.windowCapacity || 200000;
        var turns = s.chatTurnCount || 0, pins = (s.pinnedFiles || []).length, reasons = s.healthReasons || [];
        var mid = s.modelId || '', models = s.models || [], ce = s.costEstimate, detected = s.detectedModels || [], usageLog = s.modelUsageLog || [];
        var bd = s.budgetBreakdown, diag = s.diagnosticsSummary || {errors:0};
        var tl = s.tokenizerLabel || '', wfc = s.workspaceFileCount || 0, wft = s.workspaceFileTokens || 0;
        var th = 0.3, rel = t.filter(function(x){return x.relevanceScore>=th||x.isActive||x.isPinned;});
        var dist = t.filter(function(x){return x.relevanceScore<th&&!x.isActive&&!x.isPinned;});

        var html = '<div class="hdr"><span class="hdr-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="var(--fg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="2" width="18" height="20" rx="2"/>' +
          '<rect class="calc-screen" x="5.5" y="4.5" width="13" height="4" rx="1" fill="var(--accent)" opacity="0.35" stroke="none"/>' +
          '<rect class="calc-btn btn-1" x="5.5" y="10.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-2" x="9.5" y="10.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-3" x="13.5" y="10.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-4" x="5.5" y="13.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-5" x="9.5" y="13.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-6" x="13.5" y="13.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-7" x="5.5" y="16.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-8" x="9.5" y="16.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-eq" x="13.5" y="16.5" width="3" height="2" rx="0.5" fill="var(--pro-red)" opacity="0.45" stroke="none"/>' +
          '</svg></span><span class="hdr-title">Tokalator</span><span class="hdr-badge">OPEN SOURCE</span></div>';

        // 1. Budget meter
        var mLabel = '';
        var mProvider = '';
        for (var mi = 0; mi < models.length; mi++) { if (models[mi].id === mid) { mLabel = models[mi].label; mProvider = models[mi].provider; break; } }
        html += '<div class="meter '+bl+'"><span class="meter-level">'+bl.toUpperCase()+'</span><span class="meter-tokens">~'+fmt(tot)+' / '+fmt(cap)+'</span></div>';

        // 1b. Active Model card
        var lastChatApi = null;
        for (var ul = usageLog.length - 1; ul >= 0; ul--) {
          if (usageLog[ul].source === 'chat-api') { lastChatApi = usageLog[ul]; break; }
        }
        var sourceLabel = 'Set via Settings';
        var sourceColor = 'var(--desc-fg)';
        if (lastChatApi && lastChatApi.modelId === mid) {
          sourceLabel = 'Synced from @tokalator chat';
          sourceColor = 'var(--low)';
        }
        var providerLabel = mProvider === 'anthropic' ? 'Anthropic' : mProvider === 'openai' ? 'OpenAI' : mProvider === 'google' ? 'Google' : mProvider || 'Unknown';
        html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 50%, var(--border))">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center">';
        html += '<div><div style="font-size:13px;font-weight:700">'+esc(mLabel||mid)+'</div>';
        html += '<div style="font-size:10px;color:var(--desc-fg)">'+providerLabel+' &middot; '+fmt(cap)+' context</div></div>';
        html += '<div style="text-align:right"><div style="font-size:10px;color:'+sourceColor+'">'+sourceLabel+'</div>';
        if (ce) html += '<div style="font-size:10px;color:var(--desc-fg)">$'+ce.inputCostPerMTok+' / $'+ce.outputCostPerMTok+' per MTok</div>';
        html += '</div></div>';

        // Available models detected via LM API (tap to switch)
        if (detected.length > 0) {
          var otherModels = detected.filter(function(d){ return d !== mid; });
          if (otherModels.length > 0) {
            html += '<div style="margin-top:4px;border-top:1px solid var(--border);padding-top:4px">';
            html += '<div style="font-size:9px;color:var(--desc-fg);margin-bottom:3px">Also available (tap to switch):</div>';
            html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
            for (var oi = 0; oi < otherModels.length; oi++) {
              var om = otherModels[oi], omLabel = om;
              for (var mj = 0; mj < models.length; mj++) { if (models[mj].id === om) { omLabel = models[mj].label; break; } }
              html += '<span class="detect-chip" data-action="switchModel" data-model="'+esc(om)+'">'+esc(omLabel)+'</span>';
            }
            html += '</div></div>';
          }
          if (otherModels.length === 0) {
            html += '<div style="font-size:9px;color:var(--low);margin-top:4px">Only model detected via Copilot</div>';
          }
        }

        // Hint about auto-sync
        if (!lastChatApi || lastChatApi.modelId !== mid) {
          html += '<div style="font-size:9px;color:var(--desc-fg);margin-top:4px;border-top:1px solid var(--border);padding-top:4px">Use @tokalator in chat to auto-sync model</div>';
        }
        html += '</div>';

        // 2. Stats pills
        html += '<div class="pills">';
        html += '<span class="pill">'+t.length+' open</span>';
        html += '<span class="pill">'+pins+' pinned</span>';
        html += '<span class="pill">'+turns+' turns</span>';
        if (wfc > 0) html += '<span class="pill">'+wfc+' in project</span>';
        if (diag.errors > 0) html += '<span class="pill">'+diag.errors+' errors</span>';
        if (tl) html += '<span class="pill" style="color:var(--accent)">'+tl+'</span>';
        html += '</div>';

        // 3. Turn Analytics (log-based, replaces hardcoded estimates)
        var ui = s.usageInsights;
        if (ui && ui.totalTurns >= 1) {
          var avgPerTurn = ui.avgInputTokens;
          var outRes = (bd && bd.outputReservation) ? bd.outputReservation : 4000;
          var rem = Math.max(cap - tot - outRes, 0);
          var turnsLeft = avgPerTurn > 0 ? Math.floor(rem / avgPerTurn) : 0;
          var pctAfterNext = avgPerTurn > 0 ? Math.min(((tot + avgPerTurn) / cap) * 100, 100).toFixed(1) : '0.0';
          var warn = pctAfterNext >= 90 ? 'High risk of overflow' : pctAfterNext >= 75 ? 'Approaching limit' : '';
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--accent)">Turn Analytics <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(from '+ui.totalTurns+' logged turns)</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Avg input/turn</span><span class="usage-stat-val">~'+fmt(avgPerTurn)+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Next turn estimate</span><span class="usage-stat-val">~'+fmt(tot + avgPerTurn)+' ('+pctAfterNext+'%)</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Turns remaining</span><span class="usage-stat-val">~'+turnsLeft+'</span></div>';
          if (warn) html += '<div style="color:var(--medium);font-weight:600;margin-top:4px;font-size:11px">'+warn+'</div>';
          html += '</div>';
        } else {
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--accent)">Turn Analytics</div>';
          html += '<div style="font-size:11px;color:var(--desc-fg)">Use @tokalator to start tracking turn data.</div>';
          html += '</div>';
        }

        // 4. Actual Turn Cost (log-based, input-only since output tokens are not observable via VS Code API)
        if (ui && ui.totalTurns >= 1) {
          var lt = ui.lastTurn;
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--low) 30%, var(--border))">';
          html += '<div class="card-title" style="color:var(--low)">Turn Cost <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(input only)</span></div>';
          if (lt) {
            html += '<div class="usage-highlight">'+fmtC(lt.effectiveCost)+'</div>';
            html += '<div class="usage-sub">last turn: ~'+fmt(lt.inputTokens)+' input tokens</div>';
          }
          html += '<div class="cost-grid">';
          html += '<span class="cost-label">Avg cost/turn</span><span class="cost-tok">~'+fmt(ui.avgInputTokens)+'</span><span class="cost-val">'+fmtC(ui.avgCostPerTurn)+'</span>';
          html += '<span class="cost-label">Total spend</span><span class="cost-tok">'+ui.totalTurns+' turns</span><span class="cost-val">'+fmtC(ui.totalCost)+'</span>';
          html += '</div>';
          if (ce) {
            html += '<div class="cost-rate">Rate: $'+ce.inputCostPerMTok+'/MTok input</div>';
          }
          html += '</div>';
        }

        // 6. Pro panel
        html += '<div class="pro-panel">';
        html += '<div class="pro-hdr"><span class="pro-hdr-label">Workspace tools</span></div>';
        html += '<div class="pro-btn" data-action="secure"><div class="pro-btn-info"><div class="pro-btn-name">Secure Workspace</div><div class="pro-btn-desc">Protect secrets from AI agents</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
        html += '<div class="pro-btn" data-action="skillGen"><div class="pro-btn-info"><div class="pro-btn-name">Generate SKILL.md</div><div class="pro-btn-desc">Package domain expertise for agents</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
        html += '<div class="pro-btn" data-action="settingsGen"><div class="pro-btn-info"><div class="pro-btn-name">Generate AI Settings</div><div class="pro-btn-desc">GitHub + VS Code agent configs</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
        html += '</div>';

        // 7. Budget breakdown
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

        // 8. File list
        html += '<div class="sec"><div class="sec-title">Files ('+rel.length+')</div><ul class="tab-list">';
        if (rel.length === 0) { html += '<li class="empty">No files open</li>'; }
        else { for (var j = 0; j < rel.length; j++) html += tabHtml(rel[j]); }
        html += '</ul></div>';

        // 9. Low relevance
        if (dist.length > 0) {
          html += '<div class="sec"><div class="sec-title">Low Relevance ('+dist.length+')</div><ul class="tab-list">';
          for (var k = 0; k < dist.length; k++) html += tabHtml(dist[k]);
          html += '</ul><button class="act-btn" data-action="optimize">Close '+dist.length+' Low-Relevance Tabs</button></div>';
        }

        // 11. Last session
        if (ls && ls.totalTurns > 0) {
          html += '<div class="card"><div class="card-title">Last Session <span style="float:right;font-weight:400">'+ago(ls.endedAt)+'</span></div>';
          html += '<span>'+esc(ls.modelLabel)+'</span> &middot; <span>'+ls.totalTurns+' turns</span> &middot; <span>peak '+fmt(ls.peakTokens)+'</span></div>';
        }

        // 12. Health notes
        if (reasons.length > 0) {
          html += '<ul style="font-size:11px;margin-top:6px;padding-left:16px">';
          for (var r = 0; r < reasons.length; r++) html += '<li style="margin-bottom:3px">'+reasons[r]+'</li>';
          html += '</ul>';
        }

        // 13. Context growth
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

        if (turns > 0) html += '<button class="act-btn sec-btn" data-action="resetTurns">Reset Turn Counter</button>';

        app.innerHTML = html;
      } catch (e) {
        app.innerHTML = '<div class="err">Render error: ' + esc(e.message) + '</div>';
      }
    }

    function tabHtml(t) {
      var u = encodeURIComponent(t.uri);
      var pin = t.isPinned
        ? '<button title="Unpin" data-action="unpin" data-uri="'+u+'">&#9679;</button>'
        : '<button title="Pin" data-action="pin" data-uri="'+u+'">&#9675;</button>';
      var cls = !t.isActive ? '<button title="Close" data-action="closeTab" data-uri="'+u+'">&#x2715;</button>' : '';
      return '<li class="tab-item" data-action="openFile" data-uri="'+u+'"><div class="tab-dot '+rc(t.relevanceScore)+'"></div><span class="tab-name'+(t.isActive?' active':'')+'">'+esc(t.label)+(t.isDirty?' &bull;':'')+'</span><span class="tab-tok">~'+fmt(t.estimatedTokens)+'</span><div class="tab-btns">'+pin+cls+'</div></li>';
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
        case 'secure': vscode.postMessage({command:'secure'}); break;
        case 'skillGen': vscode.postMessage({command:'skillGen'}); break;
        case 'settingsGen': vscode.postMessage({command:'settingsGen'}); break;
        case 'pricewatch': vscode.postMessage({command:'pricewatch'}); break;
        case 'switchModel': vscode.postMessage({command:'switchModel',modelId:el.dataset.model}); break;
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

    // Re-trigger calculator button press animation on each render
    setTimeout(function() {
      document.querySelectorAll('.calc-btn, .calc-screen').forEach(function(el) {
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
  return randomBytes(16).toString('hex');
}
