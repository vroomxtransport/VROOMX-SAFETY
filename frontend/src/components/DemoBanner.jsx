import { Link } from 'react-router-dom';
import { FiInfo, FiArrowRight, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const DemoBanner = () => {
  const { user, logout } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Only show for demo users
  if (!user?.isDemo || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiInfo className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              <span className="font-bold">You're viewing demo data.</span>
              {' '}Changes won't be saved. Create your own account to manage your real compliance data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-orange-600 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors whitespace-nowrap"
            >
              Create Free Account
              <FiArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
