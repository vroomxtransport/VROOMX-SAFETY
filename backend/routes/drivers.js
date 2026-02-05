const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');
const { Driver } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadSingle, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { checkDriverLimit } = require('../middleware/subscriptionLimits');
const auditService = require('../services/auditService');
const driverCSAService = require('../services/driverCSAService');

const { escapeRegex } = require('../utils/helpers');

// Apply authentication and company restriction to all routes
router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/drivers
// @desc    Get all drivers with filtering and pagination
// @access  Private
router.get('/', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const { status, complianceStatus, search, page = 1, limit = 20, sort: rawSort = '-createdAt', archived } = req.query;
  const allowedSorts = ['createdAt', '-createdAt', 'firstName', '-firstName', 'lastName', '-lastName', 'status', '-status', 'hireDate', '-hireDate'];
  const sort = allowedSorts.includes(rawSort) ? rawSort : '-createdAt';

  // Build query
  const queryObj = { ...req.companyFilter };

  // Filter by archived status (default: show only non-archived)
  if (archived === 'true') {
    queryObj.isArchived = true;
  } else {
    queryObj.isArchived = { $ne: true };
  }

  if (status) queryObj.status = status;
  if (complianceStatus) queryObj['complianceStatus.overall'] = complianceStatus;
  if (search) {
    const safeSearch = escapeRegex(search);
    queryObj.$or = [
      { firstName: { $regex: safeSearch, $options: 'i' } },
      { lastName: { $regex: safeSearch, $options: 'i' } },
      { employeeId: { $regex: safeSearch, $options: 'i' } },
      { 'cdl.number': { $regex: safeSearch, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const drivers = await Driver.find(queryObj)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-ssn'); // Don't include SSN by default

  const total = await Driver.countDocuments(queryObj);

  res.json({
    success: true,
    count: drivers.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    drivers
  });
}));

// @route   GET /api/drivers/alerts
// @desc    Get drivers with expiring documents
// @access  Private
router.get('/alerts', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + parseInt(days));

  const driversWithAlerts = await Driver.find({
    ...req.companyFilter,
    status: 'active',
    $or: [
      { 'cdl.expiryDate': { $lte: alertDate } },
      { 'medicalCard.expiryDate': { $lte: alertDate } },
      { 'complianceStatus.overall': { $ne: 'compliant' } }
    ]
  }).select('firstName lastName employeeId cdl.expiryDate medicalCard.expiryDate complianceStatus alerts');

  res.json({
    success: true,
    count: driversWithAlerts.length,
    drivers: driversWithAlerts
  });
}));

// @route   GET /api/drivers/stats
// @desc    Get driver statistics
// @access  Private
router.get('/stats', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const stats = await Driver.aggregate([
    { $match: req.companyFilter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        compliant: {
          $sum: { $cond: [{ $eq: ['$complianceStatus.overall', 'compliant'] }, 1, 0] }
        },
        warning: {
          $sum: { $cond: [{ $eq: ['$complianceStatus.overall', 'warning'] }, 1, 0] }
        },
        nonCompliant: {
          $sum: { $cond: [{ $eq: ['$complianceStatus.overall', 'non_compliant'] }, 1, 0] }
        }
      }
    }
  ]);

  // Count expiring documents (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringCdl = await Driver.countDocuments({
    ...req.companyFilter,
    status: 'active',
    'cdl.expiryDate': { $lte: thirtyDaysFromNow, $gte: new Date() }
  });

  const expiringMedical = await Driver.countDocuments({
    ...req.companyFilter,
    status: 'active',
    'medicalCard.expiryDate': { $lte: thirtyDaysFromNow, $gte: new Date() }
  });

  res.json({
    success: true,
    stats: {
      ...stats[0],
      expiringCdl,
      expiringMedical
    }
  });
}));

// @route   GET /api/drivers/risk-ranking
// @desc    Get top risk drivers by CSA impact
// @access  Private
// NOTE: This route MUST be before /:id to prevent Express from matching 'risk-ranking' as an ID
router.get('/risk-ranking', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const drivers = await driverCSAService.getTopRiskDrivers(
    req.companyFilter.companyId,
    parseInt(limit)
  );

  res.json({
    success: true,
    drivers
  });
}));

