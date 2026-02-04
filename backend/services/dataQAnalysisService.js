/**
 * DataQ Challenge Analysis Service
 *
 * Provides AI-powered analysis of violations to identify DataQ challenge opportunities,
 * scoring potential success rates, and generating professional challenge letters.
 */

const { Violation } = require('../models');

// Error codes commonly associated with data entry mistakes or procedural issues
const ERROR_PRONE_VIOLATION_CODES = {
  // Driver fitness issues often misrecorded
  '391.41': { boost: 15, reason: 'Medical certificate issues often involve clerical errors' },
  '391.45': { boost: 12, reason: 'Medical examiner certification status can be verified' },

  // HOS violations with ELD discrepancies
  '395.8': { boost: 18, reason: 'ELD data can provide contradicting evidence' },
  '395.3': { boost: 15, reason: 'Hours violations often involve complex calculations' },

  // Vehicle maintenance issues that may have been corrected
  '393.9': { boost: 10, reason: 'Inoperative equipment may have been fixed on scene' },
  '393.45': { boost: 12, reason: 'Brake adjustment can be verified with documentation' },
  '393.47': { boost: 10, reason: 'Brake tubing issues may be misidentified' },

  // Equipment issues that may be incorrectly assigned
  '392.2': { boost: 8, reason: 'State/local law violations may not apply to CMV' },
  '392.16': { boost: 10, reason: 'Seat belt violations may have extenuating circumstances' }
};

// Challenge type recommendations based on violation characteristics
const CHALLENGE_TYPE_MAPPING = {
  data_error: {
    description: 'Factual information in the inspection report is incorrect',
    indicators: ['wrong_vehicle', 'wrong_driver', 'wrong_date', 'typo_in_code']
  },
  policy_violation: {
    description: 'Inspector did not follow proper FMCSA procedures',
    indicators: ['improper_inspection_level', 'wrong_jurisdiction', 'invalid_authority']
  },
  procedural_error: {
    description: 'The inspection was not conducted according to guidelines',
    indicators: ['incomplete_inspection', 'no_opportunity_to_correct', 'improper_notification']
  },
  not_responsible: {
    description: 'Carrier/driver should not be held responsible for this violation',
    indicators: ['leased_equipment', 'independent_contractor', 'shipper_responsibility']
  }
};

// Evidence recommendations by challenge type
const EVIDENCE_RECOMMENDATIONS = {
  data_error: [
    { item: 'Corrected vehicle registration', required: true },
    { item: 'Driver employment records', required: true },
    { item: 'ELD/GPS data showing correct information', required: false },
    { item: 'Photos with timestamps', required: false }
  ],
  policy_violation: [
    { item: 'FMCSA policy documentation', required: true },
    { item: 'Written statement from qualified expert', required: false },
    { item: 'Previous inspection reports showing compliance', required: false }
  ],
  procedural_error: [
    { item: 'Timeline documentation', required: true },
    { item: 'Witness statements', required: false },
    { item: 'Communication records with inspector', required: false },
    { item: 'Photos from inspection', required: false }
  ],
  not_responsible: [
    { item: 'Lease agreement', required: true },
    { item: 'Bill of lading', required: true },
    { item: 'Maintenance responsibility agreement', required: false },
    { item: 'Contractor agreement', required: false }
  ]
};

/**
 * Calculate the challenge score for a violation
 * Score range: 0-100 (higher = more likely to succeed)
 *
 * @param {Object} violation - The violation document
 * @returns {Object} Score details with factors
 */
