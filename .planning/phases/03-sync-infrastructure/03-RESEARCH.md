# Phase 3: Sync Infrastructure - Research

**Researched:** 2026-02-03
**Domain:** FMCSA API integration, node-cron scheduling, background sync services
**Confidence:** HIGH

## Summary

This phase implements automatic FMCSA data synchronization every 6 hours using node-cron (per STATE.md decision). The codebase already has extensive patterns for both cron jobs (5 existing) and FMCSA API services (4 existing), making this phase primarily an orchestration task. The research reveals that the existing `fmcsaSyncService`, `fmcsaViolationService`, and `fmcsaInspectionService` already contain most of the sync logic - Phase 3 needs to wire them to a cron orchestrator and add per-company sync status tracking.

Key findings:
- node-cron is already installed and used extensively in server.js (5 cron jobs)
- Three FMCSA data services exist with complete API integration logic
- Company model has `fmcsaData.lastViolationSync` but needs expanded sync status fields
- Error handling pattern: log and continue (never crash the server) - matches existing cron patterns

**Primary recommendation:** Create a sync orchestrator service that coordinates existing services, add sync status schema to Company, and register a `0 */6 * * *` cron job following the established patterns in server.js.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node-cron | ^3.0.3 | Cron scheduling | Already in codebase, simple, no Redis dependency |
| node-cache | ^5.1.2 | API response caching | Already used by fmcsaService for 6-hour TTL |
| native fetch | built-in | HTTP requests | Node 18+, no axios dependency needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| mongoose | ^8.x | Company sync status storage | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node-cron | BullMQ | Per STATE.md: deferred to v2 for Redis-free deployment |
| per-job service | single orchestrator | Orchestrator pattern matches existing sync patterns |

**Installation:**
No new packages required - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── services/
│   ├── fmcsaSyncOrchestrator.js   # NEW - coordinates sync across all companies
│   ├── fmcsaSyncService.js        # EXISTING - CSA scores from SAFER
│   ├── fmcsaViolationService.js   # EXISTING - inspection stats from SaferWebAPI
│   └── fmcsaInspectionService.js  # EXISTING - violations from DataHub
├── server.js                       # ADD cron.schedule() call
└── models/
    └── Company.js                  # EXTEND fmcsaData with syncStatus
