export default function ExtensionPage() {
  const features = [
    {
      name: "Token Budget Dashboard",
      description:
        "Activity bar sidebar panel showing real-time token usage, budget meter, and per-file breakdown.",
      command: "View via sidebar icon",
    },
    {
      name: "@tokens Chat Participant",
      description:
        "Integrated chat commands for inline budget management directly in Copilot Chat.",
      command: "@tokens /count, /optimize, /pin, /breakdown",
    },
    {
      name: "Tab Relevance Scoring",
      description:
        "Ranks open tabs by relevance using import analysis, path similarity, edit recency, and diagnostics.",
      command: "tokalator.optimize",
    },
    {
      name: "Status Bar Indicator",
      description:
        "Quick-glance budget status (LOW / MEDIUM / HIGH) in the bottom-right corner.",
      command: "Always visible",
    },
    {
      name: "Context Rot Warnings",
      description:
        "Warns when conversation turns exceed threshold (default: 20).",
      command: "Automatic",
    },
    {
      name: "Pinned Files",
      description:
        "Pin important files so they are always treated as high-relevance.",
      command: "@tokens /pin <file>",
    },
  ];

  const settings = [
    {
      key: "tokalator.relevanceThreshold",
      def: "0.3",
      desc: "Tabs below this relevance score are marked as distractors (0\u20131)",
    },
    {
      key: "tokalator.windowSize",
      def: "1,000,000",
      desc: "Context window size in tokens",
    },
    {
      key: "tokalator.contextRotWarningTurns",
      def: "20",
      desc: "Warn about context rot after this many turns",
    },
    {
      key: "tokalator.autoRefreshInterval",
      def: "2000",
      desc: "Dashboard refresh interval in milliseconds",
    },
  ];

  return (
    <article className="article">
      <header>
        <h1>
          Tokalator Extension{" "}
          <span className="badge badge-accent">v0.1.0</span>
        </h1>
        <p className="tagline">
          Count your tokens like beads on an abacus. Real-time context budget
          calculator for AI coding assistants.
        </p>
      </header>

      <section>
        <h2>Install from Marketplace</h2>
        <div className="install-block">ext install vfaraji89.tokalator</div>
        <p style={{ marginTop: "0.5rem" }}>Requires VS Code 1.99+</p>
      </section>

      <section>
        <h2>Install from VSIX</h2>
        <p>Download the latest release and install manually:</p>
        <ol>
          <li>Download <code>tokalator-0.1.0.vsix</code> from the releases page</li>
          <li>Open VS Code</li>
          <li>Press <kbd>Cmd+Shift+P</kbd> (macOS) or <kbd>Ctrl+Shift+P</kbd> (Windows/Linux)</li>
          <li>Type <strong>Extensions: Install from VSIX...</strong></li>
          <li>Select the downloaded <code>.vsix</code> file</li>
        </ol>
        <p>Or install via command line:</p>
        <pre>{`code --install-extension tokalator-0.1.0.vsix`}</pre>
      </section>

      <section>
        <h2>Build from Source</h2>
        <pre>
          {`git clone https://github.com/vfaraji89/tokalator.git
cd tokalator/copilot-context-monitor
npm install
npm run compile
# Press F5 to launch Extension Development Host`}
        </pre>
      </section>

      <section>
        <h2>Features</h2>
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.name} className="feature-item">
              <h3>{f.name}</h3>
              <p>{f.description}</p>
              <code>{f.command}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Configuration</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Setting</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.key}>
                <td>
                  <code>{s.key}</code>
                </td>
                <td>{s.def}</td>
                <td>{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Architecture</h2>
        <p>Four layers inside the extension:</p>
        <table className="table">
          <thead>
            <tr>
              <th>Layer</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Core Engine</strong>
              </td>
              <td>
                Subscribes to editor events, builds context snapshots, manages
                pinned files
              </td>
            </tr>
            <tr>
              <td>
                <strong>Token Estimator</strong>
              </td>
              <td>
                Counts tokens per file using tiktoken when available, falls back
                to ~4 chars/token
              </td>
            </tr>
            <tr>
              <td>
                <strong>Relevance Scorer</strong>
              </td>
              <td>
                Scores tabs 0&ndash;1 based on language, imports, path, recency,
                diagnostics
              </td>
            </tr>
            <tr>
              <td>
                <strong>Chat Participant</strong>
              </td>
              <td>
                @tokens chat commands; read-only commands don&apos;t inflate turn
                counter
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="footer">
        <p>
          VS Code Marketplace &middot;{" "}
          <a
            href="https://github.com/vfaraji89/tokalator"
            style={{ textDecoration: "underline" }}
          >
            Source
          </a>
        </p>
      </div>
    </article>
  );
}
