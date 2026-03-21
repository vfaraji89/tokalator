import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CalculatorClient } from './CalculatorClient';


export const metadata: Metadata = {
  title: 'Token Cost Calculator',
  description: 'Calculate and compare token costs across Claude, GPT, and Gemini models. Includes caching ROI, context window comparison, and pricing reference.',
};

function ToolSkeleton() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="4" y1="11" x2="24" y2="11" stroke="currentColor" strokeWidth="1" />
            <line x1="11" y1="11" x2="11" y2="24" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Token Cost Calculator</span></h1>
        <p className="hero-description">Calculate and compare token costs across providers.</p>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="eco-card-flat" style={{ height: 80, background: 'var(--surface)', borderRadius: 6, opacity: 0.5 }} />
        ))}
      </div>
    </article>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<ToolSkeleton />}>
      <CalculatorClient />
    </Suspense>
  );
}
