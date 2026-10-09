import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { z } from 'zod';
import { CLAUDE_CATALOG, CATALOG_UPDATED_AT } from '../core/catalog.generated.js';
import {
  ClaudeCodeUsageCollector,
  type UsageRates,
  type UsageTotals,
  cacheHitRate,
  entrypointLabel,
  groupUsage,
  localDay,
  modelKey,
  projectName,
  summarizeUsage,
} from '../core/claudeCodeUsage.pure.js';
import { bar, sparkline, ui } from '../core/ui.js';

export const claudeCodeUsageSchema = {
  days: z.number().int().min(1).max(90).optional().describe('How many days back to include (default 7)'),
  project: z.string().optional().describe('Project directory; defaults to the current working directory'),
  all: z.boolean().optional().describe('Include every project instead of just the current one'),
};

export interface UsageOptions {
  days?: number;
  project?: string;
  all?: boolean;
}

export interface UsageReport {
  scope: string;
  days: number;
  projects: number;
  total: UsageTotals;
  today: UsageTotals;
  turns: number;
  todayTurns: number;
  cacheHit: number;
  byModel: { model: string; totals: UsageTotals }[];
  byProject: { project: string; totals: UsageTotals }[];
  byClient: { client: string; totals: UsageTotals }[];
  daily: { day: string; cost: number }[];
  catalogUpdatedAt: string;
}

const RATES = new Map(CLAUDE_CATALOG.map(m => [modelKey(m.id), m as UsageRates & { label: string }]));
const ratesFor = (model: string) => RATES.get(modelKey(model));
const label = (model: string) => RATES.get(modelKey(model))?.label ?? model;

function projectsDir(): string {
  return join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'projects');
}

async function logFiles(dir: string, since: number): Promise<string[]> {
  const out: string[] = [];
  for (const name of await readdir(dir).catch(() => [] as string[])) {
    const full = join(dir, name);
    const candidates = name.endsWith('.jsonl')
      ? [full]
      : (await readdir(join(full, 'subagents')).catch(() => [] as string[]))
        .filter(n => n.endsWith('.jsonl'))
        .map(n => join(full, 'subagents', n));
    for (const file of candidates) {
      const s = await stat(file).catch(() => null);
      if (s && s.mtimeMs >= since) out.push(file);
    }
  }
  return out;
}

export async function claudeCodeUsage(opts: UsageOptions = {}): Promise<UsageReport> {
  const days = opts.days ?? 7;
  const since = Date.now() - days * 86_400_000;
  const root = projectsDir();
  const prefix = resolve(opts.project ?? process.cwd()).replace(/[^a-zA-Z0-9]/g, '-');
  const dirs = (await readdir(root).catch(() => [] as string[]))
    .filter(name => opts.all || name === prefix || name.startsWith(prefix + '-'))
    .map(name => join(root, name));

  const collector = new ClaudeCodeUsageCollector();
  for (const dir of dirs) {
    for (const file of await logFiles(dir, since)) {
      const lines = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity });
      for await (const line of lines) collector.addLine(line);
    }
  }

  const records = collector.records.filter(r => Date.parse(r.timestamp) >= since);
  const turns = collector.turns.filter(t => Date.parse(t.timestamp) >= since);
  const today = localDay(new Date().toISOString());
  const total = summarizeUsage(records, ratesFor);
  const dayCosts = new Map(groupUsage(records, r => localDay(r.timestamp), ratesFor).map(g => [g.key, g.totals.cost]));
  const daily = Array.from({ length: days }, (_, i) => {
    const day = localDay(new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString());
    return { day, cost: dayCosts.get(day) ?? 0 };
  });

  return {
    scope: opts.all ? 'all projects' : resolve(opts.project ?? process.cwd()),
    days,
    projects: dirs.length,
    total,
    today: summarizeUsage(records.filter(r => localDay(r.timestamp) === today), ratesFor),
    turns: turns.length,
    todayTurns: turns.filter(t => localDay(t.timestamp) === today).length,
    cacheHit: cacheHitRate(total),
    byModel: groupUsage(records, r => r.model, ratesFor).map(g => ({ model: label(g.key), totals: g.totals })),
    byProject: groupUsage(records, r => projectName(r.cwd), ratesFor).map(g => ({ project: g.key, totals: g.totals })),
    byClient: groupUsage(records, r => entrypointLabel(r.entrypoint), ratesFor).map(g => ({ client: g.key, totals: g.totals })),
    daily,
    catalogUpdatedAt: CATALOG_UPDATED_AT.slice(0, 10),
  };
}

const usd = (n: number) => (n >= 100 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`);
const tok = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

export function formatUsage(r: UsageReport): string {
  if (r.total.messages === 0) {
    return `No Claude Code activity in the last ${r.days} days for ${r.scope}.\nLogs are read from ${projectsDir()}. Use --all to include every project.`;
  }
  const rows = (items: { name: string; totals: UsageTotals }[]) => {
    const top = Math.max(...items.map(i => i.totals.cost), 0);
    const width = Math.max(...items.map(i => i.name.length), 8);
    return items.slice(0, 8).map(i =>
      `  ${i.name.padEnd(width)}  ${String(i.totals.messages).padStart(6)} req  ${usd(i.totals.cost).padStart(8)}  ${bar(top ? i.totals.cost / top : 0, 16)}`,
    ).join('\n');
  };
  return [
    ui.bold(`Claude Code usage`) + ui.dim(`  ${r.scope}  ·  ${r.days === 1 ? "last day" : `last ${r.days} days`}  ·  ${r.projects} project folder${r.projects === 1 ? '' : 's'}`),
    '',
    `  ${ui.dim('Today ')}  ${ui.bold(usd(r.today.cost))} API-equivalent  ${r.todayTurns} turns  ${r.today.messages} requests`,
    `  ${ui.dim('Period')}  ${ui.bold(usd(r.total.cost))} API-equivalent  ${r.turns} turns  ${r.total.messages} requests  ${r.total.sessions} session${r.total.sessions === 1 ? '' : 's'}`,
    `  ${ui.dim('Tokens')}  ${tok(r.total.inputTokens)} input  ${tok(r.total.outputTokens)} output  ${tok(r.total.cacheReadTokens)} cache read  ${tok(r.total.cacheWriteTokens)} cache write`,
    `  ${ui.dim('Cache ')}  ${bar(r.cacheHit, 20)} ${Math.round(r.cacheHit * 100)}% of prompt tokens served from cache`,
    `  ${ui.dim('Daily ')}  ${ui.cyan(sparkline(r.daily.map(d => d.cost)))}  ${r.daily[0].day} to ${r.daily[r.daily.length - 1].day}`,
    '',
    ui.bold('By model'),
    rows(r.byModel.map(m => ({ name: m.model, totals: m.totals }))),
    '',
    ui.bold('By directory'),
    rows(r.byProject.map(p => ({ name: p.project, totals: p.totals }))),
    '',
    ui.bold('By client'),
    rows(r.byClient.map(c => ({ name: c.client, totals: c.totals }))),
    '',
    ...(r.total.unpricedMessages ? [ui.yellow(`  ${r.total.unpricedMessages} requests on unpriced models: ${r.total.unpricedModels.join(', ')}`)] : []),
    ui.dim(`  API-equivalent = API list prices (catalog ${r.catalogUpdatedAt}). Claude Pro, Max, and Team plans are not billed per token.`),
  ].join('\n');
}
