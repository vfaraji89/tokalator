# Tokalator

**See every token your AI coding spends.** Context budget plus Claude Code, GitHub Copilot and Codex usage, tab relevance and secret-file protection, in your VS Code sidebar.

[Install](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator) · [Try it in your browser](https://tokalator.ai/extension) · [Changelog](https://github.com/vfaraji89/tokalator/blob/main/tokalator-extension-vs/CHANGELOG.md) · Free and open source (AGPL-3.0)

![Tokalator dashboard](https://tokalator.ai/screenshots/dashboard-demo.gif)

## Features

- **Context budget.** Tokens used against your model's window, split into files, instructions, conversation and output reserve. Shows turns left before the window fills.
- **Agent usage.** Claude Code, GitHub Copilot (Chat and CLI) and Codex, each in its own tab: turns, tokens, cache hits and cost, read from their local logs. Updates every 15 seconds. Nothing to set up.
- **Tokens or dollars.** On a subscription? Switch to tokens and every dollar amount disappears.
- **Tab relevance.** Every open tab gets a score from 0 to 1. Close the noise in one click; pinned files stay at full relevance.
- **32 current models.** Claude, GPT and Gemini with verified prices and long-context rates. Detects your Copilot chat model.
- **Secure Workspace.** Checks that every secret file is hidden from agents, fixes the gaps, then verifies.
- **Code maps.** Writes `GLOSSARY.md` and `SITE-MAP.md` so agents find the right files first. Built locally, no model calls.

## What it tracks

| Assistant | What it sees | Cost |
| --- | --- | --- |
| Claude Code | Turns, tokens, cache hits, context size per turn | Exact tokens |
| GitHub Copilot Chat | Turns, model, prompt and output tokens from the sessions VS Code keeps | Exact where recorded, estimated otherwise |
| Copilot CLI and Codex CLI | Turns, tokens and model from their session logs | Exact tokens |
| Any assistant | Open tabs, pinned files, instruction files | Estimate |

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
| `/skill-gen`, `/settings-gen` | Agent Skill, AGENTS.md and Copilot settings |
| `/pricewatch` | Price changes and their impact |

## Privacy

- **Zero data retention.** Your code, prompts, file names and paths never leave your machine, so nothing about your work is stored anywhere.
- Runs locally. The only default network request downloads the public pricing catalog.
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
