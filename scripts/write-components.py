#!/usr/bin/env python3
"""Write the rewritten component files."""
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Economic Analysis component
economic_analysis = '''"use client";

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
            <Tooltip {...tt} formatter={(v: number) => [v.toFixed(2), "Quality"]} />
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
            <Tooltip {...tt} formatter={(v: number) => [`$${v.toFixed(4)}`, "Cost"]} />
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
            <Tooltip {...tt} formatter={(v: number) => [`$${v.toFixed(4)}`]} />
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
'''

with open(os.path.join(BASE, "components", "economic-analysis.tsx"), "w") as f:
    f.write(economic_analysis)
print("Wrote economic-analysis.tsx")

# Usage Tracker with charts
usage_tracker = '''"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { calculateCost, formatCost } from "@/lib/pricing";

type ModelId = "claude-opus-4.6" | "claude-sonnet-4.5" | "claude-haiku-4.5";

const P = { red: "#e3120b", black: "#111", g7: "#555", g5: "#888", g3: "#ccc", g1: "#f3f3f3", white: "#fff" };
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };

interface UsageRecord {
  id: string; date: string; model: ModelId; project: string;
  inputTokens: number; outputTokens: number;
  cacheWriteTokens: number; cacheReadTokens: number; cost: number;
}

const sampleUsage: UsageRecord[] = [
  { id: "1", date: "2026-01-31", model: "claude-haiku-4.5", project: "Default Project", inputTokens: 20000, outputTokens: 10000, cacheWriteTokens: 5000, cacheReadTokens: 10000, cost: 0.08 },
  { id: "2", date: "2026-01-30", model: "claude-opus-4.6", project: "Default Project", inputTokens: 20000, outputTokens: 25000, cacheWriteTokens: 2000, cacheReadTokens: 5000, cost: 0.68 },
  { id: "3", date: "2026-01-29", model: "claude-sonnet-4.5", project: "Default Project", inputTokens: 80000, outputTokens: 35000, cacheWriteTokens: 20000, cacheReadTokens: 10000, cost: 1.34 },
  { id: "4", date: "2026-01-28", model: "claude-sonnet-4.5", project: "Default Project", inputTokens: 250000, outputTokens: 60000, cacheWriteTokens: 50000, cacheReadTokens: 30000, cost: 3.68 },
];

const MODEL_LABELS: Record<ModelId, string> = {
  "claude-opus-4.6": "Opus 4.6",
  "claude-sonnet-4.5": "Sonnet 4.5",
  "claude-haiku-4.5": "Haiku 4.5",
};

const MODEL_COLORS: Record<ModelId, string> = {
  "claude-opus-4.6": P.black,
  "claude-sonnet-4.5": P.red,
  "claude-haiku-4.5": P.g5,
};

export function UsageTracker() {
  const [usage, setUsage] = useState<UsageRecord[]>(sampleUsage);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({ model: "claude-sonnet-4.5" as ModelId, inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 });

  const totalCost = usage.reduce((s, r) => s + r.cost, 0);
  const totalTokens = usage.reduce((s, r) => s + r.inputTokens + r.outputTokens + r.cacheWriteTokens + r.cacheReadTokens, 0);

  // Chart data
  const costByDate = useMemo(() => usage.map(r => ({ date: r.date.slice(5), cost: r.cost, model: MODEL_LABELS[r.model] })).reverse(), [usage]);

  const costByModel = useMemo(() => {
    const map: Record<string, number> = {};
    usage.forEach(r => { map[MODEL_LABELS[r.model]] = (map[MODEL_LABELS[r.model]] || 0) + r.cost; });
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(4) }));
  }, [usage]);

  const tokenBreakdown = useMemo(() => {
    let inp = 0, out = 0, cw = 0, cr = 0;
    usage.forEach(r => { inp += r.inputTokens; out += r.outputTokens; cw += r.cacheWriteTokens; cr += r.cacheReadTokens; });
    return [
      { name: "Input", value: inp },
      { name: "Output", value: out },
      { name: "Cache Write", value: cw },
      { name: "Cache Read", value: cr },
    ];
  }, [usage]);

  const pieColors = [P.black, P.red, P.g5, P.g3];

  const handleAddRecord = () => {
    const costBreakdown = calculateCost(newRecord.model, { inputTokens: newRecord.inputTokens, outputTokens: newRecord.outputTokens, cacheWriteTokens: newRecord.cacheWriteTokens, cacheReadTokens: newRecord.cacheReadTokens, promptLength: newRecord.inputTokens });
    const record: UsageRecord = { ...newRecord, id: Date.now().toString(), date: new Date().toISOString().split("T")[0], project: "Default Project", cost: costBreakdown.totalCost };
    setUsage([record, ...usage]);
    setShowAddForm(false);
    setNewRecord({ model: "claude-sonnet-4.5", inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Summary Cards */}
      <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[
          ["Total Cost", formatCost(totalCost)],
          ["Total Tokens", `${(totalTokens / 1000).toFixed(1)}K`],
          ["Records", String(usage.length)],
        ].map(([label, value]) => (
          <div key={label} className="feature-card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: P.g7 }}>{label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="eco-card-flat">
          <h3 className="section-header">Cost by Date</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costByDate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
              <XAxis dataKey="date" stroke={P.g7} tick={{ fontSize: 10 }} />
              <YAxis stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip {...tt} formatter={(v: number) => [`$${v.toFixed(4)}`]} />
              <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
                {costByDate.map((entry, i) => {
                  const m = usage.find(u => u.date.slice(5) === entry.date)?.model || "claude-sonnet-4.5";
                  return <Cell key={i} fill={MODEL_COLORS[m]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="eco-card-flat">
          <h3 className="section-header">Token Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={tokenBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {tokenBreakdown.map((_, i) => (<Cell key={i} fill={pieColors[i]} />))}
              </Pie>
              <Tooltip {...tt} formatter={(v: number) => [`${(v / 1000).toFixed(1)}K tokens`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost by Model */}
      <div className="eco-card-flat">
        <h3 className="section-header">Cost by Model</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={costByModel} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
            <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10 }} width={70} />
            <Tooltip {...tt} formatter={(v: number) => [`$${v.toFixed(4)}`]} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {costByModel.map((entry, i) => {
                const color = entry.name.includes("Opus") ? P.black : entry.name.includes("Sonnet") ? P.red : P.g5;
                return <Cell key={i} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Add Record */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: "0.5rem 1rem", background: P.black, color: P.white, border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" }}>
          {showAddForm ? "Cancel" : "Add Usage Record"}
        </button>
      </div>

      {showAddForm && (
        <div className="eco-card-flat">
          <h3 style={{ marginBottom: "1rem" }}>Add Usage Record</h3>
          <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: P.g7, marginBottom: "0.25rem" }}>Model</label>
              <select value={newRecord.model} onChange={(e) => setNewRecord({ ...newRecord, model: e.target.value as ModelId })} style={{ width: "100%", padding: "0.375rem", border: `1px solid ${P.g3}`, borderRadius: "4px" }}>
                <option value="claude-opus-4.6">Opus 4.6</option>
                <option value="claude-sonnet-4.5">Sonnet 4.5</option>
                <option value="claude-haiku-4.5">Haiku 4.5</option>
              </select>
            </div>
            {[["Input", "inputTokens"], ["Output", "outputTokens"], ["Cache Write", "cacheWriteTokens"], ["Cache Read", "cacheReadTokens"]].map(([label, key]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "0.75rem", color: P.g7, marginBottom: "0.25rem" }}>{label}</label>
                <input type="number" value={(newRecord as Record<string, number>)[key]} onChange={(e) => setNewRecord({ ...newRecord, [key]: parseInt(e.target.value) || 0 })} style={{ width: "100%", padding: "0.375rem", border: `1px solid ${P.g3}`, borderRadius: "4px" }} />
              </div>
            ))}
          </div>
          <button onClick={handleAddRecord} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: P.red, color: P.white, border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" }}>Save Record</button>
        </div>
      )}

      {/* Usage Table */}
      <div className="eco-card-flat" style={{ overflow: "hidden" }}>
        <table className="settings-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Date</th>
              <th style={{ textAlign: "left" }}>Model</th>
              <th style={{ textAlign: "right" }}>Input</th>
              <th style={{ textAlign: "right" }}>Output</th>
              <th style={{ textAlign: "right" }}>Cache</th>
              <th style={{ textAlign: "right" }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td><span style={{ display: "inline-block", padding: "0.125rem 0.5rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500, background: P.g1, border: `1px solid ${P.g3}` }}>{MODEL_LABELS[r.model]}</span></td>
                <td style={{ textAlign: "right" }}>{(r.inputTokens / 1000).toFixed(1)}K</td>
                <td style={{ textAlign: "right" }}>{(r.outputTokens / 1000).toFixed(1)}K</td>
                <td style={{ textAlign: "right", fontSize: "0.8125rem", color: P.g7 }}>W:{(r.cacheWriteTokens / 1000).toFixed(1)}K R:{(r.cacheReadTokens / 1000).toFixed(1)}K</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCost(r.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'''

