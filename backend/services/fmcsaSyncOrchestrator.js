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
    try {
      console.log(`[FMCSA Orchestrator] Syncing violations from DataHub for company ${companyId}`);
      const violationResult = await fmcsaInspectionService.syncViolationsFromDataHub(companyId);
      if (violationResult.success) {
        timestamps.violationsLastSync = new Date();
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
          ...(timestamps.dataQAnalysisCount !== undefined && { 'fmcsaData.syncStatus.dataQAnalysisCount': timestamps.dataQAnalysisCount })
        }
      }
    );

    return { success, errors };
  }
};

module.exports = fmcsaSyncOrchestrator;
