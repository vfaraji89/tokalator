import json

data = {
  "title": "Dictionary",
  "description": "Key terms and concepts in context engineering, token economics, and AI-assisted development.",
  "categories": [
    { "id": "all", "label": "All" },
    { "id": "context-management", "label": "Context Management" },
    { "id": "token-economics", "label": "Token Economics" },
    { "id": "prompt-engineering", "label": "Prompt Engineering" },
    { "id": "memory-strategies", "label": "Memory Strategies" },
    { "id": "caching", "label": "Caching" },
    { "id": "architecture", "label": "Architecture" },
    { "id": "evaluation", "label": "Evaluation" }
  ],
  "terms": [
    {
      "term": "Context Window",
      "definition": "The maximum number of tokens (input + output) a model can process in a single request. Think of it as the AI\u2019s short-term memory or desk \u2014 everything must fit on the desk at once. Ranges from 8K to 2M tokens depending on the model.",
      "category": "context-management",
      "tags": ["tokens", "context", "limits"]
    },
    {
      "term": "Context Engineering",
      "definition": "The discipline of designing and managing the information provided to an AI model to maximize output quality while minimizing token costs. Encompasses prompt design, file selection, caching strategy, and context window management.",
      "category": "context-management",
      "tags": ["context", "engineering", "optimization"]
    },
    {
      "term": "Progressive Disclosure",
      "definition": "Instead of loading an entire codebase \u2014 which would immediately overwhelm the attention budget \u2014 modern agents use JIT (just-in-time) context. The assistant dynamically loads only the necessary data at runtime, revealing information progressively as needed.",
      "category": "context-management",
      "tags": ["context", "jit", "optimization"]
    },
    {
      "term": "Lightweight Identifiers",
      "definition": "The assistant maintains references (file paths, stored queries) and dynamically loads only the necessary data at runtime using tools like grep, head, or tail. This avoids stuffing the full content into the context window upfront.",
      "category": "context-management",
      "tags": ["context", "references", "efficiency"]
    },
    {
      "term": "Compaction",
      "definition": "When a session nears its token limit, the assistant summarizes critical details \u2014 such as architectural decisions and unresolved bugs \u2014 while discarding redundant tool outputs. This reclaims context budget without losing essential information.",
      "category": "context-management",
      "tags": ["context", "compression", "long-horizon"]
    },
    {
      "term": "Tool Result Clearing",
      "definition": "A lighter form of compaction where the raw results of previous tool calls (like long terminal outputs or file reads) are cleared to save space, while keeping the conclusions and decisions derived from them.",
      "category": "context-management",
      "tags": ["context", "tools", "optimization"]
    },
    {
      "term": "Structured Note-taking",
      "definition": "The agent maintains an external NOTES.md or to-do list to track dependencies and progress across thousands of steps. After a context reset, it can read these notes back to restore essential state without replaying the full history.",
      "category": "context-management",
      "tags": ["context", "persistence", "notes"]
    },
    {
      "term": "Distractors",
      "definition": "Files or code snippets that are topically related to the query but do not contain the answer. These can cause the model to lose focus or hallucinate, degrading output quality. Effective context engineering actively filters distractors.",
      "category": "context-management",
      "tags": ["context", "pollution", "relevance"]
    },
    {
      "term": "Context Rot",
      "definition": "As more tokens are added to a conversation, the model\u2019s ability to accurately retrieve specific pieces of information from the context decreases. Long conversations suffer from degraded attention, making early details harder to recall.",
      "category": "context-management",
      "tags": ["context", "degradation", "tokens"]
    },
    {
      "term": "Context Pollution",
      "definition": "The accumulation of irrelevant, redundant, or misleading information in the context window that degrades model performance. Includes distractors, context rot, and poor structural patterns. Fighting context pollution is a core challenge of context engineering.",
      "category": "context-management",
      "tags": ["context", "pollution", "quality"]
    },
    {
      "term": "Trimming (Last-N)",
      "definition": "A simple context management strategy that keeps only the last N conversation turns and discards older ones. Fast and predictable but loses early context completely. Best for simple chatbots where recent context matters most.",
      "category": "memory-strategies",
      "tags": ["trimming", "context", "turns"]
    },
    {
      "term": "Summarisation",
      "definition": "A context management strategy that condenses the full conversation history into a compact executive summary before each new turn. Preserves the big picture but loses verbatim detail and adds latency from the summarisation LLM call.",
      "category": "memory-strategies",
      "tags": ["summary", "context", "compression"]
    },
    {
      "term": "Context Editing",
      "definition": "An advanced context management technique where a secondary model reviews and removes stale or redundant information from the conversation before the next turn. Like an auto-cleaner that tidies the desk. Can achieve up to 84% token reduction while maintaining coherence.",
      "category": "memory-strategies",
      "tags": ["editing", "context", "optimization"]
    },
    {
      "term": "Memory Tool",
      "definition": "An external persistent storage mechanism (like a filing cabinet) that the model can read from and write to across sessions. Unlike the context window (short-term desk), the memory tool persists information permanently. Used for user preferences, project knowledge, and cross-session continuity.",
      "category": "memory-strategies",
      "tags": ["memory", "persistence", "external"]
    },
    {
      "term": "Automatic Context Compaction",
      "definition": "An API-level feature (e.g. Anthropic\u2019s compaction_control parameter) that automatically summarizes conversation history when token usage exceeds a configurable threshold. Can achieve 50-60% token reduction transparently, without application-level code changes.",
      "category": "memory-strategies",
      "tags": ["compaction", "automatic", "api"]
    },
    {
      "term": "Turn Limit",
      "definition": "A configuration parameter that triggers automatic context compaction after a specified number of conversation turns, regardless of token count. Provides predictable compaction intervals for applications with consistent turn sizes.",
      "category": "memory-strategies",
      "tags": ["compaction", "turns", "threshold"]
    },
    {
      "term": "Context Token Threshold",
      "definition": "A configurable token count (typically between 5,000 and 150,000) at which automatic context compaction is triggered. When conversation tokens exceed this threshold, the system summarizes older turns to reclaim budget.",
      "category": "memory-strategies",
      "tags": ["compaction", "threshold", "configuration"]
    },
    {
      "term": "Token",
      "definition": "The fundamental unit of text processing for LLMs. A token is roughly 3-4 characters or 0.75 words in English. All API pricing is based on token counts. Understanding tokenization is essential for cost estimation.",
      "category": "token-economics",
      "tags": ["tokens", "fundamentals", "pricing"]
    },
    {
      "term": "Input Tokens",
      "definition": "Tokens sent to the model in a request, including system prompts, conversation history, and user messages. Input tokens are typically cheaper than output tokens and form the bulk of context window usage.",
      "category": "token-economics",
      "tags": ["tokens", "input", "pricing"]
    },
    {
      "term": "Output Tokens",
      "definition": "Tokens generated by the model in response. Output tokens are typically 3-5x more expensive than input tokens. Controlling output length through instructions and max_tokens is a key cost optimization lever.",
      "category": "token-economics",
      "tags": ["tokens", "output", "pricing"]
    },
    {
      "term": "High-Signal Tokens",
      "definition": "The objective of context engineering: provide the smallest possible set of tokens that maximize the likelihood of correct code generation. Every token should contribute meaningfully to the model\u2019s understanding.",
      "category": "token-economics",
      "tags": ["tokens", "optimization", "quality"]
    },
    {
      "term": "Cost per Million Tokens (MTok)",
      "definition": "Standard pricing unit for LLM APIs. For example, Claude Sonnet 4.5 costs $3/MTok input and $15/MTok output. This metric allows comparison across providers and models.",
      "category": "token-economics",
      "tags": ["pricing", "cost", "comparison"]
    },
    {
      "term": "Prompt",
      "definition": "The complete set of instructions and context sent to an AI model in a single request. Includes system instructions, user message, conversation history, and any retrieved context. The quality of the prompt directly determines the quality of the output.",
      "category": "prompt-engineering",
      "tags": ["prompts", "fundamentals", "instructions"]
    },
    {
      "term": "Prompt Caching",
      "definition": "A technique where frequently-used prompt prefixes are stored server-side, allowing subsequent requests with the same prefix to be processed at reduced cost (typically 90% cheaper). Requires a minimum token threshold to activate.",
      "category": "caching",
      "tags": ["caching", "optimization", "cost"]
    },
    {
      "term": "Cache Write",
      "definition": "The cost of storing a prompt prefix in the cache for the first time. Typically 25% more expensive than standard input pricing, but pays for itself when the same prefix is reused multiple times.",
      "category": "caching",
      "tags": ["caching", "cost", "write"]
    },
    {
      "term": "Cache Read",
      "definition": "The cost of using a previously cached prompt prefix. Significantly cheaper than standard input (typically 90% discount). The break-even point depends on how many times the cached prefix is reused.",
      "category": "caching",
      "tags": ["caching", "cost", "read"]
    },
    {
      "term": "Break-Even Point",
      "definition": "The number of requests after which prompt caching becomes cost-effective compared to standard pricing. Calculated from cache write cost vs. cumulative savings from cache reads.",
      "category": "caching",
      "tags": ["caching", "roi", "analysis"]
    },
    {
      "term": "System Prompt",
      "definition": "Instructions provided at the beginning of a conversation to set the model\u2019s behavior, personality, and constraints. System prompts are ideal candidates for caching since they remain constant across requests.",
      "category": "prompt-engineering",
      "tags": ["prompts", "system", "instructions"]
    },
    {
      "term": "XML Tagging",
      "definition": "Using tags like <background_information>, <tool_guidance>, <constraints> to clearly separate different types of instructions in prompts. This structural technique helps models parse complex multi-section prompts more reliably.",
      "category": "prompt-engineering",
      "tags": ["prompts", "xml", "structure"]
    },
    {
      "term": "Chain of Thought (CoT)",
      "definition": "A prompting technique where the model is instructed to show its reasoning step by step before giving a final answer. Improves accuracy on complex tasks but increases output token usage.",
      "category": "prompt-engineering",
      "tags": ["prompts", "reasoning", "technique"]
    },
    {
      "term": "Extended Thinking",
      "definition": "A model capability where additional compute is used for internal reasoning before generating a response. The thinking tokens consume budget but can dramatically improve quality on hard problems.",
      "category": "prompt-engineering",
      "tags": ["reasoning", "thinking", "quality"]
    },
    {
      "term": "RAG (Retrieval-Augmented Generation)",
      "definition": "A pattern where relevant documents are retrieved from a knowledge base and injected into the context before generation. Enables models to reference up-to-date or domain-specific information without fine-tuning.",
      "category": "architecture",
      "tags": ["rag", "retrieval", "architecture"]
    },
    {
      "term": "Structural Patterns",
      "definition": "Research finding that models often perform differently on shuffled vs. logically structured context. The placement and organization of information within the context window affects retrieval accuracy and generation quality.",
      "category": "context-management",
      "tags": ["context", "structure", "research"]
    },
    {
      "term": "Cobb-Douglas Model",
      "definition": "An economic production function adapted for AI cost analysis. Models the relationship between token inputs (quantity and quality) and output quality, helping find the optimal trade-off between cost and performance.",
      "category": "evaluation",
      "tags": ["economics", "modeling", "optimization"]
    },
    {
      "term": "Tab Relevance Scoring",
      "definition": "A technique used in IDE extensions to rank open editor tabs by their relevance to the current task. Factors include import relationships, path similarity, edit recency, and diagnostic overlap.",
      "category": "architecture",
      "tags": ["extension", "relevance", "scoring"]
    },
    {
      "term": "Attention Budget",
      "definition": "The effective amount of context a model can meaningfully attend to. While context windows may be large (128K+), attention quality degrades with length. The practical attention budget is often smaller than the raw token limit.",
      "category": "context-management",
      "tags": ["context", "attention", "limits"]
    },
    {
      "term": "Token Budget Dashboard",
      "definition": "A real-time visualization showing current token usage across the context window, broken down by category (system prompt, conversation history, file contents, tool outputs). Helps developers stay within limits.",
      "category": "architecture",
      "tags": ["extension", "dashboard", "monitoring"]
    },
    {
      "term": "Batch Processing",
      "definition": "An API tier that processes requests asynchronously at reduced cost, ideal for non-time-sensitive workloads like bulk analysis or testing. Typically offers the lowest per-token pricing.",
      "category": "token-economics",
      "tags": ["pricing", "batch", "optimization"]
    },
    {
      "term": "Function Calling / Tool Use",
      "definition": "The ability of a model to invoke external functions or tools during generation. The model outputs structured parameters that the client executes, returning results back into the context. Enables agentic workflows.",
      "category": "architecture",
      "tags": ["tools", "functions", "agents"]
    },
    {
      "term": "JIT Context (Just-in-Time)",
      "definition": "A strategy where context is loaded dynamically at runtime rather than pre-loaded. The IDE or agent fetches only the files, symbols, or data needed for the current step \u2014 similar to how modern IDEs lazy-load imports. Reduces waste and keeps the context window focused.",
      "category": "context-management",
      "tags": ["context", "jit", "dynamic"]
    },
    {
      "term": "Summary Prompt",
      "definition": "A custom instruction given to the compaction system that controls how conversation history is summarized. Allows domain-specific summarisation \u2014 for example, a customer service bot can be told to always preserve order IDs, account numbers, and resolution status in the summary.",
      "category": "memory-strategies",
      "tags": ["compaction", "summary", "customization"]
    }
  ]
}

with open("/Users/vfaraji89/Documents/contribuet-github/tokalator/content/dictionary.json", "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"Written {len(data['terms'])} terms")
