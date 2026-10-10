import {
  ClaudeCodeTurn,
  ClaudeCodeUsageRecord,
  TurnStats,
  UsageRates,
  UsageTotals,
  cacheHitRate,
  entrypointLabel,
  groupUsage,
  localDay,
  modelKey,
  sessionTurnStats,
  summarizeUsage,
} from '../claudeCodeUsage.pure';

export interface CatalogEntry extends UsageRates {
  id: string;
  label: string;
  contextWindow: number;
}

export interface AgentSummary {
  logDirs: string[];
  today: UsageTotals;
  week: UsageTotals;
  todayTurns: number;
  session: (UsageTotals & {
    model: string;
    modelId: string | null;
    startedAt: string;
    lastAt: string;
    turns: TurnStats[];
    turnCount: number;
    contextTokens: number;
    contextWindow: number;
    avgGrowthPerTurn: number;
    turnsLeft: number | null;
  }) | null;
  cacheHitRate: number;
  byEntrypoint: { label: string; cost: number; messages: number }[];
  lastActivityAt: string | null;
  estimatedShare: number;
}

export function summarizeAgent(
  records: (ClaudeCodeUsageRecord & { estimated?: boolean })[],
  turnList: ClaudeCodeTurn[],
  catalog: CatalogEntry[],
  cutoff: number,
  logDirs: string[],
  now = new Date(),
): AgentSummary {
  const byKey = new Map(catalog.map(m => [modelKey(m.id), m] as const));
  const rates = (model: string) => byKey.get(modelKey(model));
  const week = records.filter(r => Date.parse(r.timestamp) >= cutoff);
  const today = localDay(now.toISOString());
  const todays = week.filter(r => localDay(r.timestamp) === today);
  const latest = week.reduce<ClaudeCodeUsageRecord | null>((a, r) => (!a || r.timestamp > a.timestamp ? r : a), null);

  let session: AgentSummary['session'] = null;
  if (latest) {
    const sessionRecords = week.filter(r => r.sessionId === latest.sessionId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const main = sessionRecords.filter(r => !r.sidechain);
    const last = main[main.length - 1] ?? latest;
    const profile = byKey.get(modelKey(last.model));
    const turns = sessionTurnStats(turnList.filter(t => t.sessionId === latest.sessionId), sessionRecords, rates);
    const sized = turns.filter(t => t.contextTokens > 0);
    const avgGrowthPerTurn = sized.length >= 2
      ? Math.max(0, Math.round((sized[sized.length - 1].contextTokens - sized[0].contextTokens) / (sized.length - 1)))
      : 0;
    const contextTokens = last.inputTokens + last.cacheReadTokens + last.cacheWrite5mTokens + last.cacheWrite1hTokens;
    const contextWindow = profile?.contextWindow ?? 0;
    session = {
      ...summarizeUsage(sessionRecords, rates),
      model: profile?.label ?? last.model,
      modelId: profile?.id ?? null,
      startedAt: sessionRecords[0].timestamp,
      lastAt: sessionRecords[sessionRecords.length - 1].timestamp,
      turns: turns.slice(-30),
      turnCount: turns.length,
      contextTokens,
      contextWindow,
      avgGrowthPerTurn,
      turnsLeft: avgGrowthPerTurn > 0 && contextWindow > 0 ? Math.max(0, Math.floor((contextWindow - contextTokens) / avgGrowthPerTurn)) : null,
    };
  }

  const weekTotals = summarizeUsage(week, rates);
  return {
    logDirs,
    today: summarizeUsage(todays, rates),
    todayTurns: turnList.filter(t => localDay(t.timestamp) === today && Date.parse(t.timestamp) >= cutoff).length,
    week: weekTotals,
    session,
    cacheHitRate: cacheHitRate(weekTotals),
    byEntrypoint: groupUsage(week, r => entrypointLabel(r.entrypoint), rates).map(g => ({ label: g.key, cost: g.totals.cost, messages: g.totals.messages })),
    lastActivityAt: latest?.timestamp ?? null,
    estimatedShare: week.length ? week.filter(r => r.estimated).length / week.length : 0,
  };
}
