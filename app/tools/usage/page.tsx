import { UsageTracker } from '@/components/usage-tracker';

export default function UsagePage() {
  return (
    <article className="article">
      <header>
        <h1>Usage Tracking</h1>
        <p className="tagline">
          View and manage your Anthropic API usage records.
        </p>
      </header>

      <section>
        <UsageTracker />
      </section>
    </article>
  );
}
