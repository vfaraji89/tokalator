import type { CatalogItem } from '@/lib/types/catalog';
import { CatalogCard } from './catalog-card';

interface EcosystemColumnsProps {
  items: CatalogItem[];
}

export function EcosystemColumns({ items }: EcosystemColumnsProps) {
  const copilotItems = items.filter(i => i.ecosystem === 'copilot').slice(0, 4);
  const claudeItems = items.filter(i => i.ecosystem === 'claude-code').slice(0, 4);
  const universalItems = items.filter(i => i.ecosystem === 'universal').slice(0, 4);

  return (
    <div>
      <h2 className="section-title">Browse by Ecosystem</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Copilot */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="eco-badge bg-[#1f6feb] text-white">Copilot</span>
            <span className="text-xs text-eco-gray-500">{copilotItems.length} items</span>
          </div>
          <div className="space-y-3">
            {copilotItems.map((item) => (
              <CatalogCard key={`${item.source}-${item.id}`} item={item} />
            ))}
          </div>
        </div>

        {/* Claude Code */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="eco-badge bg-[#d97706] text-white">Claude Code</span>
            <span className="text-xs text-eco-gray-500">{claudeItems.length} items</span>
          </div>
          <div className="space-y-3">
            {claudeItems.length > 0 ? (
              claudeItems.map((item) => (
                <CatalogCard key={`${item.source}-${item.id}`} item={item} />
              ))
            ) : (
              <div className="eco-card-flat text-center py-8">
                <p className="text-eco-gray-600 text-xs">
                  Add Claude Code content to <code className="text-eco-gray-400">user-content/claude-code/</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Universal */}
      {universalItems.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="eco-badge bg-eco-gray-700 text-eco-gray-200">Universal</span>
            <span className="text-xs text-eco-gray-500">{universalItems.length} items</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {universalItems.map((item) => (
              <CatalogCard key={`${item.source}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
