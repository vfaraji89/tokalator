import { CostCalculator } from "@/components/cost-calculator";

export default function CalculatorPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <circle cx="10" cy="16" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="18" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="10" y1="13" x2="10" y2="19" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="16" x2="13" y2="16" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Cost Calculator</span>
        </h1>
        <p className="hero-description">
          Calculate API costs for Claude Opus 4.6, Sonnet 4.5, and Haiku 4.5
          with Cobb-Douglas quality modeling.
        </p>
      </header>

      <CostCalculator />
    </article>
  );
}
