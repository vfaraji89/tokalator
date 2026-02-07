import { EconomicAnalysis } from '@/components/economic-analysis';

export default function AnalysisPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="8" y1="20" x2="8" y2="12" stroke="#e3120b" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="20" x2="12" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="20" x2="16" y2="14" stroke="#e3120b" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="20" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Economic Analysis</span>
        </h1>
        <p className="hero-description">
          Analyze costs using the Cobb-Douglas economic model and optimize your API usage.
        </p>
      </header>

      <section>
        <EconomicAnalysis />
      </section>
    </article>
  );
}
