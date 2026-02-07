'use client';

import { useState } from 'react';
import { CostComparisonChart, ContextWindowChart, PriceQualityChart } from '@/components/comparison-charts';

export default function ComparePage() {
  const [inputTokens, setInputTokens] = useState(100000);
  const [outputTokens, setOutputTokens] = useState(10000);

  return (
    <div className="dark bg-eco-black min-h-screen text-eco-white p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="headline">Model Comparison</h1>
        <p className="subheadline mt-2">
          Compare pricing, capabilities, and efficiency across AI providers
        </p>
        <div className="eco-divider-thick w-24 mt-4" />
      </header>

      {/* Token Input Controls */}
      <section className="mb-8">
        <div className="eco-card-flat">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
            Configure Token Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="data-label block mb-2">Input Tokens</label>
              <input
                type="range"
                min="10000"
                max="1000000"
                step="10000"
                value={inputTokens}
                onChange={(e) => setInputTokens(Number(e.target.value))}
                className="w-full accent-eco-red"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted">10K</span>
                <span className="text-sm font-semibold">{(inputTokens / 1000).toFixed(0)}K</span>
                <span className="text-xs text-muted">1M</span>
              </div>
            </div>
            <div>
              <label className="data-label block mb-2">Output Tokens</label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={outputTokens}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                className="w-full accent-eco-red"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted">1K</span>
                <span className="text-sm font-semibold">{(outputTokens / 1000).toFixed(0)}K</span>
                <span className="text-xs text-muted">100K</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="space-y-8">
        <CostComparisonChart inputTokens={inputTokens} outputTokens={outputTokens} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContextWindowChart />
          <PriceQualityChart />
        </div>
      </div>
    </div>
  );
}
