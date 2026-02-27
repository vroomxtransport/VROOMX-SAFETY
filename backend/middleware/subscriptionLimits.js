const { Driver, Vehicle } = require('../models');
const stripeService = require('../services/stripeService');
const AIQueryUsage = require('../models/AIQueryUsage');

// AI Query quotas by plan (per month)
const AI_QUERY_QUOTAS = {
  free: 0,
  free_trial: 20,
  owner_operator: 150,
  small_fleet: 500,
  fleet_pro: -1,  // unlimited
  // Legacy plan mappings
  solo: 150,
  fleet: 500,
  pro: -1,
  complete: -1,
  starter: 150,
  professional: -1
};

// Plan configurations for per-driver billing
const PLAN_CONFIG = {
  free: { includedDrivers: 1, extraDriverPrice: null },
  owner_operator: { includedDrivers: 1, extraDriverPrice: null },
  small_fleet: { includedDrivers: 5, extraDriverPrice: 8 },
  fleet_pro: { includedDrivers: 15, extraDriverPrice: 6 },
  // Legacy plan mappings
  solo: { includedDrivers: 1, extraDriverPrice: null },
  fleet: { includedDrivers: 5, extraDriverPrice: 8 },
  pro: { includedDrivers: 15, extraDriverPrice: 6 }
};

// Check if user can create another company based on subscription limits
const checkCompanyLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = user.limits;

    // Count companies user owns
    const ownedCompanyCount = user.getOwnedCompanyCount();

    if (limits.maxCompanies !== Infinity && ownedCompanyCount >= limits.maxCompanies) {
      return res.status(403).json({
        success: false,
        message: `You have reached the maximum number of companies (${limits.maxCompanies}) for your subscription plan. Upgrade to Pro for unlimited companies.`,
        code: 'COMPANY_LIMIT_REACHED',
        limit: limits.maxCompanies,
        current: ownedCompanyCount
      });
    }

    next();
  } catch (error) {
    console.error('Error checking company limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription limits'
    });
  }
};

// Check if user can create another driver in the active company
// For Fleet and Pro plans, allow unlimited drivers but track for billing
//
// RACE CONDITION NOTE: There is a potential race condition between this middleware check
// and the actual driver/vehicle creation in the route handler. Two concurrent requests
// could both pass the limit check before either creates a record, resulting in exceeding
// the limit by one. For plans with hard limits (solo, free_trial), the route handlers
// use MongoDB transactions to re-check the count atomically before creating the record.
const checkDriverLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const plan = user.subscription?.plan || 'free';
    const activeCompanyId = req.companyFilter?.companyId;

    if (!activeCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'No active company selected'
      });
    }

    // Count current drivers in the company
    const driverCount = await Driver.countDocuments({
      companyId: activeCompanyId,
      status: { $ne: 'terminated' }
    });

    const planConfig = PLAN_CONFIG[plan];

    // Free, Owner-Operator (and legacy Solo) plan has hard limit of 1 driver
    if ((plan === 'free' || plan === 'owner_operator' || plan === 'solo') && driverCount >= 1) {
      return res.status(403).json({
        success: false,
        message: plan === 'free'
          ? 'Free plan is limited to 1 driver. Upgrade to Fleet to add more drivers.'
          : 'Owner-Operator plan is limited to 1 driver. Upgrade to Small Fleet for more drivers.',
        code: 'DRIVER_LIMIT_REACHED',
        limit: 1,
        current: driverCount,
        upgradeTo: 'small_fleet'
      });
    }

    // Free trial - limited to 1 driver
    if (plan === 'free_trial' && driverCount >= 1) {
      return res.status(403).json({
        success: false,
        message: 'Free trial is limited to 1 driver. Subscribe to continue adding drivers.',
        code: 'DRIVER_LIMIT_REACHED',
        limit: 1,
        current: driverCount
      });
    }

    // Small Fleet, Fleet Pro (and legacy Fleet, Pro) plans allow unlimited drivers
    // Store driver count for post-create billing update
    req.currentDriverCount = driverCount;
    req.planConfig = planConfig;

    next();
  } catch (error) {
    console.error('Error checking driver limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription limits'
    });
  }
};

// Report driver usage to Stripe after driver creation
const reportDriverUsage = async (req, res, next) => {
  try {
    const user = req.user;
    const plan = user.subscription?.plan;

    // Only report for plans with metered billing
    if (!['small_fleet', 'fleet_pro', 'fleet', 'pro'].includes(plan)) {
      return next();
    }

    const activeCompanyId = req.companyFilter?.companyId;
    if (!activeCompanyId) {
      return next();
    }

    // Count total drivers after the operation
    const driverCount = await Driver.countDocuments({
      companyId: activeCompanyId,
      status: { $ne: 'terminated' }
    });

    // Report usage to Stripe (async, don't block response)
    stripeService.reportDriverUsage(user, driverCount).catch(err => {
      console.error('Failed to report driver usage to Stripe:', err);
    });

    next();
  } catch (error) {
    console.error('Error reporting driver usage:', error);
    next(); // Don't fail the request if usage reporting fails
  }
};

