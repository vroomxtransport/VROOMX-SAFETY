const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Company, User, CompanyInvitation, Driver, Vehicle } = require('../models');
const { protect, restrictToCompany, requireCompanyAdmin, requireCompanyOwner } = require('../middleware/auth');
const { checkCompanyLimit } = require('../middleware/subscriptionLimits');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// Apply auth middleware to all routes
router.use(protect);

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   GET /api/companies
// @desc    Get all companies the user has access to
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const user = req.user;

  // Get populated company data
  const companiesData = user.companies
    .filter(c => c.isActive)
    .map(membership => {
      const company = membership.companyId;
      return {
        id: company._id,
        name: company.name,
        dotNumber: company.dotNumber,
        mcNumber: company.mcNumber,
        role: membership.role,
        joinedAt: membership.joinedAt,
        isActive: company.isActive
      };
    });

  res.json({
    success: true,
    companies: companiesData,
    activeCompanyId: user.activeCompanyId?._id || user.activeCompanyId
  });
}));

// @route   POST /api/companies
// @desc    Create a new company
// @access  Private
router.post('/', [
  checkCompanyLimit,
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('dotNumber').matches(/^\d{5,8}$/).withMessage('DOT number must be 5-8 digits')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, dotNumber, mcNumber, phone, email, address, carrierType } = req.body;

  // Check if DOT number already exists
  const existingCompany = await Company.findOne({ dotNumber });
  if (existingCompany) {
    return res.status(400).json({
      success: false,
      message: 'A company with this DOT number already exists'
    });
  }

  // Create the company
  const company = await Company.create({
    name,
    dotNumber,
    mcNumber,
    phone,
    email,
    address,
    carrierType,
    ownerId: req.user._id
  });

  // Add company to user's companies array with owner role
  const defaultPermissions = User.getDefaultPermissionsForRole('owner');
  req.user.companies.push({
    companyId: company._id,
    role: 'owner',
    permissions: defaultPermissions,
    joinedAt: new Date()
  });

  // Set as active company if this is the first one
  if (!req.user.activeCompanyId) {
    req.user.activeCompanyId = company._id;
  }

  await req.user.save();

  res.status(201).json({
    success: true,
    company: {
      id: company._id,
      name: company.name,
      dotNumber: company.dotNumber,
      mcNumber: company.mcNumber,
      role: 'owner'
    }
  });
}));

// @route   GET /api/companies/:id
// @desc    Get single company details
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  // Check if user has access to this company
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === req.params.id
  );

  if (!membership || !membership.isActive) {
    throw new AppError('Company not found or access denied', 404);
  }

  const company = await Company.findById(req.params.id);

  if (!company) {
    throw new AppError('Company not found', 404);
  }

  res.json({
    success: true,
    company: {
      ...company.toObject(),
      userRole: membership.role
    }
  });
}));

// @route   PUT /api/companies/:id
// @desc    Update company details
// @access  Private (Admin/Owner only)
router.put('/:id', asyncHandler(async (req, res) => {
  // Check if user has access to this company
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === req.params.id
  );

  if (!membership || !membership.isActive) {
    throw new AppError('Company not found or access denied', 404);
  }

  if (!['owner', 'admin'].includes(membership.role)) {
    throw new AppError('Only owners and admins can update company details', 403);
  }

  // Fields that can be updated
  const allowedUpdates = ['name', 'mcNumber', 'phone', 'email', 'address', 'carrierType', 'fleetSize', 'settings'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // DOT number cannot be changed
  if (req.body.dotNumber) {
    return res.status(400).json({
      success: false,
      message: 'DOT number cannot be changed'
    });
  }

  const company = await Company.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    company
  });
}));

// @route   DELETE /api/companies/:id
// @desc    Delete company (soft delete)
// @access  Private (Owner only)
router.delete('/:id', asyncHandler(async (req, res) => {
  // Check if user is owner of this company
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === req.params.id
  );

  if (!membership || membership.role !== 'owner') {
    throw new AppError('Only the company owner can delete the company', 403);
  }

  // Soft delete - mark as inactive
  await Company.findByIdAndUpdate(req.params.id, { isActive: false });

  // Remove from user's companies
  req.user.companies = req.user.companies.filter(
    c => (c.companyId._id || c.companyId).toString() !== req.params.id
  );

  // If this was the active company, switch to another one
  if (req.user.activeCompanyId?.toString() === req.params.id) {
    const activeCompany = req.user.companies.find(c => c.isActive);
    req.user.activeCompanyId = activeCompany?.companyId || null;
  }

  await req.user.save();

  res.json({
    success: true,
    message: 'Company deleted successfully'
  });
}));

// @route   POST /api/companies/:id/switch
// @desc    Switch active company context
// @access  Private
router.post('/:id/switch', asyncHandler(async (req, res) => {
  const companyId = req.params.id;

  // Check if user has access to this company
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === companyId && c.isActive
  );

  if (!membership) {
    throw new AppError('You do not have access to this company', 403);
  }

  // Update user's active company
  req.user.activeCompanyId = companyId;
  await req.user.save();

  // Get full company data
  const company = await Company.findById(companyId);

  // Generate new token (keeps same user, new context)
  const token = generateToken(req.user._id);

  res.json({
    success: true,
    token,
    company: {
      id: company._id,
      name: company.name,
      dotNumber: company.dotNumber,
      mcNumber: company.mcNumber,
      role: membership.role
    }
  });
}));

