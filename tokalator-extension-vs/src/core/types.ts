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
}

/**
 * Events emitted by the ContextMonitor.
 */
export interface ContextMonitorEvents {
  onDidUpdateSnapshot: vscode.Event<ContextSnapshot>;
}
