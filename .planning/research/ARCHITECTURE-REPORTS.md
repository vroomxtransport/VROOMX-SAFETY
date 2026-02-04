# Architecture Patterns: Enhanced Reports Module

**Domain:** Report Builder integration with existing VroomX Safety platform
**Researched:** 2026-02-04
**Confidence:** HIGH (based on direct codebase analysis)

## Executive Summary

The enhanced reporting module integrates with an existing Express.js + MongoDB architecture that already has:
- 4 hardcoded report types in `backend/routes/reports.js`
- Scheduled reports system with cron-based execution
- Two PDF generation approaches: pdfkit (utility) and Puppeteer (service)
- Company-scoped data isolation via `restrictToCompany` middleware
- Fire-and-forget email delivery with attachments

The recommended architecture extends existing patterns rather than replacing them, adding a **Report Template schema**, **unified export service**, and **report history model**.

---

## Recommended Architecture

### High-Level Data Flow

```
+-----------------------------------------------------------------------------+
|                              FRONTEND                                       |
+-----------------------------------------------------------------------------+
|  ReportBuilder.jsx          ReportPreview.jsx         ReportHistory.jsx    |
|  - Template selection       - Live preview            - Past reports list  |
|  - Field picker             - Format toggle           - Re-download        |
|  - Filter config            - Share/schedule          - Filter by type     |
+------------+------------------------+-------------------------+------------+
             |                        |                         |
             v                        v                         v
+-----------------------------------------------------------------------------+
|                         backend/routes/reports.js                           |
+-----------------------------------------------------------------------------+
|  POST /api/reports/build     -> reportBuilderService.buildReport()          |
|  POST /api/reports/preview   -> reportBuilderService.generatePreview()      |
|  GET  /api/reports/history   -> ReportHistory.find({ companyId })           |
|  GET  /api/reports/templates -> ReportTemplate.find({ companyId, active })  |
|  POST /api/reports/templates -> ReportTemplate.create()                     |
|  (existing routes preserved: /dqf, /vehicle-maintenance, /violations, etc.) |
+------------+------------------------+-------------------------+------------+
             |                        |                         |
             v                        v                         v
+-----------------------------------------------------------------------------+
|                         SERVICES LAYER                                      |
+-----------------------------------------------------------------------------+
|  reportBuilderService.js                                                    |
|  +-- buildReport(template, filters) -> data + export                        |
|  +-- generatePreview(template, filters, limit=10) -> preview data           |
|  +-- getAvailableFields(dataSource) -> field definitions                    |
|                                                                             |
|  exportService.js (NEW - unified)                                           |
|  +-- toPDF(data, template) -> Buffer                                        |
|  +-- toCSV(data, columns) -> Buffer                                         |
|  +-- toExcel(data, columns, styling) -> Buffer                              |
|  +-- toJSON(data) -> string                                                 |
+------------+------------------------+-------------------------+------------+
             |                        |                         |
             v                        v                         v
+-----------------------------------------------------------------------------+
|                         DATA LAYER                                          |
+-----------------------------------------------------------------------------+
|  ReportTemplate (NEW)       ReportHistory (NEW)       Existing Models       |
|  - companyId (indexed)      - companyId (indexed)     - Driver              |
|  - dataSource               - templateId              - Vehicle             |
|  - selectedFields           - generatedAt             - Violation           |
|  - filters                  - format                  - DrugAlcoholTest     |
|  - sortBy                   - fileUrl (optional)      - Document            |
|  - groupBy                  - parameters              - Company             |
|  - isBuiltIn                - generatedBy             - Accident            |
+-----------------------------------------------------------------------------+
```

---

## Component Boundaries

### New Components (to build)

