import { sessionSignals, type SignalSession } from '../src/core/sessionSignals.pure';

const session = (over: Partial<SignalSession> = {}): SignalSession => ({
  turnCount: 6,
  contextTokens: 180_000,
  contextWindow: 1_000_000,
  turnsLeft: 74,
  subagentShare: 0.42,
  inputTokens: 20_000,
  outputTokens: 150_000,
  cacheReadTokens: 300_000,
  cacheWriteTokens: 30_000,
  ...over,
});

describe('sessionSignals', () => {
  test('reports measured shares for the session', () => {
    const s = sessionSignals(session(), 0, 0);
    expect(s.map(x => [x.id, x.value])).toEqual([
      ['context', '18% of 1.0M · ~74 turns left at current growth'],
      ['subagents', '42% of session tokens'],
      ['output', '30% of session tokens'],
      ['cache', '86%'],
    ]);
  });

  test('omits context when the window is unknown', () => {
    expect(sessionSignals(session({ contextWindow: 0 }), 0, 0).some(x => x.id === 'context')).toBe(false);
  });

  test('adds rolling five-hour usage with its trend and no limit claim', () => {
    const last = sessionSignals(null, 3_400_000, 2_000_000)[0];
    expect(last).toMatchObject({ id: 'last5h', value: '3.4M tokens · +70% vs the 5 hours before' });
    expect(JSON.stringify(last)).not.toMatch(/limit|should|try/i);
  });

  test('contains no advice wording', () => {
    const text = JSON.stringify(sessionSignals(session(), 1000, 500));
    expect(text).not.toMatch(/should|consider|try|may fit|recommend/i);
  });
});
