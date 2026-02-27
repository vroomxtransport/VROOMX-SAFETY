const express = require('express');
const router = express.Router();
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { requirePaidPlan } = require('../middleware/subscriptionLimits');
const { asyncHandler } = require('../middleware/errorHandler');
const dataqOutcomeService = require('../services/dataqOutcomeService');

router.use(protect);
router.use(restrictToCompany);
router.use(requirePaidPlan('DataQ Analytics'));

// GET /api/dataq-analytics/carrier - Carrier-level analytics
router.get('/carrier', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const analytics = await dataqOutcomeService.getCarrierAnalytics(req.companyFilter.companyId);
  res.json({ success: true, ...analytics });
}));

// GET /api/dataq-analytics/trends - Outcome trends over time
router.get('/trends', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { months = 12 } = req.query;
  const trends = await dataqOutcomeService.getOutcomeTrends(req.companyFilter.companyId, parseInt(months));
  res.json({ success: true, trends });
}));

// GET /api/dataq-analytics/monthly-report - Generate monthly report
router.get('/monthly-report', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();
  const report = await dataqOutcomeService.generateMonthlyReport(req.companyFilter.companyId, m, y);
  res.json({ success: true, report });
}));

// GET /api/dataq-analytics/triage-accuracy - Triage prediction accuracy
router.get('/triage-accuracy', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const accuracy = await dataqOutcomeService.getTriageAccuracy(req.companyFilter.companyId);
  res.json({ success: true, ...accuracy });
}));

module.exports = router;
