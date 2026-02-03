# FMCSA Data Sync Architecture

**Domain:** FMCSA violation/inspection data synchronization
**Researched:** 2026-02-03
**Confidence:** HIGH (based on extensive codebase analysis + FMCSA domain knowledge)

## Executive Summary

The current VroomX FMCSA data architecture has a critical flaw: violations are stored in **two places** without reconciliation. This document defines the target architecture with Violation model as single source of truth, automatic entity linking via CDL/VIN, and a clear component boundary structure.

---

## Current State Analysis

### Problem: Dual Storage Without Reconciliation

```
CURRENT (BROKEN):

  DataHub API ──────► FMCSAInspection.violations[]  (embedded subdocuments)
       │                      │
       │                      └──► NO SYNC ◄──┐
       │                                      │
       └──────► Violation collection ─────────┘  (standalone documents)
                      │
                      ├── Has driverId, vehicleId linking
                      ├── Has DataQ challenge workflow
                      └── Has AI analysis fields

PROBLEMS:
1. Same violation can exist in both places with different data
2. Updates to one don't propagate to other
3. FMCSAInspection.violations[] lacks entity linking
4. Violation collection has richer schema but spotty population
5. Queries must check both places for complete picture
```

### Current Component Inventory

| Component | Purpose | Data Source | Output |
|-----------|---------|-------------|--------|
| `fmcsaService.js` | CSA scores via Puppeteer scraping | SAFER Web | Company.smsBasics |
| `fmcsaViolationService.js` | Inspection stats via SaferWebAPI | SaferWebAPI | Company.fmcsaData.inspections |
| `fmcsaInspectionService.js` | Individual inspections + violations via DataHub | FMCSA DataHub | FMCSAInspection + (partial) Violation |
| `fmcsaSyncService.js` | Orchestrates CSA score sync | fmcsaService | Company.smsBasics, CSAScoreHistory |

### Current Data Flow (Problematic)

```
User clicks "Sync FMCSA Data"
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    fmcsaInspectionService                   │
│  syncViolationsFromDataHub(companyId)                       │
└─────────────────────────────────────────────────────────────┘
         │
         │ Fetch from https://datahub.transportation.gov/
         │ resource/8mt8-2mdr.json?$where=dot_number='...'
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Parse & Group by unique_id                     │
│  (unique_id = inspection report number)                     │
└─────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────┐
         ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│  FMCSAInspection    │    │  Violation          │
│  (upsert)           │    │  (insert, no dedup) │
│                     │    │                     │
│  violations: [...]  │    │  driverId: null     │
│  (embedded)         │    │  vehicleId: null    │
└─────────────────────┘    └─────────────────────┘
         │                          │
         │                          │
         └───── NO LINK ────────────┘
```

---

## Target Architecture

### Principle: Violation Model as Single Source of Truth