with open(os.path.join(BASE, "components", "usage-tracker.tsx"), "w") as f:
    f.write(usage_tracker)
print("Wrote usage-tracker.tsx")

# Cost Calculator with chart
cost_calc = '''"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
  calculateCost, calculateQuality, formatCost, formatTokens,
  getModelInfo, ANTHROPIC_PRICING, MODEL_PARAMS, type CostBreakdown,
} from "@/lib/pricing";

const models = ["claude-opus-4.6", "claude-sonnet-4.5", "claude-haiku-4.5"] as const;
const P = { red: "#e3120b", black: "#111", g7: "#555", g5: "#888", g3: "#ccc", g1: "#f3f3f3", white: "#fff" };
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };

export function CostCalculator() {
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4.5");
  const [inputTokens, setInputTokens] = useState<number>(10000);
  const [outputTokens, setOutputTokens] = useState<number>(5000);
  const [cacheWriteTokens, setCacheWriteTokens] = useState<number>(0);
  const [cacheReadTokens, setCacheReadTokens] = useState<number>(0);
  const [webSearches, setWebSearches] = useState<number>(0);
  const [codeExecMinutes, setCodeExecMinutes] = useState<number>(0);
  const [promptLength, setPromptLength] = useState<number>(0);

  const modelInfo = getModelInfo(selectedModel);
  const params = MODEL_PARAMS[selectedModel];
  const cost: CostBreakdown = calculateCost(selectedModel, { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, promptLength }, { webSearches, codeExecMinutes });
  const qualityScore = calculateQuality(inputTokens, outputTokens, cacheWriteTokens + cacheReadTokens, params);
  const isSonnet = selectedModel === "claude-sonnet-4.5";
  const isExtendedContext = isSonnet && promptLength > 200000;

  // Cross-model cost comparison
  const crossModelCost = useMemo(() => {
    return models.map((m) => {
      const c = calculateCost(m, { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, promptLength }, { webSearches, codeExecMinutes });
      return { name: m.replace("claude-", "").split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" "), cost: c.totalCost };
    });
  }, [inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, promptLength, webSearches, codeExecMinutes]);

  // Cost breakdown pie
  const breakdownPie = useMemo(() => {
    return [
      { name: "Input", value: cost.inputCost },
      { name: "Output", value: cost.outputCost },
      { name: "Cache Write", value: cost.cacheWriteCost },
      { name: "Cache Read", value: cost.cacheReadCost },
      { name: "Web Search", value: cost.webSearchCost },
      { name: "Code Exec", value: cost.codeExecCost },
    ].filter(x => x.value > 0);
  }, [cost]);

  const pieColors = [P.black, P.red, P.g5, P.g3, "#333", "#999"];
  const inputStyle = { width: "100%", padding: "0.375rem 0.5rem", border: `1px solid ${P.g3}`, borderRadius: "4px", fontSize: "0.875rem" };
  const labelStyle = { display: "block" as const, fontSize: "0.8125rem", color: P.g7, marginBottom: "0.25rem" };

  return (
    <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {/* Input Panel */}
      <div className="eco-card-flat">
        <h2 className="section-header">Token Input</h2>
        {/* Model Selection */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Model</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            {models.map((model) => {
              const info = getModelInfo(model);
              return (
                <button key={model} onClick={() => setSelectedModel(model)}
                  style={{ padding: "0.75rem", border: selectedModel === model ? `2px solid ${P.red}` : `2px solid ${P.g3}`, borderRadius: "8px", background: selectedModel === model ? P.g1 : P.white, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}>
                  {info.displayName.split(" ").slice(1).join(" ")}
                </button>
              );
            })}
          </div>
          <p style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: P.g5 }}>{modelInfo.description}</p>
        </div>

        {isSonnet && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: P.g1, borderRadius: "8px" }}>
            <label style={labelStyle}>Prompt Length (for tiered pricing)</label>
            <input type="number" value={promptLength} onChange={(e) => setPromptLength(Number(e.target.value))} style={inputStyle} placeholder="0" />
            <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: P.g7 }}>
              {isExtendedContext ? "Extended context pricing applies (>200K tokens)" : "Standard pricing (<=200K tokens)"}
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            ["Input Tokens", inputTokens, setInputTokens],
            ["Output Tokens", outputTokens, setOutputTokens],
          ].map(([label, val, setter]) => (
            <div key={label as string}>
              <label style={labelStyle}>{label as string}</label>
              <input type="number" value={val as number} onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))} style={inputStyle} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              ["Cache Write Tokens", cacheWriteTokens, setCacheWriteTokens],
              ["Cache Read Tokens", cacheReadTokens, setCacheReadTokens],
              ["Web Searches", webSearches, setWebSearches],
              ["Code Exec (min)", codeExecMinutes, setCodeExecMinutes],
            ].map(([label, val, setter]) => (
              <div key={label as string}>
                <label style={labelStyle}>{label as string}</label>
                <input type="number" value={val as number} onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ marginTop: "1.5rem" }}>
          <label style={labelStyle}>Quick Presets</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[{ l: "Small", i: 1000, o: 500 }, { l: "Medium", i: 10000, o: 5000 }, { l: "Large", i: 100000, o: 50000 }, { l: "XL", i: 500000, o: 100000 }].map(p => (
              <button key={p.l} onClick={() => { setInputTokens(p.i); setOutputTokens(p.o); }}
                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", background: P.g1, border: `1px solid ${P.g3}`, borderRadius: "4px", cursor: "pointer" }}>{p.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Total Cost */}
        <div style={{ background: P.black, borderRadius: "12px", padding: "1.5rem", color: P.white }}>
          <h3 style={{ fontSize: "1rem", opacity: 0.8 }}>Total Cost</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, marginTop: "0.5rem" }}>{formatCost(cost.totalCost)}</div>
          <div style={{ fontSize: "0.875rem", opacity: 0.6, marginTop: "0.25rem" }}>{formatTokens(inputTokens + outputTokens)} total tokens</div>
        </div>

        {/* Cost Breakdown */}
        <div className="eco-card-flat">
          <h3 className="section-header">Cost Breakdown</h3>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              {[
                { label: "Input Tokens", value: cost.inputCost, tokens: inputTokens },
                { label: "Output Tokens", value: cost.outputCost, tokens: outputTokens },
                { label: "Cache Write", value: cost.cacheWriteCost, tokens: cacheWriteTokens },
                { label: "Cache Read", value: cost.cacheReadCost, tokens: cacheReadTokens },
                { label: "Web Search", value: cost.webSearchCost },
                { label: "Code Exec", value: cost.codeExecCost },
              ].filter(x => x.value > 0).map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                  <span style={{ color: P.g7 }}>{item.label}{item.tokens ? ` (${formatTokens(item.tokens)})` : ""}</span>
                  <span style={{ fontWeight: 600 }}>{formatCost(item.value)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${P.g3}`, paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: P.red }}>{formatCost(cost.totalCost)}</span>
              </div>
            </div>
            {breakdownPie.length > 1 && (
              <div style={{ width: "140px", height: "140px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownPie} cx="50%" cy="50%" outerRadius={60} innerRadius={30} dataKey="value" paddingAngle={2}>
                      {breakdownPie.map((_, i) => (<Cell key={i} fill={pieColors[i]} />))}
                    </Pie>
                    <Tooltip {...tt} formatter={(v: number) => [formatCost(v)]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Cross-model comparison */}
        <div className="eco-card-flat">
          <h3 className="section-header">Cross-Model Comparison</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={crossModelCost} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
              <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
              <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10 }} width={70} />
              <Tooltip {...tt} formatter={(v: number) => [formatCost(v), "Cost"]} />
              <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
                {crossModelCost.map((_, i) => (<Cell key={i} fill={[P.black, P.red, P.g5][i]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quality Score */}
        <div className="eco-card-flat">
          <h3 className="section-header">Quality Metrics (Cobb-Douglas)</h3>
          <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "1rem", background: P.g1, borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "0.8125rem", color: P.g5 }}>Quality Score</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{qualityScore.toFixed(2)}</div>
            </div>
            <div style={{ padding: "1rem", background: P.g1, borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "0.8125rem", color: P.g5 }}>Cost per Quality</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{formatCost(cost.totalCost / (qualityScore || 1))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'''

