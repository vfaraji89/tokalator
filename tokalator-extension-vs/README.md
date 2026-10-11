# Tokalator

**See every token your AI coding spends.** Context budget plus Claude Code, GitHub Copilot and Codex usage, tab relevance and secret-file protection, in your VS Code sidebar.

[Install](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator) · [Try it in your browser](https://tokalator.ai/extension) · [Changelog](https://github.com/vfaraji89/tokalator/blob/main/tokalator-extension-vs/CHANGELOG.md) · Free and open source (AGPL-3.0)

[![Watch the short Tokalator tour](https://tokalator.ai/videos/tokalator-4.2-how-to.jpg)](https://tokalator.ai/#tour)

![Tokalator dashboard](https://tokalator.ai/screenshots/dashboard-demo.gif)

## Features

- **Context budget.** Tokens used against your model's window, split into files, instructions, conversation and output reserve. Shows turns left before the window fills.
- **Agent usage.** Claude Code, GitHub Copilot (Chat and CLI) and Codex, each in its own tab: turns, tokens, cache hits and cost, read from their local logs. Updates every 15 seconds. Nothing to set up.
- **All agents side by side.** The All tab compares every active agent: today's usage, turns, context used and model. `Tokalator: Compare Agents` opens it.
- **Agent memory.** Every file your agents load for this workspace (CLAUDE.md, Claude Code memory, skills, subagents, AGENTS.md, Copilot instructions) with its token count. Click to open and edit.
- **Session facts.** Context used, turns left, subagent share, output including thinking, cache share and the last 5 hours of usage, measured from the logs.
- **Tokens or dollars.** On a subscription? Switch to tokens and every dollar amount disappears.
- **Tab relevance and pins.** Every open tab gets a score from 0 to 1. Close the noise in one click. Pin a file to keep it at full relevance and add it to the agent you follow (right-click a tab or file, or use the pin in the sidebar).
- **32 current models.** Claude, GPT and Gemini with verified prices and long-context rates. Detects your Copilot chat model.
- **Secure Workspace.** Checks that every secret file is hidden from agents, fixes the gaps, then verifies.
- **Agent instructions and checks skill.** One click writes `AGENTS.md` from your real commands and layout (Codex and Copilot read it), a `CLAUDE.md` that imports it for Claude Code, and a SKILL.md that runs your checks before an agent finishes. Existing files are never overwritten.
- **Dependency Check (beta).** Every lockfile in the workspace, any ecosystem: known vulnerabilities from OSV.dev, outdated direct dependencies, and runtime end-of-life dates. Safe updates run only when you pick one.
- **Claude Code hooks and tool use (beta).** See, check, pause and remove hooks across all settings scopes, and see which tools and command-line programs Claude Code ran.
- **Code maps.** Writes `GLOSSARY.md` and `SITE-MAP.md` so agents find the right files first. Built locally, no model calls.

## What it tracks

| Assistant | What it sees | Cost |
| --- | --- | --- |
| Claude Code | Turns, tokens, cache hits, context size per turn | Exact tokens |
| GitHub Copilot Chat | Turns, model, prompt and output tokens from the sessions VS Code keeps | Exact where recorded, estimated otherwise |
| Copilot CLI and Codex CLI | Turns, tokens and model from their session logs | Exact tokens |
| Any assistant | Open tabs, pinned files, instruction and memory files | Estimate |

Costs are **API-equivalent**: what the tokens would cost at API list prices. Subscriptions (Claude, Copilot, ChatGPT) are not billed per token, so you can show tokens instead with `tokalator.costDisplay`. VS Code records only the final prompt size of multi-step Copilot agent requests, so Copilot input can be undercounted.

## Chat commands

Type `@tokalator` in chat:

| Command | What it does |
| --- | --- |
| `/count`, `/breakdown` | Token count and where it goes |
| `/optimize` | Close low-relevance tabs |
| `/pin`, `/unpin` | Keep a file at full relevance |
| `/model` | Show or switch the model |
| `/compaction`, `/preview` | Growth per turn and next-turn preview |
| `/instructions` | Instruction files and their token cost |
| `/secure` | Workspace security audit |
| `/codemap` | Generate code maps |
| `/settings-gen`, `/skill-gen` | AGENTS.md with a CLAUDE.md that imports it, and a checks skill for Codex, VS Code and Claude Code |
| `/pricewatch` | Price changes priced on your agents' last 7 days |

## Privacy

- **Zero data retention.** Your code, prompts, file names and paths never leave your machine, so nothing about your work is stored anywhere.
- Runs locally. The only default network request downloads the public pricing catalog. Agent logs, memory files and hook settings are read on your machine and never uploaded.
- Dependency Check, when you run it, sends package names and versions to OSV.dev, the package registries and endoflife.date. Nothing goes to Tokalator.
- Telemetry is **off by default**. When enabled it sends anonymous daily counts only, never code, file names, paths or prompts. Show, export or delete it any time from the Command Palette.
- Details: [tokalator.ai/privacy](https://tokalator.ai/privacy#telemetry)

## Settings

| Setting | Default | |
| --- | --- | --- |
| `tokalator.model` | `claude-opus-5-5` | Fallback model when none is detected |
| `tokalator.relevanceThreshold` | `0.3` | Score below which tabs are flagged |
| `tokalator.claudeCode.enabled` | `true` | Show Claude Code usage |
| `tokalator.agents.copilot.enabled` | `true` | Show Copilot Chat and Copilot CLI usage |
| `tokalator.agents.codex.enabled` | `true` | Show Codex CLI usage |
| `tokalator.costDisplay` | `dollars` | Show usage as dollars, tokens or both |
| `tokalator.telemetry.enabled` | `false` | Opt-in anonymous usage counts |

All settings: [tokalator.ai/extension](https://tokalator.ai/extension).

## Feedback

Run **Tokalator: Send Feedback** or [open an issue](https://github.com/vfaraji89/tokalator/issues).

## License

AGPL-3.0-or-later. Commercial licences are available from the copyright holder. "Tokalator" and its logo are trademarks of the copyright holder.
