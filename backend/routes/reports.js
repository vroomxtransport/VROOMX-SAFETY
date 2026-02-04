const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Driver, Vehicle, Violation, DrugAlcoholTest, Document, Accident, Company, MaintenanceRecord } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const pdf = require('../utils/pdfGenerator');
const emailService = require('../services/emailService');
const exportService = require('../services/exportService');
const { addDays, startOfYear } = require('date-fns');
const { REPORT_FIELD_DEFINITIONS, validateFields } = require('../config/reportFieldDefinitions');

// Preview limit for preview endpoints
const PREVIEW_LIMIT = 10;

// Helper to filter row data to selected fields
const filterRowToFields = (row, selectedFields) => {
  if (!selectedFields) return row;
  const filtered = {};
  selectedFields.forEach(key => {
    if (row.hasOwnProperty(key)) filtered[key] = row[key];
  });
  return filtered;
};

// Helper to build export headers/columns from selected fields
const buildExportConfig = (reportType, selectedFields) => {
  const fieldDefs = REPORT_FIELD_DEFINITIONS[reportType]?.fields || [];
  const exportFields = selectedFields || fieldDefs.map(f => f.key);

  const headers = {};
  const columns = [];
  exportFields.forEach(key => {
    const def = fieldDefs.find(f => f.key === key);
    if (def) {
      headers[key] = def.label;
      columns.push({ header: def.label, key, width: 15 });
    }
  });
  return { headers, columns };
};

// Helper to parse and validate fields query parameter
const parseFieldsParam = (fieldsParam, reportType) => {
  if (!fieldsParam) return null; // null means return all fields
  const selectedFields = fieldsParam.split(',').map(f => f.trim()).filter(Boolean);
  const validation = validateFields(reportType, selectedFields);
  if (!validation.valid) {
    const error = validation.error || `Invalid fields: ${validation.invalidFields.join(', ')}`;
    throw new AppError(error, 400);
  }
  return selectedFields;
};

router.use(protect);
router.use(restrictToCompany);

// Helper to calculate employment verification status
const getEmploymentVerificationStatus = (verifications) => {
  if (!verifications || verifications.length === 0) return 'missing';
  const hasVerified = verifications.some(v => v.verified);
  return hasVerified ? 'complete' : 'pending';
};

// Helper to build DQF row data from driver document
const buildDqfRow = (d) => ({
  driverName: `${d.firstName} ${d.lastName}`,
  employeeId: d.employeeId || '-',
  cdlNumber: d.cdl?.number || '-',
  cdlState: d.cdl?.state || '-',
  cdlClass: d.cdl?.class || '-',
  cdlExpiry: d.cdl?.expiryDate ? new Date(d.cdl.expiryDate).toLocaleDateString() : '-',
  medicalExpiry: d.medicalCard?.expiryDate ? new Date(d.medicalCard.expiryDate).toLocaleDateString() : '-',
  overallStatus: d.complianceStatus?.overall || '-',
  clearinghouseQueryDate: d.clearinghouse?.lastQueryDate ? new Date(d.clearinghouse.lastQueryDate).toLocaleDateString() : '-',
  clearinghouseStatus: d.clearinghouse?.status || '-',
  mvrReviewDate: d.documents?.mvrReviews?.[0]?.reviewDate ? new Date(d.documents.mvrReviews[0].reviewDate).toLocaleDateString() : '-',
  mvrApproved: d.documents?.mvrReviews?.[0]?.approved != null ? (d.documents.mvrReviews[0].approved ? 'Yes' : 'No') : '-',
  employmentVerificationStatus: getEmploymentVerificationStatus(d.documents?.employmentVerification),
  roadTestDate: d.documents?.roadTest?.date ? new Date(d.documents.roadTest.date).toLocaleDateString() : '-',
  roadTestResult: d.documents?.roadTest?.result || (d.documents?.roadTest?.waived ? 'Waived' : '-')
});

