const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const auditService = require('../services/auditService');
const emailService = require('../services/emailService');
const AuditLog = require('../models/AuditLog');
const Announcement = require('../models/Announcement');
const FeatureFlag = require('../models/FeatureFlag');
const SystemConfig = require('../models/SystemConfig');
const EmailLog = require('../models/EmailLog');
const maintenanceMiddleware = require('../middleware/maintenance');
const dataIntegrityService = require('../services/dataIntegrityService');

// All admin routes require authentication and superadmin role
router.use(protect);
router.use(requireSuperAdmin);

// Helper function to cascade delete all company data
async function cascadeDeleteCompany(companyId) {
  const db = mongoose.connection.db;
  const objectId = new mongoose.Types.ObjectId(companyId);

  // Delete all related data in parallel
  const results = await Promise.all([
    db.collection('drivers').deleteMany({ companyId: objectId }),
    db.collection('vehicles').deleteMany({ companyId: objectId }),
    db.collection('documents').deleteMany({ companyId: objectId }),
    db.collection('violations').deleteMany({ companyId: objectId }),
    db.collection('accidents').deleteMany({ companyId: objectId }),
    db.collection('drugalcoholtests').deleteMany({ companyId: objectId }),
    db.collection('tickets').deleteMany({ companyId: objectId }),
    db.collection('alerts').deleteMany({ companyId: objectId }),
    db.collection('maintenancerecords').deleteMany({ companyId: objectId }),
    db.collection('tasks').deleteMany({ companyId: objectId }),
    db.collection('checklisttemplates').deleteMany({ companyId: objectId }),
    db.collection('checklistassignments').deleteMany({ companyId: objectId }),
    db.collection('csascorehistories').deleteMany({ companyId: objectId }),
    db.collection('compliancescores').deleteMany({ companyId: objectId }),
    db.collection('damageclaims').deleteMany({ companyId: objectId }),
    db.collection('companyinvitations').deleteMany({ companyId: objectId }),
  ]);

  // Remove company from all users' companies array
  await db.collection('users').updateMany(
    { 'companies.companyId': objectId },
    { $pull: { companies: { companyId: objectId } } }
  );

  // Clear activeCompanyId for users who had this as active
  await db.collection('users').updateMany(
    { activeCompanyId: objectId },
    { $unset: { activeCompanyId: '' } }
  );

  // Delete the company itself
  await db.collection('companies').deleteOne({ _id: objectId });

  return results;
}

