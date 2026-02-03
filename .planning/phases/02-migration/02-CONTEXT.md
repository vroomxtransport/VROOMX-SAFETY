# Phase 2: Migration - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all existing embedded violations from FMCSAInspection.violations[] arrays to the Violation collection (single source of truth). After migration, FMCSAInspection documents should reference Violation documents via violationRefs[]. The embedded array is preserved for rollback safety until Phase 3 sync is confirmed working.

</domain>

<decisions>
## Implementation Decisions

### Duplicate Handling
- Use compound unique index (companyId, inspectionNumber, violationCode, violationDate) to detect duplicates
- If duplicate detected during insert, skip and log — first occurrence wins
- Duplicates logged to migration report for audit trail

### Orphan/Invalid Data
- Violations with missing required fields: migrate with `syncMetadata.source: 'legacy_migration'` flag
- Violations with invalid dates: set violationDate to inspection date as fallback
- Log all anomalies to `_migrationIssues` array in migration report
- Don't block migration on edge cases — flag for manual review

### Migration Execution
- One-time idempotent script (safe to run multiple times)
- Process in batches of 500 inspections at a time
- Use MongoDB transactions where possible for atomicity
- Resumable: track last processed inspectionId in migration state
- Design for maintenance window but support live execution (no writes to violations during migration)

### Verification Strategy
- Pre-migration: count total violations across all FMCSAInspection.violations[]
- Post-migration: count Violation documents, verify match
- Spot-check: random sample of 10 inspections, verify all violations migrated correctly
- Verify violationRefs[] populated on FMCSAInspection documents

### Rollback Plan
- Embedded violations[] array remains intact (read-only during migration)
- Rollback = delete all Violation docs with `syncMetadata.source: 'legacy_migration'`
- Clear violationRefs[] arrays on FMCSAInspection documents
- Migration is reversible until Phase 3 confirms sync working

### Claude's Discretion
- Exact batch size tuning (500 is starting point)
- Transaction boundaries and error retry logic
- Migration report format and storage location
- Progress logging verbosity

</decisions>

<specifics>
## Specific Ideas

- Migration must be idempotent — running twice produces same result
- Preserve all original data fields even if they seem unused (future-proofing)
- Log enough detail to debug any post-migration issues
- Consider dry-run mode for testing before actual migration

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-migration*
*Context gathered: 2026-02-03*
