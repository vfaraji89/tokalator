import { agentFromCommand, agentFromWebview } from '../src/core/agents/agentFocus.pure';

describe('agentFromCommand', () => {
  test.each([
    ['claude', 'claude-code'],
    ['claude --continue', 'claude-code'],
    ['npx codex --full-auto', 'codex'],
    ['/usr/local/bin/codex', 'codex'],
    ['copilot', 'copilot-cli'],
    ['codex.cmd', 'codex'],
    ['npm test', null],
    ['zsh', null],
    ['', null],
  ])('%s', (cmd, agent) => expect(agentFromCommand(cmd)).toBe(agent));
});

describe('agentFromWebview', () => {
  test('detects the Claude Code editor panel', () => {
    expect(agentFromWebview('mainThreadWebview-claudeVSCodePanel')).toBe('claude-code');
    expect(agentFromWebview('mainThreadWebview-markdown.preview')).toBeNull();
    expect(agentFromWebview(undefined)).toBeNull();
  });
});
