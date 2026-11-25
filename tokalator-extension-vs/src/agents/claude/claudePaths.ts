import * as os from 'os';
import * as path from 'path';

export function claudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

export function claudeProjectsDir(): string {
  return path.join(claudeConfigDir(), 'projects');
}

export function encodeProjectDir(fsPath: string): string {
  return fsPath.replace(/[^a-zA-Z0-9]/g, '-');
}
