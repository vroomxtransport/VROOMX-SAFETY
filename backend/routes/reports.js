const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { PassThrough } = require('stream');
const ExcelJS = require('exceljs');
const { Driver, Vehicle, Violation, DrugAlcoholTest, Document, Accident, Company, MaintenanceRecord } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const pdf = require('../utils/pdfGenerator');
const emailService = require('../services/emailService');
const exportService = require('../services/exportService');
const reportHistoryService = require('../services/reportHistoryService');
const { addDays, startOfYear, format: formatDateFns, parseISO, isValid } = require('date-fns');
const { format: formatCSV } = require('@fast-csv/format');
const { REPORT_FIELD_DEFINITIONS, validateFields } = require('../config/reportFieldDefinitions');

// Preview limit for preview endpoints
const PREVIEW_LIMIT = 10;

// Helper to format dates consistently across all reports
const formatReportDate = (date) => {
  if (!date) return '-';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsed)) return '-';
    return formatDateFns(parsed, 'MM/dd/yyyy');
  } catch {
    return '-';
  }
};

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

// Report name mapping for history display
const REPORT_NAMES = {
  'dqf': 'Driver Qualification Files',
  'vehicle': 'Vehicle Maintenance',
  'violations': 'Violations Summary',
  'audit': 'Comprehensive Audit',
  'document-expiration': 'Document Expiration',
  'drug-alcohol': 'Drug & Alcohol',
  'dataq-history': 'DataQ History',
  'accident-summary': 'Accident Summary',
  'maintenance-costs': 'Maintenance Costs'
};

// Helper to track report export in history
const trackReportExport = async (req, res, options) => {
  const { fileBuffer, format, reportType, rows, selectedFields, filters } = options;
  const companyId = req.companyFilter.companyId;

  // Save to history
  const history = await reportHistoryService.saveReport(fileBuffer, {
    companyId,
    userId: req.user._id,
    userEmail: req.user.email,
    reportType,
    reportName: REPORT_NAMES[reportType] || reportType,
    format,
    filters: filters || {},
    selectedFields: selectedFields || [],
    rowCount: rows.length
  });

  // Set response headers
  const fileName = exportService.generateFilename(reportType, format);
  const mimeTypes = {
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  res.setHeader('Content-Type', mimeTypes[format]);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('X-Report-History-Id', history._id.toString());
  res.send(fileBuffer);
};

// Helper to create CSV buffer (instead of streaming directly to response)
const createCSVBuffer = async (headers, rows) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const passThrough = new PassThrough();

    passThrough.on('data', chunk => chunks.push(chunk));
    passThrough.on('end', () => resolve(Buffer.concat(chunks)));
    passThrough.on('error', reject);

    // Write UTF-8 BOM
    passThrough.write('\ufeff');

    const csvStream = formatCSV({ headers: true });
    csvStream.pipe(passThrough);

    // Write header row
    for (const row of rows) {
      csvStream.write(row);
    }
    csvStream.end();
  });
};

// Helper to create Excel buffer (instead of streaming directly to response)
const createExcelBuffer = async (sheetName, columns, rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add data rows
  rows.forEach(rowData => worksheet.addRow(rowData));

  return workbook.xlsx.writeBuffer();
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

// ============================================
// PREVIEW ENDPOINTS (must be before main routes)
// ============================================

// Helper to build preview response
const buildPreviewResponse = (rows, selectedFields, reportType, totalCount) => {
  const fieldDefs = REPORT_FIELD_DEFINITIONS[reportType]?.fields || [];
  const fieldsToUse = selectedFields || fieldDefs.map(f => f.key);

  const columns = fieldsToUse.map(key => {
    const def = fieldDefs.find(f => f.key === key);
    return {
      key,
      label: def?.label || key,
      type: def?.type || 'string'
    };
  });

  return {
    success: true,
    preview: {
      rows,
      columns,
      totalCount,
      previewCount: rows.length,
      hasMore: totalCount > PREVIEW_LIMIT
    }
  };
};

// @route   GET /api/reports/dqf/preview
// @desc    Preview DQF report - first 10 rows with metadata
// @access  Private
router.get('/dqf/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  const selectedFields = parseFieldsParam(fields, 'dqf');

  const query = { companyId, status: 'active' };
  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) query._id = { $in: ids };
  }

  const totalCount = await Driver.countDocuments(query);
  const drivers = await Driver.find(query)
    .select('-ssn')
    .sort({ lastName: 1, firstName: 1 })
    .limit(PREVIEW_LIMIT)
    .lean();

  const allRows = drivers.map(d => buildDqfRow(d));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'dqf', totalCount));
}));

