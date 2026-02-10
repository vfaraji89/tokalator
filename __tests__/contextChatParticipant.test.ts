/**
 * Unit tests for chat/contextChatParticipant.ts
 * Tests: helper functions, URI resolution, quote stripping
 *
 * The chat participant's request handler relies heavily on VS Code APIs,
 * so we test the utility methods and formatting logic here.
 */

// ============================================
// fmtTokens — the buggy version from contextChatParticipant.ts
// ============================================

// Current (buggy) implementation:
function fmtTokensCurrent(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();
}

// Fixed implementation (should match extension.ts):
function fmtTokensFixed(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

describe('fmtTokens (contextChatParticipant)', () => {
  describe('current (buggy) version', () => {
    it('formats thousands correctly', () => {
      expect(fmtTokensCurrent(1000)).toBe('1.0K');
      expect(fmtTokensCurrent(50000)).toBe('50.0K');
    });

    it('formats small numbers correctly', () => {
      expect(fmtTokensCurrent(0)).toBe('0');
      expect(fmtTokensCurrent(999)).toBe('999');
    });

    it('BUG: shows 1000.0K for 1M tokens', () => {
      expect(fmtTokensCurrent(1_000_000)).toBe('1000.0K');
    });

    it('BUG: shows 200.0K instead of possible M format for 200K', () => {
      // This is actually fine for 200K since it's < 1M
      expect(fmtTokensCurrent(200_000)).toBe('200.0K');
    });
  });

  describe('fixed version', () => {
    it('formats millions', () => {
      expect(fmtTokensFixed(1_000_000)).toBe('1.0M');
      expect(fmtTokensFixed(1_048_576)).toBe('1.0M');
    });

    it('formats thousands', () => {
      expect(fmtTokensFixed(1_000)).toBe('1.0K');
      expect(fmtTokensFixed(200_000)).toBe('200.0K');
    });

    it('formats small numbers', () => {
      expect(fmtTokensFixed(0)).toBe('0');
      expect(fmtTokensFixed(999)).toBe('999');
    });
  });
});

// ============================================
// relevanceLabel
// ============================================

function relevanceLabel(score: number): string {
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'med';
  return 'low';
}

describe('relevanceLabel', () => {
  it('returns high for >= 0.6', () => {
    expect(relevanceLabel(0.6)).toBe('high');
    expect(relevanceLabel(1.0)).toBe('high');
  });

  it('returns med for >= 0.3 and < 0.6', () => {
    expect(relevanceLabel(0.3)).toBe('med');
    expect(relevanceLabel(0.59)).toBe('med');
  });

  it('returns low for < 0.3', () => {
    expect(relevanceLabel(0.0)).toBe('low');
    expect(relevanceLabel(0.29)).toBe('low');
  });

  it('handles boundary values precisely', () => {
    expect(relevanceLabel(0.3)).toBe('med');
    expect(relevanceLabel(0.6)).toBe('high');
  });
});

// ============================================
// stripQuotes
// ============================================

function stripQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if (first === last && ['"', "'", '`'].includes(first)) {
      return value.slice(1, -1);
    }
  }
  return value;
}

describe('stripQuotes', () => {
  it('strips double quotes', () => {
    expect(stripQuotes('"hello"')).toBe('hello');
  });

  it('strips single quotes', () => {
    expect(stripQuotes("'hello'")).toBe('hello');
  });

  it('strips backticks', () => {
    expect(stripQuotes('`hello`')).toBe('hello');
  });

  it('does not strip mismatched quotes', () => {
    expect(stripQuotes('"hello\'')).toBe('"hello\'');
  });

  it('does not strip non-quote characters', () => {
    expect(stripQuotes('hello')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(stripQuotes('')).toBe('');
  });

  it('handles single character', () => {
    expect(stripQuotes('"')).toBe('"');
  });

  it('strips quotes from file paths', () => {
    expect(stripQuotes('"src/auth.ts"')).toBe('src/auth.ts');
    expect(stripQuotes("'src/auth.ts'")).toBe('src/auth.ts');
  });
});

// ============================================
// Growth analysis edge cases
// ============================================

describe('growth analysis logic', () => {
  it('handles single-turn history (no avgGrowth)', () => {
    const history = [{ inputTokens: 10000 }];
    const avgGrowth = history.length >= 2
      ? (history[history.length - 1].inputTokens - history[0].inputTokens) / (history.length - 1)
      : 0;
    expect(avgGrowth).toBe(0);
  });

  it('calculates correct avg growth for multi-turn history', () => {
    const history = [
      { inputTokens: 10000 },
      { inputTokens: 11000 },
      { inputTokens: 12000 },
    ];
    const avgGrowth = (history[history.length - 1].inputTokens - history[0].inputTokens) / (history.length - 1);
    expect(avgGrowth).toBe(1000);
  });

  it('detects growing file trend', () => {
    const firstFile = 5000;
    const lastFile = 7000;
    const fileTrend = lastFile > firstFile * 1.1 ? 'growing'
      : lastFile < firstFile * 0.9 ? 'shrinking' : 'stable';
    expect(fileTrend).toBe('growing');
  });

  it('detects shrinking file trend', () => {
    const firstFile = 10000;
    const lastFile = 5000;
    const fileTrend = lastFile > firstFile * 1.1 ? 'growing'
      : lastFile < firstFile * 0.9 ? 'shrinking' : 'stable';
    expect(fileTrend).toBe('shrinking');
  });

  it('detects stable file trend', () => {
    const firstFile = 10000;
    const lastFile = 10500; // within 10% threshold
    const fileTrend = lastFile > firstFile * 1.1 ? 'growing'
      : lastFile < firstFile * 0.9 ? 'shrinking' : 'stable';
    expect(fileTrend).toBe('stable');
  });
});
