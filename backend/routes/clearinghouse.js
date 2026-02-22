const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Driver, DrugAlcoholTest, ClearinghouseQuery, Document } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { uploadSingle, getFileUrl } = require('../middleware/upload');
const auditService = require('../services/auditService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/clearinghouse/dashboard
// @desc    Aggregated clearinghouse compliance stats
// @access  Private
router.get('/dashboard', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [
    totalActiveDrivers,
    statusCounts,
    violationsPendingReport,
    rtdInProgress,
    queriesThisYear,
    recentQueries
  ] = await Promise.all([
    Driver.countDocuments({ ...req.companyFilter, status: 'active' }),

    Driver.aggregate([
      { $match: { ...req.companyFilter, status: 'active' } },
      { $group: { _id: '$complianceStatus.clearinghouseStatus', count: { $sum: 1 } } }
    ]),

    DrugAlcoholTest.countDocuments({
      ...req.companyFilter,
      overallResult: { $in: ['positive', 'refused'] },
      $or: [
        { 'clearinghouse.reported': { $ne: true } },
        { 'clearinghouse.reported': { $exists: false } }
      ]
    }),

    DrugAlcoholTest.countDocuments({
      ...req.companyFilter,
      'returnToDuty.sapReferralDate': { $exists: true },
      $or: [
        { 'returnToDuty.clearedForDuty': { $ne: true } },
        { 'returnToDuty.clearedForDuty': { $exists: false } }
      ]
    }),

    ClearinghouseQuery.countDocuments({
      ...req.companyFilter,
      queryDate: { $gte: startOfYear }
    }),

    ClearinghouseQuery.find(req.companyFilter)
      .populate('driverId', 'firstName lastName employeeId')
      .sort('-queryDate')
      .limit(5)
      .lean()
  ]);

  const counts = { current: 0, due: 0, overdue: 0, missing: 0 };
  statusCounts.forEach(s => { if (counts[s._id] !== undefined) counts[s._id] = s.count; });

  const complianceRate = totalActiveDrivers > 0
    ? Math.round((counts.current / totalActiveDrivers) * 100)
    : 0;

  res.json({
    success: true,
    dashboard: {
      totalActiveDrivers,
      queriesCurrent: counts.current,
      queriesDue: counts.due,
      queriesOverdue: counts.overdue,
      queriesMissing: counts.missing,
      violationsPendingReport,
      rtdInProgress,
      queriesThisYear,
      complianceRate,
      recentQueries
    }
  });
}));

// @route   GET /api/clearinghouse/drivers
// @desc    Driver list with clearinghouse query status
// @access  Private
router.get('/drivers', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20, sort = 'lastName' } = req.query;

  const query = { ...req.companyFilter, status: 'active' };
  if (status) query['complianceStatus.clearinghouseStatus'] = status;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { firstName: { $regex: escaped, $options: 'i' } },
      { lastName: { $regex: escaped, $options: 'i' } },
      { employeeId: { $regex: escaped, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [drivers, total] = await Promise.all([
    Driver.find(query)
      .select('firstName lastName employeeId clearinghouse complianceStatus.clearinghouseStatus')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Driver.countDocuments(query)
  ]);

  // Enrich with computed fields
  const now = new Date();
  const enriched = drivers.map(d => {
    const lastQuery = d.clearinghouse?.lastQueryDate ? new Date(d.clearinghouse.lastQueryDate) : null;
    const daysSinceLastQuery = lastQuery ? Math.floor((now - lastQuery) / (1000 * 60 * 60 * 24)) : null;
    const daysUntilDue = lastQuery ? 365 - daysSinceLastQuery : null;
    return {
      ...d,
      daysSinceLastQuery,
      daysUntilDue
    };
  });

  res.json({
    success: true,
    drivers: enriched,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
}));

// @route   GET /api/clearinghouse/queries
// @desc    Paginated clearinghouse query history
// @access  Private
router.get('/queries', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const { driverId, queryType, queryPurpose, startDate, endDate, page = 1, limit = 20 } = req.query;

  const query = { ...req.companyFilter };
  if (driverId) query.driverId = driverId;
  if (queryType) query.queryType = queryType;
  if (queryPurpose) query.queryPurpose = queryPurpose;
  if (startDate || endDate) {
    query.queryDate = {};
    if (startDate) query.queryDate.$gte = new Date(startDate);
    if (endDate) query.queryDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [queries, total] = await Promise.all([
    ClearinghouseQuery.find(query)
      .populate('driverId', 'firstName lastName employeeId')
      .populate('createdBy', 'firstName lastName')
      .sort('-queryDate')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    ClearinghouseQuery.countDocuments(query)
  ]);

  res.json({
    success: true,
    queries,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
}));

// @route   POST /api/clearinghouse/queries
// @desc    Record a new clearinghouse query
// @access  Private
router.post('/queries', checkPermission('drugAlcohol', 'edit'), [
  body('driverId').isMongoId().withMessage('Valid driver ID required'),
  body('queryType').isIn(['full', 'limited']).withMessage('Query type must be full or limited'),
  body('queryDate').isISO8601().withMessage('Valid query date required'),
  body('queryPurpose').isIn(['pre_employment', 'annual', 'other']).withMessage('Valid query purpose required'),
  body('result').isIn(['clear', 'violation_found', 'pending']).withMessage('Valid result required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Verify driver belongs to this company
  const driver = await Driver.findOne({ _id: req.body.driverId, ...req.companyFilter });
  if (!driver) throw new AppError('Driver not found', 404);

  const queryDoc = await ClearinghouseQuery.create({
    companyId: req.companyFilter.companyId,
    driverId: req.body.driverId,
    queryType: req.body.queryType,
    queryDate: req.body.queryDate,
    queryPurpose: req.body.queryPurpose,
    result: req.body.result,
    consent: req.body.consent || {},
    confirmationNumber: req.body.confirmationNumber,
    resultDocumentUrl: req.body.resultDocumentUrl,
    notes: req.body.notes,
    createdBy: req.user._id
  });

  auditService.log(req, 'create', 'clearinghouse_query', queryDoc._id, {
    driverId: req.body.driverId,
    queryType: req.body.queryType,
    queryPurpose: req.body.queryPurpose,
    result: req.body.result
  });

  // Populate for response
  const populated = await ClearinghouseQuery.findById(queryDoc._id)
    .populate('driverId', 'firstName lastName employeeId')
    .lean();

  res.status(201).json({ success: true, query: populated });
}));

// @route   GET /api/clearinghouse/queries/:id
// @desc    Get single query record
// @access  Private
router.get('/queries/:id', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const query = await ClearinghouseQuery.findOne({ _id: req.params.id, ...req.companyFilter })
    .populate('driverId', 'firstName lastName employeeId')
    .populate('createdBy', 'firstName lastName');

  if (!query) throw new AppError('Query record not found', 404);

  res.json({ success: true, query });
}));

