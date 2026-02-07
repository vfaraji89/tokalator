import { ConversationEstimator } from '@/components/conversation-estimator';

export default function ConversationPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M4 6C4 5 5 4 6 4H18C19 4 20 5 20 6V14C20 15 19 16 18 16H10L6 20V16H6C5 16 4 15 4 14V6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M22 10V18C22 19 21 20 20 20H18L15 23V20H14C13 20 12 19 12 18V16" stroke="#e3120b" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Conversation Cost Estimator</span>
        </h1>
        <p className="hero-description">
          Estimate conversation costs and compare context management strategies.
        </p>
      </header>

      <section>
        <ConversationEstimator />
      </section>
    </article>
  );
}
