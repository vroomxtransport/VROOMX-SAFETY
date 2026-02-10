/**
 * Evidence Collection Service
 *
 * Provides step-by-step evidence workflows for DataQ challenges,
 * auto-detects available evidence from VroomX modules, calculates
 * evidence strength scores, and generates driver statement templates.
 */

const { RDR_TYPES } = require('../config/rdrTypes');
const {
  Violation,
  MaintenanceRecord,
  Driver,
  Vehicle,
  DrugAlcoholTest,
  Document,
  Integration
} = require('../models');

/**
 * Build the evidence workflow steps for a given RDR type.
 * Each step maps to a specific piece of evidence the user needs
 * to collect, with info about whether VroomX can auto-pull it.
 */
function getEvidenceWorkflow(rdrType, violation) {
  const rdr = RDR_TYPES[rdrType];
  if (!rdr) {
    return { steps: [], rdrType: null };
  }

  const isCrash = rdr.category === 'crash';
  const isCPDP = rdrType === 'CRASH_CPDP';
  const isInspection = rdr.category === 'inspection';
  const hasVehicle = !!violation?.vehicleId;
  const hasDriver = !!violation?.driverId;

  // Base steps from RDR required evidence
  const steps = rdr.evidenceRequired.map((ev, idx) => ({
    stepNumber: idx + 1,
    title: ev.item,
    description: getStepDescription(ev.item, rdrType),
    autoAvailable: isAutoAvailable(ev.item, { hasVehicle, hasDriver, isCrash, isCPDP, isInspection }),
    required: ev.required,
    sourceModule: getSourceModule(ev.item)
  }));

  // Add supplemental steps based on violation context
  let nextStep = steps.length + 1;

  if (hasVehicle && isInspection) {
    const hasMaintenanceStep = steps.some(s => s.sourceModule === 'maintenance');
    if (!hasMaintenanceStep) {
      steps.push({
        stepNumber: nextStep++,
        title: 'Vehicle Maintenance Records',
        description: 'Recent maintenance records showing the vehicle was properly maintained. Strengthens your case that the violation was a one-time or erroneous finding.',
        autoAvailable: true,
        required: false,
        sourceModule: 'maintenance'
      });
    }
  }

  if (hasDriver) {
    const hasDriverStep = steps.some(s => s.sourceModule === 'drivers');
    if (!hasDriverStep) {
      steps.push({
        stepNumber: nextStep++,
        title: 'Driver Employment Records',
        description: 'Employment records confirming the driver\'s status and qualifications at the time of the event.',
        autoAvailable: true,
        required: false,
        sourceModule: 'drivers'
      });
    }
  }

  if (hasDriver && isInspection) {
    steps.push({
      stepNumber: nextStep++,
      title: 'Driver Statement',
      description: 'A signed statement from the driver describing the circumstances. VroomX can generate a pre-filled template.',
      autoAvailable: true,
      required: false,
      sourceModule: 'dataq'
    });
  }

  if (isCPDP && hasDriver) {
    const hasDrugStep = steps.some(s => s.sourceModule === 'drug_alcohol');
    if (!hasDrugStep) {
      steps.push({
        stepNumber: nextStep++,
        title: 'Post-Crash Drug & Alcohol Test Results',
        description: 'Drug and alcohol test results for the driver taken after the crash. Required for some CPDP crash types.',
        autoAvailable: true,
        required: false,
        sourceModule: 'drug_alcohol'
      });
    }
  }

  return { steps, rdrType: rdr };
}

/**
 * Check what evidence VroomX already has available for a violation.
 */
