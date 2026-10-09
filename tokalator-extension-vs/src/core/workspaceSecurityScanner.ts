import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Tokalator Pro: Workspace Security Scanner
 *
 * Detects missing AI agent security configurations and generates them.
 * Integrates with the dashboard (button), chat participant (/secure),
 * and activation (auto-notification).
 */

export interface SecretPattern {
  glob: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
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
  return BLOCKED_FILENAMES.some(p => filename === p || filename.startsWith(p) || filename.endsWith(p));
}

export class WorkspaceSecurityScanner {
  private root: string | undefined;

  constructor() {
    const folders = vscode.workspace.workspaceFolders;
    this.root = folders?.[0]?.uri.fsPath;
  }

  async audit(): Promise<SecurityAuditResult> {
    if (!this.root) {
      return { score: 0, level: 'unprotected', missingConfigs: ['No workspace open'], foundSecrets: [], missingGitignore: [], hasClaudeSettings: false, hasCopilotGuard: false, hasVSCodeExcludes: false };
    }

    const hasClaudeSettings = this.checkClaudeSettings();
    const hasCopilotGuard = this.checkCopilotGuard();
    const hasVSCodeExcludes = this.checkVSCodeExcludes();
    const foundSecrets = await this.scanForSecretFiles();
    const missingGitignore = this.checkGitignore();

    const missingConfigs: string[] = [];
    if (!hasClaudeSettings) missingConfigs.push('.claude/settings.json (Read/Grep deny rules)');
    if (!hasCopilotGuard) missingConfigs.push('.github/instructions/secret-files.instructions.md');
    if (!hasVSCodeExcludes) missingConfigs.push('.vscode/settings.json (chat.excludeFilePatterns)');

    let score = 0;
    if (hasClaudeSettings) score += 35;
    if (hasCopilotGuard) score += 35;
    if (hasVSCodeExcludes) score += 15;
    if (missingGitignore.length === 0) score += 15;

    const level = score >= 85 ? 'protected' : score >= 50 ? 'partial' : 'unprotected';

    return { score, level, missingConfigs, foundSecrets, missingGitignore, hasClaudeSettings, hasCopilotGuard, hasVSCodeExcludes };
  }

  private checkClaudeSettings(): boolean {
    if (!this.root) return false;
    const settingsPath = path.join(this.root, '.claude', 'settings.json');
    if (!fs.existsSync(settingsPath)) return false;
    try {
      const content = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const deny: string[] = content?.permissions?.deny || [];
      return deny.some(r => r.startsWith('Read(**/.env'));
    } catch {
      return false;
    }
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

  private checkVSCodeExcludes(): boolean {
    if (!this.root) return false;
    const settingsPath = path.join(this.root, '.vscode', 'settings.json');
    if (!fs.existsSync(settingsPath)) return false;
    try {
      const raw = fs.readFileSync(settingsPath, 'utf-8');
      return raw.includes('chat.excludeFilePatterns') || raw.includes('files.exclude');
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

  private checkGitignore(): string[] {
    if (!this.root) return [];
    const gitignorePath = path.join(this.root, '.gitignore');
    const content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
    const required = ['.env*', '*.pem', '*.key', 'id_rsa*', '*.p12', 'credentials.json'];
    return required.filter(p => !content.includes(p));
  }

  // ─── Generators ─────────────────────────────────────────────────────────────

  generateClaudeSettings(): string {
    if (!this.root) return '{}';
    const settingsPath = path.join(this.root, '.claude', 'settings.json');
    let existing: Record<string, unknown> = {};

    if (fs.existsSync(settingsPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch { /* empty */ }
    }

    if (!existing.permissions) existing.permissions = { deny: [] };
    const perms = existing.permissions as { deny: string[] };
    if (!perms.deny) perms.deny = [];

    for (const pat of SECRET_FILE_PATTERNS) {
      const readRule = `Read(${pat.glob})`;
      const grepRule = `Grep(${pat.glob})`;
      if (!perms.deny.includes(readRule)) perms.deny.push(readRule);
      if (!perms.deny.includes(grepRule)) perms.deny.push(grepRule);
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
      '# Secret File Guard (Auto-Generated by Tokalator Pro)',
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
      '*Auto-generated by Tokalator Pro*',
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
      } catch { /* empty */ }
    }

    const excludes: Record<string, boolean> = (existing['files.exclude'] as Record<string, boolean>) || {};
    excludes['**/.env'] = true;
    excludes['**/.env.*'] = true;
    excludes['**/*.pem'] = true;
    excludes['**/*.key'] = true;
    excludes['**/id_rsa*'] = true;
    existing['files.exclude'] = excludes;

    const chatExcludes: string[] = (existing['chat.excludeFilePatterns'] as string[]) || [];
    for (const pat of SECRET_FILE_PATTERNS) {
      if (!chatExcludes.includes(pat.glob)) chatExcludes.push(pat.glob);
    }
    existing['chat.excludeFilePatterns'] = chatExcludes;

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
    return '\n# Secret files (auto-added by Tokalator Pro)\n' + missing.join('\n') + '\n';
  }

  async applyAll(): Promise<string[]> {
    if (!this.root) return [];
    const applied: string[] = [];

    // Claude settings
    const claudeDir = path.join(this.root, '.claude');
    if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), this.generateClaudeSettings(), 'utf-8');
    applied.push('.claude/settings.json');

    // Copilot instructions
    const instrDir = path.join(this.root, '.github', 'instructions');
    if (!fs.existsSync(instrDir)) fs.mkdirSync(instrDir, { recursive: true });
    fs.writeFileSync(path.join(instrDir, 'secret-files.instructions.md'), this.generateCopilotInstructions(), 'utf-8');
    applied.push('.github/instructions/secret-files.instructions.md');

    // VS Code settings
    const vscodeDir = path.join(this.root, '.vscode');
    if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir, { recursive: true });
    fs.writeFileSync(path.join(vscodeDir, 'settings.json'), this.generateVSCodeSettings(), 'utf-8');
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
