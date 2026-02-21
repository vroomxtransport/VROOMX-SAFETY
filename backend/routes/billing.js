const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUsageStats, AI_QUERY_QUOTAS } = require('../middleware/subscriptionLimits');
const stripeService = require('../services/stripeService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');
const aiUsageService = require('../services/aiUsageService');

// Price configuration for display
const PRICING = {
  owner_operator: {
    name: 'Owner-Operator',
    description: 'For Owner-Operators',
    monthlyPrice: 29,
    annualPrice: 290,
    priceId: process.env.STRIPE_OWNER_OPERATOR_MONTHLY_PRICE_ID,
    annualPriceId: process.env.STRIPE_OWNER_OPERATOR_ANNUAL_PRICE_ID,
    includedDrivers: 1,
    extraDriverPrice: null,
    features: [
      '1 driver, 1 vehicle, 1 company',
      'Full DQF Management (14+ documents)',
      'CSA Score Monitoring (all 7 BASICs)',
      'Document Expiration Alerts',
      'AI Compliance Assistant',
      'FMCSA Data Sync',
      'Violation Tracking',
      '150 AI queries/month',
      'Email Support'
    ],
    limits: {
      maxCompanies: 1,
      maxDriversPerCompany: 1,
      maxVehiclesPerCompany: 1
    }
  },
  small_fleet: {
    name: 'Small Fleet',
    description: 'For Small Fleets (2-20 drivers)',
    monthlyPrice: 79,
    annualPrice: 790,
    priceId: process.env.STRIPE_SMALL_FLEET_MONTHLY_PRICE_ID,
    annualPriceId: process.env.STRIPE_SMALL_FLEET_ANNUAL_PRICE_ID,
    extraDriverPriceId: process.env.STRIPE_SMALL_FLEET_EXTRA_DRIVER_PRICE_ID,
    includedDrivers: 5,
    extraDriverPrice: 8,
    features: [
      '5 drivers included, unlimited vehicles',
      '+$8/driver after 5',
      'Everything in Owner-Operator',
      'AI Violation Analyzer',
      'DataQ Challenge Letters',
      'Drug & Alcohol Program Management',
      'Multi-user Access',
      'Up to 3 companies',
      '500 AI queries/month',
      'Priority Email Support'
    ],
    limits: {
      maxCompanies: 3,
      maxDriversPerCompany: 'unlimited',
      maxVehiclesPerCompany: 'unlimited'
    }
  },
  fleet_pro: {
    name: 'Fleet Pro',
    description: 'For Growing Fleets (15-50+ drivers)',
    monthlyPrice: 149,
    annualPrice: 1490,
    priceId: process.env.STRIPE_FLEET_PRO_MONTHLY_PRICE_ID,
    annualPriceId: process.env.STRIPE_FLEET_PRO_ANNUAL_PRICE_ID,
    extraDriverPriceId: process.env.STRIPE_FLEET_PRO_EXTRA_DRIVER_PRICE_ID,
    includedDrivers: 15,
    extraDriverPrice: 6,
    features: [
      '15 drivers included, unlimited vehicles',
      '+$6/driver after 15',
      'Everything in Small Fleet',
      'Advanced CSA Analytics',
      'Custom Report Builder',
      'Compliance Score Trend Analysis',
      'Audit Readiness Tools',
      'Up to 10 companies',
      'Unlimited AI queries',
      'Priority Support'
    ],
    limits: {
      maxCompanies: 10,
      maxDriversPerCompany: 'unlimited',
      maxVehiclesPerCompany: 'unlimited'
    }
  }
};

// @route   GET /api/billing/plans
// @desc    Get available subscription plans
// @access  Public
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PRICING
  });
});

