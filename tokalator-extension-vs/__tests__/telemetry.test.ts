import { addEvent, completedDays, isValidEvent, prune, setClaudeCodeDaily } from '../src/core/telemetry.pure';

describe('telemetry payload rules', () => {
  it('rejects event names that could carry paths, file names, or prompts', () => {
    expect(isValidEvent('chat:count')).toBe(true);
    expect(isValidEvent('model:claude-opus-5-5')).toBe(true);
    expect(isValidEvent('file:/Users/me/secret.ts')).toBe(false);
    expect(isValidEvent('open C:\\repo\\a.ts')).toBe(false);
    expect(isValidEvent('Fix the login bug')).toBe(false);
    expect(isValidEvent('x'.repeat(61))).toBe(false);
  });

  it('counts events per day and ignores invalid ones', () => {
    let days = addEvent({}, '2026-10-10', 'cmd:optimize');
    days = addEvent(days, '2026-10-10', 'cmd:optimize');
    days = addEvent(days, '2026-10-10', '/etc/passwd');
    expect(days['2026-10-10'].events).toEqual({ 'cmd:optimize': 2 });
  });

  it('caps distinct events per day', () => {
    let days = {};
    for (let i = 0; i < 250; i++) days = addEvent(days, '2026-10-10', `cmd:e${i}`);
    expect(Object.keys((days as any)['2026-10-10'].events)).toHaveLength(200);
  });

  it('keeps only aggregate Claude Code numbers with known client labels', () => {
    const days = setClaudeCodeDaily({}, '2026-10-10', {
      turns: 12, requests: 184, sessions: 2, cacheHitRate: 0.98765,
      clients: { 'VS Code extension': 150, CLI: 34, '/Users/me/project': 1 },
    });
    expect(days['2026-10-10'].claudeCode).toEqual({
      turns: 12, requests: 184, sessions: 2, cacheHitRate: 0.99, clients: { 'VS Code extension': 150, CLI: 34 },
    });
  });

  it('sends only completed days and keeps today accumulating', () => {
    const days = { '2026-10-08': { events: {} }, '2026-10-09': { events: {} }, '2026-10-10': { events: {} } };
    expect(completedDays(days, '2026-10-10')).toEqual(['2026-10-08', '2026-10-09']);
    expect(Object.keys(prune(days, ['2026-10-10']))).toEqual(['2026-10-10']);
  });
});

describe('survey', () => {
  test('questions are fixed choice with short ids that the feedback API accepts', () => {
    const { SURVEY } = require('../src/core/feedback');
    for (const q of SURVEY) {
      expect(`survey-${q.id}`).toMatch(/^[a-z0-9-]{1,40}$/);
      expect(q.options.length).toBeGreaterThan(1);
      expect(q.options.join(', ').length).toBeLessThanOrEqual(500);
    }
  });
});
