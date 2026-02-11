'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { PROVIDER_MODELS } from '@/lib/providers';
import { formatCost } from '@/lib/pricing';

const P = {
  red: '#e3120b', black: '#111', white: '#fff',
  g1: '#f3f3f3', g3: '#ccc', g5: '#888', g7: '#555',
};
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };
const ls: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', color: P.g7, marginBottom: '0.25rem' };
const ss: React.CSSProperties = { width: '100%', accentColor: P.red };

const PROVIDER_COLORS: Record<string, string> = { anthropic: P.black, openai: '#10a37f', google: '#4285f4' };

// Cache pricing data for break-even (input $/MTok, cache_write $/MTok, cache_read $/MTok)
const CACHE_PRICING: Record<string, [number, number, number]> = {
  'claude-opus-4.6': [5.0, 6.25, 0.50],
  'claude-sonnet-4.5': [3.0, 3.75, 0.30],
  'claude-haiku-4.5': [1.0, 1.25, 0.10],
  'gpt-5.2': [1.75, 1.75, 0.175],
  'gpt-4.1': [3.0, 3.0, 0.75],
  'gpt-4.1-mini': [0.80, 0.80, 0.20],
  'gemini-3-pro': [2.0, 2.0, 0.50],
  'gemini-2.5-pro': [1.25, 1.25, 0.125],
  'gemini-2.5-flash': [0.30, 0.30, 0.03],
};

type Tab = 'quality' | 'caching';

