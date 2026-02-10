"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import content from "../content/homepage.json";
import { DemoMockup } from "../components/demo-mockup";
import { CommandTyper } from "../components/command-typer";

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "Europe/Istanbul",
  });
  return <span className="footer-clock">{fmt.format(now)} IST</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function FooterHeart() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="footer-love" ref={ref}>
      Made with <span className={`footer-love-icon${active ? " heart-active" : ""}`}>♥</span> from Istanbul
    </div>
  );
}

export default function HomePage() {
  const { hero, quickStart, commands, comingSoon } =
    content;

  // Split headline on newlines
  const headlineParts = hero.headline.split("\n");

  return (
    <article className="article">
      {/* Hero — Agentation-inspired marker highlight */}
      <header className="hero">
        <a href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator" target="_blank" rel="noopener noreferrer" className="update-pill">
          <span className="update-dot" /> Now on VS Code Marketplace
          <span className="update-arrow">→</span>
        </a>
        {/* Motionable outline icon */}
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" className="hero-abacus">
            <path d="M4 4 L4 24 L24 24 L24 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <line x1="4" y1="9" x2="24" y2="9" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="1" />
            <circle className="hero-bead hero-bead-1" cx="8" cy="9" r="2" />
            <circle className="hero-bead hero-bead-2" cx="13" cy="9" r="2" />
            <circle className="hero-bead hero-bead-3" cx="9" cy="14" r="2" />
            <circle className="hero-bead hero-bead-4" cx="14" cy="14" r="2" />
            <circle className="hero-bead hero-bead-5" cx="19" cy="14" r="2" />
            <circle className="hero-bead hero-bead-6" cx="8" cy="19" r="2" />
            <circle className="hero-bead hero-bead-7" cx="13" cy="19" r="2" />
            <circle className="hero-bead hero-bead-8" cx="18" cy="19" r="2" />
          </svg>
        </div>
        <h1 className="hero-headline">
          {headlineParts.map((part, i) => (
            <span key={i} className={i === 0 ? "hero-marker" : "hero-underline"}>
              {i > 0 && <br />}
              {part}
            </span>
          ))}
        </h1>
        <p className="hero-description">
          <span className="accent-highlight">{hero.highlightPhrase}</span>{" "}
          {hero.description}
        </p>
        <div className="hero-ctas">
          <Link href={hero.secondaryCta.href} className="cta-secondary">
            {hero.secondaryCta.label}
          </Link>
          <a
            href="https://github.com/vfaraji89/tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-star"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>
            Star on GitHub
          </a>
        </div>

        {/* IDE Install Options */}
        <div className="ide-install">
          <a
            href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="ide-install-btn ide-install-btn--primary"
          >
            <img src="/icons/vscode.svg" alt="VS Code" width={18} height={18} />
            VS Code
          </a>
          <span className="ide-install-btn ide-install-btn--soon" title="Coming soon">
            <img src="/icons/cursor.svg" alt="Cursor" width={18} height={18} />
            Cursor
            <span className="ide-soon-tag">Soon</span>
          </span>
          <span className="ide-install-btn ide-install-btn--soon" title="Coming soon">
            <img src="/icons/claude.svg" alt="Claude" width={18} height={18} />
            Claude Code
            <span className="ide-soon-tag">Soon</span>
          </span>
        </div>
        <div className="install-cmd">
          <code>{hero.installCmd}</code>
          <CopyButton text={hero.installCmd} />
        </div>

        {/* Command typing animation */}
        <CommandTyper />

        {/* Interactive Demo Mockup */}
        <DemoMockup />
        <div className="demo-legend">
          <span className="demo-legend-item">
            <span className="demo-legend-num">1</span> File Explorer
          </span>
          <span className="demo-legend-item">
            <span className="demo-legend-num">2</span> Code Editor
          </span>
          <span className="demo-legend-item">
            <span className="demo-legend-num">3</span> Claude Code Panel
          </span>
        </div>
      </header>

      {/* Quick Start */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">{quickStart.title}</h2>
        <ol className="how-to-steps">
          {quickStart.steps.map((step: string, i: number) => (
            <li key={i} className="how-to-step">
              <span className="how-to-num">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="tech-details">
          <h3 className="tech-details-title">{quickStart.technical.title}</h3>
          <dl className="tech-details-list">
            {quickStart.technical.items.map((item: { label: string; value: string }) => (
              <div key={item.label} className="tech-details-item">
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* All Commands */}
      <section className="extension-section">
        <div className="section-divider" />
        <h2 className="section-header">{commands.title}</h2>
        <p>{commands.description}</p>
        <div className="command-grid">
          {commands.items.map((cmd: { command: string; description: string }) => (
            <div key={cmd.command} className="command-card">
              <code className="command-name">{cmd.command}</code>
              <p className="command-desc">{cmd.description}</p>
            </div>
          ))}
        </div>
        <div className="section-cta">
          <a
            href="https://github.com/vfaraji89/tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
          >
            View on GitHub →
          </a>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="extension-section">
        <div className="section-divider" />
        <h2 className="section-header">{comingSoon.title}</h2>
        <p>{comingSoon.subtitle}</p>
        <div className="feature-grid">
          {comingSoon.items.map((item: { name: string; description: string; badge: string; number: number }) => (
            <div
              key={item.name}
              className="feature-item feature-item--extension feature-item--coming-soon"
            >
              <span className="feature-number">{item.number}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className="feature-badge feature-badge--soon">
                {item.badge} · Coming Soon
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Open Source */}
      <section className="community-section">
        <div className="community-glow" aria-hidden />
        <div className="community-content">
          <h2 className="community-headline">Every token you save<br />makes the next prompt better.</h2>
          <p className="community-text">
            Open source. Community shaped. Free forever.
          </p>
          <div className="community-ctas">
            <a
              href="https://github.com/vfaraji89/tokalator"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-star cta-star--large"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-nav">
          <div className="footer-nav-col">
            <h4 className="footer-nav-heading">Get Started</h4>
            <Link href="/extension">Install Extension</Link>
            <Link href="/learn">Learn Tokens</Link>
          </div>
          <div className="footer-nav-col">
            <h4 className="footer-nav-heading">Resources</h4>
            <Link href="/wiki">Wiki</Link>
            <Link href="/dictionary">Dictionary</Link>
            <Link href="/context-engineering">Context Engineering</Link>
          </div>
          <div className="footer-nav-col">
            <h4 className="footer-nav-heading">Project</h4>
            <a href="https://github.com/vfaraji89/tokalator" target="_blank" rel="noopener noreferrer">GitHub</a>
            <Link href="/about">About</Link>
            <Link href="/pro">Tokalator Pro</Link>
          </div>
        </div>
        <div className="footer-main">
          <span className="footer-brand">&copy; 2026 @Tokalator.</span>
          <a href="https://github.com/vfaraji89" target="_blank" rel="noopener noreferrer" className="footer-author-link">Vahid Faraji</a>
        </div>
        <FooterHeart />
        <div className="footer-meta">
          <a href="https://github.com/vfaraji89/tokalator" target="_blank" rel="noopener noreferrer" className="footer-github" aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
          <LiveClock />
        </div>
      </footer>
    </article>
  );
}
