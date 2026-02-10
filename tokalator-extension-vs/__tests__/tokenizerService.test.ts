/**
 * Unit tests for core/tokenizerService.ts
 * Tests: token counting per provider, heuristic fallback, byte estimation, lazy loading, dispose
 */
import { TokenizerService, TokenizerType } from '../src/core/tokenizerService';

describe('TokenizerService', () => {
  let service: TokenizerService;

  beforeEach(() => {
    service = new TokenizerService();
  });

  afterEach(() => {
    service.dispose();
  });

  // ============================================
  // getTokenizerType
  // ============================================
  describe('getTokenizerType', () => {
    it('returns claude-bpe for anthropic', () => {
      expect(service.getTokenizerType('anthropic')).toBe('claude-bpe' as TokenizerType);
    });

    it('returns o200k_base for openai', () => {
      expect(service.getTokenizerType('openai')).toBe('o200k_base' as TokenizerType);
    });

    it('returns heuristic for google', () => {
      expect(service.getTokenizerType('google')).toBe('heuristic' as TokenizerType);
    });

    it('returns heuristic for unknown providers', () => {
      expect(service.getTokenizerType('other')).toBe('heuristic' as TokenizerType);
      expect(service.getTokenizerType('')).toBe('heuristic' as TokenizerType);
    });
  });

  // ============================================
  // getTokenizerLabel
  // ============================================
  describe('getTokenizerLabel', () => {
    it('returns Claude BPE tokenizer for anthropic', () => {
      expect(service.getTokenizerLabel('anthropic')).toBe('Claude BPE tokenizer');
    });

    it('returns o200k_base tokenizer for openai', () => {
      expect(service.getTokenizerLabel('openai')).toBe('o200k_base tokenizer');
    });

    it('returns heuristic label for google', () => {
      expect(service.getTokenizerLabel('google')).toBe('Heuristic (~4 chars/token)');
    });

    it('returns heuristic label for unknown providers', () => {
      expect(service.getTokenizerLabel('other')).toBe('Heuristic (~4 chars/token)');
    });
  });

  // ============================================
  // countTokens — heuristic (google/other)
  // ============================================
  describe('countTokens (heuristic)', () => {
    it('counts ~1 token per 4 characters', () => {
      const text = 'a'.repeat(400);
      expect(service.countTokens(text, 'google')).toBe(100);
    });

    it('rounds up for non-divisible lengths', () => {
      const text = 'a'.repeat(401);
      expect(service.countTokens(text, 'google')).toBe(101); // Math.ceil(401/4)
    });

    it('returns 0 for empty string', () => {
      expect(service.countTokens('', 'google')).toBe(0);
    });

    it('returns 1 for a single character', () => {
      expect(service.countTokens('a', 'google')).toBe(1);
    });
  });

  // ============================================
  // countTokens — Anthropic (Claude BPE)
  // ============================================
  describe('countTokens (anthropic)', () => {
    it('returns a positive count for non-empty text', () => {
      const tokens = service.countTokens('Hello, world!', 'anthropic');
      expect(tokens).toBeGreaterThan(0);
    });

    it('returns 0 for empty string', () => {
      expect(service.countTokens('', 'anthropic')).toBe(0);
    });

    it('consistent results for same input', () => {
      const text = 'function calculateTokens(text: string): number { return text.length / 4; }';
      const first = service.countTokens(text, 'anthropic');
      const second = service.countTokens(text, 'anthropic');
      expect(first).toBe(second);
    });

    it('longer text produces more tokens', () => {
      const short = service.countTokens('hello', 'anthropic');
      const long = service.countTokens('hello world this is a longer sentence with more tokens', 'anthropic');
      expect(long).toBeGreaterThan(short);
    });

    it('handles unicode text (NFKC normalization)', () => {
      const tokens = service.countTokens('café résumé naïve', 'anthropic');
      expect(tokens).toBeGreaterThan(0);
    });
  });

  // ============================================
  // countTokens — OpenAI (o200k_base)
  // ============================================
  describe('countTokens (openai)', () => {
    it('returns a positive count for non-empty text', () => {
      const tokens = service.countTokens('Hello, world!', 'openai');
      expect(tokens).toBeGreaterThan(0);
    });

    it('returns 0 for empty string', () => {
      expect(service.countTokens('', 'openai')).toBe(0);
    });

    it('consistent results for same input', () => {
      const text = 'const x = 42; console.log(x);';
      const first = service.countTokens(text, 'openai');
      const second = service.countTokens(text, 'openai');
      expect(first).toBe(second);
    });

    it('longer text produces more tokens', () => {
      const short = service.countTokens('hello', 'openai');
      const long = service.countTokens('hello world this is a longer sentence with more tokens', 'openai');
      expect(long).toBeGreaterThan(short);
    });
  });

  // ============================================
  // Cross-provider: different tokenizers give different counts
  // ============================================
  describe('cross-provider', () => {
    it('anthropic and openai may differ on same text', () => {
      const text = 'function hello() { return "world"; }';
      const anthropic = service.countTokens(text, 'anthropic');
      const openai = service.countTokens(text, 'openai');
      // They should both be positive, but may differ
      expect(anthropic).toBeGreaterThan(0);
      expect(openai).toBeGreaterThan(0);
    });

    it('heuristic approximates real tokenizer within 3x', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const real = service.countTokens(text, 'anthropic');
      const heuristic = service.countTokens(text, 'google');
      // Heuristic should be in the same order of magnitude
      expect(heuristic).toBeGreaterThan(real / 3);
      expect(heuristic).toBeLessThan(real * 3);
    });
  });

  // ============================================
  // estimateFromBytes
  // ============================================
  describe('estimateFromBytes', () => {
    it('uses 3.7 bytes/token for anthropic', () => {
      expect(service.estimateFromBytes(3700, 'anthropic')).toBe(1000);
    });

    it('uses 3.5 bytes/token for openai', () => {
      expect(service.estimateFromBytes(3500, 'openai')).toBe(1000);
    });

    it('uses 4 bytes/token for other providers', () => {
      expect(service.estimateFromBytes(4000, 'google')).toBe(1000);
    });

    it('rounds up (ceiling) for non-divisible bytes', () => {
      expect(service.estimateFromBytes(1, 'anthropic')).toBe(1); // ceil(1/3.7) = 1
      expect(service.estimateFromBytes(1, 'openai')).toBe(1);    // ceil(1/3.5) = 1
    });

    it('returns 0 for 0 bytes', () => {
      expect(service.estimateFromBytes(0, 'anthropic')).toBe(0);
      expect(service.estimateFromBytes(0, 'openai')).toBe(0);
      expect(service.estimateFromBytes(0, 'google')).toBe(0);
    });
  });

  // ============================================
  // dispose
  // ============================================
  describe('dispose', () => {
    it('releases tokenizer memory and can be reinitialized', () => {
      // First use — lazy-loads tokenizers
      service.countTokens('test', 'anthropic');
      service.countTokens('test', 'openai');

      // Dispose
      service.dispose();

      // Reinitialize — should lazy-load again without errors
      const tokens = service.countTokens('test after dispose', 'anthropic');
      expect(tokens).toBeGreaterThan(0);
    });
  });
});
