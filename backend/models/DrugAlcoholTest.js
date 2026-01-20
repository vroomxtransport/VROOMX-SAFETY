const mongoose = require('mongoose');

const drugAlcoholTestSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },

  // Test Information
  testType: {
    type: String,
    enum: ['pre_employment', 'random', 'post_accident', 'reasonable_suspicion', 'return_to_duty', 'follow_up'],
    required: true
  },
  testDate: {
    type: Date,
    required: true
  },
  testTime: String,

  // Drug Test Details
  drugTest: {
    performed: { type: Boolean, default: false },
    specimenId: String,
    collectionSite: {
      name: String,
      address: String,
      phone: String
    },
    collectorName: String,
    mroName: String, // Medical Review Officer
    mroPhone: String,
    labName: String,
    result: {
      type: String,
      enum: ['negative', 'positive', 'refused', 'cancelled', 'pending']
    },
    substancesFound: [{
      substance: String,
      level: String
    }],
    verifiedDate: Date,
    documentUrl: String
  },

  // Alcohol Test Details
  alcoholTest: {
    performed: { type: Boolean, default: false },
    batName: String, // Breath Alcohol Technician
    batNumber: String,
    deviceType: String, // EBT type
    deviceSerial: String,
    testingSite: {
      name: String,
      address: String
    },
    screeningResult: Number, // BAC level
    confirmationResult: Number,
    result: {
      type: String,
      enum: ['negative', 'positive', 'refused', 'cancelled', 'pending']
    },
    documentUrl: String
  },

  // Overall Result
  overallResult: {
    type: String,
    enum: ['negative', 'positive', 'refused', 'cancelled', 'pending'],
    required: true
  },

  // For Post-Accident Tests
  accidentInfo: {
    date: Date,
    location: String,
    description: String,
    citation: Boolean,
    fatality: Boolean,
    bodilyInjury: Boolean,
    vehicleTowed: Boolean,
    accidentReportNumber: String
  },

  // For Reasonable Suspicion Tests
  reasonableSuspicion: {
    observerName: String,
    observerTitle: String,
    observations: String,
    observationDate: Date,
    observationTime: String,
    trainingCompleted: Boolean,
    documentUrl: String // RS documentation
  },

  // For Follow-Up Tests
  followUpInfo: {
    testNumber: Number, // e.g., 1 of 6
    totalRequired: Number,
    sapName: String, // Substance Abuse Professional
    sapRecommendation: String,
    programStartDate: Date,
    programEndDate: Date
  },

  // Clearinghouse Reporting
  clearinghouse: {
    reported: { type: Boolean, default: false },
    reportDate: Date,
    reportType: { type: String, enum: ['positive', 'refusal', 'rtu_negative'] },
    confirmationNumber: String
  },

  // Return to Duty Process (if positive/refused)
  returnToDuty: {
    sapReferralDate: Date,
    sapName: String,
    sapLicense: String,
    sapPhone: String,
    initialEvaluationDate: Date,
    treatmentRequired: Boolean,
    treatmentCompleted: Boolean,
    treatmentCompletionDate: Date,
    followUpEvaluationDate: Date,
    rtdTestDate: Date,
    rtdTestResult: String,
    clearedForDuty: Boolean,
    clearedDate: Date,
    followUpPlan: {
      minTests: Number,
      periodMonths: Number,
      testsCompleted: Number
    }
  },

  // Consent
  consent: {
    signed: { type: Boolean, default: false },
    signedDate: Date,
    documentUrl: String
  },

  // Chain of Custody
  chainOfCustody: {
    ccfNumber: String,
    documentUrl: String
  },

  // Status
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'no_show', 'cancelled'],
    default: 'scheduled'
  },

  // Documents
  documents: [{
    name: String,
    type: { type: String, enum: ['ccf', 'mro_report', 'bat_report', 'sap_report', 'consent', 'other'] },
    uploadDate: Date,
    documentUrl: String
  }],

  // Notes
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
drugAlcoholTestSchema.index({ companyId: 1, testDate: -1 });
drugAlcoholTestSchema.index({ driverId: 1, testDate: -1 });
drugAlcoholTestSchema.index({ testType: 1 });
drugAlcoholTestSchema.index({ overallResult: 1 });
drugAlcoholTestSchema.index({ 'clearinghouse.reported': 1 });

module.exports = mongoose.model('DrugAlcoholTest', drugAlcoholTestSchema);
