const Violation = require('../models/Violation');
const Company = require('../models/Company');
const { SMS_BASICS_THRESHOLDS } = require('../config/fmcsaCompliance');
const { lookupViolationCode } = require('../config/violationCodes');

/**
 * CSA Calculator Service
 * Estimates SMS BASIC scores based on violations
 *
 * Note: This is an ESTIMATE. Real SMS scores use peer group comparisons
 * which require national data not available to individual carriers.
 */

// Time weight factors for violations
const TIME_WEIGHTS = {
  0: 3, // Current year
  1: 2, // 1 year ago
  2: 1  // 2 years ago
};

// BASIC category keys
const BASIC_KEYS = [
  'unsafe_driving',
  'hours_of_service',
  'vehicle_maintenance',
  'controlled_substances',
  'driver_fitness',
  'crash_indicator'
];

// Map internal keys to display names and thresholds
const BASIC_INFO = {
  unsafe_driving: {
    name: 'Unsafe Driving',
    threshold: 65,
    criticalThreshold: 80,
    regulations: ['49 CFR 392']
  },
  hours_of_service: {
    name: 'Hours of Service',
    threshold: 65,
    criticalThreshold: 80,
    regulations: ['49 CFR 395']
  },
  vehicle_maintenance: {
    name: 'Vehicle Maintenance',
    threshold: 80,
    criticalThreshold: 90,
    regulations: ['49 CFR 393', '49 CFR 396']
  },
  controlled_substances: {
    name: 'Controlled Substances/Alcohol',
    threshold: 80,
    criticalThreshold: 90,
    regulations: ['49 CFR 382', '49 CFR 392.4', '49 CFR 392.5']
  },
  driver_fitness: {
    name: 'Driver Fitness',
    threshold: 80,
    criticalThreshold: 90,
    regulations: ['49 CFR 391']
  },
  crash_indicator: {
    name: 'Crash Indicator',
    threshold: 65,
    criticalThreshold: 80,
    regulations: []
  }
};

/**
 * Estimate percentile from raw points
 * This is a rough estimation without peer group data
 * Based on typical distribution patterns
 */
function estimatePercentile(rawPoints, basicType) {
  // Different BASICs have different typical score distributions
  // These multipliers are calibrated estimates
  const multipliers = {
    unsafe_driving: 2.5,
    hours_of_service: 2.0,
    vehicle_maintenance: 1.5,
    controlled_substances: 3.0,
    driver_fitness: 2.0,
    crash_indicator: 4.0
  };

  const multiplier = multipliers[basicType] || 2.0;

  // Convert points to estimated percentile (0-100)
  // Higher points = higher percentile (worse)
  const percentile = Math.min(100, Math.round(rawPoints * multiplier));

  return percentile;
}

