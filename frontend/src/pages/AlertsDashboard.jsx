import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { alertsAPI, complianceScoreAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import {
  FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle, FiX,
  FiClock, FiRefreshCw, FiFilter, FiChevronUp, FiChevronDown,
  FiUser, FiTruck, FiFileText, FiDroplet, FiShield, FiActivity,
  FiExternalLink, FiEye, FiEyeOff, FiTrendingUp
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const AlertsDashboard = () => {
  const [alerts, setAlerts] = useState({ critical: [], warning: [], info: [] });
  const [complianceScore, setComplianceScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissingId, setDismissingId] = useState(null);
  const [dismissModal, setDismissModal] = useState({ open: false, alert: null });
  const [dismissReason, setDismissReason] = useState('');
  const [showDismissed, setShowDismissed] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [showDismissed, categoryFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, scoreRes] = await Promise.all([
        alertsAPI.getGrouped(),
        complianceScoreAPI.get()
      ]);

      setAlerts(alertsRes.data.grouped || { critical: [], warning: [], info: [] });
      setComplianceScore(scoreRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await alertsAPI.generate();
      await fetchData();
    } catch (err) {
      console.error('Failed to refresh alerts:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismiss = async () => {
    if (!dismissModal.alert) return;

    setDismissingId(dismissModal.alert._id);
    try {
      await alertsAPI.dismiss(dismissModal.alert._id, dismissReason);
      setDismissModal({ open: false, alert: null });
      setDismissReason('');
      await fetchData();
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    } finally {
      setDismissingId(null);
    }
  };

  const openDismissModal = (alert) => {
    setDismissModal({ open: true, alert });
    setDismissReason('');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'driver': return FiUser;
      case 'vehicle': return FiTruck;
      case 'document': return FiFileText;
      case 'drug_alcohol': return FiDroplet;
      case 'violation': return FiAlertTriangle;
      case 'basics': return FiShield;
      default: return FiInfo;
    }
  };

  const getEntityLink = (alert) => {
    switch (alert.entityType) {
      case 'Driver': return `/drivers/${alert.entityId}`;
      case 'Vehicle': return `/vehicles/${alert.entityId}`;
      case 'Violation': return `/violations?id=${alert.entityId}`;
      case 'Document': return `/documents?id=${alert.entityId}`;
      default: return null;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success-600';
    if (score >= 60) return 'text-warning-600';
    return 'text-danger-600';
  };

  const getScoreRingColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const filterAlertsByCategory = (alertList) => {
    if (categoryFilter === 'all') return alertList;
    return alertList.filter(a => a.category === categoryFilter);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-primary-500">Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mb-4">
          <FiAlertCircle className="w-8 h-8 text-danger-500" />
        </div>
        <p className="text-danger-600 font-medium mb-2">{error}</p>
        <button onClick={fetchData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const totalAlerts = alerts.critical.length + alerts.warning.length + alerts.info.length;
  const score = complianceScore?.score?.overall || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Alerts Dashboard</h1>
          <p className="text-primary-500 text-sm mt-1">
            Monitor compliance alerts and track your safety score
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className={`btn ${showDismissed ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showDismissed ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
            {showDismissed ? 'Showing Dismissed' : 'Show Dismissed'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-primary"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Alerts
          </button>
        </div>
      </div>

      {/* Compliance Score & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* VroomX Score Card */}
        <div
          className="lg:col-span-1 bg-white rounded-xl border border-primary-200/60 p-5"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">VroomX Score</h3>
              <p className="text-xs text-primary-500">Compliance Rating</p>
            </div>
          </div>

          {/* Score Circle */}
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={getScoreRingColor(score)}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 352} 352`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-xs text-primary-500">/ 100</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className={`text-sm font-medium ${getScoreColor(score)}`}>
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention'}
            </p>
            {complianceScore?.score?.lastCalculated && (
              <p className="text-xs text-primary-400 mt-1">
                Updated {formatDate(complianceScore.score.lastCalculated)}
              </p>
            )}
          </div>
        </div>

        {/* Alert Count Cards */}
        <div
          className="bg-white rounded-xl border border-danger-200/60 p-5 hover:shadow-card transition-shadow"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-500">Critical</p>
              <p className="text-3xl font-bold text-danger-600">{alerts.critical.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
          <p className="text-xs text-danger-600 mt-2">Requires immediate action</p>
        </div>

        <div
          className="bg-white rounded-xl border border-warning-200/60 p-5 hover:shadow-card transition-shadow"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-500">Warning</p>
              <p className="text-3xl font-bold text-warning-600">{alerts.warning.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
          </div>
          <p className="text-xs text-warning-600 mt-2">Needs attention soon</p>
        </div>

        <div
          className="bg-white rounded-xl border border-info-200/60 p-5 hover:shadow-card transition-shadow"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-500">Info</p>
              <p className="text-3xl font-bold text-info-600">{alerts.info.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info-100 flex items-center justify-center">
              <FiInfo className="w-6 h-6 text-info-600" />
            </div>
          </div>
          <p className="text-xs text-info-600 mt-2">For your awareness</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-primary-600 mr-2">
          <FiFilter className="inline w-4 h-4 mr-1" />
          Filter:
        </span>
        {['all', 'driver', 'vehicle', 'document', 'violation', 'drug_alcohol', 'basics'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              categoryFilter === cat
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-primary-600 border-primary-200 hover:border-primary-400'
            }`}
          >
            {cat === 'all' ? 'All' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Alert Columns */}
      {totalAlerts === 0 ? (
        <div
          className="bg-white rounded-xl border border-primary-200/60 p-12 text-center"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <h3 className="text-lg font-semibold text-primary-900 mb-2">All Clear!</h3>
          <p className="text-primary-500">No active alerts at this time. Your fleet is running smoothly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Alerts Column */}
          <AlertColumn
            title="Critical"
            alerts={filterAlertsByCategory(alerts.critical)}
            type="critical"
            bgColor="bg-danger-50/30"
            borderColor="border-danger-200/60"
            headerBg="bg-danger-100"
            icon={FiAlertCircle}
            iconColor="text-danger-600"
            getCategoryIcon={getCategoryIcon}
            getEntityLink={getEntityLink}
            onDismiss={openDismissModal}
            dismissingId={dismissingId}
          />

          {/* Warning Alerts Column */}
          <AlertColumn
            title="Warning"
            alerts={filterAlertsByCategory(alerts.warning)}
            type="warning"
            bgColor="bg-warning-50/30"
            borderColor="border-warning-200/60"
            headerBg="bg-warning-100"
            icon={FiAlertTriangle}
            iconColor="text-warning-600"
            getCategoryIcon={getCategoryIcon}
            getEntityLink={getEntityLink}
            onDismiss={openDismissModal}
            dismissingId={dismissingId}
          />

          {/* Info Alerts Column */}
          <AlertColumn
            title="Info"
            alerts={filterAlertsByCategory(alerts.info)}
            type="info"
            bgColor="bg-info-50/30"
            borderColor="border-info-200/60"
            headerBg="bg-info-100"
            icon={FiInfo}
            iconColor="text-info-600"
            getCategoryIcon={getCategoryIcon}
            getEntityLink={getEntityLink}
            onDismiss={openDismissModal}
            dismissingId={dismissingId}
          />
        </div>
      )}

      {/* Dismiss Modal */}
      {dismissModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl max-w-md w-full p-6"
            style={{ boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-900">Dismiss Alert</h3>
              <button
                onClick={() => setDismissModal({ open: false, alert: null })}
                className="text-primary-400 hover:text-primary-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-primary-50 border border-primary-200">
              <p className="text-sm font-medium text-primary-800">{dismissModal.alert?.title}</p>
              <p className="text-xs text-primary-600 mt-1">{dismissModal.alert?.message}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Reason for dismissal (optional)
              </label>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Enter reason for dismissing this alert..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDismissModal({ open: false, alert: null })}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDismiss}
                disabled={dismissingId === dismissModal.alert?._id}
                className="btn btn-danger flex-1"
              >
                {dismissingId === dismissModal.alert?._id ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Dismissing...
                  </>
                ) : (
                  'Dismiss Alert'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Alert Column Component
const AlertColumn = ({
  title,
  alerts,
  type,
  bgColor,
  borderColor,
  headerBg,
  icon: Icon,
  iconColor,
  getCategoryIcon,
  getEntityLink,
  onDismiss,
  dismissingId
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`rounded-xl border ${borderColor} overflow-hidden ${bgColor}`}
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
    >
      {/* Column Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${headerBg}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className="font-semibold text-primary-900">{title}</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-white/80 rounded-full">
            {alerts.length}
          </span>
        </div>
        {expanded ? (
          <FiChevronUp className="w-4 h-4 text-primary-500" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-primary-500" />
        )}
      </button>

      {/* Alerts List */}
      {expanded && (
        <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <FiCheckCircle className="w-8 h-8 text-success-400 mx-auto mb-2" />
              <p className="text-sm text-primary-500">No {title.toLowerCase()} alerts</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const CategoryIcon = getCategoryIcon(alert.category);
              const entityLink = getEntityLink(alert);

              return (
                <div
                  key={alert._id}
                  className="bg-white rounded-lg border border-primary-200/60 p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      type === 'critical' ? 'bg-danger-100' :
                      type === 'warning' ? 'bg-warning-100' :
                      'bg-info-100'
                    }`}>
                      <CategoryIcon className={`w-4 h-4 ${
                        type === 'critical' ? 'text-danger-600' :
                        type === 'warning' ? 'text-warning-600' :
                        'text-info-600'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-primary-800 leading-snug">
                          {alert.title}
                        </p>
                        {alert.escalationLevel > 0 && (
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-danger-100 text-danger-700 rounded">
                            L{alert.escalationLevel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-primary-600 mt-1 line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-primary-400 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatDate(alert.createdAt)}
                        </span>

                        <div className="flex items-center gap-1">
                          {entityLink && (
                            <Link
                              to={entityLink}
                              className="p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded"
                              title="View details"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <button
                            onClick={() => onDismiss(alert)}
                            disabled={dismissingId === alert._id}
                            className="p-1 text-primary-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                            title="Dismiss"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsDashboard;
