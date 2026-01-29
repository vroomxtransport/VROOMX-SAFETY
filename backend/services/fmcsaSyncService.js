/**
 * FMCSA Sync Service
 *
 * Automatically syncs FMCSA data to the Company model.
 * Uses the existing fmcsaService (Puppeteer scraper) to fetch real CSA scores.
 *
 * Usage:
 * - On registration: syncCompanyData(companyId)
 * - On login: syncOnLogin(userId)
 * - Manual refresh: forceRefresh(companyId)
 */

const fmcsaService = require('./fmcsaService');
const Company = require('../models/Company');
const CSAScoreHistory = require('../models/CSAScoreHistory');
const csaAlertService = require('./csaAlertService');

// Cache duration: 6 hours (in milliseconds)
const CACHE_DURATION = 6 * 60 * 60 * 1000;

const fmcsaSyncService = {
  /**
   * Sync FMCSA data for a company
   * Call this on registration and periodically
   *
   * @param {string} companyId - MongoDB ObjectId of the company
   * @returns {object|null} - Updated smsBasics or null if failed
   */
  async syncCompanyData(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company || !company.dotNumber) {
        return null;
      }

      // Check if data is fresh (less than 6 hours old)
      const lastSync = company.smsBasics?.lastUpdated;
      if (lastSync && (Date.now() - new Date(lastSync).getTime()) < CACHE_DURATION) {
        return company.smsBasics;
      }

      // Use existing fmcsaService to fetch real data
      const fmcsaData = await fmcsaService.fetchCarrierData(company.dotNumber);

      if (!fmcsaData.success) {
        console.error('[FMCSA Sync] Failed to fetch:', fmcsaData.error);
        return null;
      }

      // Build the update object
      // IMPORTANT: Use dot notation for fmcsaData fields to preserve inspection data
      // from fmcsaViolationService (lastViolationSync, inspections, saferWebData)
      const updateData = {
        // Update SMS BASICs
        smsBasics: {
          unsafeDriving: fmcsaData.basics?.unsafeDriving ?? null,
          hoursOfService: fmcsaData.basics?.hosCompliance ?? null,
          vehicleMaintenance: fmcsaData.basics?.vehicleMaintenance ?? null,
          controlledSubstances: fmcsaData.basics?.controlledSubstances ?? null,
          driverFitness: fmcsaData.basics?.driverFitness ?? null,
          crashIndicator: fmcsaData.basics?.crashIndicator ?? null,
          lastUpdated: new Date()
        },

        // Store additional FMCSA data (using dot notation to NOT overwrite inspections from SaferWebAPI)
        'fmcsaData.crashes': fmcsaData.crashes || {},
        'fmcsaData.operatingStatus': fmcsaData.carrier?.operatingStatus || null,
        'fmcsaData.safetyRating': fmcsaData.carrier?.safetyRating || null,
        'fmcsaData.outOfServiceRate': fmcsaData.carrier?.outOfServiceRate || {},
        'fmcsaData.lastFetched': new Date(),
        'fmcsaData.dataSource': 'FMCSA_SAFER'
        // NOTE: Do NOT set fmcsaData.inspections, fmcsaData.lastViolationSync, or fmcsaData.saferWebData
        // Those are managed by fmcsaViolationService (SaferWebAPI)
      };

      // Optionally update carrier info if available
      if (fmcsaData.carrier) {
        if (fmcsaData.carrier.legalName) {
          updateData.name = fmcsaData.carrier.legalName;
        }
        if (fmcsaData.carrier.mcNumber) {
          updateData.mcNumber = fmcsaData.carrier.mcNumber;
        }
        if (fmcsaData.carrier.phone) {
          updateData.phone = fmcsaData.carrier.phone;
        }
        if (fmcsaData.carrier.address) {
          updateData['address.street'] = fmcsaData.carrier.address.street || company.address?.street;
          updateData['address.city'] = fmcsaData.carrier.address.city || company.address?.city;
          updateData['address.state'] = fmcsaData.carrier.address.state || company.address?.state;
          updateData['address.zipCode'] = fmcsaData.carrier.address.zip || company.address?.zipCode;
        }
        if (fmcsaData.carrier.fleetSize) {
          updateData['fleetSize.powerUnits'] = fmcsaData.carrier.fleetSize.powerUnits || company.fleetSize?.powerUnits;
          updateData['fleetSize.drivers'] = fmcsaData.carrier.fleetSize.drivers || company.fleetSize?.drivers;
        }
      }

      // Update company with FMCSA data
      const updatedCompany = await Company.findByIdAndUpdate(
        companyId,
        updateData,
        { new: true }
      );

      // Record history snapshot for trend tracking
      // Build fmcsaData object for history (don't use updateData since it's now dot notation)
      const fmcsaDataForHistory = {
        crashes: fmcsaData.crashes || {},
        operatingStatus: fmcsaData.carrier?.operatingStatus || null,
        outOfServiceRate: fmcsaData.carrier?.outOfServiceRate || {}
      };
      await this.recordHistory(
        companyId,
        updatedCompany.smsBasics,
        fmcsaDataForHistory,
        company.dotNumber
      );

      // Check for alerts and create notifications
      await csaAlertService.checkAndCreateAlerts(companyId);

      return updatedCompany.smsBasics;

    } catch (error) {
      console.error('[FMCSA Sync] Error:', error.message);
      return null;
    }
  },

  /**
   * Record a history snapshot for trend tracking
   * Called automatically after each successful sync
   *
   * @param {string} companyId - MongoDB ObjectId
   * @param {object} smsBasics - The BASICs data
   * @param {object} fmcsaData - Additional FMCSA data
   * @param {string} dotNumber - Company DOT number
   */
  async recordHistory(companyId, smsBasics, fmcsaData, dotNumber) {
    try {
      // Get previous record to calculate changes
      const previousRecord = await CSAScoreHistory.getLatest(companyId);

      // Determine status for each BASIC
      const getStatus = (percentile, basicKey) => {
        if (percentile === null || percentile === undefined) return 'ok';
        const criticalThresholds = {
          unsafeDriving: 80, hoursOfService: 80, vehicleMaintenance: 90,
          controlledSubstances: 90, driverFitness: 90, crashIndicator: 80
        };
        const alertThresholds = {
          unsafeDriving: 65, hoursOfService: 65, vehicleMaintenance: 80,
          controlledSubstances: 80, driverFitness: 80, crashIndicator: 65
        };

        if (percentile >= criticalThresholds[basicKey]) return 'critical';
        if (percentile >= alertThresholds[basicKey]) return 'alert';
        return 'ok';
      };

      // Calculate changes from previous record
      const calculateChange = (current, basicKey) => {
        if (!previousRecord || current === null || current === undefined) return 0;
        const prevValue = previousRecord.basics[basicKey]?.percentile;
        if (prevValue === null || prevValue === undefined) return 0;
        return current - prevValue;
      };

      // Build the history record
      const historyRecord = new CSAScoreHistory({
        companyId,
        dotNumber,
        recordedAt: new Date(),
        basics: {
          unsafeDriving: {
            percentile: smsBasics.unsafeDriving ?? null,
            status: getStatus(smsBasics.unsafeDriving, 'unsafeDriving')
          },
          hoursOfService: {
            percentile: smsBasics.hoursOfService ?? null,
            status: getStatus(smsBasics.hoursOfService, 'hoursOfService')
          },
          vehicleMaintenance: {
            percentile: smsBasics.vehicleMaintenance ?? null,
            status: getStatus(smsBasics.vehicleMaintenance, 'vehicleMaintenance')
          },
          controlledSubstances: {
            percentile: smsBasics.controlledSubstances ?? null,
            status: getStatus(smsBasics.controlledSubstances, 'controlledSubstances')
          },
          driverFitness: {
            percentile: smsBasics.driverFitness ?? null,
            status: getStatus(smsBasics.driverFitness, 'driverFitness')
          },
          crashIndicator: {
            percentile: smsBasics.crashIndicator ?? null,
            status: getStatus(smsBasics.crashIndicator, 'crashIndicator')
          }
        },
        metadata: {
          totalInspections: fmcsaData?.inspections?.total || 0,
          inspections24Months: fmcsaData?.inspections?.last24Months || 0,
          totalCrashes: fmcsaData?.crashes?.total || 0,
          crashes24Months: fmcsaData?.crashes?.last24Months || 0,
          operatingStatus: fmcsaData?.operatingStatus,
          vehicleOOSRate: fmcsaData?.outOfServiceRate?.vehicle,
          driverOOSRate: fmcsaData?.outOfServiceRate?.driver,
          dataSource: 'FMCSA_SAFER'
        },
        changes: {
          unsafeDriving: calculateChange(smsBasics.unsafeDriving, 'unsafeDriving'),
          hoursOfService: calculateChange(smsBasics.hoursOfService, 'hoursOfService'),
          vehicleMaintenance: calculateChange(smsBasics.vehicleMaintenance, 'vehicleMaintenance'),
          controlledSubstances: calculateChange(smsBasics.controlledSubstances, 'controlledSubstances'),
          driverFitness: calculateChange(smsBasics.driverFitness, 'driverFitness'),
          crashIndicator: calculateChange(smsBasics.crashIndicator, 'crashIndicator')
        }
      });

      // Calculate overall trend
      const changes = Object.values(historyRecord.changes).filter(c => c !== 0);
      if (changes.length > 0) {
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        historyRecord.overallTrend = avgChange < -2 ? 'improving' : avgChange > 2 ? 'worsening' : 'stable';
      }

      await historyRecord.save();
      return historyRecord;
    } catch (error) {
      console.error('[FMCSA Sync] Failed to record history:', error.message);
      // Don't throw - history recording failure shouldn't break the sync
      return null;
    }
  },

  /**
   * Sync on user login if data is stale
   *
   * @param {string} userId - MongoDB ObjectId of the user
   * @returns {object|null} - Updated smsBasics or null
   */
  async syncOnLogin(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (!user) {
        return null;
      }

      // Get company ID from user (handles both legacy and new structure)
      const companyId = user.activeCompanyId || user.companyId;

      if (companyId) {
        return await this.syncCompanyData(companyId._id || companyId);
      }

      return null;
    } catch (error) {
      console.error('[FMCSA Sync] Login sync error:', error.message);
      return null;
    }
  },

  /**
   * Force refresh - bypasses cache
   * Use this for manual refresh button
   *
   * @param {string} companyId - MongoDB ObjectId of the company
   * @returns {object|null} - Updated smsBasics or null
   */
  async forceRefresh(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company?.dotNumber) {
        return null;
      }

      // Clear the service cache for this DOT number
      if (fmcsaService.clearCache) {
        fmcsaService.clearCache(company.dotNumber);
      }

      // Also clear by resetting lastUpdated to force a new fetch
      await Company.findByIdAndUpdate(companyId, {
        'smsBasics.lastUpdated': null
      });

      return await this.syncCompanyData(companyId);
    } catch (error) {
      console.error('[FMCSA Sync] Force refresh error:', error.message);
      return null;
    }
  },

  /**
   * Check if data is stale (older than cache duration)
   *
   * @param {string} companyId - MongoDB ObjectId of the company
   * @returns {boolean} - True if data is stale or missing
   */
  async isDataStale(companyId) {
    try {
      const company = await Company.findById(companyId).select('smsBasics.lastUpdated');
      if (!company?.smsBasics?.lastUpdated) {
        return true; // No data = stale
      }

      const timeSinceUpdate = Date.now() - new Date(company.smsBasics.lastUpdated).getTime();
      return timeSinceUpdate > CACHE_DURATION;
    } catch (error) {
      return true; // On error, assume stale
    }
  }
};

module.exports = fmcsaSyncService;
