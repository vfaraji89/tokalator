'use client';

import { useState, useMemo } from 'react';
import type { CatalogItem, CatalogStats, ContentKind, Ecosystem, ContentSource } from '@/lib/types/catalog';
import { FilterBar } from './filter-bar';
import { CatalogCard } from './catalog-card';

type KindFilter = ContentKind | 'all';

const KIND_LABELS: Record<string, string> = {
  all: 'All',
  agent: 'Agents',
  prompt: 'Prompts',
  instruction: 'Instructions',
  collection: 'Collections',
};

interface Props {
  items: CatalogItem[];
  stats: CatalogStats;
}

export function CatalogGridUnified({ items, stats }: Props) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [ecosystemFilter, setEcosystemFilter] = useState<Ecosystem | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ContentSource | 'all'>('all');

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
      }
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (ecosystemFilter !== 'all' && item.ecosystem !== ecosystemFilter) return false;
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      return true;
    });
  }, [items, search, kindFilter, ecosystemFilter, sourceFilter]);

  const kinds: KindFilter[] = ['all', 'agent', 'prompt', 'instruction', 'collection'];

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="15" y="4" width="9" height="9" rx="2" stroke="#e3120b" strokeWidth="1.5" fill="none" />
            <rect x="4" y="15" width="9" height="9" rx="2" stroke="#e3120b" strokeWidth="1.5" fill="none" />
            <rect x="15" y="15" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Catalog</span></h1>
        <p className="hero-description">
          {stats.totalItems} artifacts for AI coding assistants — agents, prompts, instructions, and collections.
        </p>
      </header>

      {/* Kind tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {kinds.map(k => {
          const count = k === 'all' ? stats.totalItems : (stats.byKind[k] || 0);
          return (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: kindFilter === k ? 600 : 400,
                background: kindFilter === k ? 'var(--text-primary)' : 'transparent',
                color: kindFilter === k ? 'var(--bg)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
              }}
            >
              {KIND_LABELS[k]} ({count})
            </button>
          );
        })}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        ecosystemFilter={ecosystemFilter}
        onEcosystemChange={setEcosystemFilter}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        totalCount={items.length}
        filteredCount={filtered.length}
      />

      <section>
        {filtered.length > 0 ? (
          <div className="wiki-grid">
            {filtered.map((item) => (
              <CatalogCard key={`${item.source}-${item.id}`} item={item} basePath="/catalog" />
            ))}
          </div>
        ) : (
          <div className="wiki-empty">
            <p>No items match your filters.</p>
            <button
              onClick={() => { setSearch(''); setKindFilter('all'); setEcosystemFilter('all'); setSourceFilter('all'); }}
              className="cta-secondary"
            >Clear all filters</button>
          </div>
        )}
      </section>
    </article>
  );
}
