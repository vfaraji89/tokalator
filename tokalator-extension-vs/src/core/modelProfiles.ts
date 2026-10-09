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
  featured?: boolean;
}

export const BUNDLED_SCHEMA_VERSION = 2;
export const BUNDLED_UPDATED_AT = '2026-09-02T00:00:00Z';

export const MODEL_PROFILES: ModelProfile[] = [
  // Anthropic
  { id: 'claude-fable-5-1' , label: 'Claude Fable 5.1' , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 52, inputCostPerMTok:  10.00, outputCostPerMTok:  50.00, cachedInputCostPerMTok: 0.250, priceSource: 'verified', verifiedAt: '2026-09-02', featured: true },
  { id: 'claude-fable-5'   , label: 'Claude Fable 5'   , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 50, inputCostPerMTok:  10.00, outputCostPerMTok:  50.00, cachedInputCostPerMTok: 1.00, priceSource: 'verified', verifiedAt: '2026-09-02', featured: true },
  { id: 'claude-opus-5'    , label: 'Claude Opus 5'    , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 48, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, cachedInputCostPerMTok: 0.500, priceSource: 'verified', verifiedAt: '2026-09-02', featured: true },
  { id: 'claude-opus-4.8'  , label: 'Claude Opus 4.8'  , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 45, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, cachedInputCostPerMTok: 0.500, priceSource: 'verified', verifiedAt: '2026-09-02', featured: true },
  { id: 'claude-opus-4.7'  , label: 'Claude Opus 4.7'  , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 43, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, cachedInputCostPerMTok: 0.500, priceSource: 'verified', verifiedAt: '2026-09-02' },
  { id: 'claude-opus-4.6'  , label: 'Claude Opus 4.6'  , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 42, inputCostPerMTok:   5.00, outputCostPerMTok:  25.00, cachedInputCostPerMTok: 0.500, priceSource: 'verified', verifiedAt: '2026-09-02' },
  { id: 'claude-sonnet-5'  , label: 'Claude Sonnet 5'  , provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 35, inputCostPerMTok:   2.00, outputCostPerMTok:  10.00, cachedInputCostPerMTok: 0.200, priceSource: 'verified', verifiedAt: '2026-09-02', featured: true },
  { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'anthropic'  , contextWindow: 1000000, maxOutput: 128000, rotThreshold: 30, inputCostPerMTok:   3.00, outputCostPerMTok:  15.00, cachedInputCostPerMTok: 0.300, priceSource: 'verified', verifiedAt: '2026-09-02' },
  { id: 'claude-haiku-4.5' , label: 'Claude Haiku 4.5' , provider: 'anthropic'  , contextWindow:  200000, maxOutput:  64000, rotThreshold: 25, inputCostPerMTok:   1.00, outputCostPerMTok:   5.00, cachedInputCostPerMTok: 0.100, priceSource: 'verified', verifiedAt: '2026-09-02', featured: true },

  // OpenAI
  { id: 'gpt-5.5'          , label: 'GPT-5.5'          , provider: 'openai'     , contextWindow:  272000, maxOutput: 128000, rotThreshold: 40, inputCostPerMTok:   5.00, outputCostPerMTok:  30.00, cachedInputCostPerMTok: 0.500, priceSource: 'verified', verifiedAt: '2026-08-17', featured: true },
  { id: 'gpt-5.4'          , label: 'GPT-5.4'          , provider: 'openai'     , contextWindow:  272000, maxOutput: 128000, rotThreshold: 35, inputCostPerMTok:   2.50, outputCostPerMTok:  15.00, cachedInputCostPerMTok: 0.250, priceSource: 'verified', verifiedAt: '2026-08-17', featured: true },
  { id: 'gpt-5.4-mini'     , label: 'GPT-5.4 mini'     , provider: 'openai'     , contextWindow:  128000, maxOutput:  64000, rotThreshold: 30, inputCostPerMTok:  0.750, outputCostPerMTok:   4.50, cachedInputCostPerMTok: 0.075, priceSource: 'verified', verifiedAt: '2026-08-17' },
  { id: 'gpt-5.4-nano'     , label: 'GPT-5.4 nano'     , provider: 'openai'     , contextWindow:  128000, maxOutput:  16000, rotThreshold: 25, inputCostPerMTok:  0.200, outputCostPerMTok:   1.25, cachedInputCostPerMTok: 0.020, priceSource: 'verified', verifiedAt: '2026-08-17' },
  { id: 'gpt-5.6-luna'     , label: 'GPT-5.6 Luna'     , provider: 'openai'     , contextWindow:  272000, maxOutput: 128000, rotThreshold: 35, inputCostPerMTok:   3.00, outputCostPerMTok:  18.00, cachedInputCostPerMTok: 0.300, priceSource: 'verified', verifiedAt: '2026-08-17' },
  { id: 'gpt-5.6-sol'      , label: 'GPT-5.6 Sol'      , provider: 'openai'     , contextWindow:  272000, maxOutput: 128000, rotThreshold: 40, inputCostPerMTok:   5.00, outputCostPerMTok:  30.00, cachedInputCostPerMTok: 0.500, priceSource: 'verified', verifiedAt: '2026-08-17', featured: true },
  { id: 'gpt-5.6-terra'    , label: 'GPT-5.6 Terra'    , provider: 'openai'     , contextWindow:  272000, maxOutput: 128000, rotThreshold: 45, inputCostPerMTok:   8.00, outputCostPerMTok:  40.00, cachedInputCostPerMTok: 0.800, priceSource: 'verified', verifiedAt: '2026-08-17', featured: true },
  { id: 'gpt-5.3-codex'    , label: 'GPT-5.3-Codex'    , provider: 'openai'     , contextWindow:  256000, maxOutput:  32000, rotThreshold: 35, inputCostPerMTok:   1.75, outputCostPerMTok:  14.00, cachedInputCostPerMTok: 0.175, priceSource: 'verified', verifiedAt: '2026-08-17' },

  // Google
  { id: 'gemini-3.7-flash' , label: 'Gemini 3.7 Flash' , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 32, inputCostPerMTok:   2.00, outputCostPerMTok:  12.00, cachedInputCostPerMTok: 0.200, priceSource: 'verified', verifiedAt: '2026-08-17', featured: true },
  { id: 'gemini-3.6-flash' , label: 'Gemini 3.6 Flash' , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 30, inputCostPerMTok:   1.75, outputCostPerMTok:  10.50, cachedInputCostPerMTok: 0.175, priceSource: 'verified', verifiedAt: '2026-08-17' },
  { id: 'gemini-3.5-flash' , label: 'Gemini 3.5 Flash' , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 30, inputCostPerMTok:   1.50, outputCostPerMTok:   9.00, cachedInputCostPerMTok: 0.150, priceSource: 'verified', verifiedAt: '2026-08-17' },
  { id: 'gemini-3.1-pro'   , label: 'Gemini 3.1 Pro'   , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 32, inputCostPerMTok:   2.00, outputCostPerMTok:  12.00, cachedInputCostPerMTok: 0.200, priceSource: 'verified', verifiedAt: '2026-08-17', featured: true },
  { id: 'gemini-3-flash'   , label: 'Gemini 3 Flash'   , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 28, inputCostPerMTok:  0.500, outputCostPerMTok:   3.00, cachedInputCostPerMTok: 0.050, priceSource: 'verified', verifiedAt: '2026-08-17' },
  { id: 'gemini-2.5-pro'   , label: 'Gemini 2.5 Pro'   , provider: 'google'     , contextWindow: 1048576, maxOutput:  65536, rotThreshold: 30, inputCostPerMTok:   1.25, outputCostPerMTok:  10.00, cachedInputCostPerMTok: 0.125, priceSource: 'verified', verifiedAt: '2026-08-17' },
];

export const DEFAULT_MODEL_ID = 'claude-opus-5';

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

/**
 * Models flagged for prominent display in the dashboard picker.
 */
export function getFeaturedModels(
  catalog: ModelProfile[] = MODEL_PROFILES,
): ModelProfile[] {
  const featured = catalog.filter(m => m.featured);
  return featured.length ? featured : catalog;
}
