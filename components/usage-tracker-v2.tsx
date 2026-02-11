"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatCost } from "@/lib/pricing";

const P = { red: "#e3120b", black: "#111", g7: "#555", g5: "#888", g3: "#ccc", g1: "#f3f3f3", white: "#fff" };
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };
const fmtTok = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

// ── Types ──

interface UsageRecord {
  id: string;
  date: string;
  model: string;
  provider: string;
  project: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  cost: number;
}

// ── Pricing for client-side cost estimation ──

const PRICING: Record<string, [number, number]> = {
  "claude-opus-4.6": [5.0, 25.0], "claude-sonnet-4.5": [3.0, 15.0], "claude-haiku-4.5": [1.0, 5.0],
  "gpt-5.2": [1.75, 14.0], "gpt-5.2-codex": [0.50, 4.0], "gpt-5.1": [2.50, 10.0],
  "gpt-4.1": [3.0, 12.0], "gpt-4.1-mini": [0.80, 3.20], "gpt-4.1-nano": [0.20, 0.80],
  "gpt-5-mini": [0.25, 2.0], "o4-mini": [4.0, 16.0], "gpt-4o": [2.50, 10.0],
  "gemini-3-pro": [2.0, 12.0], "gemini-3-flash": [0.50, 3.0], "gemini-2.5-pro": [1.25, 10.0],
  "gemini-2.5-flash": [0.30, 2.50], "gemini-2.5-flash-lite": [0.10, 0.40], "gemini-2.0-flash": [0.10, 0.40],
};

function estimateCost(model: string, inp: number, out: number): number {
  const key = model.toLowerCase().trim();
  let prices = PRICING[key];
  if (!prices) {
    for (const [k, v] of Object.entries(PRICING)) {
      if (k.includes(key) || key.includes(k)) { prices = v; break; }
    }
  }
  if (!prices) prices = [3.0, 15.0];
  return (inp / 1_000_000) * prices[0] + (out / 1_000_000) * prices[1];
}

// ── Provider colors ──

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: P.black, openai: "#10a37f", google: "#4285f4", unknown: P.g5,
};

function detectProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.includes("claude")) return "anthropic";
  if (m.includes("gpt") || m.startsWith("o")) return "openai";
  if (m.includes("gemini")) return "google";
  return "unknown";
}

// ── Client-side CSV parser ──

function parseCSVClientSide(text: string): { records: UsageRecord[]; warnings: string[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { records: [], warnings: ["CSV has no data rows"] };

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));

  const findCol = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const colDate = findCol(["date", "timestamp", "created_at", "time", "day"]);
  const colModel = findCol(["model", "model_id", "model_name"]);
  const colInput = findCol(["input_tokens", "prompt_tokens", "input_token_count", "n_context_tokens_total"]);
  const colOutput = findCol(["output_tokens", "completion_tokens", "output_token_count", "n_generated_tokens_total"]);
  const colCacheW = findCol(["cache_write_tokens", "cache_creation_input_tokens"]);
  const colCacheR = findCol(["cache_read_tokens", "cache_read_input_tokens"]);
  const colCost = findCol(["cost", "total_cost", "cost_usd", "amount"]);

  const warnings: string[] = [];
  if (colInput < 0 && colOutput < 0) return { records: [], warnings: ["Cannot find token columns in CSV"] };
  if (colModel < 0) warnings.push("No model column — using 'unknown'");

  const safeInt = (val: string | undefined) => {
    if (!val) return 0;
    const n = parseFloat(val.trim().replace(/[,$]/g, ""));
    return isNaN(n) ? 0 : Math.round(n);
  };

  const records: UsageRecord[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split (handles basic quoting)
    const cells = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
    if (cells.length < 2) continue;

    const inp = colInput >= 0 ? safeInt(cells[colInput]) : 0;
    const out = colOutput >= 0 ? safeInt(cells[colOutput]) : 0;
    if (inp === 0 && out === 0) continue;

    const model = colModel >= 0 ? (cells[colModel] || "unknown").trim() : "unknown";
    const provider = detectProvider(model);

    let date = today;
    if (colDate >= 0 && cells[colDate]) {
      const raw = cells[colDate].trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw;
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [m, d, y] = raw.split("/");
        date = `${y}-${m}-${d}`;
      }
    }

    let cost = 0;
    if (colCost >= 0 && cells[colCost]) {
      cost = parseFloat(cells[colCost].replace(/[$,]/g, "")) || 0;
    }
    if (cost === 0) cost = estimateCost(model, inp, out);

    records.push({
      id: String(Date.now()) + i,
      date,
      model,
      provider,
      project: "Imported",
      inputTokens: inp,
      outputTokens: out,
      cacheWriteTokens: colCacheW >= 0 ? safeInt(cells[colCacheW]) : 0,
      cacheReadTokens: colCacheR >= 0 ? safeInt(cells[colCacheR]) : 0,
      cost: Math.round(cost * 1_000_000) / 1_000_000,
    });
  }

  return { records, warnings };
}

