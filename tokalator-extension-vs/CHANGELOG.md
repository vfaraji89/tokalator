# Changelog

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
