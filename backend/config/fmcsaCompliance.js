/**
 * FMCSA Compliance Configuration
 * Based on 49 CFR Parts 391, 396, 382, and SMS Methodology
 */

// SMS BASICs Categories and Thresholds
// Thresholds vary by carrier type - these are for general freight carriers
const SMS_BASICS_THRESHOLDS = {
  unsafeDriving: {
    name: 'Unsafe Driving',
    description: 'Operation of CMVs in a dangerous or careless manner',
    threshold: 65, // Percentile threshold for alert
    criticalThreshold: 80,
    timeWeight: 3, // Years of data considered
    regulations: ['49 CFR 392']
  },
  hoursOfService: {
    name: 'HOS Compliance',
    description: 'Operating a CMV while ill, fatigued, or in non-compliance with HOS regulations',
    threshold: 65,
    criticalThreshold: 80,
    timeWeight: 3,
    regulations: ['49 CFR 395']
  },
  vehicleMaintenance: {
    name: 'Vehicle Maintenance',
    description: 'Failure to properly maintain CMV and/or proper load securement',
    threshold: 80,
    criticalThreshold: 90,
    timeWeight: 3,
    regulations: ['49 CFR 393', '49 CFR 396']
  },
  controlledSubstances: {
    name: 'Controlled Substances/Alcohol',
    description: 'Operation of a CMV while impaired due to alcohol, illegal drugs, or misuse of prescription medications',
    threshold: 80,
    criticalThreshold: 90,
    timeWeight: 3,
    regulations: ['49 CFR 382', '49 CFR 392.4', '49 CFR 392.5']
  },
  driverFitness: {
    name: 'Driver Fitness',
    description: 'Operation of CMV by drivers who are unfit to operate due to lack of training, experience, or medical qualifications',
    threshold: 80,
    criticalThreshold: 90,
    timeWeight: 3,
    regulations: ['49 CFR 391']
  },
  crashIndicator: {
    name: 'Crash Indicator',
    description: 'Histories or patterns of high crash involvement',
    threshold: 65,
    criticalThreshold: 80,
    timeWeight: 2,
    regulations: []
  }
};

// Violation Severity Weights (SMS Methodology)
const VIOLATION_SEVERITY_WEIGHTS = {
  // Unsafe Driving Violations
  speeding: {
    '1-5': 1,
    '6-10': 4,
    '11-14': 5,
    '15+': 7,
    '15+ in work zone': 10
  },
  recklessDriving: 10,
  improperLaneChange: 4,
  followingTooClose: 5,
  failureToYield: 5,
  improperTurn: 4,
  textingWhileDriving: 10,
  seatbeltViolation: 7,

  // HOS Violations
  hosFalseLogBook: 7,
  hosExceedingDrivingLimit: 7,
  hosNoLogBook: 5,
  hosFormMannerViolation: 1,
  hosOutOfService: 10,

  // Vehicle Maintenance Violations
  brakeDefect: {
    adjustment: 4,
    component: 6,
    outOfService: 8
  },
  lightingDefect: 2,
  tireDefect: {
    tread: 3,
    flat: 6,
    outOfService: 8
  },
  loadSecurement: 5,
  frameDefect: 7,
  steeringDefect: 8,
  suspensionDefect: 6,

  // Driver Fitness Violations
  noValidCDL: 8,
  wrongCDLClass: 5,
  noMedicalCard: 5,
  expiredMedicalCard: 4,
  noRequiredEndorsement: 5,

  // Controlled Substances Violations
  alcoholPossession: 10,
  drugPossession: 10,
  positiveAlcoholTest: 10,
  positiveDrugTest: 10,
  refusedTest: 10
};

// Time Weight Factors (for severity calculation)
const TIME_WEIGHT_FACTORS = {
  0: 3,   // Current year
  1: 2,   // 1 year ago
  2: 1    // 2 years ago
};

// Driver Qualification File Requirements (49 CFR 391)
const DQF_REQUIREMENTS = {
  cdl: {
    name: 'Commercial Drivers License',
    regulation: '49 CFR 391.23',
    renewalRequired: true,
    maxValidityYears: 8, // Varies by state
    alertDaysBefore: [90, 60, 30, 14, 7]
  },
  medicalCard: {
    name: 'Medical Examiner Certificate',
    regulation: '49 CFR 391.43',
    renewalRequired: true,
    maxValidityYears: 2,
    alertDaysBefore: [60, 30, 14, 7]
  },
  mvrReview: {
    name: 'Motor Vehicle Record',
    regulation: '49 CFR 391.25',
    renewalRequired: true,
    maxValidityYears: 1,
    alertDaysBefore: [30, 14, 7]
  },
  roadTest: {
    name: 'Road Test Certificate',
    regulation: '49 CFR 391.31',
    renewalRequired: false,
    oneTime: true
  },
  employmentApplication: {
    name: 'Employment Application',
    regulation: '49 CFR 391.21',
    renewalRequired: false,
    oneTime: true,
    retentionYears: 3
  },
  employmentVerification: {
    name: 'Previous Employment Verification',
    regulation: '49 CFR 391.23',
    renewalRequired: false,
    oneTime: true,
    lookbackYears: 10
  },
  drugTestPreEmployment: {
    name: 'Pre-Employment Drug Test',
    regulation: '49 CFR 382.301',
    renewalRequired: false,
    oneTime: true
  },
  clearinghouseQuery: {
    name: 'Clearinghouse Query',
    regulation: '49 CFR 382.701',
    renewalRequired: true,
    maxValidityYears: 1,
    alertDaysBefore: [30, 14, 7]
  }
};

