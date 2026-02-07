import Link from 'next/link';

const tools = [
  {
    name: 'Cost Calculator',
    description: 'Interactive token cost calculator with Cobb-Douglas quality modeling for Anthropic, OpenAI, and Google models.',
    icon: '◇',
    href: '/calculator',
  },
  {
    name: 'Context Optimizer',
    description: 'Visualize your context budget and optimize token usage for each request.',
    icon: '▣',
    href: '/context',
  },
  {
    name: 'Model Comparison',
    description: 'Compare pricing, capabilities, and efficiency across AI providers side by side.',
    icon: '⬡',
    href: '/tools/compare',
  },
  {
    name: 'Caching ROI',
    description: 'Calculate when prompt caching saves money vs. when it costs more. Break-even analysis.',
    icon: '◈',
    href: '/tools/caching',
  },
  {
    name: 'Conversation Estimator',
    description: 'Estimate multi-turn conversation costs and compare context management strategies.',
    icon: '◎',
    href: '/tools/conversation',
  },
  {
    name: 'Economic Analysis',
    description: 'Analyze costs using the Cobb-Douglas economic model and optimize your API usage.',
    icon: '◆',
    href: '/tools/analysis',
  },
  {
    name: 'Usage Tracker',
    description: 'View and manage your API usage records across models.',
    icon: '▲',
    href: '/tools/usage',
  },
  {
    name: 'Pricing Reference',
    description: 'Current pricing for Claude models and services with tier comparison.',
    icon: '◆',
    href: '/tools/pricing',
  },
];

export default function ToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="eco-divider-thick w-16" style={{ margin: 0, marginBottom: '1rem' }} />
        <h1 className="headline text-eco-gray-100">Tools</h1>
        <p className="subheadline mt-2">
          Calculators, analyzers, and optimization tools for AI token cost management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="block group">
            <div className="eco-card-flat transition-smooth group-hover:border-eco-red h-full">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-eco-red text-lg">{tool.icon}</span>
                <h3 className="font-serif font-bold text-sm text-eco-gray-100 group-hover:text-eco-red transition-colors">
                  {tool.name}
                </h3>
              </div>
              <p className="text-xs text-eco-gray-400 leading-relaxed">{tool.description}</p>
              <span className="text-[10px] text-eco-gray-600 mt-3 block group-hover:text-eco-gray-400 transition-colors">
                Open tool &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