// @route   GET /api/companies/:id/members
// @desc    Get all members of a company
// @access  Private (Admin/Owner only)
router.get('/:id/members', asyncHandler(async (req, res) => {
  const companyId = req.params.id;

  // Check if user has access and is admin/owner
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === companyId
  );

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new AppError('Only owners and admins can view company members', 403);
  }

  // Find all users who have this company in their companies array
  const users = await User.find({
    'companies.companyId': companyId,
    'companies.isActive': true
  }).select('firstName lastName email companies');

  const members = users.map(user => {
    const userMembership = user.companies.find(
      c => c.companyId.toString() === companyId
    );
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: userMembership.role,
      joinedAt: userMembership.joinedAt
    };
  });

  res.json({
    success: true,
    members
  });
}));

// @route   POST /api/companies/:id/invite
// @desc    Invite a user to the company
// @access  Private (Admin/Owner only)
router.post('/:id/invite', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'safety_manager', 'dispatcher', 'driver', 'viewer']).withMessage('Valid role is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const companyId = req.params.id;
  const { email, role } = req.body;

  // Check if user has access and is admin/owner
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === companyId
  );

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new AppError('Only owners and admins can invite members', 403);
  }

  // Check if there's already a pending invitation
  const existingInvitation = await CompanyInvitation.findOne({
    companyId,
    email: email.toLowerCase(),
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });

  if (existingInvitation) {
    return res.status(400).json({
      success: false,
      message: 'An invitation has already been sent to this email'
    });
  }

  // Check if user already has access to this company
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    'companies.companyId': companyId
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'This user already has access to this company'
    });
  }

  // Create invitation (use new + save to ensure pre-save hook runs before validation)
  const invitation = new CompanyInvitation({
    companyId,
    email,
    role,
    invitedBy: req.user._id
  });
  await invitation.save();

  // Get company name for response
  const company = await Company.findById(companyId).select('name');

  // Send invitation email
  emailService.sendCompanyInvitation(invitation, company, req.user).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Invitation sent successfully',
    invitation: {
      id: invitation._id,
      email: invitation.email,
      role: invitation.role,
      companyName: company.name,
      expiresAt: invitation.expiresAt,
      token: invitation.token // Include for testing, in production send via email
    }
  });
}));

// @route   DELETE /api/companies/:id/members/:userId
// @desc    Remove a member from the company
// @access  Private (Admin/Owner only, cannot remove owner)
router.delete('/:id/members/:userId', asyncHandler(async (req, res) => {
  const companyId = req.params.id;
  const userIdToRemove = req.params.userId;

  // Check if user has access and is admin/owner
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === companyId
  );

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new AppError('Only owners and admins can remove members', 403);
  }

  // Find the user to remove
  const userToRemove = await User.findById(userIdToRemove);

  if (!userToRemove) {
    throw new AppError('User not found', 404);
  }

  // Find their membership
  const membershipToRemove = userToRemove.companies.find(
    c => c.companyId.toString() === companyId
  );

  if (!membershipToRemove) {
    throw new AppError('User is not a member of this company', 404);
  }

  // Cannot remove owner
  if (membershipToRemove.role === 'owner') {
    throw new AppError('Cannot remove the company owner', 403);
  }

  // Admin cannot remove another admin (only owner can)
  if (membershipToRemove.role === 'admin' && membership.role !== 'owner') {
    throw new AppError('Only the owner can remove admins', 403);
  }

  // Remove company from user
  userToRemove.companies = userToRemove.companies.filter(
    c => c.companyId.toString() !== companyId
  );

  // If this was their active company, switch to another
  if (userToRemove.activeCompanyId?.toString() === companyId) {
    const activeCompany = userToRemove.companies.find(c => c.isActive);
    userToRemove.activeCompanyId = activeCompany?.companyId || null;
  }

  await userToRemove.save();

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
}));

// @route   GET /api/companies/:id/stats
// @desc    Get company usage stats (drivers, vehicles count)
// @access  Private
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const companyId = req.params.id;

  // Check if user has access to this company
  const membership = req.user.companies.find(
    c => (c.companyId._id || c.companyId).toString() === companyId
  );

  if (!membership || !membership.isActive) {
    throw new AppError('Company not found or access denied', 404);
  }

  // Get counts
  const driverCount = await Driver.countDocuments({
    companyId,
    status: { $ne: 'terminated' }
  });

  const vehicleCount = await Vehicle.countDocuments({
    companyId,
    status: { $ne: 'out_of_service' }
  });

  // Get subscription limits
  const limits = req.user.limits;

  res.json({
    success: true,
    stats: {
      drivers: {
        current: driverCount,
        limit: limits.maxDriversPerCompany === Infinity ? 'unlimited' : limits.maxDriversPerCompany
      },
      vehicles: {
        current: vehicleCount,
        limit: limits.maxVehiclesPerCompany === Infinity ? 'unlimited' : limits.maxVehiclesPerCompany
      }
    }
  });
}));

module.exports = router;
