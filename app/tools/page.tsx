import Link from "next/link";

const tools = [
  {
    name: "Cost Calculator",
    desc: "Interactive token cost calculator with Cobb-Douglas quality modeling.",
    href: "/calculator",
  },
  {
    name: "Context Optimizer",
    desc: "Visualize your context budget and optimize token usage.",
    href: "/context",
  },
  {
    name: "Model Comparison",
    desc: "Compare pricing, capabilities, and efficiency across providers.",
    href: "/tools/compare",
  },
  {
    name: "Caching ROI",
    desc: "Calculate when prompt caching saves money. Break-even analysis.",
    href: "/tools/caching",
  },
  {
    name: "Conversation Estimator",
    desc: "Estimate multi-turn conversation costs.",
    href: "/tools/conversation",
  },
  {
    name: "Economic Analysis",
    desc: "Cobb-Douglas economic model for API usage optimization.",
    href: "/tools/analysis",
  },
  {
    name: "Pricing Reference",
    desc: "Current pricing for Claude models and services.",
    href: "/tools/pricing",
  },
];

export default function ToolsPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M17 4L21 8L12 17H8V13L17 4Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <line x1="4" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14.5" y1="6.5" x2="18.5" y2="10.5" stroke="#e3120b" strokeWidth="1" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Tools</span>
        </h1>
        <p className="hero-description">
          Calculators, analyzers, and optimization tools for AI token cost
          management.
        </p>
      </header>

      <section>
        <div className="tool-grid">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="tool-card">
              <h3>{tool.name}</h3>
              <p>{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
