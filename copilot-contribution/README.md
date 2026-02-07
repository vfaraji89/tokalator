# Context Engineering Collection

> Contribution to [awesome-copilot](https://github.com/github/awesome-copilot)

## What This Collection Provides

Tools for maximizing GitHub Copilot effectiveness through better context management.

### Components

| Type | File | Purpose |
|------|------|---------|
| Instructions | `context-engineering.instructions.md` | Guidelines for structuring code so Copilot understands it better |
| Agent | `context-architect.agent.md` | Plans multi-file changes by mapping dependencies first |
| Prompt | `context-map.prompt.md` | Generates a map of affected files before changes |
| Prompt | `what-context-needed.prompt.md` | Asks Copilot what files it needs to answer well |
| Prompt | `refactor-plan.prompt.md` | Creates phased refactor plans with verification steps |
| Collection | `context-engineering.collection.yml` | Bundles everything together |

## Why This Matters

Copilot's suggestions are only as good as the context it has. Most "bad" suggestions come from:

- Relevant files not being open
- Poor project structure that obscures intent
- Asking for multi-file changes without providing full picture

This collection addresses each problem with actionable tools.

## Installation

After this is merged, the collection will be available via:

```
gh copilot extension install github/awesome-copilot/plugins/context-engineering
```

## Usage Examples

### Using the Instructions

The instructions are automatically applied. They guide you to:
- Keep related files open in tabs
- Use descriptive file paths
- Add explicit types
- Create a COPILOT.md file

### Using the Context Architect Agent

```
@context-architect I need to add authentication to the API.
What files are involved?
```

The agent will search your codebase and produce a context map before suggesting any changes.

### Using the Prompts

**Before a big change:**
```
/context-map Add caching to all database queries
```

**When Copilot gives a generic answer:**
```
/what-context-needed How does the payment flow work?
```

**Planning a refactor:**
```
/refactor-plan Migrate from REST to GraphQL
```

## Files to Copy

To contribute, copy these files to the awesome-copilot repo:

```
instructions/context-engineering.instructions.md → instructions/
agents/context-architect.agent.md               → agents/
prompts/context-map.prompt.md                   → prompts/
prompts/what-context-needed.prompt.md           → prompts/
prompts/refactor-plan.prompt.md                 → prompts/
collections/context-engineering.collection.yml  → collections/
```

Then run `npm start` to update the README.
