import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AnnouncementBanner from '../AnnouncementBanner';
import DemoBanner from '../DemoBanner';
import api from '../../utils/api';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import BugReportModal from './BugReportModal';
import navigation from './navConfig';

const Layout = () => {
  const { user, logout, subscription, activeCompany, isDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded-sections');
    return saved ? JSON.parse(saved) : { MANAGEMENT: true, TRACKING: false, 'COMPANY FILES': false, TOOLS: false };
  });
  const [alertCounts, setAlertCounts] = useState({ critical: 0, warning: 0, info: 0, total: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [devBannerDismissed, setDevBannerDismissed] = useState(() => {
    return localStorage.getItem('dev-banner-dismissed') === 'true';
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportInitialCategory, setReportInitialCategory] = useState('bug');
  const location = useLocation();

  // Fetch alert counts and recent alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [countsRes, alertsRes] = await Promise.all([
          api.get('/dashboard/alerts/counts'),
          api.get('/dashboard/alerts?limit=8')
        ]);
        if (countsRes.data.success) {
          setAlertCounts(countsRes.data.counts);
        }
        if (alertsRes.data.success) {
          setRecentAlerts(alertsRes.data.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };

    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeCompany]);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Persist expanded sections state
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-sections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Dismiss dev banner
  const dismissDevBanner = () => {
    setDevBannerDismissed(true);
    localStorage.setItem('dev-banner-dismissed', 'true');
  };

  // Get subscription badge info
  const getSubscriptionBadge = () => {
    if (!subscription) return null;

    // Handle pending_payment status (Solo tier before payment)
    if (subscription.status === 'pending_payment') {
      return {
        label: 'Payment Required',
        className: 'bg-warning-500/20 text-warning-400 border-warning-500/30'
      };
    }

    if (subscription.status === 'trialing') {
      return {
        label: `Trial: ${subscription.trialDaysRemaining}d left`,
        className: 'bg-primary-500/20 text-primary-400 border-primary-500/30'
      };
    }

    switch (subscription.plan) {
      case 'solo':
        return {
          label: 'Solo',
          className: 'bg-primary-500/20 text-primary-300 border-primary-500/30'
        };
      case 'fleet':
        return {
          label: 'Fleet',
          className: 'bg-primary-500/20 text-primary-300 border-primary-500/30'
        };
      case 'pro':
      case 'professional':
        return {
          label: 'Professional',
          className: 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-400 border-primary-500/30'
        };
      case 'starter':
        return {
          label: 'Starter',
          className: 'bg-primary-500/20 text-primary-300 border-primary-500/30'
        };
      default:
        return null;
    }
  };

  const badge = getSubscriptionBadge();

  const currentPage = navigation.find(item => location.pathname.startsWith(item.path))?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        alertCounts={alertCounts}
        badge={badge}
        isDemo={isDemo}
        logout={logout}
      />

      {/* Main content */}
      <div className={`min-w-0 overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top header */}
        <AppHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          currentPage={currentPage}
          user={user}
          subscription={subscription}
          logout={logout}
          alertCounts={alertCounts}
          recentAlerts={recentAlerts}
        />

        {/* Development Banner */}
        {!devBannerDismissed && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/30">
            <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <FiAlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </span>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This app is currently in development testing. You may encounter bugs or issues.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setReportInitialCategory('bug');
                    setReportModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
                >
                  Report an Issue
                </button>
                <button
                  onClick={() => {
                    setReportInitialCategory('feature_request');
                    setReportModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
                >
                  Suggest a Feature
                </button>
                <button
                  onClick={dismissDevBanner}
                  className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 rounded transition-colors"
                  aria-label="Dismiss banner"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Demo Mode Banner */}
        <DemoBanner />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        initialCategory={reportInitialCategory}
      />
    </div>
  );
};

export default Layout;
