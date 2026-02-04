const express = require('express');
const router = express.Router();
const { Driver, Vehicle, Violation, DrugAlcoholTest, Document, Accident, Company } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const pdf = require('../utils/pdfGenerator');
const emailService = require('../services/emailService');
const exportService = require('../services/exportService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/reports/dqf
// @desc    Generate Driver Qualification File report
// @access  Private
router.get('/dqf', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverId, format = 'json' } = req.query;
  const companyId = req.companyFilter.companyId;

  const query = { companyId, status: 'active' };
  if (driverId) query._id = driverId;

  const drivers = await Driver.find(query).select('-ssn');
  const company = await Company.findById(companyId);

  // CSV export
  if (format === 'csv') {
    const rows = drivers.map(d => ({
      driverName: `${d.firstName} ${d.lastName}`,
      employeeId: d.employeeId || '-',
      cdlNumber: d.cdl?.number || '-',
      cdlState: d.cdl?.state || '-',
      cdlExpiry: d.cdl?.expiryDate ? new Date(d.cdl.expiryDate).toLocaleDateString() : '-',
      medicalExpiry: d.medicalCard?.expiryDate ? new Date(d.medicalCard.expiryDate).toLocaleDateString() : '-',
      overallStatus: d.complianceStatus?.overall || '-'
    }));

    exportService.streamCSV(res, {
      reportType: 'dqf-report',
      headers: { driverName: 'Driver Name', employeeId: 'Employee ID', cdlNumber: 'CDL Number', cdlState: 'CDL State', cdlExpiry: 'CDL Expiry', medicalExpiry: 'Medical Expiry', overallStatus: 'Overall Status' },
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const rows = drivers.map(d => ({
      driverName: `${d.firstName} ${d.lastName}`,
      employeeId: d.employeeId || '-',
      cdlNumber: d.cdl?.number || '-',
      cdlState: d.cdl?.state || '-',
      cdlExpiry: d.cdl?.expiryDate ? new Date(d.cdl.expiryDate).toLocaleDateString() : '-',
      medicalExpiry: d.medicalCard?.expiryDate ? new Date(d.medicalCard.expiryDate).toLocaleDateString() : '-',
      overallStatus: d.complianceStatus?.overall || '-'
    }));

    await exportService.streamExcel(res, {
      reportType: 'dqf-report',
      sheetName: 'Driver Qualification Files',
      columns: [
        { header: 'Driver Name', key: 'driverName', width: 25 },
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'CDL Number', key: 'cdlNumber', width: 15 },
        { header: 'CDL State', key: 'cdlState', width: 15 },
        { header: 'CDL Expiry', key: 'cdlExpiry', width: 15 },
        { header: 'Medical Expiry', key: 'medicalExpiry', width: 15 },
        { header: 'Overall Status', key: 'overallStatus', width: 15 }
      ],
      rows
    });
    return;
  }

  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="driver-qualification-files.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Driver Qualification Files Report');

    // Summary
    const compliant = drivers.filter(d => d.complianceStatus?.overall === 'compliant').length;
    pdf.addSummaryBox(doc, 'Summary', [
      { value: drivers.length, label: 'Total Drivers' },
      { value: compliant, label: 'Compliant' },
      { value: drivers.length - compliant, label: 'Needs Attention' }
    ]);

    // Driver table
    pdf.addSectionTitle(doc, 'Driver Details');

    const headers = ['Driver Name', 'Employee ID', 'CDL Status', 'Medical Card', 'Overall Status'];
    const rows = drivers.map(d => [
      `${d.firstName} ${d.lastName}`,
      d.employeeId || '-',
      d.complianceStatus?.cdlStatus || '-',
      d.complianceStatus?.medicalStatus || '-',
      d.complianceStatus?.overall || '-'
    ]);

    pdf.addTable(doc, headers, rows, [120, 80, 100, 100, 100]);

    // Individual driver details
    drivers.forEach((d, index) => {
      if (index > 0 || drivers.length > 5) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }

      pdf.addSectionTitle(doc, `${d.firstName} ${d.lastName}`);

      pdf.addKeyValuePairs(doc, [
        ['Employee ID', d.employeeId],
        ['CDL Number', d.cdl?.number],
        ['CDL State', d.cdl?.state],
        ['CDL Class', d.cdl?.class],
        ['CDL Expiry', pdf.formatDate(d.cdl?.expiryDate)],
        ['Medical Card Expiry', pdf.formatDate(d.medicalCard?.expiryDate)],
        ['Hire Date', pdf.formatDate(d.hireDate)],
        ['Overall Status', d.complianceStatus?.overall]
      ]);
    });

    pdf.addFooter(doc);
    doc.end();
    return;
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
  const companyId = req.companyFilter.companyId;

  const query = { companyId };
  if (vehicleId) query._id = vehicleId;

  const vehicles = await Vehicle.find(query);
  const company = await Company.findById(companyId);

  // CSV export
  if (format === 'csv') {
    const rows = vehicles.map(v => ({
      unitNumber: v.unitNumber || '-',
      vehicleType: v.vehicleType || '-',
      vin: v.vin || '-',
      status: v.status || '-',
      nextInspection: v.annualInspection?.nextDueDate ? new Date(v.annualInspection.nextDueDate).toLocaleDateString() : '-',
      lastMaintenance: v.maintenanceLog?.length > 0 && v.maintenanceLog[v.maintenanceLog.length - 1]?.date
        ? new Date(v.maintenanceLog[v.maintenanceLog.length - 1].date).toLocaleDateString()
        : '-'
    }));

    exportService.streamCSV(res, {
      reportType: 'vehicle-maintenance-report',
      headers: { unitNumber: 'Unit Number', vehicleType: 'Vehicle Type', vin: 'VIN', status: 'Status', nextInspection: 'Next Inspection', lastMaintenance: 'Last Maintenance' },
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const rows = vehicles.map(v => ({
      unitNumber: v.unitNumber || '-',
      vehicleType: v.vehicleType || '-',
      vin: v.vin || '-',
      status: v.status || '-',
      nextInspection: v.annualInspection?.nextDueDate ? new Date(v.annualInspection.nextDueDate).toLocaleDateString() : '-',
      lastMaintenance: v.maintenanceLog?.length > 0 && v.maintenanceLog[v.maintenanceLog.length - 1]?.date
        ? new Date(v.maintenanceLog[v.maintenanceLog.length - 1].date).toLocaleDateString()
        : '-'
    }));

    await exportService.streamExcel(res, {
      reportType: 'vehicle-maintenance-report',
      sheetName: 'Vehicle Maintenance',
      columns: [
        { header: 'Unit Number', key: 'unitNumber', width: 12 },
        { header: 'Vehicle Type', key: 'vehicleType', width: 15 },
        { header: 'VIN', key: 'vin', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Next Inspection', key: 'nextInspection', width: 15 },
        { header: 'Last Maintenance', key: 'lastMaintenance', width: 15 }
      ],
      rows
    });
    return;
  }

  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="vehicle-maintenance-report.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Vehicle Maintenance Report');

    // Summary
    const compliant = vehicles.filter(v => v.complianceStatus?.overall === 'compliant').length;
    const inMaintenance = vehicles.filter(v => v.status === 'maintenance').length;

    pdf.addSummaryBox(doc, 'Summary', [
      { value: vehicles.length, label: 'Total Vehicles' },
      { value: compliant, label: 'Compliant' },
      { value: inMaintenance, label: 'In Maintenance' }
    ]);

    // Vehicle table
    pdf.addSectionTitle(doc, 'Fleet Overview');

    const headers = ['Unit #', 'Type', 'VIN', 'Status', 'Next Inspection'];
    const rows = vehicles.map(v => [
      v.unitNumber,
      v.vehicleType || '-',
      v.vin ? `...${v.vin.slice(-6)}` : '-',
      v.status || '-',
      pdf.formatDate(v.annualInspection?.nextDueDate)
    ]);

    pdf.addTable(doc, headers, rows, [70, 80, 80, 80, 100]);

    // Maintenance details per vehicle
    vehicles.forEach((v, index) => {
      const recentMaintenance = v.maintenanceLog?.slice(-5) || [];
      if (recentMaintenance.length > 0) {
        doc.moveDown(1);
        pdf.addSectionTitle(doc, `Unit ${v.unitNumber} - Recent Maintenance`);

        const maintHeaders = ['Date', 'Type', 'Description', 'Mileage'];
        const maintRows = recentMaintenance.map(m => [
          pdf.formatDate(m.date),
          m.maintenanceType || '-',
          m.description?.substring(0, 30) || '-',
          m.mileage || '-'
        ]);

        pdf.addTable(doc, maintHeaders, maintRows, [100, 100, 150, 80]);
      }
    });

    pdf.addFooter(doc);
    doc.end();
    return;
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
  const companyId = req.companyFilter.companyId;

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

  // CSV export
  if (format === 'csv') {
    const rows = violations.map(v => ({
      violationDate: v.violationDate ? new Date(v.violationDate).toLocaleDateString() : '-',
      violationType: v.violationType || '-',
      basic: v.basic || '-',
      severityWeight: v.severityWeight != null ? String(v.severityWeight) : '-',
      driverName: v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : '-',
      vehicleUnit: v.vehicleId?.unitNumber || '-',
      status: v.status || '-',
      dataQStatus: v.dataQChallenge?.submitted ? v.dataQChallenge.status : '-'
    }));

    exportService.streamCSV(res, {
      reportType: 'violations-report',
      headers: { violationDate: 'Date', violationType: 'Violation Type', basic: 'BASIC', severityWeight: 'Severity', driverName: 'Driver', vehicleUnit: 'Vehicle', status: 'Status', dataQStatus: 'DataQ Status' },
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const rows = violations.map(v => ({
      violationDate: v.violationDate ? new Date(v.violationDate).toLocaleDateString() : '-',
      violationType: v.violationType || '-',
      basic: v.basic || '-',
      severityWeight: v.severityWeight != null ? String(v.severityWeight) : '-',
      driverName: v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : '-',
      vehicleUnit: v.vehicleId?.unitNumber || '-',
      status: v.status || '-',
      dataQStatus: v.dataQChallenge?.submitted ? v.dataQChallenge.status : '-'
    }));

    await exportService.streamExcel(res, {
      reportType: 'violations-report',
      sheetName: 'Violations Summary',
      columns: [
        { header: 'Date', key: 'violationDate', width: 12 },
        { header: 'Violation Type', key: 'violationType', width: 25 },
        { header: 'BASIC', key: 'basic', width: 20 },
        { header: 'Severity', key: 'severityWeight', width: 10 },
        { header: 'Driver', key: 'driverName', width: 25 },
        { header: 'Vehicle', key: 'vehicleUnit', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'DataQ Status', key: 'dataQStatus', width: 15 }
      ],
      rows
    });
    return;
  }

  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="violations-report.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Violations Summary Report');

    // Date range info
    if (startDate || endDate) {
      doc.fontSize(10)
         .fillColor(pdf.COLORS.lightText)
         .text(`Date Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}`);
      doc.moveDown(1);
    }

    // Summary
    const open = violations.filter(v => v.status === 'open').length;
    const disputed = violations.filter(v => v.status === 'dispute_in_progress').length;

    pdf.addSummaryBox(doc, 'Summary', [
      { value: violations.length, label: 'Total Violations' },
      { value: open, label: 'Open' },
      { value: disputed, label: 'In Dispute' }
    ]);

    // By BASIC category
    pdf.addSectionTitle(doc, 'Violations by BASIC Category');
    const byBasic = violations.reduce((acc, v) => {
      acc[v.basic] = (acc[v.basic] || 0) + 1;
      return acc;
    }, {});

    const basicHeaders = ['BASIC Category', 'Count'];
    const basicRows = Object.entries(byBasic).map(([basic, count]) => [basic, count]);
    pdf.addTable(doc, basicHeaders, basicRows, [300, 100]);

    doc.moveDown(1);

    // Violations table
    pdf.addSectionTitle(doc, 'Violation Details');

    const headers = ['Date', 'Type', 'BASIC', 'Severity', 'Driver', 'Status'];
    const rows = violations.map(v => [
      pdf.formatDate(v.violationDate),
      v.violationType?.substring(0, 20) || '-',
      v.basic || '-',
      v.severityWeight || '-',
      v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : '-',
      v.status || '-'
    ]);

    pdf.addTable(doc, headers, rows, [70, 100, 70, 50, 100, 80]);

    pdf.addFooter(doc);
    doc.end();
    return;
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
  const companyId = req.companyFilter.companyId;

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

  // CSV export - flatten audit data into rows
  if (format === 'csv') {
    const rows = [
      { section: 'Company', metric: 'Name', value: company.name || '-' },
      { section: 'Company', metric: 'DOT Number', value: company.dotNumber || '-' },
      { section: 'Company', metric: 'MC Number', value: company.mcNumber || '-' },
      { section: 'Drivers', metric: 'Total Active', value: String(auditData.driverQualification.totalActive) },
      { section: 'Drivers', metric: 'Compliant', value: String(auditData.driverQualification.compliant) },
      { section: 'Drivers', metric: 'With Issues', value: String(auditData.driverQualification.withIssues) },
      { section: 'Vehicles', metric: 'Total', value: String(auditData.vehicles.total) },
      { section: 'Vehicles', metric: 'Compliant', value: String(auditData.vehicles.compliant) },
      { section: 'Vehicles', metric: 'Needs Attention', value: String(auditData.vehicles.needingAttention) },
      { section: 'Violations', metric: 'Total (Last 50)', value: String(auditData.violations.total) },
      { section: 'Violations', metric: 'Open', value: String(auditData.violations.open) },
      { section: 'Violations', metric: 'In Dispute', value: String(auditData.violations.disputed) },
      { section: 'Drug/Alcohol', metric: 'Total Tests', value: String(auditData.drugAlcohol.totalTests) },
      ...Object.entries(auditData.drugAlcohol.byType).map(([type, count]) => ({
        section: 'Drug/Alcohol',
        metric: `Tests - ${type}`,
        value: String(count)
      })),
      { section: 'Documents', metric: 'Total', value: String(auditData.documents.total) },
      { section: 'Documents', metric: 'Expiring Soon', value: String(auditData.documents.expiringSoon) },
      { section: 'Documents', metric: 'Expired', value: String(auditData.documents.expired) }
    ];

    exportService.streamCSV(res, {
      reportType: 'audit-report',
      headers: { section: 'Section', metric: 'Metric', value: 'Value' },
      rows
    });
    return;
  }

  // Excel export - flatten audit data into rows
  if (format === 'xlsx') {
    const rows = [
      { section: 'Company', metric: 'Name', value: company.name || '-' },
      { section: 'Company', metric: 'DOT Number', value: company.dotNumber || '-' },
      { section: 'Company', metric: 'MC Number', value: company.mcNumber || '-' },
      { section: 'Drivers', metric: 'Total Active', value: String(auditData.driverQualification.totalActive) },
      { section: 'Drivers', metric: 'Compliant', value: String(auditData.driverQualification.compliant) },
      { section: 'Drivers', metric: 'With Issues', value: String(auditData.driverQualification.withIssues) },
      { section: 'Vehicles', metric: 'Total', value: String(auditData.vehicles.total) },
      { section: 'Vehicles', metric: 'Compliant', value: String(auditData.vehicles.compliant) },
      { section: 'Vehicles', metric: 'Needs Attention', value: String(auditData.vehicles.needingAttention) },
      { section: 'Violations', metric: 'Total (Last 50)', value: String(auditData.violations.total) },
      { section: 'Violations', metric: 'Open', value: String(auditData.violations.open) },
      { section: 'Violations', metric: 'In Dispute', value: String(auditData.violations.disputed) },
      { section: 'Drug/Alcohol', metric: 'Total Tests', value: String(auditData.drugAlcohol.totalTests) },
      ...Object.entries(auditData.drugAlcohol.byType).map(([type, count]) => ({
        section: 'Drug/Alcohol',
        metric: `Tests - ${type}`,
        value: String(count)
      })),
      { section: 'Documents', metric: 'Total', value: String(auditData.documents.total) },
      { section: 'Documents', metric: 'Expiring Soon', value: String(auditData.documents.expiringSoon) },
      { section: 'Documents', metric: 'Expired', value: String(auditData.documents.expired) }
    ];

    await exportService.streamExcel(res, {
      reportType: 'audit-report',
      sheetName: 'Comprehensive Audit',
      columns: [
        { header: 'Section', key: 'section', width: 20 },
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 15 }
      ],
      rows
    });
    return;
  }

  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="comprehensive-audit-report.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Comprehensive Audit Report');

    // Company info
    pdf.addSectionTitle(doc, 'Company Information');
    pdf.addKeyValuePairs(doc, [
      ['Company Name', company.name],
      ['DOT Number', company.dotNumber],
      ['MC Number', company.mcNumber || 'N/A']
    ]);

    doc.moveDown(1);

    // Driver Qualification Summary
    pdf.addSectionTitle(doc, 'Driver Qualification Summary');
    pdf.addSummaryBox(doc, 'Drivers', [
      { value: auditData.driverQualification.totalActive, label: 'Active Drivers' },
      { value: auditData.driverQualification.compliant, label: 'Compliant' },
      { value: auditData.driverQualification.withIssues, label: 'Needs Attention' }
    ]);

    // Vehicle Summary
    pdf.addSectionTitle(doc, 'Vehicle Fleet Summary');
    pdf.addSummaryBox(doc, 'Vehicles', [
      { value: auditData.vehicles.total, label: 'Total Vehicles' },
      { value: auditData.vehicles.compliant, label: 'Compliant' },
      { value: auditData.vehicles.needingAttention, label: 'Needs Attention' }
    ]);

    // Violations Summary
    pdf.addSectionTitle(doc, 'Violations Summary');
    pdf.addSummaryBox(doc, 'Violations', [
      { value: auditData.violations.total, label: 'Total (Last 50)' },
      { value: auditData.violations.open, label: 'Open' },
      { value: auditData.violations.disputed, label: 'In Dispute' }
    ]);

    // Drug & Alcohol Testing
    doc.addPage();
    pdf.addSectionTitle(doc, 'Drug & Alcohol Testing');

    const testHeaders = ['Test Type', 'Count'];
    const testRows = Object.entries(auditData.drugAlcohol.byType).map(([type, count]) => [type, count]);
    if (testRows.length > 0) {
      pdf.addTable(doc, testHeaders, testRows, [200, 100]);
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No drug/alcohol tests recorded.');
    }

    doc.moveDown(1);

    // Documents Summary
    pdf.addSectionTitle(doc, 'Documents Summary');
    pdf.addSummaryBox(doc, 'Documents', [
      { value: auditData.documents.total, label: 'Total Documents' },
      { value: auditData.documents.expiringSoon, label: 'Expiring Soon' },
      { value: auditData.documents.expired, label: 'Expired' }
    ]);

    // SMS BASIC Scores if available
    if (company.smsBasics) {
      doc.moveDown(1);
      pdf.addSectionTitle(doc, 'SMS BASIC Scores');

      const basicHeaders = ['BASIC Category', 'Percentile'];
      const basicRows = Object.entries(company.smsBasics)
        .filter(([key, value]) => typeof value === 'number')
        .map(([basic, score]) => [basic.replace(/([A-Z])/g, ' $1').trim(), `${score}%`]);

      if (basicRows.length > 0) {
        pdf.addTable(doc, basicHeaders, basicRows, [200, 100]);
      }
    }

    pdf.addFooter(doc);
    doc.end();
    return;
  }

  return res.json({ success: true, report: auditData });
}));

// @route   POST /api/reports/:type/email
// @desc    Send a report to email
// @access  Private
router.post('/:type/email', protect, asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { email } = req.body;
  const toEmail = email || req.user.email;

  const validTypes = ['dqf', 'vehicle-maintenance', 'violations', 'audit'];
  if (!validTypes.includes(type)) {
    throw new AppError('Invalid report type', 400);
  }

  const reportNames = {
    'dqf': 'Driver Qualification File Report',
    'vehicle-maintenance': 'Vehicle Maintenance Report',
    'violations': 'Violations Report',
    'audit': 'Audit Report'
  };

  // For now, send a notification email (PDF generation to buffer can be added later)
  await emailService.sendReport(
    req.user,
    reportNames[type] || type,
    null, // PDF buffer - to be implemented with PDF-to-buffer refactor
    toEmail
  );

  res.json({ success: true, message: `Report notification sent to ${toEmail}` });
}));

module.exports = router;
