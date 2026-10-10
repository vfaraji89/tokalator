# Changelog

## 4.1.2 (2026-10-10)

### Added

- Agent usage for more than Claude Code. The usage card now has a tab for each coding agent active in the workspace in the last 7 days:
  - GitHub Copilot Chat, from the session files VS Code keeps for the workspace. Uses the token counts VS Code recorded and estimates the rest, and shows the estimated share.
  - GitHub Copilot CLI, from its local session logs, including premium requests.
  - OpenAI Codex CLI, from its local session logs (respects `CODEX_HOME`).
  Settings: `tokalator.agents.copilot.enabled`, `tokalator.agents.codex.enabled`. Everything is read on your machine; nothing is uploaded.
- Usage as tokens or dollars. `tokalator.costDisplay` and a $ / Tokens / Both toggle on the usage card. Tokens mode hides every dollar amount and shows tokens, context windows and cache share instead, for Claude, Copilot and ChatGPT subscribers who are not billed per token.
- Tabs match what you have: an agent gets a tab while its extension is installed (Claude Code, Copilot Chat, Codex) or while you use it from a CLI. Uninstalling an extension removes its tab right away, even when VS Code was closed at the time; using that agent's CLI later brings the tab back. Copilot Chat hides when VS Code's AI features are turned off.
- The usage card follows you: it switches to an agent as soon as that agent writes new activity (file watchers, about a second), or when you focus a Claude Code editor tab or a terminal running Claude Code, Codex or the Copilot CLI. Picking a tab also switches the active model to that agent's model.
- `Tokalator: Take the 1-Minute Survey`: six fixed-choice, anonymous questions (role, team size, agents, billing, biggest pain, interest in team insights). Sent only with telemetry consent; every question can be skipped.
- Extension API: `setCompanionBadge` lets a companion extension show one small status chip in the dashboard header.
- New Marketplace, activity bar and dashboard icon: the Tokalator sidebar mark, with a short abacus-to-Tokalator intro.

### Fixed

- The active model now follows the coding agent you used most recently (for example Claude Opus 5.5 in Claude Code) instead of staying on the settings fallback, so context window and turn costs use the right model. The model card says where the model came from.

## 4.1.1 (2026-10-10)

### Added

- Claude Code tracking. Reads Claude Code session logs (CLI and VS Code extension) for the open workspace and shows today's turns, requests, cache hit rate, last-session tokens, the CLI and VS Code split, and API-equivalent cost. Refreshes every 15 seconds while the sidebar is visible; no chat mention needed. Setting: `tokalator.claudeCode.enabled`.
- Turn Analytics and Context Growth fall back to Claude Code turns when there are no `@tokalator` turns.
- Models: Claude Opus 5.5, Sonnet 5.5, Haiku 5.5, Mythos 5.1, Mythos 5, Opus 4.5; GPT-6 Astra, GPT-6.1 Sol, GPT-6 Luna; Gemini 3.8 Flash. The default model is Claude Opus 5.5.
- Long-context pricing: input rates switch above provider thresholds (Claude Haiku 5.5 above 100K, GPT-5.4 and later above 272K, Gemini 3.1 Pro and 2.5 Pro above 200K).
- Opt-in telemetry, off by default and gated by VS Code's telemetry setting, with Show, Export, and Delete commands. See tokalator.ai/privacy.
- Code maps: `Tokalator: Generate Code Maps`, `/codemap`, and a dashboard button write `GLOSSARY.md` (declarations with source links) and `SITE-MAP.md` (packages, modules, routes, imports) locally, with no model calls.
- `Tokalator: Send Feedback` and an occasional, dismissible feedback question.
- Price Watch button and a pricing catalog footer with refresh in the dashboard.
- Secure Workspace checks each secret file against Claude Code deny rules (project, local, and user settings), VS Code search exclusion, and git ignore rules (via `git check-ignore`), shows the result in the dashboard, explains gaps in a dialog, and verifies again after applying. It stays quiet when a workspace has no secret files.

### Changed

