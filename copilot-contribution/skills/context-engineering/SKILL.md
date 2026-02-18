---
name: context-engineering
description: Context engineering expertise for AI-assisted development — token budgeting, context window management, caching strategies, and agent orchestration patterns.
user-invokable: true
disable-model-invocation: false
---

# Context Engineering Skill

You are a context engineering expert. Apply these principles when helping with AI-assisted development tasks.

## Core Principles

### Token Budget Awareness
- Every token in the context window has a cost — both financial and attentional
- Input tokens are typically 3-5x cheaper than output tokens
- The practical attention budget is often smaller than the raw context window limit
- Always prefer the smallest set of **high-signal tokens** that maximize correct output

### Context Window Management
- **Progressive Disclosure**: Load context just-in-time rather than all at once
- **Lightweight Identifiers**: Maintain file path references and load content only when needed
- **Distractors**: Actively filter files that are topically related but don't contain the answer
- **Context Rot**: Monitor conversation length — accuracy degrades as tokens accumulate

### Memory Strategies (by scenario)

| Scenario | Strategy | Trade-off |
|----------|----------|-----------|
| Short tasks | **Trimming (Last-N)** — keep recent turns, drop old ones | Fast but loses early context |
| Long sessions | **Summarisation** — condense history into executive summary | Preserves big picture, loses detail |
| Precision work | **Context Editing** — remove stale tool results and thinking tokens | Up to 84% reduction, keeps flow |
| Cross-session | **Memory Tool / Copilot Memory** — persist facts externally | Eliminates cold-start problem |
| API-level | **Automatic Compaction** — SDK summarizes at token threshold | Transparent, 50-60% reduction |

### Caching Optimization
- Prompt caching reduces repeated prefix costs by ~90%
- Cache writes cost ~25% more than standard input
- Calculate break-even point: `cache_write_overhead / (standard_price - cache_read_price)`
- System prompts and stable prefixes are ideal cache candidates

### Agent Orchestration Patterns
- **Subagent isolation**: Delegate subtasks to agents with dedicated context windows
- **Parallel execution**: Run independent subtasks simultaneously across subagents
- **Specialization**: Use different models optimized for each role (planning vs. coding vs. review)
- **Agent hooks**: Enforce deterministic quality checks at lifecycle points (PreToolUse, PostToolUse)

## When to Apply

Apply this skill when:
- Planning multi-file changes that need context budgeting
- Optimizing prompts or instructions for token efficiency
- Designing agent workflows with multiple specialized agents
- Evaluating caching strategies for repeated API calls
- Diagnosing context rot or degraded output quality in long sessions
- Setting up agent skills, hooks, or orchestration patterns

## Guidelines

1. **Measure before optimizing** — use token counting to identify the largest context consumers
2. **Structure prompts with XML tags** — `<background>`, `<constraints>`, `<tool_guidance>` improve parsing
3. **Pin critical files** — mark essential files to survive compaction
4. **Set context rot warnings** — alert when conversation approaches degradation thresholds
5. **Use skills for domain expertise** — package reusable knowledge in SKILL.md files
6. **Configure agent hooks** — enforce linting, security checks, or formatting after tool calls
