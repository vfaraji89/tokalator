import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';

const DAY_MS = 86_400_000;
/** Codex appends to a rollout when a session is resumed, so a date folder can hold files modified long after it was created. */
const RESUME_LOOKBACK_MS = 30 * DAY_MS;

export function codexHome(): string {
  return process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
}

async function list(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function recent(files: string[], sinceMs: number): Promise<string[]> {
  const kept = await Promise.all(files.map(async (f) => {
    try {
      return (await fs.stat(f)).mtimeMs >= sinceMs ? f : null;
    } catch {
      return null;
    }
  }));
  return kept.filter((f): f is string => f !== null);
}

const rollouts = async (dir: string) =>
  (await list(dir)).filter((n) => n.startsWith('rollout-') && n.endsWith('.jsonl')).map((n) => path.join(dir, n));

/** Rollout files modified at or after sinceMs, walking only date folders that can contain them. */
export async function codexFiles(sinceMs: number): Promise<string[]> {
  const home = codexHome();
  const sessions = path.join(home, 'sessions');
  const cutoff = sinceMs - RESUME_LOOKBACK_MS - DAY_MS;
  const candidates: string[] = [];
  const numeric = async (dir: string) =>
    (await list(dir)).filter((n) => /^\d+$/.test(n)).map((n) => [n, Number(n)] as const);

  for (const [yName, y] of await numeric(sessions)) {
    if (Date.UTC(y + 1, 0, 1) < cutoff) continue;
    const yDir = path.join(sessions, yName);
    for (const [mName, m] of await numeric(yDir)) {
      if (Date.UTC(y, m, 1) < cutoff) continue;
      const mDir = path.join(yDir, mName);
      for (const [dName, d] of await numeric(mDir)) {
        if (Date.UTC(y, m - 1, d + 1) < cutoff) continue;
        candidates.push(...await rollouts(path.join(mDir, dName)));
      }
    }
  }
  candidates.push(...await rollouts(path.join(home, 'archived_sessions')));
  return recent(candidates, sinceMs);
}
