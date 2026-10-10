import { AgentParseResult, normalizeModelId } from './types';

/**
 * OpenCode keeps one row per message (SQLite table `message`, or storage/message/<session>/<id>.json on
 * older versions). `data` is the message JSON: assistant messages carry modelID and tokens
 * { input, output, reasoning, cache: { read, write } }, where input excludes cached tokens and output
 * excludes reasoning. Session rows supply the directory; sessions with a parent are subagent runs.
 */
export interface OpenCodeMessageRow {
  id: string;
  sessionId: string;
  timeCreated: number;
  data: string;
}

export interface OpenCodeSessionRow {
  id: string;
  directory: string;
  parentId?: string | null;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

const iso = (ms: unknown): string => {
  const d = new Date(typeof ms === 'number' ? ms : NaN);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

export function mapOpenCodeRows(messages: OpenCodeMessageRow[], sessions: OpenCodeSessionRow[]): AgentParseResult {
  const result: AgentParseResult = { records: [], turns: [] };
  const byId = new Map(sessions.map(s => [s.id, s]));
  for (const row of messages) {
    const session = byId.get(row.sessionId);
    if (!session || !row.id) continue;
    let data: any;
    try {
      data = JSON.parse(row.data);
    } catch {
      continue;
    }
    if (!data || typeof data !== 'object') continue;
    const timestamp = iso(data.time?.created ?? row.timeCreated);
    if (data.role === 'user') {
      if (!session.parentId) result.turns.push({ id: row.id, timestamp, sessionId: row.sessionId });
      continue;
    }
    const t = data.tokens;
    if (data.role !== 'assistant' || !t || typeof data.modelID !== 'string' || !data.modelID) continue;
    const record = {
      id: row.id,
      timestamp,
      sessionId: row.sessionId,
      cwd: session.directory,
      model: normalizeModelId(data.modelID),
      entrypoint: 'opencode',
      sidechain: !!session.parentId,
      inputTokens: num(t.input),
      outputTokens: num(t.output) + num(t.reasoning),
      cacheReadTokens: num(t.cache?.read),
      cacheWrite5mTokens: num(t.cache?.write),
      cacheWrite1hTokens: 0,
      fast: false,
    };
    if (record.inputTokens + record.outputTokens + record.cacheReadTokens + record.cacheWrite5mTokens === 0) continue;
    result.records.push(record);
  }
  return result;
}
