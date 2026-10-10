import { CLAUDE_CODE_LIVE_MS, claudeCodeModelToSync } from '../src/core/modelSync.pure';

const now = Date.parse('2026-10-10T12:00:00Z');
const live = { modelId: 'claude-opus-5-5', lastAt: '2026-10-10T11:58:00Z' };

describe('claudeCodeModelToSync', () => {
  test('syncs to the live Claude Code model', () => {
    expect(claudeCodeModelToSync(live, 'claude-fable-5-1', undefined, now)).toBe('claude-opus-5-5');
  });
  test('does nothing when already active', () => {
    expect(claudeCodeModelToSync(live, 'claude-opus-5-5', undefined, now)).toBeNull();
  });
  test('ignores stale sessions', () => {
    const stale = { ...live, lastAt: new Date(now - CLAUDE_CODE_LIVE_MS - 1000).toISOString() };
    expect(claudeCodeModelToSync(stale, 'claude-fable-5-1', undefined, now)).toBeNull();
  });
  test('respects a newer manual or chat switch', () => {
    expect(claudeCodeModelToSync(live, 'gpt-6-luna', Date.parse('2026-10-10T11:59:00Z'), now)).toBeNull();
  });
  test('overrides an older switch', () => {
    expect(claudeCodeModelToSync(live, 'claude-fable-5-1', Date.parse('2026-10-10T09:00:00Z'), now)).toBe('claude-opus-5-5');
  });
  test('ignores models missing from the catalog', () => {
    expect(claudeCodeModelToSync({ ...live, modelId: null }, 'claude-fable-5-1', undefined, now)).toBeNull();
  });
});
