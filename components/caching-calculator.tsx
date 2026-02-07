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
import { getModelInfo, formatCost } from '@/lib/pricing';
import { formatTokenCount } from '@/lib/context';

const models = [
  'claude-opus-4.5',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
] as const;

export function CachingCalculator() {
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4.5');
  const [cacheTokens, setCacheTokens] = useState<number>(50000);
  const [reuseCount, setReuseCount] = useState<number>(5);

  const analysis = useMemo(() => analyzeCaching({
    cacheTokens,
    reuseCount,
    model: selectedModel,
  }), [cacheTokens, reuseCount, selectedModel]);

  const breakeven = useMemo(() => calculateBreakeven(selectedModel), [selectedModel]);

  const chartData = useMemo(() =>
    generateCostComparisonData(cacheTokens, selectedModel, 15),
    [cacheTokens, selectedModel]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <div className="space-y-6">
        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Model Selection
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {models.map((model) => {
              const info = getModelInfo(model);
              return (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedModel === model
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {info.displayName.split(' ').slice(1).join(' ')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cache Size Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tokens to Cache
            </label>
            <span className="text-sm text-gray-500">
              {formatTokenCount(cacheTokens)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={200000}
            step={1000}
            value={cacheTokens}
            onChange={(e) => setCacheTokens(Number(e.target.value))}
            className="w-full mb-2"
          />
          <input
            type="number"
            value={cacheTokens}
            onChange={(e) => setCacheTokens(Math.max(0, Number(e.target.value)))}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <p className="mt-2 text-xs text-gray-500">
            System prompt, few-shot examples, or any reusable context
          </p>
        </div>

        {/* Reuse Count Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected Reuses
            </label>
            <span className="text-sm text-gray-500">
              {reuseCount} times
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={reuseCount}
            onChange={(e) => setReuseCount(Number(e.target.value))}
            className="w-full mb-2"
          />
          <input
            type="number"
            value={reuseCount}
            onChange={(e) => setReuseCount(Math.max(0, Number(e.target.value)))}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <p className="mt-2 text-xs text-gray-500">
            How many times will you reuse this cached content?
          </p>
        </div>

        {/* Break-even Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Caching Economics
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache write cost</span>
              <span className="text-gray-900 dark:text-white">
                {(breakeven.writeMultiplier * 100).toFixed(0)}% of input cost
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache read cost</span>
              <span className="text-gray-900 dark:text-white">
                {(breakeven.readMultiplier * 100).toFixed(0)}% of input cost
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Savings per reuse</span>
              <span className="text-green-600 dark:text-green-400">
                {((1 - breakeven.readMultiplier) * 100).toFixed(0)}% of input cost
              </span>
            </div>
            <div className="border-t dark:border-gray-700 pt-3 flex justify-between font-medium">
              <span className="text-gray-900 dark:text-white">Break-even point</span>
              <span className="text-purple-600 dark:text-purple-400">
                {breakeven.breakEvenReuses.toFixed(2)} reuses
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="space-y-6">
        {/* Recommendation Card */}
        <div className={`rounded-xl shadow-lg p-6 ${
          analysis.shouldCache
            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{analysis.shouldCache ? 'V' : 'X'}</span>
            <h2 className={`text-xl font-bold ${
              analysis.shouldCache
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {analysis.shouldCache ? 'CACHE IT!' : "DON'T CACHE"}
            </h2>
          </div>
          <p className={`text-lg ${
            analysis.shouldCache
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {analysis.recommendation}
          </p>
        </div>

        {/* Cost Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Cost Comparison
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Without Caching</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCost(analysis.totalWithoutCaching)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400">With Caching</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCost(analysis.totalWithCaching)}
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            analysis.netSavings >= 0
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                {analysis.netSavings >= 0 ? 'You Save' : 'Extra Cost'}
              </span>
              <span className={`text-xl font-bold ${
                analysis.netSavings >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCost(Math.abs(analysis.netSavings))} ({Math.abs(analysis.savingsPercent).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Detailed Breakdown
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="text-gray-900 dark:text-white">
              <tr>
                <td className="py-1">Cache Write (one-time)</td>
                <td className="py-1 text-right">{formatCost(analysis.cacheWriteCost)}</td>
              </tr>
              <tr>
                <td className="py-1">Cache Read x {reuseCount}</td>
                <td className="py-1 text-right">{formatCost(analysis.cacheReadCostPerUse * reuseCount)}</td>
              </tr>
              <tr className="border-t dark:border-gray-700">
                <td className="py-1 font-medium">Total with Caching</td>
                <td className="py-1 text-right font-medium">{formatCost(analysis.totalWithCaching)}</td>
              </tr>
              <tr className="text-gray-500">
                <td className="py-1">vs. Input x {reuseCount + 1}</td>
                <td className="py-1 text-right">{formatCost(analysis.totalWithoutCaching)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Cost Over Reuses
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="reuses"
                  label={{ value: 'Reuses', position: 'bottom', offset: -5 }}
                />
                <YAxis
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <Tooltip
                  formatter={(value) => formatCost(Number(value))}
                  labelFormatter={(label) => `${label} reuses`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="withoutCaching"
                  name="Without Caching"
                  stroke="#6B7280"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="withCaching"
                  name="With Caching"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Lines cross at break-even point (~{breakeven.breakEvenReuses.toFixed(1)} reuses)
          </p>
        </div>
      </div>
    </div>
  );
}
