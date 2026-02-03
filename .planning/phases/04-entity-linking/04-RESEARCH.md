# Phase 4: Entity Linking - Research

**Researched:** 2026-02-03
**Domain:** Entity matching, fuzzy string matching, confidence scoring
**Confidence:** HIGH

## Summary

Entity linking for Phase 4 connects FMCSA violations to company drivers and vehicles. Research reveals a critical constraint: **public FMCSA datasets do NOT include driver CDL numbers** due to privacy restrictions. Driver identification (CDL number, driver state) is only available when inspections are uploaded and AI-extracted via the existing `openaiVisionService`. This fundamentally shapes the architecture: violations from DataHub sync have NO driver identification data, while AI-extracted inspections stored in `FMCSAInspection.unitInfo` do contain driver/vehicle identifiers.

Vehicle identification is more complete: the FMCSA "Inspections Per Unit" dataset contains VIN, license plate, and license state. The existing `Vehicle` model stores `vin` (required, 16-17 chars) and `unitNumber` (required), providing solid matching targets.

The linking service should use a tiered matching strategy:
1. **Exact match** (HIGH confidence 90-100%): CDL number + state matches exactly, VIN matches exactly
2. **Fuzzy match** (MEDIUM confidence 70-89%): Unit number matches, license plate matches, name similarity
3. **No match** (LOW confidence < 70%): Flag for manual review

**Primary recommendation:** Create an `entityLinkingService` that runs after sync, using exact CDL/VIN matching first, falling back to fuzzy matching with fuzzball.js for unit numbers and names. Store confidence scores in the existing `Violation.linkingMetadata` fields.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fuzzball | ^2.1.x | Fuzzy string matching | Port of Python fuzzywuzzy, well-tested algorithms, supports token_sort_ratio for name matching |
| native JS | built-in | Exact matching | String comparison, no dependencies needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| mongoose | ^8.x | Database queries | Already installed, use aggregation for batch matching |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fuzzball | Fuse.js | Fuse.js is better for searching large datasets; fuzzball is better for comparing two specific strings with a confidence score |
| fuzzball | fast-fuzzy | fast-fuzzy is faster but lacks the token_sort_ratio algorithm needed for name matching |
| No VIN validation | vin-validator | VINs already validated at entry in Vehicle model (16-17 chars, uppercase); separate validation library unnecessary |

**Installation:**
```bash
npm install fuzzball
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── services/
│   ├── entityLinkingService.js   # NEW - entity matching with confidence scoring
│   └── fmcsaSyncOrchestrator.js  # EXTEND - call linking after sync
└── models/
    └── Violation.js               # EXISTING - uses linkingMetadata fields
```

### Pattern 1: Tiered Matching Strategy
**What:** Apply matching in priority order: exact first, then fuzzy, with cutoff thresholds
**When to use:** When matching entities with varying data quality
**Example:**
```javascript
// Source: Derived from entity resolution best practices
// https://dataladder.com/fuzzy-matching-101/

const THRESHOLDS = {
  EXACT: 100,      // Exact match
  HIGH: 90,        // Auto-link with high confidence
  MEDIUM: 70,      // Auto-link but flag for optional review
  LOW: 50,         // Flag for required manual review
  REJECT: 0        // No match attempted
};

const linkViolationToDriver = async (violation, companyId) => {
  // 1. Exact CDL match (from unitInfo if available)
  if (violation.unitInfo?.driverLicense && violation.unitInfo?.driverState) {
    const exactMatch = await Driver.findOne({
      companyId,
      'cdl.number': violation.unitInfo.driverLicense.toUpperCase(),
      'cdl.state': violation.unitInfo.driverState.toUpperCase()
    });
    if (exactMatch) {
      return {
        driverId: exactMatch._id,
        confidence: 100,
        method: 'cdl_exact'
      };
    }
  }

  // 2. CDL number only (no state) - slightly lower confidence
  if (violation.unitInfo?.driverLicense) {
    const cdlMatch = await Driver.findOne({
      companyId,
      'cdl.number': violation.unitInfo.driverLicense.toUpperCase()
    });
    if (cdlMatch) {
      return {
        driverId: cdlMatch._id,
        confidence: 95,
        method: 'cdl_exact'
      };
    }
  }

  // 3. No CDL data available - cannot link
  return {
    driverId: null,
    confidence: 0,
    method: null,
    reviewRequired: true
  };
};
```

