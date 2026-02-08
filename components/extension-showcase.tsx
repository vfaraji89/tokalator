import Link from 'next/link';
import type { Catalog } from '@/lib/types/catalog';
import { StatBar } from './catalog/stat-bar';
import { FeaturedCards } from './catalog/featured-cards';
import { EcosystemColumns } from './catalog/ecosystem-columns';

interface ExtensionShowcaseProps {
  catalog: Catalog;
}

const extensionFeatures = [
  {
    name: 'Token Budget Monitor',
    description: 'Real-time context window tracking with budget visualization and warnings.',
    icon: '▣',
    route: '/context',
    category: 'monitor',
  },
  {
    name: 'Cost Calculator',
    description: 'Interactive token cost calculator with Cobb-Douglas quality modeling.',
    icon: '◇',
    route: '/calculator',
    category: 'calculator',
  },
  {
    name: 'Caching ROI Analyzer',
    description: 'Break-even analysis for prompt caching with reuse optimization.',
    icon: '◈',
    route: '/tools/caching',
    category: 'analyzer',
  },
  {
    name: 'Tab Relevance Scoring',
    description: 'Ranks open tabs by relevance to your current work using imports, edits, and diagnostics.',
    icon: '⬡',
    category: 'monitor',
  },
  {
    name: 'Chat Participant',
    description: '@tokalator chat commands: /count, /optimize, /pin, /breakdown, /instructions, /model for inline budget management.',
    icon: '◎',
    category: 'monitor',
  },
  {
    name: 'Multi-Provider Compare',
    description: 'Compare costs and capabilities across Anthropic, OpenAI, and Google models.',
    icon: '◆',
    route: '/tools/compare',
    category: 'analyzer',
  },
];

const quickLinks = [
  { href: '/agents', label: 'Agents', count: 0 },
  { href: '/prompts', label: 'Prompts', count: 0 },
  { href: '/instructions', label: 'Instructions', count: 0 },
  { href: '/collections', label: 'Collections', count: 0 },
];

export function ExtensionShowcase({ catalog }: ExtensionShowcaseProps) {
  const featuredAgents = catalog.items.filter(i => i.kind === 'agent' && i.featured);
  const featuredPrompts = catalog.items.filter(i => i.kind === 'prompt' && i.featured);

  const links = quickLinks.map(l => ({
    ...l,
    count: catalog.stats.byKind[l.label.toLowerCase().slice(0, -1) as keyof typeof catalog.stats.byKind] || 0,
  }));

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero */}
      <section>
        <div className="eco-divider-thick w-24" style={{ margin: 0, marginBottom: '1.5rem' }} />
        <h1 className="headline text-eco-gray-100 mb-3">
          Tokalator
        </h1>
        <p className="subheadline max-w-2xl mb-4">
          Context engineering platform for AI coding assistants.
          Monitor tokens, optimize context, and browse a curated catalog of agents, prompts, and tools.
        </p>
        <div className="flex gap-2">
          <span className="eco-badge bg-[#1f6feb] text-white">Copilot</span>
          <span className="eco-badge bg-[#d97706] text-white">Claude Code</span>
          <span className="eco-badge bg-eco-gray-700 text-eco-gray-200">Universal</span>
        </div>
      </section>

      {/* Stats */}
      <section>
        <StatBar stats={catalog.stats} />
      </section>

      {/* Extension Features Grid */}
      <section>
        <h2 className="section-title">Extension Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extensionFeatures.map((feature) => (
            <div key={feature.name} className="eco-card-flat group transition-smooth hover:border-eco-gray-600">
              {feature.route ? (
                <Link href={feature.route} className="block">
                  <FeatureContent feature={feature} />
                </Link>
              ) : (
                <FeatureContent feature={feature} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Agents */}
      <section>
        <FeaturedCards items={featuredAgents} title="Featured Agents" />
      </section>

      {/* Featured Prompts */}
      <section>
        <FeaturedCards items={featuredPrompts} title="Featured Prompts" />
      </section>

      {/* Ecosystem Columns */}
      <section>
        <EcosystemColumns items={catalog.items} />
      </section>

      {/* Quick Browse */}
      <section>
        <h2 className="section-title">Browse Catalog</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block group">
              <div className="stat-card transition-smooth group-hover:border-eco-red">
                <span className="stat-label">{link.label}</span>
                <span className="stat-value text-eco-gray-100 group-hover:text-eco-red transition-colors">
                  {link.count}
                </span>
                <span className="text-xs text-eco-gray-600 group-hover:text-eco-gray-400 transition-colors">
                  Browse all &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* User Content CTA */}
      <section className="eco-card-flat border-dashed border-eco-gray-700">
        <div className="text-center py-4">
          <h3 className="font-serif font-bold text-eco-gray-200 mb-2">Add Your Own Content</h3>
          <p className="text-xs text-eco-gray-500 max-w-lg mx-auto mb-3">
            Drop your <code className="text-eco-red">.agent.md</code>, <code className="text-eco-red">.prompt.md</code>,
            or <code className="text-eco-red">.instructions.md</code> files into
            the <code className="text-eco-gray-400">user-content/</code> directory and they will appear here automatically.
          </p>
          <Link
            href="/extension"
            className="text-xs text-eco-red hover:underline font-semibold uppercase tracking-wider"
          >
            Learn More &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureContent({ feature }: { feature: typeof extensionFeatures[number] }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-eco-red text-lg">{feature.icon}</span>
        <h3 className="font-serif font-bold text-sm text-eco-gray-100 group-hover:text-eco-red transition-colors">
          {feature.name}
        </h3>
      </div>
      <p className="text-xs text-eco-gray-400 leading-relaxed">{feature.description}</p>
      {feature.route && (
        <span className="text-[10px] text-eco-gray-600 mt-2 block group-hover:text-eco-gray-400 transition-colors">
          Open tool &rarr;
        </span>
      )}
    </>
  );
}
