import { FiDollarSign } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';

const VehicleClaimsTab = ({ claims, claimsLoading, getClaimStatusColor }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Claims</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{claims.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Open Claims</p>
          <p className="text-2xl font-bold text-warning-600">
            {claims.filter(c => ['open', 'under_investigation', 'pending_settlement'].includes(c.status)).length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Amount</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            ${claims.reduce((sum, c) => sum + (c.claimAmount || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Claims List */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-primary-500" />
            Damage Claims
          </h3>
        </div>
        <div className="card-body">
          {claimsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8">
              <FiDollarSign className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No claims found for this vehicle</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map(claim => (
                <a
                  key={claim._id}
                  href={`/app/damage-claims?claimId=${claim._id}`}
                  className="block bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-primary-300 dark:hover:border-primary-600"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{claim.claimNumber}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(claim.incidentDate).toLocaleDateString()} &bull; {claim.damageType?.replace('_', ' ')}
                      </p>
                      {claim.driverId && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          Driver: {claim.driverId.firstName} {claim.driverId.lastName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getClaimStatusColor(claim.status)}`}>
                        {claim.status?.replace('_', ' ')}
                      </span>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">
                        ${claim.claimAmount?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                  {claim.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">{claim.description}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleClaimsTab;
