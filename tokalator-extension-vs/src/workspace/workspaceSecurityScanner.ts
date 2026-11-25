import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execFile } from 'child_process';

/**
 * Workspace Security Scanner
 *
 * Finds secret files and checks, file by file, whether Claude Code deny rules,
 * VS Code search exclusion, and git ignore rules actually cover them.
 */

export interface SecretPattern {
  glob: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface SecretCoverage {
  file: string;
  claude: boolean;
  search: boolean;
  gitignored: boolean;
}

export interface SecurityAuditResult {
  score: number; // 0-100
  level: 'protected' | 'partial' | 'unprotected';
  missingConfigs: string[];
  foundSecrets: string[];
  missingGitignore: string[];
  hasClaudeSettings: boolean;
  hasCopilotGuard: boolean;
  hasVSCodeExcludes: boolean;
  coverage: SecretCoverage[];
  uncovered: number;
}

export const SECRET_FILE_PATTERNS: SecretPattern[] = [
  { glob: '**/.env', description: 'Environment variables', severity: 'critical' },
  { glob: '**/.env.*', description: 'Environment variants', severity: 'critical' },
  { glob: '**/.env.local', description: 'Local environment', severity: 'critical' },
  { glob: '**/.env.production', description: 'Production environment', severity: 'critical' },
  { glob: '**/*.pem', description: 'PEM certificates/keys', severity: 'critical' },
  { glob: '**/*.key', description: 'Private key files', severity: 'critical' },
  { glob: '**/id_rsa*', description: 'SSH private keys', severity: 'critical' },
  { glob: '**/*.p12', description: 'PKCS#12 keystore', severity: 'high' },
  { glob: '**/*.pfx', description: 'PFX certificate', severity: 'high' },
  { glob: '**/credentials.json', description: 'GCP credentials', severity: 'critical' },
  { glob: '**/service-account*.json', description: 'Service account keys', severity: 'critical' },
  { glob: '**/.npmrc', description: 'npm auth tokens', severity: 'high' },
  { glob: '**/.pypirc', description: 'PyPI auth tokens', severity: 'high' },
  { glob: '**/*.keystore', description: 'Java keystore', severity: 'high' },
  { glob: '**/.htpasswd', description: 'Apache passwords', severity: 'high' },
  { glob: '**/.netrc', description: 'Network credentials', severity: 'high' },
  { glob: '**/secrets.yml', description: 'Ansible secrets', severity: 'high' },
  { glob: '**/secrets.yaml', description: 'Kubernetes secrets', severity: 'high' },
  { glob: '**/*.jks', description: 'Java keystore (JKS)', severity: 'high' },
  { glob: '**/token.json', description: 'OAuth token cache', severity: 'high' },
];

const BLOCKED_FILENAMES = ['.env', '.pem', '.key', 'id_rsa', '.p12', '.pfx',
  'credentials.json', 'service-account', '.npmrc', '.pypirc', '.keystore',
  '.htpasswd', '.netrc', 'secrets.yml', 'secrets.yaml', '.jks', 'token.json'];

export function isSecretFile(filename: string): boolean {
  if (filename === '.env.example' || filename === '.env.sample' || filename === '.env.template') return false;
  return BLOCKED_FILENAMES.some(p => filename === p || filename.startsWith(p) || filename.endsWith(p));
}

/** Gitignore-style glob to RegExp: a pattern without a slash matches the name at any depth. */
export function globToRegExp(glob: string): RegExp {
  let g = glob.trim().replace(/^\.\//, '');
  if (!g.includes('/')) g = '**/' + g;
  if (g.startsWith('/')) g = g.slice(1);
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') {
      if (g[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp('^' + re + '$');
}

export function matchesAny(file: string, globs: string[]): boolean {
  const rel = file.split(path.sep).join('/');
  return globs.some(g => globToRegExp(g).test(rel));
}

/** Paths from Read(...) deny rules, e.g. Read(**\/.env) or Read(./secrets/**). */
export function claudeReadDenyGlobs(deny: unknown): string[] {
  if (!Array.isArray(deny)) return [];
  return deny
    .map(r => (typeof r === 'string' ? /^Read\((.+)\)$/.exec(r.trim())?.[1] : undefined))
    .filter((g): g is string => !!g);
}

export class WorkspaceSecurityScanner {
  private root: string | undefined;

  constructor() {
    const folders = vscode.workspace.workspaceFolders;
    this.root = folders?.[0]?.uri.fsPath;
  }

  async audit(): Promise<SecurityAuditResult> {
    if (!this.root) {
      return { score: 0, level: 'unprotected', missingConfigs: ['No workspace open'], foundSecrets: [], missingGitignore: [], hasClaudeSettings: false, hasCopilotGuard: false, hasVSCodeExcludes: false, coverage: [], uncovered: 0 };
    }

    const foundSecrets = await this.scanForSecretFiles();
    const claudeGlobs = this.claudeDenyGlobs();
    const searchGlobs = this.searchExcludeGlobs();
    const ignored = await this.gitIgnored(foundSecrets);
    const hasCopilotGuard = this.checkCopilotGuard();

    const coverage: SecretCoverage[] = foundSecrets.map(file => ({
      file,
      claude: matchesAny(file, claudeGlobs),
      search: matchesAny(file, searchGlobs),
      gitignored: ignored.has(file),
    }));
    const uncovered = coverage.filter(c => !(c.claude && c.search && c.gitignored)).length;
    const hasClaudeSettings = coverage.every(c => c.claude) && claudeGlobs.length > 0;
    const hasVSCodeExcludes = coverage.every(c => c.search) && searchGlobs.length > 0;
    const missingGitignore = coverage.filter(c => !c.gitignored).map(c => c.file);

    if (foundSecrets.length === 0) {
      return { score: 100, level: 'protected', missingConfigs: [], foundSecrets, missingGitignore: [], hasClaudeSettings, hasCopilotGuard, hasVSCodeExcludes, coverage, uncovered: 0 };
    }

    const share = (pick: (c: SecretCoverage) => boolean) => coverage.filter(pick).length / coverage.length;
    const score = Math.round(share(c => c.claude) * 40 + share(c => c.search) * 20 + share(c => c.gitignored) * 30 + (hasCopilotGuard ? 10 : 0));

    const missingConfigs: string[] = [];
    if (!coverage.every(c => c.claude)) missingConfigs.push('.claude/settings.json (Read deny rules)');
    if (!hasCopilotGuard) missingConfigs.push('.github/instructions/secret-files.instructions.md');
    if (!coverage.every(c => c.search)) missingConfigs.push('.vscode/settings.json (search.exclude)');
    if (missingGitignore.length) missingConfigs.push('.gitignore');

    const level = uncovered === 0 && hasCopilotGuard ? 'protected' : score >= 50 ? 'partial' : 'unprotected';
    return { score, level, missingConfigs, foundSecrets, missingGitignore, hasClaudeSettings, hasCopilotGuard, hasVSCodeExcludes, coverage, uncovered };
  }

  /** Deny rules apply from project, local project, and user settings, so all three count. */
  private claudeDenyGlobs(): string[] {
    const files = [
      path.join(this.root!, '.claude', 'settings.json'),
      path.join(this.root!, '.claude', 'settings.local.json'),
      path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'settings.json'),
    ];
    return files.flatMap(f => {
      try {
        return claudeReadDenyGlobs(JSON.parse(fs.readFileSync(f, 'utf-8'))?.permissions?.deny);
      } catch {
        return [];
      }
    });
  }

  private searchExcludeGlobs(): string[] {
    const config = vscode.workspace.getConfiguration(undefined, vscode.Uri.file(this.root!));
    const enabled = (o: Record<string, unknown> | undefined) => Object.entries(o ?? {}).filter(([, v]) => v === true).map(([k]) => k);
    return [...enabled(config.get('search.exclude')), ...enabled(config.get('files.exclude'))];
  }

  /** Uses git itself so nested .gitignore files, negations, and global excludes all apply. */
  private gitIgnored(files: string[]): Promise<Set<string>> {
    if (!files.length) return Promise.resolve(new Set());
    return new Promise(resolve => {
      execFile('git', ['check-ignore', '--', ...files], { cwd: this.root, timeout: 5000 }, (err, stdout) => {
        const code = (err as { code?: number } | null)?.code;
        if (err && code !== 1) {
          const lines = (fs.existsSync(path.join(this.root!, '.gitignore')) ? fs.readFileSync(path.join(this.root!, '.gitignore'), 'utf-8') : '')
            .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('!'));
          resolve(new Set(files.filter(f => matchesAny(f, lines))));
          return;
        }
        resolve(new Set(stdout.split('\n').map(l => l.trim()).filter(Boolean)));
      });
    });
  }

  private checkCopilotGuard(): boolean {
    if (!this.root) return false;
    const instrPath = path.join(this.root, '.github', 'instructions', 'secret-files.instructions.md');
    if (!fs.existsSync(instrPath)) return false;
    try {
      const content = fs.readFileSync(instrPath, 'utf-8');
      return content.includes('applyTo') && content.includes('.env');
    } catch {
      return false;
    }
  }

  private async scanForSecretFiles(): Promise<string[]> {
    if (!this.root) return [];
    const found: string[] = [];
    const root = this.root;

    function walk(dir: string, depth = 0) {
      if (depth > 4) return;
      const skip = ['node_modules', '.git', '.next', 'dist', 'build', '.vercel'];
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (skip.includes(entry.name)) continue;
          walk(path.join(dir, entry.name), depth + 1);
        } else if (isSecretFile(entry.name)) {
          found.push(path.relative(root, path.join(dir, entry.name)));
        }
      }
    }

    walk(root);
    return found;
  }

