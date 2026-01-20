const { Driver, Vehicle } = require('../models');

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
        message: `You have reached the maximum number of companies (${limits.maxCompanies}) for your subscription plan. Upgrade to Professional for unlimited companies.`,
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
const checkDriverLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = user.limits;
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
      status: { $ne: 'terminated' } // Don't count terminated drivers
    });

    if (limits.maxDriversPerCompany !== Infinity && driverCount >= limits.maxDriversPerCompany) {
      return res.status(403).json({
        success: false,
        message: `You have reached the maximum number of drivers (${limits.maxDriversPerCompany}) for your subscription plan. Upgrade to Professional for unlimited drivers.`,
        code: 'DRIVER_LIMIT_REACHED',
        limit: limits.maxDriversPerCompany,
        current: driverCount
      });
    }

    next();
  } catch (error) {
    console.error('Error checking driver limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription limits'
    });
  }
};

// Check if user can create another vehicle in the active company
const checkVehicleLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = user.limits;
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
      status: { $ne: 'out_of_service' } // Don't count out of service vehicles
    });

    if (limits.maxVehiclesPerCompany !== Infinity && vehicleCount >= limits.maxVehiclesPerCompany) {
      return res.status(403).json({
        success: false,
        message: `You have reached the maximum number of vehicles (${limits.maxVehiclesPerCompany}) for your subscription plan. Upgrade to Professional for unlimited vehicles.`,
        code: 'VEHICLE_LIMIT_REACHED',
        limit: limits.maxVehiclesPerCompany,
        current: vehicleCount
      });
    }

    next();
  } catch (error) {
    console.error('Error checking vehicle limit:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription limits'
    });
  }
};

// Get current usage stats for the user
const getUsageStats = async (user) => {
  const limits = user.limits;

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

  return {
    companies: {
      owned: ownedCompanyCount,
      total: totalCompanyCount,
      limit: limits.maxCompanies === Infinity ? 'unlimited' : limits.maxCompanies
    },
    drivers: {
      current: driverCount,
      limit: limits.maxDriversPerCompany === Infinity ? 'unlimited' : limits.maxDriversPerCompany
    },
    vehicles: {
      current: vehicleCount,
      limit: limits.maxVehiclesPerCompany === Infinity ? 'unlimited' : limits.maxVehiclesPerCompany
    }
  };
};

module.exports = {
  checkCompanyLimit,
  checkDriverLimit,
  checkVehicleLimit,
  getUsageStats
};
