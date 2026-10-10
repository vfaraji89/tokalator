import { copilotCliPremiumRequests, parseCopilotCli } from '../../src/core/agents/copilotCli.pure';

const FILE = '/home/u/.copilot/session-state/sess-1/events.jsonl';
let seq = 0;
const ev = (type: string, data: object) => JSON.stringify({ type, data, id: `e${++seq}`, timestamp: `2026-10-10T10:00:${String(seq).padStart(2, '0')}Z` });

const start = (extra: object = {}) => ev('session.start', { sessionId: 'sess-1', context: { cwd: '/w/app' }, ...extra });
const user = () => ev('user.message', { content: 'x' });
const reply = (messageId: string, outputTokens: number) => ev('assistant.message', { messageId, content: 'y', outputTokens });
const shutdown = (metrics: object, premium = 1) => ev('session.shutdown', { totalPremiumRequests: premium, modelMetrics: metrics, currentModel: 'gpt-5-mini' });
const usage = (inputTokens: number, outputTokens: number, cacheReadTokens: number) => ({
  requests: { count: 2, cost: 1 }, usage: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens: 0, reasoningTokens: 0 },
});

describe('Copilot CLI usage parsing', () => {
  beforeEach(() => { seq = 0; });

  it('reads per-message output and attributes shutdown input per model', () => {
    const text = [
      start({ selectedModel: 'gpt-5-mini' }), user(), ev('assistant.turn_start', { turnId: '0' }),
      reply('m1', 100), ev('assistant.turn_end', { turnId: '0' }), reply('m2', 50),
      shutdown({ 'gpt-5-mini': usage(1000, 180, 600) }, 3),
    ].join('\n');
    const { records, turns } = parseCopilotCli(text, FILE);
    expect(turns).toHaveLength(1);
    expect(turns[0].sessionId).toBe('sess-1');
    expect(records.map((r) => [r.model, r.inputTokens, r.outputTokens, r.cacheReadTokens, !!r.estimated])).toEqual([
      ['gpt-5-mini', 0, 100, 0, false],
      ['gpt-5-mini', 0, 50, 0, false],
      ['gpt-5-mini', 400, 30, 600, true],
    ]);
    expect(records[2].id).toContain('shutdown-model-metrics');
    expect(records.every((r) => r.cwd === '/w/app' && r.entrypoint === 'copilot-cli')).toBe(true);
    expect(copilotCliPremiumRequests(text)).toBe(3);
  });

  it('tracks the model across a mid-session change', () => {
    const text = [
      start({ selectedModel: 'claude-sonnet-4.6' }), user(), reply('m1', 10),
      ev('session.model_change', { newModel: 'copilot/gpt-5.4' }), user(), reply('m2', 20),
      shutdown({ 'claude-sonnet-4.6': usage(500, 10, 0), 'gpt-5.4': usage(700, 20, 100) }),
    ].join('\n');
    const { records, turns } = parseCopilotCli(text, FILE);
    expect(turns).toHaveLength(2);
    expect(records.map((r) => [r.model, r.inputTokens, r.outputTokens])).toEqual([
      ['claude-sonnet-4.6', 0, 10],
      ['gpt-5.4', 0, 20],
      ['claude-sonnet-4.6', 500, 0],
      ['gpt-5.4', 600, 0],
    ]);
  });

  it('keeps output records without a shutdown and backfills the model', () => {
    const text = [start(), user(), reply('m1', 40), ev('tool.execution_complete', { model: 'gpt-5-mini' }), reply('m2', 5)].join('\n');
    const { records } = parseCopilotCli(text, FILE);
    expect(records.map((r) => [r.model, r.outputTokens])).toEqual([['gpt-5-mini', 40], ['gpt-5-mini', 5]]);
    expect(copilotCliPremiumRequests(text)).toBeNull();
  });

  it('skips malformed lines and falls back to the directory name for the session', () => {
    const text = ['{not json', '', 'null', '"str"', user(), reply('m1', 7), '{"type":"assistant.message"}'].join('\n');
    const { records, turns } = parseCopilotCli(text, FILE);
    expect(turns).toHaveLength(1);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ sessionId: 'sess-1', model: 'unknown', outputTokens: 7, cwd: '' });
    expect(() => parseCopilotCli('\u0000garbage', 'x')).not.toThrow();
  });
});
