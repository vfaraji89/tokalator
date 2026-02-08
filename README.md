# Tokalator

A context engineering toolkit for AI coding. Website + VS Code extension + reusable prompts.

**Site**: [tokalator.wiki](https://tokalator.wiki)
**Extension**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)

---

## Why

AI assistants have finite context windows. When you have 30 tabs open, your assistant's attention gets diluted across irrelevant files. You can't see what's happening -- how many tokens you're using, which files matter, when context rot starts to kick in.

Tokalator makes that visible.

## The Website

A set of calculators and tools for understanding AI token economics:

- Token calculator with real-time pricing across 40+ models
- Model comparison -- context windows, costs, capabilities side by side
- Caching calculator for estimating prompt caching savings
- Conversation estimator that predicts when context rot will hit
- Context optimizer for building token budgets
- A 10-lesson course on context engineering
- A wiki with 41 terms defined

Built with Next.js, React, Tailwind. Hosted on Vercel.

## The Extension

A VS Code sidebar that tracks your context budget in real time:

- Shows token usage as LOW / MEDIUM / HIGH (no fake percentages)
- Ranks open files by relevance to what you're actually working on
- One click to close the noise
- Pin important files so they're always counted
- Chat commands via `@tokalator` — count, optimize, pin, breakdown, instructions, model

Scores files based on language match, import relationships, path proximity, edit recency, and diagnostics.

## Getting Started

```bash
# website
git clone https://github.com/vfaraji89/tokalator.git
cd tokalator && npm install && npm run dev

# extension
cd tokalator-extension-vs && npm install && npm run compile
# then F5 in VS Code
```

## Structure

The repo has three main parts:

- `app/` and `components/` -- the Next.js website
- `tokalator-extension-vs/` -- the VS Code extension
- `copilot-contribution/` -- prompts, agents, and instructions you can drop into your own projects

## Contributing

Open an issue, submit a PR, or just drop prompt files into `user-content/`.

## License

MIT
