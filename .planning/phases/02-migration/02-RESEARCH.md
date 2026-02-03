# Phase 2: Migration - Research

**Researched:** 2026-02-03
**Domain:** MongoDB data migration (embedded documents to references)
**Confidence:** HIGH

## Summary

This phase migrates embedded violations from `FMCSAInspection.violations[]` arrays to the standalone `Violation` collection, establishing the Violation model as the single source of truth (SSOT). The migration is a one-time, idempotent operation that must handle duplicates, invalid data, and be resumable in case of failures.

The research confirms that MongoDB and Mongoose provide robust patterns for this type of migration. The existing codebase already uses `insertMany` with `ordered: false` for bulk operations (see `fmcsaInspectionService.importDataHubViolationsToDataQ`), and this pattern should be extended for the migration script. The compound unique index on `(companyId, inspectionNumber, violationCode, violationDate)` created in Phase 1 will naturally prevent duplicate inserts.

**Primary recommendation:** Use a standalone Node.js script with batch processing (500 inspections per batch), checkpoint tracking via a `_migrationState` collection, and `insertMany` with `ordered: false` to skip duplicates automatically via the unique index.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mongoose | 8.0.3 | MongoDB ODM with transaction support | Already in use, provides sessions and bulkWrite |
| mongodb | (via mongoose) | Native driver for low-level operations | Built-in with mongoose, supports bulk ops |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node built-ins | - | Console logging, process management | Migration progress and error reporting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom script | migrate-mongo | migrate-mongo is overkill for one-time data migration; better for schema migrations |
| insertMany | bulkWrite | insertMany is simpler for insert-only operations; bulkWrite offers mixed operations |
| Transactions | ordered: false | Transactions add overhead; ordered:false provides atomic-enough behavior for idempotent operations |

**Installation:**
No new dependencies required. The existing mongoose 8.0.3 supports all needed features.

## Architecture Patterns

### Recommended Script Structure
```
backend/
└── scripts/
    └── migrate-violations.js    # One-time migration script
```

### Pattern 1: Checkpoint-Based Resumable Migration
**What:** Track last processed document ID in a separate collection to enable resuming after failures
**When to use:** Large dataset migrations that may take time or encounter errors
**Example:**
```javascript
// Source: MongoDB best practices for migrations
const MIGRATION_STATE_COLLECTION = '_migrationState';
const MIGRATION_NAME = 'violations_to_ssot_v1';

async function getLastCheckpoint(db) {
  const state = await db.collection(MIGRATION_STATE_COLLECTION).findOne({ name: MIGRATION_NAME });
  return state?.lastProcessedId || null;
}

async function saveCheckpoint(db, lastProcessedId, stats) {
  await db.collection(MIGRATION_STATE_COLLECTION).updateOne(
    { name: MIGRATION_NAME },
    {
      $set: {
        lastProcessedId,
        lastUpdated: new Date(),
        ...stats
      }
    },
    { upsert: true }
  );
}
```

### Pattern 2: Batch Processing with Cursor
**What:** Process inspections in batches using cursor-based iteration to avoid memory issues
**When to use:** Migrating data from a collection with potentially thousands of documents
**Example:**
```javascript
// Source: MongoDB cursor documentation
const BATCH_SIZE = 500;

async function processBatch(inspections, companyId) {
  const violationDocs = [];

  for (const inspection of inspections) {
    for (const embedded of inspection.violations || []) {
      violationDocs.push(transformEmbeddedToViolation(inspection, embedded, companyId));
    }
  }

  if (violationDocs.length > 0) {
    // ordered: false continues on duplicate key errors
    const result = await Violation.insertMany(violationDocs, { ordered: false });
    return result.length;
  }
  return 0;
}
```

### Pattern 3: Duplicate Handling via Unique Index
**What:** Let the unique index reject duplicates rather than pre-checking
**When to use:** When a unique compound index already exists (created in Phase 1)
**Example:**
```javascript
// Source: Mongoose insertMany documentation
try {
  const result = await Violation.insertMany(docs, { ordered: false });
  return { inserted: result.length, duplicates: 0 };
} catch (error) {
  if (error.code === 11000 || error.writeErrors) {
    // E11000 duplicate key error - expected for idempotent runs
    const inserted = error.insertedDocs?.length || 0;
    const duplicates = error.writeErrors?.length || 0;
    return { inserted, duplicates };
  }
  throw error;
}
```

