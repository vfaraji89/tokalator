'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PROVIDER_MODELS } from '@/lib/providers';

// ── Palette ───────────────────────────────────────────────────────────────────
const R = '#e3120b';   // eco-red
const K = '#111';      // eco-black
const W = '#fff';
const G1 = '#f7f7f5';  // near-white tint
const G3 = '#d4d4d0';  // rule colour
const G5 = '#888';
const G7 = '#444';

const PROV_DOT: Record<string, string> = {
  anthropic: K,
  openai:    '#10a37f',
  google:    '#4285f4',
};

// ── Formatters ─────────────────────────────────────────────────────────────────
const fmtCost = (v: number) =>
  v === 0 ? '$0.00' : v < 0.001 ? `$${v.toFixed(6)}` : v < 0.1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
const fmtTok = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
const fmtMTok = (v: number) =>
  `$${v % 1 === 0 ? v.toFixed(0) : v < 1 ? v.toFixed(3) : v.toFixed(2)}`;

// ── Cost engine ────────────────────────────────────────────────────────────────
type M = typeof PROVIDER_MODELS[number];
const calcCost = (m: M, inp: number, out: number, cw = 0, cr = 0) => {
  const ic  = (inp / 1_000_000) * m.inputCostPerMTok;
  const oc  = (out / 1_000_000) * m.outputCostPerMTok;
  const cwc = (cw  / 1_000_000) * m.inputCostPerMTok * 1.25;
  const crc = (cr  / 1_000_000) * m.inputCostPerMTok * 0.1;
  return { input: ic, output: oc, cacheWrite: cwc, cacheRead: crc, total: ic + oc + cwc + crc };
};