// @route   PUT /api/clearinghouse/queries/:id
// @desc    Update a query record (e.g., result came back)
// @access  Private
router.put('/queries/:id', checkPermission('drugAlcohol', 'edit'), asyncHandler(async (req, res) => {
  const query = await ClearinghouseQuery.findOne({ _id: req.params.id, ...req.companyFilter });
  if (!query) throw new AppError('Query record not found', 404);

  const allowedFields = ['result', 'confirmationNumber', 'resultDocumentUrl', 'notes', 'consent'];
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) query[key] = req.body[key];
  }

  await query.save();

  auditService.log(req, 'update', 'clearinghouse_query', query._id, {
    updatedFields: Object.keys(req.body).filter(k => allowedFields.includes(k))
  });

  const populated = await ClearinghouseQuery.findById(query._id)
    .populate('driverId', 'firstName lastName employeeId')
    .lean();

  res.json({ success: true, query: populated });
}));

// @route   GET /api/clearinghouse/violations-pending
// @desc    Drug/alcohol tests needing clearinghouse reporting
// @access  Private
router.get('/violations-pending', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  // Get all positive/refused tests
  const tests = await DrugAlcoholTest.find({
    ...req.companyFilter,
    overallResult: { $in: ['positive', 'refused'] }
  })
    .populate('driverId', 'firstName lastName employeeId')
    .sort('-testDate')
    .lean();

  const now = new Date();

  // Compute 3-business-day deadline (skip weekends)
  const addBusinessDays = (date, days) => {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return result;
  };

  const pending = [];
  const reported = [];

  tests.forEach(t => {
    const deadline = addBusinessDays(t.testDate, 3);
    const daysOverdue = t.clearinghouse?.reported
      ? 0
      : Math.max(0, Math.floor((now - deadline) / (1000 * 60 * 60 * 24)));

    const enriched = {
      ...t,
      reportDeadline: deadline,
      daysOverdue,
      isOverdue: !t.clearinghouse?.reported && now > deadline
    };

    if (t.clearinghouse?.reported) {
      reported.push(enriched);
    } else {
      pending.push(enriched);
    }
  });

  // Sort pending by urgency (most overdue first)
  pending.sort((a, b) => b.daysOverdue - a.daysOverdue);

  res.json({
    success: true,
    pending,
    reported,
    totalPending: pending.length,
    totalReported: reported.length
  });
}));

