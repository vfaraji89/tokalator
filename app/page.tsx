import { scanCatalog } from '@/lib/catalog';
import { ExtensionShowcase } from '@/components/extension-showcase';

export default function HomePage() {
  const catalog = scanCatalog();
  return <ExtensionShowcase catalog={catalog} />;
}
