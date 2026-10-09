'use client';

import { themePalette as P } from '@/lib/theme-palette';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  PROVIDER_MODELS, PROVIDERS, estimateModelCost, fitsContext, getProviderColor, getProviderName,
} from '@/lib/providers';
import { analyzeCaching, generateCostComparisonData } from '@/lib/caching';
import { formatCost } from '@/lib/pricing';
import { CATALOG_UPDATED_AT, DEFAULT_MODEL_ID } from '@/lib/models';

const chartWrap = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.3 },
};

const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };
const ls: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', color: P.g7, marginBottom: '0.25rem' };
const ss: React.CSSProperties = { width: '100%', accentColor: P.red };
const MAX_OUTPUT = Math.max(...PROVIDER_MODELS.map(m => m.maxOutput));
const MAX_REUSES = 30;

type Tab = 'quality' | 'caching';

export function EconomicsClient() {
  const [tab, setTab] = useState<Tab>('quality');

  const [inputTokens, setInputTokens] = useState(50000);
  const [outputTokens, setOutputTokens] = useState(10000);
  const [cacheTokens, setCacheTokens] = useState(5000);
  const [alpha, setAlpha] = useState(0.30);
  const [beta, setBeta] = useState(0.35);
  const [gamma, setGamma] = useState(0.20);
  const bq = 1.0;

  const [cacheModel, setCacheModel] = useState(DEFAULT_MODEL_ID);
  const [cacheInput, setCacheInput] = useState(50000);
  const [cachePortion, setCachePortion] = useState(20000);
  const [reuses, setReuses] = useState(10);

  const quality = useMemo(() => {
    const X = Math.max(inputTokens / 1000, 0.001);
    const Y = Math.max(outputTokens / 1000, 0.001);
    const Z = cacheTokens / 1000;
    return Math.pow(X, alpha) * Math.pow(Y, beta) * Math.pow(bq + Z, gamma);
  }, [inputTokens, outputTokens, cacheTokens, alpha, beta, gamma]);

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

  const modelCosts = useMemo(() =>
    PROVIDER_MODELS
      .filter(m => fitsContext(m, inputTokens, outputTokens))
      .map(m => ({
        name: m.name.replace('Claude ', '').replace('Gemini ', 'G-'),
        cost: estimateModelCost(m, inputTokens, outputTokens),
        provider: m.provider,
      }))
      .sort((a, b) => a.cost - b.cost),
    [inputTokens, outputTokens]
  );

  const cached = Math.min(cachePortion, cacheInput);
  const uncached = cacheInput - cached;
  const cachingCalc = useMemo(
    () => analyzeCaching({ cacheTokens: cached, reuseCount: reuses, model: cacheModel, uncachedTokens: uncached }),
    [cached, uncached, reuses, cacheModel],
  );
  const cachingCurve = useMemo(
    () => generateCostComparisonData(cached, cacheModel, MAX_REUSES, uncached),
    [cached, uncached, cacheModel],
  );

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polyline points="7,20 11,14 15,16 21,8" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="7" y1="8" x2="7" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="7" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Economics</span></h1>
        <p className="hero-description">Illustrative Cobb-Douglas quality model and caching break-even analysis.</p>
      </header>

      <div role="tablist" aria-label="Economics views" style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: `1px solid ${P.g3}`, paddingBottom: '0.5rem' }}>
        {([['quality', 'Quality Model'], ['caching', 'Caching ROI']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} id={`tab-${t}`} role="tab" aria-selected={tab === t} aria-controls={`panel-${t}`} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: tab === t ? 600 : 400,
            background: tab === t ? P.black : 'transparent', color: tab === t ? P.white : P.g7,
            border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {tab === 'quality' && (
        <motion.div key="quality" id="panel-quality" role="tabpanel" aria-labelledby="tab-quality" {...chartWrap}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="eco-card-flat">
            <h2 className="section-header">Q = X<sup>α</sup> × Y<sup>β</sup> × (b + Z)<sup>γ</sup></h2>
            <p style={{ color: P.g7, fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Illustrative model from Bergemann, Bonatti and Smolin (2025), The Economics of Large Language Models.
              The score is a function of the parameters you set, not a benchmark of any model.
            </p>
            <div className="feature-grid">
              <div>
                <h3 style={{ marginBottom: '0.75rem' }}>Token Inputs</h3>
                {[
                  { id: 'q-input', l: `Input Tokens (X): ${(inputTokens / 1000).toFixed(0)}K`, v: inputTokens, s: setInputTokens, mn: 1000, mx: 500000, st: 1000 },
                  { id: 'q-output', l: `Output Tokens (Y): ${(outputTokens / 1000).toFixed(0)}K`, v: outputTokens, s: setOutputTokens, mn: 1000, mx: MAX_OUTPUT, st: 1000 },
                  { id: 'q-cache', l: `Cache Tokens (Z): ${(cacheTokens / 1000).toFixed(0)}K`, v: cacheTokens, s: setCacheTokens, mn: 0, mx: 100000, st: 1000 },
                ].map(x => (
                  <div key={x.id} style={{ marginBottom: '0.75rem' }}>
                    <label htmlFor={x.id} style={ls}>{x.l}</label>
                    <input id={x.id} type="range" min={x.mn} max={x.mx} step={x.st} value={x.v} onChange={e => x.s(parseInt(e.target.value))} style={ss} />
                  </div>
                ))}
                <h3 style={{ margin: '1rem 0 0.5rem' }}>Parameters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(6rem, 1fr))', gap: '0.75rem' }}>
                  {[
                    { id: 'q-alpha', label: 'α', val: alpha, set: setAlpha, min: 0.1, max: 0.5 },
                    { id: 'q-beta', label: 'β', val: beta, set: setBeta, min: 0.1, max: 0.5 },
                    { id: 'q-gamma', label: 'γ', val: gamma, set: setGamma, min: 0.1, max: 0.4 },
                  ].map(p => (
                    <div key={p.id}>
                      <label htmlFor={p.id} style={{ ...ls, fontSize: '0.75rem' }}>{p.label}: {p.val.toFixed(2)}</label>
                      <input id={p.id} type="range" min={p.min} max={p.max} step={0.05} value={p.val} onChange={e => p.set(parseFloat(e.target.value))} style={ss} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: P.g1, borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Illustrative Quality Score</h3>
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

          <div className="eco-card-flat">
            <h2 className="section-header">Diminishing Returns</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={qualityCurve} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis dataKey="tokens" stroke={P.g7} tick={{ fontSize: 11, fill: P.g7 }} tickFormatter={v => `${v}K`} />
                <YAxis stroke={P.g7} tick={{ fontSize: 11, fill: P.g7 }} />
                <Tooltip {...tt} formatter={v => [Number(v).toFixed(2), 'Illustrative quality']} />
                <Line type="monotone" dataKey="quality" stroke={P.red} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="eco-card-flat">
            <h2 className="section-header">Cost by Model ({(inputTokens / 1000).toFixed(0)}K in / {(outputTokens / 1000).toFixed(0)}K out)</h2>
            <ResponsiveContainer width="100%" height={modelCosts.length * 24 + 40}>
              <BarChart data={modelCosts} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
                <XAxis type="number" stroke={P.g7} tick={{ fontSize: 11, fill: P.g7 }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10, fill: P.g7 }} width={100} interval={0} />
                <Tooltip {...tt} formatter={v => [formatCost(Number(v)), 'Cost']} />
                <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
                  {modelCosts.map(m => <Cell key={m.name} fill={getProviderColor(m.provider)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.75rem', color: P.g7 }}>
              {PROVIDERS.map(p => (
                <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span aria-hidden style={{ width: 10, height: 10, background: getProviderColor(p), display: 'inline-block' }} />
                  {getProviderName(p)}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: P.g7, marginTop: '0.5rem' }}>
              Uncached request with long-context rates where they apply.
              {PROVIDER_MODELS.length > modelCosts.length && ` ${PROVIDER_MODELS.length - modelCosts.length} models excluded: request exceeds the context window or max output.`}
            </p>
          </div>
        </div>
        </motion.div>
      )}

      {tab === 'caching' && (
        <motion.div key="caching" id="panel-caching" role="tabpanel" aria-labelledby="tab-caching" {...chartWrap}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="eco-card-flat">
            <h2 className="section-header">Caching Break-Even</h2>
            <div className="feature-grid">
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="cache-model" style={ls}>Model</label>
                  <select id="cache-model" value={cacheModel} onChange={e => setCacheModel(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: `1px solid ${P.g3}`, borderRadius: '4px', fontSize: '0.875rem', background: P.white, color: P.black }}>
                    {PROVIDERS.map(p => (
                      <optgroup key={p} label={getProviderName(p)}>
                        {PROVIDER_MODELS.filter(m => m.provider === p).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {[
                  { id: 'cache-input', l: `Prompt Tokens per Call: ${(cacheInput / 1000).toFixed(0)}K`, v: cacheInput, s: setCacheInput, mn: 5000, mx: 500000, st: 5000 },
                  { id: 'cache-portion', l: `Cached Portion: ${(cached / 1000).toFixed(0)}K`, v: cachePortion, s: setCachePortion, mn: 5000, mx: 200000, st: 5000 },
                  { id: 'cache-reuses', l: `Reuses After First Call: ${reuses}`, v: reuses, s: setReuses, mn: 0, mx: MAX_REUSES, st: 1 },
                ].map(x => (
                  <div key={x.id} style={{ marginBottom: '0.75rem' }}>
                    <label htmlFor={x.id} style={ls}>{x.l}</label>
                    <input id={x.id} type="range" min={x.mn} max={x.mx} step={x.st} value={x.v} onChange={e => x.s(parseInt(e.target.value))} style={ss} />
                  </div>
                ))}
              </div>
              <div style={{ background: P.g1, borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Results</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8125rem', color: P.g7 }}>Break-even</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: P.red }}>
                    {Number.isFinite(cachingCalc.breakEvenReuses) ? `${cachingCalc.breakEvenReuses.toFixed(2)} reuses` : 'Never'}
                  </div>
                </div>
                {[
                  [`Without caching (${reuses + 1} calls)`, formatCost(cachingCalc.totalWithoutCaching)],
                  [`With caching (${reuses + 1} calls)`, formatCost(cachingCalc.totalWithCaching)],
                  [`Savings (${reuses} reuses)`, formatCost(cachingCalc.netSavings)],
                  [`Savings % (${reuses} reuses)`, `${cachingCalc.savingsPercent > 0 ? '+' : ''}${cachingCalc.savingsPercent.toFixed(0)}%`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ color: P.g7 }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: P.g7, marginTop: '0.75rem' }}>
              One cache write on the first call, cache reads after it. Uncached tokens cost the same either way.
              Rates from the catalog ({CATALOG_UPDATED_AT}); models with no listed write rate have no write premium; storage fees and minimum cacheable lengths are not modeled.
            </p>
          </div>

          <div className="eco-card-flat">
            <h2 className="section-header">Cost Over Reuses</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cachingCurve} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis dataKey="reuses" stroke={P.g7} tick={{ fontSize: 11, fill: P.g7 }} />
                <YAxis stroke={P.g7} tick={{ fontSize: 11, fill: P.g7 }} tickFormatter={v => `$${v}`} />
                <Tooltip {...tt} formatter={v => [formatCost(Number(v))]} labelFormatter={l => `${l} reuses`} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Line type="monotone" dataKey="withoutCaching" name="Without Cache" stroke={P.black} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="withCaching" name="With Cache" stroke={P.red} strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </article>
  );
}