- Dashboard: sections update in place without flicker, values animate, sections collapse and remember their state, toasts confirm actions, single click opens a file, every action works from the keyboard, and motion respects reduced-motion settings.
- Prices corrected against provider pages: GPT-5.6 Sol, Terra, and Luna; Gemini 3.6 Flash; context windows for GPT-5.5, GPT-5.4, GPT-5.4 mini and nano, and GPT-5.3-Codex.
- Gemini 3.1 Pro and Gemini 3 Flash use their official preview IDs. Gemini 3.7 Flash is removed; Google routes it to Gemini 3.8 Flash.
- Remote catalog sync keeps the featured model list.
- `/skill-gen` writes a valid Agent Skill (lowercase name, what-and-when description, real commands) to `.claude/skills/<name>/SKILL.md`, or `.agents/skills/` with `apply agents`.
- `/settings-gen` generates `AGENTS.md`, a `CLAUDE.md` that imports it, and `.github/copilot-instructions.md`, and reports skills, custom agents, prompt files, Cursor rules, GEMINI.md, and MCP configs.
- `/instructions` recognizes `CLAUDE.local.md`, `AGENTS.override.md`, `GEMINI.md`, `.claude/rules`, and `.cursor/rules/*.mdc`.
- Secure Workspace writes `search.exclude` (documented, keeps files visible in the Explorer) instead of `chat.excludeFilePatterns`, and only `Read()` deny rules; earlier `Grep()` rules are removed.

### Fixed

- Turns remaining and next-turn estimates now use context growth per turn instead of the full input of each turn.
- Health notes and the tokenizer label are escaped in the dashboard.

## 4.1.0

### Changed

- Tokalator Pro is merged into the open-source extension. Every feature is free, and the dashboard badge reads OPEN SOURCE.
- New calculator icon and activity bar icon.
- Turn cost is an input-only estimate. Output tokens and cache hits are not observable from the editor, so they are no longer priced.

### Removed

- Enterprise features: `/team`, `/skills`, `/audit`, the API key and dashboard commands, license tiers, and telemetry sync.
- The GitHub AI Credits tracker and `/credits`, which counted Tokalator's own commands rather than Copilot usage.
- `/terminology-gen` and the Generate Glossary button, which pointed to a generator that did not exist and showed unmeasured savings.
- Unused settings: `licenseTier`, `teamId`, `apiEndpoint`, `copilotPlan`, `contextRotWarningTurns`.

### Fixed

- Default `windowSize` of 0 produced a 0-token capacity and a permanent 100% critical state.
- Secure Workspace overwrote `.claude/settings.json` and `.vscode/settings.json` when they could not be parsed.
- The dashboard inserted file names, model labels, catalog data, and errors into HTML without escaping. The CSP now adds `form-action` and `base-uri`, and the nonce uses `crypto`.
- Detected-model chips rendered "undefined" and could save it as the model setting.
- Emoji removed from chat output and dashboard buttons.

## 3.1.7 — 2026-05-31

### Added

