'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  PROVIDER_MODELS,
  PROVIDERS,
  estimateModelCost,
  fitsContext,
  formatTokenCount,
  getProviderColor,
  getProviderName,
} from '@/lib/providers';
import { themePalette as P } from '@/lib/theme-palette';

const ROW = 24;
const tooltip = { contentStyle: { background: P.white, border: `1px solid ${P.g3}`, borderRadius: 4, fontSize: 12, color: P.black } };
const axis = { stroke: P.g7, tick: { fontSize: 11, fill: P.g7 }, tickLine: false };
const shortName = (name: string) => name.replace('Claude ', '');

function ProviderLegend() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${P.g3}` }}>
      {PROVIDERS.map(p => (
        <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: P.g7 }}>
          <span aria-hidden style={{ width: 12, height: 12, background: getProviderColor(p), display: 'inline-block' }} />
          {getProviderName(p)}
        </span>
      ))}
    </div>
  );
}

interface CostComparisonProps {
  inputTokens?: number;
  outputTokens?: number;
}

export function CostComparisonChart({
  inputTokens = 100000,
  outputTokens = 10000,
}: CostComparisonProps) {
  const fitting = PROVIDER_MODELS.filter(m => fitsContext(m, inputTokens, outputTokens));
  const data = fitting
    .map(model => ({
      name: shortName(model.name),
      cost: estimateModelCost(model, inputTokens, outputTokens),
      provider: model.provider,
      fullName: model.name,
    }))
    .sort((a, b) => a.cost - b.cost);
  const excluded = PROVIDER_MODELS.length - fitting.length;

  return (
    <div className="eco-card-flat">
      <p style={{ fontSize: '0.75rem', color: P.g7, marginBottom: '1rem' }}>
        {formatTokenCount(inputTokens)} input + {formatTokenCount(outputTokens)} output tokens, uncached, long-context rates applied where they trigger.
        {excluded > 0 && ` ${excluded} model${excluded > 1 ? 's' : ''} excluded: request exceeds the context window or max output.`}
      </p>
      <ResponsiveContainer width="100%" height={data.length * ROW + 40}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
          <XAxis type="number" {...axis} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} />
          <YAxis type="category" dataKey="name" {...axis} width={110} interval={0} />
          <Tooltip
            {...tooltip}
            formatter={(value, _name, props) => [
              `$${Number(value).toFixed(4)}`,
              (props?.payload as { fullName: string })?.fullName ?? '',
            ]}
          />
          <Bar dataKey="cost" radius={[0, 2, 2, 0]}>
            {data.map((entry) => (
              <Cell key={entry.fullName} fill={getProviderColor(entry.provider)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ProviderLegend />
    </div>
  );
}

export function ContextWindowChart() {
  const data = PROVIDER_MODELS
    .map(model => ({
      name: shortName(model.name),
      context: model.contextWindow,
      maxOutput: model.maxOutput,
    }))
    .sort((a, b) => b.context - a.context);

  return (
    <div className="eco-card-flat">
      <p style={{ fontSize: '0.75rem', color: P.g7, marginBottom: '1rem' }}>
        Hover for exact counts. 1M-class windows are 1,000,000 (Anthropic), 1,050,000 (OpenAI) and 1,048,576 (Gemini) tokens.
      </p>
      <ResponsiveContainer width="100%" height={data.length * ROW * 1.5 + 60}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={P.g3} horizontal={false} />
          <XAxis type="number" {...axis} tickFormatter={(v) => formatTokenCount(Number(v))} />
          <YAxis type="category" dataKey="name" {...axis} width={110} interval={0} />
          <Tooltip {...tooltip} formatter={(value) => `${Number(value).toLocaleString()} tokens`} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 20, color: P.g7 }} />
          <Bar dataKey="context" name="Context window" fill="var(--accent)" radius={[0, 2, 2, 0]} />
          <Bar dataKey="maxOutput" name="Max output" fill={P.g7} radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CostComparisonChart;
