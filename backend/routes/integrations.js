const express = require('express');
const router = express.Router();
const { protect, restrictToCompany, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Integration = require('../models/Integration');
const samsaraService = require('../services/samsaraService');
const auditService = require('../services/auditService');

// All routes require authentication and company context
router.use(protect);
router.use(restrictToCompany);

/**
 * @route   GET /api/integrations/samsara/status
 * @desc    Get Samsara integration status for current company
 * @access  Private
 */
router.get('/samsara/status', asyncHandler(async (req, res) => {
  const integration = await Integration.findOne({
    companyId: req.companyFilter.companyId,
    provider: 'samsara'
  });

  if (!integration) {
    return res.json({
      connected: false,
      lastSync: null,
      syncInProgress: false,
      error: null,
      stats: { drivers: 0, vehicles: 0, hosLogs: 0 }
    });
  }

  res.json({
    connected: integration.status === 'active' || integration.status === 'error',
    status: integration.status,
    lastSync: integration.lastSyncAt,
    syncInProgress: integration.syncInProgress,
    error: integration.error,
    stats: integration.stats,
    syncConfig: integration.syncConfig,
    metadata: integration.metadata
  });
}));

/**
 * @route   POST /api/integrations/samsara/connect
 * @desc    Connect Samsara integration with API key
 * @access  Private (Owner/Admin only)
 */
router.post('/samsara/connect', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ message: 'API key is required' });
  }

  // Validate the API key with Samsara
  const validation = await samsaraService.validateApiKey(apiKey);

  if (!validation.valid) {
    return res.status(401).json({ message: validation.message });
  }

  // Check if integration already exists
  let integration = await Integration.findOne({
    companyId: req.companyFilter.companyId,
    provider: 'samsara'
  });

  if (integration) {
    // Update existing integration
    integration.apiKey = apiKey; // Will be encrypted by pre-save hook
    integration.status = 'active';
    integration.error = null;
    integration.metadata.lastValidatedAt = new Date();
    await integration.save();
  } else {
    // Create new integration
    integration = await Integration.create({
      companyId: req.companyFilter.companyId,
      provider: 'samsara',
      apiKey: apiKey, // Will be encrypted by pre-save hook
      status: 'active',
      metadata: {
        connectedAt: new Date(),
        lastValidatedAt: new Date()
      }
    });
  }

  // Audit log
  auditService.log(req, 'INTEGRATION_CONNECTED', 'Integration', integration._id, {
    provider: 'samsara'
  });

  res.json({
    success: true,
    message: 'Successfully connected to Samsara',
    status: integration.status
  });
}));

/**
 * @route   POST /api/integrations/samsara/disconnect
 * @desc    Disconnect Samsara integration
 * @access  Private (Owner/Admin only)
 */
router.post('/samsara/disconnect', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const integration = await Integration.findOne({
    companyId: req.companyFilter.companyId,
    provider: 'samsara'
  });

  if (!integration) {
    return res.status(404).json({ message: 'No Samsara integration found' });
  }

  // Mark as disconnected (keep record for history)
  integration.status = 'disconnected';
  integration.apiKey = null;
  integration.error = null;
  await integration.save();

  // Audit log
  auditService.log(req, 'INTEGRATION_DISCONNECTED', 'Integration', integration._id, {
    provider: 'samsara'
  });

  res.json({
    success: true,
    message: 'Samsara disconnected successfully'
  });
}));

/**
 * @route   POST /api/integrations/samsara/sync
 * @desc    Trigger manual sync with Samsara
 * @access  Private (Owner/Admin only)
 */
router.post('/samsara/sync', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const integration = await Integration.findOne({
    companyId: req.companyFilter.companyId,
    provider: 'samsara',
    status: { $in: ['active', 'error'] }
  });

  if (!integration) {
    return res.status(404).json({ message: 'No active Samsara integration found' });
  }

  if (integration.syncInProgress) {
    return res.status(409).json({ message: 'Sync already in progress' });
  }

  // Mark sync as in progress
  integration.syncInProgress = true;
  integration.status = 'syncing';
  await integration.save();

  // Start sync in background (don't await)
  (async () => {
    try {
      const results = await samsaraService.syncAll(integration, integration.syncConfig);
      await integration.updateStats(results);

      // Audit log
      auditService.log(req, 'INTEGRATION_SYNCED', 'Integration', integration._id, {
        provider: 'samsara',
        results
      });
    } catch (error) {
      console.error('Samsara sync error:', error);
      await integration.setError(error.message);
    }
  })();

  res.json({
    success: true,
    message: 'Sync started'
  });
}));

