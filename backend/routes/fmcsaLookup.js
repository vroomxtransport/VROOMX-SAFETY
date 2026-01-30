/**
 * FMCSA Lookup Routes - Public endpoints for carrier lookup
 * Used for registration auto-fill and quick carrier verification
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const fmcsaService = require('../services/fmcsaService');
const fmcsaViolationService = require('../services/fmcsaViolationService');
const { protect, restrictToCompany } = require('../middleware/auth');

// Rate limit: 10 lookups per minute per IP (prevent abuse)
const lookupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: 'Too many lookup requests. Please wait a minute and try again.'
  }
});

/**
 * @route   GET /api/fmcsa/lookup/:dotNumber
 * @desc    Quick carrier lookup for registration auto-fill
 * @access  Public (rate limited)
 */
router.get('/lookup/:dotNumber', lookupLimiter, async (req, res) => {
  try {
    const { dotNumber } = req.params;

    // Validate DOT number format
    const cleaned = dotNumber.replace(/[^0-9]/g, '');
    if (!cleaned || cleaned.length < 5 || cleaned.length > 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid DOT number format. Must be 5-8 digits.'
      });
    }

    // Fetch carrier data from FMCSA
    const result = await fmcsaService.lookupCarrierForRegistration(cleaned);

    if (!result || !result.carrier) {
      return res.status(404).json({
        success: false,
        message: 'Carrier not found in FMCSA database. Please verify your DOT number.'
      });
    }

    // Return carrier info for auto-fill
    res.json({
      success: true,
      carrier: {
        legalName: result.carrier.legalName,
        dbaName: result.carrier.dbaName,
        dotNumber: result.carrier.dotNumber,
        mcNumber: result.carrier.mcNumber,
        address: result.carrier.address,
        phone: result.carrier.phone,
        operatingStatus: result.carrier.operatingStatus,
        fleetSize: result.carrier.fleetSize
      },
      fetchedAt: result.fetchedAt,
      dataSource: result.dataSource
    });
  } catch (error) {
    console.error('[FMCSA Lookup] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch carrier data. Please try again or enter your information manually.'
    });
  }
});

/**
 * @route   GET /api/fmcsa/verify/:dotNumber
 * @desc    Verify if a DOT number exists (lighter check)
 * @access  Public (rate limited)
 */
router.get('/verify/:dotNumber', lookupLimiter, async (req, res) => {
  try {
    const { dotNumber } = req.params;

    const cleaned = dotNumber.replace(/[^0-9]/g, '');
    if (!cleaned || cleaned.length < 5 || cleaned.length > 8) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid DOT number format'
      });
    }

    const result = await fmcsaService.lookupCarrierForRegistration(cleaned);

    res.json({
      success: true,
      valid: !!result?.carrier?.legalName,
      operatingStatus: result?.carrier?.operatingStatus || null,
      legalName: result?.carrier?.legalName || null
    });
  } catch (error) {
    res.json({
      success: true,
      valid: false,
      message: 'Unable to verify'
    });
  }
});

// =============================================================================
// AUTHENTICATED ROUTES - Require login and company context
// =============================================================================

// Rate limit for sync: 5 per hour per company
const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req, res) => req.companyFilter?.companyId?.toString() || ipKeyGenerator(req, res),
  message: {
    success: false,
    message: 'Sync limit reached. You can sync again in 1 hour.'
  }
});

/**
 * @route   GET /api/fmcsa/inspections
 * @desc    Get FMCSA inspection history for company
 * @access  Private
 */
router.get('/inspections', protect, restrictToCompany, async (req, res) => {
  try {
    const { page = 1, limit = 20, dateFrom, dateTo, state, hasViolations } = req.query;

    const result = await fmcsaViolationService.getInspections(req.companyFilter.companyId, {
      page: parseInt(page),
      limit: parseInt(limit),
      dateFrom,
      dateTo,
      state,
      hasViolations: hasViolations === 'true' ? true : hasViolations === 'false' ? false : undefined
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[FMCSA Inspections] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inspection history'
    });
  }
});

/**
 * @route   GET /api/fmcsa/inspections/summary
 * @desc    Get violation summary by BASIC category
 * @access  Private
 */
router.get('/inspections/summary', protect, restrictToCompany, async (req, res) => {
  try {
    const summary = await fmcsaViolationService.getViolationSummary(req.companyFilter.companyId);

    res.json({
      success: true,
      ...summary
    });
  } catch (error) {
    console.error('[FMCSA Summary] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violation summary'
    });
  }
});

/**
 * @route   GET /api/fmcsa/sync-status
 * @desc    Get last sync timestamp and status
 * @access  Private
 */
router.get('/sync-status', protect, restrictToCompany, async (req, res) => {
  try {
    const status = await fmcsaViolationService.getSyncStatus(req.companyFilter.companyId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('[FMCSA Sync Status] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status'
    });
  }
});

/**
 * @route   POST /api/fmcsa/sync-violations
 * @desc    Trigger manual sync of violations from FMCSA
 * @access  Private (rate limited)
 */
router.post('/sync-violations', protect, restrictToCompany, syncLimiter, async (req, res) => {
  try {
    const { forceRefresh = false } = req.body;

    // Start sync (can take 30-60 seconds for large carriers)
    const result = await fmcsaViolationService.syncViolationHistory(req.companyFilter.companyId, forceRefresh);

    res.json({
      success: result.success,
      message: result.message,
      imported: result.imported,
      updated: result.updated,
      total: result.total
    });
  } catch (error) {
    console.error('[FMCSA Sync] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sync failed: ' + error.message
    });
  }
});

module.exports = router;
