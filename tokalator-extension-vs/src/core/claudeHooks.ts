import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { claudeConfigDir } from './claudePaths';

/** Hook events defined by Claude Code 2.1.296. */
export const HOOK_EVENTS = [
  'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest', 'PermissionDenied', 'Notification',
  'UserPromptSubmit', 'UserPromptExpansion', 'Stop', 'StopFailure', 'SubagentStart', 'SubagentStop',
  'PreCompact', 'PostCompact', 'SessionStart', 'SessionEnd', 'Setup', 'TeammateIdle', 'TaskCreated', 'TaskCompleted',
  'ConfigChange', 'CwdChanged', 'FileChanged', 'InstructionsLoaded', 'WorktreeCreate', 'WorktreeRemove', 'Elicitation', 'ElicitationResult',
];
/** Old tool names and their current names, from Claude Code 2.1.296. */
const LEGACY_TOOLS: Record<string, string> = { Task: 'Agent', KillShell: 'TaskStop', KillBash: 'TaskStop', ListPeers: 'ListAgents', Brief: 'SendUserMessage', ListMcpResources: 'ListMcpResourcesTool', ReadMcpResource: 'ReadMcpResourceTool', ReadMcpResourceDir: 'ReadMcpResourceDirTool' };
const TOOL_EVENTS = new Set(['PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest', 'PermissionDenied']);

export type HookScope = 'managed' | 'user' | 'project' | 'local';
export interface Finding { level: 'error' | 'warn' | 'info'; text: string }
export interface HookEntry { scope: HookScope; file: string; event: string; matcher: string; type: string; command: string; timeout?: number; group: number; index: number; findings: Finding[] }
export interface HookFile { scope: HookScope; file: string; exists: boolean; disableAllHooks: boolean; readOnly: boolean; error?: string }
export interface HooksState { files: HookFile[]; entries: HookEntry[]; managedOnly: boolean }

const SCOPE_LABEL: Record<HookScope, string> = { managed: 'Managed (organization)', user: 'User (~/.claude/settings.json)', project: 'Project, shared with the repo (.claude/settings.json)', local: 'Project, only you (.claude/settings.local.json)' };
export const scopeLabel = (s: HookScope) => SCOPE_LABEL[s];

export function hookFiles(root: string | undefined, home = os.homedir()): { scope: HookScope; file: string; readOnly: boolean }[] {
  const managed = process.platform === 'darwin' ? '/Library/Application Support/ClaudeCode/managed-settings.json' : process.platform === 'win32' ? 'C:\\Program Files\\ClaudeCode\\managed-settings.json' : '/etc/claude-code/managed-settings.json';
  return [
    { scope: 'managed', file: managed, readOnly: true },
    { scope: 'user', file: path.join(claudeConfigDir() || path.join(home, '.claude'), 'settings.json'), readOnly: false },
    ...(root ? [
      { scope: 'project' as const, file: path.join(root, '.claude', 'settings.json'), readOnly: false },
      { scope: 'local' as const, file: path.join(root, '.claude', 'settings.local.json'), readOnly: false },
    ] : []),
  ];
}

const SECRET = /(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|xox[abpr]-[A-Za-z0-9-]{10,}|Bearer\s+[A-Za-z0-9._-]{20,})/;
const INTERPRETERS = /^(bash|sh|zsh|node|python3?|deno|bun|npx|pnpm|npm|uv|ruby|pwsh|powershell)$/;

