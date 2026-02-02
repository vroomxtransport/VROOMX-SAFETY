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
 * Get vehicle stats/telematics from Samsara
 * @param {string} apiKey - Samsara API key
 * @param {string[]} vehicleIds - Optional array of Samsara vehicle IDs
 */
const getVehicleStats = async (apiKey, vehicleIds = null) => {
  try {
    // Request GPS, odometer, fuel, and engine state data
    const types = 'gps,obdOdometerMeters,gpsOdometerMeters,fuelPercent,engineStates';
    let endpoint = `/fleet/vehicles/stats?types=${types}`;

    if (vehicleIds && vehicleIds.length > 0) {
      endpoint += `&vehicleIds=${vehicleIds.join(',')}`;
    }

    const data = await makeRequest(apiKey, endpoint);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Samsara vehicle stats:', error.message);
    throw error;
  }
};

/**
 * Sync telematics data for a specific vehicle from Samsara
 * @param {Object} integration - Integration document
 * @param {string} vehicleId - VroomX vehicle ID
 */
const syncVehicleTelematics = async (integration, vehicleId) => {
  const apiKey = integration.getDecryptedApiKey();
  if (!apiKey) {
    throw new Error('Unable to decrypt API key');
  }

  // Find the vehicle and get its samsaraId
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle || !vehicle.samsaraId) {
    throw new Error('Vehicle not found or not linked to Samsara');
  }

  // Fetch stats from Samsara for this specific vehicle
  const stats = await getVehicleStats(apiKey, [vehicle.samsaraId]);
  if (!stats || stats.length === 0) {
    throw new Error('No telematics data available from Samsara');
  }

  const vehicleStats = stats[0];
  const telematics = mapSamsaraTelematics(vehicleStats);

  // Update vehicle with telematics data
  vehicle.samsaraTelematics = telematics;
  await vehicle.save();

  return telematics;
};

/**
 * Map Samsara stats response to VroomX telematics format
 */
const mapSamsaraTelematics = (samsaraStats) => {
  const telematics = {
    lastUpdated: new Date()
  };

  // Odometer - prefer OBD over GPS
  if (samsaraStats.obdOdometerMeters) {
    telematics.currentMileage = Math.round(samsaraStats.obdOdometerMeters.value / 1609.34);
    telematics.odometerSource = 'obd';
  } else if (samsaraStats.gpsOdometerMeters) {
    telematics.currentMileage = Math.round(samsaraStats.gpsOdometerMeters.value / 1609.34);
    telematics.odometerSource = 'gps';
  }

  // GPS Location
  if (samsaraStats.gps) {
    telematics.location = {
      latitude: samsaraStats.gps.latitude,
      longitude: samsaraStats.gps.longitude,
      address: samsaraStats.gps.reverseGeo?.formattedLocation || null,
      speedMph: samsaraStats.gps.speedMilesPerHour || 0,
      heading: samsaraStats.gps.headingDegrees || 0
    };
  }

  // Fuel Level
  if (samsaraStats.fuelPercent) {
    telematics.fuelPercent = Math.round(samsaraStats.fuelPercent.value);
  }

  // Engine State
  if (samsaraStats.engineStates && samsaraStats.engineStates.length > 0) {
    const engineState = samsaraStats.engineStates[0].value;
    telematics.engineRunning = engineState === 'On' || engineState === 'Idle';
  }

  // Engine Hours (if available from OBD)
  if (samsaraStats.obdEngineSeconds) {
    telematics.engineHours = Math.round(samsaraStats.obdEngineSeconds.value / 3600);
  }

  return telematics;
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
 * Get DVIRs (Driver Vehicle Inspection Reports) from Samsara
 * @param {string} apiKey - Samsara API key
 * @param {Object} options - Query options (startTime, endTime)
 */
const getDvirs = async (apiKey, options = {}) => {
  try {
    // Default to last 30 days if no dates provided
    const endTime = options.endTime || new Date().toISOString();
    const startTime = options.startTime || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
      startTime,
      endTime
    });

    const data = await makeRequest(apiKey, `/fleet/dvirs?${params.toString()}`);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Samsara DVIRs:', error.message);
    throw error;
  }
};

/**
 * Sync DVIRs from Samsara and link them to drivers
 * @param {Object} integration - Integration document
 */
