import { ANTHROPIC_PRICING, formatCost } from '@/lib/pricing';

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Anthropic Pricing
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Current pricing for Claude models and services (January 2026).
        </p>
      </div>

      {/* Model Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Opus 4.5 */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="text-sm font-medium opacity-80">Most Capable</div>
            <h2 className="text-2xl font-bold mt-1">Claude Opus 4.5</h2>
            <p className="text-sm opacity-80 mt-2">
              Best for complex analysis, research, and creative tasks
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Input</span>
              <span className="font-semibold text-gray-900 dark:text-white">$5.00 / MTok</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Output</span>
              <span className="font-semibold text-gray-900 dark:text-white">$25.00 / MTok</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache Write</span>
              <span className="font-semibold text-gray-900 dark:text-white">$6.25 / MTok</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache Read</span>
              <span className="font-semibold text-gray-900 dark:text-white">$0.50 / MTok</span>
            </div>
          </div>
        </div>

        {/* Sonnet 4.5 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="text-sm font-medium opacity-80">Best Value</div>
            <h2 className="text-2xl font-bold mt-1">Claude Sonnet 4.5</h2>
            <p className="text-sm opacity-80 mt-2">
              Ideal balance of performance and cost
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Standard (≤200K context)
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Input</span>
                <span className="font-semibold text-gray-900 dark:text-white">$3.00 / MTok</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Output</span>
                <span className="font-semibold text-gray-900 dark:text-white">$15.00 / MTok</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Cache Write</span>
                <span className="font-semibold text-gray-900 dark:text-white">$3.75 / MTok</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Cache Read</span>
                <span className="font-semibold text-gray-900 dark:text-white">$0.30 / MTok</span>
              </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-4">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Extended (&gt;200K context)
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Input</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$6.00 / MTok</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Output</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$22.50 / MTok</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cache Write</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$7.50 / MTok</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cache Read</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$0.60 / MTok</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Haiku 4.5 */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 text-white">
            <div className="text-sm font-medium opacity-80">Most Efficient</div>
            <h2 className="text-2xl font-bold mt-1">Claude Haiku 4.5</h2>
            <p className="text-sm opacity-80 mt-2">
              Fast and cost-effective for simpler tasks
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Input</span>
              <span className="font-semibold text-gray-900 dark:text-white">$1.00 / MTok</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Output</span>
              <span className="font-semibold text-gray-900 dark:text-white">$5.00 / MTok</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache Write</span>
              <span className="font-semibold text-gray-900 dark:text-white">$1.25 / MTok</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache Read</span>
              <span className="font-semibold text-gray-900 dark:text-white">$0.10 / MTok</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Additional Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Web Search</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time web search capability</p>
              </div>
            </div>
            <div className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              $10.00 <span className="text-sm font-normal text-gray-500">/ 1K searches</span>
            </div>
          </div>
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Code Execution</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sandbox code execution environment</p>
              </div>
            </div>
            <div className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              $0.05 <span className="text-sm font-normal text-gray-500">/ hour</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              50 free hours/day/organization
            </p>
          </div>
        </div>
      </div>

      {/* Service Tiers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Service Tiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Priority</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              High availability and predictable pricing for mission-critical workloads.
            </p>
          </div>
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Standard</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Default tier for piloting and scaling. Balanced performance and cost.
            </p>
          </div>
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Batch</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Async workloads with better efficiency. Ideal for non-time-sensitive tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Price Comparison Table
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Model</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Input</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Output</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cache Write</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cache Read</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Output/Input Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-purple-600 dark:text-purple-400">Opus 4.5</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$5.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$25.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$6.25</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$0.50</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">5.0x</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">Sonnet 4.5 (≤200K)</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$3.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$15.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$3.75</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$0.30</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">5.0x</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">Sonnet 4.5 (&gt;200K)</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$6.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$22.50</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$7.50</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$0.60</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">3.75x</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600 dark:text-green-400">Haiku 4.5</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$1.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$5.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$1.25</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">$0.10</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">5.0x</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
          All prices are per million tokens (MTok). Cache read prices show significant savings vs. standard input pricing.
        </div>
      </div>
    </div>
  );
}