function calculateChallengeScore(violation) {
  let score = 50; // Base score
  const factors = [];
  const deductions = [];

  // Calculate age in months
  const violationDate = new Date(violation.violationDate);
  const now = new Date();
  const ageInMonths = Math.floor((now - violationDate) / (1000 * 60 * 60 * 24 * 30));

  // Age factors
  if (ageInMonths < 6) {
    score += 15;
    factors.push('Recent violation (<6 months) - more likely to have accurate records');
  } else if (ageInMonths > 18) {
    score -= 20;
    deductions.push('Violation over 18 months old - approaching time-weight reduction anyway');
  } else if (ageInMonths > 12) {
    score -= 10;
    deductions.push('Violation over 12 months old - records may be harder to obtain');
  }

  // Out-of-service violations have higher impact and are worth challenging
  if (violation.outOfService) {
    score += 10;
    factors.push('Out-of-service violation - high CSA impact, worth challenging');
  }

  // High severity violations (7+) are worth the effort
  if (violation.severityWeight >= 7) {
    score += 15;
    factors.push(`High severity weight (${violation.severityWeight}) - significant CSA impact`);
  } else if (violation.severityWeight >= 5) {
    score += 5;
    factors.push(`Moderate severity weight (${violation.severityWeight})`);
  }

  // Check for error-prone violation codes
  if (violation.violationCode) {
    const codePrefix = violation.violationCode.split('.').slice(0, 2).join('.');
    const errorProneMatch = ERROR_PRONE_VIOLATION_CODES[codePrefix];
    if (errorProneMatch) {
      score += errorProneMatch.boost;
      factors.push(errorProneMatch.reason);
    }
  }

  // BASIC category considerations
  if (violation.basic === 'driver_fitness') {
    score += 8;
    factors.push('Driver fitness violations often involve documentation that can be verified');
  } else if (violation.basic === 'vehicle_maintenance') {
    score += 5;
    factors.push('Vehicle maintenance issues may have been corrected on-scene');
  } else if (violation.basic === 'hours_of_service') {
    score += 10;
    factors.push('HOS violations can often be disputed with ELD data');
  }

  // Already challenged violations
  if (violation.dataQChallenge?.submitted) {
    if (violation.dataQChallenge.status === 'denied') {
      score -= 30;
      deductions.push('Previous DataQ challenge was denied');
    } else if (violation.dataQChallenge.status === 'pending' || violation.dataQChallenge.status === 'under_review') {
      score = 0;
      deductions.push('DataQ challenge already in progress');
    } else if (violation.dataQChallenge.status === 'accepted') {
      score = 0;
      deductions.push('DataQ challenge already accepted');
    }
  }

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    factors,
    deductions,
    category: getChallengeCategory(score),
    ageInMonths,
    estimatedCSAImpact: calculateEstimatedCSAImpact(violation)
  };
}

/**
 * Categorize the challenge potential
 */
function getChallengeCategory(score) {
  if (score >= 75) return { level: 'high', label: 'High Potential', color: 'success' };
  if (score >= 50) return { level: 'medium', label: 'Medium Potential', color: 'warning' };
  return { level: 'low', label: 'Low Potential', color: 'danger' };
}

/**
 * Estimate the CSA score impact if the challenge is successful
 */
function calculateEstimatedCSAImpact(violation) {
  // Simplified calculation based on severity weight and time
  const baseImpact = violation.severityWeight || 5;
  const oosMultiplier = violation.outOfService ? 2 : 1;

  return {
    pointReduction: Math.round(baseImpact * oosMultiplier * 1.5),
    basic: violation.basic,
    description: `Estimated ${baseImpact * oosMultiplier * 1.5} point reduction in ${violation.basic?.replace('_', ' ') || 'Unknown'} BASIC`
  };
}

/**
 * Analyze a single violation for challenge potential
 *
 * @param {Object} violation - The violation document
 * @returns {Object} Full analysis with score, factors, and recommendations
 */
function analyzeViolationChallengeability(violation) {
  const scoreDetails = calculateChallengeScore(violation);

  // Determine recommended challenge type
  const recommendedChallengeType = determineRecommendedChallengeType(violation);

  // Get evidence checklist
  const evidenceChecklist = EVIDENCE_RECOMMENDATIONS[recommendedChallengeType] ||
    EVIDENCE_RECOMMENDATIONS.data_error;

  return {
    violationId: violation._id,
    score: scoreDetails.score,
    category: scoreDetails.category,
    factors: scoreDetails.factors,
    deductions: scoreDetails.deductions,
    ageInMonths: scoreDetails.ageInMonths,
    estimatedCSAImpact: scoreDetails.estimatedCSAImpact,
    recommendedChallengeType,
    challengeTypeDescription: CHALLENGE_TYPE_MAPPING[recommendedChallengeType]?.description,
    evidenceChecklist: evidenceChecklist.map(item => ({
      ...item,
      obtained: false
    })),
    generatedAt: new Date()
  };
}

/**
 * Determine the recommended challenge type based on violation characteristics
 */
function determineRecommendedChallengeType(violation) {
  // HOS violations are often data errors with ELD proof
  if (violation.basic === 'hours_of_service') {
    return 'data_error';
  }

  // Driver fitness issues often involve paperwork/documentation
  if (violation.basic === 'driver_fitness') {
    return 'data_error';
  }

  // Vehicle maintenance that was corrected on scene
  if (violation.basic === 'vehicle_maintenance' && !violation.outOfService) {
    return 'procedural_error';
  }

  // Default to data_error as most common successful challenge type
  return 'data_error';
}

