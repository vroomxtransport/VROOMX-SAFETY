/**
 * Entity Linking Service
 *
 * Matches violations to drivers and vehicles using identifiers from FMCSA inspection data.
 * Called after sync to link violations to existing Driver and Vehicle records.
 *
 * Matching Methods:
 * - Driver: CDL exact match (with/without state)
 * - Vehicle: License plate exact match (requires both number and state)
 *
 * NOTE: FMCSAInspection.unitInfo only contains:
 *   - driverLicense (CDL number), driverState (CDL state)
 *   - vehicleLicense (plate number), vehicleState (plate state)
 * There is NO VIN or unit number field, so those matching methods are not available.
 *
 * Designed for cron/orchestrator usage - never throws, always logs errors.
 */

const Violation = require('../models/Violation');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const FMCSAInspection = require('../models/FMCSAInspection');

// Confidence thresholds
const THRESHOLDS = {
  EXACT: 100,      // Exact CDL match with state
  HIGH: 95,        // Exact CDL match without state, or license plate match
  MEDIUM: 70,      // Reserved for future fuzzy matching
  REJECT: 50       // Below this, don't link
};

const entityLinkingService = {
  /**
   * Link unlinked violations to drivers and vehicles for a company
   * Skips violations that were manually linked (preserves user corrections)
   *
   * @param {ObjectId|string} companyId - Company to process
   * @returns {object} Results: { linked, reviewRequired, skipped, errors }
   */
  async linkViolationsForCompany(companyId) {
    console.log(`[Entity Linking] Starting entity linking for company ${companyId}`);

    const results = {
      linked: 0,
      reviewRequired: 0,
      skipped: 0,
      errors: 0
    };

    try {
      // Find violations that need linking
      // Skip manually linked violations to preserve user corrections
      const violations = await Violation.find({
        companyId,
        $or: [
          { driverId: null },
          { vehicleId: null }
        ],
        'linkingMetadata.linkingMethod': { $ne: 'manual' }
      }).limit(1000);

      console.log(`[Entity Linking] Found ${violations.length} violations to process`);

      for (const violation of violations) {
        try {
          await this._processViolation(violation, companyId, results);
        } catch (err) {
          console.error(`[Entity Linking] Error processing violation ${violation._id}:`, err.message);
          results.errors++;
        }
      }

      console.log(`[Entity Linking] Complete: ${results.linked} linked, ${results.reviewRequired} need review, ${results.skipped} skipped, ${results.errors} errors`);
    } catch (err) {
      console.error(`[Entity Linking] Failed to query violations:`, err.message);
    }

    return results;
  },

  /**
   * Process a single violation for entity linking
   * @private
   */
  async _processViolation(violation, companyId, results) {
    // Look up the inspection to get unitInfo
    const inspection = await FMCSAInspection.findOne({
      companyId,
      reportNumber: violation.inspectionNumber
    });

    // Skip if no inspection found or no unitInfo
    // DataHub violations may not have corresponding FMCSAInspection records
    if (!inspection?.unitInfo) {
      results.skipped++;
      return;
    }

    const unitInfo = inspection.unitInfo;
    const updates = {};
    let needsReview = false;

    // Link to driver if not already linked
    if (!violation.driverId) {
      const driverResult = await this.linkToDriver(unitInfo, companyId);
      if (driverResult.driverId) {
        updates.driverId = driverResult.driverId;
        updates['linkingMetadata.driverConfidence'] = driverResult.confidence;
        updates['linkingMetadata.linkingMethod'] = driverResult.method;
        updates['linkingMetadata.linkedAt'] = new Date();
      } else if (driverResult.reviewRequired) {
        needsReview = true;
      }
    }

    // Link to vehicle if not already linked
    if (!violation.vehicleId) {
      const vehicleResult = await this.linkToVehicle(unitInfo, companyId);
      if (vehicleResult.vehicleId) {
        updates.vehicleId = vehicleResult.vehicleId;
        updates['linkingMetadata.vehicleConfidence'] = vehicleResult.confidence;
        // Only update linkingMethod if not already set by driver linking
        if (!updates['linkingMetadata.linkingMethod']) {
          updates['linkingMetadata.linkingMethod'] = vehicleResult.method;
          updates['linkingMetadata.linkedAt'] = new Date();
        }
      } else if (vehicleResult.reviewRequired) {
        needsReview = true;
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      if (needsReview) {
        updates['linkingMetadata.reviewRequired'] = true;
      }
      await Violation.updateOne({ _id: violation._id }, { $set: updates });
      results.linked++;
      if (needsReview) {
        results.reviewRequired++;
      }
    } else if (needsReview) {
      // Only review flag, no links made
      await Violation.updateOne(
        { _id: violation._id },
        { $set: { 'linkingMetadata.reviewRequired': true } }
      );
      results.reviewRequired++;
    } else {
      results.skipped++;
    }
  },

  /**
   * Match a driver by CDL number
   * CDL matching uses exact match only (case-insensitive)
   *
   * @param {object} unitInfo - Unit info from FMCSAInspection
   * @param {ObjectId|string} companyId - Company to search within
   * @returns {object} { driverId, confidence, method, reviewRequired }
   */
  async linkToDriver(unitInfo, companyId) {
    // Check if CDL number exists
    if (!unitInfo?.driverLicense) {
      return { driverId: null, confidence: 0, method: null };
    }

    // Normalize CDL number for comparison
    const normalizedCdl = unitInfo.driverLicense.toUpperCase().trim();
    const normalizedState = unitInfo.driverState?.toUpperCase().trim();

    // Try exact match with state (highest confidence)
    if (normalizedState) {
      const driverWithState = await Driver.findOne({
        companyId,
        'cdl.number': normalizedCdl,
        'cdl.state': normalizedState
      });

      if (driverWithState) {
        return {
          driverId: driverWithState._id,
          confidence: THRESHOLDS.EXACT,
          method: 'cdl_exact'
        };
      }
    }

    // Try exact match without state (lower confidence)
    const driverWithoutState = await Driver.findOne({
      companyId,
      'cdl.number': normalizedCdl
    });

    if (driverWithoutState) {
      return {
        driverId: driverWithoutState._id,
        confidence: THRESHOLDS.HIGH,
        method: 'cdl_exact'
      };
    }

    // No match found but CDL was provided - flag for review
    return {
      driverId: null,
      confidence: 0,
      method: null,
      reviewRequired: true
    };
  },

  /**
   * Match a vehicle by license plate
   * License plate matching requires both number and state for accuracy
   *
   * NOTE: VIN and unit number matching not available - FMCSAInspection.unitInfo
   * does not contain vehicleVIN or unitNumber fields.
   *
   * @param {object} unitInfo - Unit info from FMCSAInspection
   * @param {ObjectId|string} companyId - Company to search within
   * @returns {object} { vehicleId, confidence, method, reviewRequired }
   */
  async linkToVehicle(unitInfo, companyId) {
    // Check if both license plate number and state exist
    // Cannot reliably match without both (too many false positives)
    if (!unitInfo?.vehicleLicense || !unitInfo?.vehicleState) {
      return { vehicleId: null, confidence: 0, method: null };
    }

    // Normalize values for comparison
    const licensePlate = unitInfo.vehicleLicense.toUpperCase().trim();
    const plateState = unitInfo.vehicleState.toUpperCase().trim();

    // Try exact match
    const vehicle = await Vehicle.findOne({
      companyId,
      'licensePlate.number': licensePlate,
      'licensePlate.state': plateState
    });

    if (vehicle) {
      return {
        vehicleId: vehicle._id,
        confidence: THRESHOLDS.HIGH,
        method: 'license_plate'
      };
    }

    // No match found but license plate was provided - flag for review
    return {
      vehicleId: null,
      confidence: 0,
      method: null,
      reviewRequired: true
    };
  }
};

module.exports = entityLinkingService;
