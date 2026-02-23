import { FiShield } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';

const VehicleSafetyTab = ({ vehicle, oosData, oosLoading }) => {
  return (
    <div className="space-y-6">
      {/* Vehicle Safety - OOS Rate */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FiShield className="w-4 h-4 text-primary-500" />
            Safety Record
          </h3>
          {oosData && oosData.totalViolations > 0 && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              oosData.oosRate > 20 ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20' :
              oosData.oosRate > 10 ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20' :
              'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20'
            }`}>
              {oosData.oosRate.toFixed(1)}% OOS Rate
            </span>
          )}
        </div>
        <div className="card-body">
          {oosLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : oosData && oosData.totalViolations > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{oosData.totalViolations}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Violations</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{oosData.oosViolations}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Out of Service</p>
                </div>
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <p className={`text-3xl font-bold ${
                    oosData.oosRate > 20 ? 'text-red-600 dark:text-red-400' :
                    oosData.oosRate > 10 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>{oosData.oosRate.toFixed(1)}%</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">OOS Rate</p>
                </div>
              </div>

              {/* BASIC Breakdown */}
              {oosData.basicBreakdown && Object.keys(oosData.basicBreakdown).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">BASIC Categories</p>
                  <div className="space-y-2">
                    {Object.entries(oosData.basicBreakdown)
                      .filter(([, data]) => data.count > 0)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([basic, data]) => (
                        <div key={basic} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">{data.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{data.count} violations</span>
                            {data.oosCount > 0 && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded">
                                {data.oosCount} OOS
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recent Violations */}
              {oosData.recentViolations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">Recent Violations</p>
                  <div className="space-y-2">
                    {oosData.recentViolations.map((violation) => (
                      <div key={violation._id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{violation.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(violation.date)}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">&bull;</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{violation.basic?.replace('_', ' ')}</span>
                            {violation.outOfService && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded">OOS</span>
                            )}
                          </div>
                          {violation.driver && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              Driver: {violation.driver.firstName} {violation.driver.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                <FiShield className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Clean Record</h3>
              <p className="text-zinc-500 dark:text-zinc-400">No violations linked to this vehicle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleSafetyTab;
