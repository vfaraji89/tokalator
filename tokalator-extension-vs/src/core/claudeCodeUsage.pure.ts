/**
 * Token usage from Claude Code session logs (~/.claude/projects/<project>/<session>.jsonl
 * and <session>/subagents/*.jsonl), written by both the CLI and the VS Code extension.
 * Shared by the extension and the website, so it must stay free of Node and vscode imports.
 */

export interface ClaudeCodeUsageRecord {
  id: string;
  timestamp: string;
  sessionId: string;
  cwd: string;
  model: string;
  entrypoint: string;
  sidechain: boolean;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWrite5mTokens: number;
  cacheWrite1hTokens: number;
  fast: boolean;
}

export interface ClaudeCodeTurn {
  id: string;
  timestamp: string;
  sessionId: string;
}

export interface TurnStats {
  turn: number;
  timestamp: string;
  requests: number;
  contextTokens: number;
  outputTokens: number;
  cost: number;
}

export interface UsageRates {
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  cachedInputCostPerMTok?: number;
  cacheWriteCostPerMTok?: number;
  longContext?: { threshold: number; inputMultiplier: number; outputMultiplier: number };
}

export interface UsageTotals {
  messages: number;
  sessions: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cost: number;
  unpricedMessages: number;
  unpricedModels: string[];
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

export function parseClaudeCodeLine(line: string): ClaudeCodeUsageRecord | null {
  if (!line.includes('"usage"') || !line.includes('"assistant"')) return null;
  let entry: any;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  const message = entry?.message;
  const usage = message?.usage;
  if (entry?.type !== 'assistant' || !usage || typeof message.model !== 'string' || message.model === '<synthetic>') {
    return null;
  }
  const split = usage.cache_creation;
  return {
    id: String(message.id ?? entry.requestId ?? entry.uuid ?? ''),
    timestamp: String(entry.timestamp ?? ''),
    sessionId: String(entry.sessionId ?? ''),
    cwd: String(entry.cwd ?? ''),
    model: message.model,
    entrypoint: String(entry.entrypoint ?? 'unknown'),
    sidechain: entry.isSidechain === true,
    inputTokens: num(usage.input_tokens),
    outputTokens: num(usage.output_tokens),
    cacheReadTokens: num(usage.cache_read_input_tokens),
    cacheWrite5mTokens: split ? num(split.ephemeral_5m_input_tokens) : num(usage.cache_creation_input_tokens),
    cacheWrite1hTokens: split ? num(split.ephemeral_1h_input_tokens) : 0,
    fast: usage.speed === 'fast',
  };
}

const NOT_A_PROMPT = /^(\[Request interrupted|<local-command-|<command-stdout|<bash-stdout|<bash-stderr)/;

/** A prompt the person typed: origin.kind "human" on current Claude Code, text content on older versions. */
export function parseClaudeCodeTurn(line: string): ClaudeCodeTurn | null {
  if (!line.includes('"user"') || line.includes('"tool_result"')) return null;
  let entry: any;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  if (entry?.type !== 'user' || entry.isSidechain === true || entry.isMeta === true || !entry.uuid) return null;
  if (entry.origin) {
    if (entry.origin.kind !== 'human') return null;
  } else {
    const content = entry.message?.content;
    const text = typeof content === 'string'
      ? content
      : Array.isArray(content) ? content.find((b: any) => b?.type === 'text')?.text : undefined;
    if (typeof text !== 'string' || !text.trim() || NOT_A_PROMPT.test(text)) return null;
  }
  return { id: String(entry.uuid), timestamp: String(entry.timestamp ?? ''), sessionId: String(entry.sessionId ?? '') };
}

/** Collects records, keeping one per API message (Claude Code writes one line per content block). */
export class ClaudeCodeUsageCollector {
  private readonly byId = new Map<string, ClaudeCodeUsageRecord>();
  private readonly turnsById = new Map<string, ClaudeCodeTurn>();

  addLine(line: string): void {
    const record = parseClaudeCodeLine(line);
    if (record) {
      if (record.id && !this.byId.has(record.id)) this.byId.set(record.id, record);
      return;
    }
    const turn = parseClaudeCodeTurn(line);
    if (turn && !this.turnsById.has(turn.id)) this.turnsById.set(turn.id, turn);
  }

  get turns(): ClaudeCodeTurn[] {
    return Array.from(this.turnsById.values());
  }

  addText(text: string): void {
    for (const line of text.split('\n')) this.addLine(line);
  }

  get records(): ClaudeCodeUsageRecord[] {
    return Array.from(this.byId.values());
  }

  get size(): number {
    return this.byId.size;
  }
}

/** claude-haiku-4-5-20251001, claude-haiku-4.5 and claude-haiku-4-5 share one key. */
export function modelKey(id: string): string {
  return id.toLowerCase().replace(/\[[^\]]*\]$/, '').replace(/-\d{8}$/, '').replace(/[^a-z0-9]/g, '');
}

export function recordCost(r: ClaudeCodeUsageRecord, rates: UsageRates): number {
  const prompt = r.inputTokens + r.cacheReadTokens + r.cacheWrite5mTokens + r.cacheWrite1hTokens;
  const lc = rates.longContext && prompt > rates.longContext.threshold ? rates.longContext : undefined;
  const speed = r.fast ? 2 : 1;
  const inMul = (lc?.inputMultiplier ?? 1) * speed;
  const outMul = (lc?.outputMultiplier ?? 1) * speed;
  const input = rates.inputCostPerMTok;
  return (
    r.inputTokens * input * inMul +
    r.cacheReadTokens * (rates.cachedInputCostPerMTok ?? input) * inMul +
    r.cacheWrite5mTokens * (rates.cacheWriteCostPerMTok ?? input * 1.25) * inMul +
    r.cacheWrite1hTokens * input * 2 * inMul +
    r.outputTokens * rates.outputCostPerMTok * outMul
  ) / 1_000_000;
}

export function summarizeUsage(
  records: ClaudeCodeUsageRecord[],
  ratesFor: (model: string) => UsageRates | undefined,
): UsageTotals {
  const totals: UsageTotals = {
    messages: 0, sessions: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0,
    cacheWriteTokens: 0, cost: 0, unpricedMessages: 0, unpricedModels: [],
  };
  const sessions = new Set<string>();
  const unpriced = new Set<string>();
  for (const r of records) {
    totals.messages++;
    sessions.add(r.sessionId);
    totals.inputTokens += r.inputTokens;
    totals.outputTokens += r.outputTokens;
    totals.cacheReadTokens += r.cacheReadTokens;
    totals.cacheWriteTokens += r.cacheWrite5mTokens + r.cacheWrite1hTokens;
    const rates = ratesFor(r.model);
    if (rates) {
      totals.cost += recordCost(r, rates);
    } else {
      totals.unpricedMessages++;
      unpriced.add(r.model);
    }
  }
  totals.sessions = sessions.size;
  totals.unpricedModels = Array.from(unpriced);
  return totals;
}

export function groupUsage(
  records: ClaudeCodeUsageRecord[],
  key: (r: ClaudeCodeUsageRecord) => string,
  ratesFor: (model: string) => UsageRates | undefined,
): { key: string; totals: UsageTotals }[] {
  const groups = new Map<string, ClaudeCodeUsageRecord[]>();
  for (const r of records) {
    const k = key(r);
    const list = groups.get(k);
    if (list) list.push(r); else groups.set(k, [r]);
  }
  return Array.from(groups, ([k, list]) => ({ key: k, totals: summarizeUsage(list, ratesFor) }))
    .sort((a, b) => b.totals.cost - a.totals.cost);
}

/**
 * Per-turn stats for one session. contextTokens is the prompt size of the turn's last
 * main-thread request, which is what the conversation occupies in the context window.
 */
export function sessionTurnStats(
  turns: ClaudeCodeTurn[],
  records: ClaudeCodeUsageRecord[],
  ratesFor: (model: string) => UsageRates | undefined,
): TurnStats[] {
  const ordered = [...turns].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const stats: TurnStats[] = ordered.map((t, i) => ({
    turn: i + 1, timestamp: t.timestamp, requests: 0, contextTokens: 0, outputTokens: 0, cost: 0,
  }));
  if (!stats.length) return stats;
  const sorted = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  let i = 0;
  for (const r of sorted) {
    while (i + 1 < ordered.length && ordered[i + 1].timestamp <= r.timestamp) i++;
    if (r.timestamp < ordered[0].timestamp) continue;
    const s = stats[i];
    s.requests++;
    s.outputTokens += r.outputTokens;
    const rates = ratesFor(r.model);
    if (rates) s.cost += recordCost(r, rates);
    if (!r.sidechain) s.contextTokens = r.inputTokens + r.cacheReadTokens + r.cacheWrite5mTokens + r.cacheWrite1hTokens;
  }
  return stats;
}

/** Share of prompt tokens served from cache. */
export function cacheHitRate(t: Pick<UsageTotals, 'inputTokens' | 'cacheReadTokens' | 'cacheWriteTokens'>): number {
  const prompt = t.inputTokens + t.cacheReadTokens + t.cacheWriteTokens;
  return prompt > 0 ? t.cacheReadTokens / prompt : 0;
}

export function localDay(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function projectName(cwd: string): string {
  return cwd.split(/[\\/]/).filter(Boolean).pop() ?? (cwd || 'unknown');
}

export function entrypointLabel(entrypoint: string): string {
  if (entrypoint === 'claude-vscode') return 'VS Code extension';
  if (entrypoint === 'cli') return 'CLI';
  return entrypoint;
}
