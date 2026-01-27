const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Accident, Driver, Vehicle } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadMultiple, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/accidents
// @desc    Get all accidents
// @access  Private
router.get('/', checkPermission('accidents', 'view'), asyncHandler(async (req, res) => {
  const { severity, isDotRecordable, driverId, startDate, endDate, page = 1, limit = 20, sort = '-accidentDate' } = req.query;

  const queryObj = { ...req.companyFilter };

  if (severity) queryObj.severity = severity;
  if (isDotRecordable !== undefined) queryObj.isDotRecordable = isDotRecordable === 'true';
  if (driverId) queryObj.driverId = driverId;
  if (startDate || endDate) {
    queryObj.accidentDate = {};
    if (startDate) queryObj.accidentDate.$gte = new Date(startDate);
    if (endDate) queryObj.accidentDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const accidents = await Accident.find(queryObj)
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Accident.countDocuments(queryObj);

  res.json({
    success: true,
    count: accidents.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    accidents
  });
}));

// @route   GET /api/accidents/stats
// @desc    Get accident statistics
// @access  Private
router.get('/stats', checkPermission('accidents', 'view'), asyncHandler(async (req, res) => {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const stats = await Accident.aggregate([
    {
      $match: {
        ...req.companyFilter,
        accidentDate: { $gte: threeYearsAgo }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        dotRecordable: { $sum: { $cond: ['$isDotRecordable', 1, 0] } },
        fatalities: { $sum: '$totalFatalities' },
        injuries: { $sum: '$totalInjuries' },
        preventable: { $sum: { $cond: ['$investigation.preventable', 1, 0] } }
      }
    }
  ]);

  const bySeverity = await Accident.aggregate([
    { $match: { ...req.companyFilter, accidentDate: { $gte: threeYearsAgo } } },
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    stats: {
      summary: stats[0] || { total: 0, dotRecordable: 0, fatalities: 0, injuries: 0, preventable: 0 },
      bySeverity
    }
  });
}));

// @route   GET /api/accidents/:id
// @desc    Get single accident
// @access  Private
router.get('/:id', checkPermission('accidents', 'view'), asyncHandler(async (req, res) => {
  const accident = await Accident.findOne({
    _id: req.params.id,
    ...req.companyFilter
  })
    .populate('driverId', 'firstName lastName employeeId phone')
    .populate('vehicleId', 'unitNumber vin make model')
    .populate('trailerId', 'unitNumber vin');

  if (!accident) {
    throw new AppError('Accident not found', 404);
  }

  res.json({
    success: true,
    accident
  });
}));

// @route   POST /api/accidents
// @desc    Create new accident record
// @access  Private
router.post('/', checkPermission('accidents', 'edit'), [
  body('accidentDate').isISO8601(),
  body('driverId').isMongoId(),
  body('vehicleId').isMongoId(),
  body('location.state').notEmpty(),
  body('severity').isIn(['minor', 'moderate', 'severe', 'fatal']),
  body('description').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const accident = await Accident.create({
    ...req.body,
    companyId: req.user.companyId._id || req.user.companyId,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    accident
  });
}));

// @route   PUT /api/accidents/:id
// @desc    Update accident
// @access  Private
router.put('/:id', checkPermission('accidents', 'edit'), asyncHandler(async (req, res) => {
  let accident = await Accident.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!accident) {
    throw new AppError('Accident not found', 404);
  }

  delete req.body.companyId;

  accident = await Accident.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    accident
  });
}));

// @route   POST /api/accidents/:id/documents
// @desc    Upload accident documents
// @access  Private
router.post('/:id/documents', checkPermission('accidents', 'edit'),
  uploadMultiple('documents', 10),
  asyncHandler(async (req, res) => {
    const accident = await Accident.findOne({
      _id: req.params.id,
      ...req.companyFilter
    });

    if (!accident) {
      throw new AppError('Accident not found', 404);
    }

    const newDocs = req.files.map(file => ({
      name: file.originalname,
      type: req.body.documentType || 'other',
      uploadDate: new Date(),
      documentUrl: getFileUrl(file.path)
    }));

    accident.documents.push(...newDocs);
    await accident.save();

    res.json({
      success: true,
      documents: accident.documents
    });
  })
);

// @route   POST /api/accidents/:id/investigation
// @desc    Record investigation findings
// @access  Private
router.post('/:id/investigation', checkPermission('accidents', 'edit'), asyncHandler(async (req, res) => {
  const accident = await Accident.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!accident) {
    throw new AppError('Accident not found', 404);
  }

  accident.investigation = {
    ...accident.investigation,
    ...req.body,
    conductedBy: req.body.conductedBy || req.user.fullName
  };

  if (req.body.completed) {
    accident.investigation.completionDate = new Date();
    accident.status = 'closed';
  }

  await accident.save();

  res.json({
    success: true,
    accident
  });
}));

module.exports = router;