// Check if user can create another vehicle in the active company
//
// RACE CONDITION NOTE: Same as checkDriverLimit above. See route handlers for
// the transaction-based re-check that prevents exceeding hard limits.
const checkVehicleLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const plan = user.subscription?.plan || 'free';
    const activeCompanyId = req.companyFilter?.companyId;

    if (!activeCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'No active company selected'
      });
    }

    // Count current vehicles in the company (exclude sold/totaled, not just out_of_service)
    const vehicleCount = await Vehicle.countDocuments({
      companyId: activeCompanyId,
      status: { $nin: ['sold', 'totaled'] }
    });

    // Free, Owner-Operator (and legacy Solo) plan has hard limit of 1 vehicle
    if ((plan === 'free' || plan === 'owner_operator' || plan === 'solo') && vehicleCount >= 1) {
      return res.status(403).json({
        success: false,
        message: plan === 'free'
          ? 'Free plan is limited to 1 vehicle. Upgrade to Fleet to add more vehicles.'
          : 'Owner-Operator plan is limited to 1 vehicle. Upgrade to Small Fleet for more vehicles.',
        code: 'VEHICLE_LIMIT_REACHED',
        limit: 1,
        current: vehicleCount,
        upgradeTo: 'small_fleet'
      });
    }

    // Free trial - limited to 1 vehicle
    if (plan === 'free_trial' && vehicleCount >= 1) {
      return res.status(403).json({
        success: false,
        message: 'Free trial is limited to 1 vehicle. Subscribe to continue adding vehicles.',
        code: 'VEHICLE_LIMIT_REACHED',
        limit: 1,
        current: vehicleCount
      });
    }

    // Fleet and Pro plans allow unlimited vehicles
    next();
  } catch (error) {
    console.error('Error checking vehicle limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription limits'
    });
  }
};

// Get current usage stats for the user with per-driver billing info
const getUsageStats = async (user) => {
  const limits = user.limits;
  const plan = user.subscription?.plan || 'free';
  const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free;

  // Get company counts
  const ownedCompanyCount = user.getOwnedCompanyCount();
  const totalCompanyCount = user.companies?.length || 0;

  // Get driver/vehicle counts for active company if set
  let driverCount = 0;
  let vehicleCount = 0;

  const activeCompanyId = user.activeCompanyId?._id || user.activeCompanyId;

  if (activeCompanyId) {
    driverCount = await Driver.countDocuments({
      companyId: activeCompanyId,
      status: { $ne: 'terminated' }
    });

    vehicleCount = await Vehicle.countDocuments({
      companyId: activeCompanyId,
      status: { $ne: 'out_of_service' }
    });
  }

  // Calculate extra drivers and estimated extra cost
  const includedDrivers = planConfig.includedDrivers || 0;
  const extraDrivers = Math.max(0, driverCount - includedDrivers);
  const extraDriverCost = planConfig.extraDriverPrice ? extraDrivers * planConfig.extraDriverPrice : 0;

  return {
    companies: {
      owned: ownedCompanyCount,
      total: totalCompanyCount,
      limit: limits.maxCompanies === Infinity ? 'unlimited' : limits.maxCompanies
    },
    drivers: {
      current: driverCount,
      included: includedDrivers,
      extra: extraDrivers,
      extraPrice: planConfig.extraDriverPrice,
      extraCost: extraDriverCost,
      limit: (plan === 'free' || plan === 'owner_operator' || plan === 'solo' || plan === 'free_trial') ? 1 : 'unlimited'
    },
    vehicles: {
      current: vehicleCount,
      limit: (plan === 'free' || plan === 'owner_operator' || plan === 'solo' || plan === 'free_trial') ? 1 : 'unlimited'
    }
  };
};

/**
 * Check AI query quota before allowing AI requests
 */
const checkAIQueryQuota = async (req, res, next) => {
  try {
    const user = req.user;
    const plan = user.subscription?.plan || 'free';
    const status = user.subscription?.status;
    const quota = AI_QUERY_QUOTAS[plan];

    // Trialing users get trial-level access regardless of plan
    if (status === 'trialing') {
      const trialQuota = AI_QUERY_QUOTAS['free_trial'] || 20;
      req.aiQuota = { quota: trialQuota, current: 0, remaining: trialQuota };
      return next();
    }

    // Pro plan has unlimited
    if (quota === -1) {
      req.aiQuota = { quota: -1, current: 0, remaining: -1, unlimited: true };
      return next();
    }

    // Get current month usage
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const record = await AIQueryUsage.findOne({ userId: user._id, month });
    const current = record?.count || 0;

    if (current >= quota) {
      return res.status(429).json({
        success: false,
        message: `Monthly AI query limit reached (${quota} queries/month on ${plan} plan). Upgrade for more.`,
        code: 'AI_QUOTA_EXCEEDED',
        quota,
        current,
        plan,
        upgradeUrl: '/billing'
      });
    }

    // Attach quota info to request for response
    req.aiQuota = { quota, current, remaining: quota - current };
    next();
  } catch (error) {
    console.error('Error checking AI quota:', error);
    return res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
  }
};

/**
 * Middleware to restrict free plan users from premium features.
 * Trialing users are allowed through (they're evaluating paid plans).
 */
const requirePaidPlan = (featureName = 'This feature') => {
  return (req, res, next) => {
    const plan = req.user.subscription?.plan || 'free';
    const status = req.user.subscription?.status;

    // Allow trialing users to access all features
    if (status === 'trialing') return next();

    // Allow any paid plan through
    if (plan !== 'free' && plan !== 'owner_operator') return next();

    return res.status(403).json({
      success: false,
      message: `${featureName} requires a paid plan. Upgrade to Fleet to unlock.`,
      code: 'FREE_PLAN_RESTRICTED',
      upgradeUrl: '/app/billing'
    });
  };
};

module.exports = {
  checkCompanyLimit,
  checkDriverLimit,
  checkVehicleLimit,
  getUsageStats,
  reportDriverUsage,
  checkAIQueryQuota,
  requirePaidPlan,
  PLAN_CONFIG,
  AI_QUERY_QUOTAS
};
