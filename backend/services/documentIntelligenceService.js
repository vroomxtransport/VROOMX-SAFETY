const openaiVisionService = require('./openaiVisionService');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');
const Document = require('../models/Document');
const fs = require('fs').promises;

/**
 * Document Intelligence Service
 * Orchestrates document classification, extraction, and record creation
 */
const documentIntelligenceService = {
  /**
   * Process an uploaded document with AI
   * @param {string} filePath - Path to the uploaded file
   * @param {Object} options - Processing options
   * @returns {Object} Processing result
   */
  async processDocument(filePath, options = {}) {
    const {
      expectedType = null,
      autoClassify = true,
      companyId,
      userId,
      driverId = null,
      vehicleId = null
    } = options;

    try {
      // Read the file
      const fileBuffer = await fs.readFile(filePath);

      // Step 1: Classify if needed
      let documentType = expectedType;
      let classification = null;

      if (autoClassify && !expectedType) {
        classification = await openaiVisionService.classifyDocument(fileBuffer);
        documentType = classification.type;
      }

      // Step 2: Extract data
      const extraction = await openaiVisionService.extractDocumentData(fileBuffer, documentType);

      // Step 3: Validate extracted data
      const validation = this.validateExtractedData(documentType, extraction.data);

      // Step 4: Generate feedback message
      const feedback = this.generateFeedbackMessage(documentType, extraction.data, validation);

      return {
        success: true,
        classification,
        documentType,
        extractedData: extraction.data,
        validation,
        feedback,
        usage: extraction.usage
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        error: error.message,
        feedback: {
          type: 'error',
          icon: 'error',
          message: `Failed to process document: ${error.message}`
        }
      };
    }
  },

  /**
   * Validate extracted data against expected schema
   */
  validateExtractedData(documentType, data) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    switch (documentType) {
      case 'medical_card':
        if (!data.expirationDate) {
          validation.errors.push('Could not extract expiration date');
          validation.isValid = false;
        } else {
          const expDate = new Date(data.expirationDate);
          if (expDate < new Date()) {
            validation.warnings.push('Medical card appears to be expired');
          }
        }
        if (!data.examinerName) {
          validation.warnings.push('Could not extract examiner name');
        }
        break;

      case 'cdl':
        if (!data.licenseNumber) {
          validation.errors.push('Could not extract license number');
          validation.isValid = false;
        }
        if (!data.expirationDate) {
          validation.errors.push('Could not extract expiration date');
          validation.isValid = false;
        } else {
          const expDate = new Date(data.expirationDate);
          if (expDate < new Date()) {
            validation.warnings.push('CDL appears to be expired');
          }
        }
        if (!data.state) {
          validation.warnings.push('Could not extract state');
        }
        break;

      case 'inspection_report':
        if (!data.reportNumber) {
          validation.warnings.push('Could not extract report number');
        }
        if (!data.inspectionDate) {
          validation.errors.push('Could not extract inspection date');
          validation.isValid = false;
        }
        if (!data.violations || !Array.isArray(data.violations)) {
          validation.warnings.push('Could not extract violations list');
        }
        break;

      case 'drug_test':
        if (!data.testDate) {
          validation.errors.push('Could not extract test date');
          validation.isValid = false;
        }
        if (!data.drugTestResult && !data.alcoholTestResult) {
          validation.errors.push('Could not extract test result');
          validation.isValid = false;
        }
        break;

      default:
        validation.warnings.push('Document type not fully supported for validation');
    }

    // Check confidence score
    if (data.confidence !== undefined && data.confidence < 0.7) {
      validation.warnings.push('Low confidence in extraction accuracy - please verify manually');
    }

    return validation;
  },

  /**
   * Generate user-friendly feedback message
   */
  generateFeedbackMessage(documentType, data, validation) {
    const messages = {
      medical_card: () => {
        if (!validation.isValid) {
          return { type: 'error', icon: 'error', message: 'Could not fully read medical card. Please verify details manually.' };
        }
        const expDate = new Date(data.expirationDate);
        const isExpired = expDate < new Date();
        const formattedDate = expDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

        if (isExpired) {
          return { type: 'warning', icon: 'warning', message: `Medical Card EXPIRED (${formattedDate}). Driver needs recertification.` };
        }

        const daysUntilExpiry = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) {
          return { type: 'warning', icon: 'warning', message: `Medical Card expires ${formattedDate} (${daysUntilExpiry} days). Schedule renewal soon.` };
        }

        return { type: 'success', icon: 'success', message: `Valid Medical Card (Expires: ${formattedDate}). Ready to add to DQF.` };
      },

      cdl: () => {
        if (!validation.isValid) {
          return { type: 'error', icon: 'error', message: 'Could not fully read CDL. Please verify details manually.' };
        }
        const expDate = new Date(data.expirationDate);
        const isExpired = expDate < new Date();
        const formattedDate = expDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const classInfo = data.class ? `Class ${data.class}` : '';
        const endorsements = data.endorsements?.length > 0 ? ` with ${data.endorsements.join(', ')} endorsements` : '';

        if (isExpired) {
          return { type: 'error', icon: 'error', message: `CDL EXPIRED (${formattedDate}). Driver cannot operate CMV.` };
        }

        return { type: 'success', icon: 'success', message: `Valid ${classInfo} CDL${endorsements} (Expires: ${formattedDate}). Ready to add to DQF.` };
      },

      inspection_report: () => {
        if (!validation.isValid) {
          return { type: 'error', icon: 'error', message: 'Could not fully read inspection report. Please enter violations manually.' };
        }

        const violationCount = data.violations?.length || 0;
        const oosDriver = data.oosStatus?.driver;
        const oosVehicle = data.oosStatus?.vehicle;
        const formattedDate = data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString() : 'Unknown date';

        if (oosDriver || oosVehicle) {
          const oosType = oosDriver && oosVehicle ? 'Driver & Vehicle' : oosDriver ? 'Driver' : 'Vehicle';
          return {
            type: 'error',
            icon: 'error',
            message: `OUT OF SERVICE inspection (${formattedDate}). ${oosType} OOS. ${violationCount} violation(s) found. Review required.`
          };
        }

        if (violationCount > 0) {
          return {
            type: 'warning',
            icon: 'warning',
            message: `Inspection (${formattedDate}) with ${violationCount} violation(s). Review and add to violation tracker.`
          };
        }

        return { type: 'success', icon: 'success', message: `Clean inspection report (${formattedDate}). No violations found.` };
      },

      drug_test: () => {
        if (!validation.isValid) {
          return { type: 'error', icon: 'error', message: 'Could not fully read test result. Please verify details manually.' };
        }

        const isNegative = data.drugTestResult === 'negative' &&
                          (data.alcoholTestResult === 'negative' || data.alcoholTestResult === null);
        const testDate = data.testDate ? new Date(data.testDate).toLocaleDateString() : 'Unknown date';
        const testType = data.testType?.replace(/_/g, ' ') || 'Test';

        if (isNegative) {
          return { type: 'success', icon: 'success', message: `NEGATIVE ${testType} result (${testDate}). Ready to add to records.` };
        }

        if (data.drugTestResult === 'positive' || data.alcoholTestResult === 'positive') {
          return {
            type: 'error',
            icon: 'error',
            message: `POSITIVE ${testType} result (${testDate}). Immediate action required. Clearinghouse reporting required.`
          };
        }

        return { type: 'info', icon: 'info', message: `${testType} result from ${testDate}. Please review details.` };
      },

      default: () => {
        return { type: 'info', icon: 'info', message: 'Document analyzed. Please review extracted information.' };
      }
    };

    const messageFn = messages[documentType] || messages.default;
    return messageFn();
  },

  /**
   * Create or update related records based on extracted data
   */
  async createRelatedRecords(companyId, documentType, extractedData, documentId, options = {}) {
    const { driverId, vehicleId, userId, autoCreate = false } = options;
    const updates = [];

    if (!autoCreate) {
      // Just return what would be created/updated
      return this.suggestRecordUpdates(documentType, extractedData, { driverId, vehicleId });
    }

    try {
      switch (documentType) {
        case 'medical_card':
          if (driverId) {
            const driver = await Driver.findByIdAndUpdate(
              driverId,
              {
                'medicalCard.examinerName': extractedData.examinerName,
                'medicalCard.examinerNPI': extractedData.examinerNPI,
                'medicalCard.examDate': extractedData.examinationDate,
                'medicalCard.expiryDate': extractedData.expirationDate,
                'medicalCard.certificationType': extractedData.certificationType,
                'medicalCard.restrictions': extractedData.restrictions,
                'medicalCard.documentUrl': documentId ? `/api/documents/${documentId}/download` : null
              },
              { new: true }
            );
            updates.push({ type: 'driver_medical_card', driverId, success: true });
          }
          break;

        case 'cdl':
          if (driverId) {
            const driver = await Driver.findByIdAndUpdate(
              driverId,
              {
                'cdl.number': extractedData.licenseNumber,
                'cdl.state': extractedData.state,
                'cdl.class': extractedData.class,
                'cdl.endorsements': extractedData.endorsements,
                'cdl.restrictions': extractedData.restrictions,
                'cdl.issueDate': extractedData.issueDate,
                'cdl.expiryDate': extractedData.expirationDate,
                'cdl.documentUrl': documentId ? `/api/documents/${documentId}/download` : null
              },
              { new: true }
            );
            updates.push({ type: 'driver_cdl', driverId, success: true });
          }
          break;

        case 'inspection_report':
          // Create violation records for each violation found
          if (extractedData.violations && Array.isArray(extractedData.violations)) {
            for (const violation of extractedData.violations) {
              const violationRecord = await Violation.create({
                companyId,
                inspectionNumber: extractedData.reportNumber,
                violationDate: extractedData.inspectionDate,
                location: extractedData.location,
                basic: this.mapViolationCodeToBasic(violation.code),
                violationType: violation.description,
                violationCode: violation.code,
                severityWeight: this.getViolationSeverity(violation.code),
                outOfService: violation.isOutOfService,
                driverId: driverId,
                vehicleId: vehicleId,
                inspectorName: extractedData.inspector?.name,
                inspectorBadge: extractedData.inspector?.badge,
                status: 'open',
                history: [{
                  action: 'created_from_ai_upload',
                  userId,
                  date: new Date()
                }]
              });
              updates.push({
                type: 'violation',
                violationId: violationRecord._id,
                code: violation.code,
                success: true
              });
            }
          }
          break;

        case 'drug_test':
          // Note: Drug test records would typically be created manually
          // This just suggests the data
          updates.push({
            type: 'drug_test_suggested',
            data: {
              testType: extractedData.testType,
              testDate: extractedData.testDate,
              result: extractedData.drugTestResult,
              driverId
            },
            success: true,
            message: 'Drug test data extracted. Please create record manually to ensure accuracy.'
          });
          break;
      }

      return { updates, success: true };
    } catch (error) {
      console.error('Error creating related records:', error);
      return { updates, success: false, error: error.message };
    }
  },

  /**
   * Suggest record updates without actually making them
   */
  suggestRecordUpdates(documentType, extractedData, options = {}) {
    const suggestions = [];

    switch (documentType) {
      case 'medical_card':
        suggestions.push({
          type: 'driver_medical_card',
          action: 'update',
          description: 'Update driver medical card information',
          fields: ['examinerName', 'examDate', 'expiryDate', 'certificationType', 'restrictions'],
          data: extractedData
        });
        break;

      case 'cdl':
        suggestions.push({
          type: 'driver_cdl',
          action: 'update',
          description: 'Update driver CDL information',
          fields: ['number', 'state', 'class', 'endorsements', 'restrictions', 'issueDate', 'expiryDate'],
          data: extractedData
        });
        break;

      case 'inspection_report':
        if (extractedData.violations?.length > 0) {
          suggestions.push({
            type: 'violations',
            action: 'create',
            description: `Create ${extractedData.violations.length} violation record(s)`,
            count: extractedData.violations.length,
            violations: extractedData.violations.map(v => ({
              code: v.code,
              description: v.description,
              isOOS: v.isOutOfService
            }))
          });
        }
        break;

      case 'drug_test':
        suggestions.push({
          type: 'drug_test',
          action: 'create',
          description: 'Create drug/alcohol test record',
          data: {
            testType: extractedData.testType,
            testDate: extractedData.testDate,
            result: extractedData.drugTestResult || extractedData.alcoholTestResult
          }
        });
        break;
    }

    return suggestions;
  },

  /**
   * Map violation code to BASIC category
   */
  mapViolationCodeToBasic(code) {
    if (!code) return 'vehicle_maintenance';

    const normalizedCode = code.toLowerCase().replace(/[^0-9.]/g, '');

    // Basic mapping based on CFR part
    if (normalizedCode.startsWith('392')) return 'unsafe_driving';
    if (normalizedCode.startsWith('395')) return 'hours_of_service';
    if (normalizedCode.startsWith('396') || normalizedCode.startsWith('393')) return 'vehicle_maintenance';
    if (normalizedCode.startsWith('382')) return 'controlled_substances';
    if (normalizedCode.startsWith('391')) return 'driver_fitness';

    // Default
    return 'vehicle_maintenance';
  },

  /**
   * Get violation severity (basic implementation)
   */
  getViolationSeverity(code) {
    // Default severity of 5; would be enhanced with full violation code database
    return 5;
  },

  /**
   * Map document type to Document model category
   */
  mapTypeToCategory(documentType) {
    const mapping = {
      medical_card: 'driver',
      cdl: 'driver',
      inspection_report: 'violation',
      drug_test: 'drug_alcohol',
      annual_inspection: 'vehicle',
      employment_application: 'driver',
      mvr: 'driver',
      insurance_certificate: 'insurance',
      registration: 'registration',
      title: 'vehicle'
    };

    return mapping[documentType] || 'other';
  },

  /**
   * Map document type to Document model documentType
   */
  mapTypeToDocumentType(documentType) {
    const mapping = {
      medical_card: 'medical_card',
      cdl: 'cdl',
      inspection_report: 'inspection_report',
      drug_test: 'test_result',
      annual_inspection: 'annual_inspection',
      employment_application: 'employment_application',
      mvr: 'mvr'
    };

    return mapping[documentType] || 'other';
  }
};

module.exports = documentIntelligenceService;
