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
