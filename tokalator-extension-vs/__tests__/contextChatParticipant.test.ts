/**
 * Tests for ContextChatParticipant — /terminology-gen command (v3.1.7)
 * Covers: no-workspace guard, no-sources guidance, and compression report.
 */

import * as vscode from 'vscode';
import { ContextChatParticipant } from '../src/chat/contextChatParticipant';
import { ContextMonitor } from '../src/core/contextMonitor';

function createMockMonitor() {
  const monitor: any = {
    getActiveModel: jest.fn(() => ({ id: 'claude-opus-4.8', provider: 'anthropic' })),
    getTokenizer: jest.fn(() => ({ countTokens: jest.fn(() => 1000) })),
  };
  return monitor as jest.Mocked<ContextMonitor>;
}

function createMockStream() {
  let md = '';
  return {
    md: () => md,
    stream: {
      progress: jest.fn(),
      markdown: jest.fn((s: string) => { md += s; }),
    } as any,
  };
}

describe('ContextChatParticipant /terminology-gen', () => {
  let monitor: jest.Mocked<ContextMonitor>;
  let participant: ContextChatParticipant;
  const origFolders = (vscode.workspace as any).workspaceFolders;

  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.workspace as any).workspaceFolders = [{ uri: vscode.Uri.file('/workspace'), name: 'workspace', index: 0 }];
    (vscode.workspace.findFiles as jest.Mock).mockReset().mockResolvedValue([]);
    monitor = createMockMonitor();
    participant = new ContextChatParticipant(monitor as any);
  });

  afterEach(() => {
    (vscode.workspace as any).workspaceFolders = origFolders;
  });

  test('registers a chat participant on construction', () => {
    expect(vscode.chat.createChatParticipant).toHaveBeenCalledWith('tokalator.tokens', expect.any(Function));
  });

  test('reports when no workspace is open', async () => {
    (vscode.workspace as any).workspaceFolders = undefined;
    const { stream, md } = createMockStream();
    await (participant as any).handleTerminologyGen(stream);
    expect(md()).toContain('No workspace open');
  });

  test('guides the user when no Markdown sources are found', async () => {
    (vscode.workspace.findFiles as jest.Mock).mockResolvedValue([]);
    const { stream, md } = createMockStream();
    await (participant as any).handleTerminologyGen(stream);
    expect(md()).toContain('No Markdown files found');
  });

  test('derives sources from the workspace .md files (not a template)', async () => {
    (vscode.workspace.findFiles as jest.Mock).mockImplementation(async (pattern: any) => {
      const p = pattern?.pattern ?? '';
      if (p.includes('*.md')) return [vscode.Uri.file('/workspace/README.md'), vscode.Uri.file('/workspace/docs/terms.md')];
      return [];
    });
    (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue({ getText: () => 'x'.repeat(4000) });

    const { stream, md } = createMockStream();
    await (participant as any).handleTerminologyGen(stream);

    const out = md();
    expect(out).toContain('Sources (2 Markdown files)');
    expect(out).toContain('README.md');
    expect(out).toContain('Compression Potential');
    expect(out).toContain('measured');
    expect(out).toContain('not a template');
    // tokenizer mocked to 1000 tokens per source × 2 → 2.0K measured
    expect(out).toContain('2.0K');
    expect(out).not.toContain('89% compression');
    expect(monitor.getTokenizer).toHaveBeenCalled();
  });
});