```

### Pattern 1: Orchestrator Service
**What:** Single service that coordinates sync across all companies, calling existing services
**When to use:** When multiple data sources need coordinated sync with shared error handling
**Example:**
```javascript
// Source: Derived from existing samsaraService.syncAll pattern in codebase
const fmcsaSyncOrchestrator = {
  async syncAllCompanies() {
    const companies = await Company.find({ dotNumber: { $exists: true, $ne: null } });

    for (const company of companies) {
      try {
        await this.syncCompany(company._id);
      } catch (error) {
        // Log but don't throw - continue with other companies
        console.error(`[FMCSA Sync] Company ${company._id} failed:`, error.message);
      }
    }
  },

  async syncCompany(companyId) {
    const results = { csaScores: null, violations: null, inspections: null };
    const errors = [];

    // CSA BASIC scores (fmcsaSyncService)
    try {
      results.csaScores = await fmcsaSyncService.syncCompanyData(companyId);
    } catch (err) {
      errors.push({ source: 'csa_scores', error: err.message });
    }

    // Violations from DataHub (fmcsaInspectionService)
    try {
      results.violations = await fmcsaInspectionService.syncViolationsFromDataHub(companyId);
    } catch (err) {
      errors.push({ source: 'violations', error: err.message });
    }

    // Inspection stats from SaferWebAPI (fmcsaViolationService)
    try {
      results.inspections = await fmcsaViolationService.syncViolationHistory(companyId);
    } catch (err) {
      errors.push({ source: 'inspections', error: err.message });
    }

    // Update sync status
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'fmcsaData.syncStatus.lastRun': new Date(),
          'fmcsaData.syncStatus.success': errors.length === 0,
          'fmcsaData.syncStatus.errors': errors
        }
      }
    );

    return { results, errors };
  }
};
```

### Pattern 2: Cron Registration (Existing Pattern)
**What:** Register cron job inside app.listen callback
**When to use:** All scheduled background jobs
**Example:**
```javascript
// Source: backend/server.js lines 236-244 (existing alert escalation cron)
cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron] Running FMCSA data sync...');
  try {
    const result = await fmcsaSyncOrchestrator.syncAllCompanies();
    console.log('[Cron] FMCSA sync complete:', result);
  } catch (error) {
    console.error('[Cron] FMCSA sync failed:', error.message);
  }
});
```

### Pattern 3: Company Sync Status Schema
**What:** Nested sync status object tracking last run, success, and errors
**When to use:** Any background sync that needs status visibility
**Example:**
```javascript
// Source: Pattern from Company.fmcsaData.inspections.lastSync
fmcsaData: {
  // ... existing fields ...
  syncStatus: {
    lastRun: { type: Date },
    success: { type: Boolean },
    errors: [{
      source: { type: String, enum: ['csa_scores', 'violations', 'inspections'] },
      error: String,
      timestamp: { type: Date, default: Date.now }
    }],
    // Track each data source independently
    csaScoresLastSync: { type: Date },
    violationsLastSync: { type: Date },
    inspectionsLastSync: { type: Date }
  }
}
```

### Anti-Patterns to Avoid
- **Throwing errors from cron jobs:** Always catch and log - never let sync errors crash the server
- **Sync all companies in parallel:** Can overwhelm APIs with rate limits; use sequential processing
- **Skipping companies on API key missing:** Check env vars once at startup, warn but continue for individual companies without DOT numbers

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSA score fetching | Custom SAFER scraper | `fmcsaService.fetchCarrierData()` | Puppeteer browser management, cache handling |
| Violation import | Custom DataHub client | `fmcsaInspectionService.syncViolationsFromDataHub()` | Date parsing, deduplication, model mapping |
| Inspection stats | Custom SaferWebAPI client | `fmcsaViolationService.syncViolationHistory()` | Response parsing, cache, company update |
| Cron scheduling | setInterval | node-cron | Proper cron syntax, timezone handling |
| API response caching | Custom cache | node-cache (already used) | TTL management, memory cleanup |

**Key insight:** The existing services already handle all the complex API integration. Phase 3 is about orchestration, not reimplementation.

## Common Pitfalls

### Pitfall 1: Sync Errors Crashing Server
**What goes wrong:** Uncaught promise rejection from sync service crashes Node process
**Why it happens:** Async errors in cron callbacks bubble up to uncaughtException
**How to avoid:** Wrap every cron callback in try/catch, log errors, never rethrow
**Warning signs:** Server restarts at sync time, missing subsequent cron runs

### Pitfall 2: API Rate Limiting
**What goes wrong:** Too many concurrent requests trigger 429 responses
**Why it happens:** Processing all companies in parallel with Promise.all
**How to avoid:** Sequential company processing, respect existing 6-hour cache TTL
**Warning signs:** Lots of 429 errors in logs, partial sync completion

### Pitfall 3: Missing Credentials in Production
**What goes wrong:** Sync silently fails with "API key not configured" errors
**Why it happens:** SAFERWEB_API_KEY or SOCRATA_APP_TOKEN missing from production env
**How to avoid:** Phase 1 already validates at startup; orchestrator should check and skip gracefully
**Warning signs:** All company syncs fail with same "not configured" error

### Pitfall 4: DataHub Date Parsing
**What goes wrong:** Violations have wrong dates or fail to import
**Why it happens:** DataHub uses "DD-MMM-YY" format (e.g., "07-OCT-24")
**How to avoid:** Use existing `fmcsaInspectionService.parseSMSDate()` function
**Warning signs:** Violations with year 2024 instead of 2024, duplicate imports

### Pitfall 5: Stale Cache Preventing Refresh
**What goes wrong:** Sync appears to run but returns cached data
**Why it happens:** node-cache 6-hour TTL overlaps with cron schedule
**How to avoid:** Sync interval (6hr) matches cache TTL; cron runs at offset times naturally refresh
**Warning signs:** Company data never changes despite known FMCSA updates

## Code Examples

Verified patterns from existing codebase:

### Existing Cron Job Pattern
```javascript
// Source: backend/server.js:236-244
// Schedule alert escalation check every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron] Running alert escalation check...');
  try {
    const escalated = await alertService.escalateAlerts();
    console.log(`[Cron] Escalated ${escalated} alerts`);
  } catch (error) {
    console.error('[Cron] Error in alert escalation:', error);
  }
});
```

### Existing Sync Service Pattern (Samsara)
```javascript
// Source: backend/server.js:283-319
cron.schedule('30 * * * *', async () => {
  console.log('[Cron] Running hourly Samsara sync...');
  try {
    const Integration = require('./models/Integration');
    const samsaraService = require('./services/samsaraService');

    const activeIntegrations = await Integration.find({
      provider: 'samsara',
      status: 'active',
      'syncConfig.autoSync': true
    });

    if (activeIntegrations.length === 0) {
      return;
    }

    let successCount = 0;
    for (const integration of activeIntegrations) {
      try {
        await samsaraService.syncAll(integration, integration.syncConfig);
        integration.lastSyncAt = new Date();
        integration.status = 'active';
        integration.error = null;
        await integration.save();
        successCount++;
      } catch (err) {
        console.error(`[Cron] Samsara sync failed for company ${integration.companyId}:`, err.message);
        integration.error = err.message;
        await integration.save();
      }
    }

    console.log(`[Cron] Samsara sync completed: ${successCount}/${activeIntegrations.length} integrations`);
  } catch (err) {
    console.error('[Cron] Samsara sync job failed:', err.message);
  }
});
```

### DataHub API Query Pattern
```javascript
// Source: backend/services/fmcsaInspectionService.js:688-700
const url = `https://datahub.transportation.gov/resource/8mt8-2mdr.json?$where=dot_number='${dotNumber}'&$limit=2000`;

