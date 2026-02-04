---
phase: 11
plan: 01
subsystem: report-builder
tags: [mongoose, express, crud, field-definitions]
dependency_graph:
  requires: []
  provides: [ReportTemplate model, field definitions config, CRUD routes]
  affects: [11-02, 11-03]
tech_stack:
  added: []
  patterns: [field validation with config, system template protection]
key_files:
  created:
    - backend/models/ReportTemplate.js
    - backend/config/reportFieldDefinitions.js
    - backend/routes/reportTemplates.js
  modified:
    - backend/routes/index.js
decisions:
  - key: system-template-protection
    choice: "403 on edit/delete of isSystemTemplate=true"
    rationale: "Prevent users from breaking pre-built FMCSA templates"
  - key: field-validation-via-config
    choice: "validateFields helper validates against REPORT_FIELD_DEFINITIONS"
    rationale: "Single source of truth for valid fields per report type"
  - key: duplicate-creates-user-owned
    choice: "Duplicating system template sets isSystemTemplate=false"
    rationale: "Users can customize copies without affecting originals"
metrics:
  duration: 2min
  completed: 2026-02-04
---

# Phase 11 Plan 01: Report Template Backend Foundation Summary

ReportTemplate model with selectedFields array, field definitions for 9 report types, CRUD routes at /api/report-templates with system template protection.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 348da5e | feat | Create ReportTemplate model and field definitions |
| 036a6b6 | feat | Add reportTemplates CRUD routes |

## What Was Built

### ReportTemplate Model
- Company-scoped mongoose model with `selectedFields` array
- `isSystemTemplate` flag distinguishes pre-built from user-created
- `reportType` enum covers all 9 report types
- `filters` subdocument for saved date ranges, driver/vehicle IDs, status
- 3 system templates defined: DQF Audit Export, Vehicle Inspection Summary, Violations Summary
- Virtual `fieldCount` for convenience

### Field Definitions Config
- `REPORT_FIELD_DEFINITIONS` object with 9 report types
- Each field has: key, label, default (boolean), type (string/date/number/boolean)
- `getDefaultFields(reportType)` returns array of default field keys
- `validateFields(reportType, fields)` returns `{ valid, invalidFields }`
- `getFieldMetadata(reportType)` returns full field objects
- `getAllFields(reportType)` returns all field keys

### Report Types Defined
1. **dqf** - Driver Qualification File (15 fields)
2. **vehicle** - Vehicle Report (12 fields)
3. **violations** - Violations Report (12 fields)
4. **audit** - Compliance Audit Report (3 fields: section/metric/value)
5. **document-expiration** - Document Expiration Report (6 fields)
6. **drug-alcohol** - Drug & Alcohol Compliance Report (6 fields)
7. **dataq-history** - DataQ Challenge History Report (9 fields)
8. **accident-summary** - Accident Summary Report (10 fields)
9. **maintenance-costs** - Maintenance Costs Report (9 fields)

### CRUD Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | / | List system + company templates |
| GET | /fields/:reportType | Get field metadata for report type |
| GET | /:id | Get single template |
| POST | / | Create template with field validation |
| PUT | /:id | Update template (403 for system) |
| DELETE | /:id | Soft delete (403 for system) |
| POST | /:id/duplicate | Copy template (system or user) |
| POST | /seed-system | Seed system templates |

## Technical Decisions

1. **System Template Protection**: System templates cannot be edited or deleted (403 response). Users can duplicate them to customize.

2. **Field Validation**: All POST/PUT operations validate `selectedFields` against the config. Invalid fields return 400 with list of invalid keys.

3. **Soft Delete**: DELETE sets `isActive=false` rather than removing the document. Queries filter on `isActive: true`.

4. **Duplicate Creates User-Owned**: Duplicating any template (including system) creates a new template with `isSystemTemplate=false` and `companyId` set to user's company.

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Plan 11-02 (Frontend Field Selector) can proceed. The following endpoints are ready:
- `GET /api/report-templates/fields/:reportType` - Returns field metadata for UI
- `GET /api/report-templates` - Returns saved templates
- `POST /api/report-templates` - Creates new templates
- `POST /api/report-templates/:id/duplicate` - Duplicates system templates