// @route   GET /api/billing/subscription
// @desc    Get current user's subscription details
// @access  Private
router.get('/subscription', protect, asyncHandler(async (req, res) => {
  const user = req.user;

  // Get usage stats
  const usage = await getUsageStats(user);

  // Get AI usage stats
  const plan = user.subscription?.plan || 'free_trial';
  const aiUsage = await aiUsageService.getUsageStats(user._id);
  const aiQuota = AI_QUERY_QUOTAS[plan];

  // Add AI usage to usage object
  usage.aiQueries = {
    current: aiUsage.count,
    limit: aiQuota === -1 ? 'unlimited' : aiQuota,
    remaining: aiQuota === -1 ? 'unlimited' : Math.max(0, aiQuota - aiUsage.count),
    month: aiUsage.month
  };

  // Get Stripe subscription details if available
  let stripeSubscription = null;
  if (user.subscription?.stripeSubscriptionId) {
    stripeSubscription = await stripeService.getSubscriptionDetails(user);
  }

  res.json({
    success: true,
    subscription: {
      plan: user.subscription?.plan || 'free_trial',
      status: user.subscription?.status || 'trialing',
      trialEndsAt: user.subscription?.trialEndsAt,
      trialDaysRemaining: user.trialDaysRemaining,
      currentPeriodStart: user.subscription?.currentPeriodStart,
      currentPeriodEnd: user.subscription?.currentPeriodEnd,
      cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
      stripeSubscriptionId: user.subscription?.stripeSubscriptionId
    },
    limits: user.limits,
    usage,
    pricing: PRICING,
    // Include invoice info if available
    upcomingInvoice: stripeSubscription?.latest_invoice ? {
      amount: stripeSubscription.latest_invoice.amount_due / 100,
      dueDate: stripeSubscription.current_period_end
    } : null
  });
}));

// @route   POST /api/billing/create-checkout-session
// @desc    Create Stripe Checkout session for subscription
// @access  Private
router.post('/create-checkout-session', protect, asyncHandler(async (req, res) => {
  const { plan, billingInterval } = req.body;
  const validPlans = ['owner_operator', 'small_fleet', 'fleet_pro', 'solo', 'fleet', 'pro'];

  if (!validPlans.includes(plan)) {
    throw new AppError('Invalid plan selected', 400);
  }

  // Check if user already has an active subscription
  if (req.user.subscription?.status === 'active' && !req.user.subscription?.cancelAtPeriodEnd) {
    throw new AppError('You already have an active subscription. Use the billing portal to change plans.', 400);
  }

  const session = await stripeService.createCheckoutSession(req.user, plan, billingInterval || 'monthly');

  auditService.log(req, 'create', 'subscription', null, { plan, summary: 'Checkout session created' });

  res.json({
    success: true,
    sessionId: session.sessionId,
    url: session.url
  });
}));

// @route   POST /api/billing/create-portal-session
// @desc    Create Stripe Customer Portal session for subscription management
// @access  Private
router.post('/create-portal-session', protect, asyncHandler(async (req, res) => {
  const { returnUrl } = req.body;

  if (!req.user.stripeCustomerId) {
    throw new AppError('No billing account found. Please subscribe first.', 400);
  }

  const session = await stripeService.createPortalSession(req.user, returnUrl);

  res.json({
    success: true,
    url: session.url
  });
}));

// @route   POST /api/billing/cancel
// @desc    Cancel subscription at period end
// @access  Private
router.post('/cancel', protect, asyncHandler(async (req, res) => {
  if (!req.user.subscription?.stripeSubscriptionId) {
    throw new AppError('No active subscription to cancel', 400);
  }

  await stripeService.cancelSubscription(req.user);

  auditService.log(req, 'update', 'subscription', null, { summary: 'Subscription cancellation requested' });

  res.json({
    success: true,
    message: 'Subscription will be canceled at the end of the current billing period',
    cancelAt: req.user.subscription.currentPeriodEnd
  });
}));

// @route   POST /api/billing/reactivate
// @desc    Reactivate a canceled subscription (before period end)
// @access  Private
router.post('/reactivate', protect, asyncHandler(async (req, res) => {
  if (!req.user.subscription?.stripeSubscriptionId) {
    throw new AppError('No subscription to reactivate', 400);
  }

  if (!req.user.subscription?.cancelAtPeriodEnd) {
    throw new AppError('Subscription is not scheduled for cancellation', 400);
  }

  await stripeService.reactivateSubscription(req.user);

  auditService.log(req, 'update', 'subscription', null, { summary: 'Subscription reactivated' });

  res.json({
    success: true,
    message: 'Subscription reactivated successfully'
  });
}));

