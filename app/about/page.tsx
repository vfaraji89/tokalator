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

const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const ArxivIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="9" y1="8" x2="17" y2="8" />
    <line x1="9" y1="12" x2="15" y2="12" />
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

      {/* Author */}
      <section>
        <h2>Author</h2>
        <div className="author-card">
          <div className="author-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ margin: 0 }}>Vahid Faraji</h3>
              <span className="cat-agent" aria-hidden="true">
                <svg width="28" height="20" viewBox="0 0 56 40" fill="currentColor">
                  {/* Body */}
                  <ellipse cx="28" cy="28" rx="14" ry="9" opacity="0.85"/>
                  {/* Head */}
                  <circle cx="16" cy="20" r="7" opacity="0.85"/>
                  {/* Left ear */}
                  <polygon points="11,14 9,6 15,12" opacity="0.85"/>
                  {/* Right ear */}
                  <polygon points="19,12 21,4 23,12" opacity="0.85"/>
                  {/* Eyes — blink via CSS */}
                  <ellipse className="cat-eye cat-eye-left" cx="13.5" cy="19" rx="1.2" ry="1.2" fill="var(--bg)"/>
                  <ellipse className="cat-eye cat-eye-right" cx="18.5" cy="19" rx="1.2" ry="1.2" fill="var(--bg)"/>
                  {/* Nose */}
                  <polygon points="15.5,21.5 16.5,21.5 16,22.5" fill="var(--accent)" opacity="0.7"/>
                  {/* Tail — sways via CSS */}
                  <path className="cat-tail" d="M42,27 Q48,18 52,22 Q56,26 50,28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.7"/>
                  {/* Front paws */}
                  <ellipse cx="20" cy="35" rx="2.5" ry="1.8" opacity="0.65"/>
                  <ellipse cx="26" cy="36" rx="2.5" ry="1.8" opacity="0.65"/>
                </svg>
              </span>
            </div>
            <p className="about-role">Sr. Applied AI Specialist · Istanbul</p>
            <p>
              8+ years of expericne in data product and recently as Appleid AI.
              Currently driving enterprise LLM pipelines and AI-powered automation at Kariyer.net — designing
              products with AI-native approach and AI-transofmation leader.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              Contributed for metadata management system serving 5M+ monthly user data, work on text retrival, context engineering, spec desgin and fast-prototyping.
              Selected projects: text-to-SQL agent for internal data access, feedback automation for Sales Team, drag and drop for finance operation.
            </p>
            <div className="about-links">
              <a href="https://github.com/vfaraji89" target="_blank" rel="noopener noreferrer" className="github-link">
                <GitHubIcon /> GitHub
              </a>
              <a href="https://linkedin.com/in/vfaraji89" target="_blank" rel="noopener noreferrer" className="github-link">
                <LinkedInIcon /> LinkedIn
              </a>
              <a href="https://arxiv.org/abs/2601.22885" target="_blank" rel="noopener noreferrer" className="github-link">
                <ArxivIcon /> Publication
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section>
        <h2>Highlights</h2>
        <div className="about-highlights">
          <div className="about-highlight-card">
            <span className="about-highlight-icon">◈</span>
            <h4>Enterprise AI at Scale</h4>
            <p>LLM pipelines, text-to-SQL, feedback automation — serving 100+ internal users with 60% reduction in manual ops.</p>
          </div>
          <div className="about-highlight-card">
            <span className="about-highlight-icon">⬡</span>
            <h4>Cost Optimization</h4>
            <p>$40K+ annual savings through model routing, caching, and request batching across 3+ engineering teams.</p>
          </div>
          <div className="about-highlight-card">
            <span className="about-highlight-icon">◎</span>
            <h4>Published Researcher</h4>
            <p><em>Leveraging LLMs For Turkish Skill Extraction</em> — arXiv:2601.22885. M.A. in Economics with a data-driven thesis.</p>
          </div>
          <div className="about-highlight-card">
            <span className="about-highlight-icon">♦</span>
            <h4>Multilingual</h4>
            <p>Turkish (native), English (C1), Spanish (instructor level), Portuguese (basic) — career mentor and AI speaker.</p>
          </div>
        </div>
      </section>

      {/* Project */}
      <section>
        <h2>Project</h2>
        <p>Tokalator is an open-source project. The codebase includes:</p>
        <ul>
          <li><strong>VS Code Extension</strong> — Real-time token budget dashboard, tab relevance scoring, and @tokalator chat participant with real BPE tokenizers</li>
          <li><strong>Web Tools</strong> — Cost calculators, model comparison, caching ROI analysis, and context optimization guides</li>
          <li><strong>Context Engineering Library</strong> — Curated agents, instructions, and prompts contributed to <a href="https://github.com/github/awesome-copilot" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>awesome-copilot</a></li>
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

      {/* License */}
      <section>
        <h2>License</h2>
        <p>MIT License — free for personal and commercial use.</p>
      </section>
    </article>
  );
}
