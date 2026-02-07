import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';

export default function PromptsPage() {
  const prompts = getCatalogByKind('prompt');

  return (
    <CatalogGrid
      items={prompts}
      title="Prompts"
      description="Reusable prompt templates for context mapping, refactoring, and AI-assisted development."
    />
  );
}
