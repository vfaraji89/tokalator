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
// LIVE PRICING DATA (January 2026)
// ============================================

export const PROVIDER_MODELS: ModelPricing[] = [
  // Anthropic Models
  {
    id: 'claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 200_000,
    maxOutput: 32_000,
    releaseDate: '2025-02-27',
    lastUpdated: '2026-01-15',
    tier: 'flagship',
  },
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    inputCostPerMTok: 3.0,
    outputCostPerMTok: 15.0,
    contextWindow: 200_000,
    maxOutput: 64_000,
    releaseDate: '2025-05-22',
    lastUpdated: '2026-01-15',
    tier: 'balanced',
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    inputCostPerMTok: 1.0,
    outputCostPerMTok: 5.0,
    contextWindow: 200_000,
    maxOutput: 64_000,
    releaseDate: '2025-10-22',
    lastUpdated: '2026-01-15',
    tier: 'fast',
  },
  
  // OpenAI Models
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    inputCostPerMTok: 10.0,
    outputCostPerMTok: 30.0,
    contextWindow: 256_000,
    maxOutput: 32_000,
    releaseDate: '2025-12-01',
    lastUpdated: '2026-01-20',
    tier: 'flagship',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    inputCostPerMTok: 2.5,
    outputCostPerMTok: 10.0,
    contextWindow: 128_000,
    maxOutput: 16_384,
    releaseDate: '2024-05-13',
    lastUpdated: '2026-01-20',
    tier: 'balanced',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    inputCostPerMTok: 0.15,
    outputCostPerMTok: 0.60,
    contextWindow: 128_000,
    maxOutput: 16_384,
    releaseDate: '2024-07-18',
    lastUpdated: '2026-01-20',
    tier: 'fast',
  },
  {
    id: 'o1',
    name: 'o1',
    provider: 'openai',
    inputCostPerMTok: 15.0,
    outputCostPerMTok: 60.0,
    contextWindow: 200_000,
    maxOutput: 100_000,
    releaseDate: '2024-12-17',
    lastUpdated: '2026-01-20',
    tier: 'flagship',
    notes: 'Reasoning model',
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    inputCostPerMTok: 1.10,
    outputCostPerMTok: 4.40,
    contextWindow: 200_000,
    maxOutput: 100_000,
    releaseDate: '2025-01-31',
    lastUpdated: '2026-01-20',
    tier: 'fast',
    notes: 'Reasoning model',
  },
  
  // Google Gemini Models
  {
    id: 'gemini-2.0-ultra',
    name: 'Gemini 2.0 Ultra',
    provider: 'google',
    inputCostPerMTok: 7.5,
    outputCostPerMTok: 22.5,
    contextWindow: 2_000_000,
    maxOutput: 65_536,
    releaseDate: '2025-11-15',
    lastUpdated: '2026-01-18',
    tier: 'flagship',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    inputCostPerMTok: 0.10,
    outputCostPerMTok: 0.40,
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    releaseDate: '2025-02-05',
    lastUpdated: '2026-01-18',
    tier: 'fast',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    provider: 'google',
    inputCostPerMTok: 0.075,
    outputCostPerMTok: 0.30,
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    releaseDate: '2025-02-25',
    lastUpdated: '2026-01-18',
    tier: 'fast',
  },
];

// ============================================
// SIMULATED PRICE HISTORY
// ============================================

export const PRICE_HISTORY: PriceChange[] = [
  {
    id: 'pc-1',
    modelId: 'claude-opus-4.5',
    provider: 'anthropic',
    date: '2025-12-01',
    field: 'inputCostPerMTok',
    oldValue: 6.0,
    newValue: 5.0,
    changePercent: -16.67,
  },
  {
    id: 'pc-2',
    modelId: 'gpt-4o',
    provider: 'openai',
    date: '2025-11-15',
    field: 'inputCostPerMTok',
    oldValue: 5.0,
    newValue: 2.5,
    changePercent: -50.0,
  },
  {
    id: 'pc-3',
    modelId: 'gemini-2.0-flash',
    provider: 'google',
    date: '2026-01-10',
    field: 'outputCostPerMTok',
    oldValue: 0.60,
    newValue: 0.40,
    changePercent: -33.33,
  },
  {
    id: 'pc-4',
    modelId: 'claude-sonnet-4.5',
    provider: 'anthropic',
    date: '2025-10-01',
    field: 'outputCostPerMTok',
    oldValue: 18.0,
    newValue: 15.0,
    changePercent: -16.67,
  },
];

// ============================================
// SIMULATED MODEL RELEASES
// ============================================

export const MODEL_RELEASES: ModelRelease[] = [
  {
    id: 'mr-1',
    modelId: 'gpt-5',
    modelName: 'GPT-5',
    provider: 'openai',
    releaseDate: '2025-12-01',
    description: 'Next-generation flagship model with improved reasoning',
    isNew: true,
  },
  {
    id: 'mr-2',
    modelId: 'gemini-2.0-ultra',
    modelName: 'Gemini 2.0 Ultra',
    provider: 'google',
    releaseDate: '2025-11-15',
    description: 'Largest context window at 2M tokens',
    isNew: true,
  },
  {
    id: 'mr-3',
    modelId: 'claude-haiku-4.5',
    modelName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    releaseDate: '2025-10-22',
    description: 'Fastest Claude model with enhanced capabilities',
    isNew: false,
  },
  {
    id: 'mr-4',
    modelId: 'o3-mini',
    modelName: 'o3-mini',
    provider: 'openai',
    releaseDate: '2025-01-31',
    description: 'Cost-effective reasoning model',
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
