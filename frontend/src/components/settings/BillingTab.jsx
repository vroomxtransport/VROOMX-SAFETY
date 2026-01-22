import { useNavigate } from 'react-router-dom';
import { FiZap, FiStar, FiArrowRight, FiBriefcase, FiUsers, FiTruck, FiCreditCard, FiExternalLink } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const BillingTab = ({ subscription, companies, currentUsage, handleManageBilling, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            {subscription?.plan === 'professional' ? (
              <FiZap className="w-6 h-6 text-white" />
            ) : (
              <FiStar className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Current Plan</h3>
            <p className="text-zinc-600 dark:text-zinc-400 capitalize">
              {subscription?.plan?.replace('_', ' ') || 'Free Trial'}
              {subscription?.status === 'trialing' && (
                <span className="ml-2 text-accent-600 dark:text-accent-400">
                  ({subscription.trialDaysRemaining} days left)
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/billing')}
          className="btn btn-primary"
        >
          Manage Subscription
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary-200/50 dark:border-primary-700">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
            <FiBriefcase className="w-4 h-4" />
            <span className="text-sm font-medium">Companies</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {currentUsage?.companies || companies.length}
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
              / {subscription?.limits?.maxCompanies === Infinity ? '∞' : subscription?.limits?.maxCompanies || 1}
            </span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary-200/50 dark:border-primary-700">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
            <FiUsers className="w-4 h-4" />
            <span className="text-sm font-medium">Drivers (active company)</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {currentUsage?.drivers || 0}
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
              / {subscription?.limits?.maxDriversPerCompany === Infinity ? '∞' : subscription?.limits?.maxDriversPerCompany || 3}
            </span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary-200/50 dark:border-primary-700">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
            <FiTruck className="w-4 h-4" />
            <span className="text-sm font-medium">Vehicles (active company)</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {currentUsage?.vehicles || 0}
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
              / {subscription?.limits?.maxVehiclesPerCompany === Infinity ? '∞' : subscription?.limits?.maxVehiclesPerCompany || 3}
            </span>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {subscription?.stripeSubscriptionId && (
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? <LoadingSpinner size="sm" /> : (
              <>
                <FiCreditCard className="w-4 h-4" />
                Update Payment Method
                <FiExternalLink className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
        <button
          onClick={() => navigate('/app/billing')}
          className="btn btn-secondary"
        >
          View Invoices
          <FiExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default BillingTab;