const syncDriverDvirs = async (integration) => {
  const apiKey = integration.getDecryptedApiKey();
  if (!apiKey) {
    throw new Error('Unable to decrypt API key');
  }

  const dvirs = await getDvirs(apiKey);
  let synced = 0;

  for (const dvir of dvirs) {
    // Find the driver by their Samsara ID
    const driverSamsaraId = dvir.driver?.id;
    if (!driverSamsaraId) continue;

    const driver = await Driver.findOne({
      companyId: integration.companyId,
      samsaraId: driverSamsaraId
    });

    if (!driver) continue;

    // Check if this DVIR already exists (by samsaraId)
    const existingDvir = driver.samsaraDvirs?.find(d => d.samsaraId === dvir.id);
    if (existingDvir) continue;

    // Map DVIR data
    const mappedDvir = {
      samsaraId: dvir.id,
      vehicleSamsaraId: dvir.vehicle?.id || null,
      vehicleName: dvir.vehicle?.name || 'Unknown Vehicle',
      inspectionType: dvir.inspectionType === 'pre' ? 'pre_trip' :
                      dvir.inspectionType === 'post' ? 'post_trip' : 'other',
      inspectedAt: dvir.inspectionTime ? new Date(dvir.inspectionTime) : null,
      submittedAt: dvir.submittedTime ? new Date(dvir.submittedTime) : null,
      location: dvir.location ? {
        latitude: dvir.location.latitude,
        longitude: dvir.location.longitude,
        address: dvir.location.formattedAddress || null
      } : null,
      defectsFound: dvir.defects && dvir.defects.length > 0,
      defects: (dvir.defects || []).map(defect => ({
        category: defect.defectType || 'Other',
        description: defect.comment || defect.defectType || 'No description',
        isMajor: defect.isMajor || false,
        resolved: defect.isResolved || false,
        resolvedAt: defect.resolvedTime ? new Date(defect.resolvedTime) : null
      })),
      safeToOperate: dvir.vehicleConditionSafe !== false,
      syncedAt: new Date()
    };

    // Add to driver's DVIRs array
    if (!driver.samsaraDvirs) {
      driver.samsaraDvirs = [];
    }
    driver.samsaraDvirs.push(mappedDvir);
    await driver.save();
    synced++;
  }

  return { synced, total: dvirs.length };
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
    dvirs: 0,
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

      // After drivers are synced, sync their DVIRs
      try {
        const dvirResults = await syncDriverDvirs(integration);
        results.dvirs = dvirResults.synced;
      } catch (dvirError) {
        console.error('Samsara DVIRs sync error:', dvirError.message);
        results.errors.push(`DVIRs: ${dvirError.message}`);
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
 * For vehicles, also fetches initial telematics data
 */
const matchRecord = async (samsaraRecordId, vroomxRecordId, recordType, integration = null) => {
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

  // For vehicles, fetch telematics data from Samsara
  if (recordType === 'vehicle' && integration) {
    try {
      const apiKey = integration.getDecryptedApiKey();
      if (apiKey) {
        const stats = await getVehicleStats(apiKey, [samsaraRecord.samsaraId]);
        if (stats && stats.length > 0) {
          const telematics = mapSamsaraTelematics(stats[0]);
          vroomxRecord.samsaraTelematics = telematics;
          await vroomxRecord.save();
        }
      }
    } catch (telematicsError) {
      // Log but don't fail the match if telematics fetch fails
      console.error('Failed to fetch telematics on match:', telematicsError.message);
    }
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

    // Set default dates (placeholder until real data is entered)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

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
      // CDL info from Samsara (with defaults for missing data)
      cdl: {
        number: mapped.licenseNumber || 'PENDING',
        state: mapped.licenseState || 'XX',
        class: additionalData.cdlClass || 'A',
        expiryDate: additionalData.cdlExpiryDate || oneYearFromNow
      },
      // Medical card (placeholder until real data entered)
      medicalCard: {
        expiryDate: additionalData.medicalExpiryDate || twoYearsFromNow
      },
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
  getVehicleStats,
  getHOSLogs,
  getDvirs,
  syncAll,
  syncVehicleTelematics,
  syncDriverDvirs,
  getPendingRecords,
  matchRecord,
  createFromSamsara,
  mapSamsaraDriver,
  mapSamsaraVehicle,
  mapSamsaraTelematics
};