with open(os.path.join(BASE, "components", "cost-calculator.tsx"), "w") as f:
    f.write(cost_calc)
print("Wrote cost-calculator.tsx")

# Context Optimizer with black/red/gray palette
context_opt = '''"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  analyzeContextBudget, estimateTokens, formatTokenCount,
  calculateRemainingTurns, getModelLimits,
} from "@/lib/context";
import { getModelInfo, formatCost, calculateCost } from "@/lib/pricing";

const models = ["claude-opus-4.6", "claude-sonnet-4.5", "claude-haiku-4.5"] as const;
const P = { red: "#e3120b", black: "#111", g7: "#555", g5: "#888", g3: "#ccc", g1: "#f3f3f3", white: "#fff" };
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };

export function ContextOptimizer() {
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4.5");
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userMessage, setUserMessage] = useState<string>("");
  const [reservedOutput, setReservedOutput] = useState<number>(4000);

  const limits = getModelLimits(selectedModel);
  const systemTokens = useMemo(() => estimateTokens(systemPrompt), [systemPrompt]);
  const userTokens = useMemo(() => estimateTokens(userMessage), [userMessage]);
  const analysis = useMemo(() => analyzeContextBudget({ systemPromptTokens: systemTokens, userInputTokens: userTokens, reservedOutputTokens: reservedOutput, model: selectedModel }), [systemTokens, userTokens, reservedOutput, selectedModel]);
  const remainingTurns = calculateRemainingTurns(systemTokens + userTokens, userTokens + reservedOutput, selectedModel);
  const estimatedCost = useMemo(() => calculateCost(selectedModel, { inputTokens: systemTokens + userTokens, outputTokens: reservedOutput, promptLength: systemTokens + userTokens }), [selectedModel, systemTokens, userTokens, reservedOutput]);

  // Pie chart data for context budget
  const budgetPie = useMemo(() => [
    { name: "System", value: analysis.breakdown.systemPrompt.tokens, color: P.black },
    { name: "User", value: analysis.breakdown.userInput.tokens, color: P.red },
    { name: "Output", value: analysis.breakdown.reservedOutput.tokens, color: P.g5 },
    { name: "Free", value: analysis.breakdown.free.tokens, color: P.g3 },
  ], [analysis]);

  // Cross-model cost comparison
  const crossModelCost = useMemo(() => {
    return models.map(m => {
      const c = calculateCost(m, { inputTokens: systemTokens + userTokens, outputTokens: reservedOutput, promptLength: systemTokens + userTokens });
      return { name: m.replace("claude-", "").split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" "), cost: c.totalCost };
    });
  }, [systemTokens, userTokens, reservedOutput]);

  const inputStyle = { width: "100%", padding: "0.5rem", border: `1px solid ${P.g3}`, borderRadius: "4px", fontFamily: "monospace", fontSize: "0.875rem" };

  return (
    <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {/* Input Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Model Selection */}
        <div className="eco-card-flat">
          <h2 className="section-header">Model Selection</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            {models.map((model) => {
              const info = getModelInfo(model);
              return (
                <button key={model} onClick={() => setSelectedModel(model)}
                  style={{ padding: "0.75rem", border: selectedModel === model ? `2px solid ${P.red}` : `2px solid ${P.g3}`, borderRadius: "8px", background: selectedModel === model ? P.g1 : P.white, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}>
                  {info.displayName.split(" ").slice(1).join(" ")}
                </button>
              );
            })}
          </div>
          {limits && <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: P.g5 }}>Context: {formatTokenCount(limits.contextWindow)} | Max Output: {formatTokenCount(limits.maxOutput)}</p>}
        </div>

        <div className="eco-card-flat">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <label style={{ fontSize: "0.8125rem", color: P.g7 }}>System Prompt</label>
            <span style={{ fontSize: "0.8125rem", color: P.g5 }}>~{formatTokenCount(systemTokens)} tokens</span>
          </div>
          <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={6} style={inputStyle} placeholder="Enter your system prompt..." />
        </div>

        <div className="eco-card-flat">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <label style={{ fontSize: "0.8125rem", color: P.g7 }}>User Message</label>
            <span style={{ fontSize: "0.8125rem", color: P.g5 }}>~{formatTokenCount(userTokens)} tokens</span>
          </div>
          <textarea value={userMessage} onChange={(e) => setUserMessage(e.target.value)} rows={4} style={inputStyle} placeholder="Enter a typical user message..." />
        </div>

        <div className="eco-card-flat">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <label style={{ fontSize: "0.8125rem", color: P.g7 }}>Reserved Output Tokens</label>
            <span style={{ fontSize: "0.8125rem", color: P.g5 }}>{formatTokenCount(reservedOutput)}</span>
          </div>
          <input type="range" min={100} max={limits?.maxOutput || 64000} step={100} value={reservedOutput} onChange={(e) => setReservedOutput(Number(e.target.value))} style={{ width: "100%", accentColor: P.red }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: P.g5, marginTop: "0.25rem" }}>
            <span>100</span><span>{formatTokenCount(limits?.maxOutput || 64000)}</span>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Context Budget Donut */}
        <div className="eco-card-flat">
          <h2 className="section-header">Context Budget</h2>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            <span style={{ color: P.g7 }}>{formatTokenCount(analysis.totalUsed)} / {formatTokenCount(analysis.totalAvailable)}</span>
            <span style={{ fontWeight: 600, color: analysis.usagePercent > 90 ? P.red : analysis.usagePercent > 70 ? P.g7 : P.black }}>{analysis.usagePercent.toFixed(1)}%</span>
          </div>
          {/* Bar */}
          <div style={{ height: "8px", background: P.g3, borderRadius: "4px", overflow: "hidden", display: "flex", marginBottom: "1rem" }}>
            <div style={{ width: `${analysis.breakdown.systemPrompt.percent}%`, background: P.black }} title={`System: ${formatTokenCount(analysis.breakdown.systemPrompt.tokens)}`} />
            <div style={{ width: `${analysis.breakdown.userInput.percent}%`, background: P.red }} title={`User: ${formatTokenCount(analysis.breakdown.userInput.tokens)}`} />
            <div style={{ width: `${analysis.breakdown.reservedOutput.percent}%`, background: P.g5 }} title={`Output: ${formatTokenCount(analysis.breakdown.reservedOutput.tokens)}`} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={budgetPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {budgetPie.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Pie>
              <Tooltip {...tt} formatter={(v: number) => [formatTokenCount(v) + " tokens"]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {[
            ["Remaining", formatTokenCount(analysis.remaining), "tokens available"],
            ["Est. Cost", formatCost(estimatedCost.totalCost), "per request"],
            ["More Turns", remainingTurns > 100 ? "100+" : String(remainingTurns), "before limit"],
            ["Pricing Tier", analysis.isInExtendedPricing ? "Extended" : "Standard", selectedModel === "claude-sonnet-4.5" ? "(200K threshold)" : "N/A"],
          ].map(([label, value, sub]) => (
            <div key={label} className="feature-card" style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "0.8125rem", color: P.g5 }}>{label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: "0.6875rem", color: P.g5 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Cross-model cost */}
        <div className="eco-card-flat">
          <h3 className="section-header">Cost Across Models</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={crossModelCost} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
              <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10 }} width={70} />
              <Tooltip {...tt} formatter={(v: number) => [formatCost(v), "Cost"]} />
              <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
                {crossModelCost.map((_, i) => (<Cell key={i} fill={[P.black, P.red, P.g5][i]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div style={{ padding: "1rem", background: P.g1, border: `1px solid ${P.g3}`, borderRadius: "8px" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Warnings</h3>
            <ul style={{ fontSize: "0.8125rem", color: P.g7, listStyle: "disc", paddingLeft: "1.25rem" }}>
              {analysis.warnings.map((w, i) => (<li key={i}>{w}</li>))}
            </ul>
          </div>
        )}

        {/* Breakdown Table */}
        <div className="eco-card-flat">
          <h3 className="section-header">Token Breakdown</h3>
          <table className="settings-table">
            <thead>
              <tr><th style={{ textAlign: "left" }}>Component</th><th style={{ textAlign: "right" }}>Tokens</th><th style={{ textAlign: "right" }}>%</th></tr>
            </thead>
            <tbody>
              {[
                ["System Prompt", analysis.breakdown.systemPrompt],
                ["User Input", analysis.breakdown.userInput],
                ["Reserved Output", analysis.breakdown.reservedOutput],
                ["Free Space", analysis.breakdown.free],
              ].map(([label, data]) => {
                const d = data as { tokens: number; percent: number };
                return (
                  <tr key={label as string}>
                    <td>{label as string}</td>
                    <td style={{ textAlign: "right" }}>{formatTokenCount(d.tokens)}</td>
                    <td style={{ textAlign: "right" }}>{d.percent.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
'''

with open(os.path.join(BASE, "components", "context-optimizer.tsx"), "w") as f:
    f.write(context_opt)
print("Wrote context-optimizer.tsx")

print("All components written successfully!")