export default function EconomicsPage() {
  const [tab, setTab] = useState<Tab>('quality');

  // ── Quality state ──
  const [inputTokens, setInputTokens] = useState(50000);
  const [outputTokens, setOutputTokens] = useState(10000);
  const [cacheTokens, setCacheTokens] = useState(5000);
  const [alpha, setAlpha] = useState(0.30);
  const [beta, setBeta] = useState(0.35);
  const [gamma, setGamma] = useState(0.20);
  const bq = 1.0;

  // ── Caching state ──
  const [cacheModel, setCacheModel] = useState('claude-sonnet-4.5');
  const [cacheInput, setCacheInput] = useState(50000);
  const [cachePortion, setCachePortion] = useState(20000);
  const [reuses, setReuses] = useState(10);

  // Cobb-Douglas quality
  const quality = useMemo(() => {
    const X = Math.max(inputTokens / 1000, 0.001);
    const Y = Math.max(outputTokens / 1000, 0.001);
    const Z = cacheTokens / 1000;
    return Math.pow(X, alpha) * Math.pow(Y, beta) * Math.pow(bq + Z, gamma);
  }, [inputTokens, outputTokens, cacheTokens, alpha, beta, gamma]);

  // Diminishing returns curve
  const qualityCurve = useMemo(() => {
    const points = [];
    for (let t = 1; t <= 500; t += 5) {
      points.push({
        tokens: t,
        quality: Math.pow(t, alpha) * Math.pow(outputTokens / 1000, beta) * Math.pow(bq + cacheTokens / 1000, gamma),
      });
    }
    return points;
  }, [outputTokens, cacheTokens, alpha, beta, gamma]);

  // Model cost comparison
  const modelCosts = useMemo(() =>
    PROVIDER_MODELS.map(m => ({
      name: m.name.replace('Claude ', '').replace('Gemini ', 'G-'),
      cost: (inputTokens / 1_000_000) * m.inputCostPerMTok + (outputTokens / 1_000_000) * m.outputCostPerMTok,
      provider: m.provider,
    })).sort((a, b) => a.cost - b.cost),
    [inputTokens, outputTokens]
  );

  // Caching break-even
  const cachingCalc = useMemo(() => {
    const prices = CACHE_PRICING[cacheModel] || [3.0, 3.75, 0.30];
    const [inputPrice, cwPrice, crPrice] = prices;
    const cached = Math.min(cachePortion, cacheInput);
    const uncached = cacheInput - cached;

    const costNoCache1 = (cacheInput / 1_000_000) * inputPrice;
    const firstCall = (cached / 1_000_000) * cwPrice + (uncached / 1_000_000) * inputPrice;
    const reuseCall = (cached / 1_000_000) * crPrice + (uncached / 1_000_000) * inputPrice;

    const delta = costNoCache1 - reuseCall;
    const threshold = delta > 0 ? (firstCall - reuseCall) / delta : Infinity;

    const curve = Array.from({ length: 30 }, (_, i) => {
      const n = i + 1;
      return {
        reuses: n,
        noCache: costNoCache1 * n,
        withCache: firstCall + reuseCall * Math.max(0, n - 1),
      };
    });

    const no10 = costNoCache1 * 10;
    const with10 = firstCall + reuseCall * 9;
    const savings = no10 - with10;
    const roi = with10 > 0 ? (savings / with10) * 100 : 0;

    return { threshold, savings, roi, curve, costNoCache: costNoCache1 * reuses, costWithCache: firstCall + reuseCall * Math.max(0, reuses - 1) };
  }, [cacheModel, cacheInput, cachePortion, reuses]);

  // Radar data
  const radar = [
    { metric: 'Intelligence', anthropic: 95, openai: 90, google: 88 },
    { metric: 'Speed', anthropic: 75, openai: 85, google: 90 },
    { metric: 'Context', anthropic: 80, openai: 90, google: 95 },
    { metric: 'Cost', anthropic: 60, openai: 75, google: 85 },
    { metric: 'Caching', anthropic: 90, openai: 70, google: 75 },
    { metric: 'Coding', anthropic: 95, openai: 88, google: 85 },
  ];

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polyline points="7,20 11,14 15,16 21,8" stroke="#e3120b" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="7" y1="8" x2="7" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="7" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Economics</span></h1>
        <p className="hero-description">Cobb-Douglas quality model and caching break-even analysis.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: `1px solid ${P.g3}`, paddingBottom: '0.5rem' }}>
        {([['quality', 'Quality Model'], ['caching', 'Caching ROI']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: tab === t ? 600 : 400,
            background: tab === t ? P.black : 'transparent', color: tab === t ? P.white : P.g7,
            border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Quality Tab ── */}
      {tab === 'quality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="eco-card-flat">
            <h2 className="section-header">Q = X<sup>α</sup> × Y<sup>β</sup> × (b + Z)<sup>γ</sup></h2>
            <p style={{ color: P.g7, fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Bergemann, Bonatti, Smolin (2025) — The Economics of Large Language Models
            </p>
            <div className="feature-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <h3 style={{ marginBottom: '0.75rem' }}>Token Inputs</h3>
                {[
                  { l: `Input Tokens (X): ${(inputTokens / 1000).toFixed(0)}K`, v: inputTokens, s: setInputTokens, mn: 1000, mx: 500000, st: 1000 },
                  { l: `Output Tokens (Y): ${(outputTokens / 1000).toFixed(0)}K`, v: outputTokens, s: setOutputTokens, mn: 1000, mx: 200000, st: 1000 },
                  { l: `Cache Tokens (Z): ${(cacheTokens / 1000).toFixed(0)}K`, v: cacheTokens, s: setCacheTokens, mn: 0, mx: 100000, st: 1000 },
                ].map(x => (
                  <div key={x.l} style={{ marginBottom: '0.75rem' }}>
                    <label style={ls}>{x.l}</label>
                    <input type="range" min={x.mn} max={x.mx} step={x.st} value={x.v} onChange={e => x.s(parseInt(e.target.value))} style={ss} />
                  </div>
                ))}
                <h3 style={{ margin: '1rem 0 0.5rem' }}>Parameters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: 'α', val: alpha, set: setAlpha, min: 0.1, max: 0.5 },
                    { label: 'β', val: beta, set: setBeta, min: 0.1, max: 0.5 },
                    { label: 'γ', val: gamma, set: setGamma, min: 0.1, max: 0.4 },
                  ].map(p => (
                    <div key={p.label}>
                      <label style={{ ...ls, fontSize: '0.75rem' }}>{p.label}: {p.val.toFixed(2)}</label>
                      <input type="range" min={p.min} max={p.max} step={0.05} value={p.val} onChange={e => p.set(parseFloat(e.target.value))} style={ss} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: P.g1, borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Quality Score</h3>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: P.red }}>{quality.toFixed(2)}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.75rem' }}>
                  {[
                    ['Input contribution', Math.pow(Math.max(inputTokens / 1000, 0.001), alpha).toFixed(2)],
                    ['Output contribution', Math.pow(Math.max(outputTokens / 1000, 0.001), beta).toFixed(2)],
                    ['Cache contribution', Math.pow(bq + cacheTokens / 1000, gamma).toFixed(2)],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ color: P.g7 }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Diminishing Returns */}
          <div className="eco-card-flat">
            <h2 className="section-header">Diminishing Returns</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={qualityCurve} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis dataKey="tokens" stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={v => `${v}K`} />
                <YAxis stroke={P.g7} tick={{ fontSize: 11 }} />
                <Tooltip {...tt} formatter={v => [Number(v).toFixed(2), 'Quality']} />
                <Line type="monotone" dataKey="quality" stroke={P.red} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Multi-provider cost comparison */}
          <div className="eco-card-flat">
            <h2 className="section-header">Cost by Model ({(inputTokens / 1000).toFixed(0)}K in / {(outputTokens / 1000).toFixed(0)}K out)</h2>
            <ResponsiveContainer width="100%" height={Math.max(250, modelCosts.length * 24)}>
              <BarChart data={modelCosts} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
                <XAxis type="number" stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10 }} width={90} />
                <Tooltip {...tt} formatter={v => [formatCost(Number(v)), 'Cost']} />
                <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
                  {modelCosts.map((m, i) => <Cell key={i} fill={PROVIDER_COLORS[m.provider] || P.g5} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Provider Radar */}
          <div className="eco-card-flat">
            <h2 className="section-header">Provider Capabilities</h2>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radar}>
                <PolarGrid stroke={P.g3} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: P.g7 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} stroke={P.g3} />
                <Radar name="Anthropic" dataKey="anthropic" stroke={P.black} fill={P.black} fillOpacity={0.12} strokeWidth={2} />
                <Radar name="OpenAI" dataKey="openai" stroke="#10a37f" fill="#10a37f" fillOpacity={0.08} strokeWidth={2} />
                <Radar name="Google" dataKey="google" stroke="#4285f4" fill="#4285f4" fillOpacity={0.06} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Tooltip {...tt} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Caching Tab ── */}
      {tab === 'caching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="eco-card-flat">
            <h2 className="section-header">Caching Break-Even</h2>
            <div className="feature-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={ls}>Model</label>
                  <select value={cacheModel} onChange={e => setCacheModel(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: `1px solid ${P.g3}`, borderRadius: '4px', fontSize: '0.875rem' }}>
                    {Object.keys(CACHE_PRICING).map(id => {
                      const m = PROVIDER_MODELS.find(x => x.id === id);
                      return <option key={id} value={id}>{m?.name || id}</option>;
                    })}
                  </select>
                </div>
                {[
                  { l: `Input Tokens: ${(cacheInput / 1000).toFixed(0)}K`, v: cacheInput, s: setCacheInput, mx: 500000, st: 5000 },
                  { l: `Cached Portion: ${(cachePortion / 1000).toFixed(0)}K`, v: cachePortion, s: setCachePortion, mx: 200000, st: 5000 },
                  { l: `Reuses: ${reuses}`, v: reuses, s: setReuses, mx: 30, st: 1 },
                ].map(x => (
                  <div key={x.l} style={{ marginBottom: '0.75rem' }}>
                    <label style={ls}>{x.l}</label>
                    <input type="range" min={x.st} max={x.mx} step={x.st} value={x.v} onChange={e => x.s(parseInt(e.target.value))} style={ss} />
                  </div>
                ))}
              </div>
              <div style={{ background: P.g1, borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Results</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8125rem', color: P.g7 }}>Break-even threshold</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: P.red }}>{cachingCalc.threshold === Infinity ? '∞' : `${cachingCalc.threshold.toFixed(1)} reuses`}</div>
                </div>
                {[
                  ['Without Caching', formatCost(cachingCalc.costNoCache)],
                  ['With Caching', formatCost(cachingCalc.costWithCache)],
                  ['Savings (10 reuses)', formatCost(cachingCalc.savings)],
                  ['ROI (10 reuses)', `${cachingCalc.roi > 0 ? '+' : ''}${cachingCalc.roi.toFixed(0)}%`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ color: P.g7 }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Break-even chart */}
          <div className="eco-card-flat">
            <h2 className="section-header">Cost Over Reuses</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cachingCalc.curve} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis dataKey="reuses" stroke={P.g7} tick={{ fontSize: 11 }} />
                <YAxis stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip {...tt} formatter={v => [formatCost(Number(v))]} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Line type="monotone" dataKey="noCache" name="Without Cache" stroke={P.black} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="withCache" name="With Cache" stroke={P.red} strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </article>
  );
}
