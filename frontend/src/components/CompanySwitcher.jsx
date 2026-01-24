import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiChevronDown, FiCheck, FiPlus, FiBriefcase } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const CompanySwitcher = ({ darkMode = false }) => {
  const { companies, activeCompany, switchCompany, canCreateCompany, subscription } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (companyId) => {
    if (companyId === (activeCompany?.id || activeCompany?._id)) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      await switchCompany(companyId);
      setIsOpen(false);
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch company:', error);
    } finally {
      setSwitching(false);
    }
  };

  const handleAddCompany = () => {
    setIsOpen(false);
    navigate('/app/settings?tab=companies');
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-accent-500/20 text-accent-400';
      case 'admin':
        return 'bg-primary-500/20 text-primary-400';
      default:
        return 'bg-primary-700/30 text-primary-400';
    }
  };

  if (!activeCompany) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full ${
          darkMode
            ? 'bg-white/5 hover:bg-white/10'
            : 'bg-primary-100 dark:bg-white/5 hover:bg-primary-200 dark:hover:bg-white/10'
        }`}
        disabled={switching}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          darkMode
            ? 'bg-white/10'
            : 'bg-accent-100 dark:bg-gradient-to-br dark:from-accent-500/20 dark:to-accent-600/20'
        }`}>
          <FiBriefcase className={`w-4 h-4 ${darkMode ? 'text-white/70' : 'text-accent-600 dark:text-accent-400'}`} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-primary-900 dark:text-white'}`}>
            {activeCompany.name}
          </p>
          <p className={`text-xs font-mono ${darkMode ? 'text-white/60' : 'text-primary-500 dark:text-primary-400'}`}>
            DOT# {activeCompany.dotNumber}
          </p>
        </div>
        <FiChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            darkMode ? 'text-white/60' : 'text-primary-500 dark:text-primary-400'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-primary-900 rounded-xl border border-primary-200 dark:border-primary-700/50 shadow-xl overflow-hidden z-50"
          style={{ maxHeight: '320px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-primary-200 dark:border-primary-700/50">
            <p className="text-xs font-medium text-primary-500 dark:text-primary-400 uppercase tracking-wider">
              Switch Company
            </p>
          </div>

          {/* Company List */}
          <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
            {companies.map((company) => {
              const isActive = (company.id || company._id) === (activeCompany?.id || activeCompany?._id);
              return (
                <button
                  key={company.id || company._id}
                  onClick={() => handleSwitch(company.id || company._id)}
                  disabled={switching}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-accent-50 dark:bg-accent-500/10'
                      : 'hover:bg-primary-50 dark:hover:bg-white/5'
                  } ${switching ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-primary-900 dark:text-white text-sm font-medium truncate">
                        {company.name}
                      </p>
                      {isActive && (
                        <FiCheck className="w-4 h-4 text-accent-600 dark:text-accent-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-primary-500 text-xs font-mono">
                        DOT# {company.dotNumber}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRoleBadgeColor(company.role)}`}>
                        {company.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add Company Button */}
          <div className="px-3 py-3 border-t border-primary-200 dark:border-primary-700/50">
            {canCreateCompany() ? (
              <button
                onClick={handleAddCompany}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 text-accent-600 dark:text-accent-400 transition-colors text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                Add Company
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-primary-500 mb-2">
                  Upgrade to add more companies
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/app/settings?tab=billing');
                  }}
                  className="text-xs text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 font-medium"
                >
                  View Plans
                </button>
              </div>
            )}
          </div>

          {/* Subscription Info */}
          {subscription && (
            <div className="px-4 py-2 bg-primary-50 dark:bg-primary-950/50 border-t border-primary-200 dark:border-primary-700/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-500">Plan</span>
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300 capitalize">
                  {subscription.plan?.replace('_', ' ')}
                </span>
              </div>
              {subscription.status === 'trialing' && subscription.trialDaysRemaining > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-primary-500">Trial</span>
                  <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                    {subscription.trialDaysRemaining} days left
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher;
