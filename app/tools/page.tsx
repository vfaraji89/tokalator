import Link from "next/link";
import type { Metadata } from "next";
import { CATALOG_MODELS, CATALOG_UPDATED_AT } from "@/lib/models";

const modelCount = CATALOG_MODELS.length;
const providerCount = new Set(CATALOG_MODELS.map(m => m.provider)).size;

export const metadata: Metadata = {
  title: "Tools",
  description: `Token cost calculators, model comparison, caching break-even, conversation and context estimators, and usage tracking for ${modelCount} Claude, GPT and Gemini models.`,
  alternates: { canonical: "/tools" },
};

const tools = [
  { name: "Calculator", href: "/tools/calculator", desc: "Per-request cost for any catalog model, including cache reads, cache writes and long-context rates." },
  { name: "Compare", href: "/tools/compare", desc: "Rank every model by cost for one request size and compare context windows and output limits." },
  { name: "Pricing", href: "/tools/pricing", desc: "Input, output and cache rates for each model, with links to the provider pricing pages." },
  { name: "Caching", href: "/tools/caching", desc: "Break-even reuse count and total savings for prompt caching on a chosen model." },
  { name: "Conversation", href: "/tools/conversation", desc: "Multi-turn cost under full history, sliding window and summarization strategies." },
  { name: "Context", href: "/tools/context", desc: "How a system prompt, user message and reserved output fill a model's context window." },
  { name: "Economics", href: "/tools/economics", desc: "Illustrative Cobb-Douglas quality model from Bergemann, Bonatti and Smolin, plus a caching break-even view." },
  { name: "Usage", href: "/tools/usage", desc: "Import a Claude Code log to see tokens, cache and cost by model, project and day, parsed in your browser. CSV exports also work." },
];

export default function ToolsPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M17 4L21 8L12 17H8V13L17 4Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <line x1="4" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14.5" y1="6.5" x2="18.5" y2="10.5" stroke="var(--accent)" strokeWidth="1" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Tools</span>
        </h1>
        <p className="hero-description">
          Token cost tools for {modelCount} models across {providerCount} providers. Rates checked {CATALOG_UPDATED_AT}. Inputs stay in your browser.
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
