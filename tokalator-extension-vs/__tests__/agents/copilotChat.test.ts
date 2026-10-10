import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseCopilotChat } from '../../src/core/agents/copilotChat.pure';
import { copilotChatFiles } from '../../src/core/agents/copilotChat';

const T0 = Date.UTC(2026, 9, 10, 10, 0, 0);
const md = (text: string) => ({ value: text, supportHtml: false, supportThemeIcons: false });
const request = (requestId: string, extra: object = {}) => ({
  requestId,
  timestamp: T0,
  modelId: 'copilot/claude-opus-4.6',
  message: { text: 'synthetic prompt', parts: [] },
  variableData: { variables: [] },
  response: [md('synthetic answer')],
  result: { metadata: {} },
  ...extra,
});
const ops = (...lines: object[]) => lines.map((l) => JSON.stringify(l)).join('\n');
const initial = (requests: object[] = []) => ({ kind: 0, v: { version: 3, sessionId: 'sess-l', requests, pendingRequests: [] } });

describe('parseCopilotChat', () => {
  it('reads the JSON format with token counts and cached share', () => {
    const session = {
      version: 3,
      sessionId: 'sess-j',
      requests: [
        request('r1', {
          promptTokens: 1000,
          completionTokens: 200,
          promptTokenDetails: [
            { category: 'System', label: 'Tool Definitions', percentageOfPrompt: 60 },
            { category: 'Cache', label: 'Cached', percentageOfPrompt: 40 },
          ],
        }),
        request('r2', { timestamp: T0 + 60_000, result: { metadata: { promptTokens: 500, outputTokens: 50 } } }),
      ],
    };
    const { records, turns } = parseCopilotChat(JSON.stringify(session), '/x/chatSessions/sess-j.json');
    expect(turns.map((t) => t.id)).toEqual(['sess-j:r1', 'sess-j:r2']);
    expect(records[0]).toEqual({
      id: 'sess-j:r1', timestamp: new Date(T0).toISOString(), sessionId: 'sess-j', cwd: '', model: 'claude-opus-4.6',
      entrypoint: 'copilot-chat', sidechain: false, inputTokens: 600, outputTokens: 200, cacheReadTokens: 400,
      cacheWrite5mTokens: 0, cacheWrite1hTokens: 0, fast: false,
    });
    expect(records[1]).toMatchObject({ inputTokens: 500, outputTokens: 50, cacheReadTokens: 0 });
    expect(records[1].estimated).toBeUndefined();
  });

  it('replays the JSONL operation log', () => {
    const text = ops(
      initial([request('r0', { promptTokens: 10, completionTokens: 1 })]),
      { kind: 1, k: ['inputState', 'inputText'], v: 'draft' },
      { kind: 2, k: ['requests'], v: [request('r1', { response: [], result: undefined })] },
      { kind: 2, k: ['requests', 1, 'response'], v: [md('partial')] },
      { kind: 2, k: ['requests', 1, 'response'], i: 0, v: [md('final'), md('more')] },
      { kind: 1, k: ['requests', 1, 'result'], v: { metadata: { promptTokens: 3000, outputTokens: 120, toolCallRounds: [] } } },
      { kind: 1, k: ['requests', 1, 'completionTokens'], v: 400 },
      { kind: 2, k: ['requests'], v: [request('r2', { response: [] , result: undefined })] },
      { kind: 2, k: ['pendingRequests'], v: [{ id: 'p' }] },
      { kind: 2, k: ['pendingRequests'], i: 0 },
    );
    const { records, turns } = parseCopilotChat(text, '/x/chatSessions/sess-l.jsonl');
    expect(turns).toHaveLength(3);
    expect(records.map((r) => r.id)).toEqual(['sess-l:r0', 'sess-l:r1']);
    expect(records[1]).toMatchObject({ inputTokens: 3000, outputTokens: 400, sessionId: 'sess-l' });
    expect(records[1].estimated).toBeUndefined();
  });

  it('estimates requests without token counts from prompt, attachments and response text', () => {
    const r = request('r1', {
      message: { text: 'a'.repeat(40), parts: [] },
      variableData: { variables: [{ kind: 'promptText', value: 'b'.repeat(40) }, { kind: 'file', value: { uri: {} } }] },
      response: [md('c'.repeat(80)), { kind: 'thinking', value: 'd'.repeat(20) }, { kind: 'toolInvocationSerialized', toolId: 't' }],
    });
    const { records } = parseCopilotChat(JSON.stringify({ sessionId: 's', requests: [r] }), 's.json');
    expect(records[0]).toMatchObject({ inputTokens: 20, outputTokens: 25, estimated: true });
  });

  it('resolves copilot/auto to the served model', () => {
    const auto = { modelId: 'copilot/auto' };
    const text = ops(initial([
      request('a', { ...auto, result: { metadata: { resolvedModel: 'gpt-5-mini-2025-08-07', promptTokens: 1, outputTokens: 1 } } }),
      request('b', { ...auto, response: [{ kind: 'autoModeResolution', resolved: { id: 'claude-haiku-4.5', name: 'Haiku' } }] }),
      request('c', { ...auto, result: { metadata: { toolCallRounds: [{ id: '1', modelId: 'grok-code-fast-1' }] } } }),
      request('d', { ...auto, result: { metadata: { resolvedModel: 'capi-abc-ptuc-h100-oswe-vscode-prime' } } }),
      request('e', auto),
    ]));
    expect(parseCopilotChat(text, 'x.jsonl').records.map((r) => r.model))
      .toEqual(['gpt-5-mini', 'claude-haiku-4.5', 'grok-code-fast-1', 'oswe-vscode-prime', 'auto']);
  });

  it('ignores malformed lines and never throws', () => {
    const text = ['{not json', ops(initial([request('r1', { promptTokens: 5, completionTokens: 2 })])), '[1,2', '',
      JSON.stringify({ kind: 1, k: ['requests', 9, 'result'], v: {} }), JSON.stringify({ kind: 2, k: 'bad', v: [] }), 'null'].join('\n');
    expect(parseCopilotChat(text, 'x.jsonl').records).toHaveLength(1);
    for (const bad of ['', 'garbage', '{"requests": 5}', '{"requests": [null, 1, "x"]}', 'null']) {
      expect(parseCopilotChat(bad, 'y.json')).toEqual({ records: [], turns: [] });
    }
  });
});

describe('copilotChatFiles', () => {
  it('lists recent chat session files', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-copilot-'));
    const dir = path.join(root, 'chatSessions');
    fs.mkdirSync(dir);
    for (const name of ['a.json', 'b.jsonl', 'c.txt', 'old.json']) fs.writeFileSync(path.join(dir, name), '{}');
    fs.utimesSync(path.join(dir, 'old.json'), new Date(0), new Date(0));
    const files = await copilotChatFiles(root, Date.now() - 60_000);
    expect(files.map((f) => path.basename(f)).sort()).toEqual(['a.json', 'b.jsonl']);
    expect(await copilotChatFiles(undefined, 0)).toEqual([]);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
