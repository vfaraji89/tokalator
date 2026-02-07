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
    <div className="space-y-4 mb-8">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-eco-gray-900 border border-eco-gray-800 text-eco-gray-100 px-4 py-3 text-sm font-sans placeholder:text-eco-gray-600 focus:outline-none focus:border-eco-red"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-eco-gray-600 text-xs">
          {filteredCount}/{totalCount}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-6">
        {/* Ecosystem */}
        <div className="flex items-center gap-2">
          <span className="data-label">Ecosystem</span>
          <div className="flex gap-1">
            {ecosystemOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onEcosystemChange(opt.value)}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  ecosystemFilter === opt.value
                    ? 'bg-eco-red text-white'
                    : 'bg-eco-gray-900 text-eco-gray-400 hover:text-eco-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="flex items-center gap-2">
          <span className="data-label">Source</span>
          <div className="flex gap-1">
            {sourceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSourceChange(opt.value)}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  sourceFilter === opt.value
                    ? 'bg-eco-red text-white'
                    : 'bg-eco-gray-900 text-eco-gray-400 hover:text-eco-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
