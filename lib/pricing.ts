/**
 * Tokalator - Cost Calculation & Economic Model Library
 * Based on Bergemann, Bonatti, Smolin (2025) "The Economics of Large Language Models"
 * 
 * Cobb-Douglas Quality Function: Q = X^α × Y^β × (b + Z)^γ
 * where:
 *   X = input tokens
 *   Y = output tokens  
 *   Z = cache/fine-tuning tokens
 *   α, β, γ = sensitivity parameters (α + β + γ < 1)
 *   b = base model quality
 */

// ============================================
// TYPES
// ============================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens?: number;
  cacheReadTokens?: number;
  promptLength?: number; // For Sonnet's tiered pricing
}

export interface ServiceUsage {
  webSearches?: number;
  codeExecMinutes?: number;
}

export interface PricingTier {
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  cacheWriteCostPerMTok: number;
  cacheReadCostPerMTok: number;
  promptTokenThreshold?: number | null;
}

export interface ModelParams {
  baseQuality: number; // b
  alphaParam: number;  // α
  betaParam: number;   // β
  gammaParam: number;  // γ
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheWriteCost: number;
  cacheReadCost: number;
  webSearchCost: number;
  codeExecCost: number;
  totalCost: number;
}

export interface QualityMetrics {
  qualityScore: number;
  costPerQualityUnit: number;
  marginalCostInput: number;
  marginalCostOutput: number;
}

// ============================================
// CONSTANTS - Anthropic Pricing (January 2026)
// ============================================

export const MODEL_LIMITS = {
  'claude-opus-4.5': { contextWindow: 200_000, maxOutput: 32_000 },
  'claude-sonnet-4.5': { contextWindow: 200_000, maxOutput: 64_000 },
  'claude-haiku-4.5': { contextWindow: 200_000, maxOutput: 64_000 },
} as const;

export const ANTHROPIC_PRICING = {
  'claude-opus-4.5': {
    standard: {
      inputCostPerMTok: 5.0,
      outputCostPerMTok: 25.0,
      cacheWriteCostPerMTok: 6.25,
      cacheReadCostPerMTok: 0.50,
    },
  },
  'claude-sonnet-4.5': {
    standard: {
      inputCostPerMTok: 3.0,
      outputCostPerMTok: 15.0,
      cacheWriteCostPerMTok: 3.75,
      cacheReadCostPerMTok: 0.30,
    },
    extended: { // >200K tokens
      inputCostPerMTok: 6.0,
      outputCostPerMTok: 22.50,
      cacheWriteCostPerMTok: 7.50,
      cacheReadCostPerMTok: 0.60,
    },
    threshold: 200000,
  },
  'claude-haiku-4.5': {
    standard: {
      inputCostPerMTok: 1.0,
      outputCostPerMTok: 5.0,
      cacheWriteCostPerMTok: 1.25,
      cacheReadCostPerMTok: 0.10,
    },
  },
} as const;

export const SERVICE_PRICING = {
  webSearch: {
    costPer1K: 10.0, // $10 per 1K searches
  },
  codeExecution: {
    costPerHour: 0.05, // $0.05 per hour
    freeHoursPerDay: 50, // 50 free hours per day per org
  },
} as const;

export const MODEL_PARAMS: Record<string, ModelParams> = {
  'claude-opus-4.5': {
    baseQuality: 1.0,
    alphaParam: 0.30,
    betaParam: 0.35,
    gammaParam: 0.20,
  },
  'claude-sonnet-4.5': {
    baseQuality: 0.85,
    alphaParam: 0.25,
    betaParam: 0.30,
    gammaParam: 0.20,
  },
  'claude-haiku-4.5': {
    baseQuality: 0.70,
    alphaParam: 0.20,
    betaParam: 0.25,
    gammaParam: 0.15,
  },
};

// ============================================
// COST CALCULATION FUNCTIONS
// ============================================

/**
 * Get the applicable pricing tier based on prompt length
 */
export function getPricingTier(
  modelName: string,
  promptLength?: number
): PricingTier {
  const pricing = ANTHROPIC_PRICING[modelName as keyof typeof ANTHROPIC_PRICING];
  if (!pricing) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  // Check for tiered pricing (Sonnet)
  if ('threshold' in pricing && promptLength !== undefined) {
    if (promptLength > pricing.threshold) {
      return pricing.extended;
    }
  }

  return pricing.standard;
}

/**
 * Calculate token costs
 */
export function calculateTokenCost(
  usage: TokenUsage,
  pricing: PricingTier
): Omit<CostBreakdown, 'webSearchCost' | 'codeExecCost' | 'totalCost'> {
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputCostPerMTok;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputCostPerMTok;
  const cacheWriteCost = ((usage.cacheWriteTokens || 0) / 1_000_000) * pricing.cacheWriteCostPerMTok;
  const cacheReadCost = ((usage.cacheReadTokens || 0) / 1_000_000) * pricing.cacheReadCostPerMTok;

  return {
    inputCost,
    outputCost,
    cacheWriteCost,
    cacheReadCost,
  };
}

