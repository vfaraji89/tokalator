import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Context Engineering",
  description: "Context engineering artifacts — agents, prompts, instructions, and collections for token-optimized AI workflows.",
};

export default function ContextEngineeringPage() {
  const items = [
    {
      type: "Instructions",
      file: "context-engineering.instructions.md",
      purpose:
        "Guidelines for structuring code so Copilot understands it better",
    },
    {
      type: "Agent",
      file: "context-architect.agent.md",
      purpose: "Plans multi-file changes by mapping dependencies first",
    },
    {
      type: "Prompt",
      file: "context-map.prompt.md",
      purpose: "Generates a map of affected files before changes",
    },
    {
      type: "Prompt",
      file: "what-context-needed.prompt.md",
      purpose: "Asks Copilot what files it needs to answer well",
    },
    {
      type: "Prompt",
      file: "refactor-plan.prompt.md",
      purpose: "Creates phased refactor plans with verification steps",
    },
  ];

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <circle cx="10" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="20" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="13.5" y1="12" x2="17.5" y2="10.5" stroke="#e3120b" strokeWidth="1" />
            <line x1="13.5" y1="16" x2="17.5" y2="19" stroke="#e3120b" strokeWidth="1" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Context Engineering Collection</span>{" "}
          <span className="badge badge-accent">PR</span>
        </h1>
        <p className="hero-description">
          Tools for maximizing GitHub Copilot effectiveness through better
          context management. Contributed to{" "}
          <a
            href="https://github.com/github/awesome-copilot"
            style={{ textDecoration: "underline" }}
          >
            awesome-copilot
          </a>
          .
        </p>
      </header>

      <section>
        <h2>Why this matters</h2>
        <p>
          Copilot&apos;s suggestions are only as good as the context it has. Most
          &ldquo;bad&rdquo; suggestions come from relevant files not being open,
          poor project structure that obscures intent, or asking for multi-file
          changes without providing the full picture.
        </p>
      </section>

      <section>
        <h2>Components</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>File</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.file}>
                <td>{item.type}</td>
                <td>
                  <code>{item.file}</code>
                </td>
                <td>{item.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Usage examples</h2>

        <h3>Context Architect Agent</h3>
        <pre>
          {`@context-architect I need to add authentication to the API.
What files are involved?`}
        </pre>

        <h3 style={{ marginTop: "1rem" }}>Before a big change</h3>
        <pre>{`/context-map Add caching to all database queries`}</pre>

        <h3 style={{ marginTop: "1rem" }}>When Copilot gives a generic answer</h3>
        <pre>{`/what-context-needed How does the payment flow work?`}</pre>

        <h3 style={{ marginTop: "1rem" }}>Planning a refactor</h3>
        <pre>{`/refactor-plan Migrate from REST to GraphQL`}</pre>
      </section>

      <div className="footer">
        <p>
          Files live in <code>copilot-contribution/</code> &mdash; ready to PR
          to awesome-copilot.
        </p>
      </div>
    </article>
  );
}
