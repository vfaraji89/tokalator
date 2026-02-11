import { getCatalogByKind, getCatalogStats } from '@/lib/catalog';
import { CatalogGridUnified } from '@/components/catalog/catalog-grid-unified';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse agents, prompts, instructions, and collections for AI coding assistants — Copilot, Claude Code, and more.",
};

export default function CatalogPage() {
  const agents = getCatalogByKind('agent');
  const prompts = getCatalogByKind('prompt');
  const instructions = getCatalogByKind('instruction');
  const collections = getCatalogByKind('collection');
  const stats = getCatalogStats();

  const allItems = [...agents, ...prompts, ...instructions, ...collections];

  return (
    <CatalogGridUnified
      items={allItems}
      stats={stats}
    />
  );
}