```
TARGET STATE:

  External APIs                    VroomX Database
  ─────────────                    ───────────────

  DataHub API ─────┐              ┌─────────────────────────┐
                   │              │                         │
  SaferWebAPI ─────┼─────────────►│   Violation (SSOT)      │
                   │              │   ├── inspectionId ────►│── FMCSAInspection
  AI Extraction ───┘              │   ├── driverId ────────►│── Driver
                                  │   ├── vehicleId ───────►│── Vehicle
                                  │   └── full schema       │
                                  └─────────────────────────┘
                                            │
                                            │ References
                                            ▼
                                  ┌─────────────────────────┐
                                  │   FMCSAInspection       │
                                  │   (inspection-level     │
                                  │    metadata only)       │
                                  │                         │
                                  │   NO embedded violations│
                                  └─────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FMCSA SYNC LAYER                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    fmcsaOrchestratorService                         │   │
│  │  - Coordinates all sync operations                                  │   │
│  │  - Single entry point for manual/scheduled sync                     │   │
│  │  - Manages sync state and error recovery                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                        │
│         ▼                    ▼                    ▼                        │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐               │
│  │ csaService  │    │ inspection  │    │   violation      │               │
│  │             │    │ Service     │    │   SyncService    │               │
│  │ - BASICs    │    │             │    │                  │               │
│  │ - OOS rates │    │ - Metadata  │    │ - Dedup logic    │               │
│  │ - Alerts    │    │ - Levels    │    │ - Entity linking │               │
│  └─────────────┘    │ - Location  │    │ - Reconciliation │               │
│         │           └─────────────┘    └──────────────────┘               │
│         │                  │                    │                          │
│         ▼                  ▼                    ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DATA ADAPTER LAYER                             │   │
│  │  ┌────────────┐  ┌───────────────┐  ┌────────────────────────┐     │   │
│  │  │ Puppeteer  │  │ SaferWebAPI   │  │ DataHub Socrata API    │     │   │
│  │  │ Scraper    │  │ Client        │  │ Client                 │     │   │
│  │  └────────────┘  └───────────────┘  └────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY LINKING LAYER                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    entityLinkingService                             │   │
│  │  - Match violations to drivers by CDL number + state                │   │
│  │  - Match violations to vehicles by VIN or unit number               │   │
│  │  - Handle fuzzy matching for name variations                        │   │
│  │  - Track linking confidence scores                                  │   │
│  │  - Support manual override                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                        │
│         ▼                    ▼                    ▼                        │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐               │
│  │ Driver      │    │ Vehicle     │    │   Violation      │               │
│  │ Matcher     │    │ Matcher     │    │   Normalizer     │               │
│  │             │    │             │    │                  │               │
│  │ CDL lookup  │    │ VIN lookup  │    │ Code mapping     │               │
│  │ Name fuzzy  │    │ Unit# map   │    │ BASIC assign     │               │
│  └─────────────┘    └─────────────┘    └──────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA STORAGE LAYER                                │
│                                                                             │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │    Violation      │  │  FMCSAInspection  │  │    Company        │       │
│  │    (SSOT)         │  │  (metadata)       │  │    (aggregates)   │       │
│  │                   │  │                   │  │                   │       │
│  │ - Full violation  │  │ - reportNumber    │  │ - smsBasics       │       │
│  │ - driverId ref    │  │ - date, location  │  │ - fmcsaData       │       │
│  │ - vehicleId ref   │  │ - OOS flags       │  │ - complianceScore │       │
│  │ - inspectionId    │  │ - level, type     │  │                   │       │
│  │ - DataQ workflow  │  │ - sync metadata   │  │                   │       │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘       │
│           │                      │                       │                  │
│           └──────────────────────┴───────────────────────┘                  │
│                              │                                              │
│                              ▼                                              │
│                    ┌───────────────────┐                                    │
│                    │    MongoDB        │                                    │
│                    │    (indexed)      │                                    │
│                    └───────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### 1. fmcsaOrchestratorService (NEW)

**Responsibility:** Coordinates all FMCSA sync operations, provides single entry point

| Method | Purpose | Calls |
|--------|---------|-------|
| `syncAll(companyId, opts)` | Full sync of everything | csaService, inspectionService, violationSyncService |
| `syncCSAScores(companyId)` | Just CSA/BASIC scores | csaService |
| `syncInspections(companyId)` | Inspection metadata + violations | inspectionService, violationSyncService |
| `getSyncStatus(companyId)` | Aggregate sync status | All services |
| `scheduleSync(companyId)` | Queue background sync | Job queue |

**Does NOT:**
- Directly access external APIs
- Directly write to database
- Handle entity linking

### 2. violationSyncService (NEW - replaces current import logic)

**Responsibility:** Create/update Violation documents, ensure single source of truth

| Method | Purpose |
|--------|---------|
| `upsertViolation(data)` | Create or update single violation |
| `bulkUpsertViolations(violations)` | Batch process violations |
| `reconcileWithInspection(inspectionId)` | Ensure violations match inspection record |
| `getViolationKey(violation)` | Generate unique key for deduplication |
| `markAsLinked(violationId, driverId, vehicleId)` | Update entity links |

**Deduplication Key:**
```javascript
// Unique key for a violation
const getViolationKey = (violation) => {
  return `${violation.inspectionNumber}|${violation.violationCode}|${violation.violationDate.toISOString().split('T')[0]}`;
};
```

### 3. entityLinkingService (NEW)

**Responsibility:** Match violations to internal Driver/Vehicle records

| Method | Purpose |
|--------|---------|
| `linkViolationToDriver(violationId)` | Attempt driver match |
| `linkViolationToVehicle(violationId)` | Attempt vehicle match |
| `bulkLinkViolations(violationIds)` | Batch linking |
| `findDriverByCDL(cdlNumber, state)` | CDL-based lookup |
| `findVehicleByVIN(vin)` | VIN-based lookup |
| `findVehicleByUnitNumber(unitNumber, companyId)` | Fallback lookup |
| `setManualLink(violationId, driverId, vehicleId)` | Manual override |

**Matching Strategy:**
```javascript
// Priority order for driver matching
1. Exact CDL number + state match
2. CDL number match (any state)
3. Name + DOB match (fuzzy)