| Component | Responsibility | Location |
|-----------|---------------|----------|
| `ReportTemplate` model | Store custom + built-in report definitions | `backend/models/ReportTemplate.js` |
| `ReportHistory` model | Track generated reports for re-download | `backend/models/ReportHistory.js` |
| `reportBuilderService` | Dynamic query building, field mapping | `backend/services/reportBuilderService.js` |
| `exportService` | Unified PDF/CSV/Excel generation | `backend/services/exportService.js` |
| `ReportBuilder.jsx` | Template selection + field picker UI | `frontend/src/pages/ReportBuilder.jsx` |
| `ReportPreview.jsx` | Live preview component | `frontend/src/components/ReportPreview.jsx` |

### Modified Components (extend)

| Component | Modification |
|-----------|-------------|
| `backend/routes/reports.js` | Add `/build`, `/preview`, `/history`, `/templates` endpoints |
| `backend/routes/scheduledReports.js` | Support custom templates via `templateId` reference |
| `frontend/src/pages/Reports.jsx` | Add "Create Custom Report" button linking to builder |
| `frontend/src/utils/api.js` | Add `reportsAPI.build()`, `.preview()`, `.getHistory()`, `.saveTemplate()` |

### Preserved Components (no changes)

| Component | Reason |
|-----------|--------|
| `backend/utils/pdfGenerator.js` | Existing pdfkit helper - still useful for simple reports |
| `backend/services/pdfService.js` | Puppeteer service - useful for complex HTML templates |
| `backend/services/scheduledReportService.js` | Cron logic unchanged, just add template support |
| Existing `/dqf`, `/vehicle-maintenance`, etc. routes | Backwards compatibility |

---

## 1. Report Template Architecture

### Schema Design

```javascript
// backend/models/ReportTemplate.js
const reportTemplateSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Metadata
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: String,
  isBuiltIn: {
    type: Boolean,
    default: false  // true for system templates like DQF, false for custom
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Data Source
  dataSource: {
    type: String,
    required: true,
    enum: ['drivers', 'vehicles', 'violations', 'drug_alcohol_tests',
           'documents', 'accidents', 'maintenance', 'inspections']
  },

  // Field Selection (ordered array for column order)
  selectedFields: [{
    field: String,           // e.g., 'firstName', 'cdl.number', 'complianceStatus.overall'
    label: String,           // Display name, e.g., 'Driver Name'
    width: Number,           // PDF column width (optional)
    format: {
      type: String,
      enum: ['text', 'date', 'currency', 'percent', 'boolean', 'status']
    }
  }],

  // Filters
  filters: {
    // Static filters (always applied)
    status: [String],        // e.g., ['active', 'inactive']
    dateField: String,       // Which date field to filter
    dateRange: {
      type: String,
      enum: ['last_7_days', 'last_30_days', 'last_90_days',
             'this_month', 'this_quarter', 'this_year', 'custom', 'all']
    },
    customDateStart: Date,
    customDateEnd: Date,

    // Dynamic filters (user can change at runtime)
    allowUserDateRange: { type: Boolean, default: true },
    allowUserStatusFilter: { type: Boolean, default: true },
    additionalFilters: mongoose.Schema.Types.Mixed  // Flexible for domain-specific filters
  },

  // Sorting
  sortBy: {
    field: String,
    order: { type: String, enum: ['asc', 'desc'], default: 'asc' }
  },

  // Grouping (optional)
  groupBy: {
    field: String,           // e.g., 'complianceStatus.overall' or 'basic'
    showSubtotals: Boolean
  },

  // Summary/Aggregation
  includeSummary: { type: Boolean, default: true },
  summaryFields: [{
    field: String,
    aggregation: { type: String, enum: ['count', 'sum', 'avg', 'min', 'max'] }
  }],

  // Export settings
  defaultFormat: {
    type: String,
    enum: ['pdf', 'csv', 'xlsx', 'json'],
    default: 'pdf'
  },
  pdfOptions: {
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    includeHeader: { type: Boolean, default: true },
    includeFooter: { type: Boolean, default: true },
    logoPosition: { type: String, enum: ['left', 'center', 'none'], default: 'left' }
  }
}, {
  timestamps: true
});

// Indexes
reportTemplateSchema.index({ companyId: 1, isActive: 1 });
reportTemplateSchema.index({ companyId: 1, dataSource: 1 });
reportTemplateSchema.index({ isBuiltIn: 1 });  // For fetching system templates
```

