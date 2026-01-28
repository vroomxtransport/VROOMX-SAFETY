import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiAlertCircle, FiAlertTriangle, FiInfo, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { adminAPI } from '../../utils/api';

const DataIntegrityCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getDataIntegrity();
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

  const getHealthColor = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBg = (score) => {
    if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getHealthLabel = (score) => {
    if (score >= 90) return 'Healthy';
    if (score >= 70) return 'Needs Attention';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <FiShield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Data Integrity</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <FiRefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <FiShield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Data Integrity</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { healthScore, summary } = data || {};

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <FiShield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Data Integrity</h3>
        </div>
        <button
          onClick={fetchData}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          title="Refresh"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Health Score Circle */}
      <div className="flex flex-col items-center mb-6">
        <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center ${getHealthBg(healthScore)}`}>
          <span className={`text-3xl font-bold ${getHealthColor(healthScore)}`}>
            {healthScore}
          </span>
        </div>
        <span className={`mt-2 text-sm font-medium ${getHealthColor(healthScore)}`}>
          {getHealthLabel(healthScore)}
        </span>
      </div>

      {/* Issue Counts */}
      <div className="flex justify-center gap-4 mb-4">
        {summary?.critical > 0 && (
          <div className="flex items-center gap-1.5 text-red-500">
            <FiAlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{summary.critical} Critical</span>
          </div>
        )}
        {summary?.warning > 0 && (
          <div className="flex items-center gap-1.5 text-yellow-500">
            <FiAlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{summary.warning} Warning</span>
          </div>
        )}
        {summary?.info > 0 && (
          <div className="flex items-center gap-1.5 text-blue-500">
            <FiInfo className="w-4 h-4" />
            <span className="text-sm font-medium">{summary.info} Info</span>
          </div>
        )}
        {summary?.total === 0 && (
          <div className="text-emerald-500 text-sm font-medium">
            No issues detected
          </div>
        )}
      </div>

      {/* Last Checked */}
      <div className="text-center text-xs text-zinc-400 mb-4">
        Last checked: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Never'}
      </div>

      {/* View Details Link */}
      <Link
        to="/admin/data-integrity"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
      >
        View Details
        <FiArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default DataIntegrityCard;
