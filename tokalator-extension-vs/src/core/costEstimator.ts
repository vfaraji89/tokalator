import { ModelProfile } from './modelProfiles';
import { BudgetBreakdown } from './types';

/**
 * Cost estimate for a single request (this turn).
 */
export interface CostEstimate {
  /** Model used for estimation */
  modelId: string;
  modelLabel: string;

  /** Input cost for this turn */
  inputTokens: number;
  inputCostUSD: number;

  /** Output cost estimate (using maxOutput as upper bound, avgOutput as typical) */
  outputTokensEstimate: number;
  outputCostUSD: number;

  /** Total estimated cost for this turn (input + output) */
  totalCostUSD: number;

  /** Caching analysis */
  caching: CachingEstimate;

  /** Session cost projections */
  session: SessionCostEstimate;
}

/**
 * Prompt caching analysis.
 */
export interface CachingEstimate {
  /** Whether the model supports caching */
  supported: boolean;
  /** Type of caching mechanism */
  type: 'prompt-caching' | 'automatic' | 'context-caching' | 'none';
  /** Description of how caching works for this provider */
  description: string;

  /** Tokens that could be cached (system + instructions = stable prefix) */
  cacheableTokens: number;
  /** Tokens that change each turn (conversation + file edits) */
  uncacheableTokens: number;
  /** Cache hit ratio estimate (0-1) */
  estimatedHitRatio: number;

  /** Cost WITH caching (blended rate) */
  cachedCostUSD: number;
  /** Cost WITHOUT caching (full rate) */
  uncachedCostUSD: number;
  /** Savings per turn */
  savingsPerTurnUSD: number;
  /** Savings percentage */
  savingsPercent: number;
}

/**
 * Session-level cost projections.
 */
export interface SessionCostEstimate {
  /** Cost so far (turns × estimated per-turn cost) */
  turnsCompleted: number;
  estimatedSessionCostUSD: number;

  /** Projected cost for typical session lengths */
  cost10Turns: number;
  cost25Turns: number;
  cost50Turns: number;

  /** With caching applied */
  cachedCost10Turns: number;
  cachedCost25Turns: number;
  cachedCost50Turns: number;

  /** Daily/monthly projections (assuming 8 sessions/day, 5 turns avg) */
  dailyCostUSD: number;
  monthlyCostUSD: number;
  cachedDailyCostUSD: number;
  cachedMonthlyCostUSD: number;
}

/**
 * Estimates the dollar cost of AI context based on token usage and model pricing.
 *
 * Supports:
 * - Per-turn input/output cost calculation
 * - Prompt caching savings estimation (Anthropic, OpenAI, Google)
 * - Session and monthly cost projections
 */
export class CostEstimator {

  /**
   * Compute a full cost estimate for the current context state.
   */
  estimate(
    model: ModelProfile,
    breakdown: BudgetBreakdown,
    totalInputTokens: number,
    chatTurnCount: number,
  ): CostEstimate {

    // 1. Input cost (this turn)
    const inputCost = (totalInputTokens / 1_000_000) * model.inputCostPer1M;

    // 2. Output cost estimate
    // Use a reasonable average: ~2K tokens per assistant response (typical coding reply)
    const avgOutputTokens = 2000;
    const outputCost = (avgOutputTokens / 1_000_000) * model.outputCostPer1M;

    // 3. Caching analysis
    const caching = this.estimateCaching(model, breakdown, totalInputTokens);

    // 4. Per-turn cost (with and without caching)
    const perTurnUncached = inputCost + outputCost;
    const perTurnCached = caching.cachedCostUSD + outputCost;

    // 5. Session projections
    const session = this.projectSession(
      model, perTurnUncached, perTurnCached, chatTurnCount
    );

    return {
      modelId: model.id,
      modelLabel: model.label,
      inputTokens: totalInputTokens,
      inputCostUSD: inputCost,
      outputTokensEstimate: avgOutputTokens,
      outputCostUSD: outputCost,
      totalCostUSD: perTurnUncached,
      caching,
      session,
    };
  }