// ── Economist horizontal bar ───────────────────────────────────────────────────
// Single row: coloured dot + label | ████████████████  $0.0042
function EcoBar({
  label, value, max, color, highlight, sublabel, animate = true,
}: {
  label: string; value: number; max: number; color: string;
  highlight?: boolean; sublabel?: string; animate?: boolean;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '9rem 1fr 5.5rem',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.3rem 0',
      borderBottom: `1px solid ${G3}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: '0.8125rem', color: highlight ? K : G7, fontWeight: highlight ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </div>
      <div style={{ height: 14, background: G1, borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: highlight ? R : color, borderRadius: 2, opacity: highlight ? 1 : 0.75 }}
          initial={animate ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: highlight ? R : G7, fontWeight: highlight ? 700 : 400, whiteSpace: 'nowrap' }}>
        {sublabel ?? fmtCost(value)}
      </div>
    </div>
  );
}

// ── Stacked proportion bar ─────────────────────────────────────────────────────
function BreakdownBar({ input, output, cacheWrite, cacheRead }: { input: number; output: number; cacheWrite: number; cacheRead: number }) {
  const total = input + output + cacheWrite + cacheRead;
  if (total === 0) return null;
  const segs = [
    { label: 'Input',       value: input,      color: K },
    { label: 'Output',      value: output,      color: R },
    { label: 'Cache Write', value: cacheWrite,  color: G5 },
    { label: 'Cache Read',  value: cacheRead,   color: G3 },
  ].filter(s => s.value > 0);

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', height: 18, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
        {segs.map(s => (
          <motion.div
            key={s.label}
            title={`${s.label}: ${fmtCost(s.value)}`}
            style={{ background: s.color, height: '100%' }}
            initial={{ flex: 0 }}
            animate={{ flex: s.value / total }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {segs.map(s => (
          <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: G7 }}>
            <span style={{ width: 8, height: 8, borderRadius: 1, background: s.color, display: 'inline-block' }} />
            {s.label} <span style={{ fontFamily: 'var(--font-mono)', color: K }}>{fmtCost(s.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Section header (Economist style) ──────────────────────────────────────────
function EcoHeader({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div style={{ borderBottom: `2px solid ${K}`, paddingBottom: '0.375rem', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: K }}>{children}</span>
      {note && <span style={{ fontSize: '0.75rem', color: G5, marginLeft: '0.75rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{note}</span>}
    </div>
  );
}

function EcoNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderTop: `1px solid ${G3}`, marginTop: '0.75rem', paddingTop: '0.375rem', fontSize: '0.6875rem', color: G5, fontStyle: 'italic' }}>
      {children}
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────
type Tab = 'calculator' | 'compare' | 'pricing';

const tabAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
  transition: { duration: 0.25 },
};

// ── Main component ─────────────────────────────────────────────────────────────
export function CalculatorClient() {
  const [tab, setTab]                       = useState<Tab>('calculator');
  const [selectedModel, setSelectedModel]   = useState('claude-sonnet-4.5');
  const [inputTokens, setInputTokens]       = useState(50_000);
  const [outputTokens, setOutputTokens]     = useState(10_000);
  const [cacheWriteTokens, setCacheWrite]   = useState(0);
  const [cacheReadTokens, setCacheRead]     = useState(0);

  const model = PROVIDER_MODELS.find(m => m.id === selectedModel) ?? PROVIDER_MODELS[0];
  const cost  = useMemo(
    () => calcCost(model, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens),
    [model, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens],
  );

  const allModelsCost = useMemo(() =>
    PROVIDER_MODELS
      .map(m => ({ ...m, cost: calcCost(m, inputTokens, outputTokens).total }))
      .sort((a, b) => a.cost - b.cost),
    [inputTokens, outputTokens],
  );
  const maxCost = allModelsCost[allModelsCost.length - 1]?.cost ?? 1;

  const byProvider = useMemo(() => {
    const g: Record<string, typeof PROVIDER_MODELS> = {};
    PROVIDER_MODELS.forEach(m => { (g[m.provider] ??= []).push(m); });
    return g;
  }, []);

  const presets = [
    { l: 'Quick chat',    i: 2_000,   o: 500 },
    { l: 'Code review',   i: 50_000,  o: 10_000 },
    { l: 'Full codebase', i: 200_000, o: 32_000 },
    { l: 'Max context',   i: 1_000_000, o: 64_000 },
  ];

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="5" y="3" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="8" y="6" width="12" height="5" rx="1" stroke={R} strokeWidth="1" fill="none" />
            <circle cx="10" cy="15" r="1" fill="currentColor" /><circle cx="14" cy="15" r="1" fill="currentColor" /><circle cx="18" cy="15" r="1" fill="currentColor" />
            <circle cx="10" cy="19" r="1" fill="currentColor" /><circle cx="14" cy="19" r="1" fill="currentColor" /><circle cx="18" cy="19" r="1" fill={R} />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Calculator</span></h1>
        <p className="hero-description">Cost calculator for {PROVIDER_MODELS.length} models across 3 providers.</p>
      </header>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.75rem', borderBottom: `2px solid ${K}` }}>
        {(['calculator', 'compare', 'pricing'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1.25rem', fontSize: '0.8125rem', fontWeight: tab === t ? 700 : 400,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            background: tab === t ? K : 'transparent',
            color: tab === t ? W : G5,
            border: 'none', cursor: 'pointer',
            borderBottom: tab === t ? `2px solid ${K}` : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════ CALCULATOR ════════════════════════════ */}
        {tab === 'calculator' && (
          <motion.div key="calculator" {...tabAnim}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

              {/* Left — inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Model selector */}
                <div>
                  <EcoHeader>Model</EcoHeader>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${G3}`, borderRadius: 3, fontSize: '0.875rem', background: W, color: K, cursor: 'pointer' }}
                  >
                    {(['anthropic', 'openai', 'google'] as const).map(prov => (
                      <optgroup key={prov} label={prov.charAt(0).toUpperCase() + prov.slice(1)}>
                        {PROVIDER_MODELS.filter(m => m.provider === prov).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: G5, fontFamily: 'var(--font-mono)' }}>
                    in {fmtMTok(model.inputCostPerMTok)}/MTok · out {fmtMTok(model.outputCostPerMTok)}/MTok · {fmtTok(model.contextWindow)} ctx
                  </div>
                </div>

                {/* Token sliders */}
                <div>
                  <EcoHeader>Tokens</EcoHeader>
                  {[
                    { l: 'Input',       v: inputTokens,     s: setInputTokens, mx: 1_000_000 },
                    { l: 'Output',      v: outputTokens,    s: setOutputTokens, mx: 128_000 },
                    { l: 'Cache write', v: cacheWriteTokens,s: setCacheWrite,  mx: 200_000 },
                    { l: 'Cache read',  v: cacheReadTokens, s: setCacheRead,   mx: 200_000 },
                  ].map(x => (
                    <div key={x.l} style={{ marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: G7, marginBottom: '0.2rem' }}>
                        <span>{x.l}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: K }}>{fmtTok(x.v)}</span>
                      </div>
                      <input type="range" min={0} max={x.mx} step={1000} value={x.v}
                        onChange={e => x.s(Number(e.target.value))}
                        style={{ width: '100%', accentColor: R }} />
                    </div>
                  ))}
                </div>

                {/* Presets */}
                <div>
                  <EcoHeader>Presets</EcoHeader>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {presets.map(p => (
                      <button key={p.l} onClick={() => { setInputTokens(p.i); setOutputTokens(p.o); setCacheWrite(0); setCacheRead(0); }}
                        style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', background: G1, border: `1px solid ${G3}`, borderRadius: 3, cursor: 'pointer', color: G7 }}>
                        {p.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Big number */}
                <div style={{ background: K, borderRadius: 4, padding: '1.5rem', color: W }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Total cost</div>
                  <motion.div
                    key={cost.total}
                    initial={{ opacity: 0.4, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ fontSize: '2.75rem', fontWeight: 800, marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}
                  >
                    {fmtCost(cost.total)}
                  </motion.div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.45, marginTop: '0.25rem' }}>
                    {model.name} · {fmtTok(inputTokens + outputTokens)} tokens
                  </div>
                </div>

                {/* Cost breakdown */}
                <div>
                  <EcoHeader>Breakdown</EcoHeader>
                  {[
                    { label: 'Input',       value: cost.input,      tokens: inputTokens },
                    { label: 'Output',      value: cost.output,     tokens: outputTokens },
                    ...(cost.cacheWrite > 0 ? [{ label: 'Cache write', value: cost.cacheWrite, tokens: cacheWriteTokens }] : []),
                    ...(cost.cacheRead  > 0 ? [{ label: 'Cache read',  value: cost.cacheRead,  tokens: cacheReadTokens  }] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: `1px solid ${G3}`, fontSize: '0.875rem' }}>
                      <span style={{ color: G7 }}>{row.label} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>({fmtTok(row.tokens)})</span></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtCost(row.value)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0 0', fontWeight: 700, fontSize: '0.9375rem' }}>
                    <span>Total</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: R }}>{fmtCost(cost.total)}</span>
                  </div>
                  <BreakdownBar input={cost.input} output={cost.output} cacheWrite={cost.cacheWrite} cacheRead={cost.cacheRead} />
                </div>

                {/* Cost at scale */}
                <div>
                  <EcoHeader>At scale</EcoHeader>
                  {[100, 1_000, 10_000].map(calls => (
                    <div key={calls} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: `1px solid ${G3}`, fontSize: '0.875rem' }}>
                      <span style={{ color: G7 }}>{calls.toLocaleString()} calls/day</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtCost(cost.total * calls * 30)}<span style={{ fontWeight: 400, color: G5, fontSize: '0.75rem' }}>/mo</span></span>
                    </div>
                  ))}
                  <EcoNote>Based on current token inputs · Caching not included</EcoNote>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════ COMPARE ═══════════════════════════════ */}
        {tab === 'compare' && (
          <motion.div key="compare" {...tabAnim}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Controls */}
              <div>
                <EcoHeader>Configure</EcoHeader>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { l: `Input: ${fmtTok(inputTokens)}`, v: inputTokens, s: setInputTokens, mx: 1_000_000 },
                    { l: `Output: ${fmtTok(outputTokens)}`, v: outputTokens, s: setOutputTokens, mx: 128_000 },
                  ].map(x => (
                    <div key={x.l}>
                      <div style={{ fontSize: '0.8125rem', color: G7, marginBottom: '0.25rem' }}>{x.l}</div>
                      <input type="range" min={1000} max={x.mx} step={1000} value={x.v}
                        onChange={e => x.s(Number(e.target.value))}
                        style={{ width: '100%', accentColor: R }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost ranking — Economist horizontal bars */}
              <div>
                <EcoHeader note={`${fmtTok(inputTokens)} in · ${fmtTok(outputTokens)} out`}>
                  Cost ranking
                </EcoHeader>
                {allModelsCost.map(m => (
                  <EcoBar
                    key={m.id}
                    label={m.name.replace('Claude ', '').replace('GPT-', 'GPT-').replace('Gemini ', 'G-')}
                    value={m.cost}
                    max={maxCost}
                    color={PROV_DOT[m.provider]}
                    highlight={m.id === selectedModel}
                  />
                ))}
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {Object.entries(PROV_DOT).map(([p, c]) => (
                    <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: G7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  ))}
                </div>
                <EcoNote>Highlighted row = currently selected model · Sorted cheapest to most expensive</EcoNote>
              </div>

              {/* Context windows */}
              <div>
                <EcoHeader>Context windows</EcoHeader>
                {[...PROVIDER_MODELS]
                  .sort((a, b) => b.contextWindow - a.contextWindow)
                  .map(m => (
                    <EcoBar
                      key={m.id}
                      label={m.name.replace('Claude ', '').replace('Gemini ', 'G-')}
                      value={m.contextWindow}
                      max={Math.max(...PROVIDER_MODELS.map(x => x.contextWindow))}
                      color={PROV_DOT[m.provider]}
                      highlight={m.id === selectedModel}
                      sublabel={fmtTok(m.contextWindow)}
                    />
                  ))}
                <EcoNote>Tokens · 1M = 1,048,576 · Source: provider documentation</EcoNote>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════ PRICING ═══════════════════════════════ */}
        {tab === 'pricing' && (
          <motion.div key="pricing" {...tabAnim}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Per-provider input/output comparison — horizontal bars */}
              {Object.entries(byProvider).map(([prov, models]) => {
                const maxOut = Math.max(...models.map(m => m.outputCostPerMTok));
                return (
                  <div key={prov}>
                    <EcoHeader>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROV_DOT[prov], display: 'inline-block' }} />
                        {prov.charAt(0).toUpperCase() + prov.slice(1)}
                      </span>
                    </EcoHeader>

                    {/* Input bars */}
                    <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: G5, marginBottom: '0.25rem' }}>Input $/MTok</div>
                    {models.map(m => (
                      <EcoBar key={`in-${m.id}`} label={m.name.replace('Claude ', '').replace('Gemini ', 'G-')} value={m.inputCostPerMTok} max={maxOut} color={PROV_DOT[prov]} highlight={m.id === selectedModel} sublabel={fmtMTok(m.inputCostPerMTok)} />
                    ))}

                    <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: G5, marginTop: '0.75rem', marginBottom: '0.25rem' }}>Output $/MTok</div>
                    {models.map(m => (
                      <EcoBar key={`out-${m.id}`} label={m.name.replace('Claude ', '').replace('Gemini ', 'G-')} value={m.outputCostPerMTok} max={maxOut} color={R} highlight={m.id === selectedModel} sublabel={fmtMTok(m.outputCostPerMTok)} />
                    ))}

                    {/* Compact data table */}
                    <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${K}` }}>
                            <th style={{ textAlign: 'left', padding: '0.3rem 0', color: G5, fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</th>
                            <th style={{ textAlign: 'right', padding: '0.3rem 0.5rem', color: G5, fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In</th>
                            <th style={{ textAlign: 'right', padding: '0.3rem 0.5rem', color: G5, fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out</th>
                            <th style={{ textAlign: 'right', padding: '0.3rem 0.5rem', color: G5, fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Context</th>
                            <th style={{ textAlign: 'left', padding: '0.3rem 0 0.3rem 0.5rem', color: G5, fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tier</th>
                          </tr>
                        </thead>
                        <tbody>
                          {models.map(m => (
                            <tr key={m.id} style={{ borderBottom: `1px solid ${G3}`, background: m.id === selectedModel ? G1 : 'transparent' }}>
                              <td style={{ padding: '0.35rem 0', fontWeight: m.id === selectedModel ? 700 : 400 }}>{m.name}</td>
                              <td style={{ textAlign: 'right', padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', color: G7 }}>{fmtMTok(m.inputCostPerMTok)}</td>
                              <td style={{ textAlign: 'right', padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', color: R, fontWeight: 600 }}>{fmtMTok(m.outputCostPerMTok)}</td>
                              <td style={{ textAlign: 'right', padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: G5 }}>{fmtTok(m.contextWindow)}</td>
                              <td style={{ padding: '0.35rem 0 0.35rem 0.5rem' }}>
                                {m.tier && <span style={{ fontSize: '0.6875rem', background: G1, border: `1px solid ${G3}`, borderRadius: 2, padding: '0.1rem 0.4rem', color: G7 }}>{m.tier}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <EcoNote>$/MTok = US dollars per million tokens · Last updated {models[0]?.lastUpdated ?? '2026'}</EcoNote>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </article>
  );
}