// @route   GET /api/reports/dqf
// @desc    Generate Driver Qualification File report
// @access  Private
router.get('/dqf', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverId, driverIds, startDate, endDate, complianceStatus, format = 'json', fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'dqf');

  const query = { companyId, status: 'active' };

  // Multi-select driver filter (takes precedence over single driverId)
  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      query._id = { $in: ids };
    }
  } else if (driverId) {
    query._id = driverId;
  }

  // Compliance status filter
  if (complianceStatus) {
    query['complianceStatus.overall'] = complianceStatus;
  }

  // Date range filter on hireDate
  if (startDate || endDate) {
    query.hireDate = {};
    if (startDate) query.hireDate.$gte = new Date(startDate);
    if (endDate) query.hireDate.$lte = new Date(endDate);
  }

  const drivers = await Driver.find(query).select('-ssn').sort({ lastName: 1, firstName: 1 });
  const company = await Company.findById(companyId);

  // Build rows and filter to selected fields
  const allRows = drivers.map(buildDqfRow);
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('dqf', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'dqf-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('dqf', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'dqf-report',
      sheetName: 'Driver Qualification Files',
      columns,
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

      // 391.51 Compliance section
      doc.moveDown(0.5);
      pdf.addSectionTitle(doc, '49 CFR 391.51 Compliance');
      pdf.addKeyValuePairs(doc, [
        ['Clearinghouse Query Date', pdf.formatDate(d.clearinghouse?.lastQueryDate)],
        ['Clearinghouse Query Type', d.clearinghouse?.queryType || '-'],
        ['Clearinghouse Status', d.clearinghouse?.status || '-'],
        ['MVR Review Date', pdf.formatDate(d.documents?.mvrReviews?.[0]?.reviewDate)],
        ['MVR Reviewer', d.documents?.mvrReviews?.[0]?.reviewerName || '-'],
        ['MVR Approved', d.documents?.mvrReviews?.[0]?.approved != null ? (d.documents.mvrReviews[0].approved ? 'Yes' : 'No') : '-'],
        ['Employment Verification', getEmploymentVerificationStatus(d.documents?.employmentVerification)],
        ['Application Received', pdf.formatDate(d.documents?.employmentApplication?.dateReceived)],
        ['Application Complete', d.documents?.employmentApplication?.complete ? 'Yes' : 'No'],
        ['Road Test Date', pdf.formatDate(d.documents?.roadTest?.date)],
        ['Road Test Result', d.documents?.roadTest?.result || (d.documents?.roadTest?.waived ? 'Waived' : '-')]
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
        },
        // 391.51 Compliance fields
        clearinghouseQueryDate: d.clearinghouse?.lastQueryDate || null,
        clearinghouseQueryType: d.clearinghouse?.queryType || null,
        mvrReviewDate: d.documents?.mvrReviews?.[0]?.reviewDate || null,
        mvrReviewerName: d.documents?.mvrReviews?.[0]?.reviewerName || null,
        mvrApproved: d.documents?.mvrReviews?.[0]?.approved ?? null,
        employmentVerificationStatus: getEmploymentVerificationStatus(d.documents?.employmentVerification),
        employmentApplicationReceived: d.documents?.employmentApplication?.dateReceived || null,
        employmentApplicationComplete: d.documents?.employmentApplication?.complete ?? false,
        roadTestDate: d.documents?.roadTest?.date || null,
        roadTestResult: d.documents?.roadTest?.result || null,
        roadTestWaived: d.documents?.roadTest?.waived ?? false
      }))
    }
  });
}));

// Helper to build document expiration row
const buildDocExpirationRow = (doc, now) => {
  const expiryDate = new Date(doc.expiryDate);
  const daysUntil = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  let urgency = 'Within 90 Days';
  if (daysUntil < 0) urgency = 'Expired';
  else if (daysUntil <= 30) urgency = 'Within 30 Days';
  else if (daysUntil <= 60) urgency = 'Within 60 Days';

  const entityName = doc.driverId
    ? `${doc.driverId.firstName} ${doc.driverId.lastName}`
    : (doc.vehicleId?.unitNumber || '-');
  const entityType = doc.driverId ? 'Driver' : (doc.vehicleId ? 'Vehicle' : '-');

  return {
    documentType: doc.documentType || '-',
    entityName,
    entityType,
    expirationDate: expiryDate.toLocaleDateString(),
    daysUntilExpiry: daysUntil,
    urgency
  };
};

// @route   GET /api/reports/document-expiration
// @desc    Generate Document Expiration report grouped by urgency window
// @access  Private
router.get('/document-expiration', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { format = 'json', driverIds, vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'document-expiration');

  const now = new Date();
  const thirtyDays = addDays(now, 30);
  const sixtyDays = addDays(now, 60);
  const ninetyDays = addDays(now, 90);

  const query = {
    companyId,
    isDeleted: false,
    expiryDate: { $exists: true, $lte: ninetyDays }
  };

  // Multi-select driver filter
  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      query.driverId = { $in: ids };
    }
  }

  // Multi-select vehicle filter
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      query.vehicleId = { $in: ids };
    }
  }

  const documents = await Document.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('expiryDate')
    .lean();

  const company = await Company.findById(companyId);

  // Group documents into exclusive windows
  const expired = [];
  const within30Days = [];
  const within60Days = [];
  const within90Days = [];

  documents.forEach(doc => {
    const expiryDate = new Date(doc.expiryDate);
    if (expiryDate < now) {
      expired.push(doc);
    } else if (expiryDate <= thirtyDays) {
      within30Days.push(doc);
    } else if (expiryDate <= sixtyDays) {
      within60Days.push(doc);
    } else {
      within90Days.push(doc);
    }
  });

  // Helper to map document for output (legacy format for JSON/PDF)
  const mapDocument = (doc) => ({
    documentType: doc.documentType,
    category: doc.category,
    name: doc.name,
    expiryDate: doc.expiryDate,
    driverName: doc.driverId ? `${doc.driverId.firstName} ${doc.driverId.lastName}` : null,
    vehicleUnit: doc.vehicleId?.unitNumber || null
  });

  // Build flat rows for export (using field definitions format)
  const allRows = documents.map(doc => buildDocExpirationRow(doc, now));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('document-expiration', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'document-expiration-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('document-expiration', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'document-expiration-report',
      sheetName: 'Document Expiration',
      columns,
      rows
    });
    return;
  }

  // PDF export
  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document-expiration-report.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Document Expiration Report');

    // Summary box
    pdf.addSummaryBox(doc, 'Summary', [
      { value: expired.length, label: 'Expired' },
      { value: within30Days.length, label: 'Within 30 Days' },
      { value: within60Days.length, label: 'Within 60 Days' },
      { value: within90Days.length, label: 'Within 90 Days' }
    ]);

    const tableHeaders = ['Document Type', 'Name', 'Expiry Date', 'Driver', 'Vehicle'];
    const colWidths = [100, 120, 90, 100, 80];

    // Helper to add section with documents
    const addSection = (title, docs, color = pdf.COLORS.primary) => {
      if (docs.length === 0) return;

      doc.moveDown(1);
      doc.fontSize(12).fillColor(color).text(title, { underline: true });
      doc.moveDown(0.5);

      const rows = docs.map(d => [
        d.documentType || '-',
        (d.name || '-').substring(0, 25),
        pdf.formatDate(d.expiryDate),
        d.driverId ? `${d.driverId.firstName} ${d.driverId.lastName}` : '-',
        d.vehicleId?.unitNumber || '-'
      ]);

      pdf.addTable(doc, tableHeaders, rows, colWidths);
    };

    // Add sections - expired in red
    addSection(`Expired (${expired.length})`, expired, '#dc2626');
    addSection(`Within 30 Days (${within30Days.length})`, within30Days, '#ea580c');
    addSection(`Within 60 Days (${within60Days.length})`, within60Days, '#ca8a04');
    addSection(`Within 90 Days (${within90Days.length})`, within90Days, pdf.COLORS.primary);

    pdf.addFooter(doc);
    doc.end();
    return;
  }

  // JSON response
  return res.json({
    success: true,
    report: {
      type: 'Document Expiration Report',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      summary: {
        expired: expired.length,
        within30Days: within30Days.length,
        within60Days: within60Days.length,
        within90Days: within90Days.length,
        total: documents.length
      },
      documents: {
        expired: expired.map(mapDocument),
        within30Days: within30Days.map(mapDocument),
        within60Days: within60Days.map(mapDocument),
        within90Days: within90Days.map(mapDocument)
      }
    }
  });
}));

