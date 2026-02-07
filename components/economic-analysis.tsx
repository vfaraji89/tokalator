'use client';

import { useState } from 'react';
import { 
  calculateQuality, 
  calculateCachingThreshold,
  ANTHROPIC_PRICING,
  formatCost 
} from '@/lib/pricing';

type ModelId = 'claude-opus-4.6' | 'claude-sonnet-4.5' | 'claude-haiku-4.5';

export function EconomicAnalysis() {
  const [model, setModel] = useState<ModelId>('claude-sonnet-4.5');
  const [inputTokens, setInputTokens] = useState(100000);
  const [outputTokens, setOutputTokens] = useState(50000);
  const [cacheTokens, setCacheTokens] = useState(20000);
  const [reuses, setReuses] = useState(5);

  // Cobb-Douglas parameters
  const [alpha, setAlpha] = useState(0.3);
  const [beta, setBeta] = useState(0.4);
  const [gamma, setGamma] = useState(0.2);
  const baseQuality = 1.0;

  const quality = calculateQuality(inputTokens, outputTokens, cacheTokens, { 
    alphaParam: alpha, 
    betaParam: beta, 
    gammaParam: gamma, 
    baseQuality 
  });
  const cachingThreshold = calculateCachingThreshold(model);

  // Calculate costs with and without caching
  const pricingData = ANTHROPIC_PRICING[model];
  const pricing = pricingData.standard;
  const costWithoutCache = (inputTokens * pricing.inputCostPerMTok + outputTokens * pricing.outputCostPerMTok) * reuses / 1_000_000;
  const costWithCache = (
    (inputTokens - cacheTokens) * pricing.inputCostPerMTok +
    outputTokens * pricing.outputCostPerMTok +
    cacheTokens * pricing.cacheWriteCostPerMTok +
    cacheTokens * pricing.cacheReadCostPerMTok * (reuses - 1)
  ) * 1 / 1_000_000 + (
    (inputTokens - cacheTokens) * pricing.inputCostPerMTok +
    outputTokens * pricing.outputCostPerMTok +
    cacheTokens * pricing.cacheReadCostPerMTok
  ) * (reuses - 1) / 1_000_000;

  const cachingSavings = costWithoutCache - costWithCache;
  const cachingROI = cachingSavings > 0 ? (cachingSavings / (cacheTokens * pricing.cacheWriteCostPerMTok / 1_000_000)) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Quality Function Calculator */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Quality Function Analysis
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Based on the Cobb-Douglas production function from Bergemann, Bonatti, Smolin (2025):
          <span className="font-mono ml-2">Q = X<sup>α</sup> × Y<sup>β</sup> × (b + Z)<sup>γ</sup></span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Token Inputs</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Input Tokens (X): {inputTokens.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="500000"
                step="1000"
                value={inputTokens}
                onChange={(e) => setInputTokens(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Output Tokens (Y): {outputTokens.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="200000"
                step="1000"
                value={outputTokens}
                onChange={(e) => setOutputTokens(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cache Tokens (Z): {cacheTokens.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={cacheTokens}
                onChange={(e) => setCacheTokens(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white pt-4">Sensitivity Parameters</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  α: {alpha.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  β: {beta.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={beta}
                  onChange={(e) => setBeta(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  γ: {gamma.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={gamma}
                  onChange={(e) => setGamma(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Note: α + β + γ = {(alpha + beta + gamma).toFixed(2)} (should be &lt; 1 for diminishing returns)
            </p>
          </div>

          {/* Results */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quality Score</h3>
            
            <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-4">
              {quality.toFixed(2)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Input contribution (X<sup>α</sup>)</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {Math.pow(inputTokens, alpha).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Output contribution (Y<sup>β</sup>)</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {Math.pow(outputTokens, beta).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cache contribution ((b+Z)<sup>γ</sup>)</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {Math.pow(baseQuality + cacheTokens, gamma).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The quality function captures how more tokens (input context, output detail, cached knowledge) 
                improve response quality with diminishing returns. Parameters α, β, γ represent sensitivity 
                to each token type.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Caching ROI Calculator */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Caching ROI Calculator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Calculate the return on investment for prompt caching based on reuse patterns.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelId)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="claude-opus-4.6">Claude Opus 4.6</option>
                <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
                <option value="claude-haiku-4.5">Claude Haiku 4.5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Reuses: {reuses}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={reuses}
                onChange={(e) => setReuses(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Break-even Threshold
              </h4>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {cachingThreshold.toFixed(1)} reuses
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Minimum reuses needed for caching to be cost-effective
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Cost Comparison</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Without Caching</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCost(costWithoutCache)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">With Caching</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCost(costWithCache)}
                </span>
              </div>

              <div className="border-t dark:border-gray-600 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Savings</span>
                  <span className={`text-xl font-bold ${cachingSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCost(cachingSavings)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600 dark:text-gray-400">ROI</span>
                  <span className={`text-xl font-bold ${cachingROI > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {cachingROI > 0 ? '+' : ''}{cachingROI.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {reuses < cachingThreshold && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ With only {reuses} reuses, caching is not cost-effective for {model}. 
                  You need at least {Math.ceil(cachingThreshold)} reuses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Selection Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Model Selection Guide
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Use Case</th>
                <th className="text-center py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">Opus 4.5</th>
                <th className="text-center py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">Sonnet 4.5</th>
                <th className="text-center py-3 px-4 font-semibold text-green-600 dark:text-green-400">Haiku 4.5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Complex reasoning & analysis</td>
                <td className="py-3 px-4 text-center">✅ Best</td>
                <td className="py-3 px-4 text-center">✓ Good</td>
                <td className="py-3 px-4 text-center">—</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Code generation</td>
                <td className="py-3 px-4 text-center">✅ Best</td>
                <td className="py-3 px-4 text-center">✅ Great</td>
                <td className="py-3 px-4 text-center">✓ Good</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Content creation</td>
                <td className="py-3 px-4 text-center">✅ Best</td>
                <td className="py-3 px-4 text-center">✅ Great</td>
                <td className="py-3 px-4 text-center">✓ Good</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Data extraction</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center">✓ Good</td>
                <td className="py-3 px-4 text-center">✅ Best</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Classification</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center">✓ Good</td>
                <td className="py-3 px-4 text-center">✅ Best</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">High-volume processing</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center">✓ Good</td>
                <td className="py-3 px-4 text-center">✅ Best</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Real-time chat</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center">✅ Best</td>
                <td className="py-3 px-4 text-center">✅ Great</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cost Efficiency Tips</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Use Haiku for simple tasks to save up to 80% compared to Opus</li>
            <li>• Implement prompt caching for repeated contexts (system prompts, documents)</li>
            <li>• Consider Sonnet's tiered pricing - stay under 200K context when possible</li>
            <li>• Use batch processing for non-time-sensitive workloads</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
