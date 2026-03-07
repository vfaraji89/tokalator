---
name: tokalator-context-management
description: Real-time token budget awareness for AI coding sessions. Use Tokalator MCP tools to count tokens, estimate budget, preview turn cost, and avoid context overflow.
license: MIT
metadata:
  author: vfaraji89
  version: 1.0.0
---

# Tokalator Context Management

A skill for managing token budgets during AI coding sessions using the Tokalator MCP server. Gives agents real-time awareness of context usage, turn cost, and overflow risk — backed by real Claude BPE tokenizers, not guesses.

## Requirements

Tokalator MCP server must be running. Install it once:

```bash
# From the tokalator-mcp/ directory
npm install && npm run build
claude mcp add --transport stdio tokalator -- node tokalator-mcp/build/index.js
```

Verify with `/mcp` in Claude Code — `tokalator` should be listed.

## Available MCP Tools

| Tool | Purpose |
|---|---|
| `count_tokens` | Count tokens in a text string for a given model |
| `estimate_budget` | Estimate token budget across one or more files |
| `preview_turn` | Preview token cost of the next conversation turn |
| `list_models` | List all supported models with context windows |

## When to Apply This Skill

Use Tokalator tools proactively in these situations:

- **Session start** — Run `estimate_budget` on the main files you'll work with to know your baseline
- **Before large reads** — Before reading a big file, use `count_tokens` to check if it fits comfortably
- **Mid-session check** — After several back-and-forth turns, run `preview_turn` to see how close you are to the limit
- **Before attaching files** — Check token cost before including large context in a prompt
- **Warning signs** — If responses feel compressed or context seems stale, check budget immediately

## Rules

### count_tokens

Call `count_tokens` before loading unknown-size content:

```
count_tokens(text: "<file contents or prompt text>", model: "claude-opus-4-6")
```

- Use the actual model being used in the session (default: `claude-opus-4-6`)
- If a file is over 50,000 tokens, warn the user before proceeding
- For files over 100,000 tokens, strongly recommend summarizing instead of reading in full

### estimate_budget

Call `estimate_budget` at session start and when switching task focus:

```
estimate_budget(files: ["src/main.ts", "src/utils.ts"], model: "claude-opus-4-6")
```

- Run on all files you plan to read or edit in the current task
- Report the total estimate to the user if it exceeds 30% of the context window
- If files + conversation overhead would exceed 70%, recommend narrowing scope

### preview_turn

Call `preview_turn` before sending a turn that includes large amounts of context:

```
preview_turn(currentTokens: <current usage>, model: "claude-opus-4-6")
```

- Run when turn count exceeds 15 (approaching context rot territory)
- Run before any turn that attaches 3+ files
- If `percentAfterTurn` exceeds 80%, warn the user and suggest compaction or a fresh session
- If `percentAfterTurn` exceeds 90%, halt and recommend starting a new session

### list_models

Call `list_models` when the user asks about or switches models:

```
list_models()
```

- Use this to confirm context window size before planning a large task
- Remind the user that Claude Opus 4.6 has a 1M token window, Sonnet 4.5 has 200K

## Context Rot Thresholds

Context rot occurs when too many turns accumulate stale context. Per-model rot thresholds:

| Model | Rot Threshold |
|---|---|
| claude-opus-4-6 | 40 turns |
| claude-sonnet-4-5 | 30 turns |
| claude-haiku-4-5 | 25 turns |
| gpt-5.2 / gpt-5.1 | 30 turns |
| o3 / o4-mini | 20 turns |
| gemini-3-pro | 30 turns |

When turn count approaches the rot threshold, suggest the user start a new session or use `/compact` to summarize.

## Budget Health Levels

| Level | Usage | Action |
|---|---|---|
| Healthy | < 60% | No action needed |
| Warning | 60–85% | Recommend closing unused context, summarizing |
| Critical | > 85% | Strongly recommend compaction or new session |

## Quick Reference

**Check if a file is safe to read:**
```
count_tokens(text: <file content>, model: "claude-opus-4-6")
→ If > 80,000 tokens: warn, consider summarizing
```

**Baseline at session start:**
```
estimate_budget(files: [<task files>], model: "claude-opus-4-6")
→ If > 30% of window: flag to user
```

**Mid-session health check:**
```
preview_turn(currentTokens: <used>, model: "claude-opus-4-6")
→ If percentAfterTurn > 80%: recommend compaction
```

**What model am I using?**
```
list_models()
→ Match to active Claude model for accurate context window
```
