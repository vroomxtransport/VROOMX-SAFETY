/**
 * FMCSA Inspection Service
 *
 * Manages individual inspection records stored in the FMCSAInspection model.
 * Data sources:
 * 1. AI-extracted from uploaded inspection reports (via /api/inspections/upload)
 * 2. SaferWebAPI inspection endpoint (if available)
 * 3. Manual entry
 *
 * Note: SaferWebAPI snapshot provides aggregate stats only.
 * Individual inspection records may require the /v2/usdot/inspections endpoint.
 */

const FMCSAInspection = require('../models/FMCSAInspection');
const Company = require('../models/Company');
const Violation = require('../models/Violation');
const NodeCache = require('node-cache');
const { TIME_WEIGHT_FACTORS } = require('../config/fmcsaCompliance');

// Cache for 6 hours
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

const buildViolationKey = (inspectionNumber, violationCode, description, violationDate) => {
  const dateKey = violationDate instanceof Date
    ? violationDate.toISOString().split('T')[0]
    : 'unknown';
  return `${inspectionNumber || 'unknown'}|${violationCode || 'unknown'}|${description || 'unknown'}|${dateKey}`;
};

const calculateWeightedSeverity = (severityWeight, violationDate) => {
  const now = new Date();
  const date = violationDate instanceof Date ? violationDate : new Date(violationDate);
  const yearsAgo = Math.floor((now - date) / (365.25 * 24 * 60 * 60 * 1000));
  const timeWeight = TIME_WEIGHT_FACTORS[yearsAgo] || 0;
  return severityWeight * timeWeight;
};

