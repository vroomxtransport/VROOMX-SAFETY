/**
 * Samsara API Service
 * Handles all communication with Samsara Fleet Management API
 *
 * API Documentation: https://developers.samsara.com/docs
 */

const SAMSARA_API_BASE = 'https://api.samsara.com';

/**
 * Make authenticated request to Samsara API
 */
const makeRequest = async (apiKey, endpoint, method = 'GET', body = null) => {
  const url = `${SAMSARA_API_BASE}${endpoint}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `Samsara API error: ${response.status}`);
    error.status = response.status;
    error.details = errorData;
    throw error;
  }

  return response.json();
};

/**
 * Validate API key by fetching organization info
 */
const validateApiKey = async (apiKey) => {
  try {
    // Try to fetch the organization/me endpoint to validate credentials
    const response = await makeRequest(apiKey, '/fleet/drivers?limit=1');
    return {
      valid: true,
      message: 'API key validated successfully'
    };
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return {
        valid: false,
        message: 'Invalid API key. Please check your Samsara API token.'
      };
    }
    throw error;
  }
};

/**
 * Get all drivers from Samsara
 */
const getDrivers = async (apiKey) => {
  try {
    const data = await makeRequest(apiKey, '/fleet/drivers');
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Samsara drivers:', error.message);
    throw error;
  }
};

/**
 * Get all vehicles from Samsara
 */
const getVehicles = async (apiKey) => {
  try {
    const data = await makeRequest(apiKey, '/fleet/vehicles');
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Samsara vehicles:', error.message);
    throw error;
  }
};

/**
 * Get HOS logs from Samsara
 * @param {string} apiKey - Samsara API key
 * @param {Object} options - Query options
 */
const getHOSLogs = async (apiKey, options = {}) => {
  try {
    // Default to last 7 days if no dates provided
    const endTime = options.endTime || new Date().toISOString();
    const startTime = options.startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
      startTime,
      endTime
    });

    if (options.driverIds) {
      params.append('driverIds', options.driverIds.join(','));
    }

    const data = await makeRequest(apiKey, `/fleet/hos/logs?${params.toString()}`);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Samsara HOS logs:', error.message);
    throw error;
  }
};

/**
 * Sync all data from Samsara for an integration
 * @param {Object} integration - Integration document with decrypted API key
 * @param {Object} syncConfig - What to sync (drivers, vehicles, HOS)
 */
const syncAll = async (integration, syncConfig = {}) => {
  const apiKey = integration.getDecryptedApiKey();

  if (!apiKey) {
    throw new Error('Unable to decrypt API key');
  }

  const results = {
    drivers: 0,
    vehicles: 0,
    hosLogs: 0,
    errors: []
  };

  const config = {
    syncDrivers: true,
    syncVehicles: true,
    syncHOS: true,
    ...syncConfig
  };

  // Sync drivers - handle errors independently
  if (config.syncDrivers) {
    try {
      const drivers = await getDrivers(apiKey);
      results.drivers = drivers.length;
      // TODO: Map and sync drivers to local database
    } catch (error) {
      console.error('Samsara drivers sync error:', error.message);
      results.errors.push(`Drivers: ${error.message}`);
    }
  }

  // Sync vehicles - handle errors independently
  if (config.syncVehicles) {
    try {
      const vehicles = await getVehicles(apiKey);
      results.vehicles = vehicles.length;
      // TODO: Map and sync vehicles to local database
    } catch (error) {
      console.error('Samsara vehicles sync error:', error.message);
      results.errors.push(`Vehicles: ${error.message}`);
    }
  }

  // Sync HOS logs - handle errors independently (requires ELD permissions)
  if (config.syncHOS) {
    try {
      const hosLogs = await getHOSLogs(apiKey);
      results.hosLogs = hosLogs.length;
      // TODO: Map and store HOS data
    } catch (error) {
      console.error('Samsara HOS sync error:', error.message);
      // HOS often fails due to ELD permission requirements
      if (error.message.includes('permission') || error.status === 403) {
        results.errors.push('HOS: API token lacks ELD Compliance permissions. Enable in Samsara settings.');
      } else {
        results.errors.push(`HOS: ${error.message}`);
      }
    }
  }

  // If all syncs failed, throw an error
  if (results.drivers === 0 && results.vehicles === 0 && results.hosLogs === 0 && results.errors.length > 0) {
    throw new Error(results.errors.join('; '));
  }

  return results;
};

/**
 * Map Samsara driver to VroomX driver format
 */
const mapSamsaraDriver = (samsaraDriver) => {
  return {
    externalId: samsaraDriver.id,
    firstName: samsaraDriver.name?.split(' ')[0] || '',
    lastName: samsaraDriver.name?.split(' ').slice(1).join(' ') || '',
    email: samsaraDriver.email || null,
    phone: samsaraDriver.phone || null,
    licenseNumber: samsaraDriver.licenseNumber || null,
    licenseState: samsaraDriver.licenseState || null,
    status: samsaraDriver.driverActivationStatus === 'active' ? 'active' : 'inactive',
    source: 'samsara',
    samsaraData: samsaraDriver
  };
};

/**
 * Map Samsara vehicle to VroomX vehicle format
 */
const mapSamsaraVehicle = (samsaraVehicle) => {
  return {
    externalId: samsaraVehicle.id,
    unitNumber: samsaraVehicle.name || null,
    vin: samsaraVehicle.vin || null,
    make: samsaraVehicle.make || null,
    model: samsaraVehicle.model || null,
    year: samsaraVehicle.year || null,
    licensePlate: samsaraVehicle.licensePlate || null,
    status: 'active',
    source: 'samsara',
    samsaraData: samsaraVehicle
  };
};

module.exports = {
  validateApiKey,
  getDrivers,
  getVehicles,
  getHOSLogs,
  syncAll,
  mapSamsaraDriver,
  mapSamsaraVehicle
};