### Pattern 2: Vehicle Matching with Fallback Chain
**What:** Match vehicles by VIN first (most reliable), then unit number, then license plate
**When to use:** Linking violations to vehicles
**Example:**
```javascript
// Source: Derived from FMCSA Inspections Per Unit dataset structure

const linkViolationToVehicle = async (violation, companyId) => {
  // 1. Exact VIN match (highest confidence)
  if (violation.unitInfo?.vehicleVIN) {
    const vinMatch = await Vehicle.findOne({
      companyId,
      vin: violation.unitInfo.vehicleVIN.toUpperCase()
    });
    if (vinMatch) {
      return {
        vehicleId: vinMatch._id,
        confidence: 100,
        method: 'vin_exact'
      };
    }
  }

  // 2. Unit number match
  if (violation.unitInfo?.unitNumber) {
    const fuzzball = require('fuzzball');
    const vehicles = await Vehicle.find({ companyId }).select('_id unitNumber').lean();

    let bestMatch = null;
    let bestScore = 0;

    for (const vehicle of vehicles) {
      // Use token_sort_ratio for flexibility with formatting
      const score = fuzzball.token_sort_ratio(
        violation.unitInfo.unitNumber.toUpperCase(),
        vehicle.unitNumber.toUpperCase()
      );
      if (score > bestScore) {
        bestScore = score;
        bestMatch = vehicle;
      }
    }

    if (bestScore >= THRESHOLDS.HIGH) {
      return {
        vehicleId: bestMatch._id,
        confidence: bestScore,
        method: 'unit_number'
      };
    } else if (bestScore >= THRESHOLDS.MEDIUM) {
      return {
        vehicleId: bestMatch._id,
        confidence: bestScore,
        method: 'unit_number',
        reviewRequired: true
      };
    }
  }

  // 3. License plate match (if available)
  if (violation.unitInfo?.vehicleLicense && violation.unitInfo?.vehicleState) {
    const plateMatch = await Vehicle.findOne({
      companyId,
      'licensePlate.number': violation.unitInfo.vehicleLicense.toUpperCase(),
      'licensePlate.state': violation.unitInfo.vehicleState.toUpperCase()
    });
    if (plateMatch) {
      return {
        vehicleId: plateMatch._id,
        confidence: 95,
        method: 'license_plate'
      };
    }
  }

  return {
    vehicleId: null,
    confidence: 0,
    method: null,
    reviewRequired: true
  };
};
```

### Pattern 3: Batch Processing with Database Updates
**What:** Process unlinked violations in batches, update linkingMetadata
**When to use:** After sync completes or on-demand linking
**Example:**
```javascript
// Source: Follows existing orchestrator pattern from fmcsaSyncOrchestrator.js

const entityLinkingService = {
  /**
   * Link all unlinked violations for a company
   * @param {ObjectId} companyId - Company ID
   * @returns {object} Linking results summary
   */
  async linkViolationsForCompany(companyId) {
    const results = { linked: 0, reviewRequired: 0, unchanged: 0 };

    // Find violations without links or needing review
    const violations = await Violation.find({
      companyId,
      $or: [
        { driverId: null },
        { vehicleId: null },
        { 'linkingMetadata.reviewRequired': true }
      ]
    }).limit(1000); // Process in batches

    for (const violation of violations) {
      try {
        const driverResult = await this.linkToDriver(violation, companyId);
        const vehicleResult = await this.linkToVehicle(violation, companyId);

        const updates = {
          'linkingMetadata.linkedAt': new Date()
        };

        if (driverResult.driverId) {
          updates.driverId = driverResult.driverId;
          updates['linkingMetadata.driverConfidence'] = driverResult.confidence;
          updates['linkingMetadata.linkingMethod'] = driverResult.method;
        }

        if (vehicleResult.vehicleId) {
          updates.vehicleId = vehicleResult.vehicleId;
          updates['linkingMetadata.vehicleConfidence'] = vehicleResult.confidence;
          if (!updates['linkingMetadata.linkingMethod']) {
            updates['linkingMetadata.linkingMethod'] = vehicleResult.method;
          }
        }

        const requiresReview = driverResult.reviewRequired || vehicleResult.reviewRequired;
        updates['linkingMetadata.reviewRequired'] = requiresReview;

        await Violation.updateOne({ _id: violation._id }, { $set: updates });

        if (requiresReview) {
          results.reviewRequired++;
        } else if (driverResult.driverId || vehicleResult.vehicleId) {
          results.linked++;
        } else {
          results.unchanged++;
        }
      } catch (error) {
        console.error(`[Entity Linking] Failed for violation ${violation._id}:`, error.message);
      }
    }

    return results;
  }
};
```