  // ─── Generators ─────────────────────────────────────────────────────────────

  generateClaudeSettings(): string {
    if (!this.root) return '{}';
    const settingsPath = path.join(this.root, '.claude', 'settings.json');
    let existing: Record<string, unknown> = {};

    if (fs.existsSync(settingsPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch {
        throw new Error('.claude/settings.json could not be parsed, so it was left unchanged');
      }
    }

    if (!existing.permissions) existing.permissions = { deny: [] };
    const perms = existing.permissions as { deny: string[] };
    if (!perms.deny) perms.deny = [];

    const legacy = new Set(SECRET_FILE_PATTERNS.map(p => `Grep(${p.glob})`));
    perms.deny = perms.deny.filter(r => !legacy.has(r));
    for (const pat of SECRET_FILE_PATTERNS) {
      const readRule = `Read(${pat.glob})`;
      if (!perms.deny.includes(readRule)) perms.deny.push(readRule);
    }

    perms.deny = [...new Set(perms.deny)];
    return JSON.stringify(existing, null, 2);
  }

  generateCopilotInstructions(): string {
    const applyTo = SECRET_FILE_PATTERNS
      .map(p => p.glob)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(',');

    return [
      '---',
      `applyTo: "${applyTo}"`,
      '---',
      '',
      '# Secret File Guard (generated by Tokalator)',
      '',
      'Files matching this pattern MUST NOT be read into agent context.',
      '',
      'If asked to read, display, or process any matching file:',
      '1. Refuse to read file contents',
      '2. Acknowledge the file exists by name only',
      '3. Suggest `process.env.VAR_NAME` or `os.getenv("VAR_NAME")` references',
      '4. Point to `.env.example` for configuration templates',
      '',
      '## Rationale',
      '',
      'Reading secret files sends credentials to LLM provider APIs, wastes context budget',
      'on non-actionable content, and risks persistence in conversation history.',
      '',
      '---',
      '*Generated by Tokalator*',
    ].join('\n');
  }

  generateVSCodeSettings(): string {
    if (!this.root) return '{}';
    const settingsPath = path.join(this.root, '.vscode', 'settings.json');
    let existing: Record<string, unknown> = {};

    if (fs.existsSync(settingsPath)) {
      try {
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        // Strip single-line comments but not // inside strings (e.g. URLs)
        const stripped = raw.replace(/^(\s*)(\/\/.*)$/gm, '$1').replace(/,\s*([}\]])/g, '$1');
        existing = JSON.parse(stripped);
      } catch {
        throw new Error('.vscode/settings.json could not be parsed (block comments or other JSONC), so it was left unchanged');
      }
    }

