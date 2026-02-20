import { useState, useEffect } from 'react';
import { csaAPI } from '../utils/api';
import {
  FiTrendingUp, FiTrendingDown, FiMinus, FiDownload,
  FiCalendar, FiAlertTriangle, FiCheckCircle, FiRefreshCw,
  FiChevronDown, FiClock
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import LoadingSpinner from './LoadingSpinner';

const CSATrends = () => {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(90);
  const [selectedBasics, setSelectedBasics] = useState([
    'unsafeDriving', 'hoursOfService', 'vehicleMaintenance'
  ]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [timeDecay, setTimeDecay] = useState(null);

  const basicColors = {
    unsafeDriving: '#ef4444',
    hoursOfService: '#f59e0b',
    vehicleMaintenance: '#3b82f6',
    controlledSubstances: '#8b5cf6',
    driverFitness: '#10b981',
    crashIndicator: '#ec4899'
  };

  const basicNames = {
    unsafeDriving: 'Unsafe Driving',
    hoursOfService: 'Hours of Service',
    vehicleMaintenance: 'Vehicle Maintenance',
    controlledSubstances: 'Controlled Substances',
    driverFitness: 'Driver Fitness',
    crashIndicator: 'Crash Indicator'
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [historyRes, summaryRes, alertsRes, timeDecayRes] = await Promise.all([
        csaAPI.getHistory(dateRange),
        csaAPI.getTrendSummary(dateRange),
        csaAPI.getAlerts(),
        csaAPI.getTimeDecay(24).catch(() => null)
      ]);

      setHistory(historyRes.data.history || []);
      setSummary(summaryRes.data);
      setAlerts(alertsRes.data.alerts || []);
      if (timeDecayRes?.data) {
        setTimeDecay(timeDecayRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await csaAPI.exportHistory(dateRange, 'csv');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `csa-history-${dateRange}days.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleCompare = async () => {
    if (history.length < 2) return;

    setCompareLoading(true);
    try {
      const startDate = history[0].date;
      const endDate = history[history.length - 1].date;
      const response = await csaAPI.compare(startDate, endDate);
      setCompareData(response.data);
      setShowCompare(true);
    } catch (err) {
      console.error('Compare failed:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  const toggleBasic = (basic) => {
    setSelectedBasics(prev =>
      prev.includes(basic)
        ? prev.filter(b => b !== basic)
        : [...prev, basic]
    );
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <FiTrendingDown className="w-4 h-4 text-emerald-500" />;
      case 'worsening':
        return <FiTrendingUp className="w-4 h-4 text-red-500" />;
      default:
        return <FiMinus className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-emerald-600 dark:text-emerald-400';
      case 'worsening': return 'text-red-600 dark:text-red-400';
      default: return 'text-zinc-600 dark:text-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading trend data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FiAlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">CSA Score Trends</h2>
            {/* Data Source Badge */}
            {summary?.source === 'fmcsa' ? (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                FMCSA Data
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
                Estimated
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {summary?.source === 'fmcsa'
              ? 'Historical data from FMCSA SAFER system'
              : 'Estimated scores based on violation records'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500/30"
          >
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={180}>Last 6 Months</option>
            <option value={365}>Last Year</option>
          </select>

          <button
            onClick={handleCompare}
            disabled={history.length < 2 || compareLoading}
            className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <FiCalendar className="w-4 h-4" />
            Compare
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={fetchData}
            className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                {alerts.length} Alert{alerts.length > 1 ? 's' : ''} Detected
              </p>
              <ul className="mt-2 space-y-1">
                {alerts.slice(0, 3).map((alert, i) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-300">
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Trend Summary Cards */}
      {summary?.hasEnoughData && summary?.basicTrends && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(summary.basicTrends).map(([key, data]) => (
            <div
              key={key}
              className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                selectedBasics.includes(key)
                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
              onClick={() => toggleBasic(key)}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: basicColors[key] }}
                />
                {getTrendIcon(data.trend)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-0.5">
                {basicNames[key]}
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {data.end != null ? `${data.end}%` : '—'}
              </p>
              {data.change !== null && (
                <p className={`text-xs font-medium ${
                  data.change < 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  data.change > 0 ? 'text-red-600 dark:text-red-400' :
                  'text-zinc-500 dark:text-zinc-400'
                }`}>
                  {data.change > 0 ? '+' : ''}{data.change}% from start
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Not Enough Data Message */}
      {!summary?.hasEnoughData && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-6 text-center">
          <FiCalendar className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="font-medium text-amber-800 dark:text-amber-200">Not Enough Historical Data</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            We need at least 2 data points to show trends. Keep using VroomX and your score history will build up automatically with each FMCSA sync.
          </p>
        </div>
      )}

      {/* Main Trend Chart */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            BASIC Score History
          </h3>

          <div className="h-[350px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={{ stroke: 'var(--glass-border)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={{ stroke: 'var(--glass-border)' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [`${value}%`, basicNames[name]]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => basicNames[value]}
                />

                {/* Threshold reference lines */}
                <ReferenceLine
                  y={65}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeOpacity={0.7}
                />
                <ReferenceLine
                  y={80}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeOpacity={0.7}
                />

                {/* Lines for selected BASICs */}
                {selectedBasics.map(basic => (
                  <Line
                    key={basic}
                    type="monotone"
                    dataKey={basic}
                    stroke={basicColors[basic]}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: basicColors[basic] }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend / Toggle Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.keys(basicColors).map(basic => (
              <button
                key={basic}
                onClick={() => toggleBasic(basic)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedBasics.includes(basic)
                    ? 'text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                style={selectedBasics.includes(basic) ? { backgroundColor: basicColors[basic] } : {}}
              >
                {basicNames[basic]}
              </button>
            ))}
          </div>

          {/* Threshold Legend */}
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed' }} />
              <span>Alert Threshold (65%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }} />
              <span>Critical Threshold (80%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && compareData?.success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Score Comparison</h3>
              <button
                onClick={() => setShowCompare(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Comparing{' '}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(compareData.startRecord.date).toLocaleDateString()}
                </span>
                {' '}to{' '}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(compareData.endRecord.date).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-3">
                {compareData.comparison && Object.entries(compareData.comparison).map(([key, data]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: basicColors[key] }}
                      />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {basicNames[key]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {data.startValue ?? '-'}%
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500">→</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {data.endValue ?? '-'}%
                      </span>
                      {data.change !== null && (
                        <span className={`text-sm font-medium ${
                          data.improved ? 'text-emerald-600 dark:text-emerald-400' :
                          data.change > 0 ? 'text-red-600 dark:text-red-400' :
                          'text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {data.change > 0 ? '+' : ''}{data.change}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 24-Month Score Projection */}
      {timeDecay && timeDecay.projections && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">24-Month Score Projection</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">How your scores will improve as violations age out</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeDecay.projections?.map(p => ({
                    month: p.month,
                    date: p.date,
                    unsafeDriving: p.scores?.unsafe_driving?.estimatedPercentile || 0,
                    hoursOfService: p.scores?.hours_of_service?.estimatedPercentile || 0,
                    vehicleMaintenance: p.scores?.vehicle_maintenance?.estimatedPercentile || 0,
                    controlledSubstances: p.scores?.controlled_substances?.estimatedPercentile || 0,
                    driverFitness: p.scores?.driver_fitness?.estimatedPercentile || 0,
                    crashIndicator: p.scores?.crash_indicator?.estimatedPercentile || 0
                  })) || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickFormatter={(v) => `+${v}mo`}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  />
                  <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Alert 65%', fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Critical 80%', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="unsafeDriving" stroke="#ef4444" name="Unsafe Driving" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hoursOfService" stroke="#f59e0b" name="Hours of Service" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="vehicleMaintenance" stroke="#3b82f6" name="Vehicle Maintenance" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="controlledSubstances" stroke="#8b5cf6" name="Controlled Substances" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="driverFitness" stroke="#10b981" name="Driver Fitness" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="crashIndicator" stroke="#ec4899" name="Crash Indicator" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Improvement Summary */}
            {timeDecay.insights?.improvements && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Projected Improvements (24 months)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {Object.entries(timeDecay.insights.improvements).map(([key, data]) => (
                    <div key={key} className="text-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                      <p className={`text-sm font-bold ${data.change < 0 ? 'text-emerald-600 dark:text-emerald-400' : data.change > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {data.change < 0 ? '' : data.change > 0 ? '+' : ''}{data.change?.toFixed(0) || 0}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projection Empty State */}
      {!timeDecay?.projections && !loading && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 text-center">
          <FiClock className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <p className="font-medium text-zinc-700 dark:text-zinc-300">No Score Projections Available</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Projections will appear once violation data is synced from FMCSA.
          </p>
        </div>
      )}

      {/* Data Points Info */}
      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Showing {history.length} data point{history.length !== 1 ? 's' : ''} over the last {dateRange} days
      </div>
    </div>
  );
};

export default CSATrends;
