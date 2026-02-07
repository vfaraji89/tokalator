'use client';

import { useState } from 'react';
import { CostComparisonChart, ContextWindowChart, PriceQualityChart } from '@/components/comparison-charts';

export default function ComparePage() {
  const [inputTokens, setInputTokens] = useState(100000);
  const [outputTokens, setOutputTokens] = useState(10000);

  return (
    <article className="article">
      <header>
        <h1>Model Comparison</h1>
        <p className="tagline">
          Compare pricing, capabilities, and efficiency across AI providers.
        </p>
      </header>

      {/* Token Input Controls */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Configure Token Usage</h2>
        <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="feature-item">
            <h3>Input Tokens</h3>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="10000"
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <p>{(inputTokens / 1000).toFixed(0)}K tokens</p>
          </div>
          <div className="feature-item">
            <h3>Output Tokens</h3>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <p>{(outputTokens / 1000).toFixed(0)}K tokens</p>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Cost Comparison</h2>
        <CostComparisonChart inputTokens={inputTokens} outputTokens={outputTokens} />
      </section>

      <section>
        <div className="section-divider" />
        <div className="feature-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <h2 className="section-header">Context Windows</h2>
            <ContextWindowChart />
          </div>
          <div>
            <h2 className="section-header">Price vs Quality</h2>
            <PriceQualityChart />
          </div>
        </div>
      </section>
    </article>
  );
}
