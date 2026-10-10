"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import ext from "../../content/extension.json";
import pkg from "../../tokalator-extension-vs/package.json";
import { CATALOG_MODELS, CATALOG_UPDATED_AT } from "../../lib/models";
import { CliTerminal } from "../../components/cli-terminal";
import { CalculatorMark } from "../../components/calculator-mark";
import { FAQ, TRACKING } from "../../lib/extension-faq";

const scrollReveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

type Setting = { default?: unknown; description?: string; markdownDescription?: string };
const settings = Object.entries(pkg.contributes.configuration.properties as Record<string, Setting>).map(([key, s]) => ({
  key,
  default: s.default === "" || s.default === undefined ? "none" : String(s.default),
  description: (s.description ?? s.markdownDescription ?? "").replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, "$1"),
}));
const chatCommands = pkg.contributes.chatParticipants[0].commands;
const paletteCommands = pkg.contributes.commands;
const minVersion = pkg.engines.vscode.replace(/[^\d.]/g, "");

const badgeClass: Record<string, string> = {
  MCP: "feature-badge feature-badge--mcp",
  CLI: "feature-badge feature-badge--cli",
  "VS Code": "feature-badge feature-badge--extension",
};

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
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DashboardMirror() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", alignItems: "start", marginTop: "1rem" }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--bg-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderBottom: "1px solid var(--border)", fontSize: "0.6875rem", color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} aria-hidden />
          TOKALATOR: TOKEN BUDGET
        </div>
        <iframe
          key={theme}
          src={`/extension-preview/dashboard.html?theme=${theme}`}
          title="Interactive Tokalator dashboard running with sample data"
          loading="lazy"
          style={{ width: "100%", height: 760, border: 0, display: "block" }}
        />
      </div>
      <div>
        <h3 style={{ marginTop: 0 }}>The real dashboard, running here</h3>
        <p>Click files, pin, switch models, collapse sections. It is the extension&apos;s own UI with sample data.</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>API-equivalent cost = list prices. Claude subscriptions are not billed per token.</p>
      </div>
    </div>
  );
}

