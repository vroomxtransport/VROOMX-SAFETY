import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dashboardAPI, csaAPI, fmcsaInspectionsAPI, driversAPI, fmcsaAPI, complianceScoreAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FiUsers, FiAlertTriangle, FiClock,
  FiCheckCircle, FiAlertCircle, FiFileText, FiShield,
  FiMessageCircle, FiArrowRight, FiRefreshCw,
  FiGift
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import { InspectionDetailModal } from './InspectionHistory';
import ImportProgressOverlay from './dashboard/ImportProgressOverlay';
import ComplianceScoreCard from './dashboard/ComplianceScoreCard';
import StatsCards from './dashboard/StatsCards';
import ComplianceTrendChart from './dashboard/ComplianceTrendChart';
import RecentInspectionsCard from './dashboard/RecentInspectionsCard';
import TopRiskDriversCard from './dashboard/TopRiskDriversCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [recentInspections, setRecentInspections] = useState([]);
  const [topRiskDrivers, setTopRiskDrivers] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
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
          // Check both endpoints: getSyncStatus detects registration-time syncs,
          // getInspectionSummary detects orchestrator sync progress
          const [statusRes, inspRes] = await Promise.all([
            fmcsaAPI.getSyncStatus().catch(() => null),
            fmcsaAPI.getInspectionSummary().catch(() => null)
          ]);

          // Registration sync completed — lastViolationSync is now set,
          // or inspection data exists (fallback for partial syncs)
          if (statusRes?.data?.lastSync || statusRes?.data?.inspectionCount > 0) {
            clearInterval(pollInterval);
            fetchDashboard();
            return;
          }

          if (inspRes?.data?.syncStatus) {
            setImportProgress(inspRes.data.syncStatus);
            if (inspRes.data.syncStatus.csaScoresSynced || inspRes.data.syncStatus.violationsSynced || inspRes.data.syncStatus.inspectionsSynced) {
              fetchDashboard();
            }
            if (inspRes.data.syncStatus.complianceScoreCalculated) {
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
      const [dashboardRes, trendRes, complianceRes, historyRes, inspectionsRes, riskDriversRes, syncStatusRes] = await Promise.all([
        dashboardAPI.get(),
        csaAPI.getTrendSummary(30).catch(() => null),
        complianceScoreAPI.get().catch(() => null),
        complianceScoreAPI.getHistory(30).catch(() => null),
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
  const hasComplianceData = complianceData !== null && complianceData?.overallScore != null;
  const complianceScore = hasComplianceData ? complianceData.overallScore : 0;

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

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

  // Handle inspection click - fetch full details and open modal
  const handleInspectionClick = async (insp) => {
    try {
      const res = await fmcsaInspectionsAPI.getById(insp._id);
      if (res.data?.inspection) setSelectedInspection(res.data.inspection);
    } catch (e) { /* ignore */ }
  };

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

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* FMCSA Import Progress Overlay */}
      <ImportProgressOverlay
        importProgress={importProgress}
        syncStatus={syncStatus}
        syncing={syncing}
        onSyncNow={handleSyncNow}
      />

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
        <ComplianceScoreCard complianceData={complianceData} />

        {/* Right Side Stats */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Quick Stats Row */}
          <StatsCards data={data} trendData={trendData} />

          {/* Compliance Trend */}
          <ComplianceTrendChart
            complianceHistory={complianceHistory}
            complianceScore={complianceScore}
            syncing={syncing}
            onSyncNow={handleSyncNow}
          />
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

      {/* Recent Inspections Card */}
      <RecentInspectionsCard
        inspections={recentInspections}
        onInspectionClick={handleInspectionClick}
      />

      {/* Top Risk Drivers Card */}
      <TopRiskDriversCard drivers={topRiskDrivers} />

      {/* Floating AI Chat Button */}
      <Link
        to="/app/ai-assistant"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 rounded-full shadow-lg shadow-accent-500/30 flex items-center justify-center transition-all hover:scale-105 z-40"
      >
        <FiMessageCircle className="w-6 h-6 text-white" />
      </Link>

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
