const express = require('express');
const router = express.Router();
const { Violation, Driver, Vehicle, Company } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const openaiVisionService = require('../services/openaiVisionService');
const documentIntelligenceService = require('../services/documentIntelligenceService');
const aiService = require('../services/aiService');
const { lookupViolationCode, getViolationsByBasic, getOOSViolations, VIOLATION_CODES } = require('../config/violationCodes');
const fmcsaInspectionService = require('../services/fmcsaInspectionService');
const fs = require('fs').promises;

router.use(protect);
router.use(restrictToCompany);

// ============================================================================
// FMCSA Inspection History Routes (from SaferWebAPI or stored records)
// ============================================================================

// @route   GET /api/inspections/fmcsa/stats
// @desc    Get inspection statistics
// @access  Private
// NOTE: Named routes must come BEFORE parameterized routes
router.get('/fmcsa/stats', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const stats = await fmcsaInspectionService.getInspectionStats(companyId);

  res.json({
    success: true,
    stats
  });
}));

// @route   GET /api/inspections/fmcsa/violations
// @desc    Get all violations from stored inspections
// @access  Private
router.get('/fmcsa/violations', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const { page, limit, basic, oosOnly } = req.query;

  const result = await fmcsaInspectionService.getViolations(companyId, {
    page, limit, basic, oosOnly
  });

  res.json({
    success: true,
    ...result
  });
}));

// @route   GET /api/inspections/fmcsa/recent
// @desc    Get recent inspections (for dashboard)
// @access  Private
router.get('/fmcsa/recent', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const limit = parseInt(req.query.limit) || 5;

  const inspections = await fmcsaInspectionService.getRecentInspections(companyId, limit);

  res.json({
    success: true,
    inspections
  });
}));

// @route   POST /api/inspections/fmcsa/sync
// @desc    Sync inspection records from SaferWebAPI
// @access  Private
router.post('/fmcsa/sync', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const result = await fmcsaInspectionService.syncFromSaferWebAPI(companyId);

  res.json({
    success: result.success,
    message: result.message,
    imported: result.imported
  });
}));

// @route   POST /api/inspections/fmcsa/sync-violations
// @desc    Sync violation details from FMCSA DataHub SMS dataset
// @access  Private
router.post('/fmcsa/sync-violations', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const result = await fmcsaInspectionService.syncViolationsFromDataHub(companyId);

  res.json({
    success: result.success,
    message: result.message,
    matched: result.matched,
    total: result.total,
    violationCount: result.violationCount,
    dataqCreated: result.dataqCreated || 0
  });
}));

// @route   POST /api/inspections/fmcsa/sync-all
// @desc    Sync both inspections and violation details
// @access  Private
router.post('/fmcsa/sync-all', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const result = await fmcsaInspectionService.syncAllFromDataHub(companyId);

  res.json({
    success: result.success,
    message: result.message,
    inspections: result.inspections,
    violations: result.violations
  });
}));

// @route   GET /api/inspections/fmcsa/by-basic/:basic
// @desc    Get inspections by BASIC category
// @access  Private
router.get('/fmcsa/by-basic/:basic', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const inspections = await fmcsaInspectionService.getInspectionsByBasic(companyId, req.params.basic);

  res.json({
    success: true,
    count: inspections.length,
    inspections
  });
}));

// @route   GET /api/inspections/fmcsa
// @desc    Get all FMCSA inspections with filters and pagination
// @access  Private
router.get('/fmcsa', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const {
    page, limit, basic, oosOnly, startDate, endDate, level, sortBy, sortOrder
  } = req.query;

  const result = await fmcsaInspectionService.getInspections(companyId, {
    page, limit, basic, oosOnly, startDate, endDate, level, sortBy, sortOrder
  });

  res.json({
    success: true,
    ...result
  });
}));

// @route   GET /api/inspections/fmcsa/:id
// @desc    Get a single FMCSA inspection by ID
// @access  Private
router.get('/fmcsa/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const inspection = await fmcsaInspectionService.getInspectionById(companyId, req.params.id);

  if (!inspection) {
    throw new AppError('Inspection not found', 404);
  }

  res.json({
    success: true,
    inspection
  });
}));

// @route   DELETE /api/inspections/fmcsa/:id
// @desc    Delete an FMCSA inspection record
// @access  Private
router.delete('/fmcsa/:id', checkPermission('violations', 'delete'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;
  const success = await fmcsaInspectionService.deleteInspection(companyId, req.params.id);

  if (!success) {
    throw new AppError('Inspection not found', 404);
  }

  res.json({
    success: true,
    message: 'Inspection deleted'
  });
}));