### Built-in Templates Strategy

Seed built-in templates with `companyId: null` and `isBuiltIn: true`. Query logic:

```javascript
// Get templates for a company (includes built-in + custom)
ReportTemplate.find({
  $or: [
    { companyId, isActive: true },       // Company's custom templates
    { isBuiltIn: true, isActive: true }  // System templates
  ]
});
```

---

## 2. Dynamic Field Selection Architecture

### Field Registry Pattern

Create a field registry that maps data sources to available fields. This enables the UI to display field pickers.

```javascript
// backend/config/reportFields.js
const REPORT_FIELD_REGISTRY = {
  drivers: {
    modelName: 'Driver',
    displayName: 'Drivers',
    fields: [
      // Basic info
      { field: 'firstName', label: 'First Name', type: 'text', category: 'Basic Info' },
      { field: 'lastName', label: 'Last Name', type: 'text', category: 'Basic Info' },
      { field: 'fullName', label: 'Full Name', type: 'text', virtual: true, category: 'Basic Info' },
      { field: 'employeeId', label: 'Employee ID', type: 'text', category: 'Basic Info' },
      { field: 'email', label: 'Email', type: 'text', category: 'Basic Info' },
      { field: 'phone', label: 'Phone', type: 'text', category: 'Basic Info' },
      { field: 'hireDate', label: 'Hire Date', type: 'date', category: 'Employment' },
      { field: 'status', label: 'Status', type: 'status', category: 'Employment' },

      // CDL (nested)
      { field: 'cdl.number', label: 'CDL Number', type: 'text', category: 'CDL' },
      { field: 'cdl.state', label: 'CDL State', type: 'text', category: 'CDL' },
      { field: 'cdl.class', label: 'CDL Class', type: 'text', category: 'CDL' },
      { field: 'cdl.expiryDate', label: 'CDL Expiry', type: 'date', category: 'CDL' },

      // Medical
      { field: 'medicalCard.expiryDate', label: 'Medical Card Expiry', type: 'date', category: 'Medical' },
      { field: 'medicalCard.certificationType', label: 'Medical Cert Type', type: 'text', category: 'Medical' },

      // Compliance
      { field: 'complianceStatus.overall', label: 'Overall Status', type: 'status', category: 'Compliance' },
      { field: 'complianceStatus.cdlStatus', label: 'CDL Status', type: 'status', category: 'Compliance' },
      { field: 'complianceStatus.medicalStatus', label: 'Medical Status', type: 'status', category: 'Compliance' },
      { field: 'complianceStatus.mvrStatus', label: 'MVR Status', type: 'status', category: 'Compliance' },
      { field: 'complianceStatus.clearinghouseStatus', label: 'Clearinghouse Status', type: 'status', category: 'Compliance' },

      // Virtuals
      { field: 'daysUntilCdlExpiry', label: 'Days Until CDL Expiry', type: 'number', virtual: true, category: 'Compliance' },
      { field: 'daysUntilMedicalExpiry', label: 'Days Until Medical Expiry', type: 'number', virtual: true, category: 'Compliance' }
    ],
    defaultFields: ['fullName', 'employeeId', 'cdl.number', 'cdl.expiryDate', 'medicalCard.expiryDate', 'complianceStatus.overall'],
    filterableFields: ['status', 'complianceStatus.overall', 'cdl.state', 'cdl.class'],
    sortableFields: ['lastName', 'hireDate', 'cdl.expiryDate', 'medicalCard.expiryDate']
  },

  vehicles: {
    modelName: 'Vehicle',
    displayName: 'Vehicles',
    fields: [
      { field: 'unitNumber', label: 'Unit Number', type: 'text', category: 'Identification' },
      { field: 'vin', label: 'VIN', type: 'text', category: 'Identification' },
      { field: 'vehicleType', label: 'Type', type: 'text', category: 'Identification' },
      { field: 'make', label: 'Make', type: 'text', category: 'Details' },
      { field: 'model', label: 'Model', type: 'text', category: 'Details' },
      { field: 'year', label: 'Year', type: 'number', category: 'Details' },
      { field: 'status', label: 'Status', type: 'status', category: 'Status' },
      { field: 'annualInspection.nextDueDate', label: 'Next Inspection Due', type: 'date', category: 'Compliance' },
      { field: 'annualInspection.lastInspectionDate', label: 'Last Inspection', type: 'date', category: 'Compliance' },
      { field: 'complianceStatus.overall', label: 'Overall Status', type: 'status', category: 'Compliance' },
      { field: 'complianceStatus.inspectionStatus', label: 'Inspection Status', type: 'status', category: 'Compliance' },
      { field: 'currentOdometer.reading', label: 'Current Odometer', type: 'number', category: 'Usage' }
    ],
    defaultFields: ['unitNumber', 'vehicleType', 'vin', 'status', 'annualInspection.nextDueDate', 'complianceStatus.overall'],
    filterableFields: ['status', 'vehicleType', 'complianceStatus.overall'],
    sortableFields: ['unitNumber', 'annualInspection.nextDueDate', 'year']
  },

  violations: {
    modelName: 'Violation',
    displayName: 'Violations',
    fields: [
      { field: 'violationDate', label: 'Date', type: 'date', category: 'Details' },
      { field: 'inspectionNumber', label: 'Inspection #', type: 'text', category: 'Details' },
      { field: 'basic', label: 'BASIC Category', type: 'text', category: 'Classification' },
      { field: 'violationType', label: 'Violation Type', type: 'text', category: 'Classification' },
      { field: 'violationCode', label: 'CFR Code', type: 'text', category: 'Classification' },
      { field: 'description', label: 'Description', type: 'text', category: 'Details' },
      { field: 'severityWeight', label: 'Severity Weight', type: 'number', category: 'Impact' },
      { field: 'outOfService', label: 'OOS', type: 'boolean', category: 'Impact' },
      { field: 'status', label: 'Status', type: 'status', category: 'Status' },
      { field: 'dataQChallenge.status', label: 'DataQ Status', type: 'status', category: 'DataQ' },
      { field: 'fineAmount', label: 'Fine Amount', type: 'currency', category: 'Financial' },
      // Populated fields (from joins)
      { field: 'driverId.fullName', label: 'Driver', type: 'text', category: 'Association', populate: 'driverId' },
      { field: 'vehicleId.unitNumber', label: 'Vehicle', type: 'text', category: 'Association', populate: 'vehicleId' }
    ],
    defaultFields: ['violationDate', 'basic', 'violationType', 'severityWeight', 'driverId.fullName', 'status'],
    filterableFields: ['basic', 'status', 'outOfService'],
    sortableFields: ['violationDate', 'severityWeight', 'basic']
  }
  // ... similar for drug_alcohol_tests, documents, accidents, maintenance
};

module.exports = REPORT_FIELD_REGISTRY;
```

