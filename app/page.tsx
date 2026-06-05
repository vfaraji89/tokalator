"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import content from "../content/homepage.json";
import { CommandTyper } from "../components/command-typer";
import { HeroMorph } from "../components/hero-morph";
import { StarCount } from "../components/star-count";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, delay },
});
const inView = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
};

const features = [
  { title: "BPE Tokenization", desc: "Real token counts with Claude BPE and OpenAI o200k_base encoders.", badge: "v3.1.7" },
  { title: "Context Budget Meter", desc: "Live sidebar showing token usage vs model context window with Budget Level indicators.", badge: "v3.1.7" },
  { title: "Tab Relevance Scoring", desc: "5-signal scoring: language match, import relationships, path similarity, edit recency, diagnostics.", badge: "v3.1.7" },
  { title: "Cost-per-Turn Estimate", desc: "Know the dollar cost before you send. Per-MTok pricing for 17 models.", badge: "v3.1.7" },
  { title: "17 Model Profiles", desc: "Claude Opus/Sonnet/Haiku 4.x, GPT-5.x, o4-mini, Gemini 3.x/2.5 with live pricing.", badge: "v3.1.7" },
  { title: "Next Turn Preview", desc: "Project total tokens after your next turn to decide whether to send or restart.", badge: "v3.1.7" },
  { title: "Workspace Security Scan", desc: "Detect Sensitive Files (.env, .pem, credentials) and generate deny rules for Claude and Copilot.", badge: "Pro" },
  { title: "Smart Model Routing", desc: "Automatically select the most cost-effective model based on task complexity.", badge: "Pro" },
  { title: "Team Analytics", desc: "Usage dashboards, audit logs, cost insights, and spend controls across your organization.", badge: "Enterprise" },
];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = now
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: "Europe/Istanbul",
      })
    : null;
  return (
    <span className="footer-clock" suppressHydrationWarning>
      {fmt && now ? `${fmt.format(now)} IST` : " "}
    </span>
  );
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
      Made with <span className={`footer-love-icon${active ? " heart-active" : ""}`}>&#9829;</span> from Istanbul
    </div>
  );
}

