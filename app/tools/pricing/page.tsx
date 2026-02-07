import { ANTHROPIC_PRICING, formatCost } from '@/lib/pricing';

const models = [
  {
    name: "Claude Opus 4.5",
    tier: "Most Capable",
    input: "$5.00",
    output: "$25.00",
    cacheWrite: "$6.25",
    cacheRead: "$0.50",
    ratio: "5.0x",
  },
  {
    name: "Claude Sonnet 4.5",
    tier: "Best Value",
    input: "$3.00",
    output: "$15.00",
    cacheWrite: "$3.75",
    cacheRead: "$0.30",
    ratio: "5.0x",
    extended: {
      input: "$6.00",
      output: "$22.50",
      cacheWrite: "$7.50",
      cacheRead: "$0.60",
      ratio: "3.75x",
    },
  },
  {
    name: "Claude Haiku 4.5",
    tier: "Most Efficient",
    input: "$1.00",
    output: "$5.00",
    cacheWrite: "$1.25",
    cacheRead: "$0.10",
    ratio: "5.0x",
  },
];

const services = [
  { name: "Web Search", desc: "Real-time web search capability", price: "$10.00 / 1K searches" },
  { name: "Code Execution", desc: "Sandbox code execution environment", price: "$0.05 / execution" },
  { name: "MCP Connectors", desc: "Model Context Protocol integrations", price: "Varies by connector" },
];

const tiers = [
  { name: "Free", context: "200K", rateLimit: "Low", features: "Basic models, limited usage" },
  { name: "Pro ($20/mo)", context: "200K", rateLimit: "Higher", features: "All models, more usage, extended thinking" },
  { name: "Max ($100/mo)", context: "200K", rateLimit: "Highest", features: "Unlimited usage, priority access" },
  { name: "Team ($30/seat/mo)", context: "200K", rateLimit: "Higher", features: "Admin tools, shared workspaces" },
  { name: "Enterprise", context: "200K", rateLimit: "Custom", features: "SSO, audit logs, custom terms" },
];

export default function PricingPage() {
  return (
    <article className="article">
      <header>
        <h1>\u25ca Pricing Reference</h1>
        <p className="tagline">
          Current pricing for Claude models and services (January 2026). All prices per million tokens.
        </p>
      </header>

      {/* Model Cards */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Model Pricing</h2>
        <div className="feature-grid">
          {models.map((m) => (
            <div key={m.name} className="feature-card">
              <h3>{m.name}</h3>
              <span className="source-badge">{m.tier}</span>
              <table className="settings-table">
                <tbody>
                  <tr><td>Input</td><td><strong>{m.input}</strong></td></tr>
                  <tr><td>Output</td><td><strong>{m.output}</strong></td></tr>
                  <tr><td>Cache Write</td><td><strong>{m.cacheWrite}</strong></td></tr>
                  <tr><td>Cache Read</td><td><strong>{m.cacheRead}</strong></td></tr>
                  <tr><td>Output Ratio</td><td><strong>{m.ratio}</strong></td></tr>
                </tbody>
              </table>
              {m.extended && (
                <>
                  <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    Extended Thinking (128K context):
                  </p>
                  <table className="settings-table">
                    <tbody>
                      <tr><td>Input</td><td><strong>{m.extended.input}</strong></td></tr>
                      <tr><td>Output</td><td><strong>{m.extended.output}</strong></td></tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Additional Services */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Additional Services</h2>
        <div className="feature-grid">
          {services.map((s) => (
            <div key={s.name} className="feature-card">
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
              <span className="source-badge">{s.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Tiers */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Subscription Tiers</h2>
        <table className="settings-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Context</th>
              <th>Rate Limit</th>
              <th>Features</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.name}>
                <td><strong>{t.name}</strong></td>
                <td>{t.context}</td>
                <td>{t.rateLimit}</td>
                <td>{t.features}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Comparison Table */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Quick Comparison</h2>
        <table className="settings-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Input</th>
              <th>Output</th>
              <th>Cache Write</th>
              <th>Cache Read</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.name}>
                <td><strong>{m.name}</strong></td>
                <td>{m.input}</td>
                <td>{m.output}</td>
                <td>{m.cacheWrite}</td>
                <td>{m.cacheRead}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}
