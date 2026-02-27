import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { violationsAPI, inspectionsAPI } from '../utils/api';
import { formatDate, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiFileText, FiCheckCircle, FiXCircle, FiClock, FiTrendingUp,
  FiAlertTriangle, FiTarget, FiRefreshCw, FiFilter, FiZap,
  FiArrowRight, FiAward, FiBarChart2, FiExternalLink, FiShield,
  FiDollarSign
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import DataQOpportunities from '../components/DataQOpportunities';
import DataQLetterModal from '../components/DataQLetterModal';
import ViolationDetailModal from '../components/ViolationDetailModal';
import { useAuth } from '../context/AuthContext';
import UpgradePrompt from '../components/common/UpgradePrompt';

const ActiveChallengesPanel = lazy(() => import('../components/ActiveChallengesPanel'));
const DataQAnalyticsPanel = lazy(() => import('../components/DataQAnalyticsPanel'));

const CATEGORY_FILTERS = [
  { key: '', label: 'All' },
  { key: 'easy_win', label: 'Easy Wins', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' },
  { key: 'worth_challenging', label: 'Worth Challenging', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { key: 'expiring_soon', label: 'Expiring Soon', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  { key: 'unlikely', label: 'Unlikely', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' }
];

const DataQDashboard = ({ embedded = false }) => {
  const { isFreePlan } = useAuth();
  const [activeTab, setActiveTab] = useState('challenge-manager');
  const [stats, setStats] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [minScore, setMinScore] = useState(40);
  const [selectedBasic, setSelectedBasic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [autoSyncing, setAutoSyncing] = useState(false);
  const autoSyncAttempted = useRef(false);
  const [detailViolation, setDetailViolation] = useState(null);

  // Health Check state
  const [healthStats, setHealthStats] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isFreePlan) return;
    fetchData();
  }, [minScore, selectedBasic, selectedCategory, isFreePlan]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardResult, opportunitiesResult, healthResult] = await Promise.allSettled([
        violationsAPI.getDataQDashboard(),
        violationsAPI.getDataQOpportunities({
          minScore,
          limit: 20,
          basic: selectedBasic || undefined,
          category: selectedCategory || undefined
        }),
        violationsAPI.getHealthCheck()
      ]);

      if (dashboardResult.status === 'fulfilled') {
        setStats(dashboardResult.value.data.stats);
      } else {
        setError(dashboardResult.reason?.response?.data?.error || 'Failed to load dashboard stats');
      }

      if (opportunitiesResult.status === 'fulfilled') {
        const nextOpportunities = opportunitiesResult.value.data?.violations;
        setOpportunities(Array.isArray(nextOpportunities) ? nextOpportunities : []);
      } else {
        setOpportunities([]);
      }

      if (healthResult.status === 'fulfilled') {
        setHealthStats(healthResult.value.data.data || healthResult.value.data);
      }

      const dashboardStats = dashboardResult.status === 'fulfilled'
        ? dashboardResult.value.data.stats
        : null;

      // If no violations exist, try a one-time auto-sync from FMCSA DataHub
      if (!autoSyncAttempted.current && (dashboardStats?.totalViolations || 0) === 0) {
        autoSyncAttempted.current = true;
        setAutoSyncing(true);
        try {
          const syncRes = await inspectionsAPI.syncViolations();
          if (syncRes.data.success) {
            const imported = syncRes.data.dataqCreated || 0;
            toast.success(
              imported > 0
                ? `Synced ${imported} violations from FMCSA`
                : (syncRes.data.message || 'FMCSA sync completed')
            );
          }
        } catch (syncError) {
          toast.error(syncError.response?.data?.message || 'Failed to sync violations from FMCSA');
        } finally {
          setAutoSyncing(false);
        }

        // Re-fetch after sync
        const [dashboardRes2, opportunitiesRes2, healthRes2] = await Promise.allSettled([
          violationsAPI.getDataQDashboard(),
          violationsAPI.getDataQOpportunities({ minScore, limit: 20, basic: selectedBasic || undefined, category: selectedCategory || undefined }),
          violationsAPI.getHealthCheck()
        ]);

        if (dashboardRes2.status === 'fulfilled') {
          setStats(dashboardRes2.value.data.stats);
          setError(null);
        }
        if (opportunitiesRes2.status === 'fulfilled') {
          setOpportunities(Array.isArray(opportunitiesRes2.value.data?.violations) ? opportunitiesRes2.value.data.violations : []);
        }
        if (healthRes2.status === 'fulfilled') {
          setHealthStats(healthRes2.value.data.data || healthRes2.value.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load DataQ dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      toast.success('Dashboard refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await violationsAPI.triggerScan();
      const count = res.data?.scannedCount || res.data?.count || 0;
      toast.success(`Scanned ${count} violations`);
      await fetchData();
    } catch (err) {
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleAnalyze = (violation) => {
    setSelectedViolation(violation);
    setShowLetterModal(true);
  };

  const handleAnalysisClose = () => {
    setShowLetterModal(false);
    setSelectedViolation(null);
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading DataQ Dashboard...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-500/20 flex items-center justify-center mb-4">
          <FiAlertTriangle className="w-8 h-8 text-danger-500" />
        </div>
        <p className="text-danger-600 dark:text-danger-400 font-medium mb-2">{error}</p>
        <button onClick={fetchData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const openChallenges = (stats?.challengeStats?.pending || 0) + (stats?.challengeStats?.underReview || 0);

  if (isFreePlan && !embedded) {
    return <UpgradePrompt feature="DataQ Challenge Analytics" description="Analyze violations for DataQ challenge opportunities, generate challenge letters, and track success rates. Available on Fleet and Pro plans." />;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header - hidden when embedded in FMCSA Dashboard */}
      {!embedded && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">DataQ Challenge Center</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-400 border border-accent-200 dark:border-accent-500/30">
              <FiZap className="w-3 h-3 mr-1" />
              AI-Powered
            </span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">
            Identify challengeable violations and build DataQ challenges with AI analysis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScan}
            className="btn btn-secondary"
            disabled={scanning}
          >
            {scanning ? <LoadingSpinner size="sm" /> : <FiShield className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Run Scan'}
          </button>
          <Link to="/app/compliance" className="btn btn-secondary">
            <FiExternalLink className="w-4 h-4" />
            View All Violations
          </Link>
          <button
            onClick={handleRefresh}
            className="btn btn-primary"
            disabled={refreshing || autoSyncing}
          >
            {refreshing ? <LoadingSpinner size="sm" /> : <FiRefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>
      )}

      {/* Last scan info */}
      {healthStats?.lastScanDate && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Last scan: {formatDate(healthStats.lastScanDate)}
        </p>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 overflow-x-auto">
        {[
          { id: 'challenge-manager', label: 'Challenge Manager', icon: FiFileText },
          { id: 'active-challenges', label: 'Active Challenges', icon: FiClock, badge: openChallenges > 0 ? openChallenges : null },
          { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge != null && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-accent-600 text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'challenge-manager' && (
      <>
      {/* Challenge Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAward className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-success-600 dark:text-success-400 font-mono">
                {stats?.successRate || 0}%
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Success Rate</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info-100 dark:bg-info-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiClock className="w-5 h-5 text-info-600 dark:text-info-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-info-600 dark:text-info-400 font-mono">
                {openChallenges}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Open Challenges</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-success-600 dark:text-success-400 font-mono">
                {stats?.challengeStats?.accepted || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Accepted</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiTrendingUp className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-accent-600 dark:text-accent-400 font-mono">
                {stats?.estimatedCSASavings || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">CSA Points Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Check Stats */}
      {healthStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-green-200/60 dark:border-green-800/40 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                  {healthStats.easy_win || 0}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">Easy Wins</p>
              </div>
            </div>
          </div>
          <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-amber-200/60 dark:border-amber-800/40 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {healthStats.worth_challenging || 0}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">Worth Challenging</p>
              </div>
            </div>
          </div>
          <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-orange-200/60 dark:border-orange-800/40 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FiClock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">
                  {healthStats.expiring_soon || 0}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">Expiring Soon</p>
              </div>
            </div>
          </div>
          <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-green-200/60 dark:border-green-800/40 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                  ${healthStats.totalEstimatedSavings?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">Est. Annual Savings</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Status Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <FiBarChart2 className="w-5 h-5 text-zinc-500" />
          Challenge Status Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-500/10">
            <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 font-mono">
              {stats?.challengeStats?.pending || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Pending</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-info-50 dark:bg-info-500/10">
            <p className="text-2xl font-bold text-info-600 dark:text-info-400 font-mono">
              {stats?.challengeStats?.underReview || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Under Review</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-success-50 dark:bg-success-500/10">
            <p className="text-2xl font-bold text-success-600 dark:text-success-400 font-mono">
              {stats?.challengeStats?.accepted || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Accepted</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-danger-50 dark:bg-danger-500/10">
            <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 font-mono">
              {stats?.challengeStats?.denied || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Denied</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400 font-mono">
              {stats?.challengeStats?.withdrawn || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Withdrawn</p>
          </div>
        </div>
        {stats?.avgProcessingDays && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 text-center">
            Average processing time: <span className="font-semibold">{stats.avgProcessingDays} days</span>
          </p>
        )}
      </div>

      {/* AI Opportunities Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                <FiTarget className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Challenge Opportunities</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">AI-identified violations with high challenge potential</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-zinc-400" />
                <select
                  value={selectedBasic}
                  onChange={(e) => setSelectedBasic(e.target.value)}
                  className="form-select text-sm py-1.5"
                >
                  <option value="">All Categories</option>
                  {Object.entries(basicCategories).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <select
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="form-select text-sm py-1.5"
              >
                <option value={75}>High Potential (75+)</option>
                <option value={50}>Medium+ (50+)</option>
                <option value={40}>All Opportunities (40+)</option>
                <option value={0}>Show All Scores</option>
              </select>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedCategory === cat.key
                    ? (cat.color || 'bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-400 border-accent-300 dark:border-accent-600')
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                {cat.label}
                {cat.key && healthStats?.[cat.key] > 0 && (
                  <span className="ml-1.5 font-bold">{healthStats[cat.key]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <DataQOpportunities
          opportunities={opportunities}
          onAnalyze={handleAnalyze}
          onViewDetail={(v) => {
            violationsAPI.getById(v._id)
              .then(res => setDetailViolation(res.data.violation || v))
              .catch(() => setDetailViolation(v));
          }}
          loading={loading}
        />
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-accent-50 to-info-50 dark:from-accent-500/10 dark:to-info-500/10 rounded-xl border border-accent-200/60 dark:border-accent-500/20 p-5">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">How Violation Analysis Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-600 dark:bg-accent-500 text-white flex items-center justify-center text-sm font-semibold">1</div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Smart Scan</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">AI scans your violations and scores each one based on challenge potential</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-600 dark:bg-accent-500 text-white flex items-center justify-center text-sm font-semibold">2</div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Deep Analysis</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Get safety manager-level insights, tips, defenses, and CFR citations for each violation</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-600 dark:bg-accent-500 text-white flex items-center justify-center text-sm font-semibold">3</div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Take Action</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Use the analysis to file your challenge through the FMCSA DataQs system</p>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {activeTab === 'active-challenges' && (
        <Suspense fallback={<div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}>
          <ActiveChallengesPanel />
        </Suspense>
      )}

      {activeTab === 'analytics' && (
        <Suspense fallback={<div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}>
          <DataQAnalyticsPanel />
        </Suspense>
      )}

      {/* Violation Detail Modal */}
      {detailViolation && (
        <ViolationDetailModal
          violation={detailViolation}
          onClose={() => setDetailViolation(null)}
        />
      )}

      {/* DataQ Letter Modal */}
      {showLetterModal && selectedViolation && (
        <DataQLetterModal
          isOpen={showLetterModal}
          onClose={() => {
            setShowLetterModal(false);
            setSelectedViolation(null);
          }}
          violation={selectedViolation.violation}
          analysis={selectedViolation.analysis}
        />
      )}
    </div>
  );
};

export default DataQDashboard;
