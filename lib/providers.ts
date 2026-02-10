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
// LIVE PRICING DATA (February 2026)
// ============================================

export const PROVIDER_MODELS: ModelPricing[] = [
  // ── Anthropic Models ──
  {
    id: 'claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    inputCostPerMTok: 5.0,
    outputCostPerMTok: 25.0,
    contextWindow: 200_000,  // 1M beta available
    maxOutput: 128_000,
    releaseDate: '2025-08-01',
    lastUpdated: '2026-02-07',
    tier: 'flagship',
    notes: 'Most intelligent model; 1M context beta; adaptive thinking',
  },
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    inputCostPerMTok: 3.0,
    outputCostPerMTok: 15.0,
    contextWindow: 200_000,  // 1M beta available
    maxOutput: 64_000,
    releaseDate: '2025-09-29',
    lastUpdated: '2026-02-07',
    tier: 'balanced',
    notes: 'Best speed-intelligence balance; 1M context beta; extended thinking',
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
    lastUpdated: '2026-02-07',
    tier: 'fast',
    notes: 'Fastest Claude; near-frontier intelligence; extended thinking',
  },
  
  // ── OpenAI Models ──
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    inputCostPerMTok: 1.75,
    outputCostPerMTok: 14.0,
    contextWindow: 256_000,
    maxOutput: 32_000,
    releaseDate: '2026-01-15',
    lastUpdated: '2026-02-07',
    tier: 'flagship',
    notes: 'Best for coding & agentic tasks; cached input $0.175/MTok',
  },
  {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    provider: 'openai',
    inputCostPerMTok: 0.50,
    outputCostPerMTok: 4.0,
    contextWindow: 256_000,
    maxOutput: 32_000,
    releaseDate: '2026-02-01',
    lastUpdated: '2026-02-07',
    tier: 'balanced',
    notes: 'Code-optimized GPT-5.2 variant; excels at completion & generation',
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openai',
    inputCostPerMTok: 2.50,
    outputCostPerMTok: 10.0,
    contextWindow: 256_000,
    maxOutput: 32_000,
    releaseDate: '2025-11-01',
    lastUpdated: '2026-02-07',
    tier: 'flagship',
    notes: 'Previous-gen flagship; strong general-purpose reasoning',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    inputCostPerMTok: 3.0,
    outputCostPerMTok: 12.0,
    contextWindow: 1_047_576,
    maxOutput: 32_768,
    releaseDate: '2025-04-14',
    lastUpdated: '2026-02-07',
    tier: 'balanced',
    notes: '1M context; strong coding model; cached input $0.75/MTok',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    inputCostPerMTok: 0.80,
    outputCostPerMTok: 3.20,
    contextWindow: 1_047_576,
    maxOutput: 32_768,
    releaseDate: '2025-04-14',
    lastUpdated: '2026-02-07',
    tier: 'fast',
    notes: '1M context; cached input $0.20/MTok',
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'openai',
    inputCostPerMTok: 0.20,
    outputCostPerMTok: 0.80,
    contextWindow: 1_047_576,
    maxOutput: 32_768,
    releaseDate: '2025-04-14',
    lastUpdated: '2026-02-07',
    tier: 'fast',
    notes: 'Ultra-cheap 1M context; cached input $0.05/MTok',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    inputCostPerMTok: 0.25,
    outputCostPerMTok: 2.0,
    contextWindow: 256_000,
    maxOutput: 32_000,
    releaseDate: '2026-01-15',
    lastUpdated: '2026-02-07',
    tier: 'fast',
    notes: 'Faster cheaper GPT-5; cached input $0.025/MTok',
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
    lastUpdated: '2026-02-07',
    tier: 'balanced',
    notes: 'Reasoning model; cached input $1.00/MTok',
  },
  
  // ── Google Gemini Models ──
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'google',
    inputCostPerMTok: 2.0,
    outputCostPerMTok: 12.0,
    contextWindow: 1_000_000,
    maxOutput: 65_536,
    releaseDate: '2026-01-20',
    lastUpdated: '2026-02-07',
    tier: 'flagship',
    notes: 'Most powerful Google model; best for agentic & vibe-coding; >200K: $4/$18',
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'google',
    inputCostPerMTok: 0.50,
    outputCostPerMTok: 3.0,
    contextWindow: 1_000_000,
    maxOutput: 65_536,
    releaseDate: '2026-01-20',
    lastUpdated: '2026-02-07',
    tier: 'balanced',
    notes: 'Frontier intelligence + superior search & grounding',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    inputCostPerMTok: 1.25,
    outputCostPerMTok: 10.0,
    contextWindow: 1_000_000,
    maxOutput: 65_536,
    releaseDate: '2025-06-01',
    lastUpdated: '2026-02-07',
    tier: 'flagship',
    notes: 'Excels at coding & reasoning; >200K: $2.50/$15; cached $0.125/MTok',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    inputCostPerMTok: 0.30,
    outputCostPerMTok: 2.50,
    contextWindow: 1_000_000,
    maxOutput: 65_536,
    releaseDate: '2025-05-01',
    lastUpdated: '2026-02-07',
    tier: 'balanced',
    notes: 'Hybrid reasoning; thinking budgets; cached $0.03/MTok',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'google',
    inputCostPerMTok: 0.10,
    outputCostPerMTok: 0.40,
    contextWindow: 1_000_000,
    maxOutput: 65_536,
    releaseDate: '2025-06-01',
    lastUpdated: '2026-02-07',
    tier: 'fast',
    notes: 'Smallest & most cost-effective Google model',
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
    lastUpdated: '2026-02-07',
    tier: 'fast',
    notes: 'Balanced multimodal; 1M context; era of agents',
  },
];

