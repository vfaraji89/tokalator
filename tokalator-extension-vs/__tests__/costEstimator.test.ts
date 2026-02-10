import { CostEstimator, CostEstimate, CachingEstimate, SessionCostEstimate } from '../src/core/costEstimator';
import { ModelProfile } from '../src/core/modelProfiles';
import { BudgetBreakdown } from '../src/core/types';

// ─── Fixtures ───────────────────────────────────────────────────────────────

/** A model that supports prompt caching (Anthropic-style) */
const anthropicModel: ModelProfile = {
  id: 'claude-sonnet-4',
  label: 'Claude Sonnet 4',
  provider: 'anthropic',
  contextWindow: 200000,
  maxOutput: 16000,
  rotThreshold: 20,
  inputCostPer1M: 3,
  outputCostPer1M: 15,
  cachedInputCostPer1M: 0.30,
  supportsCaching: true,
  cachingType: 'prompt-caching',
};

/** An OpenAI model with automatic caching */
const openaiModel: ModelProfile = {
  id: 'gpt-5.2',
  label: 'GPT-5.2',
  provider: 'openai',
  contextWindow: 256000,
  maxOutput: 32000,
  rotThreshold: 30,
  inputCostPer1M: 2.50,
  outputCostPer1M: 10,
  cachedInputCostPer1M: 1.25,
  supportsCaching: true,
  cachingType: 'automatic',
};

/** A Google model with context caching */
const googleModel: ModelProfile = {
  id: 'gemini-3-pro',
  label: 'Gemini 3 Pro',
  provider: 'google',
  contextWindow: 1048576,
  maxOutput: 65536,
  rotThreshold: 30,
  inputCostPer1M: 1.25,
  outputCostPer1M: 10,
  cachedInputCostPer1M: 0.3125,
  supportsCaching: true,
  cachingType: 'context-caching',
};

/** A hypothetical model with no caching */
const noCacheModel: ModelProfile = {
  id: 'test-no-cache',
  label: 'Test No Cache',
  provider: 'other',
  contextWindow: 128000,
  maxOutput: 8000,
  rotThreshold: 15,
  inputCostPer1M: 5,
  outputCostPer1M: 20,
  cachedInputCostPer1M: 0,
  supportsCaching: false,
  cachingType: 'none',
};

