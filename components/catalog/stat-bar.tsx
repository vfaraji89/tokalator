import type { CatalogStats } from '@/lib/types/catalog';

interface StatBarProps {
  stats: CatalogStats;
}

export function StatBar({ stats }: StatBarProps) {
  const statItems = [
    { label: 'Total Items', value: stats.totalItems },
    { label: 'Agents', value: stats.byKind.agent },
    { label: 'Prompts', value: stats.byKind.prompt },
    { label: 'Instructions', value: stats.byKind.instruction },
    { label: 'Collections', value: stats.byKind.collection },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {statItems.map((item) => (
        <div key={item.label} className="stat-card">
          <span className="stat-label">{item.label}</span>
          <span className="stat-value text-eco-gray-100">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
