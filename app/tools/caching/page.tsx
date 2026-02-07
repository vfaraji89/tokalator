import { CachingCalculator } from '@/components/caching-calculator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Caching ROI Calculator",
  description: "Calculate prompt caching ROI — compare cached vs uncached costs across Claude, GPT-4, and Gemini models.",
};

export default function CachingPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <ellipse cx="14" cy="8" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M5 8V14C5 16.2 9 18 14 18C19 18 23 16.2 23 14V8" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M5 14V20C5 22.2 9 24 14 24C19 24 23 22.2 23 20V14" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <ellipse cx="14" cy="14" rx="9" ry="4" stroke="#e3120b" strokeWidth="0.75" fill="none" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Caching ROI Calculator</span>
        </h1>
        <p className="hero-description">
          Calculate when prompt caching saves money vs. when it costs more.
        </p>
      </header>

      <section>
        <CachingCalculator />
      </section>
    </article>
  );
}