// @route   GET /api/drivers/:id
// @desc    Get single driver
// @access  Private
router.get('/:id', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({
    _id: req.params.id,
    ...req.companyFilter
  }).select('-ssn');

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  res.json({
    success: true,
    driver
  });
}));

// @route   GET /api/drivers/:id/csa
// @desc    Get driver's CSA impact and risk score
// @access  Private
router.get('/:id/csa', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const impact = await driverCSAService.getDriverCSAImpact(
    req.params.id,
    req.companyFilter.companyId
  );

  res.json({
    success: true,
    ...impact
  });
}));

// @route   GET /api/drivers/:id/violations
// @desc    Get driver's linked violations
// @access  Private
router.get('/:id/violations', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, basic, status, sortBy = 'violationDate', sortOrder = 'desc' } = req.query;

  const result = await driverCSAService.getDriverViolations(
    req.params.id,
    req.companyFilter.companyId,
    { page, limit, basic, status, sortBy, sortOrder }
  );

  res.json({
    success: true,
    ...result
  });
}));

// @route   POST /api/drivers
// @desc    Create new driver
// @access  Private
router.post('/', checkPermission('drivers', 'edit'), checkDriverLimit, [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
  body('cdl.number').trim().notEmpty().withMessage('CDL number is required'),
  body('cdl.state').trim().isLength({ min: 2, max: 2 }).withMessage('CDL state must be 2 characters'),
  body('cdl.class').isIn(['A', 'B', 'C']).withMessage('CDL class must be A, B, or C'),
  body('cdl.expiryDate').isISO8601().withMessage('CDL expiry date is required'),
  body('medicalCard.expiryDate').isISO8601().withMessage('Medical card expiry date is required'),
  body('mvrExpiryDate').optional().isISO8601().withMessage('MVR expiry date must be a valid date'),
  body('driverType').optional().isIn(['company_driver', 'owner_operator']).withMessage('Driver type must be company_driver or owner_operator'),
  body('clearinghouse.expiryDate').optional().isISO8601().withMessage('Clearinghouse expiry date must be a valid date')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Use a MongoDB transaction to prevent race conditions on driver limit checks.
  // The middleware does an initial check, but two concurrent requests could both pass it.
  // Re-checking within a transaction ensures atomicity.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Re-check driver count within the transaction
    const companyId = req.companyFilter.companyId;
    const plan = req.user.subscription?.plan || 'free_trial';

    const driverCount = await Driver.countDocuments({
      companyId,
      status: { $ne: 'terminated' }
    }).session(session);

    // Enforce hard limits within the transaction
    if ((plan === 'solo' || plan === 'free_trial') && driverCount >= 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: plan === 'solo'
          ? 'Solo plan is limited to 1 driver. Upgrade to Fleet for more drivers.'
          : 'Free trial is limited to 1 driver. Subscribe to continue adding drivers.',
        code: 'DRIVER_LIMIT_REACHED',
        limit: 1,
        current: driverCount
      });
    }

    // Check for duplicate employee ID (only if provided)
    if (req.body.employeeId) {
      const existingDriver = await Driver.findOne({
        ...req.companyFilter,
        employeeId: req.body.employeeId
      }).session(session);

      if (existingDriver) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'A driver with this employee ID already exists'
        });
      }
    }

    const driver = await Driver.create([{
      ...req.body,
      companyId
    }], { session });

    await session.commitTransaction();

    auditService.log(req, 'create', 'driver', driver[0]._id, { name: req.body.firstName + ' ' + req.body.lastName, employeeId: req.body.employeeId });

    res.status(201).json({
      success: true,
      driver: driver[0]
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}));

// @route   PUT /api/drivers/:id
// @desc    Update driver
// @access  Private
router.put('/:id', checkPermission('drivers', 'edit'), asyncHandler(async (req, res) => {
  let driver = await Driver.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  // Whitelist allowed update fields to prevent mass assignment
  const allowedFields = [
    'firstName', 'lastName', 'dateOfBirth', 'phone', 'email', 'address',
    'hireDate', 'terminationDate', 'status', 'employeeId', 'notes',
    'cdl', 'medicalCard', 'mvrReview', 'clearinghouse',
    'emergencyContact', 'employmentHistory', 'complianceStatus',
    'mvrExpiryDate', 'driverType'
  ];
  const updateData = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updateData[key] = req.body[key];
    }
  }

  driver = await Driver.findOneAndUpdate(
    { _id: req.params.id, ...req.companyFilter },
    updateData,
    { new: true, runValidators: true }
  );

  auditService.log(req, 'update', 'driver', req.params.id, { fields: Object.keys(updateData) });

  res.json({
    success: true,
    driver
  });
}));

