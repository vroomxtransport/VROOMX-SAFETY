const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { DrugAlcoholTest, Driver } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadSingle, getFileUrl, deleteFile } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { DRUG_ALCOHOL_REQUIREMENTS } = require('../config/fmcsaCompliance');
const auditService = require('../services/auditService');
const documentSyncService = require('../services/documentSyncService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/drug-alcohol
// @desc    Get all drug/alcohol tests
// @access  Private
router.get('/', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const { testType, result, driverId, startDate, endDate, page = 1, limit = 20, sort = '-testDate' } = req.query;

  const queryObj = { ...req.companyFilter };

  if (testType) queryObj.testType = testType;
  if (result) queryObj.overallResult = result;
  if (driverId) queryObj.driverId = driverId;
  if (startDate || endDate) {
    queryObj.testDate = {};
    if (startDate) queryObj.testDate.$gte = new Date(startDate);
    if (endDate) queryObj.testDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tests = await DrugAlcoholTest.find(queryObj)
    .populate('driverId', 'firstName lastName employeeId')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await DrugAlcoholTest.countDocuments(queryObj);

  res.json({
    success: true,
    count: tests.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    tests
  });
}));

// @route   GET /api/drug-alcohol/stats
// @desc    Get drug/alcohol program statistics
// @access  Private
router.get('/stats', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  // Get active drivers count for random testing pool
  const activeDrivers = await Driver.countDocuments({
    ...req.companyFilter,
    status: 'active'
  });

  // Get test counts for current year
  const testStats = await DrugAlcoholTest.aggregate([
    {
      $match: {
        ...req.companyFilter,
        testDate: { $gte: startOfYear },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$testType',
        total: { $sum: 1 },
        negative: { $sum: { $cond: [{ $eq: ['$overallResult', 'negative'] }, 1, 0] } },
        positive: { $sum: { $cond: [{ $eq: ['$overallResult', 'positive'] }, 1, 0] } },
        refused: { $sum: { $cond: [{ $eq: ['$overallResult', 'refused'] }, 1, 0] } }
      }
    }
  ]);

  // Calculate random testing compliance
  const randomTests = testStats.find(t => t._id === 'random') || { total: 0 };
  const minDrugTests = Math.ceil(activeDrivers * (DRUG_ALCOHOL_REQUIREMENTS.testTypes.random.drugRate / 100));
  const minAlcoholTests = Math.ceil(activeDrivers * (DRUG_ALCOHOL_REQUIREMENTS.testTypes.random.alcoholRate / 100));

  // Get pending clearinghouse queries
  const driversNeedingQuery = await Driver.countDocuments({
    ...req.companyFilter,
    status: 'active',
    $or: [
      { 'clearinghouse.lastQueryDate': { $exists: false } },
      { 'clearinghouse.lastQueryDate': { $lt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } }
    ]
  });

  res.json({
    success: true,
    stats: {
      activeDriversInPool: activeDrivers,
      testsByType: testStats,
      randomTestingCompliance: {
        drugTestsRequired: minDrugTests,
        alcoholTestsRequired: minAlcoholTests,
        drugTestsCompleted: randomTests.total,
        complianceRate: activeDrivers > 0 ? Math.round((randomTests.total / minDrugTests) * 100) : 100
      },
      driversNeedingClearinghouseQuery: driversNeedingQuery
    }
  });
}));

// @route   GET /api/drug-alcohol/requirements
// @desc    Get DOT testing requirements
// @access  Private
router.get('/requirements', checkPermission('drugAlcohol', 'view'), (req, res) => {
  res.json({
    success: true,
    requirements: DRUG_ALCOHOL_REQUIREMENTS
  });
});

// @route   GET /api/drug-alcohol/random-pool
// @desc    Get drivers in random testing pool
// @access  Private
router.get('/random-pool', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const drivers = await Driver.find({
    ...req.companyFilter,
    status: 'active'
  }).select('firstName lastName employeeId hireDate');

  res.json({
    success: true,
    count: drivers.length,
    drivers
  });
}));

// @route   GET /api/drug-alcohol/:id
// @desc    Get single test record
// @access  Private
router.get('/:id', checkPermission('drugAlcohol', 'view'), asyncHandler(async (req, res) => {
  const test = await DrugAlcoholTest.findOne({
    _id: req.params.id,
    ...req.companyFilter
  }).populate('driverId', 'firstName lastName employeeId phone');

  if (!test) {
    throw new AppError('Test record not found', 404);
  }

  res.json({
    success: true,
    test
  });
}));

