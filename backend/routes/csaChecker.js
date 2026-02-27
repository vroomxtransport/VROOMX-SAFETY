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
const fmcsaInspectionService = require('../services/fmcsaInspectionService');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');
const { lookupViolationCode } = require('../config/violationCodes');
const jwt = require('jsonwebtoken');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Keywords that indicate a moving violation (fallback when code lookup doesn't match)
const MOVING_KEYWORDS = [
  'speeding', 'speed', 'mph over', 'reckless', 'careless', 'lane change',
  'failure to yield', 'following too close', 'tailgating', 'traffic control',
  'traffic signal', 'stop sign', 'red light', 'improper passing', 'improper turn',
  'texting', 'cell phone', 'cellular phone', 'hand-held', 'mobile phone',
  'railroad crossing', 'seat belt', 'seatbelt'
];

/**
 * Classify raw DataHub violations using violationCodes.js isMoving flags
 * Falls back to BASIC category + description keywords when code format doesn't match
 */
function classifyViolations(rawViolations) {
  if (!rawViolations || rawViolations.length === 0) return null;

  const now = new Date();

  const enriched = rawViolations.map(v => {
    const codeInfo = lookupViolationCode(v.code);
    const inspDate = v.inspectionDate ? new Date(v.inspectionDate) : null;
    const ageMonths = inspDate ? Math.round((now - inspDate) / (1000 * 60 * 60 * 24 * 30.44)) : null;

    let timeDecayNote = null;
    if (ageMonths !== null) {
      if (ageMonths < 12) timeDecayNote = 'full weight';
      else if (ageMonths < 18) timeDecayNote = 'reduced weight (past 12mo)';
      else if (ageMonths < 24) timeDecayNote = 'minimal weight (drops off at 24mo)';
      else timeDecayNote = 'expired (past 24mo)';
    }

    let dropOffDate = null;
    if (inspDate) {
      const dropOff = new Date(inspDate);
      dropOff.setMonth(dropOff.getMonth() + 24);
      dropOffDate = dropOff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    const dateStr = inspDate
      ? inspDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'unknown date';

    // Determine if moving: code-based lookup first, then keyword fallback
    let isMoving = codeInfo.isMoving === true;
    if (!isMoving && codeInfo.unknown && v.basic === 'unsafe_driving') {
      // Fallback: unsafe_driving BASIC + description keyword matching
      const searchText = `${v.description || ''} ${v.section || ''} ${v.group || ''}`.toLowerCase();
      isMoving = MOVING_KEYWORDS.some(kw => searchText.includes(kw));
    }

    return {
      code: v.code,
      description: codeInfo.unknown ? v.description : (codeInfo.description || v.description),
      basic: v.basic,
      severityWeight: v.severityWeight,
      isMoving,
      isOOS: v.oos === true,
      dateStr,
      ageMonths,
      timeDecayNote,
      dropOffDate
    };
  }).filter(v => v.ageMonths === null || v.ageMonths < 24); // Only violations still on record

  const movingViolations = enriched.filter(v => v.isMoving);
  const byBasic = {};
  for (const v of enriched) {
    if (!byBasic[v.basic]) byBasic[v.basic] = [];
    byBasic[v.basic].push(v);
  }

  return {
    total: enriched.length,
    movingCount: movingViolations.length,
    nonMovingCount: enriched.length - movingViolations.length,
    oosCount: enriched.filter(v => v.isOOS).length,
    movingViolations,
    byBasic,
    all: enriched
  };
}

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
        dbaName: carrierData.carrier.dbaName,
        dotNumber: carrierData.carrier.dotNumber,
        mcNumber: carrierData.carrier.mcNumber,
        operatingStatus: carrierData.carrier.operatingStatus,
        address: carrierData.carrier.address,
        phone: carrierData.carrier.phone,
        entityType: carrierData.carrier.entityType,
        operationType: carrierData.carrier.operationType,
        cargoTypes: carrierData.carrier.cargoTypes,
        fleetSize: carrierData.carrier.fleetSize,
        safetyRating: carrierData.carrier.safetyRating
      },
      basics: carrierData.basics,
      alerts: carrierData.alerts,
      riskLevel,
      inspections: carrierData.inspections,
      crashes: carrierData.crashes,
      oosRates: {
        vehicle: {
          rate: carrierData.vehicleOOSPercent ?? null,
          nationalAvg: carrierData.vehicleNationalAvg ?? null
        },
        driver: {
          rate: carrierData.driverOOSPercent ?? null,
          nationalAvg: carrierData.driverNationalAvg ?? null
        }
      },
      crashDetail: carrierData.crashDetail ?? null,
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
  const dotNumber = carrierNumber.replace(/[^0-9]/g, '');

  // Fetch carrier data (SAFER scrape) and violations (DataHub API) in parallel
  const [carrierResult, violationsResult] = await Promise.allSettled([
    fmcsaService.fetchCarrierData(carrierNumber),
    fmcsaInspectionService.fetchViolationsFromDataHub(dotNumber)
  ]);

  if (carrierResult.status === 'rejected' || !carrierResult.value?.success) {
    throw new AppError('Carrier not found', 404);
  }

  const carrierData = carrierResult.value;

  // Violations are optional — graceful degradation if DataHub fails
  let violations = null;
  if (violationsResult.status === 'fulfilled') {
    violations = classifyViolations(violationsResult.value);
  } else {
    console.warn(`[CSA Checker] DataHub fetch failed for DOT ${dotNumber}: ${violationsResult.reason?.message}`);
  }

  const clientIp = req.ip || req.connection.remoteAddress;

  // Check if lead already exists
  let lead = await Lead.findByEmail(email);

  // Build violation context for AI prompt
  let violationContext = '';
  if (violations && violations.total > 0) {
    violationContext = `\nACTUAL VIOLATION RECORDS (from FMCSA DataHub, pre-classified):
Total violations on record: ${violations.total}
Moving violations: ${violations.movingCount}
Non-moving violations: ${violations.nonMovingCount}
Out-of-service violations: ${violations.oosCount}\n`;

    if (violations.movingCount > 0) {
      violationContext += `\nMOVING VIOLATIONS:\n`;
      violations.movingViolations.forEach(v => {
        violationContext += `- ${v.code} "${v.description}" | Severity: ${v.severityWeight}/10 | ${v.dateStr} (${v.ageMonths}mo ago) | OOS: ${v.isOOS ? 'YES' : 'No'} | ${v.timeDecayNote} | Drops off: ${v.dropOffDate}\n`;
      });
    }

    violationContext += `\nVIOLATIONS BY BASIC CATEGORY:\n`;
    for (const [basic, viols] of Object.entries(violations.byBasic)) {
      const top = viols.slice(0, 5);
      const remaining = viols.length - top.length;
      violationContext += `[${basic}] (${viols.length} total):\n`;
      top.forEach(v => {
        violationContext += `  - ${v.code} "${v.description}" | Sev: ${v.severityWeight} | ${v.isMoving ? 'MOVING' : 'non-moving'} | ${v.ageMonths}mo ago | OOS: ${v.isOOS ? 'YES' : 'No'}\n`;
      });
      if (remaining > 0) {
        violationContext += `  ... and ${remaining} more\n`;
      }
    }
  } else {
    violationContext = `\nNOTE: No individual violation records were available from FMCSA DataHub for this carrier. Base your analysis only on the BASIC percentile scores above. Do not fabricate specific violations.\n`;
  }

  // Generate AI analysis
  let aiAnalysis = null;
  try {
    const aiResponse = await aiService.query('csaAnalyzer', `Analyze this carrier's CSA profile. Write a personalized report based on their actual data.

CARRIER:
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
- Hazmat: ${carrierData.basics.hazmatCompliance ?? 'N/A'}% (80%)
- Driver Fitness: ${carrierData.basics.driverFitness ?? 'N/A'}% (80%)

RECENT HISTORY:
- Inspections (24mo): ${carrierData.inspections.last24Months}
- Crashes (24mo): ${carrierData.crashes.last24Months}
- BASICs Above Threshold: ${carrierData.alerts.count}
${violationContext}
Write your report with these exact section headers (plain text, all caps, on their own line):

THE BOTTOM LINE
[2-3 sentences: their risk level and the single most important thing they need to know]

WHAT I SEE IN YOUR DATA
[Reference their actual violations by code. What patterns stand out? Which BASICs are hurting them and why? If they have moving violations, call each one out by name and date.]

WHAT I WOULD DO
[3-4 specific actions based on THEIR violations — not generic advice. Reference specific codes, dates, and time-decay windows. Example: "That 392.2S speeding from October is worth 5 severity points and drops off in Oct 2027. If the speed limit posting was unclear, a DataQ challenge could remove it now."]

MOVING VIOLATIONS
[If they have moving violations: list each with code, description, date, severity. Explain that an FMCSA-experienced attorney can sometimes get them reclassified or dismissed. If zero moving violations, say "No moving violations on record — that is good news for your Unsafe Driving BASIC."]

DATAQ OPPORTUNITIES
[Which specific violations are worth challenging and what type of challenge. Be honest about which are worth the effort.]`, { maxTokens: 1800 });

    aiAnalysis = {
      content: aiResponse.content,
      generatedAt: new Date()
    };
  } catch (aiError) {
    console.error('AI analysis error:', aiError.message);
    aiAnalysis = {
      content: generateFallbackAnalysis(carrierData, violations),
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

    // Start nurture sequence if email was sent successfully
    if (emailSent && lead) {
      lead.emailSequenceStatus = 'sent_welcome';
      lead.lastEmailSentAt = new Date();
      await lead.save();
    }
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
 * Uses new plain-text section headers matching the AI prompt format
 */
function generateFallbackAnalysis(carrierData, violations) {
  const alerts = carrierData.alerts;
  let analysis = '';

  // THE BOTTOM LINE
  analysis += `THE BOTTOM LINE\n`;
  if (alerts.count === 0) {
    analysis += `No BASICs above FMCSA intervention thresholds. You are in good shape, but staying proactive is what keeps it that way.\n\n`;
  } else if (alerts.count === 1) {
    analysis += `You have 1 BASIC above the intervention threshold. That puts you on FMCSA's radar for a potential investigation. Worth addressing now before it becomes a bigger problem.\n\n`;
  } else {
    analysis += `You have ${alerts.count} BASICs above intervention thresholds. FMCSA may prioritize your company for investigation. This needs immediate attention.\n\n`;
  }

  // WHAT I SEE IN YOUR DATA
  analysis += `WHAT I SEE IN YOUR DATA\n`;
  if (violations && violations.total > 0) {
    analysis += `You have ${violations.total} violations on record. `;
    if (violations.movingCount > 0) {
      analysis += `${violations.movingCount} of those are moving violations, which hit your Unsafe Driving BASIC the hardest.\n`;
    } else {
      analysis += `None are classified as moving violations.\n`;
    }
    const topViols = violations.all
      .sort((a, b) => b.severityWeight - a.severityWeight)
      .slice(0, 5);
    topViols.forEach(v => {
      analysis += `- ${v.code} "${v.description}" (severity: ${v.severityWeight}/10, ${v.ageMonths ?? '?'}mo ago)${v.isMoving ? ' — MOVING' : ''}\n`;
    });
  } else if (alerts.count > 0) {
    alerts.details.forEach(alert => {
      const basicName = fmcsaService.getBasicInfo().find(b => b.key === alert.basic)?.name || alert.basic;
      analysis += `- ${basicName}: ${alert.score}% (threshold: ${alert.threshold}%)\n`;
    });
  } else {
    analysis += `All BASICs are below intervention thresholds.\n`;
  }
  analysis += `\n`;

  // WHAT I WOULD DO
  analysis += `WHAT I WOULD DO\n`;
  analysis += `1. Review your recent inspections and identify violations that may be incorrectly recorded or eligible for a DataQ challenge.\n`;
  analysis += `2. Set up automated monitoring to catch BASIC score changes before they become problems.\n`;
  analysis += `3. Make sure your drivers are doing thorough pre-trip inspections — that is the cheapest way to prevent Vehicle Maintenance violations.\n`;
  analysis += `\n`;

  // MOVING VIOLATIONS
  analysis += `MOVING VIOLATIONS\n`;
  if (violations && violations.movingCount > 0) {
    violations.movingViolations.forEach(v => {
      analysis += `- ${v.code} "${v.description}" | Severity: ${v.severityWeight}/10 | ${v.dateStr} (${v.ageMonths}mo ago) | Drops off: ${v.dropOffDate}\n`;
    });
    analysis += `Moving violations hit the Unsafe Driving BASIC hard. An FMCSA-experienced attorney can sometimes get them reclassified to non-moving or dismissed entirely.\n`;
  } else if (violations && violations.movingCount === 0) {
    analysis += `No moving violations on record — that is good news for your Unsafe Driving BASIC.\n`;
  } else {
    const unsafeDrivingAlert = alerts.details?.find(a => a.basic === 'unsafeDriving');
    if (unsafeDrivingAlert) {
      analysis += `Your Unsafe Driving BASIC is at ${unsafeDrivingAlert.score}% (threshold: ${unsafeDrivingAlert.threshold}%). This category often contains moving violations like speeding and lane changes. Detailed violation records were not available — check your SMS profile on ai.fmcsa.dot.gov for specifics.\n`;
    } else {
      analysis += `No Unsafe Driving concerns detected.\n`;
    }
  }
  analysis += `\n`;

  // DATAQ OPPORTUNITIES
  analysis += `DATAQ OPPORTUNITIES\n`;
  if (alerts.count > 0) {
    alerts.details.forEach(alert => {
      const basicName = fmcsaService.getBasicInfo().find(b => b.key === alert.basic)?.name || alert.basic;
      analysis += `- ${basicName}: ${alert.score}% (threshold: ${alert.threshold}%) — review violations in this category for data errors or procedural issues that could be challenged.\n`;
    });
  } else {
    analysis += `No urgent DataQ opportunities at this time. Keep monitoring your scores.\n`;
  }

  return analysis;
}

/**
 * @route   GET /api/csa-checker/unsubscribe
 * @desc    Unsubscribe a lead from the email nurture sequence (CAN-SPAM)
 * @access  Public
 */
router.get('/unsubscribe', asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(renderUnsubscribePage('Invalid unsubscribe link.', false));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'unsubscribe' || !decoded.email) {
      return res.status(400).send(renderUnsubscribePage('Invalid unsubscribe link.', false));
    }

    const lead = await Lead.findByEmail(decoded.email);
    if (!lead) {
      // Even if lead not found, show success (don't leak info)
      return res.send(renderUnsubscribePage("You've been unsubscribed.", true));
    }

    if (lead.emailSequenceStatus !== 'unsubscribed') {
      lead.emailSequenceStatus = 'unsubscribed';
      await lead.save();
    }

    return res.send(renderUnsubscribePage("You've been unsubscribed. You won't receive further emails from VroomX.", true));
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).send(renderUnsubscribePage('This unsubscribe link has expired. Please contact support@vroomxsafety.com.', false));
    }
    return res.status(400).send(renderUnsubscribePage('Invalid unsubscribe link.', false));
  }
}));

/**
 * Render a simple HTML unsubscribe confirmation page.
 */
function renderUnsubscribePage(message, success) {
  const color = success ? '#16a34a' : '#dc2626';
  const icon = success ? '&#10003;' : '&#10007;';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe - VroomX Safety</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;">
  <div style="background:#fff;border-radius:8px;padding:48px 32px;max-width:440px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="width:64px;height:64px;border-radius:50%;background:${color};color:#fff;font-size:32px;line-height:64px;margin:0 auto 24px;">${icon}</div>
    <h1 style="margin:0 0 12px;font-size:24px;color:#1a2744;">VroomX Safety</h1>
    <p style="margin:0;font-size:16px;color:#4b5563;">${message}</p>
  </div>
</body>
</html>`;
}

module.exports = router;
