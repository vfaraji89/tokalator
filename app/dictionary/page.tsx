"use client";

import { useState, useMemo } from "react";
import dictionary from "../../content/dictionary.json";

type Term = (typeof dictionary.terms)[number];

export default function DictionaryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const terms = dictionary.terms as Term[];
  const categories = dictionary.categories;

  const filtered = useMemo(() => {
    return terms
      .filter((t) => {
        if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            t.term.toLowerCase().includes(q) ||
            t.definition.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [terms, search, categoryFilter]);

  // Group by first letter
  const grouped = useMemo(() => {
    const groups: Record<string, Term[]> = {};
    for (const term of filtered) {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    }
    return groups;
  }, [filtered]);

  const letters = Object.keys(grouped).sort();

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-icon">📖</div>
        <h1 className="hero-headline">Dictionary</h1>
        <p className="hero-description">
          <span className="accent-highlight">{terms.length} terms</span>{" "}
          {dictionary.description}
        </p>
      </header>

      {/* Search */}
      <div className="wiki-search">
        <input
          type="text"
          placeholder="Search terms, definitions, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="wiki-search-input"
        />
        <span className="wiki-search-count">
          {filtered.length} of {terms.length}
        </span>
      </div>

      {/* Category Filter */}
      <div className="wiki-filters">
        <div className="wiki-filter-row">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`category-pill ${categoryFilter === c.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.label}
              {c.id !== "all" && (
                <span className="source-pill-count">
                  {terms.filter((t) => t.category === c.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Letter Index */}
      {letters.length > 3 && (
        <div className="dict-letter-index">
          {letters.map((letter) => (
            <a key={letter} href={`#letter-${letter}`} className="dict-letter-link">
              {letter}
            </a>
          ))}
        </div>
      )}

      {/* Terms */}
      {letters.map((letter) => (
        <section key={letter} id={`letter-${letter}`}>
          <div className="dict-letter-header">{letter}</div>
          <div className="dict-terms">
            {grouped[letter].map((t) => (
              <div key={t.term} className="dict-term">
                <div className="dict-term-header">
                  <h3 className="dict-term-name">{t.term}</h3>
                  <span className="category-badge">
                    {t.category.replace(/-/g, " ")}
                  </span>
                </div>
                <p className="dict-term-def">{t.definition}</p>
                <div className="wiki-card-tags">
                  {t.tags.map((tag) => (
                    <span key={tag} className="wiki-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="wiki-empty">
          <p>No terms match your search.</p>
          <button
            className="cta-secondary"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="footer">
        <p>{terms.length} terms &middot; Context engineering glossary</p>
      </div>
    </article>
  );
}
