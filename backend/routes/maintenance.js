const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Vehicle = require('../models/Vehicle');
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadSingle, getFileUrl, deleteFile } = require('../middleware/upload');
const openaiVisionService = require('../services/openaiVisionService');
const auditService = require('../services/auditService');

// Apply authentication to all routes
router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/maintenance
// @desc    Get all maintenance records with filtering
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    vehicleId,
    recordType,
    status,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
    sort = '-serviceDate'
  } = req.query;

  const query = { companyId: req.companyFilter.companyId };

  // Apply filters
  if (vehicleId) query.vehicleId = vehicleId;
  if (recordType) query.recordType = recordType;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.serviceDate = {};
    if (startDate) query.serviceDate.$gte = new Date(startDate);
    if (endDate) query.serviceDate.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { 'provider.name': { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    MaintenanceRecord.find(query)
      .populate('vehicleId', 'unitNumber type make model year licensePlate')
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    MaintenanceRecord.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: records.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    records
  });
}));

// @route   GET /api/maintenance/stats
// @desc    Get maintenance statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  // Get counts by type
  const typeStats = await MaintenanceRecord.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 },
        totalCost: { $sum: '$totalCost' }
      }
    }
  ]);

  // Get monthly spending
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlySpending = await MaintenanceRecord.aggregate([
    {
      $match: {
        companyId,
        serviceDate: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$serviceDate' },
          month: { $month: '$serviceDate' }
        },
        totalCost: { $sum: '$totalCost' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get upcoming services
  const upcomingCount = await MaintenanceRecord.countDocuments({
    companyId,
    nextServiceDate: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Get overdue services
  const overdueCount = await MaintenanceRecord.countDocuments({
    companyId,
    nextServiceDate: { $lt: new Date() }
  });

  // Total costs
  const costSummary = await MaintenanceRecord.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: null,
        totalLaborCost: { $sum: '$laborCost' },
        totalPartsCost: { $sum: '$partsCost' },
        grandTotal: { $sum: '$totalCost' },
        recordCount: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    stats: {
      byType: typeStats,
      monthlySpending,
      upcomingServices: upcomingCount,
      overdueServices: overdueCount,
      costs: costSummary[0] || { totalLaborCost: 0, totalPartsCost: 0, grandTotal: 0, recordCount: 0 }
    }
  });
}));

// @route   GET /api/maintenance/upcoming
// @desc    Get upcoming scheduled services
// @access  Private
router.get('/upcoming', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const companyId = req.companyFilter.companyId;

  const records = await MaintenanceRecord.getUpcomingServices(companyId, parseInt(days));

  res.json({
    success: true,
    count: records.length,
    records
  });
}));

// @route   GET /api/maintenance/overdue
// @desc    Get overdue services
// @access  Private
router.get('/overdue', asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const records = await MaintenanceRecord.getOverdueServices(companyId);

  res.json({
    success: true,
    count: records.length,
    records
  });
}));

// @route   GET /api/maintenance/vehicle/:vehicleId
// @desc    Get maintenance history for a specific vehicle
// @access  Private
router.get('/vehicle/:vehicleId', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  // Verify vehicle belongs to company
  const vehicle = await Vehicle.findOne({
    _id: req.params.vehicleId,
    companyId: req.companyFilter.companyId
  });

  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    MaintenanceRecord.find({ vehicleId: req.params.vehicleId })
      .populate('createdBy', 'firstName lastName')
      .sort('-serviceDate')
      .skip(skip)
      .limit(parseInt(limit)),
    MaintenanceRecord.countDocuments({ vehicleId: req.params.vehicleId })
  ]);

  // Calculate totals for this vehicle
  const costSummary = await MaintenanceRecord.aggregate([
    { $match: { vehicleId: vehicle._id } },
    {
      $group: {
        _id: null,
        totalCost: { $sum: '$totalCost' },
        recordCount: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    vehicle: {
      _id: vehicle._id,
      unitNumber: vehicle.unitNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year
    },
    count: records.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    costSummary: costSummary[0] || { totalCost: 0, recordCount: 0 },
    records
  });
}));

// @route   GET /api/maintenance/:id
// @desc    Get single maintenance record
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  })
    .populate('vehicleId', 'unitNumber type make model year licensePlate vin')
    .populate('createdBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName');

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  res.json({ success: true, record });
}));

