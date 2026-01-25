import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import VroomXLogo from '../../components/VroomXLogo';
import {
  FiHome, FiUsers, FiBriefcase, FiSettings, FiLogOut,
  FiArrowLeft, FiSun, FiMoon, FiShield
} from 'react-icons/fi';

const adminNavigation = [
  { name: 'Dashboard', path: '/admin', icon: FiHome },
  { name: 'Users', path: '/admin/users', icon: FiUsers },
  { name: 'Companies', path: '/admin/companies', icon: FiBriefcase },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect non-superadmins
  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  if (!user?.isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-black">
        <div className="text-center">
          <FiShield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">You need super admin privileges to access this area.</p>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="btn btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-red-600 dark:bg-red-900 border-b border-red-700 dark:border-red-800">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <VroomXLogo size="sm" showText={true} linkToHome={false} />
            <div className="h-6 w-px bg-white/20" />
            <span className="text-white font-semibold flex items-center gap-2">
              <FiShield className="w-4 h-4" />
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to App
            </button>

            <div className="flex items-center gap-3">
              <span className="text-white/80 text-sm">{user?.email}</span>
              <button
                onClick={logout}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <nav className="flex gap-1 px-6 pb-0">
          {adminNavigation.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-black text-red-600 dark:text-red-400'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
