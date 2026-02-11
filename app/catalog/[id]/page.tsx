import { getCatalogItemById, scanCatalog } from '@/lib/catalog';
import { CatalogDetail } from '@/components/catalog/catalog-detail';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  const catalog = scanCatalog();
  return catalog.items.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getCatalogItemById(id);
  return {
    title: item ? item.name : "Catalog Item",
    description: item?.description || "Catalog detail page",
  };
}

export default async function CatalogDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = getCatalogItemById(id);

  if (!item) {
    notFound();
  }

  return <CatalogDetail item={item} />;
}
