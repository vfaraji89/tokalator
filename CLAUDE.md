# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Web Platform
```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint v9 flat config
npm test             # Jest unit tests (lib/__tests__/**/*.test.ts)
```

### Run a single test file
```bash
npx jest lib/__tests__/pricing.test.ts --verbose
```

### VS Code Extension
```bash
cd tokalator-extension-vs
npm run compile      # esbuild bundle → dist/extension.js
npm run watch        # Watch mode
npm test             # Jest tests (__tests__/)
```

### MCP Server
```bash
cd tokalator-mcp
npm run build        # TypeScript compile → build/
npm run dev          # Watch mode
```

### Python API (FastAPI)
```bash
npm run dev:api      # uvicorn api.main:app --port 8000 --reload
```

### Content Generation
```bash
npm run fetch-wiki           # Fetch arXiv papers → content/wiki/articles.json
npm run fetch-wiki-agent     # Agentic version (requires GOOGLE_API_KEY)
```

### Deploy & Publish
```bash
vercel --prod                # Deploy web platform to production
cd tokalator-extension-vs && vsce publish   # Publish extension to VS Code Marketplace
```

## Architecture

The repo has four independent subsystems that each build and test separately.

### 1. Web Platform (`/app`, `/components`, `/lib`)
Next.js 16 App Router site with:
- **Catalog pages** (`/agents`, `/prompts`, `/instructions`, `/collections`) — auto-discovered from filesystem
- **Tools** (`/tools/*`) — token calculator, caching ROI, conversation estimator, pricing dashboard, model compare, economic analysis
- **Wiki** (`/wiki`, `/dictionary`, `/learn`) — context engineering education

The catalog scanner (`lib/catalog/scanner.ts`) walks `copilot-contribution/`, `user-content/`, and `awesome-copilot/` at runtime (RSC, server-side), detects files by extension (`.agent.md`, `.prompt.md`, `.instructions.md`, `.collection.yml`), parses YAML frontmatter, and caches the result in memory. Featured items are configured in `catalog-config.json` at the root.

Pricing and economic logic lives in `lib/pricing.ts` (Bergemann–Bonatti–Smolin Cobb-Douglas Quality Function: `Q = X^α × Y^β × (b + Z)^γ`).

**Design system:** Economist-inspired dark mode via CSS variables (`--eco-red`, `--eco-black`, etc.) in `app/globals.css`. Reusable classes: `.eco-card`, `.stat-card`, `.eco-badge`, `.eco-table`, `.headline`, `.subheadline`.

### 2. VS Code Extension (`/tokalator-extension-vs`)
Real-time context budget sidebar and `@tokalator` chat participant.

Core logic in `src/core/`:
- `contextMonitor.ts` — listens to editor events, tracks open tabs and diagnostics
- `tabRelevanceScorer.pure.ts` — pure scoring function, R ∈ [0,1] weighted across language match (0.25), import relationships (0.30), path similarity (0.20), edit recency (0.15), diagnostics (0.10)
- `tokenBudgetEstimator.ts` — computes budget from model context window minus system/conversation overhead
- `tokenizerService.ts` — wraps `@anthropic-ai/tokenizer` (Claude BPE) and `js-tiktoken` (OpenAI o200k_base)
- `sessionLogger.ts` — opt-in anonymized research logging (aggregate counts only, no filenames)
- `modelProfiles.ts` — 17 model profiles with per-MTok pricing (Claude Opus/Sonnet/Haiku 4.x, GPT-5.x, o3, o4-mini, Gemini 3.x/2.5). Each profile has `inputCostPerMTok` and `outputCostPerMTok` for live cost estimation in the dashboard.

The sidebar dashboard (`src/webview/contextDashboardProvider.ts`) renders an inline HTML webview with a cost estimation box that computes per-turn cost from input tokens and model max output using the model's pricing rates.

Bundled with esbuild (not tsc), outputs a single `dist/extension.js`. The scorer evaluation framework lives in `/evaluation/` with human labels and scripts to compute precision/recall/F1.

### 3. MCP Server (`/tokalator-mcp`)
Stdio JSON-RPC server exposing 4 tools: `count_tokens`, `estimate_budget`, `preview_turn`, `list_models`. Registered in `.mcp.json` and auto-loaded by Claude Code. The CLI (`src/cli.ts`) exposes the same tools from the terminal.

### 4. Python API (`/api`)
FastAPI backend for CSV upload and Cobb-Douglas econometric calculations. Separate from the Next.js server; not deployed on Vercel.

## Key Constraints

- `lib/db.ts` and `prisma/` are **excluded from the TypeScript build** (`tsconfig.json`) due to Prisma 7 breaking changes (config moved to `prisma.config.ts`). Don't import `lib/db.ts` until this is resolved.
- `tokalator-extension-vs/`, `copilot-contribution/`, `user-content/`, `awesome-copilot/`, `examples/`, and `reference-material/` are all excluded from the root `tsconfig.json`. Each subdirectory has its own build.
- Static content lives in `/content/*.json` — homepage, site nav, events, extension features, wiki articles.
- The `fetch-wiki-agent.py` script requires `GOOGLE_API_KEY` and `ANTHROPIC_API_KEY` environment variables (used by CI's `fetch-wiki.yml` workflow). These must be set as GitHub repo secrets for the scheduled workflow to succeed. The script uses `agno` framework with `google-genai` (not `google-generativeai`).
