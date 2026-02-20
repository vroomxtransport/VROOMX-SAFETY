const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Violation, Driver, Vehicle } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadMultiple, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { VIOLATION_SEVERITY_WEIGHTS, calculateSeverityPoints } = require('../config/fmcsaCompliance');
const { getMovingViolations } = require('../config/violationCodes');
const auditService = require('../services/auditService');
const driverCSAService = require('../services/driverCSAService');
const dataQAnalysisService = require('../services/dataQAnalysisService');
const csaAlertService = require('../services/csaAlertService');
const violationScannerService = require('../services/violationScannerService');
const { toLegacyChallengeType } = require('../config/rdrTypes');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/violations
// @desc    Get all violations with filtering
// @access  Private
router.get('/', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { status, basic, driverId, vehicleId, startDate, endDate, page = 1, limit = 20, sort: rawSort = '-violationDate' } = req.query;
  const allowedSorts = ['violationDate', '-violationDate', 'createdAt', '-createdAt', 'basic', '-basic', 'status', '-status', 'severityWeight', '-severityWeight'];
  const sort = allowedSorts.includes(rawSort) ? rawSort : '-violationDate';

  const queryObj = { ...req.companyFilter };

  if (status) queryObj.status = status;
  if (basic) queryObj.basic = basic;
  if (driverId) queryObj.driverId = driverId;
  if (vehicleId) queryObj.vehicleId = vehicleId;
  if (req.query.inspectionNumber) {
    const numbers = req.query.inspectionNumber.split(',');
    queryObj.inspectionNumber = numbers.length > 1 ? { $in: numbers } : numbers[0];
  }
  if (req.query.isMoving !== undefined) {
    const movingCodes = getMovingViolations().map(v => v.code);
    if (req.query.isMoving === 'true') {
      queryObj.violationCode = { $in: movingCodes };
    } else {
      queryObj.violationCode = { $nin: movingCodes };
    }
  }
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

  // Get open moving violation count
  const movingCodes = getMovingViolations().map(v => v.code);
  const movingViolationCount = await Violation.countDocuments({
    ...req.companyFilter,
    violationCode: { $in: movingCodes },
    status: 'open'
  });

  res.json({
    success: true,
    stats: {
      byBasic: stats,
      byStatus: statusBreakdown,
      openDataQChallenges: openDataQ,
      movingViolationCount
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
  const { minScore = 40, limit = 20, basic, category } = req.query;

  const result = await dataQAnalysisService.identifyChallengeableViolations(
    req.companyFilter.companyId,
    {
      minScore: parseInt(minScore),
      limit: parseInt(limit),
      basic,
      category
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
  body('challengeType').isIn(['data_error', 'policy_violation', 'procedural_error', 'not_responsible']),
  body('rdrType').optional().trim()
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
    challengeType: req.body.challengeType,
    rdrType: req.body.rdrType
  });

  violation.history.push({
    action: 'dataq_letter_saved',
    userId: req.user._id,
    notes: `DataQ letter saved (${req.body.rdrType || req.body.challengeType})`
  });
  await violation.save();

  auditService.log(req, 'update', 'violation', req.params.id, {
    summary: 'DataQ letter saved',
    challengeType: req.body.challengeType,
    rdrType: req.body.rdrType
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
    item: item.item || item.title,
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

// @route   GET /api/violations/review-queue
// @desc    Get violations needing manual entity linking review
// @access  Private
// NOTE: This route MUST be before /:id to prevent Express from matching 'review-queue' as an ID
router.get('/review-queue', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {
    ...req.companyFilter,
    'linkingMetadata.reviewRequired': true
  };

  const [violations, total] = await Promise.all([
    Violation.find(query)
      .populate('driverId', 'firstName lastName cdl.number cdl.state')
      .populate('vehicleId', 'unitNumber vin licensePlate')
      .sort({ violationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Violation.countDocuments(query)
  ]);

  // Fetch unitInfo from FMCSAInspection for each violation
  const FMCSAInspection = require('../models/FMCSAInspection');
  const enhancedViolations = await Promise.all(
    violations.map(async (v) => {
      if (v.inspectionNumber) {
        const inspection = await FMCSAInspection.findOne({
          companyId: v.companyId,
          reportNumber: v.inspectionNumber
        }).select('unitInfo').lean();
        v.unitInfo = inspection?.unitInfo || null;
      }
      return v;
    })
  );

  res.json({
    violations: enhancedViolations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
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

// @route   GET /api/violations/state-profiles
// @desc    Get all state profiles for DataQ intelligence
// @access  Private
router.get('/state-profiles', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const stateProfileService = require('../services/stateProfileService');
  const rawProfiles = await stateProfileService.getAllProfiles();
  // Normalize for frontend: convert decimal rates to percentages and flatten field names
  const profiles = rawProfiles.map(p => ({
    stateCode: p.stateCode,
    name: p.stateName || p.stateCode,
    approvalRate: Math.round((p.approvalRates?.overall ?? 0.40) * 100),
    avgResponseDays: p.averageProcessingDays || 0,
    totalChallenges: p.challengeCount || 0,
    acceptedChallenges: p.acceptedCount || 0,
    difficulty: p.difficulty
  }));
  res.json({ success: true, profiles });
}));

// ==================== Health Check Routes ====================
// NOTE: These routes MUST be before /:id to prevent Express from matching them as IDs

// @route   GET /api/violations/health-check
// @desc    Get Health Check dashboard stats
// @access  Private
router.get('/health-check', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const stats = await violationScannerService.getHealthCheckStats(req.companyFilter.companyId);
  res.json({ success: true, stats });
}));

// @route   GET /api/violations/health-check/violations
// @desc    Get paginated flagged violations for Health Check
// @access  Private
router.get('/health-check/violations', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { category, basic, page = 1, limit = 20, sortBy = 'priorityScore' } = req.query;
  const result = await violationScannerService.getHealthCheckViolations(req.companyFilter.companyId, {
    category, basic, page: parseInt(page), limit: parseInt(limit), sortBy
  });
  res.json({ success: true, ...result });
}));

// @route   POST /api/violations/health-check/scan
// @desc    Trigger manual Health Check scan
// @access  Private
router.post('/health-check/scan', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const result = await violationScannerService.scanCompanyViolations(req.companyFilter.companyId, { force: true });
  res.json({ success: true, ...result });
}));

// ==================== Phase 4: Evidence Collection Routes ====================

// @route   GET /api/violations/dataq/evidence-workflow/:id
// @desc    Get evidence workflow steps for a violation
// @access  Private
router.get('/dataq/evidence-workflow/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const evidenceCollectionService = require('../services/evidenceCollectionService');
  const { rdrType } = req.query;

  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });
  if (!violation) {
    throw new AppError('Violation not found', 404);
  }

  const workflow = evidenceCollectionService.getEvidenceWorkflow(rdrType, violation);
  res.json({ success: true, ...workflow });
}));

