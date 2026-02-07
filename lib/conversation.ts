/**
 * Multi-turn Conversation Cost Estimator
 * Simulate conversation costs with different context management strategies
 */

import { calculateCost, formatCost, MODEL_LIMITS } from './pricing';

// ============================================
// TYPES
// ============================================

export type ContextStrategy = 'full' | 'sliding-window' | 'summarize';

export interface ConversationParams {
  systemPromptTokens: number;
  avgUserTokens: number;
  avgAssistantTokens: number;
  turns: number;
  model: string;
  strategy: ContextStrategy;
  windowSize?: number; // For sliding window: number of turns to keep
  compressionRatio?: number; // For summarize: how much to compress (0.1 = 10% of original)
}

export interface TurnBreakdown {
  turn: number;
  inputTokens: number;
  outputTokens: number;
  contextSize: number;
  turnCost: number;
  cumulativeCost: number;
}

export interface ConversationAnalysis {
  turnBreakdown: TurnBreakdown[];
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgCostPerTurn: number;
  finalContextSize: number;
  peakContextSize: number;
  exceedsLimit: boolean;
  limitExceededAtTurn: number | null;
}

export interface StrategyComparison {
  full: ConversationAnalysis;
  slidingWindow: ConversationAnalysis;
  summarize: ConversationAnalysis;
}

// ============================================
// CONVERSATION SIMULATION
// ============================================

/**
 * Simulate a multi-turn conversation
 */
export function simulateConversation(params: ConversationParams): ConversationAnalysis {
  const {
    systemPromptTokens,
    avgUserTokens,
    avgAssistantTokens,
    turns,
    model,
    strategy,
    windowSize = 5,
    compressionRatio = 0.2,
  } = params;

  const limits = MODEL_LIMITS[model as keyof typeof MODEL_LIMITS];
  const contextLimit = limits?.contextWindow || 200_000;

  const turnBreakdown: TurnBreakdown[] = [];
  let cumulativeCost = 0;
  const messageHistory: Array<{ role: 'user' | 'assistant'; tokens: number }> = [];
  let summarizedTokens = 0;
  let exceedsLimit = false;
  let limitExceededAtTurn: number | null = null;
  let peakContextSize = 0;

  for (let turn = 1; turn <= turns; turn++) {
    // Add user message
    messageHistory.push({ role: 'user', tokens: avgUserTokens });

    // Calculate context size based on strategy
    let contextSize: number;

    switch (strategy) {
      case 'full':
        // Full context: system + all messages
        contextSize = systemPromptTokens +
          messageHistory.reduce((sum, msg) => sum + msg.tokens, 0);
        break;

      case 'sliding-window':
        // Keep only last N turns (N * 2 messages for user+assistant pairs)
        const windowMessages = windowSize * 2;
        const recentMessages = messageHistory.slice(-windowMessages);
        contextSize = systemPromptTokens +
          recentMessages.reduce((sum, msg) => sum + msg.tokens, 0);
        break;

      case 'summarize':
        // Compress older messages, keep recent ones fresh
        const recentTurns = 2; // Keep last 2 turns uncompressed
        const recentCount = recentTurns * 2;

        if (messageHistory.length > recentCount) {
          const oldMessages = messageHistory.slice(0, -recentCount);
          const oldTokens = oldMessages.reduce((sum, msg) => sum + msg.tokens, 0);
          summarizedTokens = Math.ceil(oldTokens * compressionRatio);
        }

        const freshMessages = messageHistory.slice(-recentCount);
        const freshTokens = freshMessages.reduce((sum, msg) => sum + msg.tokens, 0);
        contextSize = systemPromptTokens + summarizedTokens + freshTokens;
        break;

      default:
        contextSize = systemPromptTokens;
    }

    // Input tokens = context size (what we send to the model)
    const inputTokens = contextSize;
    const outputTokens = avgAssistantTokens;

    // Check if we exceed the limit
    if (contextSize > contextLimit && !exceedsLimit) {
      exceedsLimit = true;
      limitExceededAtTurn = turn;
    }

    peakContextSize = Math.max(peakContextSize, contextSize);

    // Calculate cost for this turn
    const cost = calculateCost(model, { inputTokens, outputTokens });
    cumulativeCost += cost.totalCost;

    turnBreakdown.push({
      turn,
      inputTokens,
      outputTokens,
      contextSize,
      turnCost: cost.totalCost,
      cumulativeCost,
    });

    // Add assistant response to history
    messageHistory.push({ role: 'assistant', tokens: avgAssistantTokens });
  }

  const totalInputTokens = turnBreakdown.reduce((sum, t) => sum + t.inputTokens, 0);
  const totalOutputTokens = turnBreakdown.reduce((sum, t) => sum + t.outputTokens, 0);

  return {
    turnBreakdown,
    totalCost: cumulativeCost,
    totalInputTokens,
    totalOutputTokens,
    avgCostPerTurn: cumulativeCost / turns,
    finalContextSize: turnBreakdown[turnBreakdown.length - 1]?.contextSize || 0,
    peakContextSize,
    exceedsLimit,
    limitExceededAtTurn,
  };
}

/**
 * Compare all strategies side by side
 */
export function compareStrategies(
  baseParams: Omit<ConversationParams, 'strategy'>,
  windowSize: number = 5,
  compressionRatio: number = 0.2
): StrategyComparison {
  return {
    full: simulateConversation({ ...baseParams, strategy: 'full' }),
    slidingWindow: simulateConversation({
      ...baseParams,
      strategy: 'sliding-window',
      windowSize
    }),
    summarize: simulateConversation({
      ...baseParams,
      strategy: 'summarize',
      compressionRatio
    }),
  };
}

/**
 * Get strategy description
 */
export function getStrategyDescription(strategy: ContextStrategy): {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
} {
  switch (strategy) {
    case 'full':
      return {
        name: 'Full Context',
        description: 'Keep entire conversation history in context',
        pros: ['Best coherence', 'No information loss', 'Simple to implement'],
        cons: ['Cost grows quadratically', 'May hit context limits', 'Slowest responses'],
      };
    case 'sliding-window':
      return {
        name: 'Sliding Window',
        description: 'Keep only the last N turns in context',
        pros: ['Predictable costs', 'Never hits limits', 'Fast responses'],
        cons: ['Loses old context', 'May forget earlier instructions', 'Abrupt cutoff'],
      };
    case 'summarize':
      return {
        name: 'Summarization',
        description: 'Compress older messages, keep recent ones fresh',
        pros: ['Balanced approach', 'Preserves key info', 'Moderate costs'],
        cons: ['Summary quality varies', 'Extra complexity', 'Some information loss'],
      };
  }
}

/**
 * Calculate optimal turn count for a budget
 */
export function calculateTurnsForBudget(
  budget: number,
  params: Omit<ConversationParams, 'turns'>
): number {
  // Binary search for max turns within budget
  let low = 1;
  let high = 1000;
  let result = 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const analysis = simulateConversation({ ...params, turns: mid });

    if (analysis.totalCost <= budget) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

/**
 * Format conversation analysis for display
 */
export function formatConversationSummary(analysis: ConversationAnalysis): string {
  return `${analysis.turnBreakdown.length} turns, ${formatCost(analysis.totalCost)} total, ` +
    `${(analysis.finalContextSize / 1000).toFixed(1)}K final context`;
}
