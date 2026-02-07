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
import { getModelInfo, formatCost } from '@/lib/pricing';
import { formatTokenCount } from '@/lib/context';

const models = [
  'claude-opus-4.5',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
] as const;

const strategies: ContextStrategy[] = ['full', 'sliding-window', 'summarize'];

export function ConversationEstimator() {
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4.5');
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
        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Model
          </h3>
          <div className="space-y-2">
            {models.map((model) => {
              const info = getModelInfo(model);
              return (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full p-2 rounded-lg border-2 transition-all text-left ${
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

        {/* Token Inputs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Token Sizes
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">System Prompt</label>
              <input
                type="number"
                value={systemPromptTokens}
                onChange={(e) => setSystemPromptTokens(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Avg User Message</label>
              <input
                type="number"
                value={avgUserTokens}
                onChange={(e) => setAvgUserTokens(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Avg Assistant Response</label>
              <input
                type="number"
                value={avgAssistantTokens}
                onChange={(e) => setAvgAssistantTokens(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Turn Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Conversation Length
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-500">Number of Turns</label>
                <span className="text-xs text-gray-500">{turns}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={turns}
                onChange={(e) => setTurns(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <input
              type="number"
              value={turns}
              onChange={(e) => setTurns(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
            />
          </div>
        </div>

        {/* Strategy Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Strategy Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">Sliding Window Size</label>
              <input
                type="number"
                value={windowSize}
                onChange={(e) => setWindowSize(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Keep last N turns</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Compression Ratio</label>
              <input
                type="number"
                value={compressionRatio}
                step={0.05}
                min={0.05}
                max={0.5}
                onChange={(e) => setCompressionRatio(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{(compressionRatio * 100).toFixed(0)}% of original</p>
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
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${
                isLowest ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {desc.name}
                  </h3>
                  <p className="text-xs text-gray-500">{desc.description}</p>
                </div>
                {isLowest && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Cheapest
                  </span>
                )}
              </div>

              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {formatCost(analysis.totalCost)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Final Context</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatTokenCount(analysis.finalContextSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Peak Context</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatTokenCount(analysis.peakContextSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Cost/Turn</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCost(analysis.avgCostPerTurn)}
                  </span>
                </div>
                {analysis.exceedsLimit && (
                  <div className="text-red-500 text-xs mt-2">
                    Exceeds limit at turn {analysis.limitExceededAtTurn}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-xs text-gray-500 mb-2">Pros & Cons</div>
                <div className="space-y-1">
                  {desc.pros.slice(0, 2).map((pro, i) => (
                    <div key={i} className="text-xs text-green-600">+ {pro}</div>
                  ))}
                  {desc.cons.slice(0, 1).map((con, i) => (
                    <div key={i} className="text-xs text-red-500">- {con}</div>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Context Size Over Turns
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="turn" />
                <YAxis tickFormatter={(v) => formatTokenCount(v)} />
                <Tooltip
                  formatter={(value) => formatTokenCount(Number(value))}
                  labelFormatter={(label) => `Turn ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="full"
                  name="Full Context"
                  stroke="#6B7280"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="slidingWindow"
                  name="Sliding Window"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="summarize"
                  name="Summarize"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Cost Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Cumulative Cost Over Turns
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="turn" />
                <YAxis tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip
                  formatter={(value) => formatCost(Number(value))}
                  labelFormatter={(label) => `Turn ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="full"
                  name="Full Context"
                  stroke="#6B7280"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="slidingWindow"
                  name="Sliding Window"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="summarize"
                  name="Summarize"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Turn-by-Turn Breakdown (Full Context)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="pb-2 pr-4">Turn</th>
                <th className="pb-2 pr-4">Input Tokens</th>
                <th className="pb-2 pr-4">Output Tokens</th>
                <th className="pb-2 pr-4">Context Size</th>
                <th className="pb-2 pr-4">Turn Cost</th>
                <th className="pb-2">Cumulative</th>
              </tr>
            </thead>
            <tbody className="text-gray-900 dark:text-white">
              {comparison.full.turnBreakdown.slice(0, 10).map((turn) => (
                <tr key={turn.turn} className="border-b dark:border-gray-700">
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
                  <td colSpan={6} className="py-2 text-center text-gray-500">
                    ... and {turns - 10} more turns
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
