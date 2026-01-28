const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');

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
router.post('/regulation-query', protect, async (req, res) => {
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

    // Parse the response into structured format
    const parsed = aiService.parseRegulationResponse(response.content);

    res.json({
      success: true,
      data: {
        answer: response.content,
        cfrCitations: parsed.cfrCitations,
        actionItems: parsed.actionItems,
        usage: response.usage
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
router.post('/analyze-dqf', protect, async (req, res) => {
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

    res.json({
      success: true,
      data: {
        analysis: response.content,
        driverId,
        usage: response.usage
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
router.post('/analyze-csa-risk', protect, async (req, res) => {
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

    res.json({
      success: true,
      data: {
        analysis: response.content,
        usage: response.usage
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
router.post('/generate-dataq', protect, async (req, res) => {
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

    res.json({
      success: true,
      data: {
        challengeLetter: response.content,
        usage: response.usage
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

module.exports = router;