// @route   GET /api/reports/vehicle-maintenance/preview
// @desc    Preview Vehicle Maintenance report
// @access  Private
router.get('/vehicle-maintenance/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  const selectedFields = parseFieldsParam(fields, 'vehicle');

  const query = { companyId };
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) query._id = { $in: ids };
  }

  const totalCount = await Vehicle.countDocuments(query);
  const vehicles = await Vehicle.find(query)
    .sort({ unitNumber: 1 })
    .limit(PREVIEW_LIMIT)
    .lean();

  // Fetch maintenance records for preview vehicles
  const vehicleIdsList = vehicles.map(v => v._id);
  const maintenanceRecords = await MaintenanceRecord.find({
    companyId,
    vehicleId: { $in: vehicleIdsList }
  }).sort({ serviceDate: -1 }).lean();

  // Group maintenance records by vehicle
  const maintenanceByVehicle = {};
  maintenanceRecords.forEach(record => {
    const vid = record.vehicleId.toString();
    if (!maintenanceByVehicle[vid]) maintenanceByVehicle[vid] = [];
    maintenanceByVehicle[vid].push(record);
  });

  // Helper to calculate maintenance stats for preview
  const getPreviewStats = (vehicleId, dvirRecords = [], pmSchedule = null) => {
    const records = maintenanceByVehicle[vehicleId.toString()] || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const repairs = records.filter(r => r.recordType !== 'preventive_maintenance' && r.recordType !== 'pm');
    const lastRepair = repairs[0];
    const pmRecords = records.filter(r => r.recordType === 'preventive_maintenance' || r.recordType === 'pm');
    const lastPM = pmRecords[0];
    const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const openDefects = (dvirRecords || []).filter(dvir =>
      dvir.defects?.some(d => d.status === 'open' || d.status === 'pending')
    ).length;
    const recentDVIRs = (dvirRecords || []).filter(dvir =>
      dvir.inspectionDate && new Date(dvir.inspectionDate) >= thirtyDaysAgo
    ).length;

    return {
      totalRecords: records.length,
      totalCost,
      lastRepairDate: lastRepair?.serviceDate || null,
      lastRepairDescription: lastRepair?.description || null,
      lastRepairCost: lastRepair?.totalCost || null,
      lastPMDate: lastPM?.serviceDate || null,
      nextPMDue: pmSchedule?.nextDueDate || null,
      openDefects,
      recentDVIRs
    };
  };

  const allRows = vehicles.map(v => {
    const stats = getPreviewStats(v._id, v.dvirRecords, v.pmSchedule);
    return buildVehicleRow(v, stats);
  });
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'vehicle', totalCount));
}));

// @route   GET /api/reports/violations/preview
// @desc    Preview Violations report
// @access  Private
router.get('/violations/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverIds, vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  const selectedFields = parseFieldsParam(fields, 'violations');

  const query = { companyId };
  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) query.driverId = { $in: ids };
  }
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) query.vehicleId = { $in: ids };
  }

  const totalCount = await Violation.countDocuments(query);
  const violations = await Violation.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('-violationDate')
    .limit(PREVIEW_LIMIT)
    .lean();

  const allRows = violations.map(v => buildViolationRow(v));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'violations', totalCount));
}));

