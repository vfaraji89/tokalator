# Tokalator

**Open source** · AGPL-3.0-or-later · [tokalator.wiki](https://tokalator.wiki)

Context engineering for AI coding assistants. Tokalator shows where your context budget goes, which open tabs are relevant to the task, what a turn is likely to cost on your model, and whether AI agents can read your secrets. It works with GitHub Copilot, Claude, and other assistants in VS Code.

Tokalator 4.1 merges the former Tokalator Pro into the open-source extension. Every feature is free.

## Features

### Context budget dashboard

- Budget level (low, medium, high) with tokens used against the model's context window
- Breakdown by files, system prompt, instructions, conversation, and output reserve
- Open tabs ranked by relevance, with one-click cleanup of low-relevance tabs
- Turn analytics from your own turn history, and a per-turn input cost estimate
- Last-session summary on activation

### Tab relevance scoring

Each open tab gets a score from 0 to 1:

| Factor | Weight |
| --- | --- |
| Same language as the active file | 0.25 |
| Import relationship | 0.30 |
| Path similarity | 0.20 |
| Edit recency | 0.15 |
| Has diagnostics | 0.10 |

Pinned and active files always score 1. Tabs below the threshold (default 0.3) are flagged as distractors.

### Pricing and model sync

- Bundled model catalog for current Claude, GPT, and Gemini models, refreshed from a remote catalog with a bundled fallback
- Price watch: notifies you when a model's price changes and shows the impact on your recent usage
- Detects the model active in Copilot Chat and updates the context window and tokenizer

### Workspace security

`Tokalator: Secure Workspace` checks whether AI agents are told to stay away from secret files and generates the missing settings for Claude Code, Copilot, VS Code, and `.gitignore`. Settings files that cannot be parsed are left unchanged.

### Generators

- `/skill-gen` drafts a `SKILL.md` from your project
- `/settings-gen` generates GitHub and VS Code AI settings files
- `/instructions` lists the instruction files injected into every prompt and their token cost

### Chat commands (`@tokalator`)

| Command | Description |
| --- | --- |
| `/count` | Token count and budget level |
| `/breakdown` | Where tokens are going |
| `/optimize` | Close low-relevance tabs |
| `/pin <file>`, `/unpin <file>` | Pin or unpin a file |
| `/instructions` | Instruction files and their token cost |
| `/model [name]` | Show or switch the model |
| `/compaction` | Per-turn growth and compaction advice |
| `/preview` | Preview the next turn's input |
| `/secure` | Workspace security audit |
| `/skill-gen`, `/settings-gen` | Generators |
| `/pricewatch` | Price changes and their impact |
| `/reset`, `/exit` | Reset the turn counter, end the session |

### MCP server and CLI

`tokalator-mcp` brings token counting and budget estimates into Claude Code and the terminal. See [tokalator.wiki](https://tokalator.wiki/extension#mcp).

## How the numbers are made

- **Tokens** are counted with `@anthropic-ai/tokenizer` for Claude, `js-tiktoken` (o200k_base) for OpenAI models, and about 4 characters per token for Gemini. Claude counts are approximate for newer models.
- **Cost** is an input-only estimate. Output tokens and cache hits cannot be observed from the editor, so they are not priced.
- **Network**: the only request is the pricing catalog, fetched from GitHub. Session logging is opt-in and stays on your machine.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `tokalator.model` | catalog default | Fallback model when no chat model is detected |
| `tokalator.relevanceThreshold` | `0.3` | Score below which tabs are flagged |
| `tokalator.windowSize` | `0` | Context window override; 0 uses the model's window |
| `tokalator.autoRefreshInterval` | `2000` | Dashboard refresh interval in ms |
| `tokalator.enableSessionLogging` | `false` | Opt-in local session logging with aggregate counts only |

## Tokalator Bead

Context budgets describe the model. [Tokalator Bead](https://tokalator.ai) describes the person: turn economy, oversight of agent changes, and skill retention, from your local Claude Code and Codex sessions. It is a separate extension.

## License

AGPL-3.0-or-later. A commercial license is available; see `LICENSING.md` in the repository.
