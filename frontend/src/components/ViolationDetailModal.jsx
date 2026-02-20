import { FiX, FiAlertTriangle, FiUser, FiTruck, FiTarget, FiZap, FiTrendingDown, FiFileText, FiMapPin, FiShield, FiDollarSign, FiClock, FiCheckCircle, FiClipboard, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatDate, basicCategories } from '../utils/helpers';
import StatusBadge from './StatusBadge';

const INSPECTION_TYPE_LABELS = {
  roadside: 'Roadside',
  terminal: 'Terminal',
  post_crash: 'Post-Crash',
  complaint: 'Complaint'
};

const INSPECTION_LEVEL_LABELS = {
  1: 'Level 1 - Full',
  2: 'Level 2 - Walk-Around',
  3: 'Level 3 - Driver Only',
  4: 'Level 4 - Special',
  5: 'Level 5 - Vehicle Only',
  6: 'Level 6 - Enhanced NAS'
};

const InfoField = ({ label, value, mono }) => {
  if (!value && value !== 0) return null;
  return (
    <div>
      <span className="text-zinc-500 block text-xs mb-0.5">{label}</span>
      <span className={`font-medium text-zinc-800 dark:text-zinc-100 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
};

const ViolationDetailModal = ({ violation, onClose }) => {
  if (!violation) return null;

  const basicLabel = basicCategories[violation.basic]?.label || violation.basic?.replace(/_/g, ' ') || 'Unknown';
  const challenge = violation.dataQChallenge;
  const analysis = challenge?.aiAnalysis;
  const scan = violation.scanResults;
  const loc = violation.location;
  const locationStr = loc
    ? [loc.address, loc.city, loc.state].filter(Boolean).join(', ')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Violation Details</h2>
            <p className="text-sm text-zinc-500">
              {violation.violationCode ? `Code: ${violation.violationCode}` : ''}
              {violation.inspectionNumber ? ` | Inspection: ${violation.inspectionNumber}` : ''}
            </p>
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Weighted Severity</p>
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{violation.weightedSeverity?.toFixed(1) || '-'}</p>
              <p className="text-[10px] text-zinc-400">with time decay</p>
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
                {violation.crashRelated && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">CRASH</span>
                )}
                {!violation.outOfService && !violation.isMoving && !violation.crashRelated && (
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
              <InfoField label="Date" value={formatDate(violation.violationDate)} />
              <InfoField label="Violation Code" value={violation.violationCode} mono />
              <InfoField label="Violation Type" value={violation.violationType} />
              <InfoField label="BASIC Category" value={basicLabel} />
              <InfoField label="Age" value={violation.ageInDays ? `${violation.ageInDays} days` : null} />
              <InfoField label="Source" value={violation.syncMetadata?.source?.replace(/_/g, ' ')} />
            </div>
            {violation.description && (
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500 block text-xs mb-1">Description</span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{violation.description}</p>
              </div>
            )}
          </div>

          {/* Inspection Context */}
          <div>
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <FiClipboard className="w-4 h-4" /> Inspection Context
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoField label="Inspection Number" value={violation.inspectionNumber} mono />
              <InfoField label="Inspection Type" value={INSPECTION_TYPE_LABELS[violation.inspectionType] || violation.inspectionType} />
              <InfoField label="Inspection Level" value={INSPECTION_LEVEL_LABELS[violation.inspectionLevel] || (violation.inspectionLevel ? `Level ${violation.inspectionLevel}` : null)} />
              <InfoField label="Inspector" value={violation.inspectorName} />
              <InfoField label="Badge #" value={violation.inspectorBadge} mono />
              <InfoField label="Issuing Agency" value={violation.issuingAgency} />
            </div>
          </div>

          {/* Location */}
          {locationStr && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" /> Location
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoField label="City" value={loc.city} />
                <InfoField label="State" value={loc.state} />
                <InfoField label="Address" value={loc.address} />
              </div>
            </div>
          )}

          {/* Driver & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5" /> Driver
              </h4>
              {violation.driverId && typeof violation.driverId === 'object' ? (
                <div>
                  <Link
                    to={`/app/drivers/${violation.driverId._id}`}
                    className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                  >
                    {violation.driverId.firstName} {violation.driverId.lastName}
                  </Link>
                  {violation.driverId.employeeId && (
                    <p className="text-xs text-zinc-400 mt-0.5">ID: {violation.driverId.employeeId}</p>
                  )}
                  {violation.linkingMetadata?.driverConfidence && (
                    <p className="text-xs text-zinc-400 mt-0.5">Match confidence: {violation.linkingMetadata.driverConfidence}%</p>
                  )}
                </div>
              ) : (
                <span className="text-sm text-zinc-400 italic">Unassigned</span>
              )}
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-xs font-medium text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                <FiTruck className="w-3.5 h-3.5" /> Vehicle
              </h4>
              {violation.vehicleId && typeof violation.vehicleId === 'object' ? (
                <div>
                  <Link
                    to={`/app/vehicles/${violation.vehicleId._id}`}
                    className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                  >
                    {violation.vehicleId.unitNumber || 'View Vehicle'}
                  </Link>
                  {violation.vehicleId.vin && (
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">VIN: {violation.vehicleId.vin}</p>
                  )}
                  {(violation.vehicleId.make || violation.vehicleId.model) && (
                    <p className="text-xs text-zinc-400 mt-0.5">{[violation.vehicleId.make, violation.vehicleId.model].filter(Boolean).join(' ')}</p>
                  )}
                </div>
              ) : (
                <span className="text-sm text-zinc-400 italic">Not linked</span>
              )}
            </div>
          </div>

          {/* Financial Impact */}
          {(violation.fineAmount > 0 || violation.finePaid) && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" /> Financial Impact
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoField label="Fine Amount" value={violation.fineAmount ? `$${violation.fineAmount.toLocaleString()}` : null} />
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">Payment Status</span>
                  <span className={`font-medium ${violation.finePaid ? 'text-green-600' : 'text-red-600'}`}>
                    {violation.finePaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <InfoField label="Payment Date" value={violation.paymentDate ? formatDate(violation.paymentDate) : null} />
              </div>
            </div>
          )}

          {/* Health Check / Scan Results */}
          {scan?.recommendation && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiShield className="w-4 h-4" /> Health Check Analysis
              </h3>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      scan.category === 'easy_win' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      scan.category === 'worth_challenging' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      scan.category === 'expiring_soon' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}>
                      {scan.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Priority: {scan.priorityScore}/100</span>
                  </div>
                  {scan.flagCount > 0 && (
                    <span className="text-xs font-medium text-amber-600">{scan.flagCount} flag{scan.flagCount > 1 ? 's' : ''} found</span>
                  )}
                </div>
                {scan.recommendation?.reason && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{scan.recommendation.reason}</p>
                )}
                {scan.removalImpact && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <div>
                      <span className="text-xs text-zinc-500">Points Removed</span>
                      <p className="text-sm font-bold text-green-600">-{scan.removalImpact.pointsRemoved}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Percentile Change</span>
                      <p className="text-sm font-bold text-green-600">{scan.removalImpact.percentileChange > 0 ? '-' : ''}{Math.abs(scan.removalImpact.percentileChange)}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Current Percentile</span>
                      <p className="text-sm font-medium">{scan.removalImpact.currentPercentile}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Projected</span>
                      <p className="text-sm font-medium">{scan.removalImpact.projectedPercentile}%</p>
                    </div>
                  </div>
                )}
                {scan.roiEstimate?.estimatedAnnualSavings > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <FiDollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Est. annual savings: <strong className="text-green-600">${scan.roiEstimate.estimatedAnnualSavings.toLocaleString()}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DataQ Challenge Info */}
          {(challenge?.submitted || analysis) && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiTarget className="w-4 h-4" /> DataQ Challenge
              </h3>
              <div className="space-y-3">
                {challenge?.status && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 block text-xs mb-0.5">Challenge Status</span>
                      <StatusBadge status={challenge.status} />
                    </div>
                    <InfoField label="Challenge Type" value={challenge.challengeType?.replace(/_/g, ' ')} />
                    <InfoField label="RDR Type" value={challenge.rdrType} />
                    <InfoField label="Case Number" value={challenge.caseNumber} mono />
                    <InfoField label="Submitted" value={challenge.submissionDate ? formatDate(challenge.submissionDate) : null} />
                    <InfoField label="Response Date" value={challenge.responseDate ? formatDate(challenge.responseDate) : null} />
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
                        Score: {analysis.score} | {analysis.confidence || 'N/A'}
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
                    {analysis.recommendation && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Recommendation: <strong className="capitalize">{analysis.recommendation.replace(/_/g, ' ')}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Evidence Checklist */}
                {challenge?.evidenceChecklist?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Evidence Checklist:</p>
                    <div className="space-y-1.5">
                      {challenge.evidenceChecklist.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {ev.obtained ? (
                            <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />
                          )}
                          <span className={ev.obtained ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}>{ev.item}</span>
                          {ev.required && <span className="text-[10px] text-red-500 font-medium">REQUIRED</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {challenge?.reason && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-500 block text-xs mb-1">Challenge Reason</span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{challenge.reason}</p>
                  </div>
                )}

                {challenge?.responseNotes && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-500 block text-xs mb-1">Response Notes</span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{challenge.responseNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attached Documents */}
          {violation.documents?.length > 0 && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiFileText className="w-4 h-4" /> Documents ({violation.documents.length})
              </h3>
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Uploaded</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {violation.documents.map((doc, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-100">{doc.name || 'Document'}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 capitalize">{doc.type?.replace(/_/g, ' ') || '-'}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{doc.uploadDate ? formatDate(doc.uploadDate) : '-'}</td>
                        <td className="px-4 py-3">
                          {doc.documentUrl && (
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:text-accent-700">
                              <FiExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resolution */}
          {violation.resolution?.action && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4" /> Resolution
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoField label="Action Taken" value={violation.resolution.action} />
                <InfoField label="Resolved Date" value={violation.resolution.date ? formatDate(violation.resolution.date) : null} />
              </div>
              {violation.resolution.notes && (
                <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-500 block text-xs mb-1">Resolution Notes</span>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{violation.resolution.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {violation.notes?.length > 0 && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiFileText className="w-4 h-4" /> Notes ({violation.notes.length})
              </h3>
              <div className="space-y-2">
                {violation.notes.map((note, i) => (
                  <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{note.content}</p>
                    {note.createdAt && (
                      <p className="text-[10px] text-zinc-400 mt-1">{formatDate(note.createdAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History / Audit Trail */}
          {violation.history?.length > 0 && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiClock className="w-4 h-4" /> History
              </h3>
              <div className="space-y-0">
                {violation.history.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{entry.action}</p>
                      {entry.notes && <p className="text-xs text-zinc-500 mt-0.5">{entry.notes}</p>}
                      <p className="text-[10px] text-zinc-400 mt-0.5">{entry.date ? formatDate(entry.date) : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationDetailModal;
