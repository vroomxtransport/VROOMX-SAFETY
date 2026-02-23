import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

const TopRiskDriversCard = ({ drivers }) => {
  if (drivers.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-[#1E3A5F] px-5 py-4 flex items-center justify-between">
        <h3 className="text-white font-semibold">TOP RISK DRIVERS</h3>
        <Link to="/app/drivers" className="text-white/80 hover:text-white text-sm flex items-center">
          View All <FiArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {drivers.map((driver) => (
          <Link
            key={driver._id}
            to={`/app/drivers/${driver._id}`}
            className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors block"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                driver.riskLevel === 'High'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : driver.riskLevel === 'Medium'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                <FiAlertTriangle className={`w-5 h-5 ${
                  driver.riskLevel === 'High'
                    ? 'text-red-600 dark:text-red-400'
                    : driver.riskLevel === 'Medium'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {driver.fullName || `${driver.firstName} ${driver.lastName}`}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {driver.totalViolations} violation{driver.totalViolations !== 1 ? 's' : ''} • {driver.basicsAffected || 0} BASIC{(driver.basicsAffected || 0) !== 1 ? 's' : ''} affected
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                driver.riskLevel === 'High'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : driver.riskLevel === 'Medium'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                {Math.round(driver.totalWeightedPoints)} pts
              </span>
              {driver.oosCount > 0 && (
                <p className="text-xs text-red-500 mt-1">{driver.oosCount} OOS</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TopRiskDriversCard;
