import { NavLink, useLocation } from 'react-router-dom';
import VroomXLogo from '../VroomXLogo';
import CompanySwitcher from '../CompanySwitcher';
import {
  FiX, FiChevronDown, FiStar,
  FiChevronsLeft, FiChevronsRight, FiArrowLeft
} from 'react-icons/fi';
import navigation from './navConfig';

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  expandedSections,
  toggleSection,
  alertCounts,
  badge,
  isDemo,
  logout,
}) => {
  const location = useLocation();

  return (
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

      {/* Navigation - Dropdown Accordion Layout */}
      <nav className={`flex-1 py-4 overflow-y-auto scrollbar-thin ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
        {sidebarCollapsed ? (
          // Collapsed mode: single column icons only
          <div className="flex flex-col gap-1">
            {navigation.filter(item => !item.section).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  title={item.name}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.isAI && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                  )}
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
          // Expanded mode: Dropdown accordion sections
          <div className="space-y-1">
            {(() => {
              // Group navigation items by section
              const groups = [];
              let currentGroup = { section: null, items: [] };

              navigation.forEach(item => {
                if (item.section) {
                  if (currentGroup.items.length > 0) {
                    groups.push(currentGroup);
                  }
                  currentGroup = { section: item.section, items: [] };
                } else {
                  currentGroup.items.push(item);
                }
              });
              if (currentGroup.items.length > 0) {
                groups.push(currentGroup);
              }

              return groups.map((group, groupIndex) => (
                <div key={group.section || 'main'}>
                  {/* Section Header - Clickable to expand/collapse */}
                  {group.section && (
                    <button
                      onClick={() => toggleSection(group.section)}
                      className="w-full flex items-center justify-between px-3 py-2 mt-3 first:mt-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors group"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                        {group.section}
                      </span>
                      <FiChevronDown
                        className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
                          expandedSections[group.section] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}

                  {/* Section Items - Animated expand/collapse */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      group.section && !expandedSections[group.section]
                        ? 'max-h-0 opacity-0'
                        : 'max-h-[1000px] opacity-100'
                    }`}
                  >
                    <div className={`space-y-0.5 ${group.section ? 'mt-1 ml-2 pl-2 border-l-2 border-zinc-200 dark:border-white/10' : ''}`}>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                          <NavLink
                            key={item.name}
                            to={item.path}
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                              isActive
                                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {/* Icon */}
                            <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-orange-500/15 text-orange-500'
                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 group-hover:text-orange-500 group-hover:bg-zinc-200 dark:group-hover:bg-white/10'
                            }`}>
                              <Icon className="w-[18px] h-[18px]" />
                            </span>

                            {/* Label */}
                            <span className="font-medium text-sm flex-1">{item.name}</span>

                            {/* Active indicator */}
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            )}

                            {/* AI badge */}
                            {item.isAI && !isActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white">
                                AI
                              </span>
                            )}

                            {/* Alert count badge */}
                            {item.hasAlerts && alertCounts.total > 0 && !isActive && (
                              <span className={`flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-white text-[10px] font-bold ${
                                alertCounts.critical > 0 ? 'bg-red-500' : alertCounts.warning > 0 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}>
                                {alertCounts.total > 99 ? '99+' : alertCounts.total}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ));
            })()}
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
  );
};

export default Sidebar;
