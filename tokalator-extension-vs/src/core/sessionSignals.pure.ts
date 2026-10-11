export interface SignalTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface SignalSession extends SignalTotals {
  turnCount: number;
  contextTokens: number;
  contextWindow: number;
  turnsLeft: number | null;
  subagentShare: number;
}

export interface Signal {
  id: string;
  label: string;
  value: string;
  share?: number;
}

const tokens = (t: SignalTotals) => t.inputTokens + t.outputTokens + t.cacheReadTokens + t.cacheWriteTokens;
const pct = (n: number) => (n > 0 && n < 0.005 ? '<1%' : `${Math.round(n * 100)}%`);
const k = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n)));

/** Measured facts about the followed session and recent usage. No advice, only numbers from the logs. */
export function sessionSignals(s: SignalSession | null, last5h: number, prev5h: number): Signal[] {
  const out: Signal[] = [];
  if (s) {
    const total = tokens(s);
    if (s.contextWindow > 0 && s.contextTokens > 0) {
      const fill = s.contextTokens / s.contextWindow;
      out.push({ id: 'context', label: 'Context used', value: `${pct(fill)} of ${k(s.contextWindow)}${s.turnsLeft !== null ? ` · ~${s.turnsLeft} turns left at current growth` : ''}`, share: fill });
    }
    if (total > 0) {
      out.push({ id: 'subagents', label: 'Subagents', value: `${pct(s.subagentShare)} of session tokens`, share: s.subagentShare });
      out.push({ id: 'output', label: 'Output incl. thinking', value: `${pct(s.outputTokens / total)} of session tokens`, share: s.outputTokens / total });
    }
    const inputSide = s.inputTokens + s.cacheReadTokens + s.cacheWriteTokens;
    if (inputSide > 0) {
      out.push({ id: 'cache', label: 'Input from cache', value: pct(s.cacheReadTokens / inputSide), share: s.cacheReadTokens / inputSide });
    }
  }
  if (last5h > 0) {
    const trend = prev5h > 0 ? ` · ${last5h >= prev5h ? '+' : ''}${pct(last5h / prev5h - 1)} vs the 5 hours before` : '';
    out.push({ id: 'last5h', label: 'Last 5 hours, all agents', value: `${k(last5h)} tokens${trend}` });
  }
  return out;
}
