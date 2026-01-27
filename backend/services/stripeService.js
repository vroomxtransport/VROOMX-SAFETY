const Stripe = require('stripe');
const User = require('../models/User');

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
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID
};

// Plan metadata mapping
const PLAN_METADATA = {
  solo: {
    plan: 'solo',
    maxCompanies: 1,
    maxDriversPerCompany: 1,
    maxVehiclesPerCompany: 1
  },
  starter: {
    plan: 'starter',
    maxCompanies: 1,
    maxDriversPerCompany: 3,
    maxVehiclesPerCompany: 3
  },
  professional: {
    plan: 'professional',
    maxCompanies: -1, // unlimited
    maxDriversPerCompany: -1,
    maxVehiclesPerCompany: -1
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
        console.log('Customer not found, creating new one');
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
      console.log(`createCheckoutSession: planType=${planType}, priceId=${priceId}`);
      console.log('Available PRICE_IDS:', JSON.stringify(PRICE_IDS));
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
          console.log(`Unhandled event type: ${event.type}`);
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
    console.log(`Subscription activated for user ${userId}: ${plan}`);
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
    console.log(`Subscription updated for user ${user._id}: ${plan} (${subscription.status})`);
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
    console.log(`Subscription canceled for user ${user._id}`);
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
        console.log(`Payment succeeded, subscription reactivated for user ${user._id}`);
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
        console.log(`Payment failed for user ${user._id}`);
        // TODO: Send email notification about failed payment
      }
    }
  },

  /**
   * Get plan name from Stripe price ID
   */
  getPlanFromPriceId(priceId) {
    if (priceId === PRICE_IDS.solo) return 'solo';
    if (priceId === PRICE_IDS.starter) return 'starter';
    if (priceId === PRICE_IDS.professional) return 'professional';
    return 'free_trial';
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
