# Phase 11: Report Builder - Research

**Researched:** 2026-02-04
**Domain:** Report customization with field selection, template persistence, and data preview
**Confidence:** HIGH

## Summary

This phase adds report builder functionality allowing users to customize report output by selecting which fields/columns appear, save configurations as reusable templates, and preview data before downloading. The codebase already has 9 report types (Phases 8-10), unified filtering (Phase 9), and streaming export infrastructure. The primary work involves: (1) defining available fields per report type with metadata, (2) creating a ReportTemplate model following the ChecklistTemplate pattern, (3) adding a field selection UI component, (4) implementing a preview endpoint returning first 10 rows, and (5) seeding pre-built FMCSA templates.

The backend ScheduledReport model already demonstrates storing filter configurations per report - the new ReportTemplate model extends this pattern with field selection. The frontend has established patterns for checkbox-based selection (MultiSelectDropdown component) that can be adapted for field selection. TanStack Table v8 provides column visibility management but is overkill for this use case - simple checkbox lists following existing UI patterns are sufficient.

**Primary recommendation:** Create a ReportTemplate model with `selectedFields[]` array, extend report endpoints with `fields` query parameter, add preview endpoints returning limit=10, and build a FieldSelector component using the existing checkbox/filter UI patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mongoose | (existing) | ReportTemplate model | Company-scoped templates following ChecklistTemplate pattern |
| React | 18 | FieldSelector UI component | Standard controlled checkbox state management |
| ExcelJS | (existing) | Dynamic column export | Already handles variable column definitions |
| @fast-csv/format | (existing) | Dynamic CSV export | Headers already passed as object keys |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash/pick | (existing) | Field filtering | Filtering data objects to selected fields only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom checkbox list | TanStack Table column visibility | TanStack is powerful but overkill for simple field selection; adds bundle size |
| MongoDB ReportTemplate model | localStorage | Templates must sync across devices and persist on logout |
| Backend field filtering | Frontend-only filtering | Backend filtering reduces data transfer; required for PDF generation |

**No new installations required** - all necessary libraries are already in the project.

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── models/
│   └── ReportTemplate.js          # NEW: Template storage model
├── routes/
│   ├── reports.js                 # MODIFY: Add ?fields= param, add /preview endpoints
│   └── reportTemplates.js         # NEW: CRUD for templates
├── config/
│   └── reportFieldDefinitions.js  # NEW: Field metadata per report type

frontend/src/
├── components/
│   ├── reports/
│   │   ├── FieldSelector.jsx      # NEW: Checkbox field selection
│   │   ├── ReportPreview.jsx      # NEW: 10-row preview table
│   │   └── TemplateManager.jsx    # NEW: Save/load/duplicate templates
├── pages/
│   └── Reports.jsx                # MODIFY: Integrate builder components
├── utils/
│   └── reportFieldConfig.js       # NEW: Frontend field definitions
```

### Pattern 1: ReportTemplate Model (Following ChecklistTemplate Pattern)
**What:** Company-scoped model storing report configuration with filters and field selection
**When to use:** Saving user report configurations as templates
**Example:**
```javascript
// backend/models/ReportTemplate.js
const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  reportType: {
    type: String,
    required: true,
    enum: ['dqf', 'vehicle', 'violations', 'audit', 'document-expiration',
           'drug-alcohol', 'dataq-history', 'accident-summary', 'maintenance-costs'],
    index: true
  },
  // Field selection - array of field keys to include
  selectedFields: [{
    type: String,
    trim: true
  }],
  // Filter configuration (same structure as ScheduledReport.filters)
  filters: {
    startDate: Date,
    endDate: Date,
    driverIds: [{ type: mongoose.Schema.Types.ObjectId }],
    vehicleIds: [{ type: mongoose.Schema.Types.ObjectId }],
    status: String
  },
  // System vs user templates
  isSystemTemplate: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for common queries
reportTemplateSchema.index({ companyId: 1, reportType: 1 });
reportTemplateSchema.index({ isSystemTemplate: 1, reportType: 1 });

