/**
 * Unit tests for lib/conversation.ts
 * Tests: multi-turn simulation, strategy comparison, budget planning
 */
import {
  simulateConversation,
  compareStrategies,
  calculateTurnsForBudget,
  getStrategyDescription,
  formatConversationSummary,
} from '../conversation';

// ============================================
// simulateConversation — Full History
// ============================================

describe('simulateConversation (full history)', () => {
  const baseParams = {
    systemPromptTokens: 2_000,
    avgUserTokens: 500,
    avgAssistantTokens: 1_500,
    turns: 10,
    model: 'claude-opus-4.6' as const,
    strategy: 'full' as const,
  };

  it('returns correct number of turns', () => {
    const result = simulateConversation(baseParams);
    expect(result.turnBreakdown).toHaveLength(10);
  });

  it('context grows monotonically (full history)', () => {
    const result = simulateConversation(baseParams);
    for (let i = 1; i < result.turnBreakdown.length; i++) {
      expect(result.turnBreakdown[i].contextSize).toBeGreaterThan(
        result.turnBreakdown[i - 1].contextSize
      );
    }
  });

  it('cumulative cost grows monotonically', () => {
    const result = simulateConversation(baseParams);
    for (let i = 1; i < result.turnBreakdown.length; i++) {
      expect(result.turnBreakdown[i].cumulativeCost).toBeGreaterThan(
        result.turnBreakdown[i - 1].cumulativeCost
      );
    }
  });

  it('first turn context = system prompt + user tokens', () => {
    const result = simulateConversation(baseParams);
    expect(result.turnBreakdown[0].contextSize).toBe(2_000 + 500);
  });

  it('total cost equals final cumulative cost', () => {
    const result = simulateConversation(baseParams);
    const lastTurn = result.turnBreakdown[result.turnBreakdown.length - 1];
    expect(result.totalCost).toBeCloseTo(lastTurn.cumulativeCost, 6);
  });

  it('full history cost grows super-linearly (O(t²))', () => {
    const short = simulateConversation({ ...baseParams, turns: 5 });
    const long = simulateConversation({ ...baseParams, turns: 10 });
    // If linear, doubling turns → 2x cost. Quadratic → ~4x.
    const ratio = long.totalCost / short.totalCost;
    expect(ratio).toBeGreaterThan(2.5); // well above 2x → super-linear
  });
});

// ============================================
// simulateConversation — Sliding Window
// ============================================

describe('simulateConversation (sliding window)', () => {
  const params = {
    systemPromptTokens: 2_000,
    avgUserTokens: 500,
    avgAssistantTokens: 1_500,
    turns: 20,
    model: 'claude-opus-4.6' as const,
    strategy: 'sliding-window' as const,
    windowSize: 5,
  };

  it('context size plateaus after window is full', () => {
    const result = simulateConversation(params);
    // After turn 5, context should stop growing
    const lateTurns = result.turnBreakdown.slice(5);
    const sizes = lateTurns.map((t) => t.contextSize);
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);
    // All should be approximately equal (within 1 turn's tokens)
    expect(maxSize - minSize).toBeLessThanOrEqual(2_000);
  });

  it('cheaper than full history for long conversations', () => {
    const full = simulateConversation({ ...params, strategy: 'full' });
    const sw = simulateConversation(params);
    expect(sw.totalCost).toBeLessThan(full.totalCost);
  });
});

// ============================================
// simulateConversation — Summarize
// ============================================

describe('simulateConversation (summarize)', () => {
  const params = {
    systemPromptTokens: 2_000,
    avgUserTokens: 500,
    avgAssistantTokens: 1_500,
    turns: 20,
    model: 'claude-opus-4.6' as const,
    strategy: 'summarize' as const,
    compressionRatio: 0.2,
  };

  it('cheaper than full history', () => {
    const full = simulateConversation({ ...params, strategy: 'full' });
    const summarized = simulateConversation(params);
    expect(summarized.totalCost).toBeLessThan(full.totalCost);
  });

  it('context size grows slower than full history', () => {
    const full = simulateConversation({ ...params, strategy: 'full' });
    const summarized = simulateConversation(params);
    expect(summarized.peakContextSize).toBeLessThan(full.peakContextSize);
  });
});

// ============================================
// compareStrategies
// ============================================

describe('compareStrategies', () => {
  it('returns all three strategies', () => {
    const result = compareStrategies({
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      turns: 10,
      model: 'claude-opus-4.6',
    });
    expect(result.full).toBeDefined();
    expect(result.slidingWindow).toBeDefined();
    expect(result.summarize).toBeDefined();
  });

  it('full history is most expensive', () => {
    const result = compareStrategies({
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      turns: 20,
      model: 'claude-opus-4.6',
    });
    expect(result.full.totalCost).toBeGreaterThan(result.slidingWindow.totalCost);
    expect(result.full.totalCost).toBeGreaterThan(result.summarize.totalCost);
  });
});

// ============================================
// calculateTurnsForBudget
// ============================================

describe('calculateTurnsForBudget', () => {
  it('returns positive turns for reasonable budget', () => {
    const turns = calculateTurnsForBudget(5.0, {
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      model: 'claude-opus-4.6',
      strategy: 'full',
    });
    expect(turns).toBeGreaterThan(0);
  });

  it('sliding window allows more turns than full history for same budget', () => {
    const fullTurns = calculateTurnsForBudget(5.0, {
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      model: 'claude-opus-4.6',
      strategy: 'full',
    });
    const swTurns = calculateTurnsForBudget(5.0, {
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      model: 'claude-opus-4.6',
      strategy: 'sliding-window',
      windowSize: 5,
    });
    expect(swTurns).toBeGreaterThan(fullTurns);
  });

  it('more budget = more turns', () => {
    const small = calculateTurnsForBudget(1.0, {
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      model: 'claude-opus-4.6',
      strategy: 'full',
    });
    const large = calculateTurnsForBudget(10.0, {
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      model: 'claude-opus-4.6',
      strategy: 'full',
    });
    expect(large).toBeGreaterThan(small);
  });
});

// ============================================
// Strategy descriptions
// ============================================

describe('getStrategyDescription', () => {
  it('full strategy has pros and cons', () => {
    const desc = getStrategyDescription('full');
    expect(desc.name).toBe('Full Context');
    expect(desc.pros.length).toBeGreaterThan(0);
    expect(desc.cons.length).toBeGreaterThan(0);
  });

  it('all strategies have non-empty descriptions', () => {
    for (const s of ['full', 'sliding-window', 'summarize'] as const) {
      const desc = getStrategyDescription(s);
      expect(desc.description.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// formatConversationSummary
// ============================================

describe('formatConversationSummary', () => {
  it('includes turn count and cost', () => {
    const analysis = simulateConversation({
      systemPromptTokens: 2_000,
      avgUserTokens: 500,
      avgAssistantTokens: 1_500,
      turns: 5,
      model: 'claude-opus-4.6',
      strategy: 'full',
    });
    const summary = formatConversationSummary(analysis);
    expect(summary).toContain('5 turns');
    expect(summary).toContain('$');
  });
});
