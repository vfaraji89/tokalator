import * as vscode from 'vscode';
import { attachToAgent } from '../src/core/agents/agentAttach';

const uri = vscode.Uri.file('/workspace/src/budget.ts');
const commands = vscode.commands as unknown as { getCommands: jest.Mock; executeCommand: jest.Mock };
const window = vscode.window as unknown as { showTextDocument: jest.Mock };

describe('attachToAgent', () => {
  beforeEach(() => {
    commands.executeCommand.mockClear();
    commands.getCommands.mockResolvedValue(['claude-vscode.insertAtMention', 'workbench.action.chat.attachFile', 'chatgpt.addFileToThread']);
  });

  test('Claude Code gets an @-mention of the whole file', async () => {
    const editor = { selection: { anchor: { line: 3 }, active: { line: 9 } } };
    window.showTextDocument.mockResolvedValueOnce(editor);
    expect(await attachToAgent('claude-code', uri)).toBe('Claude Code');
    expect(editor.selection.anchor).toBe(editor.selection.active);
    expect(commands.executeCommand).toHaveBeenCalledWith('claude-vscode.insertAtMention');
  });

  test('Copilot Chat and Codex receive the file URI', async () => {
    expect(await attachToAgent('copilot-chat', uri)).toBe('Copilot Chat');
    expect(commands.executeCommand).toHaveBeenCalledWith('workbench.action.chat.attachFile', uri);
    expect(await attachToAgent('codex', uri)).toBe('Codex');
    expect(commands.executeCommand).toHaveBeenCalledWith('chatgpt.addFileToThread', uri);
  });

  test('does nothing when the agent has no command or is not installed', async () => {
    expect(await attachToAgent('copilot-cli', uri)).toBeNull();
    commands.getCommands.mockResolvedValue([]);
    expect(await attachToAgent('claude-code', uri)).toBeNull();
    expect(commands.executeCommand).not.toHaveBeenCalled();
  });
});
