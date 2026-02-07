'use client';

import { useState, useMemo } from 'react';
import type { CatalogItem, Ecosystem, ContentSource } from '@/lib/types/catalog';
import { FilterBar } from './filter-bar';
import { CatalogCard } from './catalog-card';

interface CatalogGridProps {
  items: CatalogItem[];
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function CatalogGrid({ items, title, description, icon }: CatalogGridProps) {
  const [search, setSearch] = useState('');
  const [ecosystemFilter, setEcosystemFilter] = useState<Ecosystem | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ContentSource | 'all'>('all');

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (ecosystemFilter !== 'all' && item.ecosystem !== ecosystemFilter) return false;
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      return true;
    });
  }, [items, search, ecosystemFilter, sourceFilter]);

  return (
    <article className="article">
      <header className="hero">
        {icon && <div className="hero-outline-icon" aria-hidden>{icon}</div>}
        <h1 className="hero-headline"><span className="hero-marker">{title}</span></h1>
        {description && <p className="hero-description">{description}</p>}
      </header>

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

      {/* Grid */}
      <section>
        {filtered.length > 0 ? (
          <div className="wiki-grid">
            {filtered.map((item) => (
              <CatalogCard key={`${item.source}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="wiki-empty">
            <p>No items match your filters.</p>
            <button
              onClick={() => {
                setSearch('');
                setEcosystemFilter('all');
                setSourceFilter('all');
              }}
              className="cta-secondary"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </article>
  );
}
