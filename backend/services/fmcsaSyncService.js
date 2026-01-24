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
        console.log('[FMCSA Sync] No DOT number for company:', companyId);
        return null;
      }

      // Check if data is fresh (less than 6 hours old)
      const lastSync = company.smsBasics?.lastUpdated;
      if (lastSync && (Date.now() - new Date(lastSync).getTime()) < CACHE_DURATION) {
        console.log('[FMCSA Sync] Data is fresh, skipping sync for DOT:', company.dotNumber);
        return company.smsBasics;
      }

      console.log(`[FMCSA Sync] Fetching data for DOT ${company.dotNumber}...`);

      // Use existing fmcsaService to fetch real data
      const fmcsaData = await fmcsaService.fetchCarrierData(company.dotNumber);

      if (!fmcsaData.success) {
        console.error('[FMCSA Sync] Failed to fetch:', fmcsaData.error);
        return null;
      }

      console.log('[FMCSA Sync] Data fetched successfully:', JSON.stringify(fmcsaData.basics, null, 2));

      // Build the update object
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

        // Store additional FMCSA data
        fmcsaData: {
          inspections: fmcsaData.inspections || {},
          crashes: fmcsaData.crashes || {},
          operatingStatus: fmcsaData.carrier?.operatingStatus || null,
          safetyRating: fmcsaData.carrier?.safetyRating || null,
          outOfServiceRate: fmcsaData.carrier?.outOfServiceRate || {},
          lastFetched: new Date(),
          dataSource: 'FMCSA_SAFER'
        }
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

      console.log(`[FMCSA Sync] Successfully updated company ${company.dotNumber} with FMCSA data`);
      return updatedCompany.smsBasics;

    } catch (error) {
      console.error('[FMCSA Sync] Error:', error.message);
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
        console.log('[FMCSA Sync] User not found:', userId);
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
        console.log('[FMCSA Sync] No DOT number for force refresh');
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

      console.log(`[FMCSA Sync] Force refresh initiated for DOT ${company.dotNumber}`);

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
