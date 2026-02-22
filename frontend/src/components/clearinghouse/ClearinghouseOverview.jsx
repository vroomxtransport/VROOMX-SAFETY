import { useState, useEffect } from 'react';
import { clearinghouseAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiCheckCircle, FiAlertTriangle, FiClock, FiRefreshCw,
  FiShield, FiArrowRight, FiUsers
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const ClearinghouseOverview = ({ onTabChange }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await clearinghouseAPI.getDashboard();
      setDashboard(res.data.dashboard);
    } catch (err) {
      toast.error('Failed to load clearinghouse dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
        Unable to load dashboard data.
      </div>
    );
  }

  const needsAttention = dashboard.queriesDue + dashboard.queriesOverdue + dashboard.queriesMissing;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Queries Current */}
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                {dashboard.queriesCurrent}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Queries Current</p>
            </div>
          </div>
        </div>

        {/* Queries Due / Overdue */}
        <button
          onClick={() => onTabChange('queries')}
          className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
              dashboard.queriesOverdue > 0
                ? 'bg-red-100 dark:bg-red-500/20'
                : needsAttention > 0
                  ? 'bg-amber-100 dark:bg-amber-500/20'
                  : 'bg-green-100 dark:bg-green-500/20'
            }`}>
              {dashboard.queriesOverdue > 0 ? (
                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <FiClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <p className={`text-xl sm:text-2xl font-bold font-mono ${
                dashboard.queriesOverdue > 0
                  ? 'text-red-600 dark:text-red-400'
                  : needsAttention > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
              }`}>
                {needsAttention}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Need Attention</p>
            </div>
          </div>
          {needsAttention > 0 && (
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              {dashboard.queriesOverdue > 0 && <span className="text-red-500">{dashboard.queriesOverdue} overdue</span>}
              {dashboard.queriesOverdue > 0 && dashboard.queriesDue > 0 && <span> &bull; </span>}
              {dashboard.queriesDue > 0 && <span className="text-amber-500">{dashboard.queriesDue} due</span>}
              {(dashboard.queriesOverdue > 0 || dashboard.queriesDue > 0) && dashboard.queriesMissing > 0 && <span> &bull; </span>}
              {dashboard.queriesMissing > 0 && <span>{dashboard.queriesMissing} missing</span>}
            </div>
          )}
        </button>

        {/* Violations Pending Report */}
        <button
          onClick={() => onTabChange('violations')}
          className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
              dashboard.violationsPendingReport > 0
                ? 'bg-red-100 dark:bg-red-500/20'
                : 'bg-green-100 dark:bg-green-500/20'
            }`}>
              <FiAlertTriangle className={`w-5 h-5 ${
                dashboard.violationsPendingReport > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
            <div>
              <p className={`text-xl sm:text-2xl font-bold font-mono ${
                dashboard.violationsPendingReport > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {dashboard.violationsPendingReport}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Violations Pending</p>
            </div>
          </div>
        </button>

        {/* RTD In Progress */}
        <button
          onClick={() => onTabChange('rtd')}
          className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiRefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                {dashboard.rtdInProgress}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">RTD In Progress</p>
            </div>
          </div>
        </button>
      </div>

      {/* Compliance Rate Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiShield className="w-5 h-5 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Clearinghouse Compliance Rate</h3>
          </div>
          <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
            {dashboard.complianceRate}%
          </span>
        </div>
        <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              dashboard.complianceRate >= 90 ? 'bg-green-500' :
              dashboard.complianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${dashboard.complianceRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{dashboard.queriesCurrent} of {dashboard.totalActiveDrivers} drivers with current queries</span>
          <span>{dashboard.queriesThisYear} queries this year</span>
        </div>
      </div>

      {/* Recent Queries */}
      {dashboard.recentQueries?.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Recent Queries</h3>
            <button
              onClick={() => onTabChange('queries')}
              className="text-sm text-accent-600 dark:text-accent-400 hover:underline flex items-center gap-1"
            >
              View all <FiArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {dashboard.recentQueries.map(q => (
              <div key={q._id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    {q.driverId?.firstName?.[0]}{q.driverId?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {q.driverId?.firstName} {q.driverId?.lastName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {q.queryType === 'full' ? 'Full Query' : 'Limited Query'} &bull; {q.queryPurpose?.replace('_', '-')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    q.result === 'clear'
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : q.result === 'violation_found'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }`}>
                    {q.result === 'clear' ? 'Clear' : q.result === 'violation_found' ? 'Violation' : 'Pending'}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">{formatDate(q.queryDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dashboard.totalActiveDrivers === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-8 text-center">
          <FiUsers className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No Active Drivers</h3>
          <p className="text-zinc-500 dark:text-zinc-400">
            Add CDL drivers to your roster to begin tracking Clearinghouse compliance.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClearinghouseOverview;
