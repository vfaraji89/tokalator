/**
 * Multi-Provider Pricing & Model Data
 * Tracks dated pricing for Anthropic, OpenAI, and Google (Gemini)
 */

export type Provider = 'anthropic' | 'openai' | 'google';

export interface ModelPricing {
  id: string;
  name: string;
  provider: Provider;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  contextWindow: number;
  maxOutput: number;
  releaseDate: string;
  lastUpdated: string;
  tier?: 'flagship' | 'balanced' | 'fast';
  notes?: string;
  sourceUrl?: string;
  pricingCheckedAt?: string;
  longContext?: { threshold: number; inputMultiplier: number; outputMultiplier: number };
}

export interface PriceChange {
  id: string;
  modelId: string;
  provider: Provider;
  date: string;
  field: 'inputCostPerMTok' | 'outputCostPerMTok' | 'contextWindow' | 'maxOutput';
  oldValue: number;
  newValue: number;
  changePercent: number;
}

export interface ModelRelease {
  id: string;
  modelId: string;
  modelName: string;
  provider: Provider;
  releaseDate: string;
  description: string;
  isNew: boolean;
}

// ============================================
// PRICING SNAPSHOT (September 2026)
// Official sources are linked per provider/model. Rates are not a live feed.
// ============================================

export const PROVIDER_MODELS: ModelPricing[] = [
  {
    id: 'gpt-6-astra', name: 'GPT-6 Astra', provider: 'openai',
    inputCostPerMTok: 10, outputCostPerMTok: 50,
    contextWindow: 1050000, maxOutput: 128000,
    releaseDate: '', lastUpdated: '2026-09-06', tier: 'flagship',
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-6-astra',
    pricingCheckedAt: '2026-09-06',
    longContext: { threshold: 272000, inputMultiplier: 2, outputMultiplier: 1.5 },
    notes: 'Standard text-token rates. Input above 272K increases full-request input and output rates.',
  },
  {
    id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'google',
    inputCostPerMTok: 0.75, outputCostPerMTok: 3.75,
    contextWindow: 1048576, maxOutput: 65536,
    releaseDate: '', lastUpdated: '2026-09-06', tier: 'balanced',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    pricingCheckedAt: '2026-09-06',
    notes: 'Promotional rates through December 31, 2026; then $1.50 input / $7.50 output per MTok.',
  },

  // ── Anthropic ──
  {
    id: 'claude-fable-5-1',
    name: 'Claude Fable 5.1',
    provider: 'anthropic',
    inputCostPerMTok: 10.0,
    outputCostPerMTok: 50.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-08-26',
    lastUpdated: '2026-09-02',
    tier: 'flagship',
    notes: 'Most capable widely released model; thinking always on, no forced tool use',
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    provider: 'anthropic',
    inputCostPerMTok: 10.0,
    outputCostPerMTok: 50.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-08-01',
    lastUpdated: '2026-09-02',
    tier: 'flagship',
    notes: 'Mythos-class; superseded by Fable 5.1 at the same per-token price',
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-07-22',
    lastUpdated: '2026-09-02',
    tier: 'flagship',
    notes: 'Claude 5 family Opus; complex reasoning and agentic coding',
  },
  {
    id: 'claude-opus-4.8',
    name: 'Claude Opus 4.8',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-05-14',
    lastUpdated: '2026-09-02',
    tier: 'flagship',
    notes: 'Same request surface as Opus 4.7; supports fast mode',
  },
  {
    id: 'claude-opus-4.7',
    name: 'Claude Opus 4.7',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-03-18',
    lastUpdated: '2026-09-02',
    tier: 'flagship',
    notes: 'Introduced the current tokenizer; fast mode removed',
  },
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-02-05',
    lastUpdated: '2026-09-02',
    tier: 'flagship',
    notes: 'Last model accepting budget_tokens as a transitional escape hatch',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    inputCostPerMTok: 2.0,
    outputCostPerMTok: 10.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-07-22',
    lastUpdated: '2026-09-02',
    tier: 'balanced',
    notes: 'Best price-performance in the Claude 5 family',
  },
  {
    id: 'claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    inputCostPerMTok: 3.0,
    outputCostPerMTok: 15.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-02-05',
    lastUpdated: '2026-09-02',
    tier: 'balanced',
    notes: 'Prior-generation balanced tier; priced above Sonnet 5',
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    inputCostPerMTok: 1.0,
    outputCostPerMTok: 5.0,
    contextWindow: 200_000,
    maxOutput: 64_000,
    releaseDate: '2025-10-01',
    lastUpdated: '2026-09-02',
    tier: 'fast',
    notes: 'Fastest and cheapest; 200K context, not 1M',
  },

  // ── OpenAI ──
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    provider: 'openai',
    inputCostPerMTok: 5,
    outputCostPerMTok: 30,
    contextWindow: 1050000,
    maxOutput: 128_000,
    releaseDate: '2026-04-23',
    lastUpdated: '2026-09-06',
    tier: 'flagship',
    notes: 'Previous-generation model for professional work.',
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.5',
    pricingCheckedAt: '2026-09-06',
    longContext: { threshold: 272000, inputMultiplier: 2, outputMultiplier: 1.5 },
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    provider: 'openai',
    inputCostPerMTok: 2.5,
    outputCostPerMTok: 15,
    contextWindow: 1050000,
    maxOutput: 128_000,
    releaseDate: '2026-03-05',
    lastUpdated: '2026-09-06',
    tier: 'flagship',
    notes: 'Previous-generation model for coding and professional work.',
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4',
    pricingCheckedAt: '2026-09-06',
    longContext: { threshold: 272000, inputMultiplier: 2, outputMultiplier: 1.5 },
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    provider: 'openai',
    inputCostPerMTok: 0.75,
    outputCostPerMTok: 4.50,
    contextWindow: 128_000,
    maxOutput: 64_000,
    releaseDate: '2026-03-17',
    lastUpdated: '2026-08-17',
    tier: 'balanced',
    notes: 'Strong mini model for coding and subagents',
  },
  {
    id: 'gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    provider: 'openai',
    inputCostPerMTok: 0.20,
    outputCostPerMTok: 1.25,
    contextWindow: 128_000,
    maxOutput: 16_000,
    releaseDate: '2026-03-17',
    lastUpdated: '2026-08-17',
    tier: 'fast',
    notes: 'Ultra-cheap; cached input $0.02/MTok',
  },
  {
    id: 'gpt-5.6-luna',
    name: 'GPT-5.6 Luna',
    provider: 'openai',
    inputCostPerMTok: 0.2,
    outputCostPerMTok: 1.2,
    contextWindow: 1050000,
    maxOutput: 128_000,
    releaseDate: '2026-07-15',
    lastUpdated: '2026-09-06',
    tier: 'balanced',
    notes: 'GPT-5.6 tier for cost-sensitive, high-volume workloads.',
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna',
    pricingCheckedAt: '2026-09-06',
    longContext: { threshold: 272000, inputMultiplier: 2, outputMultiplier: 1.5 },
  },
  {
    id: 'gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    provider: 'openai',
    inputCostPerMTok: 4,
    outputCostPerMTok: 20,
    contextWindow: 1050000,
    maxOutput: 128_000,
    releaseDate: '2026-07-15',
    lastUpdated: '2026-09-06',
    tier: 'flagship',
    notes: 'Flagship GPT-5.6 tier. Promotional rates through at least November 21, 2026.',
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
    pricingCheckedAt: '2026-09-06',
    longContext: { threshold: 272000, inputMultiplier: 2, outputMultiplier: 1.5 },
  },
  {
    id: 'gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    provider: 'openai',
    inputCostPerMTok: 2,
    outputCostPerMTok: 12,
    contextWindow: 1050000,
    maxOutput: 128_000,
    releaseDate: '2026-07-15',
    lastUpdated: '2026-09-06',
    tier: 'flagship',
    notes: 'GPT-5.6 tier balancing capability and cost.',
    sourceUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-terra',
    pricingCheckedAt: '2026-09-06',
    longContext: { threshold: 272000, inputMultiplier: 2, outputMultiplier: 1.5 },
  },
  {
    id: 'gpt-5.3-codex',
    name: 'GPT-5.3 Codex',
    provider: 'openai',
    inputCostPerMTok: 1.75,
    outputCostPerMTok: 14.0,
    contextWindow: 256_000,
    maxOutput: 32_000,
    releaseDate: '2026-02-24',
    lastUpdated: '2026-08-17',
    tier: 'balanced',
    notes: 'Code-optimized model; cached input $0.175/MTok',
  },

  // ── Google Gemini ──
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'google',
    inputCostPerMTok: 0.75,
    outputCostPerMTok: 3.75,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2026-08-01',
    lastUpdated: '2026-09-06',
    tier: 'balanced',
    notes: 'Promotional rates through December 31, 2026; then $1.50 input / $7.50 output per MTok.',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    pricingCheckedAt: '2026-09-06',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'google',
    inputCostPerMTok: 0.75,
    outputCostPerMTok: 3.75,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2026-07-22',
    lastUpdated: '2026-09-06',
    tier: 'balanced',
    notes: 'Promotional rates through December 31, 2026; then $1.50 input / $7.50 output per MTok.',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    pricingCheckedAt: '2026-09-06',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
    inputCostPerMTok: 1.50,
    outputCostPerMTok: 9.0,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2026-05-19',
    lastUpdated: '2026-08-17',
    tier: 'balanced',
    notes: 'Mature Flash; sustained frontier performance',
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    inputCostPerMTok: 2.0,
    outputCostPerMTok: 12.0,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2026-04-01',
    lastUpdated: '2026-08-17',
    tier: 'flagship',
    notes: 'Advanced agentic capabilities; >200K: $4/$18',
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'google',
    inputCostPerMTok: 0.50,
    outputCostPerMTok: 3.0,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2025-12-17',
    lastUpdated: '2026-08-17',
    tier: 'balanced',
    notes: 'Fast and affordable; 1M context',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    inputCostPerMTok: 1.25,
    outputCostPerMTok: 10.0,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2025-06-01',
    lastUpdated: '2026-08-17',
    tier: 'flagship',
    notes: 'Deep reasoning; >200K: $2.50/$15; cached $0.125/MTok',
  },
];

