import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TokenizerService } from './tokenizerService';
import { claudeConfigDir, claudeProjectsDir, encodeProjectDir } from './claudePaths';

export type MemoryAgent = 'Claude Code' | 'Codex' | 'Copilot';
export type MemoryLoad = 'always' | 'on demand' | 'config';

export interface MemoryFile {
  agent: MemoryAgent;
  scope: 'project' | 'user';
  kind: string;
  load: MemoryLoad;
  path: string;
  label: string;
  tokens: number;
  modified: string;
}

interface Candidate { agent: MemoryAgent; scope: 'project' | 'user'; kind: string; load: MemoryLoad; path: string }

const tokenizer = new TokenizerService();
const homeDir = () => process.env.HOME || os.homedir();
const MAX_BYTES = 512 * 1024;

async function isFile(p: string): Promise<boolean> {
  return fs.promises.stat(p).then(s => s.isFile(), () => false);
}

async function list(dir: string, match: (name: string) => boolean, depth = 1): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => [] as fs.Dirent[]);
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile() && match(e.name)) out.push(full);
    else if (e.isDirectory() && depth > 1) out.push(...await list(full, match, depth - 1));
  }
  return out;
}

function parents(root: string): string[] {
  const home = homeDir();
  const out: string[] = [];
  let dir = path.dirname(root);
  while (dir.startsWith(home) && dir !== path.dirname(dir)) {
    out.push(dir);
    if (dir === home) break;
    dir = path.dirname(dir);
  }
  return out;
}

async function candidates(roots: string[]): Promise<Candidate[]> {
  const home = homeDir();
  const userClaude = claudeConfigDir();
  const c: Candidate[] = [];
  const add = (agent: MemoryAgent, scope: 'project' | 'user', kind: string, load: MemoryLoad, paths: string[]) =>
    paths.forEach(p => c.push({ agent, scope, kind, load, path: p }));

  for (const root of roots) {
    add('Claude Code', 'project', 'instructions', 'always', [path.join(root, 'CLAUDE.md'), path.join(root, 'CLAUDE.local.md'), path.join(root, '.claude', 'CLAUDE.md')]);
    for (const d of parents(root)) add('Claude Code', d === home ? 'user' : 'project', 'instructions', 'always', [path.join(d, 'CLAUDE.md')]);
    const memoryDir = path.join(claudeProjectsDir(), encodeProjectDir(root), 'memory');
    add('Claude Code', 'project', 'memory index', 'always', [path.join(memoryDir, 'MEMORY.md')]);
    add('Claude Code', 'project', 'memory', 'on demand', (await list(memoryDir, n => n.endsWith('.md') && n !== 'MEMORY.md')));
    add('Claude Code', 'project', 'subagent', 'on demand', await list(path.join(root, '.claude', 'agents'), n => n.endsWith('.md')));
    add('Claude Code', 'project', 'command', 'on demand', await list(path.join(root, '.claude', 'commands'), n => n.endsWith('.md'), 3));
    add('Claude Code', 'project', 'skill', 'on demand', await list(path.join(root, '.claude', 'skills'), n => n === 'SKILL.md', 2));
    add('Claude Code', 'project', 'settings', 'config', [path.join(root, '.claude', 'settings.json'), path.join(root, '.claude', 'settings.local.json'), path.join(root, '.mcp.json')]);
    add('Codex', 'project', 'instructions', 'always', [path.join(root, 'AGENTS.md')]);
    add('Copilot', 'project', 'instructions', 'always', [path.join(root, '.github', 'copilot-instructions.md')]);
    add('Copilot', 'project', 'instructions', 'on demand', await list(path.join(root, '.github', 'instructions'), n => n.endsWith('.instructions.md')));
    add('Copilot', 'project', 'prompt', 'on demand', await list(path.join(root, '.github', 'prompts'), n => n.endsWith('.prompt.md')));
  }
  add('Claude Code', 'user', 'instructions', 'always', [path.join(userClaude, 'CLAUDE.md')]);
  add('Claude Code', 'user', 'subagent', 'on demand', await list(path.join(userClaude, 'agents'), n => n.endsWith('.md')));
  add('Claude Code', 'user', 'command', 'on demand', await list(path.join(userClaude, 'commands'), n => n.endsWith('.md'), 3));
  add('Claude Code', 'user', 'skill', 'on demand', await list(path.join(userClaude, 'skills'), n => n === 'SKILL.md', 2));
  add('Claude Code', 'user', 'settings', 'config', [path.join(userClaude, 'settings.json')]);
  const codexHome = process.env.CODEX_HOME || path.join(home, '.codex');
  add('Codex', 'user', 'instructions', 'always', [path.join(codexHome, 'AGENTS.md')]);
  add('Codex', 'user', 'settings', 'config', [path.join(codexHome, 'config.toml')]);
  return c;
}

function label(p: string, roots: string[]): string {
  const root = roots.find(r => p.startsWith(r + path.sep));
  if (root) return path.relative(root, p);
  const home = homeDir();
  return p.startsWith(home) ? '~' + p.slice(home.length) : p;
}

/** Instruction, memory and configuration files the coding agents read for this workspace. Read locally, never uploaded. */
export async function scanAgentMemory(roots: string[]): Promise<MemoryFile[]> {
  const seen = new Set<string>();
  const out: MemoryFile[] = [];
  for (const c of await candidates(roots)) {
    if (seen.has(c.path) || !(await isFile(c.path))) continue;
    seen.add(c.path);
    const stat = await fs.promises.stat(c.path);
    let tokens = 0;
    if (c.load !== 'config' && stat.size <= MAX_BYTES) {
      const text = await fs.promises.readFile(c.path, 'utf8').catch(() => '');
      tokens = tokenizer.countTokens(text, c.agent === 'Claude Code' ? 'anthropic' : 'openai');
    }
    out.push({ ...c, label: label(c.path, roots), tokens, modified: stat.mtime.toISOString() });
  }
  return out;
}

async function readJson(p: string): Promise<Record<string, unknown> | null> {
  return fs.promises.readFile(p, 'utf8').then(t => JSON.parse(t) as Record<string, unknown>, () => null);
}

const keys = (o: unknown) => (o && typeof o === 'object' ? Object.keys(o as object) : []);

/** Names of configured MCP servers per agent. Only server names are read; settings values are never kept. */
export async function countMcpServers(roots: string[]): Promise<Record<MemoryAgent, number>> {
  const claude = new Set<string>();
  const copilot = new Set<string>();
  const user = await readJson(path.join(homeDir(), '.claude.json'));
  keys(user?.mcpServers).forEach(k => claude.add(k));
  for (const root of roots) {
    keys((await readJson(path.join(root, '.mcp.json')))?.mcpServers).forEach(k => claude.add(k));
    keys((user?.projects as Record<string, { mcpServers?: unknown }> | undefined)?.[root]?.mcpServers).forEach(k => claude.add(k));
    keys((await readJson(path.join(root, '.vscode', 'mcp.json')))?.servers).forEach(k => copilot.add(k));
  }
  const toml = await fs.promises.readFile(path.join(process.env.CODEX_HOME || path.join(homeDir(), '.codex'), 'config.toml'), 'utf8').catch(() => '');
  const codex = new Set([...toml.matchAll(/^\[mcp_servers\.([^\].]+)\]/gm)].map(m => m[1]));
  return { 'Claude Code': claude.size, Codex: codex.size, Copilot: copilot.size };
}
