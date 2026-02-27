import { Link } from 'react-router-dom';
import { FiLock, FiArrowUp } from 'react-icons/fi';

const UpgradePrompt = ({ feature, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-zinc-800/50 dark:bg-zinc-800/50 border border-zinc-700 dark:border-zinc-700 rounded-xl p-8 max-w-lg text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
          <FiLock className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{feature}</h2>
        <p className="text-gray-400 mb-6">
          {description || `${feature} is available on Fleet and Pro plans. Upgrade to unlock this feature and take your compliance to the next level.`}
        </p>
        <Link
          to="/app/billing"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          <FiArrowUp className="w-5 h-5" />
          Upgrade to Fleet — $79/mo
        </Link>
        <p className="text-gray-500 text-sm mt-3">
          Or choose Pro for $149/mo with advanced features
        </p>
      </div>
    </div>
  );
};

export default UpgradePrompt;
