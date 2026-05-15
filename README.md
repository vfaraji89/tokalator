# Tokalator

A context engineering toolkit for AI coding. Website + VS Code extension + Claude Code plugin + reusable prompts

**Site**: [tokalator.wiki](https://tokalator.wiki)
**Extension**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)
**Claude Code Plugin**: [tokalator-glossary](https://github.com/vfaraji89/tokalator-glossary)

---

## Why

AI assistants have finite context windows. When you have 30 tabs open, your assistant's attention gets diluted across irrelevant files. 
You can't see what's happening -- how many tokens you're using, which files matter, when context rot starts to kick in.

A set of calculators and tools for understanding AI token economics:

- Token calculator with real-time pricing across updated models
- Model comparison -- context windows, costs, capabilities side by side
- Caching calculator for estimating prompt caching savings
- Conversation estimator that predicts when context rot will hit
- Context optimizer for building token budgets
- A interactive course on context engineering
- A wiki with +40 terms defined.

## The Extension

A VS Code sidebar that tracks your context budget in real time:

- Shows token usage as LOW / MEDIUM / HIGH
- Ranks open files by relevance to what you're actually working on
- One click to close the noise
- Pin important files so they're always counted
- Chat commands via `@tokalator` — count, optimize, pin, breakdown, instructions, model

Scores files based on language match, import relationships, path proximity, edit recency, and diagnostics.

## Claude Code Plugin

Auto-generates a codebase glossary (symbol index) after `/init`. Saves tokens by giving Claude a compressed map of your codebase.

```
/plugin marketplace add vfaraji89/tokalator-glossary
/plugin install tokalator-glossary
```

Commands: `/tokalator-glossary:glossary`, `/tokalator-glossary:glossary-lookup`, `/tokalator-glossary:glossary-stats`, `/tokalator-glossary:glossary-refresh`

## Getting Started

```bash
# website
git clone https://github.com/vfaraji89/tokalator.git
cd tokalator && npm install && npm run dev

# extension
cd tokalator-extension-vs && npm install && npm run compile
# then F5 in VS Code
```

## License

MIT