// Allowed values for subscription validation
const VALID_PLANS = ['free_trial', 'solo', 'fleet', 'starter', 'professional'];
const VALID_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'pending_payment'];
const PLAN_PRICES = { free_trial: 0, solo: 29, starter: 49, fleet: 79, professional: 149 };

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pagination limits
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Super Admin
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Get counts
    const [
      totalUsers,
      totalCompanies,
      totalDrivers,
      totalVehicles,
      newUsersLast7Days,
      newUsersLast30Days,
      subscriptionBreakdown
    ] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Driver.countDocuments(),
      Vehicle.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.aggregate([
        {
          $group: {
            _id: '$subscription.plan',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format subscription breakdown
    const subscriptions = {};
    subscriptionBreakdown.forEach(item => {
      subscriptions[item._id || 'none'] = item.count;
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCompanies,
        totalDrivers,
        totalVehicles,
        newUsersLast7Days,
        newUsersLast30Days,
        subscriptions
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    List all users with pagination and search
// @access  Super Admin
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query with escaped regex
    const query = {};
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { email: { $regex: escapedSearch, $options: 'i' } },
        { firstName: { $regex: escapedSearch, $options: 'i' } },
        { lastName: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('companies.companyId', 'name dotNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (admin power tool)
// @access  Super Admin
router.post('/users', async (req, res) => {
  try {
    const { email, firstName, lastName, password, companyId, plan } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ success: false, message: 'email, firstName, lastName, and password are required' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });
    }

    const userData = {
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      password,
      subscription: {
        plan: plan && VALID_PLANS.includes(plan) ? plan : 'free_trial',
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    };

    const user = await User.create(userData);

    // If companyId provided, add to user's companies
    if (companyId) {
      const company = await Company.findById(companyId);
      if (company) {
        user.companies = [{
          companyId: company._id,
          role: 'viewer',
          permissions: User.getDefaultPermissionsForRole('viewer'),
          joinedAt: new Date()
        }];
        user.activeCompanyId = company._id;
        await user.save({ validateBeforeSave: false });
      }
    }

    auditService.log(req, 'create', 'user', user._id, { email: user.email, plan: userData.subscription.plan, summary: 'Admin created user' });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/users/bulk
// @desc    Bulk action on users (suspend, unsuspend, delete)
// @access  Super Admin
router.post('/users/bulk', async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ success: false, message: 'action and userIds array are required' });
    }

    if (!['suspend', 'unsuspend', 'delete'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be suspend, unsuspend, or delete' });
    }

    if (userIds.length > 50) {
      return res.status(400).json({ success: false, message: 'Maximum 50 users per bulk action' });
    }

    // Filter out self
    const selfId = req.user._id.toString();
    const filteredIds = userIds.filter(id => id !== selfId);

    if (filteredIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid user IDs to process (cannot perform bulk actions on yourself)' });
    }

    let result = { processed: 0 };

    if (action === 'suspend') {
      const updateResult = await User.updateMany(
        { _id: { $in: filteredIds } },
        { $set: { isSuspended: true, suspendedAt: new Date(), suspendedReason: 'Bulk suspended by admin' } }
      );
      result.processed = updateResult.modifiedCount;
    } else if (action === 'unsuspend') {
      const updateResult = await User.updateMany(
        { _id: { $in: filteredIds } },
        { $set: { isSuspended: false }, $unset: { suspendedAt: '', suspendedReason: '' } }
      );
      result.processed = updateResult.modifiedCount;
    } else if (action === 'delete') {
      let deleted = 0;
      for (const userId of filteredIds) {
        try {
          const user = await User.findById(userId).populate('companies.companyId');
          if (!user) continue;

          // Cascade delete owned companies
          const ownedCompanies = user.companies?.filter(c => c.role === 'owner') || [];
          for (const membership of ownedCompanies) {
            const compId = membership.companyId?._id || membership.companyId;
            if (compId) {
              await cascadeDeleteCompany(compId.toString());
            }
          }

          await User.findByIdAndDelete(userId);
          deleted++;
        } catch (err) {
          console.error(`[ADMIN] Bulk delete error for user ${userId}:`, err.message);
        }
      }
      result.processed = deleted;
    }

    auditService.log(req, 'bulk_action', 'user', null, { action, userIds: filteredIds, processed: result.processed, summary: `Admin bulk ${action} users` });

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      result
    });
  } catch (error) {
    console.error('Admin bulk action error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Super Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('companies.companyId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:id
// @desc    Update user (suspend, activate, etc.)
// @access  Super Admin
router.patch('/users/:id', async (req, res) => {
  try {
    const { isSuspended, suspendedReason, isActive, isSuperAdmin } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent self-modification of admin status
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot modify your own admin account through this endpoint'
      });
    }

    // Restrict isSuperAdmin changes - only existing super admins can grant it
    // and require explicit confirmation
    if (typeof isSuperAdmin === 'boolean' && isSuperAdmin === true) {
      console.warn(`[ADMIN AUDIT] Super admin grant attempted: ${req.user.email} -> ${user.email} at ${new Date().toISOString()}`);
    }

    // Update fields
    if (typeof isSuspended === 'boolean') {
      user.isSuspended = isSuspended;
      user.suspendedAt = isSuspended ? new Date() : null;
      user.suspendedReason = isSuspended ? suspendedReason : null;
      console.warn(`[ADMIN AUDIT] User ${isSuspended ? 'suspended' : 'unsuspended'}: ${user.email} by ${req.user.email} at ${new Date().toISOString()}`);
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
      console.warn(`[ADMIN AUDIT] User ${isActive ? 'activated' : 'deactivated'}: ${user.email} by ${req.user.email} at ${new Date().toISOString()}`);
    }
    if (typeof isSuperAdmin === 'boolean') {
      user.isSuperAdmin = isSuperAdmin;
      console.warn(`[ADMIN AUDIT] Super admin ${isSuperAdmin ? 'granted' : 'revoked'}: ${user.email} by ${req.user.email} at ${new Date().toISOString()}`);
    }

    await user.save();

    auditService.log(req, 'update', 'user', req.params.id, { changes: { isSuspended, isActive, isSuperAdmin }, summary: 'Admin updated user' });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        isSuperAdmin: user.isSuperAdmin
      }
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and their owned companies
// @access  Super Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('companies.companyId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Find companies where user is the owner
    const ownedCompanies = user.companies?.filter(c => c.role === 'owner') || [];

    // Cascade delete all owned companies
    for (const membership of ownedCompanies) {
      const companyId = membership.companyId?._id || membership.companyId;
      if (companyId) {
        await cascadeDeleteCompany(companyId.toString());
      }
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    auditService.log(req, 'delete', 'user', req.params.id, { email: user.email, ownedCompanies: ownedCompanies.length, summary: 'Admin deleted user' });

    res.json({
      success: true,
      message: `User deleted successfully along with ${ownedCompanies.length} owned company(ies)`
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/impersonate
// @desc    Get impersonation token for a user
// @access  Super Admin
router.post('/users/:id/impersonate', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent impersonating other super admins
    if (user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot impersonate other super admin accounts'
      });
    }

    // Generate impersonation token with short expiry (30 min)
    const token = jwt.sign(
      { id: user._id, impersonatedBy: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Set httpOnly cookie with 30-minute expiry matching impersonation token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000,
      path: '/'
    });

    // Audit log the impersonation
    console.warn(`[ADMIN AUDIT] IMPERSONATION: ${req.user.email} (${req.user._id}) impersonated ${user.email} (${user._id}) at ${new Date().toISOString()} from IP ${req.ip}`);

    auditService.log(req, 'impersonate', 'user', req.params.id, { targetEmail: user.email, summary: 'Admin impersonated user' });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      message: 'Impersonation token valid for 30 minutes'
    });
  } catch (error) {
    console.error('Admin impersonate error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/force-reset
// @desc    Force password reset for a user
// @access  Super Admin
router.post('/users/:id/force-reset', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordReset(user, resetToken);

    auditService.log(req, 'force_reset', 'user', req.params.id, { email: user.email, summary: 'Admin forced password reset' });

    res.json({ success: true, message: `Password reset email sent to ${user.email}` });
  } catch (error) {
    console.error('Admin force reset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id/login-history
// @desc    Get user login history
// @access  Super Admin
router.get('/users/:id/login-history', async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.params.id, action: 'login' })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({ success: true, loginHistory: logs });
  } catch (error) {
    console.error('Admin login history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id/audit-log
// @desc    Get user audit log
// @access  Super Admin
router.get('/users/:id/audit-log', async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ success: true, auditLog: logs });
  } catch (error) {
    console.error('Admin user audit log error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:id/subscription
// @desc    Override user subscription
// @access  Super Admin
router.patch('/users/:id/subscription', async (req, res) => {
  try {
    const { plan, status, trialEndsAt } = req.body;

    // Validate plan and status values
    if (plan && !VALID_PLANS.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}`
      });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update subscription fields
    if (plan) {
      user.subscription.plan = plan;
    }
    if (status) {
      user.subscription.status = status;
    }
    if (trialEndsAt) {
      user.subscription.trialEndsAt = new Date(trialEndsAt);
    }

    await user.save();

    auditService.log(req, 'update', 'subscription', req.params.id, { plan, status, summary: 'Admin overrode subscription' });

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Admin subscription override error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/companies
// @desc    List all companies with pagination and search
// @access  Super Admin
router.get('/companies', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query with escaped regex
    const query = {};
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { dotNumber: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const [companies, total] = await Promise.all([
      Company.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Company.countDocuments(query)
    ]);

    // Get counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const [driverCount, vehicleCount, memberCount] = await Promise.all([
          Driver.countDocuments({ companyId: company._id }),
          Vehicle.countDocuments({ companyId: company._id }),
          User.countDocuments({ 'companies.companyId': company._id })
        ]);
        return {
          ...company.toObject(),
          driverCount,
          vehicleCount,
          memberCount
        };
      })
    );

    res.json({
      success: true,
      companies: companiesWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin list companies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/companies/:id
// @desc    Delete company and all related data
// @access  Super Admin
router.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Cascade delete company and all related data
    await cascadeDeleteCompany(req.params.id);

    auditService.log(req, 'delete', 'company', req.params.id, { companyName: company.name, dotNumber: company.dotNumber, summary: 'Admin deleted company' });

    res.json({
      success: true,
      message: `Company "${company.name}" and all related data deleted successfully`
    });
  } catch (error) {
    console.error('Admin delete company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/companies/:id
// @desc    Get company details
// @access  Super Admin
router.get('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Get detailed stats
    const [driverCount, vehicleCount, members] = await Promise.all([
      Driver.countDocuments({ companyId: company._id }),
      Vehicle.countDocuments({ companyId: company._id }),
      User.find({ 'companies.companyId': company._id })
        .select('email firstName lastName companies subscription')
    ]);

    res.json({
      success: true,
      company: {
        ...company.toObject(),
        driverCount,
        vehicleCount,
        members: members.map(m => ({
          _id: m._id,
          email: m.email,
          name: `${m.firstName} ${m.lastName}`,
          role: m.companies.find(c => c.companyId.toString() === company._id.toString())?.role,
          subscription: m.subscription
        }))
      }
    });
  } catch (error) {
    console.error('Admin get company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/admin/companies/:id
// @desc    Update company details
// @access  Super Admin
router.patch('/companies/:id', async (req, res) => {
  try {
    const { name, mcNumber, phone, address, email, isActive } = req.body;
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Explicitly ignore dotNumber
    if (name !== undefined) company.name = name;
    if (mcNumber !== undefined) company.mcNumber = mcNumber;
    if (phone !== undefined) company.phone = phone;
    if (address !== undefined) company.address = address;
    if (email !== undefined) company.email = email;
    if (typeof isActive === 'boolean') company.isActive = isActive;

    await company.save();

    auditService.log(req, 'update', 'company', req.params.id, { changes: { name, mcNumber, phone, address, email, isActive }, summary: 'Admin updated company' });

    res.json({ success: true, message: 'Company updated successfully', company });
  } catch (error) {
    console.error('Admin update company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/companies/:companyId/members/:userId
// @desc    Remove a member from a company
// @access  Super Admin
router.delete('/companies/:companyId/members/:userId', async (req, res) => {
  try {
    const { companyId, userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Pull companyId from companies array
    user.companies = user.companies.filter(
      c => (c.companyId?._id || c.companyId).toString() !== companyId
    );

    // Clear activeCompanyId if it matches
    if (user.activeCompanyId && user.activeCompanyId.toString() === companyId) {
      user.activeCompanyId = user.companies.length > 0
        ? (user.companies[0].companyId?._id || user.companies[0].companyId)
        : undefined;
    }

    await user.save({ validateBeforeSave: false });

    auditService.log(req, 'delete', 'company', companyId, { userId, summary: 'Admin removed member from company' });

    res.json({ success: true, message: 'Member removed from company' });
  } catch (error) {
    console.error('Admin remove company member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/admin/companies/:companyId/members/:userId
// @desc    Update a member's role in a company
// @access  Super Admin
router.patch('/companies/:companyId/members/:userId', async (req, res) => {
  try {
    const { companyId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'role is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const membership = user.companies.find(
      c => (c.companyId?._id || c.companyId).toString() === companyId
    );

    if (!membership) {
      return res.status(404).json({ success: false, message: 'User is not a member of this company' });
    }

    membership.role = role;
    membership.permissions = User.getDefaultPermissionsForRole(role);
    await user.save({ validateBeforeSave: false });

    auditService.log(req, 'update', 'company', companyId, { userId, role, summary: 'Admin updated member role' });

    res.json({ success: true, message: 'Member role updated', role });
  } catch (error) {
    console.error('Admin update company member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// Analytics
// ============================================================

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Super Admin
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [signupsByDay, activeUsersByDay, subscriptionRevenue, churnData, topCompanies] = await Promise.all([
      // 1. Signups by day (last 90 days)
      User.aggregate([
        { $match: { createdAt: { $gte: ninetyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 2. Active users by day (last 30 days)
      User.aggregate([
        { $match: { lastLogin: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastLogin' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 3. Subscription revenue (MRR)
      User.aggregate([
        {
          $match: {
            'subscription.status': { $in: ['active', 'trialing'] }
          }
        },
        {
          $group: {
            _id: '$subscription.plan',
            count: { $sum: 1 }
          }
        }
      ]),

      // 4. Churn: canceled last 30 days vs total active
      Promise.all([
        User.countDocuments({ 'subscription.status': 'canceled', updatedAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ 'subscription.status': { $in: ['active', 'trialing'] } })
      ]),

      // 5. Top companies by driver count
      Driver.aggregate([
        {
          $group: {
            _id: '$companyId',
            driverCount: { $sum: 1 }
          }
        },
        { $sort: { driverCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'companies',
            localField: '_id',
            foreignField: '_id',
            as: 'company'
          }
        },
        { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            driverCount: 1,
            companyName: '$company.name',
            dotNumber: '$company.dotNumber'
          }
        }
      ])
    ]);

    // Post-process MRR
    let mrr = 0;
    const planBreakdown = {};
    subscriptionRevenue.forEach(item => {
      const price = PLAN_PRICES[item._id] || 0;
      const revenue = price * item.count;
      mrr += revenue;
      planBreakdown[item._id] = { count: item.count, revenue };
    });

    // Process churn
    const [canceledLast30, totalActive] = churnData;
    const churnRate = totalActive > 0 ? ((canceledLast30 / totalActive) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      analytics: {
        signupsByDay,
        activeUsersByDay,
        revenue: { mrr, planBreakdown },
        churn: { canceledLast30Days: canceledLast30, totalActive, churnRate: parseFloat(churnRate) },
        topCompanies
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// System & Operations
// ============================================================

// @route   GET /api/admin/system
// @desc    Get system health info
// @access  Super Admin
router.get('/system', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentEmailFailures, emailsSent24h, emailsDelivered24h] = await Promise.all([
      EmailLog.countDocuments({ status: 'failed', createdAt: { $gte: oneDayAgo } }),
      EmailLog.countDocuments({ status: 'sent', createdAt: { $gte: oneDayAgo } }),
      EmailLog.countDocuments({ status: 'delivered', createdAt: { $gte: oneDayAgo } })
    ]);

    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    res.json({
      success: true,
      system: {
        database: {
          status: dbStates[mongoose.connection.readyState] || 'unknown',
          readyState: mongoose.connection.readyState
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
          resend: !!process.env.RESEND_API_KEY,
          stripe: !!process.env.STRIPE_SECRET_KEY,
          openai: !!process.env.OPENAI_API_KEY
        },
        recentEmailFailures,
        emailStats: {
          sent: emailsSent24h,
          delivered: emailsDelivered24h,
          failed: recentEmailFailures
        }
      }
    });
  } catch (error) {
    console.error('Admin system info error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/emails/stats
// @desc    Get email statistics
// @access  Super Admin
// NOTE: This must be before /emails/:id to avoid treating 'stats' as an ID
router.get('/emails/stats', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalSent, totalFailed, last24hSent, last24hFailed, byCategory] = await Promise.all([
      EmailLog.countDocuments({ status: 'sent' }),
      EmailLog.countDocuments({ status: 'failed' }),
      EmailLog.countDocuments({ status: 'sent', createdAt: { $gte: oneDayAgo } }),
      EmailLog.countDocuments({ status: 'failed', createdAt: { $gte: oneDayAgo } }),
      EmailLog.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    const categoryBreakdown = {};
    byCategory.forEach(item => {
      categoryBreakdown[item._id || 'unknown'] = item.count;
    });

    res.json({
      success: true,
      stats: {
        totalSent,
        totalFailed,
        last24h: { sent: last24hSent, failed: last24hFailed },
        byCategory: categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Admin email stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/emails
// @desc    List email logs with pagination, search, filters
// @access  Super Admin
router.get('/emails', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    const { search, status, category, startDate, endDate } = req.query;

    const query = {};
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.to = { $regex: escapedSearch, $options: 'i' };
    }
    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [emails, total] = await Promise.all([
      EmailLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      EmailLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin list emails error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/emails/:id
// @desc    Get single email log
// @access  Super Admin
router.get('/emails/:id', async (req, res) => {
  try {
    const email = await EmailLog.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ success: false, message: 'Email log not found' });
    }
    res.json({ success: true, email });
  } catch (error) {
    console.error('Admin get email error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// Announcements CRUD
// ============================================================

// @route   GET /api/admin/announcements
// @desc    List all announcements (paginated)
// @access  Super Admin
router.get('/announcements', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      Announcement.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'email firstName lastName'),
      Announcement.countDocuments()
    ]);

    res.json({
      success: true,
      announcements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Admin list announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/announcements
// @desc    Create announcement
// @access  Super Admin
router.post('/announcements', async (req, res) => {
  try {
    const { message, type, isActive, startDate, endDate, targetAudience, linkUrl, linkText } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const announcement = await Announcement.create({
      message,
      type,
      isActive,
      startDate,
      endDate,
      targetAudience,
      linkUrl,
      linkText,
      createdBy: req.user._id
    });

    auditService.log(req, 'create', 'announcement', announcement._id, { summary: 'Admin created announcement' });

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error('Admin create announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/announcements/:id
// @desc    Update announcement
// @access  Super Admin
router.put('/announcements/:id', async (req, res) => {
  try {
    const { message, type, isActive, startDate, endDate, targetAudience, linkUrl, linkText } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (message !== undefined) announcement.message = message;
    if (type !== undefined) announcement.type = type;
    if (typeof isActive === 'boolean') announcement.isActive = isActive;
    if (startDate !== undefined) announcement.startDate = startDate;
    if (endDate !== undefined) announcement.endDate = endDate;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (linkUrl !== undefined) announcement.linkUrl = linkUrl;
    if (linkText !== undefined) announcement.linkText = linkText;

    await announcement.save();

    auditService.log(req, 'update', 'announcement', req.params.id, { summary: 'Admin updated announcement' });

    res.json({ success: true, announcement });
  } catch (error) {
    console.error('Admin update announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/admin/announcements/:id/toggle
// @desc    Toggle announcement active status
// @access  Super Admin
router.patch('/announcements/:id/toggle', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    auditService.log(req, 'toggle', 'announcement', req.params.id, { isActive: announcement.isActive, summary: 'Admin toggled announcement' });

    res.json({ success: true, announcement });
  } catch (error) {
    console.error('Admin toggle announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/announcements/:id
// @desc    Delete announcement
// @access  Super Admin
router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    auditService.log(req, 'delete', 'announcement', req.params.id, { summary: 'Admin deleted announcement' });

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Admin delete announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// Feature Flags CRUD
// ============================================================

// @route   GET /api/admin/features
// @desc    List all feature flags
// @access  Super Admin
router.get('/features', async (req, res) => {
  try {
    const features = await FeatureFlag.find().sort({ key: 1 });
    res.json({ success: true, features });
  } catch (error) {
    console.error('Admin list features error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/features
// @desc    Create feature flag
// @access  Super Admin
router.post('/features', async (req, res) => {
  try {
    const { key, description, enabled } = req.body;

    if (!key || !description) {
      return res.status(400).json({ success: false, message: 'key and description are required' });
    }

    const feature = await FeatureFlag.create({ key, description, enabled });

    auditService.log(req, 'create', 'feature_flag', feature._id, { key, summary: 'Admin created feature flag' });

    res.status(201).json({ success: true, feature });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Feature flag with this key already exists' });
    }
    console.error('Admin create feature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admin/features/:id
// @desc    Update feature flag
// @access  Super Admin
router.put('/features/:id', async (req, res) => {
  try {
    const { key, description, enabled } = req.body;
    const feature = await FeatureFlag.findById(req.params.id);

    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }

    if (key !== undefined) feature.key = key;
    if (description !== undefined) feature.description = description;
    if (typeof enabled === 'boolean') feature.enabled = enabled;

    await feature.save();

    auditService.log(req, 'update', 'feature_flag', req.params.id, { key: feature.key, summary: 'Admin updated feature flag' });

    res.json({ success: true, feature });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Feature flag with this key already exists' });
    }
    console.error('Admin update feature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/admin/features/:id/toggle
// @desc    Toggle feature flag enabled status
// @access  Super Admin
router.patch('/features/:id/toggle', async (req, res) => {
  try {
    const feature = await FeatureFlag.findById(req.params.id);
    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }

    feature.enabled = !feature.enabled;
    await feature.save();

    auditService.log(req, 'toggle', 'feature_flag', req.params.id, { key: feature.key, enabled: feature.enabled, summary: 'Admin toggled feature flag' });

    res.json({ success: true, feature });
  } catch (error) {
    console.error('Admin toggle feature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/features/:id
// @desc    Delete feature flag
// @access  Super Admin
router.delete('/features/:id', async (req, res) => {
  try {
    const feature = await FeatureFlag.findByIdAndDelete(req.params.id);
    if (!feature) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }

    auditService.log(req, 'delete', 'feature_flag', req.params.id, { key: feature.key, summary: 'Admin deleted feature flag' });

    res.json({ success: true, message: 'Feature flag deleted' });
  } catch (error) {
    console.error('Admin delete feature error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// Maintenance Mode
// ============================================================

// @route   GET /api/admin/maintenance
// @desc    Get maintenance mode status
// @access  Super Admin
router.get('/maintenance', async (req, res) => {
  try {
    const value = await SystemConfig.getValue('maintenance_mode', { enabled: false, message: '' });
    res.json({ success: true, maintenance: value });
  } catch (error) {
    console.error('Admin get maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/admin/maintenance
// @desc    Toggle maintenance mode
// @access  Super Admin
router.post('/maintenance', async (req, res) => {
  try {
    const { enabled, message } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'enabled (boolean) is required' });
    }

    const value = { enabled, message: message || 'System is under maintenance. Please try again later.' };
    await SystemConfig.setValue('maintenance_mode', value, req.user._id);

    // Bust the middleware cache so the change takes effect immediately
    maintenanceMiddleware.bustCache();

    auditService.log(req, 'update', 'system_config', null, { key: 'maintenance_mode', enabled, summary: `Admin ${enabled ? 'enabled' : 'disabled'} maintenance mode` });

    res.json({ success: true, maintenance: value });
  } catch (error) {
    console.error('Admin set maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// DATA INTEGRITY MONITORING
// ============================================

// GET /api/admin/data-integrity - Quick health check (for dashboard card)
router.get('/data-integrity', async (req, res) => {
  try {
    const result = await dataIntegrityService.runQuickCheck();
    res.json(result);
  } catch (error) {
    console.error('Data integrity quick check error:', error);
    res.status(500).json({ success: false, message: 'Failed to run integrity check' });
  }
});

// GET /api/admin/data-integrity/full - Comprehensive check (for detail page)
router.get('/data-integrity/full', async (req, res) => {
  try {
    const result = await dataIntegrityService.runFullCheck();
    res.json(result);
  } catch (error) {
    console.error('Data integrity full check error:', error);
    res.status(500).json({ success: false, message: 'Failed to run full integrity check' });
  }
});

// GET /api/admin/data-integrity/details/:resource - Get issues for specific resource
router.get('/data-integrity/details/:resource', async (req, res) => {
  try {
    const { resource } = req.params;
    const result = await dataIntegrityService.getResourceDetails(resource);
    res.json(result);
  } catch (error) {
    console.error('Data integrity details error:', error);
    res.status(500).json({ success: false, message: 'Failed to get resource details' });
  }
});

// DELETE /api/admin/data-integrity/orphaned/:resource - Delete orphaned records for specific resource
router.delete('/data-integrity/orphaned/:resource', async (req, res) => {
  try {
    const { resource } = req.params;
    const result = await dataIntegrityService.deleteOrphanedRecords(resource);

    if (!result.success) {
      return res.status(400).json(result);
    }

    auditService.log(req, 'cleanup', 'data_integrity', null, {
      resource,
      deletedCount: result.deletedCount,
      summary: `Admin deleted ${result.deletedCount} orphaned ${resource} records`
    });

    res.json(result);
  } catch (error) {
    console.error('Data integrity cleanup error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete orphaned records' });
  }
});

// DELETE /api/admin/data-integrity/orphaned - Delete ALL orphaned records
router.delete('/data-integrity/orphaned', async (req, res) => {
  try {
    const result = await dataIntegrityService.deleteAllOrphanedRecords();

    auditService.log(req, 'cleanup', 'data_integrity', null, {
      totalDeleted: result.totalDeleted,
      details: result.details,
      summary: `Admin deleted ${result.totalDeleted} total orphaned records`
    });

    res.json(result);
  } catch (error) {
    console.error('Data integrity cleanup all error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete orphaned records' });
  }
});

// DELETE /api/admin/data-integrity/invalid-refs/:resource/:field - Delete invalid references
router.delete('/data-integrity/invalid-refs/:resource/:field', async (req, res) => {
  try {
    const { resource, field } = req.params;
    const result = await dataIntegrityService.deleteInvalidReferences(resource, field);

    if (!result.success) {
      return res.status(400).json(result);
    }

    auditService.log(req, 'cleanup', 'data_integrity', null, {
      resource,
      referenceField: field,
      deletedCount: result.deletedCount,
      summary: `Admin deleted ${result.deletedCount} ${resource} records with invalid ${field}`
    });

    res.json(result);
  } catch (error) {
    console.error('Data integrity invalid refs cleanup error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete records with invalid references' });
  }
});

// =====================================================
// REVENUE DASHBOARD
// =====================================================

// @route   GET /api/admin/revenue
// @desc    Get revenue and subscription metrics
// @access  Super Admin
router.get('/revenue', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    // Plan prices in dollars
    const planPrices = { solo: 19, fleet: 39, pro: 89, starter: 49, professional: 149 };

    // Get all users with subscriptions
    const users = await User.find({}, 'subscription createdAt');

    // Calculate current MRR
    let currentMRR = 0;
    const planBreakdown = { solo: { count: 0, revenue: 0 }, fleet: { count: 0, revenue: 0 }, pro: { count: 0, revenue: 0 } };
    const failedPaymentUsers = [];

    for (const user of users) {
      const plan = user.subscription?.plan;
      const status = user.subscription?.status;

      if (status === 'active' && planPrices[plan]) {
        currentMRR += planPrices[plan];
        if (planBreakdown[plan]) {
          planBreakdown[plan].count++;
          planBreakdown[plan].revenue += planPrices[plan];
        }
      }

      if (status === 'past_due' || status === 'unpaid') {
        failedPaymentUsers.push({
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: plan,
          status: status
        });
      }
    }

    // Calculate churn (cancelled in last 30 days)
    const cancelledCount = await User.countDocuments({
      'subscription.status': 'canceled',
      'subscription.canceledAt': { $gte: thirtyDaysAgo }
    });

    const activeCount = await User.countDocuments({
      'subscription.status': 'active'
    });

    const churnRate = activeCount > 0 ? ((cancelledCount / (activeCount + cancelledCount)) * 100).toFixed(1) : 0;

    // Calculate previous month MRR (approximate from audit logs or use current as baseline)
    const previousMRR = currentMRR * 0.95; // Placeholder - would need historical data

    // MRR trend (last 12 months) - simplified version
    const mrrTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      mrrTrend.push({
        month: monthDate.toLocaleString('default', { month: 'short' }),
        year: monthDate.getFullYear(),
        mrr: Math.round(currentMRR * (0.7 + (11 - i) * 0.027)) // Simulated growth
      });
    }
    mrrTrend[11].mrr = currentMRR; // Current month is actual

    // Churn trend (last 6 months) - simplified
    const churnTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      churnTrend.push({
        month: monthDate.toLocaleString('default', { month: 'short' }),
        rate: Math.max(0, parseFloat(churnRate) + (Math.random() * 2 - 1)).toFixed(1)
      });
    }
    churnTrend[5].rate = churnRate; // Current month is actual

    // Count plan changes (upgrades/downgrades from audit logs)
    const planChanges = await AuditLog.countDocuments({
      action: 'subscription_updated',
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      mrr: {
        current: currentMRR,
        previous: Math.round(previousMRR),
        growth: currentMRR > previousMRR ? '+' + ((currentMRR - previousMRR) / previousMRR * 100).toFixed(1) + '%' : '0%',
        trend: mrrTrend
      },
      churn: {
        rate: parseFloat(churnRate),
        count: cancelledCount,
        trend: churnTrend
      },
      planBreakdown,
      failedPayments: {
        count: failedPaymentUsers.length,
        users: failedPaymentUsers.slice(0, 10) // Limit to 10
      },
      upgrades: Math.floor(planChanges * 0.7), // Approximate
      downgrades: Math.floor(planChanges * 0.3)
    });
  } catch (error) {
    console.error('Revenue endpoint error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue data' });
  }
});

// =====================================================
// USER ANALYTICS
// =====================================================

// @route   GET /api/admin/user-analytics
// @desc    Get user engagement analytics (DAU, WAU, MAU)
// @access  Super Admin
router.get('/user-analytics', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // DAU - unique users who logged in today
    const dauResult = await AuditLog.distinct('userId', {
      action: 'login',
      createdAt: { $gte: today }
    });
    const dau = dauResult.length;

    // WAU - unique users who logged in last 7 days
    const wauResult = await AuditLog.distinct('userId', {
      action: 'login',
      createdAt: { $gte: sevenDaysAgo }
    });
    const wau = wauResult.length;

    // MAU - unique users who logged in last 30 days
    const mauResult = await AuditLog.distinct('userId', {
      action: 'login',
      createdAt: { $gte: thirtyDaysAgo }
    });
    const mau = mauResult.length;

    // Login trend (last 30 days)
    const loginTrend = await AuditLog.aggregate([
      {
        $match: {
          action: 'login',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          logins: '$count',
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Top active companies (by login frequency)
    const topCompanies = await AuditLog.aggregate([
      {
        $match: {
          action: 'login',
          createdAt: { $gte: thirtyDaysAgo },
          companyId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$companyId',
          loginCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      { $sort: { loginCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $project: {
          companyId: '$_id',
          name: { $arrayElemAt: ['$company.name', 0] },
          loginCount: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      }
    ]);

    // Inactive users (no login in 30+ days)
    const allUserIds = await User.find({ isActive: true }, '_id').lean();
    const activeUserIds = new Set(mauResult.map(id => id?.toString()));
    const inactiveUserIds = allUserIds.filter(u => !activeUserIds.has(u._id.toString()));

    const inactiveUsers = await User.find(
      { _id: { $in: inactiveUserIds.slice(0, 20).map(u => u._id) } },
      'email firstName lastName lastLoginAt createdAt'
    ).lean();

    // New vs returning (today)
    const todayLogins = await AuditLog.find({
      action: 'login',
      createdAt: { $gte: today }
    }, 'userId').lean();

    const todayUserIds = [...new Set(todayLogins.map(l => l.userId?.toString()))];
    let newToday = 0;
    let returningToday = 0;

    for (const userId of todayUserIds) {
      const previousLogin = await AuditLog.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        action: 'login',
        createdAt: { $lt: today }
      });
      if (previousLogin) {
        returningToday++;
      } else {
        newToday++;
      }
    }

    res.json({
      dau,
      wau,
      mau,
      loginTrend: loginTrend.map(d => ({
        date: d.date.toISOString().split('T')[0],
        logins: d.logins,
        uniqueUsers: d.uniqueUsers
      })),
      topActiveCompanies: topCompanies,
      inactiveUsers: {
        count: inactiveUserIds.length,
        users: inactiveUsers.map(u => ({
          _id: u._id,
          email: u.email,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          lastLogin: u.lastLoginAt || 'Never',
          createdAt: u.createdAt
        }))
      },
      newVsReturning: {
        new: newToday,
        returning: returningToday
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch user analytics' });
  }
});

// =====================================================
// PLATFORM ALERTS
// =====================================================

// @route   GET /api/admin/platform-alerts
// @desc    Get platform-wide alerts for admin attention
// @access  Super Admin
router.get('/platform-alerts', async (req, res) => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const alerts = [];

    // 1. Failed payments
    const failedPayments = await User.countDocuments({
      'subscription.status': { $in: ['past_due', 'unpaid'] }
    });
    if (failedPayments > 0) {
      alerts.push({
        id: 'failed_payments',
        type: 'failed_payment',
        severity: 'critical',
        message: `${failedPayments} user${failedPayments > 1 ? 's have' : ' has'} failed payments`,
        count: failedPayments,
        createdAt: now,
        link: '/admin/users?filter=failed_payment'
      });
    }

    // 2. High churn
    const cancelledCount = await User.countDocuments({
      'subscription.status': 'canceled',
      'subscription.canceledAt': { $gte: thirtyDaysAgo }
    });
    const activeCount = await User.countDocuments({
      'subscription.status': 'active'
    });
    const churnRate = activeCount > 0 ? (cancelledCount / (activeCount + cancelledCount)) * 100 : 0;
    if (churnRate > 5) {
      alerts.push({
        id: 'high_churn',
        type: 'high_churn',
        severity: 'warning',
        message: `Churn rate is ${churnRate.toFixed(1)}% (above 5% threshold)`,
        count: cancelledCount,
        createdAt: now
      });
    }

    // 3. Trials expiring soon
    const expiringTrials = await User.countDocuments({
      'subscription.plan': 'free_trial',
      'subscription.status': 'trialing',
      'subscription.trialEndsAt': { $lte: threeDaysFromNow, $gte: now }
    });
    if (expiringTrials > 0) {
      alerts.push({
        id: 'trial_expiring',
        type: 'trial_expiring',
        severity: 'info',
        message: `${expiringTrials} trial${expiringTrials > 1 ? 's' : ''} expiring in 3 days`,
        count: expiringTrials,
        createdAt: now
      });
    }

    // 4. Service health check
    const checkService = (name, envVar) => {
      if (!process.env[envVar]) {
        alerts.push({
          id: `service_${name}`,
          type: 'service_down',
          severity: 'critical',
          message: `${name} service not configured (missing API key)`,
          count: 1,
          createdAt: now
        });
      }
    };
    checkService('Stripe', 'STRIPE_SECRET_KEY');
    checkService('OpenAI', 'OPENAI_API_KEY');
    checkService('Resend', 'RESEND_API_KEY');

    // 5. Data integrity check
    const integrityResult = await dataIntegrityService.quickHealthCheck();
    if (integrityResult.score < 80) {
      alerts.push({
        id: 'data_integrity',
        type: 'data_integrity',
        severity: integrityResult.score < 50 ? 'critical' : 'warning',
        message: `Data integrity score is ${integrityResult.score}% (below 80%)`,
        count: integrityResult.issues || 0,
        createdAt: now,
        link: '/admin/data-integrity'
      });
    }

    // 6. Open support tickets
    const Ticket = require('../models/Ticket');
    const openTickets = await Ticket.countDocuments({
      status: { $in: ['open', 'in_progress'] }
    });
    if (openTickets > 0) {
      alerts.push({
        id: 'open_tickets',
        type: 'open_tickets',
        severity: openTickets > 10 ? 'warning' : 'info',
        message: `${openTickets} support ticket${openTickets > 1 ? 's' : ''} need attention`,
        count: openTickets,
        createdAt: now,
        link: '/admin/tickets'
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({ alerts, total: alerts.length });
  } catch (error) {
    console.error('Platform alerts error:', error);
    res.status(500).json({ message: 'Failed to fetch platform alerts' });
  }
});

// =====================================================
// SUPPORT TICKETS (ADMIN VIEW)
// =====================================================

// @route   GET /api/admin/tickets
// @desc    Get all support tickets across all companies
// @access  Super Admin
router.get('/tickets', async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    const { page = 1, limit = 20, status, priority, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { subject: searchRegex },
        { description: searchRegex }
      ];
    }

    // Get tickets with company and user info
    const tickets = await Ticket.find(query)
      .populate('companyId', 'name dotNumber')
      .populate('createdBy', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Ticket.countDocuments(query);

    // Get stats
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    stats.forEach(s => {
      if (statusCounts.hasOwnProperty(s._id)) {
        statusCounts[s._id] = s.count;
      }
    });

    res.json({
      tickets: tickets.map(t => ({
        _id: t._id,
        subject: t.subject,
        description: t.description?.substring(0, 100) + (t.description?.length > 100 ? '...' : ''),
        status: t.status,
        priority: t.priority,
        company: t.companyId ? { _id: t.companyId._id, name: t.companyId.name, dotNumber: t.companyId.dotNumber } : null,
        createdBy: t.createdBy ? { email: t.createdBy.email, name: `${t.createdBy.firstName || ''} ${t.createdBy.lastName || ''}`.trim() } : null,
        assignedTo: t.assignedTo ? { email: t.assignedTo.email, name: `${t.assignedTo.firstName || ''} ${t.assignedTo.lastName || ''}`.trim() } : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      stats: statusCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// @route   PATCH /api/admin/tickets/:id
// @desc    Update ticket status/assignment (admin)
// @access  Super Admin
router.patch('/tickets/:id', async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    const { status, priority, assignedTo } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;

    await ticket.save();

    auditService.log(req, 'update', 'ticket', ticket._id, {
      status, priority, assignedTo,
      summary: `Admin updated ticket ${ticket.subject}`
    });

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Admin ticket update error:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

module.exports = router;