// Vehicle Inspection Requirements (49 CFR 396)
const VEHICLE_INSPECTION_REQUIREMENTS = {
  annualInspection: {
    name: 'Annual DOT Inspection',
    regulation: '49 CFR 396.17',
    frequencyMonths: 12,
    alertDaysBefore: [60, 30, 14, 7]
  },
  preTrip: {
    name: 'Pre-Trip Inspection',
    regulation: '49 CFR 396.13',
    frequencyDays: 1,
    required: true
  },
  postTrip: {
    name: 'Post-Trip Inspection (DVIR)',
    regulation: '49 CFR 396.11',
    frequencyDays: 1,
    required: true
  },
  periodicMaintenance: {
    name: 'Preventive Maintenance',
    regulation: '49 CFR 396.3',
    frequencyMonths: 3, // Recommended, varies by fleet
    alertDaysBefore: [14, 7]
  }
};

// Drug & Alcohol Testing Requirements (49 CFR 382)
const DRUG_ALCOHOL_REQUIREMENTS = {
  testTypes: {
    preEmployment: {
      name: 'Pre-Employment',
      regulation: '49 CFR 382.301',
      required: true,
      drugOnly: true
    },
    random: {
      name: 'Random',
      regulation: '49 CFR 382.305',
      required: true,
      drugRate: 50, // Minimum % of drivers per year
      alcoholRate: 10 // Minimum % of drivers per year
    },
    postAccident: {
      name: 'Post-Accident',
      regulation: '49 CFR 382.303',
      required: 'conditional'
    },
    reasonableSuspicion: {
      name: 'Reasonable Suspicion',
      regulation: '49 CFR 382.307',
      required: 'conditional'
    },
    returnToDuty: {
      name: 'Return-to-Duty',
      regulation: '49 CFR 382.309',
      required: 'conditional'
    },
    followUp: {
      name: 'Follow-Up',
      regulation: '49 CFR 382.311',
      required: 'conditional',
      minTests: 6,
      periodMonths: 12
    }
  },
  clearinghouse: {
    preEmploymentQuery: {
      name: 'Pre-Employment Full Query',
      regulation: '49 CFR 382.701',
      required: true,
      consentRequired: true
    },
    annualQuery: {
      name: 'Annual Limited Query',
      regulation: '49 CFR 382.701',
      required: true,
      frequencyYears: 1
    }
  }
};

// Document Retention Requirements
const DOCUMENT_RETENTION = {
  driverQualificationFile: {
    whileEmployed: true,
    afterTermination: 3 // years
  },
  drugTestRecords: {
    negative: 1, // year
    positive: 5, // years
    refusal: 5 // years
  },
  alcoholTestRecords: {
    negative: 1,
    positive: 5,
    refusal: 5
  },
  vehicleMaintenanceRecords: {
    whileOwned: true,
    afterDisposal: 1 // year after disposal
  },
  inspectionReports: 1, // year
  accidentRegister: 3 // years
};

// Calculate compliance status based on percentile
const getComplianceStatus = (percentile, basicType) => {
  const thresholds = SMS_BASICS_THRESHOLDS[basicType];
  if (!thresholds) return 'unknown';

  if (percentile >= thresholds.criticalThreshold) {
    return 'critical';
  } else if (percentile >= thresholds.threshold) {
    return 'warning';
  } else {
    return 'compliant';
  }
};

// Calculate document status
const getDocumentStatus = (expiryDate) => {
  if (!expiryDate) return 'missing';

  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 30) {
    return 'due_soon';
  } else {
    return 'valid';
  }
};

// Calculate severity points with time weighting
const calculateSeverityPoints = (violations) => {
  const now = new Date();
  let totalPoints = 0;

  violations.forEach(violation => {
    const violationDate = new Date(violation.date);
    const yearsAgo = Math.floor((now - violationDate) / (365.25 * 24 * 60 * 60 * 1000));
    const timeWeight = TIME_WEIGHT_FACTORS[yearsAgo] || 0;

    totalPoints += (violation.severityPoints || 0) * timeWeight;
  });

  return totalPoints;
};

module.exports = {
  SMS_BASICS_THRESHOLDS,
  VIOLATION_SEVERITY_WEIGHTS,
  TIME_WEIGHT_FACTORS,
  DQF_REQUIREMENTS,
  VEHICLE_INSPECTION_REQUIREMENTS,
  DRUG_ALCOHOL_REQUIREMENTS,
  DOCUMENT_RETENTION,
  getComplianceStatus,
  getDocumentStatus,
  calculateSeverityPoints
};
