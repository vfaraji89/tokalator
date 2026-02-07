"use client";

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

/* ────────────────────────────────────────────── */

const lessons = [
  {
    id: "context-window",
    number: 1,
    title: "Context Window",
    subtitle: "What the AI actually sees",
    description:
      "Every LLM has a finite context window — the maximum number of tokens it can process in a single request. Think of it as the AI's working memory. Everything you send (system prompt, conversation history, code, instructions) must fit inside.",
  },
  {
    id: "management",
    number: 2,
    title: "Context Management",
    subtitle: "Budget what you send",
    description:
      "Context management is the practice of deciding what goes into the window and what stays out. You allocate a token budget across system prompt, user message, retrieved context, and response space — just like allocating memory.",
  },
  {
    id: "compaction",
    number: 3,
    title: "Compaction",
    subtitle: "Fit more in less",
    description:
      "When context overflows, compaction strategies kick in: summarize old turns, drop low-relevance files, compress boilerplate. The goal is to preserve signal while reducing token count.",
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
          <span className="accent-highlight">3 core concepts</span>{" "}
          — from context windows to compaction strategies. Each lesson includes
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

        <Frame title="Context Window — 128K tokens">
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
            { text: "# Your code here — count your own prompts" },
            { text: "# user_msg = ..." },
            { text: "# user_tokens = len(enc.encode(user_msg))" },
          ]}
        />
      </section>

      {/* ── Lesson 2: Context Management ── */}
      <section className="learn-lesson" id={lessons[1].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[1].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[1].title}</h2>
            <p className="learn-lesson-sub">{lessons[1].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[1].description}</p>

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
            { text: "# Your code here — build your budget" },
            { text: "# budget = TokenBudget()" },
            { text: '# budget.allocate("system", 500)' },
          ]}
        />
      </section>

      {/* ── Lesson 3: Compaction ── */}
      <section className="learn-lesson" id={lessons[2].id}>
        <div className="learn-lesson-header">
          <span className="learn-lesson-num">{lessons[2].number}</span>
          <div>
            <h2 className="learn-lesson-title">{lessons[2].title}</h2>
            <p className="learn-lesson-sub">{lessons[2].subtitle}</p>
          </div>
        </div>
        <p className="learn-lesson-desc">{lessons[2].description}</p>

        <Frame title="Compaction Strategy — Before vs After">
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
            { text: "# Your code here — implement summarize()" },
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
