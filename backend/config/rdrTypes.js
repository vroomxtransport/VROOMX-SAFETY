/**
 * FMCSA Request for Data Review (RDR) Types
 *
 * All 23 RDR types used by the FMCSA DataQs system.
 * Single source of truth — frontend mirrors this file.
 */

const RDR_TYPES = {
  // ==================== CRASH (7) ====================
  CRASH_WRONG_CARRIER: {
    code: 'CRASH_WRONG_CARRIER',
    name: 'Crash – Assigned to Wrong Carrier',
    category: 'crash',
    reviewer: 'state',
    description: 'The crash record was assigned to the wrong motor carrier. Use when your company was not the carrier involved or when a different carrier should be assigned.',
    evidenceRequired: [
      { item: 'Proof of non-involvement (e.g., GPS/ELD data)', required: true },
      { item: 'Police crash report showing correct carrier', required: true },
      { item: 'Lease agreement showing equipment ownership', required: false },
      { item: 'Bill of lading or dispatch records', required: false }
    ],
    legacyChallengeType: 'not_responsible',
    scannerChecks: ['wrongCarrier']
  },
  CRASH_WRONG_DRIVER: {
    code: 'CRASH_WRONG_DRIVER',
    name: 'Crash – Assigned to Wrong Driver',
    category: 'crash',
    reviewer: 'state',
    description: 'The crash record lists the wrong driver. Use when a different driver was operating the vehicle at the time of the crash.',
    evidenceRequired: [
      { item: 'Driver employment records', required: true },
      { item: 'ELD/log data showing actual driver', required: true },
      { item: 'Police crash report', required: false },
      { item: 'Dispatch records', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  CRASH_NOT_REPORTABLE: {
    code: 'CRASH_NOT_REPORTABLE',
    name: 'Crash – Not FMCSA-Reportable',
    category: 'crash',
    reviewer: 'state',
    description: 'The crash does not meet FMCSA reportable thresholds (fatality, injury requiring immediate treatment away from scene, or tow-away of any vehicle).',
    evidenceRequired: [
      { item: 'Police crash report showing no qualifying injuries/fatalities', required: true },
      { item: 'Medical records showing no immediate off-scene treatment', required: false },
      { item: 'Tow records or photos showing vehicles were driven away', required: false },
      { item: 'Written statement from involved parties', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: ['nonReportableCrash']
  },
  CRASH_INCORRECT_INFO: {
    code: 'CRASH_INCORRECT_INFO',
    name: 'Crash – Incorrect Information',
    category: 'crash',
    reviewer: 'state',
    description: 'The crash record contains incorrect factual information (wrong date, location, vehicle info, etc.).',
    evidenceRequired: [
      { item: 'Police crash report with correct information', required: true },
      { item: 'Documentation showing correct facts', required: true },
      { item: 'Photos with timestamps', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  CRASH_CPDP: {
    code: 'CRASH_CPDP',
    name: 'Crash – Not Preventable (CPDP)',
    category: 'crash',
    reviewer: 'fmcsa_hq',
    description: 'The crash was not preventable under the Crash Preventability Determination Program (CPDP). Eligible crash types include being struck by a motorist who was under the influence, wrong-way drivers, etc.',
    evidenceRequired: [
      { item: 'Police crash report', required: true },
      { item: 'Photos/video of the crash scene', required: true },
      { item: 'Dashcam or surveillance footage', required: false },
      { item: 'Witness statements', required: false },
      { item: 'Weather/road condition reports', required: false }
    ],
    legacyChallengeType: 'not_responsible',
    scannerChecks: ['cpdpEligible']
  },
  CRASH_DUPLICATE: {
    code: 'CRASH_DUPLICATE',
    name: 'Crash – Duplicate',
    category: 'crash',
    reviewer: 'state',
    description: 'The same crash has been recorded more than once in the system.',
    evidenceRequired: [
      { item: 'Both crash report numbers showing duplication', required: true },
      { item: 'Police crash report', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: ['duplicate']
  },
  CRASH_MISSING: {
    code: 'CRASH_MISSING',
    name: 'Crash – Missing from Record',
    category: 'crash',
    reviewer: 'state',
    description: 'A crash that should appear on the carrier\'s record is missing. Use to request addition of a favorable crash record.',
    evidenceRequired: [
      { item: 'Police crash report', required: true },
      { item: 'Proof the crash should be on this carrier\'s record', required: true }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },

  // ==================== INSPECTION (8) ====================
  INSPECTION_NEVER_RECEIVED: {
    code: 'INSPECTION_NEVER_RECEIVED',
    name: 'Inspection – Never Received Copy',
    category: 'inspection',
    reviewer: 'state',
    description: 'The carrier/driver never received a copy of the inspection report as required by regulation.',
    evidenceRequired: [
      { item: 'Written statement that inspection copy was never received', required: true },
      { item: 'Communication attempts to obtain the report', required: false }
    ],
    legacyChallengeType: 'procedural_error',
    scannerChecks: []
  },
  INSPECTION_CITATION_COURT: {
    code: 'INSPECTION_CITATION_COURT',
    name: 'Inspection – Citation Dismissed/Reduced in Court',
    category: 'inspection',
    reviewer: 'state',
    description: 'A citation associated with the inspection violation was dismissed or reduced in court. The inspection record should be updated to reflect the court outcome.',
    evidenceRequired: [
      { item: 'Court disposition/judgment document', required: true },
      { item: 'Citation number and court case number', required: true },
      { item: 'Attorney letter or legal documentation', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: ['courtDismissal']
  },
  INSPECTION_VIOLATION_INCORRECT: {
    code: 'INSPECTION_VIOLATION_INCORRECT',
    name: 'Inspection – Violation Incorrect/Duplicate/Missing IEP',
    category: 'inspection',
    reviewer: 'state',
    description: 'The violation code, description, or severity is incorrect; the violation is a duplicate; or an Intermodal Equipment Provider (IEP) should be assigned instead.',
    evidenceRequired: [
      { item: 'Documentation showing correct violation info', required: true },
      { item: 'IEP agreement (if applicable)', required: false },
      { item: 'Inspection report showing duplicate', required: false },
      { item: 'Equipment maintenance records', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  INSPECTION_WRONG_CARRIER: {
    code: 'INSPECTION_WRONG_CARRIER',
    name: 'Inspection – Wrong Motor Carrier',
    category: 'inspection',
    reviewer: 'state',
    description: 'The inspection was assigned to the wrong motor carrier. Use when your company was not the carrier operating the vehicle.',
    evidenceRequired: [
      { item: 'Proof of non-involvement (lease agreement, dispatch records)', required: true },
      { item: 'Correct carrier identification', required: true },
      { item: 'Vehicle registration showing different carrier', required: false },
      { item: 'USDOT number documentation', required: false }
    ],
    legacyChallengeType: 'not_responsible',
    scannerChecks: ['wrongCarrier']
  },
  INSPECTION_WRONG_DRIVER: {
    code: 'INSPECTION_WRONG_DRIVER',
    name: 'Inspection – Wrong Driver',
    category: 'inspection',
    reviewer: 'state',
    description: 'The inspection lists the wrong driver. Use when a different driver was operating the vehicle at the time of inspection.',
    evidenceRequired: [
      { item: 'Driver employment records', required: true },
      { item: 'ELD/log data showing actual driver', required: true },
      { item: 'Dispatch records', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  INSPECTION_INCORRECT_OTHER: {
    code: 'INSPECTION_INCORRECT_OTHER',
    name: 'Inspection – Incorrect Other Info',
    category: 'inspection',
    reviewer: 'state',
    description: 'Other information on the inspection report is incorrect (date, location, vehicle info, inspection level, etc.).',
    evidenceRequired: [
      { item: 'Documentation showing correct information', required: true },
      { item: 'Photos with timestamps', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  INSPECTION_MISSING: {
    code: 'INSPECTION_MISSING',
    name: 'Inspection – Missing from Record',
    category: 'inspection',
    reviewer: 'state',
    description: 'An inspection that should appear on the carrier\'s record is missing. Use to request addition of a clean inspection.',
    evidenceRequired: [
      { item: 'Copy of the inspection report', required: true },
      { item: 'Proof the inspection should be on this carrier\'s record', required: true }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  INSPECTION_DUPLICATE: {
    code: 'INSPECTION_DUPLICATE',
    name: 'Inspection – Duplicate',
    category: 'inspection',
    reviewer: 'state',
    description: 'The same inspection has been recorded more than once in the system.',
    evidenceRequired: [
      { item: 'Both inspection report numbers showing duplication', required: true },
      { item: 'Inspection report copies', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: ['duplicate']
  },

  // ==================== INVESTIGATION/AUDIT (3) ====================
  INVESTIGATION: {
    code: 'INVESTIGATION',
    name: 'Investigation',
    category: 'investigation',
    reviewer: 'fmcsa_division',
    description: 'Challenge information related to a compliance investigation conducted by FMCSA or state partners.',
    evidenceRequired: [
      { item: 'Investigation report or correspondence', required: true },
      { item: 'Documentation supporting your position', required: true },
      { item: 'Corrective action plan (if applicable)', required: false }
    ],
    legacyChallengeType: 'procedural_error',
    scannerChecks: []
  },
  SAFETY_AUDIT: {
    code: 'SAFETY_AUDIT',
    name: 'Safety Audit',
    category: 'investigation',
    reviewer: 'fmcsa_division',
    description: 'Challenge information related to a safety audit.',
    evidenceRequired: [
      { item: 'Safety audit report', required: true },
      { item: 'Documentation showing compliance', required: true },
      { item: 'Corrective action documentation', required: false }
    ],
    legacyChallengeType: 'procedural_error',
    scannerChecks: []
  },
  FINE_NOC_NOV: {
    code: 'FINE_NOC_NOV',
    name: 'Fine from NOC/NOV',
    category: 'investigation',
    reviewer: 'fmcsa_division',
    description: 'Challenge a fine issued from a Notice of Claim (NOC) or Notice of Violation (NOV).',
    evidenceRequired: [
      { item: 'NOC/NOV documentation', required: true },
      { item: 'Evidence of compliance or correction', required: true },
      { item: 'Payment records (if applicable)', required: false }
    ],
    legacyChallengeType: 'policy_violation',
    scannerChecks: []
  },

  // ==================== REGISTRATION/INSURANCE (4) ====================
  CARRIER_INFO_MCS150: {
    code: 'CARRIER_INFO_MCS150',
    name: 'Carrier Info (MCS-150)',
    category: 'registration',
    reviewer: 'fmcsa_hq',
    description: 'Incorrect carrier information displayed from MCS-150 filing (company name, address, fleet size, etc.).',
    evidenceRequired: [
      { item: 'Correct MCS-150 filing', required: true },
      { item: 'Business registration documents', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  OPERATING_AUTHORITY: {
    code: 'OPERATING_AUTHORITY',
    name: 'Operating Authority (OP-1/OP-2)',
    category: 'registration',
    reviewer: 'fmcsa_hq',
    description: 'Incorrect operating authority information.',
    evidenceRequired: [
      { item: 'Operating authority grant letter', required: true },
      { item: 'OP-1 or OP-2 filing confirmation', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  LI_INFORMATION: {
    code: 'LI_INFORMATION',
    name: 'L&I Information',
    category: 'registration',
    reviewer: 'fmcsa_hq',
    description: 'Incorrect liability insurance information displayed in FMCSA records.',
    evidenceRequired: [
      { item: 'Current insurance certificate (Form MCS-90/BMC-91)', required: true },
      { item: 'Insurance company confirmation letter', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },
  CARRIER_REGISTRATION: {
    code: 'CARRIER_REGISTRATION',
    name: 'Carrier Not/Improperly Registered',
    category: 'registration',
    reviewer: 'fmcsa_hq',
    description: 'The carrier registration information is incorrect or the carrier was improperly marked as not registered.',
    evidenceRequired: [
      { item: 'UCR registration confirmation', required: true },
      { item: 'USDOT registration documentation', required: true },
      { item: 'State registration documents', required: false }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  },

  // ==================== OTHER (1) ====================
  OTHER: {
    code: 'OTHER',
    name: 'Other – None of Above',
    category: 'other',
    reviewer: 'fmcsa_hq',
    description: 'Use when none of the other RDR types apply to your situation.',
    evidenceRequired: [
      { item: 'Detailed written explanation', required: true },
      { item: 'Supporting documentation', required: true }
    ],
    legacyChallengeType: 'data_error',
    scannerChecks: []
  }
};

const RDR_CATEGORIES = {
  crash: { label: 'Crash', description: 'Crash-related data review requests', order: 1 },
  inspection: { label: 'Inspection', description: 'Inspection-related data review requests', order: 2 },
  investigation: { label: 'Investigation / Audit', description: 'Investigation and audit related requests', order: 3 },
  registration: { label: 'Registration / Insurance', description: 'Registration and insurance information requests', order: 4 },
  other: { label: 'Other', description: 'Other data review requests', order: 5 }
};

const RDR_TYPE_CODES = Object.keys(RDR_TYPES);

function getRdrTypesByCategory() {
  const grouped = {};
  for (const [code, type] of Object.entries(RDR_TYPES)) {
    if (!grouped[type.category]) {
      grouped[type.category] = [];
    }
    grouped[type.category].push(type);
  }
  return grouped;
}

function toLegacyChallengeType(rdrCode) {
  const rdrType = RDR_TYPES[rdrCode];
  return rdrType ? rdrType.legacyChallengeType : 'data_error';
}

module.exports = {
  RDR_TYPES,
  RDR_CATEGORIES,
  RDR_TYPE_CODES,
  getRdrTypesByCategory,
  toLegacyChallengeType
};
