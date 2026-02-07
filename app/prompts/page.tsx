import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';

export default function PromptsPage() {
  const prompts = getCatalogByKind('prompt');

  const icon = (
    <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
      <path d="M4 6C4 5 5 4 6 4H22C23 4 24 5 24 6V18C24 19 23 20 22 20H12L7 24V20H6C5 20 4 19 4 18V6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="9" y1="10" x2="19" y2="10" stroke="#e3120b" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
    </svg>
  );

  return (
    <CatalogGrid
      items={prompts}
      title="Prompts"
      description="Reusable prompt templates for context mapping, refactoring, and AI-assisted development."
      icon={icon}
    />
  );
}
