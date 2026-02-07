import Link from "next/link";

export default function HomePage() {
  return (
    <article className="article">
      <header>
        <h1>Tokalator</h1>
        <p className="tagline">
          Count your tokens like beads on an abacus. Context engineering tools
          for AI coding assistants.
        </p>
      </header>

      <section>
        <h2>What is this?</h2>
        <p>
          Tokalator is a context engineering platform built around two ideas:
          tokens are money, and context is everything. It includes a VS Code
          extension that monitors your real-time context budget, and a set of web
          tools for calculating costs, optimizing prompts, and understanding the
          economics of AI-assisted coding.
        </p>
      </section>

      <section>
        <h2>VS Code Extension</h2>
        <p>
          Real-time context window monitoring inside your editor. Track token
          budgets, score tab relevance, and manage context through chat commands.
        </p>
        <div className="feature-grid">
          <div className="feature-item">
            <h3>Token Budget Dashboard</h3>
            <p>
              Sidebar panel showing real-time token usage and per-file breakdown
            </p>
          </div>
          <div className="feature-item">
            <h3>Tab Relevance Scoring</h3>
            <p>
              Ranks open tabs by imports, path similarity, edit recency, and
              diagnostics
            </p>
          </div>
          <div className="feature-item">
            <h3>Chat Participant</h3>
            <p>@tokens commands for inline budget management</p>
            <code>/count /optimize /pin /breakdown</code>
          </div>
          <div className="feature-item">
            <h3>Context Rot Warnings</h3>
            <p>Alerts when conversation turns exceed threshold</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Web Tools</h2>
        <div className="tool-grid">
          <Link href="/calculator" className="tool-card">
            <h3>Cost Calculator</h3>
            <p>Token cost calculator with Cobb-Douglas quality modeling</p>
          </Link>
          <Link href="/context" className="tool-card">
            <h3>Context Optimizer</h3>
            <p>Visualize your context budget and optimize token usage</p>
          </Link>
          <Link href="/tools/compare" className="tool-card">
            <h3>Model Comparison</h3>
            <p>Cross-provider cost and capability comparison</p>
          </Link>
          <Link href="/tools/caching" className="tool-card">
            <h3>Caching ROI</h3>
            <p>Break-even analysis for prompt caching</p>
          </Link>
        </div>
      </section>

      <section>
        <h2>Context Engineering</h2>
        <p>
          A collection of agents, prompts, and instructions for maximizing AI
          coding assistant effectiveness through better context management.
          Contributed to{" "}
          <a
            href="https://github.com/github/awesome-copilot"
            style={{ textDecoration: "underline" }}
          >
            awesome-copilot
          </a>
          .
        </p>
        <ul>
          <li>
            <strong>Context Architect Agent</strong> &mdash; Maps dependencies
            before suggesting changes
          </li>
          <li>
            <strong>Context Map Prompt</strong> &mdash; Generates a map of
            affected files
          </li>
          <li>
            <strong>What Context Needed</strong> &mdash; Asks the AI what files
            it needs
          </li>
          <li>
            <strong>Refactor Plan Prompt</strong> &mdash; Creates phased
            refactor plans with verification
          </li>
        </ul>
      </section>

      <div className="footer">
        <p>&copy; 2026 Tokalator. Built by vfaraji89.</p>
      </div>
    </article>
  );
}
