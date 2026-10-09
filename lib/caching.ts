/**
 * Caching ROI Calculator
 * Calculate break-even point and savings for prompt caching
 */

import { getPricingTier, formatCost } from './pricing';

// ============================================
// TYPES
// ============================================

export interface CachingAnalysis {
  cacheWriteCost: number;
  cacheReadCostPerUse: number;
  inputCostPerUse: number;
  savingsPerReuse: number;
  breakEvenReuses: number;
  totalWithCaching: number;
  totalWithoutCaching: number;
  netSavings: number;
  savingsPercent: number;
  shouldCache: boolean;
  recommendation: string;
}

export interface CachingScenario {
  cacheTokens: number;
  reuseCount: number;
  model: string;
  uncachedTokens?: number; // Sent with every call, priced as input either way
}

// ============================================
// CACHING CALCULATIONS
// ============================================

/** Reuses after the first call at which caching stops costing more: (write - input) / (input - read). */
function breakEvenFor(rate: { inputCostPerMTok: number; cacheWriteCostPerMTok: number; cacheReadCostPerMTok: number }): number {
  const savedPerRead = rate.inputCostPerMTok - rate.cacheReadCostPerMTok;
  return savedPerRead > 0 ? (rate.cacheWriteCostPerMTok - rate.inputCostPerMTok) / savedPerRead : Infinity;
}

/**
 * Compare one cache write plus N cache reads with N + 1 uncached calls.
 */
export function analyzeCaching(scenario: CachingScenario): CachingAnalysis {
  const { cacheTokens, reuseCount, model, uncachedTokens = 0 } = scenario;
  const pricing = getPricingTier(model, cacheTokens + uncachedTokens);
  const perToken = (rate: number) => (rate * cacheTokens) / 1_000_000;

  const cacheWriteCost = perToken(pricing.cacheWriteCostPerMTok);
  const cacheReadCostPerUse = perToken(pricing.cacheReadCostPerMTok);
  const inputCostPerUse = perToken(pricing.inputCostPerMTok);
  const uncachedCostPerCall = (uncachedTokens * pricing.inputCostPerMTok) / 1_000_000;
  const savingsPerReuse = inputCostPerUse - cacheReadCostPerUse;
  const breakEvenReuses = breakEvenFor(pricing);

  const calls = reuseCount + 1;
  const totalWithCaching = cacheWriteCost + cacheReadCostPerUse * reuseCount + uncachedCostPerCall * calls;
  const totalWithoutCaching = (inputCostPerUse + uncachedCostPerCall) * calls;
  const netSavings = totalWithoutCaching - totalWithCaching;
  const savingsPercent = totalWithoutCaching > 0 ? (netSavings / totalWithoutCaching) * 100 : 0;
  const shouldCache = cacheTokens > 0 && reuseCount > 0 && reuseCount >= breakEvenReuses;

  let recommendation: string;
  if (cacheTokens <= 0) {
    recommendation = 'No tokens to cache';
  } else if (reuseCount === 0) {
    recommendation = 'No reuses planned, so caching cannot save money';
  } else if (shouldCache) {
    recommendation = `Cache it. You save ${formatCost(netSavings)} (${savingsPercent.toFixed(0)}%)`;
  } else if (!Number.isFinite(breakEvenReuses)) {
    recommendation = 'Cache reads are not cheaper than input for this model';
  } else {
    const reusesNeeded = Math.ceil(breakEvenReuses) - reuseCount;
    recommendation = `Not worth caching yet. Need ${reusesNeeded} more reuse${reusesNeeded > 1 ? 's' : ''} to break even`;
  }

  return {
    cacheWriteCost,
    cacheReadCostPerUse,
    inputCostPerUse,
    savingsPerReuse,
    breakEvenReuses,
    totalWithCaching,
    totalWithoutCaching,
    netSavings,
    savingsPercent,
    shouldCache,
    recommendation,
  };
}

/**
 * Calculate break-even point for a given model
 */
export function calculateBreakeven(model: string): {
  breakEvenReuses: number;
  writeMultiplier: number;
  readMultiplier: number;
} {
  const pricing = getPricingTier(model);
  return {
    breakEvenReuses: breakEvenFor(pricing),
    writeMultiplier: pricing.cacheWriteCostPerMTok / pricing.inputCostPerMTok,
    readMultiplier: pricing.cacheReadCostPerMTok / pricing.inputCostPerMTok,
  };
}

/**
 * Generate cost comparison data for charting
 */
export function generateCostComparisonData(
  cacheTokens: number,
  model: string,
  maxReuses: number = 10,
  uncachedTokens: number = 0
): Array<{ reuses: number; withCaching: number; withoutCaching: number }> {
  return Array.from({ length: maxReuses + 1 }, (_, reuses) => {
    const analysis = analyzeCaching({ cacheTokens, reuseCount: reuses, model, uncachedTokens });
    return { reuses, withCaching: analysis.totalWithCaching, withoutCaching: analysis.totalWithoutCaching };
  });
}

/**
 * Calculate optimal cache strategy for a given budget
 */
export function optimizeCacheForBudget(
  budget: number,
  cacheTokens: number,
  model: string
): { maxReuses: number; costPerReuse: number } {
  const analysis = analyzeCaching({ cacheTokens, reuseCount: 1, model });

  // With caching: budget = writeCost + (readCost * reuses)
  // reuses = (budget - writeCost) / readCost
  const maxReusesWithCaching = Math.floor(
    (budget - analysis.cacheWriteCost) / analysis.cacheReadCostPerUse
  );

  // Without caching: budget = inputCost * uses
  const maxUsesWithoutCaching = Math.floor(budget / analysis.inputCostPerUse);

  // Return whichever allows more uses
  if (maxReusesWithCaching > maxUsesWithoutCaching) {
    return {
      maxReuses: maxReusesWithCaching,
      costPerReuse: analysis.cacheReadCostPerUse,
    };
  }

  return {
    maxReuses: maxUsesWithoutCaching - 1, // -1 because first use counts
    costPerReuse: analysis.inputCostPerUse,
  };
}