    const searchExclude: Record<string, boolean> = (existing['search.exclude'] as Record<string, boolean>) || {};
    for (const pat of SECRET_FILE_PATTERNS) searchExclude[pat.glob] = true;
    existing['search.exclude'] = searchExclude;

    return JSON.stringify(existing, null, 2);
  }

  generateGitignorePatch(): string | null {
    if (!this.root) return null;
    const gitignorePath = path.join(this.root, '.gitignore');
    const content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
    const required = ['.env*', '!.env.example', '*.pem', '*.key', 'id_rsa*', '*.p12', '*.pfx',
      'credentials.json', 'service-account*.json', '.npmrc', '.pypirc', 'token.json'];
    const missing = required.filter(p => !content.includes(p));
    if (missing.length === 0) return null;
    return '\n# Secret files (added by Tokalator)\n' + missing.join('\n') + '\n';
  }

  async applyAll(): Promise<string[]> {
    if (!this.root) return [];
    const applied: string[] = [];
    const claudeSettings = this.generateClaudeSettings();
    const vscodeSettings = this.generateVSCodeSettings();

    // Claude settings
    const claudeDir = path.join(this.root, '.claude');
    if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), claudeSettings, 'utf-8');
    applied.push('.claude/settings.json');

    // Copilot instructions
    const instrDir = path.join(this.root, '.github', 'instructions');
    if (!fs.existsSync(instrDir)) fs.mkdirSync(instrDir, { recursive: true });
    fs.writeFileSync(path.join(instrDir, 'secret-files.instructions.md'), this.generateCopilotInstructions(), 'utf-8');
    applied.push('.github/instructions/secret-files.instructions.md');

    // VS Code settings
    const vscodeDir = path.join(this.root, '.vscode');
    if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir, { recursive: true });
    fs.writeFileSync(path.join(vscodeDir, 'settings.json'), vscodeSettings, 'utf-8');
    applied.push('.vscode/settings.json');

    // Gitignore
    const patch = this.generateGitignorePatch();
    if (patch) {
      fs.appendFileSync(path.join(this.root, '.gitignore'), patch);
      applied.push('.gitignore');
    }

    return applied;
  }
}
