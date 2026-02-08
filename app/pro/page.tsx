import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tokalator Pro — Coming Soon",
  description:
    "Team dashboards, token counting API, and context audit services. The next layer of Tokalator.",
};

const offerings = [
  {
    icon: "⬡",
    name: "Tokalator Pro",
    badge: "Pro",
    tagline: "Enterprise power, open-source core.",
    description:
      "Everything in the free extension, plus team-wide context visibility, historical analytics, and CI/CD integration.",
    features: [
      "Team dashboard — shared context budgets across your org",
      "Historical token usage analytics — track spend over days, weeks, sprints",
      "CI/CD budget gates — fail builds when context budget exceeds threshold",
      "Custom model profiles — plug in your internal/fine-tuned models",
      "Priority support & onboarding",
    ],
    pricing: "Free core stays MIT open-source. Pro is a paid license.",
    number: 1,
  },
  {
    icon: "◈",
    name: "Token Counting API",
    badge: "API",
    tagline: "Real tokenizers, one endpoint.",
    description:
      "Count tokens for Claude (BPE), GPT (o200k_base), and Gemini with a single REST call. No need to bundle tokenizer data in your app.",
    features: [
      "POST /api/count — returns exact token count per provider",
      "Claude BPE, o200k_base, and heuristic tokenizers",
      "Batch mode — count multiple texts in one call",
      "Free tier: 1,000 requests / day",
      "Paid tier: unlimited requests, SLA, higher rate limits",
    ],
    pricing: "Free tier available. Paid plans for production usage.",
    number: 2,
  },
  {
    icon: "◎",
    name: "Context Audits",
    badge: "Service",
    tagline: "We analyze. You optimize.",
    description:
      "A hands-on review of your repo's AI context: instruction files, Copilot usage patterns, repo structure, and token waste. Delivered as a report with concrete action items.",
    features: [
      "Instruction file inventory — find every .instructions.md, AGENTS.md, .cursorrules",
      "Token cost breakdown — how much context budget your instructions consume",
      "Repo structure review — is your codebase AI-readable?",
      "Copilot/Claude usage patterns — what's working, what's not",
      "Optimization playbook — prioritized fixes with expected savings",
    ],
    pricing: "Per-engagement pricing. Reach out to discuss.",
    number: 3,
  },
];

export default function ProPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg
            width="48"
            height="48"
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M14 3L25 9V19L14 25L3 19V9L14 3Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M14 3V25"
              stroke="currentColor"
              strokeWidth="0.75"
              opacity="0.3"
            />
            <path
              d="M3 9L14 15L25 9"
              stroke="currentColor"
              strokeWidth="0.75"
              opacity="0.3"
            />
            <circle cx="14" cy="14" r="3" fill="#e3120b" opacity="0.8" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Coming Soon</span>
        </h1>
        <p className="hero-description">
          The next layer of Tokalator — team tools, API access, and expert
          services. The open-source core stays free forever.
        </p>
      </header>

      {/* Quick stats */}
      <section className="why-section">
        <div className="why-stats why-stats--4col">
          <div className="why-stat-card">
            <span className="why-stat-number">3</span>
            <span className="why-stat-label">New offerings</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">MIT</span>
            <span className="why-stat-label">Core stays open-source</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">1K</span>
            <span className="why-stat-label">Free API calls / day</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">2026</span>
            <span className="why-stat-label">Launch year</span>
          </div>
        </div>
      </section>

      {/* Offerings */}
      {offerings.map((o) => (
        <section key={o.name}>
          <div className="section-divider" />
          <h2 className="section-header">
            {o.icon} {o.name}{" "}
            <span
              className="badge badge-accent"
              style={{ fontSize: "0.65rem", verticalAlign: "middle" }}
            >
              {o.badge}
            </span>
          </h2>
          <p style={{ marginBottom: "0.25rem" }}>
            <em>{o.tagline}</em>
          </p>
          <p>{o.description}</p>

          <ul style={{ margin: "1rem 0", paddingLeft: "1.25rem" }}>
            {o.features.map((f, i) => (
              <li
                key={i}
                style={{
                  fontSize: "0.8125rem",
                  margin: "0.35rem 0",
                  color: "var(--text-secondary)",
                }}
              >
                {f}
              </li>
            ))}
          </ul>

          <p
            style={{
              fontSize: "0.75rem",
              opacity: 0.6,
              fontStyle: "italic",
            }}
          >
            {o.pricing}
          </p>
        </section>
      ))}

      {/* Notify / CTA */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Stay in the loop</h2>
        <p>
          Star the repo to get notified when these ship. Questions? Open an
          issue or reach out on GitHub.
        </p>
        <div
          className="hero-ctas"
          style={{ marginTop: "1rem", justifyContent: "flex-start" }}
        >
          <a
            href="https://github.com/vfaraji89/tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-primary"
          >
            ★ Star on GitHub
          </a>
          <a
            href="https://github.com/vfaraji89/tokalator/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
          >
            Open an issue
          </a>
        </div>
      </section>
    </article>
  );
}
