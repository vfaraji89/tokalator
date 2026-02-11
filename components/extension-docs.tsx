import Link from 'next/link';

const features = [
  {
    name: 'Token Budget Dashboard',
    description: 'Activity bar sidebar panel showing real-time token usage, budget meter, per-file breakdown, and active tokenizer info.',
    command: 'View via sidebar icon',
  },
  {
    name: '@tokalator Chat Participant',
    description: 'Eleven chat commands for inline budget management directly in Copilot Chat.',
    command: '@tokalator /count, /optimize, /breakdown, /pin, /unpin, /instructions, /model, /compaction, /preview, /reset, /exit',
  },
  {
    name: 'Tab Relevance Scoring',
    description: 'Ranks open tabs by relevance using import analysis, path similarity, edit recency, and diagnostics.',
    command: 'tokalator.optimize',
  },
  {
    name: 'Model-Specific Tokenizers',
    description: 'Real BPE tokenizers per provider — Claude BPE for Anthropic, o200k_base for OpenAI. No more guessing at 4 chars per token.',
    command: '@tokalator /model',
  },
  {
    name: '14 Model Profiles',
    description: 'Built-in profiles for Opus 4.6, Sonnet 4.5/4, Haiku 4.5, GPT-5.2, GPT-5.2 Codex, GPT-5.1, GPT-5 Mini, GPT-4.1, o3, o4-mini, Gemini 3 Pro/Flash, Gemini 2.5 Pro.',
    command: 'Settings: tokalator.model',
  },
  {
    name: 'Context Rot Warnings',
    description: 'Warns when conversation turns exceed the model\'s threshold. Each model has its own rot limit based on benchmarks.',
    command: 'Automatic',
  },
  {
    name: 'Pinned Files',
    description: 'Pin important files so they are always treated as high-relevance in context scoring.',
    command: '@tokalator /pin <file>',
  },
  {
    name: 'Instruction File Scanner',
    description: 'Finds all instruction files in your workspace (.instructions.md, .prompt.md, AGENTS.md, .cursorrules) and counts their real token cost.',
    command: '@tokalator /instructions',
  },
  {
    name: 'Next Turn Preview',
    description: 'See estimated token cost of your next message before sending. Dashboard shows a live preview box with growth projections and overflow warnings.',
    command: '@tokalator /preview',
  },
  {
    name: 'Session Management',
    description: 'Track per-turn context growth with compaction analysis. Reset sessions, save summaries, and see last session stats on activation.',
    command: '@tokalator /compaction, /reset, /exit',
  },
];

const settings = [
  {
    key: 'tokalator.model',
    default: 'claude-opus-4.6',
    description: 'AI model to calculate context budget against. Sets tokenizer, context window, and rot threshold automatically.',
  },
  {
    key: 'tokalator.relevanceThreshold',
    default: '0.3',
    description: 'Tabs below this relevance score are marked as distractors (0–1)',
  },
  {
    key: 'tokalator.windowSize',
    default: '1,000,000',
    description: 'Override context window size in tokens. Leave at default to use the selected model\'s window.',
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
          <span className="eco-badge eco-badge-red">v3.1.1</span>
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
{`cd tokalator/tokalator-extension-vs
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
