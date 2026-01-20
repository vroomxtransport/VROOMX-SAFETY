const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Violation, Driver, Vehicle } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadMultiple, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { VIOLATION_SEVERITY_WEIGHTS, calculateSeverityPoints } = require('../config/fmcsaCompliance');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/violations
// @desc    Get all violations with filtering
// @access  Private
router.get('/', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { status, basic, driverId, vehicleId, startDate, endDate, page = 1, limit = 20, sort = '-violationDate' } = req.query;

  const queryObj = { ...req.companyFilter };

  if (status) queryObj.status = status;
  if (basic) queryObj.basic = basic;
  if (driverId) queryObj.driverId = driverId;
  if (vehicleId) queryObj.vehicleId = vehicleId;
  if (startDate || endDate) {
    queryObj.violationDate = {};
    if (startDate) queryObj.violationDate.$gte = new Date(startDate);
    if (endDate) queryObj.violationDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const violations = await Violation.find(queryObj)
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber vin')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Violation.countDocuments(queryObj);

  res.json({
    success: true,
    count: violations.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    violations
  });
}));

// @route   GET /api/violations/stats
// @desc    Get violation statistics by BASIC
// @access  Private
router.get('/stats', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  // Get violations from last 24 months
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const stats = await Violation.aggregate([
    {
      $match: {
        ...req.companyFilter,
        violationDate: { $gte: twoYearsAgo }
      }
    },
    {
      $group: {
        _id: '$basic',
        count: { $sum: 1 },
        totalSeverity: { $sum: '$weightedSeverity' },
        outOfService: { $sum: { $cond: ['$outOfService', 1, 0] } }
      }
    }
  ]);

  // Get status breakdown
  const statusBreakdown = await Violation.aggregate([
    { $match: { ...req.companyFilter, violationDate: { $gte: twoYearsAgo } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Get open DataQ challenges
  const openDataQ = await Violation.countDocuments({
    ...req.companyFilter,
    'dataQChallenge.submitted': true,
    'dataQChallenge.status': { $in: ['pending', 'under_review'] }
  });

  res.json({
    success: true,
    stats: {
      byBasic: stats,
      byStatus: statusBreakdown,
      openDataQChallenges: openDataQ
    }
  });
}));

// @route   GET /api/violations/severity-weights
// @desc    Get violation severity weight reference
// @access  Private
router.get('/severity-weights', checkPermission('violations', 'view'), (req, res) => {
  res.json({
    success: true,
    severityWeights: VIOLATION_SEVERITY_WEIGHTS
  });
});

// @route   GET /api/violations/:id
// @desc    Get single violation
// @access  Private
router.get('/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  })
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber vin make model');

  if (!violation) {
    throw new AppError('Violation not found', 404);
  }

  res.json({
    success: true,
    violation
  });
}));

// @route   POST /api/violations
// @desc    Create new violation record
// @access  Private
router.post('/', checkPermission('violations', 'edit'), [
  body('inspectionNumber').trim().notEmpty().withMessage('Inspection number is required'),
  body('violationDate').isISO8601().withMessage('Valid violation date is required'),
  body('basic').isIn(['unsafe_driving', 'hours_of_service', 'vehicle_maintenance', 'controlled_substances', 'driver_fitness', 'crash_indicator']),
  body('violationType').trim().notEmpty().withMessage('Violation type is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('severityWeight').isInt({ min: 1, max: 10 }).withMessage('Severity weight must be 1-10')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const violation = await Violation.create({
    ...req.body,
    companyId: req.user.companyId._id || req.user.companyId,
    history: [{
      action: 'created',
      userId: req.user._id,
      notes: 'Violation record created'
    }]
  });

  res.status(201).json({
    success: true,
    violation
  });
}));

// @route   PUT /api/violations/:id
// @desc    Update violation
// @access  Private
router.put('/:id', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  let violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!violation) {
    throw new AppError('Violation not found', 404);
  }

  delete req.body.companyId;

  // Add history entry
  if (!req.body.history) req.body.history = [];
  violation.history.push({
    action: 'updated',
    userId: req.user._id,
    notes: 'Violation record updated'
  });
  req.body.history = violation.history;

  violation = await Violation.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    violation
  });
}));