// ============================================================================
// AI Upload Routes (existing)
// ============================================================================

// @route   POST /api/inspections/upload
// @desc    Upload and process DOT inspection report with AI
// @access  Private
router.post('/upload', checkPermission('violations', 'edit'),
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Please upload an inspection report image or PDF', 400);
    }

    // Check if OpenAI is enabled
    if (!openaiVisionService.isEnabled()) {
      throw new AppError('AI inspection processing is not configured. Please set OPENAI_API_KEY.', 503);
    }

    // Read the file
    const fileBuffer = await fs.readFile(req.file.path);

    // Extract inspection data using GPT-4o Vision
    const extraction = await openaiVisionService.extractDocumentData(fileBuffer, 'inspection_report');

    if (!extraction.success) {
      throw new AppError('Failed to process inspection report', 500);
    }

    const data = extraction.data;

    // Map violation codes to BASICs and get severity
    const mappedViolations = (data.violations || []).map(v => {
      const codeInfo = lookupViolationCode(v.code);
      return {
        originalCode: v.code,
        normalizedCode: codeInfo.code,
        description: v.description || codeInfo.description,
        basic: codeInfo.basic,
        severityWeight: codeInfo.severityBase,
        cfrReference: codeInfo.cfrPart ? `49 CFR ${codeInfo.cfrPart}` : null,
        oosEligible: codeInfo.oosEligible,
        isOutOfService: v.isOutOfService || false,
        unit: v.unit || 'vehicle',
        unknown: codeInfo.unknown || false
      };
    });

    // Determine overall OOS status
    const hasOOSViolation = mappedViolations.some(v => v.isOutOfService);
    const driverOOS = data.oosStatus?.driver || false;
    const vehicleOOS = data.oosStatus?.vehicle || false;

    res.json({
      success: true,
      inspection: {
        reportNumber: data.reportNumber,
        date: data.inspectionDate,
        time: data.inspectionTime,
        location: data.location,
        inspector: data.inspector,
        carrier: data.carrier,
        driver: data.driver,
        vehicle: data.vehicle,
        inspectionLevel: data.inspectionLevel,
        hazmatPlacard: data.hazmatPlacard,
        oosStatus: {
          driver: driverOOS,
          vehicle: vehicleOOS,
          hasOOSViolation
        }
      },
      violations: mappedViolations,
      violationCount: mappedViolations.length,
      oosCount: mappedViolations.filter(v => v.isOutOfService).length,
      confidence: data.confidence,
      needsReview: true,
      message: mappedViolations.length > 0
        ? `Found ${mappedViolations.length} violation(s). Please review before confirming.`
        : 'No violations found on this inspection report.',
      filePath: req.file.path,
      usage: extraction.usage
    });
  })
);

// @route   POST /api/inspections/confirm
// @desc    Confirm extracted violations and create records
// @access  Private
router.post('/confirm', checkPermission('violations', 'edit'),
  asyncHandler(async (req, res) => {
    const {
      inspection,
      violations,
      driverId,
      vehicleId,
      filePath
    } = req.body;

    if (!inspection || !violations) {
      throw new AppError('Inspection data and violations are required', 400);
    }

    const companyId = req.companyFilter.companyId;

    // Verify driver and vehicle belong to company
    if (driverId) {
      const driver = await Driver.findOne({ _id: driverId, companyId });
      if (!driver) {
        throw new AppError('Driver not found or does not belong to this company', 404);
      }
    }

    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });
      if (!vehicle) {
        throw new AppError('Vehicle not found or does not belong to this company', 404);
      }
    }

    // Create violation records
    const createdViolations = await Promise.all(
      violations.map(async (v) => {
        return Violation.create({
          companyId,
          inspectionNumber: inspection.reportNumber,
          violationDate: new Date(inspection.date),
          location: inspection.location,
          basic: v.basic,
          violationType: v.description,
          violationCode: v.normalizedCode || v.originalCode,
          description: v.description,
          severityWeight: v.severityWeight || 5,
          outOfService: v.isOutOfService || false,
          driverId: driverId || null,
          vehicleId: vehicleId || null,
          inspectorName: inspection.inspector?.name,
          inspectorBadge: inspection.inspector?.badge,
          inspectionType: 'roadside',
          status: 'open',
          history: [{
            action: 'created_from_inspection_upload',
            userId: req.user._id,
            date: new Date(),
            notes: `Created from AI-processed inspection report ${inspection.reportNumber}`
          }]
        });
      })
    );

    // Update vehicle with inspection date if provided
    if (vehicleId && inspection.date) {
      await Vehicle.findByIdAndUpdate(vehicleId, {
        'lastRoadsideInspection.date': new Date(inspection.date),
        'lastRoadsideInspection.location': inspection.location?.city
          ? `${inspection.location.city}, ${inspection.location.state}`
          : null,
        'lastRoadsideInspection.result': violations.length > 0 ? 'violations_found' : 'pass',
        'lastRoadsideInspection.oosStatus': inspection.oosStatus?.vehicle
      });
    }

    // Clean up temp file
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdViolations.length} violation record(s)`,
      violations: createdViolations,
      inspection: {
        reportNumber: inspection.reportNumber,
        date: inspection.date
      }
    });
  })
);

// @route   POST /api/inspections/:violationId/dispute
// @desc    Initiate DataQ dispute with AI-drafted letter
// @access  Private
router.post('/:violationId/dispute', checkPermission('violations', 'edit'),
  asyncHandler(async (req, res) => {
    const { reason, challengeType } = req.body;
    const companyId = req.companyFilter.companyId;

    // Find the violation
    const violation = await Violation.findOne({
      _id: req.params.violationId,
      companyId
    }).populate('driverId', 'firstName lastName');

    if (!violation) {
      throw new AppError('Violation not found', 404);
    }

    // Get company info
    const company = await Company.findById(companyId);

    // Use existing AI service to generate DataQ challenge
    const userMessage = `Generate a DataQ challenge letter for the following violation:

