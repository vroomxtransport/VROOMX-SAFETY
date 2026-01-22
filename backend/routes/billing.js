const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUsageStats } = require('../middleware/subscriptionLimits');
const stripeService = require('../services/stripeService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Price configuration for display
const PRICING = {
  solo: {
    name: 'Solo',
    price: 19,
    priceId: process.env.STRIPE_SOLO_PRICE_ID,
    features: [
      '1 Company',
      '1 Driver',
      '1 Vehicle',
      'Full DQF Management',
      'CSA Score Tracking',
      'Violation Tracking',
      'Document Management',
      'Email Support'
    ],
    limits: {
      maxCompanies: 1,
      maxDriversPerCompany: 1,
      maxVehiclesPerCompany: 1
    }
  },
  starter: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      '1 Company',
      'Up to 3 Drivers',
      'Up to 3 Vehicles',
      'All Compliance Features',
      'AI Regulation Assistant',
      'Document Management',
      'Email Support'
    ],
    limits: {
      maxCompanies: 1,
      maxDriversPerCompany: 3,
      maxVehiclesPerCompany: 3
    }
  },
  professional: {
    name: 'Professional',
    price: 49,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    features: [
      'Unlimited Companies',
      'Unlimited Drivers',
      'Unlimited Vehicles',
      'All Compliance Features',
      'AI Regulation Assistant',
      'Document Management',
      'Priority Support',
      'Team Management',
      'Advanced Reports'
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

  if (!['solo', 'starter', 'professional'].includes(plan)) {
    throw new AppError('Invalid plan selected', 400);
  }

  // Check if user already has an active subscription
  if (req.user.subscription?.status === 'active' && !req.user.subscription?.cancelAtPeriodEnd) {
    throw new AppError('You already have an active subscription. Use the billing portal to change plans.', 400);
  }

  const session = await stripeService.createCheckoutSession(req.user, plan);

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

  res.json({
    success: true,
    message: 'Subscription reactivated successfully'
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
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

module.exports = router;
