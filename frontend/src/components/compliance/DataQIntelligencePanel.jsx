import { useState, useEffect } from 'react';
import { violationsAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import {
  FiTarget, FiZap, FiTrendingDown, FiFileText, FiAlertTriangle,
  FiClock, FiShield, FiChevronDown, FiChevronUp, FiLoader
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

// --- Challenge Score Calculation (frontend-only, static rules) ---
const calculateChallengeScore = (violation) => {
  let score = 5;

  // Age bonus: older violations are easier to challenge
  const ageMonths = (Date.now() - new Date(violation.violationDate)) / (1000 * 60 * 60 * 24 * 30);
  if (ageMonths > 18) score += 2;
  else if (ageMonths > 12) score += 1;

  // Severity: lower severity = easier to challenge
  if (violation.severityWeight <= 3) score += 1;
  if (violation.severityWeight >= 8) score -= 2;

  // OOS violations are harder to challenge
  if (violation.outOfService) score -= 1;

  // Has existing documentation = better chance
  if (violation.documents?.length > 0) score += 1;

  // Court dismissed = strong DataQ case
  if (violation.courtOutcome === 'dismissed' || violation.courtOutcome === 'not_guilty') score += 3;

  return Math.max(1, Math.min(10, score));
};

const getTimeWeight = (violationDate) => {
  const ageMonths = (Date.now() - new Date(violationDate)) / (1000 * 60 * 60 * 24 * 30);
  if (ageMonths <= 6) return 3;
  if (ageMonths <= 12) return 2;
  return 1;
};

const estimateCSAImpact = (violation) => {
  const weight = violation.severityWeight || 1;
  const timeWeight = getTimeWeight(violation.violationDate);
  return Math.max(1, Math.round(weight * timeWeight * 0.5));
};

const getScoreColor = (score) => {
  if (score >= 8) return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-500/30', label: 'High Chance' };
  if (score >= 5) return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/30', label: 'Moderate' };
  return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/30', label: 'Low Chance' };
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
  return labels[basic] || basic?.replace(/_/g, ' ') || 'Unknown';
};

// --- Challenge Score Badge (circular) ---
const ChallengeScoreBadge = ({ score }) => {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3.5"
          className="stroke-zinc-200 dark:stroke-zinc-700" />
        <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color.bg.replace('bg-', 'stroke-')} transition-all duration-700`} />
      </svg>
      <span className={`text-lg font-bold ${color.text}`}>{score}</span>
    </div>
  );
};

// --- Single Violation Card ---
const ViolationCard = ({ violation, challengeScore, csaImpact, onGeneratePetition }) => {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const color = getScoreColor(challengeScore);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGeneratePetition(violation._id);
      toast.success('Petition letter generated');
    } catch {
      toast.error('Failed to generate petition');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 hover:shadow-md transition-all duration-200">
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <ChallengeScoreBadge score={challengeScore} />

        {/* Violation info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-zinc-900 dark:text-white truncate text-sm">
              {violation.violationType || violation.description || 'Violation'}
            </span>
            {violation.outOfService && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                OOS
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${color.text} ${color.ring} ring-1`}>
              {color.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              {formatDate(violation.violationDate)}
            </span>
            <span className="capitalize">{getBasicLabel(violation.basic)}</span>
            {violation.severityWeight && (
              <span>Severity: {violation.severityWeight}</span>
            )}
          </div>
        </div>

        {/* CSA impact estimate */}
        <div className="hidden sm:flex flex-col items-end flex-shrink-0">
          <div className="flex items-center gap-1 text-accent-600 dark:text-accent-400">
            <FiTrendingDown className="w-3.5 h-3.5" />
            <span className="text-sm font-semibold">~{csaImpact} pts</span>
          </div>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">CSA reduction</span>
        </div>

        {/* Expand toggle */}
        <button className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0">
          {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="pt-3 space-y-3">
            {/* CSA impact callout (also visible on mobile) */}
            <div className="p-3 rounded-lg bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20">
              <div className="flex items-center gap-2">
                <FiTrendingDown className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                <span className="text-sm font-medium text-accent-700 dark:text-accent-400">
                  Estimated CSA Impact
                </span>
              </div>
              <p className="text-sm text-accent-600 dark:text-accent-400 mt-1">
                Removing this violation would reduce your <span className="font-semibold">{getBasicLabel(violation.basic)}</span> percentile by ~{csaImpact} points
              </p>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-zinc-500 dark:text-zinc-400">Age</p>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {Math.floor((Date.now() - new Date(violation.violationDate)) / (1000 * 60 * 60 * 24 * 30))} months
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-zinc-500 dark:text-zinc-400">Severity</p>
                <p className="font-medium text-zinc-900 dark:text-white">{violation.severityWeight || 'N/A'}</p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-zinc-500 dark:text-zinc-400">Out of Service</p>
                <p className="font-medium text-zinc-900 dark:text-white">{violation.outOfService ? 'Yes' : 'No'}</p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-zinc-500 dark:text-zinc-400">Documents</p>
                <p className="font-medium text-zinc-900 dark:text-white">{violation.documents?.length || 0} attached</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                disabled={generating}
                className="btn btn-primary text-sm"
              >
                {generating ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiFileText className="w-4 h-4" />
                    Generate Petition
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Panel ---
const DataQIntelligencePanel = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await violationsAPI.getDataQOpportunities({ limit: 50 });
      const raw = res.data?.violations || [];
      // Extract the violation object from each opportunity
      const viols = raw.map(item => item.violation || item);
      setViolations(viols);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load DataQ opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePetition = async (violationId) => {
    await violationsAPI.generateLetter(violationId, {});
  };

  // Compute scores and sort by impact
  const enriched = violations.map(v => ({
    violation: v,
    challengeScore: calculateChallengeScore(v),
    csaImpact: estimateCSAImpact(v),
  })).sort((a, b) => {
    // Sort by challenge score * CSA impact (highest potential first)
    const aWeight = a.challengeScore * a.csaImpact;
    const bWeight = b.challengeScore * b.csaImpact;
    return bWeight - aWeight;
  });

  const totalEligible = enriched.length;
  const totalSavings = enriched.reduce((sum, e) => sum + e.csaImpact, 0);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-8">
        <div className="flex flex-col items-center justify-center h-48">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Analyzing violations for DataQ eligibility...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-8">
        <div className="flex flex-col items-center justify-center h-48">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
            <FiAlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium mb-3">{error}</p>
          <button onClick={fetchOpportunities} className="btn btn-primary text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (totalEligible === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-8">
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <FiShield className="w-7 h-7 text-zinc-400" />
          </div>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">No violations currently eligible for DataQ challenge</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Sync your FMCSA data to check for new opportunities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-gradient-to-r from-accent-50 to-blue-50 dark:from-accent-500/10 dark:to-blue-500/10 rounded-xl border border-accent-200/60 dark:border-accent-500/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-600 dark:bg-accent-500 flex items-center justify-center">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">DataQ Intelligence</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-accent-600 dark:text-accent-400">{totalEligible}</span> violation{totalEligible !== 1 ? 's' : ''} eligible for DataQ challenges
                {totalSavings > 0 && (
                  <> | Estimated savings: <span className="font-semibold text-accent-600 dark:text-accent-400">~{totalSavings} CSA points</span></>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={fetchOpportunities}
            className="btn btn-secondary text-sm"
          >
            <FiTarget className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Score legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 px-1">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Challenge Score:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> 8-10 High Chance
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> 5-7 Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> 1-4 Low Chance
        </span>
      </div>

      {/* Violation cards */}
      <div className="space-y-3">
        {enriched.map(({ violation, challengeScore, csaImpact }) => (
          <ViolationCard
            key={violation._id}
            violation={violation}
            challengeScore={challengeScore}
            csaImpact={csaImpact}
            onGeneratePetition={handleGeneratePetition}
          />
        ))}
      </div>
    </div>
  );
};

export default DataQIntelligencePanel;
