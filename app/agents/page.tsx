import { getCatalogByKind } from '@/lib/catalog';
import { CatalogGrid } from '@/components/catalog/catalog-grid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Agents",
  description: "Browse AI agent definitions for context engineering, coding assistants, and token optimization workflows.",
};

export default function AgentsPage() {
  const agents = getCatalogByKind('agent');

  const icon = (
    <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
      <rect x="8" y="10" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="15" r="1.5" fill="#e3120b" />
      <circle cx="16" cy="15" r="1.5" fill="#e3120b" />
      <line x1="11" y1="19" x2="17" y2="19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="14" y1="6" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="5" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );

  return (
    <CatalogGrid
      items={agents}
      title="Agents"
      description="AI coding agents for Copilot and Claude Code. Browse community agents, featured picks, and your own creations."
      icon={icon}
    />
  );
}
