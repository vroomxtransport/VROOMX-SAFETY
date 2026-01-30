const express = require('express');
const router = express.Router();
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const scheduledReportService = require('../services/scheduledReportService');
const ScheduledReport = require('../models/ScheduledReport');

// All routes require authentication and company context
router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/scheduled-reports
// @desc    Get all scheduled reports for company
// @access  Private (reports.view)
router.get('/', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const includeInactive = req.query.includeInactive === 'true';

  const schedules = await scheduledReportService.getSchedulesForCompany(companyId, includeInactive);

  res.json({
    success: true,
    count: schedules.length,
    schedules
  });
}));

// @route   GET /api/scheduled-reports/types/available
// @desc    Get available report types
// @access  Private
// NOTE: This route MUST be before /:id to prevent Express from matching '/types/available' as an ID
router.get('/types/available', asyncHandler(async (req, res) => {
  const reportTypes = [
    {
      value: 'dqf',
      label: 'Driver Qualification Files',
      description: 'Comprehensive driver compliance status including CDL, medical cards, and MVR data'
    },
    {
      value: 'vehicle-maintenance',
      label: 'Vehicle Maintenance',
      description: 'Fleet overview with inspection dates, maintenance logs, and compliance status'
    },
    {
      value: 'violations',
      label: 'Violations Summary',
      description: 'Violation history by BASIC category with DataQ challenge status'
    },
    {
      value: 'audit',
      label: 'Comprehensive Audit',
      description: 'Full compliance audit including drivers, vehicles, violations, and drug testing'
    },
    {
      value: 'csa',
      label: 'CSA/SMS BASICs',
      description: 'Current SMS BASIC percentiles with inspection and crash statistics'
    }
  ];

  res.json({
    success: true,
    reportTypes
  });
}));

// @route   GET /api/scheduled-reports/:id
// @desc    Get a specific scheduled report
// @access  Private (reports.view)
router.get('/:id', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const schedule = await scheduledReportService.getSchedule(req.params.id, companyId);

  if (!schedule) {
    throw new AppError('Scheduled report not found', 404);
  }

  res.json({
    success: true,
    schedule
  });
}));

// @route   POST /api/scheduled-reports
// @desc    Create a new scheduled report
// @access  Private (reports.create)
router.post('/', checkPermission('reports', 'create'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const userId = req.user._id;

  const {
    reportType,
    reportName,
    frequency,
    dayOfWeek,
    dayOfMonth,
    time,
    timezone,
    recipients,
    format,
    filters
  } = req.body;

  // Validate required fields
  if (!reportType) {
    throw new AppError('Report type is required', 400);
  }

  const validTypes = ['dqf', 'vehicle-maintenance', 'violations', 'audit', 'csa'];
  if (!validTypes.includes(reportType)) {
    throw new AppError(`Invalid report type. Valid types: ${validTypes.join(', ')}`, 400);
  }

  if (!frequency) {
    throw new AppError('Frequency is required', 400);
  }

  const validFrequencies = ['daily', 'weekly', 'monthly'];
  if (!validFrequencies.includes(frequency)) {
    throw new AppError(`Invalid frequency. Valid options: ${validFrequencies.join(', ')}`, 400);
  }

  // Validate recipients
  if (recipients && !Array.isArray(recipients)) {
    throw new AppError('Recipients must be an array of email addresses', 400);
  }

  const schedule = await scheduledReportService.createSchedule(userId, companyId, {
    reportType,
    reportName,
    frequency,
    dayOfWeek,
    dayOfMonth,
    time,
    timezone,
    recipients: recipients || [req.user.email],
    format,
    filters
  });

  res.status(201).json({
    success: true,
    message: 'Scheduled report created',
    schedule
  });
}));

// @route   PUT /api/scheduled-reports/:id
// @desc    Update a scheduled report
// @access  Private (reports.edit)
router.put('/:id', checkPermission('reports', 'edit'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const schedule = await scheduledReportService.updateSchedule(
    req.params.id,
    companyId,
    req.body
  );

  if (!schedule) {
    throw new AppError('Scheduled report not found', 404);
  }

  res.json({
    success: true,
    message: 'Scheduled report updated',
    schedule
  });
}));

// @route   DELETE /api/scheduled-reports/:id
// @desc    Delete a scheduled report (soft delete)
// @access  Private (reports.delete)
router.delete('/:id', checkPermission('reports', 'delete'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const permanent = req.query.permanent === 'true';

  let success;
  if (permanent) {
    success = await scheduledReportService.hardDeleteSchedule(req.params.id, companyId);
  } else {
    success = await scheduledReportService.deleteSchedule(req.params.id, companyId);
  }

  if (!success) {
    throw new AppError('Scheduled report not found', 404);
  }

  res.json({
    success: true,
    message: permanent ? 'Scheduled report permanently deleted' : 'Scheduled report deactivated'
  });
}));

// @route   POST /api/scheduled-reports/:id/run
// @desc    Run a scheduled report immediately
// @access  Private (reports.export)
router.post('/:id/run', checkPermission('reports', 'export'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const result = await scheduledReportService.runScheduledReport(req.params.id, companyId);

  if (!result.success) {
    throw new AppError(`Report generation failed: ${result.error}`, 500);
  }

  res.json({
    success: true,
    message: 'Report generated and sent',
    result
  });
}));

// @route   POST /api/scheduled-reports/:id/toggle
// @desc    Toggle active status of a scheduled report
// @access  Private (reports.edit)
router.post('/:id/toggle', checkPermission('reports', 'edit'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const schedule = await ScheduledReport.findOne({ _id: req.params.id, companyId });

  if (!schedule) {
    throw new AppError('Scheduled report not found', 404);
  }

  schedule.isActive = !schedule.isActive;
  schedule.nextRun = schedule.calculateNextRun();
  await schedule.save();

  res.json({
    success: true,
    message: schedule.isActive ? 'Scheduled report activated' : 'Scheduled report paused',
    isActive: schedule.isActive,
    nextRun: schedule.nextRun
  });
}));

module.exports = router;
