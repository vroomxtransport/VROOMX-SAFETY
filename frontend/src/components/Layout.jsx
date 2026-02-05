import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CompanySwitcher from './CompanySwitcher';
import AnnouncementBanner from './AnnouncementBanner';
import DemoBanner from './DemoBanner';
import VroomXLogo from './VroomXLogo';
import api, { driversAPI, vehiclesAPI, documentsAPI, violationsAPI, accidentsAPI } from '../utils/api';
import {
  FiHome, FiUsers, FiTruck, FiAlertTriangle, FiDroplet,
  FiFolder, FiBarChart2, FiFileText, FiSettings, FiMenu,
  FiX, FiBell, FiLogOut, FiChevronDown, FiShield, FiTag, FiMessageCircle, FiDollarSign,
  FiStar, FiActivity, FiCopy, FiSun, FiMoon,
  FiChevronsLeft, FiChevronsRight, FiCheckSquare, FiClipboard, FiTool, FiAlertOctagon,
  FiBookOpen, FiLink, FiTarget, FiArrowLeft
} from 'react-icons/fi';

const navigation = [
  // Main section (no header)
  { name: 'Dashboard', path: '/app/dashboard', icon: FiHome },
  { name: 'VroomX AI', path: '/app/ai-assistant', icon: FiMessageCircle, isAI: true },
  { name: 'Alerts', path: '/app/alerts', icon: FiActivity, hasAlerts: true },
  { name: 'Tasks', path: '/app/tasks', icon: FiCheckSquare },

  // Management section
  { section: 'MANAGEMENT' },
  { name: 'FMCSA Dashboard', path: '/app/compliance', icon: FiBarChart2 },
  { name: 'Violations', path: '/app/violations', icon: FiAlertTriangle },
  { name: 'DataQ Challenges', path: '/app/dataq-dashboard', icon: FiTarget, isAI: true },
  { name: 'Driver Files', path: '/app/drivers', icon: FiUsers },
  { name: 'Vehicle Files', path: '/app/vehicles', icon: FiTruck },
  { name: 'Maintenance', path: '/app/maintenance', icon: FiTool },

  // Tracking section
  { section: 'TRACKING' },
  { name: 'Tickets', path: '/app/tickets', icon: FiTag },
  { name: 'Accidents', path: '/app/accidents', icon: FiAlertOctagon },
  { name: 'Damage Claims', path: '/app/damage-claims', icon: FiDollarSign },
  { name: 'Drug & Alcohol', path: '/app/drug-alcohol', icon: FiDroplet },

  // Company Files section
  { section: 'COMPANY FILES' },
  { name: 'Policies', path: '/app/policies', icon: FiBookOpen },
  { name: 'Templates', path: '/app/templates', icon: FiFileText },
  { name: 'Checklists', path: '/app/checklists', icon: FiClipboard },
  { name: 'Documents', path: '/app/documents', icon: FiFolder },

  // Tools section
  { section: 'TOOLS' },
  { name: 'Reports', path: '/app/reports', icon: FiFileText },
  { name: 'Integrations', path: '/app/integrations', icon: FiLink },
];

