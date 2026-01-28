const mongoose = require('mongoose');
const { getDocumentStatus } = require('../config/fmcsaCompliance');

const documentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Document Classification
  category: {
    type: String,
    enum: [
      'company', // MCS-150, UCR, Authority, etc.
      'insurance', // Liability, Cargo, Physical Damage
      'registration', // IRP, IFTA
      'permit', // OS/OW, Hazmat, etc.
      'driver', // DQ File documents
      'vehicle', // Inspection, Maintenance
      'drug_alcohol', // Testing records
      'violation', // Citations, DataQ
      'accident', // Accident reports
      'training', // Training certificates
      'other'
    ],
    required: true
  },
  documentType: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true
  },
  description: String,

  // Associated Records (optional - for linking to specific entities)
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  // File Information
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'],
    required: true
  },
  fileSize: Number, // in bytes
  filePath: {
    type: String,
    required: true
  },
  fileUrl: String, // Public/signed URL for access

  // Dates
  issueDate: Date,
  effectiveDate: Date,
  expiryDate: Date,

  // Status
  status: {
    type: String,
    enum: ['valid', 'due_soon', 'expired', 'missing', 'pending_review'],
    default: 'valid'
  },

  // Regulatory Reference
  regulation: String, // e.g., "49 CFR 391.21"
  retentionPeriod: {
    years: Number,
    afterEvent: String // e.g., "termination", "disposal"
  },

  // Alerts
  alertEnabled: { type: Boolean, default: true },
  alertDaysBefore: [Number], // e.g., [90, 60, 30, 14, 7]
  lastAlertSent: Date,

  // Version Control
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: Number,
    filePath: String,
    uploadDate: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Verification
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedDate: Date,

  // Metadata
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,

  // Upload Info
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // AI Document Intelligence
  aiProcessed: { type: Boolean, default: false },
  aiConfidence: { type: Number, min: 0, max: 1 },
  extractedData: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Update status based on expiry date
documentSchema.pre('save', function(next) {
  if (this.expiryDate) {
    this.status = getDocumentStatus(this.expiryDate);
  }
  next();
});

// Virtual for days until expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

// Indexes
documentSchema.index({ companyId: 1, category: 1 });
documentSchema.index({ companyId: 1, documentType: 1 });
documentSchema.index({ driverId: 1 });
documentSchema.index({ vehicleId: 1 });
documentSchema.index({ expiryDate: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ isDeleted: 1 });

// Post-save hook for real-time alert generation
documentSchema.post('save', async function(doc) {
  try {
    // Lazy require to avoid circular dependency
    const alertService = require('../services/alertService');
    await alertService.generateDocumentAlerts(doc.companyId, doc._id);
  } catch (err) {
    console.error('[Document] Alert generation failed:', err.message);
  }
});

// Document types by category
documentSchema.statics.DOCUMENT_TYPES = {
  company: [
    { value: 'mcs_150', label: 'MCS-150 Biennial Update', hasExpiry: true },
    { value: 'ucr', label: 'UCR Registration', hasExpiry: true },
    { value: 'operating_authority', label: 'Operating Authority (MC)', hasExpiry: false },
    { value: 'boc_3', label: 'BOC-3 Process Agent', hasExpiry: false },
    { value: 'ein_letter', label: 'EIN Letter', hasExpiry: false },
    { value: 'articles_of_incorporation', label: 'Articles of Incorporation', hasExpiry: false }
  ],
  insurance: [
    { value: 'liability', label: 'Liability Insurance', hasExpiry: true },
    { value: 'cargo', label: 'Cargo Insurance', hasExpiry: true },
    { value: 'physical_damage', label: 'Physical Damage', hasExpiry: true },
    { value: 'workers_comp', label: 'Workers Compensation', hasExpiry: true },
    { value: 'umbrella', label: 'Umbrella Policy', hasExpiry: true }
  ],
  registration: [
    { value: 'irp', label: 'IRP Registration', hasExpiry: true },
    { value: 'ifta', label: 'IFTA License', hasExpiry: true },
    { value: 'cab_card', label: 'IRP Cab Card', hasExpiry: true },
    { value: 'ifta_decal', label: 'IFTA Decal', hasExpiry: true }
  ],
  permit: [
    { value: 'oversize', label: 'Oversize Permit', hasExpiry: true },
    { value: 'overweight', label: 'Overweight Permit', hasExpiry: true },
    { value: 'hazmat', label: 'Hazmat Permit', hasExpiry: true },
    { value: 'state_permit', label: 'State Specific Permit', hasExpiry: true },
    { value: 'port_permit', label: 'Port/Terminal Permit', hasExpiry: true }
  ],
  driver: [
    { value: 'cdl', label: 'Commercial Driver License', hasExpiry: true },
    { value: 'medical_card', label: 'Medical Examiner Certificate', hasExpiry: true },
    { value: 'mvr', label: 'Motor Vehicle Record', hasExpiry: true },
    { value: 'employment_app', label: 'Employment Application', hasExpiry: false },
    { value: 'road_test', label: 'Road Test Certificate', hasExpiry: false },
    { value: 'clearinghouse', label: 'Clearinghouse Query', hasExpiry: true },
    { value: 'eldt', label: 'ELDT Certificate', hasExpiry: false }
  ],
  vehicle: [
    { value: 'annual_inspection', label: 'Annual DOT Inspection', hasExpiry: true },
    { value: 'registration', label: 'Vehicle Registration', hasExpiry: true },
    { value: 'title', label: 'Vehicle Title', hasExpiry: false },
    { value: 'lease_agreement', label: 'Lease Agreement', hasExpiry: true },
    { value: 'maintenance_record', label: 'Maintenance Record', hasExpiry: false }
  ],
  drug_alcohol: [
    { value: 'test_result', label: 'Test Result', hasExpiry: false },
    { value: 'consent_form', label: 'Consent Form', hasExpiry: false },
    { value: 'ccf', label: 'Chain of Custody Form', hasExpiry: false },
    { value: 'sap_report', label: 'SAP Report', hasExpiry: false },
    { value: 'policy', label: 'D&A Policy', hasExpiry: false }
  ],
  violation: [
    { value: 'inspection_report', label: 'Inspection Report', hasExpiry: false },
    { value: 'citation', label: 'Citation', hasExpiry: false },
    { value: 'dataq_request', label: 'DataQ Request', hasExpiry: false },
    { value: 'dataq_response', label: 'DataQ Response', hasExpiry: false }
  ],
  accident: [
    { value: 'accident_report', label: 'Accident Report', hasExpiry: false },
    { value: 'police_report', label: 'Police Report', hasExpiry: false },
    { value: 'photos', label: 'Accident Photos', hasExpiry: false },
    { value: 'witness_statement', label: 'Witness Statement', hasExpiry: false }
  ],
  training: [
    { value: 'hazmat_training', label: 'Hazmat Training', hasExpiry: true },
    { value: 'safety_training', label: 'Safety Training', hasExpiry: true },
    { value: 'defensive_driving', label: 'Defensive Driving', hasExpiry: true }
  ],
  other: [
    { value: 'other', label: 'Other Document', hasExpiry: false }
  ]
};

module.exports = mongoose.model('Document', documentSchema);
