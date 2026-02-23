import { useNavigate } from 'react-router-dom';
import { FiTool, FiPlus } from 'react-icons/fi';
import { formatDate, formatCurrency } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const VehicleMaintenanceTab = ({ vehicle, onAddMaintenance }) => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FiTool className="w-4 h-4 text-primary-500" />
          Maintenance Log
        </h3>
        <button
          onClick={onAddMaintenance}
          className="btn btn-primary btn-sm"
        >
          <FiPlus className="w-4 h-4 mr-1" />
          Add Record
        </button>
      </div>
      <div className="card-body p-0">
        {vehicle.maintenanceLog?.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {vehicle.maintenanceLog.slice().reverse().map((record, index) => (
              <div
                key={index}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (record.maintenanceRecordId) {
                    navigate(`/app/maintenance?record=${record.maintenanceRecordId}`);
                  } else {
                    toast.error('This record was created before linking was enabled');
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      record.severity === 'critical' ? 'bg-red-100 dark:bg-red-500/20' :
                      record.severity === 'high' ? 'bg-orange-100 dark:bg-orange-500/20' :
                      record.severity === 'moderate' ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-blue-100 dark:bg-blue-500/20'
                    }`}>
                      <FiTool className={`w-5 h-5 ${
                        record.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                        record.severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                        record.severity === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{record.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        <span>{formatDate(record.date)}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{record.maintenanceType}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{record.category}</span>
                      </div>
                      {record.odometer && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          {record.odometer.toLocaleString()} mi
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={record.severity} />
                    {record.totalCost && (
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        {formatCurrency(record.totalCost)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <FiTool className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">No maintenance records</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
              Keep track of all repairs, inspections, and preventive maintenance for this vehicle.
            </p>
            <button
              onClick={onAddMaintenance}
              className="btn btn-primary"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add First Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleMaintenanceTab;
