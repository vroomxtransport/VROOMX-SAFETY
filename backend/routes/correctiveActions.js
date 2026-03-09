const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const CorrectiveAction = require('../models/CorrectiveAction');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/corrective-actions
// @desc    List corrective actions (with optional inspectionId/violationId filter)
// @access  Private
router.get('/', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { inspectionId, violationId, status, page = 1, limit = 50 } = req.query;

  const queryObj = { ...req.companyFilter, isDeleted: false };
  if (inspectionId) queryObj.inspectionId = inspectionId;
  if (violationId) queryObj.violationId = violationId;
  if (status) queryObj.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [actions, total] = await Promise.all([
    CorrectiveAction.find(queryObj)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email'),
    CorrectiveAction.countDocuments(queryObj)
  ]);

  res.json({
    success: true,
    actions,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
}));

// @route   POST /api/corrective-actions
// @desc    Create a corrective action
// @access  Private
router.post('/', checkPermission('violations', 'edit'), [
  body('description').notEmpty().withMessage('Description is required'),
  body('actionType').optional().isIn(['repair', 'training', 'policy_change', 'document_update', 'other']),
  body('status').optional().isIn(['planned', 'in_progress', 'completed'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

  const action = await CorrectiveAction.create({
    ...req.body,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id
  });

  auditService.log(req, 'create', 'corrective_action', action._id, {
    inspectionId: req.body.inspectionId,
    violationId: req.body.violationId,
    actionType: req.body.actionType
  });

  const populated = await CorrectiveAction.findById(action._id)
    .populate('createdBy', 'name email');

  res.status(201).json({ success: true, action: populated });
}));

// @route   PUT /api/corrective-actions/:id
// @desc    Update a corrective action
// @access  Private
router.put('/:id', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const action = await CorrectiveAction.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });
  if (!action) throw new AppError('Corrective action not found', 404);

  const before = action.toObject();
  const allowedFields = ['description', 'actionType', 'completedDate', 'completedBy', 'status', 'notes'];
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) action[key] = req.body[key];
  }
  await action.save();

  auditService.log(req, 'update', 'corrective_action', action._id,
    auditService.diff(before, action.toObject())
  );

  const populated = await CorrectiveAction.findById(action._id)
    .populate('createdBy', 'name email');

  res.json({ success: true, action: populated });
}));

// @route   DELETE /api/corrective-actions/:id
// @desc    Soft delete a corrective action
// @access  Private
router.delete('/:id', checkPermission('violations', 'delete'), asyncHandler(async (req, res) => {
  const action = await CorrectiveAction.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });
  if (!action) throw new AppError('Corrective action not found', 404);

  action.isDeleted = true;
  await action.save();

  auditService.log(req, 'delete', 'corrective_action', req.params.id);
  res.json({ success: true, message: 'Corrective action deleted' });
}));

module.exports = router;