export default function HomePage() {
  const { hero, quickStart, commands } = content;
  const headlineParts = hero.headline.split("\n");

  return (
    <article className="article">
      {/* Hero */}
      <header className="hero">
        <motion.a {...fadeIn(0)} href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator" target="_blank" rel="noopener noreferrer" className="update-pill">
          <span className="update-dot" /> v3.1.7: Agentic Pixel Grid UI + dark mode
          <span className="update-arrow">&rarr;</span>
        </motion.a>

        <motion.div {...fadeIn(0.08)} className="hero-outline-icon" aria-hidden>
          <HeroMorph />
        </motion.div>

        <motion.h1 {...fadeUp(0.15)} className="hero-headline">
          {headlineParts.map((part, i) => (
            <span key={i} className={i === 0 ? "hero-marker" : "hero-underline"}>
              {i > 0 && <br />}
              {part}
            </span>
          ))}
        </motion.h1>
        <motion.p {...fadeUp(0.25)} className="hero-description">
          <span className="accent-highlight">{hero.highlightPhrase}</span>{" "}
          {hero.description}
        </motion.p>
        <motion.div {...fadeUp(0.35)} className="hero-ctas">
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
            <StarCount />
          </a>
        </motion.div>

        {/* IDE Install Options */}
        <motion.div {...fadeUp(0.42)} className="ide-install">
          <a
            href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="ide-install-btn ide-install-btn--primary"
          >
            <Image src="/icons/vscode.svg" alt="VS Code" width={18} height={18} />
            VS Code
          </a>
          <Link href="/extension#mcp" className="ide-install-btn ide-install-btn--mcp" title="Use via MCP server">
            <Image src="/icons/claude.svg" alt="Claude Code" width={18} height={18} />
            Claude Code
            <span className="ide-mcp-tag">MCP</span>
          </Link>
        </motion.div>
        <motion.div {...fadeUp(0.48)} className="install-cmd">
          <code>{hero.installCmd}</code>
          <CopyButton text={hero.installCmd} />
        </motion.div>

        {/* Proof stats */}
        <motion.div {...fadeUp(0.52)} className="hero-proof">
          <a
            href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-proof-item"
          >
            <span className="hero-proof-value">500+</span>
            <span className="hero-proof-label">installs</span>
          </a>
          <span className="hero-proof-dot" />
          <a
            href="https://arxiv.org/abs/2604.08290"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-proof-item"
          >
            <span className="hero-proof-value">arXiv</span>
            <span className="hero-proof-label">2604.08290</span>
          </a>
          <span className="hero-proof-dot" />
          <span className="hero-proof-item">
            <span className="hero-proof-value">17</span>
            <span className="hero-proof-label">models</span>
          </span>
          <span className="hero-proof-dot" />
          <span className="hero-proof-item">
            <span className="hero-proof-value">Open</span>
            <span className="hero-proof-label">source</span>
          </span>
        </motion.div>

        {/* Command typing animation */}
        <motion.div {...fadeIn(0.58)}>
          <CommandTyper />
        </motion.div>

        {/* Dashboard screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] as const }}
          style={{ marginTop: "2rem", maxWidth: 420, width: "100%" }}
        >
          <Image
            src="/screenshots/tokalator-ui.png"
            alt="Tokalator token budget dashboard in VS Code — LOW budget, next turn preview, budget breakdown"
            width={840}
            height={560}
            style={{ width: "100%", height: "auto", borderRadius: "8px", border: "1px solid var(--border)", display: "block" }}
          />
        </motion.div>
      </header>

      {/* Features with tier badges */}
      <motion.section {...inView}>
        <div className="section-divider" />
        <h2 className="section-header">Features</h2>
        <div className="feature-grid">
          {features.map((f) => {
            const isLocked = f.badge === "Pro" || f.badge === "Enterprise";
            const badgeClass = f.badge === "Pro" ? "pro" : f.badge === "Enterprise" ? "enterprise" : "extension";
            return (
              <div key={f.title} className={`feature-item feature-item--extension${isLocked ? " feature-item--locked" : ""}`}>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className={`feature-badge feature-badge--${badgeClass}`}>
                  {f.badge}
                </span>
                {f.badge === "Pro" && (
                  <a href="https://tokalator.ai" target="_blank" rel="noopener noreferrer" className="feature-lock-link">Upgrade to Pro &rarr;</a>
                )}
                {f.badge === "Enterprise" && (
                  <a href="https://tokalator.ai/enterprise" target="_blank" rel="noopener noreferrer" className="feature-lock-link feature-lock-link--enterprise">Contact Sales &rarr;</a>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Quick Start */}
      <motion.section {...inView}>
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
      </motion.section>

      {/* All Commands */}
      <motion.section {...inView} className="extension-section">
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
            View on GitHub &rarr;
          </a>
        </div>
      </motion.section>

      {/* Beyond VS Code */}
      <motion.section {...inView} className="extension-section">
        <div className="section-divider" />
        <h2 className="section-header">Beyond VS Code</h2>
        <p>Token budget awareness wherever you work — not just in the editor.</p>
        <div className="feature-grid feature-grid--2col" style={{ marginTop: "1.25rem" }}>
          <div className="feature-item feature-item--extension">
            <span className="feature-number">1</span>
            <h3>MCP Server for Claude Code</h3>
            <p>
              Real Claude BPE token counting inside Claude Code via stdio MCP transport.
              Count tokens, estimate file budgets, preview turn cost — zero API calls.
            </p>
            <div className="install-cmd" style={{ marginTop: "0.75rem" }}>
              <code>claude mcp add --transport stdio tokalator -- node tokalator-mcp/build/index.js</code>
            </div>
            <span className="feature-badge feature-badge--mcp">MCP</span>
          </div>
          <div className="feature-item feature-item--extension">
            <span className="feature-number">2</span>
            <h3>Standalone CLI</h3>
            <p>
              Terminal-first token budgeting for SSH sessions, containers, and non-VS Code workflows.
              Run <code>tokalator count</code>, <code>budget</code>, <code>preview</code>, or <code>models</code> anywhere.
            </p>
            <div className="install-cmd" style={{ marginTop: "0.75rem" }}>
              <code>npm install -g tokalator</code>
            </div>
            <span className="feature-badge feature-badge--cli">CLI</span>
          </div>
        </div>
      </motion.section>

      {/* Pricing */}
      <motion.section {...inView}>
        <div className="section-divider" />
        <h2 className="section-header">Pricing</h2>
        <div className="pricing-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="pricing-card">
            <div className="pricing-name">Free</div>
            <div className="pricing-price">Free</div>
            <p className="pricing-desc">VS Code extension. Token calculator.</p>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> BPE tokenization</li>
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> Budget meter</li>
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> 17 model profiles</li>
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> Cost-per-turn</li>
            </ul>
            <a href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator" target="_blank" rel="noopener noreferrer" className="pricing-btn pricing-btn--secondary">Get Extension</a>
          </div>
          <div className="pricing-card pricing-card--featured">
            <span className="pricing-badge">Popular</span>
            <div className="pricing-name">Pro</div>
            <div className="pricing-price">$9<span className="pricing-price-unit"> once</span></div>
            <p className="pricing-desc">Security scan, smart routing, budgets.</p>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> Security scan</li>
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> Smart routing</li>
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> Budget alerts</li>
            </ul>
            <a href="https://tokalator.ai" target="_blank" rel="noopener noreferrer" className="pricing-btn pricing-btn--primary">Learn More</a>
          </div>
          <div className="pricing-card">
            <div className="pricing-name">Enterprise</div>
            <div className="pricing-price">Contact</div>
            <p className="pricing-desc">Team analytics, SSO, audit logs.</p>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> Team analytics</li>
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> SSO / SAML</li>
              <li className="pricing-feature"><span className="pricing-check">&#10003;</span> Unlimited seats</li>
            </ul>
            <a href="https://tokalator.ai/enterprise" target="_blank" rel="noopener noreferrer" className="pricing-btn pricing-btn--secondary">Contact Sales</a>
          </div>
        </div>
      </motion.section>

      {/* Open Source */}
      <motion.section {...inView} className="community-section">
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
              <StarCount />
            </a>
          </div>
        </div>
      </motion.section>

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
          <div className="footer-nav-col">
            <h4 className="footer-nav-heading">Research</h4>
            <a href="https://arxiv.org/abs/2604.08290" target="_blank" rel="noopener noreferrer" className="footer-paper-link">
              <span className="footer-paper-badge">arXiv:2604.08290</span>
              Tokalator: A Context Engineering Toolkit
            </a>
            <span className="footer-paper-authors">Farajijobehdar, Koseoğlu Sarı, Üre, Zeydan (2026)</span>
          </div>
        </div>

        <div className="footer-stats">
          <div className="footer-stat">
            <span className="footer-stat-value">500+</span>
            <span className="footer-stat-label">Total Installs</span>
          </div>
          <div className="footer-stat">
            <span className="footer-stat-value">17</span>
            <span className="footer-stat-label">Model Profiles</span>
          </div>
          <div className="footer-stat">
            <span className="footer-stat-value">124</span>
            <span className="footer-stat-label">Unit Tests</span>
          </div>
          <div className="footer-stat">
            <span className="footer-stat-value">37pp</span>
            <span className="footer-stat-label">Research Paper</span>
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