// @route   GET /api/violations/dataq/evidence-auto/:id
// @desc    Get auto-available evidence from VroomX modules
// @access  Private
router.get('/dataq/evidence-auto/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const evidenceCollectionService = require('../services/evidenceCollectionService');
  const evidence = await evidenceCollectionService.getAutoAvailableEvidence(req.params.id, req.companyFilter.companyId);
  res.json({ success: true, evidence });
}));

// @route   POST /api/violations/dataq/evidence-strength/:id
// @desc    Calculate evidence strength from checklist
// @access  Private
router.post('/dataq/evidence-strength/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const evidenceCollectionService = require('../services/evidenceCollectionService');
  const { checklist } = req.body;
  // Normalize: frontend sends { title, obtained, required } but service expects { item, obtained, required }
  const normalized = (checklist || []).map(c => ({
    item: c.item || c.title,
    obtained: c.obtained || false,
    required: c.required || false
  }));
  const strength = evidenceCollectionService.calculateEvidenceStrength(normalized);
  res.json({ success: true, strength });
}));

// ==================== Phase 8: Score Impact Routes ====================

// @route   GET /api/violations/dataq/impact-ranking
// @desc    Get violations ranked by removal impact
// @access  Private
router.get('/dataq/impact-ranking', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const scoreImpactService = require('../services/scoreImpactService');
  const { limit = 20, basic, minImpact = 0 } = req.query;
  const ranking = await scoreImpactService.getImpactRanking(req.companyFilter.companyId, {
    limit: parseInt(limit),
    basic: basic || undefined,
    minImpact: parseFloat(minImpact)
  });
  res.json({ success: true, violations: ranking });
}));

// @route   GET /api/violations/dataq/impact/:id
// @desc    Get detailed score impact for a single violation
// @access  Private
router.get('/dataq/impact/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const scoreImpactService = require('../services/scoreImpactService');
  const impact = await scoreImpactService.getViolationImpact(req.params.id, req.companyFilter.companyId);
  if (!impact) {
    throw new AppError('Impact data not available', 404);
  }
  res.json({ success: true, impact });
}));

