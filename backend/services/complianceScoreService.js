const ComplianceScore = require('../models/ComplianceScore');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const Violation = require('../models/Violation');
const DrugAlcoholTest = require('../models/DrugAlcoholTest');
const Company = require('../models/Company');

/**
 * Compliance Score Service - Calculates and manages the VroomX Compliance Score
 *
 * Score Components:
 * - Document Status (25%): Valid, expired, missing documents
 * - Violations (30%): Time-weighted severity of violations
 * - Drug/Alcohol (15%): Test completion rates
 * - DQF Completeness (20%): Driver qualification file completeness
 * - Vehicle Inspection (10%): Current inspection status
 */

// Component weights (must sum to 100)
const COMPONENT_WEIGHTS = {
  documentStatus: 25,
  violations: 30,
  drugAlcohol: 15,
  dqfCompleteness: 20,
  vehicleInspection: 10
};

// Time weight factors for violations (years ago)
const TIME_WEIGHTS = {
  0: 3, // Current year
  1: 2, // 1 year ago
  2: 1  // 2 years ago
};

const complianceScoreService = {
  /**
   * Calculate compliance score for a company
   */
  async calculateScore(companyId) {
    const [
      documentScore,
      violationScore,
      drugAlcoholScore,
      dqfScore,
      vehicleScore
    ] = await Promise.all([
      this._calculateDocumentScore(companyId),
      this._calculateViolationScore(companyId),
      this._calculateDrugAlcoholScore(companyId),
      this._calculateDQFScore(companyId),
      this._calculateVehicleScore(companyId)
    ]);

    // Calculate weighted overall score
    const overallScore = Math.round(
      (documentScore.score * COMPONENT_WEIGHTS.documentStatus +
       violationScore.score * COMPONENT_WEIGHTS.violations +
       drugAlcoholScore.score * COMPONENT_WEIGHTS.drugAlcohol +
       dqfScore.score * COMPONENT_WEIGHTS.dqfCompleteness +
       vehicleScore.score * COMPONENT_WEIGHTS.vehicleInspection) / 100
    );

    // Get previous score for trend
    const previousRecord = await ComplianceScore.getLatest(companyId);
    const previousScore = previousRecord?.overallScore || null;
    const change = previousScore !== null ? overallScore - previousScore : 0;
    let trend = 'stable';
    if (change > 2) trend = 'improving';
    else if (change < -2) trend = 'declining';

    // Create score record
    const scoreRecord = await ComplianceScore.create({
      companyId,
      date: new Date(),
      overallScore,
      components: {
        documentStatus: {
          score: documentScore.score,
          weight: COMPONENT_WEIGHTS.documentStatus,
          breakdown: documentScore.breakdown
        },
        violations: {
          score: violationScore.score,
          weight: COMPONENT_WEIGHTS.violations,
          breakdown: violationScore.breakdown
        },
        drugAlcohol: {
          score: drugAlcoholScore.score,
          weight: COMPONENT_WEIGHTS.drugAlcohol,
          breakdown: drugAlcoholScore.breakdown
        },
        dqfCompleteness: {
          score: dqfScore.score,
          weight: COMPONENT_WEIGHTS.dqfCompleteness,
          breakdown: dqfScore.breakdown
        },
        vehicleInspection: {
          score: vehicleScore.score,
          weight: COMPONENT_WEIGHTS.vehicleInspection,
          breakdown: vehicleScore.breakdown
        }
      },
      previousScore,
      change,
      trend,
      metrics: {
        ...documentScore.metrics,
        ...violationScore.metrics,
        ...drugAlcoholScore.metrics,
        ...dqfScore.metrics,
        ...vehicleScore.metrics
      }
    });

    // Update company with current score
    await Company.findByIdAndUpdate(companyId, {
      'complianceScore.current': overallScore,
      'complianceScore.lastCalculated': new Date()
    });

    return scoreRecord;
  },

  /**
   * Get current score with breakdown
   */
  async getScore(companyId) {
    // Try to get today's score
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let score = await ComplianceScore.findOne({
      companyId,
      date: { $gte: today }
    }).lean();

    // If no score today, calculate fresh
    if (!score) {
      score = await this.calculateScore(companyId);
    }

    return score;
  },

  /**
   * Get score history
   */
  async getHistory(companyId, days = 30) {
    return ComplianceScore.getHistory(companyId, days);
  },

  /**
   * Get detailed breakdown
   */
  async getBreakdown(companyId) {
    const score = await this.getScore(companyId);

    // Add recommendations based on lowest component
    const components = Object.entries(score.components)
      .map(([key, value]) => ({
        name: this._formatComponentName(key),
        key,
        ...value
      }))
      .sort((a, b) => a.score - b.score);

    const recommendations = [];

    for (const component of components) {
      if (component.score < 70) {
        recommendations.push(this._getRecommendation(component.key, component.breakdown));
      }
    }

    return {
      ...score,
      componentsList: components,
      recommendations
    };
  },

  // Private calculation methods

  /**
   * Calculate document status score
   * Formula: 100 - (expired% * 50) - (missing% * 30) - (dueSoon% * 20)
   */
  async _calculateDocumentScore(companyId) {
    const stats = await Document.aggregate([
      {
        $match: {
          companyId: companyId,
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      valid: 0,
      expired: 0,
      due_soon: 0,
      missing: 0,
      pending_review: 0
    };

    let total = 0;
    for (const stat of stats) {
      statusCounts[stat._id] = stat.count;
      total += stat.count;
    }

    if (total === 0) {
      return {
        score: 100,
        breakdown: { message: 'No documents tracked' },
        metrics: { totalDocuments: 0, validDocuments: 0, expiredDocuments: 0, dueSoonDocuments: 0, missingDocuments: 0 }
      };
    }

    const expiredPct = (statusCounts.expired / total) * 100;
    const missingPct = (statusCounts.missing / total) * 100;
    const dueSoonPct = (statusCounts.due_soon / total) * 100;

    const score = Math.max(0, Math.round(
      100 - (expiredPct * 0.5) - (missingPct * 0.3) - (dueSoonPct * 0.2)
    ));

    return {
      score,
      breakdown: {
        total,
        valid: statusCounts.valid,
        expired: statusCounts.expired,
        dueSoon: statusCounts.due_soon,
        missing: statusCounts.missing
      },
      metrics: {
        totalDocuments: total,
        validDocuments: statusCounts.valid,
        expiredDocuments: statusCounts.expired,
        dueSoonDocuments: statusCounts.due_soon,
        missingDocuments: statusCounts.missing
      }
    };
  },

  /**
   * Calculate violation score
   * Higher severity and more recent = lower score
   */
  async _calculateViolationScore(companyId) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const violations = await Violation.find({
      companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true }
    });

    const now = new Date();
    let timeWeightedSeverity = 0;
    let openCount = 0;

    for (const v of violations) {
      const yearsAgo = Math.floor((now - new Date(v.violationDate)) / (365.25 * 24 * 60 * 60 * 1000));
      const timeWeight = TIME_WEIGHTS[yearsAgo] || 0;
      timeWeightedSeverity += (v.severityWeight || 1) * timeWeight;

      if (v.status === 'open') openCount++;
    }

    // Score formula: Start at 100, subtract based on weighted severity
    // Max penalty of 100 points (score of 0) at 200+ weighted severity points
    const score = Math.max(0, Math.round(100 - (timeWeightedSeverity / 2)));

    return {
      score,
      breakdown: {
        totalViolations: violations.length,
        openViolations: openCount,
        timeWeightedSeverity: Math.round(timeWeightedSeverity)
      },
      metrics: {
        totalViolations: violations.length,
        openViolations: openCount,
        timeWeightedSeverity: Math.round(timeWeightedSeverity)
      }
    };
  },

  /**
   * Calculate drug/alcohol compliance score
   */
  async _calculateDrugAlcoholScore(companyId) {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Get active driver count for required test calculation
    const activeDrivers = await Driver.countDocuments({
      companyId,
      status: 'active',
      isDeleted: { $ne: true }
    });

    if (activeDrivers === 0) {
      return {
        score: 100,
        breakdown: { message: 'No active drivers' },
        metrics: { requiredTests: 0, completedTests: 0 }
      };
    }

    // Required rates: 50% drug, 10% alcohol
    const requiredDrugTests = Math.ceil(activeDrivers * 0.5);
    const requiredAlcoholTests = Math.ceil(activeDrivers * 0.1);

    // Get completed random tests this year
    const completedTests = await DrugAlcoholTest.aggregate([
      {
        $match: {
          companyId: companyId,
          testType: 'random',
          testDate: { $gte: yearStart },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          drugTests: {
            $sum: { $cond: [{ $ne: ['$drugTest', null] }, 1, 0] }
          },
          alcoholTests: {
            $sum: { $cond: [{ $ne: ['$alcoholTest', null] }, 1, 0] }
          }
        }
      }
    ]);

    const completed = completedTests[0] || { drugTests: 0, alcoholTests: 0 };

    const drugRate = requiredDrugTests > 0 ? (completed.drugTests / requiredDrugTests) : 1;
    const alcoholRate = requiredAlcoholTests > 0 ? (completed.alcoholTests / requiredAlcoholTests) : 1;

    // Score is average of both rates, capped at 100%
    const score = Math.round(Math.min(100, ((drugRate + alcoholRate) / 2) * 100));

    return {
      score,
      breakdown: {
        activeDrivers,
        requiredDrugTests,
        completedDrugTests: completed.drugTests,
        drugRate: Math.round(drugRate * 100),
        requiredAlcoholTests,
        completedAlcoholTests: completed.alcoholTests,
        alcoholRate: Math.round(alcoholRate * 100)
      },
      metrics: {
        requiredTests: requiredDrugTests + requiredAlcoholTests,
        completedTests: completed.drugTests + completed.alcoholTests,
        randomDrugTestRate: Math.round(drugRate * 100),
        randomAlcoholTestRate: Math.round(alcoholRate * 100)
      }
    };
  },

  /**
   * Calculate DQF completeness score
   */
  async _calculateDQFScore(companyId) {
    const drivers = await Driver.find({
      companyId,
      status: 'active',
      isDeleted: { $ne: true }
    });

    if (drivers.length === 0) {
      return {
        score: 100,
        breakdown: { message: 'No active drivers' },
        metrics: { totalDrivers: 0, compliantDrivers: 0, averageDqfCompleteness: 100 }
      };
    }

    let totalCompleteness = 0;
    let compliantCount = 0;

    for (const driver of drivers) {
      const completeness = this._calculateDriverDQFCompleteness(driver);
      totalCompleteness += completeness;

      if (completeness >= 90) compliantCount++;
    }

    const avgCompleteness = Math.round(totalCompleteness / drivers.length);

    return {
      score: avgCompleteness,
      breakdown: {
        totalDrivers: drivers.length,
        compliantDrivers: compliantCount,
        nonCompliantDrivers: drivers.length - compliantCount
      },
      metrics: {
        totalDrivers: drivers.length,
        compliantDrivers: compliantCount,
        averageDqfCompleteness: avgCompleteness
      }
    };
  },

  /**
   * Calculate vehicle inspection score
   */
  async _calculateVehicleScore(companyId) {
    const vehicles = await Vehicle.find({
      companyId,
      status: 'active',
      isDeleted: { $ne: true }
    });

    if (vehicles.length === 0) {
      return {
        score: 100,
        breakdown: { message: 'No active vehicles' },
        metrics: { totalVehicles: 0, vehiclesWithCurrentInspection: 0 }
      };
    }

    const now = new Date();
    let currentCount = 0;

    for (const vehicle of vehicles) {
      if (vehicle.annualInspection?.nextDueDate) {
        const nextDue = new Date(vehicle.annualInspection.nextDueDate);
        if (nextDue > now) currentCount++;
      }
    }

    const score = Math.round((currentCount / vehicles.length) * 100);

    return {
      score,
      breakdown: {
        totalVehicles: vehicles.length,
        currentInspection: currentCount,
        overdueInspection: vehicles.length - currentCount
      },
      metrics: {
        totalVehicles: vehicles.length,
        vehiclesWithCurrentInspection: currentCount
      }
    };
  },

  /**
   * Calculate individual driver DQF completeness percentage
   */
  _calculateDriverDQFCompleteness(driver) {
    const now = new Date();
    const requirements = [
      // CDL (required, valid)
      { name: 'cdl', check: () => driver.cdl?.number && driver.cdl?.expiryDate && new Date(driver.cdl.expiryDate) > now, weight: 20 },
      // Medical Card (required, valid)
      { name: 'medicalCard', check: () => driver.medicalCard?.expiryDate && new Date(driver.medicalCard.expiryDate) > now, weight: 20 },
      // MVR Review (annual)
      { name: 'mvr', check: () => {
        if (!driver.documents?.mvrReviews?.length) return false;
        const latest = driver.documents.mvrReviews.reduce((a, b) =>
          new Date(a.reviewDate) > new Date(b.reviewDate) ? a : b
        );
        const daysSince = (now - new Date(latest.reviewDate)) / (1000 * 60 * 60 * 24);
        return daysSince <= 365;
      }, weight: 15 },
      // Clearinghouse Query (annual)
      { name: 'clearinghouse', check: () => {
        if (!driver.clearinghouse?.lastQueryDate) return false;
        const daysSince = (now - new Date(driver.clearinghouse.lastQueryDate)) / (1000 * 60 * 60 * 24);
        return daysSince <= 365;
      }, weight: 15 },
      // Employment Application
      { name: 'employmentApp', check: () => driver.documents?.employmentApplication?.complete, weight: 10 },
      // Road Test
      { name: 'roadTest', check: () => driver.documents?.roadTest?.date || driver.documents?.roadTest?.waived, weight: 10 },
      // Previous Employment Verification
      { name: 'employmentVerification', check: () => driver.documents?.employmentVerification?.length > 0, weight: 10 }
    ];

    let score = 0;
    for (const req of requirements) {
      try {
        if (req.check()) score += req.weight;
      } catch (e) {
        // If check fails, assume not met
      }
    }

    return score;
  },

  /**
   * Format component name for display
   */
  _formatComponentName(key) {
    const names = {
      documentStatus: 'Document Status',
      violations: 'Violations',
      drugAlcohol: 'Drug & Alcohol',
      dqfCompleteness: 'DQF Completeness',
      vehicleInspection: 'Vehicle Inspection'
    };
    return names[key] || key;
  },

  /**
   * Get recommendation based on component score
   */
  _getRecommendation(component, breakdown) {
    const recommendations = {
      documentStatus: () => {
        if (breakdown.expired > 0) return `Renew ${breakdown.expired} expired document(s) to improve score`;
        if (breakdown.dueSoon > 0) return `Address ${breakdown.dueSoon} document(s) expiring soon`;
        return 'Keep documents up to date';
      },
      violations: () => {
        if (breakdown.openViolations > 0) return `Resolve ${breakdown.openViolations} open violation(s)`;
        return 'Continue safe operations to reduce violation severity over time';
      },
      drugAlcohol: () => {
        if (breakdown.drugRate < 100) return `Complete ${breakdown.requiredDrugTests - breakdown.completedDrugTests} more drug test(s)`;
        if (breakdown.alcoholRate < 100) return `Complete ${breakdown.requiredAlcoholTests - breakdown.completedAlcoholTests} more alcohol test(s)`;
        return 'Maintain random testing schedule';
      },
      dqfCompleteness: () => {
        if (breakdown.nonCompliantDrivers > 0) return `${breakdown.nonCompliantDrivers} driver(s) have incomplete DQF - update their files`;
        return 'Keep driver qualification files current';
      },
      vehicleInspection: () => {
        if (breakdown.overdueInspection > 0) return `Schedule annual inspections for ${breakdown.overdueInspection} vehicle(s)`;
        return 'Maintain annual inspection schedule';
      }
    };

    return recommendations[component]?.() || 'Review this compliance area';
  }
};

module.exports = complianceScoreService;
