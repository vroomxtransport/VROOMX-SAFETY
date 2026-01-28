import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { companiesAPI, setAuthToken, clearAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a valid session via httpOnly cookie
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await fetchUser();
    } catch {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      setCompanies(userData.companies || []);
      setActiveCompany(userData.activeCompany || userData.company);
      setSubscription({
        plan: userData.subscription?.plan || null,
        status: userData.subscription?.status || null,
        trialEndsAt: userData.subscription?.trialEndsAt || null,
        trialDaysRemaining: userData.subscription?.trialDaysRemaining || 0,
        currentPeriodEnd: userData.subscription?.currentPeriodEnd || null,
        cancelAtPeriodEnd: userData.subscription?.cancelAtPeriodEnd || false,
        limits: userData.limits,
        usage: userData.usage
      });
    } catch (error) {
      // No session — just clear state (don't call logout API)
      clearAuthToken();
      setUser(null);
      setCompanies([]);
      setActiveCompany(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, companyId = null) => {
    const response = await api.post('/auth/login', { email, password, companyId });
    const { token, user: userData } = response.data;
    // Store token in memory for Authorization header (works on all browsers/mobile)
    if (token) setAuthToken(token);

    setUser(userData);
    setCompanies(userData.companies || []);
    setActiveCompany(userData.activeCompany || userData.company);
    setSubscription({
      plan: userData.subscription?.plan || null,
      status: userData.subscription?.status || null,
      trialEndsAt: userData.subscription?.trialEndsAt || null,
      trialDaysRemaining: userData.subscription?.trialDaysRemaining || 0,
      currentPeriodEnd: userData.subscription?.currentPeriodEnd || null,
      cancelAtPeriodEnd: userData.subscription?.cancelAtPeriodEnd || false,
      limits: userData.limits
    });

    // Store last active company ID (UX data, not a secret)
    if (userData.activeCompany?.id) {
      localStorage.setItem('lastActiveCompanyId', userData.activeCompany.id);
    }

    return userData;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    const { token, user: userData } = response.data;
    // Store token in memory for Authorization header
    if (token) setAuthToken(token);

    setUser(userData);
    setCompanies(userData.companies || []);
    setActiveCompany(userData.activeCompany || userData.company);
    setSubscription({
      plan: userData.subscription?.plan || null,
      status: userData.subscription?.status || null,
      trialEndsAt: userData.subscription?.trialEndsAt || null,
      trialDaysRemaining: userData.subscription?.trialDaysRemaining || 0,
      limits: userData.limits
    });

    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Clears httpOnly cookie on server
    } catch {
      // Ignore errors — still clear local state
    }
    clearAuthToken();
    setUser(null);
    setCompanies([]);
    setActiveCompany(null);
    setSubscription(null);
  };

  // Switch to a different company
  const switchCompany = useCallback(async (companyId) => {
    const response = await companiesAPI.switch(companyId);
    const { company } = response.data;
    // Token cookie is updated by the server

    localStorage.setItem('lastActiveCompanyId', companyId);

    // Update active company
    setActiveCompany(company);

    // Dispatch event for other components to refresh their data
    window.dispatchEvent(new CustomEvent('companySwitch', { detail: company }));

    return company;
  }, []);

  // Check permission for a resource/action
  const hasPermission = useCallback((resource, action) => {
    if (!user) return false;
    // Owner and admin have full access
    if (['owner', 'admin'].includes(user.role) || ['owner', 'admin'].includes(activeCompany?.role)) {
      return true;
    }
    return user.permissions?.[resource]?.[action] || false;
  }, [user, activeCompany]);

  // Check if user can create a new company based on subscription
  const canCreateCompany = useCallback(() => {
    if (!subscription?.limits) return false;
    const ownedCompanies = companies.filter(c => c.role === 'owner').length;
    const maxCompanies = subscription.limits.maxCompanies;
    return maxCompanies === Infinity || ownedCompanies < maxCompanies;
  }, [companies, subscription]);

  // Check if user can create a driver (for current company)
  const canCreateDriver = useCallback((currentCount) => {
    if (!subscription?.limits) return true;
    const maxDrivers = subscription.limits.maxDriversPerCompany;
    return maxDrivers === Infinity || currentCount < maxDrivers;
  }, [subscription]);

  // Check if user can create a vehicle (for current company)
  const canCreateVehicle = useCallback((currentCount) => {
    if (!subscription?.limits) return true;
    const maxVehicles = subscription.limits.maxVehiclesPerCompany;
    return maxVehicles === Infinity || currentCount < maxVehicles;
  }, [subscription]);

  // Check if subscription is active
  const isSubscriptionActive = useCallback(() => {
    const activeStatuses = ['trialing', 'active'];
    return activeStatuses.includes(subscription?.status);
  }, [subscription]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, []);

  const value = {
    user,
    companies,
    activeCompany,
    subscription,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    switchCompany,
    hasPermission,
    canCreateCompany,
    canCreateDriver,
    canCreateVehicle,
    isSubscriptionActive,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
