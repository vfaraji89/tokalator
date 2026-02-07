import * as vscode from 'vscode';
import { TabInfo, ContextSnapshot } from './types';
import { TabRelevanceScorer } from './tabRelevanceScorer';
import { TokenBudgetEstimator } from './tokenBudgetEstimator';

const PINNED_FILES_KEY = 'tokalator.pinnedFiles';

/**
 * Core engine that tracks all editor state and produces real-time ContextSnapshots.
 *
 * Subscribes to:
 *  - Active editor changes
 *  - Tab open/close events
 *  - Text document changes
 *  - Diagnostics changes
 *
 * Emits:
 *  - onDidUpdateSnapshot: fires with a fresh ContextSnapshot after each state change
 */
export class ContextMonitor implements vscode.Disposable {

  private readonly _onDidUpdateSnapshot = new vscode.EventEmitter<ContextSnapshot>();
  readonly onDidUpdateSnapshot = this._onDidUpdateSnapshot.event;

  private readonly scorer = new TabRelevanceScorer();
  private readonly estimator = new TokenBudgetEstimator();

  private pinnedFiles = new Set<string>();
  private chatTurnCount = 0;
  private lastEditTimestamps = new Map<string, number>();
  private disposables: vscode.Disposable[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  private latestSnapshot: ContextSnapshot | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private isRefreshing = false;

  constructor(private readonly workspaceState?: vscode.Memento) {
    // Load persisted pinned files
    if (workspaceState) {
      const saved = workspaceState.get<string[]>(PINNED_FILES_KEY, []);
      this.pinnedFiles = new Set(saved);
    }

    // Debounced refresh to avoid perf issues from rapid event firing
    const debouncedRefresh = () => {
      if (this.debounceTimer) { clearTimeout(this.debounceTimer); }
      this.debounceTimer = setTimeout(() => this.refresh(), 300);
    };

    // Subscribe to VS Code events
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => debouncedRefresh()),
      vscode.window.onDidChangeTextEditorSelection(() => debouncedRefresh()),
      vscode.window.tabGroups.onDidChangeTabs(() => debouncedRefresh()),
      vscode.workspace.onDidChangeTextDocument(e => {
        this.lastEditTimestamps.set(e.document.uri.toString(), Date.now());
        debouncedRefresh();
      }),
      vscode.workspace.onDidOpenTextDocument(() => debouncedRefresh()),
      // Clean up caches when documents close (memory leak fix)
      vscode.workspace.onDidCloseTextDocument(doc => {
        const uri = doc.uri.toString();
        this.lastEditTimestamps.delete(uri);
        this.estimator.clearCacheFor(uri);
        debouncedRefresh();
      }),
      vscode.languages.onDidChangeDiagnostics(() => debouncedRefresh()),
    );

    // Periodic refresh for time-based scoring (recency decay)
    const config = vscode.workspace.getConfiguration('tokalator');
    const interval = config.get<number>('autoRefreshInterval', 2000);
    this.refreshTimer = setInterval(() => this.refresh(), interval);