### Anti-Patterns to Avoid
- **Processing all inspections at once:** Memory issues with large datasets. Use batching.
- **Checking for duplicates before insert:** Slower than letting the index reject them. Let unique index do the work.
- **Using transactions for each batch:** Unnecessary overhead for idempotent operations. ordered:false is sufficient.
- **Deleting embedded violations during migration:** Keep them until Phase 3 sync is confirmed working.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duplicate detection | Hash-based dedup before insert | Unique compound index + ordered:false | Index rejects at DB level, faster and atomic |
| Progress tracking | File-based checkpoints | MongoDB collection for state | Survives crashes, queryable |
| Batch iteration | Manual offset/limit queries | MongoDB cursor with batchSize | Memory efficient, handles timeouts |
| Error handling for bulk | Try/catch each document | insertMany ordered:false error parsing | Built-in support for partial success |

**Key insight:** The unique compound index created in Phase 1 already solves duplicate detection. The migration script just needs to insert and handle E11000 errors gracefully.

## Common Pitfalls

### Pitfall 1: Memory Exhaustion on Large Datasets
**What goes wrong:** Loading all inspections into memory at once causes Node.js heap overflow
**Why it happens:** Using `find().toArray()` or `find()` without streaming on large collections
**How to avoid:** Use cursor-based iteration with explicit batchSize, process in chunks
**Warning signs:** Node process crashes with "JavaScript heap out of memory" or extreme slowness

### Pitfall 2: Failing to Handle Partial Success
**What goes wrong:** Migration throws error and stops when some documents fail to insert
**Why it happens:** Using `ordered: true` (default) which stops at first error
**How to avoid:** Use `ordered: false` and parse the error to get both inserted docs and failed writes
**Warning signs:** Migration aborts with E11000 error instead of continuing

### Pitfall 3: Field Mapping Mismatches
**What goes wrong:** Embedded violation fields don't match Violation schema, causing validation errors
**Why it happens:** Embedded violations have different field names (e.g., `code` vs `violationCode`, `oos` vs `outOfService`)
**How to avoid:** Explicit field mapping function that transforms embedded format to Violation format
**Warning signs:** Mongoose validation errors during insertMany

### Pitfall 4: Missing Required Fields
**What goes wrong:** Violation documents fail validation because embedded violations lack required fields
**Why it happens:** Embedded violations may have incomplete data (no BASIC category, no severityWeight)
**How to avoid:** Provide sensible defaults in the transformation function, flag for manual review
**Warning signs:** "Path `basic` is required" or similar validation errors

### Pitfall 5: Date/Timezone Issues
**What goes wrong:** Violation dates shift by a day due to timezone handling
**Why it happens:** Inconsistent Date creation (local vs UTC)
**How to avoid:** Use the inspection's inspectionDate directly (already a Date object), don't re-parse
**Warning signs:** Violation dates off by one day compared to inspection dates

### Pitfall 6: Not Updating violationRefs After Insert
**What goes wrong:** Violations created but FMCSAInspection.violationRefs[] remains empty
**Why it happens:** Forgetting to update the parent document with references to new Violation documents
**How to avoid:** After successful insert, update FMCSAInspection.violationRefs with the new ObjectIds
**Warning signs:** `isMigrated` virtual returns false even after migration runs

## Code Examples

Verified patterns from official sources and existing codebase:

### Field Mapping (Embedded to Violation Schema)
```javascript
// Based on existing codebase schema comparison
function transformEmbeddedToViolation(inspection, embedded, companyId) {
  // Map embedded violation fields to Violation schema
  // Embedded: { code, description, basic, severityWeight, oos, unit, timeWeight }
  // Violation: { violationCode, description, basic, severityWeight, outOfService, ... }

  return {
    companyId,
    inspectionNumber: inspection.reportNumber,
    violationDate: inspection.inspectionDate,  // Use inspection date
    location: {
      state: inspection.state,
      address: inspection.location
    },
    basic: embedded.basic || 'vehicle_maintenance',  // Default if missing
    violationType: embedded.description || `Violation ${embedded.code}`,
    violationCode: embedded.code,
    description: embedded.description || `Violation ${embedded.code}`,
    severityWeight: embedded.severityWeight || 5,  // Default mid-range
    outOfService: !!embedded.oos,
    inspectionType: inspection.inspectionType || 'roadside',
    inspectionLevel: inspection.inspectionLevel,
    status: 'open',
    // Migration metadata
    syncMetadata: {
      source: 'legacy_migration',
      importedAt: new Date(),
      externalId: `${inspection.reportNumber}_${embedded.code}`,
      lastVerified: null
    },
    linkingMetadata: {
      reviewRequired: false
    }
  };
}
```

