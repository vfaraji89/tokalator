import { Suspense } from 'react';
import type { Metadata } from 'next';
import { EconomicsClient } from './EconomicsClient';


export const metadata: Metadata = {
  title: 'Token Economics & Cobb-Douglas Model',
  description: 'Explore the Bergemann-Bonatti-Smolin Cobb-Douglas quality function and caching ROI for AI models.',
};

function ToolSkeleton() {
  return (
    <article className="article">
      <header className="hero">
        <h1 className="hero-headline"><span className="hero-marker">Token Economics</span></h1>
        <p className="hero-description">Quality model and caching ROI analysis.</p>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="eco-card-flat" style={{ height: 80, background: 'var(--surface)', borderRadius: 6, opacity: 0.5 }} />
        ))}
      </div>
    </article>
  );
}

export default function EconomicsPage() {
  return (
    <Suspense fallback={<ToolSkeleton />}>
      <EconomicsClient />
    </Suspense>
  );
}
