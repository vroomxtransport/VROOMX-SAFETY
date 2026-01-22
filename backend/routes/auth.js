const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Company } = require('../models');
const { protect, restrictToCompany } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getUsageStats } = require('../middleware/subscriptionLimits');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user & company (creates owner)
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('companyName').trim().notEmpty(),
  body('dotNumber').trim().isLength({ min: 5, max: 8 }).isNumeric()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, firstName, lastName, companyName, dotNumber, mcNumber, phone, address, selectedPlan } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Check if company (DOT#) exists
  let existingCompany = await Company.findOne({ dotNumber });
  if (existingCompany) {
    return res.status(400).json({
      success: false,
      message: 'A company with this DOT number already exists'
    });
  }

  // Determine subscription based on selected plan
  let subscription;
  if (selectedPlan === 'solo') {
    // Solo plan: No trial, requires payment to activate
    subscription = {
      plan: 'solo',
      status: 'pending_payment',
      trialEndsAt: null
    };
  } else {
    // Fleet/Pro plans: 3-day free trial
    subscription = {
      plan: 'free_trial',
      status: 'trialing',
      trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    };
  }

  // Create user first (needed for ownerId)
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    subscription,
    // Legacy fields for backward compatibility
    role: 'admin',
    permissions: User.getDefaultPermissionsForRole('owner')
  });

  // Create company with user as owner
  const company = await Company.create({
    name: companyName,
    dotNumber,
    mcNumber,
    phone,
    address,
    email,
    ownerId: user._id
  });

  // Add company to user's companies array
  const defaultPermissions = User.getDefaultPermissionsForRole('owner');
  user.companies = [{
    companyId: company._id,
    role: 'owner',
    permissions: defaultPermissions,
    joinedAt: new Date()
  }];
  user.activeCompanyId = company._id;
  user.companyId = company._id; // Legacy support
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        trialEndsAt: user.subscription.trialEndsAt,
        trialDaysRemaining: user.trialDaysRemaining
      },
      companies: [{
        id: company._id,
        name: company.name,
        dotNumber: company.dotNumber,
        role: 'owner'
      }],
      activeCompany: {
        id: company._id,
        name: company.name,
        dotNumber: company.dotNumber,
        role: 'owner'
      },
      // Legacy support
      role: 'admin',
      permissions: defaultPermissions,
      company: {
        id: company._id,
        name: company.name,
        dotNumber: company.dotNumber
      }
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, companyId: requestedCompanyId } = req.body;

  // Check for user (include password for comparison)
  const user = await User.findOne({ email })
    .select('+password')
    .populate('companies.companyId')
    .populate('activeCompanyId')
    .populate('companyId'); // Legacy support

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated'
    });
  }

  // Determine active company
  let activeCompany = null;
  let activeRole = null;
  let activePermissions = null;

  // Check if using new multi-company structure
  if (user.companies && user.companies.length > 0) {
    // If a specific company was requested, verify access
    if (requestedCompanyId) {
      const membership = user.companies.find(
        c => (c.companyId._id || c.companyId).toString() === requestedCompanyId && c.isActive
      );
      if (membership) {
        activeCompany = membership.companyId;
        activeRole = membership.role;
        activePermissions = membership.permissions;
        user.activeCompanyId = activeCompany._id;
      }
    }

    // If no specific company or not found, use current active or first
    if (!activeCompany) {
      if (user.activeCompanyId) {
        const membership = user.companies.find(
          c => (c.companyId._id || c.companyId).toString() === (user.activeCompanyId._id || user.activeCompanyId).toString()
        );
        if (membership && membership.isActive) {
          activeCompany = membership.companyId;
          activeRole = membership.role;
          activePermissions = membership.permissions;
        }
      }
      // Fallback to first active company
      if (!activeCompany) {
        const firstActive = user.companies.find(c => c.isActive);
        if (firstActive) {
          activeCompany = firstActive.companyId;
          activeRole = firstActive.role;
          activePermissions = firstActive.permissions;
          user.activeCompanyId = activeCompany._id;
        }
      }
    }
  } else {
    // Legacy: use old companyId
    activeCompany = user.companyId;
    activeRole = user.role;
    activePermissions = user.permissions;
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  // Build companies list for response
  const companiesList = user.companies?.map(m => ({
    id: m.companyId._id || m.companyId,
    name: m.companyId.name,
    dotNumber: m.companyId.dotNumber,
    role: m.role,
    isActive: m.isActive
  })) || [];

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: {
        plan: user.subscription?.plan || 'free_trial',
        status: user.subscription?.status || 'trialing',
        trialEndsAt: user.subscription?.trialEndsAt,
        trialDaysRemaining: user.trialDaysRemaining,
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd
      },
      limits: user.limits,
      companies: companiesList,
      activeCompany: activeCompany ? {
        id: activeCompany._id,
        name: activeCompany.name,
        dotNumber: activeCompany.dotNumber,
        mcNumber: activeCompany.mcNumber,
        role: activeRole
      } : null,
      // Legacy support
      role: activeRole || user.role,
      permissions: activePermissions || user.permissions,
      company: activeCompany ? {
        id: activeCompany._id,
        name: activeCompany.name,
        dotNumber: activeCompany.dotNumber
      } : null
    }
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user with all company data
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('companies.companyId')
    .populate('activeCompanyId')
    .populate('companyId'); // Legacy support

  // Get usage stats
  const usage = await getUsageStats(user);

  // Find active company membership
  let activeCompany = null;
  let activeRole = null;
  let activePermissions = null;

  if (user.companies && user.companies.length > 0) {
    const activeMembership = user.companies.find(
      c => (c.companyId._id || c.companyId).toString() === (user.activeCompanyId?._id || user.activeCompanyId)?.toString()
    );
    if (activeMembership) {
      activeCompany = activeMembership.companyId;
      activeRole = activeMembership.role;
      activePermissions = activeMembership.permissions;
    }
  } else if (user.companyId) {
    // Legacy support
    activeCompany = user.companyId;
    activeRole = user.role;
    activePermissions = user.permissions;
  }

  // Build companies list
  const companiesList = user.companies?.map(m => ({
    id: m.companyId._id || m.companyId,
    name: m.companyId.name,
    dotNumber: m.companyId.dotNumber,
    mcNumber: m.companyId.mcNumber,
    role: m.role,
    isActive: m.isActive,
    joinedAt: m.joinedAt
  })) || [];

  res.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: {
        plan: user.subscription?.plan || 'free_trial',
        status: user.subscription?.status || 'trialing',
        trialEndsAt: user.subscription?.trialEndsAt,
        trialDaysRemaining: user.trialDaysRemaining,
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd
      },
      limits: user.limits,
      usage,
      companies: companiesList,
      activeCompany: activeCompany ? {
        id: activeCompany._id,
        name: activeCompany.name,
        dotNumber: activeCompany.dotNumber,
        mcNumber: activeCompany.mcNumber,
        smsBasics: activeCompany.smsBasics,
        role: activeRole
      } : null,
      // Legacy support
      role: activeRole || user.role,
      permissions: activePermissions || user.permissions,
      company: activeCompany ? {
        id: activeCompany._id,
        name: activeCompany.name,
        dotNumber: activeCompany.dotNumber,
        smsBasics: activeCompany.smsBasics
      } : null
    }
  });
}));

