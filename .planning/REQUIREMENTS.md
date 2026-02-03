# Requirements: FMCSA Data Sync Overhaul

**Defined:** 2026-02-03
**Core Value:** FMCSA data stays fresh and properly connected across the entire system without manual intervention

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Data Model (SSOT)

- [x] **DATA-01**: Violation model is the single source of truth for all FMCSA violations
- [x] **DATA-02**: FMCSAInspection model references Violation documents (not embedded array)
- [x] **DATA-03**: Existing embedded violations migrated to Violation collection
- [x] **DATA-04**: No duplicate violation records exist after migration

### Configuration

- [x] **CONF-01**: SaferWebAPI key configured and validated at startup
- [x] **CONF-02**: Socrata app token configured for DataHub API (1000 req/hr)
- [x] **CONF-03**: Server startup fails with clear error if required FMCSA env vars missing
- [x] **CONF-04**: Environment variable documentation updated

### Automatic Sync

- [x] **SYNC-01**: Background cron job syncs FMCSA data every 6 hours
- [x] **SYNC-02**: Sync pulls CSA BASIC scores from FMCSA SAFER
- [x] **SYNC-03**: Sync pulls violations from DataHub API
- [x] **SYNC-04**: Sync pulls inspection details from SaferWebAPI
- [x] **SYNC-05**: Sync errors are logged but don't crash the application
- [x] **SYNC-06**: Sync status (last run, success/failure) stored per company

### Driver Linking

- [ ] **DRVR-01**: Violations auto-linked to drivers by CDL number match
- [ ] **DRVR-02**: Uncertain matches (no exact CDL match) flagged for manual review
- [ ] **DRVR-03**: Driver profile shows all linked violations
- [ ] **DRVR-04**: Driver CSA impact calculated from linked violations

### Vehicle Linking

- [ ] **VHCL-01**: Violations auto-linked to vehicles by VIN or unit number match
- [ ] **VHCL-02**: Uncertain matches flagged for manual review
- [ ] **VHCL-03**: Vehicle profile shows all linked violations
- [ ] **VHCL-04**: Vehicle OOS rate calculated from linked violations

### DataQ Integration

- [ ] **DATQ-01**: Imported violations automatically available in DataQ module
- [ ] **DATQ-02**: DataQ opportunities list updates after each sync
- [ ] **DATQ-03**: AI analysis runs on new violations after sync (background)

### User Interface

- [ ] **UI-01**: Dashboard shows "Last synced: X ago" indicator
- [ ] **UI-02**: Manual "Sync Now" button available for immediate refresh
- [ ] **UI-03**: Unlinked violations page shows items needing manual review
- [ ] **UI-04**: Toast notification when new violations are imported

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Advanced Sync

- **SYNC-V2-01**: BullMQ job queue replaces node-cron (persistent, retries)
- **SYNC-V2-02**: Configurable sync frequency per company
- **SYNC-V2-03**: Sync health dashboard with job monitoring

### Advanced Analytics

- **ANLYT-01**: Violation trend predictions
- **ANLYT-02**: Proactive driver coaching recommendations
- **ANLYT-03**: Comparative fleet benchmarking

### FMCSA Official API

- **API-01**: Register for FMCSA QCMobile WebKey (Login.gov)
- **API-02**: Use official API as primary data source

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time sync (< 6 hours) | FMCSA data updates monthly; more frequent provides no value |
| Automated DataQ submission | Requires carrier signature; must remain manual |
| BASIC score predictions | Phase 4 differentiator; not core to data sync |
| Mobile push notifications | Email alerts sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| CONF-01 | Phase 1 | Complete |
| CONF-02 | Phase 1 | Complete |
| CONF-03 | Phase 1 | Complete |
| CONF-04 | Phase 1 | Complete |
| SYNC-01 | Phase 3 | Complete |
| SYNC-02 | Phase 3 | Complete |
| SYNC-03 | Phase 3 | Complete |
| SYNC-04 | Phase 3 | Complete |
| SYNC-05 | Phase 3 | Complete |
| SYNC-06 | Phase 3 | Complete |
| DRVR-01 | Phase 4 | Pending |
| DRVR-02 | Phase 4 | Pending |
| DRVR-03 | Phase 5 | Pending |
| DRVR-04 | Phase 5 | Pending |
| VHCL-01 | Phase 4 | Pending |
| VHCL-02 | Phase 4 | Pending |
| VHCL-03 | Phase 5 | Pending |
| VHCL-04 | Phase 5 | Pending |
| DATQ-01 | Phase 6 | Pending |
| DATQ-02 | Phase 6 | Pending |
| DATQ-03 | Phase 6 | Pending |
| UI-01 | Phase 7 | Pending |
| UI-02 | Phase 7 | Pending |
| UI-03 | Phase 7 | Pending |
| UI-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after Phase 3 completion*
