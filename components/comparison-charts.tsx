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
import { PROVIDER_MODELS, getProviderColor, Provider } from '@/lib/providers';

// ============================================
// COST COMPARISON CHART
// ============================================

interface CostComparisonProps {
  inputTokens?: number;
  outputTokens?: number;
}

export function CostComparisonChart({ 
  inputTokens = 100000, 
  outputTokens = 10000 
}: CostComparisonProps) {
  // Calculate costs for each model
  const data = PROVIDER_MODELS
    .map(model => ({
      name: model.name.replace('Claude ', '').replace('Gemini ', ''),
      cost: (inputTokens / 1_000_000) * model.inputCostPerMTok +
            (outputTokens / 1_000_000) * model.outputCostPerMTok,
      provider: model.provider,
      fullName: model.name,
    }))
    .sort((a, b) => a.cost - b.cost);
  
  return (
    <div className="eco-card-flat">
      <div className="mb-4">
        <h3 className="section-title">Cost Comparison</h3>
        <p className="text-xs text-muted">
          {(inputTokens / 1000).toFixed(0)}K input + {(outputTokens / 1000).toFixed(0)}K output tokens
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
          <XAxis 
            type="number"
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 12,
              color: '#111',
            }}
            formatter={(value, name, props) => [
              `$${Number(value).toFixed(4)}`,
              (props?.payload as { fullName: string })?.fullName ?? ''
            ]}
          />
          <Bar dataKey="cost" radius={[0, 2, 2, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getProviderColor(entry.provider)}
                fillOpacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-eco-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-eco-red" />
          <span className="text-xs text-muted">Anthropic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-eco-black border border-eco-gray-600" />
          <span className="text-xs text-muted">OpenAI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#991b1b]" />
          <span className="text-xs text-muted">Google</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONTEXT WINDOW COMPARISON
// ============================================

export function ContextWindowChart() {
  const data = PROVIDER_MODELS
    .map(model => ({
      name: model.name.replace('Claude ', '').replace('Gemini ', ''),
      context: model.contextWindow / 1000,
      maxOutput: model.maxOutput / 1000,
      provider: model.provider,
    }))
    .sort((a, b) => b.context - a.context);
  
  return (
    <div className="eco-card-flat">
      <h3 className="section-title">Context Window Size (K tokens)</h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
          <XAxis 
            type="number"
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => `${v}K`}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 12,
              color: '#111',
            }}
            formatter={(value) => [`${Number(value)}K tokens`]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
          <Bar 
            dataKey="context" 
            name="Context Window"
            fill="#e3120b"
            fillOpacity={0.9}
            radius={[0, 2, 2, 0]}
          />
          <Bar 
            dataKey="maxOutput" 
            name="Max Output"
            fill="#333"
            radius={[0, 2, 2, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// PRICE PER QUALITY METRIC
// ============================================

interface PriceQualityData {
  name: string;
  pricePerToken: number;
  qualityScore: number;
  provider: Provider;
}

export function PriceQualityChart() {
  // Quality scores based on latest benchmarks (Feb 2026)
  const data: PriceQualityData[] = [
    { name: 'Opus 4.6', pricePerToken: 5.0, qualityScore: 99, provider: 'anthropic' },
    { name: 'Sonnet 4.5', pricePerToken: 3.0, qualityScore: 93, provider: 'anthropic' },
    { name: 'Haiku 4.5', pricePerToken: 1.0, qualityScore: 86, provider: 'anthropic' },
    { name: 'GPT-5.2', pricePerToken: 1.75, qualityScore: 97, provider: 'openai' },
    { name: 'GPT-4.1', pricePerToken: 3.0, qualityScore: 92, provider: 'openai' },
    { name: 'GPT-4.1 Mini', pricePerToken: 0.80, qualityScore: 87, provider: 'openai' },
    { name: 'GPT-5 Mini', pricePerToken: 0.25, qualityScore: 84, provider: 'openai' },
    { name: 'o4-mini', pricePerToken: 4.0, qualityScore: 96, provider: 'openai' },
    { name: 'Gemini 3 Pro', pricePerToken: 2.0, qualityScore: 96, provider: 'google' },
    { name: 'Gemini 3 Flash', pricePerToken: 0.50, qualityScore: 89, provider: 'google' },
    { name: 'Gemini 2.5 Pro', pricePerToken: 1.25, qualityScore: 94, provider: 'google' },
    { name: 'Gemini 2.5 Flash', pricePerToken: 0.30, qualityScore: 85, provider: 'google' },
  ];
  
  // Calculate efficiency (quality per dollar)
  const efficiencyData = data
    .map(d => ({
      ...d,
      efficiency: d.qualityScore / d.pricePerToken,
    }))
    .sort((a, b) => b.efficiency - a.efficiency);
  
  return (
    <div className="eco-card-flat">
      <h3 className="section-title">Quality per Dollar (Efficiency)</h3>
      <p className="text-xs text-muted mb-4">
        Higher = better value. Quality score / Input cost per MTok
      </p>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={efficiencyData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
          <XAxis 
            type="number"
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke="#666"
            tick={{ fontSize: 11 }}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 12,
              color: '#111',
            }}
            formatter={(value, name, props) => {
              const payload = props?.payload as PriceQualityData & { efficiency: number };
              return [
                `${Number(value).toFixed(1)} quality/$`,
                `Quality: ${payload?.qualityScore ?? 0}, Price: $${payload?.pricePerToken ?? 0}/MTok`
              ];
            }}
          />
          <Bar dataKey="efficiency" radius={[0, 2, 2, 0]}>
            {efficiencyData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getProviderColor(entry.provider)}
                fillOpacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CostComparisonChart;
