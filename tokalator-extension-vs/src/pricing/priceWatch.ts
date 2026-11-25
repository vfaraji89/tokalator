import * as vscode from 'vscode';
import { getActiveCatalog, onDidChangeCatalog } from './catalogStore';
import type { ModelProfile } from './modelProfiles';
import type { UsageAnalytics } from './usageAnalytics';

export interface RateSnapshot {
  [modelId: string]: {
    inputCostPerMTok: number;
    outputCostPerMTok: number;
    cachedInputCostPerMTok: number;
  };
}

export interface RateChange {
  modelId: string;
  label: string;
  field: 'input' | 'output' | 'cachedInput';
  oldRate: number;
  newRate: number;
  pctChange: number;
  detectedAt: string;
}

export interface RateChangeset {
  detectedAt: string;
  changes: RateChange[];
}

export interface PriceWatchImpact {
  totalHistoricalDelta: number;
  projectedMonthlyDelta: number;
  affectedTurns: number;
  byModel: {
    modelId: string;
    label: string;
    turns: number;
    historicalDelta: number;
    inputRateOld: number;
    inputRateNew: number;
  }[];
}

const BASELINE_KEY = 'tokalator.priceWatch.baseline';
const CHANGELOG_KEY = 'tokalator.priceWatch.changelog';
const ACK_KEY = 'tokalator.priceWatch.lastAck';
const SETTLED_KEY = 'tokalator.priceWatch.settled';

export function snapshotRates(catalog: ModelProfile[]): RateSnapshot {
  const snap: RateSnapshot = {};
  for (const m of catalog) {
    snap[m.id] = {
      inputCostPerMTok: m.inputCostPerMTok,
      outputCostPerMTok: m.outputCostPerMTok,
      cachedInputCostPerMTok: m.cachedInputCostPerMTok ?? m.inputCostPerMTok,
    };
  }
  return snap;
}

export function diffRates(
  baseline: RateSnapshot,
  current: RateSnapshot,
  catalog: ModelProfile[],
): RateChange[] {
  const now = new Date().toISOString();
  const changes: RateChange[] = [];
  const labelMap = new Map(catalog.map(m => [m.id, m.label]));

  for (const [id, cur] of Object.entries(current)) {
    const base = baseline[id];
    if (!base) continue;
    const label = labelMap.get(id) ?? id;

    if (base.inputCostPerMTok !== cur.inputCostPerMTok) {
      changes.push({
        modelId: id, label, field: 'input',
        oldRate: base.inputCostPerMTok, newRate: cur.inputCostPerMTok,
        pctChange: base.inputCostPerMTok > 0
          ? ((cur.inputCostPerMTok - base.inputCostPerMTok) / base.inputCostPerMTok) * 100
          : 0,
        detectedAt: now,
      });
    }
    if (base.outputCostPerMTok !== cur.outputCostPerMTok) {
      changes.push({
        modelId: id, label, field: 'output',
        oldRate: base.outputCostPerMTok, newRate: cur.outputCostPerMTok,
        pctChange: base.outputCostPerMTok > 0
          ? ((cur.outputCostPerMTok - base.outputCostPerMTok) / base.outputCostPerMTok) * 100
          : 0,
        detectedAt: now,
      });
    }
    if (base.cachedInputCostPerMTok !== cur.cachedInputCostPerMTok) {
      changes.push({
        modelId: id, label, field: 'cachedInput',
        oldRate: base.cachedInputCostPerMTok, newRate: cur.cachedInputCostPerMTok,
        pctChange: base.cachedInputCostPerMTok > 0
          ? ((cur.cachedInputCostPerMTok - base.cachedInputCostPerMTok) / base.cachedInputCostPerMTok) * 100
          : 0,
        detectedAt: now,
      });
    }
  }

  return changes;
}

