"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const P = { red: "#e3120b", black: "#111", g7: "#555", g5: "#888", g3: "#ccc", g1: "#f3f3f3", white: "#fff" };
const tt = { contentStyle: { background: P.white, border: "1px solid " + P.g3, borderRadius: 4, fontSize: 12, color: P.black } };

const models = [
  { name: "Claude Opus 4.5", tier: "Most Capable", input: "$5.00", output: "$25.00", cacheWrite: "$6.25", cacheRead: "$0.50", ratio: "5.0x", inputNum: 5, outputNum: 25 },
  {
    name: "Claude Sonnet 4.5", tier: "Best Value", input: "$3.00", output: "$15.00", cacheWrite: "$3.75", cacheRead: "$0.30", ratio: "5.0x", inputNum: 3, outputNum: 15,
    extended: { input: "$6.00", output: "$22.50", cacheWrite: "$7.50", cacheRead: "$0.60", ratio: "3.75x" },
  },
  { name: "Claude Haiku 4.5", tier: "Most Efficient", input: "$1.00", output: "$5.00", cacheWrite: "$1.25", cacheRead: "$0.10", ratio: "5.0x", inputNum: 1, outputNum: 5 },
];

const chartData = models.map((m) => ({
  name: m.name.replace("Claude ", ""),
  input: m.inputNum,
  output: m.outputNum,
}));

const services = [
  { name: "Web Search", desc: "Real-time web search capability", price: "$10.00 / 1K searches" },
  { name: "Code Execution", desc: "Sandbox code execution environment", price: "$0.05 / execution" },
  { name: "MCP Connectors", desc: "Model Context Protocol integrations", price: "Varies by connector" },
];

const tiers = [
  { name: "Free", context: "200K", rateLimit: "Low", features: "Basic models, limited usage" },
  { name: "Pro ($20/mo)", context: "200K", rateLimit: "Higher", features: "All models, higher limits" },
  { name: "Max ($100/mo)", context: "200K", rateLimit: "Highest", features: "Unlimited usage, priority access" },
  { name: "Team ($30/seat/mo)", context: "200K", rateLimit: "Higher", features: "Admin tools, shared workspaces" },
  { name: "Enterprise", context: "200K", rateLimit: "Custom", features: "SSO, audit logs, custom terms" },
];

export default function PricingPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M20 4L24 8L12 20H4V16L16 4H20Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <line x1="14" y1="8" x2="20" y2="14" stroke="#e3120b" strokeWidth="1" />
            <line x1="4" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Pricing Reference</span>
        </h1>
        <p className="hero-description">
          Current pricing for Claude models and services (January 2026). All prices per million tokens.
        </p>
      </header>

      {/* Price Visualization */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Price Comparison</h2>
        <div className="eco-card-flat">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
              <XAxis dataKey="name" stroke={P.g7} tick={{ fontSize: 12 }} />
              <YAxis stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={(v) => "$" + v} />
              <Tooltip {...tt} formatter={(v) => ["$" + Number(v).toFixed(2) + "/MTok"]} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="input" name="Input Cost" radius={[4, 4, 0, 0]} fill={P.black} />
              <Bar dataKey="output" name="Output Cost" radius={[4, 4, 0, 0]} fill={P.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Model Cards */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Model Pricing</h2>
        <div className="feature-grid">
          {models.map((m) => (
            <div key={m.name} className="eco-card-flat">
              <h3 style={{ margin: "0 0 4px" }}>{m.name}</h3>
              <span className="badge">{m.tier}</span>
              <table className="settings-table" style={{ marginTop: 12 }}>
                <tbody>
                  <tr><td>Input</td><td><strong>{m.input}</strong></td></tr>
                  <tr><td>Output</td><td><strong>{m.output}</strong></td></tr>
                  <tr><td>Cache Write</td><td><strong>{m.cacheWrite}</strong></td></tr>
                  <tr><td>Cache Read</td><td><strong>{m.cacheRead}</strong></td></tr>
                  <tr><td>Output/Input</td><td><strong>{m.ratio}</strong></td></tr>
                </tbody>
              </table>
              {m.extended && (
                <>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 12 }}>
                    Extended Thinking (128K budget):
                  </p>
                  <table className="settings-table">
                    <tbody>
                      <tr><td>Input</td><td><strong>{m.extended.input}</strong></td></tr>
                      <tr><td>Output</td><td><strong>{m.extended.output}</strong></td></tr>
                      <tr><td>Cache Write</td><td><strong>{m.extended.cacheWrite}</strong></td></tr>
                      <tr><td>Cache Read</td><td><strong>{m.extended.cacheRead}</strong></td></tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Additional Services</h2>
        <div className="feature-grid">
          {services.map((s) => (
            <div key={s.name} className="eco-card-flat">
              <h3 style={{ margin: "0 0 4px" }}>{s.name}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 8px" }}>{s.desc}</p>
              <strong>{s.price}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">API Tiers</h2>
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