// Helper to build drug/alcohol test row
const buildDrugAlcoholRow = (t) => ({
  driverName: t.driverId ? `${t.driverId.firstName} ${t.driverId.lastName}` : '-',
  testType: t.testType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-',
  testDate: t.testDate ? new Date(t.testDate).toLocaleDateString() : '-',
  result: t.overallResult || '-',
  randomPoolIncluded: t.testType === 'random' ? 'Yes' : 'No',
  clearinghouseStatus: t.clearinghouseReported ? 'Reported' : 'Not Reported'
});

// @route   GET /api/reports/drug-alcohol-summary
// @desc    Generate Drug & Alcohol testing compliance summary
// @access  Private
router.get('/drug-alcohol-summary', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'drug-alcohol');

  // Default to calendar year for random testing compliance
  const yearStart = startDate ? new Date(startDate) : startOfYear(new Date());
  const yearEnd = endDate ? new Date(endDate) : new Date();

  const [activeDrivers, tests, company] = await Promise.all([
    Driver.countDocuments({ companyId, status: 'active' }),
    DrugAlcoholTest.find({
      companyId,
      testDate: { $gte: yearStart, $lte: yearEnd }
    }).populate('driverId', 'firstName lastName').sort({ testDate: -1 }).lean(),
    Company.findById(companyId)
  ]);

  // Calculate random test compliance
  const randomDrugTests = tests.filter(t =>
    t.testType === 'random' && t.drugTest?.performed
  );
  const randomAlcoholTests = tests.filter(t =>
    t.testType === 'random' && t.alcoholTest?.performed
  );

  // FMCSA 2026 requirements: 50% drug, 10% alcohol
  const requiredDrugTests = Math.ceil(activeDrivers * 0.50);
  const requiredAlcoholTests = Math.ceil(activeDrivers * 0.10);

  // Guard against division by zero
  const drugCompliancePercent = requiredDrugTests > 0
    ? Math.round((randomDrugTests.length / requiredDrugTests) * 100)
    : 100;
  const alcoholCompliancePercent = requiredAlcoholTests > 0
    ? Math.round((randomAlcoholTests.length / requiredAlcoholTests) * 100)
    : 100;

  // Group tests by type
  const byType = tests.reduce((acc, t) => {
    acc[t.testType] = acc[t.testType] || { total: 0, negative: 0, positive: 0, pending: 0, refused: 0, cancelled: 0 };
    acc[t.testType].total++;
    if (t.overallResult && acc[t.testType][t.overallResult] !== undefined) {
      acc[t.testType][t.overallResult]++;
    }
    return acc;
  }, {});

  // Build test record rows (for field filtering mode)
  const allRows = tests.map(buildDrugAlcoholRow);
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('drug-alcohol', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'drug-alcohol-summary',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('drug-alcohol', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'drug-alcohol-summary',
      sheetName: 'Drug & Alcohol Summary',
      columns,
      rows
    });
    return;
  }

  // PDF export
  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="drug-alcohol-summary.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Drug & Alcohol Summary Report');

    // Date range
    doc.fontSize(10)
       .fillColor(pdf.COLORS.lightText)
       .text(`Report Period: ${yearStart.toLocaleDateString()} to ${yearEnd.toLocaleDateString()}`);
    doc.moveDown(1);

    // Summary box
    pdf.addSummaryBox(doc, 'Overview', [
      { value: activeDrivers, label: 'Active Drivers' },
      { value: tests.length, label: 'Total Tests' }
    ]);

    // Random Pool Compliance Section
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Random Pool Compliance (49 CFR 382)');

    // Drug compliance
    const drugColor = drugCompliancePercent >= 100 ? '#16a34a' : '#dc2626';
    doc.fontSize(11).fillColor(pdf.COLORS.text)
       .text(`Drug Testing (50% Requirement):`, { continued: false });
    doc.fontSize(10).fillColor(pdf.COLORS.lightText)
       .text(`   Required: ${requiredDrugTests} tests | Completed: ${randomDrugTests.length} tests`);
    doc.fontSize(12).fillColor(drugColor)
       .text(`   Compliance: ${drugCompliancePercent}%`);
    doc.moveDown(0.5);

    // Alcohol compliance
    const alcoholColor = alcoholCompliancePercent >= 100 ? '#16a34a' : '#dc2626';
    doc.fontSize(11).fillColor(pdf.COLORS.text)
       .text(`Alcohol Testing (10% Requirement):`, { continued: false });
    doc.fontSize(10).fillColor(pdf.COLORS.lightText)
       .text(`   Required: ${requiredAlcoholTests} tests | Completed: ${randomAlcoholTests.length} tests`);
    doc.fontSize(12).fillColor(alcoholColor)
       .text(`   Compliance: ${alcoholCompliancePercent}%`);
    doc.moveDown(1);

    // Tests by Type
    pdf.addSectionTitle(doc, 'Tests by Type');
    const typeHeaders = ['Test Type', 'Total', 'Negative', 'Positive', 'Pending'];
    const typeRows = Object.entries(byType).map(([type, stats]) => [
      type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      stats.total,
      stats.negative,
      stats.positive,
      stats.pending
    ]);
    if (typeRows.length > 0) {
      pdf.addTable(doc, typeHeaders, typeRows, [120, 60, 70, 70, 70]);
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No tests recorded in this period.');
    }

    // Recent tests (last 20)
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Recent Tests');
    const recentTests = tests.slice(-20).reverse();
    if (recentTests.length > 0) {
      const recentHeaders = ['Date', 'Driver', 'Type', 'Result'];
      const recentRows = recentTests.map(t => [
        pdf.formatDate(t.testDate),
        t.driverId ? `${t.driverId.firstName} ${t.driverId.lastName}` : '-',
        t.testType?.replace(/_/g, ' ') || '-',
        t.overallResult || '-'
      ]);
      pdf.addTable(doc, recentHeaders, recentRows, [80, 150, 100, 80]);
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No tests recorded.');
    }

    pdf.addFooter(doc);
    doc.end();
    return;
  }

  // JSON response
  return res.json({
    success: true,
    report: {
      type: 'Drug & Alcohol Summary',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      period: { start: yearStart, end: yearEnd },
      summary: {
        activeDrivers,
        totalTests: tests.length
      },
      randomPoolCompliance: {
        drug: {
          required: requiredDrugTests,
          completed: randomDrugTests.length,
          compliancePercent: drugCompliancePercent,
          isCompliant: drugCompliancePercent >= 100
        },
        alcohol: {
          required: requiredAlcoholTests,
          completed: randomAlcoholTests.length,
          compliancePercent: alcoholCompliancePercent,
          isCompliant: alcoholCompliancePercent >= 100
        }
      },
      testsByType: byType,
      recentTests: tests.slice(-20).map(t => ({
        date: t.testDate,
        driverName: t.driverId ? `${t.driverId.firstName} ${t.driverId.lastName}` : null,
        testType: t.testType,
        overallResult: t.overallResult
      }))
    }
  });
}));

