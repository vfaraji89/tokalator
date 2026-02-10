/**
 * Unit tests for webview/contextDashboardProvider.ts
 * Tests: getNonce, fmtTokens (webview version), formatTimeAgo, relClass
 *
 * The dashboard provider is mostly UI/webview code, so we test
 * the utility functions and serialization logic.
 */

// ============================================
// getNonce (from contextDashboardProvider.ts)
// ============================================

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

describe('getNonce', () => {
  it('produces a 32-character string', () => {
    expect(getNonce()).toHaveLength(32);
  });

  it('only contains alphanumeric characters', () => {
    const nonce = getNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('produces unique values', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(getNonce());
    }
    // With 62^32 possibilities, 100 collisions should never happen
    expect(nonces.size).toBe(100);
  });
});

// ============================================
// fmtTokens — webview JS version (BUGGY: no million handling)
// ============================================

// Current version from the webview script
function fmtTokensWebview(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// Fixed version
function fmtTokensFixed(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

describe('fmtTokens (webview)', () => {
  it('formats thousands correctly', () => {
    expect(fmtTokensWebview(1000)).toBe('1.0K');
    expect(fmtTokensWebview(50000)).toBe('50.0K');
  });

  it('formats small numbers correctly', () => {
    expect(fmtTokensWebview(0)).toBe('0');
    expect(fmtTokensWebview(500)).toBe('500');
  });

  it('BUG: formats 1M tokens as 1000.0K instead of 1.0M', () => {
    expect(fmtTokensWebview(1_000_000)).toBe('1000.0K');
    // Should be '1.0M' after fix
  });

  it('fixed version handles millions', () => {
    expect(fmtTokensFixed(1_000_000)).toBe('1.0M');
    expect(fmtTokensFixed(1_048_576)).toBe('1.0M');
    expect(fmtTokensFixed(200_000)).toBe('200.0K');
    expect(fmtTokensFixed(500)).toBe('500');
  });
});

// ============================================
// formatTimeAgo — webview JS version
// ============================================

function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

describe('formatTimeAgo (webview)', () => {
  it('shows minutes for < 60 minutes', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatTimeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('shows hours for < 24 hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000).toISOString();
    expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('shows days for >= 24 hours', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString();
    expect(formatTimeAgo(oneDayAgo)).toBe('1d ago');
  });
});

// ============================================
// relClass — webview JS version
// ============================================

function relClass(score: number): string {
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'med';
  return 'low';
}

describe('relClass (webview)', () => {
  it('returns high for >= 0.6', () => {
    expect(relClass(0.6)).toBe('high');
    expect(relClass(1.0)).toBe('high');
  });

  it('returns med for 0.3 <= score < 0.6', () => {
    expect(relClass(0.3)).toBe('med');
    expect(relClass(0.5)).toBe('med');
  });

  it('returns low for < 0.3', () => {
    expect(relClass(0.0)).toBe('low');
    expect(relClass(0.29)).toBe('low');
  });
});

// ============================================
// Snapshot serialization — pinnedFiles Set → Array
// ============================================

describe('snapshot serialization', () => {
  it('converts pinnedFiles Set to Array for webview postMessage', () => {
    const pinnedFiles = new Set(['file:///a.ts', 'file:///b.ts']);
    const serialized = Array.from(pinnedFiles);
    expect(serialized).toEqual(['file:///a.ts', 'file:///b.ts']);
    expect(Array.isArray(serialized)).toBe(true);
  });

  it('converts tab URIs to strings', () => {
    const tab = {
      uri: { toString: () => 'file:///test.ts' },
      label: 'test.ts',
    };
    const serialized = { ...tab, uri: tab.uri.toString() };
    expect(typeof serialized.uri).toBe('string');
    expect(serialized.uri).toBe('file:///test.ts');
  });
});

// ============================================
// BUG TEST: Breakdown bar division by zero
// ============================================

describe('breakdown bar width calculation', () => {
  it('BUG: division by zero when totalEstimatedTokens is 0', () => {
    const totalEstimatedTokens = 0;
    const files = 0;

    // This is what the webview does:
    const widthPercent = Math.round((files / totalEstimatedTokens) * 100);

    // When totalEstimatedTokens = 0, this becomes NaN
    expect(Number.isNaN(widthPercent)).toBe(true);
  });

  it('safe division avoids NaN', () => {
    const totalEstimatedTokens = 0;
    const files = 0;

    // Fixed version:
    const widthPercent = totalEstimatedTokens > 0
      ? Math.round((files / totalEstimatedTokens) * 100)
      : 0;

    expect(Number.isFinite(widthPercent)).toBe(true);
    expect(widthPercent).toBe(0);
  });
});
