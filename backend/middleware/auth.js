const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token with populated company data
    const user = await User.findById(decoded.id)
      .populate('companies.companyId')
      .populate('activeCompanyId')
      .populate('companyId'); // Legacy support

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Check subscription status - allow access even if past_due for now
    // Block only if unpaid or canceled
    if (user.subscription?.status === 'unpaid') {
      return res.status(403).json({
        success: false,
        message: 'Your subscription payment has failed. Please update your payment method.',
        code: 'SUBSCRIPTION_UNPAID'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Authorize by role (using active company's role)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Get user's role for active company
    const userRole = req.userRole || req.user.role; // Fallback to legacy role

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check specific permission (using active company's permissions)
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    // Owners and admins have full access
    if (['owner', 'admin'].includes(req.userRole)) {
      return next();
    }

    // Use company-specific permissions or fallback to legacy permissions
    const permissions = req.userPermissions || req.user.permissions;
    const permission = permissions?.[resource]?.[action];

    if (!permission) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to ${action} ${resource}`
      });
    }
    next();
  };
};

// Ensure user can only access their company's data
// Updated to use activeCompanyId for multi-company support
const restrictToCompany = (req, res, next) => {
  // Super admin can access all (for platform admin panel if needed)
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check if user is using new multi-company structure
  if (req.user.companies && req.user.companies.length > 0) {
    // Get active company ID
    const activeCompanyId = req.user.activeCompanyId?._id || req.user.activeCompanyId;

    if (!activeCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'No active company selected. Please select a company.',
        code: 'NO_ACTIVE_COMPANY'
      });
    }

    // Find user's membership for active company
    const membership = req.user.companies.find(c => {
      const compId = c.companyId?._id || c.companyId;
      return compId?.toString() === activeCompanyId.toString();
    });

    if (!membership || !membership.isActive) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this company',
        code: 'NO_COMPANY_ACCESS'
      });
    }

    // Set company filter for queries
    req.companyFilter = { companyId: activeCompanyId };
    req.userRole = membership.role;
    req.userPermissions = membership.permissions;
    req.activeCompany = req.user.activeCompanyId;
  } else {
    // Legacy support: use old companyId field
    const companyId = req.user.companyId?._id || req.user.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'No company associated with this account'
      });
    }
    req.companyFilter = { companyId };
    req.userRole = req.user.role;
    req.userPermissions = req.user.permissions;
    req.activeCompany = req.user.companyId;
  }

  next();
};

// Middleware to check subscription limits before creating resources
const checkSubscriptionActive = (req, res, next) => {
  const activeStatuses = ['trialing', 'active'];

  if (!activeStatuses.includes(req.user.subscription?.status)) {
    return res.status(403).json({
      success: false,
      message: 'Your subscription is not active. Please subscribe to continue.',
      code: 'SUBSCRIPTION_INACTIVE'
    });
  }
  next();
};

// Require owner or admin role for company management operations
const requireCompanyAdmin = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only company owners and admins can perform this action'
    });
  }
  next();
};

// Require owner role only
const requireCompanyOwner = (req, res, next) => {
  if (req.userRole !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Only the company owner can perform this action'
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  checkPermission,
  restrictToCompany,
  checkSubscriptionActive,
  requireCompanyAdmin,
  requireCompanyOwner
};
