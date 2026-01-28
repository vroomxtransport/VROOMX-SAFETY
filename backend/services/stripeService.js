const Stripe = require('stripe');
const User = require('../models/User');
const emailService = require('./emailService');

// Initialize Stripe with secret key (handle missing key for development)
const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_ENABLED ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Log warning if Stripe is not configured
if (!STRIPE_ENABLED) {
  console.warn('WARNING: Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing features.');
}

// Price IDs from environment
const PRICE_IDS = {
  solo: process.env.STRIPE_SOLO_PRICE_ID,
  fleet: process.env.STRIPE_FLEET_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID
};

// Extra driver metered price IDs
const EXTRA_DRIVER_PRICE_IDS = {
  fleet: process.env.STRIPE_FLEET_EXTRA_DRIVER_PRICE_ID,
  pro: process.env.STRIPE_PRO_EXTRA_DRIVER_PRICE_ID
};

// Plan metadata mapping
const PLAN_METADATA = {
  solo: {
    plan: 'solo',
    maxCompanies: 1,
    maxDriversPerCompany: 1,
    maxVehiclesPerCompany: 1,
    includedDrivers: 1,
    extraDriverPrice: null
  },
  fleet: {
    plan: 'fleet',
    maxCompanies: 1,
    maxDriversPerCompany: -1, // unlimited but charged per driver
    maxVehiclesPerCompany: -1,
    includedDrivers: 3,
    extraDriverPrice: 6
  },
  pro: {
    plan: 'pro',
    maxCompanies: -1, // unlimited
    maxDriversPerCompany: -1,
    maxVehiclesPerCompany: -1,
    includedDrivers: 10,
    extraDriverPrice: 5
  }
};

