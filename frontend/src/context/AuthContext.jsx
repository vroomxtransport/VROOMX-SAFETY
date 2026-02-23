import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import posthog from 'posthog-js';
import api, { companiesAPI, setAuthToken, clearAuthToken, setRefreshToken, getRefreshToken } from '../utils/api';

const AuthContext = createContext(null);
const normalizeCompanies = (value) => (Array.isArray(value) ? value : []);

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

  const buildSubscription = (sub, limits, usage) => ({
    plan: sub?.plan || null,
    status: sub?.status || null,
    trialEndsAt: sub?.trialEndsAt || null,
    trialDaysRemaining: sub?.trialDaysRemaining || 0,
    currentPeriodEnd: sub?.currentPeriodEnd || null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
    limits: limits || null,
    usage: usage || null,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      setCompanies(normalizeCompanies(userData.companies));
      setActiveCompany(userData.activeCompany || userData.company);
      setSubscription(buildSubscription(userData.subscription, userData.limits, userData.usage));
    } catch (error) {
      // If 401, try refreshing the token first (access token may have expired
      // but refresh token is still valid — the interceptor skips refresh for /auth/me)
      if (error.response?.status === 401) {
        try {
          const refreshRes = await api.post('/auth/refresh', {
            refreshToken: getRefreshToken()
          });
          if (refreshRes.data.token) setAuthToken(refreshRes.data.token);
          if (refreshRes.data.refreshToken) setRefreshToken(refreshRes.data.refreshToken);
          // Retry with new token
          const retryRes = await api.get('/auth/me');
          const userData = retryRes.data.user;
          setUser(userData);
          setCompanies(normalizeCompanies(userData.companies));
          setActiveCompany(userData.activeCompany || userData.company);
          setSubscription(buildSubscription(userData.subscription, userData.limits, userData.usage));
          return; // Success — don't clear state
        } catch {
          // Refresh also failed — truly not authenticated
        }
      }
      // No session — just clear state (don't call logout API)
      clearAuthToken();
      setUser(null);
      setCompanies([]);
      setActiveCompany(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, check if we have a valid session via httpOnly cookie
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password, companyId = null) => {
    const response = await api.post('/auth/login', { email, password, companyId });
    const { token, refreshToken, user: userData } = response.data;
    // Store tokens in memory for Authorization header (works on all browsers/mobile)
    if (token) setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);

    setUser(userData);
    setCompanies(normalizeCompanies(userData.companies));
    setActiveCompany(userData.activeCompany || userData.company);
    setSubscription(buildSubscription(userData.subscription, userData.limits));

    // PostHog: identify user on login
    posthog.identify(userData._id, {
      email: userData.email,
      name: userData.name,
      company_id: userData.activeCompany?._id || userData.company?._id,
      plan: userData.subscription?.plan,
    });

    return userData;
  };

  const demoLogin = async () => {
    const response = await api.post('/auth/demo-login');
    const { token, refreshToken, user: userData } = response.data;
    // Store tokens in memory for Authorization header
    if (token) setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);

    setUser({ ...userData, isDemo: true });
    setCompanies(normalizeCompanies(userData.companies));
    setActiveCompany(userData.activeCompany || userData.company);
    setSubscription(buildSubscription(
      { ...userData.subscription, plan: userData.subscription?.plan || 'fleet', status: userData.subscription?.status || 'active', trialDaysRemaining: userData.subscription?.trialDaysRemaining || 30 },
      userData.limits
    ));

    // PostHog: identify demo user
    posthog.identify(userData._id, {
      email: userData.email,
      name: userData.name,
      company_id: userData.activeCompany?._id || userData.company?._id,
      plan: userData.subscription?.plan || 'fleet',
      is_demo: true,
    });

    return userData;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    const { token, refreshToken, user: userData } = response.data;
    // Store tokens in memory for Authorization header
    if (token) setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);

    setUser(userData);
    setCompanies(normalizeCompanies(userData.companies));
    setActiveCompany(userData.activeCompany || userData.company);
    setSubscription(buildSubscription(userData.subscription, userData.limits));

    // PostHog: identify user and track signup
    posthog.identify(userData._id, {
      email: userData.email,
      name: userData.name,
      company_id: userData.activeCompany?._id || userData.company?._id,
      plan: userData.subscription?.plan,
    });
    posthog.capture('user_signed_up', {
      plan: userData.subscription?.plan,
    });

    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Clears httpOnly cookie on server
    } catch {
      // Ignore errors — still clear local state
    }
    clearAuthToken(); // Also clears refresh token from sessionStorage
    setUser(null);
    setCompanies([]);
    setActiveCompany(null);
    setSubscription(null);

    // PostHog: reset user identity on logout
    posthog.reset();

  };

  // Switch to a different company
  const switchCompany = useCallback(async (companyId) => {
    const response = await companiesAPI.switch(companyId);
    const { company } = response.data;
    // Token cookie is updated by the server

    // Update active company
    setActiveCompany(company);

    // PostHog: track company switch
    posthog.capture('company_switched', { company_id: company._id });

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
    const ownedCompanies = normalizeCompanies(companies).filter(c => c.role === 'owner').length;
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
  }, [fetchUser]);

  const value = {
    user,
    companies,
    activeCompany,
    subscription,
    loading,
    isAuthenticated: !!user,
    isDemo: user?.isDemo || false,
    login,
    demoLogin,
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
