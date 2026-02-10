# Tokalator 🧮

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/vfaraji89.tokalator?style=flat-square&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/vfaraji89.tokalator?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)
[![License](https://img.shields.io/github/license/vfaraji89/tokalator?style=flat-square)](https://github.com/vfaraji89/tokalator/blob/main/LICENSE)

**Count your tokens like beads on an abacus.**

A VS Code extension that shows you where your AI context budget is going — and helps you optimize it. Real-time token counting, cost estimation, prompt caching analysis, and secret detection for AI coding assistants.

---

## 🆕 What's New in v0.4.0

- **🔐 Secret Guardrail** — Detects API keys, passwords, tokens, PEM keys, JWTs, and database URLs before they leak into AI context
- **💰 Cost Estimation** — Per-turn dollar costs, prompt caching savings analysis, and monthly spend projections
- **📊 Caching Analysis** — Model-specific cache discount rates (Anthropic 90%, OpenAI 50%, Google 75%)
- **🎨 Theme Compatibility** — Dashboard works perfectly in all VS Code themes including High Contrast

---

## The Problem

AI coding assistants (Copilot, Claude, etc.) have finite context windows. A common complaint is "context rot," where performance degrades as conversations exceed a certain number of tokens. Opus 4.6 performs markedly better than its predecessors: on the 8-needle 1M variant of MRCR v2, Opus 4.6 scores 76%, whereas Sonnet 4.5 scores just 18.5%. This is a qualitative shift in how much context a model can actually use while maintaining peak performance.

Still, when you have 30 tabs open, your assistant's attention gets diluted across irrelevant files. You can't see what's happening. Until now.

## Features

### 🧮 Token Budget Dashboard

A sidebar panel that shows your context usage at a glance:

- **Budget level** — LOW (good), MEDIUM (warning), or HIGH (critical)
- **Next turn preview** — estimated token cost before you send your next message
- **File list** — ranked by relevance to your current task
- **Budget breakdown** — files, system prompt, instructions, conversation, output reserve
- **One-click cleanup** — close low-relevance tabs instantly
- **Pinned files** — mark files as always-relevant (persists across sessions)
- **Session tracking** — see last session stats on activation

### 💰 Cost Estimation & Caching Analysis

Know exactly what your AI conversations cost:

- **Per-turn cost** — input and output costs based on model pricing
- **Prompt caching savings** — shows how much you'd save with caching enabled
- **Blended rates** — calculates effective cost with cached vs uncached tokens
- **Session projections** — daily and monthly cost estimates based on usage patterns
- **14 models supported** — accurate pricing for Claude, GPT, Gemini families

| Provider | Cache Discount | Caching Type |
|----------|---------------|--------------|
| Anthropic | 90% | Prompt caching (explicit) |
| OpenAI | 50% | Automatic caching |
| Google | 75% | Context caching |

### 🔐 Secret Guardrail

Prevents sensitive credentials from leaking into AI context:

- **25+ detection patterns** — AWS keys, GitHub tokens, OpenAI/Anthropic keys, Stripe, Slack, npm tokens
- **File scanning** — finds `.env`, `.pem`, `.key` and other sensitive files in open tabs
- **Dashboard alerts** — red warning badges when secrets are detected
- **Redacted display** — shows secret type without exposing values
- **Configurable** — enable/disable via `tokalator.secretGuard` setting

### 💬 Chat Commands (`@tokalator`)

| Command | Description |
|---------|-------------|
| `@tokalator /count` | Current token count and budget level |
| `@tokalator /breakdown` | See where tokens are going |
| `@tokalator /optimize` | Close low-relevance tabs |
| `@tokalator /pin <file>` | Pin a file as always-relevant |
| `@tokalator /unpin <file>` | Unpin a file |
| `@tokalator /instructions` | List instruction files and their token cost |
| `@tokalator /model [name]` | Show or switch the active model |
| `@tokalator /compaction` | Per-turn growth and compaction advice |
| `@tokalator /preview` | Preview token cost before sending |
| `@tokalator /secrets` | Scan open files for exposed secrets and credentials |
| `@tokalator /cost` | Cost estimation, caching savings, and monthly projections |
| `@tokalator /reset` | Reset session (clear turn counter) |
| `@tokalator /exit` | End session and save summary |

### 🎯 Smart Relevance Scoring

Files are scored based on:
- Same language as active file
- Import relationships (active file imports this tab)
- Path similarity (nearby in directory tree)
- Recently edited
- Has diagnostics (errors you're debugging)

### 📐 14 AI Model Profiles

Pre-configured context windows and pricing for the latest models:

| Provider | Models |
|----------|--------|
| Anthropic | Opus 4.6 (1M), Sonnet 4.5 (200K), Sonnet 4 (200K), Haiku 4.5 (200K) |
| OpenAI | GPT-5.2 (256K), GPT-5.2 Codex (256K), GPT-5.1 (256K), GPT-5 Mini (256K), GPT-4.1 (1M), o3 (200K), o4-mini (200K) |
| Google | Gemini 3 Pro (1M), Gemini 3 Flash (1M), Gemini 2.5 Pro (1M) |

## Usage

1. **Sidebar**: Click the abacus icon (🧮) in the Activity Bar
2. **Chat**: Type `@tokalator` in Copilot/Claude Chat
3. **Status Bar**: Quick budget indicator in bottom-right

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `tokalator.model` | `claude-opus-4.6` | AI model for budget calculation (14 models available) |
| `tokalator.relevanceThreshold` | `0.3` | Tabs below this score are marked low-relevance |
| `tokalator.windowSize` | `1000000` | Context window size in tokens |
| `tokalator.contextRotWarningTurns` | `20` | Warn after this many chat turns |
| `tokalator.autoRefreshInterval` | `2000` | Dashboard refresh interval (ms) |
| `tokalator.secretGuard` | `true` | Enable secret detection guardrail |

## Architecture

```
┌─────────────────────────────────────────┐
│  ContextMonitor (core engine)           │
│  ├─ Real BPE tokenizers (Claude/GPT)    │
│  ├─ SecretScanner (25+ patterns)        │
│  ├─ CostEstimator (pricing + caching)   │
│  └─ Relevance scoring engine            │
├─────────────────┬───────────────────────┤
│  Dashboard      │  Chat Participant     │
│  (Webview)      │  (@tokalator)         │
│  Sidebar panel  │  13 slash commands    │
└─────────────────┴───────────────────────┘
```

## Known Limitations

- Real BPE tokenizers for Claude and OpenAI; Gemini uses heuristic (~1 token per 4 characters)
- Import parsing uses regex, which misses some edge cases (multi-line imports, dynamic imports)
- Relevance weights are not scientifically tuned
- Conversation cost estimated at ~800 tokens/turn (varies by message length)
- Cost estimates based on public API pricing (actual cost may vary with enterprise agreements)

## Requirements

- VS Code 1.99+
- GitHub Copilot or similar AI extension (for chat features)

## Contributing

Contributions are welcome! Please see the [GitHub repository](https://github.com/vfaraji89/tokalator) for details.

## License

MIT — see [LICENSE](LICENSE) for details.