/**
 * Identify all challengeable violations for a company
 *
 * @param {ObjectId} companyId - The company ID
 * @param {Object} options - Filter options
 * @returns {Object} List of violations with analysis and summary
 */
async function identifyChallengeableViolations(companyId, options = {}) {
  const {
    minScore = 40,
    limit = 20,
    basic,
    includeAlreadyChallenged = false
  } = options;

  // Build query
  const query = {
    companyId,
    status: { $in: ['open', 'upheld'] }
  };

  // Optionally filter out already challenged
  if (!includeAlreadyChallenged) {
    query.$or = [
      { 'dataQChallenge.submitted': { $ne: true } },
      { 'dataQChallenge.status': 'denied' } // Allow re-analysis of denied ones
    ];
  }

  // Filter by BASIC if specified
  if (basic) {
    query.basic = basic;
  }

  // Only look at violations from last 24 months (relevant for CSA)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  query.violationDate = { $gte: twoYearsAgo };

  const violations = await Violation.find(query)
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber')
    .sort({ violationDate: -1 })
    .limit(100); // Analyze up to 100, return top ones

  // Analyze each violation
  const analyzedViolations = violations.map(violation => {
    const analysis = analyzeViolationChallengeability(violation);
    return {
      violation: {
        _id: violation._id,
        violationDate: violation.violationDate,
        violationType: violation.violationType,
        violationCode: violation.violationCode,
        description: violation.description,
        basic: violation.basic,
        severityWeight: violation.severityWeight,
        outOfService: violation.outOfService,
        status: violation.status,
        inspectionNumber: violation.inspectionNumber,
        location: violation.location,
        driver: violation.driverId,
        vehicle: violation.vehicleId
      },
      analysis
    };
  });

  // Filter by minimum score and sort by score descending
  const filteredViolations = analyzedViolations
    .filter(v => v.analysis.score >= minScore)
    .sort((a, b) => b.analysis.score - a.analysis.score)
    .slice(0, limit);

  // Calculate summary
  const summary = {
    total: violations.length,
    analyzed: analyzedViolations.length,
    highPotential: analyzedViolations.filter(v => v.analysis.score >= 75).length,
    mediumPotential: analyzedViolations.filter(v => v.analysis.score >= 50 && v.analysis.score < 75).length,
    lowPotential: analyzedViolations.filter(v => v.analysis.score < 50).length,
    totalEstimatedImpact: filteredViolations.reduce(
      (sum, v) => sum + (v.analysis.estimatedCSAImpact?.pointReduction || 0),
      0
    )
  };

  return {
    violations: filteredViolations,
    summary
  };
}

/**
 * Get DataQ dashboard statistics
 *
 * @param {ObjectId} companyId - The company ID
 * @returns {Object} Dashboard statistics
 */
async function getDataQDashboardStats(companyId) {
  // Time range: last 24 months
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  // Get all violations with DataQ activity
  const violations = await Violation.find({
    companyId,
    violationDate: { $gte: twoYearsAgo }
  });

  // Calculate statistics
  const stats = {
    totalViolations: violations.length,
    challengeStats: {
      pending: 0,
      underReview: 0,
      accepted: 0,
      denied: 0,
      withdrawn: 0,
      notSubmitted: 0
    },
    successRate: 0,
    totalChallenges: 0,
    avgProcessingDays: null,
    estimatedCSASavings: 0
  };

  let totalProcessingDays = 0;
  let processedCount = 0;

  violations.forEach(v => {
    if (v.dataQChallenge?.submitted) {
      stats.totalChallenges++;
      const status = v.dataQChallenge.status || 'pending';

      if (stats.challengeStats[status] !== undefined) {
        stats.challengeStats[status]++;
      }

      // Calculate processing time for completed challenges
      if (['accepted', 'denied', 'withdrawn'].includes(status) && v.dataQChallenge.responseDate) {
        const processingTime = Math.floor(
          (new Date(v.dataQChallenge.responseDate) - new Date(v.dataQChallenge.submissionDate)) /
          (1000 * 60 * 60 * 24)
        );
        totalProcessingDays += processingTime;
        processedCount++;
      }

      // Calculate CSA savings from accepted challenges
      if (status === 'accepted') {
        stats.estimatedCSASavings += (v.severityWeight || 5) * (v.outOfService ? 2 : 1);
      }
    } else {
      stats.challengeStats.notSubmitted++;
    }
  });

  // Calculate success rate
  const completedChallenges = stats.challengeStats.accepted + stats.challengeStats.denied;
  if (completedChallenges > 0) {
    stats.successRate = Math.round((stats.challengeStats.accepted / completedChallenges) * 100);
  }

  // Calculate average processing days
  if (processedCount > 0) {
    stats.avgProcessingDays = Math.round(totalProcessingDays / processedCount);
  }

  return stats;
}

