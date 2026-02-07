import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated collections of prompts, agents, and instructions for context engineering workflows.",
};

export default function CollectionsPage() {
  const collections = getCatalogByKind('collection');

  const icon = (
    <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
      <path d="M4 8C4 7 5 6 6 6H11L13 8H22C23 8 24 9 24 10V21C24 22 23 23 22 23H6C5 23 4 22 4 21V8Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="9" y1="14" x2="19" y2="14" stroke="#e3120b" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
    </svg>
  );

  return (
    <CatalogGrid
      items={collections}
      title="Collections"
      description="Curated bundles of agents, prompts, and instructions organized by topic or workflow."
      icon={icon}
    />
  );
}
