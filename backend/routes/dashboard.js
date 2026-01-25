const express = require('express');
const router = express.Router();
const { Driver, Vehicle, Violation, DrugAlcoholTest, Document, Accident, Company } = require('../models');
const Alert = require('../models/Alert');
const { protect, restrictToCompany } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { SMS_BASICS_THRESHOLDS, getComplianceStatus } = require('../config/fmcsaCompliance');
const alertService = require('../services/alertService');
const complianceScoreService = require('../services/complianceScoreService');
const fmcsaSyncService = require('../services/fmcsaSyncService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/dashboard
// @desc    Get comprehensive dashboard data
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for performance
  const [
    company,
    driverStats,
    vehicleStats,
    driversWithExpiringDocs,
    vehiclesDueForInspection,
    recentViolations,
    openDataQDisputes,
    drugTestStats,
    recentAccidents,
    documentStats
  ] = await Promise.all([
    // Company info with SMS BASICs
    Company.findById(companyId).select('name dotNumber smsBasics'),

    // Driver statistics
    Driver.aggregate([
      { $match: { companyId: companyId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          compliant: { $sum: { $cond: [{ $eq: ['$complianceStatus.overall', 'compliant'] }, 1, 0] } },
          warning: { $sum: { $cond: [{ $eq: ['$complianceStatus.overall', 'warning'] }, 1, 0] } },
          nonCompliant: { $sum: { $cond: [{ $eq: ['$complianceStatus.overall', 'non_compliant'] }, 1, 0] } }
        }
      }
    ]),

    // Vehicle statistics
    Vehicle.aggregate([
      { $match: { companyId: companyId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
          outOfService: { $sum: { $cond: [{ $eq: ['$status', 'out_of_service'] }, 1, 0] } }
        }
      }
    ]),

    // Drivers with expiring documents (next 30 days)
    Driver.countDocuments({
      companyId,
      status: 'active',
      $or: [
        { 'cdl.expiryDate': { $lte: thirtyDaysFromNow } },
        { 'medicalCard.expiryDate': { $lte: thirtyDaysFromNow } }
      ]
    }),

    // Vehicles due for inspection
    Vehicle.countDocuments({
      companyId,
      status: { $in: ['active', 'maintenance'] },
      'annualInspection.nextDueDate': { $lte: thirtyDaysFromNow }
    }),

    // Recent violations (last 90 days)
    Violation.find({
      companyId,
      violationDate: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
    })
      .populate('driverId', 'firstName lastName')
      .sort('-violationDate')
      .limit(5),

    // Open DataQ disputes
    Violation.countDocuments({
      companyId,
      'dataQChallenge.submitted': true,
      'dataQChallenge.status': { $in: ['pending', 'under_review'] }
    }),

    // Drug & Alcohol test stats (current year)
    DrugAlcoholTest.aggregate([
      {
        $match: {
          companyId,
          testDate: { $gte: new Date(now.getFullYear(), 0, 1) },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          random: { $sum: { $cond: [{ $eq: ['$testType', 'random'] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$overallResult', 'negative'] }, 1, 0] } }
        }
      }
    ]),

    // Recent accidents
    Accident.find({ companyId })
      .sort('-accidentDate')
      .limit(3)
      .select('accidentDate severity location.city location.state isDotRecordable'),

    // Document expiration stats
    Document.aggregate([
      { $match: { companyId, isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
          dueSoon: { $sum: { $cond: [{ $eq: ['$status', 'due_soon'] }, 1, 0] } }
        }
      }
    ])
  ]);

  // Process SMS BASICs data
  const basicsData = company?.smsBasics || {};
  const basicsWithStatus = {};

  Object.keys(SMS_BASICS_THRESHOLDS).forEach(key => {
    const percentile = basicsData[key];
    const threshold = SMS_BASICS_THRESHOLDS[key];
    basicsWithStatus[key] = {
      name: threshold.name,
      percentile: percentile || null,
      threshold: threshold.threshold,
      criticalThreshold: threshold.criticalThreshold,
      status: percentile ? getComplianceStatus(percentile, key) : 'no_data'
    };
  });

  // Build alerts array
  const alerts = [];

  // Driver document alerts
  const expiringDriverDocs = await Driver.find({
    companyId,
    status: 'active',
    $or: [
      { 'cdl.expiryDate': { $lte: thirtyDaysFromNow, $gte: now } },
      { 'medicalCard.expiryDate': { $lte: thirtyDaysFromNow, $gte: now } }
    ]
  }).select('firstName lastName cdl.expiryDate medicalCard.expiryDate').limit(5);

  expiringDriverDocs.forEach(driver => {
    const cdlDays = driver.cdl?.expiryDate ?
      Math.ceil((new Date(driver.cdl.expiryDate) - now) / (1000 * 60 * 60 * 24)) : null;
    const medDays = driver.medicalCard?.expiryDate ?
      Math.ceil((new Date(driver.medicalCard.expiryDate) - now) / (1000 * 60 * 60 * 24)) : null;

    if (cdlDays !== null && cdlDays <= 30) {
      alerts.push({
        type: cdlDays < 0 ? 'critical' : 'warning',
        category: 'driver',
        message: `CDL ${cdlDays < 0 ? 'Expired' : 'Expiring'} for ${driver.firstName} ${driver.lastName}`,
        daysRemaining: cdlDays,
        entityId: driver._id
      });
    }

    if (medDays !== null && medDays <= 30) {
      alerts.push({
        type: medDays < 0 ? 'critical' : 'warning',
        category: 'driver',
        message: `Medical Card ${medDays < 0 ? 'Expired' : 'Expiring'} for ${driver.firstName} ${driver.lastName}`,
        daysRemaining: medDays,
        entityId: driver._id
      });
    }
  });

  // Vehicle inspection alerts
  const vehiclesNeedingInspection = await Vehicle.find({
    companyId,
    status: { $in: ['active', 'maintenance'] },
    'annualInspection.nextDueDate': { $lte: thirtyDaysFromNow }
  }).select('unitNumber annualInspection.nextDueDate').limit(5);

  vehiclesNeedingInspection.forEach(vehicle => {
    const days = Math.ceil((new Date(vehicle.annualInspection.nextDueDate) - now) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: days < 0 ? 'critical' : 'warning',
      category: 'vehicle',
      message: `Annual Inspection ${days < 0 ? 'Overdue' : 'Due'} for ${vehicle.unitNumber}`,
      daysRemaining: days,
      entityId: vehicle._id
    });
  });

  // DataQ alerts
  if (openDataQDisputes > 0) {
    alerts.push({
      type: 'info',
      category: 'violation',
      message: `${openDataQDisputes} DataQ dispute(s) pending review`
    });
  }

  // BASIC threshold alerts
  Object.entries(basicsWithStatus).forEach(([key, data]) => {
    if (data.status === 'critical') {
      alerts.push({
        type: 'critical',
        category: 'basics',
        message: `${data.name} BASIC at ${data.percentile}% - Over Critical Threshold`
      });
    } else if (data.status === 'warning') {
      alerts.push({
        type: 'warning',
        category: 'basics',
        message: `${data.name} BASIC at ${data.percentile}% - Over Intervention Threshold`
      });
    }
  });

  res.json({
    success: true,
    dashboard: {
      company: {
        name: company?.name,
        dotNumber: company?.dotNumber
      },
      summary: {
        driversWithExpiringDocs,
        vehiclesDueForInspection,
        openDataQDisputes,
        randomDrugTests: {
          completed: drugTestStats[0]?.random || 0,
          total: drugTestStats[0]?.total || 0
        }
      },
      drivers: driverStats[0] || { total: 0, active: 0, compliant: 0, warning: 0, nonCompliant: 0 },
      vehicles: vehicleStats[0] || { total: 0, active: 0, maintenance: 0, outOfService: 0 },
      smsBasics: basicsWithStatus,
      recentViolations: recentViolations.map(v => ({
        id: v._id,
        date: v.violationDate,
        type: v.violationType,
        basic: v.basic,
        status: v.status,
        driver: v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : null
      })),
      recentAccidents: recentAccidents.map(a => ({
        id: a._id,
        date: a.accidentDate,
        severity: a.severity,
        location: a.location?.city && a.location?.state ? `${a.location.city}, ${a.location.state}` : 'Unknown',
        isDotRecordable: a.isDotRecordable
      })),
      documents: documentStats[0] || { total: 0, expired: 0, dueSoon: 0 },
      alerts: alerts.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 };
        return priority[a.type] - priority[b.type];
      }).slice(0, 10)
    }
  });
}));

