const mongoose = require('mongoose');

/**
 * FMCSA Inspection Model
 * Stores inspection records imported from FMCSA SMS system
 *
 * NOTE: This model is transitioning from embedded violations to referenced violations.
 * - violations[] (DEPRECATED): Legacy embedded array, kept for migration
 * - violationRefs[]: References to Violation documents (SSOT)
 * See Phase 2 migration plan for details.
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

  /**
   * @deprecated Use violationRefs[] instead. This embedded array will be removed after Phase 2 migration.
   * Violations should be stored in the Violation collection and referenced here.
   * Migration: Phase 2 will extract these to Violation documents and populate violationRefs.
   */
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

  // References to Violation documents (SSOT)
  // Populated after Phase 2 migration extracts embedded violations
  violationRefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Violation'
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

// Index for finding inspections by linked violations
fmcsaInspectionSchema.index({ violationRefs: 1 });

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

/**
 * Virtual that returns violation count from either source.
 * During migration: prefers violationRefs if populated, falls back to embedded.
 * After migration: violationRefs will always be used.
 */
fmcsaInspectionSchema.virtual('violationCount').get(function() {
  if (this.violationRefs && this.violationRefs.length > 0) {
    return this.violationRefs.length;
  }
  return this.violations?.length || 0;
});

/**
 * Virtual that indicates whether this inspection has been migrated.
 * True if violationRefs is populated, false if still using embedded violations.
 */
fmcsaInspectionSchema.virtual('isMigrated').get(function() {
  return this.violationRefs && this.violationRefs.length > 0;
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