### Dynamic Query Building

```javascript
// backend/services/reportBuilderService.js
const reportBuilderService = {
  /**
   * Build MongoDB projection from selected fields
   */
  buildProjection(selectedFields) {
    const projection = {};
    selectedFields.forEach(f => {
      // Handle nested fields
      const rootField = f.field.split('.')[0];
      projection[rootField] = 1;
    });
    return projection;
  },

  /**
   * Build MongoDB query from template filters
   */
  buildQuery(template, runtimeFilters = {}) {
    const query = { companyId: runtimeFilters.companyId };

    // Status filter
    if (template.filters?.status?.length > 0) {
      query.status = { $in: template.filters.status };
    }

    // Date range filter
    if (template.filters?.dateField) {
      const dateQuery = this.buildDateQuery(
        template.filters.dateRange,
        runtimeFilters.customDateStart || template.filters.customDateStart,
        runtimeFilters.customDateEnd || template.filters.customDateEnd
      );
      if (dateQuery) {
        query[template.filters.dateField] = dateQuery;
      }
    }

    // Additional runtime filters
    if (template.filters?.allowUserStatusFilter && runtimeFilters.status) {
      query.status = Array.isArray(runtimeFilters.status)
        ? { $in: runtimeFilters.status }
        : runtimeFilters.status;
    }

    return query;
  },

  /**
   * Execute report query with dynamic field selection
   */
  async executeQuery(dataSource, query, template) {
    const Model = mongoose.model(REPORT_FIELD_REGISTRY[dataSource].modelName);

    const projection = this.buildProjection(template.selectedFields);

    let queryBuilder = Model.find(query, projection);

    // Handle population for joined fields
    const populateFields = new Set();
    template.selectedFields.forEach(f => {
      const fieldDef = REPORT_FIELD_REGISTRY[dataSource].fields.find(fd => fd.field === f.field);
      if (fieldDef?.populate) {
        populateFields.add(fieldDef.populate);
      }
    });
    populateFields.forEach(p => {
      queryBuilder = queryBuilder.populate(p);
    });

    // Sorting
    if (template.sortBy?.field) {
      const sortOrder = template.sortBy.order === 'desc' ? -1 : 1;
      queryBuilder = queryBuilder.sort({ [template.sortBy.field]: sortOrder });
    }

    return queryBuilder.lean();
  }
};
```

