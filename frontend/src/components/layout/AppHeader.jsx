import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { driversAPI, vehiclesAPI, documentsAPI, violationsAPI, accidentsAPI } from '../../utils/api';
import {
  FiUsers, FiTruck, FiAlertTriangle,
  FiFolder, FiMenu,
  FiBell, FiLogOut, FiChevronDown, FiShield, FiSettings,
  FiAlertOctagon
} from 'react-icons/fi';

const AppHeader = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  currentPage,
  user,
  subscription,
  logout,
  alertCounts,
  recentAlerts,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

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

  // Cleanup debounced search on unmount
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-white/5">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            aria-label="Open navigation menu"
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
                              <p className="text-xs text-zinc-500">
                                {typeof accident.location === 'string'
                                  ? accident.location
                                  : [accident.location?.address, accident.location?.city, accident.location?.state].filter(Boolean).join(', ') || 'No location'}
                              </p>
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
  );
};

export default AppHeader;
