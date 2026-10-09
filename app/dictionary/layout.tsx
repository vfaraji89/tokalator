import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import dictionary from "@/content/dictionary.json";
import { termSlug } from "./term-slug";

const SITE_URL = "https://tokalator.ai";

export const metadata: Metadata = {
  title: "Context Engineering Dictionary",
  description: `${dictionary.terms.length} terms on context engineering, token economics, prompt caching, compaction, agent hooks, and MCP, with sources. Updated 2026-10-10.`,
  alternates: { canonical: "/dictionary" },
};

export default function DictionaryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          name: "Context Engineering Dictionary",
          url: `${SITE_URL}/dictionary`,
          dateModified: "2026-10-10",
          hasDefinedTerm: dictionary.terms.map((t) => ({
            "@type": "DefinedTerm",
            name: t.term,
            description: t.definition,
            url: `${SITE_URL}/dictionary#${termSlug(t.term)}`,
          })),
        }}
      />
      {children}
    </>
  );
}
