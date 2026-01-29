import { useState } from 'react';
import { dashboardAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiAlertTriangle, FiRefreshCw, FiDatabase, FiActivity, FiTruck } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const DataAuditTab = () => {
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.runFullAudit();
      setAuditResult(response.data);
      if (response.data.overallHealth) {
        toast.success('Audit complete - All data is healthy!');
      } else {
        toast.error('Audit found issues that need attention');
      }
    } catch (error) {
      toast.error('Failed to run audit');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }) => {
    if (status === true || status === 'success') {
      return <FiCheck className="w-5 h-5 text-green-500" />;
    }
    if (status === false || status === 'error') {
      return <FiX className="w-5 h-5 text-red-500" />;
    }
    return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Data Audit</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Verify data integrity and accuracy across your system
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={loading}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running Audit...' : 'Run Full Audit'}
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-zinc-600 dark:text-zinc-300">Running comprehensive data audit...</span>
        </div>
      )}

      {auditResult && !loading && (
        <div className="space-y-6">
          {/* Overall Health */}
          <div className={`p-4 rounded-lg border-2 ${
            auditResult.overallHealth
              ? 'bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/50'
              : 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/50'
          }`}>
            <div className="flex items-center gap-3">
              <StatusIcon status={auditResult.overallHealth} />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {auditResult.overallHealth ? 'All Systems Healthy' : 'Issues Detected'}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Audit completed at {new Date(auditResult.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* FMCSA Audit */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <FiTruck className="w-5 h-5 text-accent-500" />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">FMCSA Data Accuracy</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Comparing stored data with live SaferWebAPI
                </p>
              </div>
              <StatusIcon status={auditResult.audits?.fmcsa?.match} />
            </div>
            <div className="card-body">
              {auditResult.audits?.fmcsa?.status === 'error' ? (
                <div className="text-red-600 dark:text-red-400">
                  {auditResult.audits.fmcsa.message}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Hours Since Sync</p>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {auditResult.audits?.fmcsa?.hoursSinceSync?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Data Match</p>
                      <p className={`text-lg font-semibold ${
                        auditResult.audits?.fmcsa?.match
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {auditResult.audits?.fmcsa?.match ? 'Matched' : 'Differences Found'}
                      </p>
                    </div>
                  </div>

                  {auditResult.audits?.fmcsa?.differences?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Differences:</h4>
                      <div className="space-y-2">
                        {auditResult.audits.fmcsa.differences.map((diff, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded">
                            <FiAlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              <strong>{diff.field}:</strong> Stored: {diff.stored ?? 'null'}, Live: {diff.live ?? 'null'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Internal Consistency */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <FiDatabase className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Internal Consistency</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Checking for orphaned records and data integrity
                </p>
              </div>
              <StatusIcon status={auditResult.audits?.consistency?.healthy} />
            </div>
            <div className="card-body">
              {/* Record Counts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.consistency?.counts?.activeDrivers || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Active Drivers</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.consistency?.counts?.activeVehicles || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Active Vehicles</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.consistency?.counts?.documents || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Documents</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.consistency?.counts?.openViolations || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Open Violations</p>
                </div>
              </div>

              {/* Issues */}
              {auditResult.audits?.consistency?.issues?.length > 0 ? (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Issues Found ({auditResult.audits.consistency.issues.length}):
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {auditResult.audits.consistency.issues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 bg-red-50 dark:bg-red-500/10 rounded">
                        <FiX className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-zinc-700 dark:text-zinc-300">
                          <strong>{issue.type}:</strong> {issue.issue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <FiCheck className="w-4 h-4" />
                  <span>No orphaned records found</span>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <FiActivity className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Dashboard Stats Verification</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Verified counts from database
                </p>
              </div>
              <StatusIcon status={auditResult.audits?.dashboard?.healthy} />
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.dashboard?.actual?.activeDrivers || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Active Drivers</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.dashboard?.actual?.activeVehicles || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Active Vehicles</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.dashboard?.actual?.totalDocuments || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Documents</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {auditResult.audits?.dashboard?.actual?.openViolations || 0}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Open Violations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!auditResult && !loading && (
        <div className="text-center py-12">
          <FiDatabase className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No Audit Run Yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Click "Run Full Audit" to verify your data integrity
          </p>
        </div>
      )}
    </div>
  );
};

export default DataAuditTab;
