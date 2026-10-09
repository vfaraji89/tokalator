import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { StringDecoder } from 'string_decoder';
import * as vscode from 'vscode';
import { getActiveCatalog } from './catalogStore';
import {
  ClaudeCodeUsageCollector,
  ClaudeCodeUsageRecord,
  TurnStats,
  UsageRates,
  UsageTotals,
  cacheHitRate,
  entrypointLabel,
  groupUsage,
  localDay,
  modelKey,
  sessionTurnStats,
  summarizeUsage,
} from './claudeCodeUsage.pure';

const WINDOW_DAYS = 7;
const MIN_REFRESH_MS = 15_000;
const CHUNK_BYTES = 4 * 1024 * 1024;

export interface ClaudeCodeSummary {
  logDirs: string[];
  today: UsageTotals;
  week: UsageTotals;
  todayTurns: number;
  session: (UsageTotals & {
    model: string;
    startedAt: string;
    lastAt: string;
    turns: TurnStats[];
    turnCount: number;
    contextTokens: number;
    contextWindow: number;
    avgGrowthPerTurn: number;
    turnsLeft: number | null;
  }) | null;
  cacheHitRate: number;
  byEntrypoint: { label: string; cost: number; messages: number }[];
  lastActivityAt: string | null;
}

interface FileCursor {
  offset: number;
  partial: string;
}

export function claudeProjectsDir(): string {
  return path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'projects');
}

export function encodeProjectDir(fsPath: string): string {
  return fsPath.replace(/[^a-zA-Z0-9]/g, '-');
}

export class ClaudeCodeTracker {
  private collector = new ClaudeCodeUsageCollector();
  private cursors = new Map<string, FileCursor>();
  private lastRefresh = 0;
  private refreshing: Promise<void> | null = null;
  private summary: ClaudeCodeSummary | null = null;
  private serialized = 'null';
  version = 0;

  getSummary(): ClaudeCodeSummary | null {
    return this.summary;
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
    this.setSummary(logDirs.length ? this.summarize(logDirs, cutoff) : null);
  }

  private setSummary(next: ClaudeCodeSummary | null): void {
    const serialized = JSON.stringify(next);
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
        for (const line of lines) this.collector.addLine(line);
      }
      this.cursors.set(file, { offset, partial });
    } finally {
      await handle.close();
    }
  }

  private summarize(logDirs: string[], cutoff: number): ClaudeCodeSummary {
    const rates = ratesLookup();
    const week = this.collector.records.filter(r => Date.parse(r.timestamp) >= cutoff);
    const today = localDay(new Date().toISOString());
    const todays = week.filter(r => localDay(r.timestamp) === today);
    const latest = week.reduce<ClaudeCodeUsageRecord | null>((a, r) => (!a || r.timestamp > a.timestamp ? r : a), null);

    let session: ClaudeCodeSummary['session'] = null;
    if (latest) {
      const records = week.filter(r => r.sessionId === latest.sessionId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const main = records.filter(r => !r.sidechain);
      const last = main[main.length - 1] ?? latest;
      const profile = getActiveCatalog().find(m => modelKey(m.id) === modelKey(last.model));
      const turns = sessionTurnStats(this.collector.turns.filter(t => t.sessionId === latest.sessionId), records, rates);
      const sized = turns.filter(t => t.contextTokens > 0);
      const avgGrowthPerTurn = sized.length >= 2
        ? Math.max(0, Math.round((sized[sized.length - 1].contextTokens - sized[0].contextTokens) / (sized.length - 1)))
        : 0;
      const contextTokens = last.inputTokens + last.cacheReadTokens + last.cacheWrite5mTokens + last.cacheWrite1hTokens;
      const contextWindow = profile?.contextWindow ?? 0;
      session = {
        ...summarizeUsage(records, rates),
        model: profile?.label ?? last.model,
        startedAt: records[0].timestamp,
        lastAt: records[records.length - 1].timestamp,
        turns: turns.slice(-30),
        turnCount: turns.length,
        contextTokens,
        contextWindow,
        avgGrowthPerTurn,
        turnsLeft: avgGrowthPerTurn > 0 && contextWindow > 0
          ? Math.max(0, Math.floor((contextWindow - contextTokens) / avgGrowthPerTurn))
          : null,
      };
    }

    const weekTotals = summarizeUsage(week, rates);
    return {
      logDirs,
      today: summarizeUsage(todays, rates),
      todayTurns: this.collector.turns.filter(t => localDay(t.timestamp) === today).length,
      week: weekTotals,
      session,
      cacheHitRate: cacheHitRate(weekTotals),
      byEntrypoint: groupUsage(week, r => entrypointLabel(r.entrypoint), rates)
        .map(g => ({ label: g.key, cost: g.totals.cost, messages: g.totals.messages })),
      lastActivityAt: latest?.timestamp ?? null,
    };
  }
}

function ratesLookup(): (model: string) => UsageRates | undefined {
  const byKey = new Map(getActiveCatalog().map(m => [modelKey(m.id), m] as const));
  return model => byKey.get(modelKey(model));
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