/** First word of a command, resolved to a file path when it looks like a script. */
function scriptOf(command: string, root: string | undefined, home: string): { raw: string; resolved: string; direct: boolean } | null {
  const tokens = command.trim().match(/(?:"[^"]*"|'[^']*'|[^\s"'])+/g) ?? [];
  let i = 0;
  const direct = !INTERPRETERS.test(tokens[0]?.replace(/^.*\//, '') ?? '');
  if (!direct) i = 1;
  const raw = (tokens[i] ?? '').replace(/["']/g, '');
  if (!raw || !/[/\\]|\.(sh|js|mjs|cjs|ts|py|rb)$/.test(raw)) return null;
  let resolved = raw.replace(/\$\{?CLAUDE_PROJECT_DIR\}?/g, root ?? '').replace(/^~(?=\/)/, home);
  if (!path.isAbsolute(resolved)) resolved = root ? path.join(root, resolved) : resolved;
  return { raw, resolved, direct };
}

/** Best-practice checks for one hook. Only flags things that can be verified from the settings and the file system. */
export function lintHook(h: Omit<HookEntry, 'findings'>, root: string | undefined, home = os.homedir(), exists = fs.existsSync, isExecutable = (p: string) => { try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; } }): Finding[] {
  const f: Finding[] = [];
  if (!HOOK_EVENTS.includes(h.event)) f.push({ level: 'error', text: `"${h.event}" is not a Claude Code hook event, so this hook never runs. Check the spelling.` });
  if (h.type === 'command' && !h.command.trim()) f.push({ level: 'error', text: 'The command is empty.' });
  if (TOOL_EVENTS.has(h.event) && (!h.matcher || h.matcher === '*')) f.push({ level: 'warn', text: 'No tool matcher, so it runs on every tool call. Narrow it (for example "Edit|Write") to keep sessions fast.' });
  if (TOOL_EVENTS.has(h.event)) {
    const legacy = h.matcher.split('|').map(t => t.trim()).filter(t => LEGACY_TOOLS[t]);
    if (legacy.length) f.push({ level: 'warn', text: `${legacy.map(t => `"${t}" is the old name of "${LEGACY_TOOLS[t]}"`).join('; ')}. Use the current name so the matcher keeps working.` });
  }
  if (SECRET.test(h.command)) f.push({ level: 'error', text: 'The command contains what looks like a secret. Read it from an environment variable instead.' });
  if (/\b(curl|wget)\b[^|]*\|\s*(ba|z)?sh\b/.test(h.command)) f.push({ level: 'warn', text: 'Downloads and runs a script on every trigger. Pin a reviewed local copy instead.' });
  if (/\$\{?CLAUDE_PROJECT_DIR\}?/.test(h.command) && /(^|[^"'])\$\{?CLAUDE_PROJECT_DIR\}?/.test(h.command.replace(/"[^"]*"/g, ''))) f.push({ level: 'warn', text: 'Quote "$CLAUDE_PROJECT_DIR" so paths with spaces work.' });
  const script = h.type === 'command' ? scriptOf(h.command, root, home) : null;
  if (script) {
    const relative = !/^(\/|~|\$\{?CLAUDE_PROJECT_DIR)/.test(script.raw) && !/^[A-Za-z]:\\/.test(script.raw);
    if (relative && (h.scope === 'project' || h.scope === 'local')) f.push({ level: 'warn', text: `"${script.raw}" is relative, so it breaks when Claude changes directory. Use "$CLAUDE_PROJECT_DIR/${script.raw.replace(/^\.\//, '')}".` });
    if (root || !/CLAUDE_PROJECT_DIR/.test(script.raw)) {
      if (!exists(script.resolved)) f.push({ level: 'error', text: `Script not found: ${script.raw}.` });
      else if (script.direct && process.platform !== 'win32' && !isExecutable(script.resolved)) f.push({ level: 'warn', text: `${script.raw} is not executable. Run chmod +x on it, or call it through bash or node.` });
    }
  }
  if (h.scope === 'project') f.push({ level: 'info', text: 'Runs for everyone who opens this repository in Claude Code. Keep personal hooks in .claude/settings.local.json.' });
  return f;
}

function readJson(file: string): { json: Record<string, any> | null; error?: string } {
  if (!fs.existsSync(file)) return { json: null };
  try { return { json: JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch (e) { return { json: null, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` }; }
}

export function readHooks(root: string | undefined, home = os.homedir()): HooksState {
  const state: HooksState = { files: [], entries: [], managedOnly: false };
  for (const { scope, file, readOnly } of hookFiles(root, home)) {
    const { json, error } = readJson(file);
    state.files.push({ scope, file, exists: fs.existsSync(file), disableAllHooks: json?.disableAllHooks === true, readOnly, error });
    if (scope === 'managed' && json?.allowManagedHooksOnly === true) state.managedOnly = true;
    const hooks = json?.hooks;
    if (!hooks || typeof hooks !== 'object') continue;
    for (const [event, groups] of Object.entries<any>(hooks)) {
      (Array.isArray(groups) ? groups : []).forEach((g, group) => {
        (Array.isArray(g?.hooks) ? g.hooks : []).forEach((hk: any, index: number) => {
          const base = { scope, file, event, matcher: typeof g.matcher === 'string' ? g.matcher : '', type: String(hk?.type ?? 'command'), command: String(hk?.command ?? hk?.prompt ?? hk?.url ?? ''), timeout: typeof hk?.timeout === 'number' ? hk.timeout : undefined, group, index };
          state.entries.push({ ...base, findings: lintHook(base, root, home) });
        });
      });
    }
  }
  const seen = new Map<string, HookEntry>();
  for (const e of state.entries) {
    const key = `${e.event}|${e.matcher}|${e.command.trim()}`;
    const prev = seen.get(key);
    if (prev) e.findings.push({ level: 'warn', text: `Same hook as in ${scopeLabel(prev.scope)}; it runs twice.` });
    else seen.set(key, e);
  }
  return state;
}

function writeJson(file: string, json: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
}

/** Pauses or resumes every hook for you in this project via disableAllHooks in settings.local.json. */
export function setHooksPaused(root: string, paused: boolean): string {
  const file = path.join(root, '.claude', 'settings.local.json');
  const { json, error } = readJson(file);
  if (error) throw new Error(`${file}: ${error}`);
  const next = { ...(json ?? {}) };
  if (paused) next.disableAllHooks = true; else delete next.disableAllHooks;
  writeJson(file, next);
  return file;
}

/** Removes one hook; an emptied matcher group and event are removed too. Other settings are kept as they are. */
export function removeHook(entry: Pick<HookEntry, 'file' | 'event' | 'group' | 'index' | 'command'>): void {
  const { json, error } = readJson(entry.file);
  if (error || !json) throw new Error(error ?? `${entry.file} not found`);
  const groups = json.hooks?.[entry.event];
  const hook = groups?.[entry.group]?.hooks?.[entry.index];
  if (!hook || String(hook.command ?? hook.prompt ?? hook.url ?? '') !== entry.command) throw new Error('The settings file changed since it was read. Refresh and try again.');
  groups[entry.group].hooks.splice(entry.index, 1);
  if (!groups[entry.group].hooks.length) groups.splice(entry.group, 1);
  if (!groups.length) delete json.hooks[entry.event];
  if (!Object.keys(json.hooks).length) delete json.hooks;
  writeJson(entry.file, json);
}

export function hooksReportMarkdown(state: HooksState, runs: { name: string; count: number; lastAt: string }[]): string {
  const out = ['# Claude Code hooks', ''];
  const paused = state.files.filter(f => f.disableAllHooks);
  if (paused.length) out.push(`> All hooks are paused by \`disableAllHooks\` in ${paused.map(f => '`' + f.file + '`').join(', ')}.`, '');
  if (state.managedOnly) out.push('> Your organization allows only managed hooks (`allowManagedHooksOnly`). User and project hooks are ignored.', '');
  for (const f of state.files) {
    const list = state.entries.filter(e => e.file === f.file);
    out.push(`## ${scopeLabel(f.scope)}`, '', f.error ? `**${f.error}**` : !f.exists ? '_No settings file._' : !list.length ? '_No hooks._' : '');
    for (const e of list) {
      const ran = runs.find(r => r.name === (e.matcher ? `${e.event}:${e.matcher}` : e.event));
      out.push(`- **${e.event}**${e.matcher ? ` \`${e.matcher}\`` : ''} · ${e.type}${e.timeout ? ` · timeout ${e.timeout}s` : ''}${ran ? ` · ${ran.count} runs with output in 7 days` : ''}`, `  \`${e.command.slice(0, 200).replace(/`/g, "'")}\``);
      for (const x of e.findings) out.push(`  - ${x.level === 'error' ? 'Error' : x.level === 'warn' ? 'Warning' : 'Note'}: ${x.text}`);
    }
    out.push('');
  }
  out.push('## Good practice', '',
    '- Keep hooks fast. They run inside the agent loop and slow every matching step.',
    '- Use a narrow matcher on tool events (`Edit|Write`, `Bash`) instead of every tool.',
    '- Refer to scripts as `"$CLAUDE_PROJECT_DIR"/path/to/script` so they work from any folder, and keep them executable.',
    '- Put team hooks in `.claude/settings.json` and personal ones in `.claude/settings.local.json`.',
    '- Review hooks before trusting a repository: they run shell commands on your machine.',
    '- Never put secrets in a hook command; read them from the environment.',
    '- Type `/hooks` in Claude Code to see what it loaded.', '');
  return out.join('\n');
}