// Static: Get pre-built FMCSA templates
reportTemplateSchema.statics.getSystemTemplates = function() {
  return [
    {
      name: 'DQF Audit Export',
      description: '49 CFR 391.51 compliance fields for DOT audit',
      reportType: 'dqf',
      isSystemTemplate: true,
      selectedFields: [
        'driverName', 'employeeId', 'cdlNumber', 'cdlState', 'cdlExpiry',
        'medicalExpiry', 'clearinghouseQueryDate', 'clearinghouseStatus',
        'mvrReviewDate', 'employmentVerificationStatus', 'overallStatus'
      ]
    },
    {
      name: 'Vehicle Inspection Summary',
      description: 'Annual inspection dates and compliance status',
      reportType: 'vehicle',
      isSystemTemplate: true,
      selectedFields: [
        'unitNumber', 'vin', 'make', 'year', 'annualInspectionDate',
        'annualInspectionExpiry', 'overallStatus'
      ]
    },
    {
      name: 'Violations Summary',
      description: 'BASIC categories, severity, and DataQ status',
      reportType: 'violations',
      isSystemTemplate: true,
      selectedFields: [
        'inspectionNumber', 'violationDate', 'violationType', 'violationCode',
        'basic', 'severityWeight', 'driverName', 'dataQStatus'
      ]
    }
  ];
};

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
```

### Pattern 2: Field Definition Configuration
**What:** Centralized field metadata with display names, default inclusion, and export-specific handling
**When to use:** Defining available fields per report type
**Example:**
```javascript
// backend/config/reportFieldDefinitions.js
const REPORT_FIELD_DEFINITIONS = {
  dqf: {
    fields: [
      { key: 'driverName', label: 'Driver Name', default: true, sortable: true },
      { key: 'employeeId', label: 'Employee ID', default: true },
      { key: 'cdlNumber', label: 'CDL Number', default: true },
      { key: 'cdlState', label: 'CDL State', default: true },
      { key: 'cdlClass', label: 'CDL Class', default: false },
      { key: 'cdlExpiry', label: 'CDL Expiry', default: true, type: 'date' },
      { key: 'medicalExpiry', label: 'Medical Card Expiry', default: true, type: 'date' },
      { key: 'overallStatus', label: 'Overall Status', default: true },
      // 391.51 fields
      { key: 'clearinghouseQueryDate', label: 'Clearinghouse Query Date', default: false, type: 'date' },
      { key: 'clearinghouseStatus', label: 'Clearinghouse Status', default: false },
      { key: 'mvrReviewDate', label: 'MVR Review Date', default: false, type: 'date' },
      { key: 'mvrApproved', label: 'MVR Approved', default: false, type: 'boolean' },
      { key: 'employmentVerificationStatus', label: 'Employment Verification', default: false },
      { key: 'roadTestDate', label: 'Road Test Date', default: false, type: 'date' },
      { key: 'roadTestResult', label: 'Road Test Result', default: false }
    ]
  },
  violations: {
    fields: [
      { key: 'inspectionNumber', label: 'Inspection Number', default: true },
      { key: 'violationDate', label: 'Violation Date', default: true, type: 'date' },
      { key: 'violationType', label: 'Type', default: true },
      { key: 'violationCode', label: 'Code', default: true },
      { key: 'description', label: 'Description', default: false },
      { key: 'basic', label: 'BASIC', default: true },
      { key: 'severityWeight', label: 'Severity Weight', default: true, type: 'number' },
      { key: 'driverName', label: 'Driver', default: true },
      { key: 'vehicleUnit', label: 'Vehicle', default: false },
      { key: 'status', label: 'Status', default: true },
      { key: 'dataQStatus', label: 'DataQ Status', default: false },
      { key: 'dataQCaseNumber', label: 'DataQ Case #', default: false }
    ]
  }
  // ... similar definitions for other 7 report types
};

// Helper: Get default fields for a report type
const getDefaultFields = (reportType) => {
  const definition = REPORT_FIELD_DEFINITIONS[reportType];
  if (!definition) return [];
  return definition.fields.filter(f => f.default).map(f => f.key);
};

