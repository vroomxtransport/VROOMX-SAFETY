import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { violationsAPI, inspectionsAPI } from '../utils/api';
import { formatDate, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiFileText, FiCheckCircle, FiXCircle, FiClock, FiTrendingUp,
  FiAlertTriangle, FiTarget, FiRefreshCw, FiFilter, FiZap,
  FiArrowRight, FiAward, FiBarChart2, FiExternalLink, FiShield
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import DataQOpportunities from '../components/DataQOpportunities';
import DataQLetterModal from '../components/DataQLetterModal';
import HealthCheckTab from '../components/HealthCheckTab';

const ActiveChallengesPanel = lazy(() => import('../components/ActiveChallengesPanel'));
const CleanInspectionPanel = lazy(() => import('../components/CleanInspectionPanel'));
const DataQAnalyticsPanel = lazy(() => import('../components/DataQAnalyticsPanel'));

const DataQDashboard = () => {
  const [activeTab, setActiveTab] = useState('health-check');
  const [stats, setStats] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [minScore, setMinScore] = useState(40);
  const [selectedBasic, setSelectedBasic] = useState('');
  const [autoSyncing, setAutoSyncing] = useState(false);
  const autoSyncAttempted = useRef(false);
  const [missingCount, setMissingCount] = useState(0);

  useEffect(() => {
    const fetchMissingCount = async () => {
      try {
        const { cleanInspectionsAPI } = await import('../utils/api');
        const res = await cleanInspectionsAPI.getMissing();
        setMissingCount(res.data?.count || 0);
      } catch {}
    };
    fetchMissingCount();
  }, []);

  useEffect(() => {
    fetchData();
  }, [minScore, selectedBasic]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, opportunitiesRes] = await Promise.all([
        violationsAPI.getDataQDashboard(),
        violationsAPI.getDataQOpportunities({ minScore, limit: 10, basic: selectedBasic || undefined })
      ]);

      const dashboardStats = dashboardRes.data.stats;
      setStats(dashboardStats);
      setOpportunities(opportunitiesRes.data.violations || []);

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
          } else {
            toast.error(syncRes.data.message || 'FMCSA sync failed');
          }
        } catch (syncError) {
          toast.error(syncError.response?.data?.message || 'Failed to sync violations from FMCSA');
        } finally {
          setAutoSyncing(false);
        }

        // Re-fetch after sync attempt
        const [dashboardRes2, opportunitiesRes2] = await Promise.all([
          violationsAPI.getDataQDashboard(),
          violationsAPI.getDataQOpportunities({ minScore, limit: 10, basic: selectedBasic || undefined })
        ]);

        setStats(dashboardRes2.data.stats);
        setOpportunities(opportunitiesRes2.data.violations || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load DataQ dashboard');
      toast.error('Failed to load DataQ data');
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

  const handleAnalyze = (violation) => {
    setSelectedViolation(violation);
    setShowLetterModal(true);
  };

  const handleLetterGenerated = () => {
    fetchData();
    setShowLetterModal(false);
    setSelectedViolation(null);
    toast.success('DataQ letter generated successfully');
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

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
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
            Identify challengeable violations and generate professional DataQ letters
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 overflow-x-auto">
        {[
          { id: 'health-check', label: 'Health Check', icon: FiShield },
          { id: 'challenge-manager', label: 'Challenge Manager', icon: FiFileText },
          { id: 'active-challenges', label: 'Active Challenges', icon: FiClock, badge: openChallenges > 0 ? openChallenges : null },
          { id: 'clean-inspections', label: 'Clean Inspections', icon: FiTarget, badge: missingCount > 0 ? missingCount : null },
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

      {activeTab === 'health-check' && (
        <HealthCheckTab onOpenLetterModal={handleAnalyze} />
      )}

      {activeTab === 'challenge-manager' && (
      <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Success Rate */}
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

        {/* Open Challenges */}
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

        {/* Accepted */}
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

        {/* CSA Savings */}
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
              <div className="flex items-center gap-2">
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
          </div>
        </div>

        <DataQOpportunities
          opportunities={opportunities}
          onAnalyze={handleAnalyze}
          loading={loading}
        />
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-accent-50 to-info-50 dark:from-accent-500/10 dark:to-info-500/10 rounded-xl border border-accent-200/60 dark:border-accent-500/20 p-5">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">How AI DataQ Challenge Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-600 dark:bg-accent-500 text-white flex items-center justify-center text-sm font-semibold">1</div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">AI Analyzes</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Our AI scans your violations and scores each one based on challenge potential</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-600 dark:bg-accent-500 text-white flex items-center justify-center text-sm font-semibold">2</div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Generate Letter</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Click to generate a professional DataQ challenge letter with CFR citations</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-600 dark:bg-accent-500 text-white flex items-center justify-center text-sm font-semibold">3</div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Submit & Track</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Submit your challenge and track its status through resolution</p>
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

      {activeTab === 'clean-inspections' && (
        <Suspense fallback={<div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}>
          <CleanInspectionPanel />
        </Suspense>
      )}

      {activeTab === 'analytics' && (
        <Suspense fallback={<div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}>
          <DataQAnalyticsPanel />
        </Suspense>
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
          onSuccess={handleLetterGenerated}
        />
      )}
    </div>
  );
};

export default DataQDashboard;
