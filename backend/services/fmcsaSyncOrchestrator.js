/**
 * FMCSA Sync Orchestrator
 *
 * Coordinates sync across all FMCSA data sources:
 * 1. CSA BASIC scores (fmcsaSyncService -> SAFER)
 * 2. Violation details (fmcsaInspectionService -> DataHub)
 * 3. Inspection stats (fmcsaViolationService -> SaferWebAPI)
 * 4. Entity linking (entityLinkingService -> drivers/vehicles)
 * 5. DataQ analysis (dataQAnalysisService -> challenge scoring)
 *
 * Designed for cron job usage - never throws, always logs errors.
 */

const Company = require('../models/Company');
const fmcsaSyncService = require('./fmcsaSyncService');
const fmcsaInspectionService = require('./fmcsaInspectionService');
const fmcsaViolationService = require('./fmcsaViolationService');
const entityLinkingService = require('./entityLinkingService');
const dataQAnalysisService = require('./dataQAnalysisService');
const complianceScoreService = require('./complianceScoreService');
const alertService = require('./alertService');
const emailService = require('./emailService');
const User = require('../models/User');

const fmcsaSyncOrchestrator = {
  /**
   * Sync all companies with DOT numbers
   * Processes sequentially to avoid API rate limits
   *
   * @returns {object} Summary of sync results
   */
  async syncAllCompanies() {
    console.log('[FMCSA Orchestrator] Starting sync for all companies...');

    const companies = await Company.find({
      dotNumber: { $exists: true, $ne: null, $ne: '' }
    }).select('_id name dotNumber');

    console.log(`[FMCSA Orchestrator] Found ${companies.length} companies with DOT numbers`);

    const results = {
      total: companies.length,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    // Process sequentially to avoid rate limiting
    for (const company of companies) {
      try {
        const result = await this.syncCompany(company._id);
        if (result.success) {
          results.succeeded++;
        } else {
          results.failed++;
          results.errors.push({ companyId: company._id, name: company.name, errors: result.errors });
        }
      } catch (error) {
        // Should never happen (syncCompany catches all), but safety first
        console.error(`[FMCSA Orchestrator] Unexpected error for ${company.name}:`, error.message);
        results.failed++;
        results.errors.push({ companyId: company._id, name: company.name, errors: [{ source: 'orchestrator', error: error.message }] });
      }
    }

    console.log(`[FMCSA Orchestrator] Sync complete: ${results.succeeded}/${results.total} succeeded`);
    return results;
  },

  /**
   * Sync all FMCSA data for a single company
   * Updates Company.fmcsaData.syncStatus with results
   *
   * @param {ObjectId|string} companyId - Company ID
   * @returns {object} Sync results with success flag and any errors
   */
  async syncCompany(companyId) {
    const errors = [];
    const timestamps = {};

    // 1. CSA BASIC scores from SAFER (via fmcsaSyncService)
    try {
      console.log(`[FMCSA Orchestrator] Syncing CSA scores for company ${companyId}`);
      const csaResult = await fmcsaSyncService.syncCompanyData(companyId);
      if (csaResult) {
        timestamps.csaScoresLastSync = new Date();
        console.log(`[FMCSA Orchestrator] CSA scores synced successfully`);
      } else {
        errors.push({ source: 'csa_scores', error: 'No data returned', timestamp: new Date() });
      }
    } catch (err) {
      console.error(`[FMCSA Orchestrator] CSA scores failed:`, err.message);
      errors.push({ source: 'csa_scores', error: err.message, timestamp: new Date() });
    }

    // 2. Violation details from DataHub (via fmcsaInspectionService)
    let newInspections = [];
    try {
      console.log(`[FMCSA Orchestrator] Syncing violations from DataHub for company ${companyId}`);
      const violationResult = await fmcsaInspectionService.syncViolationsFromDataHub(companyId);
      if (violationResult.success) {
        timestamps.violationsLastSync = new Date();
        newInspections = violationResult.newInspections || [];
        console.log(`[FMCSA Orchestrator] Violations synced: ${violationResult.matched || 0} matched, ${violationResult.total || 0} total`);
      } else {
        errors.push({ source: 'violations', error: violationResult.message || 'Sync failed', timestamp: new Date() });
      }
    } catch (err) {
      console.error(`[FMCSA Orchestrator] Violations sync failed:`, err.message);
      errors.push({ source: 'violations', error: err.message, timestamp: new Date() });
    }

    // 3. Inspection stats from SaferWebAPI (via fmcsaViolationService)
    try {
      console.log(`[FMCSA Orchestrator] Syncing inspection stats from SaferWebAPI for company ${companyId}`);
      const inspectionResult = await fmcsaViolationService.syncViolationHistory(companyId);
      if (inspectionResult.success) {
        timestamps.inspectionsLastSync = new Date();
        console.log(`[FMCSA Orchestrator] Inspection stats synced: ${inspectionResult.imported || 0} inspections`);
      } else {
        errors.push({ source: 'inspections', error: inspectionResult.message || 'Sync failed', timestamp: new Date() });
      }
    } catch (err) {
      console.error(`[FMCSA Orchestrator] Inspection stats failed:`, err.message);
      errors.push({ source: 'inspections', error: err.message, timestamp: new Date() });
    }

    // 4. Link violations to entities (drivers/vehicles)
    try {
      console.log(`[FMCSA Orchestrator] Running entity linking for company ${companyId}`);
      const linkingResult = await entityLinkingService.linkViolationsForCompany(companyId);
      timestamps.linkingLastRun = new Date();
      console.log(`[FMCSA Orchestrator] Linking complete: ${linkingResult.linked} linked, ${linkingResult.reviewRequired} need review, ${linkingResult.skipped} skipped`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] Entity linking failed:`, err.message);
      errors.push({ source: 'entity_linking', error: err.message, timestamp: new Date() });
    }

    // 5. Run DataQ analysis on newly-synced violations
    try {
      console.log(`[FMCSA Orchestrator] Running DataQ analysis for company ${companyId}`);
      const dataQResult = await dataQAnalysisService.runBulkAnalysis(companyId);
      timestamps.dataQAnalysisLastRun = new Date();
      timestamps.dataQAnalysisCount = dataQResult.analyzed;
      console.log(`[FMCSA Orchestrator] DataQ analysis complete: ${dataQResult.analyzed} violations scored`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] DataQ analysis failed:`, err.message);
      errors.push({ source: 'dataq_analysis', error: err.message, timestamp: new Date() });
    }

    // 5b. Run Health Check scanner on violations
    try {
      console.log(`[FMCSA Orchestrator] Running violation scanner for company ${companyId}`);
      const violationScannerService = require('./violationScannerService');
      const scanResult = await violationScannerService.scanCompanyViolations(companyId);
      timestamps.scannerLastRun = new Date();
      console.log(`[FMCSA Orchestrator] Scanner complete: ${scanResult.scanned} violations scanned, ${scanResult.flagged} flagged`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] Violation scanner failed:`, err.message);
      errors.push({ source: 'violation_scanner', error: err.message, timestamp: new Date() });
    }

    // 6. Recalculate compliance score with fresh data
    try {
      console.log(`[FMCSA Orchestrator] Recalculating compliance score for company ${companyId}`);
      const scoreResult = await complianceScoreService.calculateScore(companyId);
      timestamps.complianceScoreLastCalc = new Date();
      console.log(`[FMCSA Orchestrator] Compliance score: ${scoreResult.overallScore}`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] Compliance score calculation failed:`, err.message);
      errors.push({ source: 'compliance_score', error: err.message, timestamp: new Date() });
    }

    // 7. Notify users about new inspections (fire-and-forget)
    if (newInspections.length > 0) {
      this._notifyNewInspections(companyId, newInspections);
    }

    // Update Company sync status
    const success = errors.length === 0;
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'fmcsaData.syncStatus.lastRun': new Date(),
          'fmcsaData.syncStatus.success': success,
          'fmcsaData.syncStatus.errors': errors,
          ...(timestamps.csaScoresLastSync && { 'fmcsaData.syncStatus.csaScoresLastSync': timestamps.csaScoresLastSync }),
          ...(timestamps.violationsLastSync && { 'fmcsaData.syncStatus.violationsLastSync': timestamps.violationsLastSync }),
          ...(timestamps.inspectionsLastSync && { 'fmcsaData.syncStatus.inspectionsLastSync': timestamps.inspectionsLastSync }),
          ...(timestamps.linkingLastRun && { 'fmcsaData.syncStatus.linkingLastRun': timestamps.linkingLastRun }),
          ...(timestamps.dataQAnalysisLastRun && { 'fmcsaData.syncStatus.dataQAnalysisLastRun': timestamps.dataQAnalysisLastRun }),
          ...(timestamps.dataQAnalysisCount !== undefined && { 'fmcsaData.syncStatus.dataQAnalysisCount': timestamps.dataQAnalysisCount }),
          ...(timestamps.scannerLastRun && { 'fmcsaData.syncStatus.scannerLastRun': timestamps.scannerLastRun })
        }
      }
    );

    return { success, errors };
  },

  /**
   * Fast sync for manual trigger — skips Puppeteer (CSA scraping), runs API calls in parallel
   * CSA scores are fetched in background via fire-and-forget from the route handler
   *
   * Steps: 2+3 in parallel (with 25s timeout each), then 4→5→6 sequentially
   * Expected timing: 15-30 seconds vs 120+ for full sync
   *
   * @param {ObjectId|string} companyId - Company ID
   * @returns {object} Sync results with success flag and any errors
   */
  async syncCompanyFast(companyId) {
    const errors = [];
    const timestamps = {};

    // Steps 2+3 in parallel: DataHub violations + SaferWebAPI inspection stats
    console.log(`[FMCSA Orchestrator] [Fast] Starting parallel sync for company ${companyId}`);

    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))
      ]);

    const [violationResult, inspectionResult] = await Promise.allSettled([
      withTimeout(
        fmcsaInspectionService.syncViolationsFromDataHub(companyId),
        25000,
        'DataHub violations'
      ),
      withTimeout(
        fmcsaViolationService.syncViolationHistory(companyId),
        25000,
        'SaferWebAPI inspections'
      )
    ]);

    // Process DataHub result
    let newInspections = [];
    if (violationResult.status === 'fulfilled' && violationResult.value?.success) {
      timestamps.violationsLastSync = new Date();
      newInspections = violationResult.value.newInspections || [];
      console.log(`[FMCSA Orchestrator] [Fast] Violations synced: ${violationResult.value.matched || 0} matched, ${violationResult.value.total || 0} total`);
    } else {
      const err = violationResult.status === 'rejected' ? violationResult.reason?.message : (violationResult.value?.message || 'Sync failed');
      console.error(`[FMCSA Orchestrator] [Fast] Violations failed:`, err);
      errors.push({ source: 'violations', error: err, timestamp: new Date() });
    }

    // Process SaferWebAPI result
    if (inspectionResult.status === 'fulfilled' && inspectionResult.value?.success) {
      timestamps.inspectionsLastSync = new Date();
      console.log(`[FMCSA Orchestrator] [Fast] Inspection stats synced: ${inspectionResult.value.imported || 0} inspections`);
    } else {
      const err = inspectionResult.status === 'rejected' ? inspectionResult.reason?.message : (inspectionResult.value?.message || 'Sync failed');
      console.error(`[FMCSA Orchestrator] [Fast] Inspection stats failed:`, err);
      errors.push({ source: 'inspections', error: err, timestamp: new Date() });
    }

    // Steps 4→5→6 sequentially (fast local DB ops)

    // 4. Link violations to entities (drivers/vehicles)
    try {
      console.log(`[FMCSA Orchestrator] [Fast] Running entity linking for company ${companyId}`);
      const linkingResult = await entityLinkingService.linkViolationsForCompany(companyId);
      timestamps.linkingLastRun = new Date();
      console.log(`[FMCSA Orchestrator] [Fast] Linking complete: ${linkingResult.linked} linked, ${linkingResult.reviewRequired} need review, ${linkingResult.skipped} skipped`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] [Fast] Entity linking failed:`, err.message);
      errors.push({ source: 'entity_linking', error: err.message, timestamp: new Date() });
    }

    // 5. Run DataQ analysis on newly-synced violations
    try {
      console.log(`[FMCSA Orchestrator] [Fast] Running DataQ analysis for company ${companyId}`);
      const dataQResult = await dataQAnalysisService.runBulkAnalysis(companyId);
      timestamps.dataQAnalysisLastRun = new Date();
      timestamps.dataQAnalysisCount = dataQResult.analyzed;
      console.log(`[FMCSA Orchestrator] [Fast] DataQ analysis complete: ${dataQResult.analyzed} violations scored`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] [Fast] DataQ analysis failed:`, err.message);
      errors.push({ source: 'dataq_analysis', error: err.message, timestamp: new Date() });
    }

    // 5b. Run Health Check scanner on violations
    try {
      console.log(`[FMCSA Orchestrator] [Fast] Running violation scanner for company ${companyId}`);
      const violationScannerService = require('./violationScannerService');
      const scanResult = await violationScannerService.scanCompanyViolations(companyId);
      timestamps.scannerLastRun = new Date();
      console.log(`[FMCSA Orchestrator] [Fast] Scanner complete: ${scanResult.scanned} violations scanned, ${scanResult.flagged} flagged`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] [Fast] Violation scanner failed:`, err.message);
      errors.push({ source: 'violation_scanner', error: err.message, timestamp: new Date() });
    }

    // 6. Recalculate compliance score with fresh data
    try {
      console.log(`[FMCSA Orchestrator] [Fast] Recalculating compliance score for company ${companyId}`);
      const scoreResult = await complianceScoreService.calculateScore(companyId);
      timestamps.complianceScoreLastCalc = new Date();
      console.log(`[FMCSA Orchestrator] [Fast] Compliance score: ${scoreResult.overallScore}`);
    } catch (err) {
      console.error(`[FMCSA Orchestrator] [Fast] Compliance score calculation failed:`, err.message);
      errors.push({ source: 'compliance_score', error: err.message, timestamp: new Date() });
    }

    // 7. Notify users about new inspections (fire-and-forget)
    if (newInspections.length > 0) {
      this._notifyNewInspections(companyId, newInspections);
    }

    // Update Company sync status
    const success = errors.length === 0;
    await Company.updateOne(
      { _id: companyId },
      {
        $set: {
          'fmcsaData.syncStatus.lastRun': new Date(),
          'fmcsaData.syncStatus.success': success,
          'fmcsaData.syncStatus.errors': errors,
          ...(timestamps.violationsLastSync && { 'fmcsaData.syncStatus.violationsLastSync': timestamps.violationsLastSync }),
          ...(timestamps.inspectionsLastSync && { 'fmcsaData.syncStatus.inspectionsLastSync': timestamps.inspectionsLastSync }),
          ...(timestamps.linkingLastRun && { 'fmcsaData.syncStatus.linkingLastRun': timestamps.linkingLastRun }),
          ...(timestamps.dataQAnalysisLastRun && { 'fmcsaData.syncStatus.dataQAnalysisLastRun': timestamps.dataQAnalysisLastRun }),
          ...(timestamps.dataQAnalysisCount !== undefined && { 'fmcsaData.syncStatus.dataQAnalysisCount': timestamps.dataQAnalysisCount }),
          ...(timestamps.scannerLastRun && { 'fmcsaData.syncStatus.scannerLastRun': timestamps.scannerLastRun })
        }
      }
    );

    console.log(`[FMCSA Orchestrator] [Fast] Sync complete for company ${companyId} — ${errors.length} errors`);
    return { success, errors, mode: 'fast' };
  },

  /**
   * Fire-and-forget: generate in-app alerts and send email notifications for new inspections.
   * Never throws — logs errors silently per orchestrator convention.
   */
  _notifyNewInspections(companyId, newInspections) {
    (async () => {
      try {
        const alerts = await alertService.generateNewInspectionAlerts(companyId, newInspections);
        console.log(`[FMCSA Orchestrator] Generated ${alerts?.length || 0} new inspection alerts for company ${companyId}`);
      } catch (err) {
        console.error(`[FMCSA Orchestrator] Alert generation failed for company ${companyId}:`, err.message);
      }

      try {
        const company = await Company.findById(companyId).select('name').lean();
        const users = await User.find({
          'companies.companyId': companyId,
          'companies.role': { $in: ['owner', 'admin', 'safety_manager'] },
          'companies.isActive': true,
          isActive: { $ne: false }
        }).lean();

        for (const user of users) {
          if (emailService.shouldSend(user, 'compliance')) {
            await emailService.sendNewInspectionNotification({
              to: user.email,
              firstName: user.firstName,
              companyName: company?.name || 'Your Company',
              companyId,
              inspections: newInspections
            });
          }
        }
        console.log(`[FMCSA Orchestrator] Sent inspection email notifications to ${users.length} users for company ${companyId}`);
      } catch (err) {
        console.error(`[FMCSA Orchestrator] Email notification failed for company ${companyId}:`, err.message);
      }
    })();
  }
};

module.exports = fmcsaSyncOrchestrator;
