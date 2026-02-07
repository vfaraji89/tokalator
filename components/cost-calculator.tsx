'use client';

import { useState } from 'react';
import {
  calculateCost,
  calculateQuality,
  formatCost,
  formatTokens,
  getModelInfo,
  ANTHROPIC_PRICING,
  MODEL_PARAMS,
  type CostBreakdown,
} from '@/lib/pricing';

const models = [
  'claude-opus-4.5',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
] as const;

export function CostCalculator() {
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4.5');
  const [inputTokens, setInputTokens] = useState<number>(10000);
  const [outputTokens, setOutputTokens] = useState<number>(5000);
  const [cacheWriteTokens, setCacheWriteTokens] = useState<number>(0);
  const [cacheReadTokens, setCacheReadTokens] = useState<number>(0);
  const [webSearches, setWebSearches] = useState<number>(0);
  const [codeExecMinutes, setCodeExecMinutes] = useState<number>(0);
  const [promptLength, setPromptLength] = useState<number>(0);

  const modelInfo = getModelInfo(selectedModel);
  const params = MODEL_PARAMS[selectedModel];
  
  const cost: CostBreakdown = calculateCost(
    selectedModel,
    { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, promptLength },
    { webSearches, codeExecMinutes }
  );

  const qualityScore = calculateQuality(
    inputTokens,
    outputTokens,
    cacheWriteTokens + cacheReadTokens,
    params
  );

  const isSonnet = selectedModel === 'claude-sonnet-4.5';
  const isExtendedContext = isSonnet && promptLength > 200000;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Token Input
        </h2>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model
          </label>
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
          <p className="mt-2 text-sm text-gray-500">{modelInfo.description}</p>
        </div>

        {/* Sonnet Context Length */}
        {isSonnet && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              Prompt Length (for tiered pricing)
            </label>
            <input
              type="number"
              value={promptLength}
              onChange={(e) => setPromptLength(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              {isExtendedContext 
                ? '⚠️ Extended context pricing applies (>200K tokens)'
                : 'Standard pricing (≤200K tokens)'}
            </p>
          </div>
        )}

        {/* Token Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Input Tokens
            </label>
            <input
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Output Tokens
            </label>
            <input
              type="number"
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cache Write Tokens
              </label>
              <input
                type="number"
                value={cacheWriteTokens}
                onChange={(e) => setCacheWriteTokens(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cache Read Tokens
              </label>
              <input
                type="number"
                value={cacheReadTokens}
                onChange={(e) => setCacheReadTokens(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Web Searches
              </label>
              <input
                type="number"
                value={webSearches}
                onChange={(e) => setWebSearches(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code Exec (minutes)
              </label>
              <input
                type="number"
                value={codeExecMinutes}
                onChange={(e) => setCodeExecMinutes(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Small', input: 1000, output: 500 },
              { label: 'Medium', input: 10000, output: 5000 },
              { label: 'Large', input: 100000, output: 50000 },
              { label: 'XL', input: 500000, output: 100000 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setInputTokens(preset.input);
                  setOutputTokens(preset.output);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="space-y-6">
        {/* Total Cost Card */}
        <div 
          className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 text-white"
          style={{ backgroundColor: modelInfo.color }}
        >
          <h3 className="text-lg font-medium opacity-90">Total Cost</h3>
          <div className="text-4xl font-bold mt-2">
            {formatCost(cost.totalCost)}
          </div>
          <div className="mt-2 text-sm opacity-75">
            {formatTokens(inputTokens + outputTokens)} total tokens
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Cost Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Input Tokens', value: cost.inputCost, tokens: inputTokens },
              { label: 'Output Tokens', value: cost.outputCost, tokens: outputTokens },
              { label: 'Cache Write', value: cost.cacheWriteCost, tokens: cacheWriteTokens },
              { label: 'Cache Read', value: cost.cacheReadCost, tokens: cacheReadTokens },
              { label: 'Web Search', value: cost.webSearchCost, count: webSearches },
              { label: 'Code Execution', value: cost.codeExecCost, minutes: codeExecMinutes },
            ].filter(item => item.value > 0).map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.label}
                  {'tokens' in item && item.tokens !== undefined && item.tokens > 0 && (
                    <span className="text-xs ml-1">({formatTokens(item.tokens)})</span>
                  )}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCost(item.value)}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between items-center font-semibold">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-purple-600 dark:text-purple-400">
                {formatCost(cost.totalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Quality Metrics (Cobb-Douglas)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Quality Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {qualityScore.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Cost per Quality</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCost(cost.totalCost / (qualityScore || 1))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Q = X<sup>α</sup> × Y<sup>β</sup> × (b + Z)<sup>γ</sup> where α={params.alphaParam}, β={params.betaParam}, γ={params.gammaParam}, b={params.baseQuality}
          </p>
        </div>

        {/* Pricing Reference */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Current Pricing ({modelInfo.displayName})
          </h3>
          <div className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
            {selectedModel === 'claude-sonnet-4.5' ? (
              <>
                <p><strong>≤200K tokens:</strong> Input $3/MTok, Output $15/MTok</p>
                <p><strong>&gt;200K tokens:</strong> Input $6/MTok, Output $22.50/MTok</p>
              </>
            ) : (
              <>
                <p>Input: ${ANTHROPIC_PRICING[selectedModel as keyof typeof ANTHROPIC_PRICING].standard.inputCostPerMTok}/MTok</p>
                <p>Output: ${ANTHROPIC_PRICING[selectedModel as keyof typeof ANTHROPIC_PRICING].standard.outputCostPerMTok}/MTok</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
