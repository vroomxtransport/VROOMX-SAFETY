const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const ChecklistAssignment = require('../models/ChecklistAssignment');
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

// Apply authentication to all routes
router.use(protect);
router.use(restrictToCompany);

// ==================== TEMPLATES ====================

// @route   GET /api/checklists/templates
// @desc    Get all checklist templates
// @access  Private
router.get('/templates', asyncHandler(async (req, res) => {
  const { category, search, includeDefaults = 'true' } = req.query;

  const query = {
    isActive: true,
    $or: [
      { companyId: req.companyFilter.companyId },
      ...(includeDefaults === 'true' ? [{ isDefault: true }] : [])
    ]
  };

  if (category) query.category = category;
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const templates = await ChecklistTemplate.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ isDefault: -1, name: 1 });

  res.json({
    success: true,
    count: templates.length,
    templates
  });
}));

// @route   GET /api/checklists/templates/:id
// @desc    Get single template
// @access  Private
router.get('/templates/:id', asyncHandler(async (req, res) => {
  const template = await ChecklistTemplate.findOne({
    _id: req.params.id,
    $or: [
      { companyId: req.companyFilter.companyId },
      { isDefault: true }
    ]
  }).populate('createdBy', 'firstName lastName');

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  res.json({ success: true, template });
}));

// @route   POST /api/checklists/templates
// @desc    Create new template
// @access  Private (Admin)
router.post('/templates', [
  body('name').trim().notEmpty().withMessage('Template name is required'),
  body('category').optional().isIn(['onboarding', 'audit', 'maintenance', 'file_review', 'custom']),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const templateData = {
    ...req.body,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id,
    isDefault: false // Company templates can't be default
  };

  const template = await ChecklistTemplate.create(templateData);

  auditService.log(req, 'create', 'checklist', template._id, { name: req.body.name, category: req.body.category });

  res.status(201).json({
    success: true,
    message: 'Template created successfully',
    template
  });
}));

// @route   PUT /api/checklists/templates/:id
// @desc    Update template
// @access  Private (Admin)
router.put('/templates/:id', asyncHandler(async (req, res) => {
  let template = await ChecklistTemplate.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId,
    isDefault: false // Can't edit default templates
  });

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found or cannot be edited' });
  }

  req.body.lastUpdatedBy = req.user._id;

  template = await ChecklistTemplate.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  auditService.log(req, 'update', 'checklist', req.params.id, { summary: 'Template updated' });

  res.json({
    success: true,
    message: 'Template updated successfully',
    template
  });
}));

// @route   DELETE /api/checklists/templates/:id
// @desc    Delete template (soft delete by setting isActive = false)
// @access  Private (Admin)
router.delete('/templates/:id', asyncHandler(async (req, res) => {
  const template = await ChecklistTemplate.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId,
    isDefault: false
  });

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found or cannot be deleted' });
  }

  template.isActive = false;
  template.lastUpdatedBy = req.user._id;
  await template.save();

  auditService.log(req, 'delete', 'checklist', req.params.id, { summary: 'Template deleted' });

  res.json({
    success: true,
    message: 'Template deleted successfully'
  });
}));

// ==================== ASSIGNMENTS ====================

// @route   GET /api/checklists/assignments
// @desc    Get all checklist assignments
// @access  Private
router.get('/assignments', asyncHandler(async (req, res) => {
  const { status, assignedType, assignedId, templateId, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyFilter.companyId };

  if (status) query.status = status;
  if (assignedType) query['assignedTo.type'] = assignedType;
  if (assignedId) query['assignedTo.refId'] = assignedId;
  if (templateId) query.templateId = templateId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [assignments, total] = await Promise.all([
    ChecklistAssignment.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('lastUpdatedBy', 'firstName lastName')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    ChecklistAssignment.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: assignments.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    assignments
  });
}));

// @route   GET /api/checklists/assignments/stats
// @desc    Get assignment statistics
// @access  Private
router.get('/assignments/stats', asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const stats = await ChecklistAssignment.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        notStarted: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
      }
    }
  ]);

  // Get overdue count
  const overdueCount = await ChecklistAssignment.countDocuments({
    companyId,
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  });

  res.json({
    success: true,
    stats: {
      ...stats[0] || { total: 0, notStarted: 0, inProgress: 0, completed: 0 },
      overdue: overdueCount
    }
  });
}));

