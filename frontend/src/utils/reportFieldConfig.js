/**
 * Report Field Definitions (Frontend)
 *
 * Mirror of backend config - defines available fields for each of the 9 report types.
 * Each field has: key, label, default (boolean), type (string/date/number/boolean)
 */

export const REPORT_FIELD_DEFINITIONS = {
  dqf: {
    name: 'Driver Qualification File',
    fields: [
      { key: 'driverName', label: 'Driver Name', default: true, type: 'string' },
      { key: 'employeeId', label: 'Employee ID', default: true, type: 'string' },
      { key: 'cdlNumber', label: 'CDL Number', default: true, type: 'string' },
      { key: 'cdlState', label: 'CDL State', default: true, type: 'string' },
      { key: 'cdlClass', label: 'CDL Class', default: false, type: 'string' },
      { key: 'cdlExpiry', label: 'CDL Expiration', default: true, type: 'date' },
      { key: 'medicalExpiry', label: 'Medical Card Expiration', default: true, type: 'date' },
      { key: 'overallStatus', label: 'Overall Status', default: true, type: 'string' },
      { key: 'clearinghouseQueryDate', label: 'Clearinghouse Query Date', default: true, type: 'date' },
      { key: 'clearinghouseStatus', label: 'Clearinghouse Status', default: true, type: 'string' },
      { key: 'mvrReviewDate', label: 'MVR Review Date', default: true, type: 'date' },
      { key: 'mvrApproved', label: 'MVR Approved', default: false, type: 'boolean' },
      { key: 'employmentVerificationStatus', label: 'Employment Verification Status', default: true, type: 'string' },
      { key: 'roadTestDate', label: 'Road Test Date', default: false, type: 'date' },
      { key: 'roadTestResult', label: 'Road Test Result', default: false, type: 'string' }
    ]
  },

  vehicle: {
    name: 'Vehicle Report',
    fields: [
      { key: 'unitNumber', label: 'Unit Number', default: true, type: 'string' },
      { key: 'vin', label: 'VIN', default: true, type: 'string' },
      { key: 'make', label: 'Make', default: true, type: 'string' },
      { key: 'model', label: 'Model', default: true, type: 'string' },
      { key: 'year', label: 'Year', default: true, type: 'number' },
      { key: 'type', label: 'Vehicle Type', default: false, type: 'string' },
      { key: 'status', label: 'Status', default: true, type: 'string' },
      { key: 'annualInspectionDate', label: 'Annual Inspection Date', default: true, type: 'date' },
      { key: 'annualInspectionExpiry', label: 'Annual Inspection Expiry', default: true, type: 'date' },
      { key: 'lastMaintenanceDate', label: 'Last Maintenance Date', default: false, type: 'date' },
      { key: 'mileage', label: 'Current Mileage', default: false, type: 'number' },
      { key: 'overallStatus', label: 'Overall Status', default: true, type: 'string' }
    ]
  },

  violations: {
    name: 'Violations Report',
    fields: [
      { key: 'inspectionNumber', label: 'Inspection Number', default: true, type: 'string' },
      { key: 'violationDate', label: 'Violation Date', default: true, type: 'date' },
      { key: 'violationType', label: 'Violation Type', default: true, type: 'string' },
      { key: 'violationCode', label: 'Violation Code', default: true, type: 'string' },
      { key: 'description', label: 'Description', default: true, type: 'string' },
      { key: 'basic', label: 'BASIC Category', default: true, type: 'string' },
      { key: 'severityWeight', label: 'Severity Weight', default: true, type: 'number' },
      { key: 'driverName', label: 'Driver Name', default: true, type: 'string' },
      { key: 'vehicleUnit', label: 'Vehicle Unit', default: false, type: 'string' },
      { key: 'status', label: 'Status', default: false, type: 'string' },
      { key: 'dataQStatus', label: 'DataQ Status', default: true, type: 'string' },
      { key: 'dataQCaseNumber', label: 'DataQ Case Number', default: false, type: 'string' }
    ]
  },

  audit: {
    name: 'Compliance Audit Report',
    fields: [
      { key: 'section', label: 'Section', default: true, type: 'string' },
      { key: 'metric', label: 'Metric', default: true, type: 'string' },
      { key: 'value', label: 'Value', default: true, type: 'string' }
    ]
  },

  'document-expiration': {
    name: 'Document Expiration Report',
    fields: [
      { key: 'documentType', label: 'Document Type', default: true, type: 'string' },
      { key: 'entityName', label: 'Entity Name', default: true, type: 'string' },
      { key: 'entityType', label: 'Entity Type', default: true, type: 'string' },
      { key: 'expirationDate', label: 'Expiration Date', default: true, type: 'date' },
      { key: 'daysUntilExpiry', label: 'Days Until Expiry', default: true, type: 'number' },
      { key: 'urgency', label: 'Urgency', default: true, type: 'string' }
    ]
  },

  'drug-alcohol': {
    name: 'Drug & Alcohol Compliance Report',
    fields: [
      { key: 'driverName', label: 'Driver Name', default: true, type: 'string' },
      { key: 'testType', label: 'Test Type', default: true, type: 'string' },
      { key: 'testDate', label: 'Test Date', default: true, type: 'date' },
      { key: 'result', label: 'Result', default: true, type: 'string' },
      { key: 'randomPoolIncluded', label: 'Random Pool Included', default: true, type: 'boolean' },
      { key: 'clearinghouseStatus', label: 'Clearinghouse Status', default: true, type: 'string' }
    ]
  },

  'dataq-history': {
    name: 'DataQ Challenge History Report',
    fields: [
      { key: 'caseNumber', label: 'Case Number', default: true, type: 'string' },
      { key: 'submittedDate', label: 'Submitted Date', default: true, type: 'date' },
      { key: 'violationCode', label: 'Violation Code', default: true, type: 'string' },
      { key: 'basic', label: 'BASIC Category', default: true, type: 'string' },
      { key: 'originalSeverity', label: 'Original Severity', default: true, type: 'number' },
      { key: 'status', label: 'Status', default: true, type: 'string' },
      { key: 'resolvedDate', label: 'Resolved Date', default: false, type: 'date' },
      { key: 'outcome', label: 'Outcome', default: true, type: 'string' },
      { key: 'pointsSaved', label: 'Points Saved', default: false, type: 'number' }
    ]
  },

  'accident-summary': {
    name: 'Accident Summary Report',
    fields: [
      { key: 'accidentDate', label: 'Accident Date', default: true, type: 'date' },
      { key: 'driverName', label: 'Driver Name', default: true, type: 'string' },
      { key: 'vehicleUnit', label: 'Vehicle Unit', default: true, type: 'string' },
      { key: 'location', label: 'Location', default: true, type: 'string' },
      { key: 'dotReportable', label: 'DOT Reportable', default: true, type: 'boolean' },
      { key: 'injuries', label: 'Injuries', default: true, type: 'number' },
      { key: 'fatalities', label: 'Fatalities', default: true, type: 'number' },
      { key: 'hazmatRelease', label: 'Hazmat Release', default: false, type: 'boolean' },
      { key: 'estimatedCost', label: 'Estimated Cost', default: false, type: 'number' },
      { key: 'status', label: 'Status', default: true, type: 'string' }
    ]
  },

  'maintenance-costs': {
    name: 'Maintenance Costs Report',
    fields: [
      { key: 'workOrderNumber', label: 'Work Order Number', default: true, type: 'string' },
      { key: 'vehicleUnit', label: 'Vehicle Unit', default: true, type: 'string' },
      { key: 'serviceDate', label: 'Service Date', default: true, type: 'date' },
      { key: 'category', label: 'Category', default: true, type: 'string' },
      { key: 'vendor', label: 'Vendor', default: true, type: 'string' },
      { key: 'description', label: 'Description', default: true, type: 'string' },
      { key: 'laborCost', label: 'Labor Cost', default: true, type: 'number' },
      { key: 'partsCost', label: 'Parts Cost', default: true, type: 'number' },
      { key: 'totalCost', label: 'Total Cost', default: true, type: 'number' }
    ]
  }
};

/**
 * Get default fields for a report type
 * @param {string} reportType - The report type key
 * @returns {string[]} Array of default field keys
 */
export function getDefaultFields(reportType) {
  const definition = REPORT_FIELD_DEFINITIONS[reportType];
  if (!definition) {
    return [];
  }
  return definition.fields
    .filter(field => field.default)
    .map(field => field.key);
}

/**
 * Get all available field keys for a report type
 * @param {string} reportType - The report type key
 * @returns {string[]} Array of all field keys
 */
export function getAllFields(reportType) {
  const definition = REPORT_FIELD_DEFINITIONS[reportType];
  if (!definition) {
    return [];
  }
  return definition.fields.map(field => field.key);
}

/**
 * Get field metadata for a report type
 * @param {string} reportType - The report type key
 * @returns {Array} Array of field objects with metadata
 */
export function getFieldMetadata(reportType) {
  const definition = REPORT_FIELD_DEFINITIONS[reportType];
  if (!definition) {
    return [];
  }
  return definition.fields;
}