// Helper: Validate fields against definition
const validateFields = (reportType, fields) => {
  const definition = REPORT_FIELD_DEFINITIONS[reportType];
  if (!definition) return { valid: false, error: 'Unknown report type' };

  const validKeys = definition.fields.map(f => f.key);
  const invalidFields = fields.filter(f => !validKeys.includes(f));

  if (invalidFields.length > 0) {
    return { valid: false, error: `Invalid fields: ${invalidFields.join(', ')}` };
  }
  return { valid: true };
};

module.exports = {
  REPORT_FIELD_DEFINITIONS,
  getDefaultFields,
  validateFields
};
```

### Pattern 3: Backend Field Filtering in Report Endpoints
**What:** Accept `fields` query parameter and filter output to selected fields only
**When to use:** All report endpoints
**Example:**
```javascript
// In routes/reports.js - extend existing DQF endpoint
router.get('/dqf', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverIds, format = 'json', fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // Parse fields parameter (comma-separated or default)
  const { getDefaultFields, validateFields, REPORT_FIELD_DEFINITIONS } = require('../config/reportFieldDefinitions');
  let selectedFields = fields ? fields.split(',') : getDefaultFields('dqf');

  // Validate fields
  const validation = validateFields('dqf', selectedFields);
  if (!validation.valid) {
    throw new AppError(validation.error, 400);
  }

  // ... existing data fetching ...

  // Map full data to row objects
  const allRows = drivers.map(d => ({
    driverName: `${d.firstName} ${d.lastName}`,
    employeeId: d.employeeId || '-',
    cdlNumber: d.cdl?.number || '-',
    cdlState: d.cdl?.state || '-',
    cdlClass: d.cdl?.class || '-',
    cdlExpiry: d.cdl?.expiryDate,
    medicalExpiry: d.medicalCard?.expiryDate,
    overallStatus: d.complianceStatus?.overall || '-',
    clearinghouseQueryDate: d.clearinghouse?.lastQueryDate,
    clearinghouseStatus: d.clearinghouse?.status || '-',
    mvrReviewDate: d.documents?.mvrReviews?.[0]?.reviewDate,
    mvrApproved: d.documents?.mvrReviews?.[0]?.approved,
    employmentVerificationStatus: getEmploymentVerificationStatus(d.documents?.employmentVerification),
    roadTestDate: d.documents?.roadTest?.date,
    roadTestResult: d.documents?.roadTest?.result || '-'
  }));

  // Filter to selected fields only
  const fieldDefs = REPORT_FIELD_DEFINITIONS.dqf.fields;
  const rows = allRows.map(row => {
    const filtered = {};
    selectedFields.forEach(key => {
      filtered[key] = row[key];
    });
    return filtered;
  });

  // Build dynamic headers for export
  const headers = {};
  const columns = [];
  selectedFields.forEach(key => {
    const def = fieldDefs.find(f => f.key === key);
    if (def) {
      headers[key] = def.label;
      columns.push({ header: def.label, key, width: 15 });
    }
  });

  if (format === 'csv') {
    exportService.streamCSV(res, { reportType: 'dqf-report', headers, rows });
    return;
  }

  if (format === 'xlsx') {
    await exportService.streamExcel(res, {
      reportType: 'dqf-report',
      sheetName: 'Driver Qualification Files',
      columns,
      rows
    });
    return;
  }

  // JSON response with selected fields
  return res.json({ success: true, report: { ... }, data: rows });
}));
```

### Pattern 4: Preview Endpoint (First 10 Rows)
**What:** Dedicated endpoint returning limited rows for preview before full download
**When to use:** Preview functionality
**Example:**
```javascript
// In routes/reports.js - add preview endpoints
router.get('/dqf/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverIds, fields } = req.query;
  const companyId = req.companyFilter.companyId;
  const PREVIEW_LIMIT = 10;

  const { getDefaultFields, REPORT_FIELD_DEFINITIONS } = require('../config/reportFieldDefinitions');
  let selectedFields = fields ? fields.split(',') : getDefaultFields('dqf');

  // Build query with filters
  const query = { companyId, status: 'active' };
  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) query._id = { $in: ids };
  }

  // Get total count for display
  const totalCount = await Driver.countDocuments(query);

  // Fetch limited data for preview
  const drivers = await Driver.find(query)
    .select('-ssn')
    .limit(PREVIEW_LIMIT)
    .lean();

  // Transform to selected fields only
  const rows = drivers.map(d => {
    const full = { /* all field mappings */ };
    const filtered = {};
    selectedFields.forEach(key => filtered[key] = full[key]);
    return filtered;
  });

  // Get column definitions for preview table headers
  const fieldDefs = REPORT_FIELD_DEFINITIONS.dqf.fields;
  const columns = selectedFields.map(key => {
    const def = fieldDefs.find(f => f.key === key);
    return { key, label: def?.label || key, type: def?.type || 'string' };
  });

  return res.json({
    success: true,
    preview: {
      rows,
      columns,
      totalCount,
      previewCount: rows.length,
      hasMore: totalCount > PREVIEW_LIMIT
    }
  });
}));
```

### Pattern 5: FieldSelector Component (Frontend)
**What:** Checkbox list for selecting which fields to include in report
**When to use:** Report builder UI
**Example:**
```jsx
// frontend/src/components/reports/FieldSelector.jsx
import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiCheckSquare, FiSquare } from 'react-icons/fi';

