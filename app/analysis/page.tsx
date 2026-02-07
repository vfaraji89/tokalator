import { EconomicAnalysis } from '@/components/economic-analysis';

export default function AnalysisPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Economic Analysis
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Analyze costs using the Cobb-Douglas economic model and optimize your API usage.
        </p>
      </div>
      
      <EconomicAnalysis />
    </div>
  );
}
