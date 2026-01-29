const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  dotNumber: {
    type: String,
    required: [true, 'DOT number is required'],
    unique: true,
    match: [/^\d{5,8}$/, 'DOT number must be 5-8 digits']
  },
  mcNumber: {
    type: String,
    match: [/^MC-?\d{6,7}$/i, 'Invalid MC number format']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  phone: {
    type: String,
    match: [/^[\d\-\(\)\s\+]+$/, 'Invalid phone number format']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  carrierType: {
    type: String,
    enum: ['general_freight', 'passenger', 'hazmat', 'household_goods', 'other'],
    default: 'general_freight'
  },
  fleetSize: {
    powerUnits: { type: Number, default: 0 },
    drivers: { type: Number, default: 0 }
  },
  // SMS BASICs Percentiles (can be manually entered or synced from FMCSA)
  smsBasics: {
    unsafeDriving: { type: Number, min: 0, max: 100, default: null },
    hoursOfService: { type: Number, min: 0, max: 100, default: null },
    vehicleMaintenance: { type: Number, min: 0, max: 100, default: null },
    controlledSubstances: { type: Number, min: 0, max: 100, default: null },
    driverFitness: { type: Number, min: 0, max: 100, default: null },
    crashIndicator: { type: Number, min: 0, max: 100, default: null },
    lastUpdated: { type: Date }
  },
  // Important compliance documents
  documents: {
    mcs150: {
      filingDate: Date,
      nextDueDate: Date,
      documentUrl: String
    },
    ucr: {
      year: Number,
      status: { type: String, enum: ['registered', 'pending', 'expired'] },
      documentUrl: String
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      coverageAmount: Number,
      documentUrl: String
    },
    irp: {
      registrationDate: Date,
      expiryDate: Date,
      documentUrl: String
    },
    ifta: {
      licenseNumber: String,
      expiryDate: Date,
      documentUrl: String
    }
  },
  settings: {
    alertEmailEnabled: { type: Boolean, default: true },
    alertDaysBefore: { type: Number, default: 30 },
    randomDrugTestRate: { type: Number, default: 50 },
    randomAlcoholTestRate: { type: Number, default: 10 }
  },

  // FMCSA data from SaferWebAPI
  fmcsaData: {
    // Inspection summary from SaferWebAPI
    inspections: {
      vehicleInspections: { type: Number, default: 0 },
      vehicleOOS: { type: Number, default: 0 },
      vehicleOOSPercent: { type: Number, default: 0 },
      vehicleNationalAvg: { type: Number, default: 0 },
      driverInspections: { type: Number, default: 0 },
      driverOOS: { type: Number, default: 0 },
      driverOOSPercent: { type: Number, default: 0 },
      driverNationalAvg: { type: Number, default: 0 },
      hazmatInspections: { type: Number, default: 0 },
      hazmatOOS: { type: Number, default: 0 },
      iepInspections: { type: Number, default: 0 },
      totalInspections: { type: Number, default: 0 },
      crashes: {
        fatal: { type: Number, default: 0 },
        injury: { type: Number, default: 0 },
        tow: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
      },
      carrier: {
        legalName: { type: String },
        dotNumber: { type: String },
        safetyRating: { type: String },
        operatingStatus: { type: String }
      },
      lastSync: { type: Date }
    },
    lastViolationSync: { type: Date },
    // Raw API response for debugging
    saferWebData: { type: mongoose.Schema.Types.Mixed },
    // Legacy fields
    operatingStatus: { type: String },
    safetyRating: { type: String },
    outOfServiceRate: {
      vehicle: { type: Number },
      driver: { type: Number }
    },
    lastFetched: { type: Date },
    dataSource: { type: String }
  },

  // VroomX Compliance Score (0-100)
  complianceScore: {
    current: { type: Number, min: 0, max: 100, default: null },
    lastCalculated: { type: Date }
  },

  // Company logo for templates
  logo: {
    type: String
  },

  // Owner of the company (user who created it)
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for quick DOT number lookups
companySchema.index({ dotNumber: 1 });
companySchema.index({ ownerId: 1 });

module.exports = mongoose.model('Company', companySchema);
