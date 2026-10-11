import * as fs from 'fs';
import * as path from 'path';
import { StringDecoder } from 'string_decoder';
import * as vscode from 'vscode';
import { getActiveCatalog } from './catalogStore';
import { ClaudeCodeUsageCollector } from './claudeCodeUsage.pure';
import { AgentSummary, summarizeAgent } from './agents/summary.pure';
import { ToolUsageCollector, summarizeToolUsage, type ToolUsageSummary } from './agents/toolUsage.pure';

const WINDOW_DAYS = 7;
const MIN_REFRESH_MS = 15_000;
const CHUNK_BYTES = 4 * 1024 * 1024;

export type ClaudeCodeSummary = AgentSummary;

interface FileCursor {
  offset: number;
  partial: string;
}

import { claudeProjectsDir, encodeProjectDir } from './claudePaths';
export { claudeProjectsDir, encodeProjectDir };

export class ClaudeCodeTracker {
  private collector = new ClaudeCodeUsageCollector();
  private tools = new ToolUsageCollector();
  private toolUsage: ToolUsageSummary | null = null;
  private cursors = new Map<string, FileCursor>();
  private lastRefresh = 0;
  private refreshing: Promise<void> | null = null;
  private summary: ClaudeCodeSummary | null = null;
  private serialized = 'null';
  version = 0;

  getSummary(): ClaudeCodeSummary | null {
    return this.summary;
  }

  /** Tools, shell programs, MCP servers and hook outputs from the last 7 days of sessions in this workspace. */
  getToolUsage(): ToolUsageSummary | null {
    return this.toolUsage;
  }

  async refresh(force = false): Promise<ClaudeCodeSummary | null> {
    if (!vscode.workspace.getConfiguration('tokalator').get<boolean>('claudeCode.enabled', true)) {
      this.setSummary(null);
      return null;
    }
    if (!force && Date.now() - this.lastRefresh < MIN_REFRESH_MS) return this.summary;
    if (!this.refreshing) {
      this.refreshing = this.scan().finally(() => {
        this.refreshing = null;
        this.lastRefresh = Date.now();
      });
    }
    await this.refreshing;
    return this.summary;
  }

  private async scan(): Promise<void> {
    const root = claudeProjectsDir();
    const prefixes = (vscode.workspace.workspaceFolders ?? []).map(f => encodeProjectDir(f.uri.fsPath));
    const entries = await fs.promises.readdir(root).catch(() => [] as string[]);
    const logDirs = entries
      .filter(name => prefixes.some(p => name === p || name.startsWith(p + '-')))
      .map(name => path.join(root, name));

    const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
    for (const file of await listLogFiles(logDirs)) {
      try {
        const stat = await fs.promises.stat(file);
        if (stat.mtimeMs < cutoff) continue;
        await this.readNew(file, stat.size);
      } catch {
        this.cursors.delete(file);
      }
    }
    if (!logDirs.length) this.toolUsage = null;
    this.setSummary(logDirs.length ? this.summarize(logDirs, cutoff) : null);
  }

  private setSummary(next: ClaudeCodeSummary | null): void {
    const serialized = JSON.stringify([next, this.toolUsage]);
    if (serialized === this.serialized) return;
    this.serialized = serialized;
    this.summary = next;
    this.version++;
  }

  private async readNew(file: string, size: number): Promise<void> {
    let cursor = this.cursors.get(file) ?? { offset: 0, partial: '' };
    if (size < cursor.offset) cursor = { offset: 0, partial: '' };
    if (size === cursor.offset) return;
    const handle = await fs.promises.open(file, 'r');
    try {
      let { offset, partial } = cursor;
      const decoder = new StringDecoder('utf8');
      const buffer = Buffer.alloc(Math.min(CHUNK_BYTES, size - offset));
      while (offset < size) {
        const { bytesRead } = await handle.read(buffer, 0, Math.min(buffer.length, size - offset), offset);
        if (bytesRead === 0) break;
        offset += bytesRead;
        const lines = (partial + decoder.write(buffer.subarray(0, bytesRead))).split('\n');
        partial = lines.pop() ?? '';
        for (const line of lines) { this.collector.addLine(line); this.tools.addLine(line); }
      }
      this.cursors.set(file, { offset, partial });
    } finally {
      await handle.close();
    }
  }

  private summarize(logDirs: string[], cutoff: number): ClaudeCodeSummary {
    const roots = (vscode.workspace.workspaceFolders ?? []).map(f => path.resolve(f.uri.fsPath));
    const inWorkspace = (cwd: string) => {
      if (!cwd) return true;
      const c = path.resolve(cwd);
      return roots.some(r => c === r || c.startsWith(r + path.sep));
    };
    this.toolUsage = summarizeToolUsage(this.tools, cutoff, inWorkspace);
    const records = this.collector.records.filter(r => inWorkspace(r.cwd));
    const sessions = new Set(records.map(r => r.sessionId));
    const turns = this.collector.turns.filter(t => sessions.has(t.sessionId));
    return summarizeAgent(records, turns, getActiveCatalog(), cutoff, logDirs);
  }
}

async function listLogFiles(dirs: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const dir of dirs) {
    for (const name of await fs.promises.readdir(dir).catch(() => [] as string[])) {
      const full = path.join(dir, name);
      if (name.endsWith('.jsonl')) {
        files.push(full);
        continue;
      }
      const subagents = path.join(full, 'subagents');
      for (const sub of await fs.promises.readdir(subagents).catch(() => [] as string[])) {
        if (sub.endsWith('.jsonl')) files.push(path.join(subagents, sub));
      }
    }
  }
  return files;
}
