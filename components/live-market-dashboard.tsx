'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  Provider,
  PROVIDER_MODELS,
  getProviderName,
  getProviderColor,
  formatTokenCount,
} from '@/lib/providers';
import {
  MARKET_TIME_SERIES,
  MARKET_SNAPSHOTS,
  PRICE_TRENDS,
  getGlobalStats,
  calculateMarketShare,
  simulateLiveUpdate,
  MarketSnapshot,
} from '@/lib/market-data';

// ============================================
// CHART COLORS - ECONOMIST PALETTE
// ============================================

const COLORS = {
  anthropic: '#e3120b',  // Economist red
  openai: '#1a1a1a',     // Black
  google: '#991b1b',     // Dark red
  grid: '#333333',
  axis: '#666666',
  tooltip: '#1a1a1a',
};

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  subtext?: string;
}

function StatCard({ label, value, change, subtext }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {change !== undefined && (
        <span className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </span>
      )}
      {subtext && (
        <span className="text-xs text-muted">{subtext}</span>
      )}
    </div>
  );
}

// ============================================
// PROVIDER BADGE
// ============================================

function ProviderBadge({ provider }: { provider: Provider }) {
  const colors = {
    anthropic: 'eco-badge-red',
    openai: 'eco-badge-black',
    google: 'eco-badge-red opacity-80',
  };
  
  return (
    <span className={`eco-badge ${colors[provider]}`}>
      {getProviderName(provider)}
    </span>
  );
}

// ============================================
// LIVE MARKET DASHBOARD
// ============================================

