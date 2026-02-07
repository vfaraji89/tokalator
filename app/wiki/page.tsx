"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import wikiData from "../../content/wiki/articles.json";

type WikiArticle = (typeof wikiData.articles)[number];

const SOURCES = [
  { id: "all", label: "All" },
  { id: "arxiv", label: "arXiv", color: "#b31b1b" },
  { id: "openai", label: "OpenAI", color: "#10a37f" },
  { id: "anthropic", label: "Anthropic", color: "#d97706" },
  { id: "google", label: "Google AI", color: "#4285f4" },
  { id: "builtin", label: "Built-in", color: "#e3120b" },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "context-management", label: "Context Management" },
  { id: "prompt-engineering", label: "Prompt Engineering" },
  { id: "token-optimization", label: "Token Optimization" },
  { id: "caching", label: "Caching" },
  { id: "rag", label: "RAG" },
  { id: "tool-use", label: "Tool Use" },
  { id: "general", label: "General" },
];

export default function WikiPage() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const articles = wikiData.articles as WikiArticle[];

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [articles, search, sourceFilter, categoryFilter]);

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-icon">📖</div>
        <h1 className="hero-headline">
          Context Engineering<br />Wiki
        </h1>
        <p className="hero-description">
          <span className="accent-highlight">{wikiData.stats.total} articles</span>{" "}
          from arXiv, OpenAI, Anthropic, Google AI, and built-in terms.
          Auto-fetched and searchable.
        </p>
      </header>

      {/* Search */}
      <div className="wiki-search">
        <input
          type="text"
          placeholder="Search articles, terms, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="wiki-search-input"
        />
        <span className="wiki-search-count">
          {filtered.length} of {articles.length}
        </span>
      </div>

      {/* Source Filter */}
      <div className="wiki-filters">
        <div className="wiki-filter-row">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              className={`source-pill ${sourceFilter === s.id ? "active" : ""}`}
              style={
                sourceFilter === s.id && s.color
                  ? { background: s.color, borderColor: s.color, color: "#fff" }
                  : undefined
              }
              onClick={() => setSourceFilter(s.id)}
            >
              {s.label}
              {s.id !== "all" && (
                <span className="source-pill-count">
                  {articles.filter((a) => a.source === s.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="wiki-filter-row">
          {CATEGORIES.filter(
            (c) =>
              c.id === "all" ||
              articles.some((a) => a.category === c.id)
          ).map((c) => (
            <button
              key={c.id}
              className={`category-pill ${categoryFilter === c.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Article Grid */}
      <div className="wiki-grid">
        {filtered.map((article) => (
          <WikiCard key={article.slug} article={article} />
        ))}
      </div>

      {filtered.length === 0 && (
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

      <div className="footer">
        <p>
          Last fetched: {new Date(wikiData.fetchedAt).toLocaleDateString()} &middot;{" "}
          {wikiData.stats.total} articles
        </p>
      </div>
    </article>
  );
}

function WikiCard({ article }: { article: WikiArticle }) {
  return (
    <Link href={`/wiki/${article.slug}`} className="wiki-card">
      <div className="wiki-card-header">
        <span
          className="source-badge"
          style={{ background: article.sourceColor }}
        >
          {article.sourceLabel}
        </span>
        <span className="category-badge">{article.category.replace(/-/g, " ")}</span>
      </div>
      <h3 className="wiki-card-title">{article.title}</h3>
      <p className="wiki-card-desc">{article.description}</p>
      <div className="wiki-card-meta">
        {article.date && (
          <span className="wiki-card-date">{article.date}</span>
        )}
        {article.authors && article.authors.length > 0 && (
          <span className="wiki-card-authors">
            {article.authors.slice(0, 2).join(", ")}
            {article.authors.length > 2 && ` +${article.authors.length - 2}`}
          </span>
        )}
      </div>
      {article.tags.length > 0 && (
        <div className="wiki-card-tags">
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="wiki-tag">
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="wiki-tag wiki-tag--more">
              +{article.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
