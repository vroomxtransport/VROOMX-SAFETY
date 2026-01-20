const express = require('express');
const router = express.Router();
const { Driver, Vehicle, Violation, DrugAlcoholTest, Document, Accident, Company } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/reports/dqf
// @desc    Generate Driver Qualification File report
// @access  Private
router.get('/dqf', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverId, format = 'json' } = req.query;
  const companyId = req.user.companyId._id || req.user.companyId;

  const query = { companyId, status: 'active' };
  if (driverId) query._id = driverId;

  const drivers = await Driver.find(query).select('-ssn');
  const company = await Company.findById(companyId);

  if (format === 'pdf') {
    return res.status(400).json({
      success: false,
      message: 'PDF export is not available in the current deployment. Please use JSON format.'
    });
  }

  return res.json({
    success: true,
    report: {
      type: 'Driver Qualification Files',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      drivers: drivers.map(d => ({
        name: `${d.firstName} ${d.lastName}`,
        employeeId: d.employeeId,
        cdl: {
          number: d.cdl?.number,
          state: d.cdl?.state,
          class: d.cdl?.class,
          expiry: d.cdl?.expiryDate,
          status: d.complianceStatus?.cdlStatus
        },
        medicalCard: {
          expiry: d.medicalCard?.expiryDate,
          status: d.complianceStatus?.medicalStatus
        },
        mvrStatus: d.complianceStatus?.mvrStatus,
        clearinghouseStatus: d.complianceStatus?.clearinghouseStatus,
        overallStatus: d.complianceStatus?.overall,
        documents: {
          employmentApplication: !!d.documents?.employmentApplication?.complete,
          roadTest: !!d.documents?.roadTest?.result,
          mvrReviews: d.documents?.mvrReviews?.length || 0
        }
      }))
    }
  });
}));

// @route   GET /api/reports/vehicle-maintenance
// @desc    Generate Vehicle Maintenance report
// @access  Private
router.get('/vehicle-maintenance', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { vehicleId, startDate, endDate, format = 'json' } = req.query;
  const companyId = req.user.companyId._id || req.user.companyId;

  const query = { companyId };
  if (vehicleId) query._id = vehicleId;

  const vehicles = await Vehicle.find(query);
  const company = await Company.findById(companyId);

  if (format === 'pdf') {
    return res.status(400).json({
      success: false,
      message: 'PDF export is not available in the current deployment. Please use JSON format.'
    });
  }

  return res.json({
    success: true,
    report: {
      type: 'Vehicle Maintenance',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      vehicles: vehicles.map(v => ({
        unitNumber: v.unitNumber,
        vin: v.vin,
        type: v.vehicleType,
        status: v.status,
        annualInspection: {
          lastDate: v.annualInspection?.lastInspectionDate,
          nextDue: v.annualInspection?.nextDueDate,
          status: v.complianceStatus?.inspectionStatus
        },
        maintenanceLog: v.maintenanceLog?.slice(-10) || []
      }))
    }
  });
}));

// @route   GET /api/reports/violations
// @desc    Generate Violations report
// @access  Private
router.get('/violations', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;
  const companyId = req.user.companyId._id || req.user.companyId;

  const query = { companyId };
  if (startDate || endDate) {
    query.violationDate = {};
    if (startDate) query.violationDate.$gte = new Date(startDate);
    if (endDate) query.violationDate.$lte = new Date(endDate);
  }

  const violations = await Violation.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('-violationDate');

  const company = await Company.findById(companyId);

  if (format === 'pdf') {
    return res.status(400).json({
      success: false,
      message: 'PDF export is not available in the current deployment. Please use JSON format.'
    });
  }

  return res.json({
    success: true,
    report: {
      type: 'Violations Summary',
      generatedAt: new Date(),
      dateRange: { start: startDate, end: endDate },
      company: { name: company.name, dotNumber: company.dotNumber },
      summary: {
        total: violations.length,
        byBasic: violations.reduce((acc, v) => {
          acc[v.basic] = (acc[v.basic] || 0) + 1;
          return acc;
        }, {}),
        byStatus: violations.reduce((acc, v) => {
          acc[v.status] = (acc[v.status] || 0) + 1;
          return acc;
        }, {})
      },
      violations: violations.map(v => ({
        date: v.violationDate,
        type: v.violationType,
        basic: v.basic,
        severity: v.severityWeight,
        driver: v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : null,
        vehicle: v.vehicleId?.unitNumber,
        status: v.status,
        dataQ: v.dataQChallenge?.submitted ? v.dataQChallenge.status : null
      }))
    }
  });
}));

// @route   GET /api/reports/audit
// @desc    Generate full audit report
// @access  Private
router.get('/audit', checkPermission('reports', 'export'), asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;
  const companyId = req.user.companyId._id || req.user.companyId;

  const [company, drivers, vehicles, violations, drugTests, documents] = await Promise.all([
    Company.findById(companyId),
    Driver.find({ companyId, status: 'active' }),
    Vehicle.find({ companyId, status: { $in: ['active', 'maintenance'] } }),
    Violation.find({ companyId }).sort('-violationDate').limit(50),
    DrugAlcoholTest.find({ companyId }).sort('-testDate').limit(50),
    Document.find({ companyId, isDeleted: false })
  ]);

  const auditData = {
    type: 'Comprehensive Audit Report',
    generatedAt: new Date(),
    company: {
      name: company.name,
      dotNumber: company.dotNumber,
      mcNumber: company.mcNumber,
      smsBasics: company.smsBasics
    },
    driverQualification: {
      totalActive: drivers.length,
      compliant: drivers.filter(d => d.complianceStatus.overall === 'compliant').length,
      withIssues: drivers.filter(d => d.complianceStatus.overall !== 'compliant').length
    },
    vehicles: {
      total: vehicles.length,
      compliant: vehicles.filter(v => v.complianceStatus.overall === 'compliant').length,
      needingAttention: vehicles.filter(v => v.complianceStatus.overall !== 'compliant').length
    },
    violations: {
      total: violations.length,
      open: violations.filter(v => v.status === 'open').length,
      disputed: violations.filter(v => v.status === 'dispute_in_progress').length
    },
    drugAlcohol: {
      totalTests: drugTests.length,
      byType: drugTests.reduce((acc, t) => {
        acc[t.testType] = (acc[t.testType] || 0) + 1;
        return acc;
      }, {})
    },
    documents: {
      total: documents.length,
      expiringSoon: documents.filter(d => d.status === 'due_soon').length,
      expired: documents.filter(d => d.status === 'expired').length
    }
  };

  if (format === 'pdf') {
    return res.status(400).json({
      success: false,
      message: 'PDF export is not available in the current deployment. Please use JSON format.'
    });
  }

  return res.json({ success: true, report: auditData });
}));

module.exports = router;
