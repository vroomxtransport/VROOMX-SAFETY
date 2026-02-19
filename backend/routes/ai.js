const express = require('express');
const router = express.Router();
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { checkAIQueryQuota } = require('../middleware/subscriptionLimits');
const aiService = require('../services/aiService');
const aiUsageService = require('../services/aiUsageService');
const dataQAnalysisService = require('../services/dataQAnalysisService');
const { Violation, Company } = require('../models');

// Rate limiting for AI endpoints (simple in-memory implementation)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    rateLimits.set(userId, { windowStart: now, count: 1 });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
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

// @route   POST /api/ai/regulation-query
// @desc    Ask a compliance regulation question
// @access  Private
router.post('/regulation-query', protect, checkAIQueryQuota, async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question || question.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a question (at least 10 characters)'
      });
    }

    // Rate limiting
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a moment before asking another question.'
      });
    }

    // Build the user message with optional context
    let userMessage = question;
    if (context) {
      userMessage = `Context: ${context}\n\nQuestion: ${question}`;
    }

    // Query the AI
    const response = await aiService.query('regulationAssistant', userMessage);

    // Track usage (fire-and-forget)
    aiUsageService.trackQuery(req.user._id, response.usage?.inputTokens, response.usage?.outputTokens);

    // Parse the response into structured format
    const parsed = aiService.parseRegulationResponse(response.content);

    res.json({
      success: true,
      data: {
        answer: response.content,
        cfrCitations: parsed.cfrCitations,
        actionItems: parsed.actionItems,
        usage: response.usage,
        quota: req.aiQuota
      }
    });
  } catch (error) {
    console.error('Regulation query error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process your question'
    });
  }
});

// @route   POST /api/ai/analyze-dqf
// @desc    Analyze driver qualification file for compliance
// @access  Private
router.post('/analyze-dqf', protect, checkAIQueryQuota, async (req, res) => {
  try {
    const { driverId, driverName, documents, expirationDates } = req.body;

    if (!driverName || !documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide driver name and documents array'
      });
    }

    // Rate limiting
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    const response = await aiService.analyzeDQF({
      driverName,
      documents,
      expirationDates: expirationDates || {}
    });

    // Track usage (fire-and-forget)
    aiUsageService.trackQuery(req.user._id, response.usage?.inputTokens, response.usage?.outputTokens);

    res.json({
      success: true,
      data: {
        analysis: response.content,
        driverId,
        usage: response.usage,
        quota: req.aiQuota
      }
    });
  } catch (error) {
    console.error('DQF analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze driver qualification file'
    });
  }
});

// @route   POST /api/ai/analyze-csa-risk
// @desc    Analyze CSA/SMS risk profile
// @access  Private
router.post('/analyze-csa-risk', protect, checkAIQueryQuota, async (req, res) => {
  try {
    const { violations, currentBASICs, fleetSize } = req.body;

    if (!violations || !Array.isArray(violations)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide violations array'
      });
    }

    // Rate limiting
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    const response = await aiService.analyzeCSARisk({
      violations,
      currentBASICs: currentBASICs || {},
      fleetSize: fleetSize || 1
    });

    // Track usage (fire-and-forget)
    aiUsageService.trackQuery(req.user._id, response.usage?.inputTokens, response.usage?.outputTokens);

    res.json({
      success: true,
      data: {
        analysis: response.content,
        usage: response.usage,
        quota: req.aiQuota
      }
    });
  } catch (error) {
    console.error('CSA analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze CSA risk'
    });
  }
});

// @route   POST /api/ai/generate-dataq
// @desc    Generate DataQ challenge letter
// @access  Private
router.post('/generate-dataq', protect, checkAIQueryQuota, async (req, res) => {
  try {
    const { violation, evidence, reason } = req.body;

    if (!violation || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Please provide violation details and reason for challenge'
      });
    }

    // Rate limiting
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    const response = await aiService.generateDataQChallenge({
      violation,
      evidence: evidence || [],
      reason
    });

    // Track usage (fire-and-forget)
    aiUsageService.trackQuery(req.user._id, response.usage?.inputTokens, response.usage?.outputTokens);

    res.json({
      success: true,
      data: {
        challengeLetter: response.content,
        usage: response.usage,
        quota: req.aiQuota
      }
    });
  } catch (error) {
    console.error('DataQ generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate DataQ challenge'
    });
  }
});

