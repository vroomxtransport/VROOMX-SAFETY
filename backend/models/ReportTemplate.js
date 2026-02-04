const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  reportType: {
    type: String,
    required: true,
    enum: ['dqf', 'vehicle', 'violations', 'audit', 'document-expiration',
           'drug-alcohol', 'dataq-history', 'accident-summary', 'maintenance-costs'],
    index: true
  },
  selectedFields: [{
    type: String,
    trim: true
  }],
  filters: {
    startDate: Date,
    endDate: Date,
    driverIds: [{ type: mongoose.Schema.Types.ObjectId }],
    vehicleIds: [{ type: mongoose.Schema.Types.ObjectId }],
    status: String
  },
  isSystemTemplate: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
reportTemplateSchema.index({ companyId: 1, reportType: 1 });
reportTemplateSchema.index({ isSystemTemplate: 1, reportType: 1 });

// Virtual for field count
reportTemplateSchema.virtual('fieldCount').get(function() {
  return this.selectedFields?.length || 0;
});

// Ensure virtuals are included
reportTemplateSchema.set('toJSON', { virtuals: true });
reportTemplateSchema.set('toObject', { virtuals: true });

// Static: Get pre-built FMCSA system templates
reportTemplateSchema.statics.getSystemTemplates = function() {
  return [
    {
      name: 'DQF Audit Export',
      description: '49 CFR 391.51 compliance fields for DOT audit',
      reportType: 'dqf',
      isSystemTemplate: true,
      selectedFields: [
        'driverName', 'employeeId', 'cdlNumber', 'cdlState', 'cdlExpiry',
        'medicalExpiry', 'clearinghouseQueryDate', 'clearinghouseStatus',
        'mvrReviewDate', 'employmentVerificationStatus', 'overallStatus'
      ]
    },
    {
      name: 'Vehicle Inspection Summary',
      description: 'Annual inspection dates and compliance status',
      reportType: 'vehicle',
      isSystemTemplate: true,
      selectedFields: [
        'unitNumber', 'vin', 'make', 'year', 'annualInspectionDate',
        'annualInspectionExpiry', 'overallStatus'
      ]
    },
    {
      name: 'Violations Summary',
      description: 'BASIC categories, severity, and DataQ status',
      reportType: 'violations',
      isSystemTemplate: true,
      selectedFields: [
        'inspectionNumber', 'violationDate', 'violationType', 'violationCode',
        'basic', 'severityWeight', 'driverName', 'dataQStatus'
      ]
    }
  ];
};

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
