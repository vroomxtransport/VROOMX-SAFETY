const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const DamageClaim = require('../models/DamageClaim');
const { Driver, Vehicle } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadMultiple, getFileUrl } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/damage-claims
// @desc    Get all damage claims with filtering
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    status,
    damageType,
    faultParty,
    driverId,
    vehicleId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = '-incidentDate'
  } = req.query;

  const queryObj = { ...req.companyFilter };

  if (status) queryObj.status = status;
  if (damageType) queryObj.damageType = damageType;
  if (faultParty) queryObj.faultParty = faultParty;
  if (driverId) queryObj.driverId = driverId;
  if (vehicleId) queryObj.vehicleId = vehicleId;

  if (startDate || endDate) {
    queryObj.incidentDate = {};
    if (startDate) queryObj.incidentDate.$gte = new Date(startDate);
    if (endDate) queryObj.incidentDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const claims = await DamageClaim.find(queryObj)
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber vin make model')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await DamageClaim.countDocuments(queryObj);

  res.json({
    success: true,
    count: claims.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    claims
  });
}));

// @route   GET /api/damage-claims/stats
// @desc    Get damage claim statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const baseMatch = { ...req.companyFilter };

  // Total counts and amounts
  const totals = await DamageClaim.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalClaims: { $sum: 1 },
        totalClaimAmount: { $sum: '$claimAmount' },
        totalSettled: { $sum: '$settlementAmount' },
        driverFaultAmount: {
          $sum: {
            $cond: [{ $eq: ['$faultParty', 'driver'] }, '$claimAmount', 0]
          }
        },
        driverFaultSettled: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$faultParty', 'driver'] }, { $in: ['$status', ['settled', 'closed']] }] },
              '$settlementAmount',
              0
            ]
          }
        }
      }
    }
  ]);

  // Open claims count
  const openClaims = await DamageClaim.countDocuments({
    ...baseMatch,
    status: { $in: ['open', 'under_investigation', 'pending_settlement'] }
  });

  // By status breakdown
  const byStatus = await DamageClaim.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // By damage type breakdown
  const byType = await DamageClaim.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$damageType', count: { $sum: 1 }, amount: { $sum: '$claimAmount' } } }
  ]);

  // By fault party breakdown
  const byFault = await DamageClaim.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$faultParty', count: { $sum: 1 }, amount: { $sum: '$claimAmount' } } }
  ]);

  const summary = totals[0] || {
    totalClaims: 0,
    totalClaimAmount: 0,
    totalSettled: 0,
    driverFaultAmount: 0,
    driverFaultSettled: 0
  };

  res.json({
    success: true,
    stats: {
      totalClaims: summary.totalClaims,
      openClaims,
      totalClaimAmount: summary.totalClaimAmount,
      totalSettled: summary.totalSettled,
      driverFaultAmount: summary.driverFaultAmount,
      driverFaultSettled: summary.driverFaultSettled,
      recovered: summary.totalSettled,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byType: byType.reduce((acc, t) => ({ ...acc, [t._id]: { count: t.count, amount: t.amount } }), {}),
      byFault: byFault.reduce((acc, f) => ({ ...acc, [f._id]: { count: f.count, amount: f.amount } }), {})
    }
  });
}));

// @route   GET /api/damage-claims/:id
// @desc    Get single damage claim
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const claim = await DamageClaim.findOne({
    _id: req.params.id,
    ...req.companyFilter
  })
    .populate('driverId', 'firstName lastName employeeId phone email')
    .populate('vehicleId', 'unitNumber vin make model year')
    .populate('resolvedBy', 'firstName lastName')
    .populate('history.changedBy', 'firstName lastName')
    .populate('notes.createdBy', 'firstName lastName');

  if (!claim) {
    throw new AppError('Damage claim not found', 404);
  }

  res.json({
    success: true,
    claim
  });
}));

// @route   POST /api/damage-claims
// @desc    Create new damage claim
// @access  Private
router.post('/', [
  body('incidentDate').isISO8601().withMessage('Valid incident date is required'),
  body('damageType').isIn(['cargo_damage', 'vehicle_damage', 'property_damage', 'third_party', 'other']).withMessage('Valid damage type is required'),
  body('faultParty').isIn(['driver', 'company', 'third_party', 'unknown', 'weather', 'mechanical']).withMessage('Valid fault party is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('claimAmount').isFloat({ min: 0 }).withMessage('Claim amount must be a positive number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const claimData = {
    ...req.body,
    companyId: req.user.companyId._id || req.user.companyId
  };

  // Add initial history entry
  claimData.history = [{
    action: 'created',
    changedBy: req.user._id,
    changedAt: new Date(),
    details: 'Claim created'
  }];

  const claim = await DamageClaim.create(claimData);

  // Populate references before returning
  await claim.populate('driverId', 'firstName lastName employeeId');
  await claim.populate('vehicleId', 'unitNumber vin');

  auditService.log(req, 'create', 'damage_claim', claim._id, { damageType: req.body.damageType, claimAmount: req.body.claimAmount });

  res.status(201).json({
    success: true,
    claim
  });
}));

