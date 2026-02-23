import { Link } from 'react-router-dom';
import { FiUsers, FiTruck, FiClock, FiAlertTriangle } from 'react-icons/fi';

const StatsCards = ({ data, trendData }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Drivers */}
      <Link to="/app/drivers" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">All active</span>
        </div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white">{data?.drivers?.active || 0}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Active Drivers</p>
      </Link>

      {/* Vehicles */}
      <Link to="/app/vehicles" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <FiTruck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-300">All active</span>
        </div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white">{data?.vehicles?.active || 0}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Fleet Vehicles</p>
      </Link>

      {/* Expiring Docs */}
      <Link to="/app/documents" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-yellow-300 dark:hover:border-yellow-500/30 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          {(data?.summary?.driversWithExpiringDocs || 0) > 0 && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Action needed</span>
          )}
        </div>
        <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${(data?.summary?.driversWithExpiringDocs || 0) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-white'}`}>
          {data?.summary?.driversWithExpiringDocs || 0}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Expiring Soon</p>
      </Link>

      {/* Violations */}
      <Link to="/app/violations" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          {trendData?.violationTrend !== undefined && trendData.violationTrend !== 0 && (
            <span className={`text-xs font-semibold ${trendData.violationTrend < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendData.violationTrend > 0 ? '+' : ''}{trendData.violationTrend} this year
            </span>
          )}
        </div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white">{data?.recentViolations?.length || 0}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Open Violations</p>
      </Link>
    </div>
  );
};

export default StatsCards;
