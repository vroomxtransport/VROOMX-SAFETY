# Requirements: VroomX Safety v2.0 Enhanced Reports Module

**Defined:** 2026-02-04
**Core Value:** Comprehensive FMCSA-compliant reporting with custom builder and multiple export formats

## v2.0 Requirements

Requirements for Enhanced Reports Module release. Each maps to roadmap phases.

### Export & Filtering

- [x] **EXPF-01**: User can export any report as CSV file
- [x] **EXPF-02**: User can export any report as Excel file (.xlsx) with formatted headers
- [x] **EXPF-03**: User can filter any report by date range (start/end dates)
- [x] **EXPF-04**: User can filter any report by driver (single or multiple)
- [x] **EXPF-05**: User can filter any report by vehicle (single or multiple)
- [x] **EXPF-06**: User can filter any report by status (active, expired, compliant, etc.)
- [x] **EXPF-07**: User can select dynamic date range presets (Last 30 days, This quarter, YTD, Custom)

### FMCSA Compliance

- [x] **FMCS-01**: DQF report includes Clearinghouse query date per driver
- [x] **FMCS-02**: DQF report includes MVR review date per driver
- [x] **FMCS-03**: DQF report includes safety performance history investigation status
- [x] **FMCS-04**: DQF report includes employment application verification status
- [x] **FMCS-05**: User can generate Document Expiration Report showing items expiring in 30/60/90 days
- [x] **FMCS-06**: User can generate Drug & Alcohol Summary Report with testing compliance status
- [x] **FMCS-07**: Drug & Alcohol Report shows random pool compliance (50% drug, 10% alcohol)
- [x] **FMCS-08**: All reports include company DOT number and generation timestamp in header
- [x] **FMCS-09**: PDF reports use consistent formatting suitable for DOT audit presentation

### Report Builder

- [x] **BLDR-01**: User can select which fields/columns appear in report via checkboxes
- [x] **BLDR-02**: User can save current filter + field configuration as named template
- [x] **BLDR-03**: User can load saved template to regenerate report with same settings
- [x] **BLDR-04**: User can preview report (first 10 rows) before downloading full report
- [x] **BLDR-05**: System provides pre-built FMCSA templates (DQF Audit, Vehicle Inspection, Violations Summary)
- [x] **BLDR-06**: User can duplicate and customize pre-built templates

### Report History

- [x] **HIST-01**: System tracks report generation history (who, what type, when, filters used)
- [x] **HIST-02**: User can view list of previously generated reports
- [x] **HIST-03**: User can re-download previously generated report (90-day retention)
- [x] **HIST-04**: Report history shows filter parameters used for each generation

### New Report Types

- [x] **NRPT-01**: User can generate DataQ Challenge History Report
- [x] **NRPT-02**: DataQ report shows challenge submissions, outcomes, success rate
- [x] **NRPT-03**: DataQ report shows estimated CSA points saved from accepted challenges
- [x] **NRPT-04**: User can generate Accident Summary Report
- [x] **NRPT-05**: Accident report shows DOT reportable status, injuries, fatalities, costs
- [x] **NRPT-06**: User can generate Maintenance Cost Report
- [x] **NRPT-07**: Maintenance report shows spending by vehicle, category, and vendor

## Future Requirements (v2.1+)

Deferred to later milestones. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Audit Package Builder - bundle multiple reports for DOT audit submission
- **ADV-02**: Compliance Gap Analysis Report - identify missing documents/expirations
- **ADV-03**: Point-in-time snapshots - generate reports as of historical date
- **ADV-04**: Multi-terminal/location filtering (requires data model changes)
- **ADV-05**: Scheduled report CSV/Excel attachments (in addition to PDF)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Drag-and-drop report builder | Over-engineered for SMB fleet target users; checkbox selection sufficient |
| Real-time collaborative report editing | Complexity doesn't justify value for compliance reports |
| Report sharing via public links | Security concern; reports contain sensitive compliance data |
| Custom branding per report | Low priority; company name/DOT in header sufficient |
| Report scheduling at sub-daily intervals | Hourly reports not useful for compliance data that updates daily/weekly |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXPF-01 | Phase 8 | Complete |
| EXPF-02 | Phase 8 | Complete |
| EXPF-03 | Phase 9 | Complete |
| EXPF-04 | Phase 9 | Complete |
| EXPF-05 | Phase 9 | Complete |
| EXPF-06 | Phase 9 | Complete |
| EXPF-07 | Phase 9 | Complete |
| FMCS-01 | Phase 10 | Complete |
| FMCS-02 | Phase 10 | Complete |
| FMCS-03 | Phase 10 | Complete |
| FMCS-04 | Phase 10 | Complete |
| FMCS-05 | Phase 10 | Complete |
| FMCS-06 | Phase 10 | Complete |
| FMCS-07 | Phase 10 | Complete |
| FMCS-08 | Phase 10 | Complete |
| FMCS-09 | Phase 10 | Complete |
| BLDR-01 | Phase 11 | Complete |
| BLDR-02 | Phase 11 | Complete |
| BLDR-03 | Phase 11 | Complete |
| BLDR-04 | Phase 11 | Complete |
| BLDR-05 | Phase 11 | Complete |
| BLDR-06 | Phase 11 | Complete |
| HIST-01 | Phase 12 | Complete |
| HIST-02 | Phase 12 | Complete |
| HIST-03 | Phase 12 | Complete |
| HIST-04 | Phase 12 | Complete |
| NRPT-01 | Phase 10 | Complete |
| NRPT-02 | Phase 10 | Complete |
| NRPT-03 | Phase 10 | Complete |
| NRPT-04 | Phase 10 | Complete |
| NRPT-05 | Phase 10 | Complete |
| NRPT-06 | Phase 10 | Complete |
| NRPT-07 | Phase 10 | Complete |

**Coverage:**
- v2.0 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after Phase 12 completion (v2.0 complete)*
