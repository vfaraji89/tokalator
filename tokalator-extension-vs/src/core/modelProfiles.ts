/**
 * Known AI model profiles with context window sizes and metadata.
 * Used to auto-detect the active model and set the correct budget.
 */

export interface ModelProfile {
  id: string;
  label: string;
  provider: 'anthropic' | 'openai' | 'google' | 'other';
  contextWindow: number;   // tokens
  maxOutput: number;        // max output tokens
  rotThreshold: number;     // chat turns before context rot risk
}

/**
 * Built-in model profiles.
 * Context windows and rot thresholds based on published benchmarks.
 */
export const MODEL_PROFILES: ModelProfile[] = [
  // Anthropic
  { id: 'claude-opus-4.6',     label: 'Claude Opus 4.6',     provider: 'anthropic', contextWindow: 1000000, maxOutput: 32000, rotThreshold: 40 },
  { id: 'claude-sonnet-4.5',   label: 'Claude Sonnet 4.5',   provider: 'anthropic', contextWindow: 200000,  maxOutput: 16000, rotThreshold: 20 },
  { id: 'claude-sonnet-4',     label: 'Claude Sonnet 4',     provider: 'anthropic', contextWindow: 200000,  maxOutput: 16000, rotThreshold: 20 },
  { id: 'claude-haiku-4.5',    label: 'Claude Haiku 4.5',    provider: 'anthropic', contextWindow: 200000,  maxOutput: 64000,  rotThreshold: 15 },

  // OpenAI
  { id: 'gpt-5.2',             label: 'GPT-5.2',             provider: 'openai',    contextWindow: 256000,  maxOutput: 32000, rotThreshold: 30 },
  { id: 'gpt-5.2-codex',       label: 'GPT-5.2 Codex',       provider: 'openai',    contextWindow: 256000,  maxOutput: 32000, rotThreshold: 30 },
  { id: 'gpt-5.1',             label: 'GPT-5.1',             provider: 'openai',    contextWindow: 256000,  maxOutput: 32000, rotThreshold: 25 },
  { id: 'gpt-5-mini',          label: 'GPT-5 Mini',          provider: 'openai',    contextWindow: 256000,  maxOutput: 32000, rotThreshold: 20 },
  { id: 'gpt-4.1',             label: 'GPT-4.1',             provider: 'openai',    contextWindow: 1047576, maxOutput: 32768, rotThreshold: 20 },
  { id: 'o3',                  label: 'o3',                  provider: 'openai',    contextWindow: 200000,  maxOutput: 100000, rotThreshold: 20 },
  { id: 'o4-mini',             label: 'o4-mini',             provider: 'openai',    contextWindow: 200000,  maxOutput: 100000, rotThreshold: 15 },

  // Google
  { id: 'gemini-3-pro',        label: 'Gemini 3 Pro',        provider: 'google',    contextWindow: 1048576, maxOutput: 65536, rotThreshold: 30 },
  { id: 'gemini-3-flash',      label: 'Gemini 3 Flash',      provider: 'google',    contextWindow: 1048576, maxOutput: 65536, rotThreshold: 25 },
  { id: 'gemini-2.5-pro',      label: 'Gemini 2.5 Pro',      provider: 'google',    contextWindow: 1048576, maxOutput: 65536, rotThreshold: 20 },
];

/** Default model when nothing is detected */
export const DEFAULT_MODEL_ID = 'claude-opus-4.6';

/**
 * Try to find a matching model profile by partial ID or label match.
 * Priority: exact id → exact label → startsWith → contains.
 */
export function findModel(query: string): ModelProfile | undefined {
  const q = query.toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (!q) return undefined;

  // 1. Exact match on normalized id
  const exact = MODEL_PROFILES.find(m =>
    m.id.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (exact) return exact;

  // 2. Exact match on normalized label
  const labelExact = MODEL_PROFILES.find(m =>
    m.label.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (labelExact) return labelExact;

  // 3. Starts-with on id or label
  const startsWith = MODEL_PROFILES.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.startsWith(q) || mlabel.startsWith(q);
  });
  if (startsWith) return startsWith;

  // 4. Contains match (fallback)
  return MODEL_PROFILES.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.includes(q) || mlabel.includes(q) || q.includes(mid);
  });
}

/**
 * Get a model profile by exact ID, falling back to default.
 */
export function getModel(id: string): ModelProfile {
  return MODEL_PROFILES.find(m => m.id === id)
    || MODEL_PROFILES.find(m => m.id === DEFAULT_MODEL_ID)!;
}
