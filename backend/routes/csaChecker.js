/**
 * CSA Checker Routes - PUBLIC endpoints for lead magnet
 * These routes do NOT require authentication
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Lead = require('../models/Lead');
const fmcsaService = require('../services/fmcsaService');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Rate limiting for public CSA checker endpoints
const csaRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // 5 lookups per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please wait a moment before checking again.'
  }
});

/**
 * @route   POST /api/csa-checker/lookup
 * @desc    Look up carrier CSA data (preview - no email required)
 * @access  Public
 */
router.post('/lookup', csaRateLimiter, [
  body('carrierNumber')
    .trim()
    .notEmpty()
    .withMessage('Carrier number is required')
    .isLength({ min: 5, max: 15 })
    .withMessage('Carrier number must be 5-15 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { carrierNumber } = req.body;

  // Validate carrier number format
  const cleanedNumber = carrierNumber.replace(/[^0-9]/g, '');
  const upperInput = carrierNumber.toUpperCase();
  if (upperInput.includes('MC') || upperInput.startsWith('MC')) {
    if (!/^MC-?\d+$/.test(carrierNumber.replace(/\s/g, ''))) {
      throw new AppError('Invalid MC number format. Expected format: MC-123456', 400);
    }
  } else if (!/^\d{5,15}$/.test(cleanedNumber)) {
    throw new AppError('Invalid DOT number format. Expected 5-15 digits.', 400);
  }

  const carrierData = await fmcsaService.fetchCarrierData(carrierNumber);

  if (!carrierData.success) {
    throw new AppError('Carrier not found. Please check the MC# or DOT# and try again.', 404);
  }

  const riskLevel = fmcsaService.calculateRiskLevel(carrierData.basics);
  const dataQOpportunities = fmcsaService.estimateDataQOpportunities(carrierData.basics, carrierData.inspections, carrierData.crashes);

  res.json({
    success: true,
    data: {
      carrier: {
        legalName: carrierData.carrier.legalName,
        dotNumber: carrierData.carrier.dotNumber,
        mcNumber: carrierData.carrier.mcNumber,
        operatingStatus: carrierData.carrier.operatingStatus,
        state: carrierData.carrier.address.state,
        fleetSize: carrierData.carrier.fleetSize,
        safetyRating: carrierData.carrier.safetyRating
      },
      basics: carrierData.basics,
      alerts: carrierData.alerts,
      riskLevel,
      inspections: carrierData.inspections,
      crashes: carrierData.crashes,
      dataSource: carrierData.dataSource,
      disclaimer: carrierData.disclaimer,
      dataQOpportunities
    }
  });
}));

/**
 * @route   POST /api/csa-checker/full-report
 * @desc    Get full AI analysis (requires email - lead capture)
 * @access  Public
 */