// @route   GET /api/reports/audit/preview
// @desc    Preview Audit report
// @access  Private
// NOTE: Audit report intentionally requires 'reports.export' (not 'reports.view')
// because audit data contains sensitive cross-module compliance information
router.get('/audit/preview', checkPermission('reports', 'export'), asyncHandler(async (req, res) => {
  const { fields } = req.query;
  const companyId = req.companyFilter.companyId;

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
    driverQualification: {
      totalActive: drivers.length,
      compliant: drivers.filter(d => d.complianceStatus?.overall === 'compliant').length,
      withIssues: drivers.filter(d => d.complianceStatus?.overall !== 'compliant').length
    },
    vehicles: {
      total: vehicles.length,
      compliant: vehicles.filter(v => v.complianceStatus?.overall === 'compliant').length,
      needingAttention: vehicles.filter(v => v.complianceStatus?.overall !== 'compliant').length
    },
    violations: {
      total: violations.length,
      open: violations.filter(v => v.status === 'open').length,
      disputed: violations.filter(v => v.status === 'dispute_in_progress').length
    },
    drugAlcohol: {
      totalTests: drugTests.length
    },
    documents: {
      total: documents.length,
      expiringSoon: documents.filter(d => d.status === 'due_soon').length,
      expired: documents.filter(d => d.status === 'expired').length
    }
  };

  const allRows = [
    { section: 'Company', metric: 'Name', value: company?.name || '-' },
    { section: 'Company', metric: 'DOT Number', value: company?.dotNumber || '-' },
    { section: 'Drivers', metric: 'Total Active', value: String(auditData.driverQualification.totalActive) },
    { section: 'Drivers', metric: 'Compliant', value: String(auditData.driverQualification.compliant) },
    { section: 'Vehicles', metric: 'Total', value: String(auditData.vehicles.total) },
    { section: 'Vehicles', metric: 'Compliant', value: String(auditData.vehicles.compliant) },
    { section: 'Violations', metric: 'Total (Last 50)', value: String(auditData.violations.total) },
    { section: 'Documents', metric: 'Total', value: String(auditData.documents.total) },
    { section: 'Documents', metric: 'Expiring Soon', value: String(auditData.documents.expiringSoon) },
    { section: 'Documents', metric: 'Expired', value: String(auditData.documents.expired) }
  ];

  const totalCount = allRows.length;
  const limitedRows = allRows.slice(0, PREVIEW_LIMIT);
  const rows = selectedFields ? limitedRows.map(row => filterRowToFields(row, selectedFields)) : limitedRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'audit', totalCount));
}));

// @route   GET /api/reports/document-expiration/preview
// @desc    Preview Document Expiration report
// @access  Private
router.get('/document-expiration/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverIds, vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  const selectedFields = parseFieldsParam(fields, 'document-expiration');

  const now = new Date();
  const ninetyDays = addDays(now, 90);

  const query = {
    companyId,
    isDeleted: false,
    expiryDate: { $exists: true, $lte: ninetyDays }
  };

  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) query.driverId = { $in: ids };
  }
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) query.vehicleId = { $in: ids };
  }

  const totalCount = await Document.countDocuments(query);
  const documents = await Document.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('expiryDate')
    .limit(PREVIEW_LIMIT)
    .lean();

  const allRows = documents.map(doc => buildDocExpirationRow(doc, now));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'document-expiration', totalCount));
}));

// @route   GET /api/reports/drug-alcohol-summary/preview
// @desc    Preview Drug & Alcohol report
// @access  Private
router.get('/drug-alcohol-summary/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { startDate, endDate, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  const selectedFields = parseFieldsParam(fields, 'drug-alcohol');

  const yearStart = startDate ? new Date(startDate) : startOfYear(new Date());
  const yearEnd = endDate ? new Date(endDate) : new Date();

  const query = {
    companyId,
    testDate: { $gte: yearStart, $lte: yearEnd }
  };

  const totalCount = await DrugAlcoholTest.countDocuments(query);
  const tests = await DrugAlcoholTest.find(query)
    .populate('driverId', 'firstName lastName')
    .sort('-testDate')
    .limit(PREVIEW_LIMIT)
    .lean();

  const allRows = tests.map(t => buildDrugAlcoholRow(t));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'drug-alcohol', totalCount));
}));

// @route   GET /api/reports/dataq-history/preview
// @desc    Preview DataQ History report
// @access  Private
router.get('/dataq-history/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { startDate, endDate, driverIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  const selectedFields = parseFieldsParam(fields, 'dataq-history');

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

  const totalCount = await Violation.countDocuments(query);
  const violations = await Violation.find(query)
    .populate('driverId', 'firstName lastName')
    .sort('-dataQChallenge.submissionDate')
    .limit(PREVIEW_LIMIT)
    .lean();

  const allRows = violations.map(v => buildDataQRow(v));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'dataq-history', totalCount));
}));

