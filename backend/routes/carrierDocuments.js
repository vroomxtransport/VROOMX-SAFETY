const express = require('express');
const router = express.Router();
const CarrierDocument = require('../models/CarrierDocument');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/carrier-documents
// @desc    Get all carrier documents for company
// @access  Private
router.get('/', checkPermission('documents', 'view'), asyncHandler(async (req, res) => {
  const docs = await CarrierDocument.find({
    ...req.companyFilter,
    isDeleted: false
  }).sort('docType');

  res.json({ success: true, documents: docs });
}));

// @route   POST /api/carrier-documents
// @desc    Create a new carrier document
// @access  Private
router.post('/', checkPermission('documents', 'edit'), asyncHandler(async (req, res) => {
  const { docType, name, expirationDate, fileUrl, notes } = req.body;

  if (!docType || !name) {
    throw new AppError('Document type and name are required', 400);
  }

  const doc = await CarrierDocument.create({
    companyId: req.companyFilter.companyId,
    docType,
    name,
    expirationDate: expirationDate || undefined,
    fileUrl: fileUrl || undefined,
    notes: notes || undefined,
    lastUpdated: new Date()
  });

  auditService.log(req, 'create', 'carrier_document', doc._id, {
    docType,
    name
  });

  res.status(201).json({ success: true, document: doc });
}));

// @route   PUT /api/carrier-documents/:id
// @desc    Update a carrier document
// @access  Private
router.put('/:id', checkPermission('documents', 'edit'), asyncHandler(async (req, res) => {
  const doc = await CarrierDocument.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });

  if (!doc) throw new AppError('Carrier document not found', 404);

  const allowedFields = ['docType', 'name', 'expirationDate', 'fileUrl', 'notes', 'status'];
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) doc[key] = req.body[key];
  }
  doc.lastUpdated = new Date();

  await doc.save();

  auditService.log(req, 'update', 'carrier_document', doc._id, {
    fields: Object.keys(req.body)
  });

  res.json({ success: true, document: doc });
}));

// @route   DELETE /api/carrier-documents/:id
// @desc    Soft delete a carrier document
// @access  Private
router.delete('/:id', checkPermission('documents', 'delete'), asyncHandler(async (req, res) => {
  const doc = await CarrierDocument.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });

  if (!doc) throw new AppError('Carrier document not found', 404);

  doc.isDeleted = true;
  await doc.save();

  auditService.log(req, 'delete', 'carrier_document', req.params.id);

  res.json({ success: true, message: 'Carrier document deleted' });
}));

module.exports = router;