// Helper to build DataQ history row
const buildDataQRow = (v) => ({
  caseNumber: v.dataQChallenge.caseNumber || '-',
  submittedDate: v.dataQChallenge.submissionDate ? new Date(v.dataQChallenge.submissionDate).toLocaleDateString() : '-',
  violationCode: v.violationCode || '-',
  basic: v.basic || '-',
  originalSeverity: v.severityWeight != null ? v.severityWeight : '-',
  status: v.dataQChallenge.status || '-',
  resolvedDate: v.dataQChallenge.responseDate ? new Date(v.dataQChallenge.responseDate).toLocaleDateString() : '-',
  outcome: v.dataQChallenge.status === 'accepted' ? 'Accepted' : (v.dataQChallenge.status === 'denied' ? 'Denied' : '-'),
  pointsSaved: v.dataQChallenge.status === 'accepted' ? (v.severityWeight || 0) : 0
});

// @route   GET /api/reports/dataq-history
// @desc    Generate DataQ Challenge History report with success rates and CSA points saved
// @access  Private
router.get('/dataq-history', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate, driverIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'dataq-history');

  // Query violations with DataQ challenges submitted
  const query = {
    companyId,
    'dataQChallenge.submitted': true
  };

  if (startDate || endDate) {
    query['dataQChallenge.submissionDate'] = {};
    if (startDate) query['dataQChallenge.submissionDate'].$gte = new Date(startDate);
    if (endDate) query['dataQChallenge.submissionDate'].$lte = new Date(endDate);
  }

  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) query.driverId = { $in: ids };
  }

  const [violations, company] = await Promise.all([
    Violation.find(query)
      .populate('driverId', 'firstName lastName')
      .sort('-dataQChallenge.submissionDate')
      .lean(),
    Company.findById(companyId)
  ]);

  // Map challenges and calculate metrics
  const challenges = violations.map(v => ({
    inspectionNumber: v.inspectionNumber,
    violationType: v.violationType,
    violationCode: v.violationCode,
    violationDate: v.violationDate,
    basic: v.basic,
    severityWeight: v.severityWeight,
    submissionDate: v.dataQChallenge.submissionDate,
    caseNumber: v.dataQChallenge.caseNumber,
    challengeType: v.dataQChallenge.challengeType,
    status: v.dataQChallenge.status,
    responseDate: v.dataQChallenge.responseDate,
    driverName: v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : null,
    csaPointsSaved: v.dataQChallenge.status === 'accepted' ? (v.severityWeight || 0) : 0
  }));

  const accepted = challenges.filter(c => c.status === 'accepted');
  const denied = challenges.filter(c => c.status === 'denied');
  const pending = challenges.filter(c => ['pending', 'under_review'].includes(c.status));
  const withdrawn = challenges.filter(c => c.status === 'withdrawn');

  // Success rate: accepted / (accepted + denied) - exclude pending/withdrawn
  const resolved = accepted.length + denied.length;
  const successRate = resolved > 0 ? Math.round((accepted.length / resolved) * 100) : 0;
  const totalCsaPointsSaved = challenges.reduce((sum, c) => sum + c.csaPointsSaved, 0);

  // Build rows using field definitions format
  const allRows = violations.map(buildDataQRow);
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('dataq-history', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'dataq-history-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('dataq-history', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'dataq-history-report',
      sheetName: 'DataQ Challenge History',
      columns,
      rows
    });
    return;
  }

  // PDF export
  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="dataq-challenge-history.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'DataQ Challenge History Report');

    // Summary box
    pdf.addSummaryBox(doc, 'Summary', [
      { value: challenges.length, label: 'Total Submissions' },
      { value: accepted.length, label: 'Accepted' },
      { value: `${successRate}%`, label: 'Success Rate' },
      { value: totalCsaPointsSaved, label: 'Est. CSA Points Saved' }
    ]);

    // Status breakdown
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Challenge Status Breakdown');
    const statusHeaders = ['Status', 'Count'];
    const statusRows = [
      ['Accepted', accepted.length],
      ['Denied', denied.length],
      ['Pending/Under Review', pending.length],
      ['Withdrawn', withdrawn.length]
    ];
    pdf.addTable(doc, statusHeaders, statusRows, [200, 100]);

    // Challenge details table
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Challenge Details');

    if (challenges.length > 0) {
      const detailHeaders = ['Submission Date', 'Violation Type', 'BASIC', 'Status', 'Points Saved'];
      const detailRows = challenges.slice(0, 30).map(c => [
        pdf.formatDate(c.submissionDate),
        (c.violationType || '-').substring(0, 25),
        c.basic || '-',
        c.status || '-',
        c.csaPointsSaved
      ]);
      pdf.addTable(doc, detailHeaders, detailRows, [90, 140, 80, 80, 70]);

      if (challenges.length > 30) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor(pdf.COLORS.lightText)
           .text(`Showing 30 of ${challenges.length} challenges. Export to CSV/Excel for complete data.`);
      }
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No DataQ challenges submitted.');
    }

    // Note about CSA points
    doc.moveDown(1);
    doc.fontSize(9).fillColor(pdf.COLORS.lightText)
       .text('Note: CSA points saved is an estimate based on severity weight of accepted challenges.');

    pdf.addFooter(doc);
    doc.end();
    return;
  }

  // JSON response
  return res.json({
    success: true,
    report: {
      type: 'DataQ Challenge History Report',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      summary: {
        totalSubmissions: challenges.length,
        accepted: accepted.length,
        denied: denied.length,
        pending: pending.length,
        withdrawn: withdrawn.length,
        successRate,
        estimatedCsaPointsSaved: totalCsaPointsSaved
      },
      challenges
    }
  });
}));

