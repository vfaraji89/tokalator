/** Budget allocation breakdown */
export interface BudgetBreakdown {
  files: number;
  systemPrompt: number;
  instructions: number;
  conversation: number;
  outputReservation: number;
}

/** Per-turn context snapshot for compaction tracking */
export interface TurnSnapshot {
  turn: number;
  timestamp: number;
  inputTokens: number;
  outputReserved: number;
  fileTokens: number;
  overheadTokens: number;
  tabCount: number;
  pinnedCount: number;
}
