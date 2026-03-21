import { Suspense } from 'react';
import { CompareClient } from './CompareClient';


function ToolSkeleton() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="6" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="16" y="6" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="12" y1="11" x2="16" y2="11" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="14" x2="16" y2="14" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="17" x2="16" y2="17" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Model Comparison</span></h1>
        <p className="hero-description">Compare pricing, capabilities, and efficiency across AI providers.</p>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {[1, 2].map(i => (
          <div key={i} className="eco-card-flat" style={{ height: 120, background: 'var(--surface)', borderRadius: 6, opacity: 0.5 }} />
        ))}
      </div>
    </article>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ToolSkeleton />}>
      <CompareClient />
    </Suspense>
  );
}
