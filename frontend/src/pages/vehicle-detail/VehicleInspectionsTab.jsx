import { useState, useEffect } from 'react';
import { FiClipboard, FiCalendar, FiSettings, FiAlertTriangle, FiInbox } from 'react-icons/fi';
import { formatDate, daysUntilExpiry } from '../../utils/helpers';
import { vehiclesAPI } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';

const VehicleInspectionsTab = ({ vehicle, onRecordInspection }) => {
  const inspectionDays = daysUntilExpiry(vehicle.annualInspection?.nextDueDate);
  const pmDays = daysUntilExpiry(vehicle.pmSchedule?.nextPmDueDate);
  const [violations, setViolations] = useState([]);
  const [loadingViolations, setLoadingViolations] = useState(true);

  useEffect(() => {
    if (vehicle?._id) {
      vehiclesAPI.getViolations(vehicle._id)
        .then(res => setViolations(res.data?.violations || []))
        .catch(() => setViolations([]))
        .finally(() => setLoadingViolations(false));
    }
  }, [vehicle?._id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annual Inspection Card */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FiClipboard className="w-4 h-4 text-primary-500" />
              Annual Inspection
            </h3>
            <button
              onClick={onRecordInspection}
              className="btn btn-sm btn-outline"
            >
              Record New
            </button>
          </div>
          <div className="card-body">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                inspectionDays !== null && inspectionDays < 0 ? 'bg-red-100 dark:bg-red-500/20' :
                inspectionDays !== null && inspectionDays <= 30 ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-green-100 dark:bg-green-500/20'
              }`}>
                <FiCalendar className={`w-10 h-10 ${
                  inspectionDays !== null && inspectionDays < 0 ? 'text-red-600 dark:text-red-400' :
                  inspectionDays !== null && inspectionDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <p className={`mt-3 text-lg font-semibold ${
                inspectionDays !== null && inspectionDays < 0 ? 'text-red-600 dark:text-red-400' :
                inspectionDays !== null && inspectionDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {inspectionDays === null ? 'Not scheduled' :
                 inspectionDays < 0 ? `${Math.abs(inspectionDays)} days overdue` :
                 inspectionDays === 0 ? 'Due today' :
                 `${inspectionDays} days remaining`}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Last Inspection</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatDate(vehicle.annualInspection?.lastInspectionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Next Due</span>
                <span className={inspectionDays !== null && inspectionDays < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-900 dark:text-zinc-100'}>
                  {formatDate(vehicle.annualInspection?.nextDueDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Last Result</span>
                <StatusBadge status={vehicle.annualInspection?.result === 'pass' ? 'valid' : 'warning'} />
              </div>
            </div>
          </div>
        </div>

        {/* PM Schedule Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold flex items-center gap-2">
              <FiSettings className="w-4 h-4 text-primary-500" />
              PM Schedule
            </h3>
          </div>
          <div className="card-body">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                pmDays !== null && pmDays < 0 ? 'bg-red-100 dark:bg-red-500/20' :
                pmDays !== null && pmDays <= 30 ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-green-100 dark:bg-green-500/20'
              }`}>
                <FiSettings className={`w-10 h-10 ${
                  pmDays !== null && pmDays < 0 ? 'text-red-600 dark:text-red-400' :
                  pmDays !== null && pmDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <p className={`mt-3 text-lg font-semibold ${
                pmDays !== null && pmDays < 0 ? 'text-red-600 dark:text-red-400' :
                pmDays !== null && pmDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {pmDays === null ? 'Not scheduled' :
                 pmDays < 0 ? `${Math.abs(pmDays)} days overdue` :
                 pmDays === 0 ? 'Due today' :
                 `${pmDays} days remaining`}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Last PM</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatDate(vehicle.pmSchedule?.lastPmDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Next PM Due</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatDate(vehicle.pmSchedule?.nextPmDueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Interval</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {vehicle.pmSchedule?.intervalMiles?.toLocaleString() || 25000} mi / {vehicle.pmSchedule?.intervalDays || 90} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Status</span>
                <StatusBadge status={vehicle.complianceStatus?.pmStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DOT Inspection History - Cross-Entity Linked */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-primary-500" />
            DOT Inspection History
            {violations.length > 0 && (
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-normal">
                {violations.length}
              </span>
            )}
          </h3>
        </div>
        <div className="card-body p-0">
          {loadingViolations ? (
            <div className="p-8 text-center text-zinc-500">Loading inspection history...</div>
          ) : violations.length === 0 ? (
            <div className="p-8 flex flex-col items-center text-center">
              <FiInbox className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-zinc-500 dark:text-zinc-400">No DOT inspections linked to this vehicle</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">Inspection #</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">BASIC</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">Description</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">Severity</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500 uppercase">OOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {violations.slice(0, 20).map((v) => (
                    <tr key={v._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-2.5 text-sm font-mono text-zinc-700 dark:text-zinc-300">{formatDate(v.inspectionDate || v.date)}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-zinc-600 dark:text-zinc-400">{v.inspectionNumber || '-'}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-medium">
                          {v.basicCategory || v.category || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 max-w-xs truncate">{v.description || v.violationDescription || '-'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium ${
                          v.severityWeight >= 8 ? 'text-red-600 dark:text-red-400' :
                          v.severityWeight >= 4 ? 'text-orange-600 dark:text-orange-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {v.severityWeight || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {v.outOfService ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-medium">OOS</span>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleInspectionsTab;
