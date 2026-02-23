import { Link } from 'react-router-dom';
import { formatDate, basicCategories } from '../../utils/helpers';
import {
  FiShield, FiLink, FiClipboard, FiTruck, FiCheck, FiAlertCircle,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';

const DriverSafetyTab = ({ driver, driverId, csaData, csaLoading, expandedDvir, setExpandedDvir, onUnlinkViolation, getRiskColor }) => {
  return (
    <div className="space-y-6">
      {/* CSA Impact */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FiShield className="w-4 h-4 text-primary-500" />
            CSA Impact
          </h3>
          {csaData && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(csaData.riskLevel)}`}>
              {csaData.riskLevel} Risk
            </span>
          )}
        </div>
        <div className="card-body">
          {csaLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : csaData && csaData.totalViolations > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{csaData.totalViolations}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Violations</p>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{Math.round(csaData.totalPoints)}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Points</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{csaData.oosViolations}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Out of Service</p>
                </div>
              </div>

              {/* BASIC Breakdown */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">BASIC Categories</p>
                <div className="space-y-2">
                  {Object.entries(csaData.basicBreakdown || {})
                    .filter(([, data]) => data.count > 0)
                    .sort((a, b) => b[1].weightedPoints - a[1].weightedPoints)
                    .map(([basic, data]) => (
                      <div key={basic} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{data.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{data.count} violations</span>
                          <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">{Math.round(data.weightedPoints)} pts</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Violations */}
              {csaData.recentViolations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">Recent Violations</p>
                  <div className="space-y-2">
                    {csaData.recentViolations.map((violation) => (
                      <div key={violation._id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{violation.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(violation.date)}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">&bull;</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{basicCategories?.[violation.basic]?.label || violation.basic?.replace('_', ' ')}</span>
                            {violation.outOfService && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded">OOS</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="font-mono text-sm text-zinc-600 dark:text-zinc-300">{violation.severityWeight} pts</span>
                          <button
                            onClick={() => onUnlinkViolation(violation._id)}
                            className="p-1.5 text-zinc-400 hover:text-warning-600 dark:hover:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-500/20 rounded transition-colors"
                            title="Unlink violation"
                          >
                            <FiLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={`/app/violations?driverId=${driverId}`}
                    className="mt-4 block text-center text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300"
                  >
                    View all violations →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                <FiShield className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Clean Record</h3>
              <p className="text-zinc-500 dark:text-zinc-400">No violations linked to this driver</p>
            </div>
          )}
        </div>
      </div>

      {/* Samsara DVIRs */}
      {driver.samsaraId && (
        <div className="card border-l-4 border-l-orange-500">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/images/integrations/samsara.svg" alt="Samsara" className="w-5 h-5" />
              <h3 className="font-semibold">Recent DVIRs</h3>
            </div>
            {driver.samsaraDvirs?.length > 0 && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {driver.samsaraDvirs.length} inspection{driver.samsaraDvirs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="card-body">
            {driver.samsaraDvirs?.length > 0 ? (
              <div className="space-y-3">
                {driver.samsaraDvirs
                  .slice()
                  .sort((a, b) => new Date(b.inspectedAt) - new Date(a.inspectedAt))
                  .slice(0, 10)
                  .map((dvir, index) => (
                    <div
                      key={dvir.samsaraId || index}
                      className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                    >
                      {/* DVIR Header */}
                      <div
                        className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                        onClick={() => setExpandedDvir(expandedDvir === dvir.samsaraId ? null : dvir.samsaraId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            dvir.defectsFound
                              ? 'bg-yellow-100 dark:bg-yellow-500/20'
                              : 'bg-green-100 dark:bg-green-500/20'
                          }`}>
                            <FiClipboard className={`w-5 h-5 ${
                              dvir.defectsFound
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white text-sm">
                              {dvir.inspectionType === 'pre_trip' ? 'Pre-Trip' : dvir.inspectionType === 'post_trip' ? 'Post-Trip' : 'Inspection'}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatDate(dvir.inspectedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                              <FiTruck className="w-3.5 h-3.5" />
                              <span>{dvir.vehicleName}</span>
                            </div>
                            {dvir.defectsFound ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                                {dvir.defects?.length || 0} defect{(dvir.defects?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                                No defects
                              </span>
                            )}
                          </div>
                          {expandedDvir === dvir.samsaraId ? (
                            <FiChevronUp className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <FiChevronDown className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded DVIR Details */}
                      {expandedDvir === dvir.samsaraId && (
                        <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
                          {/* Safe to Operate */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Safe to Operate</span>
                            <span className={`text-sm font-medium ${
                              dvir.safeToOperate
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {dvir.safeToOperate ? 'Yes' : 'No'}
                            </span>
                          </div>

                          {/* Location */}
                          {dvir.location?.address && (
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">Location</span>
                              <a
                                href={`https://www.google.com/maps?q=${dvir.location.latitude},${dvir.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent-600 hover:underline text-right max-w-[200px]"
                              >
                                {dvir.location.address}
                              </a>
                            </div>
                          )}

                          {/* Defects List */}
                          {dvir.defects?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                Defects Found
                              </p>
                              <div className="space-y-2">
                                {dvir.defects.map((defect, dIndex) => (
                                  <div
                                    key={dIndex}
                                    className={`p-2 rounded-lg text-sm ${
                                      defect.resolved
                                        ? 'bg-green-50 dark:bg-green-500/10'
                                        : 'bg-yellow-50 dark:bg-yellow-500/10'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <span className="font-medium text-zinc-900 dark:text-white">
                                          {defect.category}
                                        </span>
                                        {defect.isMajor && (
                                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                                            Major
                                          </span>
                                        )}
                                        <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-0.5">
                                          {defect.description}
                                        </p>
                                      </div>
                                      {defect.resolved ? (
                                        <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <FiAlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiClipboard className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No DVIRs synced yet</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">DVIRs will appear after syncing with Samsara</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSafetyTab;
