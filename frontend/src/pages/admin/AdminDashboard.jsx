import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import {
  FiUsers, FiBriefcase, FiTruck, FiUserCheck, FiTrendingUp, FiActivity,
  FiServer, FiDatabase, FiMail, FiCreditCard, FiCpu, FiAlertTriangle,
  FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import DataIntegrityCard from '../../components/admin/DataIntegrityCard';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSystemHealth();
    fetchMaintenanceStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      setSystemHealth(response.data.system || response.data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await adminAPI.getMaintenanceStatus();
      setMaintenance(response.data);
      setMaintenanceMessage(response.data?.message || '');
    } catch (err) {
      console.error('Failed to load maintenance status:', err);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const newEnabled = !maintenance?.enabled;
    if (newEnabled && !window.confirm('Are you sure you want to enable maintenance mode? All non-admin users will see a maintenance page.')) {
      return;
    }

    try {
      setMaintenanceSaving(true);
      const response = await adminAPI.setMaintenanceMode({
        enabled: newEnabled,
        message: maintenanceMessage || 'We are performing scheduled maintenance. Please check back shortly.'
      });
      setMaintenance(response.data);
      toast.success(newEnabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update maintenance mode');
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchStats} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      color: 'blue',
      link: '/admin/users'
    },
    {
      title: 'Total Companies',
      value: stats?.totalCompanies || 0,
      icon: FiBriefcase,
      color: 'purple',
      link: '/admin/companies'
    },
    {
      title: 'Total Drivers',
      value: stats?.totalDrivers || 0,
      icon: FiUserCheck,
      color: 'green'
    },
    {
      title: 'Total Vehicles',
      value: stats?.totalVehicles || 0,
      icon: FiTruck,
      color: 'orange'
    },
    {
      title: 'New Users (7 days)',
      value: stats?.newUsersLast7Days || 0,
      icon: FiTrendingUp,
      color: 'cyan'
    },
    {
      title: 'New Users (30 days)',
      value: stats?.newUsersLast30Days || 0,
      icon: FiActivity,
      color: 'pink'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    pink: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400'
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Platform overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map((card) => {
          const CardWrapper = card.link ? Link : 'div';
          const wrapperProps = card.link ? { to: card.link } : {};

          return (
            <CardWrapper
              key={card.title}
              {...wrapperProps}
              className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 ${
                card.link ? 'hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{card.title}</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[card.color]}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Subscription Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Subscription Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {Object.entries(stats?.subscriptions || {}).map(([plan, count]) => (
            <div
              key={plan}
              className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800"
            >
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{count}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">{plan.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-red-300 dark:hover:border-red-600 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Manage Users</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">View, suspend, or impersonate users</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/companies"
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-red-300 dark:hover:border-red-600 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
              <FiBriefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Manage Companies</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">View company details and members</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Maintenance Mode */}
      <div className={`bg-white dark:bg-zinc-900 rounded-xl border-2 ${
        maintenance?.enabled
          ? 'border-red-500 dark:border-red-500'
          : 'border-zinc-200 dark:border-zinc-800'
      } p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              maintenance?.enabled
                ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              <FiAlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Maintenance Mode</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {maintenance?.enabled ? 'Currently ACTIVE - users see maintenance page' : 'System is operating normally'}
              </p>
            </div>
          </div>
          {maintenanceLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <button
              onClick={handleToggleMaintenance}
              disabled={maintenanceSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                maintenance?.enabled
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30'
                  : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30'
              }`}
            >
              {maintenance?.enabled ? (
                <><FiToggleRight className="w-5 h-5" /> Disable</>
              ) : (
                <><FiToggleLeft className="w-5 h-5" /> Enable</>
              )}
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Maintenance Message
          </label>
          <input
            type="text"
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="We are performing scheduled maintenance. Please check back shortly."
            className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        {maintenance?.enabled && maintenance?.enabledAt && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-2">
            Enabled since {new Date(maintenance.enabledAt).toLocaleString()}
            {maintenance.enabledBy && ` by ${maintenance.enabledBy}`}
          </p>
        )}
      </div>

      {/* System Health & Data Integrity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Integrity Card */}
        <div className="lg:col-span-1">
          <DataIntegrityCard />
        </div>

        {/* System Health */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
              <FiServer className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">System Health</h2>
          </div>

        {healthLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
          </div>
        ) : systemHealth ? (
          <div className="space-y-4">
            {/* Status Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Database */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <FiDatabase className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    systemHealth.database?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                    {systemHealth.database?.status || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Uptime */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <FiCpu className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Uptime</span>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formatUptime(systemHealth.uptime)}
                </span>
              </div>

              {/* Memory */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <FiServer className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Memory</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-auto">
                    {systemHealth.memory?.heapUsed
                      ? `${Math.round(systemHealth.memory.heapUsed / 1024 / 1024)}MB / ${Math.round(systemHealth.memory.heapTotal / 1024 / 1024)}MB`
                      : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      systemHealth.memory?.heapUsed / systemHealth.memory?.heapTotal > 0.85
                        ? 'bg-red-500'
                        : systemHealth.memory?.heapUsed / systemHealth.memory?.heapTotal > 0.7
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: `${systemHealth.memory?.heapTotal
                        ? Math.round((systemHealth.memory.heapUsed / systemHealth.memory.heapTotal) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Services</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Email', key: 'resend', icon: FiMail },
                  { name: 'Stripe', key: 'stripe', icon: FiCreditCard },
                  { name: 'OpenAI', key: 'openai', icon: FiCpu },
                ].map(({ name, key, icon: Icon }) => {
                  const service = systemHealth.services?.[key];
                  const isUp = service === true || service?.status === 'operational' || service?.status === 'connected';
                  return (
                    <div key={key} className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isUp ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email Stats */}
            {systemHealth.emailStats && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Recent Email Stats</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <p className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">{systemHealth.emailStats.sent || 0}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Sent (24h)</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <p className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">{systemHealth.emailStats.delivered || 0}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Delivered</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{systemHealth.emailStats.failed || 0}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Failed</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">Unable to load system health data.</p>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