### Anti-Patterns to Avoid
- **Linking on every violation insert:** Run linking as batch job after sync, not inline with insert (performance)
- **Case-sensitive matching:** Always normalize to uppercase before comparison (CDL, VIN, unit numbers vary in case)
- **Ignoring null unitInfo:** Most DataHub-synced violations have NO unitInfo - do not log errors for expected nulls
- **Overwriting manual links:** Never re-link violations where `linkingMethod: 'manual'` - preserve user corrections

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string matching | Levenshtein from scratch | fuzzball.token_sort_ratio() | Handles word reordering, optimized, battle-tested |
| VIN validation | Custom validator | Schema validation (already exists) | Vehicle model already enforces 16-17 char uppercase |
| CDL format validation | State-specific regex | Simple string comparison | CDL formats vary by state; exact match is sufficient |
| Batch processing | Custom loop | Mongoose bulk operations | Use updateMany with aggregation for performance |

**Key insight:** The matching problem is simpler than general entity resolution because we have high-quality identifiers (CDL, VIN). Focus on exact matching first; fuzzy matching is only needed for unit numbers and fallback scenarios.

## Common Pitfalls

### Pitfall 1: Expecting CDL Data from DataHub Sync
**What goes wrong:** Developer assumes all violations have driver identification
**Why it happens:** DataHub violations do NOT include CDL numbers due to FMCSA privacy restrictions
**How to avoid:** Only attempt driver linking for violations where `FMCSAInspection.unitInfo.driverLicense` is populated (AI-extracted uploads)
**Warning signs:** All driver links fail with "no CDL data"

### Pitfall 2: Case Sensitivity in Matching
**What goes wrong:** Exact matches fail because "CDL123" !== "cdl123"
**Why it happens:** User input and API data have inconsistent casing
**How to avoid:** Always normalize to uppercase before comparison: `cdl.number.toUpperCase()`
**Warning signs:** Matching reports low confidence for visually identical values

### Pitfall 3: Overwriting Manual Corrections
**What goes wrong:** User manually links a violation, then sync re-runs linking and changes it
**Why it happens:** Linking service doesn't check existing linkingMethod
**How to avoid:** Skip re-linking when `linkingMetadata.linkingMethod === 'manual'`
**Warning signs:** Users report their corrections are being undone

### Pitfall 4: Performance with Large Violation Sets
**What goes wrong:** Linking runs for hours on companies with thousands of violations
**Why it happens:** Processing all violations on every sync
**How to avoid:** Only process violations where `driverId: null OR vehicleId: null OR reviewRequired: true`, batch limit of 1000
**Warning signs:** Sync times increase dramatically over time

### Pitfall 5: Review Queue Growing Indefinitely
**What goes wrong:** Review queue shows thousands of items users never clear
**Why it happens:** DataHub violations can never be linked (no CDL data) but are flagged for review
**How to avoid:** Only flag `reviewRequired: true` when there IS partial data suggesting a possible match
**Warning signs:** Review queue filled with items that have no actionable matching data

## Code Examples

### fuzzball Usage for Unit Number Matching
```javascript
// Source: https://github.com/nol13/fuzzball.js
const fuzzball = require('fuzzball');

// token_sort_ratio handles word reordering
// "Unit 123" vs "123 Unit" both score 100
const score1 = fuzzball.token_sort_ratio('Unit 123', '123 Unit');
// Result: 100

// ratio is stricter - exact character sequence
const score2 = fuzzball.ratio('Unit 123', 'Unit 124');
// Result: ~85

// partial_ratio finds best substring match
const score3 = fuzzball.partial_ratio('123', 'Unit 123');
// Result: 100

// For batch matching, use extract
const choices = ['Unit 001', 'Unit 002', 'Unit 123'];
const results = fuzzball.extract('Unit 12', choices, { limit: 3 });
// Returns: [['Unit 123', 91, 2], ['Unit 001', 50, 0], ['Unit 002', 50, 1]]
// Format: [match, score, index]
```

