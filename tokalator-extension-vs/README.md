# Tokalator

**Open source** · AGPL-3.0-or-later · [tokalator.ai](https://tokalator.ai)

See how much of the context window each turn uses, which open tabs matter, what your Claude Code sessions cost at API rates, and whether AI agents can read your secrets. Works with GitHub Copilot, Claude Code, and other assistants in VS Code.

![Tokalator dashboard: context budget, model switching, pinning, tab cleanup, and live Claude Code tracking](https://tokalator.ai/screenshots/dashboard-demo.gif)

[Try the dashboard in your browser](https://tokalator.ai/extension) · [Changelog](https://github.com/vfaraji89/tokalator/blob/main/tokalator-extension-vs/CHANGELOG.md)

## What it tracks

| Assistant | What Tokalator sees | Cost |
| --- | --- | --- |
| Claude Code (VS Code extension and CLI) | Turns, requests, input, output, and cache tokens, cache hit rate, and context size per turn, read from Claude Code's local logs and refreshed automatically | API-equivalent cost from the logged token counts |
| GitHub Copilot Chat | The active chat model (context window and prices switch to match) and `@tokalator` turns | Input-only estimate: VS Code does not expose Copilot's token usage to other extensions |
| Any assistant | Open tabs, pinned files, instruction files, and the context budget in the editor | Input-only estimate at catalog rates |

## What's new in 4.1.1

- **Claude Code tracking.** The dashboard reads Claude Code session logs from both the CLI and the VS Code extension: turns, requests, cache hit rate, context size per turn, and API-equivalent cost. It refreshes on its own every 15 seconds while the sidebar is open, without chat mentions or handoffs.
- **Every current model.** Claude Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1, and Mythos 5.1; GPT-6 Astra, GPT-6.1 Sol, and GPT-6 Luna; Gemini 3.8 Flash. 32 models in total, with prices rechecked against the provider pages on 2026-10-10.
- **Long-context pricing.** Input rates switch above provider thresholds: Claude Haiku 5.5 above 100K tokens, GPT-5.4 and later above 272K, and Gemini 3.1 Pro above 200K.
- **A smoother dashboard.** Sections update in place without flicker, values animate, and sections collapse and remember their state. Every action works from the keyboard, and motion turns off when your system asks for reduced motion.
- **Opt-in telemetry you control.** Telemetry is off by default and gated by VS Code's telemetry setting. Show, export, or delete your data with one command.

## Features

### Context budget

- Tokens used against the active model's context window, with a low, medium, or high level
- Breakdown by files, system prompt, instructions, conversation, and output reserve
- Turn Analytics: context growth per turn, next-turn estimate, and turns remaining before the window fills
- Turn Cost: an input-only estimate at catalog rates, including long-context thresholds

### Claude Code

- Today's turns, requests, and API-equivalent cost, plus the last 7 days
- Last session: model, input and output tokens, and cache reads and writes
- Cache hit rate and the split between the CLI and the VS Code extension
- Context size per turn feeds Turn Analytics and Context Growth when you are not using `@tokalator`
- Reads `~/.claude/projects` (or `CLAUDE_CONFIG_DIR`) on your machine only. Turn it off with `tokalator.claudeCode.enabled`.

**API-equivalent** means what those tokens would cost at API list prices. If you use Claude Code with a Pro, Max, or Team subscription, you are not billed per token, so read it as the value of your usage, not your bill.

### Tab relevance

Each open tab gets a score from 0 to 1:

| Factor | Weight |
| --- | --- |
| Same language as the active file | 0.25 |
| Import relationship | 0.30 |
| Path similarity | 0.20 |
| Edit recency | 0.15 |
| Has diagnostics | 0.10 |

Pinned and active files always score 1. Tabs below the threshold (default 0.3) are flagged, and one click closes them.

### Models and pricing

- Bundled catalog of current Claude, GPT, and Gemini models, synced daily from GitHub with a bundled fallback
- Detects the model active in Copilot Chat and offers the other available models as one-tap chips
- Price Watch tells you when a model's price changes and what that means for your recent usage

### Workspace security

`Tokalator: Secure Workspace` finds secret files and checks each one against Claude Code `Read()` deny rules (project, local, and user settings), VS Code `search.exclude`, and your git ignore rules. The dashboard shows how many are covered. Apply All merges the missing rules, adds a Copilot instruction, and verifies again. It never overwrites a settings file it cannot parse, and stays quiet when there is nothing to protect. Copilot agent mode can still open a file directly; the instruction asks it not to.

### Code maps

`Tokalator: Generate Code Maps` (or `/codemap`) writes `GLOSSARY.md`, every declaration with a source link and its documented purpose, and `SITE-MAP.md`, packages, modules, routes, and imports by module. Agents read them to find the right files before opening source. Built locally, with no model calls.

### Generators

- `/skill-gen` writes an Agent Skill to `.claude/skills/<name>/SKILL.md` (Claude Code and VS Code) or `.agents/skills/` (Codex and VS Code)
- `/settings-gen` generates `AGENTS.md`, a `CLAUDE.md` that imports it, and Copilot instructions, with your real build and test commands
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
| `/codemap` | Generate GLOSSARY.md and SITE-MAP.md |
| `/pricewatch` | Price changes and their impact |
| `/reset`, `/exit` | Reset the turn counter, end the session |

### MCP server and CLI

`tokalator-mcp` brings token counting, budget estimates, and turn previews into Claude Code and the terminal. See [tokalator.ai/extension](https://tokalator.ai/extension#mcp).

## How the numbers are made

- **Tokens** are counted with Anthropic's open tokenizer for Claude, `js-tiktoken` (o200k_base) for OpenAI models, and about 4 characters per token for Gemini. Claude counts are approximate: Claude Opus 4.7 and newer models split the same text into roughly 1.0 to 1.35 times as many tokens.
- **Editor cost** is input only, because output tokens and cache hits cannot be observed from the editor.
- **Claude Code cost** uses the token counts recorded in Claude Code's own logs, priced at catalog rates for input, output, cache reads, and 5-minute and 1-hour cache writes.

## Privacy and telemetry

- Everything runs locally. The only network request by default is the daily pricing catalog download from GitHub.
- Telemetry is **off by default**. If you opt in, and VS Code telemetry is also on, the extension sends anonymous daily counts: features used, model IDs, and Claude Code totals. It never sends code, file names, paths, or prompts.
- `Tokalator: Show Telemetry Data` shows exactly what would be sent. `Export My Telemetry Data` and `Delete My Telemetry Data` give you access and erasure.
- Details: [tokalator.ai/privacy](https://tokalator.ai/privacy#telemetry).

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `tokalator.model` | `claude-opus-5-5` | Fallback model when no chat model is detected |
| `tokalator.relevanceThreshold` | `0.3` | Score below which tabs are flagged |
| `tokalator.windowSize` | `0` | Context window override; 0 uses the model's window |
| `tokalator.autoRefreshInterval` | `2000` | Dashboard refresh interval in ms |
| `tokalator.enableSessionLogging` | `false` | Opt-in local session logging with aggregate counts only |
| `tokalator.claudeCode.enabled` | `true` | Show Claude Code usage from local session logs |
| `tokalator.telemetry.enabled` | `false` | Share anonymous daily usage counts (opt-in) |

## Feedback

Run `Tokalator: Send Feedback` to open a prefilled GitHub issue, or [open one directly](https://github.com/vfaraji89/tokalator/issues).

## License

AGPL-3.0-or-later. A commercial license is available; see `LICENSING.md` in the repository. "Tokalator" and its logo are trademarks of the copyright holder.
