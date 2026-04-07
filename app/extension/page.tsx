"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import ext from "../../content/extension.json";
import { CliTerminal } from "../../components/cli-terminal";

const scrollReveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

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

export default function ExtensionPage() {
  const headlineParts = ext.headline.split("\n");

  return (
    <article className="article">
      {/* Hero */}
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M10 10L14 14L10 18" stroke="#e3120b" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="15" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          {headlineParts.map((part, i) => {
            // Highlight the phrase within the headline
            if (part.includes(ext.highlightPhrase)) {
              const idx = part.indexOf(ext.highlightPhrase);
              return (
                <span key={i}>
                  {i > 0 && <br />}
                  {part.slice(0, idx)}
                  <span className="accent-highlight">
                    {ext.highlightPhrase}
                  </span>
                  {part.slice(idx + ext.highlightPhrase.length)}
                </span>
              );
            }
            return (
              <span key={i}>
                {i > 0 && <br />}
                {part}
              </span>
            );
          })}
        </h1>
        <p className="hero-description">
          {ext.tagline}{" "}
          <span className="badge badge-accent">v{ext.version}</span>
        </p>
        <div className="hero-ctas">
          <a
            href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-primary"
          >
            Install from Marketplace
          </a>
          <a
            href={ext.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
          >
            View Source on GitHub
          </a>
        </div>
        <div className="install-cmd">
          <code>{ext.installCmd}</code>
          <CopyButton text={ext.installCmd} />
        </div>
      </header>

      {/* Quick Stats */}
      <section className="why-section">
        <div className="why-stats why-stats--4col">
          <div className="why-stat-card">
            <span className="why-stat-number">{ext.features.length}</span>
            <span className="why-stat-label">Features</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">{ext.settings.length}</span>
            <span className="why-stat-label">Settings</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">
              VS Code {ext.vsCodeMinVersion}+
            </span>
            <span className="why-stat-label">Minimum version</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">{ext.license}</span>
            <span className="why-stat-label">License</span>
          </div>
        </div>
      </section>

      {/* Marketplace Stats */}
      <section className="why-section" style={{ marginTop: "1rem" }}>
        <div className="why-stats why-stats--4col">
          <div className="why-stat-card">
            <span className="why-stat-number" style={{ color: "var(--accent)" }}>
              {ext.stats.marketplaceAcquisitions}
            </span>
            <span className="why-stat-label">Total acquisitions</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">{ext.stats.conversionRate}</span>
            <span className="why-stat-label">Conversion rate</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">{ext.stats.communityDevelopers}+</span>
            <span className="why-stat-label">Community devs</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">{ext.stats.unitTests}</span>
            <span className="why-stat-label">Unit tests</span>
          </div>
        </div>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          {ext.stats.period} &middot; {ext.stats.conversionRate} page-to-acquisition conversion &middot; {ext.stats.unitTests} tests across {ext.stats.testFiles} files
        </p>
        {/* Community session breakdown */}
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {ext.stats.communitySessionDetails.map((s) => (
            <div key={s.name} style={{ display: "flex", gap: "0.5rem", fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--accent)", fontWeight: 600, minWidth: "2.5rem" }}>~{s.attendees}</span>
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</span>
              <span style={{ color: "var(--text-muted)" }}>— {s.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Screenshots</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
          <motion.figure {...scrollReveal(0)} style={{ margin: 0 }}>
            <Image
              src="/screenshots/tokalator-ui.png"
              alt="Tokalator sidebar dashboard showing token budget, next turn preview, and budget breakdown"
              width={800}
              height={600}
              style={{ width: "100%", height: "auto", borderRadius: "6px", border: "1px solid var(--border)", display: "block" }}
            />
            <figcaption style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Sidebar dashboard — live token budget, next turn preview, and budget breakdown
            </figcaption>
          </motion.figure>
          <motion.figure {...scrollReveal(0.1)} style={{ margin: 0 }}>
            <Image
              src="/screenshots/tokalator-breakdown.png"
              alt="Tokalator /breakdown command in chat showing file token counts and relevance scores"
              width={800}
              height={600}
              style={{ width: "100%", height: "auto", borderRadius: "6px", border: "1px solid var(--border)", display: "block" }}
            />
            <figcaption style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              @tokalator /breakdown — per-file token counts and relevance scores in chat
            </figcaption>
          </motion.figure>
          <motion.figure {...scrollReveal(0.2)} style={{ margin: 0 }}>
            <Image
              src="/screenshots/tokalator-commands.png"
              alt="Tokalator chat command autocomplete showing all @tokalator slash commands"
              width={800}
              height={600}
              style={{ width: "100%", height: "auto", borderRadius: "6px", border: "1px solid var(--border)", display: "block" }}
            />
            <figcaption style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              11 chat commands via @tokalator — full context management workflow
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* What's New in 3.1.3+ */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">What&apos;s New in v3.1.4</h2>
        <div className="feature-grid feature-grid--2col" style={{ marginTop: "1rem" }}>
          <motion.div {...scrollReveal(0)} className="feature-item feature-item--extension" style={{ borderColor: "color-mix(in srgb, var(--accent) 30%, var(--border))" }}>
            <span className="feature-number">$</span>
            <h3>Price Estimation in Dashboard</h3>
            <p>
              The sidebar now shows a live cost breakdown for every turn.
              Input tokens (files, system prompt, conversation) and output tokens
              (model max capacity) are multiplied by the selected model&apos;s per-MTok
              rates to produce an estimated turn cost. The cost box updates in real
              time as you open, close, or edit files.
            </p>
            <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Visible in:</strong> Sidebar dashboard, <code>@tokalator /count</code>, <code>@tokalator /model</code>, model selector dropdown
            </div>
          </motion.div>
          <motion.div {...scrollReveal(0.1)} className="feature-item feature-item--extension">
            <span className="feature-number">17</span>
            <h3>Model Pricing Built In</h3>
            <p>
              All 17 model profiles now include input and output pricing.
              Anthropic (Claude Opus $5/$25, Sonnet $3/$15, Haiku $1/$5),
              OpenAI (GPT-5.4 $2.50/$10, GPT-5.4 Mini $0.40/$1.60, o3, o4-mini),
              and Google (Gemini Pro $1.25/$5, Flash $0.075/$0.30).
              The model selector shows prices next to context window sizes.
            </p>
            <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Rates:</strong> $/MTok for input and output, sourced from provider pricing pages
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Features</h2>
        <div className="feature-grid feature-grid--3col">
          {ext.features.map((f) => {
            const badge =
              f.number === 12 ? "MCP"
              : f.number === 13 ? "CLI"
              : "VS Code";
            const badgeCls =
              f.number === 12 ? "feature-badge feature-badge--mcp"
              : f.number === 13 ? "feature-badge feature-badge--cli"
              : "feature-badge feature-badge--extension";
            return (
              <div
                key={f.name}
                className="feature-item feature-item--extension"
              >
                <span className="feature-number">{f.number}</span>
                <h3>
                  {f.icon} {f.name}
                </h3>
                <p>{f.description}</p>
                <code>{f.command}</code>
                <span className={badgeCls}>{badge}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Configuration */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Configuration</h2>
        <table className="settings-table">
          <thead>
            <tr>
              <th>Setting</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {ext.settings.map((s) => (
              <tr key={s.key}>
                <td>
                  <code>{s.key}</code>
                </td>
                <td>{s.default}</td>
                <td>{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* MCP & CLI */}
      <section id="mcp">
        <div className="section-divider" />
        <h2 className="section-header">MCP Server &amp; CLI</h2>
        <p style={{ marginBottom: "1.5rem" }}>
          Real Claude BPE token counting inside Claude Code via stdio MCP transport,
          plus a standalone terminal CLI for SSH sessions, containers, and non-VS Code workflows.
        </p>
        <CliTerminal />
      </section>

      {/* Architecture */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Architecture</h2>
        <p>{ext.architecture.length} layers inside the extension:</p>
        <div className="arch-grid">
          {ext.architecture.map((a) => (
            <div key={a.layer} className="arch-card">
              <span className="feature-number">{a.number}</span>
              <h3>{a.layer}</h3>
              <p>{a.purpose}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tokenizers */}
      {ext.tokenizers && (
        <section>
          <div className="section-divider" />
          <h2 className="section-header">Tokenizers</h2>
          <p style={{ marginBottom: "1rem" }}>Each provider uses its own tokenizer for accurate token counts:</p>
          <table className="settings-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Models</th>
                <th>Tokenizer</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {ext.tokenizers.map((t) => (
                <tr key={t.provider}>
                  <td><strong>{t.provider}</strong></td>
                  <td>{t.models}</td>
                  <td><code>{t.tokenizer}</code></td>
                  <td style={{ fontSize: "0.8125rem" }}>{t.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Install Methods */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Installation</h2>
        <div className="install-methods">
          {/* Marketplace */}
          <div className="install-method-card">
            <h3>
              {ext.installMethods.marketplace.icon}{" "}
              {ext.installMethods.marketplace.title}
            </h3>
            <div className="install-cmd" style={{ marginTop: "0.75rem" }}>
              <code>{ext.installMethods.marketplace.command}</code>
              <CopyButton text={ext.installMethods.marketplace.command} />
            </div>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
              {ext.installMethods.marketplace.note}
            </p>
          </div>

          {/* VSIX */}
          <div className="install-method-card">
            <h3>
              {ext.installMethods.vsix.icon}{" "}
              {ext.installMethods.vsix.title}
            </h3>
            <ol style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem" }}>
              {ext.installMethods.vsix.steps.map((step, i) => (
                <li key={i} style={{ fontSize: "0.8125rem", margin: "0.25rem 0", color: "var(--text-secondary)" }}>
                  {step}
                </li>
              ))}
            </ol>
            <div className="install-cmd" style={{ marginTop: "0.75rem" }}>
              <code>{ext.installMethods.vsix.command}</code>
              <CopyButton text={ext.installMethods.vsix.command} />
            </div>
          </div>

          {/* Source */}
          <div className="install-method-card">
            <h3>
              {ext.installMethods.source.icon}{" "}
              {ext.installMethods.source.title}
            </h3>
            <pre style={{ marginTop: "0.75rem" }}>
              {ext.installMethods.source.command}
            </pre>
          </div>

          {/* CLI */}
          <div className="install-method-card">
            <h3>
              {ext.installMethods.cli.icon}{" "}
              {ext.installMethods.cli.title}
            </h3>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
              {ext.installMethods.cli.note}
            </p>
            <ol style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem" }}>
              {ext.installMethods.cli.steps.map((step, i) => (
                <li key={i} style={{ fontSize: "0.8125rem", margin: "0.25rem 0", color: "var(--text-secondary)" }}>
                  {step}
                </li>
              ))}
            </ol>
            <pre style={{ marginTop: "0.75rem" }}>
              {ext.installMethods.cli.command}
            </pre>
          </div>

          {/* MCP */}
          <div className="install-method-card">
            <h3>
              {ext.installMethods.mcp.icon}{" "}
              {ext.installMethods.mcp.title}
            </h3>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
              {ext.installMethods.mcp.note}
            </p>
            <ol style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem" }}>
              {ext.installMethods.mcp.steps.map((step, i) => (
                <li key={i} style={{ fontSize: "0.8125rem", margin: "0.25rem 0", color: "var(--text-secondary)" }}>
                  {step}
                </li>
              ))}
            </ol>
            <div className="install-cmd" style={{ marginTop: "0.75rem" }}>
              <code>{ext.installMethods.mcp.command}</code>
              <CopyButton text={ext.installMethods.mcp.command} />
            </div>
          </div>
        </div>
      </section>

      <div className="footer">
        <div className="section-cta" style={{ marginBottom: "1rem" }}>
          <a
            href={ext.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
          >
            View on GitHub →
          </a>
        </div>
        <p>
          VS Code Marketplace &middot;{" "}
          <a href={ext.githubUrl} style={{ textDecoration: "underline" }}>
            Source
          </a>
        </p>
      </div>
    </article>
  );
}
