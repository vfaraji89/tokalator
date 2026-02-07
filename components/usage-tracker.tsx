"use client";

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
              <Tooltip {...tt} formatter={(v) => [`$${Number(v).toFixed(4)}`]} />
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
              <Pie data={tokenBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {tokenBreakdown.map((_, i) => (<Cell key={i} fill={pieColors[i]} />))}
              </Pie>
              <Tooltip {...tt} formatter={(v) => [`${(Number(v) / 1000).toFixed(1)}K tokens`]} />
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
            <Tooltip {...tt} formatter={(v) => [`$${Number(v).toFixed(4)}`]} />
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
                <input type="number" value={(newRecord as unknown as Record<string, number>)[key]} onChange={(e) => setNewRecord({ ...newRecord, [key]: parseInt(e.target.value) || 0 })} style={{ width: "100%", padding: "0.375rem", border: `1px solid ${P.g3}`, borderRadius: "4px" }} />
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
