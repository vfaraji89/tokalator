"use client";

import { themePalette as P } from "@/lib/theme-palette";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatCost } from "@/lib/pricing";
import { estimateModelCost, findModel, getProviderColor, type Provider } from "@/lib/providers";

const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };
const fmtTok = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
const PIE_COLORS = [P.black, P.red, P.g5, P.g3];
const buttonStyle: React.CSSProperties = { padding: "0.375rem 0.75rem", fontSize: "0.8125rem", background: P.g1, color: P.black, border: `1px solid ${P.g3}`, borderRadius: "4px", cursor: "pointer" };

interface UsageRecord {
  id: string;
  date: string;
  model: string;
  provider?: Provider;
  project: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  cost: number | null;
}

type Status = { kind: "ok" | "warn" | "error"; text: string } | null;
const STATUS_COLORS = { ok: "var(--green)", warn: P.g7, error: P.red };

function detectProvider(model: string): Provider | undefined {
  const m = model.toLowerCase();
  if (m.includes("claude")) return "anthropic";
  if (m.includes("gpt") || /^o\d/.test(m)) return "openai";
  if (m.includes("gemini")) return "google";
  return undefined;
}

function priceRecord(r: Omit<UsageRecord, "provider" | "cost">, providedCost = 0): UsageRecord {
  const model = findModel(r.model);
  const cost = providedCost > 0
    ? providedCost
    : model ? estimateModelCost(model, r.inputTokens, r.outputTokens, r.cacheWriteTokens, r.cacheReadTokens) : null;
  return { ...r, provider: model?.provider ?? detectProvider(r.model), cost };
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}