// ============================================
// PRICE HISTORY
// ============================================

export const PRICE_HISTORY: PriceChange[] = []; // No source-backed historical changes recorded yet.

// ============================================
// MODEL RELEASES
// ============================================

export const MODEL_RELEASES: ModelRelease[] = [
  {
    id: 'mr-1',
    modelId: 'claude-fable-5',
    modelName: 'Claude Fable 5',
    provider: 'anthropic',
    releaseDate: '2026-08-01',
    description: 'Mythos-class model; most intelligent generally available Claude',
    isNew: true,
  },
  {
    id: 'mr-2',
    modelId: 'claude-sonnet-5',
    modelName: 'Claude Sonnet 5',
    provider: 'anthropic',
    releaseDate: '2026-08-01',
    description: 'Claude 5 family balanced model',
    isNew: true,
  },
  {
    id: 'mr-3',
    modelId: 'gemini-3.7-flash',
    modelName: 'Gemini 3.7 Flash',
    provider: 'google',
    releaseDate: '2026-08-01',
    description: 'Previous-generation Flash model',
    isNew: true,
  },
  {
    id: 'mr-4',
    modelId: 'claude-opus-5',
    modelName: 'Claude Opus 5',
    provider: 'anthropic',
    releaseDate: '2026-07-22',
    description: 'Claude 5 family Opus for complex reasoning and agentic coding',
    isNew: true,
  },
  {
    id: 'mr-5',
    modelId: 'gemini-3.6-flash',
    modelName: 'Gemini 3.6 Flash',
    provider: 'google',
    releaseDate: '2026-07-22',
    description: 'Flash with agentic coding improvements',
    isNew: true,
  },
  {
    id: 'mr-6',
    modelId: 'gpt-5.6-terra',
    modelName: 'GPT-5.6 Terra',
    provider: 'openai',
    releaseDate: '2026-07-15',
    description: 'GPT-5.6 tier balancing intelligence and cost',
    isNew: true,
  },
  {
    id: 'mr-7',
    modelId: 'gpt-5.5',
    modelName: 'GPT-5.5',
    provider: 'openai',
    releaseDate: '2026-04-23',
    description: 'New class of intelligence for coding and professional work',
    isNew: false,
  },
  {
    id: 'mr-8',
    modelId: 'gemini-3.5-flash',
    modelName: 'Gemini 3.5 Flash',
    provider: 'google',
    releaseDate: '2026-05-19',
    description: 'Mature Flash for sustained frontier performance',
    isNew: false,
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getModelsByProvider(provider: Provider): ModelPricing[] {
  return PROVIDER_MODELS.filter(m => m.provider === provider);
}

export function getProviderColor(provider: Provider): string {
  const colors = {
    anthropic: '#DC2626', // Red
    openai: '#1A1A1A',    // Black
    google: '#991B1B',    // Dark red
  };
  return colors[provider];
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


/** Standard uncached text request estimate; excludes tools, regional and service-tier fees. */
export function estimateModelCost(model: ModelPricing, inputTokens: number, outputTokens: number): number {
  if (![inputTokens, outputTokens].every(n => Number.isFinite(n) && n >= 0)) {
    throw new RangeError('Token counts must be finite and non-negative');
  }
  const tier = model.longContext && inputTokens > model.longContext.threshold ? model.longContext : undefined;
  return (inputTokens * model.inputCostPerMTok * (tier?.inputMultiplier ?? 1)
    + outputTokens * model.outputCostPerMTok * (tier?.outputMultiplier ?? 1)) / 1_000_000;
}

export function pricingSource(model: ModelPricing): string {
  return model.sourceUrl ?? {
    anthropic: 'https://platform.claude.com/docs/en/about-claude/pricing',
    openai: 'https://developers.openai.com/api/docs/pricing',
    google: 'https://ai.google.dev/gemini-api/docs/pricing',
  }[model.provider];
}
