
describe('computeAgentImpact', () => {
  const { computeAgentImpact } = require('../src/core/priceWatch');
  test('prices each changed rate on the matching tokens of each agent', () => {
    const changes = [
      { modelId: 'claude-opus-5-5', label: 'Claude Opus 5.5', field: 'input', oldRate: 4, newRate: 3, pctChange: -25, detectedAt: '' },
      { modelId: 'claude-opus-5-5', label: 'Claude Opus 5.5', field: 'cachedInput', oldRate: 0.4, newRate: 0.3, pctChange: -25, detectedAt: '' },
    ];
    const usage = {
      'claude-code': { weekByModel: [{ modelId: 'claude-opus-5-5', inputTokens: 2_000_000, outputTokens: 0, cacheReadTokens: 10_000_000 }] },
      codex: { weekByModel: [{ modelId: 'gpt-6-1-sol', inputTokens: 5_000_000, outputTokens: 0, cacheReadTokens: 0 }] },
    };
    const r = computeAgentImpact(changes, usage);
    expect(r.rows.map((x: { agent: string; field: string; delta: number }) => [x.agent, x.field, +x.delta.toFixed(2)])).toEqual([['claude-code', 'input', -2], ['claude-code', 'cachedInput', -1]]);
    expect(+r.weekDelta.toFixed(2)).toBe(-3);
    expect(+r.monthlyDelta.toFixed(2)).toBe(-12.86);
  });
});