/**
 * Calculate service costs (web search, code execution)
 */
export function calculateServiceCost(usage: ServiceUsage): { webSearchCost: number; codeExecCost: number } {
  const webSearchCost = ((usage.webSearches || 0) / 1000) * SERVICE_PRICING.webSearch.costPer1K;
  const codeExecCost = ((usage.codeExecMinutes || 0) / 60) * SERVICE_PRICING.codeExecution.costPerHour;

  return { webSearchCost, codeExecCost };
}

/**
 * Calculate total cost breakdown
 */
export function calculateCost(
  modelName: string,
  tokenUsage: TokenUsage,
  serviceUsage?: ServiceUsage
): CostBreakdown {
  const pricing = getPricingTier(modelName, tokenUsage.promptLength);
  const tokenCosts = calculateTokenCost(tokenUsage, pricing);
  const serviceCosts = calculateServiceCost(serviceUsage || {});

  const totalCost =
    tokenCosts.inputCost +
    tokenCosts.outputCost +
    tokenCosts.cacheWriteCost +
    tokenCosts.cacheReadCost +
    serviceCosts.webSearchCost +
    serviceCosts.codeExecCost;

  return {
    ...tokenCosts,
    ...serviceCosts,
    totalCost,
  };
}

// ============================================
// ECONOMIC MODEL FUNCTIONS (Cobb-Douglas)
// ============================================

/**
 * Calculate quality score using Cobb-Douglas production function
 * Q = X^α × Y^β × (b + Z)^γ
 */
export function calculateQuality(
  inputTokens: number,
  outputTokens: number,
  cacheTokens: number,
  params: ModelParams
): number {
  const { baseQuality, alphaParam, betaParam, gammaParam } = params;
  
  // Normalize tokens to reasonable scale (per 1K)
  const X = inputTokens / 1000;
  const Y = outputTokens / 1000;
  const Z = cacheTokens / 1000;

  if (X <= 0 || Y <= 0) return 0;

  const quality = Math.pow(X, alphaParam) * 
                  Math.pow(Y, betaParam) * 
                  Math.pow(baseQuality + Z, gammaParam);

  return quality;
}

/**
 * Calculate minimum cost to achieve target quality
 * From Lemma 4 in the paper
 */
export function calculateMinCostForQuality(
  targetQuality: number,
  modelName: string,
  useCaching: boolean = false
): { inputTokens: number; outputTokens: number; cacheTokens: number; cost: number } {
  const params = MODEL_PARAMS[modelName];
  const pricing = getPricingTier(modelName);
  
  if (!params) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  const { baseQuality, alphaParam, betaParam, gammaParam } = params;
  const { inputCostPerMTok, outputCostPerMTok, cacheWriteCostPerMTok } = pricing;

  // Cost coefficients (per 1K tokens)
  const cx = inputCostPerMTok / 1000;
  const cy = outputCostPerMTok / 1000;
  const cz = cacheWriteCostPerMTok / 1000;

  if (!useCaching) {
    // Without caching: solve for optimal X, Y given Z = 0
    // From the paper's closed-form solution
    const sumAB = alphaParam + betaParam;
    
    const factor = Math.pow(targetQuality / Math.pow(baseQuality, gammaParam), 1 / sumAB);
    const ratioXY = (alphaParam * cy) / (betaParam * cx);
    
    const X = factor * Math.pow(ratioXY, betaParam / sumAB);
    const Y = factor * Math.pow(1 / ratioXY, alphaParam / sumAB);
    
    const cost = cx * X + cy * Y;
    
    return {
      inputTokens: Math.round(X * 1000),
      outputTokens: Math.round(Y * 1000),
      cacheTokens: 0,
      cost: cost * 1000, // Convert back to per-MTok basis
    };
  } else {
    // With caching: solve for optimal X, Y, Z
    const sumABG = alphaParam + betaParam + gammaParam;
    
    const factor = Math.pow(targetQuality, 1 / sumABG);
    
    // Optimal ratios from paper
    const X = (alphaParam / cx) * Math.pow(cx / alphaParam, alphaParam / sumABG) *
              Math.pow(cy / betaParam, betaParam / sumABG) *
              Math.pow(cz / gammaParam, gammaParam / sumABG) * factor;
    
    const Y = (betaParam / cy) * Math.pow(cx / alphaParam, alphaParam / sumABG) *
              Math.pow(cy / betaParam, betaParam / sumABG) *
              Math.pow(cz / gammaParam, gammaParam / sumABG) * factor;
    
    const Z = (gammaParam / cz) * Math.pow(cx / alphaParam, alphaParam / sumABG) *
              Math.pow(cy / betaParam, betaParam / sumABG) *
              Math.pow(cz / gammaParam, gammaParam / sumABG) * factor - baseQuality;
    
    const cost = cx * X + cy * Y + cz * Math.max(0, Z);
    
    return {
      inputTokens: Math.round(X * 1000),
      outputTokens: Math.round(Y * 1000),
      cacheTokens: Math.round(Math.max(0, Z) * 1000),
      cost: cost * 1000,
    };
  }
}

