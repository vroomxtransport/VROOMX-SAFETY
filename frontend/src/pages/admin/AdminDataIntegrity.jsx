import { useState, useEffect } from 'react';
import {
  FiShield, FiRefreshCw, FiAlertCircle, FiAlertTriangle, FiInfo,
  FiDatabase, FiUsers, FiTruck, FiFileText, FiChevronDown, FiChevronUp,
  FiCheckCircle, FiClock
} from 'react-icons/fi';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDataIntegrity = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getDataIntegrityFull();
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check data integrity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getHealthColor = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBg = (score) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthLabel = (score) => {
    if (score >= 90) return 'Healthy';
    if (score >= 70) return 'Needs Attention';
    return 'Critical Issues';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <FiInfo className="w-5 h-5 text-blue-500" />;
      default: return <FiCheckCircle className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getResourceIcon = (resource) => {
    switch (resource) {
      case 'Driver': return <FiUsers className="w-4 h-4" />;
      case 'Vehicle': return <FiTruck className="w-4 h-4" />;
      case 'Document': return <FiFileText className="w-4 h-4" />;
      default: return <FiDatabase className="w-4 h-4" />;
    }
  };

  const checkLabels = {
    orphanedRecords: 'Orphaned Records',
    missingFields: 'Missing Required Fields',
    invalidReferences: 'Invalid References',
    staleness: 'Data Staleness',
    duplicates: 'Potential Duplicates',
    futureDates: 'Invalid Future Dates'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Failed to Load</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { healthScore, summary, issues, timestamp, duration, totalRecordsChecked } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Integrity Monitor</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Monitor data quality and identify issues across all records</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Check
        </button>
      </div>

      {/* Health Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Score Card */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-zinc-200 dark:text-zinc-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                className={getHealthBg(healthScore)}
                strokeDasharray={`${(healthScore / 100) * 352} 352`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getHealthColor(healthScore)}`}>{healthScore}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">/ 100</span>
            </div>
          </div>
          <span className={`text-lg font-semibold ${getHealthColor(healthScore)}`}>
            {getHealthLabel(healthScore)}
          </span>
        </div>

        {/* Summary Stats */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Critical</span>
            </div>
            <span className="text-2xl font-bold text-red-500">{summary?.critical || 0}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Warnings</span>
            </div>
            <span className="text-2xl font-bold text-yellow-500">{summary?.warning || 0}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiInfo className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Info</span>
            </div>
            <span className="text-2xl font-bold text-blue-500">{summary?.info || 0}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiDatabase className="w-5 h-5 text-zinc-400" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Records</span>
            </div>
            <span className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{totalRecordsChecked?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Check Metadata */}
      <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <FiClock className="w-4 h-4" />
          <span>Last checked: {timestamp ? new Date(timestamp).toLocaleString() : 'Never'}</span>
        </div>
        {duration && (
          <div className="flex items-center gap-1.5">
            <span>Duration: {duration}ms</span>
          </div>
        )}
      </div>

      {/* Issue Categories */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Issue Categories</h2>

        {issues && Object.entries(issues).map(([key, check]) => (
          <div
            key={key}
            className={`rounded-xl border ${getSeverityBg(check.severity)} overflow-hidden`}
          >
            <button
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getSeverityIcon(check.severity)}
                <div className="text-left">
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {checkLabels[key] || key}
                  </span>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{check.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                  check.total === 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : check.severity === 'critical'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : check.severity === 'warning'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {check.total === 0 ? 'No Issues' : `${check.total} issue${check.total !== 1 ? 's' : ''}`}
                </span>
                {check.details?.length > 0 && (
                  expandedSections[key] ? <FiChevronUp className="w-5 h-5 text-zinc-400" /> : <FiChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedSections[key] && check.details?.length > 0 && (
              <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 bg-white/50 dark:bg-zinc-900/50">
                <div className="space-y-3">
                  {check.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        {getResourceIcon(detail.resource)}
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {detail.resource}
                          </span>
                          {detail.field && (
                            <span className="text-zinc-500 dark:text-zinc-400 ml-1.5">
                              - {detail.field}
                            </span>
                          )}
                          {detail.reference && (
                            <span className="text-zinc-500 dark:text-zinc-400 ml-1.5">
                              - {detail.reference}
                            </span>
                          )}
                          {detail.threshold && (
                            <span className="text-zinc-500 dark:text-zinc-400 ml-1.5">
                              (not updated in {detail.threshold})
                            </span>
                          )}
                          {detail.criteria && (
                            <span className="text-zinc-500 dark:text-zinc-400 ml-1.5">
                              ({detail.criteria})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {detail.count} record{detail.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* All Clear Message */}
      {summary?.total === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center">
          <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            All Systems Healthy
          </h3>
          <p className="text-emerald-600 dark:text-emerald-500">
            No data integrity issues detected across {totalRecordsChecked?.toLocaleString() || 0} records.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDataIntegrity;