// @route   GET /api/clearinghouse/rtd-pipeline
// @desc    Return-to-Duty pipeline grouped by stage
// @access  Private
router.get('/rtd-pipeline', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const tests = await DrugAlcoholTest.find({
    ...req.companyFilter,
    'returnToDuty.sapReferralDate': { $exists: true }
  })
    .populate('driverId', 'firstName lastName employeeId')
    .sort('-returnToDuty.sapReferralDate')
    .lean();

  const pipeline = {
    sap_referral: [],
    evaluation: [],
    treatment: [],
    rtd_test: [],
    follow_up: [],
    cleared: []
  };

  tests.forEach(t => {
    const rtd = t.returnToDuty;
    if (!rtd) return;

    if (rtd.clearedForDuty) {
      pipeline.cleared.push(t);
    } else if (rtd.rtdTestResult === 'negative' && rtd.followUpPlan?.minTests) {
      // In follow-up testing phase
      pipeline.follow_up.push(t);
    } else if (rtd.treatmentCompleted || (rtd.treatmentRequired === false && rtd.initialEvaluationDate)) {
      // Treatment done (or not required), awaiting RTD test
      pipeline.rtd_test.push(t);
    } else if (rtd.treatmentRequired && !rtd.treatmentCompleted && rtd.initialEvaluationDate) {
      // In treatment
      pipeline.treatment.push(t);
    } else if (rtd.initialEvaluationDate && !rtd.treatmentRequired && !rtd.treatmentCompleted) {
      // Evaluation done, awaiting treatment decision - treat as rtd_test
      pipeline.rtd_test.push(t);
    } else if (rtd.sapReferralDate && !rtd.initialEvaluationDate) {
      // Referred to SAP, awaiting evaluation
      pipeline.sap_referral.push(t);
    } else {
      // Evaluation scheduled/in progress
      pipeline.evaluation.push(t);
    }
  });

  const totalActive = tests.filter(t => !t.returnToDuty?.clearedForDuty).length;

  res.json({
    success: true,
    pipeline,
    totalActive,
    totalCleared: pipeline.cleared.length
  });
}));

// @route   POST /api/clearinghouse/consent-upload
// @desc    Upload consent document and record consent for a driver
// @access  Private
router.post('/consent-upload', checkPermission('drugAlcohol', 'edit'), uploadSingle('document'), asyncHandler(async (req, res) => {
  const { driverId, consentDate, consentMethod } = req.body;
  if (!driverId) throw new AppError('Driver ID is required', 400);

  const driver = await Driver.findOne({ _id: driverId, ...req.companyFilter });
  if (!driver) throw new AppError('Driver not found', 404);

  const fileUrl = req.file ? getFileUrl(req.file.path) : null;

  // Update driver's clearinghouse consent
  if (!driver.clearinghouse) driver.clearinghouse = {};
  driver.clearinghouse.consentDate = consentDate || new Date();
  if (fileUrl) driver.clearinghouse.documentUrl = fileUrl;
  await driver.save();

  // Create Document record for audit trail
  if (req.file) {
    await Document.create({
      companyId: req.companyFilter.companyId,
      category: 'drug_alcohol',
      documentType: 'Clearinghouse Consent',
      name: `Clearinghouse Consent - ${driver.firstName} ${driver.lastName}`,
      fileName: req.file.originalname,
      fileType: req.file.originalname.split('.').pop(),
      fileSize: req.file.size,
      filePath: req.file.path,
      fileUrl: fileUrl,
      driverId: driver._id,
      status: 'valid',
      uploadedBy: req.user._id
    });
  }

  auditService.log(req, 'update', 'driver', driver._id, {
    action: 'clearinghouse_consent_uploaded',
    consentDate: driver.clearinghouse.consentDate,
    consentMethod: consentMethod || 'paper'
  });

  res.json({
    success: true,
    message: 'Consent recorded successfully',
    driver: {
      _id: driver._id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      clearinghouse: driver.clearinghouse,
      complianceStatus: driver.complianceStatus
    }
  });
}));

// @route   POST /api/clearinghouse/queries/:id/upload
// @desc    Upload document for a clearinghouse query (consent or result doc)
// @access  Private
router.post('/queries/:id/upload', checkPermission('drugAlcohol', 'edit'), uploadSingle('document'), asyncHandler(async (req, res) => {
  const query = await ClearinghouseQuery.findOne({ _id: req.params.id, ...req.companyFilter });
  if (!query) throw new AppError('Query record not found', 404);
  if (!req.file) throw new AppError('No file uploaded', 400);

  const fileUrl = getFileUrl(req.file.path);
  const { documentType } = req.body; // 'consent' or 'result'

  if (documentType === 'consent') {
    if (!query.consent) query.consent = {};
    query.consent.documentUrl = fileUrl;
  } else {
    query.resultDocumentUrl = fileUrl;
  }

  await query.save();

  auditService.log(req, 'update', 'clearinghouse_query', query._id, {
    action: 'document_uploaded',
    documentType: documentType || 'result'
  });

  const populated = await ClearinghouseQuery.findById(query._id)
    .populate('driverId', 'firstName lastName employeeId')
    .lean();

  res.json({ success: true, query: populated });
}));

module.exports = router;