// ── Sample data ──

const sampleUsage: UsageRecord[] = [
  { id: "s1", date: "2026-01-31", model: "claude-haiku-4.5", provider: "anthropic", project: "Sample", inputTokens: 20000, outputTokens: 10000, cacheWriteTokens: 5000, cacheReadTokens: 10000, cost: 0.08 },
  { id: "s2", date: "2026-01-30", model: "claude-opus-4.6", provider: "anthropic", project: "Sample", inputTokens: 20000, outputTokens: 25000, cacheWriteTokens: 2000, cacheReadTokens: 5000, cost: 0.68 },
  { id: "s3", date: "2026-01-29", model: "claude-sonnet-4.5", provider: "anthropic", project: "Sample", inputTokens: 80000, outputTokens: 35000, cacheWriteTokens: 20000, cacheReadTokens: 10000, cost: 1.34 },
  { id: "s4", date: "2026-01-28", model: "gpt-5.2", provider: "openai", project: "Sample", inputTokens: 100000, outputTokens: 15000, cacheWriteTokens: 0, cacheReadTokens: 0, cost: 0.385 },
];

// ── Component ──

export function UsageTracker() {
  const [usage, setUsage] = useState<UsageRecord[]>(sampleUsage);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalCost = usage.reduce((s, r) => s + r.cost, 0);
  const totalTokens = usage.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0);

  // Chart data
  const costByDate = useMemo(() => {
    const map: Record<string, number> = {};
    usage.forEach(r => { map[r.date] = (map[r.date] || 0) + r.cost; });
    return Object.entries(map).sort().slice(-14).map(([date, cost]) => ({ date: date.slice(5), cost: +cost.toFixed(4) }));
  }, [usage]);

  const costByModel = useMemo(() => {
    const map: Record<string, { cost: number; provider: string }> = {};
    usage.forEach(r => {
      if (!map[r.model]) map[r.model] = { cost: 0, provider: r.provider };
      map[r.model].cost += r.cost;
    });
    return Object.entries(map).map(([name, { cost, provider }]) => ({ name, value: +cost.toFixed(4), provider })).sort((a, b) => b.value - a.value);
  }, [usage]);

  const tokenBreakdown = useMemo(() => {
    let inp = 0, out = 0, cw = 0, cr = 0;
    usage.forEach(r => { inp += r.inputTokens; out += r.outputTokens; cw += r.cacheWriteTokens; cr += r.cacheReadTokens; });
    return [
      { name: "Input", value: inp },
      { name: "Output", value: out },
      ...(cw > 0 ? [{ name: "Cache Write", value: cw }] : []),
      ...(cr > 0 ? [{ name: "Cache Read", value: cr }] : []),
    ];
  }, [usage]);

  const pieColors = [P.black, P.red, P.g5, P.g3];

  // ── CSV handling ──

  const processCSV = useCallback(async (file: File) => {
    setUploadStatus("Parsing...");
    try {
      // Try Python API first
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("http://localhost:8000/api/csv/parse", { method: "POST", body: form });
        if (res.ok) {
          const data = await res.json();
          const records: UsageRecord[] = data.records.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            date: r.date as string,
            model: r.model as string,
            provider: (r.provider as string) || detectProvider(r.model as string),
            project: (r.project as string) || "Imported",
            inputTokens: r.input_tokens as number,
            outputTokens: r.output_tokens as number,
            cacheWriteTokens: (r.cache_write_tokens as number) || 0,
            cacheReadTokens: (r.cache_read_tokens as number) || 0,
            cost: r.cost as number,
          }));
          setUsage(prev => [...records, ...prev]);
          setUploadStatus(`✓ ${records.length} records imported via API (${data.detected_provider})`);
          return;
        }
      } catch {
        // Python API not available — fall through to client-side
      }

      // Client-side fallback
      const text = await file.text();
      const { records, warnings } = parseCSVClientSide(text);
      if (records.length === 0) {
        setUploadStatus("⚠ No records found. Check CSV format.");
        return;
      }
      setUsage(prev => [...records, ...prev]);
      const warn = warnings.length > 0 ? ` (${warnings.join(", ")})` : "";
      setUploadStatus(`✓ ${records.length} records imported${warn}`);
    } catch (err) {
      setUploadStatus(`✗ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) processCSV(file);
    else setUploadStatus("⚠ Only .csv files accepted");
  }, [processCSV]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
    e.target.value = "";
  }, [processCSV]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* CSV Upload Zone */}
      <div
        className="eco-card-flat"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: dragOver ? `2px dashed ${P.red}` : `2px dashed ${P.g3}`,
          background: dragOver ? "rgba(227,18,11,0.03)" : P.g1,
          textAlign: "center",
          padding: "2rem",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} style={{ display: "none" }} />
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none" style={{ margin: "0 auto 0.75rem", display: "block" }}>
          <path d="M14 4V18M14 4L9 9M14 4L19 9" stroke={dragOver ? P.red : P.g5} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20V22C4 23 5 24 6 24H22C23 24 24 23 24 22V20" stroke={dragOver ? P.red : P.g5} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
          Drop CSV file here or click to browse
        </div>
        <div style={{ fontSize: "0.8125rem", color: P.g7 }}>
          Supports Anthropic, OpenAI, and Google AI Studio exports
        </div>
        {uploadStatus && (
          <div style={{
            marginTop: "0.75rem", fontSize: "0.8125rem", fontWeight: 500,
            color: uploadStatus.startsWith("✓") ? "#16a34a" : uploadStatus.startsWith("⚠") ? "#d97706" : uploadStatus.startsWith("✗") ? P.red : P.g7,
          }}>{uploadStatus}</div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        {[
          ["Total Cost", formatCost(totalCost)],
          ["Total Tokens", fmtTok(totalTokens)],
          ["Records", String(usage.length)],
          ["Models", String(new Set(usage.map(r => r.model)).size)],
        ].map(([label, value]) => (
          <div key={label} className="feature-card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.8125rem", color: P.g7 }}>{label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="eco-card-flat">
          <h3 className="section-header">Cost by Date</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costByDate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
              <XAxis dataKey="date" stroke={P.g7} tick={{ fontSize: 10 }} />
              <YAxis stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip {...tt} formatter={v => [formatCost(Number(v))]} />
              <Bar dataKey="cost" radius={[3, 3, 0, 0]} fill={P.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="eco-card-flat">
          <h3 className="section-header">Token Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tokenBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false} style={{ fontSize: 10 }}>
                {tokenBreakdown.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip {...tt} formatter={v => [fmtTok(Number(v))]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost by Model */}
      <div className="eco-card-flat">
        <h3 className="section-header">Cost by Model</h3>
        <ResponsiveContainer width="100%" height={Math.max(120, costByModel.length * 30)}>
          <BarChart data={costByModel} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
            <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
            <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10 }} width={90} />
            <Tooltip {...tt} formatter={v => [formatCost(Number(v))]} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {costByModel.map((entry, i) => (
                <Cell key={i} fill={PROVIDER_COLORS[entry.provider] || P.g5} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => { setUsage(sampleUsage); setUploadStatus(null); }}
          style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", background: P.g1, border: `1px solid ${P.g3}`, borderRadius: "4px", cursor: "pointer" }}>
          Reset to Sample
        </button>
        <button onClick={() => { setUsage([]); setUploadStatus(null); }}
          style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem", background: P.g1, border: `1px solid ${P.g3}`, borderRadius: "4px", cursor: "pointer" }}>
          Clear All
        </button>
      </div>

      {/* Usage Table */}
      <div className="eco-card-flat" style={{ overflow: "auto" }}>
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
            {usage.slice(0, 50).map(r => (
              <tr key={r.id}>
                <td style={{ fontSize: "0.8125rem" }}>{r.date}</td>
                <td>
                  <span style={{
                    display: "inline-block", padding: "0.125rem 0.5rem", borderRadius: "999px",
                    fontSize: "0.75rem", fontWeight: 500, background: P.g1, border: `1px solid ${P.g3}`,
                    borderLeft: `3px solid ${PROVIDER_COLORS[r.provider] || P.g5}`,
                  }}>{r.model}</span>
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{fmtTok(r.inputTokens)}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{fmtTok(r.outputTokens)}</td>
                <td style={{ textAlign: "right", fontSize: "0.75rem", color: P.g7 }}>
                  {r.cacheWriteTokens > 0 || r.cacheReadTokens > 0
                    ? `W:${fmtTok(r.cacheWriteTokens)} R:${fmtTok(r.cacheReadTokens)}`
                    : "—"}
                </td>
                <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{formatCost(r.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {usage.length > 50 && (
          <div style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.8125rem", color: P.g7 }}>
            Showing 50 of {usage.length} records
          </div>
        )}
      </div>
    </div>
  );
}
