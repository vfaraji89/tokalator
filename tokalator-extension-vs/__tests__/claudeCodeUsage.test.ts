import {
  ClaudeCodeUsageCollector,
  cacheHitRate,
  modelKey,
  parseClaudeCodeTurn,
  recordCost,
  sessionTurnStats,
  summarizeUsage,
} from '../src/core/claudeCodeUsage.pure';

const assistant = (id: string, timestamp: string, usage: object, extra: object = {}) => JSON.stringify({
  type: 'assistant', timestamp, sessionId: 's1', cwd: '/w/app', entrypoint: 'claude-vscode', isSidechain: false,
  message: { id, model: 'claude-opus-5-5', usage }, ...extra,
});
const user = (uuid: string, timestamp: string, extra: object) => JSON.stringify({
  type: 'user', uuid, timestamp, sessionId: 's1', isSidechain: false, ...extra,
});

const opus = { inputCostPerMTok: 4, outputCostPerMTok: 20, cachedInputCostPerMTok: 0.2, cacheWriteCostPerMTok: 5 };
const haiku = {
  inputCostPerMTok: 0.1, outputCostPerMTok: 0.5, cachedInputCostPerMTok: 0.01, cacheWriteCostPerMTok: 0.125,
  longContext: { threshold: 100_000, inputMultiplier: 5, outputMultiplier: 5 },
};

describe('Claude Code usage parsing', () => {
  it('keeps one record per API message across content-block lines', () => {
    const c = new ClaudeCodeUsageCollector();
    const usage = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100 };
    c.addText([assistant('m1', '2026-10-10T10:00:01Z', usage), assistant('m1', '2026-10-10T10:00:01Z', usage)].join('\n'));
    expect(c.size).toBe(1);
  });

  it('splits 5-minute and 1-hour cache writes', () => {
    const c = new ClaudeCodeUsageCollector();
    c.addLine(assistant('m1', '2026-10-10T10:00:01Z', {
      input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 300,
      cache_creation: { ephemeral_5m_input_tokens: 100, ephemeral_1h_input_tokens: 200 },
    }));
    const [r] = c.records;
    expect([r.cacheWrite5mTokens, r.cacheWrite1hTokens]).toEqual([100, 200]);
    expect(recordCost(r, opus)).toBeCloseTo((100 * 5 + 200 * 8) / 1e6);
  });

  it('skips synthetic messages and malformed lines', () => {
    const c = new ClaudeCodeUsageCollector();
    c.addLine('{"type":"assistant","message":{"usage":');
    c.addLine(JSON.stringify({ type: 'assistant', message: { id: 'x', model: '<synthetic>', usage: { output_tokens: 1 } } }));
    expect(c.size).toBe(0);
  });

  it('prices the whole request at long-context rates above the threshold', () => {
    const c = new ClaudeCodeUsageCollector();
    c.addLine(assistant('m1', '2026-10-10T10:00:01Z', { input_tokens: 100_001, output_tokens: 1000 }));
    expect(recordCost(c.records[0], haiku)).toBeCloseTo((100_001 * 0.5 + 1000 * 2.5) / 1e6);
  });

  it('matches API ids, dated snapshots and catalog ids', () => {
    expect(modelKey('claude-haiku-4-5-20251001')).toBe(modelKey('claude-haiku-4.5'));
    expect(modelKey('claude-opus-5-5[1m]')).toBe(modelKey('claude-opus-5-5'));
    expect(modelKey('claude-opus-5')).not.toBe(modelKey('claude-opus-5-5'));
  });

  it('reports unpriced models instead of guessing', () => {
    const c = new ClaudeCodeUsageCollector();
    c.addLine(assistant('m1', '2026-10-10T10:00:01Z', { input_tokens: 10, output_tokens: 10 }));
    const t = summarizeUsage(c.records, () => undefined);
    expect(t.unpricedModels).toEqual(['claude-opus-5-5']);
    expect(t.cost).toBe(0);
  });
});

describe('Claude Code turns', () => {
  it('counts human prompts and ignores tool results, meta, subagents and interrupts', () => {
    expect(parseClaudeCodeTurn(user('u1', 't', { origin: { kind: 'human' }, message: { content: 'fix it' } }))).not.toBeNull();
    expect(parseClaudeCodeTurn(user('u2', 't', { origin: { kind: 'task-notification' }, message: { content: 'done' } }))).toBeNull();
    expect(parseClaudeCodeTurn(user('u3', 't', { message: { content: [{ type: 'tool_result', content: 'ok' }] } }))).toBeNull();
    expect(parseClaudeCodeTurn(user('u4', 't', { isMeta: true, message: { content: 'caveat' } }))).toBeNull();
    expect(parseClaudeCodeTurn(user('u5', 't', { isSidechain: true, message: { content: 'task' } }))).toBeNull();
    expect(parseClaudeCodeTurn(user('u6', 't', { message: { content: [{ type: 'text', text: '[Request interrupted by user]' }] } }))).toBeNull();
    expect(parseClaudeCodeTurn(user('u7', 't', { message: { content: [{ type: 'text', text: 'older client prompt' }] } }))).not.toBeNull();
  });

  it('assigns requests to turns and tracks context size from the last main-thread request', () => {
    const c = new ClaudeCodeUsageCollector();
    c.addText([
      user('u1', '2026-10-10T10:00:00Z', { origin: { kind: 'human' }, message: { content: 'a' } }),
      assistant('m1', '2026-10-10T10:00:01Z', { input_tokens: 5, cache_read_input_tokens: 1000, output_tokens: 10 }),
      assistant('m2', '2026-10-10T10:00:02Z', { input_tokens: 5, cache_read_input_tokens: 9000, output_tokens: 10 }, { isSidechain: true }),
      user('u2', '2026-10-10T10:01:00Z', { origin: { kind: 'human' }, message: { content: 'b' } }),
      assistant('m3', '2026-10-10T10:01:01Z', { input_tokens: 5, cache_read_input_tokens: 2000, output_tokens: 10 }),
    ].join('\n'));
    const stats = sessionTurnStats(c.turns, c.records, () => opus);
    expect(stats.map(s => [s.turn, s.requests, s.contextTokens])).toEqual([[1, 2, 1005], [2, 1, 2005]]);
    expect(cacheHitRate(summarizeUsage(c.records, () => opus))).toBeCloseTo(12000 / 12015);
  });
});
