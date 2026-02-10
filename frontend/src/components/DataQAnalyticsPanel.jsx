import { useState, useEffect } from 'react';
import { dataqAnalyticsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiFileText, FiCheckCircle, FiXCircle, FiClock,
  FiDollarSign, FiTrendingUp, FiTarget, FiBarChart2,
  FiCalendar, FiAlertTriangle, FiDownload, FiActivity
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Legend
} from 'recharts';
import LoadingSpinner from './LoadingSpinner';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

const DataQAnalyticsPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [triageAccuracy, setTriageAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monthly report state
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Triage accuracy loading
  const [triageLoading, setTriageLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, trendsRes] = await Promise.all([
        dataqAnalyticsAPI.getCarrierAnalytics(),
        dataqAnalyticsAPI.getTrends()
      ]);
      setAnalytics(analyticsRes.data.data || analyticsRes.data);
      const rawTrends = trendsRes.data.data || trendsRes.data.trends || [];
      setTrends(rawTrends.map(t => ({
        ...t,
        label: `${t.year}-${String(t.month).padStart(2, '0')}`
      })));

      // Fetch triage accuracy separately (may not be available)
      setTriageLoading(true);
      try {
        const triageRes = await dataqAnalyticsAPI.getTriageAccuracy();
        setTriageAccuracy(triageRes.data.data || triageRes.data);
      } catch {
        // Triage accuracy is optional
      } finally {
        setTriageLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics');
      toast.error('Failed to load DataQ analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await dataqAnalyticsAPI.getMonthlyReport(reportMonth, reportYear);
      setReport(res.data.data || res.data);
      toast.success('Report generated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatXAxis = (tick) => {
    if (!tick) return '';
    // Expects "YYYY-MM" or similar format
    const parts = tick.split('-');
    if (parts.length >= 2) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0].slice(-2);
      return `${monthNames[monthIdx] || parts[1]} ${year}`;
    }
    return tick;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <FiAlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
        <button onClick={fetchData} className="btn btn-secondary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  const stats = analytics || {};
  const statCards = [
    {
      label: 'Total Filed',
      value: stats.totalFiled ?? 0,
      icon: FiFileText,
      color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-500'
    },
    {
      label: 'Won',
      value: stats.won ?? 0,
      icon: FiCheckCircle,
      color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    },
    {
      label: 'Lost',
      value: stats.lost ?? 0,
      icon: FiXCircle,
      color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
      iconColor: 'text-red-500'
    },
    {
      label: 'Pending',
      value: stats.pending ?? 0,
      icon: FiClock,
      color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
      iconColor: 'text-amber-500'
    },
    {
      label: 'Success Rate',
      value: stats.successRate != null ? `${stats.successRate}%` : 'N/A',
      icon: FiTarget,
      color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
      iconColor: 'text-purple-500'
    },
    {
      label: 'Est. Savings',
      value: stats.estimatedSavings != null ? `$${Number(stats.estimatedSavings).toLocaleString()}` : 'N/A',
      icon: FiDollarSign,
      color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Section 1: Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`p-4 rounded-lg ${stat.color}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                <span className="text-xs font-medium uppercase tracking-wide opacity-75">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Section 2: Trends Chart */}
      {trends.length > 0 && (
        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Challenge Trends</h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends}>
                <XAxis
                  dataKey="label"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg, #fff)',
                    border: '1px solid #e4e4e7',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                  labelFormatter={formatXAxis}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar
                  dataKey="filed"
                  name="Filed"
                  stackId="challenges"
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="won"
                  name="Won"
                  stackId="challenges"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="lost"
                  name="Lost"
                  stackId="challenges"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Section 3: Triage Accuracy */}
      {triageLoading ? (
        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <FiActivity className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Triage Accuracy</h3>
          </div>
          <div className="flex justify-center py-6">
            <LoadingSpinner size="md" />
          </div>
        </div>
      ) : triageAccuracy && (
        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <FiActivity className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Triage Accuracy</h3>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {triageAccuracy.accuracy != null ? `${triageAccuracy.accuracy}%` : 'N/A'}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              prediction accuracy
            </div>
          </div>

          {/* Accuracy bar */}
          {triageAccuracy.accuracy != null && (
            <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  triageAccuracy.accuracy >= 70
                    ? 'bg-emerald-500'
                    : triageAccuracy.accuracy >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${triageAccuracy.accuracy}%` }}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-center">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {triageAccuracy.correct ?? 0}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Correct</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-center">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {triageAccuracy.overPredicted ?? 0}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Over-predicted</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-center">
              <p className="text-lg font-bold text-red-700 dark:text-red-400">
                {triageAccuracy.underPredicted ?? 0}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">Under-predicted</p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Monthly Report Generator */}
      <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <FiCalendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">Monthly Report</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Month
            </label>
            <select
              value={reportMonth}
              onChange={(e) => { setReportMonth(Number(e.target.value)); setReport(null); }}
              className="form-input"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Year
            </label>
            <select
              value={reportYear}
              onChange={(e) => { setReportYear(Number(e.target.value)); setReport(null); }}
              className="form-input"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={handleGenerateReport}
              className="btn btn-primary w-full"
              disabled={generatingReport}
            >
              {generatingReport ? <LoadingSpinner size="sm" /> : (
                <>
                  <FiBarChart2 className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {report && (
          <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
              {MONTHS.find(m => m.value === reportMonth)?.label} {reportYear} Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Filed</span>
                <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                  {report.filed ?? report.totalFiled ?? 0}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Won</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {report.won ?? 0}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Lost</span>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {report.lost ?? 0}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Pending</span>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {report.pending ?? 0}
                </p>
              </div>
            </div>
            {report.successRate != null && (
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                <FiTarget className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Success Rate:</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {report.successRate}%
                </span>
              </div>
            )}
            {report.estimatedSavings != null && (
              <div className="flex items-center gap-2 mt-1">
                <FiDollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Est. Savings:</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ${Number(report.estimatedSavings).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataQAnalyticsPanel;
