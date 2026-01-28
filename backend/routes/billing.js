const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUsageStats } = require('../middleware/subscriptionLimits');
const stripeService = require('../services/stripeService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

// Price configuration for display
const PRICING = {
  solo: {
    name: 'Solo',
    description: 'For Owner-Operators',
    price: 19,
    priceId: process.env.STRIPE_SOLO_PRICE_ID,
    includedDrivers: 1,
    extraDriverPrice: null, // No extra drivers allowed
    features: [
      '1 driver included',
      'Full DQF Management',
      'AI Regulation Assistant',
      'CSA Score Tracking',
      'Document Expiry Alerts',
      '100 AI queries/month'
    ],
    limits: {
      maxCompanies: 1,
      maxDriversPerCompany: 1,
      maxVehiclesPerCompany: 1
    }
  },
  fleet: {
    name: 'Fleet',
    description: 'For Small Fleets (2-10 drivers)',
    price: 39,
    priceId: process.env.STRIPE_FLEET_PRICE_ID,
    extraDriverPriceId: process.env.STRIPE_FLEET_EXTRA_DRIVER_PRICE_ID,
    includedDrivers: 3,
    extraDriverPrice: 6,
    features: [
      '3 drivers included',
      '+$6/driver after 3',
      'Everything in Solo',
      'AI Violation Reader',
      'DataQ Draft Generator',
      'Multi-user Access',
      'Priority Support'
    ],
    limits: {
      maxCompanies: 1,
      maxDriversPerCompany: 'unlimited', // Unlimited but charges per driver
      maxVehiclesPerCompany: 'unlimited'
    }
  },
  pro: {
    name: 'Pro',
    description: 'For Growing Fleets (10-50 drivers)',
    price: 89,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    extraDriverPriceId: process.env.STRIPE_PRO_EXTRA_DRIVER_PRICE_ID,
    includedDrivers: 10,
    extraDriverPrice: 5,
    features: [
      '10 drivers included',
      '+$5/driver after 10',
      'Everything in Fleet',
      'Advanced CSA Analytics',
      'Custom Reports',
      'API Access',
      'Dedicated Support'
    ],
    limits: {
      maxCompanies: 'unlimited',
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
  const { plan } = req.body;

  if (!['solo', 'fleet', 'pro'].includes(plan)) {
    throw new AppError('Invalid plan selected', 400);
  }

  // Check if user already has an active subscription
  if (req.user.subscription?.status === 'active' && !req.user.subscription?.cancelAtPeriodEnd) {
    throw new AppError('You already have an active subscription. Use the billing portal to change plans.', 400);
  }

  const session = await stripeService.createCheckoutSession(req.user, plan);

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
  const PLAN_ORDER = { solo: 1, fleet: 2, pro: 3 };

  if (!['solo', 'fleet', 'pro'].includes(plan)) {
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
  const PLAN_ORDER = { solo: 1, fleet: 2, pro: 3 };

  if (!['solo', 'fleet', 'pro'].includes(plan)) {
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
