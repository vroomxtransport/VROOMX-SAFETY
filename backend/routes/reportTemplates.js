const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ReportTemplate = require('../models/ReportTemplate');
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validateFields, getDefaultFields } = require('../config/reportFieldDefinitions');
const auditService = require('../services/auditService');

// Apply authentication to all routes
router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/report-templates
// @desc    Get all report templates (system + company)
// @access  Private
router.get('/', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { reportType } = req.query;

  const query = {
    isActive: true,
    $or: [
      { companyId: req.companyFilter.companyId },
      { isSystemTemplate: true }
    ]
  };

  if (reportType) {
    query.reportType = reportType;
  }

  const templates = await ReportTemplate.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ isSystemTemplate: -1, name: 1 });

  res.json({
    success: true,
    count: templates.length,
    templates
  });
}));

// @route   GET /api/report-templates/fields/:reportType
// @desc    Get available fields for a report type
// @access  Private
router.get('/fields/:reportType', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { reportType } = req.params;
  const { REPORT_FIELD_DEFINITIONS, getFieldMetadata } = require('../config/reportFieldDefinitions');

  const definition = REPORT_FIELD_DEFINITIONS[reportType];
  if (!definition) {
    throw new AppError(`Unknown report type: ${reportType}`, 400);
  }

  res.json({
    success: true,
    reportType,
    reportName: definition.name,
    fields: getFieldMetadata(reportType),
    defaultFields: getDefaultFields(reportType)
  });
}));

// @route   GET /api/report-templates/:id
// @desc    Get single template
// @access  Private
router.get('/:id', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const template = await ReportTemplate.findOne({
    _id: req.params.id,
    isActive: true,
    $or: [
      { companyId: req.companyFilter.companyId },
      { isSystemTemplate: true }
    ]
  }).populate('createdBy', 'firstName lastName');

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  res.json({ success: true, template });
}));

// @route   POST /api/report-templates
// @desc    Create new template
// @access  Private
router.post('/', checkPermission('reports', 'edit'), [
  body('name').trim().notEmpty().withMessage('Template name is required'),
  body('reportType').notEmpty().withMessage('Report type is required'),
  body('selectedFields').isArray({ min: 1 }).withMessage('At least one field must be selected')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, reportType, selectedFields, description, filters } = req.body;

  // Validate selected fields
  const validation = validateFields(reportType, selectedFields);
  if (!validation.valid) {
    if (validation.error) {
      throw new AppError(validation.error, 400);
    }
    throw new AppError(`Invalid fields: ${validation.invalidFields.join(', ')}`, 400);
  }

  const templateData = {
    name,
    reportType,
    selectedFields,
    description,
    filters,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id,
    isSystemTemplate: false // User-created templates cannot be system templates
  };

  const template = await ReportTemplate.create(templateData);

  auditService.log(req, 'create', 'reportTemplate', template._id, {
    name,
    reportType,
    fieldCount: selectedFields.length
  });

  res.status(201).json({
    success: true,
    message: 'Template created successfully',
    template
  });
}));

// @route   PUT /api/report-templates/:id
// @desc    Update template
// @access  Private
router.put('/:id', checkPermission('reports', 'edit'), asyncHandler(async (req, res) => {
  let template = await ReportTemplate.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId,
    isActive: true
  });

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Block edits to system templates
  if (template.isSystemTemplate) {
    return res.status(403).json({
      success: false,
      message: 'System templates cannot be edited. Duplicate the template to customize it.'
    });
  }

  const { name, description, selectedFields, filters } = req.body;

  // Validate selected fields if provided
  if (selectedFields) {
    const validation = validateFields(template.reportType, selectedFields);
    if (!validation.valid) {
      throw new AppError(`Invalid fields: ${validation.invalidFields.join(', ')}`, 400);
    }
  }

  // Build update object
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (selectedFields !== undefined) updateData.selectedFields = selectedFields;
  if (filters !== undefined) updateData.filters = filters;

  template = await ReportTemplate.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName');

  auditService.log(req, 'update', 'reportTemplate', req.params.id, {
    summary: 'Template updated',
    changes: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Template updated successfully',
    template
  });
}));

// @route   DELETE /api/report-templates/:id
// @desc    Delete template (soft delete)
// @access  Private
router.delete('/:id', checkPermission('reports', 'edit'), asyncHandler(async (req, res) => {
  const template = await ReportTemplate.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId,
    isActive: true
  });

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Block deletes of system templates
  if (template.isSystemTemplate) {
    return res.status(403).json({
      success: false,
      message: 'System templates cannot be deleted'
    });
  }

  template.isActive = false;
  await template.save();

  auditService.log(req, 'delete', 'reportTemplate', req.params.id, {
    name: template.name,
    summary: 'Template deleted'
  });

  res.json({
    success: true,
    message: 'Template deleted successfully'
  });
}));

// @route   POST /api/report-templates/:id/duplicate
// @desc    Duplicate a template (including system templates)
// @access  Private
router.post('/:id/duplicate', checkPermission('reports', 'edit'), asyncHandler(async (req, res) => {
  const sourceTemplate = await ReportTemplate.findOne({
    _id: req.params.id,
    isActive: true,
    $or: [
      { companyId: req.companyFilter.companyId },
      { isSystemTemplate: true }
    ]
  });

  if (!sourceTemplate) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Create new template with copied data
  const duplicateData = {
    name: `${sourceTemplate.name} (Copy)`,
    description: sourceTemplate.description,
    reportType: sourceTemplate.reportType,
    selectedFields: [...sourceTemplate.selectedFields],
    filters: sourceTemplate.filters ? { ...sourceTemplate.filters.toObject() } : undefined,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id,
    isSystemTemplate: false // Duplicates are always user-owned
  };

  const newTemplate = await ReportTemplate.create(duplicateData);

  auditService.log(req, 'create', 'reportTemplate', newTemplate._id, {
    name: duplicateData.name,
    reportType: duplicateData.reportType,
    duplicatedFrom: sourceTemplate._id,
    summary: `Duplicated from ${sourceTemplate.isSystemTemplate ? 'system' : 'user'} template`
  });

  res.status(201).json({
    success: true,
    message: 'Template duplicated successfully',
    template: newTemplate
  });
}));

// @route   POST /api/report-templates/seed-system
// @desc    Seed system templates (admin utility)
// @access  Private (Admin)
router.post('/seed-system', checkPermission('reports', 'edit'), asyncHandler(async (req, res) => {
  const existingSystemTemplates = await ReportTemplate.countDocuments({ isSystemTemplate: true });

  if (existingSystemTemplates > 0) {
    return res.json({
      success: true,
      message: 'System templates already exist',
      count: existingSystemTemplates
    });
  }

  const systemTemplates = ReportTemplate.getSystemTemplates();

  // Add createdBy for system templates (use current user as creator)
  const templatesWithCreator = systemTemplates.map(template => ({
    ...template,
    createdBy: req.user._id
  }));

  await ReportTemplate.insertMany(templatesWithCreator);

  res.json({
    success: true,
    message: 'System templates seeded successfully',
    count: systemTemplates.length
  });
}));

module.exports = router;