router.post('/full-report', csaRateLimiter, [
  body('carrierNumber')
    .trim()
    .notEmpty()
    .withMessage('Carrier number is required'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { carrierNumber, email } = req.body;

  const carrierData = await fmcsaService.fetchCarrierData(carrierNumber);

  if (!carrierData.success) {
    throw new AppError('Carrier not found', 404);
  }

  const clientIp = req.ip || req.connection.remoteAddress;

  // Check if lead already exists
  let lead = await Lead.findByEmail(email);

  // Generate AI analysis
  let aiAnalysis = null;
  try {
    const aiResponse = await aiService.query('csaAnalyzer', `Analyze this carrier's CSA profile and provide a structured report.

CARRIER DATA:
- Name: ${carrierData.carrier.legalName}
- DOT#: ${carrierData.carrier.dotNumber}
- Fleet: ${carrierData.carrier.fleetSize.powerUnits} power units, ${carrierData.carrier.fleetSize.drivers} drivers
- Safety Rating: ${carrierData.carrier.safetyRating}

BASIC SCORES (threshold in parentheses):
- Unsafe Driving: ${carrierData.basics.unsafeDriving ?? 'N/A'}% (65%)
- HOS Compliance: ${carrierData.basics.hosCompliance ?? 'N/A'}% (65%)
- Vehicle Maintenance: ${carrierData.basics.vehicleMaintenance ?? 'N/A'}% (80%)
- Crash Indicator: ${carrierData.basics.crashIndicator ?? 'N/A'}% (65%)
- Controlled Substances: ${carrierData.basics.controlledSubstances ?? 'N/A'}% (80%)
- Hazmat Compliance: ${carrierData.basics.hazmatCompliance ?? 'N/A'}% (80%)
- Driver Fitness: ${carrierData.basics.driverFitness ?? 'N/A'}% (80%)

RECENT HISTORY:
- Inspections (24mo): ${carrierData.inspections.last24Months}
- Crashes (24mo): ${carrierData.crashes.last24Months}
- BASICs Above Threshold: ${carrierData.alerts.count}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (use these exact headers):

📊 QUICK SUMMARY
[2-3 sentences about their overall compliance status and risk level]

⚠️ ISSUES FOUND
[Bullet list of specific problems - BASICs above threshold, concerning trends, etc. If no issues, say "No critical issues found"]

✅ YOUR 3-STEP ACTION PLAN
1. [First action - be specific]
2. [Second action - be specific]
3. [Third action - be specific]

🔍 DATAQ CHALLENGE OPPORTUNITIES
[For each BASIC above or near threshold:
- Category name + score/threshold
- 2-3 specific violation TYPES with CFR codes (e.g., "395.8 ELD issues" for HOS, "393.45 brake violations" for Vehicle Maintenance)
- Recommended challenge approach (data_error, procedural_error, incomplete_record)
- Use "High potential" for flagged BASICs, "Moderate potential" for near-threshold
If no BASICs are flagged or near threshold, say "No urgent DataQ opportunities detected at this time. Continue monitoring your scores."]

⚖️ MOVING VIOLATION ALERT
[Classify mentioned violations as MOVING or NON-MOVING:
- MOVING: speeding (392.2S), reckless driving (392.2R), improper lane change (392.2LC), failure to yield (392.2FYR), following too closely (392.2T), traffic control (392.2FTC), improper passing (392.2P), improper turns (392.2U), texting (392.80), phone use (392.82), railroad crossing (392.10), seat belt (392.16)
- NON-MOVING: equipment (393.x, 396.x), HOS (395.x), fitness (391.x), substances (382.x)

For each MOVING violation found:
- Code + description + "⚠️ MOVING VIOLATION"
- "This moving violation may be eligible for reclassification. An attorney experienced in FMCSA violations can potentially get it reclassified to non-moving or removed entirely, reducing your CSA score impact."

If no moving violations detected, say "No moving violations detected in your profile."]

RULES:
- Keep language simple - written for truckers, not lawyers
- Be specific about which BASICs need attention
- If any BASIC is above threshold, mention DataQ challenge opportunities
- Always classify violations as Moving or Non-Moving and recommend attorney for moving violations
- Create urgency but be helpful, not scary
- Total response under 500 words`, { maxTokens: 1500 });

    aiAnalysis = {
      content: aiResponse.content,
      generatedAt: new Date()
    };
  } catch (aiError) {
    console.error('AI analysis error:', aiError.message);
    // Continue without AI analysis if it fails
    aiAnalysis = {
      content: generateFallbackAnalysis(carrierData),
      generatedAt: new Date(),
      fallback: true
    };
  }

  // Calculate risk level and DataQ opportunities
  const riskLevel = fmcsaService.calculateRiskLevel(carrierData.basics);
  const dataQOpportunities = fmcsaService.estimateDataQOpportunities(carrierData.basics, carrierData.inspections, carrierData.crashes);

  // Save or update lead
  if (lead) {
    lead.csaSnapshot = {
      ...carrierData.basics,
      alertCount: carrierData.alerts.count,
      riskLevel,
      fetchedAt: new Date()
    };
    lead.aiAnalysis = {
      summary: aiAnalysis.content,
      generatedAt: aiAnalysis.generatedAt
    };
    await lead.save();
  } else {
    lead = await Lead.create({
      email,
      dotNumber: carrierData.carrier.dotNumber,
      mcNumber: carrierData.carrier.mcNumber,
      companyName: carrierData.carrier.legalName,
      source: 'csa-checker',
      csaSnapshot: {
        ...carrierData.basics,
        alertCount: carrierData.alerts.count,
        riskLevel,
        fetchedAt: new Date()
      },
      aiAnalysis: {
        summary: aiAnalysis.content,
        generatedAt: aiAnalysis.generatedAt
      },
      ipAddress: clientIp,
      userAgent: req.headers['user-agent']
    });
  }

  // Generate PDF and send email — await result for accurate status
  let emailSent = false;
  let pdfBuffer = null;

  try {
    pdfBuffer = await pdfService.generateCSAReport({
      carrier: carrierData.carrier,
      basics: carrierData.basics,
      riskLevel,
      inspections: carrierData.inspections,
      crashes: carrierData.crashes,
      aiAnalysis: aiAnalysis.content,
      dataQOpportunities
    });
  } catch (pdfError) {
    console.error('PDF generation error:', pdfError.message);
    // Continue without PDF — email will be sent without attachment
  }

  try {
    const emailResult = await emailService.sendCSAReport(
      email,
      carrierData.carrier,
      carrierData.basics,
      aiAnalysis.content,
      riskLevel,
      { inspections: carrierData.inspections, crashes: carrierData.crashes },
      pdfBuffer,
      dataQOpportunities
    );
    emailSent = emailResult !== null && !emailResult?.error;
  } catch (emailError) {
    console.error('CSA Report email error:', emailError.message);
  }

  res.json({
    success: true,
    data: {
      carrier: carrierData.carrier,
      basics: carrierData.basics,
      alerts: carrierData.alerts,
      inspections: carrierData.inspections,
      crashes: carrierData.crashes,
      riskLevel,
      aiAnalysis: aiAnalysis.content,
      dataSource: carrierData.dataSource,
      disclaimer: carrierData.disclaimer,
      leadCaptured: true,
      emailSent
    }
  });
}));

