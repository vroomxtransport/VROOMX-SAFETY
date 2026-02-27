const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const DVIR = require('../models/DVIR');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');
const { uploadMultiple } = require('../middleware/upload');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/dvir
// @desc    Get all DVIRs with filtering
// @access  Private
router.get('/', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const { vehicleId, driverId, status, defectsOnly, startDate, endDate, page = 1, limit = 20 } = req.query;

  const queryObj = { ...req.companyFilter };
  if (vehicleId) queryObj.vehicleId = vehicleId;
  if (driverId) queryObj.driverId = driverId;
  if (status) queryObj.status = status;
  if (defectsOnly === 'true') queryObj.defectsFound = true;
  if (startDate || endDate) {
    queryObj.date = {};
    if (startDate) queryObj.date.$gte = new Date(startDate);
    if (endDate) queryObj.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [dvirs, total] = await Promise.all([
    DVIR.find(queryObj)
      .sort('-date')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('driverId', 'firstName lastName')
      .populate('vehicleId', 'unitNumber vehicleType'),
    DVIR.countDocuments(queryObj)
  ]);

  res.json({
    success: true,
    dvirs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
}));

// @route   GET /api/dvir/stats
// @desc    Get DVIR statistics
// @access  Private
router.get('/stats', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, openDefects, thisWeek, unresolvedOld] = await Promise.all([
    DVIR.countDocuments(req.companyFilter),
    DVIR.countDocuments({ ...req.companyFilter, status: 'repairs_needed' }),
    DVIR.countDocuments({ ...req.companyFilter, date: { $gte: weekAgo } }),
    DVIR.countDocuments({
      ...req.companyFilter,
      status: 'repairs_needed',
      date: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    })
  ]);

  const resolutionRate = total > 0
    ? Math.round((await DVIR.countDocuments({ ...req.companyFilter, defectsFound: true, repairsCompleted: true })) / Math.max(await DVIR.countDocuments({ ...req.companyFilter, defectsFound: true }), 1) * 100)
    : 100;

  res.json({
    success: true,
    stats: { total, openDefects, thisWeek, unresolvedOld, resolutionRate }
  });
}));

// @route   GET /api/dvir/overdue
// @desc    Get unresolved defects older than 24h
// @access  Private
router.get('/overdue', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const overdue = await DVIR.find({
    ...req.companyFilter,
    status: 'repairs_needed',
    date: { $lt: oneDayAgo }
  })
    .sort('date')
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber vehicleType');

  res.json({ success: true, dvirs: overdue, count: overdue.length });
}));

// @route   GET /api/dvir/items
// @desc    Get standard inspection item categories
// @access  Private
router.get('/items', (req, res) => {
  res.json({ success: true, items: DVIR.INSPECTION_ITEMS });
});

// @route   GET /api/dvir/:id
// @desc    Get single DVIR
// @access  Private
router.get('/:id', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const dvir = await DVIR.findOne({ _id: req.params.id, ...req.companyFilter })
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber vehicleType make model')
    .populate('createdBy', 'name email');

  if (!dvir) throw new AppError('DVIR not found', 404);
  res.json({ success: true, dvir });
}));

// @route   POST /api/dvir
// @desc    Create new DVIR
// @access  Private
router.post('/', checkPermission('vehicles', 'edit'), [
  body('vehicleId').notEmpty().withMessage('Vehicle is required'),
  body('driverId').notEmpty().withMessage('Driver is required'),
  body('inspectionType').isIn(['pre_trip', 'post_trip']).withMessage('Invalid inspection type')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

  const dvir = await DVIR.create({
    ...req.body,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id,
    driverSignedAt: req.body.driverSignature ? new Date() : undefined
  });

  auditService.log(req, 'create', 'dvir', dvir._id, {
    vehicle: req.body.vehicleId,
    driver: req.body.driverId,
    type: req.body.inspectionType,
    defectsFound: dvir.defectsFound
  });

  const populated = await DVIR.findById(dvir._id)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber vehicleType');

  res.status(201).json({ success: true, dvir: populated });
}));

// @route   PUT /api/dvir/:id
// @desc    Update DVIR (e.g., mark repairs complete)
// @access  Private
router.put('/:id', checkPermission('vehicles', 'edit'), asyncHandler(async (req, res) => {
  let dvir = await DVIR.findOne({ _id: req.params.id, ...req.companyFilter });
  if (!dvir) throw new AppError('DVIR not found', 404);

  const allowedFields = [
    'repairsCompleted', 'repairDate', 'repairNotes', 'repairedBy',
    'mechanicSignature', 'defects', 'defectsFound', 'safeToOperate',
    'items', 'notes', 'odometer', 'location'
  ];

  for (const key of allowedFields) {
    if (req.body[key] !== undefined) dvir[key] = req.body[key];
  }

  if (req.body.mechanicSignature) dvir.mechanicSignedAt = new Date();
  await dvir.save();

  auditService.log(req, 'update', 'dvir', dvir._id, { fields: Object.keys(req.body) });

  const populated = await DVIR.findById(dvir._id)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber vehicleType');

  res.json({ success: true, dvir: populated });
}));

// @route   DELETE /api/dvir/:id
// @desc    Delete DVIR
// @access  Private
router.delete('/:id', checkPermission('vehicles', 'delete'), asyncHandler(async (req, res) => {
  const dvir = await DVIR.findOne({ _id: req.params.id, ...req.companyFilter });
  if (!dvir) throw new AppError('DVIR not found', 404);

  await DVIR.deleteOne({ _id: req.params.id });
  auditService.log(req, 'delete', 'dvir', req.params.id);
  res.json({ success: true, message: 'DVIR deleted' });
}));

module.exports = router;