// @route   PUT /api/dashboard/basics
// @desc    Update SMS BASICs percentiles
// @access  Private
router.put('/basics', asyncHandler(async (req, res) => {
  const { unsafeDriving, hoursOfService, vehicleMaintenance, controlledSubstances, driverFitness, crashIndicator } = req.body;

  const company = await Company.findByIdAndUpdate(
    req.user.companyId._id || req.user.companyId,
    {
      smsBasics: {
        unsafeDriving,
        hoursOfService,
        vehicleMaintenance,
        controlledSubstances,
        driverFitness,
        crashIndicator,
        lastUpdated: new Date()
      }
    },
    { new: true }
  );

  res.json({
    success: true,
    message: 'SMS BASICs updated',
    smsBasics: company.smsBasics
  });
}));

// @route   POST /api/dashboard/refresh-fmcsa
// @desc    Force refresh FMCSA data from SAFER (real CSA scores)
// @access  Private
router.post('/refresh-fmcsa', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;

  console.log('[Dashboard] Manual FMCSA refresh requested for company:', companyId);

  const smsBasics = await fmcsaSyncService.forceRefresh(companyId);

  if (!smsBasics) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch FMCSA data. Please try again later.'
    });
  }

  // Also return the updated fmcsaData
  const company = await Company.findById(companyId).select('smsBasics fmcsaData');

  res.json({
    success: true,
    message: 'FMCSA data refreshed successfully',
    smsBasics: company.smsBasics,
    fmcsaData: company.fmcsaData
  });
}));

