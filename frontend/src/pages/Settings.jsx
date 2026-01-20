import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI, companiesAPI, invitationsAPI, billingAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiUser, FiMail, FiLock, FiUsers, FiPlus, FiShield, FiBriefcase,
  FiCreditCard, FiTrash2, FiSend, FiCheck, FiX, FiExternalLink,
  FiArrowRight, FiStar, FiZap, FiTruck, FiAlertCircle, FiMoon, FiSun, FiMonitor
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const Settings = () => {
  const { user, companies, activeCompany, subscription, canCreateCompany, refreshUser } = useAuth();
  const { theme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [companyMembers, setCompanyMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [currentUsage, setCurrentUsage] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'viewer'
  });

  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    dotNumber: '',
    mcNumber: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer'
  });

  // Update tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'appearance', 'security', 'users', 'companies', 'billing'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      loadUsers();
    }
    if (activeTab === 'companies') {
      loadCompanyData();
    }
    if (activeTab === 'billing') {
      loadBillingData();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadCompanyData = async () => {
    if (!activeCompany) return;
    try {
      const [membersRes, sentRes, pendingRes] = await Promise.all([
        companiesAPI.getMembers(activeCompany.id || activeCompany._id),
        invitationsAPI.getSent(),
        invitationsAPI.getPending()
      ]);
      setCompanyMembers(membersRes.data.members || []);
      setSentInvitations(sentRes.data.invitations || []);
      setPendingInvitations(pendingRes.data.invitations || []);
    } catch (error) {
      console.error('Failed to load company data:', error);
    }
  };

  const loadBillingData = async () => {
    try {
      const response = await billingAPI.getSubscription();
      setCurrentUsage(response.data.usage);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.createUser(newUserForm);
      toast.success('User added successfully');
      setShowAddUserModal(false);
      setNewUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'viewer'
      });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await companiesAPI.create(newCompanyForm);
      toast.success('Company created successfully');
      setShowAddCompanyModal(false);
      setNewCompanyForm({
        name: '',
        dotNumber: '',
        mcNumber: '',
        phone: '',
        address: { street: '', city: '', state: '', zip: '' }
      });
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await companiesAPI.invite(activeCompany.id || activeCompany._id, inviteForm);
      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'viewer' });
      loadCompanyData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await companiesAPI.removeMember(activeCompany.id || activeCompany._id, userId);
      toast.success('Member removed');
      loadCompanyData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await invitationsAPI.cancel(invitationId);
      toast.success('Invitation canceled');
      loadCompanyData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const handleAcceptInvitation = async (token) => {
    try {
      await invitationsAPI.accept(token);
      toast.success('Invitation accepted');
      await refreshUser();
      loadCompanyData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (token) => {
    try {
      await invitationsAPI.decline(token);
      toast.success('Invitation declined');
      loadCompanyData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline invitation');
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await billingAPI.createPortalSession(window.location.href);
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open billing portal');
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-accent-100 text-accent-700';
      case 'admin':
        return 'bg-primary-100 text-primary-700';
      case 'safety_manager':
        return 'bg-success-100 text-success-700';
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'appearance', label: 'Appearance', icon: FiMoon },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'companies', label: 'Companies', icon: FiBriefcase },
    { id: 'billing', label: 'Billing', icon: FiCreditCard },
    ...(user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin'
      ? [{ id: 'users', label: 'Team', icon: FiUsers }]
      : [])
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage your account, companies, and subscription</p>
      </div>

      {/* Tabs */}
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 mb-6 overflow-hidden"
        style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
      >
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-accent-500 text-accent-600 dark:text-accent-400 bg-accent-50/30 dark:bg-accent-500/10'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">{user?.firstName} {user?.lastName}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 capitalize text-sm">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">First Name</label>
                <input type="text" className="form-input bg-zinc-50 dark:bg-zinc-900" value={user?.firstName || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name</label>
                <input type="text" className="form-input bg-zinc-50 dark:bg-zinc-900" value={user?.lastName || ''} disabled />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input type="email" className="form-input pl-10 bg-zinc-50 dark:bg-zinc-900" value={user?.email || ''} disabled />
                </div>
              </div>
            </div>

            {/* Active Company Info */}
            {activeCompany && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <FiBriefcase className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">Active Company</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Company:</span>
                    <span className="ml-2 font-medium text-zinc-800 dark:text-zinc-200">{activeCompany.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">DOT#:</span>
                    <span className="ml-2 font-mono font-medium text-zinc-800 dark:text-zinc-200">{activeCompany.dotNumber}</span>
                  </div>
                  {activeCompany.role && (
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Your Role:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(activeCompany.role)}`}>
                        {activeCompany.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <FiMoon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Theme</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose how VroomX Safety looks to you</p>
              </div>
            </div>

            <div className="space-y-3 max-w-md">
              {[
                { value: 'light', label: 'Light', description: 'Light background with dark text', icon: FiSun },
                { value: 'dark', label: 'Dark', description: 'Dark background with light text', icon: FiMoon },
                { value: 'system', label: 'System', description: 'Automatically match your device settings', icon: FiMonitor }
              ].map((option) => {
                const isSelected = option.value === 'system'
                  ? !localStorage.getItem('vroomx-theme')
                  : theme === option.value && localStorage.getItem('vroomx-theme');
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (option.value === 'system') setSystemTheme();
                      else if (option.value === 'dark') setDarkTheme();
                      else setLightTheme();
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-accent-500/20 text-accent-600 dark:text-accent-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      <option.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`font-medium ${isSelected ? 'text-accent-700 dark:text-accent-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {option.label}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
                <FiShield className="w-4 h-4 text-warning-600 dark:text-warning-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Current Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="password"
                    className="form-input pl-10"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="password"
                    className="form-input pl-10"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="password"
                    className="form-input pl-10"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div>
            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div className="px-6 py-4 bg-accent-50/50 dark:bg-accent-500/10 border-b border-accent-200 dark:border-accent-500/30">
                <h4 className="text-sm font-semibold text-accent-800 dark:text-accent-400 mb-3 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  Pending Invitations
                </h4>
                <div className="space-y-2">
                  {pendingInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-accent-200 dark:border-accent-500/30"
                    >
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{inv.company.name}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Invited as {inv.role?.replace('_', ' ')} by {inv.invitedBy.firstName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptInvitation(inv.token)}
                          className="btn btn-success btn-sm"
                        >
                          <FiCheck className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(inv.token)}
                          className="btn btn-secondary btn-sm"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company List Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <FiBriefcase className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Your Companies</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {companies.length} of {subscription?.limits?.maxCompanies === Infinity ? 'unlimited' : subscription?.limits?.maxCompanies || 1} companies
                  </p>
                </div>
              </div>
              {canCreateCompany() ? (
                <button
                  onClick={() => setShowAddCompanyModal(true)}
                  className="btn btn-primary"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Company
                </button>
              ) : (
                <button
                  onClick={() => navigate('/app/billing')}
                  className="btn btn-secondary text-accent-600 dark:text-accent-400"
                >
                  <FiZap className="w-4 h-4" />
                  Upgrade to Add More
                </button>
              )}
            </div>

            {/* Company List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {companies.map((company) => {
                const isActive = (company.id || company._id) === (activeCompany?.id || activeCompany?._id);
                return (
                  <div
                    key={company.id || company._id}
                    className={`px-6 py-4 flex items-center justify-between ${isActive ? 'bg-accent-50/30 dark:bg-accent-500/10' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-accent-500/20' : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}>
                        <FiBriefcase className={`w-5 h-5 ${isActive ? 'text-accent-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-zinc-900 dark:text-white">{company.name}</p>
                          {isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-400 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">DOT# {company.dotNumber}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(company.role)}`}>
                            {company.role?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {company.role === 'owner' && (
                        <button
                          onClick={() => {
                            setShowInviteModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <FiSend className="w-4 h-4" />
                          Invite
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Company Members Section (for active company) */}
            {activeCompany && (activeCompany.role === 'owner' || activeCompany.role === 'admin') && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 mt-4">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {activeCompany.name} - Team Members
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    Invite Member
                  </button>
                </div>

                {companyMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <FiUsers className="w-10 h-10 text-zinc-400 dark:text-primary-500 mx-auto mb-2" />
                    <p className="text-zinc-500 dark:text-zinc-400">No team members yet</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Invite people to join this company</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {companyMembers.map((member) => (
                      <div key={member.userId} className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                            {member.role?.replace('_', ' ').toUpperCase()}
                          </span>
                          {member.role !== 'owner' && activeCompany.role === 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/20 rounded"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sent Invitations */}
                {sentInvitations.filter(i => i.status === 'pending').length > 0 && (
                  <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h5 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Pending Invitations</h5>
                    <div className="space-y-2">
                      {sentInvitations.filter(i => i.status === 'pending').map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800"
                        >
                          <div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{inv.email}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Invited as {inv.role?.replace('_', ' ')}</p>
                          </div>
                          <button
                            onClick={() => handleCancelInvitation(inv.id)}
                            className="text-xs text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                  {subscription?.plan === 'professional' ? (
                    <FiZap className="w-6 h-6 text-white" />
                  ) : (
                    <FiStar className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Current Plan</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 capitalize">
                    {subscription?.plan?.replace('_', ' ') || 'Free Trial'}
                    {subscription?.status === 'trialing' && (
                      <span className="ml-2 text-accent-600 dark:text-accent-400">
                        ({subscription.trialDaysRemaining} days left)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/billing')}
                className="btn btn-primary"
              >
                Manage Subscription
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary-200/50 dark:border-primary-700">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
                  <FiBriefcase className="w-4 h-4" />
                  <span className="text-sm font-medium">Companies</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {currentUsage?.companies || companies.length}
                  <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                    / {subscription?.limits?.maxCompanies === Infinity ? '∞' : subscription?.limits?.maxCompanies || 1}
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary-200/50 dark:border-primary-700">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
                  <FiUsers className="w-4 h-4" />
                  <span className="text-sm font-medium">Drivers (active company)</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {currentUsage?.drivers || 0}
                  <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                    / {subscription?.limits?.maxDriversPerCompany === Infinity ? '∞' : subscription?.limits?.maxDriversPerCompany || 3}
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-primary-200/50 dark:border-primary-700">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
                  <FiTruck className="w-4 h-4" />
                  <span className="text-sm font-medium">Vehicles (active company)</span>
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {currentUsage?.vehicles || 0}
                  <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                    / {subscription?.limits?.maxVehiclesPerCompany === Infinity ? '∞' : subscription?.limits?.maxVehiclesPerCompany || 3}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              {subscription?.stripeSubscriptionId && (
                <button
                  onClick={handleManageBilling}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? <LoadingSpinner size="sm" /> : (
                    <>
                      <FiCreditCard className="w-4 h-4" />
                      Update Payment Method
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate('/app/billing')}
                className="btn btn-secondary"
              >
                View Invoices
                <FiExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Team Users Tab */}
        {activeTab === 'users' && (user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin') && (
          <div>
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <FiUsers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Team Members</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="btn btn-primary"
              >
                <FiPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
            <div>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <FiUsers className="w-7 h-7 text-zinc-400" />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium">No team members yet</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Add users to your team to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-200 dark:border-primary-700 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {users.map((teamUser, index) => (
                        <tr
                          key={teamUser._id}
                          className={`hover:bg-accent-50/50 dark:hover:bg-accent-500/10 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/30 dark:bg-zinc-800/30'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                {teamUser.firstName?.[0]}{teamUser.lastName?.[0]}
                              </div>
                              <span className="font-medium text-zinc-900 dark:text-white">{teamUser.firstName} {teamUser.lastName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{teamUser.email}</td>
                          <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300 capitalize">{teamUser.role?.replace('_', ' ')}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={teamUser.isActive ? 'active' : 'inactive'} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Add Team Member"
        icon={FiUsers}
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">First Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={newUserForm.firstName}
                onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={newUserForm.lastName}
                onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="email"
                className="form-input pl-10"
                required
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Password *</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="password"
                className="form-input pl-10"
                required
                minLength={8}
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Role *</label>
            <select
              className="form-select"
              required
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
            >
              <option value="viewer">Viewer</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="safety_manager">Safety Manager</option>
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Viewers can only view data. Safety Managers can edit. Dispatchers have limited access.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Add User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Company Modal */}
      <Modal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        title="Add New Company"
        icon={FiBriefcase}
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Company Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={newCompanyForm.name}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
              placeholder="ABC Trucking LLC"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">DOT Number *</label>
              <input
                type="text"
                className="form-input font-mono"
                required
                value={newCompanyForm.dotNumber}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, dotNumber: e.target.value })}
                placeholder="1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">MC Number</label>
              <input
                type="text"
                className="form-input font-mono"
                value={newCompanyForm.mcNumber}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, mcNumber: e.target.value })}
                placeholder="MC-123456"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={newCompanyForm.phone}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Street Address</label>
            <input
              type="text"
              className="form-input"
              value={newCompanyForm.address.street}
              onChange={(e) => setNewCompanyForm({
                ...newCompanyForm,
                address: { ...newCompanyForm.address, street: e.target.value }
              })}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">City</label>
              <input
                type="text"
                className="form-input"
                value={newCompanyForm.address.city}
                onChange={(e) => setNewCompanyForm({
                  ...newCompanyForm,
                  address: { ...newCompanyForm.address, city: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">State</label>
              <input
                type="text"
                className="form-input"
                maxLength={2}
                value={newCompanyForm.address.state}
                onChange={(e) => setNewCompanyForm({
                  ...newCompanyForm,
                  address: { ...newCompanyForm.address, state: e.target.value.toUpperCase() }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">ZIP</label>
              <input
                type="text"
                className="form-input"
                value={newCompanyForm.address.zip}
                onChange={(e) => setNewCompanyForm({
                  ...newCompanyForm,
                  address: { ...newCompanyForm.address, zip: e.target.value }
                })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={() => setShowAddCompanyModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Create Company'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={`Invite to ${activeCompany?.name}`}
        icon={FiSend}
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="email"
                className="form-input pl-10"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="colleague@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Role *</label>
            <select
              className="form-select"
              required
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            >
              <option value="viewer">Viewer</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="safety_manager">Safety Manager</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Admins have full access. Safety Managers can edit. Viewers are read-only.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : (
                <>
                  <FiSend className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
