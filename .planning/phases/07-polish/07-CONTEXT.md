# Phase 7: Polish - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can see sync status and manually manage unlinked violations. This phase adds visibility into the FMCSA sync system (when it last ran, ability to trigger manually) and provides a UI to review/link violations that couldn't be auto-matched.

**Specific deliverables from ROADMAP.md:**
1. Dashboard shows "Last synced: X ago" indicator
2. Manual "Sync Now" button triggers immediate refresh
3. Unlinked violations page lists items needing manual review
4. Toast notification when new violations are imported

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User indicated flexibility on all implementation details. Claude should use judgment on:

**Sync status display:**
- Location on dashboard (header, sidebar, dedicated card)
- Information shown (last sync time, next scheduled, success/failure)
- Time format (relative "2 hours ago" vs absolute timestamps)
- Visual treatment (icon, badge, status indicator)

**Sync Now behavior:**
- Button placement (near status indicator, in settings, both)
- Confirmation dialog (yes/no, or just start immediately)
- Progress feedback during sync (spinner, progress bar, status messages)
- Disable state while sync in progress

**Unlinked violations page:**
- Table vs card layout
- Columns to display (violation details, suggested matches, confidence scores)
- Sorting and filtering options
- Manual linking workflow (dropdown, search, modal)
- Bulk actions (link multiple, dismiss)

**Toast notifications:**
- When to trigger (sync complete, new violations found, errors)
- Duration visible (auto-dismiss timing)
- Position (top-right, bottom-right, etc.)
- Stacking behavior for multiple notifications
- Action buttons in toast (view, dismiss)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

Follow existing codebase patterns:
- Dashboard layout and component patterns
- Toast/notification system if one exists
- Table patterns from other list views (drivers, vehicles, violations)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-polish*
*Context gathered: 2026-02-03*
