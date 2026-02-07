import { EconomicAnalysis } from '@/components/economic-analysis';

export default function AnalysisPage() {
  return (
    <article className="article">
      <header>
        <h1>Economic Analysis</h1>
        <p className="tagline">
          Analyze costs using the Cobb-Douglas economic model and optimize your API usage.
        </p>
      </header>

      <section>
        <EconomicAnalysis />
      </section>
    </article>
  );
}