---

## 3. Export Service Architecture

### Unified Export Service

Create a single service that handles all export formats, replacing the scattered approach.

```javascript
// backend/services/exportService.js
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { stringify } = require('csv-stringify/sync');
const pdf = require('../utils/pdfGenerator');  // Reuse existing

const exportService = {
  /**
   * Export data to specified format
   * @param {Array} data - Array of row objects
   * @param {Object} template - ReportTemplate document
   * @param {String} format - 'pdf' | 'csv' | 'xlsx' | 'json'
   * @param {Object} company - Company document for headers
   * @returns {Buffer}
   */
  async export(data, template, format, company) {
    switch (format) {
      case 'pdf':
        return this.toPDF(data, template, company);
      case 'csv':
        return this.toCSV(data, template);
      case 'xlsx':
        return this.toExcel(data, template, company);
      case 'json':
        return this.toJSON(data, template);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  },

  /**
   * Generate PDF using existing pdfGenerator utility
   */
  async toPDF(data, template, company) {
    return new Promise((resolve, reject) => {
      const doc = pdf.createDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      pdf.addHeader(doc, company, template.name);

      // Summary section (if enabled)
      if (template.includeSummary && template.summaryFields?.length > 0) {
        const summaryData = this.calculateSummary(data, template.summaryFields);
        pdf.addSummaryBox(doc, 'Summary', summaryData);
      }

      // Data table
      pdf.addSectionTitle(doc, 'Report Data');

      const headers = template.selectedFields.map(f => f.label);
      const rows = data.map(row =>
        template.selectedFields.map(f => this.formatValue(this.getNestedValue(row, f.field), f.format))
      );
      const columnWidths = template.selectedFields.map(f => f.width || 100);

      pdf.addTable(doc, headers, rows, columnWidths);

      // Footer
      pdf.addFooter(doc);
      doc.end();
    });
  },

  /**
   * Generate CSV
   */
  toCSV(data, template) {
    const headers = template.selectedFields.map(f => f.label);
    const rows = data.map(row =>
      template.selectedFields.map(f => this.formatValue(this.getNestedValue(row, f.field), f.format))
    );

    return Buffer.from(stringify([headers, ...rows]));
  },

  /**
   * Generate Excel with styling
   */
  async toExcel(data, template, company) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(template.name);

    // Header row styling
    const headerRow = worksheet.addRow(template.selectedFields.map(f => f.label));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Data rows
    data.forEach(row => {
      const values = template.selectedFields.map(f => {
        const val = this.getNestedValue(row, f.field);
        // Excel-specific formatting
        if (f.format === 'date' && val) return new Date(val);
        if (f.format === 'currency' && val) return Number(val);
        return val;
      });
      worksheet.addRow(values);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, i) => {
      column.width = template.selectedFields[i]?.width
        ? template.selectedFields[i].width / 7  // Convert PDF points to Excel units
        : 15;
    });

    return workbook.xlsx.writeBuffer();
  },

  /**
   * Generate JSON with metadata
   */
  toJSON(data, template) {
    return JSON.stringify({
      reportName: template.name,
      generatedAt: new Date().toISOString(),
      recordCount: data.length,
      columns: template.selectedFields.map(f => ({
        field: f.field,
        label: f.label,
        format: f.format
      })),
      data
    }, null, 2);
  },

  // Helper: get nested value from object
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  },

  // Helper: format value based on type
  formatValue(value, format) {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return `$${Number(value).toFixed(2)}`;
      case 'percent':
        return `${Number(value).toFixed(1)}%`;
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'status':
        return String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      default:
        return String(value);
    }
  },

  // Helper: calculate summary statistics
  calculateSummary(data, summaryFields) {
    return summaryFields.map(sf => {
      const values = data.map(row => this.getNestedValue(row, sf.field)).filter(v => v != null);
      let value;

      switch (sf.aggregation) {
        case 'count':
          value = values.length;
          break;
        case 'sum':
          value = values.reduce((a, b) => a + Number(b), 0);
          break;
        case 'avg':
          value = values.length > 0 ? values.reduce((a, b) => a + Number(b), 0) / values.length : 0;
          break;
        case 'min':
          value = Math.min(...values.map(Number));
          break;
        case 'max':
          value = Math.max(...values.map(Number));
          break;
        default:
          value = values.length;
      }

      return { value, label: sf.field.split('.').pop() };
    });
  }
};

module.exports = exportService;
```