// @route   GET /api/reports/accident-summary/preview
// @desc    Preview Accident Summary report
// @access  Private
router.get('/accident-summary/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { startDate, endDate, driverIds, vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

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

  const totalCount = await Accident.countDocuments(query);
  const accidents = await Accident.find(query)
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('-accidentDate')
    .limit(PREVIEW_LIMIT)
    .lean();

  const allRows = accidents.map(a => buildAccidentRow(a));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'accident-summary', totalCount));
}));

// @route   GET /api/reports/maintenance-costs/preview
// @desc    Preview Maintenance Costs report
// @access  Private
router.get('/maintenance-costs/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { startDate, endDate, vehicleIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;

  const selectedFields = parseFieldsParam(fields, 'maintenance-costs');

  const query = { companyId };
  if (startDate || endDate) {
    query.serviceDate = {};
    if (startDate) query.serviceDate.$gte = new Date(startDate);
    if (endDate) query.serviceDate.$lte = new Date(endDate);
  }
  if (vehicleIds) {
    const ids = vehicleIds.split(',').filter(Boolean);
    if (ids.length > 0) query.vehicleId = { $in: ids };
  }

  const totalCount = await MaintenanceRecord.countDocuments(query);
  const records = await MaintenanceRecord.find(query)
    .populate('vehicleId', 'unitNumber')
    .sort('-serviceDate')
    .limit(PREVIEW_LIMIT)
    .lean();

  const allRows = records.map(r => buildMaintenanceCostRow(r));
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  return res.json(buildPreviewResponse(rows, selectedFields, 'maintenance-costs', totalCount));
}));

