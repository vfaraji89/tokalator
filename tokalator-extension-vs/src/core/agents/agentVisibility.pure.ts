import type { AgentId } from './types';

export const AGENT_EXTENSIONS: Partial<Record<AgentId, string>> = {
  'claude-code': 'anthropic.claude-code',
  'copilot-chat': 'github.copilot-chat',
  codex: 'openai.chatgpt',
};

export const AGENT_ORDER: AgentId[] = ['claude-code', 'copilot-chat', 'copilot-cli', 'codex'];

export interface VisibilityInput {
  installed: Partial<Record<AgentId, boolean>>;
  lastActivity: Partial<Record<AgentId, string | null>>;
  uninstalledAt: Partial<Record<AgentId, number>>;
  aiFeaturesDisabled: boolean;
}

/**
 * Agents that get a tab: installed extension agents, plus any agent with recent activity that
 * happened after its extension was removed (for example the Claude Code or Codex CLI).
 */
export function visibleAgents(v: VisibilityInput): AgentId[] {
  return AGENT_ORDER.filter(id => {
    if (id === 'copilot-chat' && v.aiFeaturesDisabled) return false;
    if (AGENT_EXTENSIONS[id] && v.installed[id]) return true;
    const last = v.lastActivity[id];
    if (!last) return false;
    const removed = v.uninstalledAt[id];
    return !removed || Date.parse(last) > removed;
  });
}

/** Agents whose extension was present last time and is gone now. */
export function newlyUninstalled(previous: string[], installed: Partial<Record<AgentId, boolean>>): AgentId[] {
  return (Object.keys(AGENT_EXTENSIONS) as AgentId[]).filter(id => previous.includes(id) && !installed[id]);
}