/**
 * Save AI analysis results to a violation
 *
 * @param {ObjectId} violationId - The violation ID
 * @param {Object} analysis - The analysis results
 * @returns {Object} Updated violation
 */
async function saveAnalysisToViolation(violationId, analysis) {
  const violation = await Violation.findById(violationId);
  if (!violation) {
    throw new Error('Violation not found');
  }

  // Update dataQChallenge with AI analysis
  if (!violation.dataQChallenge) {
    violation.dataQChallenge = {};
  }

  violation.dataQChallenge.aiAnalysis = {
    score: analysis.score,
    factors: analysis.factors,
    generatedAt: new Date()
  };

  if (analysis.evidenceChecklist) {
    violation.dataQChallenge.evidenceChecklist = analysis.evidenceChecklist;
  }

  await violation.save();
  return violation;
}

/**
 * Run bulk analysis on recently synced violations for a company
 *
 * This is called after FMCSA sync to automatically score new violations
 * for DataQ challenge potential. Uses local scoring only (no AI calls)
 * for cost efficiency.
 *
 * @param {ObjectId} companyId - The company ID
 * @param {Object} options - Options for bulk analysis
 * @param {number} options.maxViolations - Maximum violations to analyze (default 50)
 * @param {number} options.hoursCutoff - Hours to look back for recently synced (default 24)
 * @returns {Object} Results { analyzed, skipped, errors }
 */
async function runBulkAnalysis(companyId, options = {}) {
  const { maxViolations = 50, hoursCutoff = 24 } = options;

  const recentCutoff = new Date(Date.now() - hoursCutoff * 60 * 60 * 1000);

  // Find recently synced violations that haven't been analyzed yet
  const violations = await Violation.find({
    companyId,
    'syncMetadata.importedAt': { $gte: recentCutoff },
    'dataQChallenge.aiAnalysis': { $exists: false },
    status: { $in: ['open', 'upheld'] }
  })
  .sort({ severityWeight: -1 }) // Prioritize high-impact violations
  .limit(maxViolations);

  const results = { analyzed: 0, skipped: 0, errors: [] };

  // Sequential processing to avoid overwhelming the database
  for (const violation of violations) {
    try {
      const scoreDetails = calculateChallengeScore(violation);

      await saveAnalysisToViolation(violation._id, {
        score: scoreDetails.score,
        factors: scoreDetails.factors,
        deductions: scoreDetails.deductions,
        category: scoreDetails.category,
        confidence: scoreDetails.score >= 75 ? 'high' : scoreDetails.score >= 50 ? 'medium' : 'low'
      });

      results.analyzed++;
    } catch (err) {
      results.errors.push({ violationId: violation._id.toString(), error: err.message });
    }
  }

  return results;
}

/**
 * Save generated letter to a violation
 *
 * @param {ObjectId} violationId - The violation ID
 * @param {Object} letterData - The generated letter data
 * @returns {Object} Updated violation
 */
async function saveGeneratedLetter(violationId, letterData) {
  const violation = await Violation.findById(violationId);
  if (!violation) {
    throw new Error('Violation not found');
  }

  if (!violation.dataQChallenge) {
    violation.dataQChallenge = {};
  }

  violation.dataQChallenge.generatedLetter = {
    content: letterData.content,
    generatedAt: new Date(),
    challengeType: letterData.challengeType
  };

  await violation.save();
  return violation;
}

module.exports = {
  analyzeViolationChallengeability,
  identifyChallengeableViolations,
  getDataQDashboardStats,
  saveAnalysisToViolation,
  saveGeneratedLetter,
  calculateChallengeScore,
  runBulkAnalysis,
  ERROR_PRONE_VIOLATION_CODES,
  CHALLENGE_TYPE_MAPPING,
  EVIDENCE_RECOMMENDATIONS
};