// Helper to build accident summary row
const buildAccidentRow = (a) => {
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  return {
    accidentDate: a.accidentDate ? new Date(a.accidentDate).toLocaleDateString() : '-',
    driverName: a.driverId ? `${a.driverId.firstName} ${a.driverId.lastName}` : '-',
    vehicleUnit: a.vehicleId?.unitNumber || '-',
    location: a.location ? `${a.location.city || ''}, ${a.location.state || ''}`.trim().replace(/^,\s*/, '') : '-',
    dotReportable: a.isDotRecordable ? 'Yes' : 'No',
    injuries: a.totalInjuries || a.injuries?.length || 0,
    fatalities: a.totalFatalities || a.injuries?.filter(i => i.severity === 'fatal').length || 0,
    hazmatRelease: a.hazmatRelease ? 'Yes' : 'No',
    estimatedCost: a.totalEstimatedCost || 0,
    status: a.status || '-'
  };
};

// @route   GET /api/reports/accident-summary
// @desc    Generate Accident Summary report with DOT reportable status and costs
// @access  Private
router.get('/accident-summary', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate, driverIds, vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'accident-summary');

  const query = { companyId };

  if (startDate || endDate) {
    query.accidentDate = {};
    if (startDate) query.accidentDate.$gte = new Date(startDate);
    if (endDate) query.accidentDate.$lte = new Date(endDate);
  }

  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) query.driverId = { $in: ids };
  }

  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) query.vehicleId = { $in: ids };
  }

  const [accidents, company] = await Promise.all([
    Accident.find(query)
      .populate('driverId', 'firstName lastName')
      .populate('vehicleId', 'unitNumber')
      .sort('-accidentDate')
      .lean(),
    Company.findById(companyId)
  ]);

  // Calculate summary metrics
  const dotReportable = accidents.filter(a => a.isDotRecordable);
  const fatalities = accidents.filter(a => a.recordableCriteria?.fatality);
  const injuries = accidents.filter(a => a.recordableCriteria?.injury && !a.recordableCriteria?.fatality);
  const towAways = accidents.filter(a =>
    a.recordableCriteria?.towAway &&
    !a.recordableCriteria?.fatality &&
    !a.recordableCriteria?.injury
  );

  // Calculate total cost
  const totalCost = accidents.reduce((sum, a) => {
    const cost = a.totalEstimatedCost ||
      ((a.vehicleDamage?.estimatedCost || 0) + (a.cargoDamage?.estimatedCost || 0) + (a.propertyDamage?.estimatedCost || 0));
    return sum + cost;
  }, 0);

  const totalInjuries = accidents.reduce((sum, a) => sum + (a.totalInjuries || a.injuries?.length || 0), 0);
  const totalFatalities = accidents.reduce((sum, a) =>
    sum + (a.totalFatalities || a.injuries?.filter(i => i.severity === 'fatal').length || 0), 0);

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  // Build rows using field definitions format
  const allRows = accidents.map(buildAccidentRow);
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('accident-summary', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'accident-summary-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('accident-summary', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'accident-summary-report',
      sheetName: 'Accident Summary',
      columns,
      rows
    });
    return;
  }

  // PDF export
  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="accident-summary-report.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Accident Summary Report');

    // Date range info
    if (startDate || endDate) {
      doc.fontSize(10)
         .fillColor(pdf.COLORS.lightText)
         .text(`Date Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}`);
      doc.moveDown(1);
    }

    // Summary box
    pdf.addSummaryBox(doc, 'Summary', [
      { value: accidents.length, label: 'Total Accidents' },
      { value: dotReportable.length, label: 'DOT Reportable' },
      { value: totalInjuries, label: 'Total Injuries' },
      { value: totalFatalities, label: 'Total Fatalities' }
    ]);

    // Financial summary
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Financial Impact');
    doc.fontSize(11).fillColor(pdf.COLORS.text)
       .text(`Total Estimated Cost: ${formatCurrency(totalCost)}`, { continued: false });
    doc.moveDown(0.5);

    // Recordable criteria breakdown
    pdf.addSectionTitle(doc, 'DOT Recordable Breakdown');
    const criteriaHeaders = ['Criteria', 'Count'];
    const criteriaRows = [
      ['Fatalities', fatalities.length],
      ['Injuries (requiring off-scene treatment)', injuries.length],
      ['Tow-aways (disabling damage)', towAways.length],
      ['Total DOT Reportable', dotReportable.length]
    ];
    pdf.addTable(doc, criteriaHeaders, criteriaRows, [250, 100]);

    // Accident details table
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Accident Details');

    if (accidents.length > 0) {
      const detailHeaders = ['Date', 'Location', 'Driver', 'DOT Rep.', 'Cost'];
      const detailRows = accidents.slice(0, 25).map(a => [
        pdf.formatDate(a.accidentDate),
        a.location ? `${a.location.city || ''}, ${a.location.state || ''}`.substring(0, 15) : '-',
        a.driverId ? `${a.driverId.firstName} ${a.driverId.lastName}`.substring(0, 18) : '-',
        a.isDotRecordable ? 'Yes' : 'No',
        formatCurrency(a.totalEstimatedCost || 0)
      ]);
      pdf.addTable(doc, detailHeaders, detailRows, [70, 100, 120, 60, 90]);

      if (accidents.length > 25) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor(pdf.COLORS.lightText)
           .text(`Showing 25 of ${accidents.length} accidents. Export to CSV/Excel for complete data.`);
      }
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No accidents recorded in this period.');
    }

    pdf.addFooter(doc);
    doc.end();
    return;
  }

  // JSON response
  return res.json({
    success: true,
    report: {
      type: 'Accident Summary Report',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      dateRange: { start: startDate, end: endDate },
      summary: {
        totalAccidents: accidents.length,
        dotReportable: dotReportable.length,
        totalInjuries,
        totalFatalities,
        totalEstimatedCost: totalCost,
        byRecordableCriteria: {
          fatalities: fatalities.length,
          injuries: injuries.length,
          towAways: towAways.length
        }
      },
      accidents: accidents.map(a => ({
        accidentDate: a.accidentDate,
        location: a.location,
        driverName: a.driverId ? `${a.driverId.firstName} ${a.driverId.lastName}` : null,
        vehicleUnit: a.vehicleId?.unitNumber,
        isDotRecordable: a.isDotRecordable,
        severity: a.severity,
        accidentType: a.accidentType,
        injuries: a.totalInjuries || a.injuries?.length || 0,
        fatalities: a.totalFatalities || a.injuries?.filter(i => i.severity === 'fatal').length || 0,
        estimatedCost: a.totalEstimatedCost || 0,
        status: a.status
      }))
    }
  });
}));

