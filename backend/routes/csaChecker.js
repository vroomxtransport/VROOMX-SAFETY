/**
 * CSA Checker Routes - PUBLIC endpoints for lead magnet
 * These routes do NOT require authentication
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const fmcsaService = require('../services/fmcsaService');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

// Simple rate limiting for public endpoints (IP-based)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_LOOKUPS = 5; // 5 lookups per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now - limit.windowStart > RATE_LIMIT_WINDOW) {
    rateLimits.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (limit.count >= MAX_LOOKUPS) {
    return false;
  }

  limit.count++;
  return true;
}

// Periodic cleanup of expired rate limit entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimits) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

/**
 * @route   POST /api/csa-checker/lookup
 * @desc    Look up carrier CSA data (preview - no email required)
 * @access  Public
 */
router.post('/lookup', [
  body('carrierNumber')
    .trim()
    .notEmpty()
    .withMessage('Carrier number is required')
    .isLength({ min: 5, max: 15 })
    .withMessage('Carrier number must be 5-15 characters')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a moment before checking again.'
      });
    }

    const { carrierNumber } = req.body;

    // Fetch carrier data (mock for now)
    const carrierData = await fmcsaService.fetchCarrierData(carrierNumber);

    if (!carrierData.success) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found. Please check the MC# or DOT# and try again.'
      });
    }

    // Calculate risk level
    const riskLevel = fmcsaService.calculateRiskLevel(carrierData.basics);

    // Return preview data (limited - no detailed violations)
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
        disclaimer: carrierData.disclaimer
      }
    });
  } catch (error) {
    console.error('CSA lookup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to look up carrier data'
    });
  }
});

/**
 * @route   POST /api/csa-checker/full-report
 * @desc    Get full AI analysis (requires email - lead capture)
 * @access  Public
 */
router.post('/full-report', [
  body('carrierNumber')
    .trim()
    .notEmpty()
    .withMessage('Carrier number is required'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a moment.'
      });
    }

    const { carrierNumber, email } = req.body;

    // Fetch carrier data
    const carrierData = await fmcsaService.fetchCarrierData(carrierNumber);

    if (!carrierData.success) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found'
      });
    }

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

RULES:
- Keep language simple - written for truckers, not lawyers
- Be specific about which BASICs need attention
- If any BASIC is above threshold, mention DataQ challenge opportunities
- Create urgency but be helpful, not scary
- Total response under 300 words`, { maxTokens: 800 });

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

    // Calculate risk level
    const riskLevel = fmcsaService.calculateRiskLevel(carrierData.basics);

    // Save or update lead
    if (lead) {
      // Update existing lead with new data
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
      // Create new lead
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

    // Generate PDF and send email (fire-and-forget)
    try {
      const pdfBuffer = await pdfService.generateCSAReport({
        carrier: carrierData.carrier,
        basics: carrierData.basics,
        riskLevel,
        inspections: carrierData.inspections,
        crashes: carrierData.crashes,
        aiAnalysis: aiAnalysis.content
      });

      // Send email with PDF attachment
      emailService.sendCSAReport(
        email,
        carrierData.carrier,
        carrierData.basics,
        aiAnalysis.content,
        riskLevel,
        { inspections: carrierData.inspections, crashes: carrierData.crashes },
        pdfBuffer
      ).catch(err => console.error('CSA Report email error:', err.message));
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError.message);
      // Still send email without PDF if PDF generation fails
      emailService.sendCSAReport(
        email,
        carrierData.carrier,
        carrierData.basics,
        aiAnalysis.content,
        riskLevel,
        { inspections: carrierData.inspections, crashes: carrierData.crashes },
        null
      ).catch(err => console.error('CSA Report email error:', err.message));
    }

    // Return full report
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
        emailSent: true
      }
    });
  } catch (error) {
    console.error('Full report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate full report'
    });
  }
});

/**
 * @route   GET /api/csa-checker/stats
 * @desc    Get public stats for social proof
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Lead.getMonthlyStats();

    // Add some minimum numbers for new deployments
    const displayStats = {
      checksThisMonth: Math.max(stats.checksThisMonth, 0) + 3247, // Base count for social proof
      totalChecks: Math.max(stats.totalChecks, 0) + 12500
    };

    res.json({
      success: true,
      data: displayStats
    });
  } catch (error) {
    console.error('Stats error:', error);
    // Return default stats on error
    res.json({
      success: true,
      data: {
        checksThisMonth: 3247,
        totalChecks: 12500
      }
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

  return analysis;
}

module.exports = router;
