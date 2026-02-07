/**
 * Simulated Live Market Data for Token Usage
 * In production, this would connect to real APIs
 */

import { Provider, PROVIDER_MODELS } from './providers';

export interface MarketSnapshot {
  timestamp: Date;
  provider: Provider;
  estimatedDailyTokens: number;
  estimatedDailyRevenue: number;
  activeUsers: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface TimeSeriesPoint {
  date: string;
  anthropic: number;
  openai: number;
  google: number;
  total: number;
}

export interface GlobalStats {
  totalDailyTokens: number;
  totalDailyRevenue: number;
  marketLeader: Provider;
  fastestGrowing: Provider;
  avgCostPerMTok: number;
}

// ============================================
// SIMULATED TIME SERIES DATA (Last 30 days)
// ============================================

function generateTimeSeriesData(): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  const now = new Date('2026-02-01');
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate growing trends with some variance
    const dayFactor = (30 - i) / 30;
    const baseAnthropic = 2.1 + dayFactor * 0.4 + (Math.random() - 0.5) * 0.3;
    const baseOpenai = 8.5 + dayFactor * 0.8 + (Math.random() - 0.5) * 0.5;
    const baseGoogle = 3.2 + dayFactor * 0.6 + (Math.random() - 0.5) * 0.4;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      anthropic: Math.round(baseAnthropic * 100) / 100,
      openai: Math.round(baseOpenai * 100) / 100,
      google: Math.round(baseGoogle * 100) / 100,
      total: Math.round((baseAnthropic + baseOpenai + baseGoogle) * 100) / 100,
    });
  }
  
  return data;
}

export const MARKET_TIME_SERIES = generateTimeSeriesData();

// ============================================
// SIMULATED MARKET SNAPSHOTS
// ============================================

export const MARKET_SNAPSHOTS: MarketSnapshot[] = [
  {
    timestamp: new Date('2026-02-01T12:00:00'),
    provider: 'anthropic',
    estimatedDailyTokens: 2.8e12,
    estimatedDailyRevenue: 8.4e6,
    activeUsers: 450_000,
    trend: 'up',
    changePercent: 12.5,
  },
  {
    timestamp: new Date('2026-02-01T12:00:00'),
    provider: 'openai',
    estimatedDailyTokens: 9.2e12,
    estimatedDailyRevenue: 23.1e6,
    activeUsers: 2_100_000,
    trend: 'stable',
    changePercent: 2.1,
  },
  {
    timestamp: new Date('2026-02-01T12:00:00'),
    provider: 'google',
    estimatedDailyTokens: 4.1e12,
    estimatedDailyRevenue: 5.2e6,
    activeUsers: 890_000,
    trend: 'up',
    changePercent: 18.3,
  },
];

// ============================================
// PRICE TREND DATA ($/MTok over time)
// ============================================

export interface PriceTrendPoint {
  date: string;
  'claude-opus-4.6': number;
  'claude-sonnet-4.5': number;
  'gpt-5.2': number;
  'gpt-4.1': number;
  'gemini-3-pro': number;
  'gemini-2.5-flash': number;
}

function generatePriceTrendData(): PriceTrendPoint[] {
  const data: PriceTrendPoint[] = [];
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  
  // Simulated price evolution (input cost $/MTok)
  const trends = {
    'claude-opus-4.6': [null, null, 5.0, 5.0, 5.0, 5.0],
    'claude-sonnet-4.5': [3.5, 3.0, 3.0, 3.0, 3.0, 3.0],
    'gpt-5.2': [null, null, null, null, 1.75, 1.75],
    'gpt-4.1': [3.0, 3.0, 3.0, 3.0, 3.0, 3.0],
    'gemini-3-pro': [null, null, null, null, 2.0, 2.0],
    'gemini-2.5-flash': [0.30, 0.30, 0.30, 0.30, 0.30, 0.30],
  };
  
  months.forEach((month, i) => {
    data.push({
      date: month,
      'claude-opus-4.6': trends['claude-opus-4.6'][i] ?? 0,
      'claude-sonnet-4.5': trends['claude-sonnet-4.5'][i],
      'gpt-5.2': trends['gpt-5.2'][i] ?? 0,
      'gpt-4.1': trends['gpt-4.1'][i],
      'gemini-3-pro': trends['gemini-3-pro'][i] ?? 0,
      'gemini-2.5-flash': trends['gemini-2.5-flash'][i],
    });
  });
  
  return data;
}

export const PRICE_TRENDS = generatePriceTrendData();

// ============================================
// GLOBAL STATISTICS
// ============================================

export function getGlobalStats(): GlobalStats {
  const snapshots = MARKET_SNAPSHOTS;
  const totalTokens = snapshots.reduce((sum, s) => sum + s.estimatedDailyTokens, 0);
  const totalRevenue = snapshots.reduce((sum, s) => sum + s.estimatedDailyRevenue, 0);
  
  const leader = snapshots.reduce((max, s) => 
    s.estimatedDailyTokens > max.estimatedDailyTokens ? s : max
  );
  
  const fastestGrowing = snapshots.reduce((max, s) =>
    s.changePercent > max.changePercent ? s : max
  );
  
  // Calculate weighted average cost
  const avgCost = PROVIDER_MODELS.reduce((sum, m) => sum + m.inputCostPerMTok, 0) / 
                  PROVIDER_MODELS.length;
  
  return {
    totalDailyTokens: totalTokens,
    totalDailyRevenue: totalRevenue,
    marketLeader: leader.provider,
    fastestGrowing: fastestGrowing.provider,
    avgCostPerMTok: Math.round(avgCost * 100) / 100,
  };
}

// ============================================
// SIMULATED LIVE UPDATES (for demo purposes)
// ============================================

export function simulateLiveUpdate(): MarketSnapshot[] {
  return MARKET_SNAPSHOTS.map(snapshot => ({
    ...snapshot,
    timestamp: new Date(),
    estimatedDailyTokens: snapshot.estimatedDailyTokens * (1 + (Math.random() - 0.5) * 0.02),
    estimatedDailyRevenue: snapshot.estimatedDailyRevenue * (1 + (Math.random() - 0.5) * 0.02),
    changePercent: snapshot.changePercent + (Math.random() - 0.5) * 2,
  }));
}

// ============================================
// MARKET SHARE CALCULATION
// ============================================

export interface MarketShare {
  provider: Provider;
  tokenShare: number;
  revenueShare: number;
  userShare: number;
}

export function calculateMarketShare(): MarketShare[] {
  const snapshots = MARKET_SNAPSHOTS;
  const totalTokens = snapshots.reduce((sum, s) => sum + s.estimatedDailyTokens, 0);
  const totalRevenue = snapshots.reduce((sum, s) => sum + s.estimatedDailyRevenue, 0);
  const totalUsers = snapshots.reduce((sum, s) => sum + s.activeUsers, 0);
  
  return snapshots.map(s => ({
    provider: s.provider,
    tokenShare: Math.round((s.estimatedDailyTokens / totalTokens) * 100),
    revenueShare: Math.round((s.estimatedDailyRevenue / totalRevenue) * 100),
    userShare: Math.round((s.activeUsers / totalUsers) * 100),
  }));
}
