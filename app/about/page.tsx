import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Tokalator — token budget management tools for AI coding assistants. Built by Vahid Faraji from Istanbul.",
};

const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function AboutPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="14" y1="13" x2="14" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="9" r="1.5" fill="#e3120b" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">About Tokalator</span>
        </h1>
        <p className="hero-description">Token budget management tools for AI coding assistants</p>
      </header>

      <section>
        <h2>Author</h2>
        <div className="author-card">
          <div className="author-info">
            <h3>Vahid Faraji</h3>
            <p>Creator and maintainer of Tokalator — building tools that help developers understand and optimize their AI context consumption.</p>
            <a
              href="https://github.com/vfaraji89"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              <GitHubIcon />
              github.com/vfaraji89
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2>Project</h2>
        <p>Tokalator is an open-source project. The codebase includes:</p>
        <ul>
          <li><strong>VS Code Extension</strong> — Real-time token budget dashboard, tab relevance scoring, and @tokalator chat participant</li>
          <li><strong>Web Tools</strong> — Cost calculators, model comparison, caching ROI analysis, and context optimization guides</li>
          <li><strong>Context Engineering Library</strong> — Curated agents, instructions, and prompts for better AI interactions</li>
        </ul>
        <a
          href="https://github.com/vfaraji89/tokalator"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          style={{ marginTop: "1.5rem", display: "inline-flex" }}
        >
          <GitHubIcon />
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
