import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools",
  description: "AI token econometrics — multi-provider calculator, Cobb-Douglas economic model, and CSV usage tracker.",
};

const tools = [
  {
    name: "Calculator",
    desc: "Cost calculator for 15 models across Anthropic, OpenAI, and Google. Compare pricing side-by-side.",
    href: "/tools/calculator",
    icon: (
      <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="3" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="8" y="6" width="12" height="5" rx="1" stroke="#e3120b" strokeWidth="1" fill="none" />
        <circle cx="10" cy="15" r="1" fill="currentColor" />
        <circle cx="14" cy="15" r="1" fill="currentColor" />
        <circle cx="18" cy="15" r="1" fill="currentColor" />
        <circle cx="10" cy="19" r="1" fill="currentColor" />
        <circle cx="14" cy="19" r="1" fill="currentColor" />
        <circle cx="18" cy="19" r="1" fill="#e3120b" />
        <circle cx="10" cy="23" r="1" fill="currentColor" />
        <rect x="13" y="22" width="6" height="2" rx="0.5" fill="#e3120b" />
      </svg>
    ),
  },
  {
    name: "Economics",
    desc: "Cobb-Douglas quality function, caching break-even analysis, and diminishing returns curves.",
    href: "/tools/economics",
    icon: (
      <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <polyline points="7,20 11,14 15,16 21,8" stroke="#e3120b" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="7" y1="8" x2="7" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="7" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Usage",
    desc: "Upload CSV exports from Anthropic, OpenAI, or Google. Track spending over time.",
    href: "/tools/usage",
    icon: (
      <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="8" y1="20" x2="8" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="10" stroke="#e3120b" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="20" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="20" x2="20" y2="8" stroke="#e3120b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
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
          Token econometrics for 15 models across 3 providers. Powered by a Python API.
        </p>
      </header>

      <section>
        <div className="tool-grid">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="tool-card">
              <div style={{ marginBottom: "0.75rem", color: "var(--text-primary)" }}>{tool.icon}</div>
              <h3>{tool.name}</h3>
              <p>{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
