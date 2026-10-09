import { PROVIDER_MODELS, estimateModelCost, calculateCostComparison } from '../providers';
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
});
