/**
 * Token usage from OpenAI Codex rollout files ($CODEX_HOME/sessions/YYYY/MM/DD/rollout-*.jsonl).
 *
 * Token semantics, checked against real rollouts (total_tokens == input_tokens + output_tokens on every event):
 * - input_tokens includes cached_input_tokens (and cache_write_input_tokens), so both are subtracted.
 * - output_tokens includes reasoning_output_tokens, so reasoning is not added again.
 * Sources:
 * - token_usage_record (newer CLIs): one line per model response, keyed by response_id. Also covers
 *   compaction requests, which emit no token_count.
 * - event_msg token_count: emitted after each response, sometimes repeated with an unchanged
 *   total_token_usage; repeats and events already covered by the preceding token_usage_record are skipped.
 * Turns: event_msg user_message on CLIs that write it, otherwise item_completed items of type UserMessage.
 */
import { AgentParseResult, AgentTurn, AgentUsageRecord, normalizeModelId } from './types';

export interface CodexParseResult extends AgentParseResult {
  contextWindow?: number;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const usageKey = (u: any): string =>
  [u?.input_tokens, u?.cached_input_tokens, u?.cache_write_input_tokens, u?.output_tokens, u?.total_tokens].join(',');

export function parseCodex(text: string, file: string): CodexParseResult {
  const records: AgentUsageRecord[] = [];
  const userMessages: AgentTurn[] = [];
  const completedUserItems: AgentTurn[] = [];
  let sessionId = file.replace(/^.*[\\/]/, '').replace(/\.jsonl$/, '');
  let cwd = '';
  let sidechain = false;
  let model = '';
  let contextWindow: number | undefined;
  let lastTotal: string | undefined;
  let lastRecordUsage: string | undefined;

  const push = (id: string, timestamp: string, u: any) => {
    const cached = num(u.cached_input_tokens);
    const cacheWrite = num(u.cache_write_input_tokens);
    records.push({
      id,
      timestamp,
      sessionId,
      cwd,
      model,
      entrypoint: 'codex',
      sidechain,
      inputTokens: Math.max(0, num(u.input_tokens) - cached - cacheWrite),
      outputTokens: num(u.output_tokens),
      cacheReadTokens: cached,
      cacheWrite5mTokens: cacheWrite,
      cacheWrite1hTokens: 0,
      fast: false,
    });
  };

  const lines = typeof text === 'string' ? text.split('\n') : [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    let entry: any;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const p = entry?.payload;
    if (!p || typeof p !== 'object') continue;
    const timestamp = String(entry.timestamp ?? '');

    switch (entry.type) {
      case 'session_meta':
        if (typeof p.id === 'string') sessionId = p.id;
        if (typeof p.cwd === 'string') cwd = p.cwd;
        sidechain = typeof p.source === 'object' && p.source !== null && 'subagent' in p.source;
        break;
      case 'turn_context':
        if (typeof p.model === 'string' && p.model.trim()) model = normalizeModelId(p.model);
        if (!cwd && typeof p.cwd === 'string') cwd = p.cwd;
        break;
      case 'token_usage_record':
        if (p.usage && typeof p.usage === 'object') {
          push(String(p.response_id ?? `${sessionId}:${i}`), timestamp, p.usage);
          lastRecordUsage = usageKey(p.usage);
        }
        break;
      case 'event_msg':
        if (p.type === 'token_count') {
          const info = p.info;
          if (num(info?.model_context_window)) contextWindow = info.model_context_window;
          const last = info?.last_token_usage;
          if (!last || typeof last !== 'object') break;
          const total = usageKey(info.total_token_usage);
          if (total === lastTotal) break;
          lastTotal = total;
          if (lastRecordUsage === usageKey(last)) {
            lastRecordUsage = undefined;
            break;
          }
          const n = num(info.total_token_usage?.total_tokens);
          push(`${sessionId}:${n || `line${i}`}`, timestamp, last);
        } else if (p.type === 'task_started') {
          if (num(p.model_context_window)) contextWindow = p.model_context_window;
        } else if (p.type === 'user_message') {
          userMessages.push({ id: `${sessionId}:user:${i}`, timestamp, sessionId });
        } else if (p.type === 'item_completed' && p.item?.type === 'UserMessage') {
          completedUserItems.push({ id: String(p.item.id ?? `${sessionId}:user:${i}`), timestamp, sessionId });
        }
        break;
    }
  }

  const fallbackModel = model || 'unknown';
  for (const r of records) if (!r.model) r.model = fallbackModel;
  const turns = userMessages.length ? userMessages : completedUserItems;
  return contextWindow ? { records, turns, contextWindow } : { records, turns };
}