// @route   GET /api/checklists/assignments/:id
// @desc    Get single assignment with full details
// @access  Private
router.get('/assignments/:id', asyncHandler(async (req, res) => {
  const assignment = await ChecklistAssignment.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  })
    .populate('createdBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName')
    .populate('items.completedBy', 'firstName lastName')
    .populate('notes.createdBy', 'firstName lastName');

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  res.json({ success: true, assignment });
}));

// @route   POST /api/checklists/assignments
// @desc    Create new assignment from template
// @access  Private
router.post('/assignments', [
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('assignedTo.type').isIn(['driver', 'vehicle', 'company', 'audit']).withMessage('Valid assigned type is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const assignmentData = {
    ...req.body,
    companyId: req.companyFilter.companyId
  };

  const assignment = await ChecklistAssignment.createFromTemplate(
    req.body.templateId,
    assignmentData,
    req.user._id
  );

  const populatedAssignment = await ChecklistAssignment.findById(assignment._id)
    .populate('createdBy', 'firstName lastName');

  auditService.log(req, 'create', 'checklist', assignment._id, { templateId: req.body.templateId, summary: 'Checklist assigned' });

  res.status(201).json({
    success: true,
    message: 'Checklist assigned successfully',
    assignment: populatedAssignment
  });
}));

// @route   PATCH /api/checklists/assignments/:id/items/:itemId
// @desc    Toggle item completion status
// @access  Private
router.patch('/assignments/:id/items/:itemId', asyncHandler(async (req, res) => {
  const assignment = await ChecklistAssignment.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const item = assignment.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  // Toggle completion
  item.completed = !item.completed;
  if (item.completed) {
    item.completedBy = req.user._id;
    item.completedAt = new Date();
    item.notes = req.body.notes || item.notes;
  } else {
    item.completedBy = null;
    item.completedAt = null;
  }

  assignment.lastUpdatedBy = req.user._id;
  await assignment.save();

  const updatedAssignment = await ChecklistAssignment.findById(assignment._id)
    .populate('items.completedBy', 'firstName lastName');

  res.json({
    success: true,
    message: item.completed ? 'Item completed' : 'Item unchecked',
    assignment: updatedAssignment
  });
}));

// @route   POST /api/checklists/assignments/:id/notes
// @desc    Add note to assignment
// @access  Private
router.post('/assignments/:id/notes', [
  body('content').trim().notEmpty().withMessage('Note content is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const assignment = await ChecklistAssignment.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  assignment.notes.push({
    content: req.body.content,
    createdBy: req.user._id
  });
  assignment.lastUpdatedBy = req.user._id;

  await assignment.save();

  res.json({
    success: true,
    message: 'Note added successfully'
  });
}));

// @route   DELETE /api/checklists/assignments/:id
// @desc    Delete assignment
// @access  Private
router.delete('/assignments/:id', asyncHandler(async (req, res) => {
  const assignment = await ChecklistAssignment.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  await ChecklistAssignment.findByIdAndDelete(req.params.id);

  auditService.log(req, 'delete', 'checklist', req.params.id, { summary: 'Assignment deleted' });

  res.json({
    success: true,
    message: 'Assignment deleted successfully'
  });
}));

// ==================== SEED DEFAULT TEMPLATES ====================

// @route   POST /api/checklists/seed-defaults
// @desc    Seed default templates (admin only)
// @access  Private (Super Admin)
router.post('/seed-defaults', asyncHandler(async (req, res) => {
  const existingDefaults = await ChecklistTemplate.countDocuments({ isDefault: true });

  if (existingDefaults > 0) {
    return res.json({
      success: true,
      message: 'Default templates already exist',
      count: existingDefaults
    });
  }

  const defaults = ChecklistTemplate.getDefaultTemplates();
  await ChecklistTemplate.insertMany(defaults);

  res.json({
    success: true,
    message: 'Default templates seeded successfully',
    count: defaults.length
  });
}));

module.exports = router;
