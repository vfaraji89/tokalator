import Link from 'next/link';

const features = [
  {
    name: 'Token Budget Dashboard',
    description: 'Activity bar sidebar panel showing real-time token usage, budget meter, and per-file breakdown. See exactly where your context budget is going.',
    command: 'View via sidebar icon',
  },
  {
    name: '@tokalator Chat Participant',
    description: 'Integrated chat commands for inline budget management directly in Copilot or Claude Chat.',
    command: '@tokalator /count, /optimize, /breakdown, /pin, /instructions, /model',
  },
  {
    name: 'Tab Relevance Scoring',
    description: 'Ranks open tabs by relevance to your current file using import analysis, path similarity, edit recency, and diagnostic context.',
    command: 'tokalator.optimize',
  },
  {
    name: 'Status Bar Indicator',
    description: 'Quick-glance budget status (LOW/MEDIUM/HIGH) in the bottom-right corner of your editor.',
    command: 'Always visible',
  },
  {
    name: 'Context Rot Warnings',
    description: 'Warns when conversation turns exceed threshold (default: 20), helping you know when to start a fresh context.',
    command: 'Automatic',
  },
  {
    name: 'Pinned Files',
    description: 'Pin important files so they are always treated as high-relevance, even if not actively edited.',
    command: '@tokalator /pin <file>',
  },
];

const settings = [
  {
    key: 'tokalator.relevanceThreshold',
    default: '0.3',
    description: 'Tabs below this relevance score are marked as distractors (0-1)',
  },
  {
    key: 'tokalator.windowSize',
    default: '1,000,000',
    description: 'Context window size in tokens (1M for Opus 4.6, 128K for older models)',
  },
  {
    key: 'tokalator.contextRotWarningTurns',
    default: '20',
    description: 'Warn about context rot after this many chat turns',
  },
  {
    key: 'tokalator.autoRefreshInterval',
    default: '2000',
    description: 'Dashboard refresh interval in milliseconds',
  },
];

export function ExtensionDocs() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <section>
        <div className="eco-divider-thick w-24" style={{ margin: 0, marginBottom: '1.5rem' }} />
        <h1 className="headline text-eco-gray-100 mb-3">
          Tokalator Extension
        </h1>
        <p className="subheadline max-w-2xl mb-4">
          Count your tokens like beads on an abacus. Real-time context budget calculator for AI coding assistants.
        </p>
        <div className="flex gap-3 items-center">
          <span className="eco-badge eco-badge-red">v0.1.0</span>
          <span className="text-xs text-eco-gray-500">VS Code 1.99+</span>
        </div>
      </section>

      {/* Installation */}
      <section>
        <h2 className="section-title">Installation</h2>
        <div className="eco-card-flat space-y-4">
          <div>
            <span className="data-label block mb-2">From VS Code Marketplace</span>
            <p className="text-sm text-eco-gray-300">
              Search for <code className="text-eco-red bg-eco-gray-900 px-1.5 py-0.5 text-xs">Tokalator</code> in the Extensions panel, or install via command palette.
            </p>
          </div>
          <div>
            <span className="data-label block mb-2">From Source</span>
            <pre className="bg-eco-gray-900 border border-eco-gray-800 p-4 text-xs text-eco-gray-300 overflow-x-auto">
{`cd copilot-context-monitor
npm install
npm run compile
# Then press F5 in VS Code to launch Extension Development Host`}
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="section-title">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div key={feature.name} className="eco-card-flat">
              <h3 className="font-serif font-bold text-sm text-eco-gray-100 mb-2">{feature.name}</h3>
              <p className="text-xs text-eco-gray-400 leading-relaxed mb-3">{feature.description}</p>
              <code className="text-[10px] text-eco-red bg-eco-gray-900 px-2 py-1">{feature.command}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Configuration */}
      <section>
        <h2 className="section-title">Configuration</h2>
        <div className="eco-card-flat overflow-x-auto">
          <table className="eco-table">
            <thead>
              <tr>
                <th>Setting</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.key}>
                  <td>
                    <code className="text-eco-red text-xs">{setting.key}</code>
                  </td>
                  <td className="text-eco-gray-300 text-sm">{setting.default}</td>
                  <td className="text-eco-gray-400 text-xs">{setting.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* User Content */}
      <section>
        <h2 className="section-title">Adding Your Content</h2>
        <div className="eco-card-flat space-y-4">
          <p className="text-sm text-eco-gray-300">
            Drop files into the <code className="text-eco-red bg-eco-gray-900 px-1.5 py-0.5 text-xs">user-content/</code> directory
            and they will be automatically discovered and shown in the catalog.
          </p>
          <pre className="bg-eco-gray-900 border border-eco-gray-800 p-4 text-xs text-eco-gray-300 overflow-x-auto">
{`user-content/
  agents/          # .agent.md files
  prompts/         # .prompt.md files
  instructions/    # .instructions.md files
  collections/     # .collection.yml files
  claude-code/     # Claude Code specific content`}
          </pre>
          <p className="text-xs text-eco-gray-500">
            Claude Code content is also auto-detected from <code className="text-eco-gray-400">CLAUDE.md</code> at the project root
            and files in the <code className="text-eco-gray-400">.claude/</code> directory.
          </p>
        </div>
      </section>

      {/* Related Tools */}
      <section>
        <h2 className="section-title">Related Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/calculator" className="stat-card transition-smooth hover:border-eco-red text-center group">
            <span className="stat-label">Calculator</span>
            <span className="text-eco-red text-lg">◇</span>
          </Link>
          <Link href="/context" className="stat-card transition-smooth hover:border-eco-red text-center group">
            <span className="stat-label">Context</span>
            <span className="text-eco-red text-lg">▣</span>
          </Link>
          <Link href="/tools" className="stat-card transition-smooth hover:border-eco-red text-center group">
            <span className="stat-label">All Tools</span>
            <span className="text-eco-red text-lg">◆</span>
          </Link>
          <Link href="/agents" className="stat-card transition-smooth hover:border-eco-red text-center group">
            <span className="stat-label">Agents</span>
            <span className="text-eco-red text-lg">⬡</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
