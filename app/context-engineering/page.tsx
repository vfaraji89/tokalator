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
      <header>
        <h1>
          Context Engineering Collection{" "}
          <span className="badge badge-accent">PR</span>
        </h1>
        <p className="tagline">
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
