import { normalizeModelId, type AgentParseResult, type AgentUsageRecord } from './types';

/**
 * Copilot Chat sessions from <workspaceStorage>/<hash>/chatSessions. A .json file holds the
 * session object. A .jsonl file is an operation log: kind 0 sets the whole state (v), kind 1 sets
 * the value at path k, kind 2 truncates the array at path k to length i (when given) and appends v.
 * Token counts are per request; requests without them get length/4 estimates.
 */
export function parseCopilotChat(text: string, file: string): AgentParseResult {
  const result: AgentParseResult = { records: [], turns: [] };
  try {
    const session = loadSession(text);
    const requests = session?.requests;
    if (!Array.isArray(requests)) return result;
    const sessionId = str(session.sessionId) || (file.split(/[\\/]/).pop() ?? '').replace(/\.jsonl?$/, '');
    requests.forEach((r: any, index: number) => {
      if (!r || typeof r !== 'object') return;
      const id = `${sessionId}:${str(r.requestId) || index}`;
      const ms = typeof r.timestamp === 'number' ? r.timestamp : Date.parse(r.timestamp);
      const timestamp = Number.isFinite(ms) ? new Date(ms).toISOString() : '';
      result.turns.push({ id, timestamp, sessionId });
      const record = toRecord(r, id, timestamp, sessionId);
      if (record) result.records.push(record);
    });
  } catch {
    return result;
  }
  return result;
}

function toRecord(r: any, id: string, timestamp: string, sessionId: string): AgentUsageRecord | null {
  const response = Array.isArray(r.response) ? r.response : [];
  if (!response.length && !r.result) return null;
  const md = r.result?.metadata ?? {};
  const prompt = count(r.promptTokens) ?? count(md.promptTokens);
  const output = count(r.completionTokens) ?? count(md.outputTokens);
  const cachedPct = Array.isArray(r.promptTokenDetails)
    ? r.promptTokenDetails.find((d: any) => /cache/i.test(`${d?.category} ${d?.label}`))?.percentageOfPrompt
    : undefined;
  const cacheRead = prompt !== undefined && typeof cachedPct === 'number' ? Math.round((prompt * cachedPct) / 100) : 0;
  return {
    id,
    timestamp,
    sessionId,
    cwd: '',
    model: modelOf(r, md),
    entrypoint: 'copilot-chat',
    sidechain: false,
    inputTokens: prompt !== undefined ? Math.max(0, prompt - cacheRead) : estimateInput(r),
    outputTokens: output ?? estimateOutput(response, md),
    cacheReadTokens: cacheRead,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    fast: false,
    ...(prompt === undefined || output === undefined ? { estimated: true } : {}),
  };
}

function loadSession(text: string): any {
  try {
    const whole = JSON.parse(text);
    if (whole && typeof whole === 'object' && !('kind' in whole)) return whole;
  } catch {
    /* operation log */
  }
  let state: any;
  for (const line of text.split('\n')) {
    let op: any;
    try {
      op = JSON.parse(line);
    } catch {
      continue;
    }
    if (op?.kind === 0) {
      state = op.v;
      continue;
    }
    const path = op?.k;
    if (!state || !Array.isArray(path) || !path.length) continue;
    const parent = at(state, path.slice(0, -1));
    const key = path[path.length - 1];
    if (!parent || typeof parent !== 'object') continue;
    if (op.kind === 1) {
      parent[key] = op.v;
    } else if (op.kind === 2) {
      if (!Array.isArray(parent[key])) parent[key] = [];
      const arr: unknown[] = parent[key];
      if (typeof op.i === 'number') arr.length = Math.min(arr.length, Math.max(0, op.i));
      if (Array.isArray(op.v)) arr.push(...op.v);
    }
  }
  return state;
}

function at(obj: any, path: unknown[]): any {
  for (const key of path) {
    if (obj === null || typeof obj !== 'object') return undefined;
    obj = obj[key as string];
  }
  return obj;
}

function modelOf(r: any, md: any): string {
  const requested = normalizeModelId(str(r.modelId) || 'unknown');
  const rounds = Array.isArray(md.toolCallRounds) ? md.toolCallRounds : [];
  const autoPart = Array.isArray(r.response) ? r.response.find((p: any) => p?.kind === 'autoModeResolution') : undefined;
  const resolved = str(md.resolvedModel)
    || (requested === 'auto' ? str(autoPart?.resolved?.id) || str(rounds[rounds.length - 1]?.modelId) : '');
  if (!resolved) return requested;
  return normalizeModelId(resolved).replace(/^capi-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

function estimateInput(r: any): number {
  let chars = str(r.message?.text).length;
  const vars = r.variableData?.variables;
  if (Array.isArray(vars)) for (const v of vars) chars += str(v?.value).length;
  return Math.ceil(chars / 4);
}

function estimateOutput(response: any[], md: any): number {
  let chars = 0;
  for (const p of response) {
    if (!p || typeof p !== 'object') continue;
    if (p.kind === undefined || p.kind === 'markdownContent') chars += str(p.value ?? p.content?.value).length;
    else if (p.kind === 'thinking') chars += (Array.isArray(p.value) ? p.value.join('') : str(p.value)).length;
  }
  const rounds = Array.isArray(md.toolCallRounds) ? md.toolCallRounds : [];
  const thinking = rounds.reduce((sum: number, t: any) => sum + (count(t?.thinking?.tokens) ?? 0), 0);
  return Math.max(Math.ceil(chars / 4), thinking);
}

function count(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
