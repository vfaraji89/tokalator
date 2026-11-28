# Honest critique: what holds Tokalator back, and a path to 1,000 stars

Status: **for review.** Written 2026-11-28. Star counts come from the GitHub search API on that date.

**Short version:** the engineering is careful. What's holding Tokalator back is focus and distribution,
not code. Features won't get it to 1,000 stars; one clear hook and a launch might.

## Where it stands

| Repo | Stars | Pitch |
|---|---|---|
| getagentseal/codeburn | 11.9k | Token cost across 37 tools. `npx codeburn` |
| teamchong/pxpipe | 8.0k | **Cut** Claude Code tokens |
| junhoyeo/tokscale | 5.9k | Usage across agents, with a leaderboard |
| matt1398/claude-devtools | 4.1k | Session logs, tool calls, context window, visually |
| phuryn/claude-usage | 2.3k | Local Claude Code usage dashboard |
| **vfaraji89/tokalator** | **18** | Seven things in one sentence |

Tokalator was created on 2026-02-07 and has 79 commits, so time isn't the problem.

## The critique

1. **Tracking usage is a crowded category, and it's taken.** Pricing Claude Code sessions from local logs
   is the core of at least five repos above 2k stars. Most support 30+ tools; Tokalator supports 4
   (Claude Code, Copilot, Codex, OpenCode). Competing on "see your spend" is a race it can't win.
2. **That includes [`agent-loop-visibility.md`](agent-loop-visibility.md).** `trace`, `statusline` and
   `context_breakdown` overlap heavily with claude-devtools and existing status-line tools. They'd make
   Tokalator better but wouldn't make it different. Revise that proposal rather than build it as written.
3. **The pitch is spread too thin.** The repo description lists context budget, three agents, tab
   relevance, pricing, code maps and workspace security. Nobody stars a list; people star one sentence
   they'd repeat to a colleague.
4. **Installs take too many steps.** The leaders install with one command. The MCP server and CLI need a
   clone and a build, since they aren't on npm. The plugin needs a clone and `--plugin-dir`, since the
   repo doesn't publish a plugin marketplace (there's a `plugin.json` but no `marketplace.json`). Each
   extra step loses most visitors.
5. **The main surface is VS Code.** The tools growing fastest run in the terminal. An extension is harder
   to try and harder to show in a 10-second GIF.
6. **The licence makes people hesitate.** AGPL, plus a commercial licence and a trademark notice, makes
   companies and contributors stop and think. The leaders mostly appear to be MIT; each licence is still
   to be checked. This isn't the main reason for 18 stars, but it doesn't help.

## What's actually distinctive

- **The arXiv paper ([2604.08290](https://arxiv.org/abs/2604.08290)).** None of the leaders has one. It's
  credibility you can't buy.
- **The code maps** (`GLOSSARY.md` and `SITE-MAP.md` from `claude-plugin/`). They're deterministic, need
  no model calls, and are refreshed by hooks. This is about **using fewer tokens**, not counting them.
  pxpipe's 8k stars show that "cut tokens" sells better than "count tokens".
- **Context engineering as a discipline.** Tab relevance, budgets and rot thresholds amount to an opinion
  about *how* to work, not just a meter.

## Recommendations

### 1. Pick one claim and prove it with a number

> Tokalator makes Claude Code use X% fewer tokens on real tasks. Measured, reproducible, no model calls.

- Build a small public benchmark: the same tasks on real repos, with and without code maps, using
  `claude -p --output-format stream-json` to measure tokens and cost per run.
- Run each task several times, because agent runs vary; report the median and the spread, not one run.
- The paper is the methodology; the benchmark is the proof.
- If the number is weak, you learn that cheaply. If it's strong, it's the headline.

### 2. Make it one command

- Publish the CLI to npm, so `npx tokalator` works.
- Add `.claude-plugin/marketplace.json` at the repo root, so users can install with
  `/plugin marketplace add vfaraji89/tokalator`.
- The VS Code extension stays as the deluxe surface, not the front door.

### 3. Rewrite the README around the claim

One sentence, one before/after GIF, one benchmark table, one install line. Move the feature list lower down.

### 4. Use what already exists for tracking

Rather than out-tracking codeburn, consider reading or exporting their formats, or simply say "use them
for tracking, use us to cut tokens". Being narrower is a strength.

### 5. Launch on purpose, once the benchmark exists

Stars come in bursts from launches, not from steady commits.

- Post on Show HN, framed around the benchmark rather than the tool.
- Post on r/ClaudeAI and r/LocalLLaMA, and on X with the paper.
- Submit to awesome-claude-code and the MCP server lists.
- One strong launch post is worth more than ten features.

### 6. Lower the licence friction where it costs little

The plugin is already MIT. Consider making the CLI and MCP server MIT too, and keeping AGPL for the extension.

## Rough order

| Step | Work | Size |
|---|---|---|
| 1 | Benchmark: tasks, harness, results table | 1–2 weeks. Decides everything else |
| 2 | npm package, plugin marketplace, README rewrite | Days |
| 3 | Launch | One coordinated day |
| 4 | Features, chosen by what launch users ask for | Ongoing |

1,000 stars isn't guaranteed, but repos in this space have reached thousands with a single sharp claim,
a one-line install and a good launch. Tokalator has the depth for that claim; it hasn't made it yet.

## Questions for the reviewer

1. Is "fewer tokens with code maps" the claim, or is there a stronger one in the paper?
2. Is relicensing the CLI and MCP server to MIT acceptable?
3. Which real repos and tasks should the benchmark use?
