"use client";

import { useState } from "react";
import ext from "../../content/extension.json";

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
        <div className="hero-icon">{ext.icon}</div>
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
            href={`https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator`}
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

      {/* Features */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Features</h2>
        <div className="feature-grid feature-grid--3col">
          {ext.features.map((f) => (
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
              <span className="feature-badge feature-badge--extension">
                VS Code
              </span>
            </div>
          ))}
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

      {/* Architecture */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Architecture</h2>
        <p>Four layers inside the extension:</p>
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