// Priority order for vehicle matching
1. Exact VIN match
2. Unit number match (if stored in inspection)
3. License plate match (if available)
```

### 4. inspectionService (MODIFIED from fmcsaInspectionService)

**Responsibility:** FMCSAInspection metadata ONLY (no embedded violations)

| Method | Purpose |
|--------|---------|
| `upsertInspection(data)` | Create/update inspection metadata |
| `getInspection(id)` | Get inspection with violation refs |
| `getInspectionsForCompany(companyId, opts)` | List with pagination |
| `getViolationsForInspection(inspectionId)` | Query Violation collection |

**Schema Change Required:**
```javascript
// REMOVE: violations: [{ ... }] embedded array
// ADD: Link via inspectionNumber in Violation model
```

### 5. csaService (RENAMED from fmcsaSyncService)

**Responsibility:** CSA BASIC scores and carrier-level data only

| Method | Purpose |
|--------|---------|
| `syncBASICs(companyId)` | Fetch and store CSA percentiles |
| `getScoreHistory(companyId)` | Retrieve CSAScoreHistory |
| `calculateRiskLevel(basics)` | Compute risk from percentiles |
| `checkAlertThresholds(companyId)` | Trigger CSA alerts |

---

## Data Flow (Target State)

### Full Sync Flow

```
1. User triggers sync (or scheduled job)
         │
         ▼
2. fmcsaOrchestratorService.syncAll(companyId)
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
3a. csaService.syncBASICs()              3b. Fetch DataHub violations
    │                                         │
    ▼                                         ▼
    Company.smsBasics                    4. Group by inspection
    CSAScoreHistory                           │
                                              ▼
                                        5. For each inspection:
                                           │
                                           ├─► inspectionService.upsertInspection()
                                           │   └─► FMCSAInspection (metadata)
                                           │
                                           └─► violationSyncService.bulkUpsertViolations()
                                               └─► Violation documents (SSOT)
                                                   │
                                                   ▼
                                        6. entityLinkingService.bulkLinkViolations()
                                           │
                                           ├─► Match by CDL ─► driverId
                                           └─► Match by VIN ─► vehicleId
                                                   │
                                                   ▼
                                        7. Update Violation with entity refs
```

### Query Flow (Reading Data)

```
"Show violations for this driver"
         │
         ▼
Violation.find({ driverId: driver._id })
         │
         ▼
Return violations (already linked, no join needed)

"Show inspection details"
         │
         ▼
FMCSAInspection.findById(inspectionId)
         │
         ▼
Violation.find({ inspectionNumber: inspection.reportNumber })
         │
         ▼
