import { UsageTracker } from '@/components/usage-tracker';

export default function UsagePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Usage Tracking
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View and manage your Anthropic API usage records.
        </p>
      </div>

      <UsageTracker />
    </div>
  );
}