### Batch Processing with Progress Logging
```javascript
// Source: MongoDB cursor best practices
async function migrateInBatches(db, batchSize = 500) {
  const FMCSAInspection = require('../models/FMCSAInspection');
  const Violation = require('../models/Violation');

  let lastId = await getLastCheckpoint(db);
  const query = lastId ? { _id: { $gt: lastId } } : {};

  // Only process inspections with embedded violations
  query['violations.0'] = { $exists: true };

  const cursor = FMCSAInspection.find(query)
    .sort({ _id: 1 })
    .batchSize(batchSize)
    .cursor();

  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalDuplicates = 0;

  for await (const inspection of cursor) {
    batch.push(inspection);

    if (batch.length >= batchSize) {
      const result = await processBatch(batch);
      totalProcessed += batch.length;
      totalInserted += result.inserted;
      totalDuplicates += result.duplicates;

      await saveCheckpoint(db, batch[batch.length - 1]._id, {
        totalProcessed,
        totalInserted,
        totalDuplicates
      });

      console.log(`[Migration] Processed ${totalProcessed} inspections, ${totalInserted} violations inserted, ${totalDuplicates} duplicates skipped`);
      batch = [];
    }
  }

  // Process remaining
  if (batch.length > 0) {
    const result = await processBatch(batch);
    totalProcessed += batch.length;
    totalInserted += result.inserted;
    totalDuplicates += result.duplicates;
    await saveCheckpoint(db, batch[batch.length - 1]._id, {
      totalProcessed,
      totalInserted,
      totalDuplicates,
      completed: true,
      completedAt: new Date()
    });
  }

  return { totalProcessed, totalInserted, totalDuplicates };
}
```

### Updating violationRefs After Insert
```javascript
// After inserting violations, update the parent inspection
async function updateInspectionRefs(inspection, violationIds) {
  await FMCSAInspection.updateOne(
    { _id: inspection._id },
    { $set: { violationRefs: violationIds } }
  );
}
```

### Verification Queries
```javascript
// Pre-migration: Count embedded violations
async function countEmbeddedViolations() {
  const result = await FMCSAInspection.aggregate([
    { $unwind: '$violations' },
    { $count: 'total' }
  ]);
  return result[0]?.total || 0;
}

// Post-migration: Count Violation documents from migration
async function countMigratedViolations() {
  return Violation.countDocuments({ 'syncMetadata.source': 'legacy_migration' });
}

// Verify a random sample
async function verifySample(sampleSize = 10) {
  const inspections = await FMCSAInspection.aggregate([
    { $match: { 'violations.0': { $exists: true } } },
    { $sample: { size: sampleSize } }
  ]);

  const issues = [];
  for (const insp of inspections) {
    const embeddedCount = insp.violations?.length || 0;
    const migratedCount = await Violation.countDocuments({
      inspectionNumber: insp.reportNumber,
      'syncMetadata.source': 'legacy_migration'
    });

    if (embeddedCount !== migratedCount) {
      issues.push({
        inspectionId: insp._id,
        reportNumber: insp.reportNumber,
        embedded: embeddedCount,
        migrated: migratedCount
      });
    }
  }
  return issues;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Transactions for every batch | ordered:false with unique index | Mongoose 6+ | Simpler, better performance for idempotent ops |
| Manual cursor management | for await...of with cursor() | Node 12+ | Cleaner async iteration |
| File-based checkpoints | MongoDB collection checkpoints | N/A | More reliable, atomic updates |

**Deprecated/outdated:**
- `Model.collection.insert()`: Deprecated, use `insertMany()` instead
- Manual duplicate checking before insert: Inefficient compared to unique index

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal batch size for this dataset**
   - What we know: 500 is a reasonable starting point; MongoDB recommends 1000-10000 for bulk ops
   - What's unclear: Actual dataset size and memory constraints in production
   - Recommendation: Start with 500, tune based on observed memory usage and timing

2. **Transaction boundaries for atomicity**
   - What we know: Transactions add overhead; ordered:false provides partial atomicity
   - What's unclear: Whether we need transactional guarantees for insert + violationRefs update
   - Recommendation: Skip transactions for v1; the migration is resumable and duplicates are handled

## Sources

### Primary (HIGH confidence)
- Mongoose 8.0 documentation - bulkWrite, insertMany, transactions
- MongoDB Manual - Bulk Write Operations, Cursor usage
- Existing codebase: `backend/services/fmcsaInspectionService.js` (lines 663-669) - insertMany pattern

### Secondary (MEDIUM confidence)
- [migrate-mongo GitHub](https://github.com/seppevs/migrate-mongo) - Checkpoint and transaction patterns
- [MongoDB Community Forums](https://www.mongodb.com/community/forums/t/e11000-duplicate-key-error-collection/14141) - E11000 error handling patterns
- [DZone - MongoDB Migration with Node.js](https://dzone.com/articles/how-to-perform-data-migration-in-mongodb-using-nodejs) - General migration patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing mongoose, no new dependencies
- Architecture: HIGH - Patterns verified from official docs and existing codebase
- Pitfalls: HIGH - Based on documented MongoDB/Mongoose behavior
- Code examples: HIGH - Adapted from existing codebase patterns

**Research date:** 2026-02-03
**Valid until:** 60 days (stable domain, no expected changes)
