import * as vscode from 'vscode';

/**
 * Severity levels for detected secrets.
 */
export type SecretSeverity = 'critical' | 'high' | 'warning';

/**
 * A single detected secret finding.
 */
export interface SecretFinding {
  /** The pattern rule that matched */
  rule: string;
  /** Human-readable description */
  description: string;
  /** Severity level */
  severity: SecretSeverity;
  /** File URI string */
  fileUri: string;
  /** Relative file path */
  filePath: string;
  /** Line number (1-based) */
  line: number;
  /** Matched text (redacted — first 4 chars + masked) */
  preview: string;
}

/**
 * Summary of all secret findings across open files.
 */
export interface SecretScanResult {
  /** Total findings */
  totalFindings: number;
  /** Findings by severity */
  critical: number;
  high: number;
  warning: number;
  /** Per-file findings */
  findings: SecretFinding[];
  /** Files with .env-like names open in tabs */
  envFilesOpen: string[];
  /** Timestamp of scan */
  scannedAt: number;
}

/**
 * Pattern rule for secret detection.
 */
interface SecretPattern {
  rule: string;
  description: string;
  severity: SecretSeverity;
  pattern: RegExp;
}

/**
 * Scans open editor files for secrets, credentials, and sensitive data
 * that could leak into AI context windows.
 *
 * Philosophy: "Zero relevance for secrets" — if Tokalator ranks file relevance,
 * it should also guard against files that should NEVER be in context.
 */
export class SecretScanner {

  /**
   * Patterns that detect common secret types.
   * Ordered by severity: critical → high → warning.
   *
   * Each regex is designed to match key=value patterns commonly found
   * in source code, config files, and .env files.
   */
  private static readonly PATTERNS: SecretPattern[] = [

    // ── Critical: Real API keys / tokens with known prefixes ──────────
    {
      rule: 'aws-access-key',
      description: 'AWS Access Key ID',
      severity: 'critical',
      pattern: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
    },
    {
      rule: 'github-token',
      description: 'GitHub Token',
      severity: 'critical',
      pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g,
    },
    {
      rule: 'openai-key',
      description: 'OpenAI API Key',
      severity: 'critical',
      pattern: /sk-[A-Za-z0-9_-]{20,}/g,
    },
    {
      rule: 'anthropic-key',
      description: 'Anthropic API Key',
      severity: 'critical',
      pattern: /sk-ant-[A-Za-z0-9_-]{20,}/g,
    },
    {
      rule: 'google-api-key',
      description: 'Google API Key',
      severity: 'critical',
      pattern: /AIza[0-9A-Za-z_-]{35}/g,
    },
    {
      rule: 'stripe-key',
      description: 'Stripe Secret Key',
      severity: 'critical',
      pattern: /(?:sk_live|sk_test|rk_live|rk_test)_[A-Za-z0-9]{24,}/g,
    },
    {
      rule: 'slack-token',
      description: 'Slack Token',
      severity: 'critical',
      pattern: /xox[bpors]-[0-9a-zA-Z-]{10,}/g,
    },
    {
      rule: 'npm-token',
      description: 'NPM Token',
      severity: 'critical',
      pattern: /npm_[A-Za-z0-9]{36}/g,
    },
    {
      rule: 'private-key-block',
      description: 'Private Key (PEM)',
      severity: 'critical',
      pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    },

    // ── High: Generic key=value patterns with secret-like names ──────
    {
      rule: 'generic-api-key',
      description: 'API Key Assignment',
      severity: 'high',
      pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-/.]{16,}['"]?/gi,
    },
    {
      rule: 'generic-secret',
      description: 'Secret / Token Assignment',
      severity: 'high',
      pattern: /(?:secret|token|access_token|auth_token|client_secret)\s*[:=]\s*['"]?[A-Za-z0-9_\-/.]{16,}['"]?/gi,
    },
    {
      rule: 'password-assignment',
      description: 'Password Assignment',
      severity: 'high',
      pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
    },
    {
      rule: 'database-url',
      description: 'Database Connection String',
      severity: 'high',
      pattern: /(?:mongodb\+srv|postgres(?:ql)?|mysql|mssql|redis):\/\/[^\s'"]{10,}/gi,
    },
    {
      rule: 'bearer-token',
      description: 'Bearer Token in Header',
      severity: 'high',
      pattern: /[Bb]earer\s+[A-Za-z0-9_\-/.=]{20,}/g,
    },
    {
      rule: 'jwt-token',
      description: 'JWT Token',
      severity: 'high',
      pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_\-+/=]{10,}/g,
    },

    // ── Warning: Potentially sensitive but lower confidence ──────────
    {
      rule: 'connection-string',
      description: 'Connection String',
      severity: 'warning',
      pattern: /(?:connection_string|conn_str|dsn)\s*[:=]\s*['"]?[^\s'"]{20,}['"]?/gi,
    },
    {
      rule: 'private-ip',
      description: 'Internal IP Address',
      severity: 'warning',
      pattern: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
    },
    {
      rule: 'email-credential',
      description: 'Email with Password Context',
      severity: 'warning',
      pattern: /(?:email|smtp_user|mail_user)\s*[:=]\s*['"]?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}['"]?/gi,
    },
  ];

  /**
   * File names/extensions that should never be in AI context.
   */
  private static readonly SENSITIVE_FILE_PATTERNS = [
    /^\.env$/,
    /^\.env\..+$/,          // .env.local, .env.production, etc.
    /^\.env\.example$/,     // even examples can leak structure
    /\.pem$/,
    /\.key$/,
    /\.p12$/,
    /\.pfx$/,
    /\.jks$/,
    /id_rsa$/,
    /id_ed25519$/,
    /credentials$/,
    /\.secret$/,
    /\.secrets$/,
    /secrets\.ya?ml$/,
    /\.npmrc$/,
    /\.pypirc$/,
    /\.netrc$/,
    /\.docker\/config\.json$/,
    /kubeconfig$/,
  ];

  /**
   * File extensions that are excluded from content scanning
   * (binary, image, etc.) but still checked for sensitive filenames.
   */
  private static readonly SKIP_CONTENT_SCAN = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp',
    'woff', 'woff2', 'ttf', 'eot', 'otf',
    'mp3', 'mp4', 'avi', 'mov', 'wav',
    'zip', 'tar', 'gz', 'rar', '7z',
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'exe', 'dll', 'so', 'dylib', 'bin',
    'wasm', 'o', 'a', 'lib',
  ]);

