import { MODEL_PROFILES, type ModelProfile } from './modelProfiles';
import { getModel } from './catalogStore';

export type TurnSource = 'chat-api' | 'burst' | 'manual';

export interface TurnCostRecord {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  effectiveCost: number;
  timestamp: number;
  source?: TurnSource;
}

export interface ModelSpendSummary {
  modelId: string;
  label: string;
  provider: string;
  turns: number;
  totalInputTokens: number;
  totalCost: number;
  avgCostPerTurn: number;
  avgInputTokens: number;
  percentOfSpend: number;
  percentOfTokens: number;
  inputCostPerMTok: number;
}

export interface OptimizationTip {
  message: string;
  savingsEstimate: number;
}

export interface UsageInsights {
  totalTurns: number;
  totalCost: number;
  totalInputTokens: number;
  avgCostPerTurn: number;
  avgInputTokens: number;
  peakInputTokens: number;
  lastTurn: TurnCostRecord | null;
  byModel: ModelSpendSummary[];
  tips: OptimizationTip[];
  dailyTrend: { date: string; cost: number; turns: number; tokens: number }[];
  firstTurnAt: number | null;
  lastTurnAt: number | null;
  verifiedTurns: number;
  estimatedTurns: number;
}

const MAX_RECORDS = 500;

export class UsageAnalytics {
  private records: TurnCostRecord[] = [];

  constructor(
    private readonly persist: {
      get: <T>(key: string, fallback: T) => T;
      update: (key: string, value: unknown) => Thenable<void>;
    },
    private readonly storageKey: string,
  ) {
    this.records = persist.get<TurnCostRecord[]>(storageKey, []);
  }

  recordTurn(modelId: string, inputTokens: number, outputTokens: number, effectiveCost: number, source: TurnSource = 'manual'): void {
    this.records.push({ modelId, inputTokens, outputTokens, effectiveCost, timestamp: Date.now(), source });
    if (this.records.length > MAX_RECORDS) {
      this.records.splice(0, this.records.length - MAX_RECORDS);
    }
    this.persist.update(this.storageKey, this.records);
  }