// Helper to build maintenance cost row from record
const buildMaintenanceCostRow = (r) => ({
  workOrderNumber: r.workOrderNumber || '-',
  vehicleUnit: r.vehicleId?.unitNumber || '-',
  serviceDate: r.serviceDate ? new Date(r.serviceDate).toLocaleDateString() : '-',
  category: r.recordType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-',
  vendor: r.provider?.name || '-',
  description: r.description || '-',
  laborCost: r.laborCost || 0,
  partsCost: r.partsCost || 0,
  totalCost: r.totalCost || 0
});

// @route   GET /api/reports/maintenance-costs
// @desc    Generate Maintenance Cost report with aggregation by vehicle, category, and vendor
// @access  Private
router.get('/maintenance-costs', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate, vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'maintenance-costs');

  // Build match stage for aggregation
  const matchStage = {
    companyId: new mongoose.Types.ObjectId(companyId)
  };

  if (startDate || endDate) {
    matchStage.serviceDate = {};
    if (startDate) matchStage.serviceDate.$gte = new Date(startDate);
    if (endDate) matchStage.serviceDate.$lte = new Date(endDate);
  }

  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      matchStage.vehicleId = { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
    }
  }

  // Build query for individual records
  const recordQuery = { companyId };
  if (startDate || endDate) {
    recordQuery.serviceDate = {};
    if (startDate) recordQuery.serviceDate.$gte = new Date(startDate);
    if (endDate) recordQuery.serviceDate.$lte = new Date(endDate);
  }
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) recordQuery.vehicleId = { $in: ids };
  }

  // Run aggregations and fetch individual records in parallel
  const [byVehicle, byCategory, byVendor, totals, records, company] = await Promise.all([
    MaintenanceRecord.aggregate([
      { $match: matchStage },
      { $group: {
          _id: '$vehicleId',
          totalCost: { $sum: '$totalCost' },
          laborCost: { $sum: '$laborCost' },
          partsCost: { $sum: '$partsCost' },
          recordCount: { $sum: 1 }
        }
      },
      { $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      { $project: {
          vehicleId: '$_id',
          unitNumber: '$vehicle.unitNumber',
          totalCost: 1,
          laborCost: 1,
          partsCost: 1,
          recordCount: 1
        }
      },
      { $sort: { totalCost: -1 } }
    ]),

    MaintenanceRecord.aggregate([
      { $match: matchStage },
      { $group: {
          _id: '$recordType',
          totalCost: { $sum: '$totalCost' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { totalCost: -1 } }
    ]),

    MaintenanceRecord.aggregate([
      { $match: { ...matchStage, 'provider.name': { $exists: true, $ne: '' } } },
      { $group: {
          _id: '$provider.name',
          totalCost: { $sum: '$totalCost' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { totalCost: -1 } }
    ]),

    MaintenanceRecord.aggregate([
      { $match: matchStage },
      { $group: {
          _id: null,
          totalCost: { $sum: '$totalCost' },
          laborCost: { $sum: '$laborCost' },
          partsCost: { $sum: '$partsCost' },
          recordCount: { $sum: 1 }
        }
      }
    ]),

    MaintenanceRecord.find(recordQuery)
      .populate('vehicleId', 'unitNumber')
      .sort('-serviceDate')
      .lean(),

    Company.findById(companyId)
  ]);

  const summary = totals[0] || { totalCost: 0, laborCost: 0, partsCost: 0, recordCount: 0 };

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  // Build rows using field definitions format (individual records)
  const allRows = records.map(buildMaintenanceCostRow);
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('maintenance-costs', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'maintenance-cost-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('maintenance-costs', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'maintenance-cost-report',
      sheetName: 'Maintenance Costs',
      columns,
      rows
    });
    return;
  }

  // PDF export
  if (format === 'pdf') {
    const doc = pdf.createDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="maintenance-cost-report.pdf"');

    doc.pipe(res);

    // Header
    pdf.addHeader(doc, company, 'Maintenance Cost Report');

    // Date range info
    if (startDate || endDate) {
      doc.fontSize(10)
         .fillColor(pdf.COLORS.lightText)
         .text(`Date Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}`);
      doc.moveDown(1);
    }

    // Summary box
    pdf.addSummaryBox(doc, 'Cost Summary', [
      { value: formatCurrency(summary.totalCost), label: 'Total Cost' },
      { value: formatCurrency(summary.laborCost), label: 'Labor' },
      { value: formatCurrency(summary.partsCost), label: 'Parts' },
      { value: summary.recordCount, label: 'Records' }
    ]);

    // Top 10 by Vehicle
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Top 10 by Vehicle');
    if (byVehicle.length > 0) {
      const vehicleHeaders = ['Unit Number', 'Total Cost', 'Labor', 'Parts', 'Records'];
      const vehicleRows = byVehicle.slice(0, 10).map(v => [
        v.unitNumber || 'Unknown',
        formatCurrency(v.totalCost),
        formatCurrency(v.laborCost),
        formatCurrency(v.partsCost),
        v.recordCount
      ]);
      pdf.addTable(doc, vehicleHeaders, vehicleRows, [80, 90, 90, 90, 60]);
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No maintenance records found.');
    }

    // By Category
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'By Category');
    if (byCategory.length > 0) {
      const categoryHeaders = ['Category', 'Total Cost', 'Records'];
      const categoryRows = byCategory.map(c => [
        c._id?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
        formatCurrency(c.totalCost),
        c.recordCount
      ]);
      pdf.addTable(doc, categoryHeaders, categoryRows, [200, 120, 80]);
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No categories found.');
    }

    // Top 10 by Vendor
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Top 10 by Vendor');
    if (byVendor.length > 0) {
      const vendorHeaders = ['Vendor', 'Total Cost', 'Records'];
      const vendorRows = byVendor.slice(0, 10).map(v => [
        (v._id || 'Unknown').substring(0, 30),
        formatCurrency(v.totalCost),
        v.recordCount
      ]);
      pdf.addTable(doc, vendorHeaders, vendorRows, [200, 120, 80]);
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No vendor data available.');
    }

    pdf.addFooter(doc);
    doc.end();
    return;
  }

  // JSON response
  return res.json({
    success: true,
    report: {
      type: 'Maintenance Cost Report',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      dateRange: { start: startDate, end: endDate },
      summary: {
        totalCost: summary.totalCost,
        laborCost: summary.laborCost,
        partsCost: summary.partsCost,
        recordCount: summary.recordCount
      },
      byVehicle: byVehicle.map(v => ({
        vehicleId: v.vehicleId,
        unitNumber: v.unitNumber,
        totalCost: v.totalCost,
        laborCost: v.laborCost,
        partsCost: v.partsCost,
        recordCount: v.recordCount
      })),
      byCategory: byCategory.map(c => ({
        category: c._id,
        totalCost: c.totalCost,
        recordCount: c.recordCount
      })),
      byVendor: byVendor.map(v => ({
        vendor: v._id,
        totalCost: v.totalCost,
        recordCount: v.recordCount
      }))
    }
  });
}));