  /**
   * Estimate caching savings.
   */
  private estimateCaching(
    model: ModelProfile,
    breakdown: BudgetBreakdown,
    totalInputTokens: number,
  ): CachingEstimate {

    if (!model.supportsCaching) {
      return {
        supported: false,
        type: 'none',
        description: 'This model does not support prompt caching.',
        cacheableTokens: 0,
        uncacheableTokens: totalInputTokens,
        estimatedHitRatio: 0,
        cachedCostUSD: (totalInputTokens / 1_000_000) * model.inputCostPer1M,
        uncachedCostUSD: (totalInputTokens / 1_000_000) * model.inputCostPer1M,
        savingsPerTurnUSD: 0,
        savingsPercent: 0,
      };
    }

    // Cacheable = system prompt + instructions (stable across turns)
    // Partially cacheable = files (stable if not editing)
    // Uncacheable = conversation history (grows each turn)
    const stableTokens = breakdown.systemPrompt + breakdown.instructions;
    const fileTokens = breakdown.files;
    const volatileTokens = breakdown.conversation;

    // Estimate what fraction of file tokens are cacheable
    // Heuristic: ~70% of file tokens stay stable between turns
    // (user typically edits 1-2 files per turn, rest are reference files)
    const stableFileTokens = Math.round(fileTokens * 0.7);

    const cacheableTokens = stableTokens + stableFileTokens;
    const uncacheableTokens = totalInputTokens - cacheableTokens;

    // Estimate hit ratio based on turn count
    // First turn: 0% (cache cold), subsequent: rises quickly
    let hitRatio: number;
    if (model.cachingType === 'automatic') {
      // OpenAI: automatic, kicks in after repeated prefixes
      hitRatio = totalInputTokens > 1024 ? 0.65 : 0;
    } else if (model.cachingType === 'prompt-caching') {
      // Anthropic: explicit cache breakpoints, very high hit rate for stable prefixes
      hitRatio = cacheableTokens > 0 ? 0.80 : 0;
    } else if (model.cachingType === 'context-caching') {
      // Google: explicit cached content, high hit rate
      hitRatio = cacheableTokens > 0 ? 0.75 : 0;
    } else {
      hitRatio = 0;
    }

    // Blended cost: cached portion at cached rate + uncached at full rate
    const cachedPortionTokens = Math.round(totalInputTokens * hitRatio);
    const uncachedPortionTokens = totalInputTokens - cachedPortionTokens;

    const cachedCost =
      (cachedPortionTokens / 1_000_000) * model.cachedInputCostPer1M +
      (uncachedPortionTokens / 1_000_000) * model.inputCostPer1M;

    const uncachedCost = (totalInputTokens / 1_000_000) * model.inputCostPer1M;

    const savings = uncachedCost - cachedCost;
    const savingsPct = uncachedCost > 0 ? (savings / uncachedCost) * 100 : 0;

    // Description by provider
    const descriptions: Record<string, string> = {
      'prompt-caching': 'Anthropic prompt caching: 90% discount on cached reads. System prompt + instructions + stable files are cached.',
      'automatic': 'OpenAI automatic caching: 50% discount on repeated prefixes (≥1024 tokens). No setup needed.',
      'context-caching': 'Google context caching: 75% discount on cached content + storage cost. Explicit cache creation required.',
    };

    return {
      supported: true,
      type: model.cachingType,
      description: descriptions[model.cachingType] || '',
      cacheableTokens,
      uncacheableTokens,
      estimatedHitRatio: hitRatio,
      cachedCostUSD: cachedCost,
      uncachedCostUSD: uncachedCost,
      savingsPerTurnUSD: savings,
      savingsPercent: savingsPct,
    };
  }

  /**
   * Project costs for the session and beyond.
   */
  private projectSession(
    model: ModelProfile,
    perTurnUncached: number,
    perTurnCached: number,
    turnsCompleted: number,
  ): SessionCostEstimate {

    // Sessions per day × turns per session
    const sessionsPerDay = 8;
    const avgTurnsPerSession = 5;

    return {
      turnsCompleted,
      estimatedSessionCostUSD: turnsCompleted * perTurnUncached,

      cost10Turns: 10 * perTurnUncached,
      cost25Turns: 25 * perTurnUncached,
      cost50Turns: 50 * perTurnUncached,

      cachedCost10Turns: 10 * perTurnCached,
      cachedCost25Turns: 25 * perTurnCached,
      cachedCost50Turns: 50 * perTurnCached,

      dailyCostUSD: sessionsPerDay * avgTurnsPerSession * perTurnUncached,
      monthlyCostUSD: sessionsPerDay * avgTurnsPerSession * perTurnUncached * 22,
      cachedDailyCostUSD: sessionsPerDay * avgTurnsPerSession * perTurnCached,
      cachedMonthlyCostUSD: sessionsPerDay * avgTurnsPerSession * perTurnCached * 22,
    };
  }
}
