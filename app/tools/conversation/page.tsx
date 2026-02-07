import { ConversationEstimator } from '@/components/conversation-estimator';

export default function ConversationPage() {
  return (
    <article className="article">
      <header>
        <h1>◎ Conversation Cost Estimator</h1>
        <p className="tagline">
          Estimate conversation costs and compare context management strategies.
        </p>
      </header>

      <section>
        <ConversationEstimator />
      </section>
    </article>
  );
}
