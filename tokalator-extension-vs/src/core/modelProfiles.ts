/**
 * Known AI model profiles with context window, pricing, and metadata.
 * DO NOT EDIT BY HAND — generated from models.json.
 * Run: npm run generate-models
 */

export type PriceSource = 'verified' | 'pending' | 'stale';

export interface ModelProfile {
  id: string;
  label: string;
  provider: 'anthropic' | 'openai' | 'google' | 'other';
  contextWindow: number;
  maxOutput: number;
  rotThreshold: number;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  cachedInputCostPerMTok?: number;
  priceSource: PriceSource;
  verifiedAt: string;
}

export const BUNDLED_SCHEMA_VERSION = 1;
export const BUNDLED_UPDATED_AT = '2026-05-31T00:00:00Z';

export const MODEL_PROFILES: ModelProfile[] = [
  // Anthropic
  { id: 'claude-opus-4.8'  , label: 'Claude Opus 4.8'  , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 42, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'claude-opus-4.7'  , label: 'Claude Opus 4.7'  , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 40, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'claude-opus-4.6'  , label: 'Claude Opus 4.6'  , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 38, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'anthropic'  , contextWindow: 1000000, maxOutput:  64000, rotThreshold: 28, inputCostPerMTok:   3.00, outputCostPerMTok:  15.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'claude-haiku-4.5' , label: 'Claude Haiku 4.5' , provider: 'anthropic'  , contextWindow:  200000, maxOutput:  64000, rotThreshold: 15, inputCostPerMTok:   1.00, outputCostPerMTok:   5.00, priceSource: 'verified', verifiedAt: '2026-05-31' },

  // OpenAI
  { id: 'gpt-5.5'          , label: 'GPT-5.5'          , provider: 'openai'     , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 40, inputCostPerMTok:   5.00, outputCostPerMTok:  30.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gpt-5.4'          , label: 'GPT-5.4'          , provider: 'openai'     , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 35, inputCostPerMTok:   2.50, outputCostPerMTok:  15.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gpt-5.4-mini'     , label: 'GPT-5.4 Mini'     , provider: 'openai'     , contextWindow:  400000, maxOutput: 128000, rotThreshold: 22, inputCostPerMTok:   0.75, outputCostPerMTok:   4.50, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gpt-5.4-nano'     , label: 'GPT-5.4 Nano'     , provider: 'openai'     , contextWindow:  400000, maxOutput: 128000, rotThreshold: 15, inputCostPerMTok:   0.20, outputCostPerMTok:   1.25, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gpt-5.3-codex'    , label: 'GPT-5.3 Codex'    , provider: 'openai'     , contextWindow:  400000, maxOutput: 128000, rotThreshold: 30, inputCostPerMTok:   1.75, outputCostPerMTok:  14.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'o4-mini'          , label: 'o4-mini'          , provider: 'openai'     , contextWindow:  200000, maxOutput: 100000, rotThreshold: 18, inputCostPerMTok:   4.00, outputCostPerMTok:  16.00, priceSource: 'verified', verifiedAt: '2026-05-31' },

  // Google
  { id: 'gemini-3.5-flash'     , label: 'Gemini 3.5 Flash'     , provider: 'google', contextWindow: 1048576, maxOutput: 65536, rotThreshold: 28, inputCostPerMTok:  1.50, outputCostPerMTok:   9.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gemini-3.1-pro'       , label: 'Gemini 3.1 Pro'       , provider: 'google', contextWindow: 1048576, maxOutput: 65536, rotThreshold: 35, inputCostPerMTok:  2.00, outputCostPerMTok:  12.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', provider: 'google', contextWindow: 1048576, maxOutput: 65536, rotThreshold: 18, inputCostPerMTok:  0.25, outputCostPerMTok:   1.50, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gemini-2.5-pro'       , label: 'Gemini 2.5 Pro'       , provider: 'google', contextWindow: 1048576, maxOutput: 65536, rotThreshold: 30, inputCostPerMTok:  1.25, outputCostPerMTok:  10.00, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gemini-2.5-flash'     , label: 'Gemini 2.5 Flash'     , provider: 'google', contextWindow: 1048576, maxOutput: 65536, rotThreshold: 22, inputCostPerMTok:  0.30, outputCostPerMTok:   2.50, priceSource: 'verified', verifiedAt: '2026-05-31' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', provider: 'google', contextWindow: 1048576, maxOutput: 65536, rotThreshold: 12, inputCostPerMTok:  0.10, outputCostPerMTok:   0.40, priceSource: 'verified', verifiedAt: '2026-05-31' },
];

export const DEFAULT_MODEL_ID = 'claude-opus-4.8';

/**
 * Find a model by partial ID or label match.
 * Priority: exact id → exact label → startsWith → contains.
 */
export function findModel(
  query: string,
  catalog: ModelProfile[] = MODEL_PROFILES,
): ModelProfile | undefined {
  const q = query.toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (!q) return undefined;

  const exact = catalog.find(m =>
    m.id.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (exact) return exact;

  const labelExact = catalog.find(m =>
    m.label.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (labelExact) return labelExact;

  const startsWith = catalog.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.startsWith(q) || mlabel.startsWith(q);
  });
  if (startsWith) return startsWith;

  return catalog.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.includes(q) || mlabel.includes(q) || q.includes(mid);
  });
}

/**
 * Get a model profile by exact ID, falling back to default.
 */
export function getModel(
  id: string,
  catalog: ModelProfile[] = MODEL_PROFILES,
): ModelProfile {
  return catalog.find(m => m.id === id)
    || catalog.find(m => m.id === DEFAULT_MODEL_ID)
    || MODEL_PROFILES.find(m => m.id === DEFAULT_MODEL_ID)!;
}
