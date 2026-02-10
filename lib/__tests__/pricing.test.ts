/**
 * Unit tests for lib/pricing.ts
 * Tests: cost calculation, tiered pricing, Cobb-Douglas quality, projections
 */
import {
  getPricingTier,
  calculateTokenCost,
  calculateServiceCost,
  calculateCost,
  calculateQuality,
  calculateQualityMetrics,
  calculateMinCostForQuality,
  calculateCachingThreshold,
  projectCosts,
  formatCost,
  formatTokens,
  ANTHROPIC_PRICING,
  MODEL_PARAMS,
  MODEL_LIMITS,
} from '../pricing';

// ============================================
// getPricingTier
// ============================================

describe('getPricingTier', () => {
  it('returns standard tier for Opus at ≤200K tokens', () => {
    const tier = getPricingTier('claude-opus-4.6', 100_000);
    expect(tier.inputCostPerMTok).toBe(5.0);
    expect(tier.outputCostPerMTok).toBe(25.0);
  });

  it('returns extended tier for Opus at >200K tokens', () => {
    const tier = getPricingTier('claude-opus-4.6', 250_000);
    expect(tier.inputCostPerMTok).toBe(10.0);
    expect(tier.outputCostPerMTok).toBe(37.5);
  });

  it('returns standard tier for Sonnet at ≤200K', () => {
    const tier = getPricingTier('claude-sonnet-4.5', 150_000);
    expect(tier.inputCostPerMTok).toBe(3.0);
  });

  it('returns extended tier for Sonnet at >200K', () => {
    const tier = getPricingTier('claude-sonnet-4.5', 300_000);
    expect(tier.inputCostPerMTok).toBe(6.0);
  });

  it('returns standard tier when no prompt length provided', () => {
    const tier = getPricingTier('claude-opus-4.6');
    expect(tier.inputCostPerMTok).toBe(5.0);
  });

  it('Haiku has no extended tier', () => {
    const tier = getPricingTier('claude-haiku-4.5', 300_000);
    expect(tier.inputCostPerMTok).toBe(1.0);
  });

  it('throws for unknown model', () => {
    expect(() => getPricingTier('unknown-model')).toThrow('Unknown model');
  });
});

// ============================================
// calculateTokenCost
// ============================================

describe('calculateTokenCost', () => {
  it('calculates input and output costs correctly', () => {
    const pricing = getPricingTier('claude-opus-4.6');
    const costs = calculateTokenCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      pricing
    );
    expect(costs.inputCost).toBe(5.0);
    expect(costs.outputCost).toBe(25.0);
  });

  it('calculates cache write and read costs', () => {
    const pricing = getPricingTier('claude-opus-4.6');
    const costs = calculateTokenCost(
      {
        inputTokens: 0,
        outputTokens: 0,
        cacheWriteTokens: 1_000_000,
        cacheReadTokens: 1_000_000,
      },
      pricing
    );
    expect(costs.cacheWriteCost).toBe(6.25);
    expect(costs.cacheReadCost).toBe(0.5);
  });

  it('handles zero tokens', () => {
    const pricing = getPricingTier('claude-opus-4.6');
    const costs = calculateTokenCost(
      { inputTokens: 0, outputTokens: 0 },
      pricing
    );
    expect(costs.inputCost).toBe(0);
    expect(costs.outputCost).toBe(0);
    expect(costs.cacheWriteCost).toBe(0);
    expect(costs.cacheReadCost).toBe(0);
  });

  it('200K-token prompt costs $1.00 for Opus input', () => {
    const pricing = getPricingTier('claude-opus-4.6');
    const costs = calculateTokenCost(
      { inputTokens: 200_000, outputTokens: 0 },
      pricing
    );
    expect(costs.inputCost).toBeCloseTo(1.0, 2);
  });
});

// ============================================
// calculateServiceCost
// ============================================

describe('calculateServiceCost', () => {
  it('calculates web search cost', () => {
    const { webSearchCost } = calculateServiceCost({ webSearches: 1000 });
    expect(webSearchCost).toBe(10.0);
  });

  it('calculates code execution cost', () => {
    const { codeExecCost } = calculateServiceCost({ codeExecMinutes: 60 });
    expect(codeExecCost).toBe(0.05);
  });

  it('returns zero for empty usage', () => {
    const result = calculateServiceCost({});
    expect(result.webSearchCost).toBe(0);
    expect(result.codeExecCost).toBe(0);
  });
});

// ============================================
// calculateCost (integration)
// ============================================

