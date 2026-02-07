"use client";

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
                    <Tooltip {...tt} formatter={(v) => [formatCost(Number(v))]} />
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
              <Tooltip {...tt} formatter={(v) => [formatCost(Number(v)), "Cost"]} />
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