/**
 * @route   GET /api/csa-checker/stats
 * @desc    Get public stats for social proof
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Lead.getMonthlyStats();

    res.json({
      success: true,
      data: {
        checksThisMonth: stats.checksThisMonth || 0,
        totalChecks: stats.totalChecks || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats'
    });
  }
});

/**
 * @route   GET /api/csa-checker/basic-info
 * @desc    Get BASIC category information
 * @access  Public
 */
router.get('/basic-info', (req, res) => {
  res.json({
    success: true,
    data: fmcsaService.getBasicInfo()
  });
});

/**
 * Generate fallback analysis when AI is unavailable
 */
function generateFallbackAnalysis(carrierData) {
  const alerts = carrierData.alerts;

  let analysis = `📊 QUICK SUMMARY\n`;

  // Summary
  if (alerts.count === 0) {
    analysis += `Good news! Your carrier has no BASICs above FMCSA intervention thresholds. Staying proactive about compliance is key to maintaining this status.\n\n`;
  } else if (alerts.count === 1) {
    analysis += `Attention needed. Your carrier has 1 BASIC above the FMCSA intervention threshold. This could trigger an investigation or audit. Taking action now can reduce your risk.\n\n`;
  } else {
    analysis += `Critical action required. Your carrier has ${alerts.count} BASICs above intervention thresholds. FMCSA may prioritize your company for investigation. Immediate attention is recommended.\n\n`;
  }

  // Issues Found
  analysis += `⚠️ ISSUES FOUND\n`;
  if (alerts.count > 0) {
    alerts.details.forEach(alert => {
      const basicName = fmcsaService.getBasicInfo().find(b => b.key === alert.basic)?.name || alert.basic;
      analysis += `• ${basicName}: ${alert.score}% (threshold: ${alert.threshold}%) - Consider filing a DataQ challenge for any incorrect violations\n`;
    });
  } else {
    analysis += `• No critical issues found. All BASICs are below intervention thresholds.\n`;
  }
  analysis += `\n`;

  // Action Plan
  analysis += `✅ YOUR 3-STEP ACTION PLAN\n`;
  analysis += `1. Review your recent inspections and identify any violations that may be incorrectly recorded or eligible for DataQ challenge.\n`;
  analysis += `2. Set up automated alerts with VroomX Safety to get notified when your BASIC scores change.\n`;
  analysis += `3. Implement a preventive maintenance program and ensure all drivers complete thorough pre-trip inspections.\n`;
  analysis += `\n`;

  // DataQ Challenge Opportunities
  analysis += `🔍 DATAQ CHALLENGE OPPORTUNITIES\n`;
  if (alerts.count > 0) {
    alerts.details.forEach(alert => {
      const basicName = fmcsaService.getBasicInfo().find(b => b.key === alert.basic)?.name || alert.basic;
      analysis += `• ${basicName}: ${alert.score}% (threshold: ${alert.threshold}%) - High potential for DataQ challenge. Review recent violations for data errors or procedural issues.\n`;
    });
  } else {
    analysis += `No urgent DataQ opportunities detected at this time. Continue monitoring your scores.\n`;
  }
  analysis += `\n`;

  // Moving Violation Alert
  analysis += `⚖️ MOVING VIOLATION ALERT\n`;
  const unsafeDrivingAlert = alerts.details?.find(a => a.basic === 'unsafeDriving');
  if (unsafeDrivingAlert) {
    analysis += `• Your Unsafe Driving BASIC is at ${unsafeDrivingAlert.score}% (threshold: ${unsafeDrivingAlert.threshold}%). This category typically contains moving violations such as speeding, improper lane changes, and reckless driving.\n`;
    analysis += `• Moving violations may be eligible for reclassification through legal representation. An attorney experienced in FMCSA violations can potentially get moving violations reclassified to non-moving or removed entirely, significantly reducing your CSA score impact.\n`;
  } else {
    analysis += `No moving violations detected in your current BASIC scores profile.\n`;
  }

  return analysis;
}

module.exports = router;
