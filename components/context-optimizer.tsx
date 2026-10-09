"use client";

import { themePalette as P } from "@/lib/theme-palette";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  analyzeContextBudget, estimateTokens, formatTokenCount,
  calculateRemainingTurns, getModelLimits,
} from "@/lib/context";
import { formatCost, calculateCost, MODEL_PRICING } from "@/lib/pricing";
import { PROVIDER_MODELS, PROVIDERS, fitsContext, getProviderColor, getProviderName } from "@/lib/providers";
import { CATALOG_MODELS, DEFAULT_MODEL_ID } from "@/lib/models";

const FEATURED = CATALOG_MODELS.filter(m => m.featured).map(m => m.id);

const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };

export function ContextOptimizer() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userMessage, setUserMessage] = useState<string>("");
  const [reservedOutput, setReservedOutput] = useState<number>(4000);

  const limits = getModelLimits(selectedModel);
  const systemTokens = useMemo(() => estimateTokens(systemPrompt), [systemPrompt]);
  const userTokens = useMemo(() => estimateTokens(userMessage), [userMessage]);
  const analysis = useMemo(() => analyzeContextBudget({ systemPromptTokens: systemTokens, userInputTokens: userTokens, reservedOutputTokens: reservedOutput, model: selectedModel }), [systemTokens, userTokens, reservedOutput, selectedModel]);
  const remainingTurns = calculateRemainingTurns(systemTokens + userTokens, userTokens + reservedOutput, selectedModel);
  const estimatedCost = useMemo(() => calculateCost(selectedModel, { inputTokens: systemTokens + userTokens, outputTokens: reservedOutput }), [selectedModel, systemTokens, userTokens, reservedOutput]);
  const tierThreshold = MODEL_PRICING[selectedModel].threshold;

  const selectModel = (id: string) => {
    setSelectedModel(id);
    const max = getModelLimits(id)?.maxOutput;
    if (max) setReservedOutput(r => Math.min(r, max));
  };

  const budgetPie = useMemo(() => [
    { name: "System", value: analysis.breakdown.systemPrompt.tokens, color: P.black },
    { name: "User", value: analysis.breakdown.userInput.tokens, color: P.red },
    { name: "Output", value: analysis.breakdown.reservedOutput.tokens, color: P.g5 },
    { name: "Free", value: analysis.breakdown.free.tokens, color: P.g3 },
  ], [analysis]);

  const crossModelCost = useMemo(() => {
    const ids = FEATURED.includes(selectedModel) ? FEATURED : [...FEATURED, selectedModel];
    return PROVIDER_MODELS
      .filter(m => ids.includes(m.id) && fitsContext(m, systemTokens + userTokens, reservedOutput))
      .map(m => ({ name: m.name.replace("Claude ", ""), provider: m.provider, cost: calculateCost(m.id, { inputTokens: systemTokens + userTokens, outputTokens: reservedOutput }).totalCost }))
      .sort((a, b) => a.cost - b.cost);
  }, [selectedModel, systemTokens, userTokens, reservedOutput]);

  const inputStyle = { width: "100%", padding: "0.5rem", border: `1px solid ${P.g3}`, borderRadius: "4px", fontFamily: "monospace", fontSize: "0.875rem", background: P.white, color: P.black };

  return (
    <div className="feature-grid">
      {/* Input Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Model Selection */}
        <div className="eco-card-flat">
          <h2 className="section-header"><label htmlFor="ctx-model">Model Selection</label></h2>
          <select id="ctx-model" value={selectedModel} onChange={(e) => selectModel(e.target.value)} style={{ ...inputStyle, fontFamily: "inherit" }}>
            {PROVIDERS.map(p => (
              <optgroup key={p} label={getProviderName(p)}>
                {PROVIDER_MODELS.filter(m => m.provider === p).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </optgroup>
            ))}
          </select>
          {limits && <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: P.g5 }}>Context: {formatTokenCount(limits.contextWindow)} | Max Output: {formatTokenCount(limits.maxOutput)}</p>}
        </div>

        <div className="eco-card-flat">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <label htmlFor="ctx-system" style={{ fontSize: "0.8125rem", color: P.g7 }}>System Prompt</label>
            <span style={{ fontSize: "0.8125rem", color: P.g5 }}>~{formatTokenCount(systemTokens)} tokens</span>
          </div>
          <textarea id="ctx-system" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={6} style={inputStyle} placeholder="Enter your system prompt..." />
        </div>

        <div className="eco-card-flat">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <label htmlFor="ctx-user" style={{ fontSize: "0.8125rem", color: P.g7 }}>User Message</label>
            <span style={{ fontSize: "0.8125rem", color: P.g5 }}>~{formatTokenCount(userTokens)} tokens</span>
          </div>
          <textarea id="ctx-user" value={userMessage} onChange={(e) => setUserMessage(e.target.value)} rows={4} style={inputStyle} placeholder="Enter a typical user message..." />
        </div>

        <div className="eco-card-flat">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <label htmlFor="ctx-output" style={{ fontSize: "0.8125rem", color: P.g7 }}>Reserved Output Tokens</label>
            <span style={{ fontSize: "0.8125rem", color: P.g5 }}>{formatTokenCount(reservedOutput)}</span>
          </div>
          <input id="ctx-output" type="range" min={100} max={limits?.maxOutput || 64000} step={100} value={reservedOutput} onChange={(e) => setReservedOutput(Number(e.target.value))} style={{ width: "100%", accentColor: P.red }} />
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))", gap: "1rem" }}>
          {[
            ["Remaining", formatTokenCount(analysis.remaining), "tokens available"],
            ["Est. Cost", formatCost(estimatedCost.totalCost), "per request"],
            ["More Turns", remainingTurns > 100 ? "100+" : String(remainingTurns), "before limit"],
            ["Pricing Tier", analysis.isInExtendedPricing ? "Long context" : "Standard", tierThreshold !== undefined ? `long context above ${formatTokenCount(tierThreshold)}` : "no long-context tier"],
          ].map(([label, value, sub]) => (
            <div key={label} className="feature-item" style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "0.8125rem", color: P.g5 }}>{label}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: "0.6875rem", color: P.g5 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Cross-model cost */}
        <div className="eco-card-flat">
          <h3 className="section-header">Cost Across Featured Models</h3>
          <ResponsiveContainer width="100%" height={crossModelCost.length * 24 + 30}>
            <BarChart data={crossModelCost} layout="vertical" margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
              <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10, fill: P.g7 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10, fill: P.g7 }} width={100} interval={0} />
              <Tooltip {...tt} formatter={(v) => [formatCost(Number(v)), "Cost"]} />
              <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
                {crossModelCost.map((m) => (<Cell key={m.name} fill={getProviderColor(m.provider)} />))}
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