async function getAutoAvailableEvidence(violationId, companyId) {
  const result = {
    maintenanceRecords: [],
    dvirRecords: [],
    driverInfo: null,
    vehicleInfo: null,
    eldData: false,
    drugAlcoholTests: [],
    documents: []
  };

  const violation = await Violation.findOne({ _id: violationId, companyId });
  if (!violation) {
    return result;
  }

  const queries = [];

  // Maintenance records for the vehicle (last 3)
  if (violation.vehicleId) {
    queries.push(
      MaintenanceRecord.find({ vehicleId: violation.vehicleId, companyId })
        .sort({ serviceDate: -1 })
        .limit(3)
        .lean()
        .then(records => { result.maintenanceRecords = records; })
    );
  }

  // Driver info
  if (violation.driverId) {
    queries.push(
      Driver.findOne({ _id: violation.driverId, companyId })
        .select('firstName lastName cdlNumber cdlState cdlExpiration hireDate status phone email')
        .lean()
        .then(driver => { result.driverInfo = driver; })
    );
  }

  // Vehicle info
  if (violation.vehicleId) {
    queries.push(
      Vehicle.findOne({ _id: violation.vehicleId, companyId })
        .select('unitNumber vin make model year licensePlate status')
        .lean()
        .then(vehicle => { result.vehicleInfo = vehicle; })
    );
  }

  // Drug & alcohol tests for crash-related CPDP violations
  if (violation.driverId && (violation.crashRelated || violation.basic === 'crash_indicator')) {
    queries.push(
      DrugAlcoholTest.find({ driverId: violation.driverId, companyId })
        .sort({ testDate: -1 })
        .limit(5)
        .lean()
        .then(tests => { result.drugAlcoholTests = tests; })
    );
  }

  // Documents associated with this violation or driver/vehicle
  const docQuery = {
    companyId,
    $or: [{ category: 'violation' }]
  };
  if (violation.driverId) {
    docQuery.$or.push({ category: 'driver', driverId: violation.driverId });
  }
  if (violation.vehicleId) {
    docQuery.$or.push({ category: 'vehicle', vehicleId: violation.vehicleId });
  }
  queries.push(
    Document.find(docQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .then(docs => { result.documents = docs; })
  );

  // ELD integration check
  queries.push(
    Integration.findOne({ companyId, type: 'eld', status: 'active' })
      .lean()
      .then(integration => { result.eldData = !!integration; })
  );

  await Promise.allSettled(queries);

  return result;
}

/**
 * Calculate evidence strength from an evidence checklist.
 * Returns a score 0-10 with label, color, and suggestions.
 */
function calculateEvidenceStrength(evidenceChecklist) {
  if (!evidenceChecklist || evidenceChecklist.length === 0) {
    return {
      score: 0,
      label: 'No Evidence',
      color: 'red',
      missingRequired: [],
      suggestions: ['Start collecting evidence to build your challenge case.']
    };
  }

  const totalItems = evidenceChecklist.length;
  const requiredItems = evidenceChecklist.filter(e => e.required);
  const optionalItems = evidenceChecklist.filter(e => !e.required);

  const requiredObtained = requiredItems.filter(e => e.obtained).length;
  const optionalObtained = optionalItems.filter(e => e.obtained).length;

  // Weighted score: required (60%), optional (25%), total coverage (15%)
  const requiredScore = requiredItems.length > 0
    ? (requiredObtained / requiredItems.length) * 6.0
    : 6.0; // No required items = full credit for required portion

  const optionalScore = optionalItems.length > 0
    ? (optionalObtained / optionalItems.length) * 2.5
    : 0;

  const totalObtained = requiredObtained + optionalObtained;
  const coverageScore = totalItems > 0
    ? (totalObtained / totalItems) * 1.5
    : 0;

  const rawScore = requiredScore + optionalScore + coverageScore;
  const score = Math.round(Math.min(10, Math.max(0, rawScore)) * 10) / 10;

  // Missing required items
  const missingRequired = requiredItems
    .filter(e => !e.obtained)
    .map(e => e.item);

  // Determine label and color
  let label, color;
  if (score >= 8) {
    label = 'Strong';
    color = 'green';
  } else if (score >= 6) {
    label = 'Good';
    color = 'green';
  } else if (score >= 4) {
    label = 'Moderate';
    color = 'yellow';
  } else if (score >= 2) {
    label = 'Weak';
    color = 'red';
  } else {
    label = 'Very Weak';
    color = 'red';
  }

  // Generate suggestions
  const suggestions = [];
  if (missingRequired.length > 0) {
    suggestions.push(`Obtain ${missingRequired.length} required item(s): ${missingRequired.join(', ')}`);
  }
  if (optionalItems.length > 0 && optionalObtained < optionalItems.length) {
    const missingOptionalCount = optionalItems.length - optionalObtained;
    suggestions.push(`${missingOptionalCount} optional evidence item(s) would strengthen your case.`);
  }
  if (score < 4) {
    suggestions.push('Consider gathering more supporting documentation before submitting.');
  }
  if (score >= 6 && score < 8) {
    suggestions.push('Your evidence is good. Adding optional items could improve your chances.');
  }
  if (score >= 8 && missingRequired.length === 0) {
    suggestions.push('Your evidence package looks strong. Ready for submission.');
  }

  return { score, label, color, missingRequired, suggestions };
}

/**
 * Generate a pre-filled driver statement template for a violation.
 */
function generateDriverStatement(violation, driver) {
  if (!violation || !driver) {
    return '';
  }

  const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || '[Driver Name]';
  const unitNumber = violation.vehicleId?.unitNumber || '[Unit Number]';
  const violationDateStr = violation.violationDate
    ? new Date(violation.violationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '[Date]';
  const location = [violation.location?.city, violation.location?.state].filter(Boolean).join(', ') || '[Location]';
  const inspectorName = violation.inspectorName || '[Inspector Name]';
  const violationCode = violation.violationCode || '[Violation Code]';
  const description = violation.description || '[Violation Description]';

  return `DRIVER STATEMENT

I, ${driverName}, was operating vehicle ${unitNumber} on ${violationDateStr} at ${location} when I was inspected by ${inspectorName}.

Regarding violation ${violationCode} (${description}):

[Describe the specific circumstances and why you believe this violation should be challenged. Include any relevant details about the condition of the vehicle, your compliance with regulations, or any errors in the inspection report.]

________________________________________________________

I declare under penalty of perjury that this statement is true and correct to the best of my knowledge.

Driver Signature: ___________________________  Date: _______________

Printed Name: ${driverName}`;
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Get a human-readable description for an evidence step.
 */
function getStepDescription(item, rdrType) {
  const descriptions = {
    'Police crash report': 'The official police accident report (PAR) documenting the crash. This is the single most important piece of evidence for any crash-related DataQ challenge.',
    'Police crash report showing correct carrier': 'The police crash report identifying the correct motor carrier involved in the crash, proving your company was not the responsible party.',
    'Police crash report showing no qualifying injuries/fatalities': 'The police crash report demonstrating that no FMCSA-reportable thresholds were met (no fatalities, no injuries requiring immediate off-scene treatment, no tow-aways).',
    'Police crash report with correct information': 'The police crash report containing the accurate details that contradict the erroneous FMCSA record.',
    'Proof of non-involvement (e.g., GPS/ELD data)': 'GPS tracking or ELD data showing your vehicle was not at the crash location at the time of the incident.',
    'Proof of non-involvement (lease agreement, dispatch records)': 'Lease agreements, dispatch logs, or other records showing your company was not operating the vehicle at the time of the inspection.',
    'Lease agreement showing equipment ownership': 'A copy of the lease agreement showing which carrier had control of the equipment at the time of the incident.',
    'Court disposition/judgment document': 'Official court documentation showing the citation was dismissed, reduced, or adjudicated in your favor.',
    'Citation number and court case number': 'The specific citation and court case identifiers needed to verify the court outcome with the issuing jurisdiction.',
    'Documentation showing correct violation info': 'Any documentation that proves the violation code, description, or severity recorded is incorrect.',
    'Documentation showing correct information': 'Records proving the correct facts that differ from what was recorded in the FMCSA system.',
    'Driver employment records': 'Employment verification records for the driver, including hire date and employment status at the time of the event.',
    'ELD/log data showing actual driver': 'Electronic logging device records identifying which driver was actually operating the vehicle.',
    'Photos/video of the crash scene': 'Photographs or video footage from the crash scene showing the positions of vehicles, road conditions, and damage.',
    'Dashcam or surveillance footage': 'Dashcam or external camera footage capturing the crash event, showing the other party\'s actions.',
    'Witness statements': 'Written statements from witnesses who observed the incident.',
    'Weather/road condition reports': 'Official weather reports or road condition data from the time and location of the incident.',
    'Written statement that inspection copy was never received': 'A formal written statement declaring that the carrier/driver never received a copy of the inspection report as required by regulation.',
    'Both crash report numbers showing duplication': 'Documentation showing both crash report numbers that reference the same incident, proving duplication.',
    'Both inspection report numbers showing duplication': 'Documentation showing both inspection report numbers that reference the same event, proving duplication.',
    'Bill of lading or dispatch records': 'Shipping documents or dispatch logs showing where your equipment was at the time of the incident.',
    'Medical records showing no immediate off-scene treatment': 'Medical documentation proving that no involved parties required immediate medical treatment away from the scene.',
    'Tow records or photos showing vehicles were driven away': 'Tow company records or photographic evidence showing vehicles were drivable and left the scene under their own power.',
    'Photos with timestamps': 'Timestamped photographs showing the actual conditions or facts at issue.',
    'Detailed written explanation': 'A thorough written explanation of your challenge, since no standard RDR type covers this situation.',
    'Supporting documentation': 'Any documentation that supports your request for data review.',
    'Correct MCS-150 filing': 'A copy of the correctly filed MCS-150 form showing the accurate carrier information.',
    'Current insurance certificate (Form MCS-90/BMC-91)': 'Your current proof of insurance on file with FMCSA.',
    'UCR registration confirmation': 'Unified Carrier Registration confirmation showing active registration status.',
    'USDOT registration documentation': 'USDOT registration documents proving proper registration.'
  };

  return descriptions[item] || `Collect and upload: ${item}`;
}

/**
 * Determine if VroomX can auto-pull a given evidence item.
 */
function isAutoAvailable(item, context) {
  const autoItems = [
    'Driver employment records',
    'ELD/log data showing actual driver',
    'Equipment maintenance records',
    'Vehicle Maintenance Records',
    'Dispatch records',
    'Vehicle registration showing different carrier'
  ];

  if (autoItems.some(ai => item.toLowerCase().includes(ai.toLowerCase()))) {
    return true;
  }

  // ELD data requires integration
  if (item.toLowerCase().includes('eld') || item.toLowerCase().includes('gps')) {
    return true; // We check and show availability status in the panel
  }

  // Driver records need a linked driver
  if (item.toLowerCase().includes('driver') && item.toLowerCase().includes('record') && context.hasDriver) {
    return true;
  }

  return false;
}

/**
 * Map an evidence item to its VroomX source module.
 */
function getSourceModule(item) {
  const lower = item.toLowerCase();

  if (lower.includes('maintenance') || lower.includes('equipment')) return 'maintenance';
  if (lower.includes('driver employment') || lower.includes('driver record')) return 'drivers';
  if (lower.includes('eld') || lower.includes('gps') || lower.includes('log data')) return 'integrations';
  if (lower.includes('drug') || lower.includes('alcohol')) return 'drug_alcohol';
  if (lower.includes('dispatch') || lower.includes('bill of lading')) return 'documents';
  if (lower.includes('vehicle registration') || lower.includes('lease agreement')) return 'vehicles';
  if (lower.includes('insurance') || lower.includes('mcs-90') || lower.includes('bmc-91')) return 'documents';
  if (lower.includes('ucr') || lower.includes('usdot') || lower.includes('mcs-150')) return 'documents';
  if (lower.includes('court') || lower.includes('citation') || lower.includes('attorney')) return 'external';
  if (lower.includes('police') || lower.includes('crash report') || lower.includes('par')) return 'external';
  if (lower.includes('photo') || lower.includes('video') || lower.includes('dashcam') || lower.includes('footage')) return 'external';
  if (lower.includes('witness') || lower.includes('weather') || lower.includes('medical') || lower.includes('tow')) return 'external';
  if (lower.includes('statement')) return 'dataq';

  return 'external';
}

module.exports = {
  getEvidenceWorkflow,
  getAutoAvailableEvidence,
  calculateEvidenceStrength,
  generateDriverStatement
};
