const express = require('express');
const router = express.Router();
const { protect, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const templateGeneratorService = require('../services/templateGeneratorService');
const Company = require('../models/Company');
const Document = require('../models/Document');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/templates
// @desc    Get list of available templates
// @access  Private
router.get('/', (req, res) => {
  const templates = templateGeneratorService.getAvailableTemplates();

  res.json({
    success: true,
    count: templates.length,
    templates
  });
});

// @route   GET /api/templates/by/category
// @desc    Get templates grouped by category
// @access  Private
router.get('/by/category', (req, res) => {
  const templates = templateGeneratorService.getAvailableTemplates();

  const grouped = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  res.json({
    success: true,
    categories: grouped
  });
});

// @route   GET /api/templates/:templateKey
// @desc    Get template definition with field details
// @access  Private
router.get('/:templateKey', (req, res) => {
  try {
    const definition = templateGeneratorService.getTemplateDefinition(req.params.templateKey);

    res.json({
      success: true,
      template: definition
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/templates/:templateKey/preview
// @desc    Generate HTML preview of template
// @access  Private
router.post('/:templateKey/preview', asyncHandler(async (req, res) => {
  const { templateKey } = req.params;
  const { data } = req.body;

  const companyId = req.user.companyId._id || req.user.companyId;
  const company = await Company.findById(companyId);

  if (!company) {
    throw new AppError('Company not found', 404);
  }

  const preview = await templateGeneratorService.generatePreview(templateKey, data || {}, company);

  res.json({
    success: true,
    ...preview
  });
}));

// @route   POST /api/templates/:templateKey/validate
// @desc    Validate template data before generation
// @access  Private
router.post('/:templateKey/validate', (req, res) => {
  const { templateKey } = req.params;
  const { data } = req.body;

  const validation = templateGeneratorService.validateTemplateData(templateKey, data || {});

  res.json({
    success: true,
    ...validation
  });
});

// @route   POST /api/templates/:templateKey/generate
// @desc    Generate PDF from template
// @access  Private
router.post('/:templateKey/generate', asyncHandler(async (req, res) => {
  const { templateKey } = req.params;
  const { data, saveToDocuments, documentName, driverId, vehicleId } = req.body;

  const companyId = req.user.companyId._id || req.user.companyId;
  const company = await Company.findById(companyId);

  if (!company) {
    throw new AppError('Company not found', 404);
  }

  // Validate data
  const validation = templateGeneratorService.validateTemplateData(templateKey, data || {});
  if (!validation.valid) {
    throw new AppError(`Validation failed: ${validation.errors.join(', ')}`, 400);
  }

  // Generate PDF
  const pdf = await templateGeneratorService.generatePDF(templateKey, data || {}, company);

  // Optionally save to documents
  if (saveToDocuments) {
    const templateDef = templateGeneratorService.getTemplateDefinition(templateKey);

    // Determine document category based on template category
    const categoryMap = {
      driver: 'driver',
      company: 'company',
      drug_alcohol: 'drug_alcohol'
    };

    // Save file to uploads directory
    const fs = require('fs').promises;
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads/documents');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, pdf.filename);
    await fs.writeFile(filePath, pdf.buffer);

    // Create document record
    const document = await Document.create({
      companyId,
      category: categoryMap[templateDef.category] || 'other',
      documentType: templateKey,
      name: documentName || templateDef.name,
      description: `Generated ${templateDef.name}`,
      fileName: pdf.filename,
      fileType: 'pdf',
      fileSize: pdf.buffer.length,
      filePath,
      driverId: driverId || null,
      vehicleId: vehicleId || null,
      regulation: templateDef.regulation,
      uploadedBy: req.user._id,
      verified: false,
      tags: ['generated', 'template']
    });

    return res.json({
      success: true,
      message: 'Document generated and saved',
      document: {
        id: document._id,
        name: document.name,
        type: document.documentType
      },
      filename: pdf.filename
    });
  }

  // Return PDF as download
  res.set({
    'Content-Type': pdf.contentType,
    'Content-Disposition': `attachment; filename="${pdf.filename}"`,
    'Content-Length': pdf.buffer.length
  });

  res.send(pdf.buffer);
}));

module.exports = router;
