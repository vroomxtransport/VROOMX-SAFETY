import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AdminAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPlatformAlerts();
      setAlerts(response.data.alerts || []);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
        };
    }
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <FiAlertCircle className="w-6 h-6" />;
      case 'warning':
        return <FiAlertTriangle className="w-6 h-6" />;
      default:
        return <FiInfo className="w-6 h-6" />;
    }
  };

  const handleAlertClick = (alert) => {
    if (alert.link) {
      navigate(alert.link);
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Platform Alerts</h1>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
            </div>
            <FiAlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Warnings</p>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{warningCount}</p>
            </div>
            <FiAlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Info</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{infoCount}</p>
            </div>
            <FiInfo className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-green-800 dark:text-green-300">All Clear</h3>
          <p className="text-green-600 dark:text-green-400 mt-1">No platform alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            return (
              <div
                key={alert.id}
                className={`${styles.bg} ${styles.border} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => handleAlertClick(alert)}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${styles.icon}`}>
                    {getIcon(alert.severity)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-zinc-900 dark:text-white">
                        {alert.message}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badge} capitalize`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="capitalize">{alert.type.replace(/_/g, ' ')}</span>
                      {alert.count > 1 && (
                        <span className="ml-2 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full text-xs">
                          {alert.count} items
                        </span>
                      )}
                      {alert.link && (
                        <span className="ml-auto flex items-center text-blue-600 dark:text-blue-400">
                          View details <FiExternalLink className="w-3 h-3 ml-1" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;
