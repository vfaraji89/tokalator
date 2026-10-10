import type { ClaudeCodeTurn, ClaudeCodeUsageRecord } from '../claudeCodeUsage.pure';

export type AgentId = 'claude-code' | 'copilot-chat' | 'copilot-cli' | 'codex' | 'opencode';

export const AGENT_LABELS: Record<AgentId, string> = {
  'claude-code': 'Claude Code',
  'copilot-chat': 'Copilot Chat',
  'copilot-cli': 'Copilot CLI',
  codex: 'Codex',
  opencode: 'OpenCode',
};

/**
 * One model request, normalized so every agent can be summarized by claudeCodeUsage.pure.
 * - id: unique and stable across re-reads of the same file (used to de-duplicate).
 * - model: a catalog-style id with vendor prefixes removed (for example "claude-opus-4.6", "gpt-5.4").
 * - inputTokens: uncached input only; cached input goes in cacheReadTokens.
 * - outputTokens: includes reasoning or thinking tokens.
 * - entrypoint: the AgentId that produced the record.
 * - estimated: true when the agent did not record token counts and the reader estimated them.
 */
export type AgentUsageRecord = ClaudeCodeUsageRecord & { estimated?: boolean };

/** One user prompt. */
export type AgentTurn = ClaudeCodeTurn;

export interface AgentParseResult {
  records: AgentUsageRecord[];
  turns: AgentTurn[];
}

/**
 * Pure parser contract every reader implements in src/core/agents/<id>.pure.ts:
 *   export function parse<Name>(text: string, file: string): AgentParseResult
 * It must never throw: skip malformed lines or entries.
 */
export type AgentParser = (text: string, file: string) => AgentParseResult;

/** Strips vendor prefixes and date suffixes so ids match models.json through modelKey(). */
export function normalizeModelId(raw: string): string {
  return raw.trim().replace(/^(copilot|github|openai|anthropic|google|models)\//i, '').replace(/^models\//i, '');
}
