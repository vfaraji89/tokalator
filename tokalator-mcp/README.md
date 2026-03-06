# tokalator-mcp

Real Claude BPE token counting for Claude Code — as an MCP server and CLI.

**Requires:** Node.js 18+

---

## Build

```bash
cd tokalator-mcp
npm install
npm run build
```

---

## CLI

### Install globally

```bash
cd tokalator-mcp
npm install -g .
```

### Usage

```bash
# Count tokens in a file (real Claude BPE)
tokalator count src/main.ts
tokalator count --model claude-sonnet-4.5 src/index.ts src/utils.ts

# Count tokens in raw text
tokalator count --text "your prompt here"

# Full budget breakdown: files + system overhead + conversation
tokalator budget src/index.ts src/utils.ts
tokalator budget --model claude-haiku-4.5 --turns 10 --instructions 2 src/**/*.ts

# Preview next-turn token cost
tokalator preview 42000
tokalator preview --model claude-sonnet-4.5 18000

# List all Claude model profiles
tokalator models
```

### Options

| Option | Description | Default |
|---|---|---|
| `--model <id>` | Claude model ID | `claude-opus-4.6` |
| `--turns <n>` | Chat turns so far (for budget overhead) | `0` |
| `--instructions <n>` | Instruction files attached | `0` |
| `--text "<text>"` | Count tokens in a string instead of a file | — |

---

## MCP Server (Claude Code)

The `.mcp.json` at the repo root registers the server automatically when you open this workspace in Claude Code.

### Manual registration

```bash
claude mcp add --transport stdio tokalator -- node /path/to/tokalator-mcp/build/index.js
```

### Tools exposed

| Tool | Description |
|---|---|
| `count_tokens` | Count tokens in text or a file |
| `estimate_budget` | Full budget breakdown for a list of files |
| `preview_turn` | Preview next-turn token cost and turns remaining |
| `list_models` | Show all Claude model profiles |

### Verify in Claude Code

```
/mcp
```

The `tokalator` server should appear as connected.

---

## Models

| Model | Context | Max Output | Rot threshold |
|---|---|---|---|
| `claude-opus-4.6` | 1M | 32K | 40 turns |
| `claude-sonnet-4.5` | 200K | 16K | 20 turns |
| `claude-sonnet-4` | 200K | 16K | 20 turns |
| `claude-haiku-4.5` | 200K | 64K | 15 turns |
