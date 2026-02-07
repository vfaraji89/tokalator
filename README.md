# Context Engineering

This repo contains two things:

## 1. Copilot Contribution (`copilot-contribution/`)

Ready-to-submit collection for [awesome-copilot](https://github.com/github/awesome-copilot):

```
copilot-contribution/
├── README.md                                    # Contribution guide
├── instructions/
│   └── context-engineering.instructions.md     # Coding guidelines
├── agents/
│   └── context-architect.agent.md              # Multi-file planning agent
├── prompts/
│   ├── context-map.prompt.md                   # Map affected files
│   ├── what-context-needed.prompt.md           # Ask what Copilot needs
│   └── refactor-plan.prompt.md                 # Plan multi-file refactors
└── collections/
    └── context-engineering.collection.yml      # Bundle manifest
```

**To submit:** Fork awesome-copilot, copy the files to their respective directories, run `npm start`, and open a PR.

## 2. Reference Material (`reference-material/`)

Deep-dive documentation on how AI IDEs handle context. Not for the Copilot contribution—use for blog posts, talks, or personal reference:

```
reference-material/
├── 01-ai-ide-context.md        # Claude Code, Copilot, Cursor architectures
├── 02-github-ai-workflows.md   # PR review, Actions, issue triage
├── 03-practical-patterns.md    # Project structure, prompting techniques
└── 04-building-tools.md        # Python implementations for context management
```

## Quick Links

- [Copilot contribution README](copilot-contribution/README.md)
- [How AI IDEs handle context](reference-material/01-ai-ide-context.md)
- [GitHub AI workflows](reference-material/02-github-ai-workflows.md)

## License

MIT
