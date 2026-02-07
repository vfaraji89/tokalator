export default function AboutPage() {
  return (
    <article className="article">
      <header>
        <h1>About Tokalator</h1>
        <p className="tagline">
          Token budget management tools for AI coding assistants
        </p>
      </header>

      <section>
        <h2>Author</h2>
        <div className="author-card">
          <div className="author-info">
            <h3>Vahid Faraji</h3>
            <p>
              Creator and maintainer of Tokalator — building tools that help developers
              understand and optimize their AI context consumption.
            </p>
            <a
              href="https://github.com/vfaraji89"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              github.com/vfaraji89
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2>Contributions</h2>
        <p>
          In addition to building Tokalator, I actively contribute to the
          open-source AI tooling ecosystem:
        </p>

        <div className="contribution-list">
          <div className="contribution-item">
            <h4>awesome-copilot</h4>
            <p>
              Contributed a <strong>collection</strong>, <strong>agent</strong>,{" "}
              <strong>prompt</strong>, and <strong>instruction</strong> file to the
              community-curated repository for GitHub Copilot best practices.
            </p>
            <a
              href="https://github.com/jamesdanielmarrsritcheyandai/awesome-copilot"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Repository →
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2>Project</h2>
        <p>
          Tokalator is an open-source project. The codebase includes:
        </p>
        <ul>
          <li>
            <strong>VS Code Extension</strong> — Real-time token budget dashboard,
            tab relevance scoring, and @tokens chat participant
          </li>
          <li>
            <strong>Web Tools</strong> — Cost calculators, model comparison, caching
            ROI analysis, and context optimization guides
          </li>
          <li>
            <strong>Context Engineering Library</strong> — Curated agents,
            instructions, and prompts for better AI interactions
          </li>
        </ul>
        <a
          href="https://github.com/vfaraji89/tokalator"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          style={{ marginTop: "1rem", display: "inline-flex" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          View on GitHub
        </a>
      </section>

      <section>
        <h2>License</h2>
        <p>MIT License — free for personal and commercial use.</p>
      </section>
    </article>
  );
}
