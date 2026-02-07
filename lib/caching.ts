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
}

// ============================================
// CACHING CALCULATIONS
// ============================================

/**
 * Calculate comprehensive caching analysis
 */
export function analyzeCaching(scenario: CachingScenario): CachingAnalysis {
  const { cacheTokens, reuseCount, model } = scenario;
  const pricing = getPricingTier(model);

  // Costs per million tokens
  const inputCostPerMTok = pricing.inputCostPerMTok;
  const cacheWriteCostPerMTok = pricing.cacheWriteCostPerMTok;
  const cacheReadCostPerMTok = pricing.cacheReadCostPerMTok;

  // Convert to actual costs for the given token count
  const tokenMultiplier = cacheTokens / 1_000_000;

  const cacheWriteCost = cacheWriteCostPerMTok * tokenMultiplier;
  const cacheReadCostPerUse = cacheReadCostPerMTok * tokenMultiplier;
  const inputCostPerUse = inputCostPerMTok * tokenMultiplier;

  // Savings per reuse = input cost - cache read cost
  const savingsPerReuse = inputCostPerUse - cacheReadCostPerUse;

  // Break-even: when cache write cost = cumulative savings
  // cacheWriteCost = savingsPerReuse * breakEvenReuses
  const breakEvenReuses = savingsPerReuse > 0
    ? cacheWriteCost / savingsPerReuse
    : Infinity;

  // Total costs for the scenario
  // With caching: write once + read N times
  const totalWithCaching = cacheWriteCost + (cacheReadCostPerUse * reuseCount);

  // Without caching: pay full input cost each time
  const totalWithoutCaching = inputCostPerUse * (reuseCount + 1); // +1 for initial use

  const netSavings = totalWithoutCaching - totalWithCaching;
  const savingsPercent = totalWithoutCaching > 0
    ? (netSavings / totalWithoutCaching) * 100
    : 0;

  const shouldCache = reuseCount >= breakEvenReuses;

  // Generate recommendation
  let recommendation: string;
  if (reuseCount === 0) {
    recommendation = "No reuses planned - caching would only add cost";
  } else if (shouldCache) {
    recommendation = `Cache it! You'll save ${formatCost(netSavings)} (${savingsPercent.toFixed(0)}%)`;
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

  // Write costs writeMultiplier times input
  const writeMultiplier = pricing.cacheWriteCostPerMTok / pricing.inputCostPerMTok;

  // Read costs readMultiplier times input
  const readMultiplier = pricing.cacheReadCostPerMTok / pricing.inputCostPerMTok;

  // Break-even formula:
  // writeMultiplier * input = (1 - readMultiplier) * input * reuses
  // reuses = writeMultiplier / (1 - readMultiplier)
  const breakEvenReuses = writeMultiplier / (1 - readMultiplier);

  return {
    breakEvenReuses,
    writeMultiplier,
    readMultiplier,
  };
}

/**
 * Generate cost comparison data for charting
 */
export function generateCostComparisonData(
  cacheTokens: number,
  model: string,
  maxReuses: number = 10
): Array<{ reuses: number; withCaching: number; withoutCaching: number }> {
  const data: Array<{ reuses: number; withCaching: number; withoutCaching: number }> = [];

  for (let reuses = 0; reuses <= maxReuses; reuses++) {
    const analysis = analyzeCaching({ cacheTokens, reuseCount: reuses, model });
    data.push({
      reuses,
      withCaching: analysis.totalWithCaching,
      withoutCaching: analysis.totalWithoutCaching,
    });
  }

  return data;
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
