/**
 * Context Window Utilities
 * Helps visualize and optimize context budget usage
 */

import { MODEL_LIMITS } from './pricing';

// ============================================
// TYPES
// ============================================

export interface ContextBudget {
  systemPromptTokens: number;
  userInputTokens: number;
  reservedOutputTokens: number;
  model: string;
}

export interface ContextAnalysis {
  totalUsed: number;
  totalAvailable: number;
  remaining: number;
  usagePercent: number;
  isOverLimit: boolean;
  isInExtendedPricing: boolean; // For Sonnet >200K
  breakdown: {
    systemPrompt: { tokens: number; percent: number };
    userInput: { tokens: number; percent: number };
    reservedOutput: { tokens: number; percent: number };
    free: { tokens: number; percent: number };
  };
  warnings: string[];
}

// ============================================
// TOKEN ESTIMATION
// ============================================

/**
 * Estimate token count from text
 * Uses ~4 characters per token heuristic (reasonably accurate for English)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // More accurate heuristic: ~4 chars per token for English
  // Accounts for whitespace and punctuation
  return Math.ceil(text.length / 4);
}

/**
 * Estimate characters from token count
 */
export function estimateCharacters(tokens: number): number {
  return tokens * 4;
}

// ============================================
// CONTEXT ANALYSIS
// ============================================

/**
 * Analyze context budget usage
 */
export function analyzeContextBudget(budget: ContextBudget): ContextAnalysis {
  const limits = MODEL_LIMITS[budget.model as keyof typeof MODEL_LIMITS];

  if (!limits) {
    throw new Error(`Unknown model: ${budget.model}`);
  }

  const totalUsed = budget.systemPromptTokens + budget.userInputTokens + budget.reservedOutputTokens;
  const totalAvailable = limits.contextWindow;
  const remaining = Math.max(0, totalAvailable - totalUsed);
  const usagePercent = (totalUsed / totalAvailable) * 100;

  // Check for Sonnet extended pricing threshold
  const isInExtendedPricing = budget.model === 'claude-sonnet-4.5' &&
    (budget.systemPromptTokens + budget.userInputTokens) > 200_000;

  // Generate warnings
  const warnings: string[] = [];

  if (usagePercent > 90) {
    warnings.push('Context usage above 90% - consider reducing input size');
  }

  if (budget.reservedOutputTokens > limits.maxOutput) {
    warnings.push(`Reserved output exceeds model maximum (${limits.maxOutput.toLocaleString()} tokens)`);
  }

  if (isInExtendedPricing) {
    warnings.push('Extended context pricing applies (>200K tokens) - 2x input cost');
  }

  if (totalUsed > totalAvailable) {
    warnings.push('Total context exceeds model limit!');
  }

  return {
    totalUsed,
    totalAvailable,
    remaining,
    usagePercent: Math.min(100, usagePercent),
    isOverLimit: totalUsed > totalAvailable,
    isInExtendedPricing,
    breakdown: {
      systemPrompt: {
        tokens: budget.systemPromptTokens,
        percent: (budget.systemPromptTokens / totalAvailable) * 100,
      },
      userInput: {
        tokens: budget.userInputTokens,
        percent: (budget.userInputTokens / totalAvailable) * 100,
      },
      reservedOutput: {
        tokens: budget.reservedOutputTokens,
        percent: (budget.reservedOutputTokens / totalAvailable) * 100,
      },
      free: {
        tokens: remaining,
        percent: (remaining / totalAvailable) * 100,
      },
    },
    warnings,
  };
}

/**
 * Calculate how many more turns can fit in context
 */
export function calculateRemainingTurns(
  currentContextTokens: number,
  avgTurnTokens: number,
  model: string
): number {
  const limits = MODEL_LIMITS[model as keyof typeof MODEL_LIMITS];
  if (!limits || avgTurnTokens <= 0) return 0;

  const remaining = limits.contextWindow - currentContextTokens;
  return Math.floor(remaining / avgTurnTokens);
}

/**
 * Get model context limits
 */
export function getModelLimits(model: string) {
  return MODEL_LIMITS[model as keyof typeof MODEL_LIMITS] || null;
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toLocaleString();
}
