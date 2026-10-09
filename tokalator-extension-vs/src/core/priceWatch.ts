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
