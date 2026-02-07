"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  calculateQuality, calculateCachingThreshold,
  ANTHROPIC_PRICING, formatCost,
} from "@/lib/pricing";

type ModelId = "claude-opus-4.6" | "claude-sonnet-4.5" | "claude-haiku-4.5";

const P = { red: "#e3120b", black: "#111", g7: "#555", g5: "#888", g3: "#ccc", g1: "#f3f3f3", white: "#fff" };
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };

export function EconomicAnalysis() {
  const [model, setModel] = useState<ModelId>("claude-sonnet-4.5");
  const [inputTokens, setInputTokens] = useState(100000);
  const [outputTokens, setOutputTokens] = useState(50000);
  const [cacheTokens, setCacheTokens] = useState(20000);
  const [reuses, setReuses] = useState(5);
  const [alpha, setAlpha] = useState(0.3);
  const [beta, setBeta] = useState(0.4);
  const [gamma, setGamma] = useState(0.2);
  const bq = 1.0;

  const quality = calculateQuality(inputTokens, outputTokens, cacheTokens, { alphaParam: alpha, betaParam: beta, gammaParam: gamma, baseQuality: bq });
  const cachingThreshold = calculateCachingThreshold(model);
  const pr = ANTHROPIC_PRICING[model].standard;
  const costNoCache = ((inputTokens * pr.inputCostPerMTok + outputTokens * pr.outputCostPerMTok) * reuses) / 1_000_000;
  const costCache =
    ((inputTokens - cacheTokens) * pr.inputCostPerMTok + outputTokens * pr.outputCostPerMTok + cacheTokens * pr.cacheWriteCostPerMTok + cacheTokens * pr.cacheReadCostPerMTok * (reuses - 1)) / 1_000_000 +
    (((inputTokens - cacheTokens) * pr.inputCostPerMTok + outputTokens * pr.outputCostPerMTok + cacheTokens * pr.cacheReadCostPerMTok) * (reuses - 1)) / 1_000_000;
  const savings = costNoCache - costCache;
  const roi = savings > 0 ? (savings / ((cacheTokens * pr.cacheWriteCostPerMTok) / 1_000_000)) * 100 : 0;

  const qualityCurve = useMemo(() => {
    const pts = [];
    for (let x = 10000; x <= 500000; x += 20000)
      pts.push({ tokens: x / 1000, quality: calculateQuality(x, outputTokens, cacheTokens, { alphaParam: alpha, betaParam: beta, gammaParam: gamma, baseQuality: bq }) });
    return pts;
  }, [outputTokens, cacheTokens, alpha, beta, gamma]);

  const breakEven = useMemo(() => {
    const pts = [];
    for (let r = 1; r <= 20; r++) {
      const nc = ((inputTokens * pr.inputCostPerMTok + outputTokens * pr.outputCostPerMTok) * r) / 1_000_000;
      const wc = ((inputTokens - cacheTokens) * pr.inputCostPerMTok + outputTokens * pr.outputCostPerMTok + cacheTokens * pr.cacheWriteCostPerMTok + cacheTokens * pr.cacheReadCostPerMTok * (r - 1)) / 1_000_000 +
        (((inputTokens - cacheTokens) * pr.inputCostPerMTok + outputTokens * pr.outputCostPerMTok + cacheTokens * pr.cacheReadCostPerMTok) * (r - 1)) / 1_000_000;
      pts.push({ reuses: r, noCache: +nc.toFixed(4), withCache: +wc.toFixed(4) });
    }
    return pts;
  }, [inputTokens, outputTokens, cacheTokens, pr]);

  const radar = [
    { metric: "Quality", opus: 99, sonnet: 93, haiku: 86 },
    { metric: "Speed", opus: 60, sonnet: 85, haiku: 99 },
    { metric: "Cost Eff.", opus: 40, sonnet: 70, haiku: 99 },
    { metric: "Reasoning", opus: 99, sonnet: 88, haiku: 70 },
    { metric: "Code", opus: 98, sonnet: 95, haiku: 82 },
    { metric: "Volume", opus: 30, sonnet: 75, haiku: 99 },
  ];

  const modelCosts = useMemo(() => {
    return (["claude-opus-4.6", "claude-sonnet-4.5", "claude-haiku-4.5"] as ModelId[]).map((m) => {
      const p = ANTHROPIC_PRICING[m].standard;
      return { name: m.replace("claude-", "").split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" "), cost: +((inputTokens * p.inputCostPerMTok + outputTokens * p.outputCostPerMTok) / 1_000_000).toFixed(4) };
    });
  }, [inputTokens, outputTokens]);

  const ss = { width: "100%", accentColor: P.red } as const;
  const ls = { display: "block" as const, fontSize: "0.875rem", color: P.g7, marginBottom: "0.25rem" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Quality Function */}
      <div className="eco-card-flat">
        <h2 className="section-header">Quality Function Analysis</h2>
        <p style={{ color: P.g7, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Based on the Cobb-Douglas production function: Q = X^a * Y^b * (b + Z)^y
        </p>
        <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <h3 style={{ marginBottom: "1rem" }}>Token Inputs</h3>
            {[
              { l: "Input Tokens (X)", v: inputTokens, s: setInputTokens, mn: 1000, mx: 500000, st: 1000 },
              { l: "Output Tokens (Y)", v: outputTokens, s: setOutputTokens, mn: 1000, mx: 200000, st: 1000 },
              { l: "Cache Tokens (Z)", v: cacheTokens, s: setCacheTokens, mn: 0, mx: 100000, st: 1000 },
            ].map((x) => (
              <div key={x.l} style={{ marginBottom: "1rem" }}>
                <label style={ls}>{x.l}: {x.v.toLocaleString()}</label>
                <input type="range" min={x.mn} max={x.mx} step={x.st} value={x.v} onChange={(e) => x.s(parseInt(e.target.value))} style={ss} />
              </div>
            ))}
            <h3 style={{ margin: "1.5rem 0 0.75rem" }}>Sensitivity Parameters</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "a", val: alpha, set: setAlpha, min: 0.1, max: 0.5 },
                { label: "b", val: beta, set: setBeta, min: 0.1, max: 0.5 },
                { label: "y", val: gamma, set: setGamma, min: 0.1, max: 0.4 },
              ].map((p) => (
                <div key={p.label}>
                  <label style={{ ...ls, fontSize: "0.75rem" }}>{p.label}: {p.val.toFixed(2)}</label>
                  <input type="range" min={p.min} max={p.max} step={0.05} value={p.val} onChange={(e) => p.set(parseFloat(e.target.value))} style={ss} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: P.g1, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Quality Score</h3>
            <div style={{ fontSize: "3rem", fontWeight: 700, color: P.red, marginBottom: "1rem" }}>{quality.toFixed(2)}</div>
            <div style={{ fontSize: "0.875rem" }}>
              {[
                ["Input contribution", Math.pow(inputTokens, alpha).toFixed(2)],
                ["Output contribution", Math.pow(outputTokens, beta).toFixed(2)],
                ["Cache contribution", Math.pow(bq + cacheTokens, gamma).toFixed(2)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: P.g7 }}>{label}</span>
                  <span style={{ fontFamily: "monospace" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Diminishing Returns */}
      <div className="eco-card-flat">
        <h2 className="section-header">Diminishing Returns Curve</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={qualityCurve} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
            <XAxis dataKey="tokens" stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}K`} />
            <YAxis stroke={P.g7} tick={{ fontSize: 11 }} />
            <Tooltip {...tt} formatter={(v) => [Number(v).toFixed(2), "Quality"]} />
            <Line type="monotone" dataKey="quality" stroke={P.red} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model Cost Comparison */}
      <div className="eco-card-flat">
        <h2 className="section-header">Model Cost Comparison</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={modelCosts} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
            <XAxis type="number" stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 11 }} width={90} />
            <Tooltip {...tt} formatter={(v) => [`$${Number(v).toFixed(4)}`, "Cost"]} />
            <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
              {modelCosts.map((_, i) => (<Cell key={i} fill={[P.black, P.red, P.g5][i]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Caching ROI */}
      <div className="eco-card-flat">
        <h2 className="section-header">Caching ROI Calculator</h2>
        <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={ls}>Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value as ModelId)} style={{ width: "100%", padding: "0.5rem", border: `1px solid ${P.g3}`, borderRadius: "4px", background: P.white }}>
                <option value="claude-opus-4.6">Claude Opus 4.6</option>
                <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
                <option value="claude-haiku-4.5">Claude Haiku 4.5</option>
              </select>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={ls}>Number of Reuses: {reuses}</label>
              <input type="range" min="1" max="50" value={reuses} onChange={(e) => setReuses(parseInt(e.target.value))} style={ss} />
            </div>
            <div style={{ background: P.g1, borderRadius: "8px", padding: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>Break-even Threshold</h4>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: P.red }}>{cachingThreshold.toFixed(1)} reuses</p>
            </div>
          </div>
          <div style={{ background: P.g1, borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Cost Comparison</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: P.g7 }}>Without Caching</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{formatCost(costNoCache)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: P.g7 }}>With Caching</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: savings > 0 ? P.black : P.red }}>{formatCost(costCache)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${P.g3}`, paddingTop: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: P.g7 }}>Savings</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: savings > 0 ? P.black : P.red }}>{formatCost(savings)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: P.g7 }}>ROI</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: roi > 0 ? P.black : P.red }}>{roi > 0 ? "+" : ""}{roi.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Break-Even Chart */}
      <div className="eco-card-flat">
        <h2 className="section-header">Caching Break-Even Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={breakEven} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
            <XAxis dataKey="reuses" stroke={P.g7} tick={{ fontSize: 11 }} />
            <YAxis stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip {...tt} formatter={(v) => [`$${Number(v).toFixed(4)}`]} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
            <Line type="monotone" dataKey="noCache" name="Without Cache" stroke={P.black} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="withCache" name="With Cache" stroke={P.red} strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart */}
      <div className="eco-card-flat">
        <h2 className="section-header">Model Capability Comparison</h2>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radar}>
            <PolarGrid stroke={P.g3} />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: P.g7 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} stroke={P.g3} />
            <Radar name="Opus 4.6" dataKey="opus" stroke={P.black} fill={P.black} fillOpacity={0.15} strokeWidth={2} />
            <Radar name="Sonnet 4.5" dataKey="sonnet" stroke={P.red} fill={P.red} fillOpacity={0.1} strokeWidth={2} />
            <Radar name="Haiku 4.5" dataKey="haiku" stroke={P.g5} fill={P.g5} fillOpacity={0.08} strokeWidth={2} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
            <Tooltip {...tt} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Selection Guide */}
      <div className="eco-card-flat">
        <h2 className="section-header">Model Selection Guide</h2>
        <table className="settings-table">
          <thead>
            <tr><th style={{ textAlign: "left" }}>Use Case</th><th style={{ textAlign: "center" }}>Opus 4.6</th><th style={{ textAlign: "center" }}>Sonnet 4.5</th><th style={{ textAlign: "center" }}>Haiku 4.5</th></tr>
          </thead>
          <tbody>
            {[["Complex reasoning","Best","Good","--"],["Code generation","Best","Great","Good"],["Content creation","Best","Great","Good"],["Data extraction","--","Good","Best"],["Classification","--","Good","Best"],["High-volume","--","Good","Best"],["Real-time chat","--","Best","Great"]].map(([u,o,s,h]) => (
              <tr key={u}><td>{u}</td><td style={{ textAlign: "center" }}>{o}</td><td style={{ textAlign: "center" }}>{s}</td><td style={{ textAlign: "center" }}>{h}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
