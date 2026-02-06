const express = require('express');
const router = express.Router();
const BugReport = require('../models/BugReport');
const { protect, restrictToCompany } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// All routes require authentication
router.use(protect);
router.use(restrictToCompany);

// @route   POST /api/bug-reports
// @desc    Submit a bug report
// @access  Authenticated users
router.post('/', asyncHandler(async (req, res) => {
  const { subject, description, category, page } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ success: false, message: 'Subject and description are required' });
  }

  const bugReport = await BugReport.create({
    companyId: req.companyFilter?.companyId,
    userId: req.user._id,
    subject,
    description,
    category: category || 'bug',
    page
  });

  res.status(201).json({ success: true, bugReport });
}));

// @route   GET /api/bug-reports
// @desc    Get current user's own bug reports
// @access  Authenticated users
router.get('/', asyncHandler(async (req, res) => {
  const bugReports = await BugReport.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, bugReports });
}));

module.exports = router;
