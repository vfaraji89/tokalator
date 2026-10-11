import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const write = (p: string, text = '# notes\nUse small functions.\n') => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
};

describe('scanAgentMemory', () => {
  const env = { ...process.env };
  let home: string;
  let root: string;

  beforeEach(() => {
    home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tk-home-')));
    root = path.join(home, 'work', 'app');
    process.env.HOME = home;
    process.env.CLAUDE_CONFIG_DIR = path.join(home, '.claude');
    process.env.CODEX_HOME = path.join(home, '.codex');
    write(path.join(root, 'CLAUDE.md'));
    write(path.join(home, 'CLAUDE.md'));
    write(path.join(home, '.claude', 'CLAUDE.md'));
    write(path.join(home, '.claude', 'projects', root.replace(/[^a-zA-Z0-9]/g, '-'), 'memory', 'MEMORY.md'), '- [Topic](topic.md)\n');
    write(path.join(home, '.claude', 'projects', root.replace(/[^a-zA-Z0-9]/g, '-'), 'memory', 'topic.md'));
    write(path.join(root, '.claude', 'skills', 'review', 'SKILL.md'));
    write(path.join(root, '.claude', 'settings.json'), '{}');
    write(path.join(root, 'AGENTS.md'));
    write(path.join(root, '.github', 'copilot-instructions.md'));
  });

  afterEach(() => {
    process.env = { ...env };
    fs.rmSync(home, { recursive: true, force: true });
  });

  test('lists what each agent loads, with load type and tokens', async () => {
    const { scanAgentMemory } = require('../src/core/agentMemory');
    const files = await scanAgentMemory([root]);
    const row = (label: string) => files.find((f: { label: string }) => f.label === label);

    expect(row('CLAUDE.md')).toMatchObject({ agent: 'Claude Code', scope: 'project', load: 'always' });
    expect(row('~/CLAUDE.md')).toMatchObject({ scope: 'user', load: 'always' });
    expect(row('~/.claude/CLAUDE.md')).toMatchObject({ scope: 'user', load: 'always' });
    expect(files.find((f: { kind: string }) => f.kind === 'memory index')).toMatchObject({ load: 'always' });
    expect(files.find((f: { kind: string }) => f.kind === 'memory')).toMatchObject({ load: 'on demand' });
    expect(row(path.join('.claude', 'skills', 'review', 'SKILL.md'))).toMatchObject({ kind: 'skill', load: 'on demand' });
    expect(row(path.join('.claude', 'settings.json'))).toMatchObject({ load: 'config', tokens: 0 });
    expect(row('AGENTS.md')).toMatchObject({ agent: 'Codex', load: 'always' });
    expect(row(path.join('.github', 'copilot-instructions.md'))).toMatchObject({ agent: 'Copilot', load: 'always' });
    expect(row('CLAUDE.md').tokens).toBeGreaterThan(0);
    expect(files.some((f: { label: string }) => f.label === 'CLAUDE.local.md')).toBe(false);
  });
});
