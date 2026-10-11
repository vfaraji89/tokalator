import * as vscode from 'vscode';
import { AGENT_LABELS, type AgentId } from './types';

function attachCommand(agent: AgentId): { id: string; withUri: boolean } | null {
  switch (agent) {
    case 'claude-code':
      return vscode.workspace.getConfiguration('claudeCode').get<boolean>('useTerminal')
        ? { id: 'claude-code.insertAtMentioned', withUri: false }
        : { id: 'claude-vscode.insertAtMention', withUri: false };
    case 'copilot-chat': return { id: 'workbench.action.chat.attachFile', withUri: true };
    case 'codex': return { id: 'chatgpt.addFileToThread', withUri: true };
    default: return null;
  }
}

/** Adds a file to the agent's own chat input through the command that agent's extension provides. Returns the agent label, or null when it has none. */
export async function attachToAgent(agent: AgentId | null | undefined, uri: vscode.Uri): Promise<string | null> {
  const cmd = agent ? attachCommand(agent) : null;
  if (!agent || !cmd) return null;
  if (!(await vscode.commands.getCommands(true)).includes(cmd.id)) return null;
  if (!cmd.withUri) {
    const editor = await vscode.window.showTextDocument(uri, { preview: false });
    editor.selection = new vscode.Selection(editor.selection.active, editor.selection.active);
  }
  await vscode.commands.executeCommand(cmd.id, ...(cmd.withUri ? [uri] : []));
  return AGENT_LABELS[agent];
}
