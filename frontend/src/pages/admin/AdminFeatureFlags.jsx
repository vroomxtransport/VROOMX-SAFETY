import { FiFlag, FiExternalLink } from 'react-icons/fi';

const POSTHOG_DASHBOARD_URL = 'https://us.posthog.com/project/feature_flags';

const AdminFeatureFlags = () => {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <FiFlag className="w-6 h-6 text-red-500" />
          Feature Flags
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Manage feature flags and experiments
        </p>
      </div>

      {/* PostHog Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFlag className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Feature Flags Powered by PostHog
          </h2>

          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            We use PostHog for feature flags, A/B testing, and experiments.
            Manage all your feature flags directly in the PostHog dashboard.
          </p>

          <div className="space-y-3">
            <a
              href={POSTHOG_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              Open PostHog Dashboard
              <FiExternalLink className="w-4 h-4" />
            </a>

            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              You'll need to log in to PostHog to manage flags
            </p>
          </div>

          {/* Features List */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
              What you can do in PostHog:
            </h3>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 text-left max-w-xs mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Create and manage feature flags
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Set up percentage rollouts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Target users by properties (plan, company, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                Run A/B tests and experiments
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                View flag analytics and impact
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeatureFlags;
