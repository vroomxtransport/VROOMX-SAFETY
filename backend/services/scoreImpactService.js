const csaCalculatorService = require('./csaCalculatorService');
const { Violation } = require('../models');
const { TIME_WEIGHTS, BASIC_INFO } = require('./csaCalculatorService');

const INSURANCE_SAVINGS_PER_POINT = 800;

const scoreImpactService = {
  /**
   * Get detailed score impact for a single violation removal.
   * Wraps csaCalculatorService.projectRemovalImpact() with additional context.
   */
  async getViolationImpact(violationId, companyId) {
    const impact = await csaCalculatorService.projectRemovalImpact(companyId, violationId);
    if (!impact) return null;

    // Fetch the violation for time decay projection
    const violation = await Violation.findOne({
      _id: violationId,
      companyId,
      isDeleted: { $ne: true }
    }).lean();

    if (!violation) return null;

    const timeDecay = this.getTimeDecayProjection(violation);
    const savings = this.estimateInsuranceSavings(impact.percentileChange);

    return {
      currentPercentile: impact.currentPercentile,
      projectedPercentile: impact.projectedPercentile,
      percentileChange: impact.percentileChange,
      basicAffected: impact.basic,
      basicName: BASIC_INFO[impact.basic]?.name || impact.basic,
      severityPointsRemoved: impact.pointsRemoved,
      crossesThreshold: impact.crossesThreshold,
      thresholdCrossed: impact.thresholdCrossed,
      timeDecayProjection: timeDecay,
      estimatedAnnualSavings: savings
    };
  },

  /**
   * Get violations ranked by removal impact (highest percentile change first).
   * Uses pre-computed scanResults.roiEstimate from the Health Check scanner.
   */
  async getImpactRanking(companyId, options = {}) {
    const { limit = 20, basic, minImpact = 0 } = options;

    const query = {
      companyId,
      isDeleted: { $ne: true },
      'scanResults.roiEstimate.percentileChange': { $gt: minImpact }
    };

    if (basic) {
      query.basic = basic;
    }

    const violations = await Violation.find(query)
      .sort({ 'scanResults.roiEstimate.percentileChange': -1 })
      .limit(limit)
      .lean();

    return violations.map(v => ({
      violation: {
        _id: v._id,
        violationCode: v.violationCode,
        description: v.description,
        basic: v.basic,
        basicName: BASIC_INFO[v.basic]?.name || v.basic,
        violationDate: v.violationDate,
        severityWeight: v.severityWeight,
        outOfService: v.outOfService,
        status: v.status,
        inspectionNumber: v.inspectionNumber
      },
      impact: {
        pointsRemoved: v.scanResults?.roiEstimate?.pointsRemoved || 0,
        percentileChange: v.scanResults?.roiEstimate?.percentileChange || 0,
        estimatedAnnualSavings: v.scanResults?.roiEstimate?.estimatedAnnualSavings || 0,
        crossesThreshold: v.scanResults?.roiEstimate?.crossesThreshold || false,
        thresholdCrossed: v.scanResults?.roiEstimate?.thresholdCrossed || null,
        currentPercentile: v.scanResults?.removalImpact?.currentPercentile || null,
        projectedPercentile: v.scanResults?.removalImpact?.projectedPercentile || null
      }
    }));
  },

  /**
   * Project when the violation's time weight naturally decreases.
   * Returns weight projections at 6, 12, 18, and 24 month marks.
   */
  getTimeDecayProjection(violation) {
    if (!violation || !violation.violationDate) {
      return { currentWeight: 0, projections: [] };
    }

    const now = new Date();
    const violationDate = new Date(violation.violationDate);
    const ageInMonths = (now - violationDate) / (1000 * 60 * 60 * 24 * 30.44);

    // Current time weight based on years ago
    const currentYearsAgo = Math.floor(ageInMonths / 12);
    const currentWeight = TIME_WEIGHTS[currentYearsAgo] || 0;

    const projections = [6, 12, 18, 24].map(monthsFromNow => {
      const futureAgeMonths = ageInMonths + monthsFromNow;
      const futureYearsAgo = Math.floor(futureAgeMonths / 12);

      // If the violation falls out of the 24-month window, weight = 0
      let weight = 0;
      if (futureYearsAgo <= 2) {
        weight = TIME_WEIGHTS[futureYearsAgo] || 0;
      }

      const severity = violation.severityWeight || 5;
      const oosMultiplier = violation.outOfService ? 2 : 1;
      const currentPoints = severity * currentWeight * oosMultiplier;
      const futurePoints = severity * weight * oosMultiplier;
      const percentileEffect = currentPoints - futurePoints;

      return {
        monthsFromNow,
        weight,
        pointsAtTime: futurePoints,
        percentileEffect
      };
    });

    return {
      currentWeight,
      currentPoints: (violation.severityWeight || 5) * currentWeight * (violation.outOfService ? 2 : 1),
      ageInMonths: Math.round(ageInMonths),
      projections
    };
  },

  /**
   * Estimate insurance premium savings from a percentile change.
   * Industry rule of thumb: ~$800 per percentile point reduction.
   */
  estimateInsuranceSavings(percentileChange) {
    if (!percentileChange || percentileChange <= 0) {
      return { low: 0, mid: 0, high: 0 };
    }

    return {
      low: Math.round(percentileChange * 600),
      mid: Math.round(percentileChange * INSURANCE_SAVINGS_PER_POINT),
      high: Math.round(percentileChange * 1000)
    };
  }
};

module.exports = scoreImpactService;
