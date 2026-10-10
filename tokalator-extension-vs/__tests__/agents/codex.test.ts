import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseCodex } from '../../src/core/agents/codex.pure';
import { codexFiles } from '../../src/core/agents/codex';

const line = (type: string, payload: object, timestamp = '2026-10-10T10:00:00Z') =>
  JSON.stringify({ timestamp, type, payload });
const usage = (input: number, cached: number, output: number, reasoning = 0, cacheWrite = 0) => ({
  input_tokens: input, cached_input_tokens: cached, cache_write_input_tokens: cacheWrite,
  output_tokens: output, reasoning_output_tokens: reasoning, total_tokens: input + output,
});
const sum = (a: ReturnType<typeof usage>, b: ReturnType<typeof usage>) =>
  Object.fromEntries(Object.keys(a).map((k) => [k, (a as any)[k] + (b as any)[k]]));
const tokenCount = (last: ReturnType<typeof usage>, total: object, window = 272000) =>
  line('event_msg', { type: 'token_count', info: { last_token_usage: last, total_token_usage: total, model_context_window: window } });

const meta = line('session_meta', { id: 'sess-1', cwd: '/w/app', cli_version: '0.1.0', model_provider: 'openai', originator: 'codex_cli' });
const ctx = (model: string) => line('turn_context', { model, effort: 'high', cwd: '/w/app' });
const userMsg = line('event_msg', { type: 'user_message', message: 'synthetic' });

describe('parseCodex', () => {
  const u1 = usage(1000, 0, 200);
  const u2 = usage(1500, 1000, 300, 120);

  it('parses a normal session', () => {
    const text = [
      meta, ctx('openai/gpt-5.4'), line('event_msg', { type: 'task_started', turn_id: 't1', model_context_window: 258400 }),
      userMsg, tokenCount(u1, u1), userMsg, tokenCount(u2, sum(u1, u2)),
      line('event_msg', { type: 'task_complete', turn_id: 't1' }),
    ].join('\n');
    const r = parseCodex(text, '/x/rollout-a.jsonl');
    expect(r.records).toHaveLength(2);
    expect(r.turns).toHaveLength(2);
    expect(r.contextWindow).toBe(272000);
    expect(r.records[0]).toMatchObject({
      sessionId: 'sess-1', cwd: '/w/app', model: 'gpt-5.4', entrypoint: 'codex', sidechain: false,
      inputTokens: 1000, cacheReadTokens: 0, outputTokens: 200,
    });
    expect(new Set(r.records.map((x) => x.id)).size).toBe(2);
  });

  it('skips token_count events that repeat the same total', () => {
    const text = [meta, ctx('gpt-5.4'), tokenCount(u1, u1), tokenCount(u1, u1), tokenCount(u2, sum(u1, u2)), tokenCount(u2, sum(u1, u2))].join('\n');
    expect(parseCodex(text, 'f').records).toHaveLength(2);
  });

  it('treats cached and cache-write tokens as part of input_tokens', () => {
    const r = parseCodex([meta, ctx('gpt-5.4'), tokenCount(usage(5000, 4000, 10, 0, 500), usage(5000, 4000, 10, 0, 500))].join('\n'), 'f');
    expect(r.records[0]).toMatchObject({ inputTokens: 500, cacheReadTokens: 4000, cacheWrite5mTokens: 500 });
  });

  it('does not add reasoning tokens on top of output_tokens', () => {
    const r = parseCodex([meta, ctx('gpt-5.4'), tokenCount(u2, u2)].join('\n'), 'f');
    expect(r.records[0].outputTokens).toBe(300);
  });

  it('prefers token_usage_record and does not double count the matching token_count', () => {
    const compaction = usage(9000, 0, 800);
    const text = [
      meta, ctx('gpt-5.4'),
      line('token_usage_record', { response_id: 'resp-1', usage: u1 }), tokenCount(u1, u1),
      line('token_usage_record', { response_id: 'resp-2', usage: compaction }),
      line('token_usage_record', { response_id: 'resp-3', usage: u2 }), tokenCount(u2, sum(u1, u2)),
    ].join('\n');
    const r = parseCodex(text, 'f');
    expect(r.records.map((x) => x.id)).toEqual(['resp-1', 'resp-2', 'resp-3']);
  });

  it('uses the model of the latest turn_context and marks subagents', () => {
    const sub = line('session_meta', { id: 'sess-2', cwd: '/w/app', source: { subagent: 'review' } });
    const text = [sub, ctx('gpt-5.4'), tokenCount(u1, u1), ctx('gpt-5.5'), tokenCount(u2, sum(u1, u2))].join('\n');
    const r = parseCodex(text, 'f');
    expect(r.records.map((x) => x.model)).toEqual(['gpt-5.4', 'gpt-5.5']);
    expect(r.records.every((x) => x.sidechain)).toBe(true);
  });

  it('counts UserMessage items as turns when user_message events are absent', () => {
    const item = (id: string) => line('event_msg', { type: 'item_completed', turn_id: 't', item: { type: 'UserMessage', id, content: [] } });
    const r = parseCodex([meta, item('u1'), item('u2'), line('event_msg', { type: 'item_completed', item: { type: 'AgentMessage', id: 'a' } })].join('\n'), 'f');
    expect(r.turns.map((t) => t.id)).toEqual(['u1', 'u2']);
  });

  it('skips malformed lines and never throws', () => {
    const text = [
      '{not json', '', 'null', '42', meta, line('event_msg', { type: 'token_count', info: null }),
      line('event_msg', { type: 'token_count', info: { total_token_usage: u1 } }),
      JSON.stringify({ type: 'event_msg' }), ctx('gpt-5.4'), tokenCount(u1, u1), '{"type":"event_msg","payload":',
    ].join('\n');
    const r = parseCodex(text, 'f');
    expect(r.records).toHaveLength(1);
    expect(() => parseCodex(undefined as any, 'f')).not.toThrow();
  });
});

describe('codexFiles', () => {
  const prev = process.env.CODEX_HOME;
  let home: string;

  beforeAll(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-'));
    process.env.CODEX_HOME = home;
    const write = (rel: string, mtime: Date) => {
      const f = path.join(home, rel);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, '');
      fs.utimesSync(f, mtime, mtime);
    };
    write('sessions/2026/10/09/rollout-new.jsonl', new Date('2026-10-09T12:00:00Z'));
    write('sessions/2026/10/01/rollout-resumed.jsonl', new Date('2026-10-09T12:00:00Z'));
    write('sessions/2026/10/01/rollout-old.jsonl', new Date('2026-10-01T12:00:00Z'));
    write('sessions/2026/10/09/notes.txt', new Date('2026-10-09T12:00:00Z'));
    write('archived_sessions/rollout-archived.jsonl', new Date('2026-10-09T12:00:00Z'));
  });

  afterAll(() => {
    fs.rmSync(home, { recursive: true, force: true });
    if (prev === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = prev;
  });

  it('returns rollouts modified since the cutoff, including archived ones', async () => {
    const files = (await codexFiles(Date.parse('2026-10-05T00:00:00Z'))).map((f) => path.basename(f)).sort();
    expect(files).toEqual(['rollout-archived.jsonl', 'rollout-new.jsonl', 'rollout-resumed.jsonl']);
  });

  it('returns nothing when the folder is missing', async () => {
    process.env.CODEX_HOME = path.join(home, 'missing');
    await expect(codexFiles(0)).resolves.toEqual([]);
    process.env.CODEX_HOME = home;
  });
});
