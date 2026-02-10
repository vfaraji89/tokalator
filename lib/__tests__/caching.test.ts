/**
 * Unit tests for lib/caching.ts
 * Tests: break-even analysis, cost comparison, budget optimization
 */
import {
  analyzeCaching,
  calculateBreakeven,
  generateCostComparisonData,
  optimizeCacheForBudget,
} from '../caching';

// ============================================
// analyzeCaching
// ============================================

describe('analyzeCaching', () => {
  it('correctly calculates costs for Opus 4.6', () => {
    const result = analyzeCaching({
      cacheTokens: 1_000_000,
      reuseCount: 10,
      model: 'claude-opus-4.6',
    });
    expect(result.cacheWriteCost).toBeCloseTo(6.25, 2);
    expect(result.cacheReadCostPerUse).toBeCloseTo(0.5, 2);
    expect(result.inputCostPerUse).toBeCloseTo(5.0, 2);
  });

  it('savings are positive when reuses exceed break-even', () => {
    const result = analyzeCaching({
      cacheTokens: 50_000,
      reuseCount: 10,
      model: 'claude-opus-4.6',
    });
    expect(result.netSavings).toBeGreaterThan(0);
    expect(result.savingsPercent).toBeGreaterThan(0);
    expect(result.shouldCache).toBe(true);
  });

  it('recommends against caching with 0 reuses', () => {
    const result = analyzeCaching({
      cacheTokens: 50_000,
      reuseCount: 0,
      model: 'claude-opus-4.6',
    });
    expect(result.shouldCache).toBe(false);
    expect(result.recommendation).toContain('No reuses');
  });

  it('50K tokens, 100 reuses on Sonnet → ~88-89% savings (paper Example 2)', () => {
    const result = analyzeCaching({
      cacheTokens: 50_000,
      reuseCount: 100,
      model: 'claude-sonnet-4.5',
    });
    // Paper claims 88.9% savings
    expect(result.savingsPercent).toBeGreaterThan(85);
    expect(result.savingsPercent).toBeLessThan(92);
    expect(result.shouldCache).toBe(true);
  });

  it('total with caching < total without caching when reuses > break-even', () => {
    const result = analyzeCaching({
      cacheTokens: 100_000,
      reuseCount: 5,
      model: 'claude-opus-4.6',
    });
    expect(result.totalWithCaching).toBeLessThan(result.totalWithoutCaching);
  });
});

// ============================================
// calculateBreakeven
// ============================================

describe('calculateBreakeven', () => {
  it('break-even is ~2 reuses for Anthropic models', () => {
    // Paper claims break-even of 2 reuses for all Anthropic models
    for (const model of ['claude-opus-4.6', 'claude-sonnet-4.5', 'claude-haiku-4.5']) {
      const result = calculateBreakeven(model);
      // Break-even should be between 1 and 3 (paper says ~2)
      expect(result.breakEvenReuses).toBeGreaterThanOrEqual(1);
      expect(result.breakEvenReuses).toBeLessThanOrEqual(3);
    }
  });

  it('write multiplier > 1 (write costs more than input)', () => {
    const result = calculateBreakeven('claude-opus-4.6');
    expect(result.writeMultiplier).toBeGreaterThan(1);
  });

  it('read multiplier < 1 (reading cache is cheaper than input)', () => {
    const result = calculateBreakeven('claude-opus-4.6');
    expect(result.readMultiplier).toBeLessThan(1);
  });
});

// ============================================
// generateCostComparisonData
// ============================================

describe('generateCostComparisonData', () => {
  it('returns correct number of data points', () => {
    const data = generateCostComparisonData(50_000, 'claude-opus-4.6', 10);
    expect(data).toHaveLength(11); // 0 through 10 inclusive
  });

  it('uncached cost grows linearly', () => {
    const data = generateCostComparisonData(50_000, 'claude-opus-4.6', 5);
    const diffs = [];
    for (let i = 1; i < data.length; i++) {
      diffs.push(data[i].withoutCaching - data[i - 1].withoutCaching);
    }
    // All diffs should be approximately equal (linear growth)
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    diffs.forEach((d) => expect(d).toBeCloseTo(avgDiff, 4));
  });

  it('cached cost is eventually lower than uncached', () => {
    const data = generateCostComparisonData(50_000, 'claude-opus-4.6', 10);
    const lastPoint = data[data.length - 1];
    expect(lastPoint.withCaching).toBeLessThan(lastPoint.withoutCaching);
  });
});

// ============================================
// optimizeCacheForBudget
// ============================================

describe('optimizeCacheForBudget', () => {
  it('returns positive max reuses for reasonable budget', () => {
    const result = optimizeCacheForBudget(10.0, 50_000, 'claude-opus-4.6');
    expect(result.maxReuses).toBeGreaterThan(0);
    expect(result.costPerReuse).toBeGreaterThan(0);
  });

  it('more budget = more reuses', () => {
    const small = optimizeCacheForBudget(1.0, 50_000, 'claude-opus-4.6');
    const large = optimizeCacheForBudget(100.0, 50_000, 'claude-opus-4.6');
    expect(large.maxReuses).toBeGreaterThan(small.maxReuses);
  });
});
