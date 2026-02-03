# Roadmap: FMCSA Data Sync Overhaul

## Overview

This milestone establishes FMCSA data as a reliable, automatically-synced foundation for the VroomX Safety platform. The journey begins by fixing the dual-storage data model problem (Phase 1-2), then builds automated sync infrastructure (Phase 3), adds intelligent entity linking (Phase 4-5), integrates with the DataQ challenge system (Phase 6), and finishes with user-facing sync status UI (Phase 7). Upon completion, FMCSA violations will automatically flow into the system every 6 hours, link to drivers/vehicles via CDL/VIN matching, and feed the AI-powered DataQ analysis without manual intervention.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Data model schema changes and configuration validation
- [x] **Phase 2: Migration** - Move embedded violations to single source of truth
- [x] **Phase 3: Sync Infrastructure** - Background cron jobs and sync services
- [ ] **Phase 4: Entity Linking** - Automatic driver/vehicle matching logic
- [ ] **Phase 5: UI Integration** - Display linked violations in profiles
- [ ] **Phase 6: DataQ Integration** - Connect sync to DataQ challenge workflow
- [ ] **Phase 7: Polish** - Sync status UI and manual review queue

## Phase Details

### Phase 1: Foundation
**Goal**: Violation model becomes the single source of truth with validated FMCSA API configuration
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, CONF-01, CONF-02, CONF-03, CONF-04
**Success Criteria** (what must be TRUE):
  1. Violation schema has all fields needed for FMCSA data (linkingMetadata, syncMetadata, inspectionId)
  2. FMCSAInspection model references Violation documents via inspectionNumber (not embedded array)
  3. Server startup fails with clear error message if SAFERWEB_API_KEY missing
  4. Server startup fails with clear error message if SOCRATA_APP_TOKEN missing
  5. Environment variable documentation includes all new FMCSA-related vars
**Plans**: 3 plans (Wave 1 - all parallel)

Plans:
- [x] 01-01-PLAN.md - Violation schema enhancements (syncMetadata, linkingMetadata, unique index)
- [x] 01-02-PLAN.md - FMCSAInspection model refactor (violationRefs, deprecation notices)
- [x] 01-03-PLAN.md - Environment configuration and startup validation

### Phase 2: Migration
**Goal**: All existing embedded violations migrated to Violation collection with no duplicates
**Depends on**: Phase 1
**Requirements**: DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. All violations from FMCSAInspection.violations array exist as Violation documents
  2. Violation documents are linked back to inspections via inspectionNumber
  3. No duplicate violation records exist (verified by inspectionNumber+violationCode+date uniqueness)
  4. Migration is idempotent (can run multiple times safely)
**Plans**: 1 plan (Wave 1)

Plans:
- [x] 02-01-PLAN.md - Migration script with batch processing, checkpoints, and verification

### Phase 3: Sync Infrastructure
**Goal**: FMCSA data syncs automatically every 6 hours without manual intervention
**Depends on**: Phase 2
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06
**Success Criteria** (what must be TRUE):
  1. Background job runs every 6 hours without manual trigger
  2. CSA BASIC scores are pulled from FMCSA SAFER and stored
  3. Violations are pulled from DataHub API and stored as Violation documents
  4. Inspection details are pulled from SaferWebAPI and stored
  5. Sync errors are logged to console but do not crash the server
  6. Company record shows last sync time and success/failure status
**Plans**: 3 plans (Wave 1 -> 2 -> 3 sequential)

Plans:
- [x] 03-01-PLAN.md - Company syncStatus schema extension
- [x] 03-02-PLAN.md - Sync orchestrator service coordinating existing FMCSA services
- [x] 03-03-PLAN.md - Cron job registration in server.js

### Phase 4: Entity Linking
**Goal**: Violations automatically link to drivers and vehicles with confidence scoring
**Depends on**: Phase 3
**Requirements**: DRVR-01, DRVR-02, VHCL-01, VHCL-02
**Success Criteria** (what must be TRUE):
  1. Violations with CDL numbers are auto-linked to matching drivers
  2. Violations with VINs or unit numbers are auto-linked to matching vehicles
  3. Uncertain matches (no exact match) are flagged with low confidence score
  4. Uncertain matches appear in a review queue for manual confirmation
**Plans**: 3 plans (Wave 1: 04-01, Wave 2: 04-02 + 04-03 parallel)

Plans:
- [x] 04-01-PLAN.md — Entity linking service with driver/vehicle matching logic
- [x] 04-02-PLAN.md — Orchestrator integration (call linking after sync)
- [ ] 04-03-PLAN.md — Review queue API endpoint for manual confirmation

### Phase 5: UI Integration
**Goal**: Drivers and vehicles show their linked violations with CSA impact calculations
**Depends on**: Phase 4
**Requirements**: DRVR-03, DRVR-04, VHCL-03, VHCL-04
**Success Criteria** (what must be TRUE):
  1. Driver profile page shows all violations linked to that driver
  2. Driver profile shows CSA impact score calculated from linked violations
  3. Vehicle profile page shows all violations linked to that vehicle
  4. Vehicle profile shows OOS rate calculated from linked violations
**Plans**: TBD

Plans:
- [ ] 05-01: Driver profile violations display
- [ ] 05-02: Driver CSA impact calculation
- [ ] 05-03: Vehicle profile violations display
- [ ] 05-04: Vehicle OOS rate calculation

### Phase 6: DataQ Integration
**Goal**: Synced violations flow into DataQ challenge workflow with AI analysis
**Depends on**: Phase 5
**Requirements**: DATQ-01, DATQ-02, DATQ-03
**Success Criteria** (what must be TRUE):
  1. Newly imported violations appear in the DataQ opportunities list
  2. DataQ opportunities list refreshes after each sync completes
  3. AI analysis runs on new violations in background (not blocking sync)
**Plans**: TBD

Plans:
- [ ] 06-01: DataQ opportunity generation from synced violations
- [ ] 06-02: Post-sync AI analysis job

### Phase 7: Polish
**Goal**: Users can see sync status and manually manage unlinked violations
**Depends on**: Phase 6
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Dashboard shows "Last synced: X ago" indicator
  2. Manual "Sync Now" button triggers immediate refresh
  3. Unlinked violations page lists all items needing manual review
  4. Toast notification appears when new violations are imported
**Plans**: TBD

Plans:
- [ ] 07-01: Sync status dashboard indicator
- [ ] 07-02: Manual sync trigger button
- [ ] 07-03: Unlinked violations review page
- [ ] 07-04: New violation toast notifications

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | ✓ Verified | 2026-02-03 |
| 2. Migration | 1/1 | ✓ Verified | 2026-02-03 |
| 3. Sync Infrastructure | 3/3 | ✓ Verified | 2026-02-03 |
| 4. Entity Linking | 2/3 | In progress | - |
| 5. UI Integration | 0/4 | Not started | - |
| 6. DataQ Integration | 0/2 | Not started | - |
| 7. Polish | 0/4 | Not started | - |

---
*Roadmap created: 2026-02-03*
*Phase 1 planned: 2026-02-03*
*Phase 1 completed: 2026-02-03*
*Phase 2 planned: 2026-02-03*
*Phase 2 completed: 2026-02-03*
*Phase 3 planned: 2026-02-03*
*Phase 3 completed: 2026-02-03*
*Phase 4 planned: 2026-02-03*
*Total phases: 7 | Total plans: 20 | Requirements covered: 29*
