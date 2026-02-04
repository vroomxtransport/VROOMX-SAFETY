# Requirements: VroomX Safety v2.0 Enhanced Reports Module

**Defined:** 2026-02-04
**Core Value:** Comprehensive FMCSA-compliant reporting with custom builder and multiple export formats

## v2.0 Requirements

Requirements for Enhanced Reports Module release. Each maps to roadmap phases.

### Export & Filtering

- [x] **EXPF-01**: User can export any report as CSV file
- [x] **EXPF-02**: User can export any report as Excel file (.xlsx) with formatted headers
- [ ] **EXPF-03**: User can filter any report by date range (start/end dates)
- [ ] **EXPF-04**: User can filter any report by driver (single or multiple)
- [ ] **EXPF-05**: User can filter any report by vehicle (single or multiple)
- [ ] **EXPF-06**: User can filter any report by status (active, expired, compliant, etc.)
- [ ] **EXPF-07**: User can select dynamic date range presets (Last 30 days, This quarter, YTD, Custom)

### FMCSA Compliance

- [ ] **FMCS-01**: DQF report includes Clearinghouse query date per driver
- [ ] **FMCS-02**: DQF report includes MVR review date per driver
- [ ] **FMCS-03**: DQF report includes safety performance history investigation status
- [ ] **FMCS-04**: DQF report includes employment application verification status
- [ ] **FMCS-05**: User can generate Document Expiration Report showing items expiring in 30/60/90 days
- [ ] **FMCS-06**: User can generate Drug & Alcohol Summary Report with testing compliance status
- [ ] **FMCS-07**: Drug & Alcohol Report shows random pool compliance (50% drug, 10% alcohol)
- [ ] **FMCS-08**: All reports include company DOT number and generation timestamp in header
- [ ] **FMCS-09**: PDF reports use consistent formatting suitable for DOT audit presentation

### Report Builder

- [ ] **BLDR-01**: User can select which fields/columns appear in report via checkboxes
- [ ] **BLDR-02**: User can save current filter + field configuration as named template
- [ ] **BLDR-03**: User can load saved template to regenerate report with same settings
- [ ] **BLDR-04**: User can preview report (first 10 rows) before downloading full report
- [ ] **BLDR-05**: System provides pre-built FMCSA templates (DQF Audit, Vehicle Inspection, Violations Summary)
- [ ] **BLDR-06**: User can duplicate and customize pre-built templates

### Report History

- [ ] **HIST-01**: System tracks report generation history (who, what type, when, filters used)
- [ ] **HIST-02**: User can view list of previously generated reports
- [ ] **HIST-03**: User can re-download previously generated report (90-day retention)
- [ ] **HIST-04**: Report history shows filter parameters used for each generation

### New Report Types

- [ ] **NRPT-01**: User can generate DataQ Challenge History Report
- [ ] **NRPT-02**: DataQ report shows challenge submissions, outcomes, success rate
- [ ] **NRPT-03**: DataQ report shows estimated CSA points saved from accepted challenges
- [ ] **NRPT-04**: User can generate Accident Summary Report
- [ ] **NRPT-05**: Accident report shows DOT reportable status, injuries, fatalities, costs
- [ ] **NRPT-06**: User can generate Maintenance Cost Report
- [ ] **NRPT-07**: Maintenance report shows spending by vehicle, category, and vendor

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
| EXPF-03 | Phase 9 | Pending |
| EXPF-04 | Phase 9 | Pending |
| EXPF-05 | Phase 9 | Pending |
| EXPF-06 | Phase 9 | Pending |
| EXPF-07 | Phase 9 | Pending |
| FMCS-01 | Phase 10 | Pending |
| FMCS-02 | Phase 10 | Pending |
| FMCS-03 | Phase 10 | Pending |
| FMCS-04 | Phase 10 | Pending |
| FMCS-05 | Phase 10 | Pending |
| FMCS-06 | Phase 10 | Pending |
| FMCS-07 | Phase 10 | Pending |
| FMCS-08 | Phase 10 | Pending |
| FMCS-09 | Phase 10 | Pending |
| BLDR-01 | Phase 11 | Pending |
| BLDR-02 | Phase 11 | Pending |
| BLDR-03 | Phase 11 | Pending |
| BLDR-04 | Phase 11 | Pending |
| BLDR-05 | Phase 11 | Pending |
| BLDR-06 | Phase 11 | Pending |
| HIST-01 | Phase 12 | Pending |
| HIST-02 | Phase 12 | Pending |
| HIST-03 | Phase 12 | Pending |
| HIST-04 | Phase 12 | Pending |
| NRPT-01 | Phase 10 | Pending |
| NRPT-02 | Phase 10 | Pending |
| NRPT-03 | Phase 10 | Pending |
| NRPT-04 | Phase 10 | Pending |
| NRPT-05 | Phase 10 | Pending |
| NRPT-06 | Phase 10 | Pending |
| NRPT-07 | Phase 10 | Pending |

**Coverage:**
- v2.0 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after Phase 8 completion*
