# Tokalator MCP server and CLI

Real Claude BPE token counts, context budgets and Claude Code usage, in Claude Code and your terminal.
Requires Node.js 18 or later.

## Build

```bash
cd tokalator-mcp
npm install
npm run build        # also syncs the model catalog from the extension
```

## In Claude Code

```bash
claude mcp add --transport stdio tokalator -- node /path/to/tokalator-mcp/build/index.js
```

Run `/mcp` in Claude Code: `tokalator` should show as connected.

| Tool | What it does |
|---|---|
| `count_tokens` | Tokens in text or a file |
| `estimate_budget` | Budget breakdown for a list of files |
| `preview_turn` | Next-turn cost and turns left |
| `list_models` | Claude models with context window, max output and rot threshold |
| `claude_code_usage` | Claude Code turns, tokens, cache hits and API-equivalent cost from local logs |

## In the terminal

```bash
npm install -g .     # from tokalator-mcp/
```

| Command | What it does |
|---|---|
| `tokalator count <file>...` or `--text "..."` | Tokens in files or text |
| `tokalator budget <file>...` | Files + system overhead + conversation |
| `tokalator preview <current_tokens>` | Next-turn cost |
| `tokalator models` | Every Claude model and its limits |
| `tokalator usage` | Claude Code usage; `--days`, `--all`, `--project`, `--watch`, `--json` |

Every command takes `--model <id>`. `tokalator --help` shows the default model and every option.

Models and prices come from [`../tokalator-extension-vs/models.json`](../tokalator-extension-vs/models.json), the same catalog the extension uses.

## License

AGPL-3.0-or-later. See [LICENSING.md](../LICENSING.md).