function parseUsageCSV(text: string): { records: UsageRecord[]; warnings: string[] } {
  const [header, ...rows] = parseCSVRows(text.replace(/^﻿/, ""));
  if (!header || rows.length === 0) return { records: [], warnings: ["CSV has no data rows"] };

  const headers = header.map(h => h.trim().toLowerCase());
  const findCol = (candidates: string[]) => headers.findIndex(h => candidates.includes(h));

  const colDate = findCol(["date", "timestamp", "created_at", "time", "day"]);
  const colModel = findCol(["model", "model_id", "model_name"]);
  const colProject = findCol(["project", "workspace", "api_key_name"]);
  const colInput = findCol(["input_tokens", "prompt_tokens", "input_token_count", "n_context_tokens_total"]);
  const colOutput = findCol(["output_tokens", "completion_tokens", "output_token_count", "n_generated_tokens_total"]);
  const colCacheW = findCol(["cache_write_tokens", "cache_creation_input_tokens"]);
  const colCacheR = findCol(["cache_read_tokens", "cache_read_input_tokens"]);
  const colCost = findCol(["cost", "total_cost", "cost_usd", "amount"]);

  if (colInput < 0 && colOutput < 0) return { records: [], warnings: ["Cannot find token columns in CSV"] };
  const warnings: string[] = [];
  if (colModel < 0) warnings.push("no model column, rows are unpriced");

  const num = (row: string[], col: number) => {
    if (col < 0) return 0;
    const n = parseFloat((row[col] ?? "").trim().replace(/[,$]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const today = new Date().toISOString().slice(0, 10);
  const stamp = Date.now();

  const records = rows.flatMap((row, i) => {
    const inputTokens = Math.round(num(row, colInput));
    const outputTokens = Math.round(num(row, colOutput));
    const cacheWriteTokens = Math.round(num(row, colCacheW));
    const cacheReadTokens = Math.round(num(row, colCacheR));
    if (inputTokens + outputTokens + cacheWriteTokens + cacheReadTokens === 0) return [];

    let date = today;
    const raw = colDate >= 0 ? (row[colDate] ?? "").trim().slice(0, 10) : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw;
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [m, d, y] = raw.split("/");
      date = `${y}-${m}-${d}`;
    }

    return [priceRecord({
      id: `${stamp}-${i}`,
      date,
      model: (colModel >= 0 && row[colModel]?.trim()) || "unknown",
      project: (colProject >= 0 && row[colProject]?.trim()) || "Imported",
      inputTokens,
      outputTokens,
      cacheWriteTokens,
      cacheReadTokens,
    }, num(row, colCost))];
  });

  return { records, warnings };
}

const sampleUsage: UsageRecord[] = [
  { date: "2026-10-09", model: "claude-opus-5-5", inputTokens: 40_000, outputTokens: 12_000, cacheWriteTokens: 20_000, cacheReadTokens: 180_000 },
  { date: "2026-10-08", model: "claude-sonnet-5-5", inputTokens: 60_000, outputTokens: 18_000, cacheWriteTokens: 30_000, cacheReadTokens: 240_000 },
  { date: "2026-10-07", model: "claude-haiku-5-5", inputTokens: 25_000, outputTokens: 6_000, cacheWriteTokens: 10_000, cacheReadTokens: 50_000 },
  { date: "2026-10-06", model: "gpt-6.1-sol", inputTokens: 80_000, outputTokens: 15_000, cacheWriteTokens: 0, cacheReadTokens: 40_000 },
  { date: "2026-10-05", model: "gemini-3.8-flash", inputTokens: 120_000, outputTokens: 20_000, cacheWriteTokens: 0, cacheReadTokens: 0 },
].map((r, i) => priceRecord({ ...r, id: `s${i}`, project: "Sample" }));

export function UsageTracker() {
  const [usage, setUsage] = useState<UsageRecord[]>(sampleUsage);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalCost = usage.reduce((s, r) => s + (r.cost ?? 0), 0);
  const unpriced = usage.filter(r => r.cost === null).length;
  const totalTokens = usage.reduce((s, r) => s + r.inputTokens + r.outputTokens + r.cacheWriteTokens + r.cacheReadTokens, 0);

  const costByDate = useMemo(() => {
    const map: Record<string, number> = {};
    usage.forEach(r => { if (r.cost !== null) map[r.date] = (map[r.date] || 0) + r.cost; });
    return Object.entries(map).sort().slice(-14).map(([date, cost]) => ({ date: date.slice(5), cost: +cost.toFixed(4) }));
  }, [usage]);

  const costByModel = useMemo(() => {
    const map: Record<string, { cost: number; provider?: Provider }> = {};
    usage.forEach(r => {
      if (r.cost === null) return;
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
      { name: "Cache Write", value: cw },
      { name: "Cache Read", value: cr },
    ].filter(d => d.value > 0);
  }, [usage]);

  const processCSV = useCallback(async (file: File) => {
    try {
      const { records, warnings } = parseUsageCSV(await file.text());
      if (records.length === 0) {
        setStatus({ kind: "warn", text: `No records found${warnings.length ? `: ${warnings.join(", ")}` : ". Check the CSV format."}` });
        return;
      }
      setUsage(prev => [...records, ...prev]);
      const missing = records.filter(r => r.cost === null).length;
      const notes = [...warnings, ...(missing ? [`${missing} unpriced (model not in catalog)`] : [])];
      setStatus({ kind: notes.length ? "warn" : "ok", text: `${records.length} records imported${notes.length ? ` (${notes.join(", ")})` : ""}` });
    } catch (err) {
      setStatus({ kind: "error", text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) processCSV(file);
    else setStatus({ kind: "warn", text: "Only .csv files are accepted" });
  }, [processCSV]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
    e.target.value = "";
  }, [processCSV]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        className="eco-card-flat"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: dragOver ? `2px dashed ${P.red}` : `2px dashed ${P.g3}`,
          background: dragOver ? "var(--accent-bg)" : P.g1,
          textAlign: "center",
          padding: "2rem",
          transition: "all 0.15s ease",
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,text/csv" aria-label="Usage CSV file" onChange={handleFileSelect} style={{ display: "none" }} />
        <svg aria-hidden width="32" height="32" viewBox="0 0 28 28" fill="none" style={{ margin: "0 auto 0.75rem", display: "block" }}>
          <path d="M14 4V18M14 4L9 9M14 4L19 9" stroke={dragOver ? P.red : P.g5} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20V22C4 23 5 24 6 24H22C23 24 24 23 24 22V20" stroke={dragOver ? P.red : P.g5} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Drop a usage CSV here or</div>
        <button type="button" onClick={() => fileRef.current?.click()} style={{ ...buttonStyle, fontWeight: 600 }}>
          Choose CSV file
        </button>
        <div style={{ fontSize: "0.8125rem", color: P.g7, marginTop: "0.75rem" }}>
          Columns such as model, date, input_tokens, output_tokens and cache tokens. Parsed in your browser; nothing is uploaded.
        </div>
        {status && (
          <div role="status" style={{ marginTop: "0.75rem", fontSize: "0.8125rem", fontWeight: 500, color: STATUS_COLORS[status.kind] }}>
            {status.text}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" onClick={() => { setUsage(sampleUsage); setStatus(null); }} style={buttonStyle}>
          Reset to Sample
        </button>
        <button type="button" onClick={() => { setUsage([]); setStatus(null); }} style={buttonStyle}>
          Clear All
        </button>
      </div>

      {usage.length === 0 ? (
        <div className="eco-card-flat" style={{ textAlign: "center", padding: "2rem", color: P.g7 }}>
          No records. Import a CSV or reset to the sample data.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: "1rem" }}>
            {[
              ["Total Cost", formatCost(totalCost), unpriced ? `${unpriced} unpriced` : "all rows priced"],
              ["Total Tokens", fmtTok(totalTokens), "including cache"],
              ["Records", String(usage.length), ""],
              ["Models", String(new Set(usage.map(r => r.model)).size), ""],
            ].map(([label, value, sub]) => (
              <div key={label} className="feature-item" style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.8125rem", color: P.g7 }}>{label}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</p>
                {sub && <p style={{ fontSize: "0.6875rem", color: P.g7 }}>{sub}</p>}
              </div>
            ))}
          </div>

          <div className="feature-grid">
            <div className="eco-card-flat">
              <h3 className="section-header">Cost by Date</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={costByDate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                  <XAxis dataKey="date" stroke={P.g7} tick={{ fontSize: 10, fill: P.g7 }} />
                  <YAxis stroke={P.g7} tick={{ fontSize: 10, fill: P.g7 }} tickFormatter={v => `$${v}`} />
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
                    {tokenBreakdown.map((d, i) => <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={v => [fmtTok(Number(v))]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="eco-card-flat">
            <h3 className="section-header">Cost by Model</h3>
            <ResponsiveContainer width="100%" height={Math.max(120, costByModel.length * 30)}>
              <BarChart data={costByModel} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
                <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10, fill: P.g7 }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10, fill: P.g7 }} width={120} interval={0} />
                <Tooltip {...tt} formatter={v => [formatCost(Number(v))]} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {costByModel.map(entry => (
                    <Cell key={entry.name} fill={entry.provider ? getProviderColor(entry.provider) : P.g5} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: "0.75rem", color: P.g7, marginTop: "0.5rem" }}>
              Rows without a cost column are priced from the model catalog, including cache reads, cache writes and long-context rates. Models not in the catalog are left unpriced.
            </p>
          </div>

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
                        borderLeft: `3px solid ${r.provider ? getProviderColor(r.provider) : P.g5}`,
                      }}>{r.model}</span>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{fmtTok(r.inputTokens)}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{fmtTok(r.outputTokens)}</td>
                    <td style={{ textAlign: "right", fontSize: "0.75rem", color: P.g7 }}>
                      W:{fmtTok(r.cacheWriteTokens)} R:{fmtTok(r.cacheReadTokens)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, fontFamily: "var(--font-mono)", color: r.cost === null ? P.g7 : undefined }}>
                      {r.cost === null ? "unpriced" : formatCost(r.cost)}
                    </td>
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
        </>
      )}
    </div>
  );
}
