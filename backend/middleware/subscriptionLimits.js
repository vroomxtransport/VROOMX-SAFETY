const { Driver, Vehicle } = require('../models');
const stripeService = require('../services/stripeService');

// Plan configurations for per-driver billing
const PLAN_CONFIG = {
  solo: { includedDrivers: 1, extraDriverPrice: null },
  fleet: { includedDrivers: 3, extraDriverPrice: 6 },
  pro: { includedDrivers: 10, extraDriverPrice: 5 }
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
    const plan = user.subscription?.plan || 'free_trial';
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

    // Solo plan has hard limit of 1 driver
    if (plan === 'solo' && driverCount >= 1) {
      return res.status(403).json({
        success: false,
        message: 'Solo plan is limited to 1 driver. Upgrade to Fleet for more drivers.',
        code: 'DRIVER_LIMIT_REACHED',
        limit: 1,
        current: driverCount,
        upgradeTo: 'fleet'
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

    // Fleet and Pro plans allow unlimited drivers
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

    // Only report for Fleet and Pro plans with metered billing
    if (!['fleet', 'pro'].includes(plan)) {
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
    const plan = user.subscription?.plan || 'free_trial';
    const activeCompanyId = req.companyFilter?.companyId;

    if (!activeCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'No active company selected'
      });
    }

    // Count current vehicles in the company
    const vehicleCount = await Vehicle.countDocuments({
      companyId: activeCompanyId,
      status: { $ne: 'out_of_service' }
    });

    // Solo plan has hard limit of 1 vehicle
    if (plan === 'solo' && vehicleCount >= 1) {
      return res.status(403).json({
        success: false,
        message: 'Solo plan is limited to 1 vehicle. Upgrade to Fleet for more vehicles.',
        code: 'VEHICLE_LIMIT_REACHED',
        limit: 1,
        current: vehicleCount,
        upgradeTo: 'fleet'
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
  const plan = user.subscription?.plan || 'free_trial';
  const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.solo;

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
      limit: (plan === 'solo' || plan === 'free_trial') ? 1 : 'unlimited'
    },
    vehicles: {
      current: vehicleCount,
      limit: (plan === 'solo' || plan === 'free_trial') ? 1 : 'unlimited'
    }
  };
};

module.exports = {
  checkCompanyLimit,
  checkDriverLimit,
  checkVehicleLimit,
  getUsageStats,
  reportDriverUsage,
  PLAN_CONFIG
};