// Helper to build vehicle maintenance row
const buildVehicleRow = (v) => ({
  unitNumber: v.unitNumber || '-',
  vin: v.vin || '-',
  make: v.make || '-',
  model: v.model || '-',
  year: v.year || '-',
  type: v.vehicleType || '-',
  status: v.status || '-',
  annualInspectionDate: v.annualInspection?.lastInspectionDate ? new Date(v.annualInspection.lastInspectionDate).toLocaleDateString() : '-',
  annualInspectionExpiry: v.annualInspection?.nextDueDate ? new Date(v.annualInspection.nextDueDate).toLocaleDateString() : '-',
  lastMaintenanceDate: v.maintenanceLog?.length > 0 && v.maintenanceLog[v.maintenanceLog.length - 1]?.date
    ? new Date(v.maintenanceLog[v.maintenanceLog.length - 1].date).toLocaleDateString()
    : '-',
  mileage: v.mileage || '-',
  overallStatus: v.complianceStatus?.overall || '-'
});

// @route   GET /api/reports/vehicle-maintenance
// @desc    Generate Vehicle Maintenance report
// @access  Private
router.get('/vehicle-maintenance', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { vehicleId, vehicleIds, startDate, endDate, complianceStatus, format = 'json', fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'vehicle');

  const query = { companyId };

  // Multi-select vehicle filter (takes precedence over single vehicleId)
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      query._id = { $in: ids };
    }
  } else if (vehicleId) {
    query._id = vehicleId;
  }

  // Compliance status filter
  if (complianceStatus) {
    query['complianceStatus.overall'] = complianceStatus;
  }

  // Date range filter on annualInspection.nextDueDate
  if (startDate || endDate) {
    query['annualInspection.nextDueDate'] = {};
    if (startDate) query['annualInspection.nextDueDate'].$gte = new Date(startDate);
    if (endDate) query['annualInspection.nextDueDate'].$lte = new Date(endDate);
  }

  const vehicles = await Vehicle.find(query).sort({ unitNumber: 1 });
  const company = await Company.findById(companyId);

  // Build rows using field definitions format
  const allRows = vehicles.map(buildVehicleRow);
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('vehicle', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'vehicle-maintenance-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('vehicle', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'vehicle-maintenance-report',
      sheetName: 'Vehicle Maintenance',
      columns,
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

// Helper to build violations row
const buildViolationRow = (v) => ({
  inspectionNumber: v.inspectionNumber || '-',
  violationDate: v.violationDate ? new Date(v.violationDate).toLocaleDateString() : '-',
  violationType: v.violationType || '-',
  violationCode: v.violationCode || '-',
  description: v.description || '-',
  basic: v.basic || '-',
  severityWeight: v.severityWeight != null ? v.severityWeight : '-',
  driverName: v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : '-',
  vehicleUnit: v.vehicleId?.unitNumber || '-',
  status: v.status || '-',
  dataQStatus: v.dataQChallenge?.submitted ? v.dataQChallenge.status : '-',
  dataQCaseNumber: v.dataQChallenge?.caseNumber || '-'
});

// @route   GET /api/reports/violations
// @desc    Generate Violations report
// @access  Private
router.get('/violations', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { startDate, endDate, driverIds, vehicleIds, status, format = 'json', fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'violations');

  const query = { companyId };

  // Date range filter
  if (startDate || endDate) {
    query.violationDate = {};
    if (startDate) query.violationDate.$gte = new Date(startDate);
    if (endDate) query.violationDate.$lte = new Date(endDate);
  }

  // Multi-select driver filter
  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      query.driverId = { $in: ids };
    }
  }

  // Multi-select vehicle filter
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      query.vehicleId = { $in: ids };
    }
  }

  // Status filter
  if (status) {
    query.status = status;
  }

  const violations = await Violation.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('-violationDate');

  const company = await Company.findById(companyId);

  // Build rows using field definitions format
  const allRows = violations.map(buildViolationRow);
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('violations', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'violations-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('violations', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'violations-report',
      sheetName: 'Violations Summary',
      columns,
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
  const { format = 'json', fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse and validate fields parameter
  const selectedFields = parseFieldsParam(fields, 'audit');

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

  // Build audit rows in section/metric/value format
  const allRows = [
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
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export
  if (format === 'csv') {
    const { headers } = buildExportConfig('audit', selectedFields);
    exportService.streamCSV(res, {
      reportType: 'audit-report',
      headers,
      rows
    });
    return;
  }

  // Excel export
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('audit', selectedFields);
    await exportService.streamExcel(res, {
      reportType: 'audit-report',
      sheetName: 'Comprehensive Audit',
      columns,
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