// @route   GET /api/dashboard/fmcsa-status
// @desc    Get FMCSA data sync status
// @access  Private
router.get('/fmcsa-status', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const company = await Company.findById(companyId).select('smsBasics fmcsaData dotNumber');

  const isStale = await fmcsaSyncService.isDataStale(companyId);

  res.json({
    success: true,
    dotNumber: company?.dotNumber,
    lastUpdated: company?.smsBasics?.lastUpdated,
    isStale,
    smsBasics: company?.smsBasics,
    fmcsaData: company?.fmcsaData
  });
}));

// @route   GET /api/dashboard/audit-readiness
// @desc    Get audit readiness checklist
// @access  Private
router.get('/audit-readiness', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;

  // Check DQ files completeness
  const activeDrivers = await Driver.find({
    companyId,
    status: 'active'
  }).select('firstName lastName complianceStatus documents cdl medicalCard clearinghouse');

  const dqfIssues = [];
  activeDrivers.forEach(driver => {
    const issues = [];
    if (driver.complianceStatus.cdlStatus !== 'valid') issues.push('CDL');
    if (driver.complianceStatus.medicalStatus !== 'valid') issues.push('Medical Card');
    if (driver.complianceStatus.mvrStatus !== 'current') issues.push('MVR');
    if (driver.complianceStatus.clearinghouseStatus !== 'current') issues.push('Clearinghouse Query');
    if (!driver.documents?.employmentApplication?.complete) issues.push('Employment Application');
    if (!driver.documents?.roadTest?.result) issues.push('Road Test');

    if (issues.length > 0) {
      dqfIssues.push({
        driver: `${driver.firstName} ${driver.lastName}`,
        driverId: driver._id,
        missingItems: issues
      });
    }
  });

  // Check vehicle files
  const activeVehicles = await Vehicle.find({
    companyId,
    status: { $in: ['active', 'maintenance'] }
  }).select('unitNumber complianceStatus annualInspection registration');

  const vehicleIssues = [];
  activeVehicles.forEach(vehicle => {
    const issues = [];
    if (vehicle.complianceStatus.inspectionStatus !== 'current') issues.push('Annual Inspection');
    if (vehicle.complianceStatus.registrationStatus !== 'valid') issues.push('Registration');

    if (issues.length > 0) {
      vehicleIssues.push({
        vehicle: vehicle.unitNumber,
        vehicleId: vehicle._id,
        missingItems: issues
      });
    }
  });

  // Check Drug & Alcohol compliance
  const currentYear = new Date().getFullYear();
  const randomTests = await DrugAlcoholTest.countDocuments({
    companyId,
    testType: 'random',
    testDate: { $gte: new Date(currentYear, 0, 1) },
    status: 'completed'
  });

  const activeDriverCount = activeDrivers.length;
  const requiredRandomTests = Math.ceil(activeDriverCount * 0.5); // 50% drug test rate

  const drugAlcoholCompliant = randomTests >= requiredRandomTests;

  res.json({
    success: true,
    auditReadiness: {
      dqFiles: {
        compliant: dqfIssues.length === 0,
        totalDrivers: activeDrivers.length,
        driversWithIssues: dqfIssues.length,
        issues: dqfIssues
      },
      vehicleRecords: {
        compliant: vehicleIssues.length === 0,
        totalVehicles: activeVehicles.length,
        vehiclesWithIssues: vehicleIssues.length,
        issues: vehicleIssues
      },
      drugAlcohol: {
        compliant: drugAlcoholCompliant,
        randomTestsRequired: requiredRandomTests,
        randomTestsCompleted: randomTests
      },
      overallReadiness: dqfIssues.length === 0 && vehicleIssues.length === 0 && drugAlcoholCompliant
    }
  });
}));

// ============================================
// ALERTS ENDPOINTS
// ============================================

// @route   GET /api/dashboard/alerts
// @desc    Get all alerts with filtering
// @access  Private
router.get('/alerts', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const { type, category, status, page, limit } = req.query;

  const result = await alertService.getAlerts(companyId, {
    type,
    category,
    status: status || 'active',
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50
  });

  res.json({
    success: true,
    ...result
  });
}));

