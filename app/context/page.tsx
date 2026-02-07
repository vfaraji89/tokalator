import { ContextOptimizer } from "@/components/context-optimizer";

export default function ContextPage() {
  return (
    <article className="article">
      <header>
        <h1>Context Window Optimizer</h1>
        <p className="tagline">
          Visualize your context budget and optimize token usage for each
          request.
        </p>
      </header>

      <ContextOptimizer />
    </article>
  );
}
