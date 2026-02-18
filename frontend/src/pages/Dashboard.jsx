import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dashboardAPI, csaAPI, fmcsaInspectionsAPI, driversAPI, fmcsaAPI, complianceScoreAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FiUsers, FiTruck, FiAlertTriangle, FiClock,
  FiCheckCircle, FiAlertCircle, FiFileText, FiShield,
  FiMessageCircle, FiArrowRight, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus,
  FiGift, FiBarChart2
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [recentInspections, setRecentInspections] = useState([]);
  const [topRiskDrivers, setTopRiskDrivers] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [importProgress, setImportProgress] = useState(null);

  useEffect(() => {
    fetchDashboard();

    // Re-fetch on company switch
    const handleCompanySwitch = () => fetchDashboard();
    window.addEventListener('companySwitch', handleCompanySwitch);
    return () => {
      window.removeEventListener('companySwitch', handleCompanySwitch);
    };
  }, []);

  // Poll sync status for new companies (never synced)
  useEffect(() => {
    if (!syncStatus?.lastSync && syncStatus !== null) {
      const pollInterval = setInterval(async () => {
        try {
          const res = await fmcsaAPI.getInspectionSummary();
          if (res.data?.syncStatus) {
            setImportProgress(res.data.syncStatus);
            if (res.data.syncStatus.csaScoresSynced || res.data.syncStatus.violationsSynced || res.data.syncStatus.inspectionsSynced) {
              fetchDashboard();
            }
            if (res.data.syncStatus.complianceScoreCalculated) {
              clearInterval(pollInterval);
              fetchDashboard();
            }
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [syncStatus]);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, trendRes, complianceRes, historyRes, benchmarkRes, inspectionsRes, riskDriversRes, syncStatusRes] = await Promise.all([
        dashboardAPI.get(),
        csaAPI.getTrendSummary(30).catch(() => null),
        complianceScoreAPI.get().catch(() => null),
        complianceScoreAPI.getHistory(30).catch(() => null),
        csaAPI.getBenchmark().catch(() => null),
        fmcsaInspectionsAPI.getRecent(5).catch(() => null),
        driversAPI.getRiskRanking(5).catch(() => null),
        fmcsaAPI.getSyncStatus().catch(() => null)
      ]);
      setData(dashboardRes.data.dashboard);
      if (trendRes?.data) {
        setTrendData(trendRes.data);
      }
      if (complianceRes?.data?.score) {
        setComplianceData(complianceRes.data.score);
      }
      if (historyRes?.data?.history) {
        setComplianceHistory(historyRes.data.history);
      }
      if (benchmarkRes?.data?.benchmark) {
        setBenchmarkData(benchmarkRes.data.benchmark);
      }
      if (inspectionsRes?.data?.inspections) {
        setRecentInspections(inspectionsRes.data.inspections);
      }
      if (riskDriversRes?.data?.drivers) {
        setTopRiskDrivers(riskDriversRes.data.drivers);
      }
      if (syncStatusRes?.data) {
        setSyncStatus(syncStatusRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual FMCSA sync (full orchestrator sync)
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const response = await fmcsaAPI.syncViolations(true);
      const result = response.data;

      // Refresh sync status
      const statusRes = await fmcsaAPI.getSyncStatus();
      if (statusRes?.data) {
        setSyncStatus(statusRes.data);
      }

      // Show appropriate toast based on sync result
      if (result.success) {
        const scoreMsg = result.complianceScore !== null ? ` Score: ${result.complianceScore}` : '';
        toast.success(`Full FMCSA sync completed.${scoreMsg}`);
      } else {
        const errorCount = result.errors?.length || 0;
        toast.success(`Sync completed with ${errorCount} issue(s) - partial data updated`);
      }

      // Refresh dashboard to show updated score and violation data
      await fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync FMCSA data');
    } finally {
      setSyncing(false);
    }
  };

  // Get compliance score from API data (real calculation from backend)
  const complianceScore = complianceData?.overallScore || 0;

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  // Get score status label
  const getScoreStatus = (score) => {
    if (score >= 80) return { label: 'Good Standing', bgClass: 'bg-green-100 dark:bg-green-500/20', textClass: 'text-green-700 dark:text-green-400', borderClass: 'border-green-200 dark:border-green-500/30' };
    if (score >= 60) return { label: 'Needs Attention', bgClass: 'bg-yellow-100 dark:bg-yellow-500/20', textClass: 'text-yellow-700 dark:text-yellow-400', borderClass: 'border-yellow-200 dark:border-yellow-500/30' };
    return { label: 'At Risk', bgClass: 'bg-red-100 dark:bg-red-500/20', textClass: 'text-red-700 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-500/30' };
  };

  // Calculate gauge stroke dasharray
  const maxArc = 212; // 75% of full circle circumference
  const scoreArc = (complianceScore / 100) * maxArc;

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Get score factors from API data (real calculation from backend)
  const getScoreFactors = () => {
    if (complianceData?.components) {
      const { documentStatus, violations, drugAlcohol, dqfCompleteness, vehicleInspection } = complianceData.components;
      return [
        { label: 'DQF Files', value: dqfCompleteness?.score || 0 },
        { label: 'Documents', value: documentStatus?.score || 0 },
        { label: 'Violations', value: violations?.score || 0 },
        { label: 'D&A Testing', value: drugAlcohol?.score || 0 }
      ];
    }
    // Fallback to basic calculation if API data not available
    return [
      { label: 'DQF Files', value: 0 },
      { label: 'Documents', value: 0 },
      { label: 'Violations', value: 0 },
      { label: 'D&A Testing', value: 0 }
    ];
  };

  // Prepare BASICs data for grid
  const getBasicsData = () => {
    if (!data?.smsBasics) return [];
    return Object.entries(data.smsBasics).map(([key, value]) => ({
      name: value.name?.replace(' Compliance', '').replace(' Indicator', '') || key,
      percentile: value.percentile || 0,
      status: value.status || 'compliant',
      key
    }));
  };

  // Get trend indicator for a BASIC category
  const getTrendIndicator = (basicKey) => {
    if (!trendData?.basicTrends) return null;
    // Map the key format from camelCase to match trendData format
    const keyMap = {
      unsafeDriving: 'unsafeDriving',
      hoursOfService: 'hoursOfService',
      vehicleMaintenance: 'vehicleMaintenance',
      controlledSubstances: 'controlledSubstances',
      driverFitness: 'driverFitness',
      crashIndicator: 'crashIndicator'
    };
    const trend = trendData.basicTrends[keyMap[basicKey]];
    if (!trend) return null;
    return {
      direction: trend.trend,
      change: trend.change || 0
    };
  };

  // Format birthday date with day of week
  const formatBirthdayDate = (dateString, daysUntil) => {
    const date = new Date(dateString);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow';

    return `${monthNames[date.getMonth()]} ${date.getDate()} (${dayNames[date.getDay()]})`;
  };

  // Format last sync time as relative time
  const formatLastSync = (date) => {
    if (!date) return 'Never synced';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Check if sync data is stale (>6 hours)
  const isDataStale = syncStatus?.lastSync &&
    (Date.now() - new Date(syncStatus.lastSync).getTime()) > 6 * 60 * 60 * 1000;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error}</p>
        <button onClick={fetchDashboard} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const scoreStatus = getScoreStatus(complianceScore);
  const scoreFactors = getScoreFactors();
  const basicsData = getBasicsData();

  // Use real compliance history data for trend chart
  const complianceTrendData = (() => {
    if (complianceHistory.length > 0) {
      // Use real historical data from API
      return complianceHistory.map((record, index) => ({
        day: index + 1,
        date: new Date(record.date || record.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: record.overallScore || record.totalScore || 0
      }));
    }
    // Fallback: show current score as single point if no history
    return [{ day: 1, date: 'Today', score: complianceScore }];
  })();

  // FMCSA import progress for new companies
  const isNewCompany = !syncStatus?.lastSync && !syncing;

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* FMCSA Import Progress Overlay */}
      {isNewCompany && (
        <div className="card border-2 border-primary-500/30 bg-primary-50/50 dark:bg-primary-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <FiRefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">Setting up your FMCSA profile...</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">We're importing your carrier data from FMCSA. This usually takes 30-60 seconds.</p>

              <div className="space-y-3">
                {[
                  { label: 'Fetching CSA scores', done: importProgress?.csaScoresSynced },
                  { label: 'Importing inspection history', done: importProgress?.violationsSynced },
                  { label: 'Analyzing violations', done: importProgress?.inspectionsSynced },
                  { label: 'Calculating compliance score', done: importProgress?.complianceScoreCalculated }
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {step.done ? (
                      <FiCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${step.done ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {!importProgress && (
                <button onClick={handleSyncNow} className="btn btn-primary btn-sm mt-4">
                  Start Import Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Hello, {user?.firstName || 'there'}</h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 mt-1">Here's your compliance overview for today</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-300 hidden sm:inline">{currentDate}</span>
          {/* Sync Status Button */}
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              !syncStatus?.lastSync
                ? 'bg-accent-50 dark:bg-accent-500/10 border-accent-200 dark:border-accent-500/30 hover:bg-accent-100 dark:hover:bg-accent-500/20'
                : isDataStale
                  ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 hover:bg-yellow-100 dark:hover:bg-yellow-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
            title="Sync FMCSA data"
          >
            <FiRefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''} ${
              !syncStatus?.lastSync
                ? 'text-accent-600 dark:text-accent-400'
                : isDataStale
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-zinc-600 dark:text-zinc-400'
            }`} />
            <span className={`text-sm font-medium ${
              !syncStatus?.lastSync
                ? 'text-accent-600 dark:text-accent-400'
                : isDataStale
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-zinc-600 dark:text-zinc-400'
            }`}>
              {syncing ? 'Syncing...' : !syncStatus?.lastSync ? 'Sync FMCSA' : formatLastSync(syncStatus?.lastSync)}
            </span>
          </button>
          <Link
            to="/app/reports"
            className="btn btn-primary"
          >
            <FiFileText className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Report</span>
          </Link>
        </div>
      </div>

      {/* Main Grid - Score Section */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
        {/* Compliance Score Card (Main Feature) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Compliance Score</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">Overall fleet health</p>
              </div>
              <Link to="/app/compliance" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                View Details
              </Link>
            </div>

            {/* Score Gauge */}
            <div className="flex flex-col items-center py-2">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="212 71"
                  />
                  {/* Gradient arc (faint) */}
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="212 71"
                    opacity="0.2"
                  />
                  {/* Score indicator */}
                  <circle
                    className="gauge-circle"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getScoreColor(complianceScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${scoreArc} ${283 - scoreArc}`}
                    strokeDashoffset="0"
                  />
                </svg>
                {/* Score number in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xs font-semibold mb-1 ${complianceScore >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {complianceScore >= 50 ? '+' : ''}{complianceScore - 80} pts
                  </span>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white">{complianceScore}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">out of 100</span>
                </div>
              </div>

              {/* Score status label */}
              <div className={`mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${scoreStatus.bgClass} ${scoreStatus.textClass} ${scoreStatus.borderClass}`}>
                {scoreStatus.label}
              </div>
            </div>

            {/* Score factors */}
            <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
              {scoreFactors.map((factor, index) => (
                <div key={index} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">{factor.label}</span>
                    <span className={`text-xs font-semibold ${factor.value >= 80 ? 'text-green-600 dark:text-green-400' : factor.value >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {factor.value}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${factor.value >= 80 ? 'bg-green-500' : factor.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${factor.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Stats */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Drivers */}
            <Link to="/app/drivers" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">All active</span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white">{data?.drivers?.active || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Active Drivers</p>
            </Link>

            {/* Vehicles */}
            <Link to="/app/vehicles" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiTruck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-300">All active</span>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white">{data?.vehicles?.active || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Fleet Vehicles</p>
            </Link>

            {/* Expiring Docs */}
            <Link to="/app/documents" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-yellow-300 dark:hover:border-yellow-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                {(data?.summary?.driversWithExpiringDocs || 0) > 0 && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Action needed</span>
                )}
              </div>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${(data?.summary?.driversWithExpiringDocs || 0) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-white'}`}>
                {data?.summary?.driversWithExpiringDocs || 0}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Expiring Soon</p>
            </Link>

            {/* Violations */}
            <Link to="/app/violations" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                {trendData?.violationTrend !== undefined && trendData.violationTrend !== 0 && (
                  <span className={`text-xs font-semibold ${trendData.violationTrend < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {trendData.violationTrend > 0 ? '+' : ''}{trendData.violationTrend} this year
                  </span>
                )}
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white">{data?.recentViolations?.length || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Open Violations</p>
            </Link>
          </div>

          {/* SMS BASICs Overview */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                  <FiShield className="w-5 h-5 text-accent-600 dark:text-accent-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">SMS BASICs</h3>
                    {/* Overall Trend Badge */}
                    {trendData?.overallTrend && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        trendData.overallTrend === 'improving'
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : trendData.overallTrend === 'worsening'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                          : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}>
                        {trendData.overallTrend === 'improving' ? (
                          <><FiTrendingDown className="w-3 h-3" /> Improving</>
                        ) : trendData.overallTrend === 'worsening' ? (
                          <><FiTrendingUp className="w-3 h-3" /> Worsening</>
                        ) : (
                          <><FiMinus className="w-3 h-3" /> Stable</>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">Safety Measurement System • 30-day trend</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    syncing
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-500/20'
                  }`}
                  title="Sync FMCSA data (inspections, violations, scores)"
                >
                  <FiRefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync FMCSA'}
                </button>
                <Link to="/app/compliance" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  Full Report
                </Link>
              </div>
            </div>
            <div className="p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {basicsData.length > 0 ? basicsData.map((basic, index) => {
                const trend = getTrendIndicator(basic.key);
                return (
                <div key={index} className="group flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-200 dark:hover:border-white/10 transition-all duration-200">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 ${
                    basic.status === 'critical' ? 'bg-red-100 dark:bg-red-500/20' :
                    basic.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-500/20' :
                    'bg-green-100 dark:bg-green-500/20'
                  }`}>
                    <span className={`text-lg font-bold ${
                      basic.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                      basic.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {basic.percentile}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{basic.name}</p>
                      {/* Trend Indicator */}
                      {trend && (
                        <div className={`flex items-center gap-0.5 text-xs font-medium ${
                          trend.direction === 'improving' ? 'text-green-600 dark:text-green-400' :
                          trend.direction === 'worsening' ? 'text-red-600 dark:text-red-400' :
                          'text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {trend.direction === 'improving' ? (
                            <FiTrendingDown className="w-3 h-3" />
                          ) : trend.direction === 'worsening' ? (
                            <FiTrendingUp className="w-3 h-3" />
                          ) : (
                            <FiMinus className="w-3 h-3" />
                          )}
                          {trend.change !== 0 && (
                            <span>{Math.abs(trend.change)}%</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className={`text-xs ${
                      basic.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                      basic.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {basic.status === 'critical' ? 'Above threshold' :
                       basic.status === 'warning' ? 'Warning zone' :
                       'Below threshold'}
                    </p>
                  </div>
                </div>
              )}) : (
                // Empty state: Prompt user to sync FMCSA data
                <div className="col-span-full flex flex-col items-center justify-center py-8 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent-100 dark:bg-accent-500/10 flex items-center justify-center mb-4">
                    <FiShield className="w-8 h-8 text-accent-600 dark:text-accent-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                    No FMCSA Data Yet
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 text-center max-w-sm mb-5">
                    Sync your company's data from FMCSA to see SMS BASICs scores, inspection history, and violation tracking.
                  </p>
                  <button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiRefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing FMCSA Data...' : 'Sync FMCSA Data Now'}
                  </button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                    This may take 15-30 seconds
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
        {/* Recent Alerts */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Recent Alerts</h3>
            </div>
            <span className="px-2.5 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
              {data?.alerts?.length || 0} Active
            </span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {data?.alerts?.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <p className="font-medium text-zinc-700 dark:text-zinc-200">All Clear</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">No alerts at this time</p>
              </div>
            ) : (
              data?.alerts?.slice(0, 3).map((alert, index) => (
                <div key={index} className="group p-4 hover:bg-zinc-50 dark:hover:bg-white/5 hover:pl-5 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${
                      alert.type === 'critical' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-yellow-100 dark:bg-yellow-500/20'
                    }`}>
                      {alert.type === 'critical' ? (
                        <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <FiClock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">{alert.message}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                        {alert.category || 'Compliance'} {alert.type === 'critical' ? '- Critical' : '- Warning'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {(data?.alerts?.length || 0) > 0 && (
            <div className="p-4 border-t border-zinc-100 dark:border-white/5">
              <Link
                to="/app/alerts"
                className="w-full py-2.5 text-sm font-medium text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                View All Alerts
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Driver Birthdays */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center">
                <FiGift className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Birthdays</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">Next 7 days</p>
              </div>
            </div>
            {(data?.upcomingBirthdays?.length || 0) > 0 && (
              <span className="px-2.5 py-1 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-semibold rounded-full">
                {data.upcomingBirthdays.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {!data?.upcomingBirthdays || data.upcomingBirthdays.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                  <FiGift className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
                </div>
                <p className="font-medium text-zinc-700 dark:text-zinc-200">No Birthdays</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">None in the next 7 days</p>
              </div>
            ) : (
              data.upcomingBirthdays.slice(0, 4).map((birthday, index) => (
                <Link
                  key={birthday.id}
                  to={`/app/drivers/${birthday.id}`}
                  className="group p-4 hover:bg-pink-50 dark:hover:bg-pink-500/5 hover:pl-5 border-l-2 border-transparent hover:border-pink-500 transition-all duration-200 flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${
                    birthday.daysUntil === 0 ? 'bg-pink-100 dark:bg-pink-500/20' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}>
                    <FiGift className={`w-4 h-4 ${birthday.daysUntil === 0 ? 'text-pink-600 dark:text-pink-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {birthday.firstName} {birthday.lastName}
                    </p>
                    <p className={`text-xs ${birthday.daysUntil === 0 ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'text-zinc-600 dark:text-zinc-300'}`}>
                      {formatBirthdayDate(birthday.birthdayDate, birthday.daysUntil)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          {(data?.upcomingBirthdays?.length || 0) > 0 && (
            <div className="p-4 border-t border-zinc-100 dark:border-white/5">
              <Link
                to="/app/drivers"
                className="w-full py-2.5 text-sm font-medium text-pink-500 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                View All Drivers
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Driver & Vehicle Status */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Driver Status */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Driver Status</h3>
              </div>
              <Link to="/app/drivers" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                Manage
              </Link>
            </div>
            <div className="p-5">
              {/* Status Grid */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4">
                <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 hover:shadow-md hover:-translate-y-0.5 hover:border-green-300 dark:hover:border-green-500/40 transition-all duration-200 cursor-pointer">
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{data?.drivers?.compliant || 0}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Compliant</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 hover:shadow-md hover:-translate-y-0.5 hover:border-yellow-300 dark:hover:border-yellow-500/40 transition-all duration-200 cursor-pointer">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{data?.drivers?.warning || 0}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Warning</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:shadow-md hover:-translate-y-0.5 hover:border-red-300 dark:hover:border-red-500/40 transition-all duration-200 cursor-pointer">
                  <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{data?.drivers?.nonCompliant || 0}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Non-Compliant</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                {data?.drivers?.active > 0 && (
                  <>
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${((data?.drivers?.compliant || 0) / data?.drivers?.active) * 100}%` }}
                    />
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${((data?.drivers?.warning || 0) / data?.drivers?.active) * 100}%` }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${((data?.drivers?.nonCompliant || 0) / data?.drivers?.active) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <p className="text-center text-xs text-zinc-600 dark:text-zinc-300 mt-3">
                {data?.drivers?.active || 0} Total Active Drivers
              </p>
            </div>
          </div>

          {/* Audit Readiness */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Audit Ready</h3>
              </div>
              <Link to="/app/reports" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                Run Audit
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {/* DQF Files */}
              <div className={`group flex items-center gap-3 p-3 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                (data?.drivers?.nonCompliant || 0) === 0
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 hover:border-green-300 dark:hover:border-green-500/40'
                  : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                  (data?.drivers?.nonCompliant || 0) === 0
                    ? 'bg-green-100 dark:bg-green-500/20'
                    : 'bg-red-100 dark:bg-red-500/20'
                }`}>
                  {(data?.drivers?.nonCompliant || 0) === 0 ? (
                    <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">DQF Files</p>
                  <p className={`text-xs ${
                    (data?.drivers?.nonCompliant || 0) === 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(data?.drivers?.nonCompliant || 0) === 0 ? 'All compliant' : `${data?.drivers?.nonCompliant} need attention`}
                  </p>
                </div>
              </div>
              {/* Vehicle Records */}
              <div className={`group flex items-center gap-3 p-3 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                (data?.vehicles?.outOfService || 0) === 0
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 hover:border-green-300 dark:hover:border-green-500/40'
                  : 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 hover:border-yellow-300 dark:hover:border-yellow-500/40'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                  (data?.vehicles?.outOfService || 0) === 0
                    ? 'bg-green-100 dark:bg-green-500/20'
                    : 'bg-yellow-100 dark:bg-yellow-500/20'
                }`}>
                  {(data?.vehicles?.outOfService || 0) === 0 ? (
                    <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Vehicle Records</p>
                  <p className={`text-xs ${
                    (data?.vehicles?.outOfService || 0) === 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {(data?.vehicles?.outOfService || 0) === 0 ? 'Up to date' : `${data?.vehicles?.outOfService} out of service`}
                  </p>
                </div>
              </div>
              {/* Drug & Alcohol */}
              <div className={`group flex items-center gap-3 p-3 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                complianceData?.components?.drugAlcohol?.score > 0
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 hover:border-green-300 dark:hover:border-green-500/40'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                  complianceData?.components?.drugAlcohol?.score > 0
                    ? 'bg-green-100 dark:bg-green-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-700'
                }`}>
                  {complianceData?.components?.drugAlcohol?.score > 0 ? (
                    <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Drug & Alcohol</p>
                  <p className={`text-xs ${
                    complianceData?.components?.drugAlcohol?.score > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {complianceData?.components?.drugAlcohol?.score > 0 ? 'Program compliant' : 'No data - Setup required'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Benchmark Card */}
      {benchmarkData && (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                <FiBarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Industry Benchmark</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">Your OOS rates vs. national average</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              benchmarkData.summary?.overallStatus === 'above_average'
                ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                : benchmarkData.summary?.overallStatus === 'below_average'
                ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
            }`}>
              {benchmarkData.summary?.overallStatus === 'above_average' ? 'Above Average' :
               benchmarkData.summary?.overallStatus === 'below_average' ? 'Below Average' : 'Mixed'}
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle OOS Rate */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FiTruck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">Vehicle OOS Rate</span>
                </div>
                {benchmarkData.vehicle?.status === 'better' ? (
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                ) : benchmarkData.vehicle?.status === 'average' ? (
                  <FiMinus className="w-5 h-5 text-yellow-500" />
                ) : (
                  <FiAlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">You</span>
                  <span className={`text-lg font-bold ${
                    benchmarkData.vehicle?.status === 'better' ? 'text-green-600 dark:text-green-400' :
                    benchmarkData.vehicle?.status === 'average' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {benchmarkData.vehicle?.yourRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="relative h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full ${
                      benchmarkData.vehicle?.status === 'better' ? 'bg-green-500' :
                      benchmarkData.vehicle?.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(benchmarkData.vehicle?.yourRate || 0, 100)}%` }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-zinc-800 dark:bg-white"
                    style={{ left: `${Math.min(benchmarkData.vehicle?.nationalAverage || 20.72, 100)}%` }}
                    title={`National Avg: ${benchmarkData.vehicle?.nationalAverage}%`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">National Avg</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {benchmarkData.vehicle?.nationalAverage?.toFixed(1) || 20.72}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {benchmarkData.vehicle?.inspections || 0} inspections, {benchmarkData.vehicle?.oosCount || 0} OOS
              </p>
            </div>

            {/* Driver OOS Rate */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FiUsers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">Driver OOS Rate</span>
                </div>
                {benchmarkData.driver?.status === 'better' ? (
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                ) : benchmarkData.driver?.status === 'average' ? (
                  <FiMinus className="w-5 h-5 text-yellow-500" />
                ) : (
                  <FiAlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">You</span>
                  <span className={`text-lg font-bold ${
                    benchmarkData.driver?.status === 'better' ? 'text-green-600 dark:text-green-400' :
                    benchmarkData.driver?.status === 'average' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {benchmarkData.driver?.yourRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="relative h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full ${
                      benchmarkData.driver?.status === 'better' ? 'bg-green-500' :
                      benchmarkData.driver?.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((benchmarkData.driver?.yourRate || 0) * 5, 100)}%` }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-zinc-800 dark:bg-white"
                    style={{ left: `${Math.min((benchmarkData.driver?.nationalAverage || 5.51) * 5, 100)}%` }}
                    title={`National Avg: ${benchmarkData.driver?.nationalAverage}%`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">National Avg</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {benchmarkData.driver?.nationalAverage?.toFixed(1) || 5.51}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {benchmarkData.driver?.inspections || 0} inspections, {benchmarkData.driver?.oosCount || 0} OOS
              </p>
            </div>
          </div>
          {benchmarkData.summary?.lastUpdated && (
            <div className="px-5 pb-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Data synced: {new Date(benchmarkData.summary.lastUpdated).toLocaleDateString()} •{' '}
                <Link to="/app/compliance" className="text-accent-500 hover:text-accent-600 dark:hover:text-accent-400">
                  View Details
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Inspections Card */}
      {recentInspections.length > 0 && (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#1E3A5F] px-5 py-4 flex items-center justify-between">
            <h3 className="text-white font-semibold">RECENT INSPECTIONS</h3>
            <Link to="/app/compliance" className="text-white/80 hover:text-white text-sm flex items-center">
              View All <FiArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {recentInspections.map((insp) => (
              <div key={insp._id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    insp.vehicleOOS || insp.driverOOS
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : (insp.totalViolations || 0) > 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {insp.vehicleOOS || insp.driverOOS ? (
                      <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (insp.totalViolations || 0) > 0 ? (
                      <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {insp.state || 'Unknown'} - Level {insp.inspectionLevel || '?'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(insp.inspectionDate).toLocaleDateString()} • {insp.reportNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    (insp.totalViolations || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {insp.totalViolations || 0} violation{(insp.totalViolations || 0) !== 1 ? 's' : ''}
                  </span>
                  {(insp.vehicleOOS || insp.driverOOS) && (
                    <p className="text-xs text-red-500">
                      {insp.vehicleOOS && 'Vehicle OOS'}
                      {insp.vehicleOOS && insp.driverOOS && ' • '}
                      {insp.driverOOS && 'Driver OOS'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Risk Drivers Card */}
      {topRiskDrivers.length > 0 && (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#1E3A5F] px-5 py-4 flex items-center justify-between">
            <h3 className="text-white font-semibold">TOP RISK DRIVERS</h3>
            <Link to="/app/drivers" className="text-white/80 hover:text-white text-sm flex items-center">
              View All <FiArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {topRiskDrivers.map((driver) => (
              <Link
                key={driver._id}
                to={`/app/drivers/${driver._id}`}
                className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors block"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    driver.riskLevel === 'High'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : driver.riskLevel === 'Medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <FiAlertTriangle className={`w-5 h-5 ${
                      driver.riskLevel === 'High'
                        ? 'text-red-600 dark:text-red-400'
                        : driver.riskLevel === 'Medium'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {driver.fullName || `${driver.firstName} ${driver.lastName}`}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {driver.totalViolations} violation{driver.totalViolations !== 1 ? 's' : ''} • {driver.basicsAffected || 0} BASIC{(driver.basicsAffected || 0) !== 1 ? 's' : ''} affected
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    driver.riskLevel === 'High'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : driver.riskLevel === 'Medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {Math.round(driver.totalWeightedPoints)} pts
                  </span>
                  {driver.oosCount > 0 && (
                    <p className="text-xs text-red-500 mt-1">{driver.oosCount} OOS</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Trend Chart */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        {/* Navy header bar */}
        <div className="bg-[#1E3A5F] px-5 py-4">
          <h3 className="text-white font-semibold">
            COMPLIANCE TREND <span className="font-normal opacity-80">(Last 30 Days)</span>
          </h3>
        </div>

        {/* Chart area */}
        <div className="p-3 sm:p-5 h-48 sm:h-56 lg:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={complianceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${value}%`, 'Overall Score']}
                labelFormatter={(label) => label}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Overall Score"
                stroke="#4A90D9"
                strokeWidth={2}
                dot={{ fill: '#4A90D9', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#4A90D9', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <Link
        to="/app/ai-assistant"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 rounded-full shadow-lg shadow-accent-500/30 flex items-center justify-center transition-all hover:scale-105 z-40"
      >
        <FiMessageCircle className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
};

export default Dashboard;