// @route   GET /api/dashboard/alerts/counts
// @desc    Get alert counts by type
// @access  Private
router.get('/alerts/counts', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const counts = await alertService.getAlertCounts(companyId);

  res.json({
    success: true,
    counts
  });
}));

// @route   GET /api/dashboard/alerts/audit-trail
// @desc    Get dismissed alerts for audit
// @access  Private
router.get('/alerts/audit-trail', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const { limit } = req.query;

  const dismissedAlerts = await alertService.getDismissedAlerts(
    companyId,
    parseInt(limit) || 100
  );

  res.json({
    success: true,
    dismissedAlerts
  });
}));

// @route   POST /api/dashboard/alerts/generate
// @desc    Generate/refresh alerts for the company
// @access  Private
router.post('/alerts/generate', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const result = await alertService.generateAlerts(companyId);

  res.json({
    success: true,
    message: `Generated ${result.created} new alerts, updated ${result.updated} existing`,
    ...result
  });
}));

// @route   PUT /api/dashboard/alerts/:id/dismiss
// @desc    Dismiss an alert
// @access  Private
router.put('/alerts/:id/dismiss', asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const alert = await alertService.dismissAlert(
    req.params.id,
    req.user._id,
    reason
  );

  res.json({
    success: true,
    message: 'Alert dismissed',
    alert
  });
}));

// @route   PUT /api/dashboard/alerts/:id/resolve
// @desc    Resolve an alert
// @access  Private
router.put('/alerts/:id/resolve', asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const alert = await alertService.resolveAlert(
    req.params.id,
    req.user._id,
    notes
  );

  res.json({
    success: true,
    message: 'Alert resolved',
    alert
  });
}));

// @route   GET /api/dashboard/alerts/grouped
// @desc    Get alerts grouped by type (critical, warning, info)
// @access  Private
router.get('/alerts/grouped', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const { status } = req.query;

  const result = await alertService.getAlerts(companyId, {
    status: status || 'active',
    limit: 100
  });

  res.json({
    success: true,
    grouped: result.grouped,
    counts: {
      critical: result.grouped.critical.length,
      warning: result.grouped.warning.length,
      info: result.grouped.info.length,
      total: result.total
    }
  });
}));

// @route   POST /api/dashboard/alerts/escalate
// @desc    Trigger alert escalation check
// @access  Private
router.post('/alerts/escalate', asyncHandler(async (req, res) => {
  const escalated = await alertService.escalateAlerts();

  res.json({
    success: true,
    message: `Escalated ${escalated} alert(s)`,
    escalatedCount: escalated
  });
}));

// @route   POST /api/dashboard/alerts/dismiss-bulk
// @desc    Dismiss multiple alerts at once
// @access  Private
router.post('/alerts/dismiss-bulk', asyncHandler(async (req, res) => {
  const { alertIds, reason } = req.body;

  if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'alertIds array is required'
    });
  }

  const results = await Promise.all(
    alertIds.map(id =>
      alertService.dismissAlert(id, req.user._id, reason || 'Bulk dismissed')
        .catch(err => ({ error: err.message, id }))
    )
  );

  const dismissed = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);

  res.json({
    success: true,
    message: `Dismissed ${dismissed.length} alert(s)`,
    dismissed: dismissed.length,
    failed: failed.length,
    errors: failed
  });
}));

// ============================================
// COMPLIANCE SCORE ENDPOINTS
// ============================================

// @route   GET /api/dashboard/compliance-score
// @desc    Get current compliance score with breakdown
// @access  Private
router.get('/compliance-score', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const score = await complianceScoreService.getScore(companyId);

  res.json({
    success: true,
    score
  });
}));

// @route   GET /api/dashboard/compliance-score/history
// @desc    Get compliance score history
// @access  Private
router.get('/compliance-score/history', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const { days } = req.query;

  const history = await complianceScoreService.getHistory(
    companyId,
    parseInt(days) || 30
  );

  res.json({
    success: true,
    history
  });
}));

// @route   GET /api/dashboard/compliance-score/breakdown
// @desc    Get detailed compliance score breakdown with recommendations
// @access  Private
router.get('/compliance-score/breakdown', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const breakdown = await complianceScoreService.getBreakdown(companyId);

  res.json({
    success: true,
    breakdown
  });
}));

// @route   POST /api/dashboard/compliance-score/calculate
// @desc    Force recalculate compliance score
// @access  Private
router.post('/compliance-score/calculate', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const score = await complianceScoreService.calculateScore(companyId);

  res.json({
    success: true,
    message: 'Compliance score calculated',
    score
  });
}));

module.exports = router;
