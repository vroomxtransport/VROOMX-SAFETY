import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CompanySwitcher from './CompanySwitcher';
import VroomXLogo from './VroomXLogo';
import api from '../utils/api';
import {
  FiHome, FiUsers, FiTruck, FiAlertTriangle, FiDroplet,
  FiFolder, FiBarChart2, FiFileText, FiSettings, FiMenu,
  FiX, FiBell, FiLogOut, FiChevronDown, FiShield, FiTag, FiMessageCircle, FiDollarSign,
  FiStar, FiCreditCard, FiActivity, FiCopy, FiSun, FiMoon,
  FiChevronsLeft, FiChevronsRight, FiCheckSquare, FiClipboard, FiTool, FiAlertOctagon
} from 'react-icons/fi';

const navigation = [
  // Main section (no header)
  { name: 'Dashboard', path: '/app/dashboard', icon: FiHome },
  { name: 'VroomX AI', path: '/app/ai-assistant', icon: FiMessageCircle, isAI: true },
  { name: 'Alerts', path: '/app/alerts', icon: FiActivity, hasAlerts: true },
  { name: 'Tasks', path: '/app/tasks', icon: FiCheckSquare },

  // Management section
  { section: 'MANAGEMENT' },
  { name: 'Compliance', path: '/app/compliance', icon: FiBarChart2 },
  { name: 'Driver Files', path: '/app/drivers', icon: FiUsers },
  { name: 'Vehicle Files', path: '/app/vehicles', icon: FiTruck },
  { name: 'Maintenance', path: '/app/maintenance', icon: FiTool },

  // Tracking section
  { section: 'TRACKING' },
  { name: 'Violations', path: '/app/violations', icon: FiAlertTriangle },
  { name: 'Tickets', path: '/app/tickets', icon: FiTag },
  { name: 'Accidents', path: '/app/accidents', icon: FiAlertOctagon },
  { name: 'Damage Claims', path: '/app/damage-claims', icon: FiDollarSign },
  { name: 'Drug & Alcohol', path: '/app/drug-alcohol', icon: FiDroplet },

  // Tools section
  { section: 'TOOLS' },
  { name: 'Documents', path: '/app/documents', icon: FiFolder },
  { name: 'Checklists', path: '/app/checklists', icon: FiClipboard },
  { name: 'Reports', path: '/app/reports', icon: FiFileText },
];

const Layout = () => {
  const { user, logout, subscription, activeCompany } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertCounts, setAlertCounts] = useState({ critical: 0, warning: 0, info: 0, total: 0 });
  const location = useLocation();

  // Fetch alert counts
  useEffect(() => {
    const fetchAlertCounts = async () => {
      try {
        const response = await api.get('/dashboard/alerts/counts');
        if (response.data.success) {
          setAlertCounts(response.data.counts);
        }
      } catch (error) {
        console.error('Failed to fetch alert counts:', error);
      }
    };

    fetchAlertCounts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlertCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeCompany]);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuOpen && !e.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

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
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transform transition-all duration-300 ease-out lg:translate-x-0
          bg-white dark:bg-zinc-900
          border-r border-zinc-200 dark:border-white/10
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo Header */}
        <div className={`flex items-center justify-between py-5 border-b border-zinc-200 dark:border-white/10 ${sidebarCollapsed ? 'px-3' : 'px-5'}`}>
          <VroomXLogo
            size="sm"
            showText={!sidebarCollapsed}
            linkToHome={true}
            animate={true}
          />
          <button
            className="lg:hidden p-2 text-zinc-600 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {navigation.map((item, index) => {
            // Render section header
            if (item.section) {
              if (sidebarCollapsed) return null;
              return (
                <div key={item.section} className="pt-4 pb-2 px-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-white/40">
                    {item.section}
                  </span>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                title={sidebarCollapsed ? item.name : undefined}
                className={`relative flex items-center rounded-lg transition-all duration-200 group ${
                  sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${isActive
                    ? 'bg-accent-50 dark:bg-white/10 text-accent-600 dark:text-white'
                    : 'text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                {/* Icon */}
                <Icon className="w-5 h-5 flex-shrink-0" />

                {!sidebarCollapsed && (
                  <>
                    <span className="font-medium text-sm">{item.name}</span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-orange-500" />
                    )}

                    {/* AI badge */}
                    {item.isAI && !isActive && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white">
                        AI
                      </span>
                    )}

                    {/* Alert count badge */}
                    {item.hasAlerts && alertCounts.total > 0 && !isActive && (
                      <span className={`ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-white text-[10px] font-bold ${
                        alertCounts.critical > 0 ? 'bg-red-500' : alertCounts.warning > 0 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}>
                        {alertCounts.total > 99 ? '99+' : alertCounts.total}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Subscription Badge */}
        {badge && !sidebarCollapsed && (
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-white/10">
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
              <FiStar className="w-4 h-4 text-orange-500" fill="currentColor" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-white/90">{badge.label}</span>
            </div>
          </div>
        )}

        {/* Company Switcher */}
        {!sidebarCollapsed && (
          <div className="px-4 py-4 border-t border-zinc-200 dark:border-white/10">
            <CompanySwitcher />
          </div>
        )}

        {/* Collapse Toggle Button */}
        <div className={`hidden lg:flex items-center border-t border-zinc-200 dark:border-white/10 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex items-center gap-2 p-2 rounded-lg text-zinc-600 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors ${sidebarCollapsed ? 'w-full justify-center' : ''}`}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <FiChevronsRight className="w-5 h-5" />
            ) : (
              <>
                <FiChevronsLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-white/5">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white font-heading">{currentPage}</h1>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>

              {/* Notifications button */}
              <button className="relative p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative user-menu">
                <button
                  className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-accent-500 to-accent-600 shadow-md shadow-accent-500/30"
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <FiChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl py-2 animate-scale-in shadow-glass-lg">
                    {/* User info section */}
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      {/* Admin Panel link - only for superadmins */}
                      {user?.isSuperAdmin && (
                        <NavLink
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                            <FiShield className="w-4 h-4" />
                          </span>
                          Admin Panel
                        </NavLink>
                      )}
                      <NavLink
                        to="/app/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                          <FiSettings className="w-4 h-4" />
                        </span>
                        Settings
                      </NavLink>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger-100 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400">
                          <FiLogOut className="w-4 h-4" />
                        </span>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
