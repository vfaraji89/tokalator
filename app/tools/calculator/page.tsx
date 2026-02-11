'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { PROVIDER_MODELS } from '@/lib/providers';

const P = {
  red: '#e3120b', black: '#111', white: '#fff',
  g1: '#f3f3f3', g3: '#ccc', g5: '#888', g7: '#555',
};
const tt = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };
const fmt = (v: number) => v < 0.01 ? `$${v.toFixed(6)}` : v < 1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
const fmtTok = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

const PROVIDER_COLORS: Record<string, string> = { anthropic: P.black, openai: '#10a37f', google: '#4285f4' };

type Tab = 'calculator' | 'compare' | 'pricing';

export default function CalculatorPage() {
  const [tab, setTab] = useState<Tab>('calculator');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4.5');
  const [inputTokens, setInputTokens] = useState(50000);
  const [outputTokens, setOutputTokens] = useState(10000);
  const [cacheWriteTokens, setCacheWriteTokens] = useState(0);
  const [cacheReadTokens, setCacheReadTokens] = useState(0);

  const model = PROVIDER_MODELS.find(m => m.id === selectedModel) || PROVIDER_MODELS[0];

  // Calculate cost for any model
  const calcCost = (m: typeof model, inp: number, out: number, cw = 0, cr = 0) => {
    const ic = (inp / 1_000_000) * m.inputCostPerMTok;
    const oc = (out / 1_000_000) * m.outputCostPerMTok;
    // Estimate cache pricing: write ~1.25x input, read ~0.1x input
    const cwc = (cw / 1_000_000) * m.inputCostPerMTok * 1.25;
    const crc = (cr / 1_000_000) * m.inputCostPerMTok * 0.1;
    return { input: ic, output: oc, cacheWrite: cwc, cacheRead: crc, total: ic + oc + cwc + crc };
  };

  const cost = useMemo(() => calcCost(model, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens), [model, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens]);

  // All models cost comparison
  const allModelsCost = useMemo(() =>
    PROVIDER_MODELS.map(m => ({
      name: m.name.replace('Claude ', '').replace('Gemini ', 'G-'),
      provider: m.provider,
      cost: calcCost(m, inputTokens, outputTokens).total,
      id: m.id,
    })).sort((a, b) => a.cost - b.cost),
    [inputTokens, outputTokens]
  );

  // Breakdown pie
  const breakdownPie = useMemo(() => [
    { name: 'Input', value: cost.input },
    { name: 'Output', value: cost.output },
    ...(cost.cacheWrite > 0 ? [{ name: 'Cache Write', value: cost.cacheWrite }] : []),
    ...(cost.cacheRead > 0 ? [{ name: 'Cache Read', value: cost.cacheRead }] : []),
  ].filter(x => x.value > 0), [cost]);

  const pieColors = [P.black, P.red, P.g5, P.g3];

  // Presets
  const presets = [
    { l: 'Quick chat', i: 2000, o: 500 },
    { l: 'Code review', i: 50000, o: 10000 },
    { l: 'Full codebase', i: 200000, o: 32000 },
    { l: 'Max context', i: 1000000, o: 64000 },
  ];

  // Provider groups for pricing tab
  const byProvider = useMemo(() => {
    const groups: Record<string, typeof PROVIDER_MODELS> = {};
    PROVIDER_MODELS.forEach(m => {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    });
    return groups;
  }, []);

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="5" y="3" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="8" y="6" width="12" height="5" rx="1" stroke="#e3120b" strokeWidth="1" fill="none" />
            <circle cx="10" cy="15" r="1" fill="currentColor" /><circle cx="14" cy="15" r="1" fill="currentColor" /><circle cx="18" cy="15" r="1" fill="currentColor" />
            <circle cx="10" cy="19" r="1" fill="currentColor" /><circle cx="14" cy="19" r="1" fill="currentColor" /><circle cx="18" cy="19" r="1" fill="#e3120b" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Calculator</span></h1>
        <p className="hero-description">Cost calculator for {PROVIDER_MODELS.length} models across 3 providers.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: `1px solid ${P.g3}`, paddingBottom: '0.5rem' }}>
        {([['calculator', 'Calculate'], ['compare', 'Compare'], ['pricing', 'Pricing']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: tab === t ? 600 : 400,
            background: tab === t ? P.black : 'transparent', color: tab === t ? P.white : P.g7,
            border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Calculator Tab ── */}
      {tab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Input Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="eco-card-flat">
              <h3 className="section-header">Model</h3>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: `1px solid ${P.g3}`, borderRadius: '4px', fontSize: '0.875rem' }}>
                {PROVIDER_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.provider === 'anthropic' ? '🟤' : m.provider === 'openai' ? '🟢' : '🔵'} {m.name}</option>
                ))}
              </select>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: P.g7 }}>
                Input: ${model.inputCostPerMTok}/MTok · Output: ${model.outputCostPerMTok}/MTok · Context: {fmtTok(model.contextWindow)}
              </div>
            </div>

            <div className="eco-card-flat">
              <h3 className="section-header">Tokens</h3>
              {[
                { l: 'Input Tokens', v: inputTokens, s: setInputTokens, mx: 1000000 },
                { l: 'Output Tokens', v: outputTokens, s: setOutputTokens, mx: 128000 },
                { l: 'Cache Write', v: cacheWriteTokens, s: setCacheWriteTokens, mx: 200000 },
                { l: 'Cache Read', v: cacheReadTokens, s: setCacheReadTokens, mx: 200000 },
              ].map(x => (
                <div key={x.l} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: P.g7, marginBottom: '0.25rem' }}>
                    <span>{x.l}</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: P.black }}>{fmtTok(x.v)}</span>
                  </div>
                  <input type="range" min={0} max={x.mx} step={1000} value={x.v} onChange={e => x.s(Number(e.target.value))}
                    style={{ width: '100%', accentColor: P.red }} />
                </div>
              ))}
            </div>

            <div className="eco-card-flat">
              <h3 className="section-header">Presets</h3>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {presets.map(p => (
                  <button key={p.l} onClick={() => { setInputTokens(p.i); setOutputTokens(p.o); setCacheWriteTokens(0); setCacheReadTokens(0); }}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', background: P.g1, border: `1px solid ${P.g3}`, borderRadius: '4px', cursor: 'pointer' }}>{p.l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: P.black, borderRadius: '12px', padding: '1.5rem', color: P.white }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Total Cost</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{fmt(cost.total)}</div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.5, marginTop: '0.25rem' }}>{model.name} · {fmtTok(inputTokens + outputTokens)} tokens</div>
            </div>

            <div className="eco-card-flat">
              <h3 className="section-header">Breakdown</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  {[
                    { label: 'Input', value: cost.input, tokens: inputTokens },
                    { label: 'Output', value: cost.output, tokens: outputTokens },
                    ...(cost.cacheWrite > 0 ? [{ label: 'Cache Write', value: cost.cacheWrite, tokens: cacheWriteTokens }] : []),
                    ...(cost.cacheRead > 0 ? [{ label: 'Cache Read', value: cost.cacheRead, tokens: cacheReadTokens }] : []),
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: P.g7 }}>{item.label} ({fmtTok(item.tokens)})</span>
                      <span style={{ fontWeight: 600 }}>{fmt(item.value)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${P.g3}`, paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Total</span><span style={{ color: P.red }}>{fmt(cost.total)}</span>
                  </div>
                </div>
                {breakdownPie.length > 1 && (
                  <div style={{ width: '120px', height: '120px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={breakdownPie} cx="50%" cy="50%" outerRadius={50} innerRadius={25} dataKey="value" paddingAngle={2}>
                        {breakdownPie.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                      </Pie><Tooltip {...tt} formatter={v => [fmt(Number(v))]} /></PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Compare Tab ── */}
      {tab === 'compare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="eco-card-flat">
            <h3 className="section-header">Configure</h3>
            <div className="feature-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: P.g7, marginBottom: '0.25rem' }}>Input: {fmtTok(inputTokens)}</div>
                <input type="range" min={1000} max={1000000} step={1000} value={inputTokens} onChange={e => setInputTokens(Number(e.target.value))} style={{ width: '100%', accentColor: P.red }} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: P.g7, marginBottom: '0.25rem' }}>Output: {fmtTok(outputTokens)}</div>
                <input type="range" min={1000} max={128000} step={1000} value={outputTokens} onChange={e => setOutputTokens(Number(e.target.value))} style={{ width: '100%', accentColor: P.red }} />
              </div>
            </div>
          </div>

          <div className="eco-card-flat">
            <h3 className="section-header">Cost Ranking ({fmtTok(inputTokens)} in / {fmtTok(outputTokens)} out)</h3>
            <ResponsiveContainer width="100%" height={Math.max(300, allModelsCost.length * 28)}>
              <BarChart data={allModelsCost} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
                <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={v => `$${v < 1 ? v.toFixed(2) : v.toFixed(0)}`} />
                <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10 }} width={90} />
                <Tooltip {...tt} formatter={v => [fmt(Number(v)), 'Cost']} />
                <Bar dataKey="cost" radius={[0, 3, 3, 0]}>
                  {allModelsCost.map((m, i) => <Cell key={i} fill={PROVIDER_COLORS[m.provider] || P.g5} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: PROVIDER_COLORS.anthropic, marginRight: 4 }} />Anthropic</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: PROVIDER_COLORS.openai, marginRight: 4 }} />OpenAI</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: PROVIDER_COLORS.google, marginRight: 4 }} />Google</span>
            </div>
          </div>

          {/* Context Windows */}
          <div className="eco-card-flat">
            <h3 className="section-header">Context Windows</h3>
            <ResponsiveContainer width="100%" height={Math.max(300, PROVIDER_MODELS.length * 28)}>
              <BarChart data={PROVIDER_MODELS.map(m => ({ name: m.name.replace('Claude ', '').replace('Gemini ', 'G-'), ctx: m.contextWindow / 1000, provider: m.provider }))} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
                <XAxis type="number" stroke={P.g7} tick={{ fontSize: 10 }} tickFormatter={v => `${v}K`} />
                <YAxis type="category" dataKey="name" stroke={P.g7} tick={{ fontSize: 10 }} width={90} />
                <Tooltip {...tt} formatter={v => [`${Number(v)}K tokens`, 'Context']} />
                <Bar dataKey="ctx" radius={[0, 3, 3, 0]}>
                  {PROVIDER_MODELS.map((m, i) => <Cell key={i} fill={PROVIDER_COLORS[m.provider] || P.g5} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Pricing Tab ── */}
      {tab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(byProvider).map(([provider, models]) => (
            <div key={provider} className="eco-card-flat">
              <h3 className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: PROVIDER_COLORS[provider] }} />
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Model</th>
                      <th style={{ textAlign: 'right' }}>Input $/MTok</th>
                      <th style={{ textAlign: 'right' }}>Output $/MTok</th>
                      <th style={{ textAlign: 'right' }}>Context</th>
                      <th style={{ textAlign: 'right' }}>Max Output</th>
                      <th style={{ textAlign: 'left' }}>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${m.inputCostPerMTok.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${m.outputCostPerMTok.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>{fmtTok(m.contextWindow)}</td>
                        <td style={{ textAlign: 'right' }}>{fmtTok(m.maxOutput)}</td>
                        <td><span className="badge">{m.tier || '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="eco-card-flat">
            <h3 className="section-header">Visual Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={PROVIDER_MODELS.map(m => ({ name: m.name.replace('Claude ', '').replace('Gemini ', 'G-'), input: m.inputCostPerMTok, output: m.outputCostPerMTok, provider: m.provider }))} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.g3} />
                <XAxis dataKey="name" stroke={P.g7} tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={80} />
                <YAxis stroke={P.g7} tick={{ fontSize: 11 }} tickFormatter={v => '$' + v} />
                <Tooltip {...tt} formatter={v => [`$${Number(v).toFixed(2)}/MTok`]} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar dataKey="input" name="Input" radius={[3, 3, 0, 0]} fill={P.black} />
                <Bar dataKey="output" name="Output" radius={[3, 3, 0, 0]} fill={P.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </article>
  );
}
