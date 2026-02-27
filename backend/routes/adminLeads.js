const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// All admin lead routes require authentication and superadmin role
router.use(protect);
router.use(requireSuperAdmin);

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pagination limits
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// @route   GET /api/admin/leads/stats
// @desc    Get lead funnel metrics and conversion rates
// @access  Super Admin
// NOTE: This must be before /:id to avoid treating 'stats' as an ID
router.get('/stats', asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    total,
    thisMonth,
    thisWeek,
    sequenceStatusAgg,
    riskLevelAgg,
    trialCount,
    paidCount
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Lead.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Lead.aggregate([
      { $group: { _id: '$emailSequenceStatus', count: { $sum: 1 } } }
    ]),
    Lead.aggregate([
      { $match: { 'csaSnapshot.riskLevel': { $exists: true, $ne: null } } },
      { $group: { _id: '$csaSnapshot.riskLevel', count: { $sum: 1 } } }
    ]),
    Lead.countDocuments({ convertedToTrial: true }),
    Lead.countDocuments({ convertedToPaid: true })
  ]);

  // Build bySequenceStatus map with all possible values
  const bySequenceStatus = {
    pending: 0,
    sent_welcome: 0,
    sent_day2: 0,
    sent_day5: 0,
    sent_day9: 0,
    sent_day14: 0,
    completed: 0,
    unsubscribed: 0
  };
  sequenceStatusAgg.forEach(item => {
    if (item._id && bySequenceStatus.hasOwnProperty(item._id)) {
      bySequenceStatus[item._id] = item.count;
    }
  });

  // Build byRiskLevel map
  const byRiskLevel = { HIGH: 0, MODERATE: 0, LOW: 0 };
  riskLevelAgg.forEach(item => {
    if (item._id && byRiskLevel.hasOwnProperty(item._id)) {
      byRiskLevel[item._id] = item.count;
    }
  });

  // Conversion rates
  const trialRate = total > 0 ? parseFloat(((trialCount / total) * 100).toFixed(2)) : 0;
  const paidRate = total > 0 ? parseFloat(((paidCount / total) * 100).toFixed(2)) : 0;

  res.json({
    success: true,
    data: {
      total,
      thisMonth,
      thisWeek,
      bySequenceStatus,
      byRiskLevel,
      conversions: { trial: trialCount, paid: paidCount },
      conversionRates: { trial: trialRate, paid: paidRate }
    }
  });
}));

// @route   GET /api/admin/leads
// @desc    List leads with pagination, search, and filters
// @access  Super Admin
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const { search, source, riskLevel, sequenceStatus, convertedToTrial, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build query
  const query = {};

  if (search) {
    const escapedSearch = escapeRegex(search);
    query.$or = [
      { email: { $regex: escapedSearch, $options: 'i' } },
      { companyName: { $regex: escapedSearch, $options: 'i' } }
    ];
  }

  if (source) {
    query.source = source;
  }

  if (riskLevel) {
    query['csaSnapshot.riskLevel'] = riskLevel;
  }

  if (sequenceStatus) {
    query.emailSequenceStatus = sequenceStatus;
  }

  if (convertedToTrial !== undefined) {
    query.convertedToTrial = convertedToTrial === 'true';
  }

  // Build sort
  const sort = {};
  const allowedSortFields = ['createdAt', 'updatedAt', 'email', 'companyName', 'source', 'emailSequenceStatus'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;

  const [leads, total] = await Promise.all([
    Lead.find(query).sort(sort).skip(skip).limit(limit),
    Lead.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/admin/leads/:id
// @desc    Get single lead detail with full CSA snapshot and AI analysis
// @access  Super Admin
router.get('/:id', asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  res.json({
    success: true,
    data: lead
  });
}));

module.exports = router;
