import * as vscode from 'vscode';

/**
 * Represents the relevance score and metadata for a single open tab.
 */
export interface TabInfo {
  uri: vscode.Uri;
  label: string;
  languageId: string;
  relativePath: string;
  estimatedTokens: number;
  relevanceScore: number;       // 0-1
  relevanceReason: string;
  isActive: boolean;
  isDirty: boolean;
  isPinned: boolean;            // user-pinned via extension
  diagnosticCount: number;
  lastEditTimestamp: number;
}

/**
 * Snapshot of token state at a specific chat turn.
 * Captured each time incrementChatTurns() is called.
 */
export interface TurnSnapshot {
  turn: number;
  timestamp: number;
  inputTokens: number;      // files + overhead (everything the model reads)
  outputReserved: number;    // model's maxOutput reservation
  fileTokens: number;        // file portion only
  overheadTokens: number;    // system prompt + instructions + conversation history
  tabCount: number;
  pinnedCount: number;
}

/**
 * Budget breakdown by category.
 */
export interface BudgetBreakdown {
  files: number;
  systemPrompt: number;
  instructions: number;
  conversation: number;
  outputReservation: number;
}

/**
 * Full snapshot of the context window state at a point in time.
 */
export interface ContextSnapshot {
  timestamp: number;
  activeFile: TabInfo | null;
  tabs: TabInfo[];
  pinnedFiles: Set<string>;
  totalEstimatedTokens: number;
  windowCapacity: number;
  usagePercent: number;
  budgetLevel: 'low' | 'medium' | 'high';  // Simplified: low=good, medium=warning, high=critical
  diagnosticsSummary: { errors: number; warnings: number; info: number };
  chatTurnCount: number;
  contextHealth: 'healthy' | 'warning' | 'critical';
  healthReasons: string[];
  modelId: string;
  modelLabel: string;
  workspaceFileCount: number;
  workspaceFileTokens: number;
  tokenizerType: string;
  tokenizerLabel: string;
  turnHistory: TurnSnapshot[];
  budgetBreakdown: BudgetBreakdown;
  /** Secret scan results — guardrail for sensitive data in context */
  secretScan: SecretScanSummary | null;
  /** Cost and caching estimation for this context state */
  costEstimate: CostEstimateSummary | null;
}

/**
 * Serializable cost + caching estimate for the webview.
 */
export interface CostEstimateSummary {
  /** Per-turn costs */
  inputTokens: number;
  inputCostUSD: number;
  outputTokensEstimate: number;
  outputCostUSD: number;
  totalCostUSD: number;

  /** Caching */
  cachingSupported: boolean;
  cachingType: string;
  cachingDescription: string;
  cacheableTokens: number;
  uncacheableTokens: number;
  estimatedHitRatio: number;
  cachedCostUSD: number;
  uncachedCostUSD: number;
  savingsPerTurnUSD: number;
  savingsPercent: number;

  /** Session projections */
  turnsCompleted: number;
  estimatedSessionCostUSD: number;
  cost10Turns: number;
  cost25Turns: number;
  cost50Turns: number;
  cachedCost10Turns: number;
  cachedCost25Turns: number;
  cachedCost50Turns: number;
  dailyCostUSD: number;
  monthlyCostUSD: number;
  cachedDailyCostUSD: number;
  cachedMonthlyCostUSD: number;
}

/**
 * Serializable summary of secret scan results.
 * Kept separate from the full SecretScanResult to avoid importing scanner types.
 */
export interface SecretScanSummary {
  totalFindings: number;
  critical: number;
  high: number;
  warning: number;
  envFilesOpen: string[];
  findings: {
    rule: string;
    description: string;
    severity: 'critical' | 'high' | 'warning';
    filePath: string;
    fileUri: string;
    line: number;
    preview: string;
  }[];
  scannedAt: number;
}

/**
 * Persisted summary of a previous session.
 */
export interface SessionSummary {
  endedAt: string;
  modelId: string;
  modelLabel: string;
  totalTurns: number;
  peakTokens: number;
  peakPercent: number;
  tabCount: number;
  pinnedCount: number;
  filesWorkedOn: string[];
  budgetLevel: string;
  healthStatus: string;
}

/**
 * Events emitted by the ContextMonitor.
 */
export interface ContextMonitorEvents {
  onDidUpdateSnapshot: vscode.Event<ContextSnapshot>;
}

// ─── Optimization Plan ──────────────────────────────────────────────────────

/** Priority of an optimization suggestion */
export type OptimizationPriority = 'critical' | 'high' | 'medium' | 'low';

/** Category of optimization */
export type OptimizationCategory = 'tokens' | 'cost' | 'security' | 'health' | 'workflow';

/**
 * A single actionable optimization suggestion.
 */
export interface OptimizationAction {
  id: string;
  category: OptimizationCategory;
  priority: OptimizationPriority;
  title: string;
  description: string;
  /** Tokens that would be freed (0 if not token-related) */
  tokenSavings: number;
  /** Cost savings per turn in USD (0 if not cost-related) */
  costSavingsPerTurn: number;
  /** Machine-actionable: can the extension execute this automatically? */
  actionable: boolean;
  /** The command/action key to execute (e.g. 'closeTabs', 'enableCaching') */
  actionKey?: string;
  /** Data payload for the action (e.g. list of URIs to close) */
  actionData?: unknown;
}

/**
 * Full optimization plan produced by ContextOptimizer.
 */
export interface OptimizationPlan {
  /** When this plan was generated */
  timestamp: number;
  /** Overall optimization score 0-100 (100 = perfectly optimized) */
  score: number;
  /** Human-readable verdict */
  verdict: string;
  /** Total tokens that could be saved */
  totalTokenSavings: number;
  /** Total cost savings per turn in USD */
  totalCostSavingsPerTurn: number;
  /** Ordered list of suggestions (highest priority first) */
  actions: OptimizationAction[];
  /** Summary counts by category */
  categoryCounts: Record<OptimizationCategory, number>;
}
