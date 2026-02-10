/**
 * Violation Scanner Service (Health Check)
 *
 * Scans company violations for DataQ challenge opportunities using 6 checks:
 * 1. Wrong Carrier - DOT# mismatch or leased driver
 * 2. Duplicate - Same violation reported multiple times
 * 3. Court Dismissal - User-reported court outcome
 * 4. Non-Reportable Crash - Crash doesn't meet DOT recordable criteria
 * 5. CPDP Eligible - Crash Preventability Determination Program
 * 6. Time Decay - Violation aging and weight drop timing
 *
 * v2 Smart Triage Score: 8-component scoring with ROI estimation and state intelligence.
 * Classifies violations into categories: easy_win, worth_challenging, expiring_soon, unlikely
 */

const Violation = require('../models/Violation');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Accident = require('../models/Accident');
const FMCSAInspection = require('../models/FMCSAInspection');
const csaCalculatorService = require('./csaCalculatorService');
const { ERROR_PRONE_VIOLATION_CODES } = require('./dataQAnalysisService');

const SCAN_VERSION = 2;
const SCAN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const INSURANCE_SAVINGS_PER_POINT = 800; // $/year per percentile point

// CPDP-eligible accident types where CMV driver was not at fault
const CPDP_ELIGIBLE_TYPES = [
  'rear_end',   // CMV was struck from behind
  'animal',
  'pedestrian',
  'cyclist',
  'weather_related'
];

