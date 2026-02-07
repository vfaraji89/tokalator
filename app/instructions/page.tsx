import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';

export default function InstructionsPage() {
  const instructions = getCatalogByKind('instruction');

  const icon = (
    <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="4" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="9" y1="10" x2="19" y2="10" stroke="#e3120b" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
      <line x1="9" y1="18" x2="15" y2="18" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
    </svg>
  );

  return (
    <CatalogGrid
      items={instructions}
      title="Instructions"
      description="Coding guidelines and custom instructions for AI assistants. Define project conventions and engineering standards."
      icon={icon}
    />
  );
}
