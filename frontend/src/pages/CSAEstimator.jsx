import { useState, useEffect } from 'react';
import { csaAPI } from '../utils/api';
import {
  FiShield, FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiTrendingDown,
  FiRefreshCw, FiInfo, FiChevronRight, FiActivity, FiTarget
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const CSAEstimator = () => {
  const [scores, setScores] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBasic, setSelectedBasic] = useState(null);

  // What-if calculator state
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [whatIfData, setWhatIfData] = useState({
    basic: 'vehicle_maintenance',
    severityWeight: 5,
    outOfService: false
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [projecting, setProjecting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scoresRes, summaryRes] = await Promise.all([
        csaAPI.getCurrent(),
        csaAPI.getSummary()
      ]);

      setScores(scoresRes.data.basics);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load CSA scores');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectImpact = async () => {
    setProjecting(true);
    try {
      const response = await csaAPI.projectImpact(whatIfData);
      setWhatIfResult(response.data);
    } catch (err) {
    } finally {
      setProjecting(false);
    }
  };

  const getScoreColor = (percentile, threshold) => {
    if (percentile >= 80) return 'text-danger-600 dark:text-danger-400';
    if (percentile >= threshold) return 'text-warning-600 dark:text-warning-400';
    return 'text-success-600 dark:text-success-400';
  };

  const getScoreBgColor = (percentile, threshold) => {
    if (percentile >= 80) return 'bg-danger-100 dark:bg-danger-500/20';
    if (percentile >= threshold) return 'bg-warning-100 dark:bg-warning-500/20';
    return 'bg-success-100 dark:bg-success-500/20';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical':
        return <span className="px-2 py-1 text-xs font-semibold bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400 rounded-full">Critical</span>;
      case 'alert':
        return <span className="px-2 py-1 text-xs font-semibold bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-400 rounded-full">Alert</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400 rounded-full">OK</span>;
    }
  };

  const basicDescriptions = {
    unsafe_driving: 'Speeding, reckless driving, improper lane changes, inattention',
    hours_of_service: 'HOS violations, log falsification, driving beyond limits',
    vehicle_maintenance: 'Brake defects, lighting, tires, load securement issues',
    controlled_substances: 'Drug/alcohol violations, positive tests, refusals',
    driver_fitness: 'CDL issues, medical certification, training deficiencies',
    crash_indicator: 'DOT-recordable crash history and patterns'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading CSA scores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-500/20 flex items-center justify-center mb-4">
          <FiAlertCircle className="w-8 h-8 text-danger-500 dark:text-danger-400" />
        </div>
        <p className="text-danger-600 dark:text-danger-400 font-medium mb-2">{error}</p>
        <button onClick={fetchData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">CSA Score Estimator</h1>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">
            Estimate your SMS BASIC percentiles based on recorded violations
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setWhatIfOpen(!whatIfOpen)}
            className={`btn ${whatIfOpen ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FiTarget className="w-4 h-4" />
            What-If Calculator
          </button>
          <button onClick={fetchData} className="btn btn-secondary">
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div
        className="bg-info-50 dark:bg-info-500/20 border border-info-200 dark:border-info-500/30 rounded-xl p-4 flex items-start gap-3"
      >
        <FiInfo className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">These are ESTIMATED scores</p>
          <p className="text-xs text-info-700 dark:text-info-400 mt-1">
            Actual SMS percentiles require peer group comparisons using national data from FMCSA.
            These estimates are based on your recorded violations and standard severity weights.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-danger-100 dark:bg-danger-500/20 flex items-center justify-center">
              <FiAlertCircle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Critical BASICs</span>
          </div>
          <p className="text-3xl font-bold text-danger-600 dark:text-danger-400">{summary?.criticalCount || 0}</p>
        </div>

        <div
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Alert BASICs</span>
          </div>
          <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">{summary?.alertCount || 0}</p>
        </div>

        <div
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">OK BASICs</span>
          </div>
          <p className="text-3xl font-bold text-success-600 dark:text-success-400">{summary?.okCount || 0}</p>
        </div>

        <div
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
              <FiActivity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Avg Percentile</span>
          </div>
          <p className="text-3xl font-bold text-zinc-700 dark:text-zinc-200">{summary?.averagePercentile || 0}%</p>
        </div>
      </div>

      {/* What-If Calculator (collapsible) */}
      {whatIfOpen && (
        <div
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div
            className="px-5 py-4 border-b border-accent-100 dark:border-zinc-700 dark:bg-zinc-800/50"
            style={{ background: 'linear-gradient(to bottom, #fff7ed, #ffedd5)' }}
          >
            <div className="flex items-center gap-3">
              <FiTarget className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">What-If Calculator</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Project how a new violation would impact your scores</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">BASIC Category</label>
                <select
                  value={whatIfData.basic}
                  onChange={(e) => setWhatIfData({ ...whatIfData, basic: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="unsafe_driving">Unsafe Driving</option>
                  <option value="hours_of_service">Hours of Service</option>
                  <option value="vehicle_maintenance">Vehicle Maintenance</option>
                  <option value="controlled_substances">Controlled Substances</option>
                  <option value="driver_fitness">Driver Fitness</option>
                  <option value="crash_indicator">Crash Indicator</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Severity Weight</label>
                <select
                  value={whatIfData.severityWeight}
                  onChange={(e) => setWhatIfData({ ...whatIfData, severityWeight: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="1">1 - Minor</option>
                  <option value="3">3 - Low</option>
                  <option value="5">5 - Medium</option>
                  <option value="7">7 - High</option>
                  <option value="10">10 - Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Out of Service?</label>
                <select
                  value={whatIfData.outOfService ? 'yes' : 'no'}
                  onChange={(e) => setWhatIfData({ ...whatIfData, outOfService: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleProjectImpact}
                  disabled={projecting}
                  className="btn btn-accent w-full"
                >
                  {projecting ? <LoadingSpinner size="sm" /> : <FiTrendingDown className="w-4 h-4" />}
                  Project Impact
                </button>
              </div>
            </div>

            {/* What-If Results */}
            {whatIfResult && (
              <div className="mt-4 p-4 bg-primary-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Projected Impact: {whatIfResult.impact.basicName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white dark:bg-zinc-900 rounded-lg">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">Before</p>
                    <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">{whatIfResult.impact.before.estimatedPercentile}%</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{whatIfResult.impact.before.rawPoints} pts</p>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-zinc-900 rounded-lg flex flex-col items-center justify-center">
                    <FiChevronRight className="w-6 h-6 text-accent-500 dark:text-accent-400" />
                    <p className={`text-sm font-bold ${whatIfResult.impact.change.percentileChange > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>
                      {whatIfResult.impact.change.percentileChange > 0 ? '+' : ''}{whatIfResult.impact.change.percentileChange}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-zinc-900 rounded-lg">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">After</p>
                    <p className={`text-2xl font-bold ${
                      whatIfResult.impact.exceedsCriticalThreshold ? 'text-danger-600 dark:text-danger-400' :
                      whatIfResult.impact.exceedsAlertThreshold ? 'text-warning-600 dark:text-warning-400' :
                      'text-success-600 dark:text-success-400'
                    }`}>
                      {whatIfResult.impact.after.estimatedPercentile}%
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{whatIfResult.impact.after.rawPoints} pts</p>
                  </div>
                </div>
                {whatIfResult.impact.exceedsAlertThreshold && whatIfResult.impact.previouslyUnderThreshold && (
                  <div className="mt-3 p-2 bg-warning-100 dark:bg-warning-500/20 rounded text-center">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      This would push you over the alert threshold!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BASIC Score Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scores && Object.entries(scores).map(([key, basic]) => (
          <div
            key={key}
            className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden cursor-pointer transition-all hover:shadow-card ${
              selectedBasic === key ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
            onClick={() => setSelectedBasic(selectedBasic === key ? null : key)}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{basic.name}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{basicDescriptions[key]}</p>
                </div>
                {getStatusBadge(basic.status)}
              </div>

              {/* Score Gauge */}
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getScoreBgColor(basic.estimatedPercentile, basic.threshold)}`}>
                  <span className={`text-2xl font-bold ${getScoreColor(basic.estimatedPercentile, basic.threshold)}`}>
                    {basic.estimatedPercentile}%
                  </span>
                </div>
                <div className="flex-1">
                  {/* Progress bar */}
                  <div className="h-3 bg-primary-100 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${
                        basic.status === 'critical' ? 'bg-danger-500' :
                        basic.status === 'alert' ? 'bg-warning-500' :
                        'bg-success-500'
                      }`}
                      style={{ width: `${Math.min(basic.estimatedPercentile, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300">
                    <span>0%</span>
                    <span className="text-warning-600 dark:text-warning-400">Alert: {basic.threshold}%</span>
                    <span className="text-danger-600 dark:text-danger-400">Critical: {basic.criticalThreshold}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                <div className="text-center">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">Raw Points</p>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{basic.rawPoints}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">Violations</p>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{basic.violationCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">OOS Count</p>
                  <p className="text-sm font-semibold text-danger-600 dark:text-danger-400">{basic.oosCount}</p>
                </div>
              </div>

              {/* Expanded violation details */}
              {selectedBasic === key && basic.violations?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Recent Violations</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {basic.violations.map((v, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 bg-primary-50 dark:bg-zinc-800 rounded">
                        <div>
                          <span className="font-mono font-medium text-zinc-700 dark:text-zinc-200">{v.code}</span>
                          {v.isOOS && <span className="ml-2 px-1 py-0.5 bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400 rounded text-[10px]">OOS</span>}
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-700 dark:text-zinc-300">{v.weightedPoints} pts</span>
                          <span className="text-zinc-600 dark:text-zinc-300 ml-2">(x{v.timeWeight})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CSAEstimator;