const stripeService = {
  /**
   * Check if Stripe is enabled
   */
  isEnabled() {
    return STRIPE_ENABLED;
  },

  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(user) {
    if (!STRIPE_ENABLED) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
    }
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString()
        }
      });

      // Save customer ID to user
      user.stripeCustomerId = customer.id;
      await user.save({ validateBeforeSave: false });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  },

  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateCustomer(user) {
    if (user.stripeCustomerId) {
      try {
        // Verify customer still exists
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer.deleted) {
          return customer;
        }
      } catch (error) {
        // Customer not found, will create new one
      }
    }

    return this.createCustomer(user);
  },

  /**
   * Create a Checkout Session for subscription
   */
  async createCheckoutSession(user, planType) {
    try {
      const priceId = PRICE_IDS[planType];
      if (!priceId) {
        throw new Error(`Invalid plan type or missing price ID: ${planType}. Available: ${Object.keys(PRICE_IDS).filter(k => PRICE_IDS[k]).join(', ')}`);
      }

      // Ensure user has a Stripe customer ID
      const customer = await this.getOrCreateCustomer(user);

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/app/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/app/settings?tab=billing&canceled=true`,
        metadata: {
          userId: user._id.toString(),
          plan: planType
        },
        subscription_data: {
          metadata: {
            userId: user._id.toString(),
            plan: planType
          }
        },
        // Allow promotion codes
        allow_promotion_codes: true,
        // Collect billing address
        billing_address_collection: 'auto'
      });

      return {
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  /**
   * Create a Customer Portal session for subscription management
   */
  async createPortalSession(user, returnUrl) {
    try {
      if (!user.stripeCustomerId) {
        throw new Error('User does not have a Stripe customer ID');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl || `${process.env.FRONTEND_URL}/app/settings?tab=billing`
      });

      return {
        url: session.url
      };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  },

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutComplete(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  },

  /**
   * Handle checkout.session.completed event
   */
  async handleCheckoutComplete(session) {
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const plan = session.metadata?.plan || this.getPlanFromPriceId(subscription.items.data[0]?.price.id);

    // Update user's subscription
    user.subscription = {
      plan: plan,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    };

    await user.save({ validateBeforeSave: false });
  },

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdate(subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      // Try to find by Stripe customer ID
      const user = await User.findOne({ stripeCustomerId: subscription.customer });
      if (!user) {
        console.error('User not found for subscription update');
        return;
      }
      await this.updateUserSubscription(user, subscription);
    } else {
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }
      await this.updateUserSubscription(user, subscription);
    }
  },

  /**
   * Update user subscription from Stripe subscription object
   */
  async updateUserSubscription(user, subscription) {
    const plan = this.getPlanFromPriceId(subscription.items.data[0]?.price.id);

    user.subscription = {
      plan: plan,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    };

    await user.save({ validateBeforeSave: false });
  },

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(subscription) {
    const user = await User.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });

    if (!user) {
      console.error('User not found for subscription deletion');
      return;
    }

    // Reset to free trial (canceled)
    user.subscription = {
      plan: 'free_trial',
      status: 'canceled',
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: null
    };

    await user.save({ validateBeforeSave: false });
  },

  /**
   * Handle invoice.payment_succeeded event
   */
  async handlePaymentSucceeded(invoice) {
    if (invoice.subscription) {
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': invoice.subscription
      });

      if (user && user.subscription.status === 'past_due') {
        user.subscription.status = 'active';
        await user.save({ validateBeforeSave: false });
      }

      if (user) {
        emailService.sendPaymentSuccess(user, { amount_paid: invoice.amount_paid, plan: user.subscription?.plan, created: invoice.created }).catch(() => {});
      }
    }
  },

  /**
   * Handle invoice.payment_failed event
   */
  async handlePaymentFailed(invoice) {
    if (invoice.subscription) {
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': invoice.subscription
      });

      if (user) {
        user.subscription.status = 'past_due';
        await user.save({ validateBeforeSave: false });
        emailService.sendPaymentFailed(user).catch(() => {});
      }
    }
  },

  /**
   * Get plan name from Stripe price ID
   */
  getPlanFromPriceId(priceId) {
    if (priceId === PRICE_IDS.solo) return 'solo';
    if (priceId === PRICE_IDS.fleet) return 'fleet';
    if (priceId === PRICE_IDS.pro) return 'pro';
    return 'free_trial';
  },

  /**
   * Report metered driver usage to Stripe
   * Call this when driver count changes or at billing cycle
   */
  async reportDriverUsage(user, driverCount) {
    if (!STRIPE_ENABLED) {
      return null;
    }

    const plan = user.subscription?.plan;
    const subscriptionId = user.subscription?.stripeSubscriptionId;

    if (!subscriptionId || !['fleet', 'pro'].includes(plan)) {
      return null; // Solo plan doesn't have metered billing
    }

    const planConfig = PLAN_METADATA[plan];
    const extraDrivers = Math.max(0, driverCount - planConfig.includedDrivers);

    if (extraDrivers === 0) {
      return null; // No extra drivers to bill
    }

    try {
      // Get the subscription to find the metered price item
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const extraDriverPriceId = EXTRA_DRIVER_PRICE_IDS[plan];

      // Find the metered subscription item
      const meteredItem = subscription.items.data.find(
        item => item.price.id === extraDriverPriceId
      );

      if (!meteredItem) {
        // Add the metered price to the subscription if not present
        await stripe.subscriptionItems.create({
          subscription: subscriptionId,
          price: extraDriverPriceId
        });
        // Re-fetch subscription
        const updatedSub = await stripe.subscriptions.retrieve(subscriptionId);
        const newMeteredItem = updatedSub.items.data.find(
          item => item.price.id === extraDriverPriceId
        );
        if (newMeteredItem) {
          return await this.createUsageRecord(newMeteredItem.id, extraDrivers);
        }
      } else {
        return await this.createUsageRecord(meteredItem.id, extraDrivers);
      }
    } catch (error) {
      console.error('Error reporting driver usage:', error);
      throw error;
    }
  },

  /**
   * Create a usage record for metered billing
   */
  async createUsageRecord(subscriptionItemId, quantity) {
    try {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity: quantity,
          action: 'set', // 'set' replaces the usage, 'increment' adds to it
          timestamp: Math.floor(Date.now() / 1000)
        }
      );
      return usageRecord;
    } catch (error) {
      console.error('Error creating usage record:', error);
      throw error;
    }
  },

  /**
   * Get plan metadata
   */
  getPlanMetadata(plan) {
    return PLAN_METADATA[plan] || PLAN_METADATA.solo;
  },

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(user) {
    if (!user.subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription to cancel');
    }

    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    user.subscription.cancelAtPeriodEnd = true;
    await user.save({ validateBeforeSave: false });

    return subscription;
  },

  /**
   * Reactivate a canceled subscription (before period end)
   */
  async reactivateSubscription(user) {
    if (!user.subscription?.stripeSubscriptionId) {
      throw new Error('No subscription to reactivate');
    }

    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    user.subscription.cancelAtPeriodEnd = false;
    await user.save({ validateBeforeSave: false });

    return subscription;
  },

  /**
   * Get subscription details from Stripe
   */
  async getSubscriptionDetails(user) {
    if (!user.subscription?.stripeSubscriptionId) {
      return null;
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscription.stripeSubscriptionId
      );
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  },

  /**
   * Get customer invoices from Stripe
   */
  async getInvoices(user, options = {}) {
    if (!STRIPE_ENABLED) {
      throw new Error('Stripe is not configured');
    }
    if (!user.stripeCustomerId) {
      return { data: [], has_more: false };
    }

    try {
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: options.limit || 20
      });
      return invoices;
    } catch (error) {
      console.error('Error retrieving invoices:', error);
      throw error;
    }
  },

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(invoiceId) {
    if (!STRIPE_ENABLED) {
      throw new Error('Stripe is not configured');
    }

    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      console.error('Error retrieving invoice:', error);
      throw error;
    }
  },

  /**
   * Preview proration for a plan upgrade
   * Returns the prorated amount the user would be charged immediately
   */
  async previewUpgrade(user, newPlan) {
    if (!STRIPE_ENABLED) {
      throw new Error('Stripe is not configured');
    }

    const subscriptionId = user.subscription?.stripeSubscriptionId;
    if (!subscriptionId) {
      throw new Error('No active subscription found');
    }

    const newPriceId = PRICE_IDS[newPlan];
    if (!newPriceId) {
      throw new Error(`Invalid plan: ${newPlan}`);
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Find the base price item (not metered/extra-driver items)
    const baseItem = subscription.items.data.find(
      item => Object.values(PRICE_IDS).includes(item.price.id)
    );

    if (!baseItem) {
      throw new Error('Could not find base subscription item');
    }

    // Preview the upcoming invoice with the plan change
    const preview = await stripe.invoices.createPreview({
      customer: user.stripeCustomerId,
      subscription: subscriptionId,
      subscription_details: {
        items: [{
          id: baseItem.id,
          price: newPriceId
        }],
        proration_date: Math.floor(Date.now() / 1000)
      }
    });

    // Extract proration line items (credit for old plan + charge for new plan)
    const currentPlan = user.subscription.plan;
    const PLAN_PRICES = { solo: 19, fleet: 39, pro: 89 };

    let credit = 0;          // Unused time on old plan (negative line = credit)
    let prorationCharge = 0; // Remaining time on new plan (positive line)

    if (preview.lines && preview.lines.data) {
      for (const line of preview.lines.data) {
        if (line.proration) {
          if (line.amount < 0) {
            credit += Math.abs(line.amount);
          } else {
            prorationCharge += line.amount;
          }
        }
      }
    }

    // Net immediate charge = new plan prorated minus credit for unused old plan
    // If no proration lines found, fall back to subtotal minus next cycle amount
    let immediateCharge;
    if (prorationCharge === 0 && credit === 0) {
      // Fallback: subtract the full new plan price from the total
      const nextCycleCents = (PLAN_PRICES[newPlan] || 0) * 100;
      immediateCharge = Math.max(0, (preview.total || 0) - nextCycleCents) / 100;
    } else {
      immediateCharge = Math.max(0, prorationCharge - credit) / 100;
    }

    // Safely handle period end
    let periodEnd = null;
    if (subscription.current_period_end) {
      try {
        periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      } catch (e) {
        periodEnd = user.subscription.currentPeriodEnd?.toISOString() || null;
      }
    }

    return {
      currentPlan,
      newPlan,
      currentMonthlyPrice: PLAN_PRICES[currentPlan] || 0,
      newMonthlyPrice: PLAN_PRICES[newPlan] || 0,
      immediateCharge,
      credit: credit / 100,
      prorationCharge: prorationCharge / 100,
      periodEnd,
      effectiveNow: true
    };
  },

  /**
   * Upgrade subscription to a higher plan with proration
   */
  async upgradePlan(user, newPlan) {
    if (!STRIPE_ENABLED) {
      throw new Error('Stripe is not configured');
    }

    const PLAN_ORDER = { solo: 1, fleet: 2, pro: 3 };
    const currentPlan = user.subscription?.plan;

    if (!PLAN_ORDER[currentPlan] || !PLAN_ORDER[newPlan]) {
      throw new Error('Invalid plan');
    }

    if (PLAN_ORDER[newPlan] <= PLAN_ORDER[currentPlan]) {
      throw new Error('Can only upgrade to a higher plan');
    }

    const subscriptionId = user.subscription?.stripeSubscriptionId;
    if (!subscriptionId) {
      throw new Error('No active subscription found');
    }

    const newPriceId = PRICE_IDS[newPlan];
    if (!newPriceId) {
      throw new Error(`Price ID not configured for plan: ${newPlan}`);
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Find the base price item
    const baseItem = subscription.items.data.find(
      item => Object.values(PRICE_IDS).includes(item.price.id)
    );

    if (!baseItem) {
      throw new Error('Could not find base subscription item');
    }

    // Update subscription with default_incomplete so it won't activate until paid
    // always_invoice: creates a proration invoice immediately
    // default_incomplete: subscription stays incomplete until invoice is paid
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: baseItem.id,
        price: newPriceId
      }],
      proration_behavior: 'always_invoice',
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice'],
      metadata: {
        ...(subscription.metadata || {}),
        plan: newPlan,
        upgradedFrom: currentPlan,
        upgradedAt: new Date().toISOString()
      }
    });

    // Get the hosted invoice URL for the user to pay
    const invoice = updatedSubscription.latest_invoice;
    const paymentUrl = invoice?.hosted_invoice_url;

    if (!paymentUrl) {
      throw new Error('Could not generate payment page for upgrade');
    }

    // Don't update MongoDB plan yet — webhook will handle it after payment succeeds
    return {
      url: paymentUrl,
      plan: newPlan,
      status: updatedSubscription.status
    };
  },

  /**
   * Verify webhook signature
   */
  constructEvent(payload, signature) {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }
};

module.exports = stripeService;