const violationScannerService = {
  /**
   * Batch scan all violations for a company.
   * Pre-fetches shared data once, processes in batches of 50.
   */
  async scanCompanyViolations(companyId, { force = false, batchSize = 50 } = {}) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Build query - skip recently scanned unless forced
    const query = {
      companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true }
    };

    if (!force) {
      query.$or = [
        { 'scanResults.lastScannedAt': { $exists: false } },
        { 'scanResults.lastScannedAt': { $lt: new Date(Date.now() - SCAN_COOLDOWN_MS) } },
        { 'scanResults.scanVersion': { $lt: SCAN_VERSION } }
      ];
    }

    const violations = await Violation.find(query).lean();

    if (violations.length === 0) {
      return { scanned: 0, flagged: 0, categories: {} };
    }

    // Pre-fetch all shared data once
    const context = await this._buildContext(companyId, twoYearsAgo);

    // Also need ALL violations (not just stale) for duplicate checks and CSA impact
    const allViolations = await Violation.find({
      companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true }
    }).lean();

    context.allViolations = allViolations;

    // Pre-fetch state modifiers for all unique states
    const stateProfileService = require('./stateProfileService');
    const uniqueStates = [...new Set(allViolations.map(v => v.location?.state).filter(Boolean))];
    const stateProfiles = {};
    for (const state of uniqueStates) {
      stateProfiles[state] = await stateProfileService.getScoreModifier(state);
    }
    context.stateProfiles = stateProfiles;

    let totalScanned = 0;
    let totalFlagged = 0;
    const categories = { easy_win: 0, worth_challenging: 0, expiring_soon: 0, unlikely: 0 };

    // Process in batches
    for (let i = 0; i < violations.length; i += batchSize) {
      const batch = violations.slice(i, i + batchSize);
      const bulkOps = [];

      for (const violation of batch) {
        const scanResult = this._scanViolation(violation, context);
        totalScanned++;

        if (scanResult.flagCount > 0) totalFlagged++;
        if (scanResult.category) categories[scanResult.category]++;

        bulkOps.push({
          updateOne: {
            filter: { _id: violation._id },
            update: { $set: { scanResults: scanResult } }
          }
        });
      }

      if (bulkOps.length > 0) {
        await Violation.bulkWrite(bulkOps);
      }
    }

    return { scanned: totalScanned, flagged: totalFlagged, categories };
  },

  /**
   * Re-scan a single violation on demand.
   */
  async scanSingleViolation(violationId) {
    const violation = await Violation.findById(violationId).lean();
    if (!violation) return null;

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const context = await this._buildContext(violation.companyId, twoYearsAgo);

    const allViolations = await Violation.find({
      companyId: violation.companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true }
    }).lean();

    context.allViolations = allViolations;

    // Pre-fetch state modifier for this violation's state
    const stateProfileService = require('./stateProfileService');
    const stateProfiles = {};
    const state = violation.location?.state;
    if (state) {
      stateProfiles[state] = await stateProfileService.getScoreModifier(state);
    }
    context.stateProfiles = stateProfiles;

    const scanResult = this._scanViolation(violation, context);

    await Violation.updateOne(
      { _id: violationId },
      { $set: { scanResults: scanResult } }
    );

    return scanResult;
  },

  /**
   * Get aggregate stats for the Health Check dashboard.
   */
  async getHealthCheckStats(companyId) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const baseFilter = {
      companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true }
    };

    const [categoryStats, totalViolations, scannedCount, topFlags, savingsAgg] = await Promise.all([
      // Category breakdown
      Violation.aggregate([
        { $match: { ...baseFilter, 'scanResults.category': { $exists: true } } },
        {
          $group: {
            _id: '$scanResults.category',
            count: { $sum: 1 },
            avgPriority: { $avg: '$scanResults.priorityScore' }
          }
        }
      ]),
      // Total active violations
      Violation.countDocuments(baseFilter),
      // How many have been scanned
      Violation.countDocuments({ ...baseFilter, 'scanResults.lastScannedAt': { $exists: true } }),
      // Top flagged violations
      Violation.find({ ...baseFilter, 'scanResults.flagCount': { $gte: 1 } })
        .sort({ 'scanResults.priorityScore': -1 })
        .limit(5)
        .select('violationCode description basic scanResults.category scanResults.priorityScore scanResults.flagCount violationDate')
        .lean(),
      // Total estimated savings from actionable violations
      Violation.aggregate([
        { $match: {
          ...baseFilter,
          'scanResults.roiEstimate.estimatedAnnualSavings': { $gt: 0 },
          'scanResults.category': { $in: ['easy_win', 'worth_challenging'] }
        }},
        { $group: {
          _id: null,
          totalSavings: { $sum: '$scanResults.roiEstimate.estimatedAnnualSavings' },
          totalPointsRemovable: { $sum: '$scanResults.roiEstimate.pointsRemoved' }
        }}
      ])
    ]);

    const categories = {};
    for (const stat of categoryStats) {
      categories[stat._id] = { count: stat.count, avgPriority: Math.round(stat.avgPriority) };
    }

    // Estimate potential CSA improvement
    const easyWins = categories.easy_win?.count || 0;
    const worthChallenging = categories.worth_challenging?.count || 0;
    const savings = savingsAgg[0] || {};

    return {
      totalViolations,
      scannedCount,
      categories,
      easyWinCount: easyWins,
      worthChallengingCount: worthChallenging,
      totalActionable: easyWins + worthChallenging,
      totalEstimatedSavings: savings.totalSavings || 0,
      totalPointsRemovable: savings.totalPointsRemovable || 0,
      topFlaggedViolations: topFlags,
      lastScanAt: scannedCount > 0 ? (await Violation.findOne(
        { ...baseFilter, 'scanResults.lastScannedAt': { $exists: true } },
        { 'scanResults.lastScannedAt': 1 }
      ).sort({ 'scanResults.lastScannedAt': -1 }).lean())?.scanResults?.lastScannedAt : null
    };
  },

  /**
   * Paginated list of flagged violations for the Health Check tab.
   */
  async getHealthCheckViolations(companyId, { category, basic, page = 1, limit = 20, sortBy = 'priorityScore' } = {}) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const query = {
      companyId,
      violationDate: { $gte: twoYearsAgo },
      isDeleted: { $ne: true },
      'scanResults.lastScannedAt': { $exists: true }
    };

    if (category) query['scanResults.category'] = category;
    if (basic) query.basic = basic;

    const sortMap = {
      priorityScore: { 'scanResults.priorityScore': -1 },
      flagCount: { 'scanResults.flagCount': -1 },
      violationDate: { violationDate: -1 },
      category: { 'scanResults.category': 1, 'scanResults.priorityScore': -1 }
    };

    const sort = sortMap[sortBy] || sortMap.priorityScore;
    const skip = (page - 1) * limit;

    const [violations, total] = await Promise.all([
      Violation.find(query)
        .populate('driverId', 'firstName lastName employeeId')
        .populate('vehicleId', 'unitNumber vin')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Violation.countDocuments(query)
    ]);

    return {
      violations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // ========================= Internal Methods =========================

  /**
   * Pre-fetch all shared context data for batch scanning.
   */
  async _buildContext(companyId, twoYearsAgo) {
    const [company, drivers, inspections, accidents] = await Promise.all([
      Company.findById(companyId).select('dotNumber name').lean(),
      Driver.find({ companyId }).select('firstName lastName cdl employmentType').lean(),
      FMCSAInspection.find({
        companyId,
        inspectionDate: { $gte: twoYearsAgo }
      }).select('reportNumber rawData companyId').lean(),
      Accident.find({
        companyId,
        accidentDate: { $gte: twoYearsAgo }
      }).lean()
    ]);

    return { company, drivers, inspections, accidents };
  },

  /**
   * Run all 6 checks on a single violation and compute category + priority.
   */
  _scanViolation(violation, context) {
    const checks = {};
    let flagCount = 0;

    // 1. Wrong Carrier
    checks.wrongCarrier = this._checkWrongCarrier(violation, context);
    if (checks.wrongCarrier.flagged) flagCount++;

    // 2. Duplicate
    checks.duplicate = this._checkDuplicate(violation, context);
    if (checks.duplicate.flagged) flagCount++;

    // 3. Court Dismissal (passive - reads existing user data)
    checks.courtDismissal = this._checkCourtDismissal(violation);
    if (checks.courtDismissal.flagged) flagCount++;

    // 4. Non-Reportable Crash
    checks.nonReportableCrash = this._checkNonReportableCrash(violation, context);
    if (checks.nonReportableCrash.flagged) flagCount++;

    // 5. CPDP Eligible
    checks.cpdpEligible = this._checkCpdpEligible(violation, context);
    if (checks.cpdpEligible.flagged) flagCount++;

    // 6. Time Decay
    checks.timeDecay = this._checkTimeDecay(violation);
    if (checks.timeDecay.flagged) flagCount++;

    // Compute CSA removal impact
    let removalImpact = null;
    if (context.allViolations) {
      removalImpact = csaCalculatorService.estimateRemovalFromViolations(violation, context.allViolations);
    }

    // Smart Triage Score (v2)
    const triageResult = this._calculateTriageScore(violation, checks, removalImpact, context);
    const roi = this._calculateROI(removalImpact);

    return {
      lastScannedAt: new Date(),
      scanVersion: SCAN_VERSION,
      category: triageResult.category,
      priorityScore: triageResult.score,
      flagCount,
      checks,
      removalImpact,
      triageBreakdown: triageResult.breakdown,
      roiEstimate: roi,
      recommendation: triageResult.recommendation
    };
  },

  /**
   * Check 1: Wrong Carrier
   * Compares carrier_id_number from inspection rawData against company DOT.
   * Also flags leased/owner-operator drivers.
   */
  _checkWrongCarrier(violation, { company, drivers, inspections }) {
    const result = { flagged: false };

    if (!company?.dotNumber) return result;

    // Find matching inspection
    const inspection = inspections.find(i => i.reportNumber === violation.inspectionNumber);
    if (inspection?.rawData) {
      const rawCarrierId = inspection.rawData.carrier_id_number ||
        inspection.rawData.carrierId ||
        inspection.rawData.dot_number;

      if (rawCarrierId && String(rawCarrierId) !== String(company.dotNumber)) {
        result.flagged = true;
        result.confidence = 'high';
        result.reason = `Inspection carrier DOT# (${rawCarrierId}) does not match company DOT# (${company.dotNumber})`;
        result.details = { inspectionDot: String(rawCarrierId), companyDot: String(company.dotNumber) };
        return result;
      }
    }

    // Check if driver is owner-operator / leased
    if (violation.driverId) {
      const driver = drivers.find(d => d._id.toString() === violation.driverId.toString());
      if (driver?.employmentType === 'owner_operator' || driver?.employmentType === 'leased') {
        result.flagged = true;
        result.confidence = 'medium';
        result.reason = `Driver is ${driver.employmentType} - violation may belong to their own authority`;
        result.details = { employmentType: driver.employmentType, driverName: `${driver.firstName} ${driver.lastName}` };
        return result;
      }
    }

    return result;
  },

  /**
   * Check 2: Duplicate
   * Same violationCode + same date (within 24h) + same location but different inspection.
   */
  _checkDuplicate(violation, { allViolations }) {
    const result = { flagged: false };
    if (!violation.violationCode || !allViolations) return result;

    const violationDate = new Date(violation.violationDate);
    const oneDayMs = 24 * 60 * 60 * 1000;

    const possibleDuplicates = allViolations.filter(v => {
      if (v._id.toString() === violation._id.toString()) return false;
      if (v.violationCode !== violation.violationCode) return false;
      if (v.inspectionNumber === violation.inspectionNumber) return false;

      const otherDate = new Date(v.violationDate);
      if (Math.abs(otherDate - violationDate) > oneDayMs) return false;

      return true;
    });

    if (possibleDuplicates.length === 0) return result;

    // Check for exact match (same location)
    const exactDuplicates = possibleDuplicates.filter(v => {
      const sameCity = v.location?.city && violation.location?.city &&
        v.location.city.toLowerCase() === violation.location.city.toLowerCase();
      const sameState = v.location?.state && violation.location?.state &&
        v.location.state.toLowerCase() === violation.location.state.toLowerCase();
      return sameCity && sameState;
    });

    if (exactDuplicates.length > 0) {
      result.flagged = true;
      result.confidence = 'high';
      result.reason = `Exact duplicate found: same code (${violation.violationCode}), date, and location on different inspection`;
      result.details = {
        duplicateInspections: exactDuplicates.map(d => d.inspectionNumber),
        matchType: 'exact'
      };
    } else {
      result.flagged = true;
      result.confidence = 'medium';
      result.reason = `Probable duplicate: same code (${violation.violationCode}) and date on different inspection`;
      result.details = {
        duplicateInspections: possibleDuplicates.map(d => d.inspectionNumber),
        matchType: 'probable'
      };
    }

    return result;
  },

  /**
   * Check 3: Court Dismissal
   * Passive check - reads user-provided court outcome data.
   */
  _checkCourtDismissal(violation) {
    const result = { flagged: false };

    const courtData = violation.scanResults?.checks?.courtDismissal?.details;
    if (!courtData?.courtOutcome) return result;

    if (courtData.courtOutcome === 'dismissed') {
      result.flagged = true;
      result.confidence = 'high';
      result.reason = 'Court dismissed this violation - strong DataQ challenge candidate';
      result.details = {
        courtOutcome: courtData.courtOutcome,
        courtDate: courtData.courtDate,
        courtNotes: courtData.courtNotes,
        userReported: true
      };
    } else if (courtData.courtOutcome === 'reduced') {
      result.flagged = true;
      result.confidence = 'medium';
      result.reason = 'Court reduced this violation - may support DataQ challenge';
      result.details = {
        courtOutcome: courtData.courtOutcome,
        courtDate: courtData.courtDate,
        courtNotes: courtData.courtNotes,
        userReported: true
      };
    }

    return result;
  },

  /**
   * Check 4: Non-Reportable Crash
   * For crash_indicator BASIC or crashRelated violations, check if the
   * associated accident meets DOT recordable criteria.
   */
  _checkNonReportableCrash(violation, { accidents }) {
    const result = { flagged: false };

    // Only relevant for crash-related violations
    if (violation.basic !== 'crash_indicator' && !violation.crashRelated) return result;
    if (!violation.driverId) return result;

    const violationDate = new Date(violation.violationDate);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Find matching accident (same driver + date within 7 days)
    const matchingAccident = accidents.find(a => {
      if (a.driverId.toString() !== violation.driverId.toString()) return false;
      const accidentDate = new Date(a.accidentDate);
      return Math.abs(accidentDate - violationDate) <= sevenDaysMs;
    });

    if (!matchingAccident) return result;

    // Check recordable criteria - if ALL are false, crash is not DOT-reportable
    const criteria = matchingAccident.recordableCriteria;
    if (criteria && !criteria.fatality && !criteria.injury && !criteria.towAway) {
      result.flagged = true;
      result.confidence = 'medium';
      result.reason = 'Associated crash does not meet DOT recordable criteria (no fatality, no injury, no tow-away)';
      result.details = {
        accidentId: matchingAccident._id,
        accidentDate: matchingAccident.accidentDate,
        recordableCriteria: criteria,
        severity: matchingAccident.severity
      };
    }

    return result;
  },

  /**
   * Check 5: CPDP Eligible
   * Crash Preventability Determination Program - certain crash types
   * where the CMV driver was not at fault may be eligible.
   */
  _checkCpdpEligible(violation, { accidents }) {
    const result = { flagged: false };

    // Only relevant for crash-related violations
    if (violation.basic !== 'crash_indicator' && !violation.crashRelated) return result;
    if (!violation.driverId) return result;

    const violationDate = new Date(violation.violationDate);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const matchingAccident = accidents.find(a => {
      if (a.driverId.toString() !== violation.driverId.toString()) return false;
      const accidentDate = new Date(a.accidentDate);
      return Math.abs(accidentDate - violationDate) <= sevenDaysMs;
    });

    if (!matchingAccident) return result;

    if (CPDP_ELIGIBLE_TYPES.includes(matchingAccident.accidentType)) {
      result.flagged = true;
      result.confidence = 'low';
      result.reason = `Crash type "${matchingAccident.accidentType}" may be eligible for CPDP review if CMV driver was not at fault`;
      result.details = {
        accidentId: matchingAccident._id,
        accidentType: matchingAccident.accidentType,
        accidentDate: matchingAccident.accidentDate,
        preventable: matchingAccident.investigation?.preventable
      };
    }

    return result;
  },

  /**
   * Check 6: Time Decay
   * Pure date math for violation aging and FMCSA time weight schedule.
   */
  _checkTimeDecay(violation) {
    const result = { flagged: false };

    const now = new Date();
    const violationDate = new Date(violation.violationDate);
    const ageMs = now - violationDate;
    const ageInMonths = Math.floor(ageMs / (30.44 * 24 * 60 * 60 * 1000));

    // FMCSA time weights: 0-12 months = 3x, 12-24 months = 2x, 24-36 months = 1x
    let currentTimeWeight, monthsUntilWeightDrop, monthsUntilExpiry, urgency;

    if (ageInMonths < 12) {
      currentTimeWeight = 3;
      monthsUntilWeightDrop = 12 - ageInMonths;
      monthsUntilExpiry = 24 - ageInMonths;
      urgency = 'urgent'; // Still at max weight
    } else if (ageInMonths < 18) {
      currentTimeWeight = 2;
      monthsUntilWeightDrop = 24 - ageInMonths;
      monthsUntilExpiry = 24 - ageInMonths;
      urgency = 'standard';
    } else if (ageInMonths < 24) {
      currentTimeWeight = 2;
      monthsUntilWeightDrop = 24 - ageInMonths;
      monthsUntilExpiry = 24 - ageInMonths;
      urgency = 'expiring_soon';
    } else {
      currentTimeWeight = 1;
      monthsUntilWeightDrop = 0;
      monthsUntilExpiry = 0;
      urgency = 'low_priority';
    }

    // Flag if expiring soon (18-24 months) - these may not be worth challenging
    // Or if urgent (< 6 months) - high impact, worth challenging
    if (urgency === 'expiring_soon' || urgency === 'urgent') {
      result.flagged = true;
    }

    result.reason = `Violation is ${ageInMonths} months old (${currentTimeWeight}x weight)`;
    result.details = {
      ageInMonths,
      currentTimeWeight,
      monthsUntilWeightDrop,
      monthsUntilExpiry,
      urgency
    };

    return result;
  },

  // ========================= Smart Triage Scoring (v2) =========================

  /**
   * Calculate Smart Triage Score — 8-component scoring system.
   *
   * Components:
   *   violationTypeScore  0-30   Based on which check flags matched
   *   evidenceScore       0-15   Evidence checklist completeness
   *   timeScore           0-15   Age-based (fresher = higher)
   *   stateScore         -15..15 State approval rate vs national avg
   *   csaImpactScore      0-25   CSA percentile + threshold impact
   *   errorProneBonus     0-10   Known error-prone violation codes
   *   flagBonus           0-10   Number/confidence of flags
   *   penaltyDeductions  -40..0  Active challenges, denials, extreme age
   */
  _calculateTriageScore(violation, checks, removalImpact, context) {
    const ageInMonths = checks.timeDecay.details?.ageInMonths ?? 0;

    // --- 1. Violation Type Score (0-30) ---
    let violationTypeScore = 0;
    if (checks.courtDismissal.flagged) violationTypeScore = Math.max(violationTypeScore, 30);
    if (checks.wrongCarrier.flagged) violationTypeScore = Math.max(violationTypeScore, 28);
    if (checks.duplicate.flagged) violationTypeScore = Math.max(violationTypeScore, 28);
    if (checks.nonReportableCrash.flagged) violationTypeScore = Math.max(violationTypeScore, 20);
    if (checks.cpdpEligible.flagged) violationTypeScore = Math.max(violationTypeScore, 12);

    // --- 2. Evidence Score (0-15) ---
    let evidenceScore = 0;
    const checklist = violation.dataQChallenge?.evidenceChecklist;
    if (checklist && checklist.length > 0) {
      const obtained = checklist.filter(e => e.obtained).length;
      evidenceScore = Math.round((obtained / checklist.length) * 15);
    }

    // --- 3. Time Score (0-15) ---
    let timeScore = 0;
    if (ageInMonths < 6) timeScore = 15;
    else if (ageInMonths < 12) timeScore = 12;
    else if (ageInMonths < 18) timeScore = 8;
    else if (ageInMonths < 21) timeScore = 4;
    else if (ageInMonths < 24) timeScore = 1;
    // 24+ = 0

    // --- 4. State Score (-15 to +15) ---
    const stateCode = violation.location?.state;
    const stateScore = (stateCode && context.stateProfiles?.[stateCode]) || 0;

    // --- 5. CSA Impact Score (0-25) ---
    let csaImpactScore = 0;
    if (removalImpact) {
      const pts = removalImpact.pointsRemoved || 0;
      const pctChange = removalImpact.percentileChange || 0;
      const threshold = removalImpact.crossesThreshold ? 10 : 0;
      csaImpactScore = Math.min(25, pts * 2 + pctChange * 3 + threshold);
    }

    // --- 6. Error-Prone Bonus (0-10) ---
    let errorProneBonus = 0;
    if (violation.violationCode) {
      const codePrefix = violation.violationCode.split('.').slice(0, 2).join('.');
      const match = ERROR_PRONE_VIOLATION_CODES[codePrefix];
      if (match) {
        errorProneBonus = Math.min(10, Math.round(match.boost * 0.55));
      }
    }

    // --- 7. Flag Bonus (0-10) ---
    const checkEntries = Object.values(checks);
    const flaggedChecks = checkEntries.filter(c => c.flagged);
    const highConfidence = flaggedChecks.filter(c => c.confidence === 'high').length;
    const flagBonus = Math.min(10, flaggedChecks.length * 3 + highConfidence * 2);

    // --- 8. Penalty Deductions (-40 to 0) ---
    let penaltyDeductions = 0;
    const challengeStatus = violation.dataQChallenge?.status;
    if (challengeStatus === 'pending' || challengeStatus === 'under_review') {
      penaltyDeductions = -40;
    } else if (challengeStatus === 'denied') {
      penaltyDeductions = -25;
    }
    if (ageInMonths > 21) {
      penaltyDeductions = Math.max(-40, penaltyDeductions - 5);
    }

    // --- Raw Score ---
    const breakdown = {
      violationTypeScore,
      evidenceScore,
      timeScore,
      stateScore,
      csaImpactScore,
      errorProneBonus,
      flagBonus,
      penaltyDeductions
    };

    let rawScore = violationTypeScore + evidenceScore + timeScore + stateScore +
      csaImpactScore + errorProneBonus + flagBonus + penaltyDeductions;

    // Clamp to [0, 100]
    let score = Math.max(0, Math.min(100, Math.round(rawScore)));

    // --- Override rules (floor guarantees) ---
    if (checks.courtDismissal.flagged && checks.courtDismissal.confidence === 'high') {
      score = Math.max(score, 90);
    }
    if (checks.wrongCarrier.flagged && checks.wrongCarrier.confidence === 'high') {
      score = Math.max(score, 85);
    }
    if (checks.duplicate.flagged && checks.duplicate.confidence === 'high') {
      score = Math.max(score, 85);
    }

    // Force 0 for active/completed challenges
    if (challengeStatus === 'pending' || challengeStatus === 'under_review') {
      score = 0;
    }
    if (challengeStatus === 'accepted') {
      score = 0;
    }

    // --- Classify and recommend ---
    const { category, recommendation } = this._classifyFromScore(score, ageInMonths, checks);

    return { score, category, breakdown, recommendation };
  },

  /**
   * Classify violation into category and generate recommendation from score.
   */
  _classifyFromScore(score, ageInMonths, checks) {
    let category, recommendation;

    if (score >= 80) {
      category = 'easy_win';
      const reasons = [];
      if (checks.courtDismissal.flagged) reasons.push('court dismissal on record');
      if (checks.wrongCarrier.flagged) reasons.push('carrier mismatch detected');
      if (checks.duplicate.flagged) reasons.push('duplicate violation found');
      recommendation = {
        action: 'strong',
        label: 'Strong Challenge',
        reason: reasons.length > 0
          ? `High success probability: ${reasons.join(', ')}`
          : 'Multiple strong indicators support challenging this violation'
      };
    } else if (score >= 50) {
      category = 'worth_challenging';
      recommendation = {
        action: 'worth_trying',
        label: 'Worth Trying',
        reason: 'Moderate success indicators — gather supporting evidence before submitting'
      };
    } else if (score >= 20) {
      if (ageInMonths > 18) {
        category = 'expiring_soon';
        recommendation = {
          action: 'weak',
          label: 'Expiring Soon',
          reason: 'Limited challenge basis and violation is aging out of CSA window'
        };
      } else {
        category = 'unlikely';
        recommendation = {
          action: 'weak',
          label: 'Weak',
          reason: 'Low success probability — consider only if you have strong additional evidence'
        };
      }
    } else {
      category = 'unlikely';
      recommendation = {
        action: 'not_recommended',
        label: 'Not Recommended',
        reason: 'Very low success probability — challenging is unlikely to produce results'
      };
    }

    return { category, recommendation };
  },

  /**
   * Calculate ROI estimate from CSA removal impact.
   */
  _calculateROI(removalImpact) {
    return {
      pointsRemoved: removalImpact?.pointsRemoved || 0,
      percentileChange: removalImpact?.percentileChange || 0,
      estimatedAnnualSavings: Math.round((removalImpact?.percentileChange || 0) * INSURANCE_SAVINGS_PER_POINT),
      crossesThreshold: removalImpact?.crossesThreshold || false,
      thresholdCrossed: removalImpact?.thresholdCrossed || null
    };
  }
};

module.exports = violationScannerService;
