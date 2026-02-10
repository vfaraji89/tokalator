/**
 * Unit tests for core/tokenBudgetEstimator.ts
 * Tests: overhead estimation, budget computation, caching, provider switching
 */
import { TokenBudgetEstimator } from '../src/core/tokenBudgetEstimator';
import { TokenizerService } from '../src/core/tokenizerService';
import { TabInfo } from '../src/core/types';
import { Uri } from 'vscode';

// Helper to build a minimal TabInfo for testing
function makeTab(overrides: Partial<TabInfo> = {}): TabInfo {
  const defaultUri = Uri.file('/test/file.ts');
  return {
    uri: defaultUri,
    label: 'file.ts',
    languageId: 'typescript',
    relativePath: 'file.ts',
    estimatedTokens: 0,
    relevanceScore: 0.5,
    relevanceReason: '',
    isActive: false,
    isDirty: false,
    isPinned: false,
    diagnosticCount: 0,
    lastEditTimestamp: 0,
    ...overrides,
  };
}

describe('TokenBudgetEstimator', () => {
  let tokenizer: TokenizerService;
  let estimator: TokenBudgetEstimator;

  beforeEach(() => {
    tokenizer = new TokenizerService();
    estimator = new TokenBudgetEstimator(tokenizer);
  });

  afterEach(() => {
    tokenizer.dispose();
  });

  // ============================================
  // estimateOverhead
  // ============================================
  describe('estimateOverhead', () => {
    it('returns base overhead for 0 turns and 0 instructions', () => {
      const overhead = estimator.estimateOverhead(0, 0);
      // systemPrompt (2000) + outputReservation (4000) = 6000
      expect(overhead).toBe(6000);
    });

    it('adds 800 tokens per chat turn', () => {
      const overhead0 = estimator.estimateOverhead(0, 0);
      const overhead5 = estimator.estimateOverhead(5, 0);
      expect(overhead5 - overhead0).toBe(5 * 800);
    });

    it('adds 500 tokens per instruction file', () => {
      const overhead0 = estimator.estimateOverhead(0, 0);
      const overhead3 = estimator.estimateOverhead(0, 3);
      expect(overhead3 - overhead0).toBe(3 * 500);
    });

    it('handles combined turns and instructions', () => {
      const overhead = estimator.estimateOverhead(10, 5);
      // 2000 + (5 * 500) + (10 * 800) + 4000 = 2000 + 2500 + 8000 + 4000 = 16500
      expect(overhead).toBe(16500);
    });
  });

  // ============================================
  // computeBudget
  // ============================================
  describe('computeBudget', () => {
    it('computes correct budget with tabs', () => {
      const tabs = [
        makeTab({ estimatedTokens: 1000 }),
        makeTab({ estimatedTokens: 2000 }),
      ];
      const result = estimator.computeBudget(tabs, 0, 0, 100000);

      expect(result.breakdown.files).toBe(3000);
      expect(result.used).toBe(3000 + 6000); // files + overhead
      expect(result.capacity).toBe(100000);
    });

    it('clamps percent at 100', () => {
      const tabs = [makeTab({ estimatedTokens: 200000 })];
      const result = estimator.computeBudget(tabs, 0, 0, 10000);
      expect(result.percent).toBe(100);
    });

    it('returns correct breakdown categories', () => {
      const tabs = [makeTab({ estimatedTokens: 5000 })];
      const result = estimator.computeBudget(tabs, 3, 2, 200000);

      expect(result.breakdown.files).toBe(5000);
      expect(result.breakdown.systemPrompt).toBe(2000);
      expect(result.breakdown.instructions).toBe(1000); // 2 * 500
      expect(result.breakdown.conversation).toBe(2400); // 3 * 800
      expect(result.breakdown.outputReservation).toBe(4000);
    });

    it('handles empty tabs', () => {
      const result = estimator.computeBudget([], 0, 0, 100000);
      expect(result.breakdown.files).toBe(0);
      expect(result.used).toBe(6000); // only overhead
    });

    it('BUG: handles zero windowCapacity without NaN', () => {
      const result = estimator.computeBudget([], 0, 0, 0);
      // percent should not be NaN or Infinity
      expect(Number.isFinite(result.percent)).toBe(true);
      expect(result.percent).toBe(0);
    });

    it('calculates correct percentage', () => {
      const tabs = [makeTab({ estimatedTokens: 44000 })];
      const result = estimator.computeBudget(tabs, 0, 0, 100000);
      // used = 44000 + 6000 = 50000, percent = 50%
      expect(result.percent).toBeCloseTo(50, 0);
    });
  });

  // ============================================
  // setProvider — cache invalidation
  // ============================================
  describe('setProvider', () => {
    it('clears cache when provider changes', () => {
      // The cache is internal, but we can verify behavior through computeBudget
      estimator.setProvider('anthropic');
      estimator.setProvider('openai'); // should clear cache
      // No errors thrown
    });

    it('does not clear cache when same provider is set', () => {
      estimator.setProvider('anthropic');
      estimator.setProvider('anthropic'); // should not clear
      // No errors thrown
    });
  });

  // ============================================
  // clearCache / clearCacheFor
  // ============================================
  describe('cache management', () => {
    it('clearCache does not throw', () => {
      expect(() => estimator.clearCache()).not.toThrow();
    });

    it('clearCacheFor does not throw for unknown URI', () => {
      expect(() => estimator.clearCacheFor('file:///nonexistent.ts')).not.toThrow();
    });
  });
});
