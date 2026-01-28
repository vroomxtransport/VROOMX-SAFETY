const mongoose = require('mongoose');
const { getDocumentStatus, DQF_REQUIREMENTS } = require('../config/fmcsaCompliance');

const driverSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  ssn: {
    type: String,
    select: false // Sensitive data - don't include by default
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },

  // Employment Information
  employeeId: {
    type: String
  },
  hireDate: {
    type: Date,
    required: [true, 'Hire date is required']
  },
  terminationDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'suspended'],
    default: 'active'
  },
  driverType: {
    type: String,
    enum: ['company_driver', 'owner_operator'],
    default: 'company_driver'
  },

  // MVR Expiry Date
  mvrExpiryDate: Date,

  // CDL Information (49 CFR 391.23)
  cdl: {
    number: {
      type: String,
      required: [true, 'CDL number is required']
    },
    state: {
      type: String,
      required: [true, 'CDL state is required'],
      uppercase: true,
      maxlength: 2
    },
    class: {
      type: String,
      enum: ['A', 'B', 'C'],
      required: [true, 'CDL class is required']
    },
    endorsements: [{
      type: String,
      enum: ['H', 'N', 'P', 'S', 'T', 'X'] // Hazmat, Tank, Passenger, School Bus, Double/Triple, Combo
    }],
    restrictions: [String],
    issueDate: Date,
    expiryDate: {
      type: Date,
      required: [true, 'CDL expiry date is required']
    },
    documentUrl: String
  },

  // Medical Certification (49 CFR 391.43)
  medicalCard: {
    examinerName: String,
    examinerNPI: String,
    examDate: Date,
    expiryDate: {
      type: Date,
      required: [true, 'Medical card expiry date is required']
    },
    certificationType: {
      type: String,
      enum: ['interstate', 'intrastate', 'intrastate_non_excepted'],
      default: 'interstate'
    },
    restrictions: [String],
    documentUrl: String
  },

  // Driver Qualification File Documents
  documents: {
    // Employment Application (49 CFR 391.21)
    employmentApplication: {
      dateReceived: Date,
      documentUrl: String,
      complete: { type: Boolean, default: false }
    },
    // Previous Employment Verification (49 CFR 391.23)
    employmentVerification: [{
      employerName: String,
      startDate: Date,
      endDate: Date,
      verified: { type: Boolean, default: false },
      verificationDate: Date,
      documentUrl: String
    }],
    // Road Test (49 CFR 391.31)
    roadTest: {
      date: Date,
      examinerName: String,
      result: { type: String, enum: ['pass', 'fail'] },
      documentUrl: String,
      waived: { type: Boolean, default: false },
      waiverReason: String
    },
    // Annual MVR Review (49 CFR 391.25)
    mvrReviews: [{
      reviewDate: Date,
      reviewerName: String,
      violations: [{
        date: Date,
        description: String,
        points: Number
      }],
      approved: Boolean,
      documentUrl: String
    }],
    // Annual Certification of Violations (49 CFR 391.27)
    certificationOfViolations: [{
      year: Number,
      certified: Boolean,
      violations: [{
        date: Date,
        description: String
      }],
      signatureDate: Date,
      documentUrl: String
    }],
    // Entry Level Driver Training (ELDT) if applicable
    eldt: {
      provider: String,
      completionDate: Date,
      theoryHours: Number,
      behindTheWheelHours: Number,
      documentUrl: String
    },
    // Other supporting documents
    other: [{
      name: String,
      description: String,
      uploadDate: Date,
      documentUrl: String
    }]
  },

  // Clearinghouse Status
  clearinghouse: {
    lastQueryDate: Date,
    queryType: { type: String, enum: ['full', 'limited'] },
    status: { type: String, enum: ['clear', 'violation_found', 'pending'] },
    consentDate: Date,
    expiryDate: Date,
    documentUrl: String
  },

  // Calculated compliance status (updated via middleware)
  complianceStatus: {
    overall: {
      type: String,
      enum: ['compliant', 'warning', 'non_compliant'],
      default: 'compliant'
    },
    cdlStatus: {
      type: String,
      enum: ['valid', 'due_soon', 'expired', 'missing'],
      default: 'valid'
    },
    medicalStatus: {
      type: String,
      enum: ['valid', 'due_soon', 'expired', 'missing'],
      default: 'valid'
    },
    mvrStatus: {
      type: String,
      enum: ['current', 'due', 'overdue', 'missing'],
      default: 'current'
    },
    clearinghouseStatus: {
      type: String,
      enum: ['current', 'due', 'overdue', 'missing'],
      default: 'current'
    }
  },

  // Active alerts
  alerts: [{
    type: {
      type: String,
      enum: ['cdl_expiring', 'cdl_expired', 'medical_expiring', 'medical_expired',
             'mvr_due', 'clearinghouse_due', 'document_missing', 'violation_added']
    },
    message: String,
    severity: { type: String, enum: ['info', 'warning', 'critical'] },
    createdAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date
  }],

  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Archive fields
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  retentionExpiresAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
driverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for days until CDL expiry
driverSchema.virtual('daysUntilCdlExpiry').get(function() {
  if (!this.cdl?.expiryDate) return null;
  const now = new Date();
  const expiry = new Date(this.cdl.expiryDate);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

// Virtual for days until medical expiry
driverSchema.virtual('daysUntilMedicalExpiry').get(function() {
  if (!this.medicalCard?.expiryDate) return null;
  const now = new Date();
  const expiry = new Date(this.medicalCard.expiryDate);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

// Handle archiving when status changes to terminated
driverSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'terminated') {
    this.isArchived = true;
    this.archivedAt = new Date();
    if (!this.terminationDate) {
      this.terminationDate = new Date();
    }
    const termDate = new Date(this.terminationDate);
    this.retentionExpiresAt = new Date(termDate.getTime() + 3 * 365.25 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Update compliance status before save
driverSchema.pre('save', function(next) {
  // Update CDL status
  this.complianceStatus.cdlStatus = getDocumentStatus(this.cdl?.expiryDate);

  // Update Medical status
  this.complianceStatus.medicalStatus = getDocumentStatus(this.medicalCard?.expiryDate);

  // Update MVR status
  const latestMvr = this.documents?.mvrReviews?.sort((a, b) =>
    new Date(b.reviewDate) - new Date(a.reviewDate)
  )[0];
  if (latestMvr) {
    const daysSinceReview = Math.floor((new Date() - new Date(latestMvr.reviewDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceReview > 365) {
      this.complianceStatus.mvrStatus = 'overdue';
    } else if (daysSinceReview > 335) {
      this.complianceStatus.mvrStatus = 'due';
    } else {
      this.complianceStatus.mvrStatus = 'current';
    }
  } else {
    this.complianceStatus.mvrStatus = 'missing';
  }

  // Update Clearinghouse status
  if (this.clearinghouse?.lastQueryDate) {
    const daysSinceQuery = Math.floor((new Date() - new Date(this.clearinghouse.lastQueryDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceQuery > 365) {
      this.complianceStatus.clearinghouseStatus = 'overdue';
    } else if (daysSinceQuery > 335) {
      this.complianceStatus.clearinghouseStatus = 'due';
    } else {
      this.complianceStatus.clearinghouseStatus = 'current';
    }
  } else {
    this.complianceStatus.clearinghouseStatus = 'missing';
  }

  // Calculate overall status
  const statuses = [
    this.complianceStatus.cdlStatus,
    this.complianceStatus.medicalStatus,
    this.complianceStatus.mvrStatus,
    this.complianceStatus.clearinghouseStatus
  ];

  if (statuses.includes('expired') || statuses.includes('overdue') || statuses.includes('missing')) {
    this.complianceStatus.overall = 'non_compliant';
  } else if (statuses.includes('due_soon') || statuses.includes('due')) {
    this.complianceStatus.overall = 'warning';
  } else {
    this.complianceStatus.overall = 'compliant';
  }

  next();
});

// Indexes
driverSchema.index({ companyId: 1, status: 1 });
driverSchema.index({ 'cdl.expiryDate': 1 });
driverSchema.index({ 'medicalCard.expiryDate': 1 });
driverSchema.index({ 'complianceStatus.overall': 1 });
driverSchema.index({ companyId: 1, isArchived: 1 });

module.exports = mongoose.model('Driver', driverSchema);
