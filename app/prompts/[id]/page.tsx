import { getCatalogItemById, getCatalogByKind } from '@/lib/catalog';
import { CatalogDetail } from '@/components/catalog/catalog-detail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const items = getCatalogByKind('prompt');
  return items.map((item) => ({ id: item.id }));
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = getCatalogItemById(id);

  if (!item || item.kind !== 'prompt') {
    notFound();
  }

  return <CatalogDetail item={item} />;
}