// ============================================
// MAIN REPORT ENDPOINTS
// ============================================

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
  cdlExpiry: formatReportDate(d.cdl?.expiryDate),
  medicalExpiry: formatReportDate(d.medicalCard?.expiryDate),
  overallStatus: d.complianceStatus?.overall || '-',
  clearinghouseQueryDate: formatReportDate(d.clearinghouse?.lastQueryDate),
  clearinghouseStatus: d.clearinghouse?.status || '-',
  mvrReviewDate: formatReportDate(d.documents?.mvrReviews?.[0]?.reviewDate),
  mvrApproved: d.documents?.mvrReviews?.[0]?.approved != null ? (d.documents.mvrReviews[0].approved ? 'Yes' : 'No') : '-',
  employmentVerificationStatus: getEmploymentVerificationStatus(d.documents?.employmentVerification),
  roadTestDate: formatReportDate(d.documents?.roadTest?.date),
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('dqf', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'dqf',
      rows,
      selectedFields,
      filters: {
        driverIds: driverIds ? driverIds.split(',') : undefined,
        complianceStatus
      }
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('dqf', selectedFields);
    const fileBuffer = await createExcelBuffer('Driver Qualification Files', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'dqf',
      rows,
      selectedFields,
      filters: {
        driverIds: driverIds ? driverIds.split(',') : undefined,
        complianceStatus
      }
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

    pdf.addTable(doc, headers, rows, [120, 80, 100, 100, 100], {
      zebraStripe: true,
      statusColumn: 4 // Overall Status column
    });

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
    expirationDate: formatReportDate(doc.expiryDate),
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('document-expiration', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'document-expiration',
      rows,
      selectedFields,
      filters: {
        driverIds: driverIds ? driverIds.split(',') : undefined,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('document-expiration', selectedFields);
    const fileBuffer = await createExcelBuffer('Document Expiration', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'document-expiration',
      rows,
      selectedFields,
      filters: {
        driverIds: driverIds ? driverIds.split(',') : undefined,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
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

      pdf.addTable(doc, tableHeaders, rows, colWidths, { zebraStripe: true });
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
  testDate: formatReportDate(t.testDate),
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('drug-alcohol', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'drug-alcohol',
      rows,
      selectedFields,
      filters: {
        startDate: startDate || yearStart.toISOString(),
        endDate: endDate || yearEnd.toISOString()
      }
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('drug-alcohol', selectedFields);
    const fileBuffer = await createExcelBuffer('Drug & Alcohol Summary', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'drug-alcohol',
      rows,
      selectedFields,
      filters: {
        startDate: startDate || yearStart.toISOString(),
        endDate: endDate || yearEnd.toISOString()
      }
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
      pdf.addTable(doc, typeHeaders, typeRows, [120, 60, 70, 70, 70], { zebraStripe: true });
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
      pdf.addTable(doc, recentHeaders, recentRows, [80, 150, 100, 80], {
        zebraStripe: true,
        statusColumn: 3 // Result column
      });
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
  submittedDate: formatReportDate(v.dataQChallenge.submissionDate),
  violationCode: v.violationCode || '-',
  basic: v.basic || '-',
  originalSeverity: v.severityWeight != null ? v.severityWeight : '-',
  status: v.dataQChallenge.status || '-',
  resolvedDate: formatReportDate(v.dataQChallenge.responseDate),
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('dataq-history', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'dataq-history',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        driverIds: driverIds ? driverIds.split(',') : undefined
      }
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('dataq-history', selectedFields);
    const fileBuffer = await createExcelBuffer('DataQ Challenge History', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'dataq-history',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        driverIds: driverIds ? driverIds.split(',') : undefined
      }
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
    pdf.addTable(doc, statusHeaders, statusRows, [200, 100], { zebraStripe: true });

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
      pdf.addTable(doc, detailHeaders, detailRows, [90, 140, 80, 80, 70], {
        zebraStripe: true,
        statusColumn: 3 // Status column
      });

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
  return {
    accidentDate: formatReportDate(a.accidentDate),
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('accident-summary', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'accident-summary',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        driverIds: driverIds ? driverIds.split(',') : undefined,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('accident-summary', selectedFields);
    const fileBuffer = await createExcelBuffer('Accident Summary', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'accident-summary',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        driverIds: driverIds ? driverIds.split(',') : undefined,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
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
    pdf.addTable(doc, criteriaHeaders, criteriaRows, [250, 100], { zebraStripe: true });

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
      pdf.addTable(doc, detailHeaders, detailRows, [70, 100, 120, 60, 90], { zebraStripe: true });

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
  invoiceNumber: r.invoiceNumber || '-',
  vehicleUnit: r.vehicleId?.unitNumber || '-',
  serviceDate: formatReportDate(r.serviceDate),
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('maintenance-costs', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'maintenance-costs',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('maintenance-costs', selectedFields);
    const fileBuffer = await createExcelBuffer('Maintenance Costs', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'maintenance-costs',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
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
      pdf.addTable(doc, vehicleHeaders, vehicleRows, [80, 90, 90, 90, 60], { zebraStripe: true });
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
      pdf.addTable(doc, categoryHeaders, categoryRows, [200, 120, 80], { zebraStripe: true });
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
      pdf.addTable(doc, vendorHeaders, vendorRows, [200, 120, 80], { zebraStripe: true });
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No vendor data available.');
    }

    // Recent Maintenance Records (Individual line items)
    doc.moveDown(1);
    pdf.addSectionTitle(doc, 'Recent Maintenance Records');
    if (records.length > 0) {
      const recordHeaders = ['Date', 'Vehicle', 'Category', 'Description', 'Cost'];
      const recordRows = records.slice(0, 25).map(r => [
        pdf.formatDate(r.serviceDate),
        r.vehicleId?.unitNumber || '-',
        r.recordType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-',
        (r.description || '-').substring(0, 30),
        formatCurrency(r.totalCost)
      ]);
      pdf.addTable(doc, recordHeaders, recordRows, [70, 60, 100, 130, 70], { zebraStripe: true });

      if (records.length > 25) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor(pdf.COLORS.lightText)
           .text(`Showing 25 of ${records.length} records. Export to CSV/Excel for full data.`);
      }
    } else {
      doc.fontSize(10).fillColor(pdf.COLORS.lightText).text('No maintenance records found.');
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
const buildVehicleRow = (v, maintenanceStats = null) => ({
  unitNumber: v.unitNumber || '-',
  vin: v.vin || '-',
  make: v.make || '-',
  model: v.model || '-',
  year: v.year || '-',
  type: v.vehicleType || '-',
  status: v.status || '-',
  annualInspectionDate: formatReportDate(v.annualInspection?.lastInspectionDate),
  annualInspectionExpiry: formatReportDate(v.annualInspection?.nextDueDate),
  lastMaintenanceDate: v.maintenanceLog?.length > 0 && v.maintenanceLog[v.maintenanceLog.length - 1]?.date
    ? formatReportDate(v.maintenanceLog[v.maintenanceLog.length - 1].date)
    : '-',
  mileage: v.mileage || '-',
  overallStatus: v.complianceStatus?.overall || '-',
  // Maintenance stats from MaintenanceRecord collection (if provided)
  totalMaintenanceRecords: maintenanceStats?.totalRecords ?? '-',
  totalMaintenanceCost: maintenanceStats?.totalCost ?? '-',
  lastRepairDate: maintenanceStats?.lastRepairDate ? formatReportDate(maintenanceStats.lastRepairDate) : '-',
  lastRepairDescription: maintenanceStats?.lastRepairDescription ?? '-',
  lastRepairCost: maintenanceStats?.lastRepairCost ?? '-',
  lastPMDate: maintenanceStats?.lastPMDate ? formatReportDate(maintenanceStats.lastPMDate) : '-',
  nextPMDue: maintenanceStats?.nextPMDue ? formatReportDate(maintenanceStats.nextPMDue) : '-',
  openDefects: maintenanceStats?.openDefects ?? '-',
  recentDVIRs: maintenanceStats?.recentDVIRs ?? '-'
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

  const vehicles = await Vehicle.find(query).sort({ unitNumber: 1 }).lean();
  const company = await Company.findById(companyId);

  // Fetch maintenance records for all vehicles
  const vehicleIdsList = vehicles.map(v => v._id);
  const maintenanceRecords = await MaintenanceRecord.find({
    companyId,
    vehicleId: { $in: vehicleIdsList }
  }).sort({ serviceDate: -1 }).lean();

  // Group maintenance records by vehicle
  const maintenanceByVehicle = {};
  maintenanceRecords.forEach(record => {
    const vid = record.vehicleId.toString();
    if (!maintenanceByVehicle[vid]) maintenanceByVehicle[vid] = [];
    maintenanceByVehicle[vid].push(record);
  });

  // Helper to calculate maintenance stats for a vehicle
  const getMaintenanceStats = (vehicleId, dvirRecords = [], pmSchedule = null) => {
    const records = maintenanceByVehicle[vehicleId.toString()] || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find last repair (non-PM records)
    const repairs = records.filter(r => r.recordType !== 'preventive_maintenance' && r.recordType !== 'pm');
    const lastRepair = repairs[0];

    // Find last PM
    const pmRecords = records.filter(r => r.recordType === 'preventive_maintenance' || r.recordType === 'pm');
    const lastPM = pmRecords[0];

    // Calculate total cost
    const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    // Count open defects from dvirRecords
    const openDefects = (dvirRecords || []).filter(dvir =>
      dvir.defects?.some(d => d.status === 'open' || d.status === 'pending')
    ).length;

    // Count recent DVIRs
    const recentDVIRs = (dvirRecords || []).filter(dvir =>
      dvir.inspectionDate && new Date(dvir.inspectionDate) >= thirtyDaysAgo
    ).length;

    // Calculate next PM due from pmSchedule
    let nextPMDue = null;
    if (pmSchedule?.nextDueDate) {
      nextPMDue = pmSchedule.nextDueDate;
    }

    return {
      totalRecords: records.length,
      totalCost,
      lastRepairDate: lastRepair?.serviceDate || null,
      lastRepairDescription: lastRepair?.description || null,
      lastRepairCost: lastRepair?.totalCost || null,
      lastPMDate: lastPM?.serviceDate || null,
      nextPMDue,
      openDefects,
      recentDVIRs
    };
  };

  // Build rows using field definitions format with maintenance stats
  const allRows = vehicles.map(v => {
    const stats = getMaintenanceStats(v._id, v.dvirRecords, v.pmSchedule);
    return buildVehicleRow(v, stats);
  });
  const rows = selectedFields ? allRows.map(row => filterRowToFields(row, selectedFields)) : allRows;

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('vehicle', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'vehicle',
      rows,
      selectedFields,
      filters: {
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
    });
    return;
  }

  // Excel export with history tracking - includes maintenance records sheet
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('vehicle', selectedFields);

    // Create workbook with two sheets
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Vehicle Summary
    const summarySheet = workbook.addWorksheet('Vehicle Summary');
    summarySheet.columns = columns;

    // Style header row
    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    };
    summaryHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    rows.forEach(row => summarySheet.addRow(row));

    // Sheet 2: Maintenance Records
    const recordsSheet = workbook.addWorksheet('Maintenance Records');
    recordsSheet.columns = [
      { header: 'Vehicle', key: 'vehicle', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Labor Cost', key: 'laborCost', width: 12 },
      { header: 'Parts Cost', key: 'partsCost', width: 12 },
      { header: 'Total Cost', key: 'totalCost', width: 12 }
    ];

    // Style records header row
    const recordsHeaderRow = recordsSheet.getRow(1);
    recordsHeaderRow.font = { bold: true };
    recordsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    };
    recordsHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Create a map of vehicle IDs to unit numbers for lookup
    const vehicleMap = {};
    vehicles.forEach(v => { vehicleMap[v._id.toString()] = v.unitNumber; });

    maintenanceRecords.forEach(r => {
      recordsSheet.addRow({
        vehicle: vehicleMap[r.vehicleId?.toString()] || '-',
        date: formatReportDate(r.serviceDate),
        type: r.recordType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-',
        description: r.description || '-',
        vendor: r.provider?.name || '-',
        laborCost: r.laborCost || 0,
        partsCost: r.partsCost || 0,
        totalCost: r.totalCost || 0
      });
    });

    const fileBuffer = await workbook.xlsx.writeBuffer();
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'vehicle',
      rows,
      selectedFields,
      filters: {
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
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
    const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    pdf.addSummaryBox(doc, 'Summary', [
      { value: vehicles.length, label: 'Total Vehicles' },
      { value: compliant, label: 'Compliant' },
      { value: `$${totalMaintenanceCost.toLocaleString()}`, label: 'Total Maint. Cost' }
    ]);

    // Vehicle table
    pdf.addSectionTitle(doc, 'Fleet Overview');

    const pdfHeaders = ['Unit #', 'Type', 'VIN', 'Status', 'Next Inspection'];
    const pdfRows = vehicles.map(v => [
      v.unitNumber,
      v.vehicleType || '-',
      v.vin ? `...${v.vin.slice(-6)}` : '-',
      v.status || '-',
      pdf.formatDate(v.annualInspection?.nextDueDate)
    ]);

    pdf.addTable(doc, pdfHeaders, pdfRows, [70, 80, 80, 80, 100], {
      zebraStripe: true,
      statusColumn: 3 // Status column
    });

    // Maintenance details per vehicle - now showing MaintenanceRecord data
    vehicles.forEach((v) => {
      const vehicleRecords = maintenanceByVehicle[v._id.toString()] || [];
      const recentRecords = vehicleRecords.slice(0, 10);

      if (recentRecords.length > 0) {
        doc.moveDown(1);
        pdf.addSectionTitle(doc, `Unit ${v.unitNumber} - Maintenance History`);

        const maintHeaders = ['Date', 'Type', 'Description', 'Vendor', 'Cost'];
        const maintRows = recentRecords.map(m => [
          pdf.formatDate(m.serviceDate),
          m.recordType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-',
          (m.description || '-').substring(0, 25),
          m.provider?.name || '-',
          m.totalCost ? `$${m.totalCost.toLocaleString()}` : '-'
        ]);

        pdf.addTable(doc, maintHeaders, maintRows, [80, 80, 120, 80, 70], {
          zebraStripe: true
        });
      }

      // Show open defects if any
      const openDefects = (v.dvirRecords || []).filter(dvir =>
        dvir.defects?.some(d => d.status === 'open' || d.status === 'pending')
      );
      if (openDefects.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#dc2626').text(`Open Defects: ${openDefects.length}`, { underline: false });
      }
    });

    pdf.addFooter(doc);
    doc.end();
    return;
  }

  // JSON response with enhanced data
  return res.json({
    success: true,
    report: {
      type: 'Vehicle Maintenance',
      generatedAt: new Date(),
      company: { name: company.name, dotNumber: company.dotNumber },
      summary: {
        totalVehicles: vehicles.length,
        compliant: vehicles.filter(v => v.complianceStatus?.overall === 'compliant').length,
        inMaintenance: vehicles.filter(v => v.status === 'maintenance').length,
        totalMaintenanceRecords: maintenanceRecords.length,
        totalMaintenanceCost: maintenanceRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0)
      },
      vehicles: vehicles.map(v => {
        const vehicleRecords = maintenanceByVehicle[v._id.toString()] || [];
        const stats = getMaintenanceStats(v._id, v.dvirRecords, v.pmSchedule);

        return {
          unitNumber: v.unitNumber,
          vin: v.vin,
          type: v.vehicleType,
          status: v.status,
          mileage: v.mileage,
          annualInspection: {
            lastDate: v.annualInspection?.lastInspectionDate,
            nextDue: v.annualInspection?.nextDueDate,
            status: v.complianceStatus?.inspectionStatus
          },
          maintenanceStats: stats,
          maintenanceRecords: vehicleRecords.slice(0, 20).map(r => ({
            workOrderNumber: r.workOrderNumber,
            serviceDate: r.serviceDate,
            recordType: r.recordType,
            description: r.description,
            vendor: r.provider?.name,
            totalCost: r.totalCost,
            mileage: r.mileage
          })),
          dvirSummary: {
            total: (v.dvirRecords || []).length,
            openDefects: (v.dvirRecords || []).filter(dvir =>
              dvir.defects?.some(d => d.status === 'open' || d.status === 'pending')
            ).length
          },
          pmSchedule: v.pmSchedule ? {
            interval: v.pmSchedule.interval,
            lastCompletedDate: v.pmSchedule.lastCompletedDate,
            nextDueDate: v.pmSchedule.nextDueDate,
            nextDueMileage: v.pmSchedule.nextDueMileage
          } : null
        };
      })
    }
  });
}));

// Helper to build violations row
const buildViolationRow = (v) => ({
  inspectionNumber: v.inspectionNumber || '-',
  violationDate: formatReportDate(v.violationDate),
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('violations', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'violations',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        driverIds: driverIds ? driverIds.split(',') : undefined,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('violations', selectedFields);
    const fileBuffer = await createExcelBuffer('Violations Summary', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'violations',
      rows,
      selectedFields,
      filters: {
        startDate,
        endDate,
        driverIds: driverIds ? driverIds.split(',') : undefined,
        vehicleIds: vehicleIds ? vehicleIds.split(',') : undefined
      }
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
    pdf.addTable(doc, basicHeaders, basicRows, [300, 100], { zebraStripe: true });

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

    pdf.addTable(doc, headers, rows, [70, 100, 70, 50, 100, 80], {
      zebraStripe: true,
      statusColumn: 5 // Status column
    });

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
// NOTE: Audit report intentionally requires 'reports.export' (not 'reports.view')
// because audit data contains sensitive cross-module compliance information
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

  // CSV export with history tracking
  if (format === 'csv') {
    const { headers } = buildExportConfig('audit', selectedFields);
    const fileBuffer = await createCSVBuffer(headers, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'csv',
      reportType: 'audit',
      rows,
      selectedFields,
      filters: {} // Audit has no filters
    });
    return;
  }

  // Excel export with history tracking
  if (format === 'xlsx') {
    const { columns } = buildExportConfig('audit', selectedFields);
    const fileBuffer = await createExcelBuffer('Comprehensive Audit', columns, rows);
    await trackReportExport(req, res, {
      fileBuffer,
      format: 'xlsx',
      reportType: 'audit',
      rows,
      selectedFields,
      filters: {} // Audit has no filters
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
      pdf.addTable(doc, testHeaders, testRows, [200, 100], { zebraStripe: true });
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
        pdf.addTable(doc, basicHeaders, basicRows, [200, 100], { zebraStripe: true });
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
