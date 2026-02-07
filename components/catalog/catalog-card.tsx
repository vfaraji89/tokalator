import Link from 'next/link';
import type { CatalogItem } from '@/lib/types/catalog';

interface CatalogCardProps {
  item: CatalogItem;
}

const ecosystemColors: Record<string, string> = {
  copilot: 'bg-[#1f6feb] text-white',
  'claude-code': 'bg-[#d97706] text-white',
  universal: 'bg-eco-gray-700 text-eco-gray-200',
};

const ecosystemLabels: Record<string, string> = {
  copilot: 'Copilot',
  'claude-code': 'Claude Code',
  universal: 'Universal',
};

const sourceLabels: Record<string, string> = {
  builtin: 'Built-in',
  'awesome-copilot': 'Community',
  community: 'Community',
  user: 'Your Content',
};

const kindRoutes: Record<string, string> = {
  agent: '/agents',
  prompt: '/prompts',
  instruction: '/instructions',
  collection: '/collections',
};

export function CatalogCard({ item }: CatalogCardProps) {
  const href = `${kindRoutes[item.kind] || '/agents'}/${item.id}`;

  return (
    <Link href={href} className="block group">
      <div className={`eco-card-flat transition-smooth hover:border-eco-red ${item.featured ? 'border-l-4 border-l-eco-red' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-serif font-bold text-sm text-eco-gray-100 group-hover:text-eco-red transition-colors leading-tight">
            {item.name}
          </h3>
          <span className={`eco-badge ${ecosystemColors[item.ecosystem]} shrink-0`}>
            {ecosystemLabels[item.ecosystem]}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-eco-gray-400 leading-relaxed mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="eco-badge eco-badge-outline text-eco-gray-500">
            {item.kind}
          </span>
          <span className="text-[10px] text-eco-gray-600 uppercase tracking-wider">
            {sourceLabels[item.source]}
          </span>
          {item.model && (
            <span className="text-[10px] text-eco-gray-500">
              {item.model}
            </span>
          )}
          {item.featured && (
            <span className="text-[10px] text-eco-red font-semibold uppercase tracking-wider">
              Featured
            </span>
          )}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {item.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] text-eco-gray-600 bg-eco-gray-900 px-1.5 py-0.5">
                {tag}
              </span>
            ))}
            {item.tags.length > 4 && (
              <span className="text-[10px] text-eco-gray-600">+{item.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
