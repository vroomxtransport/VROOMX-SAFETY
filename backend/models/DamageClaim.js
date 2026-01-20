const mongoose = require('mongoose');

const damageClaimSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Claim Identification
  claimNumber: {
    type: String,
    unique: true
  },

  // Incident Details
  incidentDate: {
    type: Date,
    required: [true, 'Incident date is required']
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },

  // Assignments
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  tripId: {
    type: String,
    trim: true
  },

  // Damage Classification
  damageType: {
    type: String,
    enum: ['cargo_damage', 'vehicle_damage', 'property_damage', 'third_party', 'other'],
    required: [true, 'Damage type is required']
  },

  // Fault & Liability
  faultParty: {
    type: String,
    enum: ['driver', 'company', 'third_party', 'unknown', 'weather', 'mechanical'],
    required: [true, 'Fault party is required'],
    default: 'unknown'
  },

  // Financial
  claimAmount: {
    type: Number,
    required: [true, 'Claim amount is required'],
    min: [0, 'Claim amount cannot be negative'],
    default: 0
  },
  settlementAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  deductionFromDriver: {
    type: Number,
    min: 0,
    default: 0
  },

  // Insurance
  insuranceClaimNumber: {
    type: String,
    trim: true
  },
  insuranceCompany: {
    type: String,
    trim: true
  },
  insuranceStatus: {
    type: String,
    enum: ['not_filed', 'filed', 'under_review', 'approved', 'denied'],
    default: 'not_filed'
  },

  // Status Workflow
  status: {
    type: String,
    enum: ['open', 'under_investigation', 'pending_settlement', 'settled', 'closed', 'denied'],
    default: 'open'
  },

  // Resolution
  resolutionNotes: {
    type: String,
    trim: true
  },
  resolvedDate: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Documents/Evidence
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Audit Trail
  history: [{
    action: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    details: String
  }],

  // Notes
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

// Virtual: Check if driver is at fault
damageClaimSchema.virtual('isDriverFault').get(function() {
  return this.faultParty === 'driver';
});

// Virtual: Check if settled
damageClaimSchema.virtual('isSettled').get(function() {
  return ['settled', 'closed'].includes(this.status);
});

// Virtual: Outstanding amount
damageClaimSchema.virtual('outstandingAmount').get(function() {
  return this.claimAmount - this.settlementAmount;
});

// Virtual: Days since incident
damageClaimSchema.virtual('daysSinceIncident').get(function() {
  return Math.floor((new Date() - new Date(this.incidentDate)) / (1000 * 60 * 60 * 24));
});

// Auto-generate claim number before save
damageClaimSchema.pre('save', async function(next) {
  if (!this.claimNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Count existing claims today to generate sequence
    const count = await mongoose.model('DamageClaim').countDocuments({
      claimNumber: new RegExp(`^CLM-${dateStr}`)
    });

    const sequence = String(count + 1).padStart(3, '0');
    this.claimNumber = `CLM-${dateStr}-${sequence}`;
  }
  next();
});

// Add history entry on save
damageClaimSchema.pre('save', function(next) {
  if (this.isNew) {
    this.history.push({
      action: 'created',
      changedAt: new Date(),
      details: 'Claim created'
    });
  }
  next();
});

// Indexes
damageClaimSchema.index({ companyId: 1, incidentDate: -1 });
damageClaimSchema.index({ claimNumber: 1 }, { unique: true });
damageClaimSchema.index({ status: 1 });
damageClaimSchema.index({ driverId: 1 });
damageClaimSchema.index({ vehicleId: 1 });
damageClaimSchema.index({ faultParty: 1 });
damageClaimSchema.index({ damageType: 1 });

module.exports = mongoose.model('DamageClaim', damageClaimSchema);
