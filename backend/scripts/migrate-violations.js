#!/usr/bin/env node

/**
 * Migration Script: Embedded Violations to SSOT Violation Documents
 *
 * Extracts violations from FMCSAInspection.violations[] arrays and creates
 * standalone Violation documents, establishing Violation model as SSOT.
 *
 * Features:
 * - Batch processing with configurable batch size
 * - Checkpoint-based resumability via _migrationState collection
 * - Idempotent: safe to run multiple times (uses ordered:false + unique index)
 * - Dry-run mode for previewing changes
 * - Verification functions for pre/post migration validation
 *
 * Usage:
 *   node scripts/migrate-violations.js            # Run migration
 *   node scripts/migrate-violations.js --dry-run  # Preview only
 *   node scripts/migrate-violations.js --verify   # Run verification only
 *   node scripts/migrate-violations.js --reset    # Clear checkpoint (re-run from scratch)
 *
 * Requires: MONGODB_URI environment variable
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const FMCSAInspection = require('../models/FMCSAInspection');
const Violation = require('../models/Violation');

// Configuration
const MIGRATION_NAME = 'violations_to_ssot_v1';
const BATCH_SIZE = 500;
const CHECKPOINT_COLLECTION = '_migrationState';

// ============================================================================
// Field Transformation
// ============================================================================

/**
 * Transform an embedded violation to a Violation document schema
 *
 * @param {Object} embedded - Embedded violation from FMCSAInspection.violations[]
 * @param {Object} inspection - Parent FMCSAInspection document
 * @returns {Object} - Violation document ready for insertion
 */
function transformEmbeddedToViolation(embedded, inspection) {
  return {
    // From inspection context
    companyId: inspection.companyId,
    inspectionNumber: inspection.reportNumber,
    violationDate: inspection.inspectionDate,
    location: {
      state: inspection.state || undefined,
      address: inspection.location || undefined
    },
    inspectionLevel: inspection.inspectionLevel,
    inspectionType: inspection.inspectionType || 'roadside',

    // From embedded violation
    violationCode: embedded.code || undefined,
    description: embedded.description || 'Unknown violation',
    violationType: embedded.description || 'Unknown violation',
    basic: embedded.basic || 'vehicle_maintenance',
    severityWeight: embedded.severityWeight || 5,
    outOfService: Boolean(embedded.oos),

    // Set status for migrated records
    status: 'open',

    // Sync metadata for tracking
    syncMetadata: {
      source: 'legacy_migration',
      importedAt: new Date(),
      externalId: `${inspection.reportNumber}_${embedded.code || 'unknown'}_${Date.now()}`
    },

    // Linking metadata
    linkingMetadata: {
      reviewRequired: false
    }
  };
}

// ============================================================================
// Checkpoint Management
// ============================================================================

/**
 * Get the last checkpoint for this migration
 *
 * @param {Object} db - Mongoose connection.db
 * @returns {Object|null} - Checkpoint data or null if not found
 */
async function getLastCheckpoint(db) {
  const collection = db.collection(CHECKPOINT_COLLECTION);
  const checkpoint = await collection.findOne({ migrationName: MIGRATION_NAME });
  return checkpoint;
}

/**
 * Save a checkpoint for resumability
 *
 * @param {Object} db - Mongoose connection.db
 * @param {ObjectId} lastProcessedId - Last processed inspection _id
 * @param {Object} stats - Current migration statistics
 */