CARRIER INFORMATION:
- Carrier Name: ${company.name}
- DOT Number: ${company.dotNumber}
- MC Number: ${company.mcNumber || 'N/A'}

VIOLATION DETAILS:
- Report Number: ${violation.inspectionNumber || 'N/A'}
- Violation Date: ${violation.violationDate?.toLocaleDateString() || 'N/A'}
- Location: ${violation.location?.city ? `${violation.location.city}, ${violation.location.state}` : 'N/A'}
- Violation Code: ${violation.violationCode}
- Description: ${violation.violationType || violation.description}
- Out of Service: ${violation.outOfService ? 'Yes' : 'No'}
${violation.driverId ? `- Driver: ${violation.driverId.firstName} ${violation.driverId.lastName}` : ''}

CHALLENGE REASON:
${reason}

CHALLENGE TYPE: ${challengeType || 'data_error'}

Please provide:
1. A professional DataQ challenge letter
2. Key points to support the challenge
3. Recommended supporting documentation
4. Assessment of challenge success likelihood`;

    const aiResponse = await aiService.query('dataQAssistant', userMessage);

    // Update violation with DataQ challenge started
    violation.dataQChallenge = {
      submitted: false,
      challengeType: challengeType || 'data_error',
      reason: reason,
      status: 'pending',
      supportingDocuments: []
    };
    violation.history.push({
      action: 'dataq_challenge_drafted',
      userId: req.user._id,
      date: new Date(),
      notes: 'AI-generated DataQ challenge letter drafted'
    });
    await violation.save();

    res.json({
      success: true,
      violation: {
        id: violation._id,
        code: violation.violationCode,
        date: violation.violationDate,
        reportNumber: violation.inspectionNumber
      },
      draftLetter: aiResponse.content,
      aiUsage: aiResponse.usage
    });
  })
);

// @route   GET /api/inspections/violation-codes
// @desc    Get all violation codes reference
// @access  Private
router.get('/violation-codes', checkPermission('violations', 'view'), (req, res) => {
  const { basic, oosOnly } = req.query;

  let codes;

  if (oosOnly === 'true') {
    codes = getOOSViolations();
  } else if (basic) {
    codes = getViolationsByBasic(basic);
  } else {
    codes = Object.entries(VIOLATION_CODES).map(([code, details]) => ({
      code,
      ...details
    }));
  }

  res.json({
    success: true,
    count: codes.length,
    codes
  });
});

// @route   POST /api/inspections/lookup-code
// @desc    Lookup a single violation code
// @access  Private
router.post('/lookup-code', checkPermission('violations', 'view'),
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
      throw new AppError('Violation code is required', 400);
    }

    const result = lookupViolationCode(code);

    res.json({
      success: true,
      result
    });
  })
);

// @route   GET /api/inspections/ai-status
// @desc    Check if AI inspection processing is available
// @access  Private
router.get('/ai-status', checkPermission('violations', 'view'), (req, res) => {
  res.json({
    success: true,
    aiEnabled: openaiVisionService.isEnabled(),
    message: openaiVisionService.isEnabled()
      ? 'AI inspection processing is available'
      : 'AI inspection processing is not configured. Set OPENAI_API_KEY to enable.'
  });
});

module.exports = router;
