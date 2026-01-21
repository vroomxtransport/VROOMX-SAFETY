/**
 * FMCSA Lookup Routes - Public endpoints for carrier lookup
 * Used for registration auto-fill and quick carrier verification
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const fmcsaService = require('../services/fmcsaService');

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

module.exports = router;
