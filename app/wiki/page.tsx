import { wiki } from "@/lib/wiki/data";
import type { WikiIndexEntry } from "@/lib/wiki/types";
import WikiBrowser from "./wiki-browser";

export default function WikiPage() {
  const index: WikiIndexEntry[] = wiki.articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    source: a.source,
    sourceLabel: a.sourceLabel,
    sourceColor: a.sourceColor,
    authors: a.authors,
    date: a.date,
    tags: a.tags,
    category: a.category,
  }));
  const papers = wiki.stats.bySource.arxiv ?? 0;
  const others = wiki.stats.total - papers;

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M5 5C5 5 8 4 14 4C20 4 23 5 23 5V22C23 22 20 21 14 21C8 21 5 22 5 22V5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="14" y1="4" x2="14" y2="21" stroke="currentColor" strokeWidth="1" />
            <line x1="8" y1="9" x2="12" y2="9" stroke="#e3120b" strokeWidth="1" strokeLinecap="round" />
            <line x1="8" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
            <line x1="16" y1="9" x2="20" y2="9" stroke="#e3120b" strokeWidth="1" strokeLinecap="round" />
            <line x1="16" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          Context Engineering<br />Wiki
        </h1>
        <p className="hero-description">
          <span className="accent-highlight">{papers} arXiv papers</span>{" "}
          on context engineering, long-context models, prompt caching, token efficiency, and agentic coding,
          plus {others} guides and terms. Fetched from the arXiv API and searchable.
        </p>
      </header>

      <WikiBrowser articles={index} />

      <div className="footer">
        <p>
          Last fetched: <time dateTime={wiki.fetchedAt}>{wiki.fetchedAt}</time> &middot; {wiki.stats.total} articles
        </p>
      </div>
    </article>
  );
}
