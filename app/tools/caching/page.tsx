import { CachingCalculator } from '@/components/caching-calculator';

export default function CachingPage() {
  return (
    <article className="article">
      <header>
        <h1>◈ Caching ROI Calculator</h1>
        <p className="tagline">
          Calculate when prompt caching saves money vs. when it costs more.
        </p>
      </header>

      <section>
        <CachingCalculator />
      </section>
    </article>
  );
}
