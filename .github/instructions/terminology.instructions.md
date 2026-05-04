---
applyTo: "**"
---

# Project Terminology (auto-generated)

These terms have project-specific meanings. Use them precisely without re-defining.

## Caching \& Cost
- **Cacheable Tokens**: Tokens in the stable prefix (system prompt, instructions, pinned files) eligible for prompt caching across turns.
- **Volatile Tokens**: Tokens that change between turns (conversation history, edited file content) and cannot benefit from prompt caching.
- **Break-Even Point ($n^*$)**: The number of prompt reuses after which caching becomes cheaper than re-sending tokens uncached (Equation~4).
- **Session Projection**: Extrapolation of per-turn costs to session (10/25/50 turns), daily (8 sessions), and monthly (22 working days) estimates.

## Token Economics
- **Input Growth Rate**: The rate at which per-turn input tokens increase across a conversation, driven by conversation history accumulation.
- **Budget Breakdown**: The decomposition of total estimated tokens into five components: files, system prompt, instructions, conversation history, and output reservation.
- **System Overhead**: Hidden tokens injected by the AI assistant's framework (system prompts, tool definitions, internal formatting) that consume context budget invisibly.
- **Budget Level**: A tri-state classification of context utilization: `low` ($<50\%$), `medium` (50--80\%), `high` ($>80\%$). Displayed as a colored badge in the dashboard.
- **Output Reservation**: Tokens reserved for the model's response (default: 4,000).
- **Batch Processing**: An API tier that processes requests asynchronously at reduced cost, ideal for non-time-sensitive workloads like bulk analysis or testing.

## Context Management
- **Rot Threshold**: The turn count or token count at which context rot begins to degrade output quality. Default: 20 turns.
- **Compaction Point**: The estimated turn number at which cumulative context will exceed the rot threshold, triggering a recommendation to summarize or restart...
- **Context Health**: A tri-state indicator (`healthy`, `warning`, `critical`) reflecting the overall quality of the developer's context window based on budget utilization, secret...
- **Next Turn Preview**: A projection of the total token count after the next conversational turn, helping developers decide whether to send a message...

## Relevance \& Scoring
- **Pinned Files**: Files explicitly marked by the developer to always receive $R = 1.0$, overriding algorithmic scoring. Persisted across VS~Code sessions.
- **Optimization**: The process of closing low-relevance tabs ($R < 0.

## Security (Planned For V3.1.5)
- **Sensitive File**: (Future) A file whose name matches known credential patterns (`.env`, `.pem`, `id\_rsa`, etc.) to be flagged regardless of content.
- **Severity Tiers**: (Future) Classification of detected secrets: `critical` (cloud provider keys, private keys), `high` (API keys, database URLs), `warning` (generic patterns, internal...

## Caching
- **Break-Even Point**: The number of requests after which prompt caching becomes cost-effective compared to standard pricing.