// @route   GET /api/ai/status
// @desc    Check AI service status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    res.json({
      success: true,
      data: {
        configured: hasApiKey,
        features: {
          regulationAssistant: hasApiKey,
          dqfAnalyzer: hasApiKey,
          csaAnalyzer: hasApiKey,
          dataQAssistant: hasApiKey
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check AI service status'
    });
  }
});

// Common compliance questions for suggestions
const SUGGESTED_QUESTIONS = [
  "What documents are required in a Driver Qualification File?",
  "How often do I need to run MVRs on my drivers?",
  "When is a medical card required for CDL drivers?",
  "What are the HOS rules for property-carrying drivers?",
  "How long must I keep driver qualification records?",
  "What triggers a post-accident drug test?",
  "How do I file a DataQ challenge?",
  "What is the random drug testing rate for DOT?",
  "What's the difference between a driver fitness and controlled substances BASIC?",
  "How are CSA/SMS percentiles calculated?"
];

// @route   GET /api/ai/suggested-questions
// @desc    Get suggested compliance questions
// @access  Private
router.get('/suggested-questions', protect, (req, res) => {
  // Return 5 random suggestions
  const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random());
  res.json({
    success: true,
    data: shuffled.slice(0, 5)
  });
});

// ==================== DataQ AI Endpoints ====================

// @route   POST /api/ai/analyze-dataq-opportunities
// @desc    Bulk analyze violations for DataQ challenge opportunities
// @access  Private
router.post('/analyze-dataq-opportunities', protect, checkAIQueryQuota, restrictToCompany, checkPermission('violations', 'view'), async (req, res) => {
  try {
    const { minScore = 40, limit = 20, basic } = req.body;

    // Rate limiting
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    const result = await dataQAnalysisService.identifyChallengeableViolations(
      req.companyFilter.companyId,
      { minScore, limit, basic }
    );

    // Track usage (fire-and-forget) - local analysis, minimal tokens
    aiUsageService.trackQuery(req.user._id, 0, 0);

    res.json({
      success: true,
      data: result,
      quota: req.aiQuota
    });
  } catch (error) {
    console.error('DataQ opportunities analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze DataQ opportunities'
    });
  }
});

// @route   POST /api/ai/analyze-violation/:id
// @desc    Deep AI analysis of a single violation for DataQ challenge
// @access  Private
router.post('/analyze-violation/:id', protect, checkAIQueryQuota, restrictToCompany, checkPermission('violations', 'view'), async (req, res) => {
  try {
    const { id } = req.params;

    // Rate limiting
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    // Fetch the violation
    const violation = await Violation.findOne({
      _id: id,
      ...req.companyFilter
    })
      .populate('driverId', 'firstName lastName employeeId')
      .populate('vehicleId', 'unitNumber vin');

    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }

    // Get company info for the letter
    const company = await Company.findById(req.companyFilter.companyId);

    // Get the basic scoring analysis first
    const basicAnalysis = dataQAnalysisService.analyzeViolationChallengeability(violation);

    // If AI is configured, get deep AI analysis
    let aiAnalysis = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const aiResult = await aiService.analyzeDataQChallenge({
          violation: violation.toObject(),
          companyInfo: company ? {
            dotNumber: company.dotNumber,
            name: company.name
          } : null
        });
        aiAnalysis = aiResult.analysis;

        // Track usage when AI is actually called
        aiUsageService.trackQuery(req.user._id, aiResult.usage?.inputTokens, aiResult.usage?.outputTokens);
      } catch (aiError) {
        console.error('AI analysis failed:', aiError.message);
        // Continue with basic analysis only
      }
    }

    // Save the analysis to the violation
    await dataQAnalysisService.saveAnalysisToViolation(id, basicAnalysis);

    res.json({
      success: true,
      data: {
        violation: {
          _id: violation._id,
          violationDate: violation.violationDate,
          violationType: violation.violationType,
          violationCode: violation.violationCode,
          description: violation.description,
          basic: violation.basic,
          severityWeight: violation.severityWeight,
          outOfService: violation.outOfService,
          inspectionNumber: violation.inspectionNumber,
          location: violation.location,
          driver: violation.driverId,
          vehicle: violation.vehicleId
        },
        basicAnalysis,
        aiAnalysis,
        quota: req.aiQuota
      }
    });
  } catch (error) {
    console.error('Single violation analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze violation'
    });
  }
});

