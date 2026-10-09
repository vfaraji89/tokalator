'use client';

import { useState } from 'react';
import { CostComparisonChart, ContextWindowChart } from '@/components/comparison-charts';
import { PROVIDER_MODELS } from '@/lib/providers';

const MAX_INPUT = Math.max(...PROVIDER_MODELS.map(m => m.contextWindow));
const MAX_OUTPUT = Math.max(...PROVIDER_MODELS.map(m => m.maxOutput));

export function CompareClient() {
  const [inputTokens, setInputTokens] = useState(100000);
  const [outputTokens, setOutputTokens] = useState(10000);

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="6" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="16" y="6" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="12" y1="11" x2="16" y2="11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="14" x2="16" y2="14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="17" x2="16" y2="17" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">Model Comparison</span>
        </h1>
        <p className="hero-description">
          Rank {PROVIDER_MODELS.length} models by request cost and compare context windows.
        </p>
      </header>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Configure Token Usage</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <h3><label htmlFor="compare-input">Input Tokens</label></h3>
            <input
              id="compare-input"
              type="range"
              min="10000"
              max={MAX_INPUT}
              step="10000"
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <p>{(inputTokens / 1000).toFixed(0)}K tokens</p>
          </div>
          <div className="feature-item">
            <h3><label htmlFor="compare-output">Output Tokens</label></h3>
            <input
              id="compare-output"
              type="range"
              min="1000"
              max={MAX_OUTPUT}
              step="1000"
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <p>{(outputTokens / 1000).toFixed(0)}K tokens</p>
          </div>
        </div>
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Cost Comparison</h2>
        <CostComparisonChart inputTokens={inputTokens} outputTokens={outputTokens} />
      </section>

      <section>
        <div className="section-divider" />
        <h2 className="section-header">Context Windows</h2>
        <ContextWindowChart />
      </section>
    </article>
  );
}
