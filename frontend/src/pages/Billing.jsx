import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiCreditCard, FiCheck, FiX, FiStar, FiTruck, FiUsers, FiBriefcase,
  FiArrowRight, FiArrowUp, FiZap, FiShield, FiExternalLink, FiAlertCircle, FiUser
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import VroomXLogo from '../components/VroomXLogo';
import ConfirmDialog from '../components/ConfirmDialog';

const Billing = () => {
  const { subscription, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentUsage, setCurrentUsage] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, plan: null, preview: null, loading: false });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        billingAPI.getPlans(),
        billingAPI.getSubscription()
      ]);
      setPlans(plansRes.data.plans);
      setCurrentUsage(subRes.data.usage);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    }
  };

  const handleSubscribe = async (plan) => {
    setLoading(true);
    try {
      const response = await billingAPI.createCheckoutSession(plan);
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create checkout session');
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await billingAPI.createPortalSession(window.location.href);
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await billingAPI.cancelSubscription();
      toast.success('Subscription canceled. Access continues until end of billing period.');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await billingAPI.reactivateSubscription();
      toast.success('Subscription reactivated!');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  };

  const PLAN_ORDER = { solo: 1, fleet: 2, pro: 3 };

  const canUpgradeTo = (targetPlan) => {
    if (subscription?.status !== 'active' || subscription?.cancelAtPeriodEnd) return false;
    const current = PLAN_ORDER[subscription?.plan];
    const target = PLAN_ORDER[targetPlan];
    return current && target && target > current;
  };

  const isCurrentPlan = (plan) => {
    return subscription?.plan === plan && subscription?.status !== 'trialing';
  };

  const handleUpgradeClick = async (plan) => {
    setUpgradeModal({ open: true, plan, preview: null, loading: true });
    try {
      const response = await billingAPI.previewUpgrade(plan);
      setUpgradeModal(prev => ({ ...prev, preview: response.data.preview, loading: false }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load upgrade preview');
      setUpgradeModal({ open: false, plan: null, preview: null, loading: false });
    }
  };

  const handleConfirmUpgrade = async () => {
    setUpgradeModal(prev => ({ ...prev, loading: true }));
    try {
      const response = await billingAPI.upgradePlan(upgradeModal.plan);
      // Redirect to Stripe payment page
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upgrade plan');
      setUpgradeModal(prev => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'pro':
        return FiZap;
      case 'fleet':
        return FiTruck;
      case 'solo':
        return FiUser;
      default:
        return FiShield;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 border-success-200 dark:border-success-700';
      case 'trialing':
        return 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 border-accent-200 dark:border-accent-700';
      case 'past_due':
        return 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-700';
      case 'canceled':
        return 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border-danger-200 dark:border-danger-700';
      default:
        return 'bg-primary-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700';
    }
  };

  const PlanIcon = getPlanIcon(subscription?.plan);

  // Special view for pending_payment users (Solo tier who need to pay)
  if (subscription?.status === 'pending_payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <VroomXLogo size="lg" showText={true} animate={true} className="mx-auto" />
          </div>

          {/* Payment Required Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-warning-600" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Complete Your Subscription</h1>
              <p className="text-zinc-600 dark:text-zinc-300">
                Activate your Solo plan to start managing your compliance
              </p>
            </div>

            {/* Solo Plan Details */}
            <div className="bg-primary-50 dark:bg-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Solo Plan</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Perfect for Owner-Operators</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">$19</span>
                <span className="text-zinc-600 dark:text-zinc-300">/month</span>
              </div>

              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  1 Driver (You)
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  1 Vehicle
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  Full DQF Management
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  CSA Score Tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  Violation Tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  Document Management
                </li>
              </ul>
            </div>

            {/* Payment Button */}
            <button
              onClick={() => handleSubscribe('solo')}
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/25"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <FiCreditCard className="w-5 h-5" />
                  Subscribe Now - $19/month
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-zinc-600 dark:text-zinc-300 mt-4">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>

          {/* Need more capacity? */}
          <div className="text-center mt-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Need more drivers or vehicles?{' '}
              <a href="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                Check our Fleet plans
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">Manage your subscription plan and billing details</p>
      </div>

      {/* Current Subscription Card */}
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 mb-8 overflow-hidden"
        style={{ boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.08)' }}
      >
        <div
          className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                <PlanIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Current Plan</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium capitalize">
                    {subscription?.plan?.replace('_', ' ') || 'Free Trial'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(subscription?.status)}`}>
                    {subscription?.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            {subscription?.status !== 'canceled' && subscription?.stripeSubscriptionId && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="btn btn-secondary flex items-center gap-2"
              >
                {portalLoading ? <LoadingSpinner size="sm" /> : (
                  <>
                    <FiCreditCard className="w-4 h-4" />
                    Manage Billing
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Trial Warning */}
          {subscription?.status === 'trialing' && subscription?.trialDaysRemaining <= 7 && (
            <div className="mb-6 p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700 flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Your trial ends in {subscription.trialDaysRemaining} days
                </p>
                <p className="text-sm text-accent-600 dark:text-accent-400 mt-0.5">
                  Subscribe now to keep access to all features.
                </p>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Current Period */}
            <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                {subscription?.status === 'trialing' ? 'Trial Ends' : 'Renewal Date'}
              </p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {subscription?.status === 'trialing'
                  ? formatDate(subscription?.trialEndsAt)
                  : formatDate(subscription?.currentPeriodEnd)
                }
              </p>
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-xs text-danger-600 dark:text-danger-400 mt-1 font-medium">
                  Subscription will end on this date
                </p>
              )}
            </div>

            {/* Usage */}
            <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Current Usage
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <FiBriefcase className="w-3.5 h-3.5" />
                    Companies
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {currentUsage?.companies?.owned || 0} / {currentUsage?.companies?.limit === 'unlimited' ? '∞' : currentUsage?.companies?.limit || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <FiUsers className="w-3.5 h-3.5" />
                    Drivers
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {currentUsage?.drivers?.current || 0} / {currentUsage?.drivers?.limit === 'unlimited' ? '∞' : currentUsage?.drivers?.limit || 1}
                  </span>
                </div>
                {/* Show extra driver billing info for Fleet/Pro */}
                {currentUsage?.drivers?.extra > 0 && currentUsage?.drivers?.extraPrice && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400 pl-5">
                      ({currentUsage.drivers.included} included + {currentUsage.drivers.extra} extra)
                    </span>
                    <span className="text-accent-600 dark:text-accent-400 font-medium">
                      +${currentUsage.drivers.extraCost}/mo
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <FiTruck className="w-3.5 h-3.5" />
                    Vehicles
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {currentUsage?.vehicles?.current || 0} / {currentUsage?.vehicles?.limit === 'unlimited' ? '∞' : currentUsage?.vehicles?.limit || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Subscription Actions
              </p>
              <div className="space-y-2">
                {subscription?.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivate}
                    disabled={loading}
                    className="btn btn-success w-full text-sm"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Reactivate Subscription'}
                  </button>
                ) : subscription?.stripeSubscriptionId ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={loading}
                    className="btn btn-secondary w-full text-sm text-danger-600 dark:text-danger-400 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Cancel Subscription'}
                  </button>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Choose a plan below to subscribe</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Available Plans</h2>
        <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">Choose the plan that fits your fleet size</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Solo Plan */}
        <div
          className={`relative bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
            subscription?.plan === 'solo' && subscription?.status !== 'trialing'
              ? 'border-primary-300 dark:border-primary-600 ring-2 ring-primary-100 dark:ring-primary-900'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-600'
          }`}
          style={{ boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.08)' }}
        >
          {subscription?.plan === 'solo' && subscription?.status !== 'trialing' && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-full">
                Current Plan
              </span>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-400 to-zinc-500 flex items-center justify-center">
                <FiUser className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Solo</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">For Owner-Operators</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">$19</span>
                <span className="text-zinc-600 dark:text-zinc-300">/month</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">1 driver • 1 vehicle</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                <span><strong>1</strong> driver (You)</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                Full DQF Management
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                AI Regulation Assistant
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                CSA Score Tracking
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                Document Expiry Alerts
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                100 AI queries/month
              </li>
            </ul>

            <button
              onClick={() => !isCurrentPlan('solo') && !PLAN_ORDER[subscription?.plan] && handleSubscribe('solo')}
              disabled={loading || isCurrentPlan('solo') || (PLAN_ORDER[subscription?.plan] > PLAN_ORDER.solo)}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                isCurrentPlan('solo')
                  ? 'bg-primary-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-not-allowed'
                  : PLAN_ORDER[subscription?.plan] > PLAN_ORDER.solo
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-800 dark:bg-zinc-700 text-white hover:bg-zinc-900 dark:hover:bg-zinc-600'
              }`}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : isCurrentPlan('solo') ? (
                'Current Plan'
              ) : PLAN_ORDER[subscription?.plan] > PLAN_ORDER.solo ? (
                'Included in your plan'
              ) : (
                <>
                  Subscribe
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fleet Plan */}
        <div
          className={`relative bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
            subscription?.plan === 'fleet' && subscription?.status !== 'trialing'
              ? 'border-primary-300 dark:border-primary-600 ring-2 ring-primary-100 dark:ring-primary-900'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-600'
          }`}
          style={{ boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.08)' }}
        >
          {subscription?.plan === 'fleet' && subscription?.status !== 'trialing' && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-full">
                Current Plan
              </span>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
                <FiTruck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Fleet</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">For Small Fleets (2-10 drivers)</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">$39</span>
                <span className="text-zinc-600 dark:text-zinc-300">/month</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">3 drivers included • +$6/driver after</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                <span><strong>3</strong> drivers included</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                <span>Everything in Solo</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                AI Violation Reader
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                DataQ Draft Generator
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                Multi-user Access
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                Priority Support
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600 dark:text-success-400" />
                </div>
                <span><strong>Up to 3</strong> Companies</span>
              </li>
            </ul>

            <button
              onClick={() => canUpgradeTo('fleet') ? handleUpgradeClick('fleet') : handleSubscribe('fleet')}
              disabled={loading || isCurrentPlan('fleet') || (PLAN_ORDER[subscription?.plan] > PLAN_ORDER.fleet)}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                isCurrentPlan('fleet')
                  ? 'bg-primary-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-not-allowed'
                  : PLAN_ORDER[subscription?.plan] > PLAN_ORDER.fleet
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  : canUpgradeTo('fleet')
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                  : 'bg-primary-900 dark:bg-primary-600 text-white hover:bg-primary-800 dark:hover:bg-primary-700'
              }`}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : isCurrentPlan('fleet') ? (
                'Current Plan'
              ) : PLAN_ORDER[subscription?.plan] > PLAN_ORDER.fleet ? (
                'Included in your plan'
              ) : canUpgradeTo('fleet') ? (
                <>
                  <FiArrowUp className="w-4 h-4" />
                  Upgrade to Fleet
                </>
              ) : (
                <>
                  Subscribe
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div
          className={`relative bg-white dark:bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
            subscription?.plan === 'pro' && subscription?.status !== 'trialing'
              ? 'border-accent-300 dark:border-accent-600 ring-2 ring-accent-100 dark:ring-accent-900'
              : 'border-accent-200 dark:border-accent-700 hover:border-accent-300 dark:hover:border-accent-600'
          }`}
          style={{ boxShadow: '0 4px 25px -5px rgba(251, 146, 60, 0.15)' }}
        >
          {/* Popular Badge */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-center py-1.5 text-xs font-semibold">
            MOST POPULAR
          </div>

          {subscription?.plan === 'pro' && subscription?.status !== 'trialing' && (
            <div className="absolute top-10 right-4">
              <span className="px-2.5 py-1 bg-accent-100 dark:bg-accent-900/30 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-full">
                Current Plan
              </span>
            </div>
          )}

          <div className="p-6 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                <FiZap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Pro</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">For Growing Fleets (10-50 drivers)</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">$89</span>
                <span className="text-zinc-600 dark:text-zinc-300">/month</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">10 drivers included • +$5/driver after</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                </div>
                <span><strong>10</strong> drivers included</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                </div>
                <span>Everything in Fleet</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                </div>
                <span><strong>Up to 10</strong> Companies</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                </div>
                Advanced CSA Analytics
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                </div>
                Custom Reports & API Access
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                </div>
                Dedicated Support
              </li>
            </ul>

            <button
              onClick={() => canUpgradeTo('pro') ? handleUpgradeClick('pro') : handleSubscribe('pro')}
              disabled={loading || isCurrentPlan('pro')}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                isCurrentPlan('pro')
                  ? 'bg-accent-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                  : canUpgradeTo('pro')
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 shadow-lg shadow-accent-500/25'
                  : 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700'
              }`}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : isCurrentPlan('pro') ? (
                'Current Plan'
              ) : canUpgradeTo('pro') ? (
                <>
                  <FiArrowUp className="w-4 h-4" />
                  Upgrade to Pro
                </>
              ) : (
                <>
                  Subscribe
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 mb-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-accent-300 dark:hover:border-accent-500/50 transition-all duration-200">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Can I change plans anytime?</h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the charges.
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-accent-300 dark:hover:border-accent-500/50 transition-all duration-200">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">What happens when I cancel?</h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              You'll retain access until the end of your billing period. After that, your account will be limited to view-only mode.
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-accent-300 dark:hover:border-accent-500/50 transition-all duration-200">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              We offer a 3-day free trial. If you're not satisfied within 30 days of subscribing, contact us for a full refund.
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-accent-300 dark:hover:border-accent-500/50 transition-all duration-200">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Is my payment information secure?</h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant and uses bank-level encryption.
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      {upgradeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !upgradeModal.loading && setUpgradeModal({ open: false, plan: null, preview: null, loading: false })} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Upgrade to {upgradeModal.plan?.charAt(0).toUpperCase() + upgradeModal.plan?.slice(1)}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-5">
              Your plan will be upgraded immediately with prorated billing.
            </p>

            {upgradeModal.loading && !upgradeModal.preview ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-zinc-600 dark:text-zinc-300">Calculating proration...</span>
              </div>
            ) : upgradeModal.preview ? (
              <>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">Current Plan</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                      {upgradeModal.preview.currentPlan} — ${upgradeModal.preview.currentMonthlyPrice}/mo
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">New Plan</span>
                    <span className="text-sm font-semibold text-accent-700 dark:text-accent-400 capitalize">
                      {upgradeModal.preview.newPlan} — ${upgradeModal.preview.newMonthlyPrice}/mo
                    </span>
                  </div>
                  {upgradeModal.preview.credit > 0 && (
                    <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-success-50 dark:bg-success-900/10">
                      <span className="text-xs text-success-700 dark:text-success-400">Credit for unused {upgradeModal.preview.currentPlan} time</span>
                      <span className="text-sm font-medium text-success-700 dark:text-success-400">
                        -${upgradeModal.preview.credit.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {upgradeModal.preview.prorationCharge > 0 && (
                    <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Prorated {upgradeModal.preview.newPlan} for remaining period</span>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        +${upgradeModal.preview.prorationCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-zinc-800 border border-primary-200 dark:border-zinc-700">
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Net Charge Today</span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Prorated difference applied now</p>
                    </div>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      ${upgradeModal.preview.immediateCharge.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                  Starting next billing cycle, you'll be charged ${upgradeModal.preview.newMonthlyPrice}/month.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradeModal({ open: false, plan: null, preview: null, loading: false })}
                    disabled={upgradeModal.loading}
                    className="flex-1 py-2.5 px-4 rounded-xl font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpgrade}
                    disabled={upgradeModal.loading}
                    className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 transition-all flex items-center justify-center gap-2"
                  >
                    {upgradeModal.loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <FiArrowUp className="w-4 h-4" />
                        Confirm Upgrade
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period."
        confirmText="Cancel Subscription"
        variant="danger"
      />
    </div>
  );
};

export default Billing;
