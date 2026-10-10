import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AgentParseResult } from './types';
import { OpenCodeMessageRow, OpenCodeSessionRow, mapOpenCodeRows } from './opencode.pure';

type OpenCodeResult = AgentParseResult & { available: boolean; reason?: string };

const empty = (reason: string): OpenCodeResult => ({ records: [], turns: [], available: false, reason });

function dataDir(): string {
  return path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'opencode');
}

function dbPath(dir: string): string | undefined {
  const env = process.env.OPENCODE_DB;
  if (env && env !== ':memory:') return path.resolve(dir, env);
  const candidates = ['opencode.db', ...safeList(dir).filter(f => /^opencode-.+\.db$/.test(f))]
    .map(f => path.join(dir, f))
    .filter(f => fs.existsSync(f));
  return candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

function safeList(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function inWorkspace(dir: string, roots: string[]): boolean {
  const norm = (p: string) => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
  const d = norm(dir);
  return roots.some(r => {
    const rel = path.relative(norm(r), d);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  });
}

function loadSqlite(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:sqlite');
  } catch {
    return undefined;
  }
}

const MESSAGE_DATA = `json_object(
  'role', json_extract(m.data, '$.role'),
  'modelID', json_extract(m.data, '$.modelID'),
  'time', json_object('created', json_extract(m.data, '$.time.created')),
  'tokens', json_extract(m.data, '$.tokens'))`;

function readDb(file: string, sqlite: any, roots: string[], sinceMs: number): AgentParseResult {
  const db = new sqlite.DatabaseSync(file, { readOnly: true, timeout: 2000 });
  try {
    const sessions: OpenCodeSessionRow[] = db
      .prepare('SELECT id, directory, parent_id AS parentId FROM session WHERE time_updated >= ?')
      .all(sinceMs)
      .filter((s: OpenCodeSessionRow) => inWorkspace(s.directory, roots));
    if (!sessions.length) return { records: [], turns: [] };
    const messages: OpenCodeMessageRow[] = db
      .prepare(
        `SELECT m.id, m.session_id AS sessionId, m.time_created AS timeCreated, ${MESSAGE_DATA} AS data
         FROM message m
         WHERE m.session_id IN (SELECT value FROM json_each(?)) AND m.time_created >= ?
           AND NOT EXISTS (SELECT 1 FROM part p WHERE p.message_id = m.id AND json_extract(p.data, '$.type') = 'compaction')`,
      )
      .all(JSON.stringify(sessions.map(s => s.id)), sinceMs);
    return mapOpenCodeRows(messages, sessions);
  } finally {
    db.close();
  }
}

async function readJson(file: string): Promise<any> {
  try {
    return JSON.parse(await fs.promises.readFile(file, 'utf8'));
  } catch {
    return undefined;
  }
}

async function readLegacy(storage: string, roots: string[], sinceMs: number): Promise<AgentParseResult> {
  const sessions: OpenCodeSessionRow[] = [];
  for (const project of safeList(path.join(storage, 'session'))) {
    const dir = path.join(storage, 'session', project);
    for (const f of safeList(dir).filter(n => n.endsWith('.json'))) {
      const s = await readJson(path.join(dir, f));
      if (typeof s?.id !== 'string' || typeof s.directory !== 'string') continue;
      if ((s.time?.updated ?? 0) < sinceMs || !inWorkspace(s.directory, roots)) continue;
      sessions.push({ id: s.id, directory: s.directory, parentId: s.parentID });
    }
  }
  const messages: OpenCodeMessageRow[] = [];
  for (const s of sessions) {
    const dir = path.join(storage, 'message', s.id);
    for (const f of safeList(dir).filter(n => n.endsWith('.json'))) {
      const m = await readJson(path.join(dir, f));
      const created = m?.time?.created;
      if (typeof m?.id !== 'string' || typeof created !== 'number' || created < sinceMs) continue;
      const data = JSON.stringify({ role: m.role, modelID: m.modelID, time: { created }, tokens: m.tokens });
      messages.push({ id: m.id, sessionId: s.id, timeCreated: created, data });
    }
  }
  return mapOpenCodeRows(messages, sessions);
}

export async function readOpenCode(workspacePaths: string[], sinceMs: number): Promise<OpenCodeResult> {
  if (!workspacePaths.length) return empty('no workspace folders');
  const dir = dataDir();
  if (!fs.existsSync(dir)) return empty('OpenCode data directory not found');
  const file = dbPath(dir);
  const sqlite = file ? loadSqlite() : undefined;
  try {
    if (file && sqlite) return { ...readDb(file, sqlite, workspacePaths, sinceMs), available: true };
    const storage = path.join(dir, 'storage');
    if (fs.existsSync(path.join(storage, 'message'))) {
      return { ...(await readLegacy(storage, workspacePaths, sinceMs)), available: true };
    }
    return empty(file ? 'node:sqlite is unavailable' : 'OpenCode database not found');
  } catch (err) {
    return empty(`OpenCode read failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
