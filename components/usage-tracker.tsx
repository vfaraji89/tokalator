'use client';

import { useState } from 'react';
import { calculateCost, formatCost } from '@/lib/pricing';

type ModelId = 'claude-opus-4.5' | 'claude-sonnet-4.5' | 'claude-haiku-4.5';

interface UsageRecord {
  id: string;
  date: string;
  model: ModelId;
  project: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  cost: number;
}

// Sample data - in production this would come from the database
const sampleUsage: UsageRecord[] = [
  {
    id: '1',
    date: '2026-01-31',
    model: 'claude-haiku-4.5',
    project: 'Default Project',
    inputTokens: 20000,
    outputTokens: 10000,
    cacheWriteTokens: 5000,
    cacheReadTokens: 10000,
    cost: 0.08,
  },
  {
    id: '2',
    date: '2026-01-30',
    model: 'claude-opus-4.5',
    project: 'Default Project',
    inputTokens: 20000,
    outputTokens: 25000,
    cacheWriteTokens: 2000,
    cacheReadTokens: 5000,
    cost: 0.68,
  },
  {
    id: '3',
    date: '2026-01-29',
    model: 'claude-sonnet-4.5',
    project: 'Default Project',
    inputTokens: 80000,
    outputTokens: 35000,
    cacheWriteTokens: 20000,
    cacheReadTokens: 10000,
    cost: 1.34,
  },
  {
    id: '4',
    date: '2026-01-28',
    model: 'claude-sonnet-4.5',
    project: 'Default Project',
    inputTokens: 250000,
    outputTokens: 60000,
    cacheWriteTokens: 50000,
    cacheReadTokens: 30000,
    cost: 3.68,
  },
];

const MODEL_LABELS: Record<ModelId, string> = {
  'claude-opus-4.5': 'Claude Opus 4.5',
  'claude-sonnet-4.5': 'Claude Sonnet 4.5',
  'claude-haiku-4.5': 'Claude Haiku 4.5',
};

const MODEL_COLORS: Record<ModelId, string> = {
  'claude-opus-4.5': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'claude-sonnet-4.5': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'claude-haiku-4.5': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export function UsageTracker() {
  const [usage, setUsage] = useState<UsageRecord[]>(sampleUsage);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    model: 'claude-sonnet-4.5' as ModelId,
    inputTokens: 0,
    outputTokens: 0,
    cacheWriteTokens: 0,
    cacheReadTokens: 0,
  });

  const totalCost = usage.reduce((sum, record) => sum + record.cost, 0);
  const totalTokens = usage.reduce(
    (sum, record) =>
      sum + record.inputTokens + record.outputTokens + record.cacheWriteTokens + record.cacheReadTokens,
    0
  );

  const handleAddRecord = () => {
    const costBreakdown = calculateCost(
      newRecord.model,
      {
        inputTokens: newRecord.inputTokens,
        outputTokens: newRecord.outputTokens,
        cacheWriteTokens: newRecord.cacheWriteTokens,
        cacheReadTokens: newRecord.cacheReadTokens,
        promptLength: newRecord.inputTokens, // For tiered pricing
      }
    );
    const cost = costBreakdown.totalCost;

    const record: UsageRecord = {
      ...newRecord,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      project: 'Default Project',
      cost,
    };

    setUsage([record, ...usage]);
    setShowAddForm(false);
    setNewRecord({
      model: 'claude-sonnet-4.5',
      inputTokens: 0,
      outputTokens: 0,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCost(totalCost)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {(totalTokens / 1000).toFixed(1)}K
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Records</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {usage.length}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Usage Record'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Add Usage Record
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <select
                value={newRecord.model}
                onChange={(e) => setNewRecord({ ...newRecord, model: e.target.value as ModelId })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="opus-4.5">Claude Opus 4.5</option>
                <option value="sonnet-4.5">Claude Sonnet 4.5</option>
                <option value="haiku-4.5">Claude Haiku 4.5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Input Tokens
              </label>
              <input
                type="number"
                value={newRecord.inputTokens}
                onChange={(e) => setNewRecord({ ...newRecord, inputTokens: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Output Tokens
              </label>
              <input
                type="number"
                value={newRecord.outputTokens}
                onChange={(e) => setNewRecord({ ...newRecord, outputTokens: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cache Write
              </label>
              <input
                type="number"
                value={newRecord.cacheWriteTokens}
                onChange={(e) => setNewRecord({ ...newRecord, cacheWriteTokens: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cache Read
              </label>
              <input
                type="number"
                value={newRecord.cacheReadTokens}
                onChange={(e) => setNewRecord({ ...newRecord, cacheReadTokens: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleAddRecord}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Save Record
            </button>
          </div>
        </div>
      )}

      {/* Usage Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Input
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Output
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cache
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {usage.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {record.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${MODEL_COLORS[record.model]}`}>
                      {MODEL_LABELS[record.model]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.project}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                    {(record.inputTokens / 1000).toFixed(1)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                    {(record.outputTokens / 1000).toFixed(1)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                    W: {(record.cacheWriteTokens / 1000).toFixed(1)}K / R: {(record.cacheReadTokens / 1000).toFixed(1)}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                    {formatCost(record.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
