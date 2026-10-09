'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  compareStrategies,
  getStrategyDescription,
  type ContextStrategy,
} from '@/lib/conversation';
import { formatCost } from '@/lib/pricing';
import { formatTokenCount } from '@/lib/context';
import { PROVIDER_MODELS, PROVIDERS, getProviderName } from '@/lib/providers';
import { DEFAULT_MODEL_ID } from '@/lib/models';
import { themePalette as P } from '@/lib/theme-palette';

const strategies: ContextStrategy[] = ['full', 'sliding-window', 'summarize'];
const MAX_TURNS = 200;
const card = 'rounded-xl border border-(--border) bg-(--bg-subtle) p-6';
const subheading = 'text-sm font-medium text-(--text-secondary) mb-3';
const heading = 'text-lg font-semibold mb-4 text-(--text-primary)';
const fieldLabel = 'text-xs text-(--text-secondary)';
const field = 'w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text-primary) text-sm';
const hint = 'text-xs text-(--text-muted) mt-1';
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };
const LINES = [
  { key: 'full', name: 'Full Context', color: P.g7 },
  { key: 'slidingWindow', name: 'Sliding Window', color: 'var(--accent)' },
  { key: 'summarize', name: 'Summarize', color: 'var(--cyan)' },
];
const nonNegative = (value: string) => Math.max(0, Number(value) || 0);
const clampTurns = (value: number) => Math.min(MAX_TURNS, Math.max(1, Math.round(value) || 1));

