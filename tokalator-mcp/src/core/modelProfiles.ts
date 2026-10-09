/**
 * Claude model profiles for Tokalator MCP.
 * Scoped to Anthropic models only.
 */

export interface ModelProfile {
  id: string;
  label: string;
  provider: 'anthropic';
  contextWindow: number;
  maxOutput: number;
  rotThreshold: number;
}

export const MODEL_PROFILES: ModelProfile[] = [
  { id: 'claude-fable-5-1',  label: 'Claude Fable 5.1',  provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 52 },
  { id: 'claude-fable-5',    label: 'Claude Fable 5',    provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 50 },
  { id: 'claude-opus-5',     label: 'Claude Opus 5',     provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 48 },
  { id: 'claude-opus-4.8',   label: 'Claude Opus 4.8',   provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 45 },
  { id: 'claude-opus-4.7',   label: 'Claude Opus 4.7',   provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 43 },
  { id: 'claude-opus-4.6',   label: 'Claude Opus 4.6',   provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 42 },
  { id: 'claude-sonnet-5',   label: 'Claude Sonnet 5',   provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 35 },
  { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'anthropic', contextWindow: 1_000_000, maxOutput: 128_000, rotThreshold: 30 },
  { id: 'claude-haiku-4.5',  label: 'Claude Haiku 4.5',  provider: 'anthropic', contextWindow:   200_000, maxOutput:  64_000, rotThreshold: 25 },
];

export const DEFAULT_MODEL_ID = 'claude-opus-5';

/**
 * Find a model by partial ID or label match.
 * Priority: exact id -> exact label -> startsWith -> contains.
 */
export function findModel(query: string): ModelProfile | undefined {
  const q = query.toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (!q) return undefined;

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]/g, '');

  return (
    MODEL_PROFILES.find(m => norm(m.id) === q) ||
    MODEL_PROFILES.find(m => norm(m.label) === q) ||
    MODEL_PROFILES.find(m => norm(m.id).startsWith(q) || norm(m.label).startsWith(q)) ||
    MODEL_PROFILES.find(m => norm(m.id).includes(q) || norm(m.label).includes(q))
  );
}

/** Get model by exact ID, falling back to default. */
export function getModel(id: string): ModelProfile {
  return (
    MODEL_PROFILES.find(m => m.id === id) ||
    MODEL_PROFILES.find(m => m.id === DEFAULT_MODEL_ID)!
  );
}
