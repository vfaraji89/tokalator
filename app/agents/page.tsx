import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';

export default function AgentsPage() {
  const agents = getCatalogByKind('agent');

  return (
    <CatalogGrid
      items={agents}
      title="Agents"
      description="AI coding agents for Copilot and Claude Code. Browse community agents, featured picks, and your own creations."
    />
  );
}
