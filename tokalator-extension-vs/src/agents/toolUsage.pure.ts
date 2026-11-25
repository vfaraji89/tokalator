export interface ToolEvent { timestamp: string; cwd: string; tool: string; cli: string[] }
export interface HookRun { timestamp: string; cwd: string; name: string }
export interface ToolUsageSummary {
  tools: { name: string; count: number }[];
  clis: { name: string; count: number; lastAt: string }[];
  mcp: { server: string; count: number }[];
  hookRuns: { name: string; count: number; lastAt: string }[];
  bashCalls: number;
}

const BUILTINS = new Set(['cd', 'echo', 'export', 'set', 'unset', 'true', 'false', 'test', '[', '[[', 'source', '.', 'printf', 'sleep', 'exit', 'wait', 'read', 'local', 'return', 'then', 'else', 'fi', 'do', 'done', 'for', 'while', 'if', 'case', 'esac', '{', '}']);
const PREFIXES = new Set(['sudo', 'time', 'exec', 'env', 'command', 'nohup', 'xargs']);
const WITH_SUBCOMMAND = new Set(['git', 'npm', 'pnpm', 'yarn', 'bun', 'gh', 'docker', 'kubectl', 'vercel', 'cargo', 'go', 'pip', 'pip3', 'uv', 'poetry', 'brew', 'make', 'terraform', 'aws', 'gcloud', 'az', 'deno', 'prisma', 'supabase', 'firebase', 'claude', 'codex', 'code', 'helm']);
const RUNNERS = new Set(['npx', 'bunx', 'pnpx']);
const RUN_SCRIPT = new Set(['npm', 'pnpm', 'yarn', 'bun']);

/** Program names (with subcommand for multi-command CLIs) in a shell command. Arguments and values are dropped. */
export function cliKeys(command: string): string[] {
  const keys = new Set<string>();
  const plain = command.replace(/"(?:\\.|[^"\\])*"|'[^']*'/g, 'Q').replace(/\$\([^)]*\)/g, 'Q');
  for (const segment of plain.split(/\n|&&|\|\||;|\||\(|\)/)) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    while (tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0]) || PREFIXES.has(tokens[0]))) tokens.shift();
    const raw = tokens[0];
    if (!raw || raw === 'Q' || raw.startsWith('-') || raw.startsWith('$')) continue;
    const prog = raw.split('/').pop()!.replace(/^\.\//, '');
    if (!prog || BUILTINS.has(prog) || !/^[A-Za-z0-9][\w.+-]*$/.test(prog)) continue;
    const args = tokens.slice(1).filter((t, i, all) => !t.startsWith('-') && !(prog === 'git' && /^-[Cc]$/.test(all[i - 1] ?? '')));
    const word = (t?: string) => (t && /^[a-z][a-z0-9:_-]*$/.test(t) ? t : '');
    if (RUNNERS.has(prog)) {
      const pkg = args.find(a => /^(@[\w.-]+\/)?[\w.-]+(@[\w.^~-]+)?$/.test(a));
      keys.add(pkg ? `${prog} ${pkg.replace(/(.)@[\w.^~-]+$/, '$1')}` : prog);
    } else if ((prog === 'python' || prog === 'python3') && tokens[1] === '-m' && word(tokens[2])) {
      keys.add(`${prog} -m ${tokens[2]}`);
    } else if (WITH_SUBCOMMAND.has(prog) && word(args[0])) {
      keys.add(RUN_SCRIPT.has(prog) && args[0] === 'run' && word(args[1]) ? `${prog} run ${args[1]}` : `${prog} ${args[0]}`);
    } else {
      keys.add(prog);
    }
  }
  return [...keys];
}

/** Collects tool calls and hook outputs from Claude Code session log lines. */
export class ToolUsageCollector {
  readonly events: ToolEvent[] = [];
  readonly hooks: HookRun[] = [];

  addLine(line: string): void {
    const tool = line.includes('"type":"tool_use"'), hook = line.includes('"hookName"');
    if (!tool && !hook) return;
    let d: any;
    try { d = JSON.parse(line); } catch { return; }
    const timestamp = typeof d.timestamp === 'string' ? d.timestamp : '', cwd = typeof d.cwd === 'string' ? d.cwd : '';
    if (hook && typeof d.attachment?.hookName === 'string') this.hooks.push({ timestamp, cwd, name: d.attachment.hookName });
    if (!tool || !Array.isArray(d.message?.content)) return;
    for (const b of d.message.content) {
      if (b?.type !== 'tool_use' || typeof b.name !== 'string') continue;
      const cmd = b.name === 'Bash' && typeof b.input?.command === 'string' ? b.input.command : '';
      this.events.push({ timestamp, cwd, tool: b.name, cli: cmd ? cliKeys(cmd) : [] });
    }
  }
}

const top = (m: Map<string, { count: number; lastAt: string }>) =>
  [...m].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

export function summarizeToolUsage(c: ToolUsageCollector, since: number, inWorkspace: (cwd: string) => boolean): ToolUsageSummary {
  const recent = <T extends { timestamp: string; cwd: string }>(xs: T[]) => xs.filter(x => Date.parse(x.timestamp) >= since && inWorkspace(x.cwd));
  const tools = new Map<string, { count: number; lastAt: string }>(), clis = new Map<string, { count: number; lastAt: string }>(), mcp = new Map<string, { count: number; lastAt: string }>(), hooks = new Map<string, { count: number; lastAt: string }>();
  const bump = (m: typeof tools, k: string, at: string) => { const v = m.get(k) ?? { count: 0, lastAt: '' }; v.count++; if (at > v.lastAt) v.lastAt = at; m.set(k, v); };
  let bashCalls = 0;
  for (const e of recent(c.events)) {
    if (e.tool.startsWith('mcp__')) bump(mcp, e.tool.split('__')[1] ?? e.tool, e.timestamp);
    else bump(tools, e.tool, e.timestamp);
    if (e.tool === 'Bash') bashCalls++;
    for (const k of e.cli) bump(clis, k, e.timestamp);
  }
  for (const h of recent(c.hooks)) bump(hooks, h.name, h.timestamp);
  return {
    tools: top(tools).map(({ name, count }) => ({ name, count })),
    clis: top(clis).slice(0, 25),
    mcp: top(mcp).map(({ name, count }) => ({ server: name, count })),
    hookRuns: top(hooks),
    bashCalls,
  };
}
