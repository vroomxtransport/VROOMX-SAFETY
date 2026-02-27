const mongoose = require('mongoose');
const { VIOLATION_SEVERITY_WEIGHTS, TIME_WEIGHT_FACTORS } = require('../config/fmcsaCompliance');
const { isMovingViolation } = require('../config/violationCodes');

const violationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Violation Details
  inspectionNumber: {
    type: String,
    required: [true, 'Inspection number is required']
  },
  violationDate: {
    type: Date,
    required: [true, 'Violation date is required']
  },
  location: {
    city: String,
    state: String,
    address: String
  },

  // Associated Records
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  // Violation Classification
  basic: {
    type: String,
    enum: ['unsafe_driving', 'hours_of_service', 'vehicle_maintenance',
           'controlled_substances', 'driver_fitness', 'crash_indicator', 'hazmat'],
    required: true
  },
  violationType: {
    type: String,
    required: [true, 'Violation type is required']
  },
  violationCode: String, // CFR reference (e.g., "392.2S")
  description: {
    type: String,
    required: [true, 'Violation description is required']
  },

  // Severity
  severityWeight: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  outOfService: {
    type: Boolean,
    default: false
  },
  crashRelated: {
    type: Boolean,
    default: false
  },

  // Calculated weighted severity (with time decay)
  weightedSeverity: {
    type: Number
  },

  // Inspection Context
  inspectionType: {
    type: String,
    enum: ['roadside', 'terminal', 'post_crash', 'complaint'],
    default: 'roadside'
  },
  inspectionLevel: {
    type: Number,
    min: 1,
    max: 6
  },
  inspectorName: String,
  inspectorBadge: String,
  issuingAgency: String,

  // Status & Dispute (DataQ)
  status: {
    type: String,
    enum: ['open', 'dispute_in_progress', 'resolved', 'dismissed', 'upheld'],
    default: 'open'
  },

  // DataQ Challenge Process
  dataQChallenge: {
    submitted: { type: Boolean, default: false },
    submissionDate: Date,
    caseNumber: String,
    challengeType: {
      type: String,
      enum: ['data_error', 'policy_violation', 'procedural_error', 'not_responsible']
    },
    rdrType: String,
    reason: String,
    supportingDocuments: [{
      name: String,
      uploadDate: Date,
      documentUrl: String
    }],
    status: {
      type: String,
      enum: ['pending', 'under_review', 'accepted', 'denied', 'withdrawn']
    },
    responseDate: Date,
    responseNotes: String,
    stateReview: {
      submitted: Boolean,
      submissionDate: Date,
      result: String,
      responseDate: Date
    },
    // AI-powered analysis fields
    aiAnalysis: {
      score: { type: Number, min: 0, max: 100 },
      factors: [String],
      confidence: { type: String, enum: ['low', 'medium', 'high'] },
      recommendation: { type: String, enum: ['strongly_recommend', 'recommend', 'neutral', 'not_recommended'] },
      generatedAt: Date
    },
    // AI-generated challenge letter
    generatedLetter: {
      content: String,
      generatedAt: Date,
      challengeType: {
        type: String,
        enum: ['data_error', 'policy_violation', 'procedural_error', 'not_responsible']
      },
      rdrType: String
    },
    // Evidence checklist for the challenge
    evidenceChecklist: [{
      item: String,
      required: { type: Boolean, default: false },
      obtained: { type: Boolean, default: false },
      documentUrl: String,
      notes: String
    }],
    // CPDP-specific fields (Phase 5)
    cpdp: {
      crashTypeId: Number,
      crashTypeName: String,
      parUploaded: { type: Boolean, default: false },
      parDocumentUrl: String
    },
    // Multi-round tracking (Phase 10)
    rounds: [{
      roundNumber: Number,
      type: { type: String, enum: ['initial', 'reconsideration', 'fmcsa_escalation'] },
      submissionDate: Date,
      status: String,
      responseDate: Date,
      outcome: { type: String, enum: ['approved', 'denied', 'not_eligible'] },
      responseNotes: String,
      letterContent: String
    }],
    pendingResponseDeadline: Date,
    notificationHistory: [{
      sentAt: Date,
      channel: { type: String, enum: ['push', 'sms', 'email'] },
      type: String
    }],
    denialWorkflow: {
      selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] },
      actionTaken: { type: Boolean, default: false },
      actionDate: Date
    },
    // Evidence strength score (Phase 4)
    evidenceStrength: {
      score: { type: Number, min: 0, max: 10 },
      label: String,
      lastCalculated: Date
    },
    // Letter quality check (Phase 9)
    letterQualityCheck: {
      passed: Boolean,
      issues: [String],
      checkedAt: Date
    }
  },

  // Health Check Scanner Results
  scanResults: {
    lastScannedAt: Date,
    scanVersion: { type: Number, default: 1 },
    category: {
      type: String,
      enum: ['easy_win', 'worth_challenging', 'unlikely', 'expiring_soon']
    },
    priorityScore: { type: Number, min: 0, max: 100 },
    flagCount: { type: Number, default: 0 },
    checks: {
      wrongCarrier: {
        flagged: { type: Boolean, default: false },
        confidence: { type: String, enum: ['high', 'medium', 'low'] },
        reason: String,
        details: mongoose.Schema.Types.Mixed
      },
      duplicate: {
        flagged: { type: Boolean, default: false },
        confidence: { type: String, enum: ['high', 'medium', 'low'] },
        reason: String,
        details: mongoose.Schema.Types.Mixed
      },
      courtDismissal: {
        flagged: { type: Boolean, default: false },
        confidence: { type: String, enum: ['high', 'medium', 'low'] },
        reason: String,
        details: {
          courtOutcome: { type: String, enum: ['dismissed', 'reduced', 'guilty', 'pending', 'not_applicable'] },
          courtDate: Date,
          courtNotes: String,
          userReported: { type: Boolean, default: false }
        }
      },
      nonReportableCrash: {
        flagged: { type: Boolean, default: false },
        confidence: { type: String, enum: ['high', 'medium', 'low'] },
        reason: String,
        details: mongoose.Schema.Types.Mixed
      },
      cpdpEligible: {
        flagged: { type: Boolean, default: false },
        confidence: { type: String, enum: ['high', 'medium', 'low'] },
        reason: String,
        details: mongoose.Schema.Types.Mixed
      },
      timeDecay: {
        flagged: { type: Boolean, default: false },
        reason: String,
        details: {
          ageInMonths: Number,
          currentTimeWeight: Number,
          monthsUntilWeightDrop: Number,
          monthsUntilExpiry: Number,
          urgency: { type: String, enum: ['urgent', 'expiring_soon', 'standard', 'low_priority'] }
        }
      }
    },
    removalImpact: {
      basic: String,
      pointsRemoved: Number,
      currentPercentile: Number,
      projectedPercentile: Number,
      percentileChange: Number,
      crossesThreshold: Boolean,
      thresholdCrossed: String
    },
    triageBreakdown: {
      violationTypeScore: Number,
      evidenceScore: Number,
      timeScore: Number,
      stateScore: Number,
      csaImpactScore: Number,
      errorProneBonus: Number,
      flagBonus: Number,
      penaltyDeductions: Number
    },
    roiEstimate: {
      pointsRemoved: Number,
      percentileChange: Number,
      estimatedAnnualSavings: Number,
      crossesThreshold: Boolean,
      thresholdCrossed: String
    },
    recommendation: {
      action: { type: String, enum: ['strong', 'worth_trying', 'weak', 'not_recommended'] },
      label: String,
      reason: String
    }
  },

  // Financial Impact
  fineAmount: Number,
  finePaid: { type: Boolean, default: false },
  paymentDate: Date,

  // Documents
  documents: [{
    name: String,
    type: { type: String, enum: ['inspection_report', 'citation', 'evidence', 'dataq_submission', 'other'] },
    uploadDate: Date,
    documentUrl: String
  }],

  // Resolution
  resolution: {
    date: Date,
    action: String,
    correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  },

  // Audit Trail
  history: [{
    action: String,
    date: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],

  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // FMCSA Sync Metadata - tracks data origin for sync pipeline (Phase 3)
  syncMetadata: {
    source: {
      type: String,
      enum: ['manual', 'datahub_api', 'saferweb_api', 'fmcsa_sms'],
      default: 'manual'
    },
    importedAt: Date,
    externalId: String,
    lastVerified: Date
  },

  // Entity Linking Metadata - for Phase 4 entity linking
  linkingMetadata: {
    driverConfidence: {
      type: Number,
      min: 0,
      max: 100
    },
    vehicleConfidence: {
      type: Number,
      min: 0,
      max: 100
    },
    linkingMethod: {
      type: String,
      enum: ['cdl_exact', 'cdl_fuzzy', 'vin_exact', 'vin_fuzzy', 'unit_number', 'manual', null]
    },
    linkedAt: Date,
    reviewRequired: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age in days
violationSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - new Date(this.violationDate)) / (1000 * 60 * 60 * 24));
});