// @route   PUT /api/auth/updatepassword
// @desc    Update password
// @access  Private
router.put('/updatepassword', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    message: 'Password updated successfully'
  });
}));

// @route   POST /api/auth/users
// @desc    Create new user for company (legacy - use company invite instead)
// @access  Private (Admin only)
router.post('/users', protect, restrictToCompany, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['admin', 'safety_manager', 'dispatcher', 'driver', 'viewer'])
], asyncHandler(async (req, res) => {
  // Only admin/owner can create users
  if (!['admin', 'owner'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create users'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, firstName, lastName, role } = req.body;

  // Check if user exists
  let existingUser = await User.findOne({ email });

  if (existingUser) {
    // Check if user already has access to this company
    const hasAccess = existingUser.companies?.some(
      c => c.companyId.toString() === req.companyFilter.companyId.toString()
    );

    if (hasAccess) {
      return res.status(400).json({
        success: false,
        message: 'User already has access to this company'
      });
    }

    // Add this company to existing user
    const defaultPermissions = User.getDefaultPermissionsForRole(role);
    existingUser.companies.push({
      companyId: req.companyFilter.companyId,
      role,
      permissions: defaultPermissions,
      joinedAt: new Date(),
      invitedBy: req.user._id
    });
    await existingUser.save();

    return res.status(201).json({
      success: true,
      user: {
        id: existingUser._id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        role
      },
      message: 'User added to company'
    });
  }

  // Create new user
  const defaultPermissions = User.getDefaultPermissionsForRole(role);

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    subscription: {
      plan: 'free_trial',
      status: 'trialing',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    companies: [{
      companyId: req.companyFilter.companyId,
      role,
      permissions: defaultPermissions,
      joinedAt: new Date(),
      invitedBy: req.user._id
    }],
    activeCompanyId: req.companyFilter.companyId,
    // Legacy support
    role,
    permissions: defaultPermissions,
    companyId: req.companyFilter.companyId
  });

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  });
}));

// @route   GET /api/auth/users
// @desc    Get all users for company
// @access  Private (Admin only)
router.get('/users', protect, restrictToCompany, asyncHandler(async (req, res) => {
  if (!['admin', 'owner'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  // Find users who have this company in their companies array
  const users = await User.find({
    'companies.companyId': req.companyFilter.companyId
  }).select('-password');

  // Map to include role for this specific company
  const usersWithRoles = users.map(user => {
    const membership = user.companies.find(
      c => c.companyId.toString() === req.companyFilter.companyId.toString()
    );
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: membership?.role || user.role,
      isActive: user.isActive && membership?.isActive,
      lastLogin: user.lastLogin,
      joinedAt: membership?.joinedAt
    };
  });

  res.json({
    success: true,
    count: usersWithRoles.length,
    users: usersWithRoles
  });
}));

module.exports = router;
