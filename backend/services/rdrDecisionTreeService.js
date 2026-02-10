/**
 * RDR Decision Tree Service
 *
 * Maps violation scanner results to ranked RDR type recommendations.
 * Uses scan checks to auto-suggest the most appropriate FMCSA DataQ
 * Request for Data Review type.
 */

const { RDR_TYPES } = require('../config/rdrTypes');
const { ERROR_PRONE_VIOLATION_CODES } = require('./dataQAnalysisService');

/**
 * Determine if a violation is crash-related
 */
function isCrashViolation(violation) {
  return violation.basic === 'crash_indicator' || violation.crashRelated === true;
}

/**
 * Get confidence level string from scanner check
 */
function getCheckConfidence(check) {
  if (!check || !check.flagged) return null;
  return check.confidence || 'medium';
}

/**
 * Map confidence string to numeric value for sorting
 */
function confidenceToNumber(confidence) {
  switch (confidence) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

/**
 * Recommend the best RDR type for a violation based on scanner results.
 *
 * @param {Object} violation - Violation document with populated scanResults.checks
 * @returns {{ primary, alternatives, warnings }}
 */
function recommend(violation) {
  const checks = violation.scanResults?.checks || {};
  const crash = isCrashViolation(violation);
  const candidates = [];
  const warnings = [];

  // --- Check-to-RDR mapping ---

  // wrongCarrier
  if (checks.wrongCarrier?.flagged) {
    const conf = getCheckConfidence(checks.wrongCarrier);
    if (crash) {
      candidates.push({
        code: 'CRASH_WRONG_CARRIER',
        confidence: conf,
        reason: checks.wrongCarrier.reason || 'Scanner flagged wrong carrier assignment'
      });
    } else {
      candidates.push({
        code: 'INSPECTION_WRONG_CARRIER',
        confidence: conf,
        reason: checks.wrongCarrier.reason || 'Scanner flagged wrong carrier assignment'
      });
    }
    // Also suggest wrong driver if employment-type detail present
    if (checks.wrongCarrier.details?.employmentType) {
      const driverCode = crash ? 'CRASH_WRONG_DRIVER' : 'INSPECTION_WRONG_DRIVER';
      candidates.push({
        code: driverCode,
        confidence: 'low',
        reason: 'Employment type mismatch may also indicate wrong driver'
      });
    }
  }

  // duplicate
  if (checks.duplicate?.flagged) {
    const conf = getCheckConfidence(checks.duplicate);
    candidates.push({
      code: crash ? 'CRASH_DUPLICATE' : 'INSPECTION_DUPLICATE',
      confidence: conf,
      reason: checks.duplicate.reason || 'Scanner detected possible duplicate record'
    });
  }

  // courtDismissal
  if (checks.courtDismissal?.flagged) {
    const conf = getCheckConfidence(checks.courtDismissal);
    candidates.push({
      code: 'INSPECTION_CITATION_COURT',
      confidence: conf,
      reason: checks.courtDismissal.reason || 'Citation was dismissed or reduced in court'
    });
  }

  // nonReportableCrash
  if (checks.nonReportableCrash?.flagged) {
    const conf = getCheckConfidence(checks.nonReportableCrash);
    candidates.push({
      code: 'CRASH_NOT_REPORTABLE',
      confidence: conf,
      reason: checks.nonReportableCrash.reason || 'Crash may not meet FMCSA reportable thresholds'
    });
  }

  // cpdpEligible
  if (checks.cpdpEligible?.flagged) {
    const conf = getCheckConfidence(checks.cpdpEligible);
    candidates.push({
      code: 'CRASH_CPDP',
      confidence: conf,
      reason: checks.cpdpEligible.reason || 'Crash may qualify for CPDP (not preventable)'
    });
  }

  // Error-prone violation code → INSPECTION_VIOLATION_INCORRECT
  if (violation.violationCode && !crash) {
    const codePrefix = violation.violationCode.split('.').slice(0, 2).join('.');
    if (ERROR_PRONE_VIOLATION_CODES[codePrefix]) {
      candidates.push({
        code: 'INSPECTION_VIOLATION_INCORRECT',
        confidence: 'low',
        reason: ERROR_PRONE_VIOLATION_CODES[codePrefix].reason
      });
    }
  }

  // Sort candidates by confidence (high first)
  candidates.sort((a, b) => confidenceToNumber(b.confidence) - confidenceToNumber(a.confidence));

  // Fallback when no checks matched
  if (candidates.length === 0) {
    const fallbackCode = crash ? 'CRASH_INCORRECT_INFO' : 'INSPECTION_INCORRECT_OTHER';
    candidates.push({
      code: fallbackCode,
      confidence: 'low',
      reason: 'No specific scanner flags matched — using general fallback type'
    });
  }

  const primary = candidates[0];
  const primaryType = RDR_TYPES[primary.code];

  return {
    primary: {
      code: primary.code,
      name: primaryType?.name || primary.code,
      category: primaryType?.category || (crash ? 'crash' : 'inspection'),
      confidence: primary.confidence,
      reason: primary.reason
    },
    alternatives: candidates.slice(1).map(c => {
      const t = RDR_TYPES[c.code];
      return {
        code: c.code,
        name: t?.name || c.code,
        category: t?.category || 'inspection',
        confidence: c.confidence
      };
    }),
    warnings
  };
}

/**
 * Validate user's selected RDR type against the violation data.
 *
 * @param {Object} violation - Violation document
 * @param {string} selectedRdrCode - User's chosen RDR type code
 * @returns {{ valid: boolean, warnings: string[] }}
 */
function validate(violation, selectedRdrCode) {
  const warnings = [];
  const rdrType = RDR_TYPES[selectedRdrCode];

  if (!rdrType) {
    return { valid: false, warnings: ['Unknown RDR type selected'] };
  }

  const crash = isCrashViolation(violation);
  const checks = violation.scanResults?.checks || {};

  // Category mismatch: crash type for inspection or vice versa
  if (crash && rdrType.category === 'inspection') {
    warnings.push('You selected an Inspection RDR type for a crash-related violation. Make sure this is intentional.');
  }
  if (!crash && rdrType.category === 'crash') {
    warnings.push('You selected a Crash RDR type for an inspection violation. Make sure this is intentional.');
  }

  // CPDP selected but scanner didn't flag it
  if (selectedRdrCode === 'CRASH_CPDP' && !checks.cpdpEligible?.flagged) {
    warnings.push('CPDP was selected but the scanner did not flag this crash as CPDP-eligible. Verify the crash qualifies under the Crash Preventability Determination Program.');
  }

  // FMCSA HQ reviewer (informational)
  if (rdrType.reviewer === 'fmcsa_hq') {
    warnings.push('This RDR type is reviewed by FMCSA Headquarters, which may have longer processing times.');
  }

  return { valid: true, warnings };
}

module.exports = {
  recommend,
  validate
};
