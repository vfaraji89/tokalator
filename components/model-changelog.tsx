'use client';

import { useState } from 'react';
import {
  Provider,
  PRICE_HISTORY,
  MODEL_RELEASES,
  getProviderName,
  PriceChange,
  ModelRelease,
} from '@/lib/providers';

// ============================================
// CHANGELOG ITEM COMPONENT
// ============================================

interface ChangelogItemProps {
  type: 'price' | 'release';
  data: PriceChange | ModelRelease;
}

function ChangelogItem({ type, data }: ChangelogItemProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  if (type === 'price') {
    const priceData = data as PriceChange;
    const isDecrease = priceData.changePercent < 0;
    
    return (
      <div className="flex items-start gap-4 py-4 border-b border-eco-gray-800">
        <div className="w-2 h-2 mt-2 rounded-full bg-eco-red flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Price Change
            </span>
            <span className={`text-xs font-bold ${isDecrease ? 'text-positive' : 'text-negative'}`}>
              {isDecrease ? '↓' : '↑'} {Math.abs(priceData.changePercent).toFixed(1)}%
            </span>
          </div>
          <p className="font-medium mb-1">
            {priceData.modelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </p>
          <p className="text-sm text-muted">
            {priceData.field === 'inputCostPerMTok' ? 'Input' : 'Output'} cost: 
            ${priceData.oldValue.toFixed(2)} → ${priceData.newValue.toFixed(2)} per MTok
          </p>
          <p className="text-xs text-muted mt-2">
            {formatDate(priceData.date)} • {getProviderName(priceData.provider)}
          </p>
        </div>
      </div>
    );
  }
  
  const releaseData = data as ModelRelease;
  
  return (
    <div className="flex items-start gap-4 py-4 border-b border-eco-gray-800">
      <div className="w-2 h-2 mt-2 rounded-full bg-eco-black border-2 border-eco-red flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            New Model
          </span>
          {releaseData.isNew && (
            <span className="eco-badge eco-badge-red">New</span>
          )}
        </div>
        <p className="font-medium mb-1">{releaseData.modelName}</p>
        <p className="text-sm text-muted">{releaseData.description}</p>
        <p className="text-xs text-muted mt-2">
          {formatDate(releaseData.releaseDate)} • {getProviderName(releaseData.provider)}
        </p>
      </div>
    </div>
  );
}

// ============================================
// MODEL CHANGELOG COMPONENT
// ============================================

type FilterType = 'all' | 'prices' | 'releases';
type ProviderFilter = 'all' | Provider;

export function ModelChangelog() {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  
  // Combine and sort all changes by date
  const allChanges: { type: 'price' | 'release'; data: PriceChange | ModelRelease; date: string }[] = [
    ...PRICE_HISTORY.map(p => ({ type: 'price' as const, data: p, date: p.date })),
    ...MODEL_RELEASES.map(r => ({ type: 'release' as const, data: r, date: r.releaseDate })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Apply filters
  const filteredChanges = allChanges.filter(change => {
    if (typeFilter !== 'all') {
      if (typeFilter === 'prices' && change.type !== 'price') return false;
      if (typeFilter === 'releases' && change.type !== 'release') return false;
    }
    if (providerFilter !== 'all') {
      if (change.data.provider !== providerFilter) return false;
    }
    return true;
  });
  
  return (
    <div className="eco-card-flat">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="section-title mb-0">Model Changelog</h3>
        
        <div className="flex gap-2">
          {/* Type Filter */}
          <div className="flex border border-eco-gray-700">
            {(['all', 'prices', 'releases'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTypeFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  typeFilter === filter 
                    ? 'bg-eco-red text-white' 
                    : 'bg-transparent text-muted hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value as ProviderFilter)}
            className="bg-eco-dark border border-eco-gray-700 text-sm px-3 py-1.5 text-white focus:outline-none focus:border-eco-red"
          >
            <option value="all">All Providers</option>
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="google">Google</option>
          </select>
        </div>
      </div>
      
      <div className="max-h-[600px] overflow-y-auto">
        {filteredChanges.length === 0 ? (
          <p className="text-center text-muted py-8">No changes match your filters</p>
        ) : (
          filteredChanges.map((change, index) => (
            <ChangelogItem
              key={`${change.type}-${change.data.id}-${index}`}
              type={change.type}
              data={change.data}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ModelChangelog;
