const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { Driver } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadSingle, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { checkDriverLimit } = require('../middleware/subscriptionLimits');
const auditService = require('../services/auditService');

// Escape regex special characters to prevent NoSQL injection
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Apply authentication and company restriction to all routes
router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/drivers
// @desc    Get all drivers with filtering and pagination
// @access  Private
router.get('/', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const { status, complianceStatus, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  // Build query
  const queryObj = { ...req.companyFilter };

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

// @route   POST /api/drivers
// @desc    Create new driver
// @access  Private
router.post('/', checkPermission('drivers', 'edit'), checkDriverLimit, [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('cdl.number').trim().notEmpty().withMessage('CDL number is required'),
  body('cdl.state').trim().isLength({ min: 2, max: 2 }).withMessage('CDL state must be 2 characters'),
  body('cdl.class').isIn(['A', 'B', 'C']).withMessage('CDL class must be A, B, or C'),
  body('cdl.expiryDate').isISO8601().withMessage('CDL expiry date is required'),
  body('medicalCard.expiryDate').isISO8601().withMessage('Medical card expiry date is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Check for duplicate employee ID
  const existingDriver = await Driver.findOne({
    ...req.companyFilter,
    employeeId: req.body.employeeId
  });

  if (existingDriver) {
    return res.status(400).json({
      success: false,
      message: 'A driver with this employee ID already exists'
    });
  }

  const driver = await Driver.create({
    ...req.body,
    companyId: req.user.companyId._id || req.user.companyId
  });

  auditService.log(req, 'create', 'driver', driver._id, { name: req.body.firstName + ' ' + req.body.lastName, employeeId: req.body.employeeId });

  res.status(201).json({
    success: true,
    driver
  });
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
    'emergencyContact', 'employmentHistory', 'complianceStatus'
  ];
  const updateData = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updateData[key] = req.body[key];
    }
  }

  driver = await Driver.findByIdAndUpdate(
    req.params.id,
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
