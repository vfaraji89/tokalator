# Codebase Glossary

<!-- tokalator-context: 9b3886928c0d1cf24b7d68e23b612a7d09179a596fed87ae43c56f44f96bc723 -->

Generated from source; do not edit. Refresh with the context command.
This is a navigation aid, not proof of behavior. Verify source, callers, and tests.

724 symbols across 169 source files.

## [api/__init__.py](api/__init__.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [api/main.py](api/main.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | health | [L40](api/main.py#L40) | Read source for behavior |

## [api/models.py](api/models.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | Provider | [L12](api/models.py#L12) | Read source for behavior |
| class | UsageRecord | [L20](api/models.py#L20) | Single row of token usage — matches the TS UsageRecord interface. |
| class | CSVParseResponse | [L34](api/models.py#L34) | Read source for behavior |
| class | QualityRequest | [L44](api/models.py#L44) | Cobb-Douglas quality function inputs. |
| class | QualityResponse | [L55](api/models.py#L55) | Read source for behavior |
| class | BreakevenRequest | [L63](api/models.py#L63) | Caching break-even analysis inputs. |
| class | BreakevenPoint | [L72](api/models.py#L72) | Read source for behavior |
| class | BreakevenResponse | [L78](api/models.py#L78) | Read source for behavior |
| class | HealthResponse | [L85](api/models.py#L85) | Read source for behavior |

## [api/routers/__init__.py](api/routers/__init__.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [api/routers/csv_upload.py](api/routers/csv_upload.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | _estimate_cost | [L54](api/routers/csv_upload.py#L54) | Cost in dollars for given token counts. |
| function | _detect_provider | [L69](api/routers/csv_upload.py#L69) | Guess the source platform from column names and model names. |
| function | _normalize_model | [L90](api/routers/csv_upload.py#L90) | Normalize model name to our ID format. |
| function | _find_column | [L109](api/routers/csv_upload.py#L109) | Find the first matching column name (case-insensitive). |
| function | _safe_int | [L118](api/routers/csv_upload.py#L118) | Read source for behavior |
| async function | parse_csv | [L126](api/routers/csv_upload.py#L126) | Parse a CSV file from Anthropic / OpenAI / Google dashboards. |

## [api/routers/economics.py](api/routers/economics.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | compute_quality | [L33](api/routers/economics.py#L33) | Cobb-Douglas quality function: Q = X^α × Y^β × (b + Z)^γ |
| function | compute_breakeven | [L57](api/routers/economics.py#L57) | Calculate the number of reuses needed for caching to break even. |

## [app/_components/web-vitals.tsx](app/_components/web-vitals.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | WebVitals | [L5](app/_components/web-vitals.tsx#L5) | JS/TS declaration; read source for behavior |

## [app/about/page.tsx](app/about/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/about/page.tsx#L3) | JS/TS declaration; read source for behavior |
| const | GitHubIcon | [L8](app/about/page.tsx#L8) | JS/TS declaration; read source for behavior |
| const | LinkedInIcon | [L14](app/about/page.tsx#L14) | JS/TS declaration; read source for behavior |
| function | AboutPage | [L20](app/about/page.tsx#L20) | JS/TS declaration; read source for behavior |

## [app/agents/[id]/page.tsx](app/agents/%5Bid%5D/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | PageProps | [L6](app/agents/%5Bid%5D/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | generateStaticParams | [L10](app/agents/%5Bid%5D/page.tsx#L10) | JS/TS declaration; read source for behavior |
| async function | generateMetadata | [L15](app/agents/%5Bid%5D/page.tsx#L15) | JS/TS declaration; read source for behavior |
| async function | AgentDetailPage | [L24](app/agents/%5Bid%5D/page.tsx#L24) | JS/TS declaration; read source for behavior |

## [app/agents/page.tsx](app/agents/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L5](app/agents/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | AgentsPage | [L10](app/agents/page.tsx#L10) | JS/TS declaration; read source for behavior |

## [app/calculator/page.tsx](app/calculator/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/calculator/page.tsx#L4) | JS/TS declaration; read source for behavior |
| function | CalculatorPage | [L9](app/calculator/page.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/catalog/[id]/page.tsx](app/catalog/%5Bid%5D/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | PageProps | [L6](app/catalog/%5Bid%5D/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | generateStaticParams | [L10](app/catalog/%5Bid%5D/page.tsx#L10) | JS/TS declaration; read source for behavior |
| async function | generateMetadata | [L15](app/catalog/%5Bid%5D/page.tsx#L15) | JS/TS declaration; read source for behavior |
| async function | CatalogDetailPage | [L24](app/catalog/%5Bid%5D/page.tsx#L24) | JS/TS declaration; read source for behavior |

## [app/catalog/page.tsx](app/catalog/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L5](app/catalog/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | CatalogPage | [L10](app/catalog/page.tsx#L10) | JS/TS declaration; read source for behavior |

## [app/collections/[id]/page.tsx](app/collections/%5Bid%5D/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | PageProps | [L6](app/collections/%5Bid%5D/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | generateStaticParams | [L10](app/collections/%5Bid%5D/page.tsx#L10) | JS/TS declaration; read source for behavior |
| async function | generateMetadata | [L15](app/collections/%5Bid%5D/page.tsx#L15) | JS/TS declaration; read source for behavior |
| async function | CollectionDetailPage | [L24](app/collections/%5Bid%5D/page.tsx#L24) | JS/TS declaration; read source for behavior |

## [app/collections/page.tsx](app/collections/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L5](app/collections/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | CollectionsPage | [L10](app/collections/page.tsx#L10) | JS/TS declaration; read source for behavior |

## [app/context-engineering/page.tsx](app/context-engineering/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/context-engineering/page.tsx#L3) | JS/TS declaration; read source for behavior |
| function | ContextEngineeringPage | [L8](app/context-engineering/page.tsx#L8) | JS/TS declaration; read source for behavior |

## [app/context/page.tsx](app/context/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/context/page.tsx#L4) | JS/TS declaration; read source for behavior |
| function | ContextPage | [L9](app/context/page.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/dictionary/layout.tsx](app/dictionary/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/dictionary/layout.tsx#L3) | JS/TS declaration; read source for behavior |
| function | DictionaryLayout | [L9](app/dictionary/layout.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/dictionary/page.tsx](app/dictionary/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | Term | [L6](app/dictionary/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | DictionaryPage | [L8](app/dictionary/page.tsx#L8) | JS/TS declaration; read source for behavior |

## [app/events/[slug]/page.tsx](app/events/%5Bslug%5D/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | EventItem | [L5](app/events/%5Bslug%5D/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | generateStaticParams | [L7](app/events/%5Bslug%5D/page.tsx#L7) | JS/TS declaration; read source for behavior |
| interface | PageProps | [L11](app/events/%5Bslug%5D/page.tsx#L11) | JS/TS declaration; read source for behavior |
| async function | generateMetadata | [L15](app/events/%5Bslug%5D/page.tsx#L15) | JS/TS declaration; read source for behavior |
| async function | EventDetailPage | [L153](app/events/%5Bslug%5D/page.tsx#L153) | JS/TS declaration; read source for behavior |

## [app/events/layout.tsx](app/events/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/events/layout.tsx#L3) | JS/TS declaration; read source for behavior |
| function | EventsLayout | [L10](app/events/layout.tsx#L10) | JS/TS declaration; read source for behavior |

## [app/events/page.tsx](app/events/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | EventItem | [L7](app/events/page.tsx#L7) | JS/TS declaration; read source for behavior |
| const | STATUS_FILTERS | [L9](app/events/page.tsx#L9) | JS/TS declaration; read source for behavior |
| const | TYPE_FILTERS | [L15](app/events/page.tsx#L15) | JS/TS declaration; read source for behavior |
| const | PdfIcon | [L31](app/events/page.tsx#L31) | JS/TS declaration; read source for behavior |
| const | CalendarIcon | [L41](app/events/page.tsx#L41) | JS/TS declaration; read source for behavior |
| const | LocationIcon | [L50](app/events/page.tsx#L50) | JS/TS declaration; read source for behavior |
| function | EventsPage | [L57](app/events/page.tsx#L57) | JS/TS declaration; read source for behavior |
| function | EventCard | [L172](app/events/page.tsx#L172) | JS/TS declaration; read source for behavior |

## [app/extension/layout.tsx](app/extension/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/extension/layout.tsx#L3) | JS/TS declaration; read source for behavior |
| const | jsonLd | [L17](app/extension/layout.tsx#L17) | JS/TS declaration; read source for behavior |
| function | ExtensionLayout | [L31](app/extension/layout.tsx#L31) | JS/TS declaration; read source for behavior |

## [app/extension/page.tsx](app/extension/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | scrollReveal | [L10](app/extension/page.tsx#L10) | JS/TS declaration; read source for behavior |
| function | CopyButton | [L17](app/extension/page.tsx#L17) | JS/TS declaration; read source for behavior |
| function | ExtensionPage | [L33](app/extension/page.tsx#L33) | JS/TS declaration; read source for behavior |

## [app/instructions/[id]/page.tsx](app/instructions/%5Bid%5D/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | PageProps | [L6](app/instructions/%5Bid%5D/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | generateStaticParams | [L10](app/instructions/%5Bid%5D/page.tsx#L10) | JS/TS declaration; read source for behavior |
| async function | generateMetadata | [L15](app/instructions/%5Bid%5D/page.tsx#L15) | JS/TS declaration; read source for behavior |
| async function | InstructionDetailPage | [L24](app/instructions/%5Bid%5D/page.tsx#L24) | JS/TS declaration; read source for behavior |

## [app/instructions/page.tsx](app/instructions/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L5](app/instructions/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | InstructionsPage | [L10](app/instructions/page.tsx#L10) | JS/TS declaration; read source for behavior |

## [app/layout.tsx](app/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | siteUrl | [L8](app/layout.tsx#L8) | JS/TS declaration; read source for behavior |
| const | jsonLd | [L10](app/layout.tsx#L10) | JS/TS declaration; read source for behavior |
| const | viewport | [L49](app/layout.tsx#L49) | JS/TS declaration; read source for behavior |
| const | metadata | [L55](app/layout.tsx#L55) | JS/TS declaration; read source for behavior |
| function | RootLayout | [L109](app/layout.tsx#L109) | JS/TS declaration; read source for behavior |

## [app/learn/layout.tsx](app/learn/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/learn/layout.tsx#L3) | JS/TS declaration; read source for behavior |
| function | LearnLayout | [L9](app/learn/layout.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/learn/page.tsx](app/learn/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | Frame | [L10](app/learn/page.tsx#L10) | JS/TS declaration; read source for behavior |
| function | CodeBlock | [L33](app/learn/page.tsx#L33) | JS/TS declaration; read source for behavior |
| function | Badge | [L58](app/learn/page.tsx#L58) | JS/TS declaration; read source for behavior |
| function | ProgressBar | [L73](app/learn/page.tsx#L73) | JS/TS declaration; read source for behavior |
| function | CompareTable | [L88](app/learn/page.tsx#L88) | JS/TS declaration; read source for behavior |
| function | StatCard | [L114](app/learn/page.tsx#L114) | JS/TS declaration; read source for behavior |
| function | LearnPage | [L208](app/learn/page.tsx#L208) | JS/TS declaration; read source for behavior |

## [app/not-found.tsx](app/not-found.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | NotFound | [L3](app/not-found.tsx#L3) | JS/TS declaration; read source for behavior |

## [app/opengraph-image.tsx](app/opengraph-image.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | alt | [L3](app/opengraph-image.tsx#L3) | JS/TS declaration; read source for behavior |
| const | size | [L4](app/opengraph-image.tsx#L4) | JS/TS declaration; read source for behavior |
| const | contentType | [L5](app/opengraph-image.tsx#L5) | JS/TS declaration; read source for behavior |
| function | Image | [L7](app/opengraph-image.tsx#L7) | JS/TS declaration; read source for behavior |

## [app/page.tsx](app/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | scenes | [L10](app/page.tsx#L10) | JS/TS declaration; read source for behavior |
| function | Walkthrough | [L17](app/page.tsx#L17) | JS/TS declaration; read source for behavior |
| function | Install | [L38](app/page.tsx#L38) | JS/TS declaration; read source for behavior |
| async function | copy | [L43](app/page.tsx#L43) | JS/TS declaration; read source for behavior |
| function | HomePage | [L47](app/page.tsx#L47) | JS/TS declaration; read source for behavior |

## [app/privacy/page.tsx](app/privacy/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/privacy/page.tsx#L4) | JS/TS declaration; read source for behavior |
| const | LAST_UPDATED | [L9](app/privacy/page.tsx#L9) | JS/TS declaration; read source for behavior |
| function | PrivacyPage | [L11](app/privacy/page.tsx#L11) | JS/TS declaration; read source for behavior |

## [app/pro/page.tsx](app/pro/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/pro/page.tsx#L3) | JS/TS declaration; read source for behavior |
| const | offerings | [L9](app/pro/page.tsx#L9) | JS/TS declaration; read source for behavior |
| function | ProPage | [L63](app/pro/page.tsx#L63) | JS/TS declaration; read source for behavior |

## [app/prompts/[id]/page.tsx](app/prompts/%5Bid%5D/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | PageProps | [L6](app/prompts/%5Bid%5D/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | generateStaticParams | [L10](app/prompts/%5Bid%5D/page.tsx#L10) | JS/TS declaration; read source for behavior |
| async function | generateMetadata | [L15](app/prompts/%5Bid%5D/page.tsx#L15) | JS/TS declaration; read source for behavior |
| async function | PromptDetailPage | [L24](app/prompts/%5Bid%5D/page.tsx#L24) | JS/TS declaration; read source for behavior |

## [app/prompts/page.tsx](app/prompts/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L5](app/prompts/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | PromptsPage | [L10](app/prompts/page.tsx#L10) | JS/TS declaration; read source for behavior |

## [app/robots.ts](app/robots.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | robots | [L3](app/robots.ts#L3) | JS/TS declaration; read source for behavior |

## [app/sitemap.ts](app/sitemap.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | BASE | [L5](app/sitemap.ts#L5) | JS/TS declaration; read source for behavior |
| function | sitemap | [L7](app/sitemap.ts#L7) | JS/TS declaration; read source for behavior |

## [app/terms/page.tsx](app/terms/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/terms/page.tsx#L4) | JS/TS declaration; read source for behavior |
| const | LAST_UPDATED | [L9](app/terms/page.tsx#L9) | JS/TS declaration; read source for behavior |
| function | TermsPage | [L11](app/terms/page.tsx#L11) | JS/TS declaration; read source for behavior |

## [app/tools/analysis/page.tsx](app/tools/analysis/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/tools/analysis/page.tsx#L4) | JS/TS declaration; read source for behavior |
| function | AnalysisPage | [L9](app/tools/analysis/page.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/tools/caching/page.tsx](app/tools/caching/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/tools/caching/page.tsx#L4) | JS/TS declaration; read source for behavior |
| function | CachingPage | [L9](app/tools/caching/page.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/tools/calculator/CalculatorClient.tsx](app/tools/calculator/CalculatorClient.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | K | [L9](app/tools/calculator/CalculatorClient.tsx#L9) | JS/TS declaration; read source for behavior |
| const | W | [L10](app/tools/calculator/CalculatorClient.tsx#L10) | JS/TS declaration; read source for behavior |
| const | G1 | [L11](app/tools/calculator/CalculatorClient.tsx#L11) | JS/TS declaration; read source for behavior |
| const | G3 | [L12](app/tools/calculator/CalculatorClient.tsx#L12) | JS/TS declaration; read source for behavior |
| const | G5 | [L13](app/tools/calculator/CalculatorClient.tsx#L13) | JS/TS declaration; read source for behavior |
| const | G7 | [L14](app/tools/calculator/CalculatorClient.tsx#L14) | JS/TS declaration; read source for behavior |
| const | PROV_DOT | [L16](app/tools/calculator/CalculatorClient.tsx#L16) | JS/TS declaration; read source for behavior |
| const | fmtTok | [L25](app/tools/calculator/CalculatorClient.tsx#L25) | JS/TS declaration; read source for behavior |
| const | fmtMTok | [L27](app/tools/calculator/CalculatorClient.tsx#L27) | JS/TS declaration; read source for behavior |
| type | M | [L31](app/tools/calculator/CalculatorClient.tsx#L31) | JS/TS declaration; read source for behavior |
| const | calcCost | [L32](app/tools/calculator/CalculatorClient.tsx#L32) | JS/TS declaration; read source for behavior |
| function | EcoBar | [L42](app/tools/calculator/CalculatorClient.tsx#L42) | JS/TS declaration; read source for behavior |
| function | BreakdownBar | [L80](app/tools/calculator/CalculatorClient.tsx#L80) | JS/TS declaration; read source for behavior |
| function | EcoHeader | [L117](app/tools/calculator/CalculatorClient.tsx#L117) | JS/TS declaration; read source for behavior |
| function | EcoNote | [L126](app/tools/calculator/CalculatorClient.tsx#L126) | JS/TS declaration; read source for behavior |
| type | Tab | [L135](app/tools/calculator/CalculatorClient.tsx#L135) | JS/TS declaration; read source for behavior |
| const | tabAnim | [L137](app/tools/calculator/CalculatorClient.tsx#L137) | JS/TS declaration; read source for behavior |
| function | CalculatorClient | [L145](app/tools/calculator/CalculatorClient.tsx#L145) | JS/TS declaration; read source for behavior |

## [app/tools/calculator/page.tsx](app/tools/calculator/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L6](app/tools/calculator/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | ToolSkeleton | [L11](app/tools/calculator/page.tsx#L11) | JS/TS declaration; read source for behavior |
| function | CalculatorPage | [L34](app/tools/calculator/page.tsx#L34) | JS/TS declaration; read source for behavior |

## [app/tools/compare/CompareClient.tsx](app/tools/compare/CompareClient.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | CompareClient | [L6](app/tools/compare/CompareClient.tsx#L6) | JS/TS declaration; read source for behavior |

## [app/tools/compare/layout.tsx](app/tools/compare/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/tools/compare/layout.tsx#L3) | JS/TS declaration; read source for behavior |
| function | CompareLayout | [L9](app/tools/compare/layout.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/tools/compare/page.tsx](app/tools/compare/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | ToolSkeleton | [L5](app/tools/compare/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | ComparePage | [L30](app/tools/compare/page.tsx#L30) | JS/TS declaration; read source for behavior |

## [app/tools/conversation/page.tsx](app/tools/conversation/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/tools/conversation/page.tsx#L4) | JS/TS declaration; read source for behavior |
| function | ConversationPage | [L9](app/tools/conversation/page.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/tools/economics/EconomicsClient.tsx](app/tools/economics/EconomicsClient.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | chartWrap | [L8](app/tools/economics/EconomicsClient.tsx#L8) | JS/TS declaration; read source for behavior |
| const | tt | [L23](app/tools/economics/EconomicsClient.tsx#L23) | JS/TS declaration; read source for behavior |
| const | ls | [L24](app/tools/economics/EconomicsClient.tsx#L24) | JS/TS declaration; read source for behavior |
| const | ss | [L25](app/tools/economics/EconomicsClient.tsx#L25) | JS/TS declaration; read source for behavior |
| const | PROVIDER_COLORS | [L27](app/tools/economics/EconomicsClient.tsx#L27) | JS/TS declaration; read source for behavior |
| type | Tab | [L44](app/tools/economics/EconomicsClient.tsx#L44) | JS/TS declaration; read source for behavior |
| function | EconomicsClient | [L46](app/tools/economics/EconomicsClient.tsx#L46) | JS/TS declaration; read source for behavior |

## [app/tools/economics/page.tsx](app/tools/economics/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L6](app/tools/economics/page.tsx#L6) | JS/TS declaration; read source for behavior |
| function | ToolSkeleton | [L11](app/tools/economics/page.tsx#L11) | JS/TS declaration; read source for behavior |
| function | EconomicsPage | [L27](app/tools/economics/page.tsx#L27) | JS/TS declaration; read source for behavior |

## [app/tools/page.tsx](app/tools/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/tools/page.tsx#L4) | JS/TS declaration; read source for behavior |
| const | tools | [L9](app/tools/page.tsx#L9) | JS/TS declaration; read source for behavior |
| function | ToolsPage | [L58](app/tools/page.tsx#L58) | JS/TS declaration; read source for behavior |

## [app/tools/pricing/layout.tsx](app/tools/pricing/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/tools/pricing/layout.tsx#L3) | JS/TS declaration; read source for behavior |
| function | PricingLayout | [L9](app/tools/pricing/layout.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/tools/pricing/page.tsx](app/tools/pricing/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | PricingPage | [L4](app/tools/pricing/page.tsx#L4) | JS/TS declaration; read source for behavior |

## [app/tools/usage/page.tsx](app/tools/usage/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L4](app/tools/usage/page.tsx#L4) | JS/TS declaration; read source for behavior |
| function | UsagePage | [L9](app/tools/usage/page.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/wiki/[slug]/page.tsx](app/wiki/%5Bslug%5D/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | WikiArticle | [L5](app/wiki/%5Bslug%5D/page.tsx#L5) | JS/TS declaration; read source for behavior |
| function | generateStaticParams | [L7](app/wiki/%5Bslug%5D/page.tsx#L7) | JS/TS declaration; read source for behavior |
| interface | PageProps | [L11](app/wiki/%5Bslug%5D/page.tsx#L11) | JS/TS declaration; read source for behavior |
| async function | generateMetadata | [L15](app/wiki/%5Bslug%5D/page.tsx#L15) | JS/TS declaration; read source for behavior |
| function | renderMarkdownToHtml | [L24](app/wiki/%5Bslug%5D/page.tsx#L24) | JS/TS declaration; read source for behavior |
| async function | WikiArticlePage | [L54](app/wiki/%5Bslug%5D/page.tsx#L54) | JS/TS declaration; read source for behavior |

## [app/wiki/layout.tsx](app/wiki/layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | metadata | [L3](app/wiki/layout.tsx#L3) | JS/TS declaration; read source for behavior |
| function | WikiLayout | [L9](app/wiki/layout.tsx#L9) | JS/TS declaration; read source for behavior |

## [app/wiki/page.tsx](app/wiki/page.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | WikiArticle | [L7](app/wiki/page.tsx#L7) | JS/TS declaration; read source for behavior |
| const | SOURCES | [L9](app/wiki/page.tsx#L9) | JS/TS declaration; read source for behavior |
| const | CATEGORIES | [L18](app/wiki/page.tsx#L18) | JS/TS declaration; read source for behavior |
| function | WikiPage | [L29](app/wiki/page.tsx#L29) | JS/TS declaration; read source for behavior |
| function | WikiCard | [L164](app/wiki/page.tsx#L164) | JS/TS declaration; read source for behavior |

## [components/caching-calculator.tsx](components/caching-calculator.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | models | [L22](components/caching-calculator.tsx#L22) | JS/TS declaration; read source for behavior |
| function | CachingCalculator | [L30](components/caching-calculator.tsx#L30) | JS/TS declaration; read source for behavior |

## [components/catalog/catalog-card.tsx](components/catalog/catalog-card.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | CatalogCardProps | [L4](components/catalog/catalog-card.tsx#L4) | JS/TS declaration; read source for behavior |
| const | ecosystemLabels | [L9](components/catalog/catalog-card.tsx#L9) | JS/TS declaration; read source for behavior |
| const | sourceLabels | [L15](components/catalog/catalog-card.tsx#L15) | JS/TS declaration; read source for behavior |
| const | kindRoutes | [L22](components/catalog/catalog-card.tsx#L22) | JS/TS declaration; read source for behavior |
| function | CatalogCard | [L29](components/catalog/catalog-card.tsx#L29) | JS/TS declaration; read source for behavior |

## [components/catalog/catalog-detail.tsx](components/catalog/catalog-detail.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | CatalogDetailProps | [L9](components/catalog/catalog-detail.tsx#L9) | JS/TS declaration; read source for behavior |
| const | ecosystemColors | [L13](components/catalog/catalog-detail.tsx#L13) | JS/TS declaration; read source for behavior |
| const | ecosystemLabels | [L19](components/catalog/catalog-detail.tsx#L19) | JS/TS declaration; read source for behavior |
| const | sourceLabels | [L25](components/catalog/catalog-detail.tsx#L25) | JS/TS declaration; read source for behavior |
| const | kindRoutes | [L32](components/catalog/catalog-detail.tsx#L32) | JS/TS declaration; read source for behavior |
| function | CatalogDetail | [L39](components/catalog/catalog-detail.tsx#L39) | JS/TS declaration; read source for behavior |

## [components/catalog/catalog-grid-unified.tsx](components/catalog/catalog-grid-unified.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | KindFilter | [L8](components/catalog/catalog-grid-unified.tsx#L8) | JS/TS declaration; read source for behavior |
| const | KIND_LABELS | [L10](components/catalog/catalog-grid-unified.tsx#L10) | JS/TS declaration; read source for behavior |
| interface | Props | [L18](components/catalog/catalog-grid-unified.tsx#L18) | JS/TS declaration; read source for behavior |
| function | CatalogGridUnified | [L23](components/catalog/catalog-grid-unified.tsx#L23) | JS/TS declaration; read source for behavior |

## [components/catalog/catalog-grid.tsx](components/catalog/catalog-grid.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | gridVariants | [L9](components/catalog/catalog-grid.tsx#L9) | JS/TS declaration; read source for behavior |
| const | cardVariants | [L13](components/catalog/catalog-grid.tsx#L13) | JS/TS declaration; read source for behavior |
| interface | CatalogGridProps | [L18](components/catalog/catalog-grid.tsx#L18) | JS/TS declaration; read source for behavior |
| function | CatalogGrid | [L25](components/catalog/catalog-grid.tsx#L25) | JS/TS declaration; read source for behavior |

## [components/catalog/ecosystem-columns.tsx](components/catalog/ecosystem-columns.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | EcosystemColumnsProps | [L4](components/catalog/ecosystem-columns.tsx#L4) | JS/TS declaration; read source for behavior |
| function | EcosystemColumns | [L8](components/catalog/ecosystem-columns.tsx#L8) | JS/TS declaration; read source for behavior |

## [components/catalog/featured-cards.tsx](components/catalog/featured-cards.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | FeaturedCardsProps | [L4](components/catalog/featured-cards.tsx#L4) | JS/TS declaration; read source for behavior |
| function | FeaturedCards | [L9](components/catalog/featured-cards.tsx#L9) | JS/TS declaration; read source for behavior |

## [components/catalog/filter-bar.tsx](components/catalog/filter-bar.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | FilterBarProps | [L5](components/catalog/filter-bar.tsx#L5) | JS/TS declaration; read source for behavior |
| const | ecosystemOptions | [L16](components/catalog/filter-bar.tsx#L16) | JS/TS declaration; read source for behavior |
| const | sourceOptions | [L23](components/catalog/filter-bar.tsx#L23) | JS/TS declaration; read source for behavior |
| function | FilterBar | [L30](components/catalog/filter-bar.tsx#L30) | JS/TS declaration; read source for behavior |

## [components/catalog/markdown-renderer.tsx](components/catalog/markdown-renderer.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | MarkdownRendererProps | [L5](components/catalog/markdown-renderer.tsx#L5) | JS/TS declaration; read source for behavior |
| function | MarkdownRenderer | [L13](components/catalog/markdown-renderer.tsx#L13) | Lightweight markdown renderer that handles common patterns. |
| function | renderMarkdown | [L40](components/catalog/markdown-renderer.tsx#L40) | JS/TS declaration; read source for behavior |
| function | escapeHtml | [L85](components/catalog/markdown-renderer.tsx#L85) | JS/TS declaration; read source for behavior |

## [components/catalog/stat-bar.tsx](components/catalog/stat-bar.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | StatBarProps | [L3](components/catalog/stat-bar.tsx#L3) | JS/TS declaration; read source for behavior |
| function | StatBar | [L7](components/catalog/stat-bar.tsx#L7) | JS/TS declaration; read source for behavior |

## [components/cli-terminal.tsx](components/cli-terminal.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | PixelAbacus | [L17](components/cli-terminal.tsx#L17) | JS/TS declaration; read source for behavior |
| function | CliTerminal | [L79](components/cli-terminal.tsx#L79) | JS/TS declaration; read source for behavior |

## [components/code-maps-release.tsx](components/code-maps-release.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | CodeMapsRelease | [L1](components/code-maps-release.tsx#L1) | JS/TS declaration; read source for behavior |

## [components/command-typer.tsx](components/command-typer.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | COMMANDS | [L5](components/command-typer.tsx#L5) | JS/TS declaration; read source for behavior |
| const | MENTION | [L19](components/command-typer.tsx#L19) | JS/TS declaration; read source for behavior |
| const | TYPING_SPEED | [L20](components/command-typer.tsx#L20) | JS/TS declaration; read source for behavior |
| const | PAUSE_AFTER | [L21](components/command-typer.tsx#L21) | JS/TS declaration; read source for behavior |
| const | DELETE_SPEED | [L22](components/command-typer.tsx#L22) | JS/TS declaration; read source for behavior |
| const | PAUSE_BEFORE | [L23](components/command-typer.tsx#L23) | JS/TS declaration; read source for behavior |
| function | CommandTyper | [L25](components/command-typer.tsx#L25) | JS/TS declaration; read source for behavior |

## [components/comparison-charts.tsx](components/comparison-charts.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | CostComparisonProps | [L20](components/comparison-charts.tsx#L20) | JS/TS declaration; read source for behavior |
| function | CostComparisonChart | [L25](components/comparison-charts.tsx#L25) | JS/TS declaration; read source for behavior |
| function | ContextWindowChart | [L118](components/comparison-charts.tsx#L118) | JS/TS declaration; read source for behavior |
| interface | PriceQualityData | [L188](components/comparison-charts.tsx#L188) | JS/TS declaration; read source for behavior |
| function | PriceQualityChart | [L195](components/comparison-charts.tsx#L195) | JS/TS declaration; read source for behavior |

## [components/context-optimizer.tsx](components/context-optimizer.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | models | [L16](components/context-optimizer.tsx#L16) | JS/TS declaration; read source for behavior |
| const | tt | [L18](components/context-optimizer.tsx#L18) | JS/TS declaration; read source for behavior |
| function | ContextOptimizer | [L20](components/context-optimizer.tsx#L20) | JS/TS declaration; read source for behavior |

## [components/conversation-estimator.tsx](components/conversation-estimator.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | ContextStrategy | [L17](components/conversation-estimator.tsx#L17) | JS/TS declaration; read source for behavior |
| const | models | [L22](components/conversation-estimator.tsx#L22) | JS/TS declaration; read source for behavior |
| const | strategies | [L30](components/conversation-estimator.tsx#L30) | JS/TS declaration; read source for behavior |
| function | ConversationEstimator | [L32](components/conversation-estimator.tsx#L32) | JS/TS declaration; read source for behavior |

## [components/cost-calculator.tsx](components/cost-calculator.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | models | [L15](components/cost-calculator.tsx#L15) | JS/TS declaration; read source for behavior |
| const | tt | [L17](components/cost-calculator.tsx#L17) | JS/TS declaration; read source for behavior |
| function | CostCalculator | [L19](components/cost-calculator.tsx#L19) | JS/TS declaration; read source for behavior |

## [components/dashboard-charts.tsx](components/dashboard-charts.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | modelDistribution | [L31](components/dashboard-charts.tsx#L31) | JS/TS declaration; read source for behavior |
| const | tokenBreakdown | [L37](components/dashboard-charts.tsx#L37) | JS/TS declaration; read source for behavior |
| const | COLORS | [L44](components/dashboard-charts.tsx#L44) | JS/TS declaration; read source for behavior |
| interface | DashboardChartsProps | [L50](components/dashboard-charts.tsx#L50) | JS/TS declaration; read source for behavior |
| function | DashboardCharts | [L57](components/dashboard-charts.tsx#L57) | JS/TS declaration; read source for behavior |

## [components/demo-mockup.tsx](components/demo-mockup.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | Annotation | [L8](components/demo-mockup.tsx#L8) | Numbered annotation bubble |
| function | DemoMockup | [L33](components/demo-mockup.tsx#L33) | JS/TS declaration; read source for behavior |

## [components/docs-layout.tsx](components/docs-layout.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | DocsLayoutProps | [L6](components/docs-layout.tsx#L6) | JS/TS declaration; read source for behavior |
| function | DocsLayout | [L13](components/docs-layout.tsx#L13) | JS/TS declaration; read source for behavior |
| interface | CardProps | [L42](components/docs-layout.tsx#L42) | JS/TS declaration; read source for behavior |
| function | Card | [L50](components/docs-layout.tsx#L50) | JS/TS declaration; read source for behavior |
| interface | TipProps | [L76](components/docs-layout.tsx#L76) | JS/TS declaration; read source for behavior |
| const | tipStyles | [L82](components/docs-layout.tsx#L82) | JS/TS declaration; read source for behavior |
| function | Tip | [L109](components/docs-layout.tsx#L109) | JS/TS declaration; read source for behavior |
| interface | CodeBlockProps | [L126](components/docs-layout.tsx#L126) | JS/TS declaration; read source for behavior |
| function | CodeBlock | [L132](components/docs-layout.tsx#L132) | JS/TS declaration; read source for behavior |
| interface | StepProps | [L149](components/docs-layout.tsx#L149) | JS/TS declaration; read source for behavior |
| function | Step | [L155](components/docs-layout.tsx#L155) | JS/TS declaration; read source for behavior |
| interface | GridProps | [L170](components/docs-layout.tsx#L170) | JS/TS declaration; read source for behavior |
| function | Grid | [L175](components/docs-layout.tsx#L175) | JS/TS declaration; read source for behavior |

## [components/economic-analysis.tsx](components/economic-analysis.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | ModelId | [L16](components/economic-analysis.tsx#L16) | JS/TS declaration; read source for behavior |
| const | tt | [L19](components/economic-analysis.tsx#L19) | JS/TS declaration; read source for behavior |
| function | EconomicAnalysis | [L21](components/economic-analysis.tsx#L21) | JS/TS declaration; read source for behavior |

## [components/extension-docs.tsx](components/extension-docs.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | features | [L3](components/extension-docs.tsx#L3) | JS/TS declaration; read source for behavior |
| const | settings | [L56](components/extension-docs.tsx#L56) | JS/TS declaration; read source for behavior |
| function | ExtensionDocs | [L84](components/extension-docs.tsx#L84) | JS/TS declaration; read source for behavior |

## [components/extension-showcase.tsx](components/extension-showcase.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | ExtensionShowcaseProps | [L7](components/extension-showcase.tsx#L7) | JS/TS declaration; read source for behavior |
| const | extensionFeatures | [L11](components/extension-showcase.tsx#L11) | JS/TS declaration; read source for behavior |
| const | quickLinks | [L54](components/extension-showcase.tsx#L54) | JS/TS declaration; read source for behavior |
| function | ExtensionShowcase | [L61](components/extension-showcase.tsx#L61) | JS/TS declaration; read source for behavior |
| function | FeatureContent | [L168](components/extension-showcase.tsx#L168) | JS/TS declaration; read source for behavior |

## [components/hero-morph.tsx](components/hero-morph.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | TOKEN_TARGET | [L6](components/hero-morph.tsx#L6) | JS/TS declaration; read source for behavior |
| const | COUNT_DURATION | [L7](components/hero-morph.tsx#L7) | JS/TS declaration; read source for behavior |
| const | STAGE_HOLD | [L8](components/hero-morph.tsx#L8) | JS/TS declaration; read source for behavior |
| type | Stage | [L10](components/hero-morph.tsx#L10) | JS/TS declaration; read source for behavior |
| const | labels | [L12](components/hero-morph.tsx#L12) | JS/TS declaration; read source for behavior |
| const | labelColors | [L18](components/hero-morph.tsx#L18) | JS/TS declaration; read source for behavior |
| function | HeroMorph | [L24](components/hero-morph.tsx#L24) | JS/TS declaration; read source for behavior |

## [components/icons.tsx](components/icons.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | IconProps | [L6](components/icons.tsx#L6) | Material Icons wrapper component |
| function | Icon | [L13](components/icons.tsx#L13) | JS/TS declaration; read source for behavior |
| const | Icons | [L28](components/icons.tsx#L28) | JS/TS declaration; read source for behavior |

## [components/istanbul-cat.tsx](components/istanbul-cat.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | IstanbulCat | [L9](components/istanbul-cat.tsx#L9) | Minimal Istanbul Cat — tiny cat face (ears, eyes, nose). |

## [components/live-market-dashboard.tsx](components/live-market-dashboard.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | StatCardProps | [L50](components/live-market-dashboard.tsx#L50) | JS/TS declaration; read source for behavior |
| function | StatCard | [L57](components/live-market-dashboard.tsx#L57) | JS/TS declaration; read source for behavior |
| function | ProviderBadge | [L78](components/live-market-dashboard.tsx#L78) | JS/TS declaration; read source for behavior |
| function | LiveMarketDashboard | [L96](components/live-market-dashboard.tsx#L96) | JS/TS declaration; read source for behavior |

## [components/logo.tsx](components/logo.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | Logo | [L3](components/logo.tsx#L3) | JS/TS declaration; read source for behavior |

## [components/model-changelog.tsx](components/model-changelog.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | ChangelogItemProps | [L17](components/model-changelog.tsx#L17) | JS/TS declaration; read source for behavior |
| function | ChangelogItem | [L22](components/model-changelog.tsx#L22) | JS/TS declaration; read source for behavior |
| type | FilterType | [L91](components/model-changelog.tsx#L91) | JS/TS declaration; read source for behavior |
| type | ProviderFilter | [L92](components/model-changelog.tsx#L92) | JS/TS declaration; read source for behavior |
| function | ModelChangelog | [L94](components/model-changelog.tsx#L94) | JS/TS declaration; read source for behavior |

## [components/side-nav.tsx](components/side-nav.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | NavItem | [L9](components/side-nav.tsx#L9) | JS/TS declaration; read source for behavior |
| type | NavSection | [L10](components/side-nav.tsx#L10) | JS/TS declaration; read source for behavior |
| const | nav | [L12](components/side-nav.tsx#L12) | JS/TS declaration; read source for behavior |
| function | ChevronIcon | [L14](components/side-nav.tsx#L14) | JS/TS declaration; read source for behavior |
| function | GitHubIcon | [L35](components/side-nav.tsx#L35) | JS/TS declaration; read source for behavior |
| function | SidebarHeart | [L43](components/side-nav.tsx#L43) | JS/TS declaration; read source for behavior |
| function | SideNav | [L69](components/side-nav.tsx#L69) | JS/TS declaration; read source for behavior |

## [components/sidebar.tsx](components/sidebar.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | NavSection | [L8](components/sidebar.tsx#L8) | JS/TS declaration; read source for behavior |
| interface | NavItem | [L13](components/sidebar.tsx#L13) | JS/TS declaration; read source for behavior |
| const | navSections | [L20](components/sidebar.tsx#L20) | JS/TS declaration; read source for behavior |
| function | Sidebar | [L52](components/sidebar.tsx#L52) | JS/TS declaration; read source for behavior |

## [components/star-count.tsx](components/star-count.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | StarCount | [L5](components/star-count.tsx#L5) | JS/TS declaration; read source for behavior |

## [components/theme-toggle.tsx](components/theme-toggle.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | Theme | [L5](components/theme-toggle.tsx#L5) | JS/TS declaration; read source for behavior |
| function | getStoredTheme | [L7](components/theme-toggle.tsx#L7) | JS/TS declaration; read source for behavior |
| function | applyTheme | [L12](components/theme-toggle.tsx#L12) | JS/TS declaration; read source for behavior |
| function | ThemeToggle | [L16](components/theme-toggle.tsx#L16) | JS/TS declaration; read source for behavior |

## [components/top-nav.tsx](components/top-nav.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | TopNav | [L9](components/top-nav.tsx#L9) | JS/TS declaration; read source for behavior |

## [components/usage-tracker-v2.tsx](components/usage-tracker-v2.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | tt | [L13](components/usage-tracker-v2.tsx#L13) | JS/TS declaration; read source for behavior |
| const | fmtTok | [L14](components/usage-tracker-v2.tsx#L14) | JS/TS declaration; read source for behavior |
| interface | UsageRecord | [L18](components/usage-tracker-v2.tsx#L18) | JS/TS declaration; read source for behavior |
| function | estimateCost | [L44](components/usage-tracker-v2.tsx#L44) | JS/TS declaration; read source for behavior |
| function | detectProvider | [L62](components/usage-tracker-v2.tsx#L62) | JS/TS declaration; read source for behavior |
| function | parseCSVClientSide | [L72](components/usage-tracker-v2.tsx#L72) | JS/TS declaration; read source for behavior |
| function | UsageTracker | [L163](components/usage-tracker-v2.tsx#L163) | JS/TS declaration; read source for behavior |

## [components/usage-tracker.tsx](components/usage-tracker.tsx)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | ModelId | [L12](components/usage-tracker.tsx#L12) | JS/TS declaration; read source for behavior |
| const | tt | [L15](components/usage-tracker.tsx#L15) | JS/TS declaration; read source for behavior |
| interface | UsageRecord | [L17](components/usage-tracker.tsx#L17) | JS/TS declaration; read source for behavior |
| const | sampleUsage | [L23](components/usage-tracker.tsx#L23) | JS/TS declaration; read source for behavior |
| const | MODEL_LABELS | [L30](components/usage-tracker.tsx#L30) | JS/TS declaration; read source for behavior |
| const | MODEL_COLORS | [L39](components/usage-tracker.tsx#L39) | JS/TS declaration; read source for behavior |
| function | UsageTracker | [L48](components/usage-tracker.tsx#L48) | JS/TS declaration; read source for behavior |

## [eslint.config.mjs](eslint.config.mjs)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | eslintConfig | [L5](eslint.config.mjs#L5) | JS/TS declaration; read source for behavior |

## [jest.config.js](jest.config.js)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [lib/__tests__/caching.test.ts](lib/__tests__/caching.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [lib/__tests__/catalog.test.ts](lib/__tests__/catalog.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [lib/__tests__/context.test.ts](lib/__tests__/context.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [lib/__tests__/conversation.test.ts](lib/__tests__/conversation.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [lib/__tests__/pricing.test.ts](lib/__tests__/pricing.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [lib/__tests__/providers.test.ts](lib/__tests__/providers.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | model | [L6](lib/__tests__/providers.test.ts#L6) | JS/TS declaration; read source for behavior |

## [lib/caching.ts](lib/caching.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | CachingAnalysis | [L12](lib/caching.ts#L12) | JS/TS declaration; read source for behavior |
| interface | CachingScenario | [L26](lib/caching.ts#L26) | JS/TS declaration; read source for behavior |
| function | analyzeCaching | [L39](lib/caching.ts#L39) | Calculate comprehensive caching analysis |
| function | calculateBreakeven | [L107](lib/caching.ts#L107) | Calculate break-even point for a given model |
| function | generateCostComparisonData | [L135](lib/caching.ts#L135) | Generate cost comparison data for charting |
| function | optimizeCacheForBudget | [L157](lib/caching.ts#L157) | Calculate optimal cache strategy for a given budget |

## [lib/catalog/frontmatter.ts](lib/catalog/frontmatter.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | parseFrontmatter | [L7](lib/catalog/frontmatter.ts#L7) | Parse YAML frontmatter from a markdown file's content. |
| function | nameFromFilename | [L55](lib/catalog/frontmatter.ts#L55) | Derive a human-readable name from a filename. |

## [lib/catalog/index.ts](lib/catalog/index.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [lib/catalog/scanner.ts](lib/catalog/scanner.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | PROJECT_ROOT | [L15](lib/catalog/scanner.ts#L15) | JS/TS declaration; read source for behavior |
| const | DEFAULT_CONFIG | [L17](lib/catalog/scanner.ts#L17) | JS/TS declaration; read source for behavior |
| let | cachedCatalog | [L41](lib/catalog/scanner.ts#L41) | JS/TS declaration; read source for behavior |
| function | loadConfig | [L43](lib/catalog/scanner.ts#L43) | JS/TS declaration; read source for behavior |
| function | detectKind | [L54](lib/catalog/scanner.ts#L54) | JS/TS declaration; read source for behavior |
| function | detectEcosystem | [L65](lib/catalog/scanner.ts#L65) | JS/TS declaration; read source for behavior |
| function | slugFromPath | [L74](lib/catalog/scanner.ts#L74) | JS/TS declaration; read source for behavior |
| function | walkDirectory | [L84](lib/catalog/scanner.ts#L84) | JS/TS declaration; read source for behavior |
| function | parseFile | [L112](lib/catalog/scanner.ts#L112) | JS/TS declaration; read source for behavior |
| function | extractFirstParagraph | [L171](lib/catalog/scanner.ts#L171) | JS/TS declaration; read source for behavior |
| function | computeStats | [L186](lib/catalog/scanner.ts#L186) | JS/TS declaration; read source for behavior |
| function | scanClaudeCodeContent | [L204](lib/catalog/scanner.ts#L204) | Scan for CLAUDE.md files at project root and in .claude/ directories |
| function | scanCatalog | [L229](lib/catalog/scanner.ts#L229) | JS/TS declaration; read source for behavior |
| function | getCatalogByKind | [L292](lib/catalog/scanner.ts#L292) | JS/TS declaration; read source for behavior |
| function | getCatalogItemById | [L297](lib/catalog/scanner.ts#L297) | JS/TS declaration; read source for behavior |
| function | getCatalogStats | [L302](lib/catalog/scanner.ts#L302) | JS/TS declaration; read source for behavior |

## [lib/context.ts](lib/context.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | ContextBudget | [L12](lib/context.ts#L12) | JS/TS declaration; read source for behavior |
| interface | ContextAnalysis | [L19](lib/context.ts#L19) | JS/TS declaration; read source for behavior |
| function | estimateTokens | [L43](lib/context.ts#L43) | Estimate token count from text |
| function | estimateCharacters | [L53](lib/context.ts#L53) | Estimate characters from token count |
| function | analyzeContextBudget | [L64](lib/context.ts#L64) | Analyze context budget usage |
| function | calculateRemainingTurns | [L131](lib/context.ts#L131) | Calculate how many more turns can fit in context |
| function | getModelLimits | [L146](lib/context.ts#L146) | Get model context limits |
| function | formatTokenCount | [L153](lib/context.ts#L153) | Format token count for display |

## [lib/conversation.ts](lib/conversation.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | ContextStrategy | [L12](lib/conversation.ts#L12) | JS/TS declaration; read source for behavior |
| interface | ConversationParams | [L14](lib/conversation.ts#L14) | JS/TS declaration; read source for behavior |
| interface | TurnBreakdown | [L25](lib/conversation.ts#L25) | JS/TS declaration; read source for behavior |
| interface | ConversationAnalysis | [L34](lib/conversation.ts#L34) | JS/TS declaration; read source for behavior |
| interface | StrategyComparison | [L46](lib/conversation.ts#L46) | JS/TS declaration; read source for behavior |
| function | simulateConversation | [L59](lib/conversation.ts#L59) | Simulate a multi-turn conversation |
| function | compareStrategies | [L172](lib/conversation.ts#L172) | Compare all strategies side by side |
| function | getStrategyDescription | [L195](lib/conversation.ts#L195) | Get strategy description |
| function | calculateTurnsForBudget | [L229](lib/conversation.ts#L229) | Calculate optimal turn count for a budget |
| function | formatConversationSummary | [L256](lib/conversation.ts#L256) | Format conversation analysis for display |

## [lib/db.ts](lib/db.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | globalForPrisma | [L3](lib/db.ts#L3) | JS/TS declaration; read source for behavior |
| const | prisma | [L7](lib/db.ts#L7) | JS/TS declaration; read source for behavior |

## [lib/i18n.ts](lib/i18n.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | Locale | [L1](lib/i18n.ts#L1) | JS/TS declaration; read source for behavior |
| const | translations | [L3](lib/i18n.ts#L3) | JS/TS declaration; read source for behavior |
| function | t | [L74](lib/i18n.ts#L74) | JS/TS declaration; read source for behavior |

## [lib/market-data.ts](lib/market-data.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | MarketSnapshot | [L8](lib/market-data.ts#L8) | JS/TS declaration; read source for behavior |
| interface | TimeSeriesPoint | [L18](lib/market-data.ts#L18) | JS/TS declaration; read source for behavior |
| interface | GlobalStats | [L26](lib/market-data.ts#L26) | JS/TS declaration; read source for behavior |
| function | generateTimeSeriesData | [L38](lib/market-data.ts#L38) | JS/TS declaration; read source for behavior |
| const | MARKET_TIME_SERIES | [L67](lib/market-data.ts#L67) | JS/TS declaration; read source for behavior |
| const | MARKET_SNAPSHOTS | [L73](lib/market-data.ts#L73) | JS/TS declaration; read source for behavior |
| interface | PriceTrendPoint | [L107](lib/market-data.ts#L107) | JS/TS declaration; read source for behavior |
| function | generatePriceTrendData | [L117](lib/market-data.ts#L117) | JS/TS declaration; read source for behavior |
| const | PRICE_TRENDS | [L145](lib/market-data.ts#L145) | JS/TS declaration; read source for behavior |
| function | getGlobalStats | [L151](lib/market-data.ts#L151) | JS/TS declaration; read source for behavior |
| function | simulateLiveUpdate | [L181](lib/market-data.ts#L181) | JS/TS declaration; read source for behavior |
| interface | MarketShare | [L195](lib/market-data.ts#L195) | JS/TS declaration; read source for behavior |
| function | calculateMarketShare | [L202](lib/market-data.ts#L202) | JS/TS declaration; read source for behavior |

## [lib/pricing.ts](lib/pricing.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | TokenUsage | [L18](lib/pricing.ts#L18) | JS/TS declaration; read source for behavior |
| interface | ServiceUsage | [L26](lib/pricing.ts#L26) | JS/TS declaration; read source for behavior |
| interface | PricingTier | [L31](lib/pricing.ts#L31) | JS/TS declaration; read source for behavior |
| interface | ModelParams | [L39](lib/pricing.ts#L39) | JS/TS declaration; read source for behavior |
| interface | CostBreakdown | [L46](lib/pricing.ts#L46) | JS/TS declaration; read source for behavior |
| interface | QualityMetrics | [L56](lib/pricing.ts#L56) | JS/TS declaration; read source for behavior |
| const | MODEL_LIMITS | [L67](lib/pricing.ts#L67) | JS/TS declaration; read source for behavior |
| const | ANTHROPIC_PRICING | [L79](lib/pricing.ts#L79) | JS/TS declaration; read source for behavior |
| const | SERVICE_PRICING | [L154](lib/pricing.ts#L154) | JS/TS declaration; read source for behavior |
| const | MODEL_PARAMS | [L164](lib/pricing.ts#L164) | JS/TS declaration; read source for behavior |
| function | getPricingTier | [L228](lib/pricing.ts#L228) | Get the applicable pricing tier based on prompt length |
| function | calculateTokenCost | [L258](lib/pricing.ts#L258) | Calculate token costs |
| function | calculateServiceCost | [L278](lib/pricing.ts#L278) | Calculate service costs (web search, code execution) |
| function | calculateCost | [L288](lib/pricing.ts#L288) | Calculate total cost breakdown |
| function | calculateQuality | [L320](lib/pricing.ts#L320) | Calculate quality score using Cobb-Douglas production function |
| function | calculateMinCostForQuality | [L346](lib/pricing.ts#L346) | Calculate minimum cost to achieve target quality |
| function | calculateCachingThreshold | [L419](lib/pricing.ts#L419) | Calculate the fine-tuning/caching threshold (θ̂) |
| function | calculateQualityMetrics | [L443](lib/pricing.ts#L443) | Calculate quality metrics including marginal costs |
| function | projectCosts | [L484](lib/pricing.ts#L484) | Project future costs based on historical usage |
| function | formatCost | [L539](lib/pricing.ts#L539) | Format cost as currency string |
| function | formatTokens | [L551](lib/pricing.ts#L551) | Format token count with K/M suffix |
| function | getModelInfo | [L564](lib/pricing.ts#L564) | Get model display info |

## [lib/providers.ts](lib/providers.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | Provider | [L6](lib/providers.ts#L6) | Multi-Provider Pricing & Model Data |
| interface | ModelPricing | [L8](lib/providers.ts#L8) | JS/TS declaration; read source for behavior |
| interface | PriceChange | [L25](lib/providers.ts#L25) | JS/TS declaration; read source for behavior |
| interface | ModelRelease | [L36](lib/providers.ts#L36) | JS/TS declaration; read source for behavior |
| const | PROVIDER_MODELS | [L51](lib/providers.ts#L51) | JS/TS declaration; read source for behavior |
| const | PRICE_HISTORY | [L401](lib/providers.ts#L401) | JS/TS declaration; read source for behavior |
| const | MODEL_RELEASES | [L407](lib/providers.ts#L407) | JS/TS declaration; read source for behavior |
| function | getModelsByProvider | [L486](lib/providers.ts#L486) | JS/TS declaration; read source for behavior |
| function | getProviderColor | [L490](lib/providers.ts#L490) | JS/TS declaration; read source for behavior |
| function | getProviderName | [L499](lib/providers.ts#L499) | JS/TS declaration; read source for behavior |
| function | formatTokenCount | [L508](lib/providers.ts#L508) | JS/TS declaration; read source for behavior |
| function | calculateCostComparison | [L518](lib/providers.ts#L518) | JS/TS declaration; read source for behavior |
| function | estimateModelCost | [L531](lib/providers.ts#L531) | Standard uncached text request estimate; excludes tools, regional and service-tier fees. |
| function | pricingSource | [L540](lib/providers.ts#L540) | JS/TS declaration; read source for behavior |

## [lib/theme-palette.ts](lib/theme-palette.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | themePalette | [L2](lib/theme-palette.ts#L2) | Shared theme colors for inline styles and SVG charts. |

## [lib/types/catalog.ts](lib/types/catalog.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | ContentKind | [L3](lib/types/catalog.ts#L3) | JS/TS declaration; read source for behavior |
| type | Ecosystem | [L5](lib/types/catalog.ts#L5) | JS/TS declaration; read source for behavior |
| type | ContentSource | [L7](lib/types/catalog.ts#L7) | JS/TS declaration; read source for behavior |
| interface | CatalogItem | [L9](lib/types/catalog.ts#L9) | JS/TS declaration; read source for behavior |
| interface | Catalog | [L25](lib/types/catalog.ts#L25) | JS/TS declaration; read source for behavior |
| interface | CatalogStats | [L31](lib/types/catalog.ts#L31) | JS/TS declaration; read source for behavior |
| interface | CatalogConfig | [L38](lib/types/catalog.ts#L38) | JS/TS declaration; read source for behavior |
| interface | ScanDirectory | [L43](lib/types/catalog.ts#L43) | JS/TS declaration; read source for behavior |
| interface | ExtensionFeature | [L49](lib/types/catalog.ts#L49) | JS/TS declaration; read source for behavior |
| interface | Frontmatter | [L58](lib/types/catalog.ts#L58) | JS/TS declaration; read source for behavior |

## [lib/wiki/types.ts](lib/wiki/types.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | WikiArticle | [L1](lib/wiki/types.ts#L1) | JS/TS declaration; read source for behavior |
| interface | WikiData | [L16](lib/wiki/types.ts#L16) | JS/TS declaration; read source for behavior |
| interface | WikiSourceConfig | [L26](lib/wiki/types.ts#L26) | JS/TS declaration; read source for behavior |
| interface | WikiSource | [L31](lib/wiki/types.ts#L31) | JS/TS declaration; read source for behavior |
| interface | BuiltinTerm | [L41](lib/wiki/types.ts#L41) | JS/TS declaration; read source for behavior |

## [next.config.ts](next.config.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | nextConfig | [L3](next.config.ts#L3) | JS/TS declaration; read source for behavior |

## [postcss.config.mjs](postcss.config.mjs)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | config | [L1](postcss.config.mjs#L1) | JS/TS declaration; read source for behavior |

## [prisma.config.ts](prisma.config.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [prisma/seed.ts](prisma/seed.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | prisma | [L3](prisma/seed.ts#L3) | JS/TS declaration; read source for behavior |
| async function | main | [L5](prisma/seed.ts#L5) | JS/TS declaration; read source for behavior |

## [scripts/analyze-experiment.py](scripts/analyze-experiment.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | wilcoxon_signed_rank | [L26](scripts/analyze-experiment.py#L26) | Wilcoxon signed-rank test (two-sided). |
| function | normal_cdf | [L73](scripts/analyze-experiment.py#L73) | Approximate normal CDF using Abramowitz and Stegun. |
| function | cohens_d | [L78](scripts/analyze-experiment.py#L78) | Cohen's d for paired samples (using pooled SD). |
| function | interpret_cohens_d | [L87](scripts/analyze-experiment.py#L87) | Read source for behavior |
| function | median | [L99](scripts/analyze-experiment.py#L99) | Read source for behavior |
| function | iqr | [L107](scripts/analyze-experiment.py#L107) | Read source for behavior |
| function | mean | [L115](scripts/analyze-experiment.py#L115) | Read source for behavior |
| function | std | [L119](scripts/analyze-experiment.py#L119) | Read source for behavior |
| function | generate_latex_table | [L126](scripts/analyze-experiment.py#L126) | Generate LaTeX summary table for the paper. |
| function | main | [L157](scripts/analyze-experiment.py#L157) | Read source for behavior |

## [scripts/collect-snapshots.ts](scripts/collect-snapshots.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | SnapshotTab | [L17](scripts/collect-snapshots.ts#L17) | JS/TS declaration; read source for behavior |
| interface | Snapshot | [L26](scripts/collect-snapshots.ts#L26) | JS/TS declaration; read source for behavior |
| async function | collectSnapshot | [L43](scripts/collect-snapshots.ts#L43) | Collect a snapshot of the current VS Code workspace state. |
| function | guessLanguage | [L133](scripts/collect-snapshots.ts#L133) | JS/TS declaration; read source for behavior |

## [scripts/compute-agreement.py](scripts/compute-agreement.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | load_labels | [L22](scripts/compute-agreement.py#L22) | Load all labeler JSON files. |
| function | fleiss_kappa | [L33](scripts/compute-agreement.py#L33) | Compute Fleiss' kappa for a matrix of shape (N_subjects, N_categories). |
| function | interpret_kappa | [L71](scripts/compute-agreement.py#L71) | Standard interpretation of Fleiss' kappa. |
| function | main | [L87](scripts/compute-agreement.py#L87) | Read source for behavior |

## [scripts/evaluate-scorer.ts](scripts/evaluate-scorer.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | SnapshotFile | [L25](scripts/evaluate-scorer.ts#L25) | JS/TS declaration; read source for behavior |
| interface | LabelFile | [L43](scripts/evaluate-scorer.ts#L43) | JS/TS declaration; read source for behavior |
| interface | EvaluationResult | [L48](scripts/evaluate-scorer.ts#L48) | JS/TS declaration; read source for behavior |
| const | SNAPSHOT_DIR | [L63](scripts/evaluate-scorer.ts#L63) | JS/TS declaration; read source for behavior |
| const | LABEL_DIR | [L64](scripts/evaluate-scorer.ts#L64) | JS/TS declaration; read source for behavior |
| const | RESULTS_DIR | [L65](scripts/evaluate-scorer.ts#L65) | JS/TS declaration; read source for behavior |
| function | loadSnapshots | [L67](scripts/evaluate-scorer.ts#L67) | JS/TS declaration; read source for behavior |
| function | loadLabels | [L72](scripts/evaluate-scorer.ts#L72) | JS/TS declaration; read source for behavior |
| function | computeGroundTruth | [L81](scripts/evaluate-scorer.ts#L81) | Compute majority-vote ground truth from multiple labelers. |
| function | evaluateAtThreshold | [L123](scripts/evaluate-scorer.ts#L123) | Run the scorer on a snapshot and evaluate against ground truth at a given threshold. |
| function | formatPercent | [L184](scripts/evaluate-scorer.ts#L184) | JS/TS declaration; read source for behavior |
| function | generateLatexTable | [L188](scripts/evaluate-scorer.ts#L188) | JS/TS declaration; read source for behavior |
| function | main | [L210](scripts/evaluate-scorer.ts#L210) | JS/TS declaration; read source for behavior |

## [scripts/fetch-pricing-agent.py](scripts/fetch-pricing-agent.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | ExtractedPrice | [L46](scripts/fetch-pricing-agent.py#L46) | Read source for behavior |
| class | ExtractionResult | [L62](scripts/fetch-pricing-agent.py#L62) | Read source for behavior |
| function | fetch_html | [L66](scripts/fetch-pricing-agent.py#L66) | Read source for behavior |
| function | strip_html | [L72](scripts/fetch-pricing-agent.py#L72) | Read source for behavior |
| function | build_extractor | [L81](scripts/fetch-pricing-agent.py#L81) | Read source for behavior |
| function | extract_for_provider | [L98](scripts/fetch-pricing-agent.py#L98) | Read source for behavior |
| function | main | [L116](scripts/fetch-pricing-agent.py#L116) | Read source for behavior |

## [scripts/fetch-wiki-agent.py](scripts/fetch-wiki-agent.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | WikiArticle | [L49](scripts/fetch-wiki-agent.py#L49) | Read source for behavior |
| class | ResearchResult | [L64](scripts/fetch-wiki-agent.py#L64) | Read source for behavior |
| class | CurationResult | [L68](scripts/fetch-wiki-agent.py#L68) | Read source for behavior |
| function | slugify | [L75](scripts/fetch-wiki-agent.py#L75) | Read source for behavior |
| function | truncate | [L82](scripts/fetch-wiki-agent.py#L82) | Read source for behavior |
| function | build_researcher | [L91](scripts/fetch-wiki-agent.py#L91) | Read source for behavior |
| function | build_curator | [L123](scripts/fetch-wiki-agent.py#L123) | Read source for behavior |
| function | fetch_builtin_terms | [L147](scripts/fetch-wiki-agent.py#L147) | Convert builtinTerms from config into WikiArticle dicts. |
| function | fetch_openai_cookbook | [L170](scripts/fetch-wiki-agent.py#L170) | Fetch markdown files from OpenAI Cookbook on GitHub. |
| function | fetch_doc_pages | [L240](scripts/fetch-wiki-agent.py#L240) | Create stub articles for Anthropic/Google doc pages. |
| function | categorize_by_keywords | [L263](scripts/fetch-wiki-agent.py#L263) | Read source for behavior |
| function | main | [L283](scripts/fetch-wiki-agent.py#L283) | Read source for behavior |

## [scripts/fetch-wiki.ts](scripts/fetch-wiki.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | WikiArticle | [L14](scripts/fetch-wiki.ts#L14) | JS/TS declaration; read source for behavior |
| interface | WikiSource | [L29](scripts/fetch-wiki.ts#L29) | JS/TS declaration; read source for behavior |
| interface | BuiltinTerm | [L39](scripts/fetch-wiki.ts#L39) | JS/TS declaration; read source for behavior |
| function | slugify | [L48](scripts/fetch-wiki.ts#L48) | JS/TS declaration; read source for behavior |
| function | truncate | [L56](scripts/fetch-wiki.ts#L56) | JS/TS declaration; read source for behavior |
| function | extractText | [L62](scripts/fetch-wiki.ts#L62) | JS/TS declaration; read source for behavior |
| function | htmlToMarkdown | [L72](scripts/fetch-wiki.ts#L72) | JS/TS declaration; read source for behavior |
| function | categorizeByKeywords | [L97](scripts/fetch-wiki.ts#L97) | JS/TS declaration; read source for behavior |
| async function | fetchArxiv | [L113](scripts/fetch-wiki.ts#L113) | JS/TS declaration; read source for behavior |
| async function | fetchOpenAICookbook | [L208](scripts/fetch-wiki.ts#L208) | JS/TS declaration; read source for behavior |
| async function | fetchDocPages | [L276](scripts/fetch-wiki.ts#L276) | JS/TS declaration; read source for behavior |
| function | builtinToArticles | [L385](scripts/fetch-wiki.ts#L385) | JS/TS declaration; read source for behavior |
| async function | main | [L402](scripts/fetch-wiki.ts#L402) | JS/TS declaration; read source for behavior |

## [scripts/fix-pricing.py](scripts/fix-pricing.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [scripts/tokalator-context.py](scripts/tokalator-context.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | cell | [L23](scripts/tokalator-context.py#L23) | Read source for behavior |
| function | link | [L27](scripts/tokalator-context.py#L27) | Read source for behavior |
| function | source_paths | [L32](scripts/tokalator-context.py#L32) | Read source for behavior |
| function | python_details | [L59](scripts/tokalator-context.py#L59) | Read source for behavior |
| function | python_details.visit | [L63](scripts/tokalator-context.py#L63) | Read source for behavior |
| function | js_details | [L83](scripts/tokalator-context.py#L83) | Read source for behavior |
| function | js_details.first_line | [L90](scripts/tokalator-context.py#L90) | Read source for behavior |
| function | scan | [L110](scripts/tokalator-context.py#L110) | Read source for behavior |
| function | role | [L144](scripts/tokalator-context.py#L144) | Read source for behavior |
| function | resolve_import | [L159](scripts/tokalator-context.py#L159) | Read source for behavior |
| function | render | [L170](scripts/tokalator-context.py#L170) | Read source for behavior |
| function | write_changed | [L214](scripts/tokalator-context.py#L214) | Read source for behavior |
| function | main | [L230](scripts/tokalator-context.py#L230) | Read source for behavior |

## [scripts/write-components.py](scripts/write-components.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [scripts/write-dictionary.py](scripts/write-dictionary.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [scripts/write-learn-page.py](scripts/write-learn-page.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [scripts/write-learn.py](scripts/write-learn.py)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [tokalator-extension-vs/__tests__/__mocks__/vscode.ts](tokalator-extension-vs/__tests__/__mocks__/vscode.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | Uri | [L7](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L7) | JS/TS declaration; read source for behavior |
| class | EventEmitter | [L51](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L51) | JS/TS declaration; read source for behavior |
| enum | ConfigurationTarget | [L67](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L67) | JS/TS declaration; read source for behavior |
| class | TabInputText | [L74](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L74) | JS/TS declaration; read source for behavior |
| class | ThemeIcon | [L79](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L79) | JS/TS declaration; read source for behavior |
| class | RelativePattern | [L84](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L84) | JS/TS declaration; read source for behavior |
| const | chat | [L89](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L89) | JS/TS declaration; read source for behavior |
| const | workspace | [L97](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L97) | JS/TS declaration; read source for behavior |
| const | window | [L115](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L115) | JS/TS declaration; read source for behavior |
| const | commands | [L129](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L129) | JS/TS declaration; read source for behavior |
| const | env | [L134](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L134) | JS/TS declaration; read source for behavior |
| const | languages | [L139](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L139) | JS/TS declaration; read source for behavior |
| enum | DiagnosticSeverity | [L145](tokalator-extension-vs/__tests__/__mocks__/vscode.ts#L145) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/__tests__/contextChatParticipant.test.ts](tokalator-extension-vs/__tests__/contextChatParticipant.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | createMockMonitor | [L10](tokalator-extension-vs/__tests__/contextChatParticipant.test.ts#L10) | JS/TS declaration; read source for behavior |
| function | createMockStream | [L18](tokalator-extension-vs/__tests__/contextChatParticipant.test.ts#L18) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts](tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | createMockMonitor | [L12](tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts#L12) | JS/TS declaration; read source for behavior |
| function | createMockWebviewView | [L28](tokalator-extension-vs/__tests__/contextDashboardProvider.test.ts#L28) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/__tests__/modelProfiles.test.ts](tokalator-extension-vs/__tests__/modelProfiles.test.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [tokalator-extension-vs/eslint.config.mjs](tokalator-extension-vs/eslint.config.mjs)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [tokalator-extension-vs/jest.config.js](tokalator-extension-vs/jest.config.js)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| — | No declarations extracted | — | Read source; extraction may be incomplete |

## [tokalator-extension-vs/scripts/generate-models.ts](tokalator-extension-vs/scripts/generate-models.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | PriceSource | [L16](tokalator-extension-vs/scripts/generate-models.ts#L16) | JS/TS declaration; read source for behavior |
| interface | ModelEntry | [L18](tokalator-extension-vs/scripts/generate-models.ts#L18) | JS/TS declaration; read source for behavior |
| interface | ModelsConfig | [L33](tokalator-extension-vs/scripts/generate-models.ts#L33) | JS/TS declaration; read source for behavior |
| const | root | [L41](tokalator-extension-vs/scripts/generate-models.ts#L41) | JS/TS declaration; read source for behavior |
| const | modelsJsonPath | [L42](tokalator-extension-vs/scripts/generate-models.ts#L42) | JS/TS declaration; read source for behavior |
| const | profilesTsPath | [L43](tokalator-extension-vs/scripts/generate-models.ts#L43) | JS/TS declaration; read source for behavior |
| const | packageJsonPath | [L44](tokalator-extension-vs/scripts/generate-models.ts#L44) | JS/TS declaration; read source for behavior |
| function | quote | [L66](tokalator-extension-vs/scripts/generate-models.ts#L66) | JS/TS declaration; read source for behavior |
| const | longestId | [L70](tokalator-extension-vs/scripts/generate-models.ts#L70) | JS/TS declaration; read source for behavior |
| const | longestLabel | [L71](tokalator-extension-vs/scripts/generate-models.ts#L71) | JS/TS declaration; read source for behavior |
| const | byProvider | [L73](tokalator-extension-vs/scripts/generate-models.ts#L73) | JS/TS declaration; read source for behavior |
| const | providerOrder | [L78](tokalator-extension-vs/scripts/generate-models.ts#L78) | JS/TS declaration; read source for behavior |
| const | providerNames | [L79](tokalator-extension-vs/scripts/generate-models.ts#L79) | JS/TS declaration; read source for behavior |
| function | fmtPrice | [L86](tokalator-extension-vs/scripts/generate-models.ts#L86) | JS/TS declaration; read source for behavior |
| let | profileLines | [L90](tokalator-extension-vs/scripts/generate-models.ts#L90) | JS/TS declaration; read source for behavior |
| const | schemaVersion | [L115](tokalator-extension-vs/scripts/generate-models.ts#L115) | JS/TS declaration; read source for behavior |
| const | updatedAt | [L116](tokalator-extension-vs/scripts/generate-models.ts#L116) | JS/TS declaration; read source for behavior |
| const | tsContent | [L118](tokalator-extension-vs/scripts/generate-models.ts#L118) | JS/TS declaration; read source for behavior |
| type | PriceSource | [L124](tokalator-extension-vs/scripts/generate-models.ts#L124) | Known AI model profiles with context window, pricing, and metadata. |
| interface | ModelProfile | [L126](tokalator-extension-vs/scripts/generate-models.ts#L126) | JS/TS declaration; read source for behavior |
| const | BUNDLED_SCHEMA_VERSION | [L141](tokalator-extension-vs/scripts/generate-models.ts#L141) | JS/TS declaration; read source for behavior |
| const | BUNDLED_UPDATED_AT | [L142](tokalator-extension-vs/scripts/generate-models.ts#L142) | JS/TS declaration; read source for behavior |
| const | MODEL_PROFILES | [L144](tokalator-extension-vs/scripts/generate-models.ts#L144) | JS/TS declaration; read source for behavior |
| const | DEFAULT_MODEL_ID | [L146](tokalator-extension-vs/scripts/generate-models.ts#L146) | JS/TS declaration; read source for behavior |
| function | findModel | [L152](tokalator-extension-vs/scripts/generate-models.ts#L152) | Find a model by partial ID or label match. |
| function | getModel | [L186](tokalator-extension-vs/scripts/generate-models.ts#L186) | Get a model profile by exact ID, falling back to default. |
| function | getFeaturedModels | [L198](tokalator-extension-vs/scripts/generate-models.ts#L198) | Models flagged for prominent display in the dashboard picker. |
| function | fmtWindowShort | [L211](tokalator-extension-vs/scripts/generate-models.ts#L211) | JS/TS declaration; read source for behavior |
| const | pkg | [L217](tokalator-extension-vs/scripts/generate-models.ts#L217) | JS/TS declaration; read source for behavior |
| const | modelConfig | [L219](tokalator-extension-vs/scripts/generate-models.ts#L219) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/chat/contextChatParticipant.ts](tokalator-extension-vs/src/chat/contextChatParticipant.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | ContextChatParticipant | [L27](tokalator-extension-vs/src/chat/contextChatParticipant.ts#L27) | Chat participant `@tokalator` for Tokalator. |

## [tokalator-extension-vs/src/core/authService.ts](tokalator-extension-vs/src/core/authService.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | API_KEY_SECRET | [L3](tokalator-extension-vs/src/core/authService.ts#L3) | JS/TS declaration; read source for behavior |
| interface | AuthState | [L5](tokalator-extension-vs/src/core/authService.ts#L5) | JS/TS declaration; read source for behavior |
| class | AuthService | [L16](tokalator-extension-vs/src/core/authService.ts#L16) | Manages API key (in SecretStorage) and team identity for enterprise features. |

## [tokalator-extension-vs/src/core/catalogStore.ts](tokalator-extension-vs/src/core/catalogStore.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | CatalogMeta | [L11](tokalator-extension-vs/src/core/catalogStore.ts#L11) | JS/TS declaration; read source for behavior |
| let | activeCatalog | [L18](tokalator-extension-vs/src/core/catalogStore.ts#L18) | JS/TS declaration; read source for behavior |
| let | meta | [L19](tokalator-extension-vs/src/core/catalogStore.ts#L19) | JS/TS declaration; read source for behavior |
| const | emitter | [L26](tokalator-extension-vs/src/core/catalogStore.ts#L26) | JS/TS declaration; read source for behavior |
| const | onDidChangeCatalog | [L27](tokalator-extension-vs/src/core/catalogStore.ts#L27) | JS/TS declaration; read source for behavior |
| function | getActiveCatalog | [L29](tokalator-extension-vs/src/core/catalogStore.ts#L29) | JS/TS declaration; read source for behavior |
| function | getCatalogMeta | [L33](tokalator-extension-vs/src/core/catalogStore.ts#L33) | JS/TS declaration; read source for behavior |
| function | getModel | [L37](tokalator-extension-vs/src/core/catalogStore.ts#L37) | JS/TS declaration; read source for behavior |
| function | findModel | [L41](tokalator-extension-vs/src/core/catalogStore.ts#L41) | JS/TS declaration; read source for behavior |
| function | applyRemotePayload | [L53](tokalator-extension-vs/src/core/catalogStore.ts#L53) | Merge a remote payload onto the bundled catalog. |
| function | recordFetchError | [L87](tokalator-extension-vs/src/core/catalogStore.ts#L87) | JS/TS declaration; read source for behavior |
| function | resetToBundled | [L96](tokalator-extension-vs/src/core/catalogStore.ts#L96) | JS/TS declaration; read source for behavior |
| interface | RemoteCatalogPayload | [L107](tokalator-extension-vs/src/core/catalogStore.ts#L107) | JS/TS declaration; read source for behavior |
| interface | RemoteModelEntry | [L115](tokalator-extension-vs/src/core/catalogStore.ts#L115) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/contextMonitor.ts](tokalator-extension-vs/src/core/contextMonitor.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | PINNED_FILES_KEY | [L17](tokalator-extension-vs/src/core/contextMonitor.ts#L17) | JS/TS declaration; read source for behavior |
| const | SELECTED_MODEL_KEY | [L18](tokalator-extension-vs/src/core/contextMonitor.ts#L18) | JS/TS declaration; read source for behavior |
| const | SESSION_KEY | [L19](tokalator-extension-vs/src/core/contextMonitor.ts#L19) | JS/TS declaration; read source for behavior |
| const | USAGE_ANALYTICS_KEY | [L20](tokalator-extension-vs/src/core/contextMonitor.ts#L20) | JS/TS declaration; read source for behavior |
| const | MODEL_USAGE_LOG_KEY | [L21](tokalator-extension-vs/src/core/contextMonitor.ts#L21) | JS/TS declaration; read source for behavior |
| const | MAX_MODEL_LOG_ENTRIES | [L22](tokalator-extension-vs/src/core/contextMonitor.ts#L22) | JS/TS declaration; read source for behavior |
| type | ModelSwitchSource | [L25](tokalator-extension-vs/src/core/contextMonitor.ts#L25) | Where a model switch originated. |
| interface | ModelUsageEntry | [L28](tokalator-extension-vs/src/core/contextMonitor.ts#L28) | One entry in the chronological model-switch log. |
| class | ContextMonitor | [L47](tokalator-extension-vs/src/core/contextMonitor.ts#L47) | Core engine that tracks all editor state and produces real-time ContextSnapshots. |

## [tokalator-extension-vs/src/core/copilotPlan.ts](tokalator-extension-vs/src/core/copilotPlan.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | CopilotPlanId | [L13](tokalator-extension-vs/src/core/copilotPlan.ts#L13) | GitHub Copilot plan definitions and AI Credits tracker. |
| interface | CopilotPlan | [L15](tokalator-extension-vs/src/core/copilotPlan.ts#L15) | JS/TS declaration; read source for behavior |
| const | COPILOT_PLANS | [L24](tokalator-extension-vs/src/core/copilotPlan.ts#L24) | JS/TS declaration; read source for behavior |
| interface | SessionCreditUsage | [L67](tokalator-extension-vs/src/core/copilotPlan.ts#L67) | JS/TS declaration; read source for behavior |
| interface | CreditUsage | [L75](tokalator-extension-vs/src/core/copilotPlan.ts#L75) | JS/TS declaration; read source for behavior |
| interface | CreditSnapshot | [L82](tokalator-extension-vs/src/core/copilotPlan.ts#L82) | JS/TS declaration; read source for behavior |
| const | CREDITS_KEY | [L95](tokalator-extension-vs/src/core/copilotPlan.ts#L95) | JS/TS declaration; read source for behavior |
| const | PLAN_KEY | [L96](tokalator-extension-vs/src/core/copilotPlan.ts#L96) | JS/TS declaration; read source for behavior |
| const | PERIOD_START_KEY | [L97](tokalator-extension-vs/src/core/copilotPlan.ts#L97) | JS/TS declaration; read source for behavior |
| class | CopilotCreditsTracker | [L102](tokalator-extension-vs/src/core/copilotPlan.ts#L102) | Tracks GitHub AI Credits consumption per billing period. |

## [tokalator-extension-vs/src/core/licenseService.ts](tokalator-extension-vs/src/core/licenseService.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | LicenseTier | [L28](tokalator-extension-vs/src/core/licenseService.ts#L28) | Tokalator license tiers. |
| interface | LicenseState | [L30](tokalator-extension-vs/src/core/licenseService.ts#L30) | JS/TS declaration; read source for behavior |
| const | COMMUNITY_COMMANDS | [L37](tokalator-extension-vs/src/core/licenseService.ts#L37) | JS/TS declaration; read source for behavior |
| const | PRO_COMMANDS | [L42](tokalator-extension-vs/src/core/licenseService.ts#L42) | JS/TS declaration; read source for behavior |
| const | ENTERPRISE_COMMANDS | [L46](tokalator-extension-vs/src/core/licenseService.ts#L46) | JS/TS declaration; read source for behavior |
| class | LicenseService | [L50](tokalator-extension-vs/src/core/licenseService.ts#L50) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/modelProfiles.ts](tokalator-extension-vs/src/core/modelProfiles.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | PriceSource | [L7](tokalator-extension-vs/src/core/modelProfiles.ts#L7) | Known AI model profiles with context window, pricing, and metadata. |
| interface | ModelProfile | [L9](tokalator-extension-vs/src/core/modelProfiles.ts#L9) | JS/TS declaration; read source for behavior |
| const | BUNDLED_SCHEMA_VERSION | [L24](tokalator-extension-vs/src/core/modelProfiles.ts#L24) | JS/TS declaration; read source for behavior |
| const | BUNDLED_UPDATED_AT | [L25](tokalator-extension-vs/src/core/modelProfiles.ts#L25) | JS/TS declaration; read source for behavior |
| const | MODEL_PROFILES | [L27](tokalator-extension-vs/src/core/modelProfiles.ts#L27) | JS/TS declaration; read source for behavior |
| const | DEFAULT_MODEL_ID | [L58](tokalator-extension-vs/src/core/modelProfiles.ts#L58) | JS/TS declaration; read source for behavior |
| function | findModel | [L64](tokalator-extension-vs/src/core/modelProfiles.ts#L64) | Find a model by partial ID or label match. |
| function | getModel | [L98](tokalator-extension-vs/src/core/modelProfiles.ts#L98) | Get a model profile by exact ID, falling back to default. |
| function | getFeaturedModels | [L110](tokalator-extension-vs/src/core/modelProfiles.ts#L110) | Models flagged for prominent display in the dashboard picker. |

## [tokalator-extension-vs/src/core/priceWatch.ts](tokalator-extension-vs/src/core/priceWatch.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | RateSnapshot | [L6](tokalator-extension-vs/src/core/priceWatch.ts#L6) | JS/TS declaration; read source for behavior |
| interface | RateChange | [L14](tokalator-extension-vs/src/core/priceWatch.ts#L14) | JS/TS declaration; read source for behavior |
| interface | RateChangeset | [L24](tokalator-extension-vs/src/core/priceWatch.ts#L24) | JS/TS declaration; read source for behavior |
| interface | PriceWatchImpact | [L29](tokalator-extension-vs/src/core/priceWatch.ts#L29) | JS/TS declaration; read source for behavior |
| const | BASELINE_KEY | [L43](tokalator-extension-vs/src/core/priceWatch.ts#L43) | JS/TS declaration; read source for behavior |
| const | CHANGELOG_KEY | [L44](tokalator-extension-vs/src/core/priceWatch.ts#L44) | JS/TS declaration; read source for behavior |
| const | ACK_KEY | [L45](tokalator-extension-vs/src/core/priceWatch.ts#L45) | JS/TS declaration; read source for behavior |
| const | SETTLED_KEY | [L46](tokalator-extension-vs/src/core/priceWatch.ts#L46) | JS/TS declaration; read source for behavior |
| function | snapshotRates | [L48](tokalator-extension-vs/src/core/priceWatch.ts#L48) | JS/TS declaration; read source for behavior |
| function | diffRates | [L60](tokalator-extension-vs/src/core/priceWatch.ts#L60) | JS/TS declaration; read source for behavior |
| function | computeImpact | [L109](tokalator-extension-vs/src/core/priceWatch.ts#L109) | JS/TS declaration; read source for behavior |
| function | shouldSuppressInitialDiff | [L161](tokalator-extension-vs/src/core/priceWatch.ts#L161) | JS/TS declaration; read source for behavior |
| class | PriceWatchService | [L165](tokalator-extension-vs/src/core/priceWatch.ts#L165) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/pricing.ts](tokalator-extension-vs/src/core/pricing.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | CostBreakdown | [L3](tokalator-extension-vs/src/core/pricing.ts#L3) | JS/TS declaration; read source for behavior |
| function | costForModel | [L16](tokalator-extension-vs/src/core/pricing.ts#L16) | JS/TS declaration; read source for behavior |
| function | compareAcrossModels | [L37](tokalator-extension-vs/src/core/pricing.ts#L37) | JS/TS declaration; read source for behavior |
| function | defaultOutputFor | [L47](tokalator-extension-vs/src/core/pricing.ts#L47) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/pricingCatalog.ts](tokalator-extension-vs/src/core/pricingCatalog.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | CATALOG_URL | [L9](tokalator-extension-vs/src/core/pricingCatalog.ts#L9) | JS/TS declaration; read source for behavior |
| const | CACHE_KEY | [L10](tokalator-extension-vs/src/core/pricingCatalog.ts#L10) | JS/TS declaration; read source for behavior |
| const | CACHE_TTL_MS | [L11](tokalator-extension-vs/src/core/pricingCatalog.ts#L11) | JS/TS declaration; read source for behavior |
| const | FETCH_TIMEOUT_MS | [L12](tokalator-extension-vs/src/core/pricingCatalog.ts#L12) | JS/TS declaration; read source for behavior |
| interface | CacheEntry | [L14](tokalator-extension-vs/src/core/pricingCatalog.ts#L14) | JS/TS declaration; read source for behavior |
| async function | loadPricingCatalog | [L24](tokalator-extension-vs/src/core/pricingCatalog.ts#L24) | Load the pricing catalog. Applies cached payload instantly, then refreshes |
| async function | refreshPricingCatalog | [L67](tokalator-extension-vs/src/core/pricingCatalog.ts#L67) | JS/TS declaration; read source for behavior |
| type | FetchResult | [L75](tokalator-extension-vs/src/core/pricingCatalog.ts#L75) | JS/TS declaration; read source for behavior |
| function | fetchCatalog | [L79](tokalator-extension-vs/src/core/pricingCatalog.ts#L79) | JS/TS declaration; read source for behavior |
| function | validatePayload | [L123](tokalator-extension-vs/src/core/pricingCatalog.ts#L123) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/sessionLogger.ts](tokalator-extension-vs/src/core/sessionLogger.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | SessionEvent | [L7](tokalator-extension-vs/src/core/sessionLogger.ts#L7) | A single logged event within a session. |
| interface | SessionLog | [L14](tokalator-extension-vs/src/core/sessionLogger.ts#L14) | Full session log written to disk. |
| class | SessionLogger | [L27](tokalator-extension-vs/src/core/sessionLogger.ts#L27) | Opt-in session logger for controlled experiment data collection. |

## [tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | TabInfoPlain | [L8](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L8) | Minimal tab representation without VS Code types. |
| interface | ActiveFileContext | [L24](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L24) | Active file context needed for scoring. |
| interface | ScoringWeights | [L31](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L31) | Scoring weights (configurable for sensitivity analysis). |
| const | DEFAULT_WEIGHTS | [L39](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L39) | JS/TS declaration; read source for behavior |
| function | scoreAllPure | [L51](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L51) | Score all tabs relative to the active file using five signals. |
| function | extractImports | [L130](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L130) | Extract import paths from source text (TS/JS, Python, Go, Java). |
| function | matchesImport | [L163](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L163) | Check if a tab's path matches any import from the active file. |
| function | computePathSimilarity | [L195](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L195) | Compute path similarity based on shared directory prefix segments. |
| function | fileNameNoExt | [L216](tokalator-extension-vs/src/core/tabRelevanceScorer.pure.ts#L216) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/tabRelevanceScorer.ts](tokalator-extension-vs/src/core/tabRelevanceScorer.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | TabRelevanceScorer | [L16](tokalator-extension-vs/src/core/tabRelevanceScorer.ts#L16) | Scores each open tab by relevance to the currently active file. |

## [tokalator-extension-vs/src/core/telemetrySync.ts](tokalator-extension-vs/src/core/telemetrySync.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | TeamSummary | [L6](tokalator-extension-vs/src/core/telemetrySync.ts#L6) | JS/TS declaration; read source for behavior |
| interface | SkillEntry | [L20](tokalator-extension-vs/src/core/telemetrySync.ts#L20) | JS/TS declaration; read source for behavior |
| class | TelemetrySync | [L37](tokalator-extension-vs/src/core/telemetrySync.ts#L37) | HTTP client for Tokalator Pro enterprise backend. |

## [tokalator-extension-vs/src/core/tokenBudgetEstimator.ts](tokalator-extension-vs/src/core/tokenBudgetEstimator.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | TokenBudgetEstimator | [L13](tokalator-extension-vs/src/core/tokenBudgetEstimator.ts#L13) | Estimates token counts for files and tracks total context budget usage. |

## [tokalator-extension-vs/src/core/tokenizerService.ts](tokalator-extension-vs/src/core/tokenizerService.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | TokenizerType | [L14](tokalator-extension-vs/src/core/tokenizerService.ts#L14) | JS/TS declaration; read source for behavior |
| class | TokenizerService | [L16](tokalator-extension-vs/src/core/tokenizerService.ts#L16) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/types.ts](tokalator-extension-vs/src/core/types.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | TabInfo | [L6](tokalator-extension-vs/src/core/types.ts#L6) | Represents the relevance score and metadata for a single open tab. |
| interface | TurnSnapshot | [L25](tokalator-extension-vs/src/core/types.ts#L25) | Snapshot of token state at a specific chat turn. |
| interface | BudgetBreakdown | [L39](tokalator-extension-vs/src/core/types.ts#L39) | Budget breakdown by category. |
| interface | CostEstimate | [L50](tokalator-extension-vs/src/core/types.ts#L50) | Estimated cost for the current context state. |
| interface | ContextSnapshot | [L65](tokalator-extension-vs/src/core/types.ts#L65) | Full snapshot of the context window state at a point in time. |
| interface | SessionSummary | [L92](tokalator-extension-vs/src/core/types.ts#L92) | Persisted summary of a previous session. |
| interface | ContextMonitorEvents | [L109](tokalator-extension-vs/src/core/types.ts#L109) | Events emitted by the ContextMonitor. |

## [tokalator-extension-vs/src/core/usageAnalytics.ts](tokalator-extension-vs/src/core/usageAnalytics.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| type | TurnSource | [L4](tokalator-extension-vs/src/core/usageAnalytics.ts#L4) | JS/TS declaration; read source for behavior |
| interface | TurnCostRecord | [L6](tokalator-extension-vs/src/core/usageAnalytics.ts#L6) | JS/TS declaration; read source for behavior |
| interface | ModelSpendSummary | [L15](tokalator-extension-vs/src/core/usageAnalytics.ts#L15) | JS/TS declaration; read source for behavior |
| interface | OptimizationTip | [L29](tokalator-extension-vs/src/core/usageAnalytics.ts#L29) | JS/TS declaration; read source for behavior |
| interface | UsageInsights | [L34](tokalator-extension-vs/src/core/usageAnalytics.ts#L34) | JS/TS declaration; read source for behavior |
| const | MAX_RECORDS | [L51](tokalator-extension-vs/src/core/usageAnalytics.ts#L51) | JS/TS declaration; read source for behavior |
| class | UsageAnalytics | [L53](tokalator-extension-vs/src/core/usageAnalytics.ts#L53) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/core/workspaceSecurityScanner.ts](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | SecretPattern | [L13](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts#L13) | Tokalator Pro: Workspace Security Scanner |
| interface | SecurityAuditResult | [L19](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts#L19) | JS/TS declaration; read source for behavior |
| const | SECRET_FILE_PATTERNS | [L30](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts#L30) | JS/TS declaration; read source for behavior |
| const | BLOCKED_FILENAMES | [L53](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts#L53) | JS/TS declaration; read source for behavior |
| function | isSecretFile | [L57](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts#L57) | JS/TS declaration; read source for behavior |
| class | WorkspaceSecurityScanner | [L61](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts#L61) | JS/TS declaration; read source for behavior |
| function | walk | [L138](tokalator-extension-vs/src/core/workspaceSecurityScanner.ts#L138) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/extension.ts](tokalator-extension-vs/src/extension.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| let | monitorRef | [L13](tokalator-extension-vs/src/extension.ts#L13) | JS/TS declaration; read source for behavior |
| const | log | [L14](tokalator-extension-vs/src/extension.ts#L14) | JS/TS declaration; read source for behavior |
| function | fmtTokens | [L16](tokalator-extension-vs/src/extension.ts#L16) | JS/TS declaration; read source for behavior |
| function | formatTimeAgo | [L22](tokalator-extension-vs/src/extension.ts#L22) | JS/TS declaration; read source for behavior |
| async function | activate | [L32](tokalator-extension-vs/src/extension.ts#L32) | JS/TS declaration; read source for behavior |
| function | deactivate | [L248](tokalator-extension-vs/src/extension.ts#L248) | JS/TS declaration; read source for behavior |

## [tokalator-extension-vs/src/webview/contextDashboardProvider.ts](tokalator-extension-vs/src/webview/contextDashboardProvider.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| class | ContextDashboardProvider | [L14](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L14) | WebviewViewProvider for the Tokalator sidebar panel. |
| function | fmt | [L377](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L377) | JS/TS declaration; read source for behavior |
| function | fmtC | [L378](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L378) | JS/TS declaration; read source for behavior |
| function | ago | [L379](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L379) | JS/TS declaration; read source for behavior |
| function | rc | [L380](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L380) | JS/TS declaration; read source for behavior |
| function | render | [L382](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L382) | JS/TS declaration; read source for behavior |
| function | tabHtml | [L870](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L870) | JS/TS declaration; read source for behavior |
| function | getNonce | [L934](tokalator-extension-vs/src/webview/contextDashboardProvider.ts#L934) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/cli.ts](tokalator-mcp/src/cli.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | HELP | [L20](tokalator-mcp/src/cli.ts#L20) | JS/TS declaration; read source for behavior |
| function | parseArgs | [L55](tokalator-mcp/src/cli.ts#L55) | JS/TS declaration; read source for behavior |
| async function | main | [L96](tokalator-mcp/src/cli.ts#L96) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/core/budgetEstimator.ts](tokalator-mcp/src/core/budgetEstimator.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | FileBudget | [L10](tokalator-mcp/src/core/budgetEstimator.ts#L10) | JS/TS declaration; read source for behavior |
| class | BudgetEstimator | [L16](tokalator-mcp/src/core/budgetEstimator.ts#L16) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/core/modelProfiles.ts](tokalator-mcp/src/core/modelProfiles.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | ModelProfile | [L6](tokalator-mcp/src/core/modelProfiles.ts#L6) | Claude model profiles for Tokalator MCP. |
| const | MODEL_PROFILES | [L15](tokalator-mcp/src/core/modelProfiles.ts#L15) | JS/TS declaration; read source for behavior |
| const | DEFAULT_MODEL_ID | [L27](tokalator-mcp/src/core/modelProfiles.ts#L27) | JS/TS declaration; read source for behavior |
| function | findModel | [L33](tokalator-mcp/src/core/modelProfiles.ts#L33) | Find a model by partial ID or label match. |
| function | getModel | [L48](tokalator-mcp/src/core/modelProfiles.ts#L48) | Get model by exact ID, falling back to default. |

## [tokalator-mcp/src/core/tokenizerService.ts](tokalator-mcp/src/core/tokenizerService.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | require | [L13](tokalator-mcp/src/core/tokenizerService.ts#L13) | JS/TS declaration; read source for behavior |
| type | TokenizerType | [L15](tokalator-mcp/src/core/tokenizerService.ts#L15) | JS/TS declaration; read source for behavior |
| class | TokenizerService | [L17](tokalator-mcp/src/core/tokenizerService.ts#L17) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/core/types.ts](tokalator-mcp/src/core/types.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| interface | BudgetBreakdown | [L2](tokalator-mcp/src/core/types.ts#L2) | Budget allocation breakdown |
| interface | TurnSnapshot | [L11](tokalator-mcp/src/core/types.ts#L11) | Per-turn context snapshot for compaction tracking |

## [tokalator-mcp/src/index.ts](tokalator-mcp/src/index.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | tokenizer | [L24](tokalator-mcp/src/index.ts#L24) | JS/TS declaration; read source for behavior |
| const | server | [L26](tokalator-mcp/src/index.ts#L26) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/tools/countTokens.ts](tokalator-mcp/src/tools/countTokens.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | countTokensSchema | [L6](tokalator-mcp/src/tools/countTokens.ts#L6) | JS/TS declaration; read source for behavior |
| async function | countTokens | [L12](tokalator-mcp/src/tools/countTokens.ts#L12) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/tools/estimateBudget.ts](tokalator-mcp/src/tools/estimateBudget.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | estimateBudgetSchema | [L6](tokalator-mcp/src/tools/estimateBudget.ts#L6) | JS/TS declaration; read source for behavior |
| async function | estimateBudget | [L13](tokalator-mcp/src/tools/estimateBudget.ts#L13) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/tools/listModels.ts](tokalator-mcp/src/tools/listModels.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| function | listModels | [L3](tokalator-mcp/src/tools/listModels.ts#L3) | JS/TS declaration; read source for behavior |

## [tokalator-mcp/src/tools/previewTurn.ts](tokalator-mcp/src/tools/previewTurn.ts)

| Type | Symbol | Source | Documented purpose / limits |
|---|---|---|---|
| const | previewTurnSchema | [L4](tokalator-mcp/src/tools/previewTurn.ts#L4) | JS/TS declaration; read source for behavior |
| function | previewTurn | [L9](tokalator-mcp/src/tools/previewTurn.ts#L9) | JS/TS declaration; read source for behavior |


## Coverage and limitations

Python uses AST declarations and first-line docstrings. JS/TS uses best-effort declaration/import matching; methods, re-exports, strings and multiline constructs can be missed or misidentified.
Git projects use tracked and unignored files. Dependency/build directories, dot paths, symlinks and oversized files are excluded. Non-Git scans use directory exclusions only.
No model calls, full behavioral summaries, runtime call graph, or complete route resolution are claimed.

No scan warnings.
