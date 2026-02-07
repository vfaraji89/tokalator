import { ContextOptimizer } from '@/components/context-optimizer';

export default function ContextPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Context Window Optimizer
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Visualize your context budget and optimize token usage for each request.
        </p>
      </div>

      <ContextOptimizer />
    </div>
  );
}
