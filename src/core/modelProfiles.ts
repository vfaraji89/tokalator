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
export const BUNDLED_UPDATED_AT = '2026-04-11T00:00:00Z';

export const MODEL_PROFILES: ModelProfile[] = [
  // Anthropic
  { id: 'claude-opus-4.6'  , label: 'Claude Opus 4.6'  , provider: 'anthropic'  , contextWindow:  200000, maxOutput:  32000, rotThreshold: 40, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'claude-opus-4.5'  , label: 'Claude Opus 4.5'  , provider: 'anthropic'  , contextWindow:  200000, maxOutput:  32000, rotThreshold: 35, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'anthropic'  , contextWindow:  200000, maxOutput:  16000, rotThreshold: 25, inputCostPerMTok:   3.00, outputCostPerMTok:  15.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5', provider: 'anthropic'  , contextWindow:  200000, maxOutput:  16000, rotThreshold: 20, inputCostPerMTok:   3.00, outputCostPerMTok:  15.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'claude-sonnet-4'  , label: 'Claude Sonnet 4'  , provider: 'anthropic'  , contextWindow:  200000, maxOutput:  16000, rotThreshold: 18, inputCostPerMTok:   3.00, outputCostPerMTok:  15.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'claude-haiku-4.5' , label: 'Claude Haiku 4.5' , provider: 'anthropic'  , contextWindow:  200000, maxOutput:  16000, rotThreshold: 15, inputCostPerMTok:   1.00, outputCostPerMTok:   5.00, priceSource: 'verified', verifiedAt: '2026-04-11' },

  // OpenAI
  { id: 'gpt-5.4'          , label: 'GPT-5.4'          , provider: 'openai'     , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 35, inputCostPerMTok:   2.50, outputCostPerMTok:  10.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'gpt-5.4-mini'     , label: 'GPT-5.4 Mini'     , provider: 'openai'     , contextWindow:  400000, maxOutput: 128000, rotThreshold: 22, inputCostPerMTok:  0.400, outputCostPerMTok:   1.60, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'gpt-5.2-codex'    , label: 'GPT-5.2 Codex'    , provider: 'openai'     , contextWindow:  400000, maxOutput: 128000, rotThreshold: 28, inputCostPerMTok:   2.50, outputCostPerMTok:  10.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'gpt-5.1-codex'    , label: 'GPT-5.1 Codex'    , provider: 'openai'     , contextWindow:  400000, maxOutput: 128000, rotThreshold: 25, inputCostPerMTok:   2.50, outputCostPerMTok:  10.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'gpt-4.1'          , label: 'GPT-4.1'          , provider: 'openai'     , contextWindow: 1047576, maxOutput:  32768, rotThreshold: 20, inputCostPerMTok:   2.00, outputCostPerMTok:   8.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'o3'               , label: 'o3'               , provider: 'openai'     , contextWindow:  200000, maxOutput: 100000, rotThreshold: 20, inputCostPerMTok:   2.00, outputCostPerMTok:   8.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'o4-mini'          , label: 'o4-mini'          , provider: 'openai'     , contextWindow:  200000, maxOutput: 100000, rotThreshold: 15, inputCostPerMTok:   1.10, outputCostPerMTok:   4.40, priceSource: 'verified', verifiedAt: '2026-04-11' },

  // Google
  { id: 'gemini-3.1-pro'   , label: 'Gemini 3.1 Pro'   , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 32, inputCostPerMTok:   1.25, outputCostPerMTok:   5.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'gemini-3-pro'     , label: 'Gemini 3 Pro'     , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 30, inputCostPerMTok:   1.25, outputCostPerMTok:   5.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'gemini-3-flash'   , label: 'Gemini 3 Flash'   , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 25, inputCostPerMTok:  0.075, outputCostPerMTok:  0.300, priceSource: 'verified', verifiedAt: '2026-04-11' },
  { id: 'gemini-2.5-pro'   , label: 'Gemini 2.5 Pro'   , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 22, inputCostPerMTok:   1.25, outputCostPerMTok:   5.00, priceSource: 'verified', verifiedAt: '2026-04-11' },
];

export const DEFAULT_MODEL_ID = 'claude-opus-4.6';

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
