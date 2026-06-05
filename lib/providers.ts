/**
 * Multi-Provider Pricing & Model Data
 * Tracks live pricing for Anthropic, OpenAI, and Google (Gemini)
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
// LIVE PRICING DATA (May 2026)
// ============================================

export const PROVIDER_MODELS: ModelPricing[] = [
  // ── Anthropic Models ──
  {
    id: 'claude-opus-4.8',
    name: 'Claude Opus 4.8',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-05-01',
    lastUpdated: '2026-05-31',
    tier: 'flagship',
    notes: 'Most capable model for complex reasoning and agentic coding',
  },
  {
    id: 'claude-opus-4.7',
    name: 'Claude Opus 4.7',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-03-01',
    lastUpdated: '2026-05-31',
    tier: 'flagship',
    notes: 'Adaptive thinking; 128K output; 1M context',
  },
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2025-08-01',
    lastUpdated: '2026-05-31',
    tier: 'flagship',
    notes: 'Extended thinking; 128K output; 1M context',
  },
  {
    id: 'claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    inputCostPerMTok: 3.0,
    outputCostPerMTok: 15.0,
    contextWindow: 1_000_000,
    maxOutput: 64_000,
    releaseDate: '2025-09-29',
    lastUpdated: '2026-05-31',
    tier: 'balanced',
    notes: 'Best speed-intelligence balance; 1M context; extended thinking',
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
    lastUpdated: '2026-05-31',
    tier: 'fast',
    notes: 'Fastest Claude; near-frontier intelligence',
  },

  // ── OpenAI Models ──
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    provider: 'openai',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 30.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-05-01',
    lastUpdated: '2026-05-31',
    tier: 'flagship',
    notes: 'Most capable OpenAI model for coding and professional work',
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    provider: 'openai',
    inputCostPerMTok: 2.50,
    outputCostPerMTok: 15.0,
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    releaseDate: '2026-03-01',
    lastUpdated: '2026-05-31',
    tier: 'flagship',
    notes: 'Affordable coding model; cached input $0.25/MTok',
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    provider: 'openai',
    inputCostPerMTok: 0.75,
    outputCostPerMTok: 4.50,
    contextWindow: 400_000,
    maxOutput: 128_000,
    releaseDate: '2026-03-01',
    lastUpdated: '2026-05-31',
    tier: 'balanced',
    notes: 'Strong mini model for coding, computer use, and subagents',
  },
  {
    id: 'gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    provider: 'openai',
    inputCostPerMTok: 0.20,
    outputCostPerMTok: 1.25,
    contextWindow: 400_000,
    maxOutput: 128_000,
    releaseDate: '2026-03-01',
    lastUpdated: '2026-05-31',
    tier: 'fast',
    notes: 'Ultra-cheap; cached input $0.02/MTok',
  },
  {
    id: 'gpt-5.3-codex',
    name: 'GPT-5.3 Codex',
    provider: 'openai',
    inputCostPerMTok: 1.75,
    outputCostPerMTok: 14.0,
    contextWindow: 400_000,
    maxOutput: 128_000,
    releaseDate: '2026-04-01',
    lastUpdated: '2026-05-31',
    tier: 'balanced',
    notes: 'Code-optimized model; cached input $0.175/MTok',
  },
  {
    id: 'o4-mini',
    name: 'o4-mini',
    provider: 'openai',
    inputCostPerMTok: 4.0,
    outputCostPerMTok: 16.0,
    contextWindow: 200_000,
    maxOutput: 100_000,
    releaseDate: '2025-04-16',
    lastUpdated: '2026-05-31',
    tier: 'balanced',
    notes: 'Reasoning model with reinforcement fine-tuning',
  },

  // ── Google Gemini Models ──
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
    inputCostPerMTok: 1.50,
    outputCostPerMTok: 9.0,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2026-05-01',
    lastUpdated: '2026-05-31',
    tier: 'balanced',
    notes: 'Most intelligent Flash; sustained frontier performance',
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
    lastUpdated: '2026-05-31',
    tier: 'flagship',
    notes: 'Advanced agentic capabilities; >200K: $4/$18',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    provider: 'google',
    inputCostPerMTok: 0.25,
    outputCostPerMTok: 1.50,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2026-04-01',
    lastUpdated: '2026-05-31',
    tier: 'fast',
    notes: 'Frontier performance at budget-friendly pricing',
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
    lastUpdated: '2026-05-31',
    tier: 'flagship',
    notes: 'Deep reasoning; >200K: $2.50/$15; cached $0.125/MTok',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    inputCostPerMTok: 0.30,
    outputCostPerMTok: 2.50,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2025-05-01',
    lastUpdated: '2026-05-31',
    tier: 'balanced',
    notes: 'Best price-performance; hybrid reasoning; cached $0.03/MTok',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'google',
    inputCostPerMTok: 0.10,
    outputCostPerMTok: 0.40,
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    releaseDate: '2025-06-01',
    lastUpdated: '2026-05-31',
    tier: 'fast',
    notes: 'Fastest and most budget-friendly Google model',
  },
];

// ============================================
// SIMULATED PRICE HISTORY
// ============================================

export const PRICE_HISTORY: PriceChange[] = [
  {
    id: 'pc-1',
    modelId: 'gpt-5.4',
    provider: 'openai',
    date: '2026-05-01',
    field: 'outputCostPerMTok',
    oldValue: 10.0,
    newValue: 15.0,
    changePercent: 50.0,
  },
  {
    id: 'pc-2',
    modelId: 'gpt-5.4-mini',
    provider: 'openai',
    date: '2026-05-01',
    field: 'inputCostPerMTok',
    oldValue: 0.40,
    newValue: 0.75,
    changePercent: 87.5,
  },
  {
    id: 'pc-3',
    modelId: 'claude-opus-4.6',
    provider: 'anthropic',
    date: '2026-03-01',
    field: 'contextWindow',
    oldValue: 200_000,
    newValue: 1_000_000,
    changePercent: 400.0,
  },
  {
    id: 'pc-4',
    modelId: 'gemini-2.5-flash',
    provider: 'google',
    date: '2025-12-01',
    field: 'outputCostPerMTok',
    oldValue: 3.50,
    newValue: 2.50,
    changePercent: -28.57,
  },
  {
    id: 'pc-5',
    modelId: 'claude-sonnet-4.6',
    provider: 'anthropic',
    date: '2026-03-01',
    field: 'contextWindow',
    oldValue: 200_000,
    newValue: 1_000_000,
    changePercent: 400.0,
  },
];

// ============================================
// SIMULATED MODEL RELEASES
// ============================================

export const MODEL_RELEASES: ModelRelease[] = [
  {
    id: 'mr-1',
    modelId: 'claude-opus-4.8',
    modelName: 'Claude Opus 4.8',
    provider: 'anthropic',
    releaseDate: '2026-05-01',
    description: 'Most capable model for complex reasoning and agentic coding',
    isNew: true,
  },
  {
    id: 'mr-2',
    modelId: 'gpt-5.5',
    modelName: 'GPT-5.5',
    provider: 'openai',
    releaseDate: '2026-05-01',
    description: 'New class of intelligence for coding and professional work',
    isNew: true,
  },
  {
    id: 'mr-3',
    modelId: 'gemini-3.5-flash',
    modelName: 'Gemini 3.5 Flash',
    provider: 'google',
    releaseDate: '2026-05-01',
    description: 'Most intelligent Flash model for sustained frontier performance',
    isNew: true,
  },
  {
    id: 'mr-4',
    modelId: 'claude-opus-4.7',
    modelName: 'Claude Opus 4.7',
    provider: 'anthropic',
    releaseDate: '2026-03-01',
    description: 'Adaptive thinking with 128K output and 1M context',
    isNew: false,
  },
  {
    id: 'mr-5',
    modelId: 'gpt-5.3-codex',
    modelName: 'GPT-5.3 Codex',
    provider: 'openai',
    releaseDate: '2026-04-01',
    description: 'Code-optimized model for completion and generation',
    isNew: false,
  },
  {
    id: 'mr-6',
    modelId: 'gemini-3.1-pro',
    modelName: 'Gemini 3.1 Pro',
    provider: 'google',
    releaseDate: '2026-04-01',
    description: 'Advanced agentic capabilities with 1M context',
    isNew: false,
  },
  {
    id: 'mr-7',
    modelId: 'o4-mini',
    modelName: 'o4-mini',
    provider: 'openai',
    releaseDate: '2025-04-16',
    description: 'Reasoning model with reinforcement fine-tuning',
    isNew: false,
  },
  {
    id: 'mr-8',
    modelId: 'claude-haiku-4.5',
    modelName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    releaseDate: '2025-10-01',
    description: 'Fastest Claude with near-frontier intelligence',
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
    cost: (inputTokens / 1_000_000) * model.inputCostPerMTok +
          (outputTokens / 1_000_000) * model.outputCostPerMTok,
    provider: model.provider,
  })).sort((a, b) => a.cost - b.cost);
}