// @route   POST /api/billing/preview-upgrade
// @desc    Preview proration for upgrading to a higher plan
// @access  Private
router.post('/preview-upgrade', protect, asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const PLAN_ORDER = { owner_operator: 1, small_fleet: 2, fleet_pro: 3, solo: 1, fleet: 2, pro: 3 };
  const validPlans = ['owner_operator', 'small_fleet', 'fleet_pro', 'solo', 'fleet', 'pro'];

  if (!validPlans.includes(plan)) {
    throw new AppError('Invalid plan selected', 400);
  }

  if (req.user.subscription?.status !== 'active') {
    throw new AppError('You must have an active subscription to upgrade', 400);
  }

  const currentPlan = req.user.subscription?.plan;
  if (!PLAN_ORDER[currentPlan] || PLAN_ORDER[plan] <= PLAN_ORDER[currentPlan]) {
    throw new AppError('You can only upgrade to a higher plan', 400);
  }

  const preview = await stripeService.previewUpgrade(req.user, plan);

  res.json({
    success: true,
    preview
  });
}));

// @route   POST /api/billing/upgrade
// @desc    Upgrade subscription to a higher plan with proration
// @access  Private
router.post('/upgrade', protect, asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const PLAN_ORDER = { owner_operator: 1, small_fleet: 2, fleet_pro: 3, solo: 1, fleet: 2, pro: 3 };
  const validPlans = ['owner_operator', 'small_fleet', 'fleet_pro', 'solo', 'fleet', 'pro'];

  if (!validPlans.includes(plan)) {
    throw new AppError('Invalid plan selected', 400);
  }

  if (req.user.subscription?.status !== 'active') {
    throw new AppError('You must have an active subscription to upgrade', 400);
  }

  const currentPlan = req.user.subscription?.plan;
  if (!PLAN_ORDER[currentPlan] || PLAN_ORDER[plan] <= PLAN_ORDER[currentPlan]) {
    throw new AppError('You can only upgrade to a higher plan', 400);
  }

  const result = await stripeService.upgradePlan(req.user, plan);

  auditService.log(req, 'update', 'subscription', null, {
    summary: `Plan upgrade initiated from ${currentPlan} to ${plan}`,
    previousPlan: currentPlan,
    newPlan: plan
  });

  res.json({
    success: true,
    url: result.url
  });
}));

// @route   GET /api/billing/invoices
// @desc    Get user's invoice history
// @access  Private
router.get('/invoices', protect, asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const user = req.user;

  if (!user.stripeCustomerId) {
    return res.json({
      success: true,
      invoices: [],
      count: 0,
      hasMore: false,
      message: 'No billing account found'
    });
  }

  const invoices = await stripeService.getInvoices(user, {
    limit: Math.min(parseInt(limit), 100)
  });

  const invoiceList = invoices.data.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.number,
    status: inv.status,
    amountDue: inv.amount_due / 100,
    amountPaid: inv.amount_paid / 100,
    total: inv.total / 100,
    currency: inv.currency?.toUpperCase() || 'USD',
    issueDate: new Date(inv.created * 1000),
    dueDate: inv.due_date ? new Date(inv.due_date * 1000) : null,
    paidDate: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null,
    pdfUrl: inv.invoice_pdf,
    hostedUrl: inv.hosted_invoice_url
  }));

  res.json({
    success: true,
    invoices: invoiceList,
    count: invoiceList.length,
    hasMore: invoices.has_more
  });
}));

// @route   GET /api/billing/invoices/:invoiceId
// @desc    Get a specific invoice
// @access  Private
router.get('/invoices/:invoiceId', protect, asyncHandler(async (req, res) => {
  const invoice = await stripeService.getInvoice(req.params.invoiceId);

  // Verify invoice belongs to current user
  if (invoice.customer !== req.user.stripeCustomerId) {
    throw new AppError('Unauthorized to access this invoice', 403);
  }

  res.json({
    success: true,
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.number,
      status: invoice.status,
      amountDue: invoice.amount_due / 100,
      amountPaid: invoice.amount_paid / 100,
      total: invoice.total / 100,
      currency: invoice.currency?.toUpperCase() || 'USD',
      issueDate: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paidDate: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
      pdfUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
      lineItems: invoice.lines?.data?.map(line => ({
        description: line.description,
        amount: line.amount / 100,
        period: line.period ? {
          start: new Date(line.period.start * 1000),
          end: new Date(line.period.end * 1000)
        } : null
      })) || []
    }
  });
}));

// @route   POST /api/billing/webhook
// @desc    Handle Stripe webhook events
// @access  Public (verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripeService.constructEvent(req.body, signature);

    // Handle the event
    await stripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    // Don't expose error details - could leak signature info
    if (error.type === 'StripeSignatureVerificationError') {
      return res.status(401).json({ error: 'Webhook signature verification failed' });
    }
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
