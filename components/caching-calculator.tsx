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
  analyzeCaching,
  calculateBreakeven,
  generateCostComparisonData,
} from '@/lib/caching';
import { formatCost } from '@/lib/pricing';
import { formatTokenCount } from '@/lib/context';
import { PROVIDER_MODELS, PROVIDERS, getProviderName } from '@/lib/providers';
import { CATALOG_UPDATED_AT, DEFAULT_MODEL_ID } from '@/lib/models';
import { themePalette as P } from '@/lib/theme-palette';

const card = 'rounded-xl border border-(--border) bg-(--bg-subtle) p-6';
const heading = 'text-lg font-semibold mb-4 text-(--text-primary)';
const muted = 'text-(--text-secondary)';
const field = 'w-full px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text-primary)';
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };

export function CachingCalculator() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [cacheTokens, setCacheTokens] = useState<number>(50000);
  const [reuseCount, setReuseCount] = useState<number>(5);

  const model = PROVIDER_MODELS.find(m => m.id === selectedModel) ?? PROVIDER_MODELS[0];
  const maxTokens = model.contextWindow;

  const analysis = useMemo(() => analyzeCaching({
    cacheTokens,
    reuseCount,
    model: selectedModel,
  }), [cacheTokens, reuseCount, selectedModel]);

  const breakeven = useMemo(() => calculateBreakeven(selectedModel), [selectedModel]);
  const paysFrom = Number.isFinite(analysis.breakEvenReuses) ? Math.max(1, Math.ceil(analysis.breakEvenReuses)) : null;

  const chartData = useMemo(() =>
    generateCostComparisonData(cacheTokens, selectedModel, 15),
    [cacheTokens, selectedModel]
  );

  const selectModel = (id: string) => {
    setSelectedModel(id);
    const next = PROVIDER_MODELS.find(m => m.id === id);
    if (next) setCacheTokens(t => Math.min(t, next.contextWindow));
  };
  const clamp = (value: number, max: number) => Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0));
  const verdictColor = analysis.shouldCache ? 'var(--green)' : 'var(--accent)';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className={card}>
          <label htmlFor="cache-model" className={`block ${heading}`}>Model</label>
          <select id="cache-model" value={selectedModel} onChange={(e) => selectModel(e.target.value)} className={field}>
            {PROVIDERS.map(p => (
              <optgroup key={p} label={getProviderName(p)}>
                {PROVIDER_MODELS.filter(m => m.provider === p).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className={`mt-2 text-xs ${muted}`}>
            Rates per MTok: input ${model.inputCostPerMTok}, cache write ${model.cacheWriteCostPerMTok ?? model.inputCostPerMTok}, cache read ${model.cachedInputCostPerMTok}. Catalog {CATALOG_UPDATED_AT}.
          </p>
        </div>

        <div className={card}>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="cache-tokens" className={`block text-sm font-medium ${muted}`}>
              Tokens to Cache
            </label>
            <span className={`text-sm ${muted}`}>{formatTokenCount(cacheTokens)}</span>
          </div>
          <input
            type="range"
            aria-label="Tokens to cache"
            min={0}
            max={maxTokens}
            step={1000}
            value={cacheTokens}
            onChange={(e) => setCacheTokens(Number(e.target.value))}
            className="w-full mb-2"
            style={{ accentColor: 'var(--accent)' }}
          />
          <input
            id="cache-tokens"
            type="number"
            min={0}
            max={maxTokens}
            value={cacheTokens}
            onChange={(e) => setCacheTokens(clamp(Number(e.target.value), maxTokens))}
            className={field}
          />
          <p className={`mt-2 text-xs ${muted}`}>
            System prompt, few-shot examples, or any reusable context
          </p>
        </div>

        <div className={card}>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="cache-reuses" className={`block text-sm font-medium ${muted}`}>
              Expected Reuses
            </label>
            <span className={`text-sm ${muted}`}>{reuseCount} times</span>
          </div>
          <input
            type="range"
            aria-label="Expected reuses"
            min={0}
            max={100}
            step={1}
            value={reuseCount}
            onChange={(e) => setReuseCount(Number(e.target.value))}
            className="w-full mb-2"
            style={{ accentColor: 'var(--accent)' }}
          />
          <input
            id="cache-reuses"
            type="number"
            min={0}
            max={1000}
            value={reuseCount}
            onChange={(e) => setReuseCount(Math.round(clamp(Number(e.target.value), 1000)))}
            className={field}
          />
          <p className={`mt-2 text-xs ${muted}`}>
            Calls that read the cache after the first call writes it
          </p>
        </div>

        <div className={card}>
          <h3 className={heading}>Caching Economics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className={muted}>Cache write cost</span>
              <span>{(breakeven.writeMultiplier * 100).toFixed(0)}% of input cost</span>
            </div>
            <div className="flex justify-between">
              <span className={muted}>Cache read cost</span>
              <span>{(breakeven.readMultiplier * 100).toFixed(0)}% of input cost</span>
            </div>
            <div className="flex justify-between">
              <span className={muted}>Savings per reuse</span>
              <span className="text-(--green)">{((1 - breakeven.readMultiplier) * 100).toFixed(0)}% of input cost</span>
            </div>
            <div className="border-t border-(--border) pt-3 flex justify-between font-medium">
              <span>Break-even</span>
              <span className="text-(--accent)">
                {Number.isFinite(analysis.breakEvenReuses) ? `${analysis.breakEvenReuses.toFixed(2)} reuses` : 'never'}
              </span>
            </div>
            <p className={`text-xs ${muted}`}>
              (write - input) / (input - read). The first call pays the write premium; each reuse saves input minus read.
              {paysFrom !== null && ` Caching pays from reuse ${paysFrom}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl p-6 border-2" style={{ borderColor: verdictColor }} role="status">
          <h2 className="text-xl font-bold mb-3" style={{ color: verdictColor }}>
            {analysis.shouldCache ? 'Cache it' : "Don't cache"}
          </h2>
          <p className="text-lg">{analysis.recommendation}</p>
        </div>

        <div className={card}>
          <h3 className={heading}>Cost Comparison</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-(--bg-muted)">
              <div className={`text-sm ${muted}`}>Without Caching</div>
              <div className="text-2xl font-bold">{formatCost(analysis.totalWithoutCaching)}</div>
            </div>
            <div className="p-4 rounded-lg bg-(--accent-bg)">
              <div className={`text-sm ${muted}`}>With Caching</div>
              <div className="text-2xl font-bold">{formatCost(analysis.totalWithCaching)}</div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-(--bg-muted)">
            <div className="flex justify-between items-center">
              <span className={muted}>{analysis.netSavings >= 0 ? 'You Save' : 'Extra Cost'}</span>
              <span className="text-xl font-bold" style={{ color: analysis.netSavings >= 0 ? 'var(--green)' : 'var(--accent)' }}>
                {formatCost(Math.abs(analysis.netSavings))} ({Math.abs(analysis.savingsPercent).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        <div className={card}>
          <h3 className={heading}>Detailed Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left ${muted}`}>
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1">Cache Write (first call)</td>
                <td className="py-1 text-right">{formatCost(analysis.cacheWriteCost)}</td>
              </tr>
              <tr>
                <td className="py-1">Cache Read x {reuseCount}</td>
                <td className="py-1 text-right">{formatCost(analysis.cacheReadCostPerUse * reuseCount)}</td>
              </tr>
              <tr className="border-t border-(--border)">
                <td className="py-1 font-medium">Total with Caching</td>
                <td className="py-1 text-right font-medium">{formatCost(analysis.totalWithCaching)}</td>
              </tr>
              <tr className={muted}>
                <td className="py-1">vs. Input x {reuseCount + 1}</td>
                <td className="py-1 text-right">{formatCost(analysis.totalWithoutCaching)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={card}>
          <h3 className={heading}>Cost Over Reuses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis
                  dataKey="reuses"
                  stroke={P.g7}
                  tick={{ fill: P.g7 }}
                  label={{ value: 'Reuses', position: 'bottom', offset: -5, fill: P.g7 }}
                />
                <YAxis stroke={P.g7} tick={{ fill: P.g7 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip
                  {...tt}
                  formatter={(value) => formatCost(Number(value))}
                  labelFormatter={(label) => `${label} reuses`}
                />
                <Legend />
                <Line type="monotone" dataKey="withoutCaching" name="Without Caching" stroke={P.g7} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="withCaching" name="With Caching" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {paysFrom !== null && (
            <p className={`mt-2 text-xs text-center ${muted}`}>
              Lines cross at break-even ({analysis.breakEvenReuses.toFixed(2)} reuses)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
