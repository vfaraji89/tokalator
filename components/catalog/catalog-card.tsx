import Link from 'next/link';
import type { CatalogItem } from '@/lib/types/catalog';

interface CatalogCardProps {
  item: CatalogItem;
  basePath?: string;
}

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

export function CatalogCard({ item, basePath }: CatalogCardProps) {
  const href = basePath
    ? `${basePath}/${item.id}`
    : `${kindRoutes[item.kind] || '/agents'}/${item.id}`;

  return (
    <Link href={href} className="wiki-card">
      <div className="wiki-card-header">
        <span className="source-badge" style={{ background: item.ecosystem === 'copilot' ? '#1f6feb' : item.ecosystem === 'claude-code' ? '#d97706' : 'var(--grey-600)' }}>
          {ecosystemLabels[item.ecosystem]}
        </span>
        <span className="category-badge">{item.kind}</span>
      </div>
      <h3 className="wiki-card-title">{item.name}</h3>
      <p className="wiki-card-desc">{item.description}</p>
      <div className="wiki-card-meta">
        <span>{sourceLabels[item.source]}</span>
        {item.model && <span>{item.model}</span>}
        {item.featured && (
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Featured</span>
        )}
      </div>
      {item.tags.length > 0 && (
        <div className="wiki-card-tags">
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="wiki-tag">{tag}</span>
          ))}
          {item.tags.length > 4 && (
            <span className="wiki-tag wiki-tag--more">+{item.tags.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  );
}
