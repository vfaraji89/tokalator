# Context Engineering Collection — Contribution Plan

## Status

- [x] Fork & clone `github/awesome-copilot`
- [x] Create branch `feat/context-engineering-collection`
- [x] Fix frontmatter issues (added `applyTo` to instructions, `agent` field to prompts)
- [x] Copy files into repo
- [x] Run `npm ci` && `npm run build` — README docs updated
- [x] Run `npm run collection:validate` — all 40 collections valid ✅
- [x] Run `bash scripts/fix-line-endings.sh` — LF confirmed
- [x] Commit & push (commit `80c38be`)
- [x] PR created → awaiting maintainer review
- [ ] Add contributor comment (exit code 1 — needs retry)

## PR Review Status

- **3/3 CI checks passed** ✅
- **Blocker**: Requires 1 approving review from a maintainer
- **Requested reviewer**: Copilot (bot)

## Pending Action

Run this command to add yourself as a contributor:

```bash
cd /Users/vfaraji89/Documents/friends/context/awesome-copilot
gh pr comment --body "@all-contributors add @vfaraji89 for collection, agent, prompt, instruction"
```

> The previous attempt exited with code 1. Possible fix: specify the PR number explicitly:
> ```bash
> gh pr comment <PR_NUMBER> --body "@all-contributors add @vfaraji89 for collection, agent, prompt, instruction"
> ```
> Find your PR number with: `gh pr list --repo github/awesome-copilot --author vfaraji89`

## Files Contributed

| Type | File | Destination |
|------|------|-------------|
| Instructions | `context-engineering.instructions.md` | `instructions/` |
| Agent | `context-architect.agent.md` | `agents/` |
| Prompt | `context-map.prompt.md` | `prompts/` |
| Prompt | `what-context-needed.prompt.md` | `prompts/` |
| Prompt | `refactor-plan.prompt.md` | `prompts/` |
| Collection | `context-engineering.collection.yml` | `collections/` |

## Frontmatter Fixes Applied

| File | Fix |
|------|-----|
| `context-engineering.instructions.md` | Added required `applyTo: '**'` |
| `context-map.prompt.md` | Added `agent: 'agent'` + `model: 'copilot-chat'` |
| `refactor-plan.prompt.md` | Added `agent: 'agent'` + `model: 'copilot-chat'` |
| `what-context-needed.prompt.md` | Added `agent: 'agent'` + `model: 'copilot-chat'` |

## Contributor Recognition

Once the comment goes through, you'll be added with these categories:

| Type | Emoji |
|------|-------|
| collection | 🎁 |
| agent | 🎭 |
| prompt | ⌨️ |
| instruction | 🧭 |
