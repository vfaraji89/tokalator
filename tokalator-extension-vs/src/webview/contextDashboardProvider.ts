import * as path from 'path';
import * as fs from 'fs';
import { claudeCodeModelToSync } from '../core/modelSync.pure';
import { agentFromCommand, agentFromWebview } from '../core/agents/agentFocus.pure';
import { AGENT_EXTENSIONS, newlyUninstalled, visibleAgents } from '../core/agents/agentVisibility.pure';
import { claudeProjectsDir, encodeProjectDir } from '../core/claudeCodeTracker';
import type { AgentUsageTracker } from '../core/agents/agentTracker';
import type { AgentSummary } from '../core/agents/summary.pure';
import type { AgentId } from '../core/agents/types';

export interface CompanionBadge {
  label: string;
  detail?: string;
  tone?: 'neutral' | 'active' | 'warn';
  glyph?: 'people';
  command?: string;
}
import { randomBytes } from 'crypto';
import * as vscode from 'vscode';
import { ContextMonitor } from '../core/contextMonitor';
import type { ContextSnapshot } from '../core/types';
import { getCatalogMeta, onDidChangeCatalog } from '../core/catalogStore';
import { getFeaturedModels } from '../core/modelProfiles';
import type { PriceWatchService } from '../core/priceWatch';
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
  private readonly _configListener: vscode.Disposable;
  private readonly _extensionsListener: vscode.Disposable;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly monitor: ContextMonitor,
    private readonly claudeCode?: ClaudeCodeTracker,
    private readonly agents?: AgentUsageTracker,
    private readonly state?: vscode.Memento,
  ) {
    this.trackUninstalls();
    this._snapshotListener = this.monitor.onDidUpdateSnapshot(snapshot => {
      this.postSnapshot(snapshot);
    });
    this._catalogListener = onDidChangeCatalog(() => {
      const snapshot = this.monitor.getLatestSnapshot();
      if (snapshot) { this.postSnapshot(snapshot); }
    });
    this._extensionsListener = vscode.extensions.onDidChange(() => {
      this.trackUninstalls();
      const snapshot = this.monitor.getLatestSnapshot();
      if (snapshot) { this.postSnapshot(snapshot); }
    });
    this._configListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (!e.affectsConfiguration('tokalator.costDisplay') && !e.affectsConfiguration('tokalator.agents') && !e.affectsConfiguration('tokalator.claudeCode')) { return; }
      const snapshot = this.monitor.getLatestSnapshot();
      if (snapshot) { this.postSnapshot(snapshot); }
    });
  }

  private focus: { agent: AgentId; at: number } | null = null;
  private companionBadge: CompanionBadge | null = null;

  /** Lets a companion extension show one small labelled chip in the dashboard header. */
  setCompanionBadge(badge: CompanionBadge | null): void {
    this.companionBadge = badge && /^[A-Za-z0-9 .-]{1,16}$/.test(badge.label)
      ? { label: badge.label, detail: String(badge.detail ?? '').slice(0, 160), tone: badge.tone ?? 'neutral', glyph: badge.glyph === 'people' ? 'people' : undefined, command: badge.command && /^[A-Za-z][\w-]*\.[\w.-]+$/.test(badge.command) ? badge.command : undefined }
      : null;
    const snapshot = this.monitor.getLatestSnapshot();
    if (snapshot) this.postSnapshot(snapshot);
  }
  private readonly terminalAgents = new WeakMap<vscode.Terminal, AgentId>();
  private watchers: fs.FSWatcher[] = [];
  private watchTimer?: ReturnType<typeof setTimeout>;
  private readonly _focusListeners: vscode.Disposable[] = [
    vscode.window.tabGroups.onDidChangeTabs(() => this.checkTabFocus()),
    vscode.window.tabGroups.onDidChangeTabGroups(() => this.checkTabFocus()),
    vscode.window.onDidChangeActiveTerminal(t => { if (t) this.setFocus(this.terminalAgents.get(t) ?? agentFromCommand(t.name)); }),
    vscode.window.onDidStartTerminalShellExecution(e => {
      const agent = agentFromCommand(e.execution.commandLine.value);
      if (!agent) return;
      this.terminalAgents.set(e.terminal, agent);
      if (vscode.window.activeTerminal === e.terminal) this.setFocus(agent);
    }),
  ];

  private installedAgentExtensions(): Partial<Record<AgentId, boolean>> {
    return Object.fromEntries((Object.entries(AGENT_EXTENSIONS) as [AgentId, string][]).map(([id, ext]) => [id, !!vscode.extensions.getExtension(ext)]));
  }

  private trackUninstalls(): void {
    if (!this.state) return;
    const installed = this.installedAgentExtensions();
    const gone = newlyUninstalled(this.state.get<string[]>('tokalator.agentExtensions', []), installed);
    if (gone.length) {
      const removed = { ...this.state.get<Record<string, number>>('tokalator.agentUninstalledAt', {}) };
      for (const id of gone) removed[id] = Date.now();
      void this.state.update('tokalator.agentUninstalledAt', removed);
    }
    void this.state.update('tokalator.agentExtensions', Object.keys(installed).filter(id => installed[id as AgentId]));
  }

  private agentSummaries(): Partial<Record<AgentId, AgentSummary>> {
    const claude = this.claudeCode?.getSummary();
    return { ...(this.agents?.getSummaries() ?? {}), ...(claude ? { 'claude-code': claude } : {}) };
  }

  /** Agents that get a tab: installed, enabled, or used from a CLI since their extension was removed. */
  private visibleAgents(): AgentId[] {
    const cfg = vscode.workspace.getConfiguration('tokalator');
    const enabled: Record<AgentId, boolean> = {
      'claude-code': cfg.get<boolean>('claudeCode.enabled', true),
      'copilot-chat': cfg.get<boolean>('agents.copilot.enabled', true),
      'copilot-cli': cfg.get<boolean>('agents.copilot.enabled', true),
      codex: cfg.get<boolean>('agents.codex.enabled', true),
      opencode: false,
    };
    const summaries = this.agentSummaries();
    return visibleAgents({
      installed: this.installedAgentExtensions(),
      lastActivity: Object.fromEntries(Object.entries(summaries).map(([id, s]) => [id, s?.lastActivityAt ?? null])),
      uninstalledAt: this.state?.get<Record<string, number>>('tokalator.agentUninstalledAt', {}) ?? {},
      aiFeaturesDisabled: vscode.workspace.getConfiguration('chat').get<boolean>('disableAIFeatures', false),
    }).filter(id => enabled[id]);
  }

  private checkTabFocus(): void {
    const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    if (input instanceof vscode.TabInputWebview) this.setFocus(agentFromWebview(input.viewType));
    else if (input instanceof vscode.TabInputTerminal && vscode.window.activeTerminal) {
      this.setFocus(this.terminalAgents.get(vscode.window.activeTerminal) ?? agentFromCommand(vscode.window.activeTerminal.name));
    }
  }

  private setFocus(agent: AgentId | null): void {
    if (!agent || this.focus?.agent === agent) return;
    this.focus = { agent, at: Date.now() };
    const summary = agent === 'claude-code' ? this.claudeCode?.getSummary() : this.agents?.getSummaries()[agent];
    const modelId = summary?.session?.modelId;
    void (modelId ? this.monitor.setModel(modelId, agent) : Promise.resolve()).then(() => {
      const snapshot = this.monitor.getLatestSnapshot();
      if (snapshot) this.postSnapshot(snapshot);
    });
  }

  /** Re-reads usage shortly after any agent writes to its logs, instead of waiting for the 15-second poll. */
  private startWatchers(): void {
    this.stopWatchers();
    const claudeDirs = (vscode.workspace.workspaceFolders ?? []).map(f => path.join(claudeProjectsDir(), encodeProjectDir(f.uri.fsPath)));
    for (const dir of [...claudeDirs, ...(this.agents?.watchDirs() ?? [])]) {
      try {
        this.watchers.push(fs.watch(dir, { recursive: true, persistent: false }, () => {
          clearTimeout(this.watchTimer);
          this.watchTimer = setTimeout(() => this.syncClaudeCode(true), 700);
        }));
      } catch { /* folder does not exist yet */ }
    }
  }

  private stopWatchers(): void {
    for (const w of this.watchers) w.close();
    this.watchers = [];
    clearTimeout(this.watchTimer);
  }

  dispose(): void {
    this._focusListeners.forEach(d => d.dispose());
    this.stopWatchers();
    this._snapshotListener.dispose();
    this._catalogListener.dispose();
    this._configListener.dispose();
    this._extensionsListener.dispose();
    clearInterval(this.claudeCodeTimer);
  }

  private claudeCodeTimer?: ReturnType<typeof setInterval>;

  private syncClaudeCode(force = false): void {
    const tracker = this.claudeCode;
    if (!tracker || !this.view?.visible) { return; }
    const version = tracker.version;
    const agentsVersion = this.agents?.version ?? 0;
    void Promise.all([tracker.refresh(force), this.agents?.refresh(force)]).then(async () => {
      const visible = this.visibleAgents();
      const live = (Object.entries(this.agentSummaries()) as [AgentId, AgentSummary | undefined][])
        .filter((e): e is [AgentId, AgentSummary] => !!e[1]?.session && visible.includes(e[0]))
        .sort((a, b) => b[1].session!.lastAt.localeCompare(a[1].session!.lastAt))[0];
      const sync = live ? claudeCodeModelToSync(live[1].session, this.monitor.getActiveModel().id, this.monitor.getModelUsageLog().at(-1)?.timestamp, Date.now()) : null;
      if (sync && live) { await this.monitor.setModel(sync, live[0]); }
      const snapshot = this.monitor.getLatestSnapshot();
      if (tracker.version === version && (this.agents?.version ?? 0) === agentsVersion && !sync) { return; }
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
    this.startWatchers();

    // Clear reference when the webview is disposed (panel closed completely)
    webviewView.onDidDispose(() => {
      this.view = undefined;
      clearInterval(this.claudeCodeTimer);
      this.stopWatchers();
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

        case 'companionCommand': {
          if (this.companionBadge?.command) {
            await vscode.commands.executeCommand(this.companionBadge.command);
          }
          break;
        }

        case 'agentModel': {
          const summary = message.agent === 'claude-code' ? this.claudeCode?.getSummary() : this.agents?.getSummaries()[message.agent as AgentId];
          if (summary?.session?.modelId) {
            await this.monitor.setModel(summary.session.modelId, message.agent as AgentId);
          }
          break;
        }

        case 'setCostDisplay': {
          if (['dollars', 'tokens', 'both'].includes(message.mode)) {
            await vscode.workspace.getConfiguration('tokalator').update('costDisplay', message.mode, vscode.ConfigurationTarget.Global);
          }
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
    const agents = this.agents?.getSummaries() ?? {};
    const visibleAgentIds = this.visibleAgents();
    const security = this.security;
    const costDisplay = vscode.workspace.getConfiguration('tokalator').get<string>('costDisplay', 'dollars');
    this.view.webview.postMessage({ type: 'snapshot', data: { ...serialized, catalogMeta, modelUsageLog, usageInsights, priceWatchData, claudeCode, agents, visibleAgents: visibleAgentIds, focus: this.focus, companion: this.companionBadge, security, costDisplay }, lastSession });
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
    .hdr-companion { font-size: 9px; font-weight: 700; letter-spacing: 1px; padding: 1px 6px; border-radius: 8px; border: 1px solid var(--border); color: var(--desc-fg); }
    .hdr-companion[role="button"] { cursor: pointer; }
    .hdr-companion { display: inline-flex; align-items: center; gap: 3px; }
    .hdr-companion svg { width: 10px; height: 10px; fill: currentColor; }
    .hdr-companion.tone-active { color: var(--low); border-color: color-mix(in srgb, var(--low) 50%, var(--border)); background: color-mix(in srgb, var(--low) 12%, transparent); }
    .hdr-companion.tone-warn { color: var(--medium); border-color: color-mix(in srgb, var(--medium) 50%, var(--border)); }
    .hdr-badge { background: var(--brand-red); color: #fff; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 8px; letter-spacing: 1px; }
    .hdr-icon .rod { opacity: 0; animation: rodOut 0.5s ease 0.9s both; }
    .hdr-icon .bar { animation: barGrow 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    .hdr-icon .bar-1 { animation-delay: 0.35s; }
    .hdr-icon .bar-2 { animation-delay: 0.5s; }
    .hdr-icon .bar-3 { animation-delay: 0.65s; }
    .hdr-icon .dot { animation: beadIn 0.5s ease both; }
    .hdr-icon .hdr-fill { animation: meterFill 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 1s both; }
    .hdr-icon .hdr-meter { animation: fadeIn 0.4s ease 0.9s both; }
    .hdr-icon .cost { animation: fadeIn 0.4s ease 1.2s both; }
    @keyframes rodOut { from { opacity: 0.8; } to { opacity: 0; } }
    @keyframes barGrow { from { width: 1.5px; fill: #e3120b; } }
    @keyframes beadIn { from { fill: #e3120b; } }
    @keyframes meterFill { from { width: 0; } }
    @keyframes fadeIn { from { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .hdr-icon * { animation: none !important; } }

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
    .agent-tabs { display: flex; gap: 2px; margin: -2px 0 6px; border-bottom: 1px solid var(--border); overflow-x: auto; }
    .agent-tabs button { background: none; border: 0; border-bottom: 2px solid transparent; color: var(--desc-fg); font: inherit; font-size: 10px; padding: 3px 6px; cursor: pointer; white-space: nowrap; }
    .agent-tabs button[aria-selected="true"] { color: var(--fg, inherit); border-bottom-color: var(--accent); font-weight: 600; }
    .cc-title { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
    .seg { display: inline-flex; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; flex-shrink: 0; }
    .seg button { background: none; border: 0; color: var(--desc-fg); font: inherit; font-size: 9px; letter-spacing: 0; text-transform: none; padding: 2px 6px; cursor: pointer; }
    .seg button[aria-pressed="true"] { background: var(--accent); color: var(--vscode-button-foreground, #fff); }
    .seg button:focus-visible { outline: 1px solid var(--accent); outline-offset: -1px; }

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
    function tokTotal(u) { return u.inputTokens + u.outputTokens + u.cacheReadTokens + u.cacheWriteTokens; }
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
          var q = Math.min(Math.max((now - t0) / 450, 0), 1);
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
        var mid = s.modelId || '', models = s.models || [], ce = s.costEstimate, detected = s.detectedModels || [], usageLog = s.modelUsageLog || [], cd = s.costDisplay || 'dollars';
        var bd = s.budgetBreakdown, diag = s.diagnosticsSummary || {errors:0};
        var tl = s.tokenizerLabel || '', wfc = s.workspaceFileCount || 0, wft = s.workspaceFileTokens || 0;
        var th = 0.3, rel = t.filter(function(x){return x.relevanceScore>=th||x.isActive||x.isPinned;});
        var dist = t.filter(function(x){return x.relevanceScore<th&&!x.isActive&&!x.isPinned;});

        var html = '<!--k:hdr--><div class="hdr"><span class="hdr-icon" title="Tokalator">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<rect width="24" height="24" rx="5" fill="#0a0a0b"/>' +
          '<rect x="3" y="1.5" width="18" height="21" rx="3" fill="#ffffff"/>' +
          '<rect class="rod" x="4.5" y="9.5" width="15" height="0.5" fill="#5a3a30"/>' +
          '<rect class="rod" x="4.5" y="12.5" width="15" height="0.5" fill="#5a3a30"/>' +
          '<rect class="rod" x="4.5" y="15.5" width="15" height="0.5" fill="#5a3a30"/>' +
          '<rect class="hdr-meter" x="4.5" y="3" width="15" height="4.5" rx="1.5" fill="#cfe9d6"/>' +
          '<rect class="hdr-fill" x="6" y="4.5" width="7.5" height="1.5" rx="0.75" fill="#00a544"/>' +
          '<circle class="dot" cx="5.25" cy="9.75" r="0.9" fill="#00a544"/>' +
          '<rect class="bar bar-1" x="7.5" y="9" width="12" height="1.5" rx="0.75" fill="#00a544"/>' +
          '<circle class="dot" cx="5.25" cy="12.75" r="0.9" fill="#00a544"/>' +
          '<rect class="bar bar-2" x="7.5" y="12" width="9" height="1.5" rx="0.75" fill="#00a544"/>' +
          '<circle class="dot" cx="5.25" cy="15.75" r="0.9" fill="#d4a017"/>' +
          '<rect class="bar bar-3" x="7.5" y="15" width="4.5" height="1.5" rx="0.75" fill="#d4a017"/>' +
          '<rect class="cost" x="4.5" y="18" width="15" height="3" rx="1.5" fill="#e3120b"/>' +
          '</svg></span><span class="hdr-title">Tokalator</span><span class="hdr-badge">OPEN SOURCE</span>' + (s.companion ? '<span class="hdr-companion tone-'+esc(s.companion.tone)+'"'+(s.companion.command ? ' role="button" tabindex="0" data-action="companion"' : '')+' title="'+esc(s.companion.detail || '')+'">'+(s.companion.glyph === 'people' ? '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5.5" cy="5.5" r="2.2"/><circle cx="10.5" cy="5.5" r="2.2"/><path d="M1.5 13c.4-2.6 2-4 4-4s3.6 1.4 4 4zM6.5 13c.4-2.6 2-4 4-4s3.6 1.4 4 4z"/></svg>' : '')+esc(s.companion.label)+'</span>' : '') + '</div>';

        // 1. Budget meter
        var mLabel = '';
        var mProvider = '';
        for (var mi = 0; mi < models.length; mi++) { if (models[mi].id === mid) { mLabel = models[mi].label; mProvider = models[mi].provider; break; } }
        var usedPct = cap > 0 ? Math.min((tot / cap) * 100, 100) : 0;
        html += '<!--k:meter--><div class="meter '+bl+'" title="'+usedPct.toFixed(1)+'% of the context window"><div class="meter-row"><span class="meter-level">'+bl.toUpperCase()+'</span><span class="meter-tokens">~'+num('tot', tot, 'tok')+' / '+fmt(cap)+'</span></div><div class="meter-bar"><div class="meter-fill" data-w-id="meter" data-w="'+usedPct.toFixed(2)+'"></div></div></div>';

        // 1b. Active Model card
        var lastSwitch = null;
        for (var ul = usageLog.length - 1; ul >= 0; ul--) {
          if (usageLog[ul].modelId === mid) { lastSwitch = usageLog[ul]; break; }
        }
        var SOURCE_LABELS = { 'claude-code': 'Synced from Claude Code', 'copilot-chat': 'Synced from Copilot Chat', 'copilot-cli': 'Synced from Copilot CLI', 'codex': 'Synced from Codex', 'opencode': 'Synced from OpenCode', 'chat-api': 'Synced from @tokalator chat', 'detected': 'Detected in Copilot Chat', 'available-lms': 'Detected in Copilot Chat' };
        var synced = lastSwitch && SOURCE_LABELS[lastSwitch.source];
        var sourceLabel = synced || 'Set via Settings';
        var sourceColor = synced ? 'var(--low)' : 'var(--desc-fg)';
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
        if (!synced) {
          html += '<div style="font-size:9px;color:var(--desc-fg);margin-top:4px;border-top:1px solid var(--border);padding-top:4px">Syncs automatically from Claude Code or @tokalator chat</div>';
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
        var AGENT_LABELS = { 'claude-code': 'Claude Code', 'copilot-chat': 'Copilot Chat', 'copilot-cli': 'Copilot CLI', 'codex': 'Codex', 'opencode': 'OpenCode' };
        var agentList = (s.visibleAgents || []).map(function(id){
          return { id: id, sum: (id === 'claude-code' ? s.claudeCode : (s.agents || {})[id]) || null };
        });
        var byRecent = agentList.filter(function(a){ return a.sum && a.sum.lastActivityAt; }).sort(function(a, b){ return String(b.sum.lastActivityAt).localeCompare(String(a.sum.lastActivityAt)); });
        if (!byRecent.length) byRecent = agentList.slice();
        if (s.focus && s.focus.at > (prefs.agentAt || 0) && agentList.some(function(a){ return a.id === s.focus.agent; })) { prefs.agent = s.focus.agent; prefs.agentAt = s.focus.at; vscode.setState(prefs); }
        if (prefs.agent && byRecent[0] && byRecent[0].sum && byRecent[0].id !== prefs.agent && Date.parse(byRecent[0].sum.lastActivityAt || '') > (prefs.agentAt || 0)) { prefs.agent = null; vscode.setState(prefs); }
        var selAgent = agentList.filter(function(a){ return a.id === prefs.agent; })[0] || byRecent[0] || null;
        var cc = selAgent ? selAgent.sum : null;
        var agentName = selAgent ? AGENT_LABELS[selAgent.id] || selAgent.id : 'Claude Code';
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
          html += '<div class="card-title" style="color:var(--accent)">Turn Analytics <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(from '+ccs.turnCount+' '+esc(agentName)+' turns)</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Context now</span><span class="usage-stat-val">~'+num('ccCtx', ccs.contextTokens, 'tok')+(ccs.contextWindow ? ' / '+fmt(ccs.contextWindow)+' ('+ctxPct.toFixed(1)+'%)' : '')+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Growth per turn</span><span class="usage-stat-val">~'+fmt(ccs.avgGrowthPerTurn)+'</span></div>';
          html += '<div class="usage-stat"><span class="usage-stat-label">Turns remaining</span><span class="usage-stat-val">'+(ccs.turnsLeft == null ? 'n/a' : '~'+ccs.turnsLeft)+'</span></div>';
          var perTurnTok = tokTotal(ccs) / ccs.turnCount;
          html += cd === 'dollars'
            ? '<div class="usage-stat"><span class="usage-stat-label">Avg API-equivalent cost per turn</span><span class="usage-stat-val">'+fmtC(ccs.cost / ccs.turnCount)+'</span></div>'
            : '<div class="usage-stat"><span class="usage-stat-label">Avg tokens per turn</span><span class="usage-stat-val">~'+fmt(perTurnTok)+(cd === 'both' ? ' <span style="color:var(--desc-fg);font-weight:400">('+fmtC(ccs.cost / ccs.turnCount)+')</span>' : '')+'</span></div>';
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
          html += '<div class="card-title" style="color:var(--low)">'+(cd === 'tokens' ? 'Turn Size' : 'Turn Cost')+' <span style="font-weight:400;font-size:10px;color:var(--desc-fg)">(input only)</span></div>';
          if (lt) {
            html += cd === 'tokens'
              ? '<div class="usage-highlight">~'+num('lastTurnTok', lt.inputTokens, 'tok')+' <span style="font-size:10px;font-weight:500;color:var(--desc-fg)">tokens</span></div>'
              : '<div class="usage-highlight">'+num('lastTurn', lt.effectiveCost, 'usd')+'</div>';
            html += '<div class="usage-sub">last turn: ~'+fmt(lt.inputTokens)+' input tokens</div>';
          }
          html += '<div class="cost-grid">';
          if (cd === 'tokens') {
            html += '<span class="cost-label">Avg per turn</span><span class="cost-tok">'+ui.totalTurns+' turns</span><span class="cost-val">~'+fmt(ui.avgInputTokens)+'</span>';
            html += '<span class="cost-label">Total input</span><span class="cost-tok"></span><span class="cost-val">~'+fmt(ui.avgInputTokens * ui.totalTurns)+'</span>';
          } else {
            html += '<span class="cost-label">Avg cost/turn</span><span class="cost-tok">~'+fmt(ui.avgInputTokens)+'</span><span class="cost-val">'+fmtC(ui.avgCostPerTurn)+'</span>';
            html += '<span class="cost-label">Total spend</span><span class="cost-tok">'+ui.totalTurns+' turns</span><span class="cost-val">'+num('totalSpend', ui.totalCost, 'usd')+'</span>';
          }
          html += '</div>';
          if (ce && cd !== 'tokens') {
            html += '<div class="cost-rate">Rate: '+fmtR(ce.inputCostPerMTok)+'/MTok input</div>';
          }
          html += '<div class="cost-rate">Estimated from what is open in the editor. Agent usage below is read from each agent&apos;s own logs.</div>';
          html += '</div>';
        }

        // 5. Claude Code usage observed from local session logs
        if (selAgent) {
          var isLive = cc && cc.lastActivityAt && Date.now() - Date.parse(cc.lastActivityAt) < 120000;
          html += '<!--k:cc--><div class="card" style="border-color:color-mix(in srgb, var(--brand-red) 35%, var(--border))">';
          if (agentList.length > 1) {
            html += '<div class="agent-tabs" role="tablist" aria-label="Coding agent">'+agentList.map(function(a){ return '<button role="tab" data-action="agentTab" data-agent="'+esc(a.id)+'" aria-selected="'+(a === selAgent)+'">'+esc(AGENT_LABELS[a.id] || a.id)+'</button>'; }).join('')+'</div>';
          }
          html += '<div class="card-title cc-title"><span>'+esc(agentName)+(isLive ? '<span class="live" title="Active session; updates automatically"></span>' : '')+' <span style="font-weight:400;font-size:10px;text-transform:none">'+(cc && cc.lastActivityAt ? 'observed &middot; '+ago(cc.lastActivityAt) : 'installed')+'</span></span>';
          html += '<span class="seg" role="group" aria-label="Show usage as">'+[['dollars','$'],['tokens','Tokens'],['both','Both']].map(function(o){ return '<button data-action="costDisplay" data-mode="'+o[0]+'" aria-pressed="'+(cd === o[0])+'" title="'+(o[0] === 'tokens' ? 'For Pro, Max and Team subscriptions' : o[0] === 'dollars' ? 'API-equivalent dollars' : 'Tokens with API-equivalent dollars')+'">'+o[1]+'</button>'; }).join('')+'</span></div>';
          if (!cc || cc.week.messages === 0) {
            html += '<div style="font-size:11px;color:var(--desc-fg)">No '+esc(agentName)+' activity in this workspace in the last 7 days. It appears here automatically when you use it.</div>';
          } else {
            var todayTok = tokTotal(cc.today), weekTok = tokTotal(cc.week);
            if (cd === 'dollars') {
              html += '<div class="usage-highlight" title="What these tokens would cost at API list prices. Pro, Max and Team subscriptions are not billed per token.">'+num('ccToday', cc.today.cost, 'usd')+' <span style="font-size:10px;font-weight:500;color:var(--desc-fg)">API-equivalent</span></div>';
              html += '<div class="usage-sub">today &middot; '+num('ccTurns', cc.todayTurns, 'int')+' turns &middot; '+cc.today.messages+' requests &middot; '+num('ccWeek', cc.week.cost, 'usd')+' in 7 days</div>';
            } else {
              html += '<div class="usage-highlight">'+num('ccTodayTok', todayTok, 'tok')+' <span style="font-size:10px;font-weight:500;color:var(--desc-fg)">tokens today</span></div>';
              if (cd === 'both') html += '<div class="usage-sub" title="What these tokens would cost at API list prices">&asymp; '+num('ccToday', cc.today.cost, 'usd')+' API-equivalent</div>';
              html += '<div class="usage-sub">'+num('ccTurns', cc.todayTurns, 'int')+' turns &middot; '+cc.today.messages+' requests &middot; '+fmt(weekTok)+' tokens in 7 days</div>';
              var winCap = (cc.session && cc.session.contextWindow) || cap;
              if (winCap > 0 && todayTok > 0) html += '<div class="usage-sub">&asymp; '+(todayTok / winCap).toFixed(1)+' full context windows today'+(selAgent.id === 'copilot-chat' ? '' : ' &middot; '+Math.round(cc.cacheHitRate*100)+'% served from cache')+'</div>';
            }
            if (cc.session) {
              html += '<div class="cost-grid">';
              html += '<span class="cost-label">Last session</span><span class="cost-tok">'+esc(cc.session.model)+'</span><span class="cost-val">'+(cd === 'tokens' ? fmt(tokTotal(cc.session)) : num('ccSession', cc.session.cost, 'usd'))+'</span>';
              html += '<span class="cost-label">Input / output</span><span class="cost-tok">'+fmt(cc.session.inputTokens)+'</span><span class="cost-val">'+fmt(cc.session.outputTokens)+'</span>';
              html += '<span class="cost-label">Cache read / write</span><span class="cost-tok">'+fmt(cc.session.cacheReadTokens)+'</span><span class="cost-val">'+fmt(cc.session.cacheWriteTokens)+'</span>';
              html += '</div>';
            }
            if (selAgent && selAgent.id === 'copilot-chat') html += '<div class="cost-rate">VS Code records the final prompt size of each request, so multi-step agent requests may use more input than shown.</div>';
            if (cc.estimatedShare > 0) html += '<div class="cost-rate" title="'+esc(agentName)+' did not record token counts for these requests; Tokalator estimated them from text length">'+Math.round(cc.estimatedShare*100)+'% of requests estimated, the rest are exact</div>';
            var split = (selAgent && selAgent.id === 'claude-code' ? cc.byEntrypoint || [] : []).map(function(e){ return esc(e.label)+' '+(cd === 'tokens' ? e.messages+' requests' : fmtC(e.cost)); }).join(' &middot; ');
            html += '<div class="cost-rate">'+(selAgent.id === 'copilot-chat' ? 'Copilot does not record cache use' : 'Cache hit '+Math.round(cc.cacheHitRate*100)+'% (7 days)')+(split ? ' &middot; '+split : '')+'</div>';
            html += '<div class="cost-rate">'+(cd === 'tokens' ? 'Showing tokens. Subscription plans are not billed per token.' : 'API list prices; subscription plans are not billed per token.')+'</div>';
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
        case 'costDisplay': vscode.postMessage({command:'setCostDisplay',mode:el.dataset.mode}); break;
        case 'companion': vscode.postMessage({command:'companionCommand'}); break;
        case 'agentTab': prefs.agent = el.dataset.agent; prefs.agentAt = Date.now(); vscode.setState(prefs); vscode.postMessage({command:'agentModel',agent:el.dataset.agent}); if (lastData) render(lastData, lastSes); break;
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var el = e.target.closest('[data-action]');
      if (!el || el.tagName === 'BUTTON' || el.tagName === 'A' || el !== e.target) return;
      e.preventDefault();
      el.click();
    });

    var lastSes = null, lastData = null;
    window.addEventListener('message', function(e) {
      if (e.data.type === 'snapshot') {
        if (e.data.lastSession) lastSes = e.data.lastSession;
        lastData = e.data.data;
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
