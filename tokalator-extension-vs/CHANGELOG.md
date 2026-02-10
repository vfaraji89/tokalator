# Changelog

## 0.4.0 — 2026-02-11

### Added

- **🔐 Secret Guardrail**: New `SecretScanner` module detects 25+ types of exposed credentials in open files
  - API keys (AWS, GitHub, OpenAI, Anthropic, Google, Stripe, Slack, npm, PyPI, and more)
  - Passwords, PEM private keys, database connection URLs, JWTs, Bearer tokens, internal IP addresses
  - Dashboard shows red alert badges when secrets are detected in AI context
  - New `@tokalator /secrets` chat command for full scan reports with recommendations
  - Configurable via `tokalator.secretGuard` setting (enabled by default)
- **💰 Cost Estimation**: New `CostEstimator` module calculates dollar cost of AI context
  - Per-turn input/output cost based on model-specific pricing for all 14 models
  - Prompt caching savings analysis with provider-specific discount rates (Anthropic 90%, OpenAI 50%, Google 75%)
  - Blended cost calculation mixing cached and uncached token rates
  - Session and monthly cost projections based on usage patterns
  - New `@tokalator /cost` chat command with full cost breakdown tables
  - Dashboard shows cost section with per-turn cost, caching analysis, and projections
- **Model Pricing Data**: Added `inputCostPer1M`, `outputCostPer1M`, `cachedInputCostPer1M`, `supportsCaching`, `cachingType` fields to all 14 model profiles

### Changed

- `ContextSnapshot` now includes `secretScan` and `costEstimate` summaries
- `package.json` enhanced with marketplace metadata (`galleryBanner`, `badges`, `markdown`, `qna`)
- Keywords expanded with `cost-estimation`, `prompt-caching`, `secret-detection`, `token-counter`
- Added `Chat` category for better marketplace discoverability

### Fixed

- Dashboard CSS now uses proper VS Code theme variables with full fallback chains
- High Contrast theme support with explicit `--vscode-contrastBorder` handling
- Budget breakdown bar widths no longer break due to template literal escaping issue

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
