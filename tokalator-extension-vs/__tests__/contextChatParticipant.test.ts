/**
 * Tests for ContextChatParticipant — /terminology-gen command
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

  test('guides the user when no terminology sources are found', async () => {
    (vscode.workspace.findFiles as jest.Mock).mockResolvedValue([]);
    const { stream, md } = createMockStream();
    await (participant as any).handleTerminologyGen(stream);
    const out = md();
    expect(out).toContain('No terminology sources found');
    expect(out).toContain('dictionary.json');
  });

  test('measures the discovered sources with the real tokenizer', async () => {
    (vscode.workspace.findFiles as jest.Mock).mockImplementation(async (pattern: any) => {
      const p = pattern?.pattern ?? '';
      if (p.includes('dictionary.json')) return [vscode.Uri.file('/workspace/content/dictionary.json')];
      if (p.includes('terminologies.md')) return [vscode.Uri.file('/workspace/terminologies.md')];
      return [];
    });
    (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue({ getText: () => 'x'.repeat(4000) });

    const { stream, md } = createMockStream();
    await (participant as any).handleTerminologyGen(stream);

    const out = md();
    expect(out).toContain('dictionary.json');
    expect(out).toContain('terminologies.md');
    expect(out).toContain('Compression Potential');
    // tokenizer mocked to 1000 tokens per source × 2 → 2.0K measured
    expect(out).toContain('2.0K');
    expect(monitor.getTokenizer).toHaveBeenCalled();
  });
});