Return inspection + violations
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│    Company                                                              │
│    ├── dotNumber (key for FMCSA lookups)                               │
│    ├── smsBasics (CSA percentiles)                                     │
│    └── fmcsaData (aggregate stats)                                     │
│         │                                                               │
│         │ 1:N                                                           │
│         ▼                                                               │
│    FMCSAInspection                                                      │
│    ├── companyId ──────────────────────────────────────────► Company   │
│    ├── reportNumber (unique per company)                                │
│    ├── inspectionDate                                                   │
│    ├── state, location                                                  │
│    ├── inspectionLevel (1-6)                                           │
│    ├── vehicleOOS, driverOOS, hazmatOOS (flags)                        │
│    └── totalViolations (count, for display)                            │
│         │                                                               │
│         │ 1:N (via inspectionNumber)                                   │
│         ▼                                                               │
│    Violation (SINGLE SOURCE OF TRUTH)                                   │
│    ├── companyId ──────────────────────────────────────────► Company   │
│    ├── inspectionNumber ───────────────────────────────────► FMCSAInsp │
│    ├── driverId (nullable) ────────────────────────────────► Driver    │
│    ├── vehicleId (nullable) ───────────────────────────────► Vehicle   │
│    ├── violationDate                                                    │
│    ├── violationCode (CFR reference)                                   │
│    ├── description                                                      │
│    ├── basic (BASIC category)                                          │
│    ├── severityWeight                                                   │
│    ├── outOfService                                                     │
│    ├── dataQChallenge { ... } (DataQ workflow)                         │
│    └── linkingMetadata { ... } (NEW)                                   │
│         ├── linkedAt                                                    │
│         ├── linkConfidence ('high', 'medium', 'low', 'manual')         │
│         ├── linkMethod ('cdl_exact', 'vin_exact', 'manual', etc.)      │
│         └── unmatchedReason (if null refs)                             │
│                                                                         │
│    Driver                                                               │
│    ├── companyId                                                        │
│    ├── cdl.number, cdl.state (for matching)                            │
│    └── ... other fields                                                │
│                                                                         │
│    Vehicle                                                              │
│    ├── companyId                                                        │
│    ├── vin (for matching)                                              │
│    ├── unitNumber (fallback matching)                                  │
│    └── ... other fields                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Violation Model Enhancements

Add to existing Violation schema:

```javascript
// Link to inspection (allows queries both directions)
inspectionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FMCSAInspection',
  index: true
},

// Linking metadata
linkingMetadata: {
  // When entity linking was attempted/completed
  linkedAt: Date,

  // Confidence in the link
  linkConfidence: {
    type: String,
    enum: ['high', 'medium', 'low', 'manual', 'unlinked']
  },

  // How the link was established
  linkMethod: {
    type: String,
    enum: ['cdl_exact', 'cdl_fuzzy', 'vin_exact', 'unit_number', 'manual', null]
  },

  // If unlinked, why
  unmatchedReason: String,

  // Raw data from FMCSA (for re-linking attempts)
  rawDriverInfo: {
    cdlNumber: String,
    cdlState: String,
    driverName: String
  },
  rawVehicleInfo: {
    vin: String,
    unitNumber: String,
    licensePlate: String,
    plateState: String
  }
},

// Sync metadata
syncMetadata: {
  source: {
    type: String,
    enum: ['datahub_sms', 'saferweb_api', 'ai_extraction', 'manual'],
    required: true
  },
  importedAt: Date,
  lastSyncAt: Date,
  externalId: String  // unique_id from DataHub
}
```

---

## Indexes Required

```javascript
// Violation collection
{ companyId: 1, violationDate: -1 }           // Company violations by date
{ companyId: 1, driverId: 1, violationDate: -1 } // Driver's violations
{ companyId: 1, vehicleId: 1, violationDate: -1 } // Vehicle's violations
{ inspectionNumber: 1 }                        // Link to inspection
{ 'syncMetadata.externalId': 1 }              // Dedup on import
{ 'linkingMetadata.linkConfidence': 1 }       // Find unlinked violations

// FMCSAInspection collection
{ companyId: 1, reportNumber: 1 }             // Unique constraint
{ companyId: 1, inspectionDate: -1 }          // Date queries
```

---

## Migration Strategy

### Phase 1: Schema Preparation
1. Add new fields to Violation model (linkingMetadata, syncMetadata, inspectionId)
2. Add indexes
3. Deploy (backwards compatible)

