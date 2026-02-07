content = r'''"use client";

import Link from "next/link";

const P = {
  red: "#e3120b",
  black: "#111",
  g7: "#333",
  g6: "#555",
  g5: "#888",
  g3: "#ccc",
  g2: "#ddd",
  g1: "#f0f0f0",
  g05: "#f8f8f8",
  white: "#fff",
};

/* ── Reusable visual frame (browser chrome mockup) ── */
function Frame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="learn-frame">
      <div className="demo-chrome">
        <div className="demo-dots">
          <span style={{ background: "#ff5f57" }} />
          <span style={{ background: "#febc2e" }} />
          <span style={{ background: "#28c840" }} />
        </div>
        <div className="demo-url">{title}</div>
      </div>
      <div className="learn-frame-body">{children}</div>
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
    <div className="learn-code">
      <div className="learn-code-header">
        <span className="learn-code-lang">{lang}</span>
      </div>
      <pre className="learn-code-pre">
        {lines.map((line, i) => (
          <div key={i} className="learn-code-line">
            <span className="learn-code-num">{i + 1}</span>
            <span style={{ color: line.dim ? P.g5 : P.g7 }}>{line.text}</span>
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
        background: variant === "red" ? "rgba(227,18,11,0.08)" : P.g1,
        color: variant === "red" ? P.red : P.g6,
      }}
    >
      {children}
    </span>
  );
}

/* ── Progress bar ── */
function ProgressBar({ label, pct, color = P.black }: { label: string; pct: number; color?: string }) {
  return (
    <div className="learn-progress">
      <div className="learn-progress-header">
        <span>{label}</span>
        <span style={{ color: pct > 80 ? P.red : P.g5 }}>{pct}%</span>
      </div>
      <div className="learn-progress-track">
        <div className="learn-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Comparison table ── */
function CompareTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="learn-compare-table">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ color: i === 0 ? P.g5 : P.black }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{ color: j === 0 ? P.g6 : P.g7 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────── */

const lessons = [
  {
    id: "context-window",
    number: 1,
    title: "Context Window",
    subtitle: "The AI's short-term memory",
    description:
      "Every LLM has a finite context window \u2014 the maximum number of tokens it can process in a single request. Think of it as a desk: everything you need (system prompt, conversation history, code, instructions) must fit on the desk at once. If it doesn't fit, something has to go.",
  },
  {
    id: "trimming",
    number: 2,
    title: "Trimming (Last-N)",
    subtitle: "Delete the oldest, keep the recent",
    description:
      "The simplest context management strategy. When the context window fills up, delete the oldest conversation turns and keep only the last N. Like tearing pages from the front of a notebook \u2014 fast and predictable, but you lose all early context.",
  },
  {
    id: "summarisation",
    number: 3,
    title: "Summarisation",
    subtitle: "Condense to an executive summary",
    description:
      "Instead of deleting old turns, summarise the entire conversation into a compact snapshot before each new turn. You preserve the big picture but lose verbatim detail. The trade-off: latency from the extra LLM call vs. richer context retention.",
  },
  {
    id: "management",
    number: 4,
    title: "Context Management",
    subtitle: "Budget what you send",
    description:
      "Context management is the practice of deciding what goes into the window and what stays out. You allocate a token budget across system prompt, user message, retrieved context, and response space \u2014 just like allocating memory.",
  },
  {
    id: "compaction",
    number: 5,
    title: "Compaction",
    subtitle: "Fit more in less",
    description:
      "When context overflows, compaction strategies kick in: summarize old turns, drop low-relevance files, compress boilerplate. The goal is to preserve signal while reducing token count.",
  },
  {
    id: "editing-memory",
    number: 6,
    title: "Context Editing & Memory Tool",
    subtitle: "Auto-cleaner + Filing cabinet",
    description:
      "Context Editing uses a secondary model to review and remove stale information (like an auto-cleaner tidying the desk). Memory Tool provides persistent external storage (a filing cabinet) that survives across sessions. Together they solve both in-session bloat and cross-session continuity.",
  },
  {
    id: "auto-compaction",
    number: 7,
    title: "Automatic Context Compaction",
    subtitle: "API-level compaction from Anthropic",
    description:
      "Anthropic\u2019s compaction_control parameter automatically summarizes conversation history when token usage exceeds a configurable threshold. In real-world tests, it achieved 58.6% token reduction (208K \u2192 86K tokens) transparently \u2014 no application code changes needed.",
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
          <span className="hero-marker">Learn token economics.</span>
          <br />
          <span className="hero-underline">Visual, hands-on, practical.</span>
        </h1>
        <p className="hero-description">
          <span className="accent-highlight">7 core concepts</span>{" "}
          &mdash; from context windows to automatic compaction. Each lesson includes
          interactive visuals and Python code you can run.
        </p>
      </header>

      {/* ── Lesson 1: Context Window ── */}
      <section className="learn-lesson" id={lessons[0].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[0].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[0].title}</h2>
            <p className="learn-lesson-sub">{lessons[0].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[0].description}</p>

        <Frame title="Context Window \u2014 128K tokens">
          <div className="learn-window-visual">
            <div className="learn-window-segments">
              {[
                { label: "System Prompt", pct: 15, color: P.red },
                { label: "Conversation", pct: 25, color: P.black },
                { label: "Retrieved Context", pct: 35, color: P.g6 },
                { label: "Response Space", pct: 25, color: P.g3 },
              ].map((seg) => (
                <div
                  key={seg.label}
                  className="learn-segment"
                  style={{ flex: seg.pct, background: seg.color }}
                >
                  <span className="learn-segment-label">{seg.label}</span>
                  <span className="learn-segment-pct">{seg.pct}%</span>
                </div>
              ))}
            </div>
            <div className="learn-window-meta">
              <span>Total: <strong>128,000 tokens</strong></span>
              <span>Model: <strong>GPT-4o</strong></span>
              <span style={{ color: P.red }}>Cost: ~$0.30/req</span>
            </div>
          </div>
        </Frame>

        <CodeBlock
          lines={[
            { text: "# Context Window Basics", dim: true },
            { text: 'import tiktoken' },
            { text: '' },
            { text: 'enc = tiktoken.encoding_for_model("gpt-4o")' },
            { text: '' },
            { text: 'system = "You are a helpful assistant."' },
            { text: "system_tokens = len(enc.encode(system))" },
            { text: 'print(f"System: {system_tokens} tokens")' },
            { text: '' },
            { text: "# Your code here \u2014 count your own prompts" },
            { text: "# user_msg = ..." },
            { text: "# user_tokens = len(enc.encode(user_msg))" },
          ]}
        />
      </section>

      {/* ── Lesson 2: Trimming ── */}
      <section className="learn-lesson" id={lessons[1].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[1].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[1].title}</h2>
            <p className="learn-lesson-sub">{lessons[1].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[1].description}</p>

        <Frame title="Trimming \u2014 Last-N Strategy">
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {["Turn 1", "Turn 2", "Turn 3", "Turn 4", "Turn 5", "Turn 6", "Turn 7", "Turn 8"].map((t, i) => (
                <div
                  key={t}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    background: i < 5 ? P.g1 : "rgba(227,18,11,0.08)",
                    border: `1px solid ${i < 5 ? P.g2 : P.red}`,
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
            { text: "# Trimming \u2014 Last-N Strategy", dim: true },
            { text: "def trim_history(messages, n=3):" },
            { text: '    """Keep only the last N turns."""' },
            { text: "    system = [m for m in messages if m['role'] == 'system']" },
            { text: "    turns = [m for m in messages if m['role'] != 'system']" },
            { text: "    return system + turns[-n * 2:]  # n turns = n user + n assistant" },
            { text: "" },
            { text: "# Example: 20 messages \u2192 6 (last 3 turns)" },
            { text: "messages = trim_history(conversation, n=3)" },
            { text: 'print(f"Kept {len(messages)} messages")' },
          ]}
        />
      </section>

      {/* ── Lesson 3: Summarisation ── */}
      <section className="learn-lesson" id={lessons[2].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[2].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[2].title}</h2>
            <p className="learn-lesson-sub">{lessons[2].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[2].description}</p>

        <Frame title="Summarisation \u2014 Snapshot Strategy">
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.75rem", color: P.g5, marginBottom: "8px", fontWeight: 600 }}>Full History</div>
                {["System prompt", "User: setup project", "AI: created files...", "User: add auth", "AI: implemented...", "User: fix bug #42", "AI: found issue..."].map((line, i) => (
                  <div key={i} style={{ padding: "4px 8px", fontSize: "0.75rem", color: P.g6, background: P.g05, marginBottom: "2px", borderRadius: "3px", borderLeft: i === 0 ? `2px solid ${P.red}` : `2px solid ${P.g2}` }}>
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
                <div style={{ padding: "12px", fontSize: "0.75rem", color: P.g7, background: "rgba(227,18,11,0.04)", border: `1px solid rgba(227,18,11,0.15)`, borderRadius: "6px", lineHeight: 1.5 }}>
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
            ["Cost", "Free", "Extra API call"],
            ["Early context", "Lost completely", "Preserved (condensed)"],
            ["Best for", "Simple chatbots", "Complex workflows"],
            ["Risk", "Amnesia", "Detail loss"],
          ]}
        />

        <CodeBlock
          lines={[
            { text: "# Summarisation \u2014 Snapshot Strategy", dim: true },
            { text: "import anthropic" },
            { text: "" },
            { text: "def summarise_history(messages, client):" },
            { text: '    """Condense conversation to a summary."""' },
            { text: '    history_text = "\\n".join(' },
            { text: '        f"{m[\'role\']}: {m[\'content\']}" for m in messages' },
            { text: "    )" },
            { text: "    response = client.messages.create(" },
            { text: '        model="claude-sonnet-4-20250514",' },
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

      {/* ── Lesson 4: Context Management ── */}
      <section className="learn-lesson" id={lessons[3].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[3].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[3].title}</h2>
            <p className="learn-lesson-sub">{lessons[3].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[3].description}</p>

        <Frame title="Token Budget Allocation">
          <div style={{ padding: "16px 20px" }}>
            <ProgressBar label="System Prompt" pct={12} color={P.red} />
            <ProgressBar label="User Message" pct={8} />
            <ProgressBar label="Retrieved Files" pct={45} color={P.g6} />
            <ProgressBar label="Conversation History" pct={20} />
            <ProgressBar label="Response Reserve" pct={15} color={P.g3} />
            <div className="learn-budget-summary">
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
            { text: '    def __init__(self, limit=128_000):' },
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
            { text: "# Your code here \u2014 build your budget" },
            { text: "# budget = TokenBudget()" },
            { text: '# budget.allocate("system", 500)' },
          ]}
        />
      </section>

      {/* ── Lesson 5: Compaction ── */}
      <section className="learn-lesson" id={lessons[4].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[4].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[4].title}</h2>
            <p className="learn-lesson-sub">{lessons[4].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[4].description}</p>

        <Frame title="Compaction Strategy \u2014 Before vs After">
          <div className="learn-compact-visual">
            <div className="learn-compact-col">
              <div className="learn-compact-label">Before</div>
              <div className="learn-compact-bar" style={{ height: 120, background: P.red, opacity: 0.15 }}>
                <span className="learn-compact-val">42,800 tokens</span>
              </div>
              <div className="learn-compact-detail">
                12 files, 8 turns, full history
              </div>
            </div>
            <div className="learn-compact-arrow">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={P.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="16" x2="26" y2="16" />
                <polyline points="20,10 26,16 20,22" />
              </svg>
            </div>
            <div className="learn-compact-col">
              <div className="learn-compact-label" style={{ color: P.red }}>After</div>
              <div className="learn-compact-bar" style={{ height: 56, background: P.red }}>
                <span className="learn-compact-val" style={{ color: P.white }}>18,200 tokens</span>
              </div>
              <div className="learn-compact-detail" style={{ color: P.red, fontWeight: 600 }}>
                57% reduction
              </div>
            </div>
          </div>
          <div className="learn-compact-strategies">
            {[
              "Summarize old conversation turns",
              "Drop low-relevance files",
              "Compress boilerplate code",
              "Cache repeated system prompts",
            ].map((s, i) => (
              <div key={i} className="learn-compact-strategy">
                <span className="learn-compact-check">&#10003;</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </Frame>

        <CodeBlock
          lines={[
            { text: "# Compaction Example", dim: true },
            { text: "def compact_history(turns, max_tokens=4000):" },
            { text: '    """Summarize old turns to fit budget."""' },
            { text: "    total = sum(t['tokens'] for t in turns)" },
            { text: "    if total <= max_tokens:" },
            { text: "        return turns" },
            { text: "" },
            { text: "    # Keep last 3 turns, summarize the rest" },
            { text: "    keep = turns[-3:]" },
            { text: "    old = turns[:-3]" },
            { text: "    summary = summarize(old)  # your LLM call" },
            { text: "    return [{'role': 'system', 'content': summary}] + keep" },
            { text: "" },
            { text: "# Your code here \u2014 implement summarize()" },
          ]}
        />
      </section>

      {/* ── Lesson 6: Context Editing & Memory Tool ── */}
      <section className="learn-lesson" id={lessons[5].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[5].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[5].title}</h2>
            <p className="learn-lesson-sub">{lessons[5].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[5].description}</p>

        <Frame title="Context Editing vs Memory Tool">
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1, padding: "16px", background: P.g05, borderRadius: "8px", border: `1px solid ${P.g2}` }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: P.black, marginBottom: "8px" }}>Context Editing</div>
                <div style={{ fontSize: "0.75rem", color: P.g6, marginBottom: "12px" }}>The Auto-Cleaner</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "40px", height: "20px", background: P.red, opacity: 0.15, borderRadius: "3px" }} />
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none" stroke={P.red} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="16" x2="24" y2="16" /><polyline points="18,10 24,16 18,22" /></svg>
                  <div style={{ width: "20px", height: "20px", background: P.red, borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "0.75rem", color: P.red, fontWeight: 600 }}>84% token reduction</div>
                <div style={{ fontSize: "0.7rem", color: P.g5, marginTop: "4px" }}>In-session only</div>
              </div>
              <div style={{ flex: 1, padding: "16px", background: "rgba(227,18,11,0.03)", borderRadius: "8px", border: `1px solid rgba(227,18,11,0.15)` }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: P.black, marginBottom: "8px" }}>Memory Tool</div>
                <div style={{ fontSize: "0.75rem", color: P.g6, marginBottom: "12px" }}>The Filing Cabinet</div>
                <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                  {["Prefs", "Facts", "Plans"].map((label) => (
                    <div key={label} style={{ padding: "4px 8px", fontSize: "0.65rem", background: "rgba(227,18,11,0.08)", color: P.red, borderRadius: "3px", fontWeight: 600 }}>{label}</div>
                  ))}
                </div>
                <div style={{ fontSize: "0.75rem", color: P.red, fontWeight: 600 }}>Persists forever</div>
                <div style={{ fontSize: "0.7rem", color: P.g5, marginTop: "4px" }}>Cross-session memory</div>
              </div>
            </div>
          </div>
        </Frame>

        <CompareTable
          headers={["", "Context Editing", "Memory Tool"]}
          rows={[
            ["Metaphor", "Auto-cleaner (tidy desk)", "Filing cabinet"],
            ["Persistence", "In-session only", "Across all sessions"],
            ["Token saving", "Up to 84%", "Offloads to external storage"],
            ["Use case", "Long conversations", "User preferences, project knowledge"],
            ["Risk", "May remove useful context", "Stale stored facts"],
          ]}
        />

        <CodeBlock
          lines={[
            { text: "# Context Editing Example", dim: true },
            { text: "def edit_context(messages, client):" },
            { text: '    """Remove stale info from context."""' },
            { text: '    prompt = "Review this conversation. Remove any"' },
            { text: '    prompt += " outdated or redundant information."' },
            { text: '    prompt += " Keep decisions and current state."' },
            { text: "" },
            { text: "    response = client.messages.create(" },
            { text: '        model="claude-sonnet-4-20250514",' },
            { text: "        max_tokens=4000," },
            { text: "        messages=[{" },
            { text: '            "role": "user",' },
            { text: '            "content": f"{prompt}\\n\\n{format_msgs(messages)}"' },
            { text: "        }]" },
            { text: "    )" },
            { text: "    return parse_edited_messages(response.content[0].text)" },
          ]}
        />
      </section>

      {/* ── Lesson 7: Automatic Context Compaction ── */}
      <section className="learn-lesson" id={lessons[6].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[6].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[6].title}</h2>
            <p className="learn-lesson-sub">{lessons[6].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[6].description}</p>

        <Frame title="Anthropic Automatic Compaction \u2014 Real Results">
          <div className="learn-compact-visual">
            <div className="learn-compact-col">
              <div className="learn-compact-label">Before</div>
              <div className="learn-compact-bar" style={{ height: 130, background: P.red, opacity: 0.15 }}>
                <span className="learn-compact-val">208,000 tokens</span>
              </div>
              <div className="learn-compact-detail">
                50-turn customer service session
              </div>
            </div>
            <div className="learn-compact-arrow">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={P.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="16" x2="26" y2="16" />
                <polyline points="20,10 26,16 20,22" />
              </svg>
            </div>
            <div className="learn-compact-col">
              <div className="learn-compact-label" style={{ color: P.red }}>After</div>
              <div className="learn-compact-bar" style={{ height: 54, background: P.red }}>
                <span className="learn-compact-val" style={{ color: P.white }}>86,000 tokens</span>
              </div>
              <div className="learn-compact-detail" style={{ color: P.red, fontWeight: 600 }}>
                58.6% reduction
              </div>
            </div>
          </div>
          <div className="learn-compact-strategies">
            {[
              "compaction_control parameter in API",
              "Configurable token threshold (5K-150K)",
              "Custom summary prompts per use-case",
              "Turn-based or token-based triggers",
            ].map((s, i) => (
              <div key={i} className="learn-compact-strategy">
                <span className="learn-compact-check">&#10003;</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </Frame>

        <CodeBlock
          lang="python"
          lines={[
            { text: "# Anthropic Automatic Context Compaction", dim: true },
            { text: "# From: platform.claude.com/cookbook", dim: true },
            { text: "import anthropic" },
            { text: "" },
            { text: "client = anthropic.Anthropic()" },
            { text: "" },
            { text: "response = client.messages.create(" },
            { text: '    model="claude-sonnet-4-20250514",' },
            { text: "    max_tokens=1024," },
            { text: "    # Enable automatic compaction" },
            { text: "    compaction_control={" },
            { text: '        "type": "auto",' },
            { text: "        # Trigger when context exceeds 10K tokens" },
            { text: '        "context_token_threshold": 10000,' },
            { text: "    }," },
            { text: "    system=[{" },
            { text: '        "type": "text",' },
            { text: '        "text": "You are a customer service agent.",' },
            { text: "    }]," },
            { text: "    messages=conversation_history," },
            { text: ")" },
            { text: "" },
            { text: "# Custom summary prompt for domain-specific needs" },
            { text: "compaction_control={" },
            { text: '    "type": "auto",' },
            { text: '    "context_token_threshold": 20000,' },
            { text: '    "summary_prompt": (' },
            { text: '        "Always preserve: order IDs, account numbers, "' },
            { text: '        "resolution status, and customer sentiment."' },
            { text: "    )," },
            { text: "}" },
          ]}
        />
      </section>

      {/* ── Course navigation ── */}
      <div className="learn-nav">
        <h3>Course Outline</h3>
        <div className="learn-nav-items">
          {lessons.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="learn-nav-item">
              <span className="learn-nav-num">{l.number}</span>
              <div>
                <strong>{l.title}</strong>
                <span className="learn-nav-sub">{l.subtitle}</span>
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
'''

with open("/Users/vfaraji89/Documents/contribuet-github/tokalator/app/learn/page.tsx", "w") as f:
    f.write(content)
print(f"Written {len(content)} chars to learn/page.tsx")
