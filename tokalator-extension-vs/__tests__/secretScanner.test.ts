import { SecretScanner } from '../src/core/secretScanner';
import * as vscode from 'vscode';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a mock text document */
function mockDoc(content: string, uri: string, fileName?: string) {
  return {
    uri: vscode.Uri.file(uri),
    getText: () => content,
    fileName: fileName || uri,
    languageId: 'plaintext',
  };
}

/** Create a mock tab group with text-input tabs */
function setupTabs(docs: Array<{ uri: string; content: string }>) {
  const textDocuments = docs.map(d => mockDoc(d.content, d.uri));
  (vscode.workspace as any).textDocuments = textDocuments;
  (vscode.workspace as any).workspaceFolders = [
    { uri: vscode.Uri.file('/workspace'), name: 'workspace', index: 0 },
  ];
  (vscode.window.tabGroups as any).all = [
    {
      tabs: docs.map(d => ({
        input: new vscode.TabInputText(vscode.Uri.file(d.uri)),
      })),
    },
  ];
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SecretScanner', () => {
  let scanner: SecretScanner;

  beforeEach(() => {
    scanner = new SecretScanner();
    (vscode.workspace as any).textDocuments = [];
    (vscode.window.tabGroups as any).all = [];
  });

  // ── Pattern matching ──────────────────────────────────────────────────

  describe('Pattern matching (static PATTERNS)', () => {
    // Access patterns via the class — they're private, so we test them
    // indirectly through scanOpenTabs().

    it('detects AWS access keys (AKIA prefix)', async () => {
      setupTabs([{ uri: '/workspace/config.ts', content: 'const key = "AKIAIOSFODNN7VHQZGT4Q";' }]);
      const result = await scanner.scanOpenTabs();
      expect(result.totalFindings).toBeGreaterThanOrEqual(1);
      expect(result.findings.some(f => f.rule === 'aws-access-key')).toBe(true);
      expect(result.critical).toBeGreaterThanOrEqual(1);
    });

    it('detects AWS secret access keys via generic-secret pattern', async () => {
      setupTabs([{
        uri: '/workspace/config.ts',
        content: 'access_token = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYZQ8KT4"',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'generic-secret')).toBe(true);
    });

    it('detects GitHub personal access tokens', async () => {
      setupTabs([{
        uri: '/workspace/script.sh',
        content: 'GITHUB_TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcde12345',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'github-token')).toBe(true);
    });

    it('detects OpenAI API keys', async () => {
      setupTabs([{
        uri: '/workspace/ai.ts',
        content: 'const apiKey = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234";',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'openai-key')).toBe(true);
    });

    it('detects Anthropic API keys', async () => {
      setupTabs([{
        uri: '/workspace/claude.ts',
        content: 'apiKey: "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM"',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'anthropic-key')).toBe(true);
    });

    it('detects Google API keys', async () => {
      setupTabs([{
        uri: '/workspace/google.ts',
        content: 'const key = "AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe";',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'google-api-key')).toBe(true);
    });

    it('detects Stripe secret keys', async () => {
      setupTabs([{
        uri: '/workspace/payment.ts',
        content: 'stripe.apiKey = "sk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789aBcDeFgHi";',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'stripe-key')).toBe(true);
    });

    it('detects Slack tokens', async () => {
      setupTabs([{
        uri: '/workspace/slack.ts',
        content: 'token = \"xoxb-not-a-real-slack-token\"',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'slack-token')).toBe(true);
    });

    it('detects PEM private keys', async () => {
      setupTabs([{
        uri: '/workspace/key.pem',
        content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'private-key-block')).toBe(true);
    });

    it('detects generic API key assignments', async () => {
      setupTabs([{
        uri: '/workspace/config.ts',
        content: 'api_key = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'generic-api-key')).toBe(true);
    });

    it('detects database connection URLs', async () => {
      setupTabs([{
        uri: '/workspace/db.ts',
        content: 'const url = "postgresql://admin:s3cr3t@db.prod-host.com:5432/mydb";',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'database-url')).toBe(true);
    });

    it('detects bearer tokens in code', async () => {
      setupTabs([{
        uri: '/workspace/api.ts',
        content: 'headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U" }',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'bearer-token')).toBe(true);
    });

    it('detects JWT tokens', async () => {
      setupTabs([{
        uri: '/workspace/auth.ts',
        content: 'const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'jwt-token')).toBe(true);
    });

    it('detects NPM tokens', async () => {
      setupTabs([{
        uri: '/workspace/.npmrc',
        content: '//registry.npmjs.org/:_authToken=npm_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'npm-token')).toBe(true);
    });
  });

  // ── Sensitive file detection ──────────────────────────────────────────

  describe('Sensitive file detection', () => {
    it('flags .env files as sensitive', async () => {
      setupTabs([{ uri: '/workspace/.env', content: 'SECRET=abc' }]);
      const result = await scanner.scanOpenTabs();
      expect(result.envFilesOpen.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some(f => f.rule === 'sensitive-file')).toBe(true);
    });

    it('flags .env.local files as sensitive', async () => {
      setupTabs([{ uri: '/workspace/.env.local', content: 'SECRET=abc' }]);
      const result = await scanner.scanOpenTabs();
      expect(result.envFilesOpen.length).toBeGreaterThanOrEqual(1);
    });

    it('flags .pem files as sensitive', async () => {
      setupTabs([{ uri: '/workspace/cert.pem', content: 'cert data' }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'sensitive-file')).toBe(true);
    });

    it('flags id_rsa files as sensitive', async () => {
      setupTabs([{ uri: '/workspace/.ssh/id_rsa', content: 'key data' }]);
      const result = await scanner.scanOpenTabs();
      expect(result.findings.some(f => f.rule === 'sensitive-file')).toBe(true);
    });
  });

  // ── Comment / placeholder skipping ────────────────────────────────────

  describe('Comment and placeholder filtering', () => {
    it('skips secrets inside JS comments (//)', async () => {
      setupTabs([{
        uri: '/workspace/config.ts',
        content: '// const key = "AKIAIOSFODNN7EXAMPLE";',
      }]);
      const result = await scanner.scanOpenTabs();
      // The line starts with // so isCommentOrExample should catch it
      const awsFindings = result.findings.filter(f => f.rule === 'aws-access-key');
      expect(awsFindings.length).toBe(0);
    });

    it('skips lines with placeholder values', async () => {
      setupTabs([{
        uri: '/workspace/config.ts',
        content: 'api_key = "your_key_here_placeholder_value"',
      }]);
      const result = await scanner.scanOpenTabs();
      const genericFindings = result.findings.filter(f => f.rule === 'generic-api-key');
      expect(genericFindings.length).toBe(0);
    });
  });

  // ── Redaction ─────────────────────────────────────────────────────────

  describe('Redaction', () => {
    it('redacts long secrets showing first 4 chars', async () => {
      setupTabs([{
        uri: '/workspace/config.ts',
        content: 'const key = "AKIAIOSFODNN7VHQZGT4Q";',
      }]);
      const result = await scanner.scanOpenTabs();
      const finding = result.findings.find(f => f.rule === 'aws-access-key');
      if (finding) {
        expect(finding.preview.startsWith('AKIA')).toBe(true);
        expect(finding.preview).toContain('*');
        // Verify original value is NOT in the preview
        expect(finding.preview).not.toContain('AKIAIOSFODNN7VHQZGT4Q');
      }
    });
  });

  // ── Severity counting ────────────────────────────────────────────────

  describe('Severity counting', () => {
    it('correctly counts by severity level', async () => {
      setupTabs([{
        uri: '/workspace/mix.ts',
        content: [
          'const aws = "AKIAIOSFODNN7VHQZGT4Q";',    // critical
          'const db = "postgresql://admin:s3cr3t@db.prod-host.com:5432/mydb";',   // high
          'api_key = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4"', // warning
        ].join('\n'),
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.critical).toBeGreaterThanOrEqual(1);
      expect(result.high).toBeGreaterThanOrEqual(1);
      expect(result.totalFindings).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Clean files ───────────────────────────────────────────────────────

  describe('Clean files', () => {
    it('reports zero findings for clean code', async () => {
      setupTabs([{
        uri: '/workspace/clean.ts',
        content: [
          'export function add(a: number, b: number): number {',
          '  return a + b;',
          '}',
          '',
          'const config = {',
          '  timeout: 3000,',
          '  retries: 3,',
          '};',
        ].join('\n'),
      }]);
      const result = await scanner.scanOpenTabs();
      expect(result.totalFindings).toBe(0);
      expect(result.critical).toBe(0);
      expect(result.high).toBe(0);
      expect(result.warning).toBe(0);
    });

    it('returns empty results when no tabs are open', async () => {
      setupTabs([]);
      const result = await scanner.scanOpenTabs();
      expect(result.totalFindings).toBe(0);
      expect(result.findings).toHaveLength(0);
    });
  });

  // ── Binary file skipping ──────────────────────────────────────────────

  describe('Binary file skipping', () => {
    it('does not scan binary files for content', async () => {
      setupTabs([{
        uri: '/workspace/image.png',
        content: 'AKIAIOSFODNN7EXAMPLE', // Would match if scanned
      }]);
      const result = await scanner.scanOpenTabs();
      // Should not find the "secret" in a .png file content
      const contentFindings = result.findings.filter(f => f.rule !== 'sensitive-file');
      expect(contentFindings.length).toBe(0);
    });
  });
});
