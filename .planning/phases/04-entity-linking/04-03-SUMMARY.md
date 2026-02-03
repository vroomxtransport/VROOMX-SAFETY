---
phase: 04-entity-linking
plan: 03
subsystem: api
tags: [express, mongodb, violations, entity-linking, review-queue]

# Dependency graph
requires:
  - phase: 04-01
    provides: linkingMetadata schema fields on Violation model
provides:
  - GET /api/violations/review-queue endpoint
  - violationsAPI.getReviewQueue frontend method
affects: [07-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy require for infrequent model access (FMCSAInspection)"
    - "Pagination with page/limit/total/pages object"

key-files:
  created: []
  modified:
    - "backend/routes/violations.js"
    - "frontend/src/utils/api.js"

key-decisions:
  - "Fetch unitInfo via separate FMCSAInspection query rather than populate (inspectionNumber is string, not ObjectId)"
  - "Use lazy require for FMCSAInspection to reduce import overhead"

patterns-established:
  - "Review queue endpoints filter by linkingMetadata.reviewRequired: true"

# Metrics
duration: 2min
completed: 2026-02-03
---

# Phase 4 Plan 3: Review Queue API Summary

**API endpoint for fetching violations flagged for manual entity linking review, with unitInfo from FMCSA inspections**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T21:57:09Z
- **Completed:** 2026-02-03T21:58:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- GET /api/violations/review-queue endpoint returning violations needing manual review
- Company-scoped with pagination support
- Populates driver CDL and vehicle identifiers for display
- Fetches unitInfo (CDL/license plate from inspection) to show what the linking service tried to match
- Frontend API client method for accessing the review queue

## Task Commits

Each task was committed atomically:

1. **Task 1: Add review queue endpoint to violations routes** - `1d695a2` (feat)
2. **Task 2: Add getReviewQueue to frontend API client** - `e1c9e1e` (feat)

## Files Created/Modified

- `backend/routes/violations.js` - Added GET /api/violations/review-queue endpoint before /:id routes
- `frontend/src/utils/api.js` - Added violationsAPI.getReviewQueue(params) method

## Decisions Made

1. **Lazy require FMCSAInspection model** - Since unitInfo lookup is per-violation and the model isn't needed elsewhere in the file, using lazy require inside the handler reduces module load time
2. **Separate query for unitInfo** - The inspectionNumber field is a string (report number), not an ObjectId reference, so we can't use Mongoose populate. Instead, we query FMCSAInspection directly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Review queue API is ready for Phase 7 (Polish) to build the UI
- The endpoint returns all data needed for the review UI:
  - Violation details with linked driver/vehicle (if any)
  - unitInfo from FMCSA inspection (what the linking service tried to match)
  - Pagination for large queues
- No blockers or concerns

---
*Phase: 04-entity-linking*
*Completed: 2026-02-03*
