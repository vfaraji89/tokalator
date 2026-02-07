import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';

export default function CollectionsPage() {
  const collections = getCatalogByKind('collection');

  return (
    <CatalogGrid
      items={collections}
      title="Collections"
      description="Curated bundles of agents, prompts, and instructions organized by topic or workflow."
    />
  );
}