### Phase 2: Data Migration
1. For each FMCSAInspection.violations[] embedded document:
   - Check if matching Violation exists (by key)
   - If exists: update with inspectionId link
   - If not: create new Violation document
2. Populate linkingMetadata from existing driverId/vehicleId
3. Mark source as 'datahub_sms' or 'legacy_import'

### Phase 3: Entity Linking Pass
1. Query Violation where driverId/vehicleId is null
2. Attempt auto-linking via CDL/VIN
3. Log unmatched violations for review

### Phase 4: Service Layer Update
1. Deploy new services (violationSyncService, entityLinkingService, fmcsaOrchestratorService)
2. Update sync routes to use orchestrator
3. Deprecate direct calls to fmcsaInspectionService.importDataHubViolationsToDataQ

### Phase 5: Schema Cleanup (Future)
1. Remove FMCSAInspection.violations[] embedded array
2. All queries go through Violation collection

---

## Build Order (Dependencies)

```
Phase 1: Foundation
├── 1.1 Add Violation schema fields (no breaking changes)
├── 1.2 Add indexes
└── 1.3 Create entityLinkingService (isolated, testable)

Phase 2: Core Services
├── 2.1 Create violationSyncService (uses entityLinkingService)
├── 2.2 Modify fmcsaInspectionService (stop writing embedded violations)
└── 2.3 Create fmcsaOrchestratorService (coordinates all)

Phase 3: Migration
├── 3.1 Write migration script (FMCSAInspection.violations → Violation)
├── 3.2 Run migration (can be done live, additive only)
└── 3.3 Run entity linking pass on historical data

Phase 4: Integration
├── 4.1 Update sync routes to use orchestrator
├── 4.2 Update frontend queries (if needed)
└── 4.3 Add UI for manual entity linking

Phase 5: Cleanup
├── 5.1 Deprecate embedded violations array
├── 5.2 Update all queries to use Violation collection
└── 5.3 Remove legacy code paths
```

---

## Anti-Patterns to Avoid

### 1. Dual Write Without Sync
**Problem:** Writing to both FMCSAInspection.violations[] and Violation without sync
**Prevention:** All violation writes go through violationSyncService only

### 2. Inspection-Centric Queries
**Problem:** Querying FMCSAInspection and unwinding violations
**Prevention:** Query Violation directly, join to inspection only for metadata

### 3. Eager Entity Linking
**Problem:** Blocking sync on entity linking completion
**Prevention:** Link asynchronously after initial import

### 4. Missing Deduplication
**Problem:** Creating duplicate violations on re-sync
**Prevention:** Use inspectionNumber + violationCode + date as unique key

### 5. Ignoring Link Failures
**Problem:** Silently leaving violations unlinked
**Prevention:** Track unmatchedReason, surface in UI for manual resolution

---

## Scalability Notes

| Concern | Current Scale | 10K Violations | 100K Violations |
|---------|---------------|----------------|-----------------|
| Query performance | OK | OK with indexes | Consider aggregation pipeline |
| Sync duration | <30s | 1-2 min | Consider streaming/pagination |
| Entity linking | Sync | Async recommended | Async with queue |
| Storage | Embedded = duplication | Normalized = efficient | Normalized = efficient |

---

## Sources

- Codebase analysis: All FMCSA-related files in `/backend/services/` and `/backend/models/`
- FMCSA CSA Safety Planner: [What Happens After an Inspection](https://csa.fmcsa.dot.gov/safetyplanner/MyFiles/SubSections.aspx?ch=20&sec=55&sub=99)
- FMCSA DataQs System: [DataQs Help Center](https://dataqs.fmcsa.dot.gov/HelpCenter/Faqs?topic_id=1)
- Single Source of Truth patterns: [Airbyte SSOT Guide](https://airbyte.com/data-engineering-resources/single-point-of-truth)
- FMCSA Compliance Software patterns: [SimplyFleet Guide](https://www.simplyfleet.app/blog/understanding-fmcsa-compliance-software)
