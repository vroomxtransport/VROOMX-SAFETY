import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { authAPI, companiesAPI, invitationsAPI, billingAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiUsers, FiBriefcase, FiCreditCard, FiMoon, FiBell, FiClipboard, FiDatabase } from 'react-icons/fi';
import {
  ProfileTab,
  AppearanceTab,
  SecurityTab,
  NotificationsTab,
  BillingTab,
  UsersTab,
  CompaniesTab,
  AddUserModal,
  AddCompanyModal,
  InviteMemberModal,
  AuditLogTab,
  DataAuditTab
} from '../components/settings';

const Settings = () => {
  const { user, companies, activeCompany, subscription, canCreateCompany, refreshUser } = useAuth();
  const { theme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const [searchParams] = useSearchParams();
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
    address: { street: '', city: '', state: '', zip: '' }
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer'
  });

  // Update tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'appearance', 'security', 'notifications', 'users', 'companies', 'billing', 'audit', 'dataaudit'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) loadUsers();
    if (activeTab === 'companies') loadCompanyData();
    if (activeTab === 'billing') loadBillingData();
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
    }
  };

  const loadBillingData = async () => {
    try {
      const response = await billingAPI.getSubscription();
      setCurrentUsage(response.data.usage);
    } catch (error) {
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
      setNewUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'viewer' });
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
      setNewCompanyForm({ name: '', dotNumber: '', mcNumber: '', phone: '', address: { street: '', city: '', state: '', zip: '' } });
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
      case 'owner': return 'bg-accent-100 text-accent-700';
      case 'admin': return 'bg-primary-100 text-primary-700';
      case 'safety_manager': return 'bg-success-100 text-success-700';
      default: return 'bg-primary-100 text-primary-600';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'appearance', label: 'Appearance', icon: FiMoon },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'companies', label: 'Companies', icon: FiBriefcase },
    { id: 'billing', label: 'Billing', icon: FiCreditCard },
    ...(user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin'
      ? [{ id: 'users', label: 'Team', icon: FiUsers }]
      : []),
    ...(user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin'
      ? [{ id: 'audit', label: 'Audit Log', icon: FiClipboard }]
      : []),
    ...(user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin'
      ? [{ id: 'dataaudit', label: 'Data Audit', icon: FiDatabase }]
      : [])
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      {/* Page Header */}
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">Manage your account, companies, and subscription</p>
      </div>

      {/* Tabs */}
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 mb-6 overflow-hidden"
        style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
      >
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-thin flex-nowrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 -mb-px transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-accent-500 text-accent-600 dark:text-accent-400 bg-accent-50/30 dark:bg-accent-500/10'
                    : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50/30 dark:hover:bg-accent-500/10 hover:border-accent-300 dark:hover:border-accent-500/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'profile' && (
          <ProfileTab user={user} activeCompany={activeCompany} getRoleBadgeColor={getRoleBadgeColor} />
        )}

        {activeTab === 'appearance' && (
          <AppearanceTab
            theme={theme}
            setLightTheme={setLightTheme}
            setDarkTheme={setDarkTheme}
            setSystemTheme={setSystemTheme}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            handlePasswordChange={handlePasswordChange}
            loading={loading}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab user={user} />
        )}

        {activeTab === 'companies' && (
          <CompaniesTab
            companies={companies}
            activeCompany={activeCompany}
            subscription={subscription}
            canCreateCompany={canCreateCompany}
            pendingInvitations={pendingInvitations}
            sentInvitations={sentInvitations}
            companyMembers={companyMembers}
            getRoleBadgeColor={getRoleBadgeColor}
            setShowAddCompanyModal={setShowAddCompanyModal}
            setShowInviteModal={setShowInviteModal}
            handleAcceptInvitation={handleAcceptInvitation}
            handleDeclineInvitation={handleDeclineInvitation}
            handleRemoveMember={handleRemoveMember}
            handleCancelInvitation={handleCancelInvitation}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            subscription={subscription}
            companies={companies}
            currentUsage={currentUsage}
            handleManageBilling={handleManageBilling}
            loading={loading}
          />
        )}

        {activeTab === 'users' && (user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin') && (
          <UsersTab users={users} setShowAddUserModal={setShowAddUserModal} />
        )}

        {activeTab === 'audit' && (user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin') && (
          <AuditLogTab />
        )}

        {activeTab === 'dataaudit' && (user?.role === 'admin' || activeCompany?.role === 'owner' || activeCompany?.role === 'admin') && (
          <DataAuditTab />
        )}
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        handleAddUser={handleAddUser}
        loading={loading}
      />

      <AddCompanyModal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        newCompanyForm={newCompanyForm}
        setNewCompanyForm={setNewCompanyForm}
        handleCreateCompany={handleCreateCompany}
        loading={loading}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        activeCompany={activeCompany}
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
        handleInviteMember={handleInviteMember}
        loading={loading}
      />
    </div>
  );
};

export default Settings;
