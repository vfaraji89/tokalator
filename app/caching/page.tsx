import { CachingCalculator } from '@/components/caching-calculator';

export default function CachingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Caching ROI Calculator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Calculate when prompt caching saves money vs. when it costs more.
        </p>
      </div>

      <CachingCalculator />
    </div>
  );
}