// @route   POST /api/ai/generate-dataq-letter/:id
// @desc    Generate a professional DataQ challenge letter for a violation
// @access  Private
router.post('/generate-dataq-letter/:id', protect, checkAIQueryQuota, restrictToCompany, checkPermission('violations', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { challengeType, rdrType, reason, evidenceList } = req.body;

    if (!challengeType || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Challenge type and reason are required'
      });
    }

    // Rate limiting
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.'
      });
    }

    // Fetch the violation
    const violation = await Violation.findOne({
      _id: id,
      ...req.companyFilter
    })
      .populate('driverId', 'firstName lastName employeeId')
      .populate('vehicleId', 'unitNumber vin');

    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found'
      });
    }

    // Get company info
    const company = await Company.findById(req.companyFilter.companyId);

    // Generate the letter using AI
    const letterResult = await aiService.generateDataQLetter({
      violation: violation.toObject(),
      challengeType,
      rdrType,
      reason,
      companyInfo: company ? {
        name: company.name,
        dotNumber: company.dotNumber,
        address: company.address ? `${company.address.street || ''}, ${company.address.city || ''}, ${company.address.state || ''} ${company.address.zip || ''}` : null,
        email: company.email,
        phone: company.phone
      } : null,
      evidenceList: evidenceList || []
    });

    // Track usage (fire-and-forget)
    aiUsageService.trackQuery(req.user._id, letterResult.usage?.inputTokens, letterResult.usage?.outputTokens);

    // Save the generated letter to the violation
    await dataQAnalysisService.saveGeneratedLetter(id, {
      content: letterResult.letter,
      challengeType,
      rdrType
    });

    res.json({
      success: true,
      data: {
        letter: letterResult.letter,
        challengeType,
        generatedAt: new Date(),
        usage: letterResult.usage,
        quota: req.aiQuota
      }
    });
  } catch (error) {
    console.error('DataQ letter generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate DataQ letter'
    });
  }
});

// ─── Compliance Report Routes ────────────────────────────────────────────────

const complianceReportService = require('../services/complianceReportService');

// @route   POST /api/ai/compliance-report
// @desc    Generate AI compliance analysis report
// @access  Private
router.post('/compliance-report', protect, checkAIQueryQuota, async (req, res) => {
  try {
    const companyId = req.companyFilter?.companyId || req.user.activeCompanyId;

    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No active company' });
    }

    console.log(`[AI Compliance Report] Generating for company ${companyId}`);
    const report = await complianceReportService.generateReport(companyId, req.user._id);

    // Track usage
    if (report.aiTokensUsed) {
      aiUsageService.trackQuery(req.user._id, report.aiTokensUsed, 0);
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('[AI Compliance Report] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate compliance report'
    });
  }
});

// @route   GET /api/ai/compliance-report/latest
// @desc    Get most recent compliance report
// @access  Private
router.get('/compliance-report/latest', protect, async (req, res) => {
  try {
    const companyId = req.companyFilter?.companyId || req.user.activeCompanyId;
    const report = await complianceReportService.getLatest(companyId);

    res.json({
      success: true,
      report: report || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/ai/compliance-report/history
// @desc    Get compliance report history
// @access  Private
router.get('/compliance-report/history', protect, async (req, res) => {
  try {
    const companyId = req.companyFilter?.companyId || req.user.activeCompanyId;
    const reports = await complianceReportService.getHistory(companyId);

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