// @route   GET /api/violations/dataq/time-decay/:id
// @desc    Get time decay projection for a violation
// @access  Private
router.get('/dataq/time-decay/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const scoreImpactService = require('../services/scoreImpactService');
  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  }).lean();
  if (!violation) {
    throw new AppError('Violation not found', 404);
  }
  const projection = scoreImpactService.getTimeDecayProjection(violation);
  res.json({ success: true, projection });
}));

// ==================== Phase 10: Persistence & Follow-Up Routes ====================

// @route   GET /api/violations/dataq/active
// @desc    Get all active DataQ challenges
// @access  Private
router.get('/dataq/active', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const persistenceEngineService = require('../services/persistenceEngineService');
  const challenges = await persistenceEngineService.getActiveChallenges(req.companyFilter.companyId);
  res.json({ success: true, challenges });
}));

// @route   GET /api/violations/dataq/batch-dashboard
// @desc    Get batch dashboard stats for challenge portfolio
// @access  Private
router.get('/dataq/batch-dashboard', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const persistenceEngineService = require('../services/persistenceEngineService');
  const dashboard = await persistenceEngineService.getBatchDashboard(req.companyFilter.companyId);
  res.json({ success: true, dashboard });
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

  const allowedFields = ['driverId', 'vehicleId', 'inspectionNumber', 'violationDate', 'basic', 'violationType', 'violationCode', 'description', 'severityWeight', 'outOfService', 'status', 'notes', 'weightedSeverity', 'inspectionState', 'timeWeight'];
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

  const allowedUpdateFields = ['driverId', 'vehicleId', 'inspectionNumber', 'violationDate', 'basic', 'violationType', 'violationCode', 'description', 'severityWeight', 'outOfService', 'status', 'notes', 'weightedSeverity', 'inspectionState', 'timeWeight'];
  const updateData = {};
  for (const key of allowedUpdateFields) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  // Verify cross-tenant references belong to the same company
  if (updateData.driverId) {
    const driver = await Driver.findOne({ _id: updateData.driverId, companyId: req.companyFilter.companyId });
    if (!driver) {
      throw new AppError('Driver not found in your company', 400);
    }
  }
  if (updateData.vehicleId) {
    const vehicle = await Vehicle.findOne({ _id: updateData.vehicleId, companyId: req.companyFilter.companyId });
    if (!vehicle) {
      throw new AppError('Vehicle not found in your company', 400);
    }
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

    const { challengeType, rdrType, reason } = req.body;

    // Prepare supporting documents
    const supportingDocuments = req.files?.map(file => ({
      name: file.originalname,
      uploadDate: new Date(),
      documentUrl: getFileUrl(file.path)
    })) || [];

    // When rdrType is provided, auto-derive challengeType for backward compat
    const effectiveChallengeType = rdrType
      ? toLegacyChallengeType(rdrType)
      : challengeType;

    violation.dataQChallenge = {
      submitted: true,
      submissionDate: new Date(),
      challengeType: effectiveChallengeType,
      rdrType: rdrType || null,
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

  // State learning: fire-and-forget update to state profile
  if (['accepted', 'denied'].includes(req.body.status)) {
    const stateProfileService = require('../services/stateProfileService');
    const stateCode = violation.location?.state;
    const challengeType = violation.dataQChallenge?.challengeType;
    if (stateCode && challengeType) {
      stateProfileService.learnFromOutcome(stateCode, challengeType, req.body.status === 'accepted')
        .catch(err => console.error('[DataQ] State profile update error:', err.message));
    }
  }

  // When DataQ challenge is accepted, check for CSA score improvements (fire-and-forget)
  if (req.body.status === 'accepted') {
    csaAlertService.checkForImprovements(violation.companyId, {
      trigger: 'dataq_accepted',
      violationId: violation._id.toString(),
      minImprovement: 1
    }).catch(err => console.error('[DataQ] Error checking CSA improvements:', err.message));

    // Auto-resolve worsening alerts that may now be stale
    const csaCalculatorService = require('../services/csaCalculatorService');
    csaCalculatorService.calculateAllBasics(violation.companyId).then(scores => {
      const keyMap = {
        unsafe_driving: 'unsafeDriving', hours_of_service: 'hoursOfService',
        vehicle_maintenance: 'vehicleMaintenance', controlled_substances: 'controlledSubstances',
        driver_fitness: 'driverFitness', crash_indicator: 'crashIndicator'
      };
      const camelScores = {};
      for (const [snake, camel] of Object.entries(keyMap)) {
        camelScores[camel] = scores[snake]?.estimatedPercentile ?? null;
      }
      return csaAlertService.checkForResolution(violation.companyId, camelScores);
    }).catch(err => console.error('[DataQ] Error resolving CSA alerts:', err.message));
  }

  res.json({
    success: true,
    violation
  });
}));