// Moving violation keywords for fallback detection when violationCode is missing
const MOVING_KEYWORDS = [
  'speeding', 'speed', 'mph over',
  'reckless', 'careless',
  'lane change', 'improper lane',
  'failure to yield', 'yield right',
  'following too close', 'tailgating',
  'traffic control', 'traffic signal', 'red light', 'stop sign',
  'improper passing',
  'improper turn',
  'texting', 'hand-held', 'mobile phone', 'cell phone',
  'railroad crossing',
  'seat belt'
];

// Virtual for moving violation classification
violationSchema.virtual('isMoving').get(function() {
  // Primary: code-based lookup
  if (this.violationCode && isMovingViolation(this.violationCode)) {
    return true;
  }

  // Fallback: unsafe_driving BASIC + description keyword matching
  if (this.basic === 'unsafe_driving') {
    const searchText = `${this.violationType || ''} ${this.description || ''}`.toLowerCase();
    return MOVING_KEYWORDS.some(kw => searchText.includes(kw));
  }

  return false;
});

// Calculate weighted severity before save
violationSchema.pre('save', function(next) {
  const now = new Date();
  const violationDate = new Date(this.violationDate);
  const yearsAgo = Math.floor((now - violationDate) / (365.25 * 24 * 60 * 60 * 1000));
  const timeWeight = TIME_WEIGHT_FACTORS[yearsAgo] || 0;

  this.weightedSeverity = this.severityWeight * timeWeight;
  next();
});

// Indexes
violationSchema.index({ companyId: 1, violationDate: -1 });
violationSchema.index({ companyId: 1, 'location.state': 1 });
violationSchema.index({ driverId: 1, violationDate: -1 });
violationSchema.index({ vehicleId: 1, violationDate: -1 });
violationSchema.index({ basic: 1 });
violationSchema.index({ status: 1 });
violationSchema.index({ inspectionNumber: 1 });

// Unique constraint to prevent duplicate violation imports
// A violation is uniquely identified by inspection + code + date
violationSchema.index(
  { companyId: 1, inspectionNumber: 1, violationCode: 1, violationDate: 1 },
  { unique: true, sparse: true, name: 'unique_violation_per_inspection' }
);

// Index for fast lookup during sync by external ID
violationSchema.index({ 'syncMetadata.externalId': 1 }, { sparse: true });

// Health Check scanner indexes
violationSchema.index({ companyId: 1, 'scanResults.category': 1 });
violationSchema.index({ companyId: 1, 'scanResults.flagCount': -1 });
violationSchema.index({ companyId: 1, 'scanResults.priorityScore': -1 });

module.exports = mongoose.model('Violation', violationSchema);