/** Standard budget breakdown for testing */
const standardBreakdown: BudgetBreakdown = {
  files: 20000,
  systemPrompt: 3000,
  instructions: 2000,
  conversation: 5000,
  outputReservation: 16000,
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CostEstimator', () => {
  let estimator: CostEstimator;

  beforeEach(() => {
    estimator = new CostEstimator();
  });

  // ── Basic cost calculation ────────────────────────────────────────────

  describe('estimate() — basic costs', () => {
    it('computes correct input cost', () => {
      const totalInputTokens = 30000; // 30K tokens
      const result = estimator.estimate(anthropicModel, standardBreakdown, totalInputTokens, 5);

      // Expected: (30000 / 1_000_000) * 3 = 0.09
      expect(result.inputCostUSD).toBeCloseTo(0.09, 4);
    });

    it('computes output cost with 2K average estimate', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);

      // Expected: (2000 / 1_000_000) * 15 = 0.03
      expect(result.outputCostUSD).toBeCloseTo(0.03, 4);
    });

    it('total cost equals input + output', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);

      expect(result.totalCostUSD).toBeCloseTo(
        result.inputCostUSD + result.outputCostUSD,
        6,
      );
    });

    it('carries model metadata', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);

      expect(result.modelId).toBe('claude-sonnet-4');
      expect(result.modelLabel).toBe('Claude Sonnet 4');
      expect(result.inputTokens).toBe(30000);
      expect(result.outputTokensEstimate).toBe(2000);
    });
  });

  // ── Caching: Anthropic (prompt-caching) ───────────────────────────────

  describe('Caching — Anthropic prompt-caching', () => {
    it('reports caching as supported', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);
      expect(result.caching.supported).toBe(true);
      expect(result.caching.type).toBe('prompt-caching');
    });

    it('identifies cacheable tokens (system + instructions + 70% files)', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);

      // cacheable = systemPrompt(3000) + instructions(2000) + 70%*files(20000) = 19000
      expect(result.caching.cacheableTokens).toBe(19000);
    });

    it('estimates 80% hit ratio for Anthropic', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);
      expect(result.caching.estimatedHitRatio).toBe(0.80);
    });

    it('cached cost is lower than uncached cost', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);
      expect(result.caching.cachedCostUSD).toBeLessThan(result.caching.uncachedCostUSD);
    });

    it('reports positive savings', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);
      expect(result.caching.savingsPerTurnUSD).toBeGreaterThan(0);
      expect(result.caching.savingsPercent).toBeGreaterThan(0);
    });
  });

  // ── Caching: OpenAI (automatic) ──────────────────────────────────────

  describe('Caching — OpenAI automatic', () => {
    it('reports automatic caching type', () => {
      const result = estimator.estimate(openaiModel, standardBreakdown, 30000, 5);
      expect(result.caching.type).toBe('automatic');
    });

    it('estimates 65% hit ratio for OpenAI', () => {
      const result = estimator.estimate(openaiModel, standardBreakdown, 30000, 5);
      expect(result.caching.estimatedHitRatio).toBe(0.65);
    });

    it('reports 0% hit ratio if input below 1024 tokens', () => {
      const result = estimator.estimate(openaiModel, standardBreakdown, 500, 5);
      expect(result.caching.estimatedHitRatio).toBe(0);
    });
  });

  // ── Caching: Google (context-caching) ─────────────────────────────────

  describe('Caching — Google context-caching', () => {
    it('reports context-caching type', () => {
      const result = estimator.estimate(googleModel, standardBreakdown, 30000, 5);
      expect(result.caching.type).toBe('context-caching');
    });

    it('estimates 75% hit ratio for Google', () => {
      const result = estimator.estimate(googleModel, standardBreakdown, 30000, 5);
      expect(result.caching.estimatedHitRatio).toBe(0.75);
    });
  });

  // ── Caching: none ────────────────────────────────────────────────────

  describe('Caching — no caching support', () => {
    it('reports caching as unsupported', () => {
      const result = estimator.estimate(noCacheModel, standardBreakdown, 30000, 5);
      expect(result.caching.supported).toBe(false);
      expect(result.caching.type).toBe('none');
    });

    it('reports zero savings', () => {
      const result = estimator.estimate(noCacheModel, standardBreakdown, 30000, 5);
      expect(result.caching.savingsPerTurnUSD).toBe(0);
      expect(result.caching.savingsPercent).toBe(0);
    });

    it('cached and uncached costs are equal', () => {
      const result = estimator.estimate(noCacheModel, standardBreakdown, 30000, 5);
      expect(result.caching.cachedCostUSD).toBe(result.caching.uncachedCostUSD);
    });
  });

  // ── Session projections ──────────────────────────────────────────────

  describe('Session projections', () => {
    it('projects session cost from completed turns', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 10);
      expect(result.session.turnsCompleted).toBe(10);
      expect(result.session.estimatedSessionCostUSD).toBeCloseTo(
        10 * result.totalCostUSD,
        6,
      );
    });

    it('projects 10/25/50 turn costs', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);
      expect(result.session.cost10Turns).toBeCloseTo(10 * result.totalCostUSD, 6);
      expect(result.session.cost25Turns).toBeCloseTo(25 * result.totalCostUSD, 6);
      expect(result.session.cost50Turns).toBeCloseTo(50 * result.totalCostUSD, 6);
    });

    it('cached projections are lower than uncached', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);
      expect(result.session.cachedCost10Turns).toBeLessThan(result.session.cost10Turns);
      expect(result.session.cachedCost25Turns).toBeLessThan(result.session.cost25Turns);
      expect(result.session.cachedCost50Turns).toBeLessThan(result.session.cost50Turns);
    });

    it('monthly cost uses 8 sessions/day × 5 turns × 22 days', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);

      const dailyExpected = 8 * 5 * result.totalCostUSD;
      const monthlyExpected = dailyExpected * 22;

      expect(result.session.dailyCostUSD).toBeCloseTo(dailyExpected, 6);
      expect(result.session.monthlyCostUSD).toBeCloseTo(monthlyExpected, 4);
    });

    it('cached monthly is less than uncached monthly', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 30000, 5);
      expect(result.session.cachedMonthlyCostUSD).toBeLessThan(result.session.monthlyCostUSD);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('handles zero input tokens', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 0, 0);
      expect(result.inputCostUSD).toBe(0);
      expect(result.totalCostUSD).toBeGreaterThan(0); // output still costs
      expect(result.session.estimatedSessionCostUSD).toBe(0); // 0 turns
    });

    it('handles zero-cost breakdown', () => {
      const emptyBreakdown: BudgetBreakdown = {
        files: 0,
        systemPrompt: 0,
        instructions: 0,
        conversation: 0,
        outputReservation: 0,
      };
      const result = estimator.estimate(anthropicModel, emptyBreakdown, 0, 0);
      expect(result.caching.cacheableTokens).toBe(0);
    });

    it('all cost values are non-negative', () => {
      const result = estimator.estimate(anthropicModel, standardBreakdown, 50000, 20);
      expect(result.inputCostUSD).toBeGreaterThanOrEqual(0);
      expect(result.outputCostUSD).toBeGreaterThanOrEqual(0);
      expect(result.totalCostUSD).toBeGreaterThanOrEqual(0);
      expect(result.caching.cachedCostUSD).toBeGreaterThanOrEqual(0);
      expect(result.caching.savingsPerTurnUSD).toBeGreaterThanOrEqual(0);
      expect(result.session.monthlyCostUSD).toBeGreaterThanOrEqual(0);
    });
  });
});
