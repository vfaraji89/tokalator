import { newlyUninstalled, visibleAgents } from '../src/core/agents/agentVisibility.pure';

const base = { installed: {}, lastActivity: {}, uninstalledAt: {}, aiFeaturesDisabled: false };
const t = (iso: string) => Date.parse(iso);

describe('visibleAgents', () => {
  test('installed extensions show even without activity', () => {
    expect(visibleAgents({ ...base, installed: { 'claude-code': true, 'copilot-chat': true } })).toEqual(['claude-code', 'copilot-chat']);
  });
  test('nothing installed and no activity shows nothing', () => {
    expect(visibleAgents(base)).toEqual([]);
  });
  test('an uninstalled extension disappears even with older activity', () => {
    expect(visibleAgents({ ...base, lastActivity: { 'claude-code': '2026-10-10T09:00:00Z' }, uninstalledAt: { 'claude-code': t('2026-10-10T10:00:00Z') } })).toEqual([]);
  });
  test('CLI use after uninstalling brings the tab back', () => {
    expect(visibleAgents({ ...base, lastActivity: { 'claude-code': '2026-10-10T11:00:00Z' }, uninstalledAt: { 'claude-code': t('2026-10-10T10:00:00Z') } })).toEqual(['claude-code']);
  });
  test('CLI-only agents show only with activity', () => {
    expect(visibleAgents({ ...base, lastActivity: { 'copilot-cli': '2026-10-10T09:00:00Z', codex: null } })).toEqual(['copilot-cli']);
  });
  test('Copilot Chat hides when VS Code AI features are turned off', () => {
    expect(visibleAgents({ ...base, installed: { 'copilot-chat': true }, aiFeaturesDisabled: true })).toEqual([]);
  });
});

describe('newlyUninstalled', () => {
  test('detects extensions that were present and are gone', () => {
    expect(newlyUninstalled(['claude-code', 'codex'], { codex: true })).toEqual(['claude-code']);
    expect(newlyUninstalled([], {})).toEqual([]);
  });
});
