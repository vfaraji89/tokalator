# Proposal: show the agent loop and its cost while a session runs

Status: **for review, nothing built yet.** Each item below ends with a recommendation; mark it
**build**, **later** or **drop** in the review.

Scope: `tokalator-mcp/` (MCP server and CLI) and `claude-plugin/` only. **No change to
`tokalator-extension-vs/`**, and no change to the files `tokalator-mcp/scripts/sync.mjs` copies from
it (`claudeCodeUsage.pure.ts`, the model catalog). New code imports those files and doesn't edit them.

## The gap

Today Tokalator shows Claude Code spending **after** it happens:

- `tokalator usage` and the `claude_code_usage` MCP tool read finished session logs from `~/.claude/projects/`.
- The plugin's three hooks (SessionStart, UserPromptSubmit, Stop) only refresh `GLOSSARY.md` and `SITE-MAP.md`.
- Nothing in the MCP package or the plugin reads `--output-format stream-json`, the status-line input,
  or the `transcript_path` field that every hook receives. `tokalator-mcp` has no tests.

So nothing shows *which step* of the agent loop (model reply, `tool_use`, `tool_result`, the next
request) made a session expensive, or warns while there's still time to change course.

## The test for "real added value"

Claude Code already has `/context`, `/cost`, and a `result` event in `stream-json` with
`total_cost_usd`. An item is worth building only if it gives you something those don't:

1. **Per-step attribution**: which tool call or result cost what, not just the session total.
2. **API-equivalent prices from Tokalator's catalog**: the same 32-model `models.json` the extension
   uses, with cache-read, cache-write and long-context rates, so numbers match across extension, CLI and MCP.
3. **Acting during the session**: a warning or a block before the context window fills up.

---

## 1. `tokalator trace`: the agent loop with a price on every step

```sh
claude -p "fix the failing test" --output-format stream-json --verbose | tokalator trace
```

```
#  step         detail                         ctx      out    cost     stop_reason
1  assistant    tool_use Read src/a.ts         12.4k    180    $0.041   tool_use
   tool_result  Read src/a.ts                  +6.1k
2  assistant    tool_use Bash npm test         18.7k    95     $0.029   tool_use
   tool_result  Bash npm test                  +11.8k   ← largest result
3  assistant    text                           30.6k    410    $0.016   end_turn
   total        3 requests · cache 88%                         $0.086   (Claude Code: $0.086)
```

- **Input:** `stream-json` lines on stdin (`system` init, `assistant` with `message.usage`, `user` with
  `tool_result`, and the final `result`). A `--file` flag replays a saved stream, and `--json` prints
  machine-readable output.
- **Pricing:** `recordCost()` from the existing `claudeCodeUsage.pure.ts`, imported unchanged.
- **Check:** prints Claude Code's own `total_cost_usd` next to Tokalator's total, so a pricing drift shows up straight away.
- **New files:** `tokalator-mcp/src/core/streamTrace.pure.ts` (MCP only, not synced) and a `trace` case in `cli.ts`.

**Value:** per-step attribution (criteria 1 and 2) for scripted and CI runs of `claude -p`. It also
teaches how the `stop_reason` loop works.
**Cost:** small, about 150 lines plus tests.
**Risk:** the `stream-json` event shapes aren't a versioned contract. Unknown events are skipped
instead of failing, and fixture tests pin the shapes we rely on.
**Recommendation:** build.

## 2. `tokalator statusline`: a live budget in Claude Code's status bar

```json
{ "statusLine": { "type": "command", "command": "tokalator statusline" } }
```

```
Sonnet 4.5 · 84k/200k (42%) · $1.37 · cache 91%
```

- Reads the status-line JSON on stdin, then the last `assistant` usage entry in `transcript_path`.
  The window size comes from the catalog.
- Turns amber at the model's rot threshold (already in `models.json`) and red at 90%.
- Works in the terminal and in the VS Code extension's panel, because both read the same settings.

**Value:** criteria 2 and 3, all the time, at no cost in tokens.
**Check first:** newer Claude Code versions may already pass context-window and cost fields in the
status-line input. If they do, use those fields and add only what's missing: catalog pricing, the rot
threshold and cache hit rate. If that's all that's left, this item gets smaller, so re-check its value.
**Cost:** small, about 80 lines plus tests. It has to be fast, so it reads only the transcript's tail, not the whole file.
**Recommendation:** build, after the check above.

## 3. Budget-guard hook in the plugin

A `PostToolUse` hook (it runs after each tool call) reads `transcript_path` from the hook input. Once
context passes a threshold, it adds a message telling the agent to compact or narrow its search.

- **Default:** warn only. `TOKALATOR_GUARD=block` makes it stop the turn instead.
- **Threshold:** `TOKALATOR_GUARD_TOKENS`, default 160k.
- **Dependencies:** pure Python with none, so the MIT plugin still runs on its own without the AGPL catalog.

**Value:** criterion 3, the only item where the *agent itself* reacts to its own budget.
**Cost:** small. **Risk:** a warning repeated after every tool call is noise and costs tokens, so it
fires once per threshold crossing and remembers that in a temp file keyed by session id.
Without the catalog it doesn't know each model's window size.
**Recommendation:** build in a second PR, after 2 shows which thresholds feel right.

## 4. `context_breakdown`: what actually filled the window

An MCP tool and a `tokalator context <session>` command that rank a session's tool results by token
count, such as `Read x.ts 18k`, `Bash npm test 12k` or `Grep "foo" 9k`, and group them by tool and by file.

**Value:** criterion 1. `/context` shows categories (system, tools, messages). This shows *which calls*
to avoid next time, such as reading a large file in full or running a test suite whose output is too long.
**Cost:** medium. Token counts for results come from the existing tokenizer, since logs store usage
per request, not per block.
**Overlap:** the extension's `toolUsage.pure.ts` counts tool *calls* but not their size, so this doesn't duplicate it.
**Recommendation:** later, after 1, which shares most of this parsing.

## 5. Agent SDK example

`tokalator-mcp/examples/sdk-budget-guard.py`: runs the Agent SDK with the Tokalator MCP server and a
hook that stops the run when a cost cap is reached.

**Value:** documentation and adoption, not a new capability. It shows the SDK driving the same engine as the CLI.
**Cost:** small, but it adds a Python SDK dependency for examples and an example that can go stale.
**Recommendation:** drop for now. A README snippet would do the same job.

## 6. Tests for `tokalator-mcp`

Fixture tests for the existing usage summary, the CLI argument handling, and 1 and 2 as they're added,
run with `node --test` (no new dependency) and added to the `mcp` CI job.

**Value:** the MCP package is the only one of the three with no tests, and 1 and 2 depend on parsing unstable formats.
**Cost:** small.
**Recommendation:** build, together with 1 and 2.

---

## Proposed order

| PR | Items | Why together |
| --- | --- | --- |
| 1 | 6 → 1 → 2 | Tests first, then the two CLI commands that use them. MCP package only. |
| 2 | 3 | Plugin only. Thresholds informed by using 2. |
| 3 | 4 | Reuses the parsing written for 1. |

## Questions for the reviewer

1. Should `trace` and `statusline` stay CLI-only, or also be exposed as MCP tools? An MCP tool costs
   context tokens on every session that loads the server, so CLI-only is the default here.
2. For the guard hook: warn-only default, or block by default?
3. Is a 160k default threshold right, or should it follow the model's rot threshold, which would need the plugin to read `models.json`?