export function computeImpact(
  changes: RateChange[],
  analytics: UsageAnalytics,
): PriceWatchImpact {
  const insights = analytics.analyze();
  if (insights.totalTurns === 0 || changes.length === 0) {
    return { totalHistoricalDelta: 0, projectedMonthlyDelta: 0, affectedTurns: 0, byModel: [] };
  }

  const inputChangeMap = new Map<string, RateChange>();
  for (const c of changes) {
    if (c.field === 'input') inputChangeMap.set(c.modelId, c);
  }

  const byModel: PriceWatchImpact['byModel'] = [];
  let totalDelta = 0;

  for (const ms of insights.byModel) {
    const change = inputChangeMap.get(ms.modelId);
    if (!change) continue;

    const historicalDelta = ms.turns * (ms.avgInputTokens / 1_000_000) * (change.newRate - change.oldRate);
    totalDelta += historicalDelta;
    byModel.push({
      modelId: ms.modelId,
      label: ms.label,
      turns: ms.turns,
      historicalDelta,
      inputRateOld: change.oldRate,
      inputRateNew: change.newRate,
    });
  }

  byModel.sort((a, b) => Math.abs(b.historicalDelta) - Math.abs(a.historicalDelta));

  const oldest = insights.dailyTrend[0];
  const newest = insights.dailyTrend[insights.dailyTrend.length - 1];
  let projectedMonthlyDelta = 0;
  if (oldest && newest && oldest.date !== newest.date) {
    const daySpan = Math.max(
      (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (24 * 60 * 60 * 1000),
      1,
    );
    const dailyDelta = totalDelta / daySpan;
    projectedMonthlyDelta = dailyDelta * 30;
  }

  const affectedTurns = byModel.reduce((s, m) => s + m.turns, 0);

  return { totalHistoricalDelta: totalDelta, projectedMonthlyDelta, affectedTurns, byModel };
}

export interface AgentPriceImpact {
  weekDelta: number;
  monthlyDelta: number;
  rows: { agent: string; label: string; field: RateChange['field']; tokens: number; delta: number }[];
}

type ModelTokens = { modelId: string; inputTokens: number; outputTokens: number; cacheReadTokens: number };
const FIELD_TOKENS: Record<RateChange['field'], keyof Omit<ModelTokens, 'modelId'>> = { input: 'inputTokens', output: 'outputTokens', cachedInput: 'cacheReadTokens' };

/** Cost of a rate change on each agent's last 7 days of tokens for the changed model, read from the agent logs. */
export function computeAgentImpact(changes: RateChange[], usage: Record<string, { weekByModel?: ModelTokens[] } | null | undefined>): AgentPriceImpact {
  const rows: AgentPriceImpact['rows'] = [];
  for (const [agent, summary] of Object.entries(usage)) {
    for (const m of summary?.weekByModel ?? []) {
      for (const c of changes.filter(x => x.modelId === m.modelId)) {
        const tokens = m[FIELD_TOKENS[c.field]];
        if (tokens > 0) rows.push({ agent, label: c.label, field: c.field, tokens, delta: tokens / 1e6 * (c.newRate - c.oldRate) });
      }
    }
  }
  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const weekDelta = rows.reduce((n, r) => n + r.delta, 0);
  return { weekDelta, monthlyDelta: weekDelta * 30 / 7, rows };
}

export function shouldSuppressInitialDiff(settled: boolean): boolean {
  return !settled;
}

export class PriceWatchService implements vscode.Disposable {

  private baseline: RateSnapshot;
  private settled: boolean;
  private changelog: RateChangeset[];
  private lastAck: string | null;
  private disposables: vscode.Disposable[] = [];

  private readonly _onDidDetectChange = new vscode.EventEmitter<RateChangeset>();
  readonly onDidDetectChange = this._onDidDetectChange.event;

  constructor(
    private readonly globalState: vscode.Memento,
    private readonly analytics: UsageAnalytics,
  ) {
    const stored = globalState.get<RateSnapshot>(BASELINE_KEY);
    if (stored && Object.keys(stored).length > 0) {
      this.baseline = stored;
      this.settled = globalState.get<boolean>(SETTLED_KEY, true);
    } else {
      this.baseline = snapshotRates(getActiveCatalog());
      this.globalState.update(BASELINE_KEY, this.baseline);
      this.settled = false;
      this.globalState.update(SETTLED_KEY, false);
    }

    this.changelog = globalState.get<RateChangeset[]>(CHANGELOG_KEY, []);
    this.lastAck = globalState.get<string | null>(ACK_KEY, null);

    this.disposables.push(
      onDidChangeCatalog(() => this.checkForChanges()),
    );
  }

  private checkForChanges(): void {
    const catalog = getActiveCatalog();
    const current = snapshotRates(catalog);
    const changes = diffRates(this.baseline, current, catalog);

    this.baseline = current;
    this.globalState.update(BASELINE_KEY, this.baseline);

    if (shouldSuppressInitialDiff(this.settled)) {
      this.settled = true;
      this.globalState.update(SETTLED_KEY, true);
      return;
    }

    if (changes.length === 0) return;

    const changeset: RateChangeset = {
      detectedAt: new Date().toISOString(),
      changes,
    };

    this.changelog.push(changeset);
    if (this.changelog.length > 20) {
      this.changelog.splice(0, this.changelog.length - 20);
    }

    this.globalState.update(CHANGELOG_KEY, this.changelog);
    this._onDidDetectChange.fire(changeset);
  }

  getChangelog(): RateChangeset[] {
    return this.changelog;
  }

  getLatestChangeset(): RateChangeset | null {
    return this.changelog.length > 0 ? this.changelog[this.changelog.length - 1] : null;
  }

  hasUnacknowledged(): boolean {
    if (this.changelog.length === 0) return false;
    const latest = this.changelog[this.changelog.length - 1];
    return this.lastAck !== latest.detectedAt;
  }

  acknowledge(): void {
    const latest = this.changelog[this.changelog.length - 1];
    if (latest) {
      this.lastAck = latest.detectedAt;
      this.globalState.update(ACK_KEY, this.lastAck);
    }
  }

  private agentUsage: () => Record<string, { weekByModel?: ModelTokens[] } | null | undefined> = () => ({});

  setAgentUsage(fn: () => Record<string, { weekByModel?: ModelTokens[] } | null | undefined>): void {
    this.agentUsage = fn;
  }

  getAgentImpact(): AgentPriceImpact | null {
    const latest = this.getLatestChangeset();
    return latest ? computeAgentImpact(latest.changes, this.agentUsage()) : null;
  }

  getImpact(): PriceWatchImpact | null {
    const latest = this.getLatestChangeset();
    if (!latest) return null;
    return computeImpact(latest.changes, this.analytics);
  }

  dispose(): void {
    this._onDidDetectChange.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}

const FIELD_LABELS: Record<RateChange['field'], string> = { input: 'Input', output: 'Output', cachedInput: 'Cache read' };
const usd = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(n) < 1 ? Math.abs(n).toFixed(4) : Math.abs(n).toFixed(2)}`;

/** Markdown report used by the dashboard button and by @tokalator /pricewatch. */
export function priceWatchReport(service: PriceWatchService, agentLabels: Record<string, string>): string {
  const changelog = service.getChangelog();
  const latest = service.getLatestChangeset();
  if (!latest) {
    return '# Price Watch\n\nNo rate changes since monitoring began. When a provider changes a price in the catalog, this report lists the changed models and what the change would have cost on your agents\' last 7 days of usage.\n';
  }
  const out = [`# Price Watch`, '', `${latest.changes.length} rate change(s) detected on ${new Date(latest.detectedAt).toLocaleDateString()}.`, '', '| Model | Rate | Old | New | Change |', '|---|---|---|---|---|'];
  for (const c of latest.changes) out.push(`| ${c.label} | ${FIELD_LABELS[c.field]} | $${c.oldRate.toFixed(2)}/MTok | $${c.newRate.toFixed(2)}/MTok | ${c.pctChange > 0 ? '+' : ''}${c.pctChange.toFixed(1)}% |`);
  const agents = service.getAgentImpact();
  out.push('', '## Impact on your agents (last 7 days)', '');
  if (agents && agents.rows.length) {
    out.push('| Agent | Model | Rate | Tokens | Cost change |', '|---|---|---|---|---|');
    for (const r of agents.rows) out.push(`| ${agentLabels[r.agent] ?? r.agent} | ${r.label} | ${FIELD_LABELS[r.field]} | ${r.tokens.toLocaleString('en-US')} | ${usd(r.delta)} |`);
    out.push('', `At the same usage: **${usd(agents.weekDelta)} per week**, about ${usd(agents.monthlyDelta)} per month (API list prices).`);
  } else {
    out.push('None of your agents used the changed models in the last 7 days.');
  }
  const chat = service.getImpact();
  if (chat && chat.affectedTurns > 0) out.push('', `@tokalator chat turns: ${chat.affectedTurns} affected, ${usd(chat.totalHistoricalDelta)} so far.`);
  if (changelog.length > 1) out.push('', `${changelog.length} rate change events recorded.`);
  return out.join('\n') + '\n';
}