  analyze(): UsageInsights {
    if (this.records.length === 0) {
      return { totalTurns: 0, totalCost: 0, totalInputTokens: 0, avgCostPerTurn: 0, avgInputTokens: 0, peakInputTokens: 0, lastTurn: null, byModel: [], tips: [], dailyTrend: [], firstTurnAt: null, lastTurnAt: null, verifiedTurns: 0, estimatedTurns: 0 };
    }

    const totalTurns = this.records.length;
    const totalCost = this.records.reduce((s, r) => s + r.effectiveCost, 0);
    const totalInputTokens = this.records.reduce((s, r) => s + r.inputTokens, 0);
    const avgCostPerTurn = totalCost / totalTurns;
    const avgInputTokens = Math.round(totalInputTokens / totalTurns);
    const peakInputTokens = Math.max(...this.records.map(r => r.inputTokens));
    const lastTurn = this.records[this.records.length - 1];
    const firstTurnAt = this.records[0].timestamp;
    const lastTurnAt = lastTurn.timestamp;

    const byModelMap = new Map<string, { turns: number; cost: number; tokens: number }>();
    for (const r of this.records) {
      const entry = byModelMap.get(r.modelId) ?? { turns: 0, cost: 0, tokens: 0 };
      entry.turns++;
      entry.cost += r.effectiveCost;
      entry.tokens += r.inputTokens;
      byModelMap.set(r.modelId, entry);
    }

    const byModel: ModelSpendSummary[] = [];
    for (const [modelId, data] of byModelMap) {
      const profile = getModel(modelId);
      byModel.push({
        modelId,
        label: profile.label,
        provider: profile.provider,
        turns: data.turns,
        totalInputTokens: data.tokens,
        totalCost: data.cost,
        avgCostPerTurn: data.cost / data.turns,
        avgInputTokens: Math.round(data.tokens / data.turns),
        percentOfSpend: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
        percentOfTokens: totalInputTokens > 0 ? (data.tokens / totalInputTokens) * 100 : 0,
        inputCostPerMTok: profile.inputCostPerMTok,
      });
    }
    byModel.sort((a, b) => b.totalCost - a.totalCost);

    const tips = this.generateTips(byModel, this.records);

    const dailyMap = new Map<string, { cost: number; turns: number; tokens: number }>();
    for (const r of this.records) {
      const day = new Date(r.timestamp).toISOString().slice(0, 10);
      const entry = dailyMap.get(day) ?? { cost: 0, turns: 0, tokens: 0 };
      entry.cost += r.effectiveCost;
      entry.turns++;
      entry.tokens += r.inputTokens;
      dailyMap.set(day, entry);
    }
    const dailyTrend = [...dailyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, cost: d.cost, turns: d.turns, tokens: d.tokens }));

    const verifiedTurns = this.records.filter(r => r.source === 'chat-api').length;
    const estimatedTurns = this.records.filter(r => r.source === 'burst').length;

    return { totalTurns, totalCost, totalInputTokens, avgCostPerTurn, avgInputTokens, peakInputTokens, lastTurn, byModel, tips, dailyTrend, firstTurnAt, lastTurnAt, verifiedTurns, estimatedTurns };
  }

  private generateTips(byModel: ModelSpendSummary[], records: TurnCostRecord[]): OptimizationTip[] {
    const tips: OptimizationTip[] = [];

    const premiumModels = byModel.filter(m => m.avgCostPerTurn > 0.5);
    for (const pm of premiumModels) {
      const profile = getModel(pm.modelId);
      const cheaperAlt = this.findCheaperAlternative(profile);
      if (cheaperAlt) {
        const altCostPerTurn = this.estimateCostPerTurn(cheaperAlt, pm.avgInputTokens);
        const savings = (pm.avgCostPerTurn - altCostPerTurn) * pm.turns;
        if (savings > 0.01) {
          tips.push({
            message: `${pm.turns} turns on ${pm.label} (${this.fmtC(pm.avgCostPerTurn)}/turn). Use @tokalator /model ${cheaperAlt.id} to switch to ${cheaperAlt.label} at ${this.fmtC(altCostPerTurn)}/turn.`,
            savingsEstimate: savings,
          });
        }
      }
    }

    const shortTurns = records.filter(r => r.inputTokens < 10000);
    if (shortTurns.length > 5) {
      const expensiveShort = shortTurns.filter(r => {
        const p = getModel(r.modelId);
        return p.inputCostPerMTok >= 3.0;
      });
      if (expensiveShort.length > shortTurns.length * 0.5) {
        const cheapModel = this.findCheapestModel();
        if (cheapModel) {
          const avgShortCost = expensiveShort.reduce((s, r) => s + r.effectiveCost, 0) / expensiveShort.length;
          const cheapCost = this.estimateCostPerTurn(cheapModel, 5000);
          const savings = (avgShortCost - cheapCost) * expensiveShort.length;
          if (savings > 0.01) {
            tips.push({
              message: `${expensiveShort.length} short turns (<10K tokens) used premium models. Route quick questions to ${cheapModel.label} via @tokalator /model ${cheapModel.id}.`,
              savingsEstimate: savings,
            });
          }
        }
      }
    }

    if (records.length >= 5) {
      const recentRecords = records.slice(-20);
      const avgTokens = Math.round(recentRecords.reduce((s, r) => s + r.inputTokens, 0) / recentRecords.length);
      const activeModel = records.length > 0 ? getModel(records[records.length - 1].modelId) : null;

      if (avgTokens > 100000 && activeModel) {
        const cachedRate = activeModel.cachedInputCostPerMTok ?? activeModel.inputCostPerMTok;
        if (cachedRate < activeModel.inputCostPerMTok) {
          const cacheSavingsPct = Math.round((1 - cachedRate / activeModel.inputCostPerMTok) * 100);
          const estSavings = ((activeModel.inputCostPerMTok - cachedRate) / 1_000_000) * avgTokens * recentRecords.length;
          tips.push({
            message: `Avg ${Math.round(avgTokens / 1000)}K tokens/turn. Prompt caching saves ${cacheSavingsPct}% on input. Use @tokalator /compaction to check context health.`,
            savingsEstimate: estSavings,
          });
        }
      }

      if (avgTokens > 80000) {
        tips.push({
          message: `High context usage (avg ${Math.round(avgTokens / 1000)}K/turn). Run @tokalator /optimize to close low-relevance tabs and free budget.`,
          savingsEstimate: 0,
        });
      }

      const uniqueModels = new Set(records.map(r => r.modelId));
      if (uniqueModels.size === 1 && records.length >= 10) {
        const model = getModel(records[0].modelId);
        if (model.inputCostPerMTok >= 3.0) {
          tips.push({
            message: `All ${records.length} turns used ${model.label}. For simple edits, pin key files with @tokalator /pin and switch to a lighter model.`,
            savingsEstimate: 0,
          });
        }
      }
    }

    if (tips.length === 0 && records.length >= 10) {
      tips.push({ message: 'Usage looks efficient. Use @tokalator /breakdown to see where tokens go.', savingsEstimate: 0 });
    }

    return tips.sort((a, b) => b.savingsEstimate - a.savingsEstimate);
  }

  private findCheaperAlternative(current: ModelProfile): ModelProfile | null {
    const candidates = MODEL_PROFILES.filter(m =>
      m.provider === current.provider &&
      m.id !== current.id &&
      m.inputCostPerMTok < current.inputCostPerMTok &&
      m.contextWindow >= current.contextWindow * 0.5
    );
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.inputCostPerMTok - b.inputCostPerMTok);
    return candidates[0];
  }

  private findCheapestModel(): ModelProfile | null {
    const sorted = [...MODEL_PROFILES].sort((a, b) => a.inputCostPerMTok - b.inputCostPerMTok);
    return sorted[0] ?? null;
  }

  private estimateCostPerTurn(model: ModelProfile, avgInputTokens: number): number {
    return (avgInputTokens / 1_000_000) * model.inputCostPerMTok;
  }

  private fmtC(n: number): string {
    if (n < 0.01) return '$' + n.toFixed(4);
    if (n < 1) return '$' + n.toFixed(3);
    return '$' + n.toFixed(2);
  }

  getRecordCount(): number {
    return this.records.length;
  }
}