- **Generate Glossary** -- new `/terminology-gen` chat command scans the workspace's Markdown docs for terminology sources, measures their real token cost, and estimates glossary compression potential.
- **Feature panel** in sidebar dashboard with Generate Glossary (free), plus locked Pro feature previews (Secure Workspace, SKILL.md, AI Settings) linking to [tokalator.ai](https://tokalator.ai).
- **Collapsible price compare** with "vs Current" savings column showing cost delta against your active model.
- **Context Engineering stats** panel: context-window % used, turns-to-rot, measured tokens/turn growth, and estimated turns left.

### Changed

- Dashboard redesigned to match Tokalator Pro layout: animated calculator SVG icon, "FREE" badge, compact card-based sections, pills stats row.
- Model is now auto-detected from the active Copilot chat model; the manual model dropdown was removed.
- Cost box relabeled **API Cost Simulation**. Next-turn and turns-left projections render only from measured turn history (no fabricated defaults).
- Model catalog updated to 17 models with May 2026 pricing (Claude Opus 4.8, GPT-5.5, Gemini 3.5 Flash).
- High-contrast theme overrides extended for new UI components.

## 3.1.6 — 2026-04-11

### Added

- **Dynamic pricing catalog** — remote fetch with ETag caching, 24h TTL, and bundled fallback. Prices stay current without extension updates.
- **Price comparison table** — sidebar dashboard shows per-turn cost across all 17 models, sorted ascending by total cost. Active model highlighted.
- **Refresh Pricing command** — `Tokalator: Refresh Pricing Catalog` fetches latest rates on demand.
- **Monthly pricing workflow** — GitHub Actions cron (`fetch-pricing-agent.py` via Agno + Gemini) refreshes `models.json` on the 1st of each month.

### Changed

- Dashboard top block compacted: single-row budget display with smaller padding and font.
- Removed turn-related emoji from Next Turn Preview section.
- Model selector label removed for cleaner layout.

## 3.1.5 — 2026-04-07

### Added

- **Price estimation in sidebar dashboard** — new cost box showing input cost, output cost (at max capacity), and total estimated turn cost per API call
- Per-MTok pricing for all 17 model profiles (Anthropic, OpenAI, Google)
- Model selector dropdown now displays input/output prices alongside context window size
- `/count` command shows estimated input cost, output cost, and total turn cost
- `/model` command and model list show per-MTok rates for each model

### Changed

- `ModelProfile` interface extended with `inputCostPerMTok` and `outputCostPerMTok`
- `ContextSnapshot` now includes `CostEstimate` with full cost breakdown
- npm dependency audit fixes (0 vulnerabilities)

## 3.1.3 — 2026-03-21

### Fixed

- Session logger receiving wrong object shape — all logged fields were undefined
- `logOptimize` called with wrong arguments (threshold passed as token count)
- Missing `await` on model switch caused stale token budget in response
- Dashboard listener memory leak — subscription now properly disposed

### Changed

- Model list updated to 17 profiles: Claude Opus/Sonnet 4.6, GPT-5.4, GPT-5.4 Mini, GPT-5.2/5.1 Codex, Gemini 3.x
- Model auto-detection improved: `vscode.lm.onDidChangeChatModels` listener added
- Unknown model warning when switching to a model not in profiles
- Security: Next.js 16.2.1 (5 CVEs patched), hono, flatted

## 3.1.2 — 2026-03-06

### Added

- Auto-sync model from Copilot chat window

### Fixed

- Stale token counts after rapid file switching
- Duplicate tab entries in multi-root workspaces
- `CLAUDE.md` and `AGENTS.md` now counted in instruction scanner budget
- Pin/unpin event propagation in dashboard

## 3.1.1 — 2026-02-11

### Fixed

- **CSP event delegation** — replaced all inline `onclick`/`ondblclick`/`onchange` handlers with `data-action` attributes and delegated listeners inside the nonce'd script block; CSP `script-src 'nonce-...'` was silently blocking every button click
- **Token formatting** — `fmtTokens` now shows `1.0M` for 1,000,000+ instead of `1000.0K`
- **Model switch sync** — dashboard handler now `await`s `setModel()` so the dropdown doesn't flicker
- **Dashboard tests** — 14 new tests covering message handling, HTML output (no onclick), CSP nonce, URI round-trip

## 3.1.0 — 2026-02-11

### Fixed

- **Pin/Unpin/Close buttons** — rewritten `renderTab` as pure string concatenation with `&apos;` HTML entities; nested template literals were mangling onclick quote escaping through esbuild
- **High Contrast Dark/Light** — all card backgrounds set to `transparent !important` via `data-vscode-theme-kind` attribute selectors; borders use `contrastBorder` on every interactive and card element
- **Dashboard CSS** — proper VS Code theme variable fallback chains (sidebar → general foreground → safe defaults); no more grey card tints in any theme
- **Budget breakdown bar widths** — rewritten from nested template literal to string concatenation IIFE so percentages compute correctly
- **Model sync from chat** — `@tokalator /model` now writes back to VS Code settings (`tokalator.model`) so dashboard selector, Settings UI, and chat all stay in sync immediately
- **Async model switch** — `setModel()` properly awaits workspace rescan and refresh before returning; config change listener has loop guard
- Marketplace README lists all 11 chat commands and High Contrast support

## 0.3.0 — 2026-02-10

### Fixed

- Dashboard text now readable in all VS Code themes (Dark, Abyss, High Contrast)
- Added full fallback chain for CSS variables: sidebar → general foreground → safe defaults
- Buttons, inputs, badges, and borders all inherit theme colors correctly when sidebar-specific vars are undefined

## 0.2.9 — 2026-02-10

### Changed

- Dashboard colors aligned to GitHub Primer palette — green (#3fb950), yellow (#d29922), red (#f85149), blue (#58a6ff)
- Subtler budget level tints, rounded buttons, muted section titles, tabular-nums stat badges
- Preview box uses blue accent; growth bars with smooth hover transition

### Fixed

- Marketplace README and tokalator.wiki extension page now list all 11 chat commands and 10 features (was 6 commands / 8 features)
- extension.json updated to 14 model profiles, current tokenizer model names, and v0.2.9 install references

## 0.2.8 — 2026-02-10

### Added

- **Next Turn Preview**: New `/preview` chat command estimates token cost before sending
- Dashboard now shows a "🔮 Next Turn Preview" box with estimated growth, remaining turns, and overflow warnings
- Status bar shows a loading spinner during initialization

### Fixed

- **Dashboard sync bug**: Dashboard now refreshes when sidebar becomes visible again after being hidden/collapsed
- **Stale webview reference**: Properly clears webview reference on dispose, preventing errors when posting to destroyed views
- **Initial activation**: Extension activation is now async; forces a fresh snapshot after all listeners are registered
- Dashboard triggers a fresh refresh on panel open to catch any changes made while it was hidden

## 0.2.7 — 2026-02-10

### Added

- GPT-5.2 Codex, GPT-5 Mini, GPT-4.1 model profiles
- Claude Haiku 4.5 (replacing outdated Haiku 3.5)

### Removed

- Deprecated models: GPT-4o, GPT-4o Mini, Claude Haiku 3.5

### Fixed

- Model profile test counts updated for 14 models (4 Anthropic, 7 OpenAI, 3 Google)

## 0.2.6 — 2026-02-08

### Changed

- New marketplace icon: minimal abacus with red/dark beads, metallic frame, specular reflections on dark charcoal background — matches site branding

## 0.2.5 — 2026-02-08

### Added

- `/unpin` command to unpin files and return them to normal relevance scoring
- `/reset` command to clear session state (turn counter and context rot tracking)
- `/compaction` command with per-turn token growth analysis and actionable recommendations
- Budget breakdown panel in sidebar dashboard (files, system, instructions, conversation, output)
- Context growth sparkline visualization in sidebar with per-turn history
- Turn snapshot tracking for compaction analysis

### Changed

- `TurnSnapshot` and `BudgetBreakdown` types moved to shared types module

## 0.2.4 — 2026-02-08

### Fixed

- Renamed chat participant handle from `@tokens` to `@tokalator` across entire codebase
- Fixed missing commands not appearing on VS Code Marketplace listing
- Updated README commands to match new handle

## 0.2.3 — 2026-02-08

### Added

- Real tokenizer integration — Claude BPE and OpenAI o200k_base encoders
- Accurate token counting instead of heuristic estimation

## 0.2.2 — 2026-02-08

### Added

- `@tokalator` chat participant handle
- `/instructions` command for inline prompt guidance
- `/model` command for model info and context limits

## 0.2.0 — 2026-02-08

### Added

- Model selector for switching between AI models
- Workspace file scanning for context-aware analysis
- Updated model catalog: GPT-5.1/5.2, Gemini 3 Pro/Flash

### Fixed

- Close/pin buttons now always visible (not hover-only)
- LM API wording, folder path, and icon fixes

## 0.1.0 — 2026-02-07

### Added

- Real-time context dashboard sidebar panel
- `@context` chat participant with `/status`, `/budget`, `/optimize`, `/pin` commands
- Tab relevance scoring (language, imports, path, recency, diagnostics)
- Token budget estimation using Language Model API with fallback heuristic
- Status bar indicator showing context health
- One-click distractor tab closing
- File pinning system
- Chat turn tracking with context rot warnings
- Configurable relevance threshold, window size, refresh interval