// @route   PUT /api/damage-claims/:id
// @desc    Update damage claim
// @access  Private
router.put('/:id', asyncHandler(async (req, res) => {
  let claim = await DamageClaim.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!claim) {
    throw new AppError('Damage claim not found', 404);
  }

  // Prevent changing companyId
  delete req.body.companyId;
  delete req.body.claimNumber;

  // Build history entry
  const changes = [];
  if (req.body.status && req.body.status !== claim.status) {
    changes.push(`Status: ${claim.status} → ${req.body.status}`);
  }
  if (req.body.settlementAmount && req.body.settlementAmount !== claim.settlementAmount) {
    changes.push(`Settlement: $${claim.settlementAmount} → $${req.body.settlementAmount}`);
  }

  // Add history entry
  claim.history.push({
    action: 'updated',
    changedBy: req.user._id,
    changedAt: new Date(),
    details: changes.length > 0 ? changes.join(', ') : 'Claim updated'
  });

  // If being settled, record resolution info
  if (req.body.status === 'settled' && claim.status !== 'settled') {
    req.body.resolvedDate = new Date();
    req.body.resolvedBy = req.user._id;
  }

  // Update the claim
  Object.assign(claim, req.body);
  await claim.save();

  // Populate references
  await claim.populate('driverId', 'firstName lastName employeeId');
  await claim.populate('vehicleId', 'unitNumber vin');

  auditService.log(req, 'update', 'damage_claim', req.params.id, { summary: 'Claim updated' });

  res.json({
    success: true,
    claim
  });
}));

// @route   DELETE /api/damage-claims/:id
// @desc    Delete damage claim
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const claim = await DamageClaim.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!claim) {
    throw new AppError('Damage claim not found', 404);
  }

  await DamageClaim.findByIdAndDelete(req.params.id);

  auditService.log(req, 'delete', 'damage_claim', req.params.id, { claimNumber: claim.claimNumber });

  res.json({
    success: true,
    message: 'Damage claim deleted successfully'
  });
}));

// @route   PUT /api/damage-claims/:id/settle
// @desc    Record claim settlement
// @access  Private
router.put('/:id/settle', [
  body('settlementAmount').isFloat({ min: 0 }).withMessage('Settlement amount must be a positive number'),
  body('resolutionNotes').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const claim = await DamageClaim.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!claim) {
    throw new AppError('Damage claim not found', 404);
  }

  claim.settlementAmount = req.body.settlementAmount;
  claim.resolutionNotes = req.body.resolutionNotes || claim.resolutionNotes;
  claim.status = 'settled';
  claim.resolvedDate = new Date();
  claim.resolvedBy = req.user._id;

  // If driver at fault, track deduction
  if (claim.faultParty === 'driver' && req.body.deductionFromDriver) {
    claim.deductionFromDriver = req.body.deductionFromDriver;
  }

  claim.history.push({
    action: 'settled',
    changedBy: req.user._id,
    changedAt: new Date(),
    details: `Settled for $${req.body.settlementAmount}`
  });

  await claim.save();

  auditService.log(req, 'update', 'damage_claim', req.params.id, { settlementAmount: req.body.settlementAmount, summary: 'Claim settled' });

  res.json({
    success: true,
    message: 'Claim settled successfully',
    claim
  });
}));

// @route   POST /api/damage-claims/:id/documents
// @desc    Upload documents/evidence for claim
// @access  Private
router.post('/:id/documents',
  uploadMultiple('documents', 10),
  asyncHandler(async (req, res) => {
    const claim = await DamageClaim.findOne({
      _id: req.params.id,
      ...req.companyFilter
    });

    if (!claim) {
      throw new AppError('Damage claim not found', 404);
    }

    const newDocs = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: getFileUrl(file.path),
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    }));

    claim.documents.push(...newDocs);

    claim.history.push({
      action: 'documents_uploaded',
      changedBy: req.user._id,
      changedAt: new Date(),
      details: `${newDocs.length} document(s) uploaded`
    });

    await claim.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: claim.documents
    });
  })
);

// @route   POST /api/damage-claims/:id/notes
// @desc    Add note to claim
// @access  Private
router.post('/:id/notes', [
  body('content').trim().notEmpty().withMessage('Note content is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const claim = await DamageClaim.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!claim) {
    throw new AppError('Damage claim not found', 404);
  }

  claim.notes.push({
    content: req.body.content,
    createdBy: req.user._id,
    createdAt: new Date()
  });

  await claim.save();

  // Populate the notes with user info
  await claim.populate('notes.createdBy', 'firstName lastName');

  res.json({
    success: true,
    notes: claim.notes
  });
}));

module.exports = router;
