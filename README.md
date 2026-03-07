# Tokalator

**Count your tokens like beads on an abacus.**

Real-time context budget monitoring for VS Code. Shows where your AI context budget is going, scores tab relevance, and syncs to the active Copilot model automatically — so you always know how much room you have left.

156 marketplace acquisitions · 82.98% page-to-install conversion · 124 unit tests · 3 community sessions (220+ developers)

## The Problem

AI coding assistants have finite context windows. When you have 30 tabs open, your assistant's attention is diluted across irrelevant files — and you can't see what's happening. Context rot sets in silently: the model's performance degrades as conversation turns accumulate stale context.

Tokalator fixes this. Real BPE tokenizers (not guesses), per-file breakdowns, and automatic cleanup.

## Features

### 1. Token Budget Dashboard

Sidebar panel showing your context usage at a glance:

- Budget level: LOW / MEDIUM / HIGH with token counts
- Next turn preview — cost estimate before you send
- Files ranked by relevance to your current task
- One-click tab cleanup
- Per-turn context growth chart
- Budget breakdown: files, system prompt, instructions, conversation, output reserve
- Session summary on activation (last model, turns, peak usage)
- High Contrast theme support

### 2. Model Auto-Sync

Tokalator automatically detects the model active in the Copilot chat window and updates its context window, tokenizer, and rot threshold — no manual selection needed. Switch from Claude Opus to Sonnet in Copilot and the budget numbers update instantly.

### 3. Chat Commands (`@tokalator`)

11 commands covering the full context management workflow:

| Command | Description |
| --- | --- |
| `@tokalator /count` | Token count and budget level |
| `@tokalator /breakdown` | Where tokens are going |
| `@tokalator /optimize` | Close low-relevance tabs |
| `@tokalator /pin <file>` | Pin a file as always-relevant |
| `@tokalator /unpin <file>` | Unpin a file |
| `@tokalator /instructions` | List instruction files with token cost |
| `@tokalator /model [name]` | Show or switch model |
| `@tokalator /compaction` | Per-turn growth and compaction advice |
| `@tokalator /preview` | Preview next turn cost |
| `@tokalator /reset` | Reset session turn counter |
| `@tokalator /exit` | End session and save summary |

### 4. Tab Relevance Scoring

Each open tab is scored R ∈ [0, 1] based on:

| Factor | Weight |
| --- | --- |
| Same language as active file | 0.25 |
| Import relationship | 0.30 |
| Path similarity | 0.20 |
| Edit recency | 0.15 |
| Has diagnostics | 0.10 |

Pinned and active files always score 1.0. Files below the threshold (default 0.3) are flagged as distractors.

### 5. Instruction File Scanner (`/instructions`)

Detects files silently injected into every prompt and shows their real token cost:

`.github/copilot-instructions.md` · `CLAUDE.md` · `AGENTS.md` · `.cursorrules` · `*.instructions.md`

### 6. MCP Server + CLI

Brings Tokalator into Claude Code and terminal workflows. See the [MCP & CLI section](https://tokalator.dev/extension#mcp).

## Tokenizers

| Provider | Models | Tokenizer |
| --- | --- | --- |
| Anthropic | Opus 4.6, Sonnet 4.5/4, Haiku 4.5 | Claude BPE (`@anthropic-ai/tokenizer`) |
| OpenAI | GPT-5.2, GPT-5.1, GPT-5 Mini, GPT-4.1, o3, o4-mini | o200k_base (`js-tiktoken`) |
| Google | Gemini 3 Pro/Flash, 2.5 Pro | Heuristic (~4 chars/token) |

## Supported Models (14 profiles)

Claude Opus 4.6 · Claude Sonnet 4.5 · Claude Sonnet 4 · Claude Haiku 4.5 · GPT-5.2 · GPT-5.2 Codex · GPT-5.1 · GPT-5 Mini · GPT-4.1 · o3 · o4-mini · Gemini 3 Pro · Gemini 3 Flash · Gemini 2.5 Pro

## Usage

1. **Sidebar** — click the abacus icon in the Activity Bar
2. **Chat** — type `@tokalator` in Copilot Chat
3. **Status bar** — live token count in bottom-right (click to refresh)

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `tokalator.model` | `claude-opus-4.6` | Active model (sets window, tokenizer, rot threshold) |
| `tokalator.relevanceThreshold` | `0.3` | Score below which tabs are flagged as distractors |
| `tokalator.windowSize` | `1000000` | Context window override (leave at default to use model's) |
| `tokalator.contextRotWarningTurns` | `20` | Warn after this many chat turns |
| `tokalator.autoRefreshInterval` | `2000` | Dashboard refresh interval (ms) |

## Changelog

### v3.1.2

- Auto-sync model from Copilot chat window — no more manual model selection
- Fix: stale token counts after rapid file switching (pending refresh flag)
- Fix: duplicate tab entries in multi-root workspaces
- Fix: `CLAUDE.md` and `AGENTS.md` now counted in instruction scanner budget
- Fix: pin/unpin event propagation in dashboard

### v3.1.1

- CLI terminal showcase, community session stats, MCP & CLI install section
- Architecture page updated to 6 layers matching implementation

### v3.1.0

- MCP server for Claude Code (stdio transport)
- Standalone CLI: `tokalator count`, `budget`, `preview`, `models`
- 14 model profiles including Gemini 3 and GPT-5.x family

## Requirements

- VS Code 1.99+
- GitHub Copilot or similar AI extension (for chat features)

## License

MIT
