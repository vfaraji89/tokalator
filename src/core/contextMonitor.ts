import * as vscode from 'vscode';
import { TabInfo, ContextSnapshot, TurnSnapshot, SessionSummary } from './types';
import { TabRelevanceScorer } from './tabRelevanceScorer';
import { TokenBudgetEstimator } from './tokenBudgetEstimator';
import { TokenizerService } from './tokenizerService';
import { ModelProfile, MODEL_PROFILES, DEFAULT_MODEL_ID, getModel, findModel } from './modelProfiles';

const PINNED_FILES_KEY = 'tokalator.pinnedFiles';
const SELECTED_MODEL_KEY = 'tokalator.selectedModel';
const SESSION_KEY = 'tokalator.lastSession';

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
  private readonly tokenizer = new TokenizerService();
  private readonly estimator = new TokenBudgetEstimator(this.tokenizer);

  private pinnedFiles = new Set<string>();
  private chatTurnCount = 0;
  private turnHistory: TurnSnapshot[] = [];
  private lastEditTimestamps = new Map<string, number>();
  private disposables: vscode.Disposable[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  private latestSnapshot: ContextSnapshot | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private isRefreshing = false;

  private activeModel: ModelProfile;
  private workspaceFileTokens = 0;
  private workspaceFileCount = 0;

  // Session tracking
  private peakTokens = 0;
  private peakPercent = 0;
  private fileEditCounts = new Map<string, number>();

  constructor(private readonly workspaceState?: vscode.Memento) {
    // Load persisted pinned files (normalize URIs for consistent matching)
    if (workspaceState) {
      const saved = workspaceState.get<string[]>(PINNED_FILES_KEY, []);
      this.pinnedFiles = new Set(saved.map(u => this.normalizeUri(u)));
    }

    // Load persisted model selection
    const savedModelId = workspaceState?.get<string>(SELECTED_MODEL_KEY, DEFAULT_MODEL_ID) || DEFAULT_MODEL_ID;
    this.activeModel = getModel(savedModelId);
    this.estimator.setProvider(this.activeModel.provider);

    // Scan workspace files on startup
    this.scanWorkspaceFiles();

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
        const uri = e.document.uri.toString();
        this.lastEditTimestamps.set(uri, Date.now());
        this.fileEditCounts.set(uri, (this.fileEditCounts.get(uri) || 0) + 1);
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
      // Sync model when settings change
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tokalator.model')) {
          const cfg = vscode.workspace.getConfiguration('tokalator');
          const modelId = cfg.get<string>('model', DEFAULT_MODEL_ID);
          this.setModel(modelId);
        }
      }),
    );

    // Auto-detect model when Copilot's available models change
    if (vscode.lm?.onDidChangeChatModels) {
      this.disposables.push(
        vscode.lm.onDidChangeChatModels(() => this.syncModelFromCopilot()),
      );
      // Initial sync attempt
      this.syncModelFromCopilot();
    }

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
   * Normalize a URI string for consistent Set matching.
   */
  private normalizeUri(uri: string): string {
    try {
      return vscode.Uri.parse(uri).toString();
    } catch {
      return uri;
    }
  }

  /**
   * Pin a file URI so it's always scored as maximum relevance.
   */
  pinFile(uri: string): void {
    this.pinnedFiles.add(this.normalizeUri(uri));
    this.persistPins();
    this.refresh();
  }

  /**
   * Unpin a file.
   */
  unpinFile(uri: string): void {
    this.pinnedFiles.delete(this.normalizeUri(uri));
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
   * Increment the conversation turn counter and capture a turn snapshot.
   * Only call this for actual user interactions, not status checks.
   */
  async incrementChatTurns(): Promise<void> {
    this.chatTurnCount++;

    // Capture a turn snapshot for compaction tracking
    const snapshot = this.latestSnapshot;
    if (snapshot) {
      const fileTokens = snapshot.tabs.reduce((s, t) => s + t.estimatedTokens, 0);
      const overheadTokens = snapshot.totalEstimatedTokens - fileTokens;
      this.turnHistory.push({
        turn: this.chatTurnCount,
        timestamp: Date.now(),
        inputTokens: snapshot.totalEstimatedTokens,
        outputReserved: this.activeModel.maxOutput,
        fileTokens,
        overheadTokens,
        tabCount: snapshot.tabs.length,
        pinnedCount: this.pinnedFiles.size,
      });
    }

    this.refresh();
  }

  /**
   * Estimate the token cost of the *next* chat turn before sending.
   * This gives users a preview of what will be consumed.
   */
  async previewNextTurn(): Promise<{
    currentInput: number;
    nextTurnEstimate: number;
    conversationGrowth: number;
    outputReserved: number;
    remainingCapacity: number;
    percentAfterTurn: number;
    windowCapacity: number;
    warning: string | null;
  }> {
    await this.refresh();
    const snapshot = this.latestSnapshot;
    if (!snapshot) {
      return {
        currentInput: 0, nextTurnEstimate: 0, conversationGrowth: 800,
        outputReserved: this.activeModel.maxOutput, remainingCapacity: this.activeModel.contextWindow,
        percentAfterTurn: 0, windowCapacity: this.activeModel.contextWindow, warning: null,
      };
    }

    // Each turn adds ~800 tokens (user message + assistant response)
    const perTurnCost = 800;
    const nextTurnInput = snapshot.totalEstimatedTokens + perTurnCost;
    const nextPercent = Math.min((nextTurnInput / snapshot.windowCapacity) * 100, 100);
    const remaining = Math.max(snapshot.windowCapacity - nextTurnInput - this.activeModel.maxOutput, 0);

    let warning: string | null = null;
    if (nextPercent >= 90) {
      warning = 'Next turn will push you past 90% — high risk of context overflow';
    } else if (nextPercent >= 75) {
      warning = 'Approaching context limit — consider closing tabs or resetting';
    }

    // Check if next turn crosses the rot threshold
    if (this.chatTurnCount + 1 >= this.activeModel.rotThreshold) {
      const rotMsg = `Turn ${this.chatTurnCount + 1} will cross context rot threshold (${this.activeModel.rotThreshold})`;
      warning = warning ? `${warning}. ${rotMsg}` : rotMsg;
    }

    return {
      currentInput: snapshot.totalEstimatedTokens,
      nextTurnEstimate: nextTurnInput,
      conversationGrowth: perTurnCost,
      outputReserved: this.activeModel.maxOutput,
      remainingCapacity: remaining,
      percentAfterTurn: nextPercent,
      windowCapacity: snapshot.windowCapacity,
      warning,
    };
  }

  /**
   * Reset conversation turn counter and clear turn history.
   */
  resetChatTurns(): void {
    this.chatTurnCount = 0;
    this.turnHistory = [];
    this.refresh();
  }

  /**
   * Get current chat turn count.
   */
  getChatTurnCount(): number {
    return this.chatTurnCount;
  }

  /**
   * Get the per-turn snapshot history for compaction analysis.
   */
  getTurnHistory(): TurnSnapshot[] {
    return [...this.turnHistory];
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
    const windowCapacity = this.activeModel.contextWindow;
    const rotWarning = this.activeModel.rotThreshold;

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

    // Track peak usage for session summary
    if (budget.used > this.peakTokens) {
      this.peakTokens = budget.used;
      this.peakPercent = budget.percent;
    }

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
      modelId: this.activeModel.id,
      modelLabel: this.activeModel.label,
      workspaceFileCount: this.workspaceFileCount,
      workspaceFileTokens: this.workspaceFileTokens,
      tokenizerType: this.tokenizer.getTokenizerType(this.activeModel.provider),
      tokenizerLabel: this.tokenizer.getTokenizerLabel(this.activeModel.provider),
      turnHistory: [...this.turnHistory],
      budgetBreakdown: budget.breakdown,
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

  /**
   * Auto-detect the active model from Copilot's available chat models.
   * Called on startup and when vscode.lm models change.
   */
  private async syncModelFromCopilot(): Promise<void> {
    try {
      const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
      if (models && models.length > 0) {
        // Use the first (usually the selected) model
        const copilotModel = models[0];
        const match = findModel(copilotModel.name || copilotModel.id);
        if (match && match.id !== this.activeModel.id) {
          this.setModel(match.id);
          console.log(`Tokalator: auto-synced model to ${match.label} from Copilot`);
        }
      }
    } catch {
      // vscode.lm may not be available — ignore
    }
  }

  /**
   * Sync model from a chat request (called from chat participant).
   * This captures the exact model the user selected in Copilot chat.
   */
  syncFromChatRequest(requestModel: vscode.LanguageModelChat): void {
    try {
      const modelName = requestModel.name || requestModel.id;
      const match = findModel(modelName);
      if (match && match.id !== this.activeModel.id) {
        this.setModel(match.id);
        console.log(`Tokalator: synced model to ${match.label} from chat request`);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Set the active model and persist it.
   */
  setModel(modelId: string): void {
    this.activeModel = getModel(modelId);
    this.estimator.setProvider(this.activeModel.provider);
    if (this.workspaceState) {
      this.workspaceState.update(SELECTED_MODEL_KEY, modelId);
    }
    // Rescan workspace with new tokenizer ratios
    this.scanWorkspaceFiles();
    this.refresh();
  }

  /**
   * Get the current active model.
   */
  getActiveModel(): ModelProfile {
    return this.activeModel;
  }

  /**
   * Get all available models.
   */
  getModels(): ModelProfile[] {
    return MODEL_PROFILES;
  }

  /**
   * Get the tokenizer service for direct token counting.
   */
  getTokenizer(): TokenizerService {
    return this.tokenizer;
  }

  /**
   * Scan workspace files to estimate total project token count.
   * This runs once on startup and on workspace change.
   */
  private async scanWorkspaceFiles(): Promise<void> {
    try {
      const files = await vscode.workspace.findFiles(
        '**/*.{ts,tsx,js,jsx,py,go,rs,java,rb,md,json,yml,yaml,css,html,sh,sql,c,cpp,h,cs,swift,kt}',
        '{**/node_modules/**,**/dist/**,**/build/**,**/.next/**,**/vendor/**,**/.git/**}',
        5000
      );
      this.workspaceFileCount = files.length;

      // Estimate total workspace tokens using provider-specific byte ratios
      let totalBytes = 0;
      for (const uri of files) {
        try {
          const stat = await vscode.workspace.fs.stat(uri);
          totalBytes += stat.size;
        } catch {
          // skip unreadable files
        }
      }
      this.workspaceFileTokens = this.tokenizer.estimateFromBytes(totalBytes, this.activeModel.provider);
    } catch {
      this.workspaceFileCount = 0;
      this.workspaceFileTokens = 0;
    }
  }

  /**
   * Save a session summary to workspace state for next activation.
   */
  saveSessionSummary(): void {
    const snapshot = this.latestSnapshot;
    if (!snapshot || !this.workspaceState) return;

    const topFiles = [...this.fileEditCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uri]) => {
        try {
          return vscode.workspace.asRelativePath(vscode.Uri.parse(uri));
        } catch {
          return uri;
        }
      });

    const summary: SessionSummary = {
      endedAt: new Date().toISOString(),
      modelId: this.activeModel.id,
      modelLabel: this.activeModel.label,
      totalTurns: this.chatTurnCount,
      peakTokens: this.peakTokens,
      peakPercent: this.peakPercent,
      tabCount: snapshot.tabs.length,
      pinnedCount: this.pinnedFiles.size,
      filesWorkedOn: topFiles,
      budgetLevel: snapshot.budgetLevel,
      healthStatus: snapshot.contextHealth,
    };

    this.workspaceState.update(SESSION_KEY, summary);
  }

  /**
   * Get last session summary (if any).
   */
  getLastSession(): SessionSummary | undefined {
    return this.workspaceState?.get<SessionSummary>(SESSION_KEY);
  }

  dispose(): void {
    this.saveSessionSummary();
    if (this.refreshTimer) { clearInterval(this.refreshTimer); }
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); }
    this._onDidUpdateSnapshot.dispose();
    this.tokenizer.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
