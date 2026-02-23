import { FiClipboard, FiCalendar, FiSettings } from 'react-icons/fi';
import { formatDate, daysUntilExpiry } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';

const VehicleInspectionsTab = ({ vehicle, onRecordInspection }) => {
  const inspectionDays = daysUntilExpiry(vehicle.annualInspection?.nextDueDate);
  const pmDays = daysUntilExpiry(vehicle.pmSchedule?.nextPmDueDate);

  return (
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
  );
};

export default VehicleInspectionsTab;
