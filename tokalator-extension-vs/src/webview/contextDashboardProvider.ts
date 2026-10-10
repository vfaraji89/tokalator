import { randomBytes } from 'crypto';
import * as vscode from 'vscode';
import { ContextMonitor } from '../core/contextMonitor';
import type { ContextSnapshot } from '../core/types';
import { getCatalogMeta, onDidChangeCatalog } from '../core/catalogStore';
import { getFeaturedModels } from '../core/modelProfiles';
import type { PriceWatchService, RateChangeset, PriceWatchImpact } from '../core/priceWatch';
import type { ClaudeCodeTracker } from '../core/claudeCodeTracker';
import type { Telemetry } from '../core/telemetry';
import { WorkspaceSecurityScanner, type SecurityAuditResult } from '../core/workspaceSecurityScanner';

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
    private readonly claudeCode?: ClaudeCodeTracker,
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
    clearInterval(this.claudeCodeTimer);
  }

  private claudeCodeTimer?: ReturnType<typeof setInterval>;

  private syncClaudeCode(): void {
    const tracker = this.claudeCode;
    if (!tracker || !this.view?.visible) { return; }
    const version = tracker.version;
    void tracker.refresh().then(() => {
      const snapshot = this.monitor.getLatestSnapshot();
      if (tracker.version === version) { return; }
      const cc = tracker.getSummary();
      if (cc) {
        this.telemetry?.recordClaudeCode({
          turns: cc.todayTurns,
          requests: cc.today.messages,
          sessions: cc.today.sessions,
          cacheHitRate: cc.cacheHitRate,
          clients: Object.fromEntries(cc.byEntrypoint.map(e => [e.label, e.messages])),
        });
      }
      if (snapshot) { this.postSnapshot(snapshot); }
    });
  }

  private priceWatch: PriceWatchService | null = null;
  setPriceWatch(pw: PriceWatchService): void { this.priceWatch = pw; }

  private telemetry: Telemetry | null = null;
  setTelemetry(t: Telemetry): void { this.telemetry = t; }

  private security: { found: number; uncovered: number; level: string } | null = null;
  setSecurity(audit: SecurityAuditResult): void {
    this.security = { found: audit.foundSecrets.length, uncovered: audit.uncovered, level: audit.level };
    const snapshot = this.monitor.getLatestSnapshot();
    if (snapshot) { this.postSnapshot(snapshot); }
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

    void new WorkspaceSecurityScanner().audit().then(a => this.setSecurity(a)).catch(() => undefined);
    clearInterval(this.claudeCodeTimer);
    this.claudeCodeTimer = setInterval(() => this.syncClaudeCode(), 15_000);
    this.claudeCodeTimer.unref?.();

    // Clear reference when the webview is disposed (panel closed completely)
    webviewView.onDidDispose(() => {
      this.view = undefined;
      clearInterval(this.claudeCodeTimer);
    });

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (typeof message.command === 'string') this.telemetry?.count('dash:' + message.command);
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

        case 'codeMaps': {
          await vscode.commands.executeCommand('tokalator.codeMaps');
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
    const claudeCode = this.claudeCode?.getSummary() ?? null;
    const security = this.security;
    this.view.webview.postMessage({ type: 'snapshot', data: { ...serialized, catalogMeta, modelUsageLog, usageInsights, priceWatchData, claudeCode, security }, lastSession });
    this.syncClaudeCode();
    } catch (err) {
      console.error('Tokalator: postSnapshot failed', err);
    }
  }

  getHtml(_webview: vscode.Webview): string {
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
      --brand-red: #e3120b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--fg); background: var(--bg); padding: 10px; }

    .hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .hdr-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .hdr-icon svg { width: 100%; height: 100%; }
    .hdr-title { font-weight: 700; font-size: 13px; }
    .hdr-badge { background: var(--brand-red); color: #fff; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 8px; letter-spacing: 1px; }
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
    @keyframes beadToKey { from { x: var(--bx); y: var(--by); width: 2.4px; height: 2.4px; rx: 1.2px; opacity: 0.9; } }
    @keyframes rodOut { from { opacity: 0.55; } to { opacity: 0; } }
    @keyframes screenIn { from { opacity: 0; } }
    .hdr-icon .calc-rod { opacity: 0; animation: rodOut 0.5s ease 0.45s both; }
    .hdr-icon .calc-btn { animation-name: beadToKey, btnPress; animation-duration: 0.7s, 0.35s; animation-timing-function: cubic-bezier(0.2, 0.7, 0.2, 1), ease; animation-fill-mode: both, both; }
    .hdr-icon .btn-1 { animation-delay: 0.3s, 1.1s; }
    .hdr-icon .btn-2 { animation-delay: 0.33s, 1.35s; }
    .hdr-icon .btn-3 { animation-delay: 0.36s, 1.6s; }
    .hdr-icon .btn-4 { animation-delay: 0.39s, 1.85s; }
    .hdr-icon .btn-5 { animation-delay: 0.42s, 2.1s; }
    .hdr-icon .btn-6 { animation-delay: 0.45s, 2.35s; }
    .hdr-icon .btn-7 { animation-delay: 0.48s, 2.6s; }
    .hdr-icon .btn-8 { animation-delay: 0.51s, 2.85s; }
    .hdr-icon .btn-eq { animation-delay: 0.54s, 3.1s; animation-duration: 0.7s, 0.5s; }
    .hdr-icon .calc-screen { animation: screenIn 0.4s ease 0.8s both, screenGlow 3s ease 3.3s both; }

    .meter { padding: 8px; border-radius: 6px; margin-bottom: 8px; }
    .meter-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .meter-bar { height: 4px; border-radius: 2px; margin-top: 6px; background: color-mix(in srgb, currentColor 15%, transparent); overflow: hidden; }
    .meter-fill { height: 100%; border-radius: 2px; background: currentColor; width: 0; transition: width 0.6s cubic-bezier(0.2, 0.7, 0.2, 1); }
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
    .bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.2, 0.7, 0.2, 1); }

    .sec { margin-bottom: 8px; border-top: 1px solid var(--border); padding-top: 8px; }
    .sec-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--desc-fg); margin-bottom: 6px; }

    .tools-panel { border: 1px solid color-mix(in srgb, var(--brand-red) 40%, var(--border)); border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .tools-hdr { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
    .tools-hdr-label { font-weight: 700; font-size: 11px; color: var(--brand-red); text-transform: uppercase; letter-spacing: 0.5px; }
    .tools-btn { display: flex; align-items: center; gap: 6px; padding: 5px 7px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); cursor: pointer; margin-bottom: 4px; transition: border-color 0.15s; }
    .tools-btn:last-child { margin-bottom: 0; }
    .tools-btn:hover { border-color: var(--brand-red); }
    .tools-btn-icon { font-size: 13px; flex-shrink: 0; }
    .tools-btn-info { flex: 1; min-width: 0; }
    .tools-btn-name { font-size: 11px; font-weight: 600; color: var(--fg); }
    .tools-btn-desc { font-size: 9px; color: var(--desc-fg); }
    .tools-btn-arrow { font-size: 11px; color: var(--desc-fg); }

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

    .blk.enter { animation: rise 0.32s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .num { font-variant-numeric: tabular-nums; }
    .sec-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; background: none; border: none; color: var(--desc-fg); cursor: pointer; padding: 0; font-family: inherit; }
    .sec-toggle:hover { color: var(--fg); }
    .chev { width: 6px; height: 6px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(45deg); transition: transform 0.2s; margin-right: 2px; }
    .collapsed .chev { transform: rotate(-45deg); }
    .sec-body { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.25s ease; }
    .sec-body > div { overflow: hidden; }
    .collapsed .sec-body { grid-template-rows: 0fr; }
    .tools-btn, .act-btn, .detect-chip, .tab-item { transition: transform 0.12s, border-color 0.15s, background 0.15s; }
    .tools-btn:hover .tools-btn-arrow { transform: translateX(2px); color: var(--brand-red); }
    .tools-btn-arrow { transition: transform 0.15s, color 0.15s; }
    .tools-btn:active, .act-btn:active, .detect-chip:active { transform: scale(0.98); }
    .tab-btns button { opacity: 0.55; transition: opacity 0.15s; }
    .tab-item:hover .tab-btns button, .tab-item:focus-within .tab-btns button { opacity: 1; }
    :focus-visible { outline: 1px solid var(--accent); outline-offset: 1px; }
    .live { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--low); margin-left: 4px; vertical-align: middle; animation: live 2s ease-in-out infinite; }
    @keyframes live { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    .toast { position: fixed; left: 50%; bottom: 10px; transform: translate(-50%, 8px); background: var(--btn-bg); color: var(--btn-fg); font-size: 11px; padding: 5px 10px; border-radius: 6px; opacity: 0; pointer-events: none; transition: opacity 0.2s, transform 0.2s; max-width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .toast.show { opacity: 1; transform: translate(-50%, 0); }
    .skel { height: 14px; border-radius: 4px; margin-bottom: 8px; background: linear-gradient(90deg, var(--card-bg) 25%, color-mix(in srgb, var(--fg) 8%, transparent) 50%, var(--card-bg) 75%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
    .skel.tall { height: 54px; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
    .catalog-foot { font-size: 10px; color: var(--desc-fg); margin-top: 8px; text-align: center; }
    .catalog-foot a { color: var(--link-fg); }
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
  <div id="app" aria-live="polite"><div class="skel" style="width:40%"></div><div class="skel tall"></div><div class="skel tall"></div><div class="skel"></div><div class="skel" style="width:70%"></div></div>
  <div id="toast" class="toast" role="status"></div>
  <script nonce="${nonce}">
    var vscode = acquireVsCodeApi();
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    var app = document.getElementById('app');
    function fmt(n) { if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return ''+n; }
    function fmtR(n) { return '$' + (+(+n).toFixed(3)); }
    function fmtC(n) { if (n < 0.001) return '<$0.001'; if (n < 0.01) return '$'+n.toFixed(4); if (n < 1) return '$'+n.toFixed(3); return '$'+n.toFixed(2); }
    function ago(iso) { var m=Math.floor((Date.now()-new Date(iso).getTime())/60000); if(m<1) return 'just now'; if(m<60) return m+'m ago'; var h=Math.floor(m/60); if(h<24) return h+'h ago'; return Math.floor(h/24)+'d ago'; }
    function rc(s) { return s >= 0.6 ? 'hi' : s >= 0.3 ? 'md' : 'lo'; }
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var prefs = vscode.getState() || { collapsed: {} };
    var booted = false, lastNum = {}, lastW = {}, toastTimer = 0;
    function fmtBy(f, v) { return f === 'usd' ? fmtC(v) : f === 'int' ? String(Math.round(v)) : fmt(Math.round(v)); }
    function num(id, v, f) { return '<span class="num" data-id="'+id+'" data-v="'+v+'" data-f="'+f+'">'+fmtBy(f, v)+'</span>'; }
    function bar(id, w, color) { return '<div class="bar-fill" data-w-id="'+id+'" data-w="'+w+'" style="background:'+color+'"></div>'; }
    function fold(key, title, body) {
      var c = prefs.collapsed[key];
      return '<div class="sec'+(c ? ' collapsed' : '')+'"><button class="sec-title sec-toggle" data-toggle="'+key+'" aria-expanded="'+(c ? 'false' : 'true')+'"><span>'+title+'</span><span class="chev"></span></button><div class="sec-body"><div>'+body+'</div></div></div>';
    }
    function sections(html) {
      var out = [], parts = html.split('<!--k:');
      for (var i = 1; i < parts.length; i++) { var j = parts[i].indexOf('-->'); out.push({ k: parts[i].slice(0, j), h: parts[i].slice(j + 3) }); }
      return out;
    }
    function patch(list) {
      var keep = {}, prev = null;
      for (var i = 0; i < list.length; i++) {
        var p = list[i], el = null;
        keep[p.k] = true;
        for (var c = app.firstElementChild; c; c = c.nextElementSibling) { if (c.dataset.k === p.k) { el = c; break; } }
        if (!el) {
          el = document.createElement('div');
          el.dataset.k = p.k;
          el.className = 'blk enter';
          if (!booted) el.style.animationDelay = (i * 35) + 'ms';
          el.innerHTML = p.h;
          el._h = p.h;
        } else if (el._h !== p.h) {
          el.innerHTML = p.h;
          el._h = p.h;
        }
        var ref = prev ? prev.nextElementSibling : app.firstElementChild;
        if (ref !== el) app.insertBefore(el, ref);
        prev = el;
      }
      for (var n = app.firstElementChild; n;) { var nx = n.nextElementSibling; if (!n.dataset.k || !keep[n.dataset.k]) app.removeChild(n); n = nx; }
      booted = true;
      app.querySelectorAll('[data-w-id]').forEach(function(el) {
        var id = el.dataset.wId, w = el.dataset.w;
        if (el._w === w) return;
        el._w = w;
        el.style.width = (still ? w : (lastW[id] || 0)) + '%';
        lastW[id] = w;
        if (!still) requestAnimationFrame(function() { requestAnimationFrame(function() { el.style.width = w + '%'; }); });
      });
      app.querySelectorAll('[data-id]').forEach(function(el) {
        var id = el.dataset.id, v = +el.dataset.v, f = el.dataset.f, from = lastNum[id];
        lastNum[id] = v;
        if (still || from === undefined || from === v || el._n === v) return;
        el._n = v;
        var t0 = performance.now();
        (function step(now) {
          var q = Math.min((now - t0) / 450, 1);
          el.textContent = fmtBy(f, from + (v - from) * (1 - Math.pow(1 - q, 3)));
          if (q < 1) requestAnimationFrame(step);
        })(t0);
      });
    }
    function toast(msg) {
      var el = document.getElementById('toast');
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { el.classList.remove('show'); }, 1800);
    }

    function render(s, ls) {
      try {
        var t = s.tabs || [], bl = s.budgetLevel || 'low', tot = s.totalEstimatedTokens || 0, cap = s.windowCapacity || 200000;
        var turns = s.chatTurnCount || 0, pins = (s.pinnedFiles || []).length, reasons = s.healthReasons || [];
        var mid = s.modelId || '', models = s.models || [], ce = s.costEstimate, detected = s.detectedModels || [], usageLog = s.modelUsageLog || [];
        var bd = s.budgetBreakdown, diag = s.diagnosticsSummary || {errors:0};
        var tl = s.tokenizerLabel || '', wfc = s.workspaceFileCount || 0, wft = s.workspaceFileTokens || 0;
        var th = 0.3, rel = t.filter(function(x){return x.relevanceScore>=th||x.isActive||x.isPinned;});
        var dist = t.filter(function(x){return x.relevanceScore<th&&!x.isActive&&!x.isPinned;});

        var html = '<!--k:hdr--><div class="hdr"><span class="hdr-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="var(--fg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="2" width="18" height="20" rx="2"/>' +
          '<rect class="calc-rod" x="4.5" y="7" width="15" height="0.6" fill="var(--fg)" stroke="none"/>' +
          '<rect class="calc-rod" x="4.5" y="12" width="15" height="0.6" fill="var(--fg)" stroke="none"/>' +
          '<rect class="calc-rod" x="4.5" y="17" width="15" height="0.6" fill="var(--fg)" stroke="none"/>' +
          '<rect class="calc-screen" x="5.5" y="4.5" width="13" height="4" rx="1" fill="var(--accent)" opacity="0.35" stroke="none"/>' +
          '<rect class="calc-btn btn-1" style="--bx:5.5px;--by:5.8px" x="5.5" y="10.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-2" style="--bx:8.3px;--by:5.8px" x="9.5" y="10.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-3" style="--bx:11.1px;--by:5.8px" x="13.5" y="10.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-4" style="--bx:5.5px;--by:10.8px" x="5.5" y="13.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-5" style="--bx:8.3px;--by:10.8px" x="9.5" y="13.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-6" style="--bx:11.1px;--by:10.8px" x="13.5" y="13.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-7" style="--bx:5.5px;--by:15.8px" x="5.5" y="16.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-8" style="--bx:8.3px;--by:15.8px" x="9.5" y="16.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.25" stroke="none"/>' +
          '<rect class="calc-btn btn-eq" style="--bx:11.1px;--by:15.8px" x="13.5" y="16.5" width="3" height="2" rx="0.5" fill="var(--brand-red)" opacity="0.45" stroke="none"/>' +
          '</svg></span><span class="hdr-title">Tokalator</span><span class="hdr-badge">OPEN SOURCE</span></div>';

        // 1. Budget meter
        var mLabel = '';
        var mProvider = '';
        for (var mi = 0; mi < models.length; mi++) { if (models[mi].id === mid) { mLabel = models[mi].label; mProvider = models[mi].provider; break; } }
        var usedPct = cap > 0 ? Math.min((tot / cap) * 100, 100) : 0;
        html += '<!--k:meter--><div class="meter '+bl+'" title="'+usedPct.toFixed(1)+'% of the context window"><div class="meter-row"><span class="meter-level">'+bl.toUpperCase()+'</span><span class="meter-tokens">~'+num('tot', tot, 'tok')+' / '+fmt(cap)+'</span></div><div class="meter-bar"><div class="meter-fill" data-w-id="meter" data-w="'+usedPct.toFixed(2)+'"></div></div></div>';

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
        html += '<!--k:model--><div class="card" style="border-color:color-mix(in srgb, var(--accent) 50%, var(--border))">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center">';
        html += '<div><div style="font-size:13px;font-weight:700">'+esc(mLabel||mid)+'</div>';
        html += '<div style="font-size:10px;color:var(--desc-fg)">'+providerLabel+' &middot; '+fmt(cap)+' context</div></div>';
        html += '<div style="text-align:right"><div style="font-size:10px;color:'+sourceColor+'">'+sourceLabel+'</div>';
        if (ce) html += '<div style="font-size:10px;color:var(--desc-fg)">'+fmtR(ce.inputCostPerMTok)+' / '+fmtR(ce.outputCostPerMTok)+' per MTok</div>';
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
              html += '<span class="detect-chip" role="button" tabindex="0" data-action="switchModel" data-model="'+esc(om)+'">'+esc(omLabel)+'</span>';
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
        html += '<!--k:pills--><div class="pills">';
        html += '<span class="pill">'+t.length+' open</span>';
        html += '<span class="pill">'+pins+' pinned</span>';
        html += '<span class="pill">'+turns+' turns</span>';
        if (wfc > 0) html += '<span class="pill">'+wfc+' in project</span>';
        if (diag.errors > 0) html += '<span class="pill">'+diag.errors+' errors</span>';
        if (tl) html += '<span class="pill" style="color:var(--accent)">'+esc(tl)+'</span>';
        html += '</div>';

        // 3. Turn Analytics (log-based, replaces hardcoded estimates)
        var ui = s.usageInsights;
        var cc = s.claudeCode;
        var ccs = cc && cc.session && cc.session.turnCount > 0 ? cc.session : null;
        html += '<!--k:turns-->';
        if (ui && ui.totalTurns >= 1) {
          var avgPerTurn = ui.avgInputTokens;
          var th = s.turnHistory || [];
          var growth = th.length >= 2 ? Math.max(0, Math.round((th[th.length-1].inputTokens - th[0].inputTokens) / (th.length - 1))) : 0;
          var outRes = (bd && bd.outputReservation) ? bd.outputReservation : 4000;
          var rem = Math.max(cap - tot - outRes, 0);
          var pctAfterNext = Math.min(((tot + growth) / cap) * 100, 100).toFixed(1);
          var warn = pctAfterNext >= 90 ? 'High risk of overflow' : pctAfterNext >= 75 ? 'Approaching limit' : '';
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--accent)">Turn Analytics <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(from '+ui.totalTurns+' logged turns)</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Avg input/turn</span><span class="usage-stat-val">~'+fmt(avgPerTurn)+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Growth per turn</span><span class="usage-stat-val">'+(growth ? '~'+fmt(growth) : 'n/a')+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Next turn estimate</span><span class="usage-stat-val">~'+fmt(tot + growth)+' ('+pctAfterNext+'%)</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Turns remaining</span><span class="usage-stat-val">'+(growth ? '~'+Math.floor(rem / growth) : 'n/a')+'</span></div>';
          if (warn) html += '<div style="color:var(--medium);font-weight:600;margin-top:4px;font-size:11px">'+warn+'</div>';
          html += '</div>';
        } else if (ccs) {
          var ctxPct = ccs.contextWindow > 0 ? Math.min((ccs.contextTokens / ccs.contextWindow) * 100, 100) : 0;
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--accent)">Turn Analytics <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(from '+ccs.turnCount+' Claude Code turns)</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Context now</span><span class="usage-stat-val">~'+num('ccCtx', ccs.contextTokens, 'tok')+(ccs.contextWindow ? ' / '+fmt(ccs.contextWindow)+' ('+ctxPct.toFixed(1)+'%)' : '')+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Growth per turn</span><span class="usage-stat-val">~'+fmt(ccs.avgGrowthPerTurn)+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Turns remaining</span><span class="usage-stat-val">'+(ccs.turnsLeft == null ? 'n/a' : '~'+ccs.turnsLeft)+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Avg API-equivalent cost per turn</span><span class="usage-stat-val">'+fmtC(ccs.cost / ccs.turnCount)+'</span></div>';
          if (ctxPct >= 75) html += '<div style="color:var(--medium);font-weight:600;margin-top:4px;font-size:11px">'+(ctxPct >= 90 ? 'High risk of overflow' : 'Approaching limit')+'</div>';
          html += '</div>';
        } else {
          html += '<div class="card" style="border-color:color-mix(in srgb, var(--accent) 40%, var(--border))">';
          html += '<div class="card-title" style="color:var(--accent)">Turn Analytics</div>';
          html += '<div style="font-size:11px;color:var(--desc-fg)">Chat with @tokalator or Claude Code in this workspace to start tracking turns.</div>';
          html += '</div>';
        }

        // 4. Actual Turn Cost (log-based, input-only since output tokens are not observable via VS Code API)
        if (ui && ui.totalTurns >= 1) {
          var lt = ui.lastTurn;
          html += '<!--k:cost--><div class="card" style="border-color:color-mix(in srgb, var(--low) 30%, var(--border))">';
          html += '<div class="card-title" style="color:var(--low)">Turn Cost <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(input only)</span></div>';
          if (lt) {
            html += '<div class="usage-highlight">'+num('lastTurn', lt.effectiveCost, 'usd')+'</div>';
            html += '<div class="usage-sub">last turn: ~'+fmt(lt.inputTokens)+' input tokens</div>';
          }
          html += '<div class="cost-grid">';
          html += '<span class="cost-label">Avg cost/turn</span><span class="cost-tok">~'+fmt(ui.avgInputTokens)+'</span><span class="cost-val">'+fmtC(ui.avgCostPerTurn)+'</span>';
          html += '<span class="cost-label">Total spend</span><span class="cost-tok">'+ui.totalTurns+' turns</span><span class="cost-val">'+num('totalSpend', ui.totalCost, 'usd')+'</span>';
          html += '</div>';
          if (ce) {
            html += '<div class="cost-rate">Rate: '+fmtR(ce.inputCostPerMTok)+'/MTok input</div>';
          }
          html += '<div class="cost-rate" title="VS Code does not expose Copilot token usage to other extensions">Copilot and other chat models: input-only estimate. Claude Code usage is observed from its logs.</div>';
          html += '</div>';
        }

        // 5. Claude Code usage observed from local session logs
        if (cc) {
          var isLive = cc.lastActivityAt && Date.now() - Date.parse(cc.lastActivityAt) < 120000;
          html += '<!--k:cc--><div class="card" style="border-color:color-mix(in srgb, var(--brand-red) 35%, var(--border))">';
          html += '<div class="card-title">Claude Code'+(isLive ? '<span class="live" title="Active session; updates automatically"></span>' : '')+' <span style="font-weight:400;font-size:10px;text-transform:none">observed'+(cc.lastActivityAt ? ' &middot; '+ago(cc.lastActivityAt) : '')+'</span></div>';
          if (cc.week.messages === 0) {
            html += '<div style="font-size:11px;color:var(--desc-fg)">No Claude Code activity for this workspace in the last 7 days.</div>';
          } else {
            html += '<div class="usage-highlight" title="What these tokens would cost at API list prices. Pro, Max and Team subscriptions are not billed per token.">'+num('ccToday', cc.today.cost, 'usd')+' <span style="font-size:10px;font-weight:500;color:var(--desc-fg)">API-equivalent</span></div>';
            html += '<div class="usage-sub">today &middot; '+num('ccTurns', cc.todayTurns, 'int')+' turns &middot; '+cc.today.messages+' requests &middot; '+num('ccWeek', cc.week.cost, 'usd')+' in 7 days</div>';
            if (cc.session) {
              html += '<div class="cost-grid">';
              html += '<span class="cost-label">Last session</span><span class="cost-tok">'+esc(cc.session.model)+'</span><span class="cost-val">'+num('ccSession', cc.session.cost, 'usd')+'</span>';
              html += '<span class="cost-label">Input / output</span><span class="cost-tok">'+fmt(cc.session.inputTokens)+'</span><span class="cost-val">'+fmt(cc.session.outputTokens)+'</span>';
              html += '<span class="cost-label">Cache read / write</span><span class="cost-tok">'+fmt(cc.session.cacheReadTokens)+'</span><span class="cost-val">'+fmt(cc.session.cacheWriteTokens)+'</span>';
              html += '</div>';
            }
            var split = (cc.byEntrypoint || []).map(function(e){ return esc(e.label)+' '+fmtC(e.cost); }).join(' &middot; ');
            html += '<div class="cost-rate">Cache hit '+Math.round(cc.cacheHitRate*100)+'% (7 days)'+(split ? ' &middot; '+split : '')+'</div>';
            html += '<div class="cost-rate">API list prices; subscription plans are not billed per token.</div>';
            if (cc.week.unpricedMessages > 0) html += '<div class="cost-rate">'+cc.week.unpricedMessages+' requests on unpriced models: '+esc(cc.week.unpricedModels.join(', '))+'</div>';
          }
          html += '</div>';
        }

        // 6. Workspace tools
        html += '<!--k:tools--><div class="tools-panel">';
        html += '<div class="tools-hdr"><span class="tools-hdr-label">Workspace tools</span></div>';
        var sec = s.security;
        var secDesc = !sec ? 'Protect secrets from AI agents' : sec.found === 0 ? 'No secret files found' : sec.uncovered === 0 ? 'All ' + sec.found + ' secret files covered' : sec.uncovered + ' of ' + sec.found + ' secret files not covered';
        var secColor = !sec ? '' : sec.found === 0 || sec.uncovered === 0 ? 'color:var(--low)' : 'color:var(--medium)';
        html += '<div class="tools-btn" role="button" tabindex="0" data-action="secure"><div class="tools-btn-info"><div class="tools-btn-name">Secure Workspace</div><div class="tools-btn-desc" style="'+secColor+'">'+esc(secDesc)+'</div></div><span class="tools-btn-arrow">&#8594;</span></div>';
        html += '<div class="tools-btn" role="button" tabindex="0" data-action="skillGen"><div class="tools-btn-info"><div class="tools-btn-name">Generate SKILL.md</div><div class="tools-btn-desc">Package domain expertise for agents</div></div><span class="tools-btn-arrow">&#8594;</span></div>';
        html += '<div class="tools-btn" role="button" tabindex="0" data-action="settingsGen"><div class="tools-btn-info"><div class="tools-btn-name">Generate AI Settings</div><div class="tools-btn-desc">GitHub + VS Code agent configs</div></div><span class="tools-btn-arrow">&#8594;</span></div>';
        html += '<div class="tools-btn" role="button" tabindex="0" data-action="codeMaps"><div class="tools-btn-info"><div class="tools-btn-name">Code Maps</div><div class="tools-btn-desc">GLOSSARY.md and SITE-MAP.md for agents</div></div><span class="tools-btn-arrow">&#8594;</span></div>';
        html += '<div class="tools-btn" role="button" tabindex="0" data-action="pricewatch"><div class="tools-btn-info"><div class="tools-btn-name">Price Watch</div><div class="tools-btn-desc">Rate changes and their impact on your usage</div></div><span class="tools-btn-arrow">&#8594;</span></div>';
        html += '</div>';

        // 7. Budget breakdown
        if (bd) {
          var total = tot || 1;
          var fp = Math.round((bd.files/total)*100), sp = Math.round(((bd.systemPrompt+bd.instructions)/total)*100);
          var cp = Math.round((bd.conversation/total)*100), op = Math.round((bd.outputReservation/total)*100);
          var bdBody = '<div style="display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:11px">';
          bdBody += '<span>Files</span><span style="text-align:right">~'+fmt(bd.files)+'</span>';
          bdBody += '<span>System</span><span style="text-align:right">~'+fmt(bd.systemPrompt)+'</span>';
          bdBody += '<span>Instructions</span><span style="text-align:right">~'+fmt(bd.instructions)+'</span>';
          bdBody += '<span>Conversation</span><span style="text-align:right">~'+fmt(bd.conversation)+'</span>';
          bdBody += '<span>Output reserve</span><span style="text-align:right">~'+fmt(bd.outputReservation)+'</span>';
          bdBody += '</div>';
          bdBody += '<div class="bar-wrap"><div style="display:flex;height:100%">'+bar('bdFiles', fp, 'var(--accent)')+bar('bdSys', sp, '#bc8cff')+bar('bdConv', cp, 'var(--medium)')+bar('bdOut', op, '#8b949e')+'</div></div>';
          html += '<!--k:budget-->'+fold('budget', 'Budget Breakdown', bdBody);
        }

        // 8. File list
        var filesBody = '<ul class="tab-list">';
        if (rel.length === 0) { filesBody += '<li class="empty">No files open</li>'; }
        else { for (var j = 0; j < rel.length; j++) filesBody += tabHtml(rel[j]); }
        html += '<!--k:files-->'+fold('files', 'Files ('+rel.length+')', filesBody+'</ul>');

        // 9. Low relevance
        if (dist.length > 0) {
          var lowBody = '<ul class="tab-list">';
          for (var k = 0; k < dist.length; k++) lowBody += tabHtml(dist[k]);
          lowBody += '</ul><button class="act-btn" data-action="optimize">Close '+dist.length+' Low-Relevance Tabs</button>';
          html += '<!--k:low-->'+fold('low', 'Low Relevance ('+dist.length+')', lowBody);
        }

        // 11. Last session
        if (ls && ls.totalTurns > 0) {
          html += '<!--k:last--><div class="card"><div class="card-title">Last Session <span style="float:right;font-weight:400">'+ago(ls.endedAt)+'</span></div>';
          html += '<span>'+esc(ls.modelLabel)+'</span> &middot; <span>'+ls.totalTurns+' turns</span> &middot; <span>peak '+fmt(ls.peakTokens)+'</span></div>';
        }

        // 12. Health notes
        if (reasons.length > 0) {
          html += '<!--k:health--><ul style="font-size:11px;margin-top:6px;padding-left:16px">';
          for (var r = 0; r < reasons.length; r++) html += '<li style="margin-bottom:3px">'+esc(reasons[r])+'</li>';
          html += '</ul>';
        }

        // 13. Context growth
        var hist = s.turnHistory && s.turnHistory.length > 0 ? s.turnHistory
          : ccs ? ccs.turns.filter(function(x){ return x.contextTokens > 0; }).map(function(x){ return { turn: x.turn, inputTokens: x.contextTokens }; }) : [];
        if (ccs && !(s.turnHistory && s.turnHistory.length > 0) && ccs.contextWindow) cap = ccs.contextWindow;
        if (hist.length > 0) {
          var gMax = Math.max.apply(null, hist.map(function(x){ return x.inputTokens; })) || 1;
          var gBody = '<div style="display:flex;align-items:flex-end;gap:2px;height:32px;margin-bottom:4px" title="Bar height relative to the largest turn; peak is '+(gMax / cap * 100).toFixed(1)+'% of the window">';
          for (var i = 0; i < hist.length; i++) {
            var pct = Math.max(6, Math.round((hist[i].inputTokens/gMax)*100));
            gBody += '<div style="flex:1;min-width:3px;height:'+pct+'%;border-radius:2px 2px 0 0;background:var(--accent);opacity:'+(i===hist.length-1?'1':'0.5')+'" title="T'+hist[i].turn+': ~'+fmt(hist[i].inputTokens)+'"></div>';
          }
          gBody += '</div>';
          gBody += '<div style="display:flex;justify-content:space-between;font-size:10px"><span>T1: ~'+fmt(hist[0].inputTokens)+'</span><span>T'+hist[hist.length-1].turn+': ~'+fmt(hist[hist.length-1].inputTokens)+'</span></div>';
          if (hist.length >= 2) gBody += '<div style="font-size:11px;color:var(--medium);font-weight:500;margin-top:2px">+'+fmt(Math.round((hist[hist.length-1].inputTokens-hist[0].inputTokens)/(hist.length-1)))+'/turn avg</div>';
          html += '<!--k:growth-->'+fold('growth', 'Context Growth ('+hist.length+' turns'+(s.turnHistory && s.turnHistory.length > 0 ? '' : ', Claude Code')+')', gBody);
        }

        if (turns > 0) html += '<!--k:reset--><button class="act-btn sec-btn" data-action="resetTurns">Reset Turn Counter</button>';

        var cm = s.catalogMeta;
        if (cm) {
          html += '<!--k:foot--><div class="catalog-foot">Prices '+esc(String(cm.updatedAt).slice(0,10))+' ('+(cm.source === 'remote' ? 'synced' : 'bundled')+')'+(cm.lastFetchError ? ' &middot; sync failed' : '')+' &middot; <a href="#" data-action="refreshPricing">Refresh</a></div>';
        }

        patch(sections(html));
      } catch (e) {
        booted = false;
        app.innerHTML = '<div class="err">Render error: ' + esc(e.message) + '</div>';
      }
    }

    function tabHtml(t) {
      var u = encodeURIComponent(t.uri);
      var pin = t.isPinned
        ? '<button title="Unpin" data-action="unpin" data-uri="'+u+'">&#9679;</button>'
        : '<button title="Pin" data-action="pin" data-uri="'+u+'">&#9675;</button>';
      var cls = !t.isActive ? '<button title="Close" data-action="closeTab" data-uri="'+u+'">&#x2715;</button>' : '';
      return '<li class="tab-item" role="button" tabindex="0" aria-label="Open '+esc(t.label)+'" data-action="openFile" data-uri="'+u+'"><div class="tab-dot '+rc(t.relevanceScore)+'"></div><span class="tab-name'+(t.isActive?' active':'')+'">'+esc(t.label)+(t.isDirty?' &bull;':'')+'</span><span class="tab-tok">~'+fmt(t.estimatedTokens)+'</span><div class="tab-btns">'+pin+cls+'</div></li>';
    }

    document.addEventListener('click', function(e) {
      var tg = e.target.closest('[data-toggle]');
      if (tg) {
        var key = tg.dataset.toggle, sec = tg.parentElement;
        prefs.collapsed[key] = !prefs.collapsed[key];
        sec.classList.toggle('collapsed', prefs.collapsed[key]);
        tg.setAttribute('aria-expanded', prefs.collapsed[key] ? 'false' : 'true');
        vscode.setState(prefs);
        return;
      }
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var a = el.dataset.action, u = el.dataset.uri ? decodeURIComponent(el.dataset.uri) : undefined;
      switch (a) {
        case 'openFile': vscode.postMessage({command:'openFile',uri:u}); break;
        case 'pin': vscode.postMessage({command:'pin',uri:u}); toast('Pinned'); break;
        case 'unpin': vscode.postMessage({command:'unpin',uri:u}); toast('Unpinned'); break;
        case 'closeTab': vscode.postMessage({command:'closeTab',uri:u}); toast('Tab closed'); break;
        case 'optimize': vscode.postMessage({command:'optimize'}); toast('Closing low-relevance tabs'); break;
        case 'resetTurns': vscode.postMessage({command:'resetTurns'}); toast('Turn counter reset'); break;
        case 'refreshPricing': e.preventDefault(); vscode.postMessage({command:'refreshPricing'}); toast('Refreshing prices'); break;
        case 'secure': vscode.postMessage({command:'secure'}); break;
        case 'skillGen': vscode.postMessage({command:'skillGen'}); break;
        case 'settingsGen': vscode.postMessage({command:'settingsGen'}); break;
        case 'pricewatch': vscode.postMessage({command:'pricewatch'}); break;
        case 'codeMaps': vscode.postMessage({command:'codeMaps'}); toast('Generating code maps'); break;
        case 'switchModel': vscode.postMessage({command:'switchModel',modelId:el.dataset.model}); toast('Switched to ' + el.textContent); break;
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var el = e.target.closest('[data-action]');
      if (!el || el.tagName === 'BUTTON' || el.tagName === 'A' || el !== e.target) return;
      e.preventDefault();
      el.click();
    });

    var lastSes = null;
    window.addEventListener('message', function(e) {
      if (e.data.type === 'snapshot') {
        if (e.data.lastSession) lastSes = e.data.lastSession;
        render(e.data.data, lastSes);
      }
    });

  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  return randomBytes(16).toString('hex');
}
