/**
 * Multi-Provider Pricing & Model Data
 * Tracks dated pricing for Anthropic, OpenAI, and Google (Gemini)
 */

import { CATALOG_MODELS, PRICING_SOURCES, type LongContext, type Provider } from './models';

export type { Provider };

export interface ModelPricing {
  id: string;
  name: string;
  provider: Provider;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  cachedInputCostPerMTok: number;
  cacheWriteCostPerMTok?: number;
  contextWindow: number;
  maxOutput: number;
  releaseDate: string;
  lastUpdated: string;
  tier?: 'flagship' | 'balanced' | 'fast';
  notes?: string;
  sourceUrl?: string;
  pricingCheckedAt?: string;
  longContext?: LongContext;
}

// ============================================
// MODELS
// Prices, limits, and long-context rules come from the extension catalog
// (tokalator-extension-vs/models.json). Only site copy lives here.
// ============================================

const SITE_META: Record<string, { tier: NonNullable<ModelPricing['tier']>; releaseDate?: string; notes?: string; sourceUrl?: string }> = {
  'claude-fable-5-1': { tier: 'flagship', releaseDate: '2026-08-26', notes: 'Most capable widely released model; thinking always on' },
  'claude-mythos-5-1': { tier: 'flagship' },
  'claude-fable-5': { tier: 'flagship', releaseDate: '2026-08-01', notes: 'Superseded by Fable 5.1 at the same per-token price' },
  'claude-mythos-5': { tier: 'flagship' },
  'claude-opus-5-5': { tier: 'flagship', notes: 'Recommended starting model; default effort medium' },
  'claude-opus-5': { tier: 'flagship', releaseDate: '2026-07-22', notes: 'Superseded by Opus 5.5 at a lower price' },
  'claude-opus-4.8': { tier: 'flagship', releaseDate: '2026-05-14', notes: 'Same request surface as Opus 4.7; supports fast mode' },
  'claude-opus-4.7': { tier: 'flagship', releaseDate: '2026-03-18', notes: 'Introduced the current tokenizer' },
  'claude-opus-4.6': { tier: 'flagship', releaseDate: '2026-02-05' },
  'claude-opus-4.5': { tier: 'flagship', releaseDate: '2025-11-24', notes: '200K context; retirement not sooner than 2026-11-24' },
  'claude-sonnet-5-5': { tier: 'balanced', notes: 'Speed and intelligence balance; cache reads at 5% of input' },
  'claude-sonnet-5': { tier: 'balanced', releaseDate: '2026-07-22', notes: 'Superseded by Sonnet 5.5 at the same price' },
  'claude-sonnet-4.6': { tier: 'balanced', releaseDate: '2026-02-05' },
  'claude-haiku-5-5': { tier: 'fast', notes: 'Fastest Claude; newer tokenizer counts about 30% more tokens' },
  'claude-haiku-4.5': { tier: 'fast', releaseDate: '2025-10-01', notes: '200K context, not 1M' },
  'gpt-6-astra': { tier: 'flagship', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-6-astra' },
  'gpt-6.1-sol': { tier: 'balanced', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-6.1-sol' },
  'gpt-6-luna': { tier: 'fast', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-6-luna' },
  'gpt-5.6-sol': { tier: 'flagship', releaseDate: '2026-07-15', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol' },
  'gpt-5.6-terra': { tier: 'balanced', releaseDate: '2026-07-15', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-terra' },
  'gpt-5.6-luna': { tier: 'fast', releaseDate: '2026-07-15', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna' },
  'gpt-5.5': { tier: 'flagship', releaseDate: '2026-04-23', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.5' },
  'gpt-5.4': { tier: 'flagship', releaseDate: '2026-03-05', sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4' },
  'gpt-5.4-mini': { tier: 'balanced', releaseDate: '2026-03-17' },
  'gpt-5.4-nano': { tier: 'fast', releaseDate: '2026-03-17' },
  'gpt-5.3-codex': { tier: 'balanced', releaseDate: '2026-02-24', notes: 'Code-optimized model' },
  'gemini-3.8-flash': { tier: 'balanced' },
  'gemini-3.6-flash': { tier: 'balanced', releaseDate: '2026-07-22' },
  'gemini-3.5-flash': { tier: 'balanced', releaseDate: '2026-05-19' },
  'gemini-3.1-pro-preview': { tier: 'flagship', releaseDate: '2026-04-01' },
  'gemini-3-flash-preview': { tier: 'balanced', releaseDate: '2025-12-17' },
  'gemini-2.5-pro': { tier: 'flagship', releaseDate: '2025-06-01' },
};

export const PROVIDER_MODELS: ModelPricing[] = CATALOG_MODELS.map(m => {
  const meta = SITE_META[m.id];
  return {
    id: m.id,
    name: m.label,
    provider: m.provider,
    inputCostPerMTok: m.inputCostPerMTok,
    outputCostPerMTok: m.outputCostPerMTok,
    cachedInputCostPerMTok: m.cachedInputCostPerMTok,
    cacheWriteCostPerMTok: m.cacheWriteCostPerMTok,
    contextWindow: m.contextWindow,
    maxOutput: m.maxOutput,
    releaseDate: meta?.releaseDate ?? '',
    lastUpdated: m.verifiedAt,
    pricingCheckedAt: m.verifiedAt,
    tier: meta?.tier,
    notes: [m.notes, meta?.notes].filter(Boolean).join(' ') || undefined,
    sourceUrl: meta?.sourceUrl,
    longContext: m.longContext,
  };
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const PROVIDERS: Provider[] = ['anthropic', 'openai', 'google'];

const PROVIDER_COLORS: Record<Provider, string> = {
  anthropic: 'var(--accent)',
  openai: 'var(--cyan)',
  google: 'var(--yellow)',
};

export function getProviderColor(provider: Provider): string {
  return PROVIDER_COLORS[provider];
}

export function getProviderName(provider: Provider): string {
  const names = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
  };
  return names[provider];
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return tokens.toString();
}

export function calculateCostComparison(
  inputTokens: number,
  outputTokens: number
): { modelId: string; cost: number; provider: Provider }[] {
  return PROVIDER_MODELS.map(model => ({
    modelId: model.id,
    cost: estimateModelCost(model, inputTokens, outputTokens),
    provider: model.provider,
  })).sort((a, b) => a.cost - b.cost);
}


export interface RequestCost {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  total: number;
  longContext: boolean;
}

/** Text request estimate; long-context rates apply to the whole request above the threshold. Excludes tools, regional and service-tier fees. */
export function estimateCostBreakdown(
  model: ModelPricing,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens = 0,
  cacheReadTokens = 0,
): RequestCost {
  if (![inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens].every(n => Number.isFinite(n) && n >= 0)) {
    throw new RangeError('Token counts must be finite and non-negative');
  }
  const prompt = inputTokens + cacheWriteTokens + cacheReadTokens;
  const tier = model.longContext && prompt > model.longContext.threshold ? model.longContext : undefined;
  const im = (tier?.inputMultiplier ?? 1) / 1_000_000;
  const om = (tier?.outputMultiplier ?? 1) / 1_000_000;
  const input = inputTokens * model.inputCostPerMTok * im;
  const output = outputTokens * model.outputCostPerMTok * om;
  const cacheWrite = cacheWriteTokens * (model.cacheWriteCostPerMTok ?? model.inputCostPerMTok) * im;
  const cacheRead = cacheReadTokens * model.cachedInputCostPerMTok * im;
  return { input, output, cacheWrite, cacheRead, total: input + output + cacheWrite + cacheRead, longContext: !!tier };
}

export function estimateModelCost(
  model: ModelPricing,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens = 0,
  cacheReadTokens = 0,
): number {
  return estimateCostBreakdown(model, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens).total;
}

export function fitsContext(model: ModelPricing, promptTokens: number, outputTokens: number): boolean {
  return outputTokens <= model.maxOutput && promptTokens + outputTokens <= model.contextWindow;
}

export function normalizeModelId(name: string): string {
  return name.trim().toLowerCase().replace(/[-_@]?(\d{8}|\d{4}-\d{2}-\d{2})$/, '').replace(/[^a-z0-9]/g, '');
}

const MODELS_BY_NORMALIZED_ID = new Map(PROVIDER_MODELS.map(m => [normalizeModelId(m.id), m]));

export function findModel(name: string): ModelPricing | undefined {
  return MODELS_BY_NORMALIZED_ID.get(normalizeModelId(name));
}

export function pricingSource(model: ModelPricing): string {
  return model.sourceUrl ?? PRICING_SOURCES[model.provider];
}
