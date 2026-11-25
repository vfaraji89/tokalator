import type { AgentId } from './types';

const COMMANDS: Record<string, AgentId> = { claude: 'claude-code', codex: 'codex', copilot: 'copilot-cli' };

/** The agent a terminal command or terminal name starts, for example "npx codex --full-auto" or "claude". */
export function agentFromCommand(command: string): AgentId | null {
  const words = command.trim().toLowerCase().split(/\s+/).filter(w => !/^(npx|bunx|pnpm|dlx|exec|sudo)$/.test(w) && !w.startsWith('-'));
  const first = (words[0] ?? '').split(/[\\/]/).pop() ?? '';
  return COMMANDS[first.replace(/\.(exe|cmd|js)$/, '')] ?? null;
}

/** The agent shown in an editor tab, from the webview panel type VS Code reports. */
export function agentFromWebview(viewType: string | undefined): AgentId | null {
  return viewType && /claudeVSCodePanel/i.test(viewType) ? 'claude-code' : null;
}
