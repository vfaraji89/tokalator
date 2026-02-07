'use client';

import type { Ecosystem, ContentSource } from '@/lib/types/catalog';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  ecosystemFilter: Ecosystem | 'all';
  onEcosystemChange: (value: Ecosystem | 'all') => void;
  sourceFilter: ContentSource | 'all';
  onSourceChange: (value: ContentSource | 'all') => void;
  totalCount: number;
  filteredCount: number;
}

const ecosystemOptions: { value: Ecosystem | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'copilot', label: 'Copilot' },
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'universal', label: 'Universal' },
];

const sourceOptions: { value: ContentSource | 'all'; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'builtin', label: 'Built-in' },
  { value: 'awesome-copilot', label: 'Community' },
  { value: 'user', label: 'Your Content' },
];

export function FilterBar({
  search,
  onSearchChange,
  ecosystemFilter,
  onEcosystemChange,
  sourceFilter,
  onSourceChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  return (
    <div className="wiki-filters">
      {/* Search */}
      <div className="wiki-search">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="wiki-search-input"
        />
        <span className="wiki-search-count">
          {filteredCount}/{totalCount}
        </span>
      </div>

      {/* Ecosystem Filter */}
      <div className="wiki-filter-row">
        {ecosystemOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onEcosystemChange(opt.value)}
            className={`source-pill ${ecosystemFilter === opt.value ? 'active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Source Filter */}
      <div className="wiki-filter-row">
        {sourceOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSourceChange(opt.value)}
            className={`category-pill ${sourceFilter === opt.value ? 'active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
