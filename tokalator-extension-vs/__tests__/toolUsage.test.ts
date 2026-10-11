import { ToolUsageCollector, cliKeys, summarizeToolUsage } from '../src/core/agents/toolUsage.pure';

describe('cliKeys', () => {
  test('keeps program and subcommand, drops arguments and values', () => {
    expect(cliKeys('cd app && npm run build 2>&1 | tail -3')).toEqual(['npm run build', 'tail']);
    expect(cliKeys('GH_TOKEN=abc gh pr create --title "x; rm -rf /" --body \'y\'')).toEqual(['gh pr']);
    expect(cliKeys('npx -y prettier@3 --write . ; git -C repo status')).toEqual(['npx prettier', 'git status']);
    expect(cliKeys('/usr/bin/python3 -m pytest -q\nsudo docker compose up -d')).toEqual(['python3 -m pytest', 'docker compose']);
    expect(cliKeys('echo hi; export A=1; ./scripts/deploy.sh --prod')).toEqual(['deploy.sh']);
    expect(cliKeys('curl -s https://x.dev -H "Authorization: Bearer sk-secret"')).toEqual(['curl']);
  });
});

describe('ToolUsageCollector', () => {
  test('counts tools, programs, MCP servers and hook outputs in the workspace window', () => {
    const c = new ToolUsageCollector();
    const now = Date.now(), at = (m: number) => new Date(now - m * 60_000).toISOString();
    const tool = (name: string, input: object, ts: string, cwd = '/w') => JSON.stringify({ type: 'assistant', timestamp: ts, cwd, message: { content: [{ type: 'tool_use', name, input }] } });
    c.addLine(tool('Bash', { command: 'git status && npm test' }, at(5)));
    c.addLine(tool('Bash', { command: 'git status' }, at(3)));
    c.addLine(tool('Read', { file_path: '/w/a.ts' }, at(2)));
    c.addLine(tool('mcp__tokalator__count_tokens', {}, at(1)));
    c.addLine(tool('Bash', { command: 'ls' }, at(1), '/elsewhere'));
    c.addLine(JSON.stringify({ type: 'attachment', timestamp: at(1), cwd: '/w', attachment: { hookName: 'PostToolUse:Edit', hookEvent: 'PostToolUse' } }));
    c.addLine('not json "type":"tool_use"');
    const s = summarizeToolUsage(c, now - 3_600_000, cwd => cwd === '/w');
    expect(s.tools).toEqual([{ name: 'Bash', count: 2 }, { name: 'Read', count: 1 }]);
    expect(s.clis.map(x => [x.name, x.count])).toEqual([['git status', 2], ['npm test', 1]]);
    expect(s.mcp).toEqual([{ server: 'tokalator', count: 1 }]);
    expect(s.hookRuns.map(h => [h.name, h.count])).toEqual([['PostToolUse:Edit', 1]]);
    expect(s.bashCalls).toBe(2);
  });
});
