const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Document } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, getFileUrl, deleteFile } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const documentIntelligenceService = require('../services/documentIntelligenceService');
const openaiVisionService = require('../services/openaiVisionService');
const auditService = require('../services/auditService');

const { escapeRegex } = require('../utils/helpers');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/documents
// @desc    Get all documents with filtering
// @access  Private
router.get('/', checkPermission('documents', 'view'), asyncHandler(async (req, res) => {
  const { category, documentType, status, driverId, vehicleId, search, page = 1, limit = 20, sort: rawSort = '-createdAt' } = req.query;
  const allowedSorts = ['createdAt', '-createdAt', 'name', '-name', 'category', '-category', 'status', '-status', 'expiryDate', '-expiryDate'];
  const sort = allowedSorts.includes(rawSort) ? rawSort : '-createdAt';

  const queryObj = { ...req.companyFilter, isDeleted: false };

  if (category) queryObj.category = category;
  if (documentType) queryObj.documentType = documentType;
  if (status) queryObj.status = status;
  if (driverId) queryObj.driverId = driverId;
  if (vehicleId) queryObj.vehicleId = vehicleId;
  if (search) {
    const safeSearch = escapeRegex(search);
    queryObj.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { tags: { $in: [new RegExp(safeSearch, 'i')] } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const documents = await Document.find(queryObj)
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber')
    .populate('uploadedBy', 'firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Document.countDocuments(queryObj);

  res.json({
    success: true,
    count: documents.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    documents
  });
}));

// @route   GET /api/documents/expiring
// @desc    Get documents expiring soon
// @access  Private
router.get('/expiring', checkPermission('documents', 'view'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + parseInt(days));

  const expiringDocs = await Document.find({
    ...req.companyFilter,
    isDeleted: false,
    expiryDate: { $lte: alertDate, $gte: new Date() }
  })
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('expiryDate');

  const expiredDocs = await Document.find({
    ...req.companyFilter,
    isDeleted: false,
    expiryDate: { $lt: new Date() }
  })
    .populate('driverId', 'firstName lastName')
    .populate('vehicleId', 'unitNumber')
    .sort('expiryDate');

  res.json({
    success: true,
    expiring: {
      count: expiringDocs.length,
      documents: expiringDocs
    },
    expired: {
      count: expiredDocs.length,
      documents: expiredDocs
    }
  });
}));

// @route   GET /api/documents/stats
// @desc    Get document statistics
// @access  Private
router.get('/stats', checkPermission('documents', 'view'), asyncHandler(async (req, res) => {
  const stats = await Document.aggregate([
    { $match: { ...req.companyFilter, isDeleted: false } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        valid: { $sum: { $cond: [{ $eq: ['$status', 'valid'] }, 1, 0] } },
        dueSoon: { $sum: { $cond: [{ $eq: ['$status', 'due_soon'] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
      }
    }
  ]);

  // Get total counts
  const totals = await Document.aggregate([
    { $match: { ...req.companyFilter, isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        valid: { $sum: { $cond: [{ $eq: ['$status', 'valid'] }, 1, 0] } },
        dueSoon: { $sum: { $cond: [{ $eq: ['$status', 'due_soon'] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
        missing: { $sum: { $cond: [{ $eq: ['$status', 'missing'] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    stats: {
      byCategory: stats,
      totals: totals[0] || { total: 0, valid: 0, dueSoon: 0, expired: 0, missing: 0 }
    }
  });
}));

// @route   GET /api/documents/types
// @desc    Get document types reference
// @access  Private
router.get('/types', checkPermission('documents', 'view'), (req, res) => {
  res.json({
    success: true,
    documentTypes: Document.DOCUMENT_TYPES
  });
});

// @route   GET /api/documents/ai-status
// @desc    Check if AI document intelligence is available
// @access  Private
router.get('/ai-status', checkPermission('documents', 'view'), (req, res) => {
  res.json({
    success: true,
    aiEnabled: openaiVisionService.isEnabled(),
    message: openaiVisionService.isEnabled()
      ? 'AI document intelligence is available'
      : 'AI document intelligence is not configured. Set OPENAI_API_KEY to enable.'
  });
});

// @route   GET /api/documents/:id/download
// @desc    Download document file (authenticated)
// @access  Private
router.get('/:id/download', checkPermission('documents', 'view'), asyncHandler(async (req, res) => {
  const path = require('path');
  const fs = require('fs');

  const document = await Document.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  if (!document.filePath) {
    throw new AppError('No file associated with this document', 404);
  }

  const absolutePath = path.resolve(document.filePath);
  const uploadsBase = path.resolve(path.join(process.cwd(), 'uploads'));
  if (!absolutePath.startsWith(uploadsBase)) {
    throw new AppError('Invalid file path', 403);
  }
  if (!fs.existsSync(absolutePath)) {
    throw new AppError('File not found on server', 404);
  }

  // Set content disposition for download
  const filename = document.fileName || path.basename(absolutePath);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (document.fileType) {
    const mimeTypes = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    const mime = mimeTypes[document.fileType.toLowerCase()] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
  }

  const fileStream = fs.createReadStream(absolutePath);
  fileStream.pipe(res);
}));

// @route   GET /api/documents/:id
// @desc    Get single document
// @access  Private
router.get('/:id', checkPermission('documents', 'view'), asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  })
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber vin')
    .populate('uploadedBy', 'firstName lastName')
    .populate('verifiedBy', 'firstName lastName');

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  res.json({
    success: true,
    document
  });
}));

// @route   POST /api/documents
// @desc    Upload new document
// @access  Private
router.post('/', checkPermission('documents', 'upload'),
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }

    const { category, documentType, name, description, expiryDate, driverId, vehicleId, tags } = req.body;

    if (!category || !documentType) {
      throw new AppError('Category and document type are required', 400);
    }

    const fileExt = req.file.originalname.split('.').pop().toLowerCase();

    const document = await Document.create({
      companyId: req.companyFilter.companyId,
      category,
      documentType,
      name: name || req.file.originalname,
      description,
      fileName: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      filePath: req.file.path,
      fileUrl: getFileUrl(req.file.path),
      expiryDate: expiryDate || null,
      driverId: driverId || null,
      vehicleId: vehicleId || null,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      uploadedBy: req.user._id
    });

    auditService.log(req, 'create', 'document', document._id, { category, documentType, name: document.name });

    res.status(201).json({
      success: true,
      document
    });
  })
);

// @route   POST /api/documents/smart-upload
// @desc    Upload document with AI analysis (GPT-4o Vision)
// @access  Private
router.post('/smart-upload', checkPermission('documents', 'upload'),
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }

    // Check if OpenAI is enabled
    if (!openaiVisionService.isEnabled()) {
      throw new AppError('AI document intelligence is not configured. Please set OPENAI_API_KEY.', 503);
    }

    const {
      expectedType,
      autoClassify = 'true',
      driverId,
      vehicleId,
      autoCreateRecords = 'false'
    } = req.body;

    const companyId = req.companyFilter.companyId;

    // Process the document with AI
    const result = await documentIntelligenceService.processDocument(req.file.path, {
      expectedType: expectedType || null,
      autoClassify: autoClassify === 'true',
      companyId,
      userId: req.user._id,
      driverId: driverId || null,
      vehicleId: vehicleId || null
    });

    if (!result.success) {
      // Still save the document but without AI data
      const fileExt = req.file.originalname.split('.').pop().toLowerCase();
      const document = await Document.create({
        companyId,
        category: 'other',
        documentType: 'other',
        name: req.file.originalname,
        fileName: req.file.originalname,
        fileType: fileExt,
        fileSize: req.file.size,
        filePath: req.file.path,
        fileUrl: getFileUrl(req.file.path),
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        uploadedBy: req.user._id,
        aiProcessed: false
      });

      auditService.log(req, 'upload', 'document', document._id, { aiProcessed: result.success, name: req.file.originalname });

      return res.status(201).json({
        success: true,
        aiSuccess: false,
        document,
        feedback: result.feedback,
        message: 'Document uploaded but AI analysis failed'
      });
    }

    // Create document record with extracted data
    const category = documentIntelligenceService.mapTypeToCategory(result.documentType);
    const documentType = documentIntelligenceService.mapTypeToDocumentType(result.documentType);
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();

    // Extract expiry date if found
    let expiryDate = null;
    if (result.extractedData) {
      expiryDate = result.extractedData.expirationDate ||
                   result.extractedData.expiryDate ||
                   null;
    }

    const document = await Document.create({
      companyId,
      category,
      documentType,
      name: req.file.originalname,
      description: result.feedback?.message || null,
      fileName: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      filePath: req.file.path,
      fileUrl: getFileUrl(req.file.path),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      driverId: driverId || null,
      vehicleId: vehicleId || null,
      uploadedBy: req.user._id,
      aiProcessed: true,
      aiConfidence: result.extractedData?.confidence || result.classification?.confidence || null,
      extractedData: result.extractedData
    });

    // Get suggested record updates
    const suggestions = documentIntelligenceService.suggestRecordUpdates(
      result.documentType,
      result.extractedData,
      { driverId, vehicleId }
    );

    // Optionally create related records
    let relatedUpdates = null;
    if (autoCreateRecords === 'true' && (driverId || vehicleId)) {
      relatedUpdates = await documentIntelligenceService.createRelatedRecords(
        companyId,
        result.documentType,
        result.extractedData,
        document._id,
        {
          driverId,
          vehicleId,
          userId: req.user._id,
          autoCreate: true
        }
      );
    }

    auditService.log(req, 'upload', 'document', document._id, { aiProcessed: result.success, name: req.file.originalname });

    res.status(201).json({
      success: true,
      aiSuccess: true,
      document,
      classification: result.classification,
      extractedData: result.extractedData,
      validation: result.validation,
      feedback: result.feedback,
      suggestions,
      relatedUpdates,
      usage: result.usage
    });
  })
);

// @route   POST /api/documents/:id/apply-extraction
// @desc    Apply AI-extracted data to related records
// @access  Private
router.post('/:id/apply-extraction', checkPermission('documents', 'upload'),
  asyncHandler(async (req, res) => {
    const document = await Document.findOne({
      _id: req.params.id,
      ...req.companyFilter,
      isDeleted: false
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    if (!document.aiProcessed || !document.extractedData) {
      throw new AppError('Document has no AI-extracted data to apply', 400);
    }

    const { driverId, vehicleId } = req.body;
    const companyId = req.companyFilter.companyId;

    // Determine document type from category/documentType
    const typeMapping = {
      medical_card: 'medical_card',
      cdl: 'cdl',
      inspection_report: 'inspection_report',
      test_result: 'drug_test'
    };
    const documentType = typeMapping[document.documentType] || document.documentType;

    const result = await documentIntelligenceService.createRelatedRecords(
      companyId,
      documentType,
      document.extractedData,
      document._id,
      {
        driverId: driverId || document.driverId,
        vehicleId: vehicleId || document.vehicleId,
        userId: req.user._id,
        autoCreate: true
      }
    );

    res.json({
      success: true,
      message: 'Extracted data applied to records',
      updates: result.updates
    });
  })
);

// @route   POST /api/documents/bulk
// @desc    Upload multiple documents
// @access  Private
router.post('/bulk', checkPermission('documents', 'upload'),
  uploadMultiple('files', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError('Please upload at least one file', 400);
    }

    const { category, documentType } = req.body;

    const documents = await Promise.all(req.files.map(async (file) => {
      const fileExt = file.originalname.split('.').pop().toLowerCase();

      return Document.create({
        companyId: req.companyFilter.companyId,
        category: category || 'other',
        documentType: documentType || 'other',
        name: file.originalname,
        fileName: file.originalname,
        fileType: fileExt,
        fileSize: file.size,
        filePath: file.path,
        fileUrl: getFileUrl(file.path),
        uploadedBy: req.user._id
      });
    }));

    auditService.log(req, 'upload', 'document', null, { count: documents.length });

    res.status(201).json({
      success: true,
      count: documents.length,
      documents
    });
  })
);

// @route   PUT /api/documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', checkPermission('documents', 'upload'), asyncHandler(async (req, res) => {
  let document = await Document.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  const allowedUpdateFields = ['name', 'description', 'category', 'documentType', 'expiryDate', 'driverId', 'vehicleId', 'tags', 'status', 'notes'];
  const updateData = {};
  for (const key of allowedUpdateFields) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  document = await Document.findOneAndUpdate(
    { _id: req.params.id, ...req.companyFilter },
    updateData,
    { new: true, runValidators: true }
  );

  auditService.log(req, 'update', 'document', req.params.id, { summary: 'Document metadata updated' });

  res.json({
    success: true,
    document
  });
}));

// @route   POST /api/documents/:id/verify
// @desc    Mark document as verified
// @access  Private
router.post('/:id/verify', checkPermission('documents', 'upload'), asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  document.verified = true;
  document.verifiedBy = req.user._id;
  document.verifiedDate = new Date();
  await document.save();

  auditService.log(req, 'update', 'document', req.params.id, { summary: 'Document verified' });

  res.json({
    success: true,
    message: 'Document verified',
    document
  });
}));