    // Initial snapshot
    this.refresh();
  }

  /**
   * Build a fresh snapshot and emit it.
   */
  async refresh(): Promise<void> {
    if (this.isRefreshing) { return; }
    this.isRefreshing = true;
    try {
      const snapshot = await this.buildSnapshot();
      this.latestSnapshot = snapshot;
      this._onDidUpdateSnapshot.fire(snapshot);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get the most recent snapshot without triggering a refresh.
   */
  getLatestSnapshot(): ContextSnapshot | null {
    return this.latestSnapshot;
  }

  /**
   * Pin a file URI so it's always scored as maximum relevance.
   */
  pinFile(uri: string): void {
    this.pinnedFiles.add(uri);
    this.persistPins();
    this.refresh();
  }

  /**
   * Unpin a file.
   */
  unpinFile(uri: string): void {
    this.pinnedFiles.delete(uri);
    this.persistPins();
    this.refresh();
  }

  /**
   * Clear all pins.
   */
  clearPins(): void {
    this.pinnedFiles.clear();
    this.persistPins();
    this.refresh();
  }

  /**
   * Persist pinned files to workspace state.
   */
  private persistPins(): void {
    if (this.workspaceState) {
      this.workspaceState.update(PINNED_FILES_KEY, Array.from(this.pinnedFiles));
    }
  }

  /**
   * Increment the conversation turn counter.
   * Only call this for actual user interactions, not status checks.
   */
  incrementChatTurns(): void {
    this.chatTurnCount++;
    this.refresh();
  }

  /**
   * Reset conversation turn counter (on /clear or new conversation).
   */
  resetChatTurns(): void {
    this.chatTurnCount = 0;
    this.refresh();
  }

  /**
   * Get current chat turn count.
   */
  getChatTurnCount(): number {
    return this.chatTurnCount;
  }

  /**
   * Close tabs below relevance threshold.
   * Returns the list of closed tab labels.
   */
  async optimizeTabs(): Promise<string[]> {
    const config = vscode.workspace.getConfiguration('tokalator');
    const threshold = config.get<number>('relevanceThreshold', 0.3);

    const snapshot = await this.buildSnapshot();
    const toClose = snapshot.tabs.filter(
      t => t.relevanceScore < threshold && !t.isActive && !t.isPinned
    );

    const closed: string[] = [];
    for (const tab of toClose) {
      const allTabs = vscode.window.tabGroups.all.flatMap(g => g.tabs);
      const vsTab = allTabs.find(t => {
        if (t.input instanceof vscode.TabInputText) {
          return t.input.uri.toString() === tab.uri.toString();
        }
        return false;
      });
      if (vsTab) {
        await vscode.window.tabGroups.close(vsTab);
        closed.push(tab.label);
      }
    }

    return closed;
  }

  /**
   * Build the full context snapshot.
   */
  private async buildSnapshot(): Promise<ContextSnapshot> {
    const config = vscode.workspace.getConfiguration('tokalator');
    const windowCapacity = config.get<number>('windowSize', 1000000);
    const rotWarning = config.get<number>('contextRotWarningTurns', 20);

    // 1. Gather all open tabs
    let tabs = this.gatherTabs();

    // 2. Estimate tokens for each tab
    tabs = await this.estimator.estimateAllTabs(tabs);

    // 3. Score relevance
    tabs = this.scorer.scoreAll(tabs, vscode.window.activeTextEditor);

    // 4. Sort by relevance (highest first)
    tabs.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 5. Gather diagnostics summary
    const diagnosticsSummary = this.gatherDiagnosticsSummary();

    // 6. Count instruction files in workspace
    const instructionFiles = await this.countInstructionFiles();

    // 7. Compute budget
    const budget = this.estimator.computeBudget(
      tabs,
      this.chatTurnCount,
      instructionFiles,
      windowCapacity
    );

    // 8. Determine budget level (simplified from percentage)
    let budgetLevel: 'low' | 'medium' | 'high';
    if (budget.percent > 85) {
      budgetLevel = 'high';
    } else if (budget.percent > 60) {
      budgetLevel = 'medium';
    } else {
      budgetLevel = 'low';
    }

    // 9. Determine health and reasons
    const healthReasons: string[] = [];
    let contextHealth: ContextSnapshot['contextHealth'] = 'healthy';

    if (budgetLevel === 'high') {
      contextHealth = 'critical';
      healthReasons.push('Token budget is high — context overflow risk');
    } else if (budgetLevel === 'medium') {
      contextHealth = 'warning';
      healthReasons.push('Token budget is medium — consider closing unused tabs');
    }

    if (this.chatTurnCount >= rotWarning) {
      contextHealth = contextHealth === 'critical' ? 'critical' : 'warning';
      healthReasons.push(`${this.chatTurnCount} chat turns — context may be stale`);
    }

    const distractors = tabs.filter(t => {
      const threshold = config.get<number>('relevanceThreshold', 0.3);
      return t.relevanceScore < threshold && !t.isActive && !t.isPinned;
    });
    if (distractors.length > 3) {
      contextHealth = contextHealth === 'critical' ? 'critical' : 'warning';
      healthReasons.push(`${distractors.length} low-relevance tabs open`);
    }

    if (healthReasons.length === 0) {
      healthReasons.push('Token budget looks good');
    }

    const activeFile = tabs.find(t => t.isActive) || null;

    return {
      timestamp: Date.now(),
      activeFile,
      tabs,
      pinnedFiles: this.pinnedFiles,
      totalEstimatedTokens: budget.used,
      windowCapacity,
      usagePercent: budget.percent,
      budgetLevel,
      diagnosticsSummary,
      chatTurnCount: this.chatTurnCount,
      contextHealth,
      healthReasons,
    };
  }

  /**
   * Gather TabInfo from all open tab groups.
   */
  private gatherTabs(): TabInfo[] {
    const tabs: TabInfo[] = [];
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        if (!(tab.input instanceof vscode.TabInputText)) { continue; }

        const uri = tab.input.uri;
        const fsPath = uri.fsPath;
        const relativePath = workspaceRoot
          ? fsPath.replace(workspaceRoot, '').replace(/^\//, '')
          : fsPath;

        // Get language ID from open documents
        const openDoc = vscode.workspace.textDocuments.find(
          d => d.uri.toString() === uri.toString()
        );
        const languageId = openDoc?.languageId || this.guessLanguage(fsPath);

        // Get diagnostics for this file
        const diagnostics = vscode.languages.getDiagnostics(uri);
        const diagnosticCount = diagnostics.length;

        // Get last edit timestamp
        const lastEdit = this.lastEditTimestamps.get(uri.toString()) || 0;

        tabs.push({
          uri,
          label: tab.label,
          languageId,
          relativePath,
          estimatedTokens: 0,   // filled later by estimator
          relevanceScore: 0,     // filled later by scorer
          relevanceReason: '',
          isActive: tab.isActive,
          isDirty: tab.isDirty,
          isPinned: this.pinnedFiles.has(uri.toString()),
          diagnosticCount,
          lastEditTimestamp: lastEdit,
        });
      }
    }

    return tabs;
  }

  /**
   * Aggregate diagnostics across all open files.
   */
  private gatherDiagnosticsSummary(): { errors: number; warnings: number; info: number } {
    const allDiags = vscode.languages.getDiagnostics();
    let errors = 0, warnings = 0, info = 0;

    for (const [, diags] of allDiags) {
      for (const d of diags) {
        switch (d.severity) {
          case vscode.DiagnosticSeverity.Error: errors++; break;
          case vscode.DiagnosticSeverity.Warning: warnings++; break;
          default: info++; break;
        }
      }
    }

    return { errors, warnings, info };
  }

  /**
   * Count .instructions.md files in the workspace (they consume context budget).
   */
  private async countInstructionFiles(): Promise<number> {
    try {
      const files = await vscode.workspace.findFiles('**/*.instructions.md', '**/node_modules/**', 20);
      // Also count .github/copilot-instructions.md
      const copilotInstr = await vscode.workspace.findFiles('.github/copilot-instructions.md', undefined, 1);
      return files.length + copilotInstr.length;
    } catch {
      return 0;
    }
  }

  /**
   * Guess language from file extension.
   */
  private guessLanguage(fsPath: string): string {
    const ext = fsPath.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
      py: 'python', go: 'go', rs: 'rust', java: 'java', rb: 'ruby',
      md: 'markdown', json: 'json', yml: 'yaml', yaml: 'yaml',
      css: 'css', html: 'html', sh: 'shellscript', sql: 'sql',
    };
    return map[ext] || ext;
  }

  dispose(): void {
    if (this.refreshTimer) { clearInterval(this.refreshTimer); }
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); }
    this._onDidUpdateSnapshot.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
