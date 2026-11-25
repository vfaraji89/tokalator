import * as fs from 'fs';
import * as path from 'path';

/** Copilot Chat session files (chatSessions/*.json, *.jsonl) in a workspace storage folder, modified since sinceMs. */
export async function copilotChatFiles(workspaceStorageDir: string | undefined, sinceMs: number): Promise<string[]> {
  if (!workspaceStorageDir) return [];
  const dir = path.join(workspaceStorageDir, 'chatSessions');
  const files: string[] = [];
  for (const name of await fs.promises.readdir(dir).catch(() => [] as string[])) {
    if (!/\.jsonl?$/.test(name)) continue;
    const file = path.join(dir, name);
    const stat = await fs.promises.stat(file).catch(() => undefined);
    if (stat?.isFile() && stat.mtimeMs >= sinceMs) files.push(file);
  }
  return files;
}