export default function ExtensionPage() {
  const [first, second] = ext.headline.split("\n");
  const [before, after] = first.split(ext.highlightPhrase);

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon"><CalculatorMark size={44} label="Tokalator extension" /></div>
        <h1 className="hero-headline">
          {before}<span className="whitespace-nowrap"><span className="accent-highlight">{ext.highlightPhrase}</span>{after}</span>
          <br />
          {second}
        </h1>
        <p className="hero-description">
          {ext.tagline} <span className="badge badge-accent">v{pkg.version}</span>
        </p>
        <div className="hero-ctas">
          <a
            href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-primary"
            onClick={() => track("marketplace_click", { location: "extension-page-hero" })}
          >
            Install from Marketplace
          </a>
          <a href={ext.githubUrl} target="_blank" rel="noopener noreferrer" className="cta-secondary">
            View source on GitHub
          </a>
        </div>
        <div className="install-cmd">
          <code>{ext.installCmd}</code>
          <CopyButton text={ext.installCmd} />
        </div>
      </header>

      <section className="why-section">
        <div className="why-stats why-stats--4col">
          <div className="why-stat-card">
            <span className="why-stat-number">{chatCommands.length}</span>
            <span className="why-stat-label">Chat commands</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">{CATALOG_MODELS.length}</span>
            <span className="why-stat-label">Models, prices checked {CATALOG_UPDATED_AT}</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">VS Code {minVersion}+</span>
            <span className="why-stat-label">Minimum version</span>
          </div>
          <div className="why-stat-card">
            <span className="why-stat-number">AGPL-3.0</span>
            <span className="why-stat-label">Open source license</span>
          </div>
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">What it tracks</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="settings-table settings-table--stack">
            <thead><tr><th>Assistant</th><th>What Tokalator sees</th><th>Cost</th></tr></thead>
            <tbody>
              {TRACKING.map(r => (
                <tr key={r.assistant}><td><strong>{r.assistant}</strong></td><td data-label="What Tokalator sees">{r.sees}</td><td data-label="Cost">{r.cost}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">See it in action</h2>
        <motion.figure {...scrollReveal(0)} style={{ margin: "1rem 0 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", alignItems: "center" }}>
          <Image
            src="/screenshots/dashboard-demo.gif"
            alt="Recording of the Tokalator dashboard: context budget, switching models, pinning a file, closing low-relevance tabs, a new Claude Code turn arriving, and collapsing sections"
            width={520}
            height={1180}
            unoptimized
            style={{ width: "100%", maxWidth: 360, height: "auto", borderRadius: 8, border: "1px solid var(--border)", justifySelf: "center" }}
          />
          <figcaption>
            <ol style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.8 }}>
              <li>Live context budget for the active model</li>
              <li>Switch models in one tap</li>
              <li>Pin a file to keep it at full relevance</li>
              <li>Close low-relevance tabs in one click</li>
              <li>Claude Code turns and cost update on their own</li>
              <li>Collapse the sections you do not need</li>
            </ol>
          </figcaption>
        </motion.figure>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Try the dashboard</h2>
        <DashboardMirror />
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">What&apos;s new in v{pkg.version}</h2>
        <div className="feature-grid feature-grid--2col" style={{ marginTop: "1rem" }}>
          <motion.div {...scrollReveal(0)} className="feature-item feature-item--extension" style={{ borderColor: "color-mix(in srgb, var(--accent) 30%, var(--border))" }}>
            <h3>Claude Code, tracked automatically</h3>
            <p>Turns, cache hits, and API-equivalent cost from your logs. No chat needed.</p>
          </motion.div>
          <motion.div {...scrollReveal(0.05)} className="feature-item feature-item--extension">
            <h3>Every current model</h3>
            <p>{CATALOG_MODELS.length} models, prices checked {CATALOG_UPDATED_AT}, long-context rates included.</p>
          </motion.div>
          <motion.div {...scrollReveal(0.1)} className="feature-item feature-item--extension">
            <h3>A calmer, faster dashboard</h3>
            <p>Smooth updates, collapsible sections, keyboard-first, reduced-motion aware.</p>
          </motion.div>
          <motion.div {...scrollReveal(0.15)} className="feature-item feature-item--extension">
            <h3>Code maps and smarter security</h3>
            <p>GLOSSARY.md and SITE-MAP.md for agents, and verified secret-file protection.</p>
          </motion.div>
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Features</h2>
        <div className="feature-grid feature-grid--3col">
          {ext.features.map((f, i) => (
            <div key={f.name} className="feature-item feature-item--extension">
              <span className="feature-number">{i + 1}</span>
              <h3>{f.name}</h3>
              <p>{f.description}</p>
              <code>{f.command}</code>
              <span className={badgeClass[f.surface]}>{f.surface}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">@tokalator chat commands</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="settings-table settings-table--stack">
            <thead><tr><th>Command</th><th>What it does</th></tr></thead>
            <tbody>
              {chatCommands.map(c => (
                <tr key={c.name}><td><code>/{c.name}</code></td><td data-label="What it does">{c.description}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          Command Palette: {paletteCommands.map(c => c.title.replace(/^Tokalator: /, "")).join(", ")}.
        </p>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Settings</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="settings-table settings-table--stack">
            <thead><tr><th>Setting</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>
              {settings.map(s => (
                <tr key={s.key}><td><code>{s.key}</code></td><td data-label="Default">{s.default}</td><td data-label="Description">{s.description}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="mcp">
        <div className="section-divider" />
        <h2 className="section-header">MCP server and CLI</h2>
        <p style={{ marginBottom: "1.5rem" }}>Token counts, budgets, and Claude Code usage in Claude Code and your terminal.</p>
        <CliTerminal />
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">How it works</h2>
        <div className="arch-grid">
          {ext.architecture.map((a, i) => (
            <div key={a.layer} className="arch-card">
              <span className="feature-number">{i + 1}</span>
              <h3>{a.layer}</h3>
              <p>{a.purpose}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Tokenizers</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="settings-table settings-table--stack">
            <thead><tr><th>Provider</th><th>Models</th><th>Tokenizer</th><th>Notes</th></tr></thead>
            <tbody>
              {ext.tokenizers.map(t => (
                <tr key={t.provider}>
                  <td><strong>{t.provider}</strong></td>
                  <td data-label="Models">{t.models}</td>
                  <td data-label="Tokenizer"><code>{t.tokenizer}</code></td>
                  <td data-label="Notes" style={{ fontSize: "0.8125rem" }}>{t.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Installation</h2>
        <div className="install-methods">
          {Object.entries(ext.installMethods).map(([key, m]) => (
            <div key={key} className="install-method-card">
              <h3>{m.title}</h3>
              {"note" in m && <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>{m.note}</p>}
              {"steps" in m && (
                <ol style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem" }}>
                  {m.steps.map(step => (
                    <li key={step} style={{ fontSize: "0.8125rem", margin: "0.25rem 0", color: "var(--text-secondary)" }}>{step}</li>
                  ))}
                </ol>
              )}
              {m.command.includes("\n") ? (
                <pre style={{ marginTop: "0.75rem" }}>{m.command}</pre>
              ) : (
                <div className="install-cmd" style={{ marginTop: "0.75rem" }}>
                  <code>{m.command}</code>
                  <CopyButton text={m.command} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Questions</h2>
        {FAQ.map(f => (
          <details key={f.q} style={{ borderBottom: "1px solid var(--border)", padding: "0.75rem 0" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{f.q}</summary>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-secondary)" }}>{f.a}</p>
          </details>
        ))}
      </section>

    </article>
  );
}