async function saveCheckpoint(db, lastProcessedId, stats) {
  const collection = db.collection(CHECKPOINT_COLLECTION);
  await collection.updateOne(
    { migrationName: MIGRATION_NAME },
    {
      $set: {
        migrationName: MIGRATION_NAME,
        lastProcessedId,
        stats,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

/**
 * Mark migration as completed
 *
 * @param {Object} db - Mongoose connection.db
 * @param {Object} stats - Final migration statistics
 */
async function markMigrationComplete(db, stats) {
  const collection = db.collection(CHECKPOINT_COLLECTION);
  await collection.updateOne(
    { migrationName: MIGRATION_NAME },
    {
      $set: {
        completed: true,
        completedAt: new Date(),
        stats,
        updatedAt: new Date()
      }
    }
  );
}

/**
 * Clear checkpoint to allow re-running from scratch
 *
 * @param {Object} db - Mongoose connection.db
 */
async function clearCheckpoint(db) {
  const collection = db.collection(CHECKPOINT_COLLECTION);
  await collection.deleteOne({ migrationName: MIGRATION_NAME });
  console.log(`[Migration] Checkpoint cleared for ${MIGRATION_NAME}`);
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process a batch of inspections
 *
 * @param {Array} inspections - Array of FMCSAInspection documents
 * @param {Object} options - { dryRun: boolean }
 * @returns {Object} - { inserted, duplicates, inspectionsProcessed }
 */
async function processBatch(inspections, options = {}) {
  const { dryRun = false } = options;

  let inserted = 0;
  let duplicates = 0;
  let inspectionsProcessed = 0;

  for (const inspection of inspections) {
    if (!inspection.violations || inspection.violations.length === 0) {
      inspectionsProcessed++;
      continue;
    }

    // Transform all embedded violations
    const violationDocs = inspection.violations.map(embedded =>
      transformEmbeddedToViolation(embedded, inspection)
    );

    if (dryRun) {
      // In dry run, just count what would be inserted
      inserted += violationDocs.length;
      inspectionsProcessed++;
      continue;
    }

    try {
      // Insert with ordered:false to continue on duplicates
      const result = await Violation.insertMany(violationDocs, { ordered: false });
      inserted += result.length;

      // Update FMCSAInspection.violationRefs with the new ObjectIds
      const insertedIds = result.map(doc => doc._id);
      await FMCSAInspection.updateOne(
        { _id: inspection._id },
        { $addToSet: { violationRefs: { $each: insertedIds } } }
      );

    } catch (error) {
      if (error.code === 11000 || error.name === 'BulkWriteError') {
        // Handle duplicate key errors
        // insertedDocs contains successfully inserted documents
        const insertedDocs = error.insertedDocs || [];
        const writeErrors = error.writeErrors || [];

        inserted += insertedDocs.length;
        duplicates += writeErrors.length;

        // Still update violationRefs with successfully inserted docs
        if (insertedDocs.length > 0) {
          const insertedIds = insertedDocs.map(doc => doc._id);
          await FMCSAInspection.updateOne(
            { _id: inspection._id },
            { $addToSet: { violationRefs: { $each: insertedIds } } }
          );
        }
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }

    inspectionsProcessed++;
  }

  return { inserted, duplicates, inspectionsProcessed };
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Run the migration
 *
 * @param {Object} options - { dryRun: boolean, batchSize: number }
 * @returns {Object} - Final migration statistics
 */
async function runMigration(options = {}) {
  const { dryRun = false, batchSize = BATCH_SIZE } = options;

  console.log(`[Migration] Starting ${MIGRATION_NAME}${dryRun ? ' (DRY RUN)' : ''}`);

  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    await mongoose.connect(uri);
    console.log(`[Migration] Connected to MongoDB`);
  }

  const db = mongoose.connection.db;

  // Check for existing checkpoint
  const checkpoint = await getLastCheckpoint(db);

  if (checkpoint?.completed && !dryRun) {
    console.log(`[Migration] Already completed at ${checkpoint.completedAt}`);
    console.log(`[Migration] Final stats: ${JSON.stringify(checkpoint.stats)}`);
    console.log(`[Migration] Run with --reset to re-run from scratch`);
    return checkpoint.stats;
  }

  // Build query - resume from checkpoint if available
  const query = { 'violations.0': { $exists: true } };
  if (checkpoint?.lastProcessedId && !dryRun) {
    query._id = { $gt: checkpoint.lastProcessedId };
    console.log(`[Migration] Resuming from checkpoint: ${checkpoint.lastProcessedId}`);
  }

  // Initialize stats (carry over from checkpoint if resuming)
  const stats = {
    totalInserted: checkpoint?.stats?.totalInserted || 0,
    totalDuplicates: checkpoint?.stats?.totalDuplicates || 0,
    totalInspectionsProcessed: checkpoint?.stats?.totalInspectionsProcessed || 0,
    startedAt: checkpoint?.stats?.startedAt || new Date().toISOString()
  };

  // Count total inspections with embedded violations
  const totalCount = await FMCSAInspection.countDocuments({ 'violations.0': { $exists: true } });
  console.log(`[Migration] Total inspections with embedded violations: ${totalCount}`);

  // Use cursor for memory-efficient iteration
  const cursor = FMCSAInspection.find(query)
    .sort({ _id: 1 })
    .cursor({ batchSize });

  let batch = [];
  let lastProcessedId = checkpoint?.lastProcessedId;

  for await (const inspection of cursor) {
    batch.push(inspection);

    if (batch.length >= batchSize) {
      const result = await processBatch(batch, { dryRun });

      stats.totalInserted += result.inserted;
      stats.totalDuplicates += result.duplicates;
      stats.totalInspectionsProcessed += result.inspectionsProcessed;
      lastProcessedId = batch[batch.length - 1]._id;

      console.log(
        `[Migration] Processed ${stats.totalInspectionsProcessed} inspections, ` +
        `${stats.totalInserted} violations inserted, ` +
        `${stats.totalDuplicates} duplicates skipped`
      );

      // Save checkpoint after each batch (not in dry run)
      if (!dryRun) {
        await saveCheckpoint(db, lastProcessedId, stats);
      }

      batch = [];
    }
  }

  // Process remaining items
  if (batch.length > 0) {
    const result = await processBatch(batch, { dryRun });

    stats.totalInserted += result.inserted;
    stats.totalDuplicates += result.duplicates;
    stats.totalInspectionsProcessed += result.inspectionsProcessed;
    lastProcessedId = batch[batch.length - 1]._id;
  }

  stats.completedAt = new Date().toISOString();

  // Mark as complete (not in dry run)
  if (!dryRun) {
    await markMigrationComplete(db, stats);
  }

  console.log(`[Migration] ${dryRun ? 'DRY RUN ' : ''}Complete!`);
  console.log(`[Migration] Inspections processed: ${stats.totalInspectionsProcessed}`);
  console.log(`[Migration] Violations inserted: ${stats.totalInserted}`);
  console.log(`[Migration] Duplicates skipped: ${stats.totalDuplicates}`);

  return stats;
}

// ============================================================================
// Verification Functions
// ============================================================================

/**
 * Count total embedded violations across all inspections
 *
 * @returns {number} - Total count of embedded violations
 */
async function countEmbeddedViolations() {
  const result = await FMCSAInspection.aggregate([
    { $match: { 'violations.0': { $exists: true } } },
    { $unwind: '$violations' },
    { $count: 'total' }
  ]);
  return result[0]?.total || 0;
}

/**
 * Count migrated violations (those with legacy_migration source)
 *
 * @returns {number} - Total count of migrated violations
 */
async function countMigratedViolations() {
  return Violation.countDocuments({ 'syncMetadata.source': 'legacy_migration' });
}

/**
 * Verify a random sample of inspections
 *
 * @param {number} sampleSize - Number of inspections to sample
 * @returns {Object} - { sampled, passed, issues: [] }
 */
async function verifySample(sampleSize = 10) {
  const inspections = await FMCSAInspection.aggregate([
    { $match: { 'violations.0': { $exists: true } } },
    { $sample: { size: sampleSize } }
  ]);

  const issues = [];
  let passed = 0;

  for (const inspection of inspections) {
    const embeddedCount = inspection.violations?.length || 0;
    const migratedCount = await Violation.countDocuments({
      inspectionNumber: inspection.reportNumber,
      'syncMetadata.source': 'legacy_migration'
    });

    // Reload inspection to check violationRefs
    const fullInspection = await FMCSAInspection.findById(inspection._id);
    const refsCount = fullInspection?.violationRefs?.length || 0;

    if (embeddedCount === migratedCount && migratedCount === refsCount) {
      passed++;
    } else {
      issues.push({
        inspectionId: inspection._id,
        reportNumber: inspection.reportNumber,
        embeddedCount,
        migratedCount,
        refsCount
      });
    }
  }

  return { sampled: inspections.length, passed, issues };
}

/**
 * Count inspections with embedded violations but no violationRefs
 *
 * @returns {number} - Count of unmigrated inspections
 */
async function verifyViolationRefs() {
  return FMCSAInspection.countDocuments({
    'violations.0': { $exists: true },
    'violationRefs.0': { $exists: false }
  });
}

/**
 * Run full migration verification
 *
 * @returns {Object} - Verification results
 */
async function verifyMigration() {
  console.log('[Verify] Starting migration verification...');

  // Connect if needed
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    await mongoose.connect(uri);
    console.log('[Verify] Connected to MongoDB');
  }

  const embeddedCount = await countEmbeddedViolations();
  console.log(`[Verify] Embedded violations: ${embeddedCount}`);

  const migratedCount = await countMigratedViolations();
  console.log(`[Verify] Migrated violations: ${migratedCount}`);

  const sampleResult = await verifySample(10);
  console.log(`[Verify] Sample check: ${sampleResult.passed}/${sampleResult.sampled} passed`);

  const unmigrated = await verifyViolationRefs();
  console.log(`[Verify] Inspections without violationRefs: ${unmigrated}`);

  const success = embeddedCount === migratedCount &&
                  sampleResult.issues.length === 0 &&
                  unmigrated === 0;

  console.log(`[Verify] Overall: ${success ? 'PASSED' : 'FAILED'}`);

  if (sampleResult.issues.length > 0) {
    console.log('[Verify] Issues found:');
    sampleResult.issues.forEach(issue => console.log(JSON.stringify(issue)));
  }

  return { success, embeddedCount, migratedCount, sampleResult, unmigrated };
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verifyOnly = args.includes('--verify');
  const reset = args.includes('--reset');

  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Error: MONGODB_URI environment variable is required');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('[CLI] Connected to MongoDB');

    if (reset) {
      await clearCheckpoint(mongoose.connection.db);
      console.log('[CLI] Checkpoint reset complete');
    } else if (verifyOnly) {
      const result = await verifyMigration();
      process.exit(result.success ? 0 : 1);
    } else {
      await runMigration({ dryRun });
    }

    await mongoose.connection.close();
    console.log('[CLI] Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('[CLI] Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for programmatic use
module.exports = { runMigration, verifyMigration };
