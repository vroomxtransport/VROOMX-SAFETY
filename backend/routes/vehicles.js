const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { Vehicle } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadSingle, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { checkVehicleLimit } = require('../middleware/subscriptionLimits');
const auditService = require('../services/auditService');

// Escape regex special characters to prevent NoSQL injection
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/vehicles
// @desc    Get all vehicles with filtering
// @access  Private
router.get('/', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const { status, vehicleType, complianceStatus, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const queryObj = { ...req.companyFilter };

  if (status) queryObj.status = status;
  if (vehicleType) queryObj.vehicleType = vehicleType;
  if (complianceStatus) queryObj['complianceStatus.overall'] = complianceStatus;
  if (search) {
    const safeSearch = escapeRegex(search);
    queryObj.$or = [
      { unitNumber: { $regex: safeSearch, $options: 'i' } },
      { vin: { $regex: safeSearch, $options: 'i' } },
      { make: { $regex: safeSearch, $options: 'i' } },
      { model: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const vehicles = await Vehicle.find(queryObj)
    .populate('assignedDriver', 'firstName lastName employeeId')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Vehicle.countDocuments(queryObj);

  res.json({
    success: true,
    count: vehicles.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    vehicles
  });
}));

// @route   GET /api/vehicles/alerts
// @desc    Get vehicles with upcoming inspections/maintenance
// @access  Private
router.get('/alerts', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + parseInt(days));

  const vehiclesWithAlerts = await Vehicle.find({
    ...req.companyFilter,
    status: { $in: ['active', 'maintenance'] },
    $or: [
      { 'annualInspection.nextDueDate': { $lte: alertDate } },
      { 'pmSchedule.nextPmDueDate': { $lte: alertDate } },
      { 'registration.expiryDate': { $lte: alertDate } },
      { 'complianceStatus.overall': { $ne: 'compliant' } }
    ]
  }).select('unitNumber vehicleType make model annualInspection.nextDueDate pmSchedule.nextPmDueDate complianceStatus');

  res.json({
    success: true,
    count: vehiclesWithAlerts.length,
    vehicles: vehiclesWithAlerts
  });
}));

// @route   GET /api/vehicles/stats
// @desc    Get vehicle statistics
// @access  Private
router.get('/stats', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const stats = await Vehicle.aggregate([
    { $match: req.companyFilter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
        outOfService: { $sum: { $cond: [{ $eq: ['$status', 'out_of_service'] }, 1, 0] } },
        tractors: { $sum: { $cond: [{ $eq: ['$vehicleType', 'tractor'] }, 1, 0] } },
        trailers: { $sum: { $cond: [{ $eq: ['$vehicleType', 'trailer'] }, 1, 0] } }
      }
    }
  ]);

  // Count vehicles due for inspection
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const dueForInspection = await Vehicle.countDocuments({
    ...req.companyFilter,
    status: { $ne: 'sold' },
    'annualInspection.nextDueDate': { $lte: thirtyDaysFromNow }
  });

  res.json({
    success: true,
    stats: {
      ...stats[0],
      dueForInspection
    }
  });
}));

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle with full maintenance history
// @access  Private
router.get('/:id', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    ...req.companyFilter
  }).populate('assignedDriver', 'firstName lastName employeeId phone');

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  res.json({
    success: true,
    vehicle
  });
}));

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private
router.post('/', checkPermission('vehicles', 'edit'), checkVehicleLimit, [
  body('unitNumber').trim().notEmpty().withMessage('Unit number is required'),
  body('vin').trim().isLength({ min: 17, max: 17 }).withMessage('VIN must be 17 characters'),
  body('vehicleType').isIn(['tractor', 'trailer', 'straight_truck', 'bus', 'van']).withMessage('Invalid vehicle type')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Use a MongoDB transaction to prevent race conditions on vehicle limit checks.
  // The middleware does an initial check, but two concurrent requests could both pass it.
  // Re-checking within a transaction ensures atomicity.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Re-check vehicle count within the transaction
    const companyId = req.user.companyId._id || req.user.companyId;
    const plan = req.user.subscription?.plan || 'free_trial';

    const vehicleCount = await Vehicle.countDocuments({
      companyId,
      status: { $ne: 'out_of_service' }
    }).session(session);

    // Enforce hard limits within the transaction
    if ((plan === 'solo' || plan === 'free_trial') && vehicleCount >= 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: plan === 'solo'
          ? 'Solo plan is limited to 1 vehicle. Upgrade to Fleet for more vehicles.'
          : 'Free trial is limited to 1 vehicle. Subscribe to continue adding vehicles.',
        code: 'VEHICLE_LIMIT_REACHED',
        limit: 1,
        current: vehicleCount
      });
    }

    // Check for duplicate unit number or VIN
    const existing = await Vehicle.findOne({
      ...req.companyFilter,
      $or: [
        { unitNumber: req.body.unitNumber },
        { vin: req.body.vin.toUpperCase() }
      ]
    }).session(session);

    if (existing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'A vehicle with this unit number or VIN already exists'
      });
    }

    const vehicle = await Vehicle.create([{
      ...req.body,
      companyId
    }], { session });

    await session.commitTransaction();

    auditService.log(req, 'create', 'vehicle', vehicle[0]._id, { unitNumber: req.body.unitNumber, vin: req.body.vin });

    res.status(201).json({
      success: true,
      vehicle: vehicle[0]
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}));

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private
router.put('/:id', checkPermission('vehicles', 'edit'), asyncHandler(async (req, res) => {
  let vehicle = await Vehicle.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  delete req.body.companyId;

  vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  auditService.log(req, 'update', 'vehicle', req.params.id, { summary: 'Vehicle updated' });

  res.json({
    success: true,
    vehicle
  });
}));

