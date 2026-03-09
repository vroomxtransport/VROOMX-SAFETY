import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { driversAPI, vehiclesAPI, alertsAPI, complianceScoreAPI } from '../utils/api';
import { daysUntilExpiry, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FiActivity, FiSearch, FiUsers, FiTruck, FiAlertTriangle, FiCheckCircle,
  FiAlertOctagon, FiRefreshCw, FiAlertCircle, FiInfo, FiX, FiClock,
  FiChevronUp, FiChevronDown, FiUser, FiFileText, FiDroplet, FiShield,
  FiExternalLink, FiEye, FiEyeOff, FiTrendingUp, FiTrendingDown,
  FiList, FiGrid, FiBell
} from 'react-icons/fi';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// --- Fleet status helpers (from original FleetPulse) ---

const getDriverStatus = (driver) => {
  const cdlDays = daysUntilExpiry(driver.cdl?.expiryDate);
  const medDays = daysUntilExpiry(driver.medicalCard?.expiryDate);
  if ((cdlDays !== null && cdlDays < 0) || (medDays !== null && medDays < 0)) return 'critical';
  if ((cdlDays !== null && cdlDays <= 30) || (medDays !== null && medDays <= 30)) return 'warning';
  return 'compliant';
};

const getVehicleStatus = (vehicle) => {
  const inspDays = daysUntilExpiry(vehicle.annualInspection?.expiryDate || vehicle.annualInspectionExpiry);
  const regDays = daysUntilExpiry(vehicle.registration?.expiryDate || vehicle.registrationExpiry);
  if ((inspDays !== null && inspDays < 0) || (regDays !== null && regDays < 0)) return 'critical';
  if ((inspDays !== null && inspDays <= 30) || (regDays !== null && regDays <= 30)) return 'warning';
  return 'compliant';
};

const formatExpiryLabel = (date, validLabel, expiredLabel) => {
  const days = daysUntilExpiry(date);
  if (days === null) return 'No data';
  if (days < 0) return expiredLabel || 'EXPIRED';
  if (days <= 30) return `${days}d left`;
  return validLabel || 'Valid';
};

const statusDotClass = {
  compliant: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
};

const statusBorderClass = {
  compliant: 'border-green-200 dark:border-green-800/40',
  warning: 'border-yellow-200 dark:border-yellow-800/40',
  critical: 'border-red-200 dark:border-red-800/40',
};

// --- Alert helpers (from AlertsDashboard) ---

const getCategoryIcon = (category) => {
  switch (category) {
    case 'driver': return FiUser;
    case 'vehicle': return FiTruck;
    case 'document': return FiFileText;
    case 'drug_alcohol': return FiDroplet;
    case 'violation': return FiAlertTriangle;
    case 'basics': return FiShield;
    case 'csa_score': return FiTrendingDown;
    default: return FiInfo;
  }
};

const getEntityLink = (alert) => {
  switch (alert.entityType) {
    case 'Driver': return `/app/drivers/${alert.entityId}`;
    case 'Vehicle': return `/app/vehicles/${alert.entityId}`;
    case 'Violation': return `/app/compliance?id=${alert.entityId}`;
    case 'Document': return `/app/documents?id=${alert.entityId}`;
    default: return null;
  }
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreRingColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  return 'Needs Attention';
};

// --- Main Component ---

