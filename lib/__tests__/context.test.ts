/**
 * Unit tests for lib/context.ts
 * Tests: token estimation, context budget analysis, remaining turns
 */
import {
  estimateTokens,
  estimateCharacters,
  analyzeContextBudget,
  calculateRemainingTurns,
  getModelLimits,
} from '../context';

// ============================================
// Token estimation heuristic
// ============================================

describe('estimateTokens', () => {
  it('empty string returns 0', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates ~4 chars per token', () => {
    const text = 'a'.repeat(400);
    expect(estimateTokens(text)).toBe(100);
  });

  it('rounds up fractional tokens', () => {
    expect(estimateTokens('abc')).toBe(1); // 3/4 → ceil → 1
  });
});

describe('estimateCharacters', () => {
  it('inverse of estimateTokens at scale', () => {
    expect(estimateCharacters(100)).toBe(400);
  });
});

// ============================================
// analyzeContextBudget
// ============================================

describe('analyzeContextBudget', () => {
  it('calculates usage correctly for Opus', () => {
    const result = analyzeContextBudget({
      systemPromptTokens: 2_000,
      userInputTokens: 10_000,
      reservedOutputTokens: 5_000,
      model: 'claude-opus-4.6',
    });
    expect(result.totalUsed).toBe(17_000);
    expect(result.totalAvailable).toBe(200_000);
    expect(result.remaining).toBe(183_000);
    expect(result.usagePercent).toBeCloseTo(8.5, 1);
    expect(result.isOverLimit).toBe(false);
  });

  it('warns when usage > 90%', () => {
    const result = analyzeContextBudget({
      systemPromptTokens: 100_000,
      userInputTokens: 90_000,
      reservedOutputTokens: 5_000,
      model: 'claude-opus-4.6',
    });
    expect(result.warnings.some((w) => w.includes('90%'))).toBe(true);
  });

  it('detects over-limit condition', () => {
    const result = analyzeContextBudget({
      systemPromptTokens: 100_000,
      userInputTokens: 100_000,
      reservedOutputTokens: 50_000,
      model: 'claude-opus-4.6',
    });
    expect(result.isOverLimit).toBe(true);
    expect(result.warnings.some((w) => w.includes('exceeds'))).toBe(true);
  });

  it('detects Sonnet extended pricing', () => {
    const result = analyzeContextBudget({
      systemPromptTokens: 150_000,
      userInputTokens: 60_000,
      reservedOutputTokens: 10_000,
      model: 'claude-sonnet-4.5',
    });
    expect(result.isInExtendedPricing).toBe(true);
    expect(result.warnings.some((w) => w.includes('Extended'))).toBe(true);
  });

  it('breakdown percentages sum to ~100%', () => {
    const result = analyzeContextBudget({
      systemPromptTokens: 2_000,
      userInputTokens: 10_000,
      reservedOutputTokens: 5_000,
      model: 'claude-opus-4.6',
    });
    const total =
      result.breakdown.systemPrompt.percent +
      result.breakdown.userInput.percent +
      result.breakdown.reservedOutput.percent +
      result.breakdown.free.percent;
    expect(total).toBeCloseTo(100, 0);
  });

  it('throws for unknown model', () => {
    expect(() =>
      analyzeContextBudget({
        systemPromptTokens: 0,
        userInputTokens: 0,
        reservedOutputTokens: 0,
        model: 'unknown',
      })
    ).toThrow('Unknown model');
  });
});

// ============================================
// calculateRemainingTurns
// ============================================

describe('calculateRemainingTurns', () => {
  it('returns positive for under-used context', () => {
    const turns = calculateRemainingTurns(10_000, 2_000, 'claude-opus-4.6');
    expect(turns).toBeGreaterThan(0);
  });

  it('returns 0 when context is full', () => {
    const turns = calculateRemainingTurns(200_000, 2_000, 'claude-opus-4.6');
    expect(turns).toBe(0);
  });

  it('returns 0 for unknown model', () => {
    const turns = calculateRemainingTurns(10_000, 2_000, 'unknown');
    expect(turns).toBe(0);
  });

  it('returns 0 for zero avgTurnTokens', () => {
    const turns = calculateRemainingTurns(10_000, 0, 'claude-opus-4.6');
    expect(turns).toBe(0);
  });
});

// ============================================
// getModelLimits
// ============================================

describe('getModelLimits', () => {
  it('returns limits for known model', () => {
    const limits = getModelLimits('claude-opus-4.6');
    expect(limits).not.toBeNull();
    expect(limits!.contextWindow).toBe(200_000);
    expect(limits!.maxOutput).toBe(128_000);
  });

  it('returns null for unknown model', () => {
    expect(getModelLimits('unknown')).toBeNull();
  });
});
