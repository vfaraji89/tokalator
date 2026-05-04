---
name: terminology-optimization
description: Automatically discover, extract, and inject domain terminology into agent context to reduce token waste from repeated definitions and enable compressed communication between agent and codebase.
user-invokable: true
disable-model-invocation: false
license: MIT
metadata:
  author: vfaraji89
  version: 1.0.0
  workshop: "Agent Skills '26 @ CAIS 2026"
  paper-topic: "Skills as First-Class Artifacts for LLM-Based Agents"
---

# Terminology Optimization Skill

Automatically scan a project for domain-specific terminology, build a compressed glossary, and inject it into agent context at session start. This reduces per-turn token usage by replacing repeated natural-language explanations with short canonical terms the agent already understands.

## Motivation

In long coding sessions, agents repeatedly encounter domain-specific concepts (e.g., "context rot", "break-even point", "relevance score") and either:
1. Re-explain them each turn (token waste)
2. Hallucinate incorrect definitions (accuracy loss)
3. Fail to use project-specific meanings (semantic drift)

By front-loading a compressed terminology set into the system context, agents can reference terms by name with shared understanding. The upfront cost (200-500 tokens for a typical glossary) saves thousands of tokens across a multi-turn session.

## Token Savings Model

```
savings_per_session = (avg_terms_per_turn × avg_definition_tokens × num_turns) - glossary_injection_cost
```

For a 25-turn session with 3 domain terms used per turn at ~40 tokens per definition:
- Without skill: 3 × 40 × 25 = 3,000 tokens of redundant definitions
- With skill: 400 tokens upfront glossary + 3 × 5 × 25 = 775 tokens total
- Net saving: ~2,225 tokens (74% reduction in terminology overhead)

## How It Works

### 1. Terminology Discovery

Scan the project for terminology sources:
- `content/dictionary.json` — structured term definitions
- `terminologies.md` — LaTeX-formatted glossary table
- `CLAUDE.md` / `AGENTS.md` — inline term definitions in project docs
- Code comments with pattern `// Term: <definition>`
- YAML frontmatter `terms:` fields in skill/instruction files

### 2. Glossary Compilation

Extract terms into a compressed format optimized for token efficiency:

```markdown
## Project Glossary (auto-generated)
- **Context Rot**: accuracy degrades as input length grows; threshold ~20 turns
- **R-score**: tab relevance ∈ [0,1]; 5 signals weighted (lang 0.25, imports 0.30, path 0.20, recency 0.15, diag 0.10)
- **Break-even (n*)**: reuses needed for cache to beat uncached; n* = write_overhead / (input_price - read_price)
- **Distractors**: files with R < 0.3 consuming budget without contributing
```

### 3. Context Injection

The compiled glossary is injected via:
- `.instructions.md` file with `applyTo: "**"` for always-on awareness
- MCP tool response when agent calls `get_terminology`
- SKILL.md reference for on-demand loading

## When to Apply

- **New contributor onboarding** — agent immediately understands project vocabulary
- **Cross-agent delegation** — subagents inherit terminology without re-discovery
- **Long sessions** — prevents terminology drift over 20+ turns
- **Multi-repo work** — each project's terms stay isolated in their own glossary

## Rules

### Auto-Discovery

Run terminology scan when:
- A new session starts in a project with `content/dictionary.json`
- User asks about project-specific terms
- Agent encounters an undefined acronym or domain term in code

### Glossary Format

Each term entry must be:
- Under 30 tokens (forces compression)
- Grounded in the actual codebase definition (cite file:line)
- Tagged with category for selective injection

### Injection Strategy

| Session Type | Injection Method |
|---|---|
| Quick fix (< 5 turns) | Skip — overhead not justified |
| Standard task (5-20 turns) | Inject top-10 terms by frequency |
| Long session (20+ turns) | Full glossary in system context |
| Specialized task | Category-filtered subset only |

### Security

- NEVER include terms that reference secrets, API keys, or credentials
- Skip any term whose definition contains environment variable values
- Glossary must be regenerated (not cached) if `.env` files change

## Integration with Tokalator

This skill pairs with the `count_tokens` MCP tool:

```
# Check glossary cost before injection
count_tokens(text: "<compiled glossary>", model: "claude-opus-4-6")

# Verify it stays under 500 tokens (budget threshold)
if token_count > 500:
    prune lowest-frequency terms until under budget
```

## Output Format

When invoked, produce:

```yaml
terminology_report:
  project: <project-name>
  terms_discovered: <count>
  glossary_tokens: <count>
  estimated_savings_25_turns: <tokens>
  injection_method: instructions | mcp | skill
  glossary: |
    <compressed glossary content>
```
