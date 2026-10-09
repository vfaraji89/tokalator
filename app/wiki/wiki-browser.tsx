"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryLabel } from "@/lib/wiki/categories";
import type { WikiIndexEntry } from "@/lib/wiki/types";

function countBy<K extends string>(articles: WikiIndexEntry[], key: (a: WikiIndexEntry) => K) {
  const counts = new Map<K, number>();
  for (const a of articles) counts.set(key(a), (counts.get(key(a)) ?? 0) + 1);
  return [...counts].sort((x, y) => y[1] - x[1]);
}

export default function WikiBrowser({ articles }: { articles: WikiIndexEntry[] }) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const sources = useMemo(
    () =>
      countBy(articles, (a) => a.source).map(([id, count]) => {
        const a = articles.find((x) => x.source === id)!;
        return { id, label: a.sourceLabel, color: a.sourceColor, count };
      }),
    [articles],
  );
  const categories = useMemo(() => countBy(articles, (a) => a.category), [articles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return articles.filter((a) => {
      if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        (a.authors ?? []).some((n) => n.toLowerCase().includes(q))
      );
    });
  }, [articles, search, sourceFilter, categoryFilter]);

  return (
    <>
      <div className="wiki-search">
        <input
          type="search"
          aria-label="Search wiki articles"
          placeholder="Search papers, authors, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="wiki-search-input"
        />
        <span className="wiki-search-count" aria-live="polite">
          {filtered.length} of {articles.length}
        </span>
      </div>

      <div className="wiki-filters">
        <div className="wiki-filter-row" role="group" aria-label="Filter by source">
          <button
            className={`source-pill ${sourceFilter === "all" ? "active" : ""}`}
            aria-pressed={sourceFilter === "all"}
            onClick={() => setSourceFilter("all")}
          >
            All
          </button>
          {sources.map((s) => (
            <button
              key={s.id}
              className={`source-pill ${sourceFilter === s.id ? "active" : ""}`}
              aria-pressed={sourceFilter === s.id}
              style={sourceFilter === s.id ? { background: s.color, borderColor: s.color, color: "#fff" } : undefined}
              onClick={() => setSourceFilter(s.id)}
            >
              {s.label}
              <span className="source-pill-count">{s.count}</span>
            </button>
          ))}
        </div>

        <div className="wiki-filter-row" role="group" aria-label="Filter by category">
          {[["all", articles.length] as const, ...categories].map(([id]) => (
            <button
              key={id}
              className={`category-pill ${categoryFilter === id ? "active" : ""}`}
              aria-pressed={categoryFilter === id}
              onClick={() => setCategoryFilter(id)}
            >
              {id === "all" ? "All" : categoryLabel(id)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="wiki-grid">
          {filtered.map((article) => (
            <WikiCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div className="wiki-empty">
          <p>No articles match your filters.</p>
          <button
            className="cta-secondary"
            onClick={() => {
              setSearch("");
              setSourceFilter("all");
              setCategoryFilter("all");
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}

function WikiCard({ article }: { article: WikiIndexEntry }) {
  const hasMeta = Boolean(article.date || article.authors?.length);
  return (
    <Link href={`/wiki/${article.slug}`} className="wiki-card">
      <div className="wiki-card-header">
        <span className="source-badge" style={{ background: article.sourceColor }}>
          {article.sourceLabel}
        </span>
        <span className="category-badge">{categoryLabel(article.category)}</span>
      </div>
      <h2 className="wiki-card-title">{article.title}</h2>
      <p className="wiki-card-desc">{article.description}</p>
      {hasMeta && (
        <div className="wiki-card-meta">
          {article.date && (
            <time className="wiki-card-date" dateTime={article.date}>
              {article.date}
            </time>
          )}
          {article.authors && article.authors.length > 0 && (
            <span className="wiki-card-authors">
              {article.authors.slice(0, 2).join(", ")}
              {article.authors.length > 2 && ` +${article.authors.length - 2}`}
            </span>
          )}
        </div>
      )}
      {article.tags.length > 0 && (
        <div className="wiki-card-tags">
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="wiki-tag">
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && <span className="wiki-tag wiki-tag--more">+{article.tags.length - 3}</span>}
        </div>
      )}
    </Link>
  );
}
