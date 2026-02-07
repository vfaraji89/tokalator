import { getCatalogItemById, getCatalogByKind } from '@/lib/catalog';
import { CatalogDetail } from '@/components/catalog/catalog-detail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const items = getCatalogByKind('collection');
  return items.map((item) => ({ id: item.id }));
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = getCatalogItemById(id);

  if (!item || item.kind !== 'collection') {
    notFound();
  }

  return <CatalogDetail item={item} />;
}
