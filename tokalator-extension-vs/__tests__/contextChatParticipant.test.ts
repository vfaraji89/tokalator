/**
 * Tests for ContextChatParticipant: registration and the help listing.
 */

import * as vscode from 'vscode';
import { ContextChatParticipant } from '../src/chat/contextChatParticipant';
import { ContextMonitor } from '../src/core/contextMonitor';

function createMockMonitor() {
  const monitor: any = {
    getActiveModel: jest.fn(() => ({ id: 'claude-opus-4.8', provider: 'anthropic' })),
    getTokenizer: jest.fn(() => ({ countTokens: jest.fn(() => 1000) })),
    refresh: jest.fn(async () => undefined),
    getLatestSnapshot: jest.fn(() => null),
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

describe('ContextChatParticipant', () => {
  let participant: ContextChatParticipant;

  beforeEach(() => {
    jest.clearAllMocks();
    participant = new ContextChatParticipant(createMockMonitor() as any);
  });

  test('registers a chat participant on construction', () => {
    expect(vscode.chat.createChatParticipant).toHaveBeenCalledWith('tokalator.tokens', expect.any(Function));
  });

  test('help lists the open-source commands and nothing that was removed', async () => {
    const { stream, md } = createMockStream();
    await (participant as any).handleDefault({ prompt: '' }, stream);
    const out = md();
    for (const cmd of ['/count', '/breakdown', '/optimize', '/secure', '/settings-gen', '/pricewatch']) {
      expect(out).toContain(cmd);
    }
    for (const gone of ['/team', '/skills', '/audit', '/credits', '/terminology-gen', 'Enterprise', '(Pro)']) {
      expect(out).not.toContain(gone);
    }
  });
});
