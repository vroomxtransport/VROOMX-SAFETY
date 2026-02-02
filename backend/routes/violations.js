const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Violation, Driver, Vehicle } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadMultiple, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { VIOLATION_SEVERITY_WEIGHTS, calculateSeverityPoints } = require('../config/fmcsaCompliance');
const auditService = require('../services/auditService');
const driverCSAService = require('../services/driverCSAService');
const dataQAnalysisService = require('../services/dataQAnalysisService');

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

// @route   GET /api/violations/unassigned
// @desc    Get violations without a linked driver
// @access  Private
// NOTE: This route MUST be before /:id to prevent Express from matching 'unassigned' as an ID
router.get('/unassigned', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, basic, sortBy = 'violationDate', sortOrder = 'desc' } = req.query;

  const result = await driverCSAService.getUnassignedViolations(
    req.companyFilter.companyId,
    { page, limit, basic, sortBy, sortOrder }
  );

  res.json({
    success: true,
    ...result
  });
}));

// ==================== DataQ Challenge Routes ====================
// NOTE: These routes MUST be before /:id to prevent Express from matching them as IDs

// @route   GET /api/violations/dataq-opportunities
// @desc    Get list of violations ranked by DataQ challenge potential
// @access  Private
router.get('/dataq-opportunities', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { minScore = 40, limit = 20, basic } = req.query;

  const result = await dataQAnalysisService.identifyChallengeableViolations(
    req.companyFilter.companyId,
    {
      minScore: parseInt(minScore),
      limit: parseInt(limit),
      basic
    }
  );

  res.json({
    success: true,
    ...result
  });
}));

// @route   GET /api/violations/dataq-dashboard
// @desc    Get DataQ challenge dashboard statistics
// @access  Private
router.get('/dataq-dashboard', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const stats = await dataQAnalysisService.getDataQDashboardStats(req.companyFilter.companyId);

  res.json({
    success: true,
    stats
  });
}));

// @route   PUT /api/violations/:id/dataq/letter
// @desc    Save a generated DataQ letter to a violation
// @access  Private
// NOTE: This specific route pattern works because Express matches more specific routes first
router.put('/:id/dataq/letter', checkPermission('violations', 'edit'), [
  body('content').trim().notEmpty().withMessage('Letter content is required'),
  body('challengeType').isIn(['data_error', 'policy_violation', 'procedural_error', 'not_responsible'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!violation) {
    throw new AppError('Violation not found', 404);
  }

  // Save the letter
  const updatedViolation = await dataQAnalysisService.saveGeneratedLetter(req.params.id, {
    content: req.body.content,
    challengeType: req.body.challengeType
  });

  violation.history.push({
    action: 'dataq_letter_saved',
    userId: req.user._id,
    notes: `DataQ letter saved (${req.body.challengeType})`
  });
  await violation.save();

  auditService.log(req, 'update', 'violation', req.params.id, {
    summary: 'DataQ letter saved',
    challengeType: req.body.challengeType
  });

  res.json({
    success: true,
    message: 'DataQ letter saved successfully',
    violation: updatedViolation
  });
}));

// @route   PUT /api/violations/:id/dataq/evidence
// @desc    Update evidence checklist for a DataQ challenge
// @access  Private
router.put('/:id/dataq/evidence', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const { evidenceChecklist } = req.body;

  if (!Array.isArray(evidenceChecklist)) {
    return res.status(400).json({
      success: false,
      error: 'Evidence checklist must be an array'
    });
  }

  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!violation) {
    throw new AppError('Violation not found', 404);
  }

  if (!violation.dataQChallenge) {
    violation.dataQChallenge = {};
  }

  violation.dataQChallenge.evidenceChecklist = evidenceChecklist.map(item => ({
    item: item.item,
    required: item.required || false,
    obtained: item.obtained || false,
    documentUrl: item.documentUrl,
    notes: item.notes
  }));

  await violation.save();

  auditService.log(req, 'update', 'violation', req.params.id, {
    summary: 'DataQ evidence checklist updated'
  });

  res.json({
    success: true,
    message: 'Evidence checklist updated',
    violation
  });
}));

