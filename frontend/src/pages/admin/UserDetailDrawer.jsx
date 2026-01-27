import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiX, FiUser, FiBriefcase, FiClock, FiActivity,
  FiMail, FiCalendar, FiShield, FiUserX, FiUserCheck,
  FiRefreshCw, FiMonitor
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'profile', label: 'Profile', icon: FiUser },
  { key: 'companies', label: 'Companies', icon: FiBriefcase },
  { key: 'logins', label: 'Login History', icon: FiClock },
  { key: 'audit', label: 'Audit Log', icon: FiActivity },
];

const ACTION_COLORS = {
  create: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  update: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  delete: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
  login: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  logout: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
  password_change: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  role_change: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
};

const UserDetailDrawer = ({ isOpen, onClose, userId, onUserUpdated }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetail = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [userRes, loginsRes, auditRes] = await Promise.all([
        adminAPI.getUser(userId),
        adminAPI.getLoginHistory(userId).catch(() => ({ data: { history: [] } })),
        adminAPI.getUserAuditLog(userId).catch(() => ({ data: { logs: [] } })),
      ]);
      setUser(userRes.data.user || userRes.data);
      setLoginHistory(loginsRes.data.history || loginsRes.data.logins || []);
      setAuditLogs(auditRes.data.logs || auditRes.data.auditLogs || []);
    } catch (err) {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      setActiveTab('profile');
      fetchUserDetail();
    }
  }, [isOpen, userId, fetchUserDetail]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSuspendToggle = async () => {
    if (!user) return;
    const action = user.isSuspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

    try {
      setActionLoading(true);
      await adminAPI.updateUser(user._id, {
        isSuspended: !user.isSuspended,
        suspendedReason: !user.isSuspended ? 'Suspended by admin' : null
      });
      toast.success(`User ${action}ed successfully`);
      fetchUserDetail();
      onUserUpdated?.();
    } catch (err) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceReset = async () => {
    if (!user) return;
    if (!window.confirm(`Send a password reset email to ${user.email}?`)) return;

    try {
      setActionLoading(true);
      await adminAPI.forcePasswordReset(user._id);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error('Failed to send password reset');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100vh - 120px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : !user ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-zinc-600 dark:text-zinc-400">User not found</p>
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* User info card */}
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        <FiUser className="w-7 h-7 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <FiMail className="w-3.5 h-3.5" />
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.isSuperAdmin && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                          Super Admin
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isSuspended
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                          : user.isActive
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {user.isSuspended ? 'Suspended' : user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 capitalize">
                        {(user.role || 'user').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400">Created</p>
                        <p className="font-medium text-zinc-900 dark:text-white flex items-center gap-1">
                          <FiCalendar className="w-3.5 h-3.5" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400">Last Login</p>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Subscription</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400">Plan</p>
                        <p className="font-medium text-zinc-900 dark:text-white capitalize">
                          {user.subscription?.plan || 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.subscription?.status === 'active'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            : user.subscription?.status === 'trialing'
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {user.subscription?.status || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSuspendToggle}
                      disabled={actionLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        user.isSuspended
                          ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20'
                          : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20'
                      }`}
                    >
                      {user.isSuspended ? <FiUserCheck className="w-4 h-4" /> : <FiUserX className="w-4 h-4" />}
                      {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      onClick={handleForceReset}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-500/20 transition-colors"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Force Password Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Companies Tab */}
              {activeTab === 'companies' && (
                <div className="space-y-3">
                  {user.companies?.length > 0 ? (
                    user.companies.map((membership) => (
                      <div
                        key={membership._id || membership.company?._id}
                        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {membership.company?.name || membership.name || 'Unknown Company'}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            DOT# {membership.company?.dotNumber || membership.dotNumber || '-'}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          membership.role === 'owner'
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : membership.role === 'admin'
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {membership.role || 'member'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                      <FiBriefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">No company memberships</p>
                    </div>
                  )}
                </div>
              )}

              {/* Login History Tab */}
              {activeTab === 'logins' && (
                <div className="space-y-1">
                  {loginHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Timestamp</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wide">IP Address</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wide">User Agent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {loginHistory.map((entry, index) => (
                            <tr key={entry._id || index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 font-mono">
                                {entry.ipAddress || entry.ip || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 max-w-xs truncate">
                                <span className="flex items-center gap-1">
                                  <FiMonitor className="w-3.5 h-3.5 flex-shrink-0" />
                                  {entry.userAgent || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                      <FiClock className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">No login history found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Audit Log Tab */}
              {activeTab === 'audit' && (
                <div className="space-y-1">
                  {auditLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Timestamp</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Action</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Resource</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {auditLogs.map((log, index) => (
                            <tr key={log._id || index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                {new Date(log.timestamp || log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  ACTION_COLORS[log.action] || 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                                }`}>
                                  {(log.action || '').replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 capitalize">
                                {(log.resource || '-').replace(/_/g, ' ')}
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                                {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)).substring(0, 60) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                      <FiActivity className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-600 dark:text-zinc-400 font-medium">No audit logs found</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UserDetailDrawer;
