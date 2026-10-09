"use client";

import { themePalette as P } from "@/lib/theme-palette";

import Link from "next/link";



/* ── Reusable visual frame (browser chrome mockup) ── */
function Frame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="learn-frame learn-frame-dark">
      <div className="demo-chrome" style={{ background: P.black, borderBottom: `1px solid ${P.g7}` }}>
        <div className="demo-dots">
          <span style={{ background: P.red }} />
          <span style={{ background: P.g5 }} />
          <span style={{ background: P.g5 }} />
        </div>
        <div className="demo-url" style={{ color: P.g5 }}>{title}</div>
      </div>
      <div className="learn-frame-body" style={{ background: P.black, color: P.white }}>{children}</div>
    </div>
  );
}

/* ── Code block with syntax highlight look ── */
function CodeBlock({
  lines,
  lang = "python",
}: {
  lines: { text: string; dim?: boolean }[];
  lang?: string;
}) {
  return (
    <div className="learn-code" style={{ background: P.g05, border: `1px solid ${P.g2}` }}>
      <div className="learn-code-header" style={{ background: P.g1, borderBottom: `1px solid ${P.g2}` }}>
        <span className="learn-code-lang" style={{ color: P.g5 }}>{lang}</span>
      </div>
      <pre className="learn-code-pre" style={{ background: P.g05, color: P.black }}>
        {lines.map((line, i) => (
          <div key={i} className="learn-code-line">
            <span className="learn-code-num" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
            <span style={{ color: line.dim ? "var(--text-muted)" : P.black }}>{line.text}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

/* ── Badge ── */
function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "red" }) {
  return (
    <span
      className="learn-badge"
      style={{
        background: variant === "red" ? "rgba(227,18,11,0.15)" : "rgba(255,255,255,0.1)",
        color: variant === "red" ? P.red : P.white,
      }}
    >
      {children}
    </span>
  );
}

/* ── Progress bar ── */
function ProgressBar({ label, pct, color = P.red }: { label: string; pct: number; color?: string }) {
  return (
    <div className="learn-progress">
      <div className="learn-progress-header">
        <span style={{ color: P.white }}>{label}</span>
        <span style={{ color: pct > 80 ? P.red : P.g3 }}>{pct}%</span>
      </div>
      <div className="learn-progress-track" style={{ background: P.g7 }}>
        <div className="learn-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Comparison table ── */
function CompareTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="learn-compare-table learn-compare-dark">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ background: P.black, color: i === 0 ? P.g5 : P.red, borderBottom: `1px solid ${P.g7}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{ color: j === 0 ? P.g3 : P.white, borderBottom: `1px solid ${P.g7}` }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sources({ links }: { links: [string, string][] }) {
  return (
    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
      Sources:{" "}
      {links.map(([label, href], i) => (
        <span key={href}>
          {i > 0 && " · "}
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            {label}
          </a>
        </span>
      ))}
    </p>
  );
}

/* ── Stat card ── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1, minWidth: "100px" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: P.red, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: "0.6875rem", color: P.g5, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

/* ────────────────────────────────────────────── */

const lessons = [
  {
    id: "prompt",
    number: 1,
    title: "What Is a Prompt?",
    subtitle: "Instructions made of tokens",
    description:
      "A prompt is an instruction: a series of tokens you send to an LLM. Every character, word, and punctuation mark is tokenized. Understanding this is the foundation: prompts are not magic strings, they are measured, budgeted, and optimized sequences of tokens.",
  },
  {
    id: "context-window",
    number: 2,
    title: "Context Window",
    subtitle: "The finite token budget",
    description:
      "Every LLM has a finite context window, the maximum number of tokens it can process in a single request. Think of it as a desk: your prompt (instructions), conversation history, retrieved context, and response space must all fit. When the desk is full, something must go.",
  },
  {
    id: "trimming",
    number: 3,
    title: "Trimming (Last-N)",
    subtitle: "Delete the oldest, keep the recent",
    description:
      "The simplest token optimization strategy. When the context window fills up, delete the oldest conversation turns and keep only the last N. Like tearing pages from the front of a notebook: fast and predictable, but you lose all early context.",
  },
  {
    id: "summarisation",
    number: 4,
    title: "Summarisation",
    subtitle: "Condense to save tokens",
    description:
      "Instead of deleting old turns, summarise the entire conversation into a compact snapshot. You preserve the big picture but lose verbatim detail. The trade-off: an extra API call (more tokens spent) vs. richer context retention. This is token economy in action.",
  },
  {
    id: "management",
    number: 5,
    title: "Context Management",
    subtitle: "Token optimization and economy",
    description:
      "Context management is the economy of tokens: deciding what goes into the window and what stays out. You allocate a token budget across system prompt, user message, retrieved context, and response space. Every token has a cost, and every token must earn its place.",
  },
  {
    id: "context-engineering",
    number: 6,
    title: "Context Engineering",
    subtitle: "IDE-driven, JIT context delivery",
    description:
      "Modern IDEs don\u2019t dump everything into the context window. They use just-in-time (JIT) context delivery, pulling in only the files, functions, and docs relevant to the current task. For long-horizon tasks spanning hundreds of tool calls, this intelligent context selection is essential.",
  },
  {
    id: "context-pollution",
    number: 7,
    title: "Context Pollution",
    subtitle: "When tokens work against you",
    description:
      "Not all tokens are equal. Irrelevant search results, stale tool outputs, and verbose error logs pollute the context, pushing out useful information and confusing the model. In a 200K token window processing 5 tickets, data from Ticket #1 clutters processing of Ticket #5.",
  },
  {
    id: "compaction",
    number: 8,
    title: "Automatic Context Compaction",
    subtitle: "Server-side summarization",
    description:
      "Server-side compaction summarizes earlier conversation history inside the API. Threshold mode (compact_20260112, beta compact-2026-01-12) runs when input tokens pass a trigger, 150K by default with a 50K minimum. On-demand mode (compaction: {type: \"summarize\"}, beta compact-2026-09-04) compacts when you ask. Anthropic\u2019s cookbook measured 208K \u2192 86K tokens (58.6%) on 5 support tickets with the older SDK helper compaction_control, which is now deprecated in the TypeScript and Ruby SDKs and removed in Python SDK v1.0.",
  },
  {
    id: "editing-memory",
    number: 9,
    title: "Context Editing & Memory Tool",
    subtitle: "Auto-cleaner + filing cabinet",
    description:
      "Context editing clears stale content by rule before the request reaches the model, with no secondary model involved: clear_tool_uses_20250919 removes old tool results and clear_thinking_20251015 removes old thinking blocks (beta context-management-2025-06-27). The memory tool provides persistent external storage (a filing cabinet) that survives across sessions. In Anthropic\u2019s evaluation, context editing alone improved agentic task performance by 29%, editing plus memory by 39%, and editing cut token use by 84% in a 100-turn web search run.",
  },
  {
    id: "real-world",
    number: 10,
    title: "Real-World: Customer Service",
    subtitle: "Compaction in production",
    description:
      "A walkthrough based on Anthropic\u2019s cookbook: 5 support tickets, 35+ tool calls, 208K tokens without compaction vs 86K with (measured with the deprecated compaction_control helper). The same ideas map to server-side compaction: a trigger for when to compact and instructions for what the summary must keep.",
  },
  {
    id: "api-levers",
    number: 11,
    title: "Current API Levers",
    subtitle: "Caching, effort, thinking, tool search",
    description:
      "Four settings decide most of what a Claude request costs today: prompt caching for repeated prefixes, effort for how hard the model works, adaptive thinking instead of fixed thinking budgets, and tool search so large tool catalogs stay out of context until needed.",
  },
];

export default function LearnPage() {
  return (
    <article className="article">
      <header className="hero" style={{ marginBottom: "2rem" }}>
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="3" y="5" width="22" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="3" y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="1" />
            <circle cx="6" cy="7.5" r="1" fill={P.red} />
            <circle cx="9.5" cy="7.5" r="1" fill={P.g3} />
            <circle cx="13" cy="7.5" r="1" fill={P.g3} />
            <line x1="7" y1="14" x2="14" y2="14" stroke={P.red} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="17" x2="21" y2="17" stroke={P.g3} strokeWidth="1" strokeLinecap="round" />
            <line x1="7" y1="20" x2="17" y2="20" stroke={P.g3} strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Token economics.</span>
          <br />
          <span className="hero-underline">From prompt to production.</span>
        </h1>
        <p className="hero-description">
          <span className="accent-highlight">{lessons.length} lessons.</span>{" "}
          A prompt is instructions made of tokens. Context management is the
          economy of those tokens. Learn to optimize every one.
        </p>
      </header>

      {/* ── Lesson 1: What Is a Prompt? ── */}
      <section className="learn-lesson" id={lessons[0].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[0].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[0].title}</h2>
            <p className="learn-lesson-sub">{lessons[0].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[0].description}</p>

        <Frame title="Prompt = Instruction = Tokens">
          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: "0.75rem", color: P.g5, marginBottom: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tokenization</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              {["You", "are", "a", "helpful", "assistant", ".", "Fix", "the", "auth", "bug", "."].map((tok, i) => (
                <div key={i} style={{
                  padding: "6px 10px",
                  background: i < 6 ? "rgba(227,18,11,0.15)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${i < 6 ? P.red : P.g7}`,
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  color: i < 6 ? P.red : P.white,
                  fontFamily: "var(--font-mono)",
                }}>
                  {tok}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", borderTop: `1px solid ${P.g7}`, paddingTop: "12px" }}>
              <span style={{ color: P.red }}>System prompt: 6 tokens</span>
              <span style={{ color: P.white }}>User message: 5 tokens</span>
              <span style={{ color: P.g5 }}>Total: 11 tokens</span>
            </div>
          </div>
        </Frame>

        <CodeBlock
          lines={[
            { text: "# Every prompt is a series of tokens", dim: true },
            { text: 'import tiktoken' },
            { text: '' },
            { text: 'enc = tiktoken.get_encoding("o200k_base")' },
            { text: '' },
            { text: 'system = "You are a helpful assistant."' },
            { text: 'user = "Fix the auth bug."' },
            { text: '' },
            { text: "system_tokens = len(enc.encode(system))" },
            { text: "user_tokens = len(enc.encode(user))" },
            { text: '' },
            { text: 'print(f"System: {system_tokens} tokens")' },
            { text: 'print(f"User: {user_tokens} tokens")' },
            { text: 'print(f"Total: {system_tokens + user_tokens} tokens")' },
          ]}
        />
      </section>

      {/* ── Lesson 2: Context Window ── */}
      <section className="learn-lesson" id={lessons[1].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[1].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[1].title}</h2>
            <p className="learn-lesson-sub">{lessons[1].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[1].description}</p>

        <Frame title="Context Window: 1M tokens">
          <div className="learn-window-visual" style={{ padding: "20px" }}>
            <div className="learn-window-segments">
              {[
                { label: "System Prompt", pct: 15, color: P.red },
                { label: "Conversation", pct: 25, color: P.white },
                { label: "Retrieved Context", pct: 35, color: P.g5 },
                { label: "Response Space", pct: 25, color: P.g7 },
              ].map((seg) => (
                <div
                  key={seg.label}
                  className="learn-segment"
                  style={{ flex: seg.pct, background: seg.color }}
                >
                  <span className="learn-segment-label" style={{ color: seg.color === P.white ? P.black : P.white }}>{seg.label}</span>
                  <span className="learn-segment-pct" style={{ color: seg.color === P.white ? P.black : "rgba(255,255,255,0.8)" }}>{seg.pct}%</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", fontSize: "0.75rem" }}>
              <span style={{ color: P.white }}>Total: <strong>1,000,000 tokens</strong></span>
              <span style={{ color: P.g5 }}>Model: <strong>Claude Sonnet 5.5</strong></span>
              <span style={{ color: P.red }}>Input cost: ~$1.50/req</span>
            </div>
          </div>
        </Frame>

        <CodeBlock
          lines={[
            { text: "# Context Window = Your Token Budget", dim: true },
            { text: "import anthropic" },
            { text: "" },
            { text: "client = anthropic.Anthropic()" },
            { text: "WINDOW = 1_000_000  # Claude Sonnet 5.5" },
            { text: "" },
            { text: "count = client.messages.count_tokens(" },
            { text: '    model="claude-sonnet-5-5",' },
            { text: '    system="You are a helpful assistant.",' },
            { text: '    messages=[{"role": "user", "content": "Fix the auth bug."}],' },
            { text: ")" },
            { text: "remaining = WINDOW - count.input_tokens" },
            { text: 'print(f"Budget remaining: {remaining:,} tokens")' },
          ]}
        />
      </section>

      {/* ── Lesson 3: Trimming ── */}
      <section className="learn-lesson" id={lessons[2].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[2].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[2].title}</h2>
            <p className="learn-lesson-sub">{lessons[2].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[2].description}</p>

        <Frame title="Trimming: Last-N Strategy">
          <div style={{ padding: "16px 20px" }}>
            <div className="learn-turns-row">
              {["Turn 1", "Turn 2", "Turn 3", "Turn 4", "Turn 5", "Turn 6", "Turn 7", "Turn 8"].map((t, i) => (
                <div
                  key={t}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    background: i < 5 ? "rgba(255,255,255,0.05)" : "rgba(227,18,11,0.15)",
                    border: `1px solid ${i < 5 ? P.g7 : P.red}`,
                    borderRadius: "4px",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: i < 5 ? P.g5 : P.red,
                    textDecoration: i < 5 ? "line-through" : "none",
                    fontWeight: i < 5 ? 400 : 600,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: P.g5 }}>Deleted (oldest 5)</span>
              <span style={{ color: P.red, fontWeight: 600 }}>Kept (last 3)</span>
            </div>
          </div>
        </Frame>

        <CodeBlock
          lines={[
            { text: "# Trimming: Last-N Strategy", dim: true },
            { text: "def trim_history(messages, n=3):" },
            { text: '    """Keep only the last N turns."""' },
            { text: "    system = [m for m in messages if m['role'] == 'system']" },
            { text: "    turns = [m for m in messages if m['role'] != 'system']" },
            { text: "    return system + turns[-n * 2:]" },
            { text: "" },
            { text: "# 20 messages \u2192 6 (last 3 turns)" },
            { text: "messages = trim_history(conversation, n=3)" },
            { text: 'print(f"Kept {len(messages)} messages")' },
          ]}
        />
      </section>

      {/* ── Lesson 4: Summarisation ── */}
      <section className="learn-lesson" id={lessons[3].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[3].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[3].title}</h2>
            <p className="learn-lesson-sub">{lessons[3].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[3].description}</p>

        <Frame title="Summarisation: Snapshot Strategy">
          <div style={{ padding: "16px 20px" }}>
            <div className="learn-side-by-side">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.75rem", color: P.g5, marginBottom: "8px", fontWeight: 600 }}>Full History</div>
                {["System prompt", "User: setup project", "AI: created files...", "User: add auth", "AI: implemented...", "User: fix bug #42", "AI: found issue..."].map((line, i) => (
                  <div key={i} style={{ padding: "4px 8px", fontSize: "0.75rem", color: P.white, background: "rgba(255,255,255,0.05)", marginBottom: "2px", borderRadius: "3px", borderLeft: i === 0 ? `2px solid ${P.red}` : `2px solid ${P.g7}` }}>
                    {line}
                  </div>
                ))}
                <div style={{ textAlign: "center", fontSize: "0.75rem", color: P.g5, marginTop: "4px" }}>~4,200 tokens</div>
              </div>
              <div>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={P.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="16" x2="26" y2="16" />
                  <polyline points="20,10 26,16 20,22" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.75rem", color: P.red, marginBottom: "8px", fontWeight: 600 }}>Summary</div>
                <div style={{ padding: "12px", fontSize: "0.75rem", color: P.white, background: "rgba(227,18,11,0.1)", border: `1px solid ${P.red}`, borderRadius: "6px", lineHeight: 1.5 }}>
                  Project initialized with auth module. Bug #42 identified in token validation. Current focus: fixing edge case in refresh flow.
                </div>
                <div style={{ textAlign: "center", fontSize: "0.75rem", color: P.red, marginTop: "4px", fontWeight: 600 }}>~180 tokens (96% reduction)</div>
              </div>
            </div>
          </div>
        </Frame>

        <CompareTable
          headers={["", "Trimming (Last-N)", "Summarisation"]}
          rows={[
            ["Speed", "Instant", "Slow (LLM call)"],
            ["Token cost", "Free", "Extra API call"],
            ["Early context", "Lost completely", "Preserved (condensed)"],
            ["Best for", "Simple chatbots", "Complex workflows"],
            ["Risk", "Amnesia", "Detail loss"],
          ]}
        />

        <CodeBlock
          lines={[
            { text: "# Summarisation: Token Economy", dim: true },
            { text: "import anthropic" },
            { text: "" },
            { text: "def summarise_history(messages, client):" },
            { text: '    """Condense conversation to save tokens."""' },
            { text: '    history_text = "\\n".join(' },
            { text: '        f"{m[\'role\']}: {m[\'content\']}" for m in messages' },
            { text: "    )" },
            { text: "    response = client.messages.create(" },
            { text: '        model="claude-sonnet-5-5",' },
            { text: "        max_tokens=500," },
            { text: "        messages=[{" },
            { text: '            "role": "user",' },
            { text: '            "content": f"Summarise this conversation:\\n{history_text}"' },
            { text: "        }]" },
            { text: "    )" },
            { text: "    return response.content[0].text" },
          ]}
        />
      </section>

      {/* ── Lesson 5: Context Management ── */}
      <section className="learn-lesson" id={lessons[4].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[4].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[4].title}</h2>
            <p className="learn-lesson-sub">{lessons[4].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[4].description}</p>

        <Frame title="Token Budget Allocation">
          <div style={{ padding: "16px 20px" }}>
            <ProgressBar label="System Prompt" pct={12} color={P.red} />
            <ProgressBar label="User Message" pct={8} color={P.white} />
            <ProgressBar label="Retrieved Files" pct={45} color={P.red} />
            <ProgressBar label="Conversation History" pct={20} color={P.white} />
            <ProgressBar label="Response Reserve" pct={15} color={P.g5} />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              <Badge variant="red">85% allocated</Badge>
              <Badge>15% free</Badge>
              <Badge variant="red">Warning: near limit</Badge>
            </div>
          </div>
        </Frame>

        <CodeBlock
          lines={[
            { text: "# Token Budget Manager", dim: true },
            { text: "class TokenBudget:" },
            { text: '    def __init__(self, limit=1_000_000):  # Claude Sonnet 5.5' },
            { text: "        self.limit = limit" },
            { text: "        self.allocations = {}" },
            { text: "" },
            { text: "    def allocate(self, name, tokens):" },
            { text: "        self.allocations[name] = tokens" },
            { text: "" },
            { text: "    @property" },
            { text: "    def remaining(self):" },
            { text: "        used = sum(self.allocations.values())" },
            { text: "        return self.limit - used" },
            { text: "" },
            { text: "    @property" },
            { text: "    def utilization(self):" },
            { text: "        return sum(self.allocations.values()) / self.limit" },
          ]}
        />
      </section>

      {/* ── Lesson 6: Context Engineering ── */}
      <section className="learn-lesson" id={lessons[5].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[5].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[5].title}</h2>
            <p className="learn-lesson-sub">{lessons[5].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[5].description}</p>

        <Frame title="JIT Context: Pull Only What You Need">
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {[
                { label: "Current file", active: true },
                { label: "Open tabs", active: true },
                { label: "Import graph", active: true },
                { label: "Git diff", active: false },
                { label: "Test files", active: false },
                { label: "Docs", active: false },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: "8px 14px",
                  background: item.active ? "rgba(227,18,11,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${item.active ? P.red : P.g7}`,
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  color: item.active ? P.red : P.g5,
                  fontWeight: item.active ? 600 : 400,
                }}>
                  {item.active ? "\u2713" : "\u2717"} {item.label}
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${P.g7}`, paddingTop: "12px", fontSize: "0.75rem" }}>
              <span style={{ color: P.red, fontWeight: 600 }}>3 sources active</span>
              <span style={{ color: P.g5 }}>: IDE pulls context just-in-time, not all-at-once</span>
            </div>
          </div>
        </Frame>

        <CompareTable
          headers={["", "Dump Everything", "JIT Context"]}
          rows={[
            ["Strategy", "Send all files", "Pull relevant files on demand"],
            ["Token usage", "High (wasteful)", "Low (efficient)"],
            ["Quality", "Diluted by noise", "Focused signal"],
            ["Best for", "Small projects", "Large codebases, long tasks"],
            ["Example", "Paste entire repo", "IDE auto-includes imports"],
          ]}
        />
      </section>

      {/* ── Lesson 7: Context Pollution ── */}
      <section className="learn-lesson" id={lessons[6].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[6].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[6].title}</h2>
            <p className="learn-lesson-sub">{lessons[6].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[6].description}</p>

        <Frame title="Context Pollution: Token Waste">
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[
                { label: "System prompt", tokens: 500, useful: true },
                { label: "User request", tokens: 200, useful: true },
                { label: "Stale tool output", tokens: 8200, useful: false },
                { label: "Old KB search", tokens: 3400, useful: false },
                { label: "Current task", tokens: 600, useful: true },
                { label: "Prev ticket draft", tokens: 2800, useful: false },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: "8px 12px",
                  background: item.useful ? "rgba(227,18,11,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${item.useful ? P.red : P.g7}`,
                  borderRadius: "6px",
                  fontSize: "0.6875rem",
                  flex: "1 1 auto",
                  minWidth: "120px",
                }}>
                  <div style={{ color: item.useful ? P.red : P.g5, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ color: item.useful ? P.white : P.g5, fontSize: "0.625rem", marginTop: "2px" }}>
                    {item.tokens.toLocaleString()} tokens {!item.useful && "(wasted)"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${P.g7}`, paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
              <span style={{ color: P.red }}>Useful: 1,300 tokens (8%)</span>
              <span style={{ color: P.g5 }}>Pollution: 14,400 tokens (92%)</span>
            </div>
          </div>
        </Frame>

        <CodeBlock
          lines={[
            { text: "# Context Pollution Detection", dim: true },
            { text: "def detect_pollution(messages):" },
            { text: '    """Flag stale or redundant content."""' },
            { text: "    stale = []" },
            { text: "    for i, msg in enumerate(messages):" },
            { text: "        if msg.get('tool_result'):" },
            { text: "            age = len(messages) - i" },
            { text: "            if age > 10:  # older than 10 turns" },
            { text: "                stale.append(i)" },
            { text: '    print(f"Found {len(stale)} stale entries")' },
            { text: "    return stale" },
          ]}
        />
      </section>

      {/* ── Lesson 8: Automatic Context Compaction ── */}
      <section className="learn-lesson" id={lessons[7].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[7].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[7].title}</h2>
            <p className="learn-lesson-sub">{lessons[7].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[7].description}</p>

        <Frame title="Cookbook Results: 5 Tickets">
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "2rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: P.g5, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Before</div>
                <div style={{ width: "80px", height: "130px", background: "rgba(227,18,11,0.15)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, color: P.white }}>208K</span>
                </div>
                <div style={{ fontSize: "0.625rem", color: P.g5, marginTop: "4px" }}>37 turns</div>
              </div>
              <div>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={P.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="16" x2="26" y2="16" />
                  <polyline points="20,10 26,16 20,22" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: P.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>After</div>
                <div style={{ width: "80px", height: "54px", background: P.red, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, color: P.white }}>86K</span>
                </div>
                <div style={{ fontSize: "0.625rem", color: P.red, fontWeight: 600, marginTop: "4px" }}>58.6% saved</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "16px", borderTop: `1px solid ${P.g7}`, paddingTop: "12px" }}>
              <StatCard value="2" label="compaction events" />
              <StatCard value="58.6%" label="token reduction" />
              <StatCard value="26" label="turns (vs 37)" />
            </div>
          </div>
        </Frame>

        <CodeBlock
          lang="python"
          lines={[
            { text: "# Server-side compaction (threshold mode)", dim: true },
            { text: "import anthropic" },
            { text: "" },
            { text: "client = anthropic.Anthropic()" },
            { text: "" },
            { text: "response = client.beta.messages.create(" },
            { text: '    model="claude-sonnet-5-5",' },
            { text: "    max_tokens=16000," },
            { text: '    betas=["compact-2026-01-12"],' },
            { text: "    context_management={\"edits\": [{" },
            { text: '        "type": "compact_20260112",' },
            { text: '        "trigger": {"type": "input_tokens", "value": 150_000},' },
            { text: "    }]}," },
            { text: "    messages=messages," },
            { text: ")" },
            { text: "" },
            { text: "# Keep the compaction block: append the full content", dim: true },
            { text: 'messages.append({"role": "assistant", "content": response.content})' },
          ]}
        />

        <CompareTable
          headers={["Mode", "When it runs", "Beta header"]}
          rows={[
            ["compact_20260112 (threshold)", "Input tokens pass the trigger (default 150K, minimum 50K)", "compact-2026-01-12"],
            ["compaction: {type: \"summarize\"} (on-demand)", "When your code asks for it", "compact-2026-09-04"],
          ]}
        />
        <Sources links={[["Compaction", "https://platform.claude.com/docs/en/build-with-claude/compaction"]]} />
      </section>

      {/* ── Lesson 9: Context Editing & Memory Tool ── */}
      <section className="learn-lesson" id={lessons[8].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[8].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[8].title}</h2>
            <p className="learn-lesson-sub">{lessons[8].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[8].description}</p>

        <Frame title="Context Editing vs Memory Tool">
          <div style={{ padding: "16px 20px" }}>
            <div className="learn-side-by-side">
              <div style={{ flex: 1, padding: "16px", background: "rgba(227,18,11,0.08)", borderRadius: "8px", border: `1px solid ${P.red}` }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: P.red, marginBottom: "8px" }}>Context Editing</div>
                <div style={{ fontSize: "0.75rem", color: P.g3, marginBottom: "12px" }}>The Auto-Cleaner</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "40px", height: "20px", background: "rgba(227,18,11,0.2)", borderRadius: "3px" }} />
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none" stroke={P.red} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="16" x2="24" y2="16" /><polyline points="18,10 24,16 18,22" /></svg>
                  <div style={{ width: "20px", height: "20px", background: P.red, borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "0.75rem", color: P.red, fontWeight: 600 }}>84% token reduction</div>
                <div style={{ fontSize: "0.7rem", color: P.g5, marginTop: "4px" }}>In-session only</div>
              </div>
              <div style={{ flex: 1, padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: `1px solid ${P.g7}` }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: P.white, marginBottom: "8px" }}>Memory Tool</div>
                <div style={{ fontSize: "0.75rem", color: P.g3, marginBottom: "12px" }}>The Filing Cabinet</div>
                <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                  {["Prefs", "Facts", "Plans"].map((label) => (
                    <div key={label} style={{ padding: "4px 8px", fontSize: "0.65rem", background: "rgba(227,18,11,0.12)", color: P.red, borderRadius: "3px", fontWeight: 600 }}>{label}</div>
                  ))}
                </div>
                <div style={{ fontSize: "0.75rem", color: P.white, fontWeight: 600 }}>Persists forever</div>
                <div style={{ fontSize: "0.7rem", color: P.g5, marginTop: "4px" }}>Cross-session memory</div>
              </div>
            </div>
          </div>
        </Frame>

        <CompareTable
          headers={["", "Context Editing", "Memory Tool"]}
          rows={[
            ["What it does", "Removes stale clutter", "Saves key facts permanently"],
            ["Where", "On the desk (context)", "In the cabinet (external)"],
            ["Token saving", "84% in a 100-turn web search run", "Offloads to storage"],
            ["Persistence", "In-session only", "Across all sessions"],
            ["Performance", "29% better alone", "39% better combined with editing"],
          ]}
        />

        <CodeBlock
          lines={[
            { text: "# Context editing: clear old tool results by rule", dim: true },
            { text: "response = client.beta.messages.create(" },
            { text: '    model="claude-sonnet-5-5",' },
            { text: "    max_tokens=16000," },
            { text: '    betas=["context-management-2025-06-27"],' },
            { text: "    context_management={\"edits\": [{" },
            { text: '        "type": "clear_tool_uses_20250919",' },
            { text: '        "trigger": {"type": "input_tokens", "value": 100_000},' },
            { text: '        "keep": {"type": "tool_uses", "value": 3},' },
            { text: '        "clear_at_least": {"type": "input_tokens", "value": 10_000},' },
            { text: '        "exclude_tools": ["memory"],' },
            { text: "    }]}," },
            { text: "    tools=tools," },
            { text: "    messages=messages," },
            { text: ")" },
          ]}
        />
        <Sources
          links={[
            ["Context editing", "https://platform.claude.com/docs/en/build-with-claude/context-editing"],
            ["Context management results", "https://claude.com/resources/articles/context-management"],
          ]}
        />
      </section>

      {/* ── Lesson 10: Real-World Customer Service ── */}
      <section className="learn-lesson" id={lessons[9].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[9].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[9].title}</h2>
            <p className="learn-lesson-sub">{lessons[9].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[9].description}</p>

        <Frame title="Customer Service Workflow: 5 Tickets">
          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: "0.75rem", color: P.g5, marginBottom: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Per-ticket workflow (7 steps each)</div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "16px" }}>
              {["Fetch", "Classify", "Research", "Prioritize", "Route", "Draft", "Complete"].map((step, i) => (
                <div key={i} style={{
                  flex: 1,
                  minWidth: "60px",
                  padding: "8px 4px",
                  textAlign: "center",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  background: i === 0 || i === 6 ? "rgba(227,18,11,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${i === 0 || i === 6 ? P.red : P.g7}`,
                  borderRadius: "4px",
                  color: i === 0 || i === 6 ? P.red : P.white,
                }}>
                  {step}
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${P.g7}`, paddingTop: "12px" }}>
              <div style={{ fontSize: "0.75rem", color: P.white, marginBottom: "6px", fontWeight: 600 }}>Linear token growth without compaction:</div>
              <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "60px" }}>
                {[1537, 3297, 5202, 9824, 18328, 25094, 36873, 46017, 55939, 72386, 91047, 111556, 134178, 158905, 185559, 204416].map((tokens, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${(tokens / 204416) * 100}%`,
                    background: tokens > 150000 ? P.red : "rgba(227,18,11,0.3)",
                    borderRadius: "2px 2px 0 0",
                    minWidth: "4px",
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: P.g5, marginTop: "4px" }}>
                <span>Turn 1</span>
                <span style={{ color: P.red }}>204K tokens</span>
              </div>
            </div>
          </div>
        </Frame>

        <CompareTable
          headers={["Metric", "No Compaction", "With Compaction"]}
          rows={[
            ["Total turns", "37", "26"],
            ["Input tokens", "204,416", "82,171"],
            ["Output tokens", "4,422", "4,275"],
            ["Total tokens", "208,838", "86,446"],
            ["Compactions", "N/A", "2"],
            ["Token savings", "N/A", "122,392 (58.6%)"],
          ]}
        />

        <CodeBlock
          lang="python"
          lines={[
            { text: "# Custom summary instructions for domain needs", dim: true },
            { text: "context_management={\"edits\": [{" },
            { text: '    "type": "compact_20260112",' },
            { text: '    "trigger": {"type": "input_tokens", "value": 50_000},' },
            { text: '    "instructions": (' },
            { text: '        "Preserve: ticket IDs, categories, "' },
            { text: '        "priorities, teams, outcomes. "' },
            { text: '        "Discard: full KB articles, draft text."' },
            { text: "    )," },
            { text: "}]}" },
          ]}
        />
      </section>

      {/* ── Lesson 11: Current API Levers ── */}
      <section className="learn-lesson" id={lessons[10].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[10].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[10].title}</h2>
            <p className="learn-lesson-sub">{lessons[10].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[10].description}</p>

        <CompareTable
          headers={["Prompt caching", "Rate or limit"]}
          rows={[
            ["5-minute cache write", "1.25x base input"],
            ["1-hour cache write", "2x base input"],
            ["Cache read", "0.1x base input (0.05x on Opus 5.5 and Sonnet 5.5, 0.025x on Fable 5.1)"],
            ["Breakpoints", "Up to 4 per request"],
            ["Minimum prefix", "512 tokens on most 5.x models; 1,024 on Opus 4.8, Sonnet 4.x, and Sonnet 5; 2,048 on Opus 4.7; 4,096 on Opus 4.5, Opus 4.6, and Haiku 4.5"],
            ["Invalidation", "Changing tool definitions invalidates the whole cache"],
          ]}
        />

        <CompareTable
          headers={["Lever", "What to know"]}
          rows={[
            ["Effort", "output_config.effort: low, medium, high, xhigh, max. Default high, except medium on Opus 5.5 and Haiku 5.5"],
            ["Adaptive thinking", "thinking: {type: \"adaptive\"} replaces budget_tokens, which returns a 400 error on Opus 4.7 and later and on 5.x models"],
            ["Tool search", "Tools marked defer_loading: true stay out of context until the model searches for and loads them"],
          ]}
        />

        <CodeBlock
          lang="python"
          lines={[
            { text: "# Effort, adaptive thinking, and caching in one request", dim: true },
            { text: "response = client.messages.create(" },
            { text: '    model="claude-opus-5-5",' },
            { text: "    max_tokens=16000," },
            { text: '    thinking={"type": "adaptive"},' },
            { text: '    output_config={"effort": "high"},' },
            { text: '    cache_control={"type": "ephemeral"},' },
            { text: "    system=STABLE_SYSTEM_PROMPT," },
            { text: "    messages=messages," },
            { text: ")" },
          ]}
        />
        <Sources
          links={[
            ["Prompt caching", "https://platform.claude.com/docs/en/build-with-claude/prompt-caching"],
            ["Effort", "https://platform.claude.com/docs/en/build-with-claude/effort"],
            ["Thinking", "https://platform.claude.com/docs/en/build-with-claude/thinking"],
            ["Tool search", "https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool"],
          ]}
        />
      </section>

      {/* ── Course navigation ── */}
      <div className="learn-nav" style={{ background: P.black, border: `1px solid ${P.g7}` }}>
        <h3 style={{ color: P.white }}>Course Outline</h3>
        <div className="learn-nav-items">
          {lessons.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="learn-nav-item" style={{ color: P.white }}>
              <span className="learn-nav-num">{l.number}</span>
              <div>
                <strong>{l.title}</strong>
                <span className="learn-nav-sub" style={{ color: P.g5 }}>{l.subtitle}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-main">
          <span className="footer-brand">&copy; 2026 @Tokalator</span>
          <span className="footer-divider">&middot;</span>
          <span>
            <Link href="/" style={{ textDecoration: "underline" }}>Back to home</Link>
          </span>
        </div>
      </footer>
    </article>
  );
}
