const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { protect, requireSuperAdmin } = require('../middleware/auth');

// All admin routes require authentication and superadmin role
router.use(protect);
router.use(requireSuperAdmin);

// Helper function to cascade delete all company data
async function cascadeDeleteCompany(companyId) {
  const db = mongoose.connection.db;
  const objectId = new mongoose.Types.ObjectId(companyId);

  console.log(`[ADMIN] Cascade deleting company ${companyId} and all related data...`);

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

  console.log(`[ADMIN] Company ${companyId} deleted with all related data`);
  return results;
}

// Allowed values for subscription validation
const VALID_PLANS = ['free_trial', 'solo', 'fleet', 'starter', 'professional'];
const VALID_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'pending_payment'];

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
    if (req.params.id === req.user._id.toString() && isSuperAdmin === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own super admin privileges'
      });
    }

    // Update fields
    if (typeof isSuspended === 'boolean') {
      user.isSuspended = isSuspended;
      user.suspendedAt = isSuspended ? new Date() : null;
      user.suspendedReason = isSuspended ? suspendedReason : null;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }
    if (typeof isSuperAdmin === 'boolean') {
      user.isSuperAdmin = isSuperAdmin;
    }

    await user.save();

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

    // Generate impersonation token with limited expiry
    const token = jwt.sign(
      { id: user._id, impersonatedBy: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log the impersonation
    console.log(`[ADMIN] User ${req.user.email} impersonated user ${user.email} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      message: 'Impersonation token valid for 1 hour'
    });
  } catch (error) {
    console.error('Admin impersonate error:', error);
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

    // Log the override
    console.log(`[ADMIN] User ${req.user.email} modified subscription for ${user.email}: plan=${plan}, status=${status}`);

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

    console.log(`[ADMIN] User ${req.user.email} deleted company ${company.name} (${company.dotNumber})`);

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

module.exports = router;