  /**
   * Scan all open tabs for secrets and sensitive files.
   */
  async scanOpenTabs(): Promise<SecretScanResult> {
    const result: SecretScanResult = {
      totalFindings: 0,
      critical: 0,
      high: 0,
      warning: 0,
      findings: [],
      envFilesOpen: [],
      scannedAt: Date.now(),
    };

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        if (!(tab.input instanceof vscode.TabInputText)) { continue; }

        const uri = tab.input.uri;
        const fsPath = uri.fsPath;
        const fileName = fsPath.split('/').pop() || fsPath.split('\\').pop() || '';
        const relativePath = workspaceRoot
          ? fsPath.replace(workspaceRoot, '').replace(/^[/\\]/, '')
          : fsPath;

        // 1. Check if the filename itself is sensitive
        const isSensitiveFile = SecretScanner.SENSITIVE_FILE_PATTERNS.some(p => p.test(fileName));
        if (isSensitiveFile) {
          result.envFilesOpen.push(relativePath);
          result.findings.push({
            rule: 'sensitive-file',
            description: `Sensitive file open: ${fileName}`,
            severity: 'critical',
            fileUri: uri.toString(),
            filePath: relativePath,
            line: 0,
            preview: `[${fileName}] — this file should not be in AI context`,
          });
          result.critical++;
          result.totalFindings++;
        }

        // 2. Skip binary files for content scanning
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (SecretScanner.SKIP_CONTENT_SCAN.has(ext)) { continue; }

        // 3. Scan file content
        try {
          const doc = vscode.workspace.textDocuments.find(
            d => d.uri.toString() === uri.toString()
          );
          if (!doc) { continue; }

          const text = doc.getText();
          const lines = text.split('\n');

          for (const rule of SecretScanner.PATTERNS) {
            // Reset regex state
            rule.pattern.lastIndex = 0;

            let match: RegExpExecArray | null;
            while ((match = rule.pattern.exec(text)) !== null) {
              // Find line number
              const beforeMatch = text.substring(0, match.index);
              const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

              // Check if line is a comment (rough check)
              const lineText = lines[lineNum - 1] || '';
              if (this.isCommentOrExample(lineText, fileName)) { continue; }

              // Redact the match for display
              const preview = this.redact(match[0]);

              result.findings.push({
                rule: rule.rule,
                description: rule.description,
                severity: rule.severity,
                fileUri: uri.toString(),
                filePath: relativePath,
                line: lineNum,
                preview,
              });

              switch (rule.severity) {
                case 'critical': result.critical++; break;
                case 'high': result.high++; break;
                case 'warning': result.warning++; break;
              }
              result.totalFindings++;
            }
          }
        } catch {
          // Skip files we can't read
        }
      }
    }

    return result;
  }

  /**
   * Quick check: are there any .env files in the workspace root?
   * Returns paths of .env files found.
   */
  async findEnvFiles(): Promise<string[]> {
    try {
      const envFiles = await vscode.workspace.findFiles(
        '**/.env{,.*}',
        '{**/node_modules/**,**/dist/**,**/build/**}',
        20,
      );
      return envFiles.map(u => vscode.workspace.asRelativePath(u));
    } catch {
      return [];
    }
  }

  /**
   * Redact a matched secret for safe display.
   * Shows first 4 chars + masked remainder.
   */
  private redact(value: string): string {
    if (value.length <= 8) { return '****'; }
    const visible = value.substring(0, 4);
    const masked = '*'.repeat(Math.min(value.length - 4, 20));
    return `${visible}${masked}`;
  }

  /**
   * Rough check if a line is a comment or example/placeholder.
   */
  private isCommentOrExample(line: string, fileName: string): boolean {
    const trimmed = line.trim();

    // Skip common comment patterns
    if (trimmed.startsWith('//') && !trimmed.includes('=')) { return true; }
    if (trimmed.startsWith('#') && fileName.endsWith('.md')) { return true; }
    if (trimmed.startsWith('*') || trimmed.startsWith('/*')) { return true; }
    if (trimmed.startsWith('<!--')) { return true; }

    // Skip obvious placeholders
    const placeholders = [
      'your_key_here', 'your-api-key', 'xxx', 'placeholder',
      'example', 'changeme', 'replace_me', 'INSERT_KEY',
      'YOUR_', 'REPLACE_', '<your', '<api', 'TODO',
    ];
    const lower = trimmed.toLowerCase();
    if (placeholders.some(p => lower.includes(p.toLowerCase()))) { return true; }

    return false;
  }
}