export function ConversationEstimator() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [systemPromptTokens, setSystemPromptTokens] = useState<number>(5000);
  const [avgUserTokens, setAvgUserTokens] = useState<number>(500);
  const [avgAssistantTokens, setAvgAssistantTokens] = useState<number>(1500);
  const [turns, setTurns] = useState<number>(10);
  const [windowSize, setWindowSize] = useState<number>(5);
  const [compressionRatio, setCompressionRatio] = useState<number>(0.2);

  const comparison = useMemo(() => compareStrategies(
    {
      systemPromptTokens,
      avgUserTokens,
      avgAssistantTokens,
      turns,
      model: selectedModel,
    },
    windowSize,
    compressionRatio
  ), [systemPromptTokens, avgUserTokens, avgAssistantTokens, turns, selectedModel, windowSize, compressionRatio]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const data: Array<{
      turn: number;
      full: number;
      slidingWindow: number;
      summarize: number;
    }> = [];

    for (let i = 0; i < turns; i++) {
      data.push({
        turn: i + 1,
        full: comparison.full.turnBreakdown[i]?.contextSize || 0,
        slidingWindow: comparison.slidingWindow.turnBreakdown[i]?.contextSize || 0,
        summarize: comparison.summarize.turnBreakdown[i]?.contextSize || 0,
      });
    }

    return data;
  }, [comparison, turns]);

  const costChartData = useMemo(() => {
    const data: Array<{
      turn: number;
      full: number;
      slidingWindow: number;
      summarize: number;
    }> = [];

    for (let i = 0; i < turns; i++) {
      data.push({
        turn: i + 1,
        full: comparison.full.turnBreakdown[i]?.cumulativeCost || 0,
        slidingWindow: comparison.slidingWindow.turnBreakdown[i]?.cumulativeCost || 0,
        summarize: comparison.summarize.turnBreakdown[i]?.cumulativeCost || 0,
      });
    }

    return data;
  }, [comparison, turns]);

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={card}>
          <label htmlFor="conv-model" className={`block ${subheading}`}>Model</label>
          <select id="conv-model" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className={field}>
            {PROVIDERS.map(p => (
              <optgroup key={p} label={getProviderName(p)}>
                {PROVIDER_MODELS.filter(m => m.provider === p).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Token Inputs */}
        <div className={card}>
          <h3 className={subheading}>
            Token Sizes
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="conv-system" className={fieldLabel}>System Prompt</label>
              <input
                id="conv-system"
                type="number"
                min={0}
                value={systemPromptTokens}
                onChange={(e) => setSystemPromptTokens(nonNegative(e.target.value))}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="conv-user" className={fieldLabel}>Avg User Message</label>
              <input
                id="conv-user"
                type="number"
                min={0}
                value={avgUserTokens}
                onChange={(e) => setAvgUserTokens(nonNegative(e.target.value))}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="conv-assistant" className={fieldLabel}>Avg Assistant Response</label>
              <input
                id="conv-assistant"
                type="number"
                min={0}
                value={avgAssistantTokens}
                onChange={(e) => setAvgAssistantTokens(nonNegative(e.target.value))}
                className={field}
              />
            </div>
          </div>
        </div>

        {/* Turn Count */}
        <div className={card}>
          <h3 className={subheading}>
            Conversation Length
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="conv-turns" className={fieldLabel}>Number of Turns</label>
                <span className={fieldLabel}>{turns}</span>
              </div>
              <input
                type="range"
                aria-label="Number of turns"
                min={1}
                max={MAX_TURNS}
                value={turns}
                onChange={(e) => setTurns(clampTurns(Number(e.target.value)))}
                className="w-full"
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
            <input
              id="conv-turns"
              type="number"
              min={1}
              max={MAX_TURNS}
              value={turns}
              onChange={(e) => setTurns(clampTurns(Number(e.target.value)))}
              className={field}
            />
            <p className={hint}>Up to {MAX_TURNS} turns</p>
          </div>
        </div>

        {/* Strategy Settings */}
        <div className={card}>
          <h3 className={subheading}>
            Strategy Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="conv-window" className={fieldLabel}>Sliding Window Size</label>
              <input
                id="conv-window"
                type="number"
                min={1}
                max={MAX_TURNS}
                value={windowSize}
                onChange={(e) => setWindowSize(clampTurns(Number(e.target.value)))}
                className={field}
              />
              <p className={hint}>Keep last N turns</p>
            </div>
            <div>
              <label htmlFor="conv-compression" className={fieldLabel}>Compression Ratio</label>
              <input
                id="conv-compression"
                type="number"
                value={compressionRatio}
                step={0.05}
                min={0}
                max={1}
                onChange={(e) => setCompressionRatio(Math.min(1, nonNegative(e.target.value)))}
                className={field}
              />
              <p className={hint}>{(compressionRatio * 100).toFixed(0)}% of original</p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strategy) => {
          const analysis = strategy === 'full' ? comparison.full :
            strategy === 'sliding-window' ? comparison.slidingWindow :
            comparison.summarize;
          const desc = getStrategyDescription(strategy);
          const isLowest = analysis.totalCost === Math.min(
            comparison.full.totalCost,
            comparison.slidingWindow.totalCost,
            comparison.summarize.totalCost
          );

          return (
            <div
              key={strategy}
              className={`${card} ${isLowest ? 'ring-2 ring-(--green)' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-(--text-primary)">
                    {desc.name}
                  </h3>
                  <p className="text-xs text-(--text-secondary)">{desc.description}</p>
                </div>
                {isLowest && (
                  <span className="border border-(--green) text-(--green) text-xs px-2 py-1 rounded-full">
                    Cheapest
                  </span>
                )}
              </div>

              <div className="text-3xl font-bold text-(--text-primary) mb-4">
                {formatCost(analysis.totalCost)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-(--text-secondary)">Final Context</span>
                  <span className="text-(--text-primary)">
                    {formatTokenCount(analysis.finalContextSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-(--text-secondary)">Peak Context</span>
                  <span className="text-(--text-primary)">
                    {formatTokenCount(analysis.peakContextSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-(--text-secondary)">Avg Cost/Turn</span>
                  <span className="text-(--text-primary)">
                    {formatCost(analysis.avgCostPerTurn)}
                  </span>
                </div>
                {analysis.exceedsLimit && (
                  <div className="text-(--accent) text-xs mt-2">
                    Exceeds limit at turn {analysis.limitExceededAtTurn}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-(--border)">
                <div className="text-xs text-(--text-secondary) mb-2">Pros & Cons</div>
                <div className="space-y-1">
                  {desc.pros.slice(0, 2).map((pro, i) => (
                    <div key={i} className="text-xs text-(--green)">+ {pro}</div>
                  ))}
                  {desc.cons.slice(0, 1).map((con, i) => (
                    <div key={i} className="text-xs text-(--accent)">- {con}</div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Context Growth Chart */}
        <div className={card}>
          <h3 className={heading}>
            Context Size Over Turns
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis dataKey="turn" stroke={P.g7} tick={{ fill: P.g7 }} />
                <YAxis stroke={P.g7} tick={{ fill: P.g7 }} tickFormatter={(v) => formatTokenCount(v)} />
                <Tooltip
                  {...tt}
                  formatter={(value) => formatTokenCount(Number(value))}
                  labelFormatter={(label) => `Turn ${label}`}
                />
                <Legend />
                {LINES.map(l => (
                  <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Cost Chart */}
        <div className={card}>
          <h3 className={heading}>
            Cumulative Cost Over Turns
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis dataKey="turn" stroke={P.g7} tick={{ fill: P.g7 }} />
                <YAxis stroke={P.g7} tick={{ fill: P.g7 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip
                  {...tt}
                  formatter={(value) => formatCost(Number(value))}
                  labelFormatter={(label) => `Turn ${label}`}
                />
                <Legend />
                {LINES.map(l => (
                  <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Breakdown */}
      <div className={card}>
        <h3 className={heading}>
          Turn-by-Turn Breakdown (Full Context)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-(--text-secondary) border-b border-(--border)">
                <th className="pb-2 pr-4">Turn</th>
                <th className="pb-2 pr-4">Input Tokens</th>
                <th className="pb-2 pr-4">Output Tokens</th>
                <th className="pb-2 pr-4">Context Size</th>
                <th className="pb-2 pr-4">Turn Cost</th>
                <th className="pb-2">Cumulative</th>
              </tr>
            </thead>
            <tbody className="text-(--text-primary)">
              {comparison.full.turnBreakdown.slice(0, 10).map((turn) => (
                <tr key={turn.turn} className="border-b border-(--border)">
                  <td className="py-2 pr-4">{turn.turn}</td>
                  <td className="py-2 pr-4">{formatTokenCount(turn.inputTokens)}</td>
                  <td className="py-2 pr-4">{formatTokenCount(turn.outputTokens)}</td>
                  <td className="py-2 pr-4">{formatTokenCount(turn.contextSize)}</td>
                  <td className="py-2 pr-4">{formatCost(turn.turnCost)}</td>
                  <td className="py-2">{formatCost(turn.cumulativeCost)}</td>
                </tr>
              ))}
              {turns > 10 && (
                <tr>
                  <td colSpan={6} className="py-2 text-center text-(--text-secondary)">
                    and {turns - 10} more turns
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
