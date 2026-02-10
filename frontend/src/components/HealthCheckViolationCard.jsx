import { formatDate, basicCategories } from '../utils/helpers';
import {
  FiChevronRight, FiAlertTriangle, FiCheckCircle, FiClock,
  FiUser, FiTarget, FiTrendingDown, FiFileText, FiEdit3, FiXCircle,
  FiDollarSign
} from 'react-icons/fi';
import ScoreImpactCard from './ScoreImpactCard';
import RegulationPanel from './RegulationPanel';
import StateIntelligencePanel from './StateIntelligencePanel';

const categoryColors = {
  easy_win: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  worth_challenging: { bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  expiring_soon: { bar: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  unlikely: { bar: 'bg-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' }
};

const basicBadgeColors = {
  unsafe_driving: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  hours_of_service: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  vehicle_maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  controlled_substances: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  driver_fitness: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  crash_indicator: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  hazmat: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
};

const categoryLabels = {
  easy_win: 'Easy Win',
  worth_challenging: 'Worth Challenging',
  expiring_soon: 'Expiring Soon',
  unlikely: 'Unlikely'
};

const recommendationColors = {
  strong: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  worth_trying: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  weak: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  not_recommended: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
};

const breakdownLabels = {
  violationTypeScore: 'Violation Type',
  evidenceScore: 'Evidence',
  timeScore: 'Recency',
  stateScore: 'State Factor',
  csaImpactScore: 'CSA Impact',
  errorProneBonus: 'Error-Prone Code',
  flagBonus: 'Flag Strength',
  penaltyDeductions: 'Penalties'
};

const flagIcons = {
  wrongCarrier: FiXCircle,
  duplicateViolation: FiAlertTriangle,
  duplicate: FiAlertTriangle,
  highSeverityWeight: FiTarget,
  courtDismissable: FiCheckCircle,
  courtDismissal: FiCheckCircle,
  expiringFromCSA: FiClock,
  proceduralError: FiFileText,
  staleViolation: FiClock,
  timeDecay: FiClock,
  nonReportableCrash: FiAlertTriangle,
  cpdpEligible: FiCheckCircle
};

const normalizeCheckEntries = (rawChecks) => {
  if (Array.isArray(rawChecks)) {
    return rawChecks.filter((check) => check && typeof check === 'object');
  }

  if (rawChecks && typeof rawChecks === 'object') {
    return Object.entries(rawChecks)
      .filter(([, value]) => value && typeof value === 'object')
      .map(([check, value]) => ({ check, ...value }));
  }

  return [];
};

const normalizeFlagEntries = (rawFlags) => {
  if (Array.isArray(rawFlags)) {
    return rawFlags.filter((flag) => flag && typeof flag === 'object');
  }

  if (rawFlags && typeof rawFlags === 'object') {
    return Object.entries(rawFlags)
      .filter(([, value]) => value && typeof value === 'object')
      .map(([check, value]) => ({ check, ...value }));
  }

  return [];
};

const HealthCheckViolationCard = ({ violation, onChallenge, onRecordCourtOutcome, expanded, onToggleExpand }) => {
  const scan = violation.scanResults || {};
  const cat = scan.category || 'unlikely';
  const colors = categoryColors[cat] || categoryColors.unlikely;
  const flags = normalizeFlagEntries(scan.flags);
  const checks = normalizeCheckEntries(scan.checks);
  const csaImpact = scan.csaImpact || scan.removalImpact || {};
  const recommendation = scan.recommendation;
  const roiEstimate = scan.roiEstimate;
  const triageBreakdown = scan.triageBreakdown;

  const flaggedChecks = checks.filter(c => c.flagged);
  const unflaggedChecks = checks.filter(c => !c.flagged);

  const driverName = violation.driver
    ? `${violation.driver.firstName || ''} ${violation.driver.lastName || ''}`.trim()
    : null;

  return (
    <div className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      {/* Main Row */}
      <div className="flex items-stretch">
        {/* Color Bar */}
        <div className={`w-1 flex-shrink-0 ${colors.bar}`} />

        <div className="flex-grow p-4 flex items-center gap-4 min-w-0">
          {/* Priority Score */}
          <div className="flex-shrink-0">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${colors.bg}`}>
              <span className={`text-lg font-bold ${colors.text}`}>
                {scan.priorityScore || 0}
              </span>
            </div>
          </div>

          {/* Violation Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-zinc-900 dark:text-white truncate">
                {violation.violationType || violation.violationCode || 'Unknown Violation'}
              </span>
              {violation.violationCode && violation.violationType && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                  {violation.violationCode}
                </span>
              )}
              {violation.outOfService && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400">
                  OOS
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5" />
                {formatDate(violation.violationDate)}
              </span>
              {violation.basic && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${basicBadgeColors[violation.basic] || 'bg-zinc-100 text-zinc-600'}`}>
                  {basicCategories[violation.basic]?.label || violation.basic.replace(/_/g, ' ')}
                </span>
              )}
              {driverName && (
                <span className="flex items-center gap-1">
                  <FiUser className="w-3.5 h-3.5" />
                  {driverName}
                </span>
              )}
              {violation.severityWeight > 0 && (
                <span className="text-xs text-zinc-400">
                  Severity: {violation.severityWeight}/10
                </span>
              )}
            </div>

            {/* Flag Pills */}
            {flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {flags.map((flag, idx) => {
                  const FlagIcon = flagIcons[flag.check] || FiAlertTriangle;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
                    >
                      <FlagIcon className="w-3 h-3" />
                      {flag.label || flag.check?.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Badge + Recommendation + Expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
              {categoryLabels[cat]}
            </span>
            {recommendation && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${recommendationColors[recommendation.action] || recommendationColors.weak}`}>
                {recommendation.label}
              </span>
            )}
            {csaImpact.currentPercent != null && (
              <span className="hidden sm:inline text-xs text-zinc-400 dark:text-zinc-500">
                CSA: {csaImpact.currentPercent}%
              </span>
            )}
            <button
              onClick={onToggleExpand}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <FiChevronRight className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 ml-1">
          <div className="ml-14 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-4">
            {/* Flagged Checks */}
            {flaggedChecks.length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Flagged Issues</p>
                <div className="space-y-2">
                  {flaggedChecks.map((check, idx) => {
                    const CheckIcon = flagIcons[check.check] || FiAlertTriangle;
                    return (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${colors.bg}`}>
                        <CheckIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${colors.text}`}>
                              {check.label || check.check?.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            {check.confidence && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                check.confidence === 'high'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                  : check.confidence === 'medium'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                                {check.confidence}
                              </span>
                            )}
                          </div>
                          {check.reason && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{check.reason}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unflagged Checks */}
            {unflaggedChecks.length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Other Checks</p>
                <div className="flex flex-wrap gap-2">
                  {unflaggedChecks.map((check, idx) => (
                    <span key={idx} className="text-xs text-zinc-400 dark:text-zinc-500 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800">
                      {check.label || check.check?.replace(/([A-Z])/g, ' $1').trim()} - Passed
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CSA Impact Detail */}
            {csaImpact.currentPercent != null && (
              <div className={`p-3 rounded-lg border ${
                csaImpact.crossesThreshold
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-info-50 dark:bg-info-500/10 border-info-200 dark:border-info-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <FiTrendingDown className={`w-4 h-4 ${
                    csaImpact.crossesThreshold ? 'text-emerald-600 dark:text-emerald-400' : 'text-info-600 dark:text-info-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    csaImpact.crossesThreshold ? 'text-emerald-700 dark:text-emerald-400' : 'text-info-700 dark:text-info-400'
                  }`}>
                    CSA Impact
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Current: <span className="font-semibold">{csaImpact.currentPercent}%</span>
                  {' '}&rarr;{' '}
                  Projected: <span className="font-semibold">{csaImpact.projectedPercent}%</span>
                  {csaImpact.pointsRemoved > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                      (-{csaImpact.pointsRemoved} points)
                    </span>
                  )}
                </p>
                {csaImpact.crossesThreshold && (
                  <div className="mt-2 p-2 rounded bg-emerald-100 dark:bg-emerald-500/20">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Removing this violation would drop your BASIC below the alert threshold
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ROI Estimate */}
            {roiEstimate && roiEstimate.estimatedAnnualSavings > 0 && (
              <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <FiDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Estimated ROI
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Est. annual insurance savings:{' '}
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    ${roiEstimate.estimatedAnnualSavings.toLocaleString()}
                  </span>
                  {roiEstimate.pointsRemoved > 0 && (
                    <span className="ml-2 text-zinc-500">
                      ({roiEstimate.pointsRemoved} points &middot; {roiEstimate.percentileChange}% change)
                    </span>
                  )}
                </p>
                {roiEstimate.crossesThreshold && roiEstimate.thresholdCrossed && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Crosses {roiEstimate.thresholdCrossed} BASIC threshold
                  </p>
                )}
              </div>
            )}

            {/* Triage Score Breakdown */}
            {triageBreakdown && (
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Score Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(triageBreakdown).map(([key, value]) => {
                    if (value === 0 || value == null) return null;
                    const isPositive = value > 0;
                    return (
                      <div key={key} className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {breakdownLabels[key] || key}
                        </span>
                        <span className={`font-semibold ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? '+' : ''}{value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Decay Info */}
            {scan.timeDecay && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                <FiClock className="w-3.5 h-3.5 inline mr-1" />
                Time decay: {scan.timeDecay.monthsOld} months old
                {scan.timeDecay.monthsUntilExpiry != null && (
                  <span> &middot; Expires from CSA in {scan.timeDecay.monthsUntilExpiry} months</span>
                )}
              </div>
            )}

            {/* Recommendation Reason */}
            {recommendation?.reason && (
              <div className={`text-sm p-2 rounded ${recommendationColors[recommendation.action] || 'bg-zinc-50 dark:bg-zinc-800'}`}>
                {recommendation.reason}
              </div>
            )}

            {/* Regulation Reference Panel */}
            {violation.violationCode && (
              <RegulationPanel violationCode={violation.violationCode} />
            )}

            {/* State Intelligence Panel */}
            {violation.inspectionState && (
              <StateIntelligencePanel
                stateCode={violation.inspectionState}
                challengeType={violation.dataQChallenge?.challengeType}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onChallenge}
                className="btn btn-primary"
              >
                <FiFileText className="w-4 h-4" />
                Challenge This
              </button>
              <button
                onClick={onRecordCourtOutcome}
                className="btn btn-secondary"
              >
                <FiEdit3 className="w-4 h-4" />
                Record Court Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthCheckViolationCard;
