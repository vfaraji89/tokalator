# Tokalator

**Count your tokens like beads on an abacus.**

Real-time context budget monitoring for VS Code. Shows where your AI context budget is going, scores tab relevance, compares per-turn cost across models, and syncs to the active Copilot model automatically, so you always know how much room you have left.

## The Problem

AI coding assistants have finite context windows. When you have 30 tabs open, your assistant's attention is diluted across irrelevant files, and you can't see what's happening. Context rot sets in silently: the model's performance degrades as conversation turns accumulate stale context.

Tokalator makes this visible. Real BPE tokenizers (not guesses), per-file breakdowns, measured per-turn growth, and automatic cleanup.

## Features

### 1. Token Budget Dashboard

Sidebar panel showing your context usage at a glance:

- Budget level: LOW / MEDIUM / HIGH with token counts
- Budget breakdown: files, system prompt, instructions, conversation, output reserve
- Files ranked by relevance to your current task
- One-click tab cleanup
- Per-turn context growth chart
- Session summary on activation (last model, turns, peak usage)
- High Contrast theme support

### 2. Context Engineering Stats

A dedicated panel that quantifies context rot from your actual session:

- Context-window percentage used
- Turns-to-rot estimate
- Measured tokens/turn growth (from real turn history, not defaults)
- Estimated turns left before the rot threshold

### 3. API Cost Simulation + Price Compare

- Next-turn cost estimate before you send, computed from input tokens and the model's pricing rates
- Collapsible price-comparison table across all models, sorted ascending by per-turn cost
- "vs Current" column showing the savings delta against your active model
- Dynamic pricing catalog: remote fetch with ETag caching and 24h TTL, bundled fallback so prices stay current without an extension update
- `Tokalator: Refresh Pricing Catalog` command to fetch the latest rates on demand

### 4. Model Auto-Sync

Tokalator detects the model active in the Copilot chat window and updates its context window, tokenizer, and rot threshold automatically. Switch models in Copilot and the budget numbers update on the next interaction (no manual dropdown).

### 5. Chat Commands (`@tokalator`)

12 commands covering the full context management workflow:

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
| `@tokalator /terminology-gen` | Scan terminology sources and show glossary compression potential |
| `@tokalator /reset` | Reset session turn counter |
| `@tokalator /exit` | End session and save summary |

### 6. Tab Relevance Scoring

Each open tab is scored R ∈ [0, 1] based on:

| Factor | Weight |
| --- | --- |
| Same language as active file | 0.25 |
| Import relationship | 0.30 |
| Path similarity | 0.20 |
| Edit recency | 0.15 |
| Has diagnostics | 0.10 |

Pinned and active files always score 1.0. Files below the threshold (default 0.3) are flagged as distractors.

### 7. Instruction File Scanner (`/instructions`)

Detects files injected into every prompt and shows their real token cost:

`.github/copilot-instructions.md` · `CLAUDE.md` · `AGENTS.md` · `.cursorrules` · `*.instructions.md`

### 8. Generate Glossary (`/terminology-gen`)

Scans the workspace's Markdown docs for terminology sources, measures their real token cost, and estimates how much you could save by compressing them into a shared glossary. Free; Pro features (Secure Workspace, SKILL.md, AI Settings) are previewed in the dashboard and link to [tokalator.ai](https://tokalator.ai).

### 9. MCP Server + CLI

Brings Tokalator into Claude Code and terminal workflows. See the [MCP & CLI section](https://tokalator.wiki/extension#mcp).

## Tokenizers

| Provider | Models | Tokenizer |
| --- | --- | --- |
| Anthropic | Opus 4.8, Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5 | Claude BPE (`@anthropic-ai/tokenizer`) |
| OpenAI | GPT-5.5, GPT-5.4, GPT-5.4 Mini, GPT-5.4 Nano, GPT-5.3 Codex, o4-mini | o200k_base (`js-tiktoken`) |
| Google | Gemini 3.5 Flash, Gemini 3.1 Pro, Gemini 3.1 Flash-Lite, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash-Lite | Heuristic (~4 chars/token) |

## Supported Models

Claude Opus 4.8 · Claude Opus 4.7 · Claude Opus 4.6 · Claude Sonnet 4.6 · Claude Haiku 4.5 · GPT-5.5 · GPT-5.4 · GPT-5.4 Mini · GPT-5.4 Nano · GPT-5.3 Codex · o4-mini · Gemini 3.5 Flash · Gemini 3.1 Pro · Gemini 3.1 Flash-Lite · Gemini 2.5 Pro · Gemini 2.5 Flash · Gemini 2.5 Flash-Lite

## Usage

1. **Sidebar**: click the abacus icon in the Activity Bar
2. **Chat**: type `@tokalator` in Copilot Chat
3. **Status bar**: live token count in bottom-right (click to refresh)

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `tokalator.model` | `claude-opus-4.8` | Active model fallback (window, tokenizer, rot threshold). Auto-synced from Copilot when available |
| `tokalator.relevanceThreshold` | `0.3` | Score below which tabs are flagged as distractors |
| `tokalator.windowSize` | `1000000` | Context window override (leave at default to use model's) |
| `tokalator.contextRotWarningTurns` | `20` | Warn after this many chat turns |
| `tokalator.autoRefreshInterval` | `2000` | Dashboard refresh interval (ms) |
| `tokalator.enableSessionLogging` | `false` | Opt-in anonymized session logging for research (aggregate counts only, no filenames) |

## Changelog

Latest: **3.1.7**: Context Engineering stats panel, Generate Glossary command, auto-detected model, collapsible price compare with "vs Current" savings, updated model catalog with May 2026 pricing.

See [CHANGELOG.md](CHANGELOG.md) for the full history.

## Requirements

- VS Code 1.99+
- GitHub Copilot or similar AI extension (for chat features)

## License

MIT
