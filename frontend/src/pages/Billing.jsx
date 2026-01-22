import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiCreditCard, FiCheck, FiX, FiStar, FiTruck, FiUsers, FiBriefcase,
  FiArrowRight, FiZap, FiShield, FiExternalLink, FiAlertCircle, FiUser
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import VroomXLogo from '../components/VroomXLogo';

const Billing = () => {
  const { subscription, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentUsage, setCurrentUsage] = useState(null);

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
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }
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
      case 'professional':
        return FiZap;
      case 'starter':
        return FiStar;
      case 'solo':
        return FiUser;
      default:
        return FiShield;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700 border-success-200';
      case 'trialing':
        return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'past_due':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'canceled':
        return 'bg-danger-100 text-danger-700 border-danger-200';
      default:
        return 'bg-primary-100 text-primary-700 border-primary-200';
    }
  };

  const PlanIcon = getPlanIcon(subscription?.plan);

  // Special view for pending_payment users (Solo tier who need to pay)
  if (subscription?.status === 'pending_payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <VroomXLogo size="lg" showText={true} animate={true} className="mx-auto" />
          </div>

          {/* Payment Required Card */}
          <div className="bg-white rounded-2xl border border-primary-200 shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-warning-600" />
              </div>
              <h1 className="text-2xl font-bold text-primary-900 mb-2">Complete Your Subscription</h1>
              <p className="text-primary-500">
                Activate your Solo plan to start managing your compliance
              </p>
            </div>

            {/* Solo Plan Details */}
            <div className="bg-primary-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary-900">Solo Plan</h3>
                  <p className="text-sm text-primary-500">Perfect for Owner-Operators</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-primary-900">$19</span>
                <span className="text-primary-500">/month</span>
              </div>

              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-primary-700">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  1 Driver (You)
                </li>
                <li className="flex items-center gap-2 text-sm text-primary-700">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  1 Vehicle
                </li>
                <li className="flex items-center gap-2 text-sm text-primary-700">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  Full DQF Management
                </li>
                <li className="flex items-center gap-2 text-sm text-primary-700">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  CSA Score Tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-primary-700">
                  <FiCheck className="w-4 h-4 text-success-500" />
                  Violation Tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-primary-700">
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

            <p className="text-xs text-center text-primary-400 mt-4">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>

          {/* Need more capacity? */}
          <div className="text-center mt-6">
            <p className="text-sm text-primary-500">
              Need more drivers or vehicles?{' '}
              <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
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
        <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-primary-500 dark:text-zinc-400 text-sm mt-1">Manage your subscription plan and billing details</p>
      </div>

      {/* Current Subscription Card */}
      <div
        className="bg-white rounded-2xl border border-primary-200/60 mb-8 overflow-hidden"
        style={{ boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.08)' }}
      >
        <div
          className="px-6 py-5 border-b border-primary-100"
          style={{ background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                <PlanIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary-900">Current Plan</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-primary-600 font-medium capitalize">
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
            <div className="mb-6 p-4 rounded-xl bg-accent-50 border border-accent-200 flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent-800">
                  Your trial ends in {subscription.trialDaysRemaining} days
                </p>
                <p className="text-sm text-accent-600 mt-0.5">
                  Subscribe now to keep access to all features.
                </p>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Period */}
            <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-1">
                {subscription?.status === 'trialing' ? 'Trial Ends' : 'Renewal Date'}
              </p>
              <p className="text-lg font-semibold text-primary-900">
                {subscription?.status === 'trialing'
                  ? formatDate(subscription?.trialEndsAt)
                  : formatDate(subscription?.currentPeriodEnd)
                }
              </p>
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-xs text-danger-600 mt-1 font-medium">
                  Subscription will end on this date
                </p>
              )}
            </div>

            {/* Usage */}
            <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-2">
                Current Usage
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-primary-600">
                    <FiBriefcase className="w-3.5 h-3.5" />
                    Companies
                  </div>
                  <span className="text-sm font-semibold text-primary-900">
                    {currentUsage?.companies || 0} / {subscription?.limits?.maxCompanies === Infinity ? '∞' : subscription?.limits?.maxCompanies || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-primary-600">
                    <FiUsers className="w-3.5 h-3.5" />
                    Drivers
                  </div>
                  <span className="text-sm font-semibold text-primary-900">
                    {currentUsage?.drivers || 0} / {subscription?.limits?.maxDriversPerCompany === Infinity ? '∞' : subscription?.limits?.maxDriversPerCompany || 3}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-primary-600">
                    <FiTruck className="w-3.5 h-3.5" />
                    Vehicles
                  </div>
                  <span className="text-sm font-semibold text-primary-900">
                    {currentUsage?.vehicles || 0} / {subscription?.limits?.maxVehiclesPerCompany === Infinity ? '∞' : subscription?.limits?.maxVehiclesPerCompany || 3}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-2">
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
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="btn btn-secondary w-full text-sm text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Cancel Subscription'}
                  </button>
                ) : (
                  <p className="text-sm text-primary-500">Choose a plan below to subscribe</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-primary-900">Available Plans</h2>
        <p className="text-primary-500 text-sm mt-1">Choose the plan that fits your fleet size</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Starter Plan */}
        <div
          className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all ${
            subscription?.plan === 'starter' && subscription?.status !== 'trialing'
              ? 'border-primary-300 ring-2 ring-primary-100'
              : 'border-primary-200/60 hover:border-primary-300'
          }`}
          style={{ boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.08)' }}
        >
          {subscription?.plan === 'starter' && subscription?.status !== 'trialing' && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                Current Plan
              </span>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
                <FiStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-900">Starter</h3>
                <p className="text-sm text-primary-500">For small fleets</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-primary-900">$29</span>
                <span className="text-primary-500">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600" />
                </div>
                <span><strong>1</strong> Company</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600" />
                </div>
                <span><strong>3</strong> Drivers per company</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600" />
                </div>
                <span><strong>3</strong> Vehicles per company</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600" />
                </div>
                All compliance features
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-success-600" />
                </div>
                AI Assistant access
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe('starter')}
              disabled={loading || (subscription?.plan === 'starter' && subscription?.status !== 'trialing')}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                subscription?.plan === 'starter' && subscription?.status !== 'trialing'
                  ? 'bg-primary-100 text-primary-400 cursor-not-allowed'
                  : 'bg-primary-900 text-white hover:bg-primary-800'
              }`}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : subscription?.plan === 'starter' && subscription?.status !== 'trialing' ? (
                'Current Plan'
              ) : (
                <>
                  Get Started
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Professional Plan */}
        <div
          className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all ${
            subscription?.plan === 'professional' && subscription?.status !== 'trialing'
              ? 'border-accent-300 ring-2 ring-accent-100'
              : 'border-accent-200 hover:border-accent-300'
          }`}
          style={{ boxShadow: '0 4px 25px -5px rgba(251, 146, 60, 0.15)' }}
        >
          {/* Popular Badge */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-center py-1.5 text-xs font-semibold">
            MOST POPULAR
          </div>

          {subscription?.plan === 'professional' && subscription?.status !== 'trialing' && (
            <div className="absolute top-10 right-4">
              <span className="px-2.5 py-1 bg-accent-100 text-accent-700 text-xs font-semibold rounded-full">
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
                <h3 className="text-xl font-bold text-primary-900">Professional</h3>
                <p className="text-sm text-primary-500">For growing fleets</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-primary-900">$49</span>
                <span className="text-primary-500">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600" />
                </div>
                <span><strong>Unlimited</strong> Companies</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600" />
                </div>
                <span><strong>Unlimited</strong> Drivers per company</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600" />
                </div>
                <span><strong>Unlimited</strong> Vehicles per company</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600" />
                </div>
                All compliance features
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600" />
                </div>
                Priority AI Assistant access
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-700">
                <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-3 h-3 text-accent-600" />
                </div>
                Team management
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe('professional')}
              disabled={loading || (subscription?.plan === 'professional' && subscription?.status !== 'trialing')}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                subscription?.plan === 'professional' && subscription?.status !== 'trialing'
                  ? 'bg-accent-100 text-accent-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700'
              }`}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : subscription?.plan === 'professional' && subscription?.status !== 'trialing' ? (
                'Current Plan'
              ) : subscription?.plan === 'starter' ? (
                <>
                  Upgrade Now
                  <FiArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Get Started
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 mb-8">
        <h2 className="text-xl font-semibold text-primary-900 mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-primary-200/60">
            <h4 className="font-medium text-primary-900 mb-2">Can I change plans anytime?</h4>
            <p className="text-sm text-primary-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the charges.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-primary-200/60">
            <h4 className="font-medium text-primary-900 mb-2">What happens when I cancel?</h4>
            <p className="text-sm text-primary-600">
              You'll retain access until the end of your billing period. After that, your account will be limited to view-only mode.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-primary-200/60">
            <h4 className="font-medium text-primary-900 mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-primary-600">
              We offer a 3-day free trial. If you're not satisfied within 30 days of subscribing, contact us for a full refund.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-primary-200/60">
            <h4 className="font-medium text-primary-900 mb-2">Is my payment information secure?</h4>
            <p className="text-sm text-primary-600">
              Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant and uses bank-level encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