// @route   POST /api/documents/:id/replace
// @desc    Replace document file (keep history)
// @access  Private
router.post('/:id/replace', checkPermission('documents', 'upload'),
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }

    const document = await Document.findOne({
      _id: req.params.id,
      ...req.companyFilter,
      isDeleted: false
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Store previous version
    document.previousVersions.push({
      version: document.version,
      filePath: document.filePath,
      uploadDate: document.updatedAt,
      uploadedBy: document.uploadedBy
    });

    // Update with new file
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    document.version += 1;
    document.fileName = req.file.originalname;
    document.fileType = fileExt;
    document.fileSize = req.file.size;
    document.filePath = req.file.path;
    document.fileUrl = getFileUrl(req.file.path);
    document.uploadedBy = req.user._id;

    // Update expiry if provided
    if (req.body.expiryDate) {
      document.expiryDate = req.body.expiryDate;
    }

    await document.save();

    auditService.log(req, 'update', 'document', req.params.id, { version: document.version, summary: 'Document replaced' });

    res.json({
      success: true,
      message: 'Document replaced successfully',
      document
    });
  })
);

// @route   DELETE /api/documents/:id
// @desc    Soft delete document
// @access  Private
router.delete('/:id', checkPermission('documents', 'delete'), asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  document.isDeleted = true;
  document.deletedAt = new Date();
  document.deletedBy = req.user._id;
  await document.save();

  auditService.log(req, 'delete', 'document', req.params.id, { name: document.name });

  res.json({
    success: true,
    message: 'Document deleted'
  });
}));

module.exports = router;