---

## 4. Report History Architecture

### Schema Design

```javascript
// backend/models/ReportHistory.js
const reportHistorySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Template reference (null for legacy/ad-hoc reports)
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportTemplate'
  },

  // Report metadata
  reportName: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    required: true  // e.g., 'drivers', 'custom', 'dqf', 'violations'
  },

  // Generation details
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Export details
  format: {
    type: String,
    enum: ['pdf', 'csv', 'xlsx', 'json'],
    required: true
  },

  // Parameters used (for re-generation)
  parameters: {
    filters: mongoose.Schema.Types.Mixed,
    dateRange: {
      start: Date,
      end: Date
    },
    selectedFields: [String]  // Snapshot of fields at generation time
  },

  // File storage (optional - for large reports or download history)
  fileUrl: String,              // S3/local path if stored
  fileSize: Number,             // Bytes
  recordCount: Number,          // How many rows

  // Scheduling context (if from scheduled report)
  scheduledReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledReport'
  },

  // Status
  status: {
    type: String,
    enum: ['completed', 'failed', 'expired'],
    default: 'completed'
  },
  errorMessage: String
}, {
  timestamps: true
});

// Indexes for common queries
reportHistorySchema.index({ companyId: 1, generatedAt: -1 });
reportHistorySchema.index({ companyId: 1, reportType: 1, generatedAt: -1 });
reportHistorySchema.index({ generatedBy: 1, generatedAt: -1 });

// TTL: Auto-delete after 90 days (configurable per company later)
reportHistorySchema.index({ generatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

### History Recording Pattern

```javascript
// In reportBuilderService.js
async recordHistory(companyId, userId, template, format, data, fileUrl = null) {
  return ReportHistory.create({
    companyId,
    templateId: template._id,
    reportName: template.name,
    reportType: template.dataSource,
    generatedBy: userId,
    format,
    parameters: {
      filters: template.filters,
      selectedFields: template.selectedFields.map(f => f.field)
    },
    fileUrl,
    recordCount: data.length,
    status: 'completed'
  });
}
```

---

## 5. Preview Generation Architecture

### Server-Side Preview (Recommended)

Generate previews server-side to:
- Apply same filters as final report
- Limit data to 10-20 rows for performance
- Return formatted data ready for display

```javascript
// backend/services/reportBuilderService.js
async generatePreview(template, runtimeFilters, options = {}) {
  const limit = options.limit || 10;
  const companyId = runtimeFilters.companyId;

  const query = this.buildQuery(template, runtimeFilters);
  const Model = mongoose.model(REPORT_FIELD_REGISTRY[template.dataSource].modelName);

  // Get total count for display
  const totalCount = await Model.countDocuments(query);

  // Get limited data for preview
  const data = await this.executeQuery(template.dataSource, query, template)
    .limit(limit);

  // Format for display
  const formattedData = data.map(row => {
    const formatted = {};
    template.selectedFields.forEach(f => {
      formatted[f.field] = {
        value: exportService.getNestedValue(row, f.field),
        formatted: exportService.formatValue(exportService.getNestedValue(row, f.field), f.format),
        label: f.label
      };
    });
    return formatted;
  });

  return {
    preview: formattedData,
    totalCount,
    showing: data.length,
    columns: template.selectedFields.map(f => ({
      field: f.field,
      label: f.label,
      format: f.format
    }))
  };
}
```

### Frontend Preview Component

```jsx
// frontend/src/components/ReportPreview.jsx
const ReportPreview = ({ template, filters }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reportsAPI.preview(template._id, filters);
      setPreview(data);
    } catch (err) {
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [template, filters]);

  useEffect(() => {
    if (template?._id) {
      fetchPreview();
    }
  }, [template, filters, fetchPreview]);

  return (
    <div className="report-preview">
      {loading ? (
        <LoadingSpinner />
      ) : preview ? (
        <>
          <div className="preview-header">
            <span>Showing {preview.showing} of {preview.totalCount} records</span>
          </div>
          <table className="preview-table">
            <thead>
              <tr>
                {preview.columns.map(col => (
                  <th key={col.field}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.preview.map((row, i) => (
                <tr key={i}>
                  {preview.columns.map(col => (
                    <td key={col.field}>{row[col.field]?.formatted}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>Configure your report to see a preview</p>
      )}
    </div>
  );
};
```

---

## Integration Points with Existing Components

### 1. Scheduled Reports Integration

Modify `ScheduledReport` model to support custom templates:

```javascript
// Add to ScheduledReport schema
templateId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ReportTemplate'
},
// reportType becomes optional when templateId is set
reportType: {
  type: String,
  enum: ['dqf', 'vehicle-maintenance', 'violations', 'audit', 'csa', 'custom'],
  required: function() { return !this.templateId; }
}
```

Modify `scheduledReportService.generateReportPDF`:

```javascript
async generateReportPDF(schedule) {
  // If custom template, use report builder
  if (schedule.templateId) {
    const template = await ReportTemplate.findById(schedule.templateId);
    const data = await reportBuilderService.executeQuery(
      template.dataSource,
      reportBuilderService.buildQuery(template, { companyId: schedule.companyId._id }),
      template
    );
    return exportService.toPDF(data, template, schedule.companyId);
  }

  // Otherwise, use existing hardcoded logic
  switch (schedule.reportType) {
    case 'dqf':
      return this.generateDQFReport(companyId, company);
    // ... etc
  }
}
```

### 2. Audit Logging Integration

Use existing `auditService` for report generation tracking:

```javascript
// In reports route
router.post('/build', checkPermission('reports', 'export'), asyncHandler(async (req, res) => {
  // ... build report logic ...

  // Log the export action
  auditService.log(req, 'export', 'report', history._id, {
    templateId: template._id,
    templateName: template.name,
    format,
    recordCount: data.length
  });

  // ... return response ...
}));
```

### 3. Email Service Integration

For emailing reports, use existing `emailService`:

```javascript
// In reports route
router.post('/build', asyncHandler(async (req, res) => {
  const { email, templateId, format } = req.body;

  // ... generate report buffer ...

  if (email) {
    await emailService.send({
      to: email,
      subject: `Report: ${template.name}`,
      templateName: 'report-delivery',
      variables: {
        firstName: req.user.firstName,
        reportName: template.name,
        recordCount: data.length
      },
      attachments: [{
        filename: `${template.name}.${format}`,
        content: buffer
      }],
      category: 'report',
      companyId: req.companyFilter.companyId
    });
  }
}));
```

---

## Suggested Build Order

Based on dependencies and incremental value delivery:

### Phase 1: Foundation (Week 1-2)
1. **ReportTemplate model** - Schema, indexes, validation
2. **ReportHistory model** - Schema, TTL index
3. **Report field registry** - `backend/config/reportFields.js`
4. **Seed built-in templates** - Migrate existing 4 report types to template format

### Phase 2: Core Services (Week 2-3)
5. **reportBuilderService** - Query building, field projection, preview generation
6. **exportService** - Unified PDF/CSV/Excel export (install `exceljs`, `csv-stringify`)
7. **Reports routes** - `/build`, `/preview`, `/templates`, `/history` endpoints

### Phase 3: Frontend (Week 3-4)
8. **API client updates** - Add new endpoints to `api.js`
9. **ReportBuilder.jsx** - Template selection, field picker, filter config
10. **ReportPreview.jsx** - Live preview component
11. **ReportHistory.jsx** - History list with re-download

### Phase 4: Integration (Week 4-5)
12. **Scheduled reports integration** - Support `templateId` in scheduling
13. **Email integration** - Send reports via email
14. **Audit logging** - Track report generation in audit log

---

## Anti-Patterns to Avoid

### 1. Client-Side Query Building
**Don't:** Let frontend construct MongoDB queries
**Why:** Security risk (query injection), inconsistent filtering
**Instead:** Frontend sends field selections, backend builds safe queries

### 2. Storing Generated Files for All Reports
**Don't:** Save every generated report to S3/disk
**Why:** Storage costs, GDPR concerns, stale data
**Instead:** Generate on-demand, optionally cache popular reports for 24h

### 3. Monolithic Export Function
**Don't:** One giant function with if/else for each format
**Why:** Hard to test, extend, maintain
**Instead:** Strategy pattern with format-specific handlers in exportService

### 4. Hardcoded Field Lists
**Don't:** Duplicate field definitions across backend and frontend
**Why:** Inconsistency, maintenance burden
**Instead:** Single source of truth in `reportFields.js`, expose via API

### 5. Ignoring Virtual Fields
**Don't:** Only support persisted database fields
**Why:** Useful computed fields like `fullName`, `daysUntilExpiry` unavailable
**Instead:** Support virtuals in field registry, ensure `.lean()` queries include virtuals where needed

---

## Dependencies to Install

```bash
# Backend
cd backend
npm install exceljs csv-stringify

# No new frontend dependencies needed (uses existing React patterns)
```

---

## Quality Checklist

- [x] Integration points clearly identified (reports routes, scheduled reports, email service, audit service)
- [x] New vs modified components explicit (2 new models, 2 new services, 3 new frontend components, 4 modified files)
- [x] Build order considers existing dependencies (models first, then services, then routes, then frontend)
- [x] Existing patterns preserved (pdfGenerator reused, company-scoping maintained, fire-and-forget patterns followed)

---

## Sources

- Direct codebase analysis (HIGH confidence)
- `backend/routes/reports.js` - Current report implementation (lines 1-502)
- `backend/services/scheduledReportService.js` - Scheduling patterns (lines 1-659)
- `backend/utils/pdfGenerator.js` - PDF generation utility (lines 1-249)
- `backend/services/pdfService.js` - Puppeteer PDF service (lines 1-256)
- `backend/models/Driver.js`, `Vehicle.js`, `Violation.js` - Data model schemas
- `backend/services/auditService.js` - Audit logging pattern (lines 1-91)
- `backend/services/emailService.js` - Email service pattern (lines 1-100)
- `frontend/src/utils/api.js` - API client patterns (lines 1-200)