// @route   POST /api/violations/:id/dataq
// @desc    Submit DataQ challenge
// @access  Private
router.post('/:id/dataq', checkPermission('violations', 'edit'),
  uploadMultiple('documents', 5),
  asyncHandler(async (req, res) => {
    const violation = await Violation.findOne({
      _id: req.params.id,
      ...req.companyFilter
    });

    if (!violation) {
      throw new AppError('Violation not found', 404);
    }

    const { challengeType, reason } = req.body;

    // Prepare supporting documents
    const supportingDocuments = req.files?.map(file => ({
      name: file.originalname,
      uploadDate: new Date(),
      documentUrl: getFileUrl(file.path)
    })) || [];

    violation.dataQChallenge = {
      submitted: true,
      submissionDate: new Date(),
      challengeType,
      reason,
      supportingDocuments,
      status: 'pending'
    };

    violation.status = 'dispute_in_progress';

    violation.history.push({
      action: 'dataq_submitted',
      userId: req.user._id,
      notes: `DataQ challenge submitted: ${challengeType}`
    });

    await violation.save();

    res.json({
      success: true,
      message: 'DataQ challenge submitted successfully',
      violation
    });
  })
);

// @route   PUT /api/violations/:id/dataq/status
// @desc    Update DataQ challenge status
// @access  Private
router.put('/:id/dataq/status', checkPermission('violations', 'edit'), [
  body('status').isIn(['pending', 'under_review', 'accepted', 'denied', 'withdrawn']),
  body('responseNotes').optional().trim()
], asyncHandler(async (req, res) => {
  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!violation) {
    throw new AppError('Violation not found', 404);
  }

  if (!violation.dataQChallenge?.submitted) {
    throw new AppError('No DataQ challenge exists for this violation', 400);
  }

  violation.dataQChallenge.status = req.body.status;
  violation.dataQChallenge.responseNotes = req.body.responseNotes;

  if (['accepted', 'denied', 'withdrawn'].includes(req.body.status)) {
    violation.dataQChallenge.responseDate = new Date();

    if (req.body.status === 'accepted') {
      violation.status = 'dismissed';
    } else if (req.body.status === 'denied') {
      violation.status = 'upheld';
    }
  }

  violation.history.push({
    action: `dataq_${req.body.status}`,
    userId: req.user._id,
    notes: req.body.responseNotes || `DataQ status updated to: ${req.body.status}`
  });

  await violation.save();

  res.json({
    success: true,
    violation
  });
}));

// @route   POST /api/violations/:id/resolve
// @desc    Mark violation as resolved
// @access  Private
router.post('/:id/resolve', checkPermission('violations', 'edit'), [
  body('action').trim().notEmpty().withMessage('Resolution action is required')
], asyncHandler(async (req, res) => {
  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!violation) {
    throw new AppError('Violation not found', 404);
  }

  violation.status = 'resolved';
  violation.resolution = {
    date: new Date(),
    action: req.body.action,
    correctedBy: req.user._id,
    notes: req.body.notes
  };

  violation.history.push({
    action: 'resolved',
    userId: req.user._id,
    notes: req.body.action
  });

  await violation.save();

  res.json({
    success: true,
    message: 'Violation marked as resolved',
    violation
  });
}));

// @route   POST /api/violations/:id/documents
// @desc    Upload documents for violation
// @access  Private
router.post('/:id/documents', checkPermission('violations', 'edit'),
  uploadMultiple('documents', 5),
  asyncHandler(async (req, res) => {
    const violation = await Violation.findOne({
      _id: req.params.id,
      ...req.companyFilter
    });

    if (!violation) {
      throw new AppError('Violation not found', 404);
    }

    const newDocs = req.files.map(file => ({
      name: file.originalname,
      type: req.body.documentType || 'other',
      uploadDate: new Date(),
      documentUrl: getFileUrl(file.path)
    }));

    violation.documents.push(...newDocs);
    await violation.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: violation.documents
    });
  })
);

module.exports = router;