// @route   POST /api/violations/bulk-link
// @desc    Bulk link multiple violations to a driver
// @access  Private
// NOTE: This route MUST be before /:id to prevent Express from matching 'bulk-link' as an ID
router.post('/bulk-link', checkPermission('violations', 'edit'), [
  body('violationIds').isArray({ min: 1 }).withMessage('At least one violation ID is required'),
  body('violationIds.*').isMongoId().withMessage('Invalid violation ID'),
  body('driverId').notEmpty().withMessage('Driver ID is required').isMongoId().withMessage('Invalid driver ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const result = await driverCSAService.bulkLinkViolations(
    req.body.violationIds,
    req.body.driverId,
    req.user._id,
    req.companyFilter.companyId
  );

  auditService.log(req, 'update', 'violation', null, {
    summary: 'Bulk driver link',
    count: result.success,
    driverId: req.body.driverId
  });

  res.json({
    success: true,
    message: `${result.success} violations linked successfully`,
    ...result
  });
}));

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

  const allowedFields = ['driverId', 'vehicleId', 'inspectionNumber', 'violationDate', 'basic', 'violationType', 'description', 'severityWeight', 'outOfService', 'status', 'notes', 'weightedSeverity', 'inspectionState', 'timeWeight'];
  const violationData = {
    companyId: req.companyFilter.companyId,
    history: [{
      action: 'created',
      userId: req.user._id,
      notes: 'Violation record created'
    }]
  };
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) violationData[key] = req.body[key];
  }

  const violation = await Violation.create(violationData);

  auditService.log(req, 'create', 'violation', violation._id, { basic: req.body.basic, inspectionNumber: req.body.inspectionNumber });

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

  const allowedUpdateFields = ['driverId', 'vehicleId', 'inspectionNumber', 'violationDate', 'basic', 'violationType', 'description', 'severityWeight', 'outOfService', 'status', 'notes', 'weightedSeverity', 'inspectionState', 'timeWeight'];
  const updateData = {};
  for (const key of allowedUpdateFields) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  // Add history entry
  violation.history.push({
    action: 'updated',
    userId: req.user._id,
    notes: 'Violation record updated'
  });
  updateData.history = violation.history;

  violation = await Violation.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  auditService.log(req, 'update', 'violation', req.params.id, { summary: 'Violation updated' });

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

    auditService.log(req, 'update', 'violation', req.params.id, { summary: 'DataQ challenge submitted' });

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

  auditService.log(req, 'update', 'violation', req.params.id, { dataqStatus: req.body.status });

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

  auditService.log(req, 'update', 'violation', req.params.id, { summary: 'Violation resolved' });

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

    auditService.log(req, 'upload', 'violation', req.params.id, { count: req.files?.length });

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: violation.documents
    });
  })
);

// @route   PUT /api/violations/:id/link-driver
// @desc    Link a driver to a violation
// @access  Private
router.put('/:id/link-driver', checkPermission('violations', 'edit'), [
  body('driverId').notEmpty().withMessage('Driver ID is required').isMongoId().withMessage('Invalid driver ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const violation = await driverCSAService.linkViolationToDriver(
    req.params.id,
    req.body.driverId,
    req.user._id,
    req.companyFilter.companyId
  );

  auditService.log(req, 'update', 'violation', req.params.id, {
    summary: 'Driver linked to violation',
    driverId: req.body.driverId
  });

  res.json({
    success: true,
    message: 'Driver linked to violation successfully',
    violation
  });
}));

// @route   DELETE /api/violations/:id/link-driver
// @desc    Unlink a driver from a violation
// @access  Private
router.delete('/:id/link-driver', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const violation = await driverCSAService.unlinkViolation(
    req.params.id,
    req.user._id,
    req.companyFilter.companyId
  );

  auditService.log(req, 'update', 'violation', req.params.id, {
    summary: 'Driver unlinked from violation'
  });

  res.json({
    success: true,
    message: 'Driver unlinked from violation successfully',
    violation
  });
}));

module.exports = router;
