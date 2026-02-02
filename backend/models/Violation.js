const mongoose = require('mongoose');
const { VIOLATION_SEVERITY_WEIGHTS, TIME_WEIGHT_FACTORS } = require('../config/fmcsaCompliance');

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
           'controlled_substances', 'driver_fitness', 'crash_indicator'],
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
      }
    },
    // Evidence checklist for the challenge
    evidenceChecklist: [{
      item: String,
      required: { type: Boolean, default: false },
      obtained: { type: Boolean, default: false },
      documentUrl: String,
      notes: String
    }]
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
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age in days
violationSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - new Date(this.violationDate)) / (1000 * 60 * 60 * 24));
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
violationSchema.index({ driverId: 1, violationDate: -1 });
violationSchema.index({ vehicleId: 1, violationDate: -1 });
violationSchema.index({ basic: 1 });
violationSchema.index({ status: 1 });
violationSchema.index({ inspectionNumber: 1 });

module.exports = mongoose.model('Violation', violationSchema);
