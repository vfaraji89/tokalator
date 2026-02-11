/**
 * Tests for ContextDashboardProvider
 * Covers: pin/unpin/close message handling, event delegation HTML, fmtTokens, URI round-trip
 */

import * as vscode from 'vscode';
import { ContextDashboardProvider } from '../src/webview/contextDashboardProvider';
import { ContextMonitor } from '../src/core/contextMonitor';

// ── Helpers ──────────────────────────────────────────

function createMockMonitor() {
  const monitor: any = {
    pinFile: jest.fn(),
    unpinFile: jest.fn(),
    refresh: jest.fn(),
    optimizeTabs: jest.fn(async () => []),
    resetChatTurns: jest.fn(),
    setModel: jest.fn(async () => {}),
    getLatestSnapshot: jest.fn(() => null),
    getModels: jest.fn(() => []),
    getLastSession: jest.fn(() => null),
    onDidUpdateSnapshot: jest.fn(() => ({ dispose: () => {} })),
  };
  return monitor as jest.Mocked<ContextMonitor>;
}

function createMockWebviewView() {
  let messageHandler: ((msg: any) => void) | null = null;
  const webview = {
    options: {} as any,
    html: '',
    onDidReceiveMessage: jest.fn((handler: any) => {
      messageHandler = handler;
      return { dispose: () => {} };
    }),
    postMessage: jest.fn(async () => true),
    cspSource: 'test-csp',
    asWebviewUri: jest.fn((uri: vscode.Uri) => uri),
  };

  const view: any = {
    webview,
    visible: true,
    onDidChangeVisibility: jest.fn(() => ({ dispose: () => {} })),
    onDidDispose: jest.fn(() => ({ dispose: () => {} })),
  };

  return {
    view,
    webview,
    simulateMessage: (msg: any) => messageHandler?.(msg),
  };
}

// ── Tests ────────────────────────────────────────────

describe('ContextDashboardProvider', () => {
  let monitor: jest.Mocked<ContextMonitor>;
  let provider: ContextDashboardProvider;
  let mockView: ReturnType<typeof createMockWebviewView>;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = createMockMonitor();
    const extensionUri = vscode.Uri.file('/ext');
    provider = new ContextDashboardProvider(extensionUri, monitor as any);
    mockView = createMockWebviewView();
    provider.resolveWebviewView(
      mockView.view as any,
      {} as any,
      {} as any,
    );
  });

  describe('Message handling', () => {
    test('pin command calls monitor.pinFile with correct URI', async () => {
      const uri = 'file:///Users/test/foo.ts';
      await mockView.simulateMessage({ command: 'pin', uri });
      expect(monitor.pinFile).toHaveBeenCalledWith(uri);
    });

    test('unpin command calls monitor.unpinFile with correct URI', async () => {
      const uri = 'file:///Users/test/foo.ts';
      await mockView.simulateMessage({ command: 'unpin', uri });
      expect(monitor.unpinFile).toHaveBeenCalledWith(uri);
    });

    test('closeTab command finds and closes the matching tab', async () => {
      const uri = 'file:///Users/test/bar.ts';
      const tab = { input: new vscode.TabInputText(vscode.Uri.parse(uri)) };
      (vscode.window.tabGroups as any).all = [{ tabs: [tab] }];

      await mockView.simulateMessage({ command: 'closeTab', uri });
      expect(vscode.window.tabGroups.close).toHaveBeenCalledWith(tab);
      expect(monitor.refresh).toHaveBeenCalled();
    });

    test('closeTab does nothing when tab not found', async () => {
      (vscode.window.tabGroups as any).all = [{ tabs: [] }];
      await mockView.simulateMessage({ command: 'closeTab', uri: 'file:///nope.ts' });
      expect(vscode.window.tabGroups.close).not.toHaveBeenCalled();
      expect(monitor.refresh).toHaveBeenCalled();
    });

    test('optimize command calls monitor.optimizeTabs', async () => {
      await mockView.simulateMessage({ command: 'optimize' });
      expect(monitor.optimizeTabs).toHaveBeenCalled();
    });

    test('setModel command awaits monitor.setModel', async () => {
      await mockView.simulateMessage({ command: 'setModel', modelId: 'gpt-5.2' });
      expect(monitor.setModel).toHaveBeenCalledWith('gpt-5.2');
    });

    test('resetTurns command calls monitor.resetChatTurns', async () => {
      await mockView.simulateMessage({ command: 'resetTurns' });
      expect(monitor.resetChatTurns).toHaveBeenCalled();
    });
  });

  describe('HTML output', () => {
    test('contains data-action attributes (not onclick)', () => {
      const html = mockView.webview.html;
      expect(html).not.toContain('onclick=');
      expect(html).not.toContain('ondblclick=');
      expect(html).not.toContain('onchange=');
      expect(html).toContain('data-action="setModel"');
      expect(html).toContain('data-action="openFile"');
    });

    test('contains event delegation listeners', () => {
      const html = mockView.webview.html;
      expect(html).toContain("document.addEventListener('click'");
      expect(html).toContain("document.addEventListener('dblclick'");
      expect(html).toContain("document.addEventListener('change'");
    });

    test('contains CSP with nonce', () => {
      const html = mockView.webview.html;
      expect(html).toContain('Content-Security-Policy');
      expect(html).toMatch(/script-src 'nonce-[A-Za-z0-9]+'/);
      expect(html).toMatch(/<script nonce="[A-Za-z0-9]+">/);
    });

    test('fmtTokens handles M and K formatting', () => {
      const html = mockView.webview.html;
      // The function definition should handle millions
      expect(html).toContain("n >= 1000000");
      expect(html).toContain("+ 'M'");
      expect(html).toContain("+ 'K'");
    });
  });

  describe('URI round-trip', () => {
    test('encodeURIComponent → decodeURIComponent preserves file URIs', () => {
      const uri = 'file:///Users/test/my file.ts';
      const encoded = encodeURIComponent(uri);
      const decoded = decodeURIComponent(encoded);
      expect(decoded).toBe(uri);
    });

    test('URIs with special characters survive round-trip', () => {
      const uri = "file:///Users/test/foo'bar.ts";
      const encoded = encodeURIComponent(uri);
      const decoded = decodeURIComponent(encoded);
      expect(decoded).toBe(uri);
    });

    test('vscode.Uri.parse round-trip is stable', () => {
      const raw = 'file:///Users/test/foo.ts';
      const parsed = vscode.Uri.parse(raw);
      expect(parsed.toString()).toBe(raw);
    });
  });
});
