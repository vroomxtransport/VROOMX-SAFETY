# Roadmap: VroomX Safety v2.0 Enhanced Reports Module

## Overview

This milestone transforms VroomX Safety from basic PDF-only reporting to a comprehensive FMCSA-compliant reporting platform with multiple export formats, custom report building, and historical tracking. The journey starts with export infrastructure (CSV/Excel with streaming to prevent memory issues), then unified filtering across all reports, enhanced FMCSA compliance reports (fixing critical DQF gaps and adding new report types), a checkbox-based report builder with templates, and finally report history with re-download capability. This delivers the "must-have" features identified in research that block adoption by safety managers who need Excel exports and audit-ready compliance reports.

## Milestones

- v1.0 FMCSA Data Sync Overhaul - Phases 1-7 (shipped 2026-02-03)
  - See: .planning/milestones/v1-ROADMAP.md
- **v2.0 Enhanced Reports Module** - Phases 8-12 (in progress)

## Phases

- [x] **Phase 8: Export Foundation** - CSV/Excel export services with streaming architecture
- [x] **Phase 9: Unified Filtering** - Date range, driver/vehicle/status filters across all reports
- [x] **Phase 10: FMCSA Compliance Reports** - Enhanced DQF fields, new report types, audit formatting
- [x] **Phase 11: Report Builder** - Field selector, templates, preview functionality
- [ ] **Phase 12: Report History** - Generation tracking with re-download capability

## Phase Details

### Phase 8: Export Foundation
**Goal**: Users can export any report as CSV or Excel file with proper character encoding
**Depends on**: v1 complete (Phase 7)
**Requirements**: EXPF-01, EXPF-02
**Success Criteria** (what must be TRUE):
  1. User can download any existing report as CSV file with correct UTF-8 encoding (Spanish names render correctly)
  2. User can download any existing report as Excel file (.xlsx) with formatted headers and proper column widths
  3. Large reports (50+ drivers, multi-year data) complete without memory errors or timeouts
  4. Downloaded files have descriptive names including report type and generation timestamp
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Create exportService with streaming CSV/Excel and extend backend report routes
- [x] 08-02-PLAN.md — Add CSV/Excel buttons to Reports page and update frontend API client

### Phase 9: Unified Filtering
**Goal**: Users can filter any report by date range, driver, vehicle, and status with convenient presets
**Depends on**: Phase 8
**Requirements**: EXPF-03, EXPF-04, EXPF-05, EXPF-06, EXPF-07
**Success Criteria** (what must be TRUE):
  1. User can filter any report by custom date range (start and end dates)
  2. User can filter any report by selecting one or multiple drivers from a dropdown
  3. User can filter any report by selecting one or multiple vehicles from a dropdown
  4. User can filter any report by status (active, expired, compliant, non-compliant as applicable)
  5. User can select date presets (Last 30 days, This quarter, YTD, Custom) and see date fields auto-populate
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Create date presets utility, filter config, and extend backend routes with multi-select params
- [x] 09-02-PLAN.md — Create reusable filter components and integrate into Reports page

### Phase 10: FMCSA Compliance Reports
**Goal**: Reports include all FMCSA-required fields and new report types for comprehensive compliance tracking
**Depends on**: Phase 9
**Requirements**: FMCS-01, FMCS-02, FMCS-03, FMCS-04, FMCS-05, FMCS-06, FMCS-07, FMCS-08, FMCS-09, NRPT-01, NRPT-02, NRPT-03, NRPT-04, NRPT-05, NRPT-06, NRPT-07
**Success Criteria** (what must be TRUE):
  1. DQF report shows Clearinghouse query date, MVR review date, safety performance history status, and employment application status per driver (49 CFR 391.51 compliance)
  2. User can generate Document Expiration Report showing items expiring in 30/60/90 days grouped by document type
  3. User can generate Drug & Alcohol Summary Report showing testing compliance status and random pool percentages (50% drug, 10% alcohol)
  4. User can generate DataQ Challenge History Report showing submissions, outcomes, success rate, and estimated CSA points saved
  5. User can generate Accident Summary Report showing DOT reportable status, injuries, fatalities, and costs
  6. User can generate Maintenance Cost Report showing spending by vehicle, category, and vendor
  7. All PDF reports display company DOT number and generation timestamp in header, with consistent formatting suitable for DOT audit presentation
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — Extend DQF endpoint with 49 CFR 391.51 compliance fields (Clearinghouse, MVR, employment verification)
- [x] 10-02-PLAN.md — Create Document Expiration and Drug & Alcohol Summary report endpoints
- [x] 10-03-PLAN.md — Create DataQ Challenge History, Accident Summary, and Maintenance Cost report endpoints

### Phase 11: Report Builder
**Goal**: Users can customize report content with field selection, save configurations as templates, and preview before downloading
**Depends on**: Phase 10
**Requirements**: BLDR-01, BLDR-02, BLDR-03, BLDR-04, BLDR-05, BLDR-06
**Success Criteria** (what must be TRUE):
  1. User can select/deselect fields via checkboxes to control which columns appear in report output
  2. User can save current filter and field configuration as a named template for future use
  3. User can load a saved template and regenerate report with identical settings
  4. User can preview first 10 rows of report data before committing to full download
  5. System provides pre-built FMCSA templates (DQF Audit, Vehicle Inspection, Violations Summary) that user can duplicate and customize
**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md — ReportTemplate model, field definitions config, and template CRUD routes
- [x] 11-02-PLAN.md — Extend report endpoints with fields param and add preview endpoints
- [x] 11-03-PLAN.md — FieldSelector, ReportPreview, TemplateManager components and Reports page integration

### Phase 12: Report History
**Goal**: Users can view previously generated reports and re-download them within retention period
**Depends on**: Phase 11
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. System automatically tracks each report generation (who generated, report type, timestamp, filters used)
  2. User can view chronological list of previously generated reports with generation details
  3. User can re-download any previously generated report within 90-day retention window
  4. Report history list shows filter parameters used for each generation so user knows report scope
**Plans**: 2 plans

Plans:
- [ ] 12-01-PLAN.md — ReportHistory model with TTL, service for file management, and API routes for list/download
- [ ] 12-02-PLAN.md — Integrate history tracking into exports, create ReportHistoryList component, add to Reports page

## Progress

**Execution Order:**
Phases execute in numeric order: 8 -> 9 -> 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 8. Export Foundation | v2.0 | 2/2 | Complete | 2026-02-04 |
| 9. Unified Filtering | v2.0 | 2/2 | Complete | 2026-02-04 |
| 10. FMCSA Compliance Reports | v2.0 | 3/3 | Complete | 2026-02-04 |
| 11. Report Builder | v2.0 | 3/3 | Complete | 2026-02-04 |
| 12. Report History | v2.0 | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-04*
*Coverage: 33/33 v2.0 requirements mapped*
