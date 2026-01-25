import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { FiUsers, FiBriefcase, FiTruck, FiUserCheck, FiTrendingUp, FiActivity } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Platform overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
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

      {/* Subscription Breakdown */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Subscription Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(stats?.subscriptions || {}).map(([plan, count]) => (
            <div
              key={plan}
              className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800"
            >
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{count}</p>
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
    </div>
  );
};

export default AdminDashboard;
