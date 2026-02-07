import { ConversationEstimator } from '@/components/conversation-estimator';

export default function ConversationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Multi-turn Conversation Estimator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Estimate conversation costs and compare context management strategies.
        </p>
      </div>

      <ConversationEstimator />
    </div>
  );
}
