# Codebase Site Map

<!-- tokalator-context: 9b3886928c0d1cf24b7d68e23b612a7d09179a596fed87ae43c56f44f96bc723 -->

Generated from source; do not edit. Refresh with the context command.
This is a navigation aid, not proof of behavior. Verify source, callers, and tests.

## How agents should use these files

1. Locate the relevant module below and its declarations in [GLOSSARY.md](GLOSSARY.md).
2. Read the source and its tests before changing behavior. Treat comments as claims to verify.
3. Follow import links to inspect dependencies; aliases and dynamic dependencies may be unresolved.
4. Refresh both documents before review and after edits. Run project checks separately.

## Packages and commands

| Manifest | Package | Entry | Script names |
|---|---|---|---|
| [package.json](package.json) | tokalator |  | build, dev, dev:api, fetch-wiki, fetch-wiki-agent, lint, start, test, test:all |
| [tokalator-extension-vs/package.json](tokalator-extension-vs/package.json) | tokalator | ./dist/extension.js | compile, generate-models, lint, package, test, vscode:prepublish, watch |
| [tokalator-mcp/package.json](tokalator-mcp/package.json) | tokalator-mcp | build/index.js | build, dev |

## Modules and entry points

| File | Role / documented purpose | Source hash |
|---|---|---|
| [api/__init__.py](api/__init__.py) | Source module | e3b0c44298fc |
| [api/main.py](api/main.py) | Tokalator Python API — FastAPI backend for econometric computation & CSV parsing. | 10ba7636b6c5 |
| [api/models.py](api/models.py) | Pydantic schemas for Tokalator API. | 2661f69e9e8c |
| [api/routers/__init__.py](api/routers/__init__.py) | Source module | e3b0c44298fc |
| [api/routers/csv_upload.py](api/routers/csv_upload.py) | CSV Upload Router — parse platform exports into normalized UsageRecords. | 12459b2149dc |
| [api/routers/economics.py](api/routers/economics.py) | Economics Router — Cobb-Douglas quality function and caching break-even. | fc14c558a616 |
| [app/_components/web-vitals.tsx](app/_components/web-vitals.tsx) | Source module | 00edf985885a |
| [app/about/page.tsx](app/about/page.tsx) | Page: /about (filesystem route; base paths/rewrites not applied) | ac0d74e2b217 |
| [app/agents/[id]/page.tsx](app/agents/%5Bid%5D/page.tsx) | Page: /agents/[id] (filesystem route; base paths/rewrites not applied) | b29f501af0eb |
| [app/agents/page.tsx](app/agents/page.tsx) | Page: /agents (filesystem route; base paths/rewrites not applied) | e70c95e232d8 |
| [app/calculator/page.tsx](app/calculator/page.tsx) | Page: /calculator (filesystem route; base paths/rewrites not applied) | 69603a193d3a |
| [app/catalog/[id]/page.tsx](app/catalog/%5Bid%5D/page.tsx) | Page: /catalog/[id] (filesystem route; base paths/rewrites not applied) | 37fc6c134c63 |
| [app/catalog/page.tsx](app/catalog/page.tsx) | Page: /catalog (filesystem route; base paths/rewrites not applied) | a2bbfe961602 |
| [app/collections/[id]/page.tsx](app/collections/%5Bid%5D/page.tsx) | Page: /collections/[id] (filesystem route; base paths/rewrites not applied) | eedee5a7b280 |
| [app/collections/page.tsx](app/collections/page.tsx) | Page: /collections (filesystem route; base paths/rewrites not applied) | 381a799e4509 |
| [app/context-engineering/page.tsx](app/context-engineering/page.tsx) | Page: /context-engineering (filesystem route; base paths/rewrites not applied) | c6b131c869eb |
| [app/context/page.tsx](app/context/page.tsx) | Page: /context (filesystem route; base paths/rewrites not applied) | c8b5d8f234b9 |
| [app/dictionary/layout.tsx](app/dictionary/layout.tsx) | Source module | 253ebeedeec5 |
| [app/dictionary/page.tsx](app/dictionary/page.tsx) | Page: /dictionary (filesystem route; base paths/rewrites not applied) | c0a1ca8fdf82 |
| [app/events/[slug]/page.tsx](app/events/%5Bslug%5D/page.tsx) | Page: /events/[slug] (filesystem route; base paths/rewrites not applied) | b52277b28424 |
| [app/events/layout.tsx](app/events/layout.tsx) | Source module | 15f54bac0ff9 |
| [app/events/page.tsx](app/events/page.tsx) | Page: /events (filesystem route; base paths/rewrites not applied) | 4a1a33df266a |
| [app/extension/layout.tsx](app/extension/layout.tsx) | Source module | 15209aacdeb0 |
| [app/extension/page.tsx](app/extension/page.tsx) | Page: /extension (filesystem route; base paths/rewrites not applied) | 76bdc3515112 |
| [app/instructions/[id]/page.tsx](app/instructions/%5Bid%5D/page.tsx) | Page: /instructions/[id] (filesystem route; base paths/rewrites not applied) | b7f594a90755 |
| [app/instructions/page.tsx](app/instructions/page.tsx) | Page: /instructions (filesystem route; base paths/rewrites not applied) | b048269022da |
| [app/layout.tsx](app/layout.tsx) | Source module | c69d5df14f79 |
| [app/learn/layout.tsx](app/learn/layout.tsx) | Source module | bcce1a1a796a |
| [app/learn/page.tsx](app/learn/page.tsx) | Page: /learn (filesystem route; base paths/rewrites not applied) | d86e40e87692 |
| [app/not-found.tsx](app/not-found.tsx) | Source module | 4a8c71927408 |
| [app/opengraph-image.tsx](app/opengraph-image.tsx) | Source module | 6cf8c2dff7f9 |
| [app/page.tsx](app/page.tsx) | Page: / (filesystem route; base paths/rewrites not applied) | 22289c5074ab |
| [app/privacy/page.tsx](app/privacy/page.tsx) | Page: /privacy (filesystem route; base paths/rewrites not applied) | ef05afe77544 |
| [app/pro/page.tsx](app/pro/page.tsx) | Page: /pro (filesystem route; base paths/rewrites not applied) | 0b77b1bcdcdb |
| [app/prompts/[id]/page.tsx](app/prompts/%5Bid%5D/page.tsx) | Page: /prompts/[id] (filesystem route; base paths/rewrites not applied) | aa8224ffa9ed |
| [app/prompts/page.tsx](app/prompts/page.tsx) | Page: /prompts (filesystem route; base paths/rewrites not applied) | d6353cfb1f24 |
| [app/robots.ts](app/robots.ts) | Source module | 4828ae2dcefa |
| [app/sitemap.ts](app/sitemap.ts) | Source module | 35c901213cb8 |
| [app/terms/page.tsx](app/terms/page.tsx) | Page: /terms (filesystem route; base paths/rewrites not applied) | 51f55100d5b7 |
| [app/tools/analysis/page.tsx](app/tools/analysis/page.tsx) | Page: /tools/analysis (filesystem route; base paths/rewrites not applied) | 9a9454f9102e |
| [app/tools/caching/page.tsx](app/tools/caching/page.tsx) | Page: /tools/caching (filesystem route; base paths/rewrites not applied) | d445a16d4f82 |
| [app/tools/calculator/CalculatorClient.tsx](app/tools/calculator/CalculatorClient.tsx) | Source module | 108544268dda |
| [app/tools/calculator/page.tsx](app/tools/calculator/page.tsx) | Page: /tools/calculator (filesystem route; base paths/rewrites not applied) | 208cf43b1a84 |
| [app/tools/compare/CompareClient.tsx](app/tools/compare/CompareClient.tsx) | Source module | 7907e043276b |
| [app/tools/compare/layout.tsx](app/tools/compare/layout.tsx) | Source module | 7dda76e62cdf |
| [app/tools/compare/page.tsx](app/tools/compare/page.tsx) | Page: /tools/compare (filesystem route; base paths/rewrites not applied) | e87e4bb657e6 |
| [app/tools/conversation/page.tsx](app/tools/conversation/page.tsx) | Page: /tools/conversation (filesystem route; base paths/rewrites not applied) | 340c055dbfe3 |
| [app/tools/economics/EconomicsClient.tsx](app/tools/economics/EconomicsClient.tsx) | Source module | 6e3cd91cab12 |
| [app/tools/economics/page.tsx](app/tools/economics/page.tsx) | Page: /tools/economics (filesystem route; base paths/rewrites not applied) | 45c488bee8db |
| [app/tools/page.tsx](app/tools/page.tsx) | Page: /tools (filesystem route; base paths/rewrites not applied) | b97ef66a358e |
| [app/tools/pricing/layout.tsx](app/tools/pricing/layout.tsx) | Source module | 27a5ee5ccad5 |
| [app/tools/pricing/page.tsx](app/tools/pricing/page.tsx) | Page: /tools/pricing (filesystem route; base paths/rewrites not applied) | 9749a230f228 |
| [app/tools/usage/page.tsx](app/tools/usage/page.tsx) | Page: /tools/usage (filesystem route; base paths/rewrites not applied) | 5c8598158e0c |
| [app/wiki/[slug]/page.tsx](app/wiki/%5Bslug%5D/page.tsx) | Page: /wiki/[slug] (filesystem route; base paths/rewrites not applied) | b228005849f3 |
| [app/wiki/layout.tsx](app/wiki/layout.tsx) | Source module | 58c376e88e46 |
| [app/wiki/page.tsx](app/wiki/page.tsx) | Page: /wiki (filesystem route; base paths/rewrites not applied) | d1bc25907da1 |
| [components/caching-calculator.tsx](components/caching-calculator.tsx) | Source module | 3bc05a3bd304 |
| [components/catalog/catalog-card.tsx](components/catalog/catalog-card.tsx) | Source module | 02832a5289a3 |
| [components/catalog/catalog-detail.tsx](components/catalog/catalog-detail.tsx) | Source module | 7e29f6382342 |
| [components/catalog/catalog-grid-unified.tsx](components/catalog/catalog-grid-unified.tsx) | Source module | 588ddd7059fa |
| [components/catalog/catalog-grid.tsx](components/catalog/catalog-grid.tsx) | Source module | d6186cc16f12 |
| [components/catalog/ecosystem-columns.tsx](components/catalog/ecosystem-columns.tsx) | Source module | b546a7838d21 |
| [components/catalog/featured-cards.tsx](components/catalog/featured-cards.tsx) | Source module | 787e465211d7 |
| [components/catalog/filter-bar.tsx](components/catalog/filter-bar.tsx) | Source module | a93cfaccb3d8 |
| [components/catalog/markdown-renderer.tsx](components/catalog/markdown-renderer.tsx) | Source module | df4bc6ee5741 |
| [components/catalog/stat-bar.tsx](components/catalog/stat-bar.tsx) | Source module | 62952aefc0e7 |
| [components/cli-terminal.tsx](components/cli-terminal.tsx) | Source module | e35aa78eafe9 |
| [components/code-maps-release.tsx](components/code-maps-release.tsx) | Source module | 97542015846c |
| [components/command-typer.tsx](components/command-typer.tsx) | Source module | c753d3ce2c1b |
| [components/comparison-charts.tsx](components/comparison-charts.tsx) | Source module | b9dbacb6d567 |
| [components/context-optimizer.tsx](components/context-optimizer.tsx) | Source module | a85a4f9357bf |
| [components/conversation-estimator.tsx](components/conversation-estimator.tsx) | Source module | f045dfcd6920 |
| [components/cost-calculator.tsx](components/cost-calculator.tsx) | Source module | 711c43f9e091 |
| [components/dashboard-charts.tsx](components/dashboard-charts.tsx) | Source module | 90ebbeca50b1 |
| [components/demo-mockup.tsx](components/demo-mockup.tsx) | Source module | 2c79dd18fc38 |
| [components/docs-layout.tsx](components/docs-layout.tsx) | Source module | dd7174644d64 |
| [components/economic-analysis.tsx](components/economic-analysis.tsx) | Source module | 7f1d5202aa2b |
| [components/extension-docs.tsx](components/extension-docs.tsx) | Source module | e398fcf98026 |
| [components/extension-showcase.tsx](components/extension-showcase.tsx) | Source module | 0e97922831c7 |
| [components/hero-morph.tsx](components/hero-morph.tsx) | Source module | 6ff4fb6181d5 |
| [components/icons.tsx](components/icons.tsx) | Material Icons wrapper component | 2ea44eca6490 |
| [components/istanbul-cat.tsx](components/istanbul-cat.tsx) | Source module | ef9de3f2f2c8 |
| [components/live-market-dashboard.tsx](components/live-market-dashboard.tsx) | Source module | 8345503ea47b |
| [components/logo.tsx](components/logo.tsx) | Source module | 2c3c3d1dd2ec |
| [components/model-changelog.tsx](components/model-changelog.tsx) | Source module | c9bcd649ffc5 |
| [components/side-nav.tsx](components/side-nav.tsx) | Source module | d3224ca007c6 |
| [components/sidebar.tsx](components/sidebar.tsx) | Source module | ff5f9ecd4ae9 |
| [components/star-count.tsx](components/star-count.tsx) | Source module | 0d7522bdb95f |
| [components/theme-toggle.tsx](components/theme-toggle.tsx) | Source module | ea42bc5b4b36 |
| [components/top-nav.tsx](components/top-nav.tsx) | Source module | d2573eb05cb4 |
| [components/usage-tracker-v2.tsx](components/usage-tracker-v2.tsx) | Source module | 7fb2c5689498 |
| [components/usage-tracker.tsx](components/usage-tracker.tsx) | Source module | dde43fd828ab |
| [eslint.config.mjs](eslint.config.mjs) | Source module | d3fd096eb7a1 |
| [jest.config.js](jest.config.js) | Source module | c72ece76fee2 |
| [lib/__tests__/caching.test.ts](lib/__tests__/caching.test.ts) | Unit tests for lib/caching.ts | b46027af95a4 |
| [lib/__tests__/catalog.test.ts](lib/__tests__/catalog.test.ts) | Test/support file (path convention) | 27eac707fae7 |
| [lib/__tests__/context.test.ts](lib/__tests__/context.test.ts) | Unit tests for lib/context.ts | d979dc2699ee |
| [lib/__tests__/conversation.test.ts](lib/__tests__/conversation.test.ts) | Unit tests for lib/conversation.ts | c875bd4c5fdf |
| [lib/__tests__/pricing.test.ts](lib/__tests__/pricing.test.ts) | Unit tests for lib/pricing.ts | de6f41ef1390 |
| [lib/__tests__/providers.test.ts](lib/__tests__/providers.test.ts) | Test/support file (path convention) | cc774a879dc7 |
| [lib/caching.ts](lib/caching.ts) | Caching ROI Calculator | c5d031bb5f17 |
| [lib/catalog/frontmatter.ts](lib/catalog/frontmatter.ts) | Source module | 9b6c081dd9ea |
| [lib/catalog/index.ts](lib/catalog/index.ts) | Source module | 2b44c8721fee |
| [lib/catalog/scanner.ts](lib/catalog/scanner.ts) | Source module | 566b4e8bf5b9 |
| [lib/context.ts](lib/context.ts) | Context Window Utilities | 0741c2c9c84f |
| [lib/conversation.ts](lib/conversation.ts) | Multi-turn Conversation Cost Estimator | 27ab47e89666 |
| [lib/db.ts](lib/db.ts) | Source module | 134506696730 |
| [lib/i18n.ts](lib/i18n.ts) | Source module | cf44e856dc1f |
| [lib/market-data.ts](lib/market-data.ts) | Simulated Live Market Data for Token Usage | 4fba0021ee10 |
| [lib/pricing.ts](lib/pricing.ts) | Tokalator - Cost Calculation & Economic Model Library | 9a8295c1fedc |
| [lib/providers.ts](lib/providers.ts) | Multi-Provider Pricing & Model Data | 40c54af96999 |
| [lib/theme-palette.ts](lib/theme-palette.ts) | Shared theme colors for inline styles and SVG charts. | 0332daa08058 |
| [lib/types/catalog.ts](lib/types/catalog.ts) | Source module | 4745633c6772 |
| [lib/wiki/types.ts](lib/wiki/types.ts) | Source module | b720610cbdd1 |
| [next.config.ts](next.config.ts) | Source module | 5e55c4ec8e18 |
| [postcss.config.mjs](postcss.config.mjs) | Source module | dfac7ac2d86d |
| [prisma.config.ts](prisma.config.ts) | Source module | c1bcbd0ff267 |
| [prisma/seed.ts](prisma/seed.ts) | Source module | d294f6f257c8 |
| [scripts/analyze-experiment.py](scripts/analyze-experiment.py) | Controlled Experiment Analysis Script | cfd92f786f26 |
| [scripts/collect-snapshots.ts](scripts/collect-snapshots.ts) | Snapshot Collector for Relevance Scorer Evaluation | a618f500c238 |
| [scripts/compute-agreement.py](scripts/compute-agreement.py) | Inter-Annotator Agreement (Fleiss' Kappa) | 28ed799777b1 |
| [scripts/evaluate-scorer.ts](scripts/evaluate-scorer.ts) | Relevance Scorer Evaluation Script | ebd2548222c7 |
| [scripts/fetch-pricing-agent.py](scripts/fetch-pricing-agent.py) | Pricing refresh agent for Tokalator. | 0ca7ad4d5b1a |
| [scripts/fetch-wiki-agent.py](scripts/fetch-wiki-agent.py) | Agentic wiki fetcher powered by the Agno framework. | a2b8dabc725a |
| [scripts/fetch-wiki.ts](scripts/fetch-wiki.ts) | Build-time script to fetch context engineering content from external sources. | f36b4d41818d |
| [scripts/fix-pricing.py](scripts/fix-pricing.py) | Rewrite the corrupted pricing page cleanly. | 610d58e0b151 |
| [scripts/tokalator-context.py](scripts/tokalator-context.py) | Build deterministic, source-backed context documents without a model or network. | c2dfdbae5d80 |
| [scripts/write-components.py](scripts/write-components.py) | Write the rewritten component files. | fc4a53624c67 |
| [scripts/write-dictionary.py](scripts/write-dictionary.py) | Source module | a483188d4f17 |
| [scripts/write-learn-page.py](scripts/write-learn-page.py) | Write the updated Learn page with: | a4e8231a1ae1 |
| [scripts/write-learn.py](scripts/write-learn.py) | Source module | d04bb6b0a0d9 |
| [tokalator-extension-vs/__tests__/__mocks__/vscode.ts](tokalator-extension-vs/__tests__/__mocks__/vscode.ts) | Mock of the vscode module for unit testing. | 5be8ea14e2ca |
| [tokalator-extension-vs/__tests__/contextChatParticipant.test.ts](tokalator-extension-vs/__tests__/contextChatParticipant.test.ts) | Tests for ContextChatParticipant — /terminology-gen command | b38d05fbee98 |
| [tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts](tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts) | Tests for ContextDashboardProvider | 698a82a34bf8 |
| [tokalator-extension-vs/__tests__/modelProfiles.test.ts](tokalator-extension-vs/__tests__/modelProfiles.test.ts) | Unit tests for extension: core/modelProfiles.ts | fdd95d28c407 |
| [tokalator-extension-vs/eslint.config.mjs](tokalator-extension-vs/eslint.config.mjs) | Source module | fe83928fda4e |
| [tokalator-extension-vs/jest.config.js](tokalator-extension-vs/jest.config.js) | Source module | 7b4458fe584d |
| [tokalator-extension-vs/scripts/generate-models.ts](tokalator-extension-vs/scripts/generate-models.ts) | Codegen: reads models.json → writes modelProfiles.ts + updates package.json enum. | fc4010e58a10 |
| [tokalator-extension-vs/src/chat/contextChatParticipant.ts](tokalator-extension-vs/src/chat/contextChatParticipant.ts) | Source module | 0c047c5bdf62 |
| [tokalator-extension-vs/src/core/authService.ts](tokalator-extension-vs/src/core/authService.ts) | Source module | 9236cdad4468 |
| [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts) | Source module | 6965a935b96b |
| [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts) | Source module | e6bd130d633f |
| [tokalator-extension-vs/src/core/copilotPlan.ts](tokalator-extension-vs/src/core/copilotPlan.ts) | Source module | 1a772e3b6c63 |
| [tokalator-extension-vs/src/core/licenseService.ts](tokalator-extension-vs/src/core/licenseService.ts) | Source module | 27627ec3fb36 |
| [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts) | Known AI model profiles with context window, pricing, and metadata. | ce8d9400eb62 |
| [tokalator-extension-vs/src/core/priceWatch.ts](tokalator-extension-vs/src/core/priceWatch.ts) | Source module | 90ae741d0866 |
| [tokalator-extension-vs/src/core/pricing.ts](tokalator-extension-vs/src/core/pricing.ts) | Source module | 83057f46d181 |
| [tokalator-extension-vs/src/core/pricingCatalog.ts](tokalator-extension-vs/src/core/pricingCatalog.ts) | Source module | 980632653081 |
| [tokalator-extension-vs/src/core/sessionLogger.ts](tokalator-extension-vs/src/core/sessionLogger.ts) | Source module | 0f0def52d5de |
| [tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts) | Pure-function relevance scorer with no VS Code dependencies. | 2aa0f6d34675 |
| [tokalator-extension-vs/src/core/tabRelevanceScorer.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.ts) | Source module | 6c627acd3a75 |
| [tokalator-extension-vs/src/core/telemetrySync.ts](tokalator-extension-vs/src/core/telemetrySync.ts) | Source module | 98d0e581558e |
| [tokalator-extension-vs/src/core/tokenBudgetEstimator.ts](tokalator-extension-vs/src/core/tokenBudgetEstimator.ts) | Test/support file (path convention) | 5f0ba3b720d2 |
| [tokalator-extension-vs/src/core/tokenizerService.ts](tokalator-extension-vs/src/core/tokenizerService.ts) | Model-specific tokenizer service. | 17e569b1ae9b |
| [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts) | Source module | 947661cac238 |
| [tokalator-extension-vs/src/core/usageAnalytics.ts](tokalator-extension-vs/src/core/usageAnalytics.ts) | Source module | 5546b955f632 |
| [tokalator-extension-vs/src/core/workspaceSecurityScanner.ts](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts) | Source module | 6e3ed86408a3 |
| [tokalator-extension-vs/src/extension.ts](tokalator-extension-vs/src/extension.ts) | Editor extension entry point (filename convention) | be14f390a5fa |
| [tokalator-extension-vs/src/webview/contextDashboardProvider.ts](tokalator-extension-vs/src/webview/contextDashboardProvider.ts) | Source module | b57b9360bd5e |
| [tokalator-mcp/src/cli.ts](tokalator-mcp/src/cli.ts) | CLI entry point (filename convention) | b2194190499c |
| [tokalator-mcp/src/core/budgetEstimator.ts](tokalator-mcp/src/core/budgetEstimator.ts) | Token budget estimator for MCP — operates on plain file paths. | b868fbbad9d8 |
| [tokalator-mcp/src/core/modelProfiles.ts](tokalator-mcp/src/core/modelProfiles.ts) | Claude model profiles for Tokalator MCP. | 5904714fb9d5 |
| [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts) | Token counting service using real BPE tokenizers. | 8e5fad76f958 |
| [tokalator-mcp/src/core/types.ts](tokalator-mcp/src/core/types.ts) | Budget allocation breakdown | 45a94bc00bbf |
| [tokalator-mcp/src/index.ts](tokalator-mcp/src/index.ts) | Tokalator MCP Server | 1635fc241f54 |
| [tokalator-mcp/src/tools/countTokens.ts](tokalator-mcp/src/tools/countTokens.ts) | Source module | 2cbb086f83ea |
| [tokalator-mcp/src/tools/estimateBudget.ts](tokalator-mcp/src/tools/estimateBudget.ts) | Source module | a1532f5e1488 |
| [tokalator-mcp/src/tools/listModels.ts](tokalator-mcp/src/tools/listModels.ts) | Source module | 92c11be1c1c6 |
| [tokalator-mcp/src/tools/previewTurn.ts](tokalator-mcp/src/tools/previewTurn.ts) | Source module | 857ca60953c0 |

## Imports by module

- [api/main.py](api/main.py) → api.models (external or unresolved), api.routers (external or unresolved), fastapi (external or unresolved), fastapi.middleware.cors (external or unresolved)
- [api/models.py](api/models.py) → enum (external or unresolved), pydantic (external or unresolved)
- [api/routers/csv_upload.py](api/routers/csv_upload.py) → api.models (external or unresolved), csv (external or unresolved), datetime (external or unresolved), fastapi (external or unresolved), io (external or unresolved), uuid (external or unresolved)
- [api/routers/economics.py](api/routers/economics.py) → api.models (external or unresolved), fastapi (external or unresolved), math (external or unresolved)
- [app/_components/web-vitals.tsx](app/_components/web-vitals.tsx) → next/web-vitals (external or unresolved)
- [app/about/page.tsx](app/about/page.tsx) → next (external or unresolved)
- [app/agents/[id]/page.tsx](app/agents/%5Bid%5D/page.tsx) → @/components/catalog/catalog-detail (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved), next/navigation (external or unresolved)
- [app/agents/page.tsx](app/agents/page.tsx) → @/components/catalog/catalog-grid (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved)
- [app/calculator/page.tsx](app/calculator/page.tsx) → @/components/cost-calculator (external or unresolved), next (external or unresolved)
- [app/catalog/[id]/page.tsx](app/catalog/%5Bid%5D/page.tsx) → @/components/catalog/catalog-detail (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved), next/navigation (external or unresolved)
- [app/catalog/page.tsx](app/catalog/page.tsx) → @/components/catalog/catalog-grid-unified (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved)
- [app/collections/[id]/page.tsx](app/collections/%5Bid%5D/page.tsx) → @/components/catalog/catalog-detail (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved), next/navigation (external or unresolved)
- [app/collections/page.tsx](app/collections/page.tsx) → @/components/catalog/catalog-grid (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved)
- [app/context-engineering/page.tsx](app/context-engineering/page.tsx) → next (external or unresolved)
- [app/context/page.tsx](app/context/page.tsx) → @/components/context-optimizer (external or unresolved), next (external or unresolved)
- [app/dictionary/layout.tsx](app/dictionary/layout.tsx) → next (external or unresolved)
- [app/dictionary/page.tsx](app/dictionary/page.tsx) → ../../content/dictionary.json (external or unresolved), react (external or unresolved)
- [app/events/[slug]/page.tsx](app/events/%5Bslug%5D/page.tsx) → ../../../content/events.json (external or unresolved), next (external or unresolved), next/link (external or unresolved)
- [app/events/layout.tsx](app/events/layout.tsx) → next (external or unresolved)
- [app/events/page.tsx](app/events/page.tsx) → ../../content/events.json (external or unresolved), next/link (external or unresolved), react (external or unresolved)
- [app/extension/layout.tsx](app/extension/layout.tsx) → next (external or unresolved)
- [app/extension/page.tsx](app/extension/page.tsx) → [components/cli-terminal.tsx](components/cli-terminal.tsx), ../../content/extension.json (external or unresolved), @vercel/analytics (external or unresolved), motion/react (external or unresolved), next/image (external or unresolved), react (external or unresolved)
- [app/instructions/[id]/page.tsx](app/instructions/%5Bid%5D/page.tsx) → @/components/catalog/catalog-detail (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved), next/navigation (external or unresolved)
- [app/instructions/page.tsx](app/instructions/page.tsx) → @/components/catalog/catalog-grid (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved)
- [app/layout.tsx](app/layout.tsx) → [app/_components/web-vitals.tsx](app/_components/web-vitals.tsx), ./globals.css (external or unresolved), @/components/side-nav (external or unresolved), @vercel/analytics/next (external or unresolved), @vercel/speed-insights/next (external or unresolved), next (external or unresolved)
- [app/learn/layout.tsx](app/learn/layout.tsx) → next (external or unresolved)
- [app/learn/page.tsx](app/learn/page.tsx) → @/lib/theme-palette (external or unresolved), next/link (external or unresolved)
- [app/not-found.tsx](app/not-found.tsx) → next/link (external or unresolved)
- [app/opengraph-image.tsx](app/opengraph-image.tsx) → next/og (external or unresolved)
- [app/page.tsx](app/page.tsx) → ./home.css (external or unresolved), ./models (external or unresolved), @/components/theme-toggle (external or unresolved), @/content/site.json (external or unresolved), motion/react (external or unresolved), next/link (external or unresolved), react (external or unresolved)
- [app/privacy/page.tsx](app/privacy/page.tsx) → next (external or unresolved), next/link (external or unresolved)
- [app/pro/page.tsx](app/pro/page.tsx) → next (external or unresolved)
- [app/prompts/[id]/page.tsx](app/prompts/%5Bid%5D/page.tsx) → @/components/catalog/catalog-detail (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved), next/navigation (external or unresolved)
- [app/prompts/page.tsx](app/prompts/page.tsx) → @/components/catalog/catalog-grid (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved)
- [app/robots.ts](app/robots.ts) → next (external or unresolved)
- [app/sitemap.ts](app/sitemap.ts) → ../content/wiki/articles.json (external or unresolved), @/lib/catalog (external or unresolved), next (external or unresolved)
- [app/terms/page.tsx](app/terms/page.tsx) → next (external or unresolved), next/link (external or unresolved)
- [app/tools/analysis/page.tsx](app/tools/analysis/page.tsx) → @/components/economic-analysis (external or unresolved), next (external or unresolved)
- [app/tools/caching/page.tsx](app/tools/caching/page.tsx) → @/components/caching-calculator (external or unresolved), next (external or unresolved)
- [app/tools/calculator/CalculatorClient.tsx](app/tools/calculator/CalculatorClient.tsx) → @/lib/providers (external or unresolved), motion/react (external or unresolved), react (external or unresolved)
- [app/tools/calculator/page.tsx](app/tools/calculator/page.tsx) → [app/tools/calculator/CalculatorClient.tsx](app/tools/calculator/CalculatorClient.tsx), next (external or unresolved), react (external or unresolved)
- [app/tools/compare/CompareClient.tsx](app/tools/compare/CompareClient.tsx) → @/components/comparison-charts (external or unresolved), react (external or unresolved)
- [app/tools/compare/layout.tsx](app/tools/compare/layout.tsx) → next (external or unresolved)
- [app/tools/compare/page.tsx](app/tools/compare/page.tsx) → [app/tools/compare/CompareClient.tsx](app/tools/compare/CompareClient.tsx), react (external or unresolved)
- [app/tools/conversation/page.tsx](app/tools/conversation/page.tsx) → @/components/conversation-estimator (external or unresolved), next (external or unresolved)
- [app/tools/economics/EconomicsClient.tsx](app/tools/economics/EconomicsClient.tsx) → @/lib/pricing (external or unresolved), @/lib/providers (external or unresolved), @/lib/theme-palette (external or unresolved), motion/react (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [app/tools/economics/page.tsx](app/tools/economics/page.tsx) → [app/tools/economics/EconomicsClient.tsx](app/tools/economics/EconomicsClient.tsx), next (external or unresolved), react (external or unresolved)
- [app/tools/page.tsx](app/tools/page.tsx) → next (external or unresolved), next/link (external or unresolved)
- [app/tools/pricing/layout.tsx](app/tools/pricing/layout.tsx) → next (external or unresolved)
- [app/tools/pricing/page.tsx](app/tools/pricing/page.tsx) → @/lib/pricing (external or unresolved), @/lib/providers (external or unresolved)
- [app/tools/usage/page.tsx](app/tools/usage/page.tsx) → @/components/usage-tracker-v2 (external or unresolved), next (external or unresolved)
- [app/wiki/[slug]/page.tsx](app/wiki/%5Bslug%5D/page.tsx) → ../../../content/wiki/articles.json (external or unresolved), next (external or unresolved), next/link (external or unresolved)
- [app/wiki/layout.tsx](app/wiki/layout.tsx) → next (external or unresolved)
- [app/wiki/page.tsx](app/wiki/page.tsx) → ../../content/wiki/articles.json (external or unresolved), next/link (external or unresolved), react (external or unresolved)
- [components/caching-calculator.tsx](components/caching-calculator.tsx) → @/lib/caching (external or unresolved), @/lib/context (external or unresolved), @/lib/pricing (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [components/catalog/catalog-card.tsx](components/catalog/catalog-card.tsx) → @/lib/types/catalog (external or unresolved), next/link (external or unresolved)
- [components/catalog/catalog-detail.tsx](components/catalog/catalog-detail.tsx) → [components/catalog/markdown-renderer.tsx](components/catalog/markdown-renderer.tsx), @/lib/catalog/frontmatter (external or unresolved), @/lib/types/catalog (external or unresolved), next/link (external or unresolved), react (external or unresolved)
- [components/catalog/catalog-grid-unified.tsx](components/catalog/catalog-grid-unified.tsx) → [components/catalog/catalog-card.tsx](components/catalog/catalog-card.tsx), [components/catalog/filter-bar.tsx](components/catalog/filter-bar.tsx), @/lib/types/catalog (external or unresolved), react (external or unresolved)
- [components/catalog/catalog-grid.tsx](components/catalog/catalog-grid.tsx) → [components/catalog/catalog-card.tsx](components/catalog/catalog-card.tsx), [components/catalog/filter-bar.tsx](components/catalog/filter-bar.tsx), @/lib/types/catalog (external or unresolved), motion/react (external or unresolved), react (external or unresolved)
- [components/catalog/ecosystem-columns.tsx](components/catalog/ecosystem-columns.tsx) → [components/catalog/catalog-card.tsx](components/catalog/catalog-card.tsx), @/lib/types/catalog (external or unresolved)
- [components/catalog/featured-cards.tsx](components/catalog/featured-cards.tsx) → [components/catalog/catalog-card.tsx](components/catalog/catalog-card.tsx), @/lib/types/catalog (external or unresolved)
- [components/catalog/filter-bar.tsx](components/catalog/filter-bar.tsx) → @/lib/types/catalog (external or unresolved)
- [components/catalog/markdown-renderer.tsx](components/catalog/markdown-renderer.tsx) → react (external or unresolved)
- [components/catalog/stat-bar.tsx](components/catalog/stat-bar.tsx) → @/lib/types/catalog (external or unresolved)
- [components/cli-terminal.tsx](components/cli-terminal.tsx) → motion/react (external or unresolved)
- [components/command-typer.tsx](components/command-typer.tsx) → react (external or unresolved)
- [components/comparison-charts.tsx](components/comparison-charts.tsx) → @/lib/providers (external or unresolved), recharts (external or unresolved)
- [components/context-optimizer.tsx](components/context-optimizer.tsx) → @/lib/context (external or unresolved), @/lib/pricing (external or unresolved), @/lib/theme-palette (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [components/conversation-estimator.tsx](components/conversation-estimator.tsx) → @/lib/context (external or unresolved), @/lib/conversation (external or unresolved), @/lib/pricing (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [components/cost-calculator.tsx](components/cost-calculator.tsx) → @/lib/pricing (external or unresolved), @/lib/theme-palette (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [components/dashboard-charts.tsx](components/dashboard-charts.tsx) → @/lib/pricing (external or unresolved), recharts (external or unresolved)
- [components/demo-mockup.tsx](components/demo-mockup.tsx) → , c: P.red }, { t:  (external or unresolved), @/lib/theme-palette (external or unresolved)
- [components/docs-layout.tsx](components/docs-layout.tsx) → [components/icons.tsx](components/icons.tsx), react (external or unresolved)
- [components/economic-analysis.tsx](components/economic-analysis.tsx) → @/lib/pricing (external or unresolved), @/lib/theme-palette (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [components/extension-docs.tsx](components/extension-docs.tsx) → next/link (external or unresolved)
- [components/extension-showcase.tsx](components/extension-showcase.tsx) → [components/catalog/ecosystem-columns.tsx](components/catalog/ecosystem-columns.tsx), [components/catalog/featured-cards.tsx](components/catalog/featured-cards.tsx), [components/catalog/stat-bar.tsx](components/catalog/stat-bar.tsx), @/lib/types/catalog (external or unresolved), next/link (external or unresolved)
- [components/hero-morph.tsx](components/hero-morph.tsx) → motion/react (external or unresolved), react (external or unresolved)
- [components/istanbul-cat.tsx](components/istanbul-cat.tsx) → react (external or unresolved)
- [components/live-market-dashboard.tsx](components/live-market-dashboard.tsx) → @/lib/market-data (external or unresolved), @/lib/providers (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [components/model-changelog.tsx](components/model-changelog.tsx) → @/lib/providers (external or unresolved), react (external or unresolved)
- [components/side-nav.tsx](components/side-nav.tsx) → ../content/site.json (external or unresolved), [components/theme-toggle.tsx](components/theme-toggle.tsx), next/link (external or unresolved), next/navigation (external or unresolved), react (external or unresolved)
- [components/sidebar.tsx](components/sidebar.tsx) → [components/icons.tsx](components/icons.tsx), [components/logo.tsx](components/logo.tsx), next/link (external or unresolved), next/navigation (external or unresolved)
- [components/star-count.tsx](components/star-count.tsx) → react (external or unresolved)
- [components/theme-toggle.tsx](components/theme-toggle.tsx) → react (external or unresolved)
- [components/top-nav.tsx](components/top-nav.tsx) → [components/theme-toggle.tsx](components/theme-toggle.tsx), @vercel/analytics (external or unresolved), next/link (external or unresolved), next/navigation (external or unresolved), react (external or unresolved)
- [components/usage-tracker-v2.tsx](components/usage-tracker-v2.tsx) → @/lib/pricing (external or unresolved), @/lib/theme-palette (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [components/usage-tracker.tsx](components/usage-tracker.tsx) → @/lib/pricing (external or unresolved), @/lib/theme-palette (external or unresolved), react (external or unresolved), recharts (external or unresolved)
- [eslint.config.mjs](eslint.config.mjs) → eslint-config-next/core-web-vitals (external or unresolved), eslint-config-next/typescript (external or unresolved), eslint/config (external or unresolved)
- [lib/__tests__/caching.test.ts](lib/__tests__/caching.test.ts) → [lib/caching.ts](lib/caching.ts)
- [lib/__tests__/catalog.test.ts](lib/__tests__/catalog.test.ts) → [lib/catalog/scanner.ts](lib/catalog/scanner.ts)
- [lib/__tests__/context.test.ts](lib/__tests__/context.test.ts) → [lib/context.ts](lib/context.ts)
- [lib/__tests__/conversation.test.ts](lib/__tests__/conversation.test.ts) → [lib/conversation.ts](lib/conversation.ts)
- [lib/__tests__/pricing.test.ts](lib/__tests__/pricing.test.ts) → [lib/pricing.ts](lib/pricing.ts)
- [lib/__tests__/providers.test.ts](lib/__tests__/providers.test.ts) → ../../content/site.json (external or unresolved), ../../package.json (external or unresolved), [lib/pricing.ts](lib/pricing.ts), [lib/providers.ts](lib/providers.ts)
- [lib/caching.ts](lib/caching.ts) → [lib/pricing.ts](lib/pricing.ts)
- [lib/catalog/frontmatter.ts](lib/catalog/frontmatter.ts) → @/lib/types/catalog (external or unresolved)
- [lib/catalog/index.ts](lib/catalog/index.ts) → [lib/catalog/frontmatter.ts](lib/catalog/frontmatter.ts), [lib/catalog/scanner.ts](lib/catalog/scanner.ts)
- [lib/catalog/scanner.ts](lib/catalog/scanner.ts) → [lib/catalog/frontmatter.ts](lib/catalog/frontmatter.ts), @/lib/types/catalog (external or unresolved), fs (external or unresolved), path (external or unresolved), yaml (external or unresolved)
- [lib/context.ts](lib/context.ts) → [lib/pricing.ts](lib/pricing.ts)
- [lib/conversation.ts](lib/conversation.ts) → [lib/pricing.ts](lib/pricing.ts)
- [lib/db.ts](lib/db.ts) → @prisma/client (external or unresolved)
- [lib/market-data.ts](lib/market-data.ts) → [lib/providers.ts](lib/providers.ts)
- [next.config.ts](next.config.ts) → next (external or unresolved)
- [prisma.config.ts](prisma.config.ts) → dotenv/config (external or unresolved), prisma/config (external or unresolved)
- [prisma/seed.ts](prisma/seed.ts) → @prisma/client (external or unresolved)
- [scripts/analyze-experiment.py](scripts/analyze-experiment.py) → json (external or unresolved), math (external or unresolved), os (external or unresolved), sys (external or unresolved), typing (external or unresolved)
- [scripts/collect-snapshots.ts](scripts/collect-snapshots.ts) → fs (external or unresolved), path (external or unresolved), vscode (external or unresolved)
- [scripts/compute-agreement.py](scripts/compute-agreement.py) → collections (external or unresolved), json (external or unresolved), os (external or unresolved), sys (external or unresolved)
- [scripts/evaluate-scorer.ts](scripts/evaluate-scorer.ts) → [tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts), fs (external or unresolved), path (external or unresolved)
- [scripts/fetch-pricing-agent.py](scripts/fetch-pricing-agent.py) → agno.agent (external or unresolved), agno.models.google (external or unresolved), datetime (external or unresolved), dotenv (external or unresolved), json (external or unresolved), os (external or unresolved), pathlib (external or unresolved), pydantic (external or unresolved), re (external or unresolved), sys (external or unresolved), typing (external or unresolved), urllib.request (external or unresolved)
- [scripts/fetch-wiki-agent.py](scripts/fetch-wiki-agent.py) → agno.agent (external or unresolved), agno.models.google (external or unresolved), agno.tools.arxiv (external or unresolved), datetime (external or unresolved), dotenv (external or unresolved), json (external or unresolved), os (external or unresolved), pathlib (external or unresolved), pydantic (external or unresolved), re (external or unresolved), sys (external or unresolved), typing (external or unresolved), urllib.request (external or unresolved)
- [scripts/fetch-wiki.ts](scripts/fetch-wiki.ts) → fs (external or unresolved), path (external or unresolved)
- [scripts/fix-pricing.py](scripts/fix-pricing.py) → os (external or unresolved)
- [scripts/tokalator-context.py](scripts/tokalator-context.py) → __future__ (external or unresolved), argparse (external or unresolved), ast (external or unresolved), hashlib (external or unresolved), json (external or unresolved), os (external or unresolved), pathlib (external or unresolved), re (external or unresolved), subprocess (external or unresolved), sys (external or unresolved), tempfile (external or unresolved), urllib.parse (external or unresolved)
- [scripts/write-components.py](scripts/write-components.py) → os (external or unresolved)
- [scripts/write-dictionary.py](scripts/write-dictionary.py) → json (external or unresolved)
- [scripts/write-learn-page.py](scripts/write-learn-page.py) → os (external or unresolved)
- [tokalator-extension-vs/__tests__/contextChatParticipant.test.ts](tokalator-extension-vs/__tests__/contextChatParticipant.test.ts) → [tokalator-extension-vs/src/chat/contextChatParticipant.ts](tokalator-extension-vs/src/chat/contextChatParticipant.ts), [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts), vscode (external or unresolved)
- [tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts](tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts) → [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts), [tokalator-extension-vs/src/webview/contextDashboardProvider.ts](tokalator-extension-vs/src/webview/contextDashboardProvider.ts), vscode (external or unresolved)
- [tokalator-extension-vs/__tests__/modelProfiles.test.ts](tokalator-extension-vs/__tests__/modelProfiles.test.ts) → [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts)
- [tokalator-extension-vs/eslint.config.mjs](tokalator-extension-vs/eslint.config.mjs) → typescript-eslint (external or unresolved)
- [tokalator-extension-vs/scripts/generate-models.ts](tokalator-extension-vs/scripts/generate-models.ts) → fs (external or unresolved), path (external or unresolved)
- [tokalator-extension-vs/src/chat/contextChatParticipant.ts](tokalator-extension-vs/src/chat/contextChatParticipant.ts) → [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts), [tokalator-extension-vs/src/core/copilotPlan.ts](tokalator-extension-vs/src/core/copilotPlan.ts), [tokalator-extension-vs/src/core/licenseService.ts](tokalator-extension-vs/src/core/licenseService.ts), [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts), [tokalator-extension-vs/src/core/priceWatch.ts](tokalator-extension-vs/src/core/priceWatch.ts), [tokalator-extension-vs/src/core/telemetrySync.ts](tokalator-extension-vs/src/core/telemetrySync.ts), [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts), [tokalator-extension-vs/src/core/workspaceSecurityScanner.ts](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts), os (external or unresolved), path (external or unresolved), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/authService.ts](tokalator-extension-vs/src/core/authService.ts) → vscode (external or unresolved)
- [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts) → [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts) → [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts), [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts), [tokalator-extension-vs/src/core/sessionLogger.ts](tokalator-extension-vs/src/core/sessionLogger.ts), [tokalator-extension-vs/src/core/tabRelevanceScorer.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.ts), [tokalator-extension-vs/src/core/tokenBudgetEstimator.ts](tokalator-extension-vs/src/core/tokenBudgetEstimator.ts), [tokalator-extension-vs/src/core/tokenizerService.ts](tokalator-extension-vs/src/core/tokenizerService.ts), [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts), [tokalator-extension-vs/src/core/usageAnalytics.ts](tokalator-extension-vs/src/core/usageAnalytics.ts), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/copilotPlan.ts](tokalator-extension-vs/src/core/copilotPlan.ts) → vscode (external or unresolved)
- [tokalator-extension-vs/src/core/licenseService.ts](tokalator-extension-vs/src/core/licenseService.ts) → [tokalator-extension-vs/src/core/authService.ts](tokalator-extension-vs/src/core/authService.ts), [tokalator-extension-vs/src/core/telemetrySync.ts](tokalator-extension-vs/src/core/telemetrySync.ts), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/priceWatch.ts](tokalator-extension-vs/src/core/priceWatch.ts) → [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts), [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts), [tokalator-extension-vs/src/core/usageAnalytics.ts](tokalator-extension-vs/src/core/usageAnalytics.ts), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/pricing.ts](tokalator-extension-vs/src/core/pricing.ts) → [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts)
- [tokalator-extension-vs/src/core/pricingCatalog.ts](tokalator-extension-vs/src/core/pricingCatalog.ts) → [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts), https (external or unresolved), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/sessionLogger.ts](tokalator-extension-vs/src/core/sessionLogger.ts) → [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts), fs (external or unresolved), path (external or unresolved), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/tabRelevanceScorer.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.ts) → [tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts), [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/telemetrySync.ts](tokalator-extension-vs/src/core/telemetrySync.ts) → [tokalator-extension-vs/src/core/authService.ts](tokalator-extension-vs/src/core/authService.ts), http (external or unresolved), https (external or unresolved), url (external or unresolved)
- [tokalator-extension-vs/src/core/tokenBudgetEstimator.ts](tokalator-extension-vs/src/core/tokenBudgetEstimator.ts) → [tokalator-extension-vs/src/core/tokenizerService.ts](tokalator-extension-vs/src/core/tokenizerService.ts), [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts), vscode (external or unresolved)
- [tokalator-extension-vs/src/core/tokenizerService.ts](tokalator-extension-vs/src/core/tokenizerService.ts) → @anthropic-ai/tokenizer/claude.json (external or unresolved), js-tiktoken/lite (external or unresolved), js-tiktoken/ranks/o200k_base (external or unresolved)
- [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts) → vscode (external or unresolved)
- [tokalator-extension-vs/src/core/usageAnalytics.ts](tokalator-extension-vs/src/core/usageAnalytics.ts) → [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts), [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts)
- [tokalator-extension-vs/src/core/workspaceSecurityScanner.ts](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts) → fs (external or unresolved), path (external or unresolved), vscode (external or unresolved)
- [tokalator-extension-vs/src/extension.ts](tokalator-extension-vs/src/extension.ts) → [tokalator-extension-vs/src/chat/contextChatParticipant.ts](tokalator-extension-vs/src/chat/contextChatParticipant.ts), [tokalator-extension-vs/src/core/authService.ts](tokalator-extension-vs/src/core/authService.ts), [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts), [tokalator-extension-vs/src/core/copilotPlan.ts](tokalator-extension-vs/src/core/copilotPlan.ts), [tokalator-extension-vs/src/core/licenseService.ts](tokalator-extension-vs/src/core/licenseService.ts), [tokalator-extension-vs/src/core/priceWatch.ts](tokalator-extension-vs/src/core/priceWatch.ts), [tokalator-extension-vs/src/core/pricingCatalog.ts](tokalator-extension-vs/src/core/pricingCatalog.ts), [tokalator-extension-vs/src/core/telemetrySync.ts](tokalator-extension-vs/src/core/telemetrySync.ts), [tokalator-extension-vs/src/core/workspaceSecurityScanner.ts](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts), [tokalator-extension-vs/src/webview/contextDashboardProvider.ts](tokalator-extension-vs/src/webview/contextDashboardProvider.ts), vscode (external or unresolved)
- [tokalator-extension-vs/src/webview/contextDashboardProvider.ts](tokalator-extension-vs/src/webview/contextDashboardProvider.ts) → +ui.totalTurns+ (external or unresolved), [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts), [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts), [tokalator-extension-vs/src/core/copilotPlan.ts](tokalator-extension-vs/src/core/copilotPlan.ts), [tokalator-extension-vs/src/core/licenseService.ts](tokalator-extension-vs/src/core/licenseService.ts), [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts), [tokalator-extension-vs/src/core/priceWatch.ts](tokalator-extension-vs/src/core/priceWatch.ts), [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts), vscode (external or unresolved)
- [tokalator-mcp/src/cli.ts](tokalator-mcp/src/cli.ts) → [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts), [tokalator-mcp/src/tools/countTokens.ts](tokalator-mcp/src/tools/countTokens.ts), [tokalator-mcp/src/tools/estimateBudget.ts](tokalator-mcp/src/tools/estimateBudget.ts), [tokalator-mcp/src/tools/listModels.ts](tokalator-mcp/src/tools/listModels.ts), [tokalator-mcp/src/tools/previewTurn.ts](tokalator-mcp/src/tools/previewTurn.ts)
- [tokalator-mcp/src/core/budgetEstimator.ts](tokalator-mcp/src/core/budgetEstimator.ts) → [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts), [tokalator-mcp/src/core/types.ts](tokalator-mcp/src/core/types.ts), fs (external or unresolved)
- [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts) → @anthropic-ai/tokenizer/claude.json (external or unresolved), js-tiktoken/lite (external or unresolved), module (external or unresolved)
- [tokalator-mcp/src/index.ts](tokalator-mcp/src/index.ts) → [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts), [tokalator-mcp/src/tools/countTokens.ts](tokalator-mcp/src/tools/countTokens.ts), [tokalator-mcp/src/tools/estimateBudget.ts](tokalator-mcp/src/tools/estimateBudget.ts), [tokalator-mcp/src/tools/listModels.ts](tokalator-mcp/src/tools/listModels.ts), [tokalator-mcp/src/tools/previewTurn.ts](tokalator-mcp/src/tools/previewTurn.ts), @modelcontextprotocol/sdk/server/mcp.js (external or unresolved), @modelcontextprotocol/sdk/server/stdio.js (external or unresolved)
- [tokalator-mcp/src/tools/countTokens.ts](tokalator-mcp/src/tools/countTokens.ts) → [tokalator-mcp/src/core/modelProfiles.ts](tokalator-mcp/src/core/modelProfiles.ts), [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts), fs (external or unresolved), zod (external or unresolved)
- [tokalator-mcp/src/tools/estimateBudget.ts](tokalator-mcp/src/tools/estimateBudget.ts) → [tokalator-mcp/src/core/budgetEstimator.ts](tokalator-mcp/src/core/budgetEstimator.ts), [tokalator-mcp/src/core/modelProfiles.ts](tokalator-mcp/src/core/modelProfiles.ts), [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts), zod (external or unresolved)
- [tokalator-mcp/src/tools/listModels.ts](tokalator-mcp/src/tools/listModels.ts) → [tokalator-mcp/src/core/modelProfiles.ts](tokalator-mcp/src/core/modelProfiles.ts)
- [tokalator-mcp/src/tools/previewTurn.ts](tokalator-mcp/src/tools/previewTurn.ts) → [tokalator-mcp/src/core/modelProfiles.ts](tokalator-mcp/src/core/modelProfiles.ts), zod (external or unresolved)

## Coverage and limitations

Python uses AST declarations and first-line docstrings. JS/TS uses best-effort declaration/import matching; methods, re-exports, strings and multiline constructs can be missed or misidentified.
Git projects use tracked and unignored files. Dependency/build directories, dot paths, symlinks and oversized files are excluded. Non-Git scans use directory exclusions only.
No model calls, full behavioral summaries, runtime call graph, or complete route resolution are claimed.

No scan warnings.
