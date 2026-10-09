import { PROVIDER_MODELS, estimateModelCost, estimateCostBreakdown, calculateCostComparison, findModel, fitsContext, normalizeModelId } from '../providers';
import { ANTHROPIC_PRICING } from '../pricing';
import site from '../../content/site.json';
import pkg from '../../package.json';

const model = (id: string) => PROVIDER_MODELS.find(m => m.id === id)!;

describe('website catalog and release contracts', () => {
  test('site label follows website package version', () => {
    expect(site.version).toBe(`v${pkg.version}`);
  });
  test('IDs are unique and rates and limits are valid', () => {
    expect(new Set(PROVIDER_MODELS.map(m => m.id)).size).toBe(PROVIDER_MODELS.length);
    for (const m of PROVIDER_MODELS) {
      expect(m.inputCostPerMTok).toBeGreaterThan(0);
      expect(m.outputCostPerMTok).toBeGreaterThan(0);
      expect(m.contextWindow).toBeGreaterThanOrEqual(m.maxOutput);
    }
  });
  test('Claude calculators and pricing reference agree', () => {
    for (const [id, pricing] of Object.entries(ANTHROPIC_PRICING)) {
      expect(model(id).inputCostPerMTok).toBe(pricing.standard.inputCostPerMTok);
      expect(model(id).outputCostPerMTok).toBe(pricing.standard.outputCostPerMTok);
    }
  });
  test('long-context rates apply strictly above the threshold to the whole request', () => {
    const astra = model('gpt-6-astra');
    expect(estimateModelCost(astra, 272000, 1000)).toBeCloseTo(2.77);
    expect(estimateModelCost(astra, 272001, 1000)).toBeCloseTo(5.51502);
    expect(calculateCostComparison(272001, 1000).find(m => m.modelId === astra.id)?.cost).toBeCloseTo(5.51502);
  });
  test('invalid usage is rejected, empty usage costs zero', () => {
    for (const value of [-1, NaN, Infinity]) {
      expect(() => estimateModelCost(model('gpt-6-astra'), value, 0)).toThrow(RangeError);
    }
    expect(estimateModelCost(model('gpt-6-astra'), 0, 0)).toBe(0);
  });
  test('cache tokens count toward the long-context threshold and scale with the input multiplier', () => {
    const haiku = model('claude-haiku-5-5');
    const below = estimateCostBreakdown(haiku, 40_000, 1_000, 0, 60_000);
    expect(below.longContext).toBe(false);
    expect(below.total).toBeCloseTo((40_000 * 0.1 + 1_000 * 0.5 + 60_000 * 0.01) / 1_000_000, 9);
    const above = estimateCostBreakdown(haiku, 40_001, 1_000, 0, 60_000);
    expect(above.longContext).toBe(true);
    expect(above.cacheRead).toBeCloseTo(60_000 * 0.01 * 5 / 1_000_000, 9);
    expect(above.total).toBeCloseTo((40_001 * 0.1 + 1_000 * 0.5 + 60_000 * 0.01) * 5 / 1_000_000, 9);
  });
  test('cache writes use the catalog write rate, or the input rate when none is listed', () => {
    expect(estimateCostBreakdown(model('gpt-6.1-sol'), 0, 0, 100_000).cacheWrite).toBeCloseTo(0.25);
    expect(estimateCostBreakdown(model('gpt-5.5'), 0, 0, 100_000).cacheWrite).toBeCloseTo(0.5);
  });
  test('model lookup matches exact ids after normalizing', () => {
    expect(findModel('claude-opus-4-6')?.id).toBe('claude-opus-4.6');
    expect(findModel('claude-haiku-4-5-20251001')?.id).toBe('claude-haiku-4.5');
    expect(findModel('GPT-5.4-mini')?.id).toBe('gpt-5.4-mini');
    expect(findModel('gpt-5.4')?.id).toBe('gpt-5.4');
    expect(findModel('gpt-5')).toBeUndefined();
    expect(new Set(PROVIDER_MODELS.map(m => normalizeModelId(m.id))).size).toBe(PROVIDER_MODELS.length);
  });
  test('context fit checks window and max output', () => {
    expect(fitsContext(model('claude-haiku-4.5'), 1_000_000, 32_000)).toBe(false);
    expect(fitsContext(model('claude-opus-5-5'), 968_000, 32_000)).toBe(true);
    expect(fitsContext(model('claude-opus-5-5'), 10_000, 128_001)).toBe(false);
  });
});
