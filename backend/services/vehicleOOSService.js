const Violation = require('../models/Violation');
const Vehicle = require('../models/Vehicle');

/**
 * Vehicle OOS Service
 * Handles vehicle violation retrieval and out-of-service rate calculations
 * Mirrors driverCSAService.js pattern for UI integration
 */
const vehicleOOSService = {
  /**
   * Get OOS statistics for a specific vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {string} companyId - Company ID for tenant isolation
   * @returns {Object} OOS stats with BASIC breakdown and recent violations
   */
  async getVehicleOOSStats(vehicleId, companyId) {
    // Verify vehicle exists and belongs to company
    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId })
      .select('unitNumber vin make model year status licensePlate')
      .lean();

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Get all violations for this vehicle (last 24 months)
    const twoYearsAgo = new Date();
    twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 24);

    const violations = await Violation.find({
      vehicleId,
      companyId,
      violationDate: { $gte: twoYearsAgo }
    })
      .populate('driverId', 'firstName lastName employeeId')
      .lean();

    // Calculate OOS statistics
    const totalViolations = violations.length;
    const oosViolations = violations.filter(v => v.outOfService).length;
    const oosRate = totalViolations > 0
      ? parseFloat((oosViolations / totalViolations * 100).toFixed(1))
      : 0;

    // Calculate BASIC category breakdown
    const basicBreakdown = this._calculateBasicBreakdown(violations);

    // Get 5 most recent violations
    const recentViolations = violations
      .sort((a, b) => new Date(b.violationDate) - new Date(a.violationDate))
      .slice(0, 5)
      .map(v => ({
        _id: v._id,
        date: v.violationDate,
        basic: v.basic,
        description: v.description,
        severityWeight: v.severityWeight,
        outOfService: v.outOfService,
        status: v.status,
        driver: v.driverId ? {
          _id: v.driverId._id,
          firstName: v.driverId.firstName,
          lastName: v.driverId.lastName,
          fullName: `${v.driverId.firstName} ${v.driverId.lastName}`,
          employeeId: v.driverId.employeeId
        } : null
      }));

    return {
      vehicle: {
        _id: vehicle._id,
        unitNumber: vehicle.unitNumber,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status,
        licensePlate: vehicle.licensePlate
      },
      totalViolations,
      oosViolations,
      oosRate,
      basicBreakdown,
      recentViolations
    };
  },

  /**
   * Get paginated violations for a specific vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {string} companyId - Company ID for tenant isolation
   * @param {Object} filters - Optional filters (page, limit, basic, sortBy, sortOrder)
   * @returns {Object} Paginated violations with total count
   */
  async getVehicleViolations(vehicleId, companyId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      basic,
      sortBy = 'violationDate',
      sortOrder = 'desc'
    } = filters;

    const query = { vehicleId, companyId };

    if (basic) query.basic = basic;

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [violations, total] = await Promise.all([
      Violation.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('driverId', 'firstName lastName employeeId')
        .lean(),
      Violation.countDocuments(query)
    ]);

    return {
      violations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Calculate BASIC category breakdown from violations
   * @private
   * @param {Array} violations - Array of violation documents
   * @returns {Object} Breakdown by BASIC category
   */
  _calculateBasicBreakdown(violations) {
    const breakdown = {};

    // Initialize all BASIC categories
    const basicCategories = [
      'unsafe_driving',
      'hours_of_service',
      'vehicle_maintenance',
      'controlled_substances',
      'driver_fitness',
      'crash_indicator',
      'hazmat'
    ];

    basicCategories.forEach(basic => {
      breakdown[basic] = {
        name: this._getBasicName(basic),
        count: 0,
        oosCount: 0
      };
    });

    // Tally violations per category
    violations.forEach(violation => {
      const basic = violation.basic;
      if (!breakdown[basic]) return;

      breakdown[basic].count++;

      if (violation.outOfService) {
        breakdown[basic].oosCount++;
      }
    });

    return breakdown;
  },

  /**
   * Get human-readable BASIC name
   * @private
   * @param {string} basic - BASIC category key
   * @returns {string} Human-readable name
   */
  _getBasicName(basic) {
    const names = {
      unsafe_driving: 'Unsafe Driving',
      hours_of_service: 'Hours of Service',
      vehicle_maintenance: 'Vehicle Maintenance',
      controlled_substances: 'Controlled Substances/Alcohol',
      driver_fitness: 'Driver Fitness',
      crash_indicator: 'Crash Indicator',
      hazmat: 'Hazmat'
    };
    return names[basic] || basic;
  }
};

module.exports = vehicleOOSService;
