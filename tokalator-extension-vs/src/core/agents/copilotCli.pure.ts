/**
 * GitHub Copilot CLI session logs: <state>/session-state/<sessionId>/events.jsonl.
 * Output tokens are logged per assistant.message; input tokens are only logged per model in
 * session.shutdown modelMetrics, so input is attributed once per model at shutdown (estimated).
 * modelMetrics usage.inputTokens includes cache reads, so uncached input = inputTokens - cacheReadTokens.
 */
import { AgentParseResult, AgentUsageRecord, normalizeModelId } from './types';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function events(text: string): any[] {
  const out: any[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e && typeof e.type === 'string') out.push(e);
    } catch {
      continue;
    }
  }
  return out;
}

function sessionFromPath(file: string): string {
  const parts = file.split(/[\\/]/);
  return parts.length > 1 ? parts[parts.length - 2] : file;
}

export function parseCopilotCli(text: string, file: string): AgentParseResult {
  const records: AgentUsageRecord[] = [];
  const turns: AgentParseResult['turns'] = [];
  let sessionId = sessionFromPath(file);
  let cwd = '';
  let model = '';
  let pending: AgentUsageRecord[] = [];
  let outputSinceShutdown = new Map<string, number>();

  const base = (id: string, timestamp: string, m: string): AgentUsageRecord => ({
    id, timestamp, sessionId, cwd, model: m, entrypoint: 'copilot-cli', sidechain: false,
    inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWrite5mTokens: 0, cacheWrite1hTokens: 0, fast: false,
  });
  const setModel = (raw: unknown) => {
    const m = normalizeModelId(str(raw));
    if (!m) return;
    model = m;
    for (const r of pending) {
      r.model = m;
      outputSinceShutdown.set(m, (outputSinceShutdown.get(m) ?? 0) + r.outputTokens);
    }
    pending = [];
  };

  for (const e of events(text)) {
    const d = e.data && typeof e.data === 'object' ? e.data : {};
    const ts = str(e.timestamp);
    switch (e.type) {
      case 'session.start':
        sessionId = str(d.sessionId) || sessionId;
        cwd = str(d.context?.cwd) || cwd;
        setModel(d.selectedModel);
        break;
      case 'session.model_change':
        setModel(d.newModel);
        break;
      case 'session.auto_mode_resolved':
        setModel(d.chosenModel);
        break;
      case 'tool.execution_complete':
        setModel(d.model);
        break;
      case 'user.message':
        turns.push({ id: `${sessionId}:${str(e.id) || turns.length}`, timestamp: ts, sessionId });
        break;
      case 'assistant.message': {
        if (typeof d.outputTokens !== 'number') break;
        if (d.model) setModel(d.model);
        const r = base(`${sessionId}:${str(d.messageId) || str(e.id) || records.length}`, ts, model);
        r.outputTokens = num(d.outputTokens);
        records.push(r);
        if (model) outputSinceShutdown.set(model, (outputSinceShutdown.get(model) ?? 0) + r.outputTokens);
        else pending.push(r);
        break;
      }
      case 'session.shutdown': {
        const metrics = d.modelMetrics && typeof d.modelMetrics === 'object' ? d.modelMetrics : {};
        for (const [raw, v] of Object.entries<any>(metrics)) {
          const m = normalizeModelId(raw);
          const u = v?.usage ?? {};
          const cacheRead = num(u.cacheReadTokens);
          const r = base(`${sessionId}:shutdown-model-metrics:${str(e.id)}:${m}`, ts, m);
          r.inputTokens = Math.max(0, num(u.inputTokens) - cacheRead);
          r.cacheReadTokens = cacheRead;
          r.cacheWrite5mTokens = num(u.cacheWriteTokens);
          r.outputTokens = Math.max(0, num(u.outputTokens) - (outputSinceShutdown.get(m) ?? 0));
          r.estimated = true;
          if (r.inputTokens || r.outputTokens || r.cacheReadTokens || r.cacheWrite5mTokens) records.push(r);
        }
        outputSinceShutdown = new Map();
        break;
      }
    }
  }
  for (const r of pending) r.model = 'unknown';
  return { records, turns };
}

export function copilotCliPremiumRequests(text: string): number | null {
  let total: number | null = null;
  for (const e of events(text)) {
    const v = e.data?.totalPremiumRequests;
    if (e.type === 'session.shutdown' && typeof v === 'number' && Number.isFinite(v)) total = (total ?? 0) + v;
  }
  return total;
}
