const express = require('express');
const router = express.Router();
const { CompanyInvitation, User } = require('../models');
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/invitations/pending
// @desc    Get pending invitations for current user's email
// @access  Private
router.get('/pending', asyncHandler(async (req, res) => {
  const invitations = await CompanyInvitation.findPendingByEmail(req.user.email);

  res.json({
    success: true,
    invitations: invitations.map(inv => ({
      id: inv._id,
      token: inv.token,
      company: {
        id: inv.companyId._id,
        name: inv.companyId.name,
        dotNumber: inv.companyId.dotNumber
      },
      role: inv.role,
      invitedBy: {
        firstName: inv.invitedBy.firstName,
        lastName: inv.invitedBy.lastName,
        email: inv.invitedBy.email
      },
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt
    }))
  });
}));

// @route   POST /api/invitations/:token/accept
// @desc    Accept an invitation and join the company
// @access  Private
router.post('/:token/accept', asyncHandler(async (req, res) => {
  const invitation = await CompanyInvitation.findPendingByToken(req.params.token);

  if (!invitation) {
    throw new AppError('Invitation not found or has expired', 404);
  }

  // Verify the invitation is for this user
  if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
    throw new AppError('This invitation was sent to a different email address', 403);
  }

  // Check if user already has access to this company
  const hasAccess = req.user.companies?.some(
    c => (c.companyId._id || c.companyId).toString() === invitation.companyId._id.toString()
  );

  if (hasAccess) {
    // Mark invitation as accepted anyway
    await invitation.markAccepted();
    return res.json({
      success: true,
      message: 'You already have access to this company'
    });
  }

  // Add company to user's companies array
  const defaultPermissions = User.getDefaultPermissionsForRole(invitation.role);
  req.user.companies.push({
    companyId: invitation.companyId._id,
    role: invitation.role,
    permissions: defaultPermissions,
    joinedAt: new Date(),
    invitedBy: invitation.invitedBy._id
  });

  // If user has no active company, set this as active
  if (!req.user.activeCompanyId) {
    req.user.activeCompanyId = invitation.companyId._id;
  }

  await req.user.save();

  // Mark invitation as accepted
  await invitation.markAccepted();

  res.json({
    success: true,
    message: 'Invitation accepted successfully',
    company: {
      id: invitation.companyId._id,
      name: invitation.companyId.name,
      dotNumber: invitation.companyId.dotNumber,
      role: invitation.role
    }
  });
}));

// @route   POST /api/invitations/:token/decline
// @desc    Decline an invitation
// @access  Private
router.post('/:token/decline', asyncHandler(async (req, res) => {
  const invitation = await CompanyInvitation.findPendingByToken(req.params.token);

  if (!invitation) {
    throw new AppError('Invitation not found or has expired', 404);
  }

  // Verify the invitation is for this user
  if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
    throw new AppError('This invitation was sent to a different email address', 403);
  }

  // Cancel the invitation
  await invitation.cancel();

  res.json({
    success: true,
    message: 'Invitation declined'
  });
}));

// @route   GET /api/invitations/sent
// @desc    Get invitations sent by the current user
// @access  Private
router.get('/sent', asyncHandler(async (req, res) => {
  const invitations = await CompanyInvitation.find({
    invitedBy: req.user._id
  })
    .populate('companyId', 'name dotNumber')
    .sort('-createdAt')
    .limit(50);

  res.json({
    success: true,
    invitations: invitations.map(inv => ({
      id: inv._id,
      email: inv.email,
      company: {
        id: inv.companyId._id,
        name: inv.companyId.name,
        dotNumber: inv.companyId.dotNumber
      },
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      createdAt: inv.createdAt
    }))
  });
}));

// @route   DELETE /api/invitations/:id
// @desc    Cancel a pending invitation (inviter only)
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const invitation = await CompanyInvitation.findById(req.params.id);

  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }

  // Only the inviter can cancel
  if (invitation.invitedBy.toString() !== req.user._id.toString()) {
    throw new AppError('You can only cancel invitations you sent', 403);
  }

  if (invitation.status !== 'pending') {
    throw new AppError('Cannot cancel an invitation that is not pending', 400);
  }

  await invitation.cancel();

  res.json({
    success: true,
    message: 'Invitation canceled'
  });
}));

module.exports = router;
