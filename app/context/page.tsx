import { ContextOptimizer } from "@/components/context-optimizer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Context Window Optimizer",
  description: "Optimize your AI context window usage. Analyze token distribution and reduce context pollution.",
};

export default function ContextPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="14" y1="8" x2="14" y2="14" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="14" cy="14" r="1.5" fill="#e3120b" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Context Window Optimizer</span>
        </h1>
        <p className="hero-description">
          Visualize your context budget and optimize token usage for each
          request.
        </p>
      </header>

      <ContextOptimizer />
    </article>
  );
}
