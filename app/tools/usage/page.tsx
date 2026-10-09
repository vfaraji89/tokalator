import { ClaudeCodeUsage } from '@/components/claude-code-usage';
import { UsageTracker } from '@/components/usage-tracker-v2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Usage Tracker",
  description: "Turn your Claude Code logs (CLI and VS Code extension) into tokens, turns, cache hits, and cost by model, project, and day. Runs in your browser. CSV exports from Anthropic, OpenAI, and Google also supported.",
  alternates: { canonical: '/tools/usage' },
};

export default function UsagePage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polyline points="8,18 12,12 16,15 20,8" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="1.5" fill="var(--accent)" />
            <circle cx="20" cy="8" r="1.5" fill="var(--accent)" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Usage Tracking</span>
        </h1>
        <p className="hero-description">
          See what your Claude Code sessions cost: turns, requests, cache hits, and spend by model, project, and day. Works with logs from the CLI and the VS Code extension, and never leaves your browser.
        </p>
      </header>

      <section>
        <ClaudeCodeUsage />
      </section>

      <div className="section-divider" />
      <section>
        <h2 className="section-header">Provider CSV exports</h2>
        <p className="hero-description">Upload usage CSVs from the Anthropic, OpenAI, or Google consoles.</p>
        <UsageTracker />
      </section>
    </article>
  );
}