/**
 * Calculate the fine-tuning/caching threshold (θ̂)
 * Users should cache only if their representative type θ > θ̂
 */
export function calculateCachingThreshold(modelName: string): number {
  const params = MODEL_PARAMS[modelName];
  const pricing = getPricingTier(modelName);
  
  if (!params) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  const { baseQuality, alphaParam, betaParam, gammaParam } = params;
  const { inputCostPerMTok, outputCostPerMTok, cacheWriteCostPerMTok } = pricing;

  // θ̂ = b^(1-α-β-γ) × (cx/α)^α × (cy/β)^β × (cz/γ)^(1-α-β)
  const threshold = 
    Math.pow(baseQuality, 1 - alphaParam - betaParam - gammaParam) *
    Math.pow(inputCostPerMTok / alphaParam, alphaParam) *
    Math.pow(outputCostPerMTok / betaParam, betaParam) *
    Math.pow(cacheWriteCostPerMTok / gammaParam, 1 - alphaParam - betaParam);

  return threshold;
}

/**
 * Calculate quality metrics including marginal costs
 */
export function calculateQualityMetrics(
  modelName: string,
  tokenUsage: TokenUsage
): QualityMetrics {
  const params = MODEL_PARAMS[modelName];
  const pricing = getPricingTier(modelName, tokenUsage.promptLength);
  
  if (!params) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  const cacheTokens = (tokenUsage.cacheWriteTokens || 0) + (tokenUsage.cacheReadTokens || 0);
  const qualityScore = calculateQuality(
    tokenUsage.inputTokens,
    tokenUsage.outputTokens,
    cacheTokens,
    params
  );

  const cost = calculateCost(modelName, tokenUsage);
  const costPerQualityUnit = cost.totalCost / qualityScore;

  // Marginal cost = ∂C/∂X = c_x (cost to add one more token)
  const marginalCostInput = pricing.inputCostPerMTok / 1_000_000;
  const marginalCostOutput = pricing.outputCostPerMTok / 1_000_000;

  return {
    qualityScore,
    costPerQualityUnit,
    marginalCostInput,
    marginalCostOutput,
  };
}

// ============================================
// PROJECTION FUNCTIONS
// ============================================

/**
 * Project future costs based on historical usage
 */
export function projectCosts(
  historicalCosts: number[],
  daysToProject: number,
  method: 'linear' | 'exponential' = 'linear'
): number[] {
  if (historicalCosts.length < 2) {
    return Array(daysToProject).fill(historicalCosts[0] || 0);
  }

  const projections: number[] = [];

  if (method === 'linear') {
    // Linear regression
    const n = historicalCosts.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = historicalCosts.reduce((a, b) => a + b, 0);
    const sumXY = historicalCosts.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    for (let i = 0; i < daysToProject; i++) {
      const projected = intercept + slope * (n + i);
      projections.push(Math.max(0, projected));
    }
  } else {
    // Exponential smoothing
    const alpha = 0.3;
    let smoothed = historicalCosts[0];
    
    for (const cost of historicalCosts) {
      smoothed = alpha * cost + (1 - alpha) * smoothed;
    }

    // Project forward with growth rate from last few points
    const recentGrowth = historicalCosts.length > 1 
      ? historicalCosts[historicalCosts.length - 1] / historicalCosts[historicalCosts.length - 2]
      : 1;

    for (let i = 0; i < daysToProject; i++) {
      projections.push(smoothed * Math.pow(recentGrowth, i + 1));
    }
  }

  return projections;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

/**
 * Format token count with K/M suffix
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Get model display info
 */
export function getModelInfo(modelName: string) {
  const info = {
    'claude-opus-4.5': {
      displayName: 'Claude Opus 4.5',
      description: 'Most intelligent model for building agents and coding',
      color: '#8B5CF6', // Purple
    },
    'claude-sonnet-4.5': {
      displayName: 'Claude Sonnet 4.5',
      description: 'Optimal balance of intelligence, cost, and speed',
      color: '#3B82F6', // Blue
    },
    'claude-haiku-4.5': {
      displayName: 'Claude Haiku 4.5',
      description: 'Fastest, most cost-efficient model',
      color: '#10B981', // Green
    },
  };

  return info[modelName as keyof typeof info] || {
    displayName: modelName,
    description: '',
    color: '#6B7280',
  };
}
