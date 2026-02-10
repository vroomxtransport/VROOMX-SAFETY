/**
 * DataQ Outcome Service
 *
 * Analytics and outcome tracking for DataQ challenges:
 * - Per-carrier analytics with severity points removed and savings estimates
 * - Month-over-month trend analysis
 * - Monthly report generation per company
 * - Triage prediction accuracy measurement
 * - System-wide aggregate analytics across all companies
 */

const { Violation } = require('../models');
const DataQAnalytics = require('../models/DataQAnalytics');
const DataQMonthlyReport = require('../models/DataQMonthlyReport');

const INSURANCE_SAVINGS_PER_POINT = 800; // Estimated $/year per severity weight point removed

const dataqOutcomeService = {
  /**
   * Aggregate carrier-level analytics from Violation collection.
   * Returns total filed, won, lost, pending, severity points removed, estimated savings.
   */
  async getCarrierAnalytics(companyId) {
    const challenges = await Violation.find({
      companyId,
      'dataQChallenge.submitted': true
    }).lean();

    let totalFiled = challenges.length;
    let won = 0;
    let lost = 0;
    let pending = 0;
    let withdrawn = 0;
    let severityPointsRemoved = 0;

    for (const v of challenges) {
      const status = v.dataQChallenge?.status;

      switch (status) {
        case 'accepted':
          won++;
          severityPointsRemoved += v.severityWeight || 0;
          break;
        case 'denied':
          lost++;
          break;
        case 'pending':
        case 'under_review':
          pending++;
          break;
        case 'withdrawn':
          withdrawn++;
          break;
      }
    }

    const resolved = won + lost;
    const successRate = resolved > 0 ? Math.round((won / resolved) * 100) : 0;
    const estimatedSavings = severityPointsRemoved * INSURANCE_SAVINGS_PER_POINT;

    return {
      totalFiled,
      won,
      lost,
      pending,
      withdrawn,
      successRate,
      severityPointsRemoved,
      estimatedSavings,
      calculatedAt: new Date()
    };
  },

  /**
   * Get month-over-month challenge outcomes for last N months.
   * Returns array of { month, year, filed, won, lost, successRate }.
   */
  async getOutcomeTrends(companyId, months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const challenges = await Violation.find({
      companyId,
      'dataQChallenge.submitted': true,
      'dataQChallenge.submissionDate': { $gte: startDate }
    }).lean();

    // Build month buckets
    const buckets = {};
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      buckets[key] = {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        filed: 0,
        won: 0,
        lost: 0,
        successRate: 0
      };
    }

    // Fill buckets
    for (const v of challenges) {
      const subDate = new Date(v.dataQChallenge.submissionDate);
      const key = `${subDate.getFullYear()}-${subDate.getMonth() + 1}`;

      if (buckets[key]) {
        buckets[key].filed++;

        const status = v.dataQChallenge.status;
        if (status === 'accepted') buckets[key].won++;
        if (status === 'denied') buckets[key].lost++;
      }
    }

    // Calculate success rates and sort chronologically
    const trends = Object.values(buckets).map(b => {
      const resolved = b.won + b.lost;
      b.successRate = resolved > 0 ? Math.round((b.won / resolved) * 100) : 0;
      return b;
    });

    trends.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    return trends;
  },

  /**
   * Create or update DataQMonthlyReport for a given company/period.
   * Aggregates from Violation data for the specified month.
   */
  async generateMonthlyReport(companyId, month, year) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all challenges filed in this month
    const filedInMonth = await Violation.find({
      companyId,
      'dataQChallenge.submitted': true,
      'dataQChallenge.submissionDate': { $gte: periodStart, $lte: periodEnd }
    }).lean();

    // Get all challenges resolved in this month
    const resolvedInMonth = await Violation.find({
      companyId,
      'dataQChallenge.submitted': true,
      'dataQChallenge.responseDate': { $gte: periodStart, $lte: periodEnd }
    }).lean();

    let challengesFiled = filedInMonth.length;
    let challengesWon = 0;
    let challengesLost = 0;
    let challengesPending = 0;
    let severityPointsRemoved = 0;

    // Count outcomes from resolved challenges
    for (const v of resolvedInMonth) {
      const status = v.dataQChallenge?.status;
      if (status === 'accepted') {
        challengesWon++;
        severityPointsRemoved += v.severityWeight || 0;
      } else if (status === 'denied') {
        challengesLost++;
      }
    }

    // Count pending from filed challenges
    for (const v of filedInMonth) {
      const status = v.dataQChallenge?.status;
      if (['pending', 'under_review'].includes(status)) {
        challengesPending++;
      }
    }

    const estimatedPercentileImprovement = severityPointsRemoved > 0
      ? Math.min(severityPointsRemoved * 0.5, 15) // rough estimate: 0.5 percentile per point, max 15
      : 0;

    const estimatedInsuranceSavings = severityPointsRemoved * INSURANCE_SAVINGS_PER_POINT;

    const report = await DataQMonthlyReport.findOneAndUpdate(
      { companyId, month, year },
      {
        companyId,
        month,
        year,
        challengesFiled,
        challengesWon,
        challengesLost,
        challengesPending,
        severityPointsRemoved,
        estimatedPercentileImprovement: Math.round(estimatedPercentileImprovement * 10) / 10,
        estimatedInsuranceSavings,
        generatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return report;
  },

  /**
   * Compare triage predictions vs actual outcomes.
   * For each resolved challenge, compare scanResults.priorityScore vs outcome.
   */
  async getTriageAccuracy(companyId) {
    const resolved = await Violation.find({
      companyId,
      'dataQChallenge.submitted': true,
      'dataQChallenge.status': { $in: ['accepted', 'denied'] },
      'scanResults.priorityScore': { $exists: true }
    }).lean();

    const totalResolved = resolved.length;
    let correctPredictions = 0;
    let overPredicted = 0;
    let underPredicted = 0;

    for (const v of resolved) {
      const score = v.scanResults?.priorityScore || 0;
      const wasAccepted = v.dataQChallenge.status === 'accepted';

      // High score (>= 60) predicted success, low score (< 40) predicted failure
      // Middle range (40-59) is neutral
      if (score >= 60 && wasAccepted) {
        correctPredictions++;
      } else if (score < 40 && !wasAccepted) {
        correctPredictions++;
      } else if (score >= 40 && score < 60) {
        // Neutral range - count as correct either way (no strong prediction)
        correctPredictions++;
      } else if (score >= 60 && !wasAccepted) {
        overPredicted++;
      } else if (score < 40 && wasAccepted) {
        underPredicted++;
      }
    }

    const accuracy = totalResolved > 0
      ? Math.round((correctPredictions / totalResolved) * 100)
      : 0;

    return {
      totalResolved,
      correctPredictions,
      accuracy,
      overPredicted,
      underPredicted
    };
  },

  /**
   * Aggregate across ALL companies for system-wide analytics.
   * Groups by violation type, state, and RDR type.
   * Creates or updates DataQAnalytics document.
   */
  async getSystemAnalytics(period, periodStart, periodEnd) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Check for existing analytics doc
    const existing = await DataQAnalytics.findOne({
      period,
      periodStart: start
    });

    // If recent (generated within last hour), return cached
    if (existing && existing.updatedAt > new Date(Date.now() - 60 * 60 * 1000)) {
      return existing;
    }

    // Aggregate all challenges in period
    const challenges = await Violation.find({
      'dataQChallenge.submitted': true,
      'dataQChallenge.submissionDate': { $gte: start, $lte: end }
    }).lean();

    let totalFiled = challenges.length;
    let totalWon = 0;
    let totalLost = 0;
    let totalPending = 0;

    const violationTypeMap = {};
    const stateMap = {};
    const rdrTypeMap = {};

    for (const v of challenges) {
      const status = v.dataQChallenge?.status;
      const vType = v.violationType || 'unknown';
      const state = v.location?.state || 'unknown';
      const rdrType = v.dataQChallenge?.rdrType || 'unknown';

      // Totals
      if (status === 'accepted') totalWon++;
      else if (status === 'denied') totalLost++;
      else if (['pending', 'under_review'].includes(status)) totalPending++;

      // By violation type
      if (!violationTypeMap[vType]) {
        violationTypeMap[vType] = { violationType: vType, filed: 0, won: 0 };
      }
      violationTypeMap[vType].filed++;
      if (status === 'accepted') violationTypeMap[vType].won++;

      // By state
      if (!stateMap[state]) {
        stateMap[state] = { stateCode: state, filed: 0, won: 0, totalResponseDays: 0, responsesCount: 0 };
      }
      stateMap[state].filed++;
      if (status === 'accepted') stateMap[state].won++;

      // Calculate response time if available
      if (v.dataQChallenge?.responseDate && v.dataQChallenge?.submissionDate) {
        const respTime = new Date(v.dataQChallenge.responseDate) - new Date(v.dataQChallenge.submissionDate);
        const respDays = Math.ceil(respTime / (1000 * 60 * 60 * 24));
        if (respDays > 0) {
          stateMap[state].totalResponseDays += respDays;
          stateMap[state].responsesCount++;
        }
      }

      // By RDR type
      if (!rdrTypeMap[rdrType]) {
        rdrTypeMap[rdrType] = { rdrType, filed: 0, won: 0 };
      }
      rdrTypeMap[rdrType].filed++;
      if (status === 'accepted') rdrTypeMap[rdrType].won++;
    }

    // Calculate success rates
    const overallSuccessRate = (totalWon + totalLost) > 0
      ? Math.round((totalWon / (totalWon + totalLost)) * 100)
      : 0;

    const byViolationType = Object.values(violationTypeMap).map(v => ({
      violationType: v.violationType,
      filed: v.filed,
      won: v.won,
      successRate: v.filed > 0 ? Math.round((v.won / v.filed) * 100) : 0
    }));

    const byState = Object.values(stateMap).map(s => ({
      stateCode: s.stateCode,
      filed: s.filed,
      won: s.won,
      successRate: s.filed > 0 ? Math.round((s.won / s.filed) * 100) : 0,
      avgResponseDays: s.responsesCount > 0
        ? Math.round(s.totalResponseDays / s.responsesCount)
        : 0
    }));

    const byRdrType = Object.values(rdrTypeMap).map(r => ({
      rdrType: r.rdrType,
      filed: r.filed,
      won: r.won,
      successRate: r.filed > 0 ? Math.round((r.won / r.filed) * 100) : 0
    }));

    const analyticsDoc = await DataQAnalytics.findOneAndUpdate(
      { period, periodStart: start },
      {
        period,
        periodStart: start,
        periodEnd: end,
        totalFiled,
        totalWon,
        totalLost,
        totalPending,
        overallSuccessRate,
        byViolationType,
        byState,
        byRdrType
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return analyticsDoc;
  }
};

module.exports = dataqOutcomeService;
