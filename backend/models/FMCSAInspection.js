const mongoose = require('mongoose');

/**
 * FMCSA Inspection Model
 * Stores inspection records imported from FMCSA SMS system
 */
const fmcsaInspectionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Inspection Identification
  reportNumber: {
    type: String,
    required: true
  },
  inspectionDate: {
    type: Date,
    required: true,
    index: true
  },

  // Location
  state: String,
  location: String,

  // Inspection Type & Level
  inspectionLevel: {
    type: Number,
    min: 1,
    max: 6
  },
  inspectionType: {
    type: String,
    enum: ['roadside', 'terminal', 'post_crash', 'complaint', 'other'],
    default: 'roadside'
  },

  // Out-of-Service Status
  vehicleOOS: {
    type: Boolean,
    default: false
  },
  driverOOS: {
    type: Boolean,
    default: false
  },
  hazmatOOS: {
    type: Boolean,
    default: false
  },

  // Violation Summary
  totalViolations: {
    type: Number,
    default: 0
  },

  // Individual Violations
  violations: [{
    code: String,           // CFR code (e.g., "395.8A")
    description: String,
    basic: {
      type: String,
      enum: ['unsafe_driving', 'hours_of_service', 'vehicle_maintenance',
             'controlled_substances', 'driver_fitness', 'crash_indicator', 'hazmat']
    },
    severityWeight: {
      type: Number,
      min: 1,
      max: 10
    },
    oos: Boolean,           // Out-of-service violation
    unit: {                 // What was cited
      type: String,
      enum: ['driver', 'vehicle', 'hazmat', 'other']
    },
    timeWeight: Number      // Calculated time weight (3x, 2x, 1x based on age)
  }],

  // Unit Information (if available)
  unitInfo: {
    vehicleType: String,
    vehicleLicense: String,
    vehicleState: String,
    driverLicense: String,
    driverState: String
  },

  // Import Metadata
  importedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'fmcsa_sms'
  },
  rawData: mongoose.Schema.Types.Mixed  // Store raw scraped data for debugging

}, {
  timestamps: true
});

// Compound index for unique inspection per company
fmcsaInspectionSchema.index({ companyId: 1, reportNumber: 1 }, { unique: true });

// Index for date-based queries
fmcsaInspectionSchema.index({ companyId: 1, inspectionDate: -1 });

// Virtual for total OOS violations in this inspection
fmcsaInspectionSchema.virtual('oosViolationCount').get(function() {
  return this.violations?.filter(v => v.oos).length || 0;
});

// Virtual for BASIC breakdown
fmcsaInspectionSchema.virtual('violationsByBasic').get(function() {
  const breakdown = {};
  this.violations?.forEach(v => {
    if (v.basic) {
      breakdown[v.basic] = (breakdown[v.basic] || 0) + 1;
    }
  });
  return breakdown;
});

// Calculate time weights for violations based on inspection age
fmcsaInspectionSchema.methods.calculateTimeWeights = function() {
  const now = new Date();
  const inspectionDate = new Date(this.inspectionDate);
  const monthsOld = (now - inspectionDate) / (1000 * 60 * 60 * 24 * 30);

  let timeWeight;
  if (monthsOld <= 12) {
    timeWeight = 3; // Current year - 3x weight
  } else if (monthsOld <= 24) {
    timeWeight = 2; // 1-2 years ago - 2x weight
  } else {
    timeWeight = 1; // 2+ years ago - 1x weight
  }

  this.violations.forEach(v => {
    v.timeWeight = timeWeight;
  });

  return this;
};

// Ensure virtuals are included in JSON
fmcsaInspectionSchema.set('toJSON', { virtuals: true });
fmcsaInspectionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FMCSAInspection', fmcsaInspectionSchema);
