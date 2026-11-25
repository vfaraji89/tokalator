# Code map

| Folder | What it does |
|---|---|
| `extension.ts` | Activation: builds the services and wires commands, views and events |
| `agents/` | Reads what each coding agent did. Shared tracker and types at the top |
| `agents/claude/` | Claude Code: session logs, usage, hooks, paths |
| `agents/codex/` · `copilot/` · `opencode/` | One reader per agent |
| `context/` | The context budget: open tabs, relevance, token estimates, tokenizer |
| `pricing/` | Model catalog, prices, price changes, usage in dollars |
| `workspace/` | Workspace tools: code maps, dependency check, security scan, setup |
| `telemetry/` | Opt-in telemetry and feedback |
| `ui/chat/` · `ui/dashboard/` | The chat participant and the sidebar dashboard |
| `types.ts` | Types shared across folders |

Files ending in `.pure.ts` have no `vscode` import: they hold the logic and are what the tests cover.
Tests live in `../test/unit/`, in the same folders as here; the VS Code mock is in `../test/mocks/`
and the end-to-end run in `../test/e2e/`.
