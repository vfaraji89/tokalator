'use client';

import { useState } from 'react';
import { CostComparisonChart, ContextWindowChart, PriceQualityChart } from '@/components/comparison-charts';

export default function ComparePage() {
  const [inputTokens, setInputTokens] = useState(100000);
  const [outputTokens, setOutputTokens] = useState(10000);

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="6" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="16" y="6" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="12" y1="11" x2="16" y2="11" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="14" x2="16" y2="14" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="17" x2="16" y2="17" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Model Comparison</span>
        </h1>
        <p className="hero-description">
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
