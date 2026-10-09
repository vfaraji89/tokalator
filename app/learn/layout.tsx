import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";

const SITE_URL = "https://tokalator.ai";
const description =
  "Free course on token economics and context engineering: 11 lessons on prompts, context windows, trimming, summarisation, server-side compaction, context editing, prompt caching, effort, and adaptive thinking. Updated 2026-10-10.";

export const metadata: Metadata = {
  title: "Token Economics Course",
  description,
  alternates: { canonical: "/learn" },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: "Token economics: from prompt to production",
          description,
          url: `${SITE_URL}/learn`,
          dateModified: "2026-10-10",
          author: { "@type": "Organization", name: "Tokalator", url: SITE_URL },
        }}
      />
      {children}
    </>
  );
}
