import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getActiveCatalog } from '../catalogStore';
import { AgentId, AgentParseResult, AgentParser } from './types';
import { AgentSummary, summarizeAgent } from './summary.pure';
import { parseCopilotChat } from './copilotChat.pure';
import { copilotChatFiles } from './copilotChat';
import { parseCopilotCli } from './copilotCli.pure';
import { copilotCliFiles, sessionStateDir } from './copilotCli';
import { parseCodex } from './codex.pure';
import { codexFiles, codexHome } from './codex';

const WINDOW_DAYS = 7;
const MIN_REFRESH_MS = 15_000;

type FileSource = { id: AgentId; setting: string; files: (since: number) => Promise<string[]>; parse: AgentParser; scoped: boolean };

const inside = (cwd: string, roots: string[]) => {
  const c = path.resolve(cwd);
  return roots.some(r => c === r || c.startsWith(r + path.sep));
};

/**
 * Usage from coding agents other than Claude Code (which has its own incremental tracker):
 * Copilot Chat sessions from VS Code's workspace storage, Copilot CLI and Codex.
 * Files are re-parsed only when their size or modification time changes.
 */
export class AgentUsageTracker {
  private cache = new Map<string, { key: string; result: AgentParseResult }>();
  private summaries: Partial<Record<AgentId, AgentSummary>> = {};
  private serialized = '{}';
  private lastRefresh = 0;
  private refreshing: Promise<void> | null = null;
  version = 0;

  constructor(private readonly workspaceStorageDir: string | undefined) {}

  /** Folders whose changes mean new agent activity, for file watchers. */
  watchDirs(): string[] {
    const cfg = vscode.workspace.getConfiguration('tokalator');
    const dirs: string[] = [];
    if (cfg.get<boolean>('agents.copilot.enabled', true)) {
      if (this.workspaceStorageDir) dirs.push(path.join(this.workspaceStorageDir, 'chatSessions'));
      dirs.push(sessionStateDir());
    }
    if (cfg.get<boolean>('agents.codex.enabled', true)) dirs.push(path.join(codexHome(), 'sessions'));
    return dirs;
  }

  getSummaries(): Partial<Record<AgentId, AgentSummary>> {
    return this.summaries;
  }

  async refresh(force = false): Promise<void> {
    if (!force && Date.now() - this.lastRefresh < MIN_REFRESH_MS) return;
    if (!this.refreshing) {
      this.refreshing = this.scan().finally(() => {
        this.refreshing = null;
        this.lastRefresh = Date.now();
      });
    }
    await this.refreshing;
  }

  private async scan(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tokalator');
    const roots = (vscode.workspace.workspaceFolders ?? []).map(f => path.resolve(f.uri.fsPath));
    const since = Date.now() - WINDOW_DAYS * 86_400_000;
    const catalog = getActiveCatalog();
    const next: Partial<Record<AgentId, AgentSummary>> = {};

    const sources: FileSource[] = [
      { id: 'copilot-chat', setting: 'agents.copilot.enabled', files: s => copilotChatFiles(this.workspaceStorageDir, s), parse: parseCopilotChat, scoped: false },
      { id: 'copilot-cli', setting: 'agents.copilot.enabled', files: copilotCliFiles, parse: parseCopilotCli, scoped: true },
      { id: 'codex', setting: 'agents.codex.enabled', files: codexFiles, parse: parseCodex, scoped: true },
    ];

    for (const src of sources) {
      if (!cfg.get<boolean>(src.setting, true)) continue;
      const files = await src.files(since).catch(() => [] as string[]);
      const results = await Promise.all(files.map(f => this.parseFile(f, src.parse)));
      const records = results.flatMap(r => r.records).filter(r => !src.scoped || (r.cwd && inside(r.cwd, roots)));
      if (!records.length) continue;
      const sessions = new Set(records.map(r => r.sessionId));
      const turns = results.flatMap(r => r.turns).filter(t => sessions.has(t.sessionId));
      next[src.id] = summarizeAgent(records, turns, catalog, since, files.length ? [path.dirname(files[0])] : []);
    }

    const serialized = JSON.stringify(next);
    if (serialized === this.serialized) return;
    this.serialized = serialized;
    this.summaries = next;
    this.version++;
  }

  private async parseFile(file: string, parse: AgentParser): Promise<AgentParseResult> {
    try {
      const stat = await fs.promises.stat(file);
      const key = `${stat.size}:${stat.mtimeMs}`;
      const hit = this.cache.get(file);
      if (hit && hit.key === key) return hit.result;
      const result = parse(await fs.promises.readFile(file, 'utf8'), file);
      this.cache.set(file, { key, result });
      return result;
    } catch {
      return { records: [], turns: [] };
    }
  }
}
