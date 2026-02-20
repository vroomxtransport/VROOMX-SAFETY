import { FiX, FiAlertTriangle, FiUser, FiTruck, FiCalendar, FiHash, FiTarget, FiZap, FiTrendingDown, FiFileText, FiMapPin, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatDate, basicCategories, getSeverityColor } from '../utils/helpers';
import StatusBadge from './StatusBadge';

const ViolationDetailModal = ({ violation, onClose }) => {
  if (!violation) return null;

  const basicLabel = basicCategories[violation.basic]?.label || violation.basic?.replace(/_/g, ' ') || 'Unknown';
  const sevColor = getSeverityColor(violation.severityWeight);
  const challenge = violation.dataQChallenge;
  const analysis = challenge?.aiAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Violation Details</h2>
            <p className="text-sm text-zinc-500">{violation.violationCode || 'No code'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
              <div className="mt-1"><StatusBadge status={violation.status} /></div>
            </div>
            <div className={`p-3 rounded-xl border ${
              violation.severityWeight >= 8 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
              violation.severityWeight >= 4 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
              'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
            }`}>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Severity Weight</p>
              <p className={`text-2xl font-bold ${
                violation.severityWeight >= 8 ? 'text-red-600' :
                violation.severityWeight >= 4 ? 'text-amber-600' : 'text-emerald-600'
              }`}>{violation.severityWeight || 0}</p>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">BASIC Category</p>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mt-1 capitalize">{basicLabel}</p>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Flags</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {violation.outOfService && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">OOS</span>
                )}
                {violation.isMoving && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">MOVING</span>
                )}
                {!violation.outOfService && !violation.isMoving && (
                  <span className="text-sm text-zinc-400">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Violation Information */}
          <div>
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <FiAlertTriangle className="w-4 h-4" /> Violation Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Date</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{formatDate(violation.violationDate)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Violation Code</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-100">{violation.violationCode || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Violation Type</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{violation.violationType || '-'}</span>
              </div>
              {violation.cfrReference && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">CFR Reference</span>
                  <span className="font-mono font-medium text-zinc-800 dark:text-zinc-100">{violation.cfrReference}</span>
                </div>
              )}
              {violation.inspectionReport && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">Report Number</span>
                  <span className="font-mono font-medium text-zinc-800 dark:text-zinc-100">{violation.inspectionReport}</span>
                </div>
              )}
              {violation.state && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">State</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{violation.state}</span>
                </div>
              )}
              {violation.location && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">Location</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{violation.location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {violation.description && (
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500 block text-xs mb-1">Description</span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{violation.description}</p>
              </div>
            )}
          </div>

          {/* Driver & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5" /> Driver
              </h4>
              {violation.driverId ? (
                <Link
                  to={`/app/drivers/${violation.driverId._id || violation.driverId}`}
                  className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                  {violation.driverId.firstName} {violation.driverId.lastName}
                </Link>
              ) : (
                <span className="text-sm text-zinc-400 italic">Unassigned</span>
              )}
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                <FiTruck className="w-3.5 h-3.5" /> Vehicle
              </h4>
              {violation.vehicleId ? (
                <Link
                  to={`/app/vehicles/${violation.vehicleId._id || violation.vehicleId}`}
                  className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                  {violation.vehicleId.unitNumber || violation.vehicleId.vin || 'View Vehicle'}
                </Link>
              ) : (
                <span className="text-sm text-zinc-400 italic">Not linked</span>
              )}
            </div>
          </div>

          {/* DataQ Challenge Info */}
          {(challenge || analysis) && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiTarget className="w-4 h-4" /> DataQ Challenge
              </h3>
              <div className="space-y-3">
                {/* Challenge Status */}
                {challenge?.status && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 block text-xs mb-0.5">Challenge Status</span>
                      <StatusBadge status={challenge.status} />
                    </div>
                    {challenge.challengeType && (
                      <div>
                        <span className="text-zinc-500 block text-xs mb-0.5">Challenge Type</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-100 capitalize">{challenge.challengeType.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {challenge.submittedDate && (
                      <div>
                        <span className="text-zinc-500 block text-xs mb-0.5">Submitted</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-100">{formatDate(challenge.submittedDate)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Analysis */}
                {analysis && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FiZap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-sm">AI Challenge Analysis</span>
                      <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded ${
                        analysis.score >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        analysis.score >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                      }`}>
                        Score: {analysis.score}
                      </span>
                    </div>
                    {analysis.factors?.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Challenge Factors:</span>
                        <ul className="mt-1 space-y-1">
                          {analysis.factors.map((f, i) => (
                            <li key={i} className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5">+</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.estimatedCSAImpact && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <FiTrendingDown className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          Est. CSA impact: <strong>-{analysis.estimatedCSAImpact} points</strong> in {basicLabel}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Challenge Reason */}
                {challenge?.reason && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-500 block text-xs mb-1">Challenge Reason</span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{challenge.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {violation.notes && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiFileText className="w-4 h-4" /> Notes
              </h3>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{violation.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationDetailModal;