// ============================================
// SIMULATED PRICE HISTORY
// ============================================

export const PRICE_HISTORY: PriceChange[] = [
  {
    id: 'pc-1',
    modelId: 'gpt-5.2',
    provider: 'openai',
    date: '2026-01-15',
    field: 'inputCostPerMTok',
    oldValue: 10.0,
    newValue: 1.75,
    changePercent: -82.5,
  },
  {
    id: 'pc-2',
    modelId: 'gemini-3-pro',
    provider: 'google',
    date: '2026-01-20',
    field: 'inputCostPerMTok',
    oldValue: 1.25,
    newValue: 2.0,
    changePercent: 60.0,
  },
  {
    id: 'pc-3',
    modelId: 'claude-opus-4.6',
    provider: 'anthropic',
    date: '2025-08-01',
    field: 'maxOutput',
    oldValue: 32_000,
    newValue: 128_000,
    changePercent: 300.0,
  },
  {
    id: 'pc-4',
    modelId: 'gpt-4.1',
    provider: 'openai',
    date: '2025-04-14',
    field: 'contextWindow',
    oldValue: 128_000,
    newValue: 1_047_576,
    changePercent: 718.4,
  },
  {
    id: 'pc-5',
    modelId: 'gemini-2.5-flash',
    provider: 'google',
    date: '2025-12-01',
    field: 'outputCostPerMTok',
    oldValue: 3.50,
    newValue: 2.50,
    changePercent: -28.57,
  },
  {
    id: 'pc-6',
    modelId: 'claude-sonnet-4.5',
    provider: 'anthropic',
    date: '2025-09-29',
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
    modelId: 'gpt-5.2',
    modelName: 'GPT-5.2',
    provider: 'openai',
    releaseDate: '2026-01-15',
    description: 'Best model for coding & agentic tasks at massively reduced price',
    isNew: true,
  },
  {
    id: 'mr-2',
    modelId: 'gemini-3-pro',
    modelName: 'Gemini 3 Pro',
    provider: 'google',
    releaseDate: '2026-01-20',
    description: 'Most powerful agentic and vibe-coding model from Google',
    isNew: true,
  },
  {
    id: 'mr-3',
    modelId: 'gemini-3-flash',
    modelName: 'Gemini 3 Flash',
    provider: 'google',
    releaseDate: '2026-01-20',
    description: 'Frontier intelligence built for speed with superior search',
    isNew: true,
  },
  {
    id: 'mr-4',
    modelId: 'claude-opus-4.6',
    modelName: 'Claude Opus 4.6',
    provider: 'anthropic',
    releaseDate: '2025-08-01',
    description: 'Most intelligent Claude with 128K output & adaptive thinking',
    isNew: true,
  },
  {
    id: 'mr-5',
    modelId: 'gpt-5-mini',
    modelName: 'GPT-5 Mini',
    provider: 'openai',
    releaseDate: '2026-01-15',
    description: 'Faster cheaper GPT-5 for well-defined tasks',
    isNew: true,
  },
  {
    id: 'mr-9',
    modelId: 'gpt-5.1',
    modelName: 'GPT-5.1',
    provider: 'openai',
    releaseDate: '2025-11-01',
    description: 'Flagship reasoning model with strong general-purpose capabilities',
    isNew: false,
  },
  {
    id: 'mr-10',
    modelId: 'gpt-5.2-codex',
    modelName: 'GPT-5.2 Codex',
    provider: 'openai',
    releaseDate: '2026-02-01',
    description: 'Code-optimized variant of GPT-5.2 for completion and generation',
    isNew: true,
  },
  {
    id: 'mr-6',
    modelId: 'gpt-4.1',
    modelName: 'GPT-4.1',
    provider: 'openai',
    releaseDate: '2025-04-14',
    description: '1M context window coding model with fine-tuning support',
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
    description: 'Fastest Claude with near-frontier intelligence and extended thinking',
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