describe('calculateCost', () => {
  it('sums all cost components', () => {
    const result = calculateCost(
      'claude-opus-4.6',
      { inputTokens: 1_000_000, outputTokens: 500_000 },
      { webSearches: 100 }
    );
    expect(result.totalCost).toBe(
      result.inputCost +
        result.outputCost +
        result.cacheWriteCost +
        result.cacheReadCost +
        result.webSearchCost +
        result.codeExecCost
    );
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it('uses extended pricing when promptLength exceeds threshold', () => {
    const standard = calculateCost(
      'claude-opus-4.6',
      { inputTokens: 100_000, outputTokens: 0, promptLength: 100_000 }
    );
    const extended = calculateCost(
      'claude-opus-4.6',
      { inputTokens: 100_000, outputTokens: 0, promptLength: 300_000 }
    );
    expect(extended.inputCost).toBe(standard.inputCost * 2);
  });
});

// ============================================
// Cobb-Douglas Quality Function
// ============================================

describe('calculateQuality', () => {
  it('returns 0 for zero input tokens', () => {
    const q = calculateQuality(0, 1000, 0, MODEL_PARAMS['claude-opus-4.6']);
    expect(q).toBe(0);
  });

  it('returns 0 for zero output tokens', () => {
    const q = calculateQuality(1000, 0, 0, MODEL_PARAMS['claude-opus-4.6']);
    expect(q).toBe(0);
  });

  it('quality increases with more input tokens (monotonicity)', () => {
    const params = MODEL_PARAMS['claude-opus-4.6'];
    const q1 = calculateQuality(10_000, 5_000, 0, params);
    const q2 = calculateQuality(50_000, 5_000, 0, params);
    expect(q2).toBeGreaterThan(q1);
  });

  it('quality increases with more output tokens', () => {
    const params = MODEL_PARAMS['claude-opus-4.6'];
    const q1 = calculateQuality(10_000, 1_000, 0, params);
    const q2 = calculateQuality(10_000, 5_000, 0, params);
    expect(q2).toBeGreaterThan(q1);
  });

  it('quality increases with cached tokens', () => {
    const params = MODEL_PARAMS['claude-opus-4.6'];
    const q1 = calculateQuality(10_000, 5_000, 0, params);
    const q2 = calculateQuality(10_000, 5_000, 10_000, params);
    expect(q2).toBeGreaterThan(q1);
  });

  it('satisfies Q = X^α · Y^β · (b+Z)^γ explicitly', () => {
    const params = MODEL_PARAMS['claude-opus-4.6'];
    const X = 10_000;
    const Y = 5_000;
    const Z = 2_000;
    const expected =
      Math.pow(X / 1000, params.alphaParam) *
      Math.pow(Y / 1000, params.betaParam) *
      Math.pow(params.baseQuality + Z / 1000, params.gammaParam);
    const actual = calculateQuality(X, Y, Z, params);
    expect(actual).toBeCloseTo(expected, 6);
  });

  it('α + β + γ < 1 for all models (diminishing returns)', () => {
    for (const [name, p] of Object.entries(MODEL_PARAMS)) {
      expect(p.alphaParam + p.betaParam + p.gammaParam).toBeLessThan(1);
    }
  });
});

// ============================================
// calculateMinCostForQuality
// ============================================

describe('calculateMinCostForQuality', () => {
  it('returns positive tokens and cost for reasonable target', () => {
    const result = calculateMinCostForQuality(5.0, 'claude-opus-4.6', false);
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
    expect(result.cost).toBeGreaterThan(0);
    expect(result.cacheTokens).toBe(0);
  });

  it('with caching returns non-negative cache tokens', () => {
    const result = calculateMinCostForQuality(5.0, 'claude-opus-4.6', true);
    expect(result.cacheTokens).toBeGreaterThanOrEqual(0);
  });

  it('throws for unknown model', () => {
    expect(() => calculateMinCostForQuality(5.0, 'unknown')).toThrow();
  });
});

// ============================================
// projectCosts
// ============================================

describe('projectCosts', () => {
  it('linear projection returns correct length', () => {
    const result = projectCosts([1, 2, 3, 4, 5], 10, 'linear');
    expect(result).toHaveLength(10);
  });

  it('linear projection extrapolates upward trend', () => {
    const result = projectCosts([1, 2, 3, 4, 5], 3, 'linear');
    expect(result[0]).toBeGreaterThan(5);
  });

  it('exponential smoothing returns correct length', () => {
    const result = projectCosts([1, 2, 3, 4, 5], 7, 'exponential');
    expect(result).toHaveLength(7);
  });

  it('handles single data point', () => {
    const result = projectCosts([42], 5);
    expect(result).toHaveLength(5);
    result.forEach((v) => expect(v).toBe(42));
  });

  it('projections are non-negative', () => {
    const result = projectCosts([10, 8, 6, 4, 2], 10, 'linear');
    result.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});

// ============================================
// Utility functions
// ============================================

describe('formatCost', () => {
  it('formats dollar amounts', () => {
    expect(formatCost(1.5)).toContain('1.50');
  });

  it('formats zero', () => {
    expect(formatCost(0)).toContain('0.00');
  });
});

describe('formatTokens', () => {
  it('formats millions', () => {
    expect(formatTokens(1_500_000)).toBe('1.50M');
  });

  it('formats thousands', () => {
    expect(formatTokens(12_500)).toBe('12.5K');
  });

  it('formats small numbers as-is', () => {
    expect(formatTokens(500)).toBe('500');
  });
});

// ============================================
// Constants integrity
// ============================================

describe('MODEL_LIMITS', () => {
  it('all models have context window > 0', () => {
    for (const [name, limits] of Object.entries(MODEL_LIMITS)) {
      expect(limits.contextWindow).toBeGreaterThan(0);
      expect(limits.maxOutput).toBeGreaterThan(0);
    }
  });

  it('maxOutput < contextWindow for all models', () => {
    for (const [name, limits] of Object.entries(MODEL_LIMITS)) {
      expect(limits.maxOutput).toBeLessThan(limits.contextWindow);
    }
  });
});

describe('ANTHROPIC_PRICING', () => {
  it('cache read cost < input cost for all models', () => {
    for (const [name, pricing] of Object.entries(ANTHROPIC_PRICING)) {
      expect(pricing.standard.cacheReadCostPerMTok).toBeLessThan(
        pricing.standard.inputCostPerMTok
      );
    }
  });

  it('cache write cost > input cost for all models (write premium)', () => {
    for (const [name, pricing] of Object.entries(ANTHROPIC_PRICING)) {
      expect(pricing.standard.cacheWriteCostPerMTok).toBeGreaterThan(
        pricing.standard.inputCostPerMTok
      );
    }
  });
});
