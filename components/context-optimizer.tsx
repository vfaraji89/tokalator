"use client";

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
              <Tooltip {...tt} formatter={(v) => [formatTokenCount(Number(v)) + " tokens"]} />
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
              <Tooltip {...tt} formatter={(v) => [formatCost(Number(v)), "Cost"]} />
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
