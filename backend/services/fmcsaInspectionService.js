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
const NodeCache = require('node-cache');

// Cache for 6 hours
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

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
   * Sync inspection records from FMCSA DataHub (data.transportation.gov)
   * This is a free public API that provides actual inspection records
   * @param {string} companyId - Company ID
   * @returns {object} Sync result
   */
  async syncFromDataHub(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company?.dotNumber) {
        return { success: false, message: 'Company DOT number not found' };
      }

      const dotNumber = company.dotNumber.toString().replace(/^0+/, '');
      console.log(`[FMCSA DataHub] Fetching inspections for DOT ${dotNumber}`);

      // Fetch from data.transportation.gov Socrata API
      // Get inspections from last 3 years (API provides 3 years of data)
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const dateFilter = threeYearsAgo.toISOString().split('T')[0].replace(/-/g, '');

      const url = `https://data.transportation.gov/resource/fx4q-ay7w.json?$where=dot_number='${dotNumber}'&$order=insp_date DESC&$limit=500`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DataHub API error: ${response.status}`);
      }

      const inspections = await response.json();

      if (!Array.isArray(inspections) || inspections.length === 0) {
        return {
          success: true,
          message: 'No inspection records found in FMCSA DataHub',
          imported: 0,
          total: 0
        };
      }

      console.log(`[FMCSA DataHub] Found ${inspections.length} inspections`);

      let imported = 0;
      let updated = 0;

      for (const insp of inspections) {
        const parsedInspection = this.parseDataHubRecord(insp, companyId);

        // Upsert by report number (unique identifier)
        const result = await FMCSAInspection.findOneAndUpdate(
          { companyId, reportNumber: parsedInspection.reportNumber },
          parsedInspection,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (result.isNew || !result._id) {
          imported++;
        } else {
          updated++;
        }
      }

      // Update company's last sync timestamp
      await Company.findByIdAndUpdate(companyId, {
        'fmcsaData.lastDataHubSync': new Date()
      });

      console.log(`[FMCSA DataHub] Sync complete. New: ${imported}, Updated: ${updated}`);

      return {
        success: true,
        message: `Synced ${inspections.length} inspection records from FMCSA DataHub`,
        imported,
        updated,
        total: inspections.length
      };

    } catch (error) {
      console.error('[FMCSA DataHub] Sync failed:', error.message);
      return {
        success: false,
        message: error.message,
        imported: 0
      };
    }
  },

  /**
   * Parse a DataHub inspection record to model format
   * @param {object} record - Raw DataHub API record
   * @param {string} companyId - Company ID
   * @returns {object} Formatted inspection for model
   */
  parseDataHubRecord(record, companyId) {
    // Parse date from YYYYMMDD format
    const inspDate = record.insp_date;
    const year = inspDate.substring(0, 4);
    const month = inspDate.substring(4, 6);
    const day = inspDate.substring(6, 8);
    const inspectionDate = new Date(`${year}-${month}-${day}`);

    // Determine OOS status
    const vehicleOOS = parseInt(record.vehicle_oos_total || 0) > 0;
    const driverOOS = parseInt(record.driver_oos_total || 0) > 0;
    const hazmatOOS = parseInt(record.hazmat_oos_total || 0) > 0;

    return {
      companyId,
      reportNumber: record.report_number,
      inspectionId: record.inspection_id,
      inspectionDate,
      state: record.report_state,
      location: record.location_desc || record.location || '',
      inspectionLevel: parseInt(record.insp_level_id) || 1,
      inspectionType: record.insp_facility === 'R' ? 'roadside' :
                      record.insp_facility === 'T' ? 'terminal' :
                      record.post_acc_ind === 'Y' ? 'post_crash' : 'roadside',
      vehicleOOS,
      driverOOS,
      hazmatOOS,
      totalViolations: parseInt(record.viol_total) || 0,
      vehicleViolations: parseInt(record.vehicle_viol_total) || 0,
      driverViolations: parseInt(record.driver_viol_total) || 0,
      hazmatViolations: parseInt(record.hazmat_viol_total) || 0,
      oosTotal: parseInt(record.oos_total) || 0,
      // Store carrier info from inspection
      carrierName: record.insp_carrier_name,
      carrierCity: record.insp_carrier_city,
      carrierState: record.insp_carrier_state,
      // Vehicle weight if available
      grossWeight: parseInt(record.gross_comb_veh_wt) || null,
      // Shipper info
      shipperName: record.shipper_name || null,
      // Source tracking
      source: 'fmcsa_datahub',
      importedAt: new Date(),
      rawData: record
    };
  }
};

module.exports = fmcsaInspectionService;
