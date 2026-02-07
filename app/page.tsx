"use client";

import Link from "next/link";
import { useState } from "react";
import content from "../content/homepage.json";
import { DemoMockup } from "../components/demo-mockup";

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

export default function HomePage() {
  const { hero, whySection, extensionFeatures, webTools, contextEngineering, howToUse } =
    content;

  // Split headline on newlines
  const headlineParts = hero.headline.split("\n");

  return (
    <article className="article">
      {/* Hero — Agentation-inspired marker highlight */}
      <header className="hero">
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
          <Link href={hero.primaryCta.href} className="cta-primary">
            {hero.primaryCta.label}
          </Link>
          <Link href={hero.secondaryCta.href} className="cta-secondary">
            {hero.secondaryCta.label}
          </Link>
          <span className="coming-soon-badge">Extension Coming Soon</span>
        </div>
        <div className="install-cmd">
          <code>{hero.installCmd}</code>
          <CopyButton text={hero.installCmd} />
        </div>

        {/* Interactive Demo Mockup */}
        <DemoMockup />
        <div className="demo-legend">
          <span className="demo-legend-item">
            <span className="demo-legend-num">1</span> Token Budget Panel
          </span>
          <span className="demo-legend-item">
            <span className="demo-legend-num">2</span> Inline Token Count
          </span>
          <span className="demo-legend-item">
            <span className="demo-legend-num">3</span> AI Context Command
          </span>
        </div>
      </header>

      {/* Why This Matters */}
      <section className="why-section">
        <h2 className="section-header">{whySection.title}</h2>
        <p className="why-subtext">{whySection.subtitle}</p>
        <div className="why-stats">
          {whySection.stats.map((stat) => (
            <div key={stat.label} className="why-stat-card">
              <span className="why-stat-number">{stat.number}</span>
              {stat.unit && (
                <span className="why-stat-unit">{stat.unit}</span>
              )}
              <span className="why-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* VS Code Extension */}
      <section className="extension-section">
        <div className="section-divider" />
        <h2 className="section-header">{extensionFeatures.title}</h2>
        <p>{extensionFeatures.description}</p>
        <div className="feature-grid">
          {extensionFeatures.items.map((f) => (
            <div
              key={f.name}
              className="feature-item feature-item--extension"
            >
              <span className="feature-number">{f.number}</span>
              <h3>
                {f.name}
              </h3>
              <p>{f.description}</p>
              {f.command && <code>{f.command}</code>}
              <span className="feature-badge feature-badge--extension">
                VS Code
              </span>
            </div>
          ))}
        </div>
        <div className="section-cta">
          <a
            href={extensionFeatures.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
          >
            View on GitHub →
          </a>
        </div>
      </section>

      {/* Web Tools */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">{webTools.title}</h2>
        <div className="tool-grid">
          {webTools.items.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="tool-card tool-card--web"
            >
              <h3>
                {tool.name}
              </h3>
              <p>{tool.description}</p>
              <span className="feature-badge feature-badge--web">
                Web Tool
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Context Engineering */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">{contextEngineering.title}</h2>
        <p>
          {contextEngineering.description} Contributed to{" "}
          <a
            href={contextEngineering.awesomeCopilotUrl}
            style={{ textDecoration: "underline" }}
          >
            awesome-copilot
          </a>
          .
        </p>
        <ul>
          {contextEngineering.items.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong> &mdash; {item.description}
            </li>
          ))}
        </ul>
      </section>

      {/* How you use it — Agentation-inspired numbered steps */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">{howToUse.title}</h2>
        <ol className="how-to-steps">
          {howToUse.steps.map((step: string, i: number) => (
            <li key={i} className="how-to-step">
              <span className="how-to-num">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="footer">
        <p>&copy; 2026 @Tokalator. Built by vfaraji89.</p>
      </div>
    </article>
  );
}
