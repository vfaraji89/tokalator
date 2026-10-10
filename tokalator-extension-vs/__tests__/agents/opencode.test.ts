import { mapOpenCodeRows } from '../../src/core/agents/opencode.pure';

const T = Date.UTC(2026, 0, 1);
const sessions = [
  { id: 's1', directory: '/w/app', parentId: null },
  { id: 's2', directory: '/w/app', parentId: 's1' },
];
const row = (id: string, sessionId: string, data: object | string) => ({
  id, sessionId, timeCreated: T, data: typeof data === 'string' ? data : JSON.stringify(data),
});
const assistant = (tokens: object, modelID = 'claude-sonnet-4-5') => ({
  role: 'assistant', modelID, time: { created: T + 1000 }, tokens,
});

describe('mapOpenCodeRows', () => {
  it('maps assistant tokens, adding reasoning to output', () => {
    const { records } = mapOpenCodeRows(
      [row('m1', 's1', assistant({ input: 100, output: 40, reasoning: 10, cache: { read: 500, write: 20 } }, 'anthropic/claude-sonnet-4-5'))],
      sessions,
    );
    expect(records).toEqual([{
      id: 'm1', timestamp: new Date(T + 1000).toISOString(), sessionId: 's1', cwd: '/w/app',
      model: 'claude-sonnet-4-5', entrypoint: 'opencode', sidechain: false,
      inputTokens: 100, outputTokens: 50, cacheReadTokens: 500, cacheWrite5mTokens: 20, cacheWrite1hTokens: 0, fast: false,
    }]);
  });

  it('marks child sessions as sidechain and skips their user turns', () => {
    const r = mapOpenCodeRows(
      [row('u1', 's2', { role: 'user' }), row('m1', 's2', assistant({ input: 5, output: 1 }))],
      sessions,
    );
    expect(r.turns).toEqual([]);
    expect(r.records[0]).toMatchObject({ sidechain: true, cacheReadTokens: 0, cacheWrite5mTokens: 0 });
  });

  it('emits one turn per user message, using the row time when data has none', () => {
    const { turns } = mapOpenCodeRows([row('u1', 's1', { role: 'user' }), row('u2', 's1', { role: 'user', time: { created: T + 5 } })], sessions);
    expect(turns).toEqual([
      { id: 'u1', timestamp: new Date(T).toISOString(), sessionId: 's1' },
      { id: 'u2', timestamp: new Date(T + 5).toISOString(), sessionId: 's1' },
    ]);
  });

  it('ignores malformed, zero-token, model-less and unknown-session rows', () => {
    const r = mapOpenCodeRows(
      [
        row('a', 's1', '{not json'),
        row('b', 's1', 'null'),
        row('c', 's1', assistant({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } })),
        row('d', 's1', { role: 'assistant', tokens: { input: 1 } }),
        row('e', 'missing', assistant({ input: 1 })),
        row('f', 's1', assistant({ input: -3, output: 'x', cache: null })),
      ],
      sessions,
    );
    expect(r).toEqual({ records: [], turns: [] });
  });
});
