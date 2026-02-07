import type { CatalogItem } from '@/lib/types/catalog';
import { CatalogCard } from './catalog-card';

interface FeaturedCardsProps {
  items: CatalogItem[];
  title: string;
}

export function FeaturedCards({ items, title }: FeaturedCardsProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="section-title">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0, 6).map((item) => (
          <CatalogCard key={`${item.source}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}
