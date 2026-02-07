import { CostCalculator } from '@/components/cost-calculator';

export default function CalculatorPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Cost Calculator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Calculate Anthropic API costs for Claude Opus 4.5, Sonnet 4.5, and Haiku 4.5
        </p>
      </div>
      
      <CostCalculator />
    </div>
  );
}