const fmcsaInspectionService = {
  /**
   * Get all inspections for a company with filters and pagination
   * @param {string} companyId - Company ID
   * @param {object} options - Query options
   * @returns {object} Inspections and pagination info
   */
  async getInspections(companyId, options = {}) {
    const {
      page = 1,
      limit = 20,
      basic,
      oosOnly,
      startDate,
      endDate,
      level,
      sortBy = 'inspectionDate',
      sortOrder = 'desc'
    } = options;

    const query = { companyId };

    // Filter by BASIC category
    if (basic) {
      query['violations.basic'] = basic;
    }

    // Filter by OOS status
    if (oosOnly === 'true' || oosOnly === true) {
      query.$or = [
        { vehicleOOS: true },
        { driverOOS: true },
        { hazmatOOS: true }
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      query.inspectionDate = {};
      if (startDate) query.inspectionDate.$gte = new Date(startDate);
      if (endDate) query.inspectionDate.$lte = new Date(endDate);
    }

    // Filter by inspection level
    if (level) {
      query.inspectionLevel = parseInt(level);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [inspections, total] = await Promise.all([
      FMCSAInspection.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FMCSAInspection.countDocuments(query)
    ]);

    return {
      inspections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get a single inspection by ID
   * @param {string} companyId - Company ID (for authorization)
   * @param {string} inspectionId - Inspection ID
   * @returns {object|null} Inspection document
   */
  async getInspectionById(companyId, inspectionId) {
    return FMCSAInspection.findOne({
      _id: inspectionId,
      companyId
    }).lean();
  },

  /**
   * Get inspections filtered by BASIC category
   * @param {string} companyId - Company ID
   * @param {string} basic - BASIC category
   * @returns {array} Inspections
   */
  async getInspectionsByBasic(companyId, basic) {
    return FMCSAInspection.find({
      companyId,
      'violations.basic': basic
    })
    .sort({ inspectionDate: -1 })
    .lean();
  },

  /**
   * Get all violations across all inspections
   * @param {string} companyId - Company ID
   * @param {object} options - Query options
   * @returns {array} Violations with inspection context
   */
  async getViolations(companyId, options = {}) {
    const { page = 1, limit = 50, basic, oosOnly } = options;

    const match = { companyId };

    // Build aggregation pipeline
    const pipeline = [
      { $match: match },
      { $unwind: '$violations' },
      {
        $project: {
          _id: 1,
          reportNumber: 1,
          inspectionDate: 1,
          state: 1,
          location: 1,
          inspectionLevel: 1,
          violation: '$violations'
        }
      }
    ];

    // Filter by BASIC
    if (basic) {
      pipeline.push({ $match: { 'violation.basic': basic } });
    }

    // Filter by OOS
    if (oosOnly === 'true' || oosOnly === true) {
      pipeline.push({ $match: { 'violation.oos': true } });
    }

    // Sort by date
    pipeline.push({ $sort: { inspectionDate: -1 } });

    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const violations = await FMCSAInspection.aggregate(pipeline);

    // Get total count
    const countPipeline = [
      { $match: match },
      { $unwind: '$violations' }
    ];
    if (basic) countPipeline.push({ $match: { 'violation.basic': basic } });
    if (oosOnly === 'true' || oosOnly === true) countPipeline.push({ $match: { 'violation.oos': true } });
    countPipeline.push({ $count: 'total' });

    const countResult = await FMCSAInspection.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    return {
      violations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get recent inspections (for dashboard)
   * @param {string} companyId - Company ID
   * @param {number} limit - Number of records
   * @returns {array} Recent inspections
   */
  async getRecentInspections(companyId, limit = 5) {
    return FMCSAInspection.find({ companyId })
      .sort({ inspectionDate: -1 })
      .limit(limit)
      .select('reportNumber inspectionDate state inspectionLevel totalViolations vehicleOOS driverOOS')
      .lean();
  },

  /**
   * Get inspection statistics for a company
   * @param {string} companyId - Company ID
   * @returns {object} Statistics
   */
  async getInspectionStats(companyId) {
    const pipeline = [
      { $match: { companyId: companyId } },
      {
        $group: {
          _id: null,
          totalInspections: { $sum: 1 },
          totalViolations: { $sum: '$totalViolations' },
          vehicleOOSCount: { $sum: { $cond: ['$vehicleOOS', 1, 0] } },
          driverOOSCount: { $sum: { $cond: ['$driverOOS', 1, 0] } },
          hazmatOOSCount: { $sum: { $cond: ['$hazmatOOS', 1, 0] } },
          avgViolationsPerInspection: { $avg: '$totalViolations' }
        }
      }
    ];

    const result = await FMCSAInspection.aggregate(pipeline);
    const stats = result[0] || {
      totalInspections: 0,
      totalViolations: 0,
      vehicleOOSCount: 0,
      driverOOSCount: 0,
      hazmatOOSCount: 0,
      avgViolationsPerInspection: 0
    };

    // Get breakdown by BASIC
    const basicBreakdown = await FMCSAInspection.aggregate([
      { $match: { companyId: companyId } },
      { $unwind: '$violations' },
      {
        $group: {
          _id: '$violations.basic',
          count: { $sum: 1 },
          oosCount: { $sum: { $cond: ['$violations.oos', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get breakdown by inspection level
    const levelBreakdown = await FMCSAInspection.aggregate([
      { $match: { companyId: companyId } },
      {
        $group: {
          _id: '$inspectionLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get last 12 months trend
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrend = await FMCSAInspection.aggregate([
      {
        $match: {
          companyId: companyId,
          inspectionDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$inspectionDate' },
            month: { $month: '$inspectionDate' }
          },
          count: { $sum: 1 },
          violations: { $sum: '$totalViolations' },
          oosCount: {
            $sum: {
              $cond: [
                { $or: ['$vehicleOOS', '$driverOOS'] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
      ...stats,
      byBasic: basicBreakdown,
      byLevel: levelBreakdown,
      monthlyTrend
    };
  },

  /**
   * Attempt to sync inspection records from SaferWebAPI
   * Note: SaferWebAPI may only provide aggregate stats, not individual records
   * @param {string} companyId - Company ID
   * @returns {object} Sync result
   */
  async syncFromSaferWebAPI(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company?.dotNumber) {
        return { success: false, message: 'Company DOT number not found' };
      }

      const apiKey = process.env.SAFERWEB_API_KEY;
      if (!apiKey) {
        return { success: false, message: 'SAFERWEB_API_KEY not configured' };
      }

      const dotNumber = company.dotNumber;
      console.log(`[FMCSA Inspections] Attempting sync for DOT ${dotNumber}`);

      // Try the inspections endpoint (may not be available)
      const response = await fetch(
        `https://saferwebapi.com/v2/usdot/inspections/${dotNumber}`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'Individual inspection records not available from SaferWebAPI. Use manual upload or AI extraction.',
            imported: 0
          };
        }
        throw new Error(`SaferWebAPI error: ${response.status}`);
      }

      const data = await response.json();

      // Parse and store inspection records
      if (data.inspections && Array.isArray(data.inspections)) {
        let imported = 0;

        for (const insp of data.inspections) {
          const inspection = this.parseInspectionRecord(insp, companyId);

          // Upsert by report number
          await FMCSAInspection.findOneAndUpdate(
            { companyId, reportNumber: inspection.reportNumber },
            inspection,
            { upsert: true, new: true }
          );
          imported++;
        }

        console.log(`[FMCSA Inspections] Sync complete. Imported ${imported} records.`);

        return {
          success: true,
          message: `Imported ${imported} inspection records`,
          imported
        };
      }

      return {
        success: true,
        message: 'No inspection records found',
        imported: 0
      };

    } catch (error) {
      console.error('[FMCSA Inspections] Sync failed:', error.message);
      return {
        success: false,
        message: error.message,
        imported: 0
      };
    }
  },

  /**
   * Parse an inspection record from API format to model format
   * @param {object} apiRecord - Raw API record
   * @param {string} companyId - Company ID
   * @returns {object} Formatted inspection
   */
  parseInspectionRecord(apiRecord, companyId) {
    return {
      companyId,
      reportNumber: apiRecord.report_number || apiRecord.reportNumber,
      inspectionDate: new Date(apiRecord.inspection_date || apiRecord.inspectionDate),
      state: apiRecord.state,
      location: apiRecord.location || apiRecord.city,
      inspectionLevel: apiRecord.level || apiRecord.inspectionLevel,
      inspectionType: apiRecord.type || 'roadside',
      vehicleOOS: apiRecord.vehicle_oos || apiRecord.vehicleOOS || false,
      driverOOS: apiRecord.driver_oos || apiRecord.driverOOS || false,
      hazmatOOS: apiRecord.hazmat_oos || apiRecord.hazmatOOS || false,
      totalViolations: apiRecord.violations?.length || apiRecord.totalViolations || 0,
      violations: (apiRecord.violations || []).map(v => ({
        code: v.code || v.violation_code,
        description: v.description,
        basic: v.basic || v.basic_category,
        severityWeight: v.severity || v.severityWeight || 5,
        oos: v.oos || v.out_of_service || false,
        unit: v.unit || 'vehicle'
      })),
      source: 'saferweb_api',
      importedAt: new Date()
    };
  },

  /**
   * Create a new inspection record
   * @param {string} companyId - Company ID
   * @param {object} data - Inspection data
   * @returns {object} Created inspection
   */
  async createInspection(companyId, data) {
    const inspection = new FMCSAInspection({
      companyId,
      ...data,
      importedAt: new Date(),
      source: data.source || 'manual'
    });

    // Calculate time weights
    inspection.calculateTimeWeights();

    await inspection.save();
    return inspection;
  },

  /**
   * Update an inspection record
   * @param {string} companyId - Company ID
   * @param {string} inspectionId - Inspection ID
   * @param {object} updates - Fields to update
   * @returns {object|null} Updated inspection
   */
  async updateInspection(companyId, inspectionId, updates) {
    const inspection = await FMCSAInspection.findOneAndUpdate(
      { _id: inspectionId, companyId },
      updates,
      { new: true, runValidators: true }
    );

    if (inspection) {
      inspection.calculateTimeWeights();
      await inspection.save();
    }

    return inspection;
  },

  /**
   * Delete an inspection record
   * @param {string} companyId - Company ID
   * @param {string} inspectionId - Inspection ID
   * @returns {boolean} Success
   */
  async deleteInspection(companyId, inspectionId) {
    const result = await FMCSAInspection.findOneAndDelete({
      _id: inspectionId,
      companyId
    });
    return !!result;
  },

  /**
   * Parse SMS date format "DD-MMM-YY" (e.g., "07-OCT-24") to UTC Date
   * @param {string} dateStr - Date string in DD-MMM-YY format
   * @returns {Date} UTC Date at midnight
   */
  parseSMSDate(dateStr) {
    if (!dateStr) return null;

    const months = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toUpperCase();
    const yearStr = parts[2];

    const month = months[monthStr];
    if (month === undefined) return null;

    // Assume 20xx for 2-digit years
    const year = parseInt(yearStr, 10) + 2000;

    // Return UTC date at midnight to avoid timezone issues
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  },

  /**
   * Parse a DataHub SMS violation record to model format
   * @param {object} record - Raw SMS violation record
   * @returns {object} Formatted violation
   */
  parseDataHubViolation(record) {
    // Map BASIC codes to enum values (must match FMCSAInspection schema)
    const basicEnumMap = {
      'HM': 'hazmat',
      'VC': 'vehicle_maintenance',
      'DL': 'driver_fitness',
      'DS': 'unsafe_driving',
      'HOS': 'hours_of_service',
      'CF': 'controlled_substances',
      'CR': 'crash_indicator'
    };

    // Map basic_desc text to enum values
    const basicDescMap = {
      'vehicle maintenance': 'vehicle_maintenance',
      'driver fitness': 'driver_fitness',
      'unsafe driving': 'unsafe_driving',
      'hours of service': 'hours_of_service',
      'controlled substances': 'controlled_substances',
      'hazardous materials': 'hazmat',
      'crash indicator': 'crash_indicator'
    };

    // Try to get basic from code first, then from description
    const basicCode = record.basic || record.basic_desc?.substring(0, 2)?.toUpperCase();
    let basic = basicEnumMap[basicCode];

    // If not found by code, try matching the full description
    if (!basic && record.basic_desc) {
      const descLower = record.basic_desc.toLowerCase();
      basic = basicDescMap[descLower] || Object.entries(basicDescMap).find(([k]) => descLower.includes(k))?.[1];
    }

    // Parse viol_unit to determine driver/vehicle/hazmat
    let unit = 'vehicle';
    if (record.viol_unit) {
      const unitStr = String(record.viol_unit).toLowerCase();
      if (unitStr.includes('driver') || unitStr === 'd') unit = 'driver';
      else if (unitStr.includes('hazmat') || unitStr === 'hm') unit = 'hazmat';
    }

    return {
      code: record.viol_code || record.violation_code || record.code,
      description: record.section_desc || record.description || `Violation ${record.viol_code}`,
      basic: basic || 'vehicle_maintenance', // Default to vehicle_maintenance if unknown
      severityWeight: parseInt(record.severity_weight, 10) || 5,
      timeWeight: parseFloat(record.time_weight) || 1.0,
      oos: record.oos_indicator === 'Y' || record.oos === 'Y' || record.oos === true,
      unit: unit,
      section: record.section_desc || null,
      group: record.group_desc || null
    };
  },

  /**
   * Import DataHub violations into the Violation collection for DataQ workflows
   * @param {string} companyId - Company ID
   * @param {object} violationsByInspection - Grouped violations keyed by inspection ID
   * @returns {number} Count of newly created violations
   */
  async importDataHubViolationsToDataQ(companyId, violationsByInspection) {
    const inspections = Object.values(violationsByInspection || {});
    if (inspections.length === 0) return 0;

    const inspectionNumbers = inspections
      .map(i => i.reportNumber)
      .filter(Boolean);

    if (inspectionNumbers.length === 0) return 0;

    const existing = await Violation.find({
      companyId,
      inspectionNumber: { $in: inspectionNumbers }
    })
      .select('inspectionNumber violationCode description violationDate')
      .lean();

    const existingKeys = new Set(
      existing.map(v => buildViolationKey(v.inspectionNumber, v.violationCode, v.description, v.violationDate))
    );

    const docs = [];

    for (const inspection of inspections) {
      if (!inspection?.date || !inspection?.reportNumber) continue;

      const location = {
        state: inspection.state || null
      };

      for (const violation of inspection.violations || []) {
        if (!violation?.code) continue;

        const description = violation.description || `Violation ${violation.code}`;
        const key = buildViolationKey(
          inspection.reportNumber,
          violation.code,
          description,
          inspection.date
        );

        if (existingKeys.has(key)) continue;

        const severityWeight = Number.isFinite(violation.severityWeight)
          ? violation.severityWeight
          : parseInt(violation.severityWeight, 10) || 5;

        docs.push({
          companyId,
          inspectionNumber: inspection.reportNumber,
          violationDate: inspection.date,
          location,
          basic: violation.basic || 'vehicle_maintenance',
          violationType: description,
          violationCode: violation.code,
          description,
          severityWeight,
          outOfService: !!violation.oos,
          weightedSeverity: calculateWeightedSeverity(severityWeight, inspection.date),
          inspectionType: 'roadside',
          status: 'open',
          history: [{
            action: 'imported_from_fmcsa_datahub',
            date: new Date(),
            notes: `Imported from FMCSA DataHub (inspection ${inspection.reportNumber})`
          }]
        });

        existingKeys.add(key);
      }
    }

    if (docs.length === 0) return 0;

    try {
      const inserted = await Violation.insertMany(docs, { ordered: false });
      return inserted.length;
    } catch (error) {
      console.error('[FMCSA Violations] Import to DataQ failed:', error.message);
      return 0;
    }
  },

  /**
   * Sync violation details from FMCSA DataHub SMS dataset
   * @param {string} companyId - Company ID
   * @returns {object} Sync result
   */
  async syncViolationsFromDataHub(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company?.dotNumber) {
        return { success: false, message: 'Company DOT number not found' };
      }

      const dotNumber = company.dotNumber;
      console.log(`[FMCSA Violations] Fetching violations for DOT ${dotNumber} from DataHub SMS dataset`);

      // Fetch from SMS Input - Violation dataset (8mt8-2mdr)
      const url = `https://datahub.transportation.gov/resource/8mt8-2mdr.json?$where=dot_number='${dotNumber}'&$limit=2000`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DataHub API error: ${response.status}`);
      }

      const violations = await response.json();
      console.log(`[FMCSA Violations] Fetched ${violations.length} violation records`);

      if (violations.length === 0) {
        return {
          success: true,
          message: 'No violation records found in DataHub',
          matched: 0,
          total: 0
        };
      }

      // Group violations by unique_id (inspection identifier in SMS dataset)
      // Also capture inspection-level metadata from the first violation record
      const violationsByInspection = {};
      for (const v of violations) {
        const inspId = v.unique_id;
        if (!inspId) continue;

        if (!violationsByInspection[inspId]) {
          violationsByInspection[inspId] = {
            reportNumber: inspId,
            date: this.parseSMSDate(v.insp_date),
            state: v.insp_state || v.state || null,
            inspectionLevel: parseInt(v.insp_level_id, 10) || null,
            violations: []
          };
        }
        violationsByInspection[inspId].violations.push(this.parseDataHubViolation(v));
      }

      console.log(`[FMCSA Violations] Grouped into ${Object.keys(violationsByInspection).length} inspections`);

      // Process inspections - update existing or create new ones
      let matchedCount = 0;
      let createdCount = 0;
      const inspectionIds = Object.keys(violationsByInspection);

      for (const inspId of inspectionIds) {
        const data = violationsByInspection[inspId];
        if (!data.date) continue;

        // Check if any violations have OOS flags
        const hasVehicleOOS = data.violations.some(v => v.oos && v.unit === 'vehicle');
        const hasDriverOOS = data.violations.some(v => v.oos && v.unit === 'driver');
        const hasHazmatOOS = data.violations.some(v => v.oos && v.unit === 'hazmat');

        // Try to find existing inspection by reportNumber first
        let inspection = await FMCSAInspection.findOne({
          companyId,
          reportNumber: data.reportNumber
        });

        if (inspection) {
          // Update existing inspection with violation details
          inspection.violations = data.violations;
          inspection.totalViolations = data.violations.length;
          inspection.vehicleOOS = hasVehicleOOS || inspection.vehicleOOS;
          inspection.driverOOS = hasDriverOOS || inspection.driverOOS;
          inspection.hazmatOOS = hasHazmatOOS || inspection.hazmatOOS;
          inspection.violationsSource = 'datahub_sms';
          inspection.violationsSyncedAt = new Date();

          if (typeof inspection.calculateTimeWeights === 'function') {
            inspection.calculateTimeWeights();
          }

          await inspection.save();
          matchedCount++;
        } else {
          // Create new inspection from DataHub data
          inspection = new FMCSAInspection({
            companyId,
            reportNumber: data.reportNumber,
            inspectionDate: data.date,
            state: data.state,
            inspectionLevel: data.inspectionLevel,
            inspectionType: 'roadside',
            vehicleOOS: hasVehicleOOS,
            driverOOS: hasDriverOOS,
            hazmatOOS: hasHazmatOOS,
            totalViolations: data.violations.length,
            violations: data.violations,
            source: 'datahub_sms',
            importedAt: new Date()
          });

          if (typeof inspection.calculateTimeWeights === 'function') {
            inspection.calculateTimeWeights();
          }

          await inspection.save();
          createdCount++;
        }
      }

      console.log(`[FMCSA Violations] Created ${createdCount} new inspections, updated ${matchedCount} existing`);

      let dataqCreated = 0;
      try {
        dataqCreated = await this.importDataHubViolationsToDataQ(companyId, violationsByInspection);
        if (dataqCreated > 0) {
          console.log(`[FMCSA Violations] Imported ${dataqCreated} violations into DataQ dataset`);
        }
      } catch (error) {
        console.error('[FMCSA Violations] DataQ import failed:', error.message);
      }

      return {
        success: true,
        message: `Synced ${createdCount + matchedCount} inspections (${createdCount} new, ${matchedCount} updated) with ${violations.length} violations`,
        created: createdCount,
        matched: matchedCount,
        total: inspectionIds.length,
        violationCount: violations.length,
        dataqCreated
      };

    } catch (error) {
      console.error('[FMCSA Violations] Sync failed:', error.message);
      return {
        success: false,
        message: error.message,
        matched: 0
      };
    }
  },

  /**
   * Sync both inspections and violations from DataHub
   * @param {string} companyId - Company ID
   * @returns {object} Combined sync result
   */
  async syncAllFromDataHub(companyId) {
    try {
      // First try SaferWebAPI for inspections (often returns 404)
      const inspResult = await this.syncFromSaferWebAPI(companyId);

      // Then sync from DataHub - this will create inspections if none exist
      const violResult = await this.syncViolationsFromDataHub(companyId);

      // Combine counts: SaferWebAPI imports + DataHub-created inspections
      const totalImported = (inspResult.imported || 0) + (violResult.created || 0);

      return {
        success: true,
        inspections: {
          success: inspResult.success || violResult.success,
          message: violResult.message || inspResult.message,
          imported: totalImported
        },
        violations: {
          success: violResult.success,
          message: violResult.message,
          matched: (violResult.matched || 0) + (violResult.created || 0),
          total: violResult.violationCount || 0,
          dataqCreated: violResult.dataqCreated || 0
        }
      };

    } catch (error) {
      console.error('[FMCSA Sync All] Failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

module.exports = fmcsaInspectionService;
