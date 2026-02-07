import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';

export default function InstructionsPage() {
  const instructions = getCatalogByKind('instruction');

  return (
    <CatalogGrid
      items={instructions}
      title="Instructions"
      description="Coding guidelines and custom instructions for AI assistants. Define project conventions and engineering standards."
    />
  );
}
