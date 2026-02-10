# Changelog

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
