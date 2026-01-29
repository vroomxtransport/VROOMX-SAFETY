/**
 * FMCSA Violation Service - Fetches inspection data from SaferWebAPI
 *
 * Data Source: SaferWebAPI.com (reliable API vs brittle scraping)
 * - Inspection counts by category (vehicle, driver, hazmat, IEP)
 * - OOS rates with national averages
 * - Crash data
 */

const NodeCache = require('node-cache');
const Company = require('../models/Company');

// Cache for 6 hours (FMCSA updates weekly)
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

const fmcsaViolationService = {
  /**
   * Fetch carrier data from SaferWebAPI
   * @param {string} dotNumber - DOT number to look up
   * @returns {object} API response with inspection data
   */
  async fetchFromSaferWebAPI(dotNumber) {
    const cacheKey = `saferweb:${dotNumber}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[SaferWebAPI] Cache hit for DOT ${dotNumber}`);
      return cached;
    }

    const apiKey = process.env.SAFERWEB_API_KEY;
    if (!apiKey) {
      throw new Error('SAFERWEB_API_KEY not configured');
    }

    console.log(`[SaferWebAPI] Fetching data for DOT ${dotNumber}`);

    const response = await fetch(
      `https://api.saferwebapi.com/v2/usdot/snapshot/${dotNumber}`,
      {
        headers: {
          'x-api-key': apiKey
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SaferWebAPI] Error ${response.status}:`, errorText);
      throw new Error(`SaferWebAPI error: ${response.status}`);
    }

    const data = await response.json();

    // Cache the result
    cache.set(cacheKey, data);

    return data;
  },

  /**
   * Parse inspection data from SaferWebAPI response
   * @param {object} apiData - Raw API response
   * @returns {object} Normalized inspection data
   */
  parseInspectionData(apiData) {
    // Handle different response structures
    const usInspections = apiData.us_inspections || apiData.usInspections || {};
    const usCrash = apiData.us_crash || apiData.usCrash || {};

    // Parse OOS percentages (might be string like "13.33%" or number)
    const parsePercent = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val.replace('%', ''));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    return {
      vehicleInspections: usInspections.vehicle?.count || usInspections.vehicle?.inspections || 0,
      vehicleOOS: usInspections.vehicle?.out_of_service || usInspections.vehicle?.outOfService || 0,
      vehicleOOSPercent: parsePercent(usInspections.vehicle?.out_of_service_percent || usInspections.vehicle?.outOfServicePercent),
      vehicleNationalAvg: parsePercent(usInspections.vehicle?.national_average || usInspections.vehicle?.nationalAverage),

      driverInspections: usInspections.driver?.count || usInspections.driver?.inspections || 0,
      driverOOS: usInspections.driver?.out_of_service || usInspections.driver?.outOfService || 0,
      driverOOSPercent: parsePercent(usInspections.driver?.out_of_service_percent || usInspections.driver?.outOfServicePercent),
      driverNationalAvg: parsePercent(usInspections.driver?.national_average || usInspections.driver?.nationalAverage),

      hazmatInspections: usInspections.hazmat?.count || usInspections.hazmat?.inspections || 0,
      hazmatOOS: usInspections.hazmat?.out_of_service || usInspections.hazmat?.outOfService || 0,

      iepInspections: usInspections.iep?.count || usInspections.iep?.inspections || 0,

      totalInspections: (usInspections.vehicle?.count || 0) +
                        (usInspections.driver?.count || 0) +
                        (usInspections.hazmat?.count || 0),

      crashes: {
        fatal: usCrash.fatal || 0,
        injury: usCrash.injury || 0,
        tow: usCrash.tow || 0,
        total: usCrash.total || 0
      },

      carrier: {
        legalName: apiData.legal_name || apiData.legalName,
        dotNumber: apiData.usdot_number || apiData.usdotNumber || apiData.dot_number,
        safetyRating: apiData.safety_rating || apiData.safetyRating,
        operatingStatus: apiData.operating_status || apiData.operatingStatus
      }
    };
  },

  /**
   * Sync inspection data for a company from SaferWebAPI
   * @param {ObjectId} companyId - Company ID
   * @param {boolean} forceRefresh - Bypass cache
   * @returns {object} Sync results
   */
  async syncViolationHistory(companyId, forceRefresh = false) {
    try {
      const company = await Company.findById(companyId);
      if (!company?.dotNumber) {
        return { success: false, message: 'Company DOT number not found' };
      }

      const dotNumber = company.dotNumber;
      console.log(`[FMCSA Violations] Starting sync for DOT ${dotNumber}, Company: ${companyId}`);

      // Clear cache if force refresh
      if (forceRefresh) {
        cache.del(`saferweb:${dotNumber}`);
      }

      // Fetch from SaferWebAPI
      const apiData = await this.fetchFromSaferWebAPI(dotNumber);

      // Parse the response
      const inspectionData = this.parseInspectionData(apiData);
      inspectionData.lastSync = new Date();

      // Store in company fmcsaData
      await Company.updateOne(
        { _id: companyId },
        {
          $set: {
            'fmcsaData.lastViolationSync': new Date(),
            'fmcsaData.inspections': inspectionData,
            'fmcsaData.saferWebData': apiData // Store raw response for debugging
          }
        }
      );

      console.log(`[FMCSA Violations] Sync complete. Total inspections: ${inspectionData.totalInspections}`);

      return {
        success: true,
        message: `Synced ${inspectionData.totalInspections} inspections from FMCSA`,
        imported: inspectionData.totalInspections,
        data: inspectionData
      };
    } catch (error) {
      console.error(`[FMCSA Violations] Sync failed:`, error.message);
      return {
        success: false,
        message: error.message,
        imported: 0
      };
    }
  },

  /**
   * Get sync status for a company
   */
  async getSyncStatus(companyId) {
    const company = await Company.findById(companyId)
      .select('fmcsaData.lastViolationSync fmcsaData.inspections');

    return {
      lastSync: company?.fmcsaData?.lastViolationSync || null,
      hasData: !!company?.fmcsaData?.inspections,
      inspectionCount: company?.fmcsaData?.inspections?.totalInspections || 0,
      canSync: true
    };
  },

  /**
   * Get inspection data for a company (from stored data)
   */
  async getInspections(companyId) {
    const company = await Company.findById(companyId)
      .select('fmcsaData.inspections fmcsaData.lastViolationSync dotNumber');

    return {
      inspections: company?.fmcsaData?.inspections || null,
      lastSync: company?.fmcsaData?.lastViolationSync || null,
      dotNumber: company?.dotNumber,
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        pages: 1
      }
    };
  },

  /**
   * Get violation summary (from stored inspection data)
   */
  async getViolationSummary(companyId) {
    const company = await Company.findById(companyId)
      .select('fmcsaData.inspections');

    const data = company?.fmcsaData?.inspections;

    if (!data) {
      return {
        byBasic: [],
        totals: {
          totalInspections: 0,
          totalViolations: 0,
          vehicleOOSCount: 0,
          driverOOSCount: 0
        }
      };
    }

    // Create BASIC-like breakdown from inspection types
    const byBasic = [
      {
        _id: 'vehicle_maintenance',
        label: 'Vehicle Maintenance',
        inspections: data.vehicleInspections || 0,
        oosCount: data.vehicleOOS || 0,
        oosPercent: data.vehicleOOSPercent || 0,
        nationalAvg: data.vehicleNationalAvg || 0
      },
      {
        _id: 'driver_fitness',
        label: 'Driver Fitness',
        inspections: data.driverInspections || 0,
        oosCount: data.driverOOS || 0,
        oosPercent: data.driverOOSPercent || 0,
        nationalAvg: data.driverNationalAvg || 0
      }
    ];

    if (data.hazmatInspections > 0) {
      byBasic.push({
        _id: 'hazmat',
        label: 'Hazmat',
        inspections: data.hazmatInspections || 0,
        oosCount: data.hazmatOOS || 0,
        oosPercent: 0,
        nationalAvg: 0
      });
    }

    return {
      byBasic,
      totals: {
        totalInspections: data.totalInspections || 0,
        vehicleOOSCount: data.vehicleOOS || 0,
        driverOOSCount: data.driverOOS || 0,
        crashes: data.crashes || { fatal: 0, injury: 0, tow: 0, total: 0 }
      }
    };
  },

  /**
   * Clear cache for a DOT number
   */
  clearCache(dotNumber) {
    if (dotNumber) {
      cache.del(`saferweb:${dotNumber}`);
    } else {
      cache.flushAll();
    }
  }
};

module.exports = fmcsaViolationService;