// @route   POST /api/drivers/:id/documents
// @desc    Upload document for driver
// @access  Private
router.post('/:id/documents',
  checkPermission('drivers', 'edit'),
  uploadSingle('document'),
  asyncHandler(async (req, res) => {
    const driver = await Driver.findOne({
      _id: req.params.id,
      ...req.companyFilter
    });

    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }

    const { documentType, expiryDate } = req.body;
    const fileUrl = getFileUrl(req.file.path);

    // Update specific document based on type
    switch (documentType) {
      case 'cdl':
        driver.cdl.documentUrl = fileUrl;
        if (expiryDate) driver.cdl.expiryDate = expiryDate;
        break;
      case 'medicalCard':
        driver.medicalCard.documentUrl = fileUrl;
        if (expiryDate) driver.medicalCard.expiryDate = expiryDate;
        break;
      case 'roadTest':
        driver.documents.roadTest.documentUrl = fileUrl;
        driver.documents.roadTest.date = new Date();
        break;
      case 'employmentApplication':
        driver.documents.employmentApplication.documentUrl = fileUrl;
        driver.documents.employmentApplication.dateReceived = new Date();
        driver.documents.employmentApplication.complete = true;
        break;
      default:
        // Add to other documents
        driver.documents.other.push({
          name: req.body.name || documentType,
          description: req.body.description,
          uploadDate: new Date(),
          documentUrl: fileUrl
        });
    }

    await driver.save();

    auditService.log(req, 'upload', 'driver', req.params.id, { documentType: req.body.documentType });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      documentUrl: fileUrl
    });
  })
);

// @route   POST /api/drivers/:id/mvr
// @desc    Add MVR review
// @access  Private
router.post('/:id/mvr', checkPermission('drivers', 'edit'), [
  body('reviewDate').isISO8601(),
  body('reviewerName').trim().notEmpty()
], asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  driver.documents.mvrReviews.push({
    ...req.body,
    approved: req.body.approved !== false
  });

  await driver.save();

  res.json({
    success: true,
    message: 'MVR review added successfully',
    driver
  });
}));

// @route   PATCH /api/drivers/:id/restore
// @desc    Restore an archived driver
// @access  Private
router.patch('/:id/restore', checkPermission('drivers', 'edit'), asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  // Check driver limit before restoring
  const plan = req.user.subscription?.plan || 'free_trial';
  const activeCompanyId = req.companyFilter?.companyId;
  const driverCount = await Driver.countDocuments({
    companyId: activeCompanyId,
    status: { $ne: 'terminated' }
  });

  if ((plan === 'solo' || plan === 'free_trial') && driverCount >= 1) {
    return res.status(403).json({
      success: false,
      message: `Cannot restore driver: ${plan === 'solo' ? 'Solo' : 'Free trial'} plan is limited to 1 driver.`,
      code: 'DRIVER_LIMIT_REACHED',
      limit: 1,
      current: driverCount
    });
  }

  driver.isArchived = false;
  driver.archivedAt = null;
  driver.retentionExpiresAt = null;
  driver.status = 'inactive';

  await driver.save();

  auditService.log(req, 'update', 'driver', req.params.id, { action: 'restore', name: driver.firstName + ' ' + driver.lastName });

  res.json({
    success: true,
    message: 'Driver restored successfully',
    driver
  });
}));

// @route   DELETE /api/drivers/:id
// @desc    Delete driver (soft delete - set to terminated)
// @access  Private
router.delete('/:id', checkPermission('drivers', 'delete'), asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!driver) {
    throw new AppError('Driver not found', 404);
  }

  // Soft delete - mark as terminated
  driver.status = 'terminated';
  driver.terminationDate = new Date();
  await driver.save();

  auditService.log(req, 'delete', 'driver', req.params.id, { name: driver.firstName + ' ' + driver.lastName });

  res.json({
    success: true,
    message: 'Driver marked as terminated'
  });
}));

module.exports = router;
