const mongoose = require('mongoose');

const accidentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Accident Details
  accidentDate: {
    type: Date,
    required: [true, 'Accident date is required']
  },
  accidentTime: String,
  reportNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Location
  location: {
    address: String,
    city: String,
    state: { type: String, required: true },
    zipCode: String,
    latitude: Number,
    longitude: Number,
    roadway: String,
    mileMarker: String
  },

  // Associated Records
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  trailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  // Accident Classification (DOT Recordable)
  isDotRecordable: {
    type: Boolean,
    default: false
  },
  recordableCriteria: {
    fatality: { type: Boolean, default: false },
    injury: { type: Boolean, default: false }, // Injury requiring immediate medical treatment away from scene
    towAway: { type: Boolean, default: false } // Any vehicle towed due to disabling damage
  },

  // Severity
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'severe', 'fatal'],
    required: true
  },

  // Accident Type
  accidentType: {
    type: String,
    enum: [
      'rear_end', 'head_on', 'sideswipe', 'angle', 'rollover',
      'jackknife', 'cargo_spill', 'fire', 'pedestrian', 'cyclist',
      'fixed_object', 'animal', 'weather_related', 'other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Accident description is required']
  },

  // Conditions
  weatherConditions: {
    type: String,
    enum: ['clear', 'rain', 'snow', 'ice', 'fog', 'wind', 'other']
  },
  roadConditions: {
    type: String,
    enum: ['dry', 'wet', 'icy', 'snowy', 'construction', 'other']
  },
  lightConditions: {
    type: String,
    enum: ['daylight', 'dawn', 'dusk', 'dark_lit', 'dark_unlit']
  },

  // Injuries/Fatalities
  injuries: [{
    type: { type: String, enum: ['driver', 'passenger', 'other_vehicle', 'pedestrian', 'cyclist'] },
    name: String,
    severity: { type: String, enum: ['minor', 'moderate', 'serious', 'fatal'] },
    description: String
  }],
  totalInjuries: { type: Number, default: 0 },
  totalFatalities: { type: Number, default: 0 },

  // Vehicles Involved
  otherVehicles: [{
    vehicleType: String,
    make: String,
    model: String,
    licensePlate: String,
    driverName: String,
    driverPhone: String,
    insuranceCompany: String,
    insurancePolicy: String
  }],

  // Law Enforcement
  policeReport: {
    filed: { type: Boolean, default: false },
    reportNumber: String,
    department: String,
    officerName: String,
    officerBadge: String,
    citationIssued: Boolean,
    citationDetails: String,
    documentUrl: String
  },

  // Drug/Alcohol Testing (Post-Accident)
  postAccidentTesting: {
    required: { type: Boolean, default: false },
    drugTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrugAlcoholTest' },
    testingNotes: String
  },

  // Damage Assessment
  vehicleDamage: {
    description: String,
    estimatedCost: Number,
    repairable: Boolean,
    outOfService: Boolean
  },
  cargoDamage: {
    description: String,
    estimatedCost: Number,
    hazmatSpill: Boolean,
    hazmatDetails: String
  },
  propertyDamage: {
    description: String,
    estimatedCost: Number
  },
  totalEstimatedCost: Number,

  // Insurance Claim
  insuranceClaim: {
    filed: { type: Boolean, default: false },
    claimNumber: String,
    claimDate: Date,
    adjustorName: String,
    adjustorPhone: String,
    status: { type: String, enum: ['pending', 'under_review', 'approved', 'denied', 'settled'] },
    settlementAmount: Number,
    settlementDate: Date
  },

  // Witnesses
  witnesses: [{
    name: String,
    phone: String,
    email: String,
    statement: String,
    documentUrl: String
  }],

  // Investigation
  investigation: {
    conductedBy: String,
    startDate: Date,
    completionDate: Date,
    findings: String,
    preventable: Boolean,
    preventableReason: String,
    correctiveActions: [{
      action: String,
      assignedTo: String,
      dueDate: Date,
      completedDate: Date,
      status: { type: String, enum: ['pending', 'in_progress', 'completed'] }
    }]
  },

  // Documents
  documents: [{
    name: String,
    type: { type: String, enum: ['accident_report', 'police_report', 'photos', 'diagram', 'witness_statement', 'insurance', 'other'] },
    uploadDate: Date,
    documentUrl: String
  }],

  // Status
  status: {
    type: String,
    enum: ['reported', 'under_investigation', 'closed'],
    default: 'reported'
  },

  // Notes
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save: Calculate DOT recordable status
accidentSchema.pre('save', function(next) {
  // DOT recordable if fatality, injury requiring immediate off-scene treatment, or tow-away
  this.isDotRecordable = (
    this.recordableCriteria.fatality ||
    this.recordableCriteria.injury ||
    this.recordableCriteria.towAway
  );

  // Update severity based on criteria
  if (this.recordableCriteria.fatality) {
    this.severity = 'fatal';
  }

  // Calculate totals
  this.totalInjuries = this.injuries?.filter(i => i.severity !== 'fatal').length || 0;
  this.totalFatalities = this.injuries?.filter(i => i.severity === 'fatal').length || 0;

  // Calculate total estimated cost
  this.totalEstimatedCost = (
    (this.vehicleDamage?.estimatedCost || 0) +
    (this.cargoDamage?.estimatedCost || 0) +
    (this.propertyDamage?.estimatedCost || 0)
  );

  next();
});

// Indexes
accidentSchema.index({ companyId: 1, accidentDate: -1 });
accidentSchema.index({ driverId: 1 });
accidentSchema.index({ vehicleId: 1 });
accidentSchema.index({ isDotRecordable: 1 });
accidentSchema.index({ severity: 1 });
accidentSchema.index({ status: 1 });

module.exports = mongoose.model('Accident', accidentSchema);
