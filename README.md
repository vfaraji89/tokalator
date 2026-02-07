# 🧮 Tokalator

**Count your tokens like beads on an abacus.**

A toolkit for AI context engineering — featuring a live website, a VS Code extension, and a curated collection of prompts, agents, and instructions for working with AI coding assistants.

🌐 **Website**: [tokalator.wiki](https://tokalator.wiki)  
📦 **Extension**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)

---

## What's Inside

### 🌐 Website — [tokalator.wiki](https://tokalator.wiki)

A comprehensive resource for AI context engineering:

| Page | Description |
|------|-------------|
| **Token Calculator** | Calculate costs across 40+ AI models with real-time pricing |
| **Model Comparison** | Side-by-side comparison of context windows, pricing, capabilities |
| **Caching Calculator** | Estimate savings from prompt caching (Anthropic, OpenAI, Google) |
| **Usage Tracker** | Monitor daily/monthly token spend with visual breakdowns |
| **Conversation Estimator** | Predict context rot and token growth across chat turns |
| **Economic Analysis** | ROI analysis, cost projections, optimization recommendations |
| **Context Optimizer** | Build optimal context budgets: system prompts, code, docs, output |
| **Learn** | 10-lesson course on context engineering fundamentals |
| **Wiki** | Dictionary of 41 terms across 8 categories |
| **Extension Docs** | Installation guide, features, and screenshots |

Built with **Next.js 15**, **React 19**, **Tailwind CSS 4**, deployed on **Vercel**.

### 🧩 VS Code Extension — [Install](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)

Real-time context budget monitoring inside your editor:

- **Token Budget Dashboard** — Sidebar showing budget level (LOW/MEDIUM/HIGH), file list ranked by relevance, one-click cleanup
- **Chat Commands** — `@tokens /count`, `@tokens /optimize`, `@tokens /pin`, `@tokens /breakdown`
- **Smart Relevance Scoring** — Language match, import relationships, path similarity, recency, diagnostics
- **Persistent Pins** — Mark files as always-relevant, survives restarts

### 📂 Copilot Contributions

Ready-to-use context files for AI coding assistants:

```
copilot-contribution/
├── agents/          → Context Architect agent
├── collections/     → Context Engineering collection
├── instructions/    → Copilot custom instructions
└── prompts/         → Context map, refactor plan, analysis prompts
```

---

## Quick Start

### Website (local development)

```bash
git clone https://github.com/vfaraji89/tokalator.git
cd tokalator
npm install
npm run dev
# → http://localhost:3000
```

### Extension (development)

```bash
cd tokalator-extension-vs
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

---

## Tech Stack

| Component | Stack |
|-----------|-------|
| Website | Next.js 15, React 19, Tailwind CSS 4, TypeScript |
| Extension | VS Code API 1.99+, TypeScript, esbuild |
| Hosting | Vercel (website), VS Code Marketplace (extension) |
| Data | Real-time model pricing from multiple AI providers |

## Project Structure

```
tokalator/
├── app/                    → Next.js pages (25+ routes)
├── components/             → React components
├── content/                → Site content (JSON)
├── lib/                    → Utilities (pricing, caching, market data)
├── tokalator-extension-vs/ → VS Code extension source
├── copilot-contribution/   → AI assistant context files
├── user-content/           → Community-contributed prompts & agents
└── public/                 → Static assets
```

## Contributing

Contributions welcome! You can:

1. **Add prompts/agents** — Drop files into `user-content/`
2. **Improve the extension** — See `tokalator-extension-vs/`
3. **Add wiki articles** — Edit `content/wiki/articles.json`
4. **Report issues** — [GitHub Issues](https://github.com/vfaraji89/tokalator/issues)

## License

MIT

---

<p align="center">
  <i>Built in Istanbul 🇹🇷 — Where East meets West, tokens meet context</i>
</p>
