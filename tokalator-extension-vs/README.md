# Tokalator 🧮

**Count your tokens like beads on an abacus.**

A VS Code extension that shows you where your AI context budget is going — and helps you optimize it.

## The Problem

AI coding assistants (Copilot, Claude, etc.) have finite context windows. A common complaint is "context rot," where performance degrades as conversations exceed a certain number of tokens. Opus 4.6 performs markedly better than its predecessors: on the 8-needle 1M variant of MRCR v2, Opus 4.6 scores 76%, whereas Sonnet 4.5 scores just 18.5%. This is a qualitative shift in how much context a model can actually use while maintaining peak performance.

Still, when you have 30 tabs open, your assistant's attention gets diluted across irrelevant files. You can't see what's happening. Until now.

## Features

### Token Budget Dashboard

A sidebar panel that shows your context usage at a glance:

- **Budget level** — LOW (good), MEDIUM (warning), or HIGH (critical)
- **File list** — ranked by relevance to your current task
- **One-click cleanup** — close low-relevance tabs instantly
- **Pinned files** — mark files as always-relevant (persists across sessions)

### Chat Commands (`@tokens`)

| Command | Description |
|---------|-------------|
| `@tokens /count` | Current token count and budget level |
| `@tokens /breakdown` | See where tokens are going |
| `@tokens /optimize` | Close low-relevance tabs |
| `@tokens /pin <file>` | Pin a file as always-relevant |

### Smart Relevance Scoring

Files are scored based on:
- Same language as active file
- Import relationships (active file imports this tab)
- Path similarity (nearby in directory tree)
- Recently edited
- Has diagnostics (errors you're debugging)

### What We Fixed

- **No fake precision** — shows LOW/MEDIUM/HIGH instead of meaningless "67.3%"
- **Memory cleanup** — token cache clears when documents close
- **Turn counter logic** — read-only commands don't inflate the counter
- **Persistent pins** — pinned files survive VS Code restart

## Usage

1. **Sidebar**: Click the abacus icon (🧮) in the Activity Bar
2. **Chat**: Type `@tokens` in Copilot/Claude Chat
3. **Status Bar**: Quick budget indicator in bottom-right

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `tokalator.relevanceThreshold` | `0.3` | Tabs below this are marked low-relevance |
| `tokalator.windowSize` | `1000000` | Context window size in tokens (1M for Opus 4.6) |
| `tokalator.contextRotWarningTurns` | `20` | Warn after this many chat turns |
| `tokalator.autoRefreshInterval` | `2000` | Dashboard refresh interval (ms) |

## Known Limitations

- Token counting uses heuristics (~1 token per 4 characters) when the Language Model API isn't available
- Import parsing uses regex, which misses some edge cases (multi-line imports, dynamic imports)
- Relevance weights are not scientifically tuned

## Requirements

- VS Code 1.99+
- GitHub Copilot or similar AI extension (for chat features)

## License

MIT