// @route   POST /api/maintenance
// @desc    Create new maintenance record
// @access  Private
router.post('/', [
  body('vehicleId').notEmpty().withMessage('Vehicle is required'),
  body('recordType').isIn([
    'preventive_maintenance', 'annual_inspection', 'repair',
    'tire_service', 'brake_service', 'oil_change',
    'dot_inspection', 'roadside_repair', 'recall', 'other'
  ]).withMessage('Valid record type is required'),
  body('serviceDate').isISO8601().withMessage('Valid service date is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Verify vehicle belongs to company
  const vehicle = await Vehicle.findOne({
    _id: req.body.vehicleId,
    companyId: req.companyFilter.companyId
  });

  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  const recordData = {
    ...req.body,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id
  };

  const record = await MaintenanceRecord.create(recordData);

  // Map recordType to maintenanceType for Vehicle.maintenanceLog schema
  const typeMapping = {
    'preventive_maintenance': 'preventive',
    'annual_inspection': 'inspection',
    'repair': 'repair',
    'tire_service': 'repair',
    'brake_service': 'repair',
    'oil_change': 'preventive',
    'dot_inspection': 'inspection',
    'roadside_repair': 'breakdown',
    'recall': 'recall',
    'other': 'repair'
  };

  // Sync to Vehicle's embedded maintenanceLog array
  vehicle.maintenanceLog.push({
    date: record.serviceDate,
    odometer: record.odometerReading,
    maintenanceType: typeMapping[record.recordType] || 'repair',
    description: record.description,
    laborCost: record.laborCost,
    totalCost: record.totalCost,
    vendor: record.provider ? {
      name: record.provider.name,
      phone: record.provider.phone,
      address: record.provider.address
    } : undefined,
    performedBy: record.provider?.mechanic,
    createdBy: req.user._id,
    maintenanceRecordId: record._id  // Reference for linking/syncing
  });

  // Update vehicle's last service date and mileage
  vehicle.lastServiceDate = record.serviceDate;
  if (record.odometerReading) {
    vehicle.currentMileage = record.odometerReading;
  }
  await vehicle.save();

  const populatedRecord = await MaintenanceRecord.findById(record._id)
    .populate('vehicleId', 'unitNumber type make model year')
    .populate('createdBy', 'firstName lastName');

  auditService.log(req, 'create', 'maintenance', record._id, { recordType: req.body.recordType, vehicleId: req.body.vehicleId });

  res.status(201).json({
    success: true,
    message: 'Maintenance record created successfully',
    record: populatedRecord
  });
}));

// ============================================
// AI SMART UPLOAD ENDPOINT
// ============================================

// @route   POST /api/maintenance/smart-upload
// @desc    Upload invoice/work order and extract data using AI
// @access  Private
router.post('/smart-upload', uploadSingle('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = getFileUrl(req.file.path);
  const filePath = req.file.path;

  try {
    // Use OpenAI Vision to extract data from the invoice/work order
    const extractedData = await openaiVisionService.extractMaintenanceData(filePath);

    res.json({
      success: true,
      message: 'Data extracted successfully',
      extractedData,
      uploadedFile: {
        name: req.file.originalname,
        url: fileUrl,
        type: 'invoice'
      }
    });
  } catch (error) {
    console.error('AI extraction error:', error);
    // Still return the file URL even if AI extraction fails
    res.json({
      success: true,
      message: 'File uploaded but AI extraction failed. Please fill in details manually.',
      extractedData: null,
      uploadedFile: {
        name: req.file.originalname,
        url: fileUrl,
        type: 'invoice'
      },
      error: error.message
    });
  }
}));

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance record
// @access  Private
router.put('/:id', asyncHandler(async (req, res) => {
  let record = await MaintenanceRecord.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  req.body.lastUpdatedBy = req.user._id;

  record = await MaintenanceRecord.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('vehicleId', 'unitNumber type make model year')
    .populate('createdBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName');

  // Sync update to Vehicle's embedded maintenanceLog array
  const vehicle = await Vehicle.findById(record.vehicleId._id || record.vehicleId);
  if (vehicle) {
    // Map recordType to maintenanceType
    const typeMapping = {
      'preventive_maintenance': 'preventive',
      'annual_inspection': 'inspection',
      'repair': 'repair',
      'tire_service': 'repair',
      'brake_service': 'repair',
      'oil_change': 'preventive',
      'dot_inspection': 'inspection',
      'roadside_repair': 'breakdown',
      'recall': 'recall',
      'other': 'repair'
    };

    // Find and update the matching entry in maintenanceLog
    const logIndex = vehicle.maintenanceLog.findIndex(
      log => log.maintenanceRecordId?.toString() === req.params.id
    );

    if (logIndex !== -1) {
      vehicle.maintenanceLog[logIndex] = {
        ...vehicle.maintenanceLog[logIndex].toObject(),
        date: record.serviceDate,
        odometer: record.odometerReading,
        maintenanceType: typeMapping[record.recordType] || 'repair',
        description: record.description,
        laborCost: record.laborCost,
        totalCost: record.totalCost,
        vendor: record.provider ? {
          name: record.provider.name,
          phone: record.provider.phone,
          address: record.provider.address
        } : undefined,
        performedBy: record.provider?.mechanic,
        maintenanceRecordId: record._id
      };
      await vehicle.save();
    }
  }

  auditService.log(req, 'update', 'maintenance', req.params.id, { summary: 'Maintenance record updated' });

  res.json({
    success: true,
    message: 'Maintenance record updated successfully',
    record
  });
}));

