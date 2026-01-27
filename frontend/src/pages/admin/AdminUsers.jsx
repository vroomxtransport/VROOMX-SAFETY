import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import {
  FiSearch, FiUser, FiMail, FiCalendar, FiMoreVertical,
  FiUserX, FiUserCheck, FiLogIn, FiCreditCard, FiTrash2,
  FiChevronLeft, FiChevronRight, FiShield, FiKey, FiPlus, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import UserDetailDrawer from './UserDetailDrawer';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({ plan: '', status: '' });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Add User modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ email: '', firstName: '', lastName: '', password: '', plan: 'free_trial' });
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Bulk actions
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // User detail drawer
  const [drawerUserId, setDrawerUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ page, limit: 20, search });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already triggered by the useEffect
  };

  const handleSuspend = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isSuspended ? 'unsuspend' : 'suspend'} ${user.email}?`)) {
      return;
    }

    try {
      await adminAPI.updateUser(user._id, {
        isSuspended: !user.isSuspended,
        suspendedReason: !user.isSuspended ? 'Suspended by admin' : null
      });
      toast.success(`User ${user.isSuspended ? 'unsuspended' : 'suspended'} successfully`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
    setActionMenuOpen(null);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to DELETE ${user.email}? This cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(user._id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
    setActionMenuOpen(null);
  };

  const handleImpersonate = async (user) => {
    if (!window.confirm(`Are you sure you want to impersonate ${user.email}? You will be logged in as this user for up to 1 hour.`)) {
      setActionMenuOpen(null);
      return;
    }

    try {
      const response = await adminAPI.impersonateUser(user._id);
      const { token } = response.data;

      // Store original admin token for returning
      const currentToken = localStorage.getItem('token');
      localStorage.setItem('adminToken', currentToken);

      // Store impersonation token and details
      localStorage.setItem('token', token);
      localStorage.setItem('impersonating', 'true');
      localStorage.setItem('impersonatedUser', user.email);

      toast.success(`Now impersonating ${user.email}. Token valid for 1 hour.`);

      // Use React Router navigate to preserve state
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to impersonate user');
    }
    setActionMenuOpen(null);
  };

  const handleSubscriptionUpdate = async () => {
    try {
      setSubscriptionLoading(true);
      await adminAPI.updateSubscription(selectedUser._id, subscriptionForm);
      toast.success('Subscription updated successfully');
      setShowSubscriptionModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const closeSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    setSelectedUser(null);
    setSubscriptionForm({ plan: '', status: '' });
  };

  const openSubscriptionModal = (user) => {
    setSelectedUser(user);
    setSubscriptionForm({
      plan: user.subscription?.plan || '',
      status: user.subscription?.status || ''
    });
    setShowSubscriptionModal(true);
    setActionMenuOpen(null);
  };

  const handleToggleSuperAdmin = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isSuperAdmin ? 'remove' : 'grant'} super admin privileges for ${user.email}?`)) {
      return;
    }

    try {
      await adminAPI.updateUser(user._id, { isSuperAdmin: !user.isSuperAdmin });
      toast.success(`Super admin ${user.isSuperAdmin ? 'removed' : 'granted'} successfully`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
    setActionMenuOpen(null);
  };

  const handleForcePasswordReset = async (user) => {
    if (!window.confirm(`Force password reset for ${user.email}? They will receive a reset email.`)) {
      return;
    }
    try {
      await adminAPI.forcePasswordReset(user._id);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to force password reset');
    }
    setActionMenuOpen(null);
  };

  const handleCreateUser = async () => {
    try {
      setAddUserLoading(true);
      await adminAPI.createUser(addUserForm);
      toast.success('User created successfully');
      setShowAddUserModal(false);
      setAddUserForm({ email: '', firstName: '', lastName: '', password: '', plan: 'free_trial' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u._id)));
    }
  };

  const handleSelectUser = (userId) => {
    const next = new Set(selectedUsers);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedUsers(next);
  };

  const handleBulkAction = async (action) => {
    const userIds = Array.from(selectedUsers);
    const count = userIds.length;

    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to DELETE ${count} user(s)? This cannot be undone.`)) return;
      if (!window.confirm(`FINAL WARNING: This will permanently delete ${count} user(s) and all their data. Proceed?`)) return;
    } else {
      if (!window.confirm(`Apply "${action}" to ${count} user(s)?`)) return;
    }

    try {
      await adminAPI.bulkAction({ action, userIds });
      toast.success(`Bulk ${action} applied to ${count} user(s)`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || `Bulk ${action} failed`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Users</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {pagination?.total || 0} total users
          </p>
        </div>

        {/* Search + Add User */}
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name..."
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedUsers.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction('suspend')}
              className="px-3 py-1.5 text-sm font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
            >
              Suspend
            </button>
            <button
              onClick={() => handleBulkAction('unsuspend')}
              className="px-3 py-1.5 text-sm font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
            >
              Unsuspend
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 text-sm font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUsers.size === users.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Subscription</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Companies</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Joined</th>
                  <th className="text-right px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div
                          className="cursor-pointer"
                          onClick={() => setDrawerUserId(user._id)}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.isSuperAdmin && (
                              <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-300 transition-colors">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.subscription?.status === 'active' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                        user.subscription?.status === 'trialing' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                        'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {user.subscription?.plan || 'none'} / {user.subscription?.status || 'none'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-zinc-900 dark:text-white">
                        {user.companies?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {user.isSuspended ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                          Suspended
                        </span>
                      ) : user.isActive ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <FiMoreVertical className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                      </button>

                      {/* Action Menu */}
                      {actionMenuOpen === user._id && (
                        <div className="absolute right-4 top-12 z-10 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1">
                          <button
                            onClick={() => handleImpersonate(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            <FiLogIn className="w-4 h-4" />
                            Impersonate
                          </button>
                          <button
                            onClick={() => openSubscriptionModal(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            <FiCreditCard className="w-4 h-4" />
                            Edit Subscription
                          </button>
                          <button
                            onClick={() => handleToggleSuperAdmin(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            <FiShield className="w-4 h-4" />
                            {user.isSuperAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleForcePasswordReset(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            <FiKey className="w-4 h-4" />
                            Force Reset Password
                          </button>
                          <button
                            onClick={() => handleSuspend(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            {user.isSuspended ? (
                              <>
                                <FiUserCheck className="w-4 h-4" />
                                Unsuspend
                              </>
                            ) : (
                              <>
                                <FiUserX className="w-4 h-4" />
                                Suspend
                              </>
                            )}
                          </button>
                          <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
                          <button
                            onClick={() => handleDelete(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Delete User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => { setShowAddUserModal(false); setAddUserForm({ email: '', firstName: '', lastName: '', password: '', plan: 'free_trial' }); }}
        title="Create New User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={addUserForm.email}
              onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
              className="form-input"
              placeholder="user@example.com"
              disabled={addUserLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">First Name</label>
              <input
                type="text"
                value={addUserForm.firstName}
                onChange={(e) => setAddUserForm({ ...addUserForm, firstName: e.target.value })}
                className="form-input"
                disabled={addUserLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Last Name</label>
              <input
                type="text"
                value={addUserForm.lastName}
                onChange={(e) => setAddUserForm({ ...addUserForm, lastName: e.target.value })}
                className="form-input"
                disabled={addUserLoading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              value={addUserForm.password}
              onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
              className="form-input"
              placeholder="Min 8 characters"
              disabled={addUserLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Plan</label>
            <select
              value={addUserForm.plan}
              onChange={(e) => setAddUserForm({ ...addUserForm, plan: e.target.value })}
              className="form-input"
              disabled={addUserLoading}
            >
              <option value="free_trial">Free Trial</option>
              <option value="solo">Solo</option>
              <option value="starter">Starter</option>
              <option value="fleet">Fleet</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setShowAddUserModal(false); setAddUserForm({ email: '', firstName: '', lastName: '', password: '', plan: 'free_trial' }); }}
              className="btn btn-secondary"
              disabled={addUserLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              className="btn btn-primary"
              disabled={addUserLoading || !addUserForm.email || !addUserForm.firstName || !addUserForm.lastName || !addUserForm.password}
            >
              {addUserLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        isOpen={showSubscriptionModal}
        onClose={closeSubscriptionModal}
        title="Edit Subscription"
      >
        <div className="space-y-4">
          {selectedUser && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Editing subscription for: <span className="font-medium text-zinc-900 dark:text-white">{selectedUser.email}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Plan
            </label>
            <select
              value={subscriptionForm.plan}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, plan: e.target.value })}
              className="form-input"
              disabled={subscriptionLoading}
            >
              <option value="">Select plan</option>
              <option value="free_trial">Free Trial</option>
              <option value="solo">Solo</option>
              <option value="fleet">Fleet</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Status
            </label>
            <select
              value={subscriptionForm.status}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, status: e.target.value })}
              className="form-input"
              disabled={subscriptionLoading}
            >
              <option value="">Select status</option>
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending_payment">Pending Payment</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={closeSubscriptionModal}
              className="btn btn-secondary"
              disabled={subscriptionLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubscriptionUpdate}
              className="btn btn-primary"
              disabled={subscriptionLoading}
            >
              {subscriptionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* User Detail Drawer */}
      {drawerUserId && (
        <UserDetailDrawer
          userId={drawerUserId}
          onClose={() => setDrawerUserId(null)}
          onUserUpdated={() => {
            fetchUsers();
            setDrawerUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminUsers;
