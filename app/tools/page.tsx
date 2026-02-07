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
      <header>
        <h1>Tools</h1>
        <p className="tagline">
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
