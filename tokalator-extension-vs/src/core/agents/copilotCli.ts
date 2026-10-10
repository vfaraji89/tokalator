import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function sessionStateDir(): string {
  const state = process.env.XDG_STATE_HOME;
  return path.join(state ? path.join(state, '.copilot') : path.join(os.homedir(), '.copilot'), 'session-state');
}

export async function copilotCliFiles(sinceMs: number): Promise<string[]> {
  const root = sessionStateDir();
  const files: string[] = [];
  for (const name of await fs.promises.readdir(root).catch(() => [] as string[])) {
    const file = path.join(root, name, 'events.jsonl');
    const stat = await fs.promises.stat(file).catch(() => null);
    if (stat?.isFile() && stat.mtimeMs >= sinceMs) files.push(file);
  }
  return files;
}