### Confidence Threshold Configuration
```javascript
// Source: Entity resolution best practices research
// https://dataladder.com/fuzzy-matching-101/

const LINKING_CONFIG = {
  thresholds: {
    autoLink: 90,      // Auto-link without review
    reviewOptional: 70, // Auto-link but show in review queue
    reviewRequired: 50, // Flag for required review, don't auto-link
    reject: 50          // Below this, don't create any link
  },
  methods: {
    cdl_exact: { weight: 1.0, description: 'CDL number + state exact match' },
    cdl_number_only: { weight: 0.95, description: 'CDL number match (state unknown)' },
    vin_exact: { weight: 1.0, description: 'VIN exact match' },
    unit_number: { weight: 0.85, description: 'Unit number fuzzy match' },
    license_plate: { weight: 0.90, description: 'License plate match' },
    manual: { weight: 1.0, description: 'Manually linked by user' }
  }
};
```

### Integration with Sync Orchestrator
```javascript
// Source: Follows pattern from backend/services/fmcsaSyncOrchestrator.js

// In fmcsaSyncOrchestrator.syncCompany():
// After step 3 (inspection stats), add step 4:

// 4. Link violations to entities
try {
  console.log(`[FMCSA Orchestrator] Running entity linking for company ${companyId}`);
  const linkingResult = await entityLinkingService.linkViolationsForCompany(companyId);
  timestamps.linkingLastRun = new Date();
  console.log(`[FMCSA Orchestrator] Linking complete: ${linkingResult.linked} linked, ${linkingResult.reviewRequired} need review`);
} catch (err) {
  console.error(`[FMCSA Orchestrator] Entity linking failed:`, err.message);
  errors.push({ source: 'entity_linking', error: err.message, timestamp: new Date() });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual linking only | Automatic + manual review | This phase | Most violations auto-linked, humans review exceptions |
| Binary match/no-match | Confidence scoring | This phase | Users see match quality, can prioritize reviews |
| Re-link on every sync | Skip already-linked | This phase | Performance improvement, preserves manual corrections |

**Deprecated/outdated:**
- Simple substring matching: Use fuzzball's token_sort_ratio for better accuracy with reordered words

## Open Questions

1. **Should linking run immediately after sync or on separate schedule?**
   - What we know: Sync runs every 6 hours, linking could add significant time for large companies
   - What's unclear: Whether to run inline or as separate job
   - Recommendation: Run inline for simplicity; optimize later if performance issues arise

2. **How to handle historical violations without unitInfo?**
   - What we know: DataHub violations have no CDL/VIN data
   - What's unclear: Should these be shown in review queue or excluded entirely?
   - Recommendation: Exclude from review queue (no actionable data); only flag violations WITH partial unitInfo

## Sources

### Primary (HIGH confidence)
- backend/models/Violation.js - Existing linkingMetadata schema (lines 198-218)
- backend/models/Driver.js - CDL fields: cdl.number, cdl.state (lines 109-137)
- backend/models/Vehicle.js - VIN field (lines 55-62), unitNumber (line 16), licensePlate (lines 74-78)
- backend/models/FMCSAInspection.js - unitInfo schema (lines 101-107)
- backend/services/fmcsaSyncOrchestrator.js - Orchestrator pattern (entire file)

### Secondary (MEDIUM confidence)
- [FMCSA Data Dissemination Program](https://www.fmcsa.dot.gov/registration/fmcsa-data-dissemination-program) - Privacy restrictions on driver data
- [DataHub SMS Violation dataset](https://datahub.transportation.gov/resource/8mt8-2mdr.json) - Field structure verification
- [fuzzball.js GitHub](https://github.com/nol13/fuzzball.js) - API methods and usage patterns
- [Entity Resolution Best Practices](https://dataladder.com/fuzzy-matching-101/) - Threshold recommendations

### Tertiary (LOW confidence)
- [Record Linkage Wikipedia](https://en.wikipedia.org/wiki/Record_linkage) - General background on matching strategies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - fuzzball is well-established, codebase patterns clear
- Architecture: HIGH - Follows existing orchestrator/service patterns exactly
- Pitfalls: HIGH - Based on FMCSA data structure analysis and codebase review

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain, library versions unlikely to change)
