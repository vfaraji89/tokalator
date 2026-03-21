'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CatalogItem, Ecosystem, ContentSource } from '@/lib/types/catalog';
import { FilterBar } from './filter-bar';
import { CatalogCard } from './catalog-card';

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const } },
};

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

  const filterKey = `${search}-${ecosystemFilter}-${sourceFilter}`;

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
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={filterKey}
              className="wiki-grid"
              variants={gridVariants}
              initial="hidden"
              animate="show"
            >
              {filtered.map((item) => (
                <motion.div key={`${item.source}-${item.id}`} variants={cardVariants}>
                  <CatalogCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="wiki-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </article>
  );
}
