import * as vscode from 'vscode';
import { ContextMonitor } from '../core/contextMonitor';
import type { ContextSnapshot } from '../core/types';
import { getCatalogMeta, onDidChangeCatalog } from '../core/catalogStore';
import { getFeaturedModels } from '../core/modelProfiles';
import type { LicenseService } from '../core/licenseService';
import type { CopilotCreditsTracker, CreditSnapshot } from '../core/copilotPlan';
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
  private license: LicenseService | null = null;
  private creditsTracker: CopilotCreditsTracker | null = null;

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

  setLicense(license: LicenseService): void { this.license = license; }
  setCreditsTracker(tracker: CopilotCreditsTracker): void { this.creditsTracker = tracker; }
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

        case 'terminologyGen': {
          await vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /terminology-gen' });
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

        case 'teamDashboard': {
          await vscode.commands.executeCommand('tokalator.openDashboard');
          break;
        }

        case 'skillsCatalog': {
          const cfg = vscode.workspace.getConfiguration('tokalator');
          const ep = cfg.get<string>('apiEndpoint', '').replace(/\/+$/, '');
          if (ep) {
            await vscode.commands.executeCommand('simpleBrowser.show', ep + '/skills');
          } else {
            await vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /skills' });
          }
          break;
        }

        case 'switchModel': {
          if (message.modelId) {
            await this.monitor.setModel(message.modelId, 'detected');
          }
          break;
        }

        case 'auditLog': {
          await vscode.commands.executeCommand('workbench.action.chat.open', { query: '@tokalator /audit' });
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
    const tierLabel = this.license ? this.license.getTierLabel() : 'PRO';
    const credits = this.creditsTracker ? this.creditsTracker.getSnapshot() : null;
    const modelUsageLog = this.monitor.getModelUsageLog();
    const usageInsights = this.monitor.getUsageInsights();
    const priceWatchData = this.priceWatch ? {
      changelog: this.priceWatch.getChangelog(),
      latest: this.priceWatch.getLatestChangeset(),
      impact: this.priceWatch.getImpact(),
      hasUnacked: this.priceWatch.hasUnacknowledged(),
    } : null;
    this.view.webview.postMessage({ type: 'snapshot', data: { ...serialized, catalogMeta, tierLabel, credits, modelUsageLog, usageInsights, priceWatchData }, lastSession });
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
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tokalator Pro</title>
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
          '</svg></span><span class="hdr-title">Tokalator</span><span class="hdr-badge">PRO</span></div>';

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
        html += '<div><div style="font-size:13px;font-weight:700">'+(mLabel||mid)+'</div>';
        html += '<div style="font-size:10px;color:var(--desc-fg)">'+providerLabel+' &middot; '+fmt(cap)+' context</div></div>';
        html += '<div style="text-align:right"><div style="font-size:10px;color:'+sourceColor+'">'+sourceLabel+'</div>';
        if (ce) html += '<div style="font-size:10px;color:var(--desc-fg)">$'+ce.inputCostPerMTok+' / $'+ce.outputCostPerMTok+' per MTok</div>';
        html += '</div></div>';

        // Available models detected via LM API (tap to switch)
        if (detected.length > 0) {
          var otherModels = detected.filter(function(d){ return d.id !== mid; });
          if (otherModels.length > 0) {
            html += '<div style="margin-top:4px;border-top:1px solid var(--border);padding-top:4px">';
            html += '<div style="font-size:9px;color:var(--desc-fg);margin-bottom:3px">Also available (tap to switch):</div>';
            html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
            for (var oi = 0; oi < otherModels.length; oi++) {
              html += '<span class="detect-chip" data-action="switchModel" data-model="'+otherModels[oi].id+'">'+otherModels[oi].label+'</span>';
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

        // 5. GitHub AI Credits tracker
        if (s.credits) {
          var cr = s.credits;
          var crPlan = cr.plan || {};
          var crUsed = cr.usage ? cr.usage.totalCreditsUsed : 0;
          var crAllowance = crPlan.monthlyCredits || 0;
          var crPct = cr.percentUsed || 0;
          var crRemain = cr.creditsRemaining || 0;
          var crColor = cr.isOverage ? 'var(--high)' : crPct > 75 ? 'var(--medium)' : 'var(--low)';
          var crTurns = cr.usage ? cr.usage.turnCount : 0;
          var crProj = cr.projectedMonthly || 0;
          html += '<div class="card" style="border-color:color-mix(in srgb, '+crColor+' 40%, var(--border))">';
          html += '<div class="card-title" style="color:'+crColor+'">GitHub AI Credits</div>';
          html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">';
          html += '<span style="font-size:16px;font-weight:700;font-variant-numeric:tabular-nums">'+fmtC(crUsed)+'</span>';
          html += '<span style="font-size:10px;color:var(--desc-fg)">of '+fmtC(crAllowance)+' ('+crPlan.label+')</span>';
          html += '</div>';
          var barPct = Math.min(crPct, 100);
          html += '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:6px">';
          html += '<div style="width:'+barPct+'%;height:100%;background:'+crColor+';border-radius:2px"></div>';
          html += '</div>';
          html += '<div class="cost-grid">';
          var crEstTurns = ui ? (ui.estimatedTurns || 0) : 0;
          html += '<span class="cost-label">Used</span><span class="cost-tok">'+crTurns+' turns'+(crEstTurns > 0 ? ' <span style="font-size:9px;opacity:0.7">(~'+crEstTurns+' est.)</span>' : '')+'</span><span class="cost-val">'+fmtC(crUsed)+'</span>';
          var sesCredits = cr.currentSessionCredits || 0;
          var sesTurns = cr.currentSessionTurns || 0;
          html += '<span class="cost-label">This session</span><span class="cost-tok">'+sesTurns+' turns</span><span class="cost-val">'+fmtC(sesCredits)+'</span>';
          html += '<span class="cost-label">Remaining</span><span class="cost-tok"></span><span class="cost-val" style="color:'+crColor+'">'+fmtC(Math.max(crRemain,0))+'</span>';
          html += '<span class="cost-label">Projected/mo</span><span class="cost-tok"></span><span class="cost-val">'+(crProj > crAllowance ? '<span style="color:var(--high)">'+fmtC(crProj)+'</span>' : fmtC(crProj))+'</span>';
          if (cr.isOverage) {
            html += '<span class="cost-label" style="color:var(--high)">Overage</span><span class="cost-tok"></span><span class="cost-val" style="color:var(--high)">'+fmtC(cr.overageAmount)+'</span>';
          }
          html += '</div>';
          html += '</div>';
        }

        // 6. Pro panel
        html += '<div class="pro-panel">';
        html += '<div class="pro-hdr"><span style="color:var(--pro-red)">&#x2B21;</span><span class="pro-hdr-label">Pro Features</span></div>';
        html += '<div class="pro-btn" data-action="secure"><span class="pro-btn-icon">&#x1F6E1;&#xFE0F;</span><div class="pro-btn-info"><div class="pro-btn-name">Secure Workspace</div><div class="pro-btn-desc">Protect secrets from AI agents</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
        html += '<div class="pro-btn" data-action="terminologyGen"><span class="pro-btn-icon">&#x1F4D6;</span><div class="pro-btn-info"><div class="pro-btn-name">Generate Glossary</div><div class="pro-btn-desc">Compress terminology, save ~74% tokens</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
        html += '<div class="pro-btn" data-action="skillGen"><span class="pro-btn-icon">&#x1F9E0;</span><div class="pro-btn-info"><div class="pro-btn-name">Generate SKILL.md</div><div class="pro-btn-desc">Package domain expertise for agents</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
        html += '<div class="pro-btn" data-action="settingsGen"><span class="pro-btn-icon">&#x2699;&#xFE0F;</span><div class="pro-btn-info"><div class="pro-btn-name">Generate AI Settings</div><div class="pro-btn-desc">GitHub + VS Code agent configs</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
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

        // 10. Session usage summary (real data only)
        if (s.credits && s.credits.currentSessionTurns > 0) {
          var ses = s.credits;
          var sesDur = Math.max(Math.floor((Date.now() - (ses.usage.sessions || []).reduce(function(a,x){ return x.sessionId===ses.currentSessionId?x.startedAt:a; }, Date.now())) / 60000), 1);
          var avgCostPerTurn = ses.currentSessionTurns > 0 ? ses.currentSessionCredits / ses.currentSessionTurns : 0;
          var th = s.turnHistory || [];
          var totalInputTokens = th.reduce(function(a,x){return a+x.inputTokens;},0);
          var avgTokensPerTurn = th.length > 0 ? Math.round(totalInputTokens/th.length) : 0;
          var peakTokens = th.length > 0 ? Math.max.apply(null, th.map(function(x){return x.inputTokens;})) : 0;
          var cacheSavings = (ce && ce.inputCostPerMTok > 0 && ce.cachedInputCostPerMTok < ce.inputCostPerMTok) ? Math.round((1 - ce.cachedInputCostPerMTok / ce.inputCostPerMTok) * 100) : 0;
          var tokPerMin = sesDur > 0 ? Math.round(totalInputTokens / sesDur) : 0;
          var pctUsed = cap > 0 ? Math.round((tot / cap) * 100) : 0;
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--accent)">Session Usage</div>';
          html += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
          html += '<div class="usage-highlight">'+fmtC(ses.currentSessionCredits)+'</div>';
          html += '<span style="font-size:10px;color:var(--desc-fg)">~'+sesDur+' min</span>';
          html += '</div>';
          html += '<div class="usage-sub">'+ses.currentSessionTurns+' turns using '+(mLabel||mid)+'</div>';

          html += '<div class="cost-grid">';
          html += '<span class="cost-label">Avg cost/turn</span><span class="cost-tok">~'+fmt(avgTokensPerTurn)+' tok</span><span class="cost-val">'+fmtC(avgCostPerTurn)+'</span>';
          html += '<span class="cost-label">Total input</span><span class="cost-tok">'+ses.currentSessionTurns+' turns</span><span class="cost-val">~'+fmt(totalInputTokens)+'</span>';
          if (peakTokens > 0) html += '<span class="cost-label">Peak turn</span><span class="cost-tok"></span><span class="cost-val">~'+fmt(peakTokens)+'</span>';
          if (tokPerMin > 0) html += '<span class="cost-label">Velocity</span><span class="cost-tok"></span><span class="cost-val">~'+fmt(tokPerMin)+'/min</span>';
          html += '<div class="cost-sep"></div>';
          html += '<span class="cost-label">Context used</span><span class="cost-tok">'+pctUsed+'% of '+fmt(cap)+'</span><span class="cost-val">~'+fmt(tot)+'</span>';
          if (cacheSavings > 0) html += '<span class="cost-label">Cache savings</span><span class="cost-tok"></span><span class="cost-val" style="color:var(--low)">'+cacheSavings+'%</span>';
          html += '<span class="cost-label">Input rate</span><span class="cost-tok">'+(mLabel||mid)+'</span><span class="cost-val">$'+(ce?ce.inputCostPerMTok:0)+'/MTok</span>';
          html += '</div>';

          if (th.length >= 2) {
            var maxTh = Math.max.apply(null, th.map(function(x){return x.inputTokens;}));
            html += '<div style="display:flex;align-items:flex-end;gap:1px;height:20px;margin-top:8px">';
            for (var ti = 0; ti < th.length; ti++) {
              var tpct = maxTh > 0 ? Math.max(8, Math.round((th[ti].inputTokens/maxTh)*100)) : 8;
              html += '<div style="flex:1;min-width:2px;height:'+tpct+'%;border-radius:1px 1px 0 0;background:var(--accent);opacity:'+(ti===th.length-1?'1':'0.4')+'" title="T'+(ti+1)+': ~'+fmt(th[ti].inputTokens)+'"></div>';
            }
            html += '</div>';
            html += '<div style="font-size:9px;color:var(--desc-fg);margin-top:2px;display:flex;justify-content:space-between"><span>T1</span><span>T'+th.length+'</span></div>';
          }

          html += '</div>';
        }

        // 10b. Usage Intelligence (persistent cross-session analytics)
        var ui = s.usageInsights;
        if (ui && ui.totalTurns >= 1) {
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--pro-red) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--pro-red)">Usage Intelligence <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(all logged data)</span></div>';

          // Summary row: total cost + total tokens
          html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">';
          html += '<span style="font-size:16px;font-weight:700;font-variant-numeric:tabular-nums">'+fmtC(ui.totalCost)+'</span>';
          html += '<span style="font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--accent)">~'+fmt(ui.totalInputTokens || 0)+' tokens</span>';
          html += '</div>';
          html += '<div style="font-size:10px;color:var(--desc-fg);margin-bottom:6px">'+ui.totalTurns+' turns';
          if (ui.verifiedTurns > 0 || ui.estimatedTurns > 0) {
            html += ' (';
            var parts = [];
            if (ui.verifiedTurns > 0) parts.push(ui.verifiedTurns+' verified');
            if (ui.estimatedTurns > 0) parts.push(ui.estimatedTurns+' estimated');
            html += parts.join(', ');
            html += ')';
          }
          if (ui.firstTurnAt && ui.lastTurnAt) {
            var spanDays = Math.max(1, Math.ceil((ui.lastTurnAt - ui.firstTurnAt) / 86400000));
            html += ' over '+spanDays+(spanDays===1?' day':' days');
          }
          html += ' &middot; '+fmtC(ui.avgCostPerTurn)+'/turn avg &middot; ~'+fmt(ui.avgInputTokens)+' tok/turn avg</div>';
          if (ui.estimatedTurns > 0) {
            html += '<div style="font-size:9px;color:var(--desc-fg);margin-bottom:6px;font-style:italic">Estimated turns are detected via edit bursts and costed at the last-known model rate. Use @tokalator in chat for verified tracking.</div>';
          }

          // Token consumption summary
          html += '<div class="cost-grid" style="margin-bottom:6px">';
          html += '<span class="cost-label">Total input tokens</span><span class="cost-tok">'+ui.totalTurns+' turns</span><span class="cost-val">~'+fmt(ui.totalInputTokens || 0)+'</span>';
          html += '<span class="cost-label">Avg tokens/turn</span><span class="cost-tok"></span><span class="cost-val">~'+fmt(ui.avgInputTokens)+'</span>';
          if (ui.peakInputTokens > 0) html += '<span class="cost-label">Peak single turn</span><span class="cost-tok"></span><span class="cost-val">~'+fmt(ui.peakInputTokens)+'</span>';
          html += '<span class="cost-label">Total cost</span><span class="cost-tok">'+fmtC(ui.avgCostPerTurn)+'/turn</span><span class="cost-val">'+fmtC(ui.totalCost)+'</span>';
          html += '</div>';

          // Per-model breakdown with tokens + cost + turns
          if (ui.byModel.length > 0) {
            html += '<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px;margin-bottom:6px">';
            html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--desc-fg);margin-bottom:4px">By Model</div>';

            // Stacked bar: token distribution
            if (ui.byModel.length > 1) {
              var barColors = ['var(--accent)', 'var(--pro-red)', 'var(--low)', 'var(--medium)', '#bc8cff', '#8b949e'];
              html += '<div class="bar-wrap" style="margin-bottom:4px"><div style="display:flex;height:100%">';
              for (var bmi = 0; bmi < ui.byModel.length; bmi++) {
                var bm = ui.byModel[bmi];
                var bpct = Math.max(bm.percentOfTokens || bm.percentOfSpend, 2).toFixed(1);
                html += '<div style="width:'+bpct+'%;height:100%;background:'+barColors[bmi % barColors.length]+'" title="'+bm.label+': '+bpct+'% of tokens"></div>';
              }
              html += '</div></div>';
            }

            // Model table: name, provider, turns, tokens, cost, rate
            for (var bmi = 0; bmi < ui.byModel.length; bmi++) {
              var bm = ui.byModel[bmi];
              var bcolor = ui.byModel.length > 1 ? barColors[bmi % barColors.length] : 'var(--accent)';
              html += '<div style="padding:4px 0;'+(bmi<ui.byModel.length-1?'border-bottom:1px solid var(--border);':'')+'">';
              html += '<div style="display:flex;justify-content:space-between;align-items:center">';
              html += '<span style="font-size:11px;font-weight:600"><span style="color:'+bcolor+';margin-right:4px">&#9632;</span>'+bm.label+'</span>';
              html += '<span style="font-size:11px;font-weight:700">'+fmtC(bm.totalCost)+'</span>';
              html += '</div>';
              html += '<div class="cost-grid" style="margin-top:2px">';
              html += '<span class="cost-label">Turns</span><span class="cost-tok"></span><span class="cost-val">'+bm.turns+' ('+bm.percentOfSpend.toFixed(0)+'% spend)</span>';
              html += '<span class="cost-label">Tokens consumed</span><span class="cost-tok"></span><span class="cost-val">~'+fmt(bm.totalInputTokens || 0)+'</span>';
              html += '<span class="cost-label">Avg tokens/turn</span><span class="cost-tok"></span><span class="cost-val">~'+fmt(bm.avgInputTokens)+'</span>';
              html += '<span class="cost-label">Rate</span><span class="cost-tok">'+bm.avgCostPerTurn.toFixed(4)+'/turn</span><span class="cost-val">$'+(bm.inputCostPerMTok||0)+'/MTok</span>';
              html += '</div></div>';
            }
            html += '</div>';
          }

          // Model switch log (from modelUsageLog)
          if (usageLog.length > 1) {
            var switches = [];
            for (var si = 1; si < usageLog.length; si++) {
              if (usageLog[si].modelId !== usageLog[si-1].modelId) {
                switches.push({ from: usageLog[si-1].modelId, to: usageLog[si].modelId, at: usageLog[si].timestamp, source: usageLog[si].source });
              }
            }
            if (switches.length > 0) {
              html += '<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px;margin-bottom:6px">';
              html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--desc-fg);margin-bottom:4px">Model Switches ('+switches.length+')</div>';
              var recentSwitches = switches.slice(-5);
              for (var swi = 0; swi < recentSwitches.length; swi++) {
                var sw = recentSwitches[swi];
                var swAgo = Math.floor((Date.now() - sw.at) / 60000);
                var swAgoStr = swAgo < 60 ? swAgo+'m ago' : swAgo < 1440 ? Math.floor(swAgo/60)+'h ago' : Math.floor(swAgo/1440)+'d ago';
                var swSrc = sw.source === 'chat-api' ? 'auto' : sw.source === 'detected' ? 'detected' : 'manual';
                html += '<div style="font-size:10px;color:var(--fg);margin-bottom:2px">';
                html += '<span style="color:var(--desc-fg)">'+swAgoStr+'</span> ';
                html += sw.from+' &rarr; '+sw.to;
                html += ' <span style="color:var(--desc-fg)">('+swSrc+')</span>';
                html += '</div>';
              }
              html += '</div>';
            }
          }

          // Optimization tips (show all, not just savings > 0)
          if (ui.tips.length > 0) {
            html += '<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px;margin-bottom:6px">';
            html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--desc-fg);margin-bottom:4px">Optimization</div>';
            for (var ti = 0; ti < Math.min(ui.tips.length, 3); ti++) {
              var tip = ui.tips[ti];
              html += '<div style="font-size:10px;color:var(--fg);margin-bottom:4px;padding:3px 0">';
              html += '<span style="color:var(--low);font-weight:600">&#x25B6;</span> '+tip.message;
              if (tip.savingsEstimate > 0) html += ' <span style="color:var(--low);font-weight:600">Save ~'+fmtC(tip.savingsEstimate)+'</span>';
              html += '</div>';
            }
            html += '</div>';
          }

          // Daily trend (last 7 days) with tokens
          if (ui.dailyTrend.length > 1) {
            var maxDay = 0;
            var maxDayTok = 0;
            for (var dti = 0; dti < ui.dailyTrend.length; dti++) {
              if (ui.dailyTrend[dti].cost > maxDay) maxDay = ui.dailyTrend[dti].cost;
              if ((ui.dailyTrend[dti].tokens||0) > maxDayTok) maxDayTok = ui.dailyTrend[dti].tokens||0;
            }
            var last7 = ui.dailyTrend.slice(-7);
            html += '<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px">';
            html += '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--desc-fg);margin-bottom:3px">Daily Activity (last '+last7.length+' days)</div>';
            html += '<div style="display:flex;align-items:flex-end;gap:2px;height:28px">';
            for (var dti = 0; dti < last7.length; dti++) {
              var dpct = maxDay > 0 ? Math.max(8, Math.round((last7[dti].cost / maxDay) * 100)) : 8;
              html += '<div style="flex:1;height:'+dpct+'%;border-radius:2px 2px 0 0;background:var(--pro-red);opacity:'+(dti===last7.length-1?'1':'0.4')+'" title="'+last7[dti].date+': '+fmtC(last7[dti].cost)+', ~'+fmt(last7[dti].tokens||0)+' tok, '+last7[dti].turns+' turns"></div>';
            }
            html += '</div>';
            // Daily log table
            html += '<div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:1px 6px;font-size:10px;margin-top:4px">';
            for (var dti = last7.length - 1; dti >= 0; dti--) {
              var d = last7[dti];
              html += '<span style="color:var(--desc-fg)">'+d.date.slice(5)+'</span>';
              html += '<span>'+d.turns+' turns</span>';
              html += '<span style="text-align:right">~'+fmt(d.tokens||0)+'</span>';
              html += '<span style="text-align:right;font-weight:600">'+fmtC(d.cost)+'</span>';
            }
            html += '</div></div>';
          }

          html += '</div>';
        }

        // 10c. Price Watch (rate change alerts)
        var pw = s.priceWatchData;
        if (pw && pw.latest && pw.latest.changes.length > 0) {
          var pwBorder = pw.hasUnacked ? 'var(--medium)' : 'color-mix(in srgb, var(--pro-red) 40%, var(--border))';
          html += '<div class="card" style="border-color:'+pwBorder+'">';
          html += '<div class="card-title" style="color:var(--pro-red)">Price Watch';
          if (pw.hasUnacked) html += ' <span style="background:var(--medium);color:#000;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-left:4px">NEW</span>';
          html += '</div>';

          var inputCh = pw.latest.changes.filter(function(c) { return c.field === 'input'; });
          var otherCh = pw.latest.changes.filter(function(c) { return c.field !== 'input'; });

          if (inputCh.length > 0) {
            html += '<div style="display:grid;grid-template-columns:1fr auto auto;gap:1px 8px;font-size:11px;margin-bottom:6px">';
            for (var pwi = 0; pwi < inputCh.length; pwi++) {
              var pc = inputCh[pwi];
              var pdir = pc.pctChange > 0 ? '+' : '';
              var pcolor = pc.pctChange > 0 ? 'var(--high)' : 'var(--low)';
              html += '<span>'+pc.label+'</span>';
              html += '<span style="text-align:right;color:var(--desc-fg)">$'+pc.oldRate.toFixed(2)+' &rarr; $'+pc.newRate.toFixed(2)+'</span>';
              html += '<span style="text-align:right;font-weight:600;color:'+pcolor+'">'+pdir+pc.pctChange.toFixed(1)+'%</span>';
            }
            html += '</div>';
          }

          if (otherCh.length > 0) {
            html += '<div style="font-size:10px;color:var(--desc-fg);margin-bottom:4px">';
            html += otherCh.length + ' output/cached rate change(s)';
            html += '</div>';
          }

          if (pw.impact && pw.impact.affectedTurns > 0) {
            var idir = pw.impact.totalHistoricalDelta >= 0 ? '+' : '';
            var icolor = pw.impact.totalHistoricalDelta > 0 ? 'var(--high)' : 'var(--low)';
            html += '<div style="border-top:1px solid var(--border);padding-top:6px;margin-top:2px">';
            html += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
            html += '<span style="font-size:10px;color:var(--desc-fg)">Impact on '+pw.impact.affectedTurns+' turns</span>';
            html += '<span style="font-size:14px;font-weight:700;color:'+icolor+'">'+idir+'$'+Math.abs(pw.impact.totalHistoricalDelta).toFixed(4)+'</span>';
            html += '</div>';
            if (pw.impact.projectedMonthlyDelta !== 0) {
              var mdir = pw.impact.projectedMonthlyDelta >= 0 ? '+' : '';
              html += '<div style="font-size:10px;color:var(--desc-fg);text-align:right">Projected: '+mdir+'$'+Math.abs(pw.impact.projectedMonthlyDelta).toFixed(2)+'/mo</div>';
            }
            html += '</div>';
          }

          html += '<div class="pro-btn" data-action="pricewatch" style="margin-top:6px"><span class="pro-btn-icon">&#x1F4CA;</span><div class="pro-btn-info"><div class="pro-btn-name">Full Analysis</div><div class="pro-btn-desc">Open /pricewatch in chat</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
          html += '</div>';
        }

        // 11. Last session
        if (ls && ls.totalTurns > 0) {
          html += '<div class="card"><div class="card-title">Last Session <span style="float:right;font-weight:400">'+ago(ls.endedAt)+'</span></div>';
          html += '<span>'+ls.modelLabel+'</span> &middot; <span>'+ls.totalTurns+' turns</span> &middot; <span>peak '+fmt(ls.peakTokens)+'</span></div>';
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

        // 14. Enterprise panel (only when tier = enterprise)
        if (s.tierLabel === 'ENTERPRISE') {
          html += '<div class="pro-panel" style="border-color:#6366f1">';
          html += '<div class="pro-hdr"><span style="color:#6366f1">&#x2B21;</span><span class="pro-hdr-label">Enterprise</span></div>';
          html += '<div class="pro-btn" data-action="teamDashboard"><span class="pro-btn-icon">&#x1F4CA;</span><div class="pro-btn-info"><div class="pro-btn-name">Team Insights</div><div class="pro-btn-desc">Usage analytics and cost trends</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
          html += '<div class="pro-btn" data-action="skillsCatalog"><span class="pro-btn-icon">&#x1F4DA;</span><div class="pro-btn-info"><div class="pro-btn-name">Skills Catalog</div><div class="pro-btn-desc">Browse and publish shared skills</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
          html += '<div class="pro-btn" data-action="auditLog"><span class="pro-btn-icon">&#x1F4CB;</span><div class="pro-btn-info"><div class="pro-btn-name">Audit Trail</div><div class="pro-btn-desc">Team compliance and activity log</div></div><span class="pro-btn-arrow">&#8594;</span></div>';
          html += '</div>';
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
        case 'secure': vscode.postMessage({command:'secure'}); break;
        case 'terminologyGen': vscode.postMessage({command:'terminologyGen'}); break;
        case 'skillGen': vscode.postMessage({command:'skillGen'}); break;
        case 'settingsGen': vscode.postMessage({command:'settingsGen'}); break;
        case 'teamDashboard': vscode.postMessage({command:'teamDashboard'}); break;
        case 'skillsCatalog': vscode.postMessage({command:'skillsCatalog'}); break;
        case 'auditLog': vscode.postMessage({command:'auditLog'}); break;
        case 'pricewatch': vscode.postMessage({command:'pricewatch'}); break;
        case 'switchModel': vscode.postMessage({command:'switchModel',modelId:el.dataset.model}); break;
        case 'toggleCompare':
          var body = document.getElementById('cmpBody');
          var plus = document.getElementById('cmpPlus');
          if (body) { body.classList.toggle('open'); }
          if (plus) { plus.textContent = body && body.classList.contains('open') ? '\u2212' : '+'; }
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
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
