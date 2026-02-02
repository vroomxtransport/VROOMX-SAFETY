/**
 * Samsara API Service
 * Handles all communication with Samsara Fleet Management API
 *
 * API Documentation: https://developers.samsara.com/docs
 */

const SamsaraRecord = require('../models/SamsaraRecord');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');

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
 * Stores records in SamsaraRecord collection for manual matching
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
    pendingDrivers: 0,
    pendingVehicles: 0,
    errors: []
  };

  const config = {
    syncDrivers: true,
    syncVehicles: true,
    syncHOS: true,
    ...syncConfig
  };

  // Sync drivers - store in SamsaraRecord collection
  if (config.syncDrivers) {
    try {
      const drivers = await getDrivers(apiKey);
      results.drivers = drivers.length;

      for (const driver of drivers) {
        // Check if already matched to a VroomX driver
        const existingMatch = await Driver.findOne({
          companyId: integration.companyId,
          samsaraId: driver.id
        });

        // Upsert the SamsaraRecord
        const record = await SamsaraRecord.findOneAndUpdate(
          {
            companyId: integration.companyId,
            samsaraId: driver.id,
            recordType: 'driver'
          },
          {
            integrationId: integration._id,
            samsaraData: driver,
            displayName: driver.name || 'Unknown',
            identifier: driver.licenseNumber || driver.username || null,
            status: existingMatch ? 'matched' : 'pending',
            linkedRecordId: existingMatch?._id || null,
            linkedRecordModel: existingMatch ? 'Driver' : null,
            linkedAt: existingMatch ? new Date() : null,
            syncedAt: new Date()
          },
          { upsert: true, new: true }
        );

        if (record.status === 'pending') {
          results.pendingDrivers++;
        }
      }
    } catch (error) {
      console.error('Samsara drivers sync error:', error.message);
      results.errors.push(`Drivers: ${error.message}`);
    }
  }

  // Sync vehicles - store in SamsaraRecord collection
  if (config.syncVehicles) {
    try {
      const vehicles = await getVehicles(apiKey);
      results.vehicles = vehicles.length;

      for (const vehicle of vehicles) {
        // Check if already matched to a VroomX vehicle
        const existingMatch = await Vehicle.findOne({
          companyId: integration.companyId,
          samsaraId: vehicle.id
        });

        // Upsert the SamsaraRecord
        const record = await SamsaraRecord.findOneAndUpdate(
          {
            companyId: integration.companyId,
            samsaraId: vehicle.id,
            recordType: 'vehicle'
          },
          {
            integrationId: integration._id,
            samsaraData: vehicle,
            displayName: vehicle.name || 'Unknown',
            identifier: vehicle.vin || vehicle.serial || null,
            status: existingMatch ? 'matched' : 'pending',
            linkedRecordId: existingMatch?._id || null,
            linkedRecordModel: existingMatch ? 'Vehicle' : null,
            linkedAt: existingMatch ? new Date() : null,
            syncedAt: new Date()
          },
          { upsert: true, new: true }
        );

        if (record.status === 'pending') {
          results.pendingVehicles++;
        }
      }
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
      // HOS data is informational - no matching needed
    } catch (error) {
      console.error('Samsara HOS sync error:', error.message);
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
 * Get pending (unmatched) Samsara records for a company
 */
const getPendingRecords = async (companyId) => {
  const records = await SamsaraRecord.find({
    companyId,
    status: 'pending'
  }).sort({ recordType: 1, displayName: 1 });

  return {
    drivers: records.filter(r => r.recordType === 'driver'),
    vehicles: records.filter(r => r.recordType === 'vehicle')
  };
};

/**
 * Match a Samsara record to an existing VroomX record
 */
const matchRecord = async (samsaraRecordId, vroomxRecordId, recordType) => {
  const samsaraRecord = await SamsaraRecord.findById(samsaraRecordId);
  if (!samsaraRecord) {
    throw new Error('Samsara record not found');
  }

  // Update the VroomX record with samsaraId
  const Model = recordType === 'driver' ? Driver : Vehicle;
  const vroomxRecord = await Model.findByIdAndUpdate(
    vroomxRecordId,
    { samsaraId: samsaraRecord.samsaraId },
    { new: true }
  );

  if (!vroomxRecord) {
    throw new Error(`${recordType} not found`);
  }

  // Update the SamsaraRecord as matched
  samsaraRecord.status = 'matched';
  samsaraRecord.linkedRecordId = vroomxRecord._id;
  samsaraRecord.linkedRecordModel = recordType === 'driver' ? 'Driver' : 'Vehicle';
  samsaraRecord.linkedAt = new Date();
  await samsaraRecord.save();

  return { samsaraRecord, vroomxRecord };
};

/**
 * Create a new VroomX record from Samsara data
 */
const createFromSamsara = async (samsaraRecordId, companyId, additionalData = {}) => {
  const samsaraRecord = await SamsaraRecord.findById(samsaraRecordId);
  if (!samsaraRecord) {
    throw new Error('Samsara record not found');
  }

  let newRecord;
  if (samsaraRecord.recordType === 'driver') {
    const mapped = mapSamsaraDriver(samsaraRecord.samsaraData);
    newRecord = await Driver.create({
      companyId,
      firstName: mapped.firstName || 'Unknown',
      lastName: mapped.lastName || 'Driver',
      email: mapped.email,
      phone: mapped.phone,
      samsaraId: samsaraRecord.samsaraId,
      hireDate: new Date(),
      dateOfBirth: additionalData.dateOfBirth || new Date('1990-01-01'),
      status: 'active',
      ...additionalData
    });
  } else {
    const mapped = mapSamsaraVehicle(samsaraRecord.samsaraData);
    newRecord = await Vehicle.create({
      companyId,
      unitNumber: mapped.unitNumber || `SAMSARA-${samsaraRecord.samsaraId.slice(-6)}`,
      vin: mapped.vin || additionalData.vin,
      make: mapped.make,
      model: mapped.model,
      year: mapped.year,
      samsaraId: samsaraRecord.samsaraId,
      vehicleType: additionalData.vehicleType || 'tractor',
      status: 'active',
      ...additionalData
    });
  }

  // Update SamsaraRecord as created
  samsaraRecord.status = 'created';
  samsaraRecord.linkedRecordId = newRecord._id;
  samsaraRecord.linkedRecordModel = samsaraRecord.recordType === 'driver' ? 'Driver' : 'Vehicle';
  samsaraRecord.linkedAt = new Date();
  await samsaraRecord.save();

  return newRecord;
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
  getPendingRecords,
  matchRecord,
  createFromSamsara,
  mapSamsaraDriver,
  mapSamsaraVehicle
};
