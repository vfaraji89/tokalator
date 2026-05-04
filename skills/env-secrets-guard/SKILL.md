---
name: env-secrets-guard
description: Prevent .env files and sensitive credentials from leaking into AI agent context windows. Scans open files, blocks secret patterns, and enforces secure configuration for VS Code extensions that interact with LLM APIs.
user-invokable: true
disable-model-invocation: false
license: MIT
metadata:
  author: vfaraji89
  version: 1.0.0
  workshop: "Agent Skills '26 @ CAIS 2026"
---

# Environment Secrets Guard Skill

Prevents accidental exposure of environment variables, API keys, and credentials when AI agents read project files into their context window.

## Problem

AI coding assistants read open files into their context. If `.env`, `.pem`, or credential files are open (or referenced in imports), their contents become part of the LLM request payload sent to external APIs. This creates:

1. **Credential leakage** — secrets sent to model provider servers
2. **Context pollution** — long API keys waste tokens without contributing to task
3. **Persistence risk** — secrets may be cached in conversation history or training data

## Detection Patterns

### File-Level Blocks (never read these into context)

```
.env
.env.local
.env.production
.env.*.local
*.pem
*.key
id_rsa*
*.p12
*.pfx
credentials.json
service-account*.json
```

### Content-Level Patterns (redact if found in any file)

| Pattern | Severity | Example |
|---------|----------|---------|
| `AKIA[0-9A-Z]{16}` | critical | AWS Access Key |
| `sk-[a-zA-Z0-9]{20,}` | critical | OpenAI/Anthropic API Key |
| `ghp_[a-zA-Z0-9]{36}` | critical | GitHub PAT |
| `glpat-[a-zA-Z0-9-]{20}` | high | GitLab PAT |
| `xox[bpors]-[a-zA-Z0-9-]+` | high | Slack Token |
| `-----BEGIN.*PRIVATE KEY-----` | critical | Private Key |
| `mongodb(\+srv)?://[^:]+:[^@]+@` | high | MongoDB URI with creds |
| `postgres://[^:]+:[^@]+@` | high | PostgreSQL URI with creds |
| `AIza[0-9A-Za-z_-]{35}` | high | Google API Key |
| `[0-9a-f]{32,64}` (in env assignment) | medium | Generic hex secret |

## Rules

### For VS Code Extensions

When building or configuring a VS Code extension that reads workspace files:

1. **Maintain a blocklist** — check every file path against blocked patterns before reading
2. **Scan content before sending** — regex-match content against secret patterns before including in LLM context
3. **Redact, don't skip** — replace detected secrets with `[REDACTED:type]` to preserve structure
4. **Warn the user** — surface a notification when secrets are detected in open tabs
5. **Never log secrets** — session logs must strip any matched patterns before writing

### For Agent Configuration

When setting up `.env` for extensions or MCP servers:

```bash
# .env files must NEVER be committed
# Verify .gitignore contains:
.env*

# For VS Code extensions, use VS Code's SecretStorage API:
# context.secrets.store('apiKey', value)
# context.secrets.get('apiKey')

# For MCP servers, pass secrets via environment only:
# .mcp.json should reference env vars, not literal values
```

### Extension Settings Security

```jsonc
// settings.json — NEVER store secrets here (synced to cloud)
{
  "tokalator.model": "claude-opus-4-6",  // safe: not a secret
  // "tokalator.apiKey": "sk-..."  // FORBIDDEN: use SecretStorage
}
```

### Safe .env Template

Generate `.env.example` (committed) alongside `.env` (gitignored):

```bash
# .env.example — safe to commit, documents required variables
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
DATABASE_URL=
```

## Integration with Tokalator Extension

The extension's `contextMonitor.ts` should apply this skill before computing token budgets:

```typescript
// Pseudo-implementation for secret filtering
function isSecretFile(filePath: string): boolean {
  const blocked = ['.env', '.pem', '.key', 'id_rsa', '.p12', 'credentials.json'];
  const basename = path.basename(filePath);
  return blocked.some(p => basename.includes(p) || basename.startsWith(p));
}

function redactSecrets(content: string): string {
  const patterns = [
    { re: /AKIA[0-9A-Z]{16}/g, label: 'AWS_KEY' },
    { re: /sk-[a-zA-Z0-9]{20,}/g, label: 'API_KEY' },
    { re: /ghp_[a-zA-Z0-9]{36}/g, label: 'GITHUB_PAT' },
    { re: /-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/g, label: 'PRIVATE_KEY' },
  ];
  for (const { re, label } of patterns) {
    content = content.replace(re, `[REDACTED:${label}]`);
  }
  return content;
}
```

## Auto-Configuration Checklist

When this skill is invoked, verify:

- [ ] `.gitignore` contains `.env*`
- [ ] No `.env` files exist in git history (`git log --all --diff-filter=A -- '*.env*'`)
- [ ] Extension uses `SecretStorage` API (not settings.json) for credentials
- [ ] MCP server config (`.mcp.json`) references no literal secrets
- [ ] `package.json` scripts don't embed secrets in commands
- [ ] CI/CD uses repository secrets (not hardcoded in workflow files)

## Token Savings

Blocking a typical `.env` file (15 variables, ~800 tokens) from context:
- Saves 800 tokens per turn where the file would otherwise be included
- Prevents ~20,000 tokens of leaked content across a 25-turn session
- Zero cost to apply (file is simply excluded from reading)
