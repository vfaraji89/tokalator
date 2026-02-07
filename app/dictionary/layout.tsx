import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dictionary",
  description: "AI and token economy glossary — 40+ terms covering tokenization, context engineering, prompt caching, and LLM concepts.",
};

export default function DictionaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
