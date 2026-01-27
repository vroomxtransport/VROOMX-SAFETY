import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiDollarSign, FiTrendingDown, FiUsers, FiHash
} from 'react-icons/fi';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

const RANGE_OPTIONS = [30, 60, 90];

const AnalyticsCharts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupRange, setSignupRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics();
      const analytics = response.data.analytics || response.data;
      // Flatten nested structure for easier access
      setData({
        signupsByDay: analytics.signupsByDay || [],
        activeUsersByDay: analytics.activeUsersByDay || [],
        mrr: analytics.revenue?.mrr || 0,
        revenueByPlan: analytics.revenue?.planBreakdown
          ? Object.entries(analytics.revenue.planBreakdown).map(([plan, info]) => ({
              plan,
              revenue: info.revenue || 0,
              count: info.count || 0
            }))
          : [],
        churnRate: analytics.churn?.churnRate || 0,
        topCompanies: analytics.topCompanies || []
      });
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const filteredSignups = useMemo(() => {
    if (!data?.signupsByDay) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - signupRange);
    return data.signupsByDay.filter(d => new Date(d.date) >= cutoff);
  }, [data?.signupsByDay, signupRange]);

  const activeUsersCount = useMemo(() => {
    if (!data?.activeUsersByDay?.length) return 0;
    return data.activeUsersByDay[data.activeUsersByDay.length - 1]?.count || 0;
  }, [data?.activeUsersByDay]);

  const churnColor = useMemo(() => {
    const rate = data?.churnRate || 0;
    if (rate < 5) return 'text-green-600 dark:text-green-400';
    if (rate <= 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }, [data?.churnRate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-zinc-600 dark:text-zinc-400 font-medium">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">MRR</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            ${(data.mrr || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center">
              <FiTrendingDown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Churn Rate</p>
          </div>
          <p className={`text-2xl font-bold ${churnColor}`}>
            {(data.churnRate || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Users</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {activeUsersCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Signup Trend */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Signup Trend</h3>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setSignupRange(days)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  signupRange === days
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredSignups} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #3f3f46',
                  backgroundColor: '#18181b',
                  color: '#fff',
                  fontSize: '12px'
                }}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#signupGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4">Revenue by Plan</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByPlan || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="plan" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #3f3f46',
                    backgroundColor: '#18181b',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4">Active Users (Last 30 Days)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(data.activeUsersByDay || []).slice(-30)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #3f3f46',
                    backgroundColor: '#18181b',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#3b82f6' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Companies */}
      {data.topCompanies?.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Top Companies</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Rank</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Company Name</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">DOT #</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Driver Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.topCompanies.map((company, index) => (
                  <tr key={company._id || index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 font-mono">
                      {company.dotNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {company.driverCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