// @route   POST /api/vehicles/:id/maintenance
// @desc    Add maintenance record
// @access  Private
router.post('/:id/maintenance', checkPermission('vehicles', 'edit'), [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('maintenanceType').isIn(['preventive', 'repair', 'inspection', 'recall', 'breakdown']),
  body('description').trim().notEmpty().withMessage('Description is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  const maintenanceRecord = {
    ...req.body,
    createdBy: req.user._id
  };

  vehicle.maintenanceLog.push(maintenanceRecord);

  // Update odometer if provided
  if (req.body.odometer) {
    vehicle.currentOdometer = {
      reading: req.body.odometer,
      lastUpdated: new Date()
    };
  }

  // If preventive maintenance, update PM schedule
  if (req.body.maintenanceType === 'preventive' && req.body.odometer) {
    vehicle.pmSchedule.lastPmDate = req.body.date;
    vehicle.pmSchedule.lastPmOdometer = req.body.odometer;
    vehicle.pmSchedule.nextPmDueDate = new Date(req.body.date);
    vehicle.pmSchedule.nextPmDueDate.setDate(
      vehicle.pmSchedule.nextPmDueDate.getDate() + (vehicle.pmSchedule.intervalDays || 90)
    );
    vehicle.pmSchedule.nextPmDueOdometer = req.body.odometer + (vehicle.pmSchedule.intervalMiles || 25000);
  }

  await vehicle.save();

  auditService.log(req, 'create', 'maintenance', null, { vehicleId: req.params.id, type: req.body.maintenanceType });

  res.json({
    success: true,
    message: 'Maintenance record added successfully',
    maintenanceLog: vehicle.maintenanceLog
  });
}));

// @route   POST /api/vehicles/:id/inspection
// @desc    Record annual inspection
// @access  Private
router.post('/:id/inspection', checkPermission('vehicles', 'edit'),
  uploadSingle('document'),
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      ...req.companyFilter
    });

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    const { inspectionDate, inspectorName, inspectorNumber, location, result, defects } = req.body;

    // Calculate next due date (1 year from inspection)
    const nextDueDate = new Date(inspectionDate);
    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

    vehicle.annualInspection = {
      lastInspectionDate: inspectionDate,
      nextDueDate,
      inspectorName,
      inspectorNumber,
      location,
      result,
      defectsFound: defects ? JSON.parse(defects) : [],
      documentUrl: req.file ? getFileUrl(req.file.path) : vehicle.annualInspection?.documentUrl
    };

    await vehicle.save();

    auditService.log(req, 'create', 'vehicle', req.params.id, { summary: 'Inspection recorded' });

    res.json({
      success: true,
      message: 'Inspection recorded successfully',
      annualInspection: vehicle.annualInspection
    });
  })
);

// @route   POST /api/vehicles/:id/dvir
// @desc    Add DVIR record
// @access  Private
router.post('/:id/dvir', checkPermission('vehicles', 'edit'), [
  body('date').isISO8601(),
  body('type').isIn(['pre_trip', 'post_trip']),
  body('driverId').isMongoId()
], asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  vehicle.dvirRecords.push(req.body);
  await vehicle.save();

  res.json({
    success: true,
    message: 'DVIR recorded successfully'
  });
}));

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle (soft delete - mark as sold)
// @access  Private
router.delete('/:id', checkPermission('vehicles', 'delete'), asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }

  vehicle.status = 'sold';
  vehicle.outOfServiceDate = new Date();
  await vehicle.save();

  auditService.log(req, 'delete', 'vehicle', req.params.id, { unitNumber: vehicle.unitNumber });

  res.json({
    success: true,
    message: 'Vehicle marked as sold'
  });
}));

module.exports = router;
