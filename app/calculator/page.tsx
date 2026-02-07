import { CostCalculator } from "@/components/cost-calculator";

export default function CalculatorPage() {
  return (
    <article className="article">
      <header>
        <h1>Cost Calculator</h1>
        <p className="tagline">
          Calculate API costs for Claude Opus 4.6, Sonnet 4.5, and Haiku 4.5
          with Cobb-Douglas quality modeling.
        </p>
      </header>

      <CostCalculator />
    </article>
  );
}
