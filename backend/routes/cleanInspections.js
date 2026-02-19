const express = require('express');
const router = express.Router();
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const cleanInspectionService = require('../services/cleanInspectionService');
const KnownInspection = require('../models/KnownInspection');

// All routes require authentication and company context
router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/clean-inspections/ratio
// @desc    Get clean inspection ratio for the company
// @access  Private (violations.view)
router.get('/ratio', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const { basic, driverId } = req.query;

  const ratio = await cleanInspectionService.getCleanRatio(companyId, { basic, driverId });

  res.json({
    success: true,
    ...ratio
  });
}));

// @route   GET /api/clean-inspections/list
// @desc    Get list of actual clean (zero-violation) inspections
// @access  Private (violations.view)
router.get('/list', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const limit = parseInt(req.query.limit) || 20;

  const inspections = await cleanInspectionService.getCleanInspectionList(companyId, limit);

  res.json({
    success: true,
    inspections
  });
}));

// @route   GET /api/clean-inspections/missing
// @desc    Get known inspections missing from MCMIS
// @access  Private (violations.view)
router.get('/missing', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const missing = await cleanInspectionService.getMissingInspections(companyId);

  res.json({
    success: true,
    count: missing.length,
    inspections: missing
  });
}));

// @route   GET /api/clean-inspections/strategy
// @desc    Get strategy recommendations
// @access  Private (violations.view)
router.get('/strategy', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const recommendations = await cleanInspectionService.getStrategyRecommendations(companyId);

  res.json({
    success: true,
    count: recommendations.length,
    recommendations
  });
}));

// @route   GET /api/clean-inspections/target/:basic
// @desc    Calculate target clean inspections needed for a BASIC
// @access  Private (violations.view)
router.get('/target/:basic', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const { basic } = req.params;
  const { targetPercentile } = req.query;

  const validBasics = [
    'unsafe_driving', 'hours_of_service', 'vehicle_maintenance',
    'controlled_substances', 'driver_fitness', 'crash_indicator'
  ];

  if (!validBasics.includes(basic)) {
    throw new AppError(`Invalid BASIC category. Must be one of: ${validBasics.join(', ')}`, 400);
  }

  const result = await cleanInspectionService.calculateTarget(companyId, basic, targetPercentile);

  if (result.error) {
    throw new AppError(result.error, 400);
  }

  res.json({
    success: true,
    ...result
  });
}));

// @route   POST /api/clean-inspections/known
// @desc    Report a known inspection
// @access  Private (violations.edit)
router.post('/known', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const {
    driverId,
    vehicleId,
    inspectionDate,
    location,
    inspectionLevel,
    result,
    inMcmis,
    mcmisReportNumber,
    source,
    notes
  } = req.body;

  if (!result || !['clean', 'violation'].includes(result)) {
    throw new AppError('Result is required and must be "clean" or "violation"', 400);
  }

  if (!inspectionDate) {
    throw new AppError('Inspection date is required', 400);
  }

  const knownInspection = await KnownInspection.create({
    companyId,
    driverId: driverId || undefined,
    vehicleId: vehicleId || undefined,
    inspectionDate: new Date(inspectionDate),
    location: location || {},
    inspectionLevel: inspectionLevel || undefined,
    result,
    inMcmis: inMcmis || false,
    mcmisReportNumber: mcmisReportNumber || undefined,
    source: source || 'manual_entry',
    notes: notes || undefined
  });

  res.status(201).json({
    success: true,
    inspection: knownInspection
  });
}));

module.exports = router;