export function LiveMarketDashboard() {
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>(MARKET_SNAPSHOTS);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const globalStats = getGlobalStats();
  const marketShare = calculateMarketShare();
  
  // Simulate live updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshots(simulateLiveUpdate());
      setLastUpdate(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="dark min-h-screen bg-eco-black text-eco-white p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="headline text-eco-white">
              AI Token Market
            </h1>
            <p className="subheadline mt-2">
              Live pricing and usage data across major AI providers
            </p>
          </div>
          <div className="text-right">
            <span className="live-pulse text-xs font-semibold uppercase tracking-wider">
              Live
            </span>
            <p className="text-xs text-muted mt-1">
              Updated {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="eco-divider-thick w-24" />
      </header>
      
      {/* Global Stats */}
      <section className="mb-10">
        <h2 className="section-title">Market Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Daily Global Tokens"
            value={`${(globalStats.totalDailyTokens / 1e12).toFixed(1)}T`}
            change={8.2}
          />
          <StatCard
            label="Daily Revenue"
            value={`$${(globalStats.totalDailyRevenue / 1e6).toFixed(1)}M`}
            change={5.4}
          />
          <StatCard
            label="Market Leader"
            value={getProviderName(globalStats.marketLeader)}
            subtext="By token volume"
          />
          <StatCard
            label="Fastest Growing"
            value={getProviderName(globalStats.fastestGrowing)}
            change={18.3}
          />
        </div>
      </section>
      
      {/* Provider Stats */}
      <section className="mb-10">
        <h2 className="section-title">Provider Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {snapshots.map((snapshot) => (
            <div key={snapshot.provider} className="eco-card">
              <div className="flex items-center justify-between mb-4">
                <ProviderBadge provider={snapshot.provider} />
                <span className={`stat-change ${snapshot.trend === 'up' ? 'positive' : snapshot.trend === 'down' ? 'negative' : ''}`}>
                  {snapshot.trend === 'up' ? '↑' : snapshot.trend === 'down' ? '↓' : '→'} {Math.abs(snapshot.changePercent).toFixed(1)}%
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="data-label">Daily Tokens</span>
                  <p className="data-value-sm">
                    {(snapshot.estimatedDailyTokens / 1e12).toFixed(2)}T
                  </p>
                </div>
                <div>
                  <span className="data-label">Daily Revenue</span>
                  <p className="data-value-sm">
                    ${(snapshot.estimatedDailyRevenue / 1e6).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <span className="data-label">Active Users</span>
                  <p className="data-value-sm">
                    {(snapshot.activeUsers / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Charts Row */}
      <section className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token Volume Trend */}
          <div className="eco-card-flat">
            <h3 className="section-title">Token Volume (30 days)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={MARKET_TIME_SERIES}>
                <defs>
                  <linearGradient id="gradAnthropic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.anthropic} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS.anthropic} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradOpenai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#666" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#666" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradGoogle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.google} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS.google} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={COLORS.axis}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis 
                  stroke={COLORS.axis}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}T`}
                />
                <Tooltip
                  contentStyle={{
                    background: COLORS.tooltip,
                    border: '1px solid #333',
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)}T tokens`, '']}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 11, paddingTop: 20 }}
                />
                <Area
                  type="monotone"
                  dataKey="openai"
                  name="OpenAI"
                  stroke="#666"
                  strokeWidth={2}
                  fill="url(#gradOpenai)"
                />
                <Area
                  type="monotone"
                  dataKey="google"
                  name="Google"
                  stroke={COLORS.google}
                  strokeWidth={2}
                  fill="url(#gradGoogle)"
                />
                <Area
                  type="monotone"
                  dataKey="anthropic"
                  name="Anthropic"
                  stroke={COLORS.anthropic}
                  strokeWidth={2}
                  fill="url(#gradAnthropic)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Price Trends */}
          <div className="eco-card-flat">
            <h3 className="section-title">Input Price Trends ($/MTok)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={PRICE_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis 
                  dataKey="date" 
                  stroke={COLORS.axis}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis 
                  stroke={COLORS.axis}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: COLORS.tooltip,
                    border: '1px solid #333',
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}/MTok`, '']}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 11, paddingTop: 20 }}
                />
                <Line
                  type="monotone"
                  dataKey="claude-opus-4.5"
                  name="Claude Opus"
                  stroke={COLORS.anthropic}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gpt-4o"
                  name="GPT-4o"
                  stroke="#666"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gemini-2.0-ultra"
                  name="Gemini Ultra"
                  stroke={COLORS.google}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      
      {/* Market Share */}
      <section className="mb-10">
        <h2 className="section-title">Market Share</h2>
        <div className="eco-card-flat">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {marketShare.map((share) => (
              <div key={share.provider}>
                <div className="flex items-center justify-between mb-3">
                  <ProviderBadge provider={share.provider} />
                </div>
                
                {/* Token Share Bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="data-label">Token Volume</span>
                    <span className="text-sm font-semibold">{share.tokenShare}%</span>
                  </div>
                  <div className="h-2 bg-eco-gray-800 rounded-none overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${share.tokenShare}%`,
                        backgroundColor: getProviderColor(share.provider)
                      }}
                    />
                  </div>
                </div>
                
                {/* Revenue Share Bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="data-label">Revenue</span>
                    <span className="text-sm font-semibold">{share.revenueShare}%</span>
                  </div>
                  <div className="h-2 bg-eco-gray-800 rounded-none overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${share.revenueShare}%`,
                        backgroundColor: getProviderColor(share.provider),
                        opacity: 0.7
                      }}
                    />
                  </div>
                </div>
                
                {/* User Share Bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="data-label">Active Users</span>
                    <span className="text-sm font-semibold">{share.userShare}%</span>
                  </div>
                  <div className="h-2 bg-eco-gray-800 rounded-none overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${share.userShare}%`,
                        backgroundColor: getProviderColor(share.provider),
                        opacity: 0.5
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Model Pricing Table */}
      <section>
        <h2 className="section-title">Current Model Pricing</h2>
        <div className="eco-card-flat overflow-x-auto">
          <table className="eco-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Provider</th>
                <th>Tier</th>
                <th className="text-right">Input $/MTok</th>
                <th className="text-right">Output $/MTok</th>
                <th className="text-right">Context</th>
                <th className="text-right">Max Output</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDER_MODELS.sort((a, b) => b.inputCostPerMTok - a.inputCostPerMTok).map((model) => (
                <tr key={model.id}>
                  <td className="font-medium">{model.name}</td>
                  <td><ProviderBadge provider={model.provider} /></td>
                  <td>
                    <span className={`text-xs uppercase tracking-wider ${
                      model.tier === 'flagship' ? 'text-eco-red' : 
                      model.tier === 'balanced' ? 'text-eco-gray-400' : 'text-eco-gray-500'
                    }`}>
                      {model.tier}
                    </span>
                  </td>
                  <td className="text-right font-mono">${model.inputCostPerMTok.toFixed(2)}</td>
                  <td className="text-right font-mono">${model.outputCostPerMTok.toFixed(2)}</td>
                  <td className="text-right font-mono">{formatTokenCount(model.contextWindow)}</td>
                  <td className="text-right font-mono">{formatTokenCount(model.maxOutput)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default LiveMarketDashboard;