const FleetPulse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'grid' ? 'grid' : 'alerts';

  // Shared state
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState({ critical: [], warning: [], info: [] });
  const [complianceScore, setComplianceScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // View state
  const [activeView, setActiveView] = useState(initialView);
  const [search, setSearch] = useState('');

  // Alerts view state
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissModal, setDismissModal] = useState({ open: false, alert: null });
  const [dismissReason, setDismissReason] = useState('');
  const [dismissingId, setDismissingId] = useState(null);

  // Fleet view state
  const [fleetFilter, setFleetFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');

  // Sync view param to URL
  const switchView = useCallback((view) => {
    setActiveView(view);
    setSearchParams({ view }, { replace: true });
    setSearch('');
  }, [setSearchParams]);

  // Unified data fetch
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [driversRes, vehiclesRes, alertsRes, scoreRes] = await Promise.all([
        driversAPI.getAll({ limit: 500 }),
        vehiclesAPI.getAll({ limit: 500 }),
        alertsAPI.getGrouped().catch(() => ({ data: { grouped: { critical: [], warning: [], info: [] } } })),
        complianceScoreAPI.get().catch(() => null),
      ]);

      setDrivers(driversRes.data?.drivers || driversRes.data || []);
      setVehicles(vehiclesRes.data?.vehicles || vehiclesRes.data || []);
      setAlerts(alertsRes.data?.grouped || { critical: [], warning: [], info: [] });
      setComplianceScore(scoreRes?.data || null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch fleet pulse data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refresh All: generate alerts then re-fetch
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await alertsAPI.generate();
      await fetchData(true);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Dismiss alert
  const handleDismiss = async () => {
    if (!dismissModal.alert) return;
    setDismissingId(dismissModal.alert._id);
    try {
      await alertsAPI.dismiss(dismissModal.alert._id, dismissReason);
      setDismissModal({ open: false, alert: null });
      setDismissReason('');
      await fetchData(true);
    } catch (err) {
      console.error('Dismiss failed:', err);
    } finally {
      setDismissingId(null);
    }
  };

  // Alert count by entity for fleet card badges
  const alertCountByEntity = useMemo(() => {
    const map = {};
    [...alerts.critical, ...alerts.warning, ...alerts.info].forEach((a) => {
      if (a.entityId) {
        map[a.entityId] = (map[a.entityId] || 0) + 1;
      }
    });
    return map;
  }, [alerts]);

  // Filtered alerts for alerts view
  const filteredAlerts = useMemo(() => {
    const filterByCategory = (list) => {
      let filtered = categoryFilter === 'all' ? list : list.filter(a => a.category === categoryFilter);
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(a => a.title?.toLowerCase().includes(q) || a.message?.toLowerCase().includes(q));
      }
      return filtered;
    };
    return {
      critical: filterByCategory(alerts.critical),
      warning: filterByCategory(alerts.warning),
      info: filterByCategory(alerts.info),
    };
  }, [alerts, categoryFilter, search]);

  // Fleet items for grid view
  const fleetItems = useMemo(() => {
    const driverItems = drivers.map((d) => ({
      type: 'driver',
      id: d._id,
      name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown Driver',
      status: getDriverStatus(d),
      cdlLabel: formatExpiryLabel(d.cdl?.expiryDate, 'Valid', 'EXPIRED'),
      medLabel: formatExpiryLabel(d.medicalCard?.expiryDate, 'Valid', 'EXPIRED'),
      dqfCount: d.documents?.length || d.dqfDocumentCount || 0,
      alertCount: alertCountByEntity[d._id] || 0,
      raw: d,
    }));

    const vehicleItems = vehicles.map((v) => ({
      type: 'vehicle',
      id: v._id,
      name: v.unitNumber || v.vin || 'Unknown Vehicle',
      status: getVehicleStatus(v),
      inspLabel: formatExpiryLabel(v.annualInspection?.expiryDate || v.annualInspectionExpiry, 'Current', 'OVERDUE'),
      regLabel: formatExpiryLabel(v.registration?.expiryDate || v.registrationExpiry, 'Current', 'EXPIRED'),
      alertCount: alertCountByEntity[v._id] || 0,
      raw: v,
    }));

    let combined = [];
    if (fleetFilter === 'all') combined = [...driverItems, ...vehicleItems];
    else if (fleetFilter === 'drivers') combined = driverItems;
    else combined = vehicleItems;

    if (search.trim()) {
      const q = search.toLowerCase();
      combined = combined.filter((item) => item.name.toLowerCase().includes(q));
    }

    const statusPriority = { critical: 0, warning: 1, compliant: 2 };
    if (sortBy === 'status' || sortBy === 'urgency') {
      combined.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
    } else if (sortBy === 'name') {
      combined.sort((a, b) => a.name.localeCompare(b.name));
    }

    return combined;
  }, [drivers, vehicles, fleetFilter, search, sortBy, alertCountByEntity]);

  // Fleet summary stats
  const fleetStats = useMemo(() => {
    const all = [...drivers.map(getDriverStatus), ...vehicles.map(getVehicleStatus)];
    return {
      total: all.length,
      compliant: all.filter((s) => s === 'compliant').length,
      warning: all.filter((s) => s === 'warning').length,
      critical: all.filter((s) => s === 'critical').length,
    };
  }, [drivers, vehicles]);

  const score = complianceScore?.score?.overall || complianceScore?.score?.overallScore || 0;
  const totalAlerts = alerts.critical.length + alerts.warning.length + alerts.info.length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading Fleet Pulse...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiActivity className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fleet Pulse</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Real-time compliance command center
              {lastRefreshed && (
                <span className="ml-2 text-xs">
                  &middot; Updated {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showDismissed
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {showDismissed ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{showDismissed ? 'Showing Dismissed' : 'Show Dismissed'}</span>
          </button>
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh All</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {/* Compliance Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="6" fill="none" />
              <circle cx="32" cy="32" r="26" stroke={score ? getScoreRingColor(score) : '#9ca3af'} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${(score / 100) * 163.4} 163.4`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-lg font-bold ${score ? getScoreColor(score) : 'text-gray-400'}`}>{score || '--'}</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
            <p className={`text-sm font-semibold ${score ? getScoreColor(score) : 'text-gray-400'}`}>{score ? getScoreLabel(score) : 'N/A'}</p>
          </div>
        </div>

        {/* Critical Alerts */}
        <button
          onClick={() => { switchView('alerts'); setCategoryFilter('all'); }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800/40 p-4 text-left hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{alerts.critical.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </button>

        {/* Warning Alerts */}
        <button
          onClick={() => { switchView('alerts'); setCategoryFilter('all'); }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-800/40 p-4 text-left hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Warning</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{alerts.warning.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </button>

        {/* Info Alerts */}
        <button
          onClick={() => { switchView('alerts'); setCategoryFilter('all'); }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800/40 p-4 text-left hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Info</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{alerts.info.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </button>

        {/* Fleet Health */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Fleet Health</p>
          <div className="flex items-center gap-3 text-sm font-semibold mb-2">
            <span className="text-green-600 dark:text-green-400">{fleetStats.compliant}</span>
            <span className="text-yellow-600 dark:text-yellow-400">{fleetStats.warning}</span>
            <span className="text-red-600 dark:text-red-400">{fleetStats.critical}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            {fleetStats.total > 0 && (
              <>
                <div className="h-full bg-green-500 transition-all" style={{ width: `${(fleetStats.compliant / fleetStats.total) * 100}%` }} />
                <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(fleetStats.warning / fleetStats.total) * 100}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${(fleetStats.critical / fleetStats.total) * 100}%` }} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle + Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => switchView('alerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === 'alerts'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiList className="w-3.5 h-3.5" />
            Alerts
            {totalAlerts > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full">
                {totalAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => switchView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === 'grid'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiGrid className="w-3.5 h-3.5" />
            Fleet
          </button>
        </div>

        {/* Contextual Filters */}
        {activeView === 'alerts' ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'driver', 'vehicle', 'document', 'violation', 'drug_alcohol', 'basics', 'csa_score'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {cat === 'all' ? 'All' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'drivers', label: 'Drivers', icon: FiUsers },
                { key: 'vehicles', label: 'Vehicles', icon: FiTruck },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFleetFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    fleetFilter === key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="status">Sort: Status</option>
              <option value="name">Sort: Name</option>
              <option value="urgency">Sort: Urgency</option>
            </select>
          </>
        )}

        {/* Search */}
        <div className="relative flex-1 max-w-sm sm:ml-auto">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeView === 'alerts' ? 'Search alerts...' : 'Search by name or unit #...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content Area */}
      {activeView === 'alerts' ? (
        <AlertsContent
          alerts={filteredAlerts}
          getCategoryIcon={getCategoryIcon}
          getEntityLink={getEntityLink}
          onDismiss={(alert) => { setDismissModal({ open: true, alert }); setDismissReason(''); }}
          dismissingId={dismissingId}
        />
      ) : (
        <FleetGridContent items={fleetItems} drivers={drivers} vehicles={vehicles} search={search} />
      )}

      {/* Dismiss Modal */}
      {dismissModal.open && (
        <DismissModal
          alert={dismissModal.alert}
          reason={dismissReason}
          setReason={setDismissReason}
          dismissingId={dismissingId}
          onDismiss={handleDismiss}
          onClose={() => setDismissModal({ open: false, alert: null })}
        />
      )}
    </div>
  );
};

// --- Alerts View ---

const AlertsContent = ({ alerts, getCategoryIcon, getEntityLink, onDismiss, dismissingId }) => {
  const total = alerts.critical.length + alerts.warning.length + alerts.info.length;

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All Clear!</h3>
        <p className="text-gray-500 dark:text-gray-400">No active alerts at this time. Your fleet is running smoothly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertSection
        title="Critical"
        alerts={alerts.critical}
        type="critical"
        icon={FiAlertCircle}
        borderColor="border-red-200 dark:border-red-800/40"
        headerBg="bg-red-50 dark:bg-red-900/20"
        iconColor="text-red-600 dark:text-red-400"
        getCategoryIcon={getCategoryIcon}
        getEntityLink={getEntityLink}
        onDismiss={onDismiss}
        dismissingId={dismissingId}
      />
      <AlertSection
        title="Warning"
        alerts={alerts.warning}
        type="warning"
        icon={FiAlertTriangle}
        borderColor="border-yellow-200 dark:border-yellow-800/40"
        headerBg="bg-yellow-50 dark:bg-yellow-900/20"
        iconColor="text-yellow-600 dark:text-yellow-400"
        getCategoryIcon={getCategoryIcon}
        getEntityLink={getEntityLink}
        onDismiss={onDismiss}
        dismissingId={dismissingId}
      />
      <AlertSection
        title="Info"
        alerts={alerts.info}
        type="info"
        icon={FiInfo}
        borderColor="border-blue-200 dark:border-blue-800/40"
        headerBg="bg-blue-50 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
        getCategoryIcon={getCategoryIcon}
        getEntityLink={getEntityLink}
        onDismiss={onDismiss}
        dismissingId={dismissingId}
      />
    </div>
  );
};

const AlertSection = ({ title, alerts, type, icon: Icon, borderColor, headerBg, iconColor, getCategoryIcon, getEntityLink, onDismiss, dismissingId }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${headerBg}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-white/80 dark:bg-gray-800 dark:text-gray-200 rounded-full">
            {alerts.length}
          </span>
        </div>
        {expanded ? <FiChevronUp className="w-4 h-4 text-gray-500" /> : <FiChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <FiCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No {title.toLowerCase()} alerts</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const CategoryIcon = getCategoryIcon(alert.category);
              const entityLink = getEntityLink(alert);
              const isImprovement = alert.category === 'csa_score' && alert.metadata?.trigger;

              return (
                <div
                  key={alert._id}
                  className={`group bg-white dark:bg-gray-800 rounded-lg border p-3 hover:shadow-md transition-all ${
                    isImprovement
                      ? 'border-green-300 dark:border-green-700 border-l-4 border-l-green-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isImprovement ? 'bg-green-100 dark:bg-green-500/20' :
                      type === 'critical' ? 'bg-red-100 dark:bg-red-500/20' :
                      type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-500/20' :
                      'bg-blue-100 dark:bg-blue-500/20'
                    }`}>
                      <CategoryIcon className={`w-4 h-4 ${
                        isImprovement ? 'text-green-600 dark:text-green-400' :
                        type === 'critical' ? 'text-red-600 dark:text-red-400' :
                        type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                          {alert.title}
                        </p>
                        {isImprovement && (
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded flex-shrink-0">
                            IMPROVED
                          </span>
                        )}
                        {!isImprovement && alert.escalationLevel > 0 && (
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded flex-shrink-0">
                            L{alert.escalationLevel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatDate(alert.createdAt)}
                        </span>

                        <div className="flex items-center gap-1">
                          {entityLink && (
                            <Link
                              to={entityLink}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="View details"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <button
                            onClick={() => onDismiss(alert)}
                            disabled={dismissingId === alert._id}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded"
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

// --- Fleet Grid View ---

const FleetGridContent = ({ items, drivers, vehicles, search }) => {
  const isEmpty = drivers.length === 0 && vehicles.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FiActivity className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No fleet data yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Add drivers and vehicles to see your real-time compliance status here.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FiSearch className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No results</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No matches for &ldquo;{search}&rdquo;. Try a different search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) =>
        item.type === 'driver' ? (
          <DriverCard key={`d-${item.id}`} item={item} />
        ) : (
          <VehicleCard key={`v-${item.id}`} item={item} />
        )
      )}
    </div>
  );
};

// --- Card Components ---

const DriverCard = ({ item }) => {
  const statusLabel = item.status === 'critical' ? 'CRITICAL' : item.status === 'warning' ? 'WARNING' : 'OK';

  return (
    <Link
      to={`/app/drivers/${item.id}`}
      className={`block bg-white dark:bg-gray-800 rounded-xl border-2 ${statusBorderClass[item.status]} p-4 hover:shadow-md dark:hover:shadow-gray-900/30 transition-all group relative`}
    >
      {item.alertCount > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
          <FiBell className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiUsers className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Driver</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass[item.status]} ${item.status === 'critical' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-semibold ${
            item.status === 'critical' ? 'text-red-600 dark:text-red-400' :
            item.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
        {item.name}
      </h3>

      <div className="space-y-2 text-sm">
        <DetailRow label="CDL" value={item.cdlLabel} />
        <DetailRow label="Medical Card" value={item.medLabel} />
        <DetailRow label="DQF" value={`${item.dqfCount}/16 docs`} />
      </div>
    </Link>
  );
};

const VehicleCard = ({ item }) => {
  const statusLabel = item.status === 'critical' ? 'CRITICAL' : item.status === 'warning' ? 'WARNING' : 'OK';

  return (
    <Link
      to={`/app/vehicles/${item.id}`}
      className={`block bg-white dark:bg-gray-800 rounded-xl border-2 ${statusBorderClass[item.status]} p-4 hover:shadow-md dark:hover:shadow-gray-900/30 transition-all group relative`}
    >
      {item.alertCount > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
          <FiBell className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiTruck className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Vehicle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass[item.status]} ${item.status === 'critical' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-semibold ${
            item.status === 'critical' ? 'text-red-600 dark:text-red-400' :
            item.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
        {item.name}
      </h3>

      <div className="space-y-2 text-sm">
        <DetailRow label="Inspection" value={item.inspLabel} />
        <DetailRow label="Registration" value={item.regLabel} />
      </div>
    </Link>
  );
};

const DetailRow = ({ label, value }) => {
  const isExpired = value === 'EXPIRED' || value === 'OVERDUE';
  const isWarning = value?.includes('d left');

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium ${
        isExpired ? 'text-red-600 dark:text-red-400' :
        isWarning ? 'text-yellow-600 dark:text-yellow-400' :
        'text-gray-700 dark:text-gray-300'
      }`}>
        {value}
      </span>
    </div>
  );
};

// --- Dismiss Modal ---

const DismissModal = ({ alert, reason, setReason, dismissingId, onDismiss, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dismiss Alert</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{alert?.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert?.message}</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reason for dismissal (optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Enter reason for dismissing this alert..."
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDismiss}
          disabled={dismissingId === alert?._id}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
        >
          {dismissingId === alert?._id ? 'Dismissing...' : 'Dismiss Alert'}
        </button>
      </div>
    </div>
  </div>
);

export default FleetPulse;
