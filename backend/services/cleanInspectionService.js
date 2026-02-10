const { FMCSAInspection, Violation } = require('../models');
const KnownInspection = require('../models/KnownInspection');
const csaCalculatorService = require('./csaCalculatorService');
const { BASIC_INFO, BASIC_KEYS } = require('./csaCalculatorService');

const cleanInspectionService = {
  /**
   * Get ratio of clean vs violation inspections in last 24 months.
   * Uses FMCSAInspection model where totalViolations === 0 means clean.
   */
  async getCleanRatio(companyId, options = {}) {
    const { basic, driverId } = options;
    const twentyFourMonthsAgo = new Date();
    twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

    const matchStage = {
      companyId,
      inspectionDate: { $gte: twentyFourMonthsAgo }
    };

    // Filter by driver if linked through violations
    if (driverId) {
      // Find inspections linked to this driver's violations
      const driverViolations = await Violation.find({
        companyId,
        driverId,
        violationDate: { $gte: twentyFourMonthsAgo }
      }).distinct('inspectionNumber');

      if (driverViolations.length > 0) {
        matchStage.reportNumber = { $in: driverViolations };
      }
    }

    // If filtering by BASIC, only count inspections that have (or lack) violations in that BASIC
    if (basic) {
      const inspectionsWithBasic = await FMCSAInspection.find({
        ...matchStage,
        'violations.basic': basic
      }).select('_id').lean();

      const withBasicIds = inspectionsWithBasic.map(i => i._id);

      const allInspections = await FMCSAInspection.find(matchStage)
        .select('_id totalViolations inspectionDate')
        .lean();

      const total = allInspections.length;
      const withViolations = withBasicIds.length;
      const clean = total - withViolations;

      return {
        total,
        clean,
        withViolations,
        ratio: total > 0 ? Math.round((clean / total) * 100) / 100 : 0,
        trend: null // Could compare to previous 24-month period
      };
    }

    // Default: count all inspections
    const allInspections = await FMCSAInspection.find(matchStage)
      .select('totalViolations inspectionDate')
      .sort({ inspectionDate: -1 })
      .lean();

    const total = allInspections.length;
    const clean = allInspections.filter(i => (i.totalViolations || 0) === 0).length;
    const withViolations = total - clean;

    // Calculate trend by comparing first 12 months to last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const recentInspections = allInspections.filter(i => new Date(i.inspectionDate) >= twelveMonthsAgo);
    const olderInspections = allInspections.filter(i => new Date(i.inspectionDate) < twelveMonthsAgo);

    const recentClean = recentInspections.filter(i => (i.totalViolations || 0) === 0).length;
    const olderClean = olderInspections.filter(i => (i.totalViolations || 0) === 0).length;

    const recentRatio = recentInspections.length > 0 ? recentClean / recentInspections.length : 0;
    const olderRatio = olderInspections.length > 0 ? olderClean / olderInspections.length : 0;

    let trend = 'stable';
    if (recentRatio > olderRatio + 0.05) trend = 'improving';
    else if (recentRatio < olderRatio - 0.05) trend = 'declining';

    return {
      total,
      clean,
      withViolations,
      ratio: total > 0 ? Math.round((clean / total) * 100) / 100 : 0,
      trend
    };
  },

  /**
   * Compare KnownInspection entries (inMcmis=false) against FMCSAInspection collection.
   * Returns known inspections not found in MCMIS.
   */
  async getMissingInspections(companyId) {
    // Get all known inspections that are NOT confirmed in MCMIS
    const knownInspections = await KnownInspection.find({
      companyId,
      inMcmis: false
    })
      .populate('driverId', 'firstName lastName cdlNumber')
      .populate('vehicleId', 'unitNumber vin')
      .sort({ inspectionDate: -1 })
      .lean();

    if (knownInspections.length === 0) return [];

    // Get all FMCSA inspection report numbers for cross-reference
    const fmcsaReportNumbers = await FMCSAInspection.find({ companyId })
      .select('reportNumber inspectionDate')
      .lean();

    const reportNumberSet = new Set(fmcsaReportNumbers.map(r => r.reportNumber));

    // Filter: return known inspections whose mcmisReportNumber is not in FMCSA records
    // or that have no mcmisReportNumber at all
    return knownInspections.filter(ki => {
      if (!ki.mcmisReportNumber) return true;
      return !reportNumberSet.has(ki.mcmisReportNumber);
    });
  },

  /**
   * Calculate how many additional clean inspections are needed to reach a target percentile.
   * Uses a simplified dilution model: more clean inspections reduce the violation-to-inspection ratio.
   */
  async calculateTarget(companyId, basic, targetPercentile) {
    if (!BASIC_INFO[basic]) {
      return { error: `Invalid BASIC category: ${basic}` };
    }

    const currentScores = await csaCalculatorService.calculateAllBasics(companyId);
    const currentBasic = currentScores[basic];

    if (!currentBasic) {
      return { error: `No data for BASIC: ${basic}` };
    }

    const currentPercentile = currentBasic.estimatedPercentile;
    const target = parseInt(targetPercentile) || BASIC_INFO[basic].threshold - 1;

    if (currentPercentile <= target) {
      return {
        currentPercentile,
        targetPercentile: target,
        additionalCleanNeeded: 0,
        explanation: `Already below target. Current percentile (${currentPercentile}%) is at or below the target (${target}%).`
      };
    }

    // Rough estimation: each clean inspection dilutes the severity-to-inspection ratio.
    // FMCSA calculates BASIC scores using (total severity points / number of inspections).
    // More inspections with 0 violations = lower ratio = lower percentile.
    const rawPoints = currentBasic.rawPoints;
    const currentViolationCount = currentBasic.violationCount;

    // Get total inspection count for this company
    const twentyFourMonthsAgo = new Date();
    twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

    const totalInspections = await FMCSAInspection.countDocuments({
      companyId,
      inspectionDate: { $gte: twentyFourMonthsAgo }
    });

    // Estimate additional clean inspections needed using dilution
    // Simplified: new_percentile ~ rawPoints / (totalInspections + additionalClean) * factor
    // We iterate to find the number that drops us below the target
    let additionalClean = 0;
    let projectedPercentile = currentPercentile;
    const maxIterations = 200;

    while (projectedPercentile > target && additionalClean < maxIterations) {
      additionalClean++;
      // As inspection count grows, the per-inspection severity ratio drops
      const effectiveInspections = Math.max(totalInspections + additionalClean, 1);
      const dilutedPoints = rawPoints * (totalInspections / effectiveInspections);
      projectedPercentile = csaCalculatorService.constructor === Object
        ? require('./csaCalculatorService').estimatePercentile(dilutedPoints, basic)
        : 0;

      // Fallback: use the exported estimatePercentile function
      const { estimatePercentile } = require('./csaCalculatorService');
      projectedPercentile = estimatePercentile(dilutedPoints, basic);
    }

    let explanation;
    if (additionalClean >= maxIterations) {
      explanation = `Reaching ${target}% would require more than ${maxIterations} additional clean inspections. Consider challenging high-impact violations instead.`;
    } else {
      explanation = `Approximately ${additionalClean} additional clean inspection${additionalClean !== 1 ? 's' : ''} needed to dilute the ${BASIC_INFO[basic].name} score from ${currentPercentile}% to approximately ${target}%.`;
    }

    return {
      currentPercentile,
      targetPercentile: target,
      additionalCleanNeeded: additionalClean,
      currentRawPoints: rawPoints,
      currentViolationCount,
      totalInspections,
      explanation
    };
  },

  /**
   * Generate strategy recommendations based on current inspection data.
   */
  async getStrategyRecommendations(companyId) {
    const recommendations = [];

    // 1. Check which BASICs are worst
    const scores = await csaCalculatorService.calculateAllBasics(companyId);
    const sortedBasics = BASIC_KEYS
      .map(key => ({ key, ...scores[key] }))
      .sort((a, b) => b.estimatedPercentile - a.estimatedPercentile);

    const worstBasic = sortedBasics[0];
    if (worstBasic && worstBasic.estimatedPercentile > 0) {
      const info = BASIC_INFO[worstBasic.key];
      if (worstBasic.status === 'critical') {
        recommendations.push({
          title: `Critical: ${info.name} at ${worstBasic.estimatedPercentile}%`,
          description: `Your ${info.name} BASIC is above the ${info.criticalThreshold}% critical threshold. Prioritize challenging violations in this category and capturing clean inspections.`,
          priority: 'high'
        });
      } else if (worstBasic.status === 'alert') {
        recommendations.push({
          title: `Alert: ${info.name} at ${worstBasic.estimatedPercentile}%`,
          description: `Your ${info.name} BASIC exceeds the ${info.threshold}% alert threshold. Focus on reducing violations and documenting clean inspections in this area.`,
          priority: 'high'
        });
      }
    }

    // 2. Check clean inspection ratio
    const ratio = await this.getCleanRatio(companyId);
    if (ratio.total === 0) {
      recommendations.push({
        title: 'No inspection records found',
        description: 'Sync your FMCSA data or manually report known inspections to build your inspection history. Clean inspections help dilute violation impact.',
        priority: 'high'
      });
    } else if (ratio.ratio < 0.5) {
      recommendations.push({
        title: 'Low clean inspection ratio',
        description: `Only ${Math.round(ratio.ratio * 100)}% of your inspections are clean. Ensure drivers report ALL clean inspections, not just those with violations.`,
        priority: 'medium'
      });
    } else if (ratio.ratio >= 0.8) {
      recommendations.push({
        title: 'Strong clean inspection ratio',
        description: `${Math.round(ratio.ratio * 100)}% of your inspections are clean. Keep up the good work and make sure all clean inspections are reported to MCMIS.`,
        priority: 'low'
      });
    }

    // 3. Check for missing inspections
    const missing = await this.getMissingInspections(companyId);
    if (missing.length > 0) {
      recommendations.push({
        title: `${missing.length} inspection${missing.length !== 1 ? 's' : ''} missing from MCMIS`,
        description: `You have ${missing.length} known clean inspection${missing.length !== 1 ? 's' : ''} that may not appear in FMCSA records. File DataQ requests to add these inspections and improve your scores.`,
        priority: 'high'
      });
    }

    // 4. Check for trend
    if (ratio.trend === 'declining') {
      recommendations.push({
        title: 'Clean inspection trend declining',
        description: 'Your clean inspection ratio has decreased over the past 12 months compared to the prior period. Review pre-trip inspection procedures and driver training.',
        priority: 'medium'
      });
    } else if (ratio.trend === 'improving') {
      recommendations.push({
        title: 'Clean inspection trend improving',
        description: 'Your clean inspection ratio has improved recently. Continue current practices and ensure all clean inspections are documented.',
        priority: 'low'
      });
    }

    // 5. OOS-specific recommendation
    const oosViolations = await Violation.find({
      companyId,
      outOfService: true,
      violationDate: { $gte: new Date(Date.now() - 24 * 30.44 * 24 * 60 * 60 * 1000) },
      isDeleted: { $ne: true }
    }).countDocuments();

    if (oosViolations > 0) {
      recommendations.push({
        title: `${oosViolations} Out-of-Service violation${oosViolations !== 1 ? 's' : ''} in last 24 months`,
        description: 'OOS violations carry a 2x severity multiplier. Prioritize challenging these violations and implementing pre-trip inspection checklists to prevent future OOS events.',
        priority: oosViolations >= 3 ? 'high' : 'medium'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }
};

module.exports = cleanInspectionService;
