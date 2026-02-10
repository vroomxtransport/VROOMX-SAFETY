import { useState, useEffect } from 'react';
import { violationsAPI } from '../utils/api';
import { basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiCheckCircle, FiAlertTriangle, FiClock, FiDollarSign,
  FiRefreshCw, FiFilter, FiShield, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import HealthCheckViolationCard from './HealthCheckViolationCard';
import CourtOutcomeModal from './CourtOutcomeModal';

const HealthCheckTab = ({ onOpenLetterModal }) => {
  const [healthStats, setHealthStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [basicFilter, setBasicFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [courtOutcomeViolation, setCourtOutcomeViolation] = useState(null);

  useEffect(() => {
    fetchHealthStats();
  }, []);

  useEffect(() => {
    fetchViolations();
  }, [category, basicFilter, page]);

  const fetchHealthStats = async () => {
    try {
      const res = await violationsAPI.getHealthCheck();
      setHealthStats(res.data.data || res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load health check data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    try {
      setViolationsLoading(true);
      const params = { page, limit: 20 };
      if (category) params.category = category;
      if (basicFilter) params.basic = basicFilter;
      const res = await violationsAPI.getHealthCheckViolations(params);
      const data = res.data.data || res.data;
      setViolations(data.violations || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load violations');
      }
      setViolations([]);
    } finally {
      setViolationsLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await violationsAPI.triggerScan();
      const data = res.data.data || res.data;
      toast.success(`Scan complete: ${data.scannedCount || 0} violations analyzed`);
      await Promise.all([fetchHealthStats(), fetchViolations()]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleChallenge = (violation) => {
    if (onOpenLetterModal) {
      const scan = violation.scanResults || {};
      onOpenLetterModal({
        violation,
        analysis: {
          score: scan.priorityScore || 0,
          factors: scan.flags?.map(f => f.reason) || [],
          recommendedChallengeType: 'data_error',
          triageBreakdown: scan.triageBreakdown,
          recommendation: scan.recommendation,
          roiEstimate: scan.roiEstimate
        }
      });
    }
  };

  const handleCourtOutcomeSuccess = () => {
    setCourtOutcomeViolation(null);
    fetchViolations();
    fetchHealthStats();
  };

  if (loading && !healthStats) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading Health Check...</p>
      </div>
    );
  }

  const stats = healthStats?.summary || {};
  const hasBeenScanned = healthStats?.lastScanDate || (violations.length > 0);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Scan Button Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <FiShield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Violation Health Check
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {hasBeenScanned
              ? `Last scanned: ${new Date(healthStats?.lastScanDate).toLocaleDateString()}`
              : 'Run a scan to identify challengeable violations'}
          </p>
        </div>
        <button
          onClick={handleScan}
          className="btn btn-primary"
          disabled={scanning}
        >
          {scanning ? <LoadingSpinner size="sm" /> : <FiRefreshCw className="w-4 h-4" />}
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Easy Wins */}
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.easy_win || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Easy Wins</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">~90%+ success rate</p>
            </div>
          </div>
        </div>

        {/* Worth Challenging */}
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {stats.worth_challenging || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Worth Challenging</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">evidence needed</p>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiClock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">
                {stats.expiring_soon || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Expiring Soon</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">drops off CSA in &lt; 6 months</p>
            </div>
          </div>
        </div>

        {/* Est. Annual Savings */}
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ${(stats.totalEstimatedSavings || 0).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Est. Annual Savings</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">from actionable violations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <FiFilter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'All' },
              { value: 'easy_win', label: 'Easy Wins' },
              { value: 'worth_challenging', label: 'Worth Challenging' },
              { value: 'expiring_soon', label: 'Expiring' },
              { value: 'unlikely', label: 'Unlikely' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setCategory(tab.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  category === tab.value
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto">
            <select
              value={basicFilter}
              onChange={(e) => { setBasicFilter(e.target.value); setPage(1); }}
              className="form-select text-sm py-1.5"
            >
              <option value="">All BASICs</option>
              {Object.entries(basicCategories).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Violation List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        {violationsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading violations...</p>
          </div>
        ) : violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <FiShield className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              {hasBeenScanned ? 'No violations match this filter' : 'No scan results yet'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
              {hasBeenScanned
                ? 'Try changing the filter or BASIC category'
                : 'Click "Run Scan" to analyze your violations for challenge opportunities'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {violations.map((violation) => (
              <HealthCheckViolationCard
                key={violation._id}
                violation={violation}
                onChallenge={() => handleChallenge(violation)}
                onRecordCourtOutcome={() => setCourtOutcomeViolation(violation)}
                expanded={expandedId === violation._id}
                onToggleExpand={() => setExpandedId(expandedId === violation._id ? null : violation._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary text-sm"
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary text-sm"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Court Outcome Modal */}
      {courtOutcomeViolation && (
        <CourtOutcomeModal
          isOpen={!!courtOutcomeViolation}
          onClose={() => setCourtOutcomeViolation(null)}
          violation={courtOutcomeViolation}
          onSuccess={handleCourtOutcomeSuccess}
        />
      )}
    </div>
  );
};

export default HealthCheckTab;
