const mongoose = require('mongoose');
const { getDocumentStatus } = require('../config/fmcsaCompliance');

const vehicleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Vehicle Identification
  unitNumber: {
    type: String,
    required: [true, 'Unit number is required'],
    trim: true
  },
  nickname: {
    type: String,
    trim: true
  },
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    uppercase: true,
    minlength: [16, 'VIN must be 16-17 characters'],
    maxlength: [17, 'VIN must be 16-17 characters']
  },
  vehicleType: {
    type: String,
    enum: ['tractor', 'trailer', 'straight_truck', 'bus', 'van'],
    required: true
  },
  make: String,
  model: String,
  year: {
    type: Number,
    min: 1950,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    number: String,
    state: String,
    expiryDate: Date
  },

  // Vehicle Details
  gvwr: Number, // Gross Vehicle Weight Rating
  gcwr: Number, // Gross Combined Weight Rating
  axles: Number,
  fuelType: {
    type: String,
    enum: ['diesel', 'gasoline', 'electric', 'cng', 'lng', 'hybrid']
  },
  color: String,
  tireSize: {
    type: String,
    trim: true
  },
  ownership: {
    type: String,
    enum: ['leased', 'owned', 'financed'],
    default: 'owned'
  },
  iftaDecalNumber: {
    type: String,
    trim: true
  },
  marketPrice: {
    type: Number,
    min: 0
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },

  // Fleet Dates
  dateAddedToFleet: Date,
  dateRemovedFromFleet: Date,

  // Expiry Dates
  cabCardExpiry: Date,
  annualExpiry: Date, // Separate from annualInspection.nextDueDate

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'out_of_service', 'sold'],
    default: 'active'
  },
  inServiceDate: Date,
  outOfServiceDate: Date,
  statusHistory: [{
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'out_of_service', 'sold']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  // Annual Inspection (49 CFR 396.17)
  annualInspection: {
    lastInspectionDate: Date,
    nextDueDate: Date,
    inspectorName: String,
    inspectorNumber: String, // FMCSA-qualified inspector number
    location: String,
    result: {
      type: String,
      enum: ['pass', 'pass_with_defects', 'fail']
    },
    defectsFound: [{
      description: String,
      severity: { type: String, enum: ['minor', 'major', 'out_of_service'] },
      repaired: { type: Boolean, default: false },
      repairDate: Date
    }],
    documentUrl: String
  },

  // Maintenance Log (49 CFR 396.3)
  maintenanceLog: [{
    date: {
      type: Date,
      required: true
    },
    odometer: Number,
    maintenanceType: {
      type: String,
      enum: ['preventive', 'repair', 'inspection', 'recall', 'breakdown'],
      required: true
    },
    category: {
      type: String,
      enum: ['brakes', 'tires', 'engine', 'transmission', 'steering', 'suspension',
             'electrical', 'lights', 'body', 'coupling', 'exhaust', 'fuel_system', 'other']
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'moderate'
    },
    partsUsed: [{
      partNumber: String,
      description: String,
      quantity: Number,
      cost: Number
    }],
    laborHours: Number,
    laborCost: Number,
    totalCost: Number,
    vendor: {
      name: String,
      phone: String,
      address: String
    },
    performedBy: String,
    workOrderNumber: String,
    documentUrl: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    maintenanceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRecord'
    }
  }],

  // DVIR Records (49 CFR 396.11, 396.13)
  dvirRecords: [{
    date: Date,
    type: { type: String, enum: ['pre_trip', 'post_trip'] },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    odometer: Number,
    defectsReported: [{
      item: String,
      description: String,
      severity: String
    }],
    noDefects: { type: Boolean, default: true },
    driverSignature: String,
    mechanicSignature: String,
    repairsCompleted: { type: Boolean, default: false },
    repairDate: Date,
    documentUrl: String
  }],

  // Preventive Maintenance Schedule
  pmSchedule: {
    intervalMiles: { type: Number, default: 25000 },
    intervalDays: { type: Number, default: 90 },
    lastPmDate: Date,
    lastPmOdometer: Number,
    nextPmDueDate: Date,
    nextPmDueOdometer: Number
  },

  // Current odometer (for tracking PM intervals)
  currentOdometer: {
    reading: Number,
    lastUpdated: Date
  },

  // Registration & Insurance
  registration: {
    state: String,
    expiryDate: Date,
    documentUrl: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    documentUrl: String
  },

  // Compliance Status (calculated)
  complianceStatus: {
    overall: {
      type: String,
      enum: ['compliant', 'warning', 'non_compliant', 'out_of_service'],
      default: 'compliant'
    },
    inspectionStatus: {
      type: String,
      enum: ['current', 'due_soon', 'overdue', 'missing'],
      default: 'current'
    },
    pmStatus: {
      type: String,
      enum: ['current', 'due_soon', 'overdue'],
      default: 'current'
    },
    registrationStatus: {
      type: String,
      enum: ['valid', 'due_soon', 'expired', 'missing'],
      default: 'valid'
    }
  },

  // Alerts
  alerts: [{
    type: {
      type: String,
      enum: ['inspection_due', 'inspection_overdue', 'pm_due', 'registration_expiring',
             'defect_reported', 'out_of_service']
    },
    message: String,
    severity: { type: String, enum: ['info', 'warning', 'critical'] },
    createdAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
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

// Virtual for days until annual inspection due
vehicleSchema.virtual('daysUntilInspection').get(function() {
  if (!this.annualInspection?.nextDueDate) return null;
  const now = new Date();
  const due = new Date(this.annualInspection.nextDueDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});

// Virtual for miles until PM due
vehicleSchema.virtual('milesUntilPm').get(function() {
  if (!this.pmSchedule?.nextPmDueOdometer || !this.currentOdometer?.reading) return null;
  return this.pmSchedule.nextPmDueOdometer - this.currentOdometer.reading;
});

// Update compliance status before save
vehicleSchema.pre('save', function(next) {
  const now = new Date();

  // Track status changes in history
  if (this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    this.statusHistory.push({
      status: this.status,
      changedAt: now
    });
  }

  // Update inspection status
  if (this.annualInspection?.nextDueDate) {
    const daysUntil = Math.ceil((new Date(this.annualInspection.nextDueDate) - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) {
      this.complianceStatus.inspectionStatus = 'overdue';
    } else if (daysUntil <= 30) {
      this.complianceStatus.inspectionStatus = 'due_soon';
    } else {
      this.complianceStatus.inspectionStatus = 'current';
    }
  } else {
    this.complianceStatus.inspectionStatus = 'missing';
  }

  // Update PM status
  if (this.pmSchedule?.nextPmDueDate) {
    const daysUntilPm = Math.ceil((new Date(this.pmSchedule.nextPmDueDate) - now) / (1000 * 60 * 60 * 24));
    if (daysUntilPm < 0) {
      this.complianceStatus.pmStatus = 'overdue';
    } else if (daysUntilPm <= 14) {
      this.complianceStatus.pmStatus = 'due_soon';
    } else {
      this.complianceStatus.pmStatus = 'current';
    }
  }

  // Update registration status
  this.complianceStatus.registrationStatus = getDocumentStatus(this.registration?.expiryDate);

  // Calculate overall status
  if (this.status === 'out_of_service') {
    this.complianceStatus.overall = 'out_of_service';
  } else if (
    this.complianceStatus.inspectionStatus === 'overdue' ||
    this.complianceStatus.inspectionStatus === 'missing' ||
    this.complianceStatus.registrationStatus === 'expired'
  ) {
    this.complianceStatus.overall = 'non_compliant';
  } else if (
    this.complianceStatus.inspectionStatus === 'due_soon' ||
    this.complianceStatus.pmStatus === 'due_soon' ||
    this.complianceStatus.pmStatus === 'overdue' ||
    this.complianceStatus.registrationStatus === 'due_soon'
  ) {
    this.complianceStatus.overall = 'warning';
  } else {
    this.complianceStatus.overall = 'compliant';
  }

  next();
});

// Indexes
vehicleSchema.index({ companyId: 1, status: 1 });
vehicleSchema.index({ unitNumber: 1 });
vehicleSchema.index({ vin: 1 });
vehicleSchema.index({ 'annualInspection.nextDueDate': 1 });
vehicleSchema.index({ 'complianceStatus.overall': 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
