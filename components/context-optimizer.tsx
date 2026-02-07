'use client';

import { useState, useMemo } from 'react';
import {
  analyzeContextBudget,
  estimateTokens,
  formatTokenCount,
  calculateRemainingTurns,
  getModelLimits,
} from '@/lib/context';
import { getModelInfo, formatCost, calculateCost } from '@/lib/pricing';

const models = [
  'claude-opus-4.6',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
] as const;

export function ContextOptimizer() {
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4.5');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [userMessage, setUserMessage] = useState<string>('');
  const [reservedOutput, setReservedOutput] = useState<number>(4000);

  const limits = getModelLimits(selectedModel);

  const systemTokens = useMemo(() => estimateTokens(systemPrompt), [systemPrompt]);
  const userTokens = useMemo(() => estimateTokens(userMessage), [userMessage]);

  const analysis = useMemo(() => analyzeContextBudget({
    systemPromptTokens: systemTokens,
    userInputTokens: userTokens,
    reservedOutputTokens: reservedOutput,
    model: selectedModel,
  }), [systemTokens, userTokens, reservedOutput, selectedModel]);

  const avgTurnTokens = userTokens + reservedOutput;
  const remainingTurns = calculateRemainingTurns(
    systemTokens + userTokens,
    avgTurnTokens,
    selectedModel
  );

  const estimatedCost = useMemo(() => calculateCost(
    selectedModel,
    {
      inputTokens: systemTokens + userTokens,
      outputTokens: reservedOutput,
      promptLength: systemTokens + userTokens,
    }
  ), [selectedModel, systemTokens, userTokens, reservedOutput]);

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
          {limits && (
            <p className="mt-3 text-sm text-gray-500">
              Context: {formatTokenCount(limits.contextWindow)} | Max Output: {formatTokenCount(limits.maxOutput)}
            </p>
          )}
        </div>

        {/* System Prompt */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              System Prompt
            </label>
            <span className="text-sm text-gray-500">
              ~{formatTokenCount(systemTokens)} tokens
            </span>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
            placeholder="Enter your system prompt to estimate token usage..."
          />
        </div>

        {/* User Message */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              User Message (Template)
            </label>
            <span className="text-sm text-gray-500">
              ~{formatTokenCount(userTokens)} tokens
            </span>
          </div>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
            placeholder="Enter a typical user message..."
          />
        </div>

        {/* Reserved Output */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reserved Output Tokens
            </label>
            <span className="text-sm text-gray-500">
              {formatTokenCount(reservedOutput)}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={limits?.maxOutput || 64000}
            step={100}
            value={reservedOutput}
            onChange={(e) => setReservedOutput(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>100</span>
            <span>{formatTokenCount(limits?.maxOutput || 64000)}</span>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="space-y-6">
        {/* Context Budget Visual */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Context Budget
          </h2>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                {formatTokenCount(analysis.totalUsed)} / {formatTokenCount(analysis.totalAvailable)}
              </span>
              <span className={`font-medium ${
                analysis.usagePercent > 90 ? 'text-red-500' :
                analysis.usagePercent > 70 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {analysis.usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex">
              <div
                className="bg-purple-500 transition-all"
                style={{ width: `${analysis.breakdown.systemPrompt.percent}%` }}
                title={`System: ${formatTokenCount(analysis.breakdown.systemPrompt.tokens)}`}
              />
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${analysis.breakdown.userInput.percent}%` }}
                title={`User: ${formatTokenCount(analysis.breakdown.userInput.tokens)}`}
              />
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${analysis.breakdown.reservedOutput.percent}%` }}
                title={`Output: ${formatTokenCount(analysis.breakdown.reservedOutput.tokens)}`}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">System</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">User</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Output</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Free</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Remaining</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTokenCount(analysis.remaining)}
            </div>
            <div className="text-xs text-gray-400">tokens available</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Est. Cost</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCost(estimatedCost.totalCost)}
            </div>
            <div className="text-xs text-gray-400">per request</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">More Turns</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {remainingTurns > 100 ? '100+' : remainingTurns}
            </div>
            <div className="text-xs text-gray-400">before limit</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Pricing Tier</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {analysis.isInExtendedPricing ? 'Extended' : 'Standard'}
            </div>
            <div className="text-xs text-gray-400">
              {selectedModel === 'claude-sonnet-4.5' ? '(200K threshold)' : 'N/A'}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Warnings
            </h3>
            <ul className="space-y-1">
              {analysis.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                  <span>!</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Breakdown Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Token Breakdown
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2">Component</th>
                <th className="pb-2 text-right">Tokens</th>
                <th className="pb-2 text-right">%</th>
              </tr>
            </thead>
            <tbody className="text-gray-900 dark:text-white">
              <tr>
                <td className="py-1">System Prompt</td>
                <td className="py-1 text-right">{formatTokenCount(analysis.breakdown.systemPrompt.tokens)}</td>
                <td className="py-1 text-right">{analysis.breakdown.systemPrompt.percent.toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-1">User Input</td>
                <td className="py-1 text-right">{formatTokenCount(analysis.breakdown.userInput.tokens)}</td>
                <td className="py-1 text-right">{analysis.breakdown.userInput.percent.toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-1">Reserved Output</td>
                <td className="py-1 text-right">{formatTokenCount(analysis.breakdown.reservedOutput.tokens)}</td>
                <td className="py-1 text-right">{analysis.breakdown.reservedOutput.percent.toFixed(1)}%</td>
              </tr>
              <tr className="border-t dark:border-gray-700">
                <td className="py-1 font-medium">Free Space</td>
                <td className="py-1 text-right font-medium">{formatTokenCount(analysis.breakdown.free.tokens)}</td>
                <td className="py-1 text-right font-medium">{analysis.breakdown.free.percent.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
