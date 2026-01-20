const express = require('express');
const router = express.Router();
const { protect, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const csaCalculatorService = require('../services/csaCalculatorService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/csa/current
// @desc    Get current BASIC scores for the company
// @access  Private
router.get('/current', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;

  const results = await csaCalculatorService.calculateAllBasics(companyId);

  res.json({
    success: true,
    basics: results,
    calculatedAt: new Date(),
    disclaimer: 'These are ESTIMATED scores based on recorded violations. Actual FMCSA SMS scores require peer group comparisons using national data.'
  });
}));

// @route   GET /api/csa/summary
// @desc    Get score summary with worst/best BASICs
// @access  Private
router.get('/summary', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;

  const summary = await csaCalculatorService.getScoreSummary(companyId);

  res.json({
    success: true,
    ...summary,
    disclaimer: 'Estimates only. Real SMS percentiles require peer group data.'
  });
}));

// @route   GET /api/csa/scores
// @desc    Get current scores (may use stored data if recent)
// @access  Private
router.get('/scores', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;

  const { scores, source, lastUpdated } = await csaCalculatorService.getCurrentScores(companyId);

  res.json({
    success: true,
    scores,
    source,
    lastUpdated,
    isEstimate: source === 'estimated',
    disclaimer: source === 'estimated'
      ? 'These are ESTIMATED scores. Enter your actual SMS BASICs in company settings for accurate data.'
      : 'Using stored SMS BASIC data from company profile.'
  });
}));

// @route   POST /api/csa/project-impact
// @desc    Project the impact of a hypothetical new violation
// @access  Private
router.post('/project-impact', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const { basic, severityWeight, violationCode, outOfService, violationDate } = req.body;

  if (!basic) {
    throw new AppError('BASIC category is required', 400);
  }

  const validBasics = [
    'unsafe_driving',
    'hours_of_service',
    'vehicle_maintenance',
    'controlled_substances',
    'driver_fitness',
    'crash_indicator'
  ];

  if (!validBasics.includes(basic)) {
    throw new AppError(`Invalid BASIC category. Must be one of: ${validBasics.join(', ')}`, 400);
  }

  const newViolation = {
    basic,
    severityWeight: severityWeight || 5,
    violationCode: violationCode || 'HYPOTHETICAL',
    outOfService: outOfService || false,
    violationDate: violationDate ? new Date(violationDate) : new Date()
  };

  const projection = await csaCalculatorService.projectImpact(companyId, newViolation);

  res.json({
    success: true,
    ...projection,
    disclaimer: 'Projected impact is an estimate. Actual changes may vary based on peer group shifts and other factors.'
  });
}));

// @route   GET /api/csa/time-decay
// @desc    Project how scores will change over time as violations age
// @access  Private
router.get('/time-decay', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;
  const monthsAhead = Math.min(parseInt(req.query.months) || 24, 36);

  const projections = await csaCalculatorService.projectTimeDecay(companyId, monthsAhead);

  // Extract key insights
  const currentMonth = projections[0];
  const finalMonth = projections[projections.length - 1];

  const improvements = {};
  for (const basic of Object.keys(currentMonth.scores)) {
    const current = currentMonth.scores[basic].estimatedPercentile;
    const future = finalMonth.scores[basic].estimatedPercentile;
    improvements[basic] = {
      current,
      projected: future,
      change: future - current,
      willImprove: future < current
    };
  }

  res.json({
    success: true,
    monthsProjected: monthsAhead,
    projections,
    insights: {
      improvements,
      summary: `Projecting ${monthsAhead} months ahead based on current violations aging out of the 24-month window.`
    },
    disclaimer: 'Projections assume no new violations are added. Actual scores depend on peer group changes and new inspection activity.'
  });
}));

