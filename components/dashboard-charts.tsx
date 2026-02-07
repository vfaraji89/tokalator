'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { formatCost } from '@/lib/pricing';

// Sample data - in production this would come from the database
const dailyData = [
  { date: 'Jan 25', opus: 0.70, sonnet: 0, haiku: 0, total: 0.70 },
  { date: 'Jan 26', opus: 0, sonnet: 1.14, haiku: 0, total: 1.14 },
  { date: 'Jan 27', opus: 0, sonnet: 0, haiku: 1.58, total: 1.58 },
  { date: 'Jan 28', opus: 0, sonnet: 3.68, haiku: 0, total: 3.68 },
  { date: 'Jan 29', opus: 0, sonnet: 1.34, haiku: 0, total: 1.34 },
  { date: 'Jan 30', opus: 0.68, sonnet: 0, haiku: 0, total: 0.68 },
  { date: 'Jan 31', opus: 0, sonnet: 0, haiku: 0.08, total: 0.08 },
];

const modelDistribution = [
  { name: 'Opus 4.5', value: 1.38, color: '#8B5CF6' },
  { name: 'Sonnet 4.5', value: 6.16, color: '#3B82F6' },
  { name: 'Haiku 4.5', value: 1.66, color: '#10B981' },
];

const tokenBreakdown = [
  { name: 'Input', opus: 80000, sonnet: 480000, haiku: 520000 },
  { name: 'Output', opus: 35000, sonnet: 140000, haiku: 210000 },
  { name: 'Cache Write', opus: 10000, sonnet: 120000, haiku: 55000 },
  { name: 'Cache Read', opus: 30000, sonnet: 50000, haiku: 210000 },
];

const COLORS = {
  opus: '#8B5CF6',
  sonnet: '#3B82F6',
  haiku: '#10B981',
};

interface DashboardChartsProps {
  totalCost: number;
  totalTokens: number;
  projectCount: number;
  budgetUsed: number;
}

export function DashboardCharts({ 
  totalCost = 9.20, 
  totalTokens = 1940000,
  projectCount = 1,
  budgetUsed = 0.92,
}: DashboardChartsProps) {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost (7 days)</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCost(totalCost)}
          </div>
          <div className="text-sm text-green-600 mt-2">↓ 12% from last week</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {(totalTokens / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-sm text-gray-500 mt-2">Across all models</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Projects</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {projectCount}
          </div>
          <div className="text-sm text-gray-500 mt-2">With usage this week</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Budget Used</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {(budgetUsed * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className={`h-2 rounded-full ${budgetUsed > 0.8 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(budgetUsed * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Cost Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Daily Cost Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                formatter={(value) => formatCost(Number(value))}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6' }}
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Model */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Cost by Model
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={modelDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {modelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCost(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Token Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Token Usage by Type & Model
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tokenBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip 
              formatter={(value) => `${(Number(value) / 1000).toFixed(1)}K tokens`}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            />
            <Legend />
            <Bar dataKey="opus" name="Opus 4.5" fill={COLORS.opus} />
            <Bar dataKey="sonnet" name="Sonnet 4.5" fill={COLORS.sonnet} />
            <Bar dataKey="haiku" name="Haiku 4.5" fill={COLORS.haiku} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost by Model - Stacked Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Daily Cost by Model
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(v) => `$${v}`} />
            <Tooltip 
              formatter={(value) => formatCost(Number(value))}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            />
            <Legend />
            <Bar dataKey="opus" name="Opus 4.5" stackId="a" fill={COLORS.opus} />
            <Bar dataKey="sonnet" name="Sonnet 4.5" stackId="a" fill={COLORS.sonnet} />
            <Bar dataKey="haiku" name="Haiku 4.5" stackId="a" fill={COLORS.haiku} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
