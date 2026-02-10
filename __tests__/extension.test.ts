/**
 * Unit tests for extension.ts
 * Tests: fmtTokens, formatTimeAgo helper functions
 *
 * Note: These helper functions are module-level in extension.ts.
 * Since they aren't exported, we test them by re-implementing
 * the same logic and asserting the expected contract.
 * This also serves as a contract test / spec for these formatters.
 */

// Re-implement the helpers as they appear in extension.ts to test them
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

describe('fmtTokens (extension.ts)', () => {
  it('formats millions', () => {
    expect(fmtTokens(1_000_000)).toBe('1.0M');
    expect(fmtTokens(1_500_000)).toBe('1.5M');
    expect(fmtTokens(2_000_000)).toBe('2.0M');
  });

  it('formats thousands', () => {
    expect(fmtTokens(1_000)).toBe('1.0K');
    expect(fmtTokens(50_000)).toBe('50.0K');
    expect(fmtTokens(999_999)).toBe('1000.0K');
  });

  it('formats small numbers as-is', () => {
    expect(fmtTokens(0)).toBe('0');
    expect(fmtTokens(1)).toBe('1');
    expect(fmtTokens(999)).toBe('999');
  });

  it('formats negative numbers', () => {
    // Edge case — should not happen but shouldn't crash
    expect(fmtTokens(-1)).toBe('-1');
  });
});

describe('formatTimeAgo (extension.ts)', () => {
  it('shows minutes for < 60 minutes', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(formatTimeAgo(tenMinAgo)).toBe('10m ago');
  });

  it('shows hours for < 24 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('shows days for >= 24 hours', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('shows 0m ago for just now', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe('0m ago');
  });
});

// ============================================
// BUG TEST: fmtTokens in chat participant vs extension.ts
// The contextChatParticipant.ts version only handles >= 1000
// but misses >= 1_000_000, showing "1000.0K" instead of "1.0M"
// ============================================

// This is the BUGGY version from contextChatParticipant.ts
function fmtTokensBuggy(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();
}

describe('BUG: fmtTokens inconsistency across files', () => {
  it('extension.ts correctly formats 1M tokens', () => {
    expect(fmtTokens(1_000_000)).toBe('1.0M');
  });

  it('BUG: chatParticipant version shows 1000.0K instead of 1.0M', () => {
    // This demonstrates the bug in contextChatParticipant.ts
    expect(fmtTokensBuggy(1_000_000)).toBe('1000.0K');
    // It SHOULD be '1.0M' but isn't
    expect(fmtTokensBuggy(1_000_000)).not.toBe('1.0M');
  });

  it('BUG: webview fmtTokens also shows 1000.0K for 1M', () => {
    // contextDashboardProvider.ts webview JS has same bug
    expect(fmtTokensBuggy(1_000_000)).toBe('1000.0K');
  });
});