// @route   GET /api/violations/:id/dataq/countdown
// @desc    Get countdown status for pending response deadline
// @access  Private
router.get('/:id/dataq/countdown', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const persistenceEngineService = require('../services/persistenceEngineService');
  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  }).lean();
  if (!violation) {
    throw new AppError('Violation not found', 404);
  }
  const countdown = persistenceEngineService.getCountdownStatus(violation);
  res.json({ success: true, ...countdown });
}));

// @route   GET /api/violations/:id/dataq/denial-options
// @desc    Get denial response options for a denied challenge
// @access  Private
router.get('/:id/dataq/denial-options', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const persistenceEngineService = require('../services/persistenceEngineService');
  const violation = await Violation.findOne({
    _id: req.params.id,
    ...req.companyFilter
  }).lean();
  if (!violation) {
    throw new AppError('Violation not found', 404);
  }
  const options = persistenceEngineService.getDenialOptions(violation);
  res.json({ success: true, options });
}));

// @route   POST /api/violations/:id/dataq/denial-action
// @desc    Record denial response action
// @access  Private
router.post('/:id/dataq/denial-action', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const persistenceEngineService = require('../services/persistenceEngineService');
  let { option } = req.body;
  // Normalize: frontend may send a string id or a full option object
  if (typeof option === 'string') {
    option = { id: option, label: option };
  }
  if (!option || !option.id) {
    throw new AppError('Option is required', 400);
  }
  const violation = await persistenceEngineService.recordDenialAction(req.params.id, option, req.user._id);
  res.json({ success: true, violation });
}));

// @route   POST /api/violations/:id/dataq/new-round
// @desc    Initiate new challenge round
// @access  Private
router.post('/:id/dataq/new-round', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const persistenceEngineService = require('../services/persistenceEngineService');
  const { roundType } = req.body;
  if (!roundType || !['reconsideration', 'fmcsa_escalation'].includes(roundType)) {
    throw new AppError('Valid roundType is required (reconsideration or fmcsa_escalation)', 400);
  }
  const violation = await persistenceEngineService.initiateNewRound(req.params.id, roundType, req.user._id);
  res.json({ success: true, violation });
}));

// @route   PUT /api/violations/:id/court-outcome
// @desc    Record court outcome for Health Check scanner
// @access  Private
router.put('/:id/court-outcome', checkPermission('violations', 'edit'), [
  body('courtOutcome').isIn(['dismissed', 'reduced', 'guilty', 'pending', 'not_applicable']).withMessage('Invalid court outcome'),
  body('courtDate').optional().isISO8601().withMessage('Invalid court date'),
  body('courtNotes').optional().trim()
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

  // Initialize scanResults if needed
  if (!violation.scanResults) {
    violation.scanResults = { checks: {} };
  }
  if (!violation.scanResults.checks) {
    violation.scanResults.checks = {};
  }
  if (!violation.scanResults.checks.courtDismissal) {
    violation.scanResults.checks.courtDismissal = {};
  }

  violation.scanResults.checks.courtDismissal.details = {
    courtOutcome: req.body.courtOutcome,
    courtDate: req.body.courtDate || null,
    courtNotes: req.body.courtNotes || null,
    userReported: true
  };

  violation.history.push({
    action: 'court_outcome_recorded',
    userId: req.user._id,
    notes: `Court outcome: ${req.body.courtOutcome}`
  });

  await violation.save();

  // Re-scan violation with new court data
  await violationScannerService.scanSingleViolation(violation._id);

  // Re-fetch to get updated scan results
  const updated = await Violation.findById(violation._id)
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber vin');

  auditService.log(req, 'update', 'violation', req.params.id, {
    summary: 'Court outcome recorded',
    courtOutcome: req.body.courtOutcome
  });

  res.json({
    success: true,
    message: 'Court outcome recorded',
    violation: updated
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
