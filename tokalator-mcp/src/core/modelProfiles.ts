/**
 * Claude model profiles for Tokalator MCP, generated from the extension catalog (npm run sync).
 */

import { CLAUDE_CATALOG, DEFAULT_MODEL_ID } from './catalog.generated.js';

export interface ModelProfile {
  id: string;
  label: string;
  provider: 'anthropic';
  contextWindow: number;
  maxOutput: number;
  rotThreshold: number;
}

export const MODEL_PROFILES: ModelProfile[] = CLAUDE_CATALOG.map(m => ({
  id: m.id,
  label: m.label,
  provider: 'anthropic',
  contextWindow: m.contextWindow,
  maxOutput: m.maxOutput,
  rotThreshold: m.rotThreshold,
}));

export { DEFAULT_MODEL_ID };

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
