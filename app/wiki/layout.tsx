import type { Metadata } from "next";
import { wiki } from "@/lib/wiki/data";
import "./wiki.css";

export const metadata: Metadata = {
  title: { default: "Context Engineering Wiki", template: "%s | Tokalator" },
  description: `${wiki.stats.bySource.arxiv ?? 0} arXiv papers on context engineering, long-context LLMs, context rot, prompt caching, token efficiency, and agentic coding, plus OpenAI Cookbook guides and core terms. Fetched ${wiki.fetchedAt}.`,
  alternates: { canonical: "/wiki" },
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