// @route   POST /api/drug-alcohol
// @desc    Create new test record
// @access  Private
router.post('/', checkPermission('drugAlcohol', 'edit'), [
  body('driverId').isMongoId().withMessage('Valid driver ID is required'),
  body('testType').isIn(['pre_employment', 'random', 'post_accident', 'reasonable_suspicion', 'return_to_duty', 'follow_up']),
  body('testDate').isISO8601().withMessage('Valid test date is required'),
  body('overallResult').isIn(['negative', 'positive', 'refused', 'cancelled', 'pending'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Verify driver belongs to company
  const driver = await Driver.findOne({
    _id: req.body.driverId,
    ...req.companyFilter
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  const test = await DrugAlcoholTest.create({
    ...req.body,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id
  });

  auditService.log(req, 'create', 'drug_alcohol_test', test._id, { testType: req.body.testType, driverId: req.body.driverId });

  res.status(201).json({
    success: true,
    test
  });
}));

// @route   PUT /api/drug-alcohol/:id
// @desc    Update test record
// @access  Private
router.put('/:id', checkPermission('drugAlcohol', 'edit'), asyncHandler(async (req, res) => {
  let test = await DrugAlcoholTest.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!test) {
    throw new AppError('Test record not found', 404);
  }

  delete req.body.companyId;

  test = await DrugAlcoholTest.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  auditService.log(req, 'update', 'drug_alcohol_test', req.params.id, { summary: 'Test record updated' });

  res.json({
    success: true,
    test
  });
}));

// @route   POST /api/drug-alcohol/:id/clearinghouse
// @desc    Report test to Clearinghouse
// @access  Private
router.post('/:id/clearinghouse', checkPermission('drugAlcohol', 'edit'), [
  body('reportType').isIn(['positive', 'refusal', 'rtu_negative']),
  body('confirmationNumber').optional().trim()
], asyncHandler(async (req, res) => {
  const test = await DrugAlcoholTest.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!test) {
    throw new AppError('Test record not found', 404);
  }

  test.clearinghouse = {
    reported: true,
    reportDate: new Date(),
    reportType: req.body.reportType,
    confirmationNumber: req.body.confirmationNumber
  };

  await test.save();

  auditService.log(req, 'update', 'drug_alcohol_test', req.params.id, { summary: 'Clearinghouse report recorded' });

  res.json({
    success: true,
    message: 'Clearinghouse report recorded',
    test
  });
}));

// @route   POST /api/drug-alcohol/:id/documents
// @desc    Upload test documents
// @access  Private
router.post('/:id/documents', checkPermission('drugAlcohol', 'edit'),
  uploadSingle('document'),
  asyncHandler(async (req, res) => {
    const test = await DrugAlcoholTest.findOne({
      _id: req.params.id,
      ...req.companyFilter
    });

    if (!test) {
      throw new AppError('Test record not found', 404);
    }

    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }

    test.documents.push({
      name: req.body.name || req.file.originalname,
      type: req.body.documentType || 'other',
      uploadDate: new Date(),
      documentUrl: getFileUrl(req.file.path)
    });

    await test.save();

    // Sync to central Documents (fire-and-forget)
    documentSyncService.trackUpload({
      companyId: req.companyFilter.companyId,
      category: 'drug_alcohol',
      sourceModel: 'DrugAlcoholTest',
      sourceId: test._id,
      sourceDocId: test.documents[test.documents.length - 1]._id,
      name: req.body.name || req.file.originalname,
      documentType: req.body.documentType || 'other',
      fileUrl: getFileUrl(req.file.path),
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id
    });

    auditService.log(req, 'upload', 'drug_alcohol_test', req.params.id, { documentName: req.body.name });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      documents: test.documents
    });
  })
);

// @route   DELETE /api/drug-alcohol/:id/documents/:docId
// @desc    Delete a document from a test record
// @access  Private
router.delete('/:id/documents/:docId', checkPermission('drugAlcohol', 'edit'), asyncHandler(async (req, res) => {
  const test = await DrugAlcoholTest.findOne({ _id: req.params.id, ...req.companyFilter });
  if (!test) throw new AppError('Test record not found', 404);
  const docIndex = test.documents.findIndex(d => d._id.toString() === req.params.docId);
  if (docIndex === -1) throw new AppError('Document not found', 404);
  const doc = test.documents[docIndex];
  if (doc.documentUrl) { try { await deleteFile(doc.documentUrl); } catch (err) { console.error('Error deleting file:', err); } }
  test.documents.splice(docIndex, 1);
  await test.save();

  // Sync delete to central Documents (fire-and-forget)
  documentSyncService.trackDelete({
    sourceModel: 'DrugAlcoholTest',
    sourceId: req.params.id,
    sourceDocId: req.params.docId
  });

  auditService.log(req, 'delete', 'drug_alcohol_document', req.params.docId, { testId: req.params.id });
  res.json({ success: true, message: 'Document deleted successfully' });
}));

// @route   DELETE /api/drug-alcohol/:id
// @desc    Soft delete test record (compliance retention)
// @access  Private
router.delete('/:id', checkPermission('drugAlcohol', 'delete'), asyncHandler(async (req, res) => {
  const test = await DrugAlcoholTest.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!test) {
    throw new AppError('Test record not found', 404);
  }

  test.isDeleted = true;
  test.deletedAt = new Date();
  test.deletedBy = req.user._id;
  await test.save();

  auditService.log(req, 'delete', 'drug_alcohol_test', req.params.id, { testType: test.testType, driverId: test.driverId });

  res.json({
    success: true,
    message: 'Test record deleted'
  });
}));

// @route   POST /api/drug-alcohol/clearinghouse-query
// @desc    Record clearinghouse query for driver
// @access  Private
router.post('/clearinghouse-query', checkPermission('drugAlcohol', 'edit'), [
  body('driverId').isMongoId(),
  body('queryType').isIn(['full', 'limited']),
  body('queryDate').isISO8601(),
  body('status').isIn(['clear', 'violation_found', 'pending'])
], asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({
    _id: req.body.driverId,
    ...req.companyFilter
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  driver.clearinghouse = {
    lastQueryDate: req.body.queryDate,
    queryType: req.body.queryType,
    status: req.body.status,
    consentDate: req.body.consentDate
  };

  await driver.save();

  res.json({
    success: true,
    message: 'Clearinghouse query recorded',
    driver: {
      id: driver._id,
      clearinghouse: driver.clearinghouse
    }
  });
}));

module.exports = router;