// @route   DELETE /api/maintenance/:id
// @desc    Delete maintenance record
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  // Remove from Vehicle's embedded maintenanceLog array
  const vehicle = await Vehicle.findById(record.vehicleId);
  if (vehicle) {
    vehicle.maintenanceLog = vehicle.maintenanceLog.filter(
      log => log.maintenanceRecordId?.toString() !== req.params.id
    );
    await vehicle.save();
  }

  await MaintenanceRecord.findByIdAndDelete(req.params.id);

  auditService.log(req, 'delete', 'maintenance', req.params.id, { vehicleId: record.vehicleId });

  res.json({
    success: true,
    message: 'Maintenance record deleted successfully'
  });
}));

// @route   POST /api/maintenance/:id/defects/:defectIndex/correct
// @desc    Mark a defect as corrected
// @access  Private
router.post('/:id/defects/:defectIndex/correct', asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  const defectIndex = parseInt(req.params.defectIndex);
  if (!record.defectsFound || !record.defectsFound[defectIndex]) {
    return res.status(404).json({ success: false, message: 'Defect not found' });
  }

  record.defectsFound[defectIndex].corrected = true;
  record.defectsFound[defectIndex].correctedDate = new Date();
  record.lastUpdatedBy = req.user._id;

  await record.save();

  res.json({
    success: true,
    message: 'Defect marked as corrected',
    record
  });
}));

// @route   GET /api/maintenance/export/vehicle/:vehicleId
// @desc    Export maintenance history for a vehicle (CSV)
// @access  Private
router.get('/export/vehicle/:vehicleId', asyncHandler(async (req, res) => {
  // Verify vehicle belongs to company
  const vehicle = await Vehicle.findOne({
    _id: req.params.vehicleId,
    companyId: req.companyFilter.companyId
  });

  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  const records = await MaintenanceRecord.find({ vehicleId: req.params.vehicleId })
    .populate('createdBy', 'firstName lastName')
    .sort('-serviceDate');

  // Generate CSV
  const headers = [
    'Date', 'Type', 'Description', 'Odometer', 'Provider',
    'Labor Cost', 'Parts Cost', 'Total Cost', 'Next Service Date', 'Notes'
  ];

  const rows = records.map(r => [
    r.serviceDate.toISOString().split('T')[0],
    r.recordType.replace(/_/g, ' '),
    `"${(r.description || '').replace(/"/g, '""')}"`,
    r.odometerReading || '',
    `"${(r.provider?.name || '').replace(/"/g, '""')}"`,
    r.laborCost || 0,
    r.partsCost || 0,
    r.totalCost || 0,
    r.nextServiceDate ? r.nextServiceDate.toISOString().split('T')[0] : '',
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="maintenance_${vehicle.unitNumber}_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
}));

// ============================================
// DOCUMENT UPLOAD ENDPOINTS
// ============================================

// @route   POST /api/maintenance/:id/documents
// @desc    Upload a document to a maintenance record
// @access  Private
router.post('/:id/documents', uploadSingle('file'), asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const documentType = req.body.documentType || 'other';
  const fileUrl = getFileUrl(req.file.path);

  record.documents.push({
    name: req.body.name || req.file.originalname,
    url: fileUrl,
    type: documentType,
    uploadedAt: new Date()
  });

  await record.save();

  res.json({
    success: true,
    message: 'Document uploaded successfully',
    document: record.documents[record.documents.length - 1]
  });
}));

// @route   DELETE /api/maintenance/:id/documents/:docId
// @desc    Delete a document from a maintenance record
// @access  Private
router.delete('/:id/documents/:docId', asyncHandler(async (req, res) => {
  const record = await MaintenanceRecord.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!record) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  const docIndex = record.documents.findIndex(d => d._id.toString() === req.params.docId);
  if (docIndex === -1) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Delete file from storage
  const doc = record.documents[docIndex];
  if (doc.url) {
    try {
      await deleteFile(doc.url);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }

  record.documents.splice(docIndex, 1);
  await record.save();

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
}));

module.exports = router;
