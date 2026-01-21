import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CompanySwitcher from './CompanySwitcher';
import VroomXLogo from './VroomXLogo';
import {
  FiHome, FiUsers, FiTruck, FiAlertTriangle, FiDroplet,
  FiFolder, FiBarChart2, FiFileText, FiSettings, FiMenu,
  FiX, FiBell, FiLogOut, FiChevronDown, FiShield, FiTag, FiMessageCircle, FiDollarSign,
  FiStar, FiCreditCard, FiActivity, FiCopy, FiSun, FiMoon,
  FiChevronsLeft, FiChevronsRight
} from 'react-icons/fi';

const navigation = [
  { name: 'Dashboard', path: '/app/dashboard', icon: FiHome },
  { name: 'VroomX AI', path: '/app/ai-assistant', icon: FiMessageCircle, isAI: true },
  { name: 'Alerts', path: '/app/alerts', icon: FiActivity, isBeta: true },
  { name: 'Driver Qualification', path: '/app/drivers', icon: FiUsers },
  { name: 'Vehicle Files', path: '/app/vehicles', icon: FiTruck },
  { name: 'Compliance', path: '/app/compliance', icon: FiBarChart2 },
  { name: 'Violation Tracker', path: '/app/violations', icon: FiAlertTriangle },
  { name: 'Ticket Tracker', path: '/app/tickets', icon: FiTag },
  { name: 'Damage Claims', path: '/app/damage-claims', icon: FiDollarSign },
  { name: 'Drug & Alcohol', path: '/app/drug-alcohol', icon: FiDroplet },
  { name: 'Documents', path: '/app/documents', icon: FiFolder },
  { name: 'Templates', path: '/app/templates', icon: FiCopy },
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
  const location = useLocation();

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Get subscription badge info
  const getSubscriptionBadge = () => {
    if (!subscription) return null;

    if (subscription.status === 'trialing') {
      return {
        label: `Trial: ${subscription.trialDaysRemaining}d left`,
        className: 'bg-primary-500/20 text-primary-400 border-primary-500/30'
      };
    }

    switch (subscription.plan) {
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
        return {
          label: 'Free Trial',
          className: 'bg-primary-700/30 text-primary-400 border-primary-600/30'
        };
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
          bg-white dark:bg-sidebar-gradient dark:bg-surface-200
          border-r border-zinc-200 dark:border-white/5
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo Header */}
        <div className={`flex items-center justify-between py-5 border-b border-zinc-200 dark:border-white/5 ${sidebarCollapsed ? 'px-3' : 'px-5'}`}>
          <VroomXLogo
            size="sm"
            showText={!sidebarCollapsed}
            linkToHome={true}
            animate={true}
          />
          <button
            className="lg:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-2 space-y-0.5 overflow-y-auto scrollbar-thin ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                title={sidebarCollapsed ? item.name : undefined}
                className={`relative flex items-center rounded-xl transition-all duration-200 group ${
                  sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-4 py-2'
                } ${isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-white'
                    : item.isAI
                      ? 'text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-700 dark:hover:text-primary-200'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                {/* Active indicator */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-primary-400 to-primary-600"
                  />
                )}

                {/* Icon container */}
                <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                    : item.isAI
                      ? 'bg-primary-50 dark:bg-gradient-to-br dark:from-primary-500/20 dark:to-primary-600/20 text-primary-500 dark:text-primary-400'
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
                  }`}>
                  <Icon className="w-4 h-4" />
                </span>

                {!sidebarCollapsed && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.isAI && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                        AI
                      </span>
                    )}
                    {item.isBeta && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-info-100 dark:bg-info-500/20 text-info-600 dark:text-info-400">
                        BETA
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
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-white/5">
            <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${badge.className}`}>
              <FiStar className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{badge.label}</span>
            </div>
          </div>
        )}

        {/* Company Switcher */}
        {!sidebarCollapsed && (
          <div className="px-4 py-4 border-t border-zinc-200 dark:border-white/5">
            <CompanySwitcher />
          </div>
        )}

        {/* Collapse Toggle Button */}
        <div className={`hidden lg:flex items-center border-t border-zinc-200 dark:border-white/5 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex items-center gap-2 p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors ${sidebarCollapsed ? 'w-full justify-center' : ''}`}
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
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-200/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-white/5">
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
            <div className="flex items-center gap-2">
              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>

              {/* Notifications button */}
              <button className="relative p-2.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white dark:ring-surface-200"></span>
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
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-primary-500 to-primary-600 shadow-glow-sm"
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <FiChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl py-2 animate-scale-in shadow-glass-lg">
                    {/* User info section */}
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
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