const FieldSelector = ({
  reportType,
  fieldDefinitions,
  selectedFields,
  onFieldsChange
}) => {
  const fields = fieldDefinitions[reportType]?.fields || [];

  const handleToggleField = (fieldKey) => {
    if (selectedFields.includes(fieldKey)) {
      onFieldsChange(selectedFields.filter(f => f !== fieldKey));
    } else {
      onFieldsChange([...selectedFields, fieldKey]);
    }
  };

  const handleSelectAll = () => {
    onFieldsChange(fields.map(f => f.key));
  };

  const handleSelectDefaults = () => {
    onFieldsChange(fields.filter(f => f.default).map(f => f.key));
  };

  const handleClearAll = () => {
    onFieldsChange([]);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-zinc-800 dark:text-zinc-100">
          Fields to Include ({selectedFields.length}/{fields.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Select All
          </button>
          <span className="text-zinc-300">|</span>
          <button
            onClick={handleSelectDefaults}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Defaults
          </button>
          <span className="text-zinc-300">|</span>
          <button
            onClick={handleClearAll}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {fields.map((field) => (
          <label
            key={field.key}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
              selectedFields.includes(field.key)
                ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                : 'bg-zinc-50 dark:bg-zinc-800 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedFields.includes(field.key)}
              onChange={() => handleToggleField(field.key)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
              {field.label}
            </span>
            {field.default && (
              <span className="text-xs text-zinc-400">(default)</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

export default FieldSelector;
```

### Pattern 6: ReportPreview Component (Frontend)
**What:** Table displaying first 10 rows with selected columns
**When to use:** Preview before download
**Example:**
```jsx
// frontend/src/components/reports/ReportPreview.jsx
import { useState, useEffect } from 'react';
import { reportsAPI } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';

const ReportPreview = ({
  reportType,
  selectedFields,
  filters,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          ...filters,
          fields: selectedFields.join(',')
        };
        const response = await reportsAPI.getPreview(reportType, params);
        setPreview(response.data.preview);
      } catch (err) {
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    if (selectedFields.length > 0) {
      fetchPreview();
    }
  }, [reportType, selectedFields, filters]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <LoadingSpinner />
        <p className="mt-2 text-zinc-500">Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded">{error}</div>
    );
  }

  if (!preview || selectedFields.length === 0) {
    return (
      <div className="p-4 text-zinc-500 text-center">
        Select at least one field to preview
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <div>
          <span className="font-medium text-zinc-800 dark:text-zinc-100">Preview</span>
          <span className="ml-2 text-sm text-zinc-500">
            Showing {preview.previewCount} of {preview.totalCount} rows
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            Close
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              {preview.columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                {preview.columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                  >
                    {formatCellValue(row[col.key], col.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview.hasMore && (
        <div className="p-2 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800">
          + {preview.totalCount - preview.previewCount} more rows in full report
        </div>
      )}
    </div>
  );
};

// Helper to format cell values by type
const formatCellValue = (value, type) => {
  if (value == null || value === '-') return '-';
  if (type === 'date' && value) {
    return new Date(value).toLocaleDateString();
  }
  if (type === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
};

export default ReportPreview;
```

### Anti-Patterns to Avoid
- **Filtering fields only in frontend:** Backend must filter for PDF generation and to reduce data transfer
- **Storing field definitions only in frontend:** Backend needs definitions for validation and export
- **Allowing empty field selection:** At least one field must be selected
- **Creating new models for each template type:** Use single ReportTemplate model with reportType discriminator
- **Duplicating filter logic:** Templates should store filter config, not duplicate ScheduledReport pattern

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Checkbox state management | Custom toggle array logic | React controlled inputs with spread | Already used in MultiSelectDropdown |
| Template model pattern | New pattern from scratch | Follow ChecklistTemplate structure | Proven pattern for company-scoped templates with defaults |
| Dynamic column export | Rebuild export service | Extend existing exportService with dynamic columns | Already handles column definitions |
| Field validation | Manual array checking | Simple Set-based validation | Predictable, no edge cases |
| Preview table | TanStack Table | Simple HTML table with map | Preview is read-only, no sorting/filtering needed |

**Key insight:** The ScheduledReport and ChecklistTemplate models already demonstrate patterns for storing configurations. This phase composes existing patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Fields Parameter Breaks Existing Reports
**What goes wrong:** Adding `fields` param changes default output, breaking existing integrations
**Why it happens:** Changing default behavior without backward compatibility
**How to avoid:** If `fields` param is not provided, return ALL fields (current behavior). Only filter when explicitly requested.
**Warning signs:** Existing scheduled reports or API consumers get fewer columns than expected

### Pitfall 2: Template with Invalid Fields After Schema Change
**What goes wrong:** Saved template references field that no longer exists
**Why it happens:** Field definitions change, but stored templates aren't validated on load
**How to avoid:** Filter out invalid fields when loading template; show warning that some fields were removed
**Warning signs:** Errors when loading old templates after code updates

### Pitfall 3: Preview Shows Different Data Than Export
**What goes wrong:** Preview shows 10 rows, but export sorts differently, showing different rows
**Why it happens:** Preview and export queries use different sort orders
**How to avoid:** Apply identical query/sort to both preview and export endpoints
**Warning signs:** User previews one set of drivers, exports different ones

### Pitfall 4: PDF Generation Ignores Field Selection
**What goes wrong:** PDF always shows all columns regardless of field selection
**Why it happens:** pdfGenerator.js uses hardcoded column definitions
**How to avoid:** Pass dynamic columns to PDF generator based on selectedFields
**Warning signs:** CSV/Excel respect field selection, PDF doesn't

### Pitfall 5: System Templates Editable
**What goes wrong:** User modifies system template, affecting all users
**Why it happens:** No protection on isSystemTemplate=true records
**How to avoid:** System templates can only be duplicated, not edited. Block PUT/DELETE on isSystemTemplate=true
**Warning signs:** Pre-built templates disappear or have wrong fields

### Pitfall 6: Too Many Fields Selected Crashes Preview
**What goes wrong:** Selecting 20+ fields causes horizontal overflow or performance issues
**Why it happens:** No consideration for wide table rendering
**How to avoid:** Preview table uses horizontal scroll; consider max column limit or chunking for very wide reports
**Warning signs:** Preview table breaks layout or is unusable

## Code Examples

Verified patterns from the existing codebase:

### Existing Template Pattern (ChecklistTemplate)
```javascript
// From backend/models/ChecklistTemplate.js - pattern to follow
const checklistTemplateSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  category: { type: String, enum: [...], default: 'custom' },
  items: [itemSchema],
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Static method for default templates
checklistTemplateSchema.statics.getDefaultTemplates = function() {
  return [
    { name: 'Template 1', items: [...], isDefault: true },
    // ...
  ];
};
```

### Existing Filter Configuration Pattern
```javascript
// From backend/models/ScheduledReport.js - filters structure to reuse
filters: {
  startDate: Date,
  endDate: Date,
  driverId: mongoose.Schema.Types.ObjectId,
  vehicleId: mongoose.Schema.Types.ObjectId,
  status: String
}
```

### Existing Export Column Pattern
```javascript
// From routes/reports.js - dynamic columns already work
await exportService.streamExcel(res, {
  reportType: 'report-name',
  sheetName: 'Sheet Name',
  columns: [
    { header: 'Display Name', key: 'fieldKey', width: 15 }
  ],
  rows
});
```

### Existing Multi-Select UI Pattern
```jsx
// From frontend/src/components/filters/MultiSelectDropdown.jsx - checkbox pattern
<div className="flex flex-wrap gap-2">
  {options.map(option => (
    <label key={option.value} className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selected.includes(option.value)}
        onChange={() => handleToggle(option.value)}
      />
      <span>{option.label}</span>
    </label>
  ))}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed report columns | User-selectable fields | Industry standard | More flexible reports without code changes |
| Save filters only | Save filters + fields as template | Phase 11 | Complete report configuration reuse |
| Full data download then filter | Backend field filtering | Performance best practice | Smaller payloads, faster downloads |
| No preview | Preview before download | UX best practice | Users validate before committing to download |

**Current best practices (2026):**
- Field selection via checkboxes is sufficient for SMB users (drag-and-drop is overkill)
- Templates should be company-scoped for multi-tenant isolation
- System templates (pre-built) should be read-only and duplicatable
- Preview should show actual data, not placeholder/mock data
- Backend should validate field selection against current schema

## Open Questions

Things that couldn't be fully resolved:

1. **Field ordering in output**
   - What we know: Users select which fields, but order may matter in exports
   - What's unclear: Should users be able to reorder fields, or use definition order?
   - Recommendation: For Phase 11, use definition order (order fields appear in checkbox list). Drag-and-drop reordering is out of scope per REQUIREMENTS.md.

2. **Template sharing across companies**
   - What we know: companyId scopes templates to companies
   - What's unclear: Should super admins be able to create "global" templates?
   - Recommendation: System templates (seeded) are global. User templates are company-scoped. No cross-company sharing in Phase 11.

3. **Field definition versioning**
   - What we know: Field definitions live in code; templates reference by field key
   - What's unclear: How to handle schema migrations that rename fields
   - Recommendation: Field keys should be stable. If renaming, add alias lookup in validation.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `backend/models/ChecklistTemplate.js` - Template model pattern
- Existing codebase: `backend/models/ScheduledReport.js` - Filters schema, report types
- Existing codebase: `backend/services/exportService.js` - Dynamic column export
- Existing codebase: `frontend/src/components/filters/MultiSelectDropdown.jsx` - Checkbox UI pattern
- Existing codebase: `backend/routes/reports.js` - Report endpoint structure
- [TanStack Table Docs - Column Visibility](https://tanstack.com/table/v8/docs/guide/column-visibility) - Column toggle pattern (reference, not using library)

### Secondary (MEDIUM confidence)
- [React Checkbox Component Patterns](https://www.robinwieruch.de/react-checkbox/) - Controlled checkbox state
- [Material React Table](https://www.material-react-table.com/docs/examples/basic) - Column hiding UI patterns

### Tertiary (LOW confidence)
- General web search results on report builder patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using only existing libraries and proven patterns
- Architecture: HIGH - Extending established model patterns (ChecklistTemplate, ScheduledReport)
- Field selection: HIGH - Simple checkbox state, no complex library needed
- Preview: HIGH - Standard limit/offset query pattern
- Pitfalls: MEDIUM - Based on template system experience, may surface edge cases

**Research date:** 2026-02-04
**Valid until:** 2026-05-04 (patterns are stable; field definitions may evolve with new reports)