const response = await fetch(url, {
  headers: {
    'Accept': 'application/json',
    // Add app token for higher rate limits
    'X-App-Token': process.env.SOCRATA_APP_TOKEN || ''
  }
});
```

### SaferWebAPI Request Pattern
```javascript
// Source: backend/services/fmcsaViolationService.js:37-57
const response = await fetch(
  `https://saferwebapi.com/v2/usdot/snapshot/${dotNumber}`,
  {
    headers: {
      'x-api-key': apiKey
    }
  }
);
```

### Company Update Pattern (Dot Notation)
```javascript
// Source: backend/services/fmcsaSyncService.js:53-73
const updateData = {
  'fmcsaData.crashes': fmcsaData.crashes || {},
  'fmcsaData.operatingStatus': fmcsaData.carrier?.operatingStatus || null,
  'fmcsaData.lastFetched': new Date()
  // NOTE: Use dot notation to NOT overwrite sibling fields
};

await Company.findByIdAndUpdate(companyId, updateData, { new: true });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sync on login only | Background cron sync | This phase | Fresh data regardless of user activity |
| Single API source | Three coordinated sources | Current codebase | SAFER (CSA), DataHub (violations), SaferWebAPI (inspections) |
| No sync status | Per-company sync tracking | This phase | User can see when data was last updated |

**Deprecated/outdated:**
- Manual refresh as primary mechanism: Users should see auto-synced data by default
- fmcsaSyncService.syncOnLogin(): Still works but sync should not depend on user login frequency

## Open Questions

None - all patterns are well-established in the existing codebase.

## Sources

### Primary (HIGH confidence)
- backend/server.js - 5 existing cron job patterns (lines 217-319)
- backend/services/fmcsaSyncService.js - CSA score sync implementation
- backend/services/fmcsaViolationService.js - SaferWebAPI integration
- backend/services/fmcsaInspectionService.js - DataHub violations sync
- backend/services/samsaraService.js - syncAll() orchestration pattern
- backend/models/Company.js - existing fmcsaData schema

### Secondary (MEDIUM confidence)
- [SaferWebAPI Documentation](https://saferwebapi.com/documentation/snapshots-usdot) - API endpoint format
- [Socrata App Tokens](https://dev.socrata.com/docs/app-tokens) - Authentication and rate limits
- [FMCSA DataHub](https://datahub.transportation.gov/resource/8mt8-2mdr.json) - SMS violations dataset

### Tertiary (LOW confidence)
- [node-cron best practices](https://medium.com/@kfaizal307/how-to-create-a-cron-job-in-node-js-with-proper-error-handling-993b1439d925) - Error handling patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, no new dependencies
- Architecture: HIGH - Patterns match 5 existing cron jobs and Samsara sync service
- Pitfalls: HIGH - Based on existing error handling in codebase and API documentation

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable patterns, established APIs)