const Layout = () => {
  const { user, logout, subscription, activeCompany, isDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertCounts, setAlertCounts] = useState({ critical: 0, warning: 0, info: 0, total: 0 });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    setSearchLoading(true);
    setShowSearchDropdown(true);
    try {
      const [driversRes, vehiclesRes, documentsRes, violationsRes, accidentsRes] = await Promise.all([
        driversAPI.getAll({ search: query, limit: 5 }).catch(() => ({ data: { drivers: [] } })),
        vehiclesAPI.getAll({ search: query, limit: 5 }).catch(() => ({ data: { vehicles: [] } })),
        documentsAPI.getAll({ search: query, limit: 5 }).catch(() => ({ data: { documents: [] } })),
        violationsAPI.getAll({ search: query, limit: 5 }).catch(() => ({ data: { violations: [] } })),
        accidentsAPI.getAll({ search: query, limit: 5 }).catch(() => ({ data: { accidents: [] } }))
      ]);
      setSearchResults({
        drivers: driversRes.data.drivers || [],
        vehicles: vehiclesRes.data.vehicles || [],
        documents: documentsRes.data.documents || [],
        violations: violationsRes.data.violations || [],
        accidents: accidentsRes.data.accidents || []
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((query) => performSearch(query), 300),
    [performSearch]
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Navigate to search result
  const handleResultClick = (type, item) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    switch (type) {
      case 'driver':
        navigate(`/app/drivers/${item._id}`);
        break;
      case 'vehicle':
        navigate(`/app/vehicles/${item._id}`);
        break;
      case 'document':
        navigate('/app/documents');
        break;
      case 'violation':
        navigate('/app/violations');
        break;
      case 'accident':
        navigate('/app/accidents');
        break;
      default:
        break;
    }
  };

  const getTotalResults = () => {
    if (!searchResults) return 0;
    return (searchResults.drivers?.length || 0) +
      (searchResults.vehicles?.length || 0) +
      (searchResults.documents?.length || 0) +
      (searchResults.violations?.length || 0) +
      (searchResults.accidents?.length || 0);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuOpen && !e.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
      if (notificationsOpen && !e.target.closest('.notifications-dropdown')) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen, notificationsOpen]);

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
        <div className={`relative flex items-center justify-center py-5 border-b border-zinc-200 dark:border-white/10 ${sidebarCollapsed ? 'px-3' : 'px-5'}`}>
          <VroomXLogo
            size="sm"
            showText={!sidebarCollapsed}
            linkToHome={true}
            animate={true}
          />
          <button
            className="lg:hidden absolute right-3 p-2 text-zinc-600 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Mode Banner */}
        {isDemo && !sidebarCollapsed && (
          <div className="mx-3 mt-3 p-3 bg-cta-500/10 border border-cta-500/20 rounded-xl">
            <p className="text-xs text-cta-600 font-medium mb-2">Demo Mode</p>
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cta-500 text-white text-sm font-medium rounded-lg hover:bg-cta-600 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Exit Demo
            </button>
          </div>
        )}

        {/* Navigation - Grid Layout */}
        <nav className={`flex-1 py-3 overflow-y-auto scrollbar-thin ${sidebarCollapsed ? 'px-2' : 'px-2'}`}>
          {sidebarCollapsed ? (
            // Collapsed mode: single column icons
            <div className="flex flex-col gap-1">
              {navigation.filter(item => !item.section).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    title={item.name}
                    className={`relative flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 group hover:-translate-y-0.5 ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {/* AI badge - collapsed */}
                    {item.isAI && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    {/* Alert badge - collapsed */}
                    {item.hasAlerts && alertCounts.total > 0 && (
                      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                        alertCounts.critical > 0 ? 'bg-red-500' : alertCounts.warning > 0 ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ) : (
            // Expanded mode: 2-column grid
            <div className="grid grid-cols-2 gap-1">
              {navigation.map((item) => {
                // Section divider - spans full width
                if (item.section) {
                  return (
                    <div key={item.section} className="col-span-2 flex items-center gap-2 py-2 mt-2 first:mt-0">
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {item.section}
                      </span>
                      <div className="flex-1 h-px bg-zinc-200 dark:bg-white/10" />
                    </div>
                  );
                }

                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    title={item.name}
                    className={`group relative flex flex-col items-center justify-center rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-white/5
                      py-[clamp(10px,1.5vh,14px)] px-1
                      min-h-[clamp(52px,8vh,68px)]
                      ${isActive
                        ? 'bg-orange-50 dark:bg-orange-500/10 shadow-sm'
                        : 'hover:bg-zinc-100 dark:hover:bg-white/5'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {/* Icon container */}
                    <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 mb-1 ${
                      isActive
                        ? 'bg-orange-500/15 text-orange-500'
                        : 'text-zinc-500 dark:text-zinc-400 group-hover:text-orange-500'
                    }`}>
                      <Icon className="w-5 h-5" />

                      {/* AI badge - positioned at top-right of icon */}
                      {item.isAI && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-[7px] font-bold text-white">AI</span>
                        </span>
                      )}

                      {/* Alert count badge - positioned at top-right of icon */}
                      {item.hasAlerts && alertCounts.total > 0 && (
                        <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-bold ${
                          alertCounts.critical > 0 ? 'bg-red-500' : alertCounts.warning > 0 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}>
                          {alertCounts.total > 99 ? '99' : alertCounts.total}
                        </span>
                      )}
                    </span>

                    {/* Label - centered, max 2 lines */}
                    <span className={`text-[11px] font-medium text-center leading-tight line-clamp-2 px-0.5 transition-colors duration-200 ${
                      isActive
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                    }`}>
                      {item.name}
                    </span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
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
      <div className={`min-w-0 overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
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
              <div className="relative hidden md:block" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Search drivers, vehicles, documents..."
                  aria-label="Search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                  className="w-40 lg:w-72 pl-10 pr-4 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>

                {/* Search Results Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl shadow-glass-lg z-50 overflow-hidden max-h-96 overflow-y-auto">
                    {searchLoading ? (
                      <div className="px-4 py-6 text-center">
                        <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-zinc-500 mt-2">Searching...</p>
                      </div>
                    ) : getTotalResults() === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-zinc-500">No results found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <>
                        {/* Drivers */}
                        {searchResults?.drivers?.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-zinc-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              <FiUsers className="inline w-3 h-3 mr-1" /> Drivers ({searchResults.drivers.length})
                            </div>
                            {searchResults.drivers.map((driver) => (
                              <button
                                key={driver._id}
                                onClick={() => handleResultClick('driver', driver)}
                                className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">
                                  {driver.firstName?.[0]}{driver.lastName?.[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{driver.firstName} {driver.lastName}</p>
                                  <p className="text-xs text-zinc-500">{driver.cdl?.number || 'No CDL'}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Vehicles */}
                        {searchResults?.vehicles?.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-zinc-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              <FiTruck className="inline w-3 h-3 mr-1" /> Vehicles ({searchResults.vehicles.length})
                            </div>
                            {searchResults.vehicles.map((vehicle) => (
                              <button
                                key={vehicle._id}
                                onClick={() => handleResultClick('vehicle', vehicle)}
                                className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                  <FiTruck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Unit #{vehicle.unitNumber}</p>
                                  <p className="text-xs text-zinc-500">{vehicle.make} {vehicle.model} • {vehicle.vin}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Documents */}
                        {searchResults?.documents?.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-zinc-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              <FiFolder className="inline w-3 h-3 mr-1" /> Documents ({searchResults.documents.length})
                            </div>
                            {searchResults.documents.map((doc) => (
                              <button
                                key={doc._id}
                                onClick={() => handleResultClick('document', doc)}
                                className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                  <FiFolder className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{doc.name || doc.originalName}</p>
                                  <p className="text-xs text-zinc-500 capitalize">{doc.documentType?.replace(/_/g, ' ') || 'Document'}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Violations */}
                        {searchResults?.violations?.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-zinc-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              <FiAlertTriangle className="inline w-3 h-3 mr-1" /> Violations ({searchResults.violations.length})
                            </div>
                            {searchResults.violations.map((violation) => (
                              <button
                                key={violation._id}
                                onClick={() => handleResultClick('violation', violation)}
                                className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                  <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{violation.code || 'Violation'}</p>
                                  <p className="text-xs text-zinc-500 truncate max-w-48">{violation.description}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Accidents */}
                        {searchResults?.accidents?.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-zinc-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              <FiAlertOctagon className="inline w-3 h-3 mr-1" /> Accidents ({searchResults.accidents.length})
                            </div>
                            {searchResults.accidents.map((accident) => (
                              <button
                                key={accident._id}
                                onClick={() => handleResultClick('accident', accident)}
                                className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center">
                                  <FiAlertOctagon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{accident.reportNumber || 'Accident Report'}</p>
                                  <p className="text-xs text-zinc-500">{accident.location}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>

              {/* Notifications dropdown */}
              <div className="relative notifications-dropdown">
                <button
                  aria-label="Notifications"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                  }}
                  className="relative p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiBell className="w-5 h-5" />
                  {alertCounts.total > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-glass-lg animate-scale-in z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-800 dark:text-white">Notifications</h3>
                      {alertCounts.total > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-600 dark:text-accent-400">
                          {alertCounts.total} new
                        </span>
                      )}
                    </div>

                    {/* Alert list */}
                    <div className="max-h-80 overflow-y-auto">
                      {recentAlerts.length > 0 ? (
                        recentAlerts.map((alert, index) => (
                          <div
                            key={alert._id || index}
                            className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 border-b border-zinc-100 dark:border-white/5 last:border-0 cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                alert.severity === 'critical' ? 'bg-red-500' :
                                alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                  {alert.title}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {alert.message}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                  {new Date(alert.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <FiBell className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">No notifications</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <NavLink
                      to="/app/alerts"
                      onClick={() => setNotificationsOpen(false)}
                      className="block px-4 py-3 text-center text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-zinc-50 dark:hover:bg-white/5 border-t border-zinc-100 dark:border-white/5"
                    >
                      View all alerts
                    </NavLink>
                  </div>
                )}
              </div>

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

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Demo Mode Banner */}
        <DemoBanner />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
