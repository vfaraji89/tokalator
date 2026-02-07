'use client';

import { useState, useMemo } from 'react';
import type { CatalogItem, Ecosystem, ContentSource } from '@/lib/types/catalog';
import { FilterBar } from './filter-bar';
import { CatalogCard } from './catalog-card';

interface CatalogGridProps {
  items: CatalogItem[];
  title: string;
  description?: string;
}

export function CatalogGrid({ items, title, description }: CatalogGridProps) {
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="eco-divider-thick w-16 mb-4" style={{ margin: 0, marginBottom: '1rem' }} />
        <h1 className="headline text-eco-gray-100">{title}</h1>
        {description && (
          <p className="subheadline mt-2">{description}</p>
        )}
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

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <CatalogCard key={`${item.source}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="eco-card-flat text-center py-12">
          <p className="text-eco-gray-500 text-sm">No items match your filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setEcosystemFilter('all');
              setSourceFilter('all');
            }}
            className="text-eco-red text-xs mt-2 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