const csaCalculatorService = {
  /**
   * Calculate all BASIC scores for a company
   */
  async calculateAllBasics(companyId, additionalViolations = []) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Get all violations from the past 24 months
    const violations = await Violation.find({
      companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true }
    });

    // Combine with any additional/hypothetical violations
    const allViolations = [...violations, ...additionalViolations];

    const results = {};

    for (const basic of BASIC_KEYS) {
      results[basic] = this._calculateBasicScore(allViolations, basic);
    }

    return results;
  },

  /**
   * Calculate a single BASIC score
   */
  _calculateBasicScore(violations, basicType) {
    const now = new Date();
    let totalWeightedPoints = 0;
    let violationCount = 0;
    let oosCount = 0;
    const violationDetails = [];

    for (const v of violations) {
      // Check if this violation belongs to this BASIC
      const basic = v.basic || 'vehicle_maintenance';
      if (basic !== basicType) continue;

      const violationDate = new Date(v.violationDate);
      const yearsAgo = Math.floor((now - violationDate) / (365.25 * 24 * 60 * 60 * 1000));

      // Only include violations from past 24 months
      if (yearsAgo > 2) continue;

      const timeWeight = TIME_WEIGHTS[yearsAgo] || 0;
      const severity = v.severityWeight || 5;
      const weightedPoints = severity * timeWeight;

      totalWeightedPoints += weightedPoints;
      violationCount++;

      if (v.outOfService) oosCount++;

      violationDetails.push({
        id: v._id,
        code: v.violationCode,
        date: v.violationDate,
        severity,
        timeWeight,
        weightedPoints,
        isOOS: v.outOfService
      });
    }

    const estimatedPercentile = estimatePercentile(totalWeightedPoints, basicType);
    const info = BASIC_INFO[basicType];

    let status = 'ok';
    if (estimatedPercentile >= info.criticalThreshold) {
      status = 'critical';
    } else if (estimatedPercentile >= info.threshold) {
      status = 'alert';
    }

    return {
      name: info.name,
      rawPoints: totalWeightedPoints,
      estimatedPercentile,
      threshold: info.threshold,
      criticalThreshold: info.criticalThreshold,
      status,
      violationCount,
      oosCount,
      violations: violationDetails.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
    };
  },

  /**
   * Project the impact of a new violation
   */
  async projectImpact(companyId, newViolation) {
    // Calculate current scores
    const currentScores = await this.calculateAllBasics(companyId);

    // Create hypothetical violation
    const hypotheticalViolation = {
      basic: newViolation.basic,
      severityWeight: newViolation.severityWeight || 5,
      violationDate: newViolation.violationDate || new Date(),
      outOfService: newViolation.outOfService || false,
      violationCode: newViolation.violationCode
    };

    // Calculate scores with the new violation
    const projectedScores = await this.calculateAllBasics(companyId, [hypotheticalViolation]);

    // Calculate impact
    const affectedBasic = newViolation.basic;
    const before = currentScores[affectedBasic];
    const after = projectedScores[affectedBasic];

    const impact = {
      basic: affectedBasic,
      basicName: BASIC_INFO[affectedBasic].name,
      before: {
        rawPoints: before.rawPoints,
        estimatedPercentile: before.estimatedPercentile,
        status: before.status
      },
      after: {
        rawPoints: after.rawPoints,
        estimatedPercentile: after.estimatedPercentile,
        status: after.status
      },
      change: {
        rawPoints: after.rawPoints - before.rawPoints,
        percentileChange: after.estimatedPercentile - before.estimatedPercentile
      },
      pointsAdded: hypotheticalViolation.severityWeight * TIME_WEIGHTS[0], // Current year weight
      exceedsAlertThreshold: after.estimatedPercentile >= BASIC_INFO[affectedBasic].threshold,
      exceedsCriticalThreshold: after.estimatedPercentile >= BASIC_INFO[affectedBasic].criticalThreshold,
      previouslyUnderThreshold: before.estimatedPercentile < BASIC_INFO[affectedBasic].threshold,
      violation: {
        code: newViolation.violationCode,
        severity: newViolation.severityWeight,
        isOOS: newViolation.outOfService
      }
    };

    // Generate message
    let message = `${impact.basicName} Score: `;
    if (impact.change.percentileChange > 0) {
      message += `+${impact.change.percentileChange}% → Now at ${impact.after.estimatedPercentile}%`;
    } else {
      message += `${impact.after.estimatedPercentile}% (no change)`;
    }

    if (impact.exceedsCriticalThreshold && !before.status === 'critical') {
      message += ` (EXCEEDS ${BASIC_INFO[affectedBasic].criticalThreshold}% CRITICAL THRESHOLD!)`;
    } else if (impact.exceedsAlertThreshold && impact.previouslyUnderThreshold) {
      message += ` (exceeds ${BASIC_INFO[affectedBasic].threshold}% alert threshold)`;
    }

    impact.message = message;

    return {
      impact,
      currentScores,
      projectedScores
    };
  },

  /**
   * Project how scores will change over time as violations age
   */
  async projectTimeDecay(companyId, monthsAhead = 24) {
    const projections = [];

    // Get current violations
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const violations = await Violation.find({
      companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true }
    });

    // Calculate scores for each future month
    for (let month = 0; month <= monthsAhead; month++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + month);

      const scores = {};

      for (const basic of BASIC_KEYS) {
        scores[basic] = this._calculateBasicScoreAsOfDate(violations, basic, futureDate);
      }

      projections.push({
        month,
        date: futureDate.toISOString().split('T')[0],
        scores
      });
    }

    return projections;
  },

  /**
   * Calculate BASIC score as of a specific date (for projections)
   */
  _calculateBasicScoreAsOfDate(violations, basicType, asOfDate) {
    let totalWeightedPoints = 0;
    let violationCount = 0;

    for (const v of violations) {
      const basic = v.basic || 'vehicle_maintenance';
      if (basic !== basicType) continue;

      const violationDate = new Date(v.violationDate);

      // Calculate years ago from the projection date
      const yearsAgo = Math.floor((asOfDate - violationDate) / (365.25 * 24 * 60 * 60 * 1000));

      // Only include violations within 24 months of the projection date
      if (yearsAgo > 2 || yearsAgo < 0) continue;

      const timeWeight = TIME_WEIGHTS[yearsAgo] || 0;
      const severity = v.severityWeight || 5;
      totalWeightedPoints += severity * timeWeight;
      violationCount++;
    }

    const estimatedPercentile = estimatePercentile(totalWeightedPoints, basicType);
    const info = BASIC_INFO[basicType];

    return {
      rawPoints: totalWeightedPoints,
      estimatedPercentile,
      violationCount,
      status: estimatedPercentile >= info.criticalThreshold ? 'critical'
        : estimatedPercentile >= info.threshold ? 'alert' : 'ok'
    };
  },

  /**
   * Get current SMS BASIC scores from Company record or calculate
   */
  async getCurrentScores(companyId) {
    const company = await Company.findById(companyId);

    // If company has recent SMS BASICs data entered, use that
    if (company?.smsBasics?.lastUpdated) {
      const daysSinceUpdate = (Date.now() - company.smsBasics.lastUpdated) / (1000 * 60 * 60 * 24);

      // If data is less than 30 days old, use stored values
      if (daysSinceUpdate < 30) {
        const result = {};
        for (const basic of BASIC_KEYS) {
          const key = basic === 'unsafe_driving' ? 'unsafeDriving'
            : basic === 'hours_of_service' ? 'hoursOfService'
              : basic === 'vehicle_maintenance' ? 'vehicleMaintenance'
                : basic === 'controlled_substances' ? 'controlledSubstances'
                  : basic === 'driver_fitness' ? 'driverFitness'
                    : 'crashIndicator';

          const percentile = company.smsBasics[key];
          const info = BASIC_INFO[basic];

          result[basic] = {
            name: info.name,
            percentile: percentile,
            isEstimate: false,
            threshold: info.threshold,
            criticalThreshold: info.criticalThreshold,
            status: percentile >= info.criticalThreshold ? 'critical'
              : percentile >= info.threshold ? 'alert' : 'ok'
          };
        }
        return { scores: result, source: 'stored', lastUpdated: company.smsBasics.lastUpdated };
      }
    }

    // Otherwise, calculate estimates
    const calculated = await this.calculateAllBasics(companyId);

    const result = {};
    for (const basic of BASIC_KEYS) {
      result[basic] = {
        ...calculated[basic],
        isEstimate: true
      };
    }

    return { scores: result, source: 'estimated' };
  },

  /**
   * Get summary statistics
   */
  async getScoreSummary(companyId) {
    const { scores, source, lastUpdated } = await this.getCurrentScores(companyId);

    let alertCount = 0;
    let criticalCount = 0;
    let totalPercentile = 0;
    let count = 0;

    const basicsList = [];

    for (const [key, data] of Object.entries(scores)) {
      const percentile = data.percentile || data.estimatedPercentile || 0;
      totalPercentile += percentile;
      count++;

      if (data.status === 'critical') criticalCount++;
      else if (data.status === 'alert') alertCount++;

      basicsList.push({
        key,
        ...data
      });
    }

    // Sort by percentile (worst first)
    basicsList.sort((a, b) =>
      (b.percentile || b.estimatedPercentile || 0) - (a.percentile || a.estimatedPercentile || 0)
    );

    return {
      source,
      lastUpdated,
      averagePercentile: Math.round(totalPercentile / count),
      alertCount,
      criticalCount,
      okCount: count - alertCount - criticalCount,
      worstBasic: basicsList[0],
      bestBasic: basicsList[basicsList.length - 1],
      basics: basicsList
    };
  }
};

module.exports = csaCalculatorService;
