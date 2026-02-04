const express = require('express');
const router = express.Router();
const fs = require('fs');
const ReportHistory = require('../models/ReportHistory');
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.use(protect);
router.use(restrictToCompany);

// MIME types for report formats
const MIME_TYPES = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

// @route   GET /api/report-history
// @desc    Get paginated report history
// @access  Private
router.get('/', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { reportType, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyFilter.companyId };

  if (reportType) {
    query.reportType = reportType;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const history = await ReportHistory.find(query)
    .populate('generatedBy', 'firstName lastName')
    .sort({ generatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ReportHistory.countDocuments(query);

  res.json({
    success: true,
    history,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// @route   GET /api/report-history/:id
// @desc    Get single history record details
// @access  Private
router.get('/:id', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const history = await ReportHistory.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  })
    .populate('generatedBy', 'firstName lastName email')
    .populate('templateId', 'name reportType');

  if (!history) {
    throw new AppError('Report history not found', 404);
  }

  res.json({
    success: true,
    history
  });
}));

// @route   GET /api/report-history/:id/download
// @desc    Download previously generated report
// @access  Private
router.get('/:id/download', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const history = await ReportHistory.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!history) {
    throw new AppError('Report history not found', 404);
  }

  // Check if report has expired
  if (history.expiresAt < new Date()) {
    throw new AppError('Report has expired and is no longer available for download', 410);
  }

  // Check if file exists
  if (!fs.existsSync(history.filePath)) {
    throw new AppError('Report file not found on server', 404);
  }

  // Set headers for download
  const mimeType = MIME_TYPES[history.format] || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${history.fileName}"`);
  res.setHeader('Content-Length', history.fileSize);

  // Stream file to response
  const fileStream = fs.createReadStream(history.filePath);
  fileStream.pipe(res);
}));

module.exports = router;