/**
 * @route   PUT /api/integrations/samsara/settings
 * @desc    Update Samsara sync settings
 * @access  Private (Owner/Admin only)
 */
router.put('/samsara/settings', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { syncDrivers, syncVehicles, syncHOS, autoSync, syncInterval } = req.body;

  const integration = await Integration.findOne({
    companyId: req.companyFilter.companyId,
    provider: 'samsara'
  });

  if (!integration) {
    return res.status(404).json({ message: 'No Samsara integration found' });
  }

  // Update sync config
  if (typeof syncDrivers === 'boolean') integration.syncConfig.syncDrivers = syncDrivers;
  if (typeof syncVehicles === 'boolean') integration.syncConfig.syncVehicles = syncVehicles;
  if (typeof syncHOS === 'boolean') integration.syncConfig.syncHOS = syncHOS;
  if (typeof autoSync === 'boolean') integration.syncConfig.autoSync = autoSync;
  if (syncInterval) integration.syncConfig.syncInterval = syncInterval;

  await integration.save();

  // Audit log
  auditService.log(req, 'INTEGRATION_SETTINGS_UPDATED', 'Integration', integration._id, {
    provider: 'samsara',
    syncConfig: integration.syncConfig
  });

  res.json({
    success: true,
    message: 'Settings updated',
    syncConfig: integration.syncConfig
  });
}));

/**
 * @route   GET /api/integrations/samsara/pending
 * @desc    Get pending (unmatched) Samsara records
 * @access  Private
 */
router.get('/samsara/pending', asyncHandler(async (req, res) => {
  const pending = await samsaraService.getPendingRecords(req.companyFilter.companyId);
  res.json(pending);
}));

/**
 * @route   POST /api/integrations/samsara/match
 * @desc    Match a Samsara record to an existing VroomX record
 * @access  Private (Owner/Admin only)
 */
router.post('/samsara/match', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { samsaraRecordId, vroomxRecordId, recordType } = req.body;

  if (!samsaraRecordId || !vroomxRecordId || !recordType) {
    return res.status(400).json({ message: 'samsaraRecordId, vroomxRecordId, and recordType are required' });
  }

  const result = await samsaraService.matchRecord(samsaraRecordId, vroomxRecordId, recordType);

  // Audit log
  auditService.log(req, 'SAMSARA_RECORD_MATCHED', recordType === 'driver' ? 'Driver' : 'Vehicle', vroomxRecordId, {
    samsaraRecordId,
    samsaraId: result.samsaraRecord.samsaraId
  });

  res.json({
    success: true,
    message: `${recordType} matched successfully`,
    record: result.vroomxRecord
  });
}));

/**
 * @route   POST /api/integrations/samsara/create
 * @desc    Create a new VroomX record from Samsara data
 * @access  Private (Owner/Admin only)
 */
router.post('/samsara/create', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { samsaraRecordId, additionalData } = req.body;

  if (!samsaraRecordId) {
    return res.status(400).json({ message: 'samsaraRecordId is required' });
  }

  const newRecord = await samsaraService.createFromSamsara(
    samsaraRecordId,
    req.companyFilter.companyId,
    additionalData || {}
  );

  // Audit log
  const resourceType = newRecord.firstName ? 'Driver' : 'Vehicle';
  auditService.log(req, 'SAMSARA_RECORD_CREATED', resourceType, newRecord._id, {
    samsaraRecordId,
    createdFrom: 'samsara'
  });

  res.json({
    success: true,
    message: `${resourceType} created successfully`,
    record: newRecord
  });
}));

/**
 * @route   POST /api/integrations/samsara/skip
 * @desc    Skip a Samsara record (don't import)
 * @access  Private (Owner/Admin only)
 */
router.post('/samsara/skip', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { samsaraRecordId } = req.body;

  if (!samsaraRecordId) {
    return res.status(400).json({ message: 'samsaraRecordId is required' });
  }

  const SamsaraRecord = require('../models/SamsaraRecord');
  const record = await SamsaraRecord.findByIdAndUpdate(
    samsaraRecordId,
    { status: 'skipped' },
    { new: true }
  );

  if (!record) {
    return res.status(404).json({ message: 'Samsara record not found' });
  }

  res.json({
    success: true,
    message: 'Record skipped'
  });
}));

module.exports = router;
