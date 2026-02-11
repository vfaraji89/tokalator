import { UsageTracker } from '@/components/usage-tracker-v2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Usage Tracker",
  description: "Upload CSV exports from Anthropic, OpenAI, or Google. Track token spending across providers.",
};

export default function UsagePage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polyline points="8,18 12,12 16,15 20,8" stroke="#e3120b" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="1.5" fill="#e3120b" />
            <circle cx="20" cy="8" r="1.5" fill="#e3120b" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Usage Tracking</span>
        </h1>
        <p className="hero-description">
          Upload CSV exports from Anthropic, OpenAI, or Google. Track spending across providers.
        </p>
      </header>

      <section>
        <UsageTracker />
      </section>
    </article>
  );
}
