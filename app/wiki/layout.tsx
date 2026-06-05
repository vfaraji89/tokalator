import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wiki",
  description: "Research articles on context engineering, tokenization, prompt caching, and LLM architecture — curated from arXiv, Anthropic, OpenAI, and more.",
  alternates: { canonical: "/wiki" },
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
