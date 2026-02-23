import { Link } from 'react-router-dom';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

const RecentInspectionsCard = ({ inspections, onInspectionClick }) => {
  if (inspections.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-[#1E3A5F] px-5 py-4 flex items-center justify-between">
        <h3 className="text-white font-semibold">RECENT INSPECTIONS</h3>
        <Link to="/app/compliance" className="text-white/80 hover:text-white text-sm flex items-center">
          View All <FiArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {inspections.map((insp) => (
          <div key={insp._id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            onClick={() => onInspectionClick(insp)}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                insp.vehicleOOS || insp.driverOOS
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : (insp.totalViolations || 0) > 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                {insp.vehicleOOS || insp.driverOOS ? (
                  <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (insp.totalViolations || 0) > 0 ? (
                  <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {insp.state || 'Unknown'} - Level {insp.inspectionLevel || '?'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(insp.inspectionDate).toLocaleDateString()} • {insp.reportNumber}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium ${
                (insp.totalViolations || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {insp.totalViolations || 0} violation{(insp.totalViolations || 0) !== 1 ? 's' : ''}
              </span>
              {(insp.vehicleOOS || insp.driverOOS) && (
                <p className="text-xs text-red-500">
                  {insp.vehicleOOS && 'Vehicle OOS'}
                  {insp.vehicleOOS && insp.driverOOS && ' • '}
                  {insp.driverOOS && 'Driver OOS'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentInspectionsCard;