// @route   GET /api/csa/thresholds
// @desc    Get BASIC thresholds and intervention levels
// @access  Private
router.get('/thresholds', (req, res) => {
  res.json({
    success: true,
    thresholds: {
      unsafe_driving: {
        name: 'Unsafe Driving',
        alertThreshold: 65,
        criticalThreshold: 80,
        interventionLevel: 'FMCSA may issue warning letter at 65%, investigation at 80%',
        regulations: ['49 CFR 392']
      },
      hours_of_service: {
        name: 'Hours of Service',
        alertThreshold: 65,
        criticalThreshold: 80,
        interventionLevel: 'FMCSA may issue warning letter at 65%, investigation at 80%',
        regulations: ['49 CFR 395']
      },
      vehicle_maintenance: {
        name: 'Vehicle Maintenance',
        alertThreshold: 80,
        criticalThreshold: 90,
        interventionLevel: 'FMCSA may issue warning letter at 80%, investigation at 90%',
        regulations: ['49 CFR 393', '49 CFR 396']
      },
      controlled_substances: {
        name: 'Controlled Substances/Alcohol',
        alertThreshold: 80,
        criticalThreshold: 90,
        interventionLevel: 'FMCSA may issue warning letter at 80%, investigation at 90%',
        regulations: ['49 CFR 382', '49 CFR 392.4', '49 CFR 392.5']
      },
      driver_fitness: {
        name: 'Driver Fitness',
        alertThreshold: 80,
        criticalThreshold: 90,
        interventionLevel: 'FMCSA may issue warning letter at 80%, investigation at 90%',
        regulations: ['49 CFR 391']
      },
      crash_indicator: {
        name: 'Crash Indicator',
        alertThreshold: 65,
        criticalThreshold: 80,
        interventionLevel: 'FMCSA may prioritize for compliance review',
        regulations: []
      }
    },
    notes: [
      'Thresholds vary by carrier type (general freight, passenger, hazmat)',
      'These are standard thresholds for general freight carriers',
      'Percentiles are relative to peer group performance'
    ]
  });
});

// @route   GET /api/csa/basics
// @desc    Get list of all BASIC categories
// @access  Private
router.get('/basics', (req, res) => {
  res.json({
    success: true,
    basics: [
      {
        key: 'unsafe_driving',
        name: 'Unsafe Driving',
        description: 'Operation of commercial motor vehicles in a dangerous or careless manner',
        examples: ['Speeding', 'Reckless driving', 'Improper lane change', 'Inattention'],
        regulations: '49 CFR 392'
      },
      {
        key: 'hours_of_service',
        name: 'Hours of Service',
        description: 'Operation of CMVs by drivers who are ill, fatigued, or in non-compliance with HOS regulations',
        examples: ['Driving beyond hours', 'Falsified logs', 'No required break'],
        regulations: '49 CFR 395'
      },
      {
        key: 'vehicle_maintenance',
        name: 'Vehicle Maintenance',
        description: 'Failure to properly maintain CMVs and equipment',
        examples: ['Brake defects', 'Light violations', 'Tire issues', 'Load securement'],
        regulations: '49 CFR 393, 396'
      },
      {
        key: 'controlled_substances',
        name: 'Controlled Substances/Alcohol',
        description: 'Operation of CMVs while impaired or violations of drug/alcohol regulations',
        examples: ['Positive drug test', 'Alcohol possession', 'Impaired driving'],
        regulations: '49 CFR 382, 392.4, 392.5'
      },
      {
        key: 'driver_fitness',
        name: 'Driver Fitness',
        description: 'Operation of CMVs by drivers who are unfit to operate due to lack of training, experience, or medical qualifications',
        examples: ['No valid CDL', 'No medical certificate', 'Lack of training'],
        regulations: '49 CFR 391'
      },
      {
        key: 'crash_indicator',
        name: 'Crash Indicator',
        description: 'Historical pattern of crashes',
        examples: ['DOT-recordable crashes', 'Fatal crashes', 'Injury crashes'],
        regulations: 'N/A'
      }
    ]
  });
});

module.exports = router;
