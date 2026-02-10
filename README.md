# Tokalator

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/vfaraji89.tokalator?style=flat-square&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/vfaraji89.tokalator?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)
[![License](https://img.shields.io/github/license/vfaraji89/tokalator?style=flat-square)](https://github.com/vfaraji89/tokalator/blob/main/LICENSE)

**Count your tokens like beads on an abacus.**

A VS Code extension that shows you where your AI context budget is going — and helps you optimize it. Real-time token counting, cost estimation, prompt caching analysis, and secret detection for AI coding assistants.

---

## What's New in v0.4.0

- **Secret Guardrail** — Detects API keys, passwords, tokens, PEM keys, JWTs, and database URLs before they leak into AI context
- **Cost Estimation** — Per-turn dollar costs, prompt caching savings analysis, and monthly spend projections
- **Caching Analysis** — Model-specific cache discount rates (Anthropic 90%, OpenAI 50%, Google 75%)
- **Optimization Report** — Full context health analysis with prioritized suggestions across tokens, cost, security, and workflow
- **Theme Compatibility** — Dashboard works in all VS Code themes including High Contrast

---

## The Problem

AI coding assistants have finite context windows. When you have 30 tabs open, your assistant's attention gets diluted across irrelevant files — and you can't see what's happening. Tokalator makes the invisible visible.

## Quick Start

1. Click the Tokalator icon in the Activity Bar to open the sidebar dashboard
2. Type `@tokalator` in Copilot or Claude Chat for inline commands
3. The status bar shows a quick budget indicator at all times

## Features

### Token Budget Dashboard

A sidebar panel that shows your context usage at a glance:

- **Budget level** — LOW, MEDIUM, or HIGH based on context window usage
- **Next turn preview** — estimated token cost before you send your next message
- **File list** — every open file ranked by relevance score with token counts
- **Budget breakdown** — files, system prompt, instructions, conversation, output reserve
- **Pinned files** — mark files as always-relevant (persists across sessions)
- **Secret alerts** — red badges when credentials are detected in open files
- **Cost card** — per-turn cost and caching savings at a glance

### Chat Commands

All commands are available through `@tokalator` in VS Code Chat.

| Command | What it does |
|---------|-------------|
| `/count` | Current token count and budget level |
| `/breakdown` | See where tokens are going by category |
| `/optimize` | Full optimization report — tokens, cost, security, and health analysis |
| `/optimize --apply` | Close low-relevance tabs (the old optimize behavior) |
| `/pin <file>` | Pin a file so it's always included in context |
| `/unpin <file>` | Remove a pin |
| `/instructions` | List instruction files and their token cost |
| `/model [name]` | Show or switch the active AI model |
| `/compaction` | Per-turn token growth and compaction advice |
| `/preview` | Preview token cost before sending your next message |
| `/secrets` | Scan open files for exposed secrets and credentials |
| `/cost` | Cost estimation, caching savings, and monthly projections |
| `/reset` | Reset session state (clear turn counter) |
| `/exit` | End session and save summary |

### Cost Estimation and Caching

Know what your AI conversations cost:

- Per-turn input and output costs based on model pricing
- Prompt caching savings — how much you'd save with caching enabled
- Blended cost calculation with cached vs uncached token rates
- Session projections — daily and monthly cost estimates
- 14 models with accurate pricing for Claude, GPT, and Gemini

| Provider | Cache Discount | Caching Type |
|----------|---------------|--------------|
| Anthropic | 90% | Prompt caching (explicit breakpoints) |
| OpenAI | 50% | Automatic caching (repeated prefixes) |
| Google | 75% | Context caching (explicit, stored) |

### Secret Guardrail

Prevents sensitive credentials from leaking into AI context:

- 25+ detection patterns — AWS keys, GitHub tokens, OpenAI/Anthropic keys, Stripe, Slack, npm tokens, PEM blocks, JWTs, database URLs, bearer tokens
- Flags `.env`, `.pem`, `.key`, and other sensitive filenames in open tabs
- Redacted display — shows the secret type without exposing values
- Enable or disable via `tokalator.secretGuard`

### Relevance Scoring

Every open file gets a relevance score (0 to 1) based on:

- Same language as the active file
- Import relationships — the active file imports this tab
- Path similarity — nearby in the directory tree
- Recently edited
- Has diagnostics — errors you're currently debugging
- Pinned — always scores 1.0

### Model Profiles

Pre-configured context windows and pricing for 14 models:

| Provider | Models |
|----------|--------|
| Anthropic | Opus 4.6 (1M), Sonnet 4.5 (200K), Sonnet 4 (200K), Haiku 4.5 (200K) |
| OpenAI | GPT-5.2 (256K), Codex (256K), GPT-5.1 (256K), 5 Mini (256K), GPT-4.1 (1M), o3 (200K), o4-mini (200K) |
| Google | Gemini 3 Pro (1M), Gemini 3 Flash (1M), Gemini 2.5 Pro (1M) |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `tokalator.model` | `claude-opus-4.6` | AI model for budget calculation |
| `tokalator.relevanceThreshold` | `0.3` | Tabs below this score are marked low-relevance |
| `tokalator.windowSize` | `1000000` | Context window size in tokens |
| `tokalator.contextRotWarningTurns` | `20` | Warn after this many chat turns |
| `tokalator.autoRefreshInterval` | `2000` | Dashboard refresh interval in milliseconds |
| `tokalator.secretGuard` | `true` | Enable secret detection guardrail |

## Architecture

```
ContextMonitor (core engine)
  ├─ BPE tokenizers — Claude (Anthropic), GPT (o200k_base), Gemini (heuristic)
  ├─ SecretScanner — 25+ regex patterns, 3 severity tiers
  ├─ CostEstimator — per-turn pricing, caching analysis, session projections
  ├─ ContextOptimizer — 9 analyzers, scored optimization plan
  └─ Relevance scoring — imports, language, path, recency, diagnostics

Dashboard (Webview sidebar)          Chat Participant (@tokalator)
  Real-time token gauge                14 slash commands
  File relevance list                  Optimization reports
  Cost and secret cards                Inline budget management
```

## Known Limitations

- BPE tokenizers for Claude and OpenAI; Gemini uses a heuristic approximation
- Import parsing uses regex — misses multi-line and dynamic imports
- Conversation overhead estimated at ~800 tokens per turn
- Cost estimates based on public API pricing; enterprise rates may differ

## Requirements

- VS Code 1.99 or later
- GitHub Copilot or similar AI extension for chat features

## Contributing

Contributions welcome. See the [GitHub repository](https://github.com/vfaraji89/tokalator) for details.

## License

MIT — see [LICENSE](LICENSE).
