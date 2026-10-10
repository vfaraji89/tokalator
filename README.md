<div align="center">

# Tokalator

**See every token your AI coding spends.**

Context budget, agent usage for Claude Code, Copilot and Codex, and code maps for your agents.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/vfaraji89.tokalator?label=VS%20Code&color=e3120b)](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/vfaraji89.tokalator?color=0a0a0b)](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-0a0a0b)](LICENSE)
[![arXiv](https://img.shields.io/badge/arXiv-2604.08290-b31b1b)](https://arxiv.org/abs/2604.08290)

[Website](https://tokalator.ai) · [Install](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator) · [Try it in your browser](https://tokalator.ai/extension) · [Paper](https://arxiv.org/abs/2604.08290)

![Tokalator dashboard](https://tokalator.ai/screenshots/dashboard-demo.gif)

</div>

## What's here

| Folder | What it is |
| --- | --- |
| [`tokalator-extension-vs/`](tokalator-extension-vs) | The VS Code extension: context budget, Claude Code turns with API-equivalent cost, tab relevance, 32 priced models, Secure Workspace and code maps |
| [`claude-plugin/`](claude-plugin) | The Claude Code plugin: source-linked `GLOSSARY.md` and `SITE-MAP.md`, refreshed by lifecycle hooks |
| [`tokalator-mcp/`](tokalator-mcp) | The MCP server and CLI: token counts, budgets and Claude Code usage in Claude Code and your terminal |

## Quick start

**VS Code.** Install from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator), or paste into Quick Open:

```
ext install vfaraji89.tokalator
```

**Claude Code.** Clone this repo, then start Claude Code with the plugin:

```
claude --plugin-dir /path/to/tokalator/claude-plugin
```

Run `/tokalator-glossary:code-review` or `/tokalator-glossary:refresh-context`.

**MCP server and CLI.** Build it, then register it with Claude Code:

```
cd tokalator-mcp && npm install && npm run build
claude mcp add --transport stdio tokalator -- node "$PWD/build/index.js"
```

## Build from source

```
cd tokalator-extension-vs
npm install
npm test
npm run package
```

## Contributing

Issues and pull requests are welcome. Please read [LICENSING.md](LICENSING.md) first. Security reports go through [SECURITY.md](SECURITY.md), not public issues.

## License

AGPL-3.0-or-later, with commercial licences available. "Tokalator" and its logo are trademarks of the copyright holder.
