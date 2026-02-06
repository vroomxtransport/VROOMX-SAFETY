import { useState, useEffect, useRef } from 'react';
import { dashboardAPI, fmcsaAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { FiEdit2, FiCheck, FiAlertTriangle, FiAlertCircle, FiBarChart2, FiTarget, FiTrendingUp, FiRefreshCw, FiFileText, FiClipboard } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import TabNav from '../components/TabNav';
import CSAEstimatorContent from '../components/CSAEstimatorContent';
import CSATrends from '../components/CSATrends';
import InspectionsTabContent from '../components/fmcsa/InspectionsTabContent';
import { formatDate } from '../utils/helpers';

const Compliance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [auditReadiness, setAuditReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [basicsForm, setBasicsForm] = useState({
    unsafeDriving: '',
    hoursOfService: '',
    vehicleMaintenance: '',
    controlledSubstances: '',
    driverFitness: '',
    crashIndicator: ''
  });

  // FMCSA Inspection state
  const [inspectionData, setInspectionData] = useState(null);
  const [inspectionSummary, setInspectionSummary] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const autoSyncTriggered = useRef(false);

  const tabs = [
    { key: 'overview', label: 'SMS BASICs', icon: FiBarChart2 },
    { key: 'inspections', label: 'Inspection Records', icon: FiClipboard },
    { key: 'summary', label: 'FMCSA Summary', icon: FiFileText },
    { key: 'trends', label: 'Trends', icon: FiTrendingUp },
    { key: 'estimator', label: 'Estimator', icon: FiTarget, badge: 'BETA' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, auditRes] = await Promise.all([
        dashboardAPI.get(),
        dashboardAPI.getAuditReadiness()
      ]);
      setDashboard(dashboardRes.data.dashboard);
      setAuditReadiness(auditRes.data.auditReadiness);

      // Pre-fill form with current values
      if (dashboardRes.data.dashboard?.smsBasics) {
        const basics = dashboardRes.data.dashboard.smsBasics;
        setBasicsForm({
          unsafeDriving: basics.unsafeDriving?.percentile || '',
          hoursOfService: basics.hoursOfService?.percentile || '',
          vehicleMaintenance: basics.vehicleMaintenance?.percentile || '',
          controlledSubstances: basics.controlledSubstances?.percentile || '',
          driverFitness: basics.driverFitness?.percentile || '',
          crashIndicator: basics.crashIndicator?.percentile || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasics = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await dashboardAPI.updateBasics({
        unsafeDriving: basicsForm.unsafeDriving ? parseInt(basicsForm.unsafeDriving) : null,
        hoursOfService: basicsForm.hoursOfService ? parseInt(basicsForm.hoursOfService) : null,
        vehicleMaintenance: basicsForm.vehicleMaintenance ? parseInt(basicsForm.vehicleMaintenance) : null,
        controlledSubstances: basicsForm.controlledSubstances ? parseInt(basicsForm.controlledSubstances) : null,
        driverFitness: basicsForm.driverFitness ? parseInt(basicsForm.driverFitness) : null,
        crashIndicator: basicsForm.crashIndicator ? parseInt(basicsForm.crashIndicator) : null
      });
      toast.success('BASICs updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update BASICs');
    } finally {
      setUpdating(false);
    }
  };

  // Fetch FMCSA inspections when tab changes
  useEffect(() => {
    if (activeTab === 'inspections') {
      fetchInspections();
    }
  }, [activeTab]);

  // Auto-refresh FMCSA data if stale (> 6 hours old) or missing
  useEffect(() => {
    if (
      activeTab === 'inspections' &&
      !syncing &&
      !autoSyncTriggered.current &&
      syncStatus !== null
    ) {
      const shouldAutoSync = !syncStatus.lastSync || !inspectionData;

      // Also auto-sync if data is older than 6 hours
      if (!shouldAutoSync && syncStatus.lastSync) {
        const hoursSinceSync = (Date.now() - new Date(syncStatus.lastSync).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync > 6) {
          console.log(`[Auto-Sync] Data is ${hoursSinceSync.toFixed(1)} hours old, triggering auto-refresh`);
          autoSyncTriggered.current = true;
          handleSyncViolations();
          return;
        }
      }

      if (shouldAutoSync) {
        console.log('[Auto-Sync] No data found, triggering auto-refresh');
        autoSyncTriggered.current = true;
        handleSyncViolations();
      }
    }
  }, [activeTab, syncStatus, inspectionData, syncing]);

  const fetchInspections = async () => {
    setInspectionsLoading(true);
    try {
      const [inspRes, summaryRes, statusRes] = await Promise.all([
        fmcsaAPI.getInspections({ limit: 50 }),
        fmcsaAPI.getSummary(),
        fmcsaAPI.getSyncStatus()
      ]);
      // New format: inspections is now summary data from SaferWebAPI
      setInspectionData(inspRes.data.inspections || null);
      setInspectionSummary(summaryRes.data);
      setSyncStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
    } finally {
      setInspectionsLoading(false);
    }
  };

  const handleSyncViolations = async () => {
    setSyncing(true);
    try {
      const result = await fmcsaAPI.syncViolations();
      if (result.data.success) {
        toast.success(`Synced ${result.data.imported} new inspections from FMCSA`);
        fetchInspections();
      } else {
        toast.error(result.data.message || 'Sync failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync with FMCSA');
    } finally {
      setSyncing(false);
    }
  };

  const getBasicLabel = (basic) => {
    const labels = {
      unsafe_driving: 'Unsafe Driving',
      hours_of_service: 'Hours of Service',
      vehicle_maintenance: 'Vehicle Maintenance',
      controlled_substances: 'Controlled Substances',
      driver_fitness: 'Driver Fitness',
      crash_indicator: 'Crash Indicator',
      hazmat: 'Hazmat'
    };
    return labels[basic] || basic;
  };

  const getBasicColor = (basic) => {
    const colors = {
      unsafe_driving: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      hours_of_service: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
      vehicle_maintenance: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      controlled_substances: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
      driver_fitness: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
      crash_indicator: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
      hazmat: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
    };
    return colors[basic] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const basicsData = dashboard?.smsBasics ? Object.entries(dashboard.smsBasics)
    .filter(([key]) => key !== '_meta') // Exclude metadata
    .map(([key, value]) => ({
      name: value?.name,
      percentile: value?.percentile || 0,
      threshold: value?.threshold,
      status: value?.status,
      key
    })) : [];

  const getBarColor = (status) => {
    switch (status) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'compliant': return '#28a745';
      default: return '#6c757d';
    }
  };

  const driverPieData = [
    { name: 'Compliant', value: dashboard?.drivers?.compliant || 0, color: '#28a745' },
    { name: 'Warning', value: dashboard?.drivers?.warning || 0, color: '#ffc107' },
    { name: 'Non-Compliant', value: dashboard?.drivers?.nonCompliant || 0, color: '#dc3545' }
  ].filter(d => d.value > 0);

  // Helper to show time since last sync
  const getTimeSinceSync = () => {
    if (!syncStatus?.lastSync) return null;
    const hours = (Date.now() - new Date(syncStatus.lastSync).getTime()) / (1000 * 60 * 60);
    if (hours < 1) return 'less than 1 hour ago';
    if (hours < 24) return `${Math.floor(hours)} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const isDataStale = syncStatus?.lastSync &&
    (Date.now() - new Date(syncStatus.lastSync).getTime()) > 6 * 60 * 60 * 1000;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">FMCSA Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-300">SMS BASICs, inspections, and violation tracking</p>
        </div>
        {activeTab === 'overview' && (
          <button
            onClick={() => setShowEditModal(true)}
            className="btn btn-primary flex items-center"
          >
            <FiEdit2 className="w-4 h-4 mr-2" />
            Update BASICs
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'trends' ? (
        <CSATrends />
      ) : activeTab === 'inspections' ? (
        /* Inspection Records Tab - Detailed records from DataHub */
        <InspectionsTabContent />
      ) : activeTab === 'summary' ? (
        /* FMCSA Summary Tab - Summary Cards from SaferWebAPI */
        <div className="space-y-4">
          {/* Sync Header */}
          <div className="card">
            <div className="card-body flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">FMCSA Inspection Summary</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {syncStatus?.lastSync ? (
                    <>
                      Last synced: {getTimeSinceSync()} • {inspectionData?.totalInspections || 0} inspections
                      {isDataStale && (
                        <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                          (auto-refreshing...)
                        </span>
                      )}
                    </>
                  ) : (
                    <>Click "Sync from FMCSA" to fetch your inspection data</>
                  )}
                </p>
              </div>
              <button
                onClick={handleSyncViolations}
                disabled={syncing}
                className="btn btn-primary flex items-center gap-2"
              >
                <FiRefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from FMCSA'}
              </button>
            </div>
          </div>

          {/* Inspection Summary Cards */}
          {inspectionsLoading ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner size="lg" />
            </div>
          ) : !inspectionData ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <FiFileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No Inspection Data</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                  Sync with FMCSA to fetch your inspection summary
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{inspectionData.totalInspections || 0}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Inspections</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Past 24 months</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{inspectionData.vehicleInspections || 0}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Vehicle Inspections</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{inspectionData.driverInspections || 0}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Driver Inspections</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{inspectionData.hazmatInspections || 0}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Hazmat Inspections</p>
                  </div>
                </div>
              </div>

              {/* OOS Rates Comparison */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Out-of-Service Rates</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Compared to national average</p>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vehicle OOS */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Vehicle OOS Rate</span>
                        <span className={`text-lg font-bold ${
                          (inspectionData.vehicleOOSPercent || 0) > (inspectionData.vehicleNationalAvg || 20)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {inspectionData.vehicleOOSPercent?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="relative h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                            (inspectionData.vehicleOOSPercent || 0) > (inspectionData.vehicleNationalAvg || 20)
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(inspectionData.vehicleOOSPercent || 0, 100)}%` }}
                        />
                        {/* National avg marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-zinc-800 dark:bg-white"
                          style={{ left: `${Math.min(inspectionData.vehicleNationalAvg || 20, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{inspectionData.vehicleOOS || 0} out of service</span>
                        <span>National avg: {inspectionData.vehicleNationalAvg?.toFixed(1) || '20.7'}%</span>
                      </div>
                    </div>

                    {/* Driver OOS */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Driver OOS Rate</span>
                        <span className={`text-lg font-bold ${
                          (inspectionData.driverOOSPercent || 0) > (inspectionData.driverNationalAvg || 5.5)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {inspectionData.driverOOSPercent?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="relative h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                            (inspectionData.driverOOSPercent || 0) > (inspectionData.driverNationalAvg || 5.5)
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((inspectionData.driverOOSPercent || 0) * 3, 100)}%` }}
                        />
                        {/* National avg marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-zinc-800 dark:bg-white"
                          style={{ left: `${Math.min((inspectionData.driverNationalAvg || 5.5) * 3, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{inspectionData.driverOOS || 0} out of service</span>
                        <span>National avg: {inspectionData.driverNationalAvg?.toFixed(1) || '5.5'}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crash Summary */}
              {inspectionData.crashes && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Crash History</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Reportable crashes in past 24 months</p>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-center">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{inspectionData.crashes.total || 0}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Crashes</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{inspectionData.crashes.fatal || 0}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Fatal</p>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-center">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{inspectionData.crashes.injury || 0}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Injury</p>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-center">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inspectionData.crashes.tow || 0}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tow-Away</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Source Note */}
              <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                Data sourced from FMCSA SAFER system via SaferWebAPI
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'overview' ? (
        <>
      {/* BASICs Overview */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">SMS BASICs Overview</h2>
            {/* Data Source Badge */}
            {dashboard?.smsBasics?._meta?.isEstimate === false ? (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                FMCSA Data
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
                Estimated
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
            {dashboard?.smsBasics?._meta?.lastUpdated ? (
              <>Data synced {Math.floor(dashboard.smsBasics._meta.daysSinceUpdate)} days ago from FMCSA SAFER</>
            ) : (
              <>Estimated scores based on recorded violations. For official data, sync with FMCSA or enter manually.</>
            )}
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Bar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
                <BarChart data={basicsData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value}% (Threshold: ${props.payload.threshold}%)`,
                      'Percentile'
                    ]}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="percentile" radius={[0, 4, 4, 0]}>
                    {basicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* BASIC Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {basicsData.map((basic) => (
                <div
                  key={basic.key}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                    basic.status === 'critical' ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 hover:border-red-400 dark:hover:border-red-500/70' :
                    basic.status === 'warning' ? 'border-yellow-300 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10 hover:border-yellow-400 dark:hover:border-yellow-500/70' :
                    basic.status === 'compliant' ? 'border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-500/10 hover:border-green-400 dark:hover:border-green-500/70' :
                    'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{basic.name}</p>
                  <div className="flex items-end justify-between mt-2">
                    <span className={`text-xl sm:text-2xl font-bold ${
                      basic.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                      basic.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      basic.status === 'compliant' ? 'text-green-600 dark:text-green-400' :
                      'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {basic.percentile || '--'}%
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">
                      Threshold: {basic.threshold}%
                    </span>
                  </div>
                  {basic.status === 'critical' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Over Critical Threshold</p>
                  )}
                  {basic.status === 'warning' && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Over Intervention Threshold</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Driver & Vehicle Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Driver Compliance */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Driver Qualification Status</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={driverPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {driverPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-sm text-zinc-600 dark:text-zinc-300 mt-2">
              Total: {dashboard?.drivers?.active || 0} active drivers
            </div>
          </div>
        </div>

        {/* Audit Readiness */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Audit Readiness</h3>
            {auditReadiness?.overallReadiness ? (
              <span className="badge badge-success">Ready</span>
            ) : (
              <span className="badge badge-warning">Needs Attention</span>
            )}
          </div>
          <div className="card-body space-y-4">
            {/* DQF Files */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:pl-4 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200">
              <div className="flex items-center space-x-3">
                {auditReadiness?.dqFiles?.compliant ? (
                  <FiCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                ) : (
                  <FiAlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                )}
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Driver Qualification Files</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {auditReadiness?.dqFiles?.driversWithIssues || 0} of {auditReadiness?.dqFiles?.totalDrivers || 0} with issues
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Records */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:pl-4 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200">
              <div className="flex items-center space-x-3">
                {auditReadiness?.vehicleRecords?.compliant ? (
                  <FiCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                ) : (
                  <FiAlertCircle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Vehicle Records</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {auditReadiness?.vehicleRecords?.vehiclesWithIssues || 0} of {auditReadiness?.vehicleRecords?.totalVehicles || 0} need attention
                  </p>
                </div>
              </div>
            </div>

            {/* Drug & Alcohol */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:pl-4 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200">
              <div className="flex items-center space-x-3">
                {auditReadiness?.drugAlcohol?.compliant ? (
                  <FiCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                ) : (
                  <FiAlertTriangle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Drug & Alcohol Program</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {auditReadiness?.drugAlcohol?.randomTestsCompleted || 0} of {auditReadiness?.drugAlcohol?.randomTestsRequired || 0} random tests completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Reference */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-zinc-900 dark:text-white">BASIC Threshold Reference</h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>BASIC Category</th>
                  <th>Intervention Threshold</th>
                  <th>Regulations</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Unsafe Driving</td>
                  <td>65%</td>
                  <td>49 CFR 392</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Operation of CMVs in dangerous manner</td>
                </tr>
                <tr>
                  <td className="font-medium">HOS Compliance</td>
                  <td>65%</td>
                  <td>49 CFR 395</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Hours of service violations</td>
                </tr>
                <tr>
                  <td className="font-medium">Vehicle Maintenance</td>
                  <td>80%</td>
                  <td>49 CFR 393, 396</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Failure to maintain CMVs properly</td>
                </tr>
                <tr>
                  <td className="font-medium">Controlled Substances</td>
                  <td>80%</td>
                  <td>49 CFR 382</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Impairment due to drugs/alcohol</td>
                </tr>
                <tr>
                  <td className="font-medium">Driver Fitness</td>
                  <td>80%</td>
                  <td>49 CFR 391</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Unfit drivers operating CMVs</td>
                </tr>
                <tr>
                  <td className="font-medium">Crash Indicator</td>
                  <td>65%</td>
                  <td>-</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">History of crash involvement</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

        </>
      ) : (
        <CSAEstimatorContent />
      )}

      {/* Edit BASICs Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Update SMS BASICs"
      >
        <form onSubmit={handleUpdateBasics} className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
            Enter your current BASIC percentiles from the FMCSA SMS system.
            Leave blank if no data available.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({
              unsafeDriving: 'Unsafe Driving',
              hoursOfService: 'HOS Compliance',
              vehicleMaintenance: 'Vehicle Maintenance',
              controlledSubstances: 'Controlled Substances',
              driverFitness: 'Driver Fitness',
              crashIndicator: 'Crash Indicator'
            }).map(([key, label]) => (
              <div key={key}>
                <label className="form-label">{label} (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="0-100"
                  value={basicsForm[key]}
                  onChange={(e) => setBasicsForm({ ...basicsForm, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updating}>
              {updating ? <LoadingSpinner size="sm" /> : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Compliance;
