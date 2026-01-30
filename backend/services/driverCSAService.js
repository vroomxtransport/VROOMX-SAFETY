const Violation = require('../models/Violation');
const Driver = require('../models/Driver');
const { TIME_WEIGHT_FACTORS, SMS_BASICS_THRESHOLDS } = require('../config/fmcsaCompliance');

/**
 * Driver CSA Service
 * Handles violation-to-driver linking and CSA impact calculations
 */
const driverCSAService = {
  /**
   * Link a violation to a driver
   * @param {string} violationId - Violation ID
   * @param {string} driverId - Driver ID to link
   * @param {string} userId - User performing the action
   * @param {string} companyId - Company ID for tenant isolation
   * @returns {Object} Updated violation
   */
  async linkViolationToDriver(violationId, driverId, userId, companyId) {
    // Verify driver belongs to the company
    const driver = await Driver.findOne({ _id: driverId, companyId });
    if (!driver) {
      throw new Error('Driver not found or does not belong to your company');
    }

    // Find and update the violation
    const violation = await Violation.findOneAndUpdate(
      { _id: violationId, companyId },
      {
        driverId,
        $push: {
          history: {
            action: 'driver_linked',
            date: new Date(),
            userId,
            notes: `Linked to driver: ${driver.firstName} ${driver.lastName}`
          }
        }
      },
      { new: true }
    ).populate('driverId', 'firstName lastName employeeId');

    if (!violation) {
      throw new Error('Violation not found');
    }

    return violation;
  },

  /**
   * Unlink a driver from a violation
   * @param {string} violationId - Violation ID
   * @param {string} userId - User performing the action
   * @param {string} companyId - Company ID for tenant isolation
   * @returns {Object} Updated violation
   */
  async unlinkViolation(violationId, userId, companyId) {
    const violation = await Violation.findOne({ _id: violationId, companyId })
      .populate('driverId', 'firstName lastName');

    if (!violation) {
      throw new Error('Violation not found');
    }

    const previousDriver = violation.driverId;
    const previousDriverName = previousDriver
      ? `${previousDriver.firstName} ${previousDriver.lastName}`
      : 'Unknown';

    violation.driverId = null;
    violation.history.push({
      action: 'driver_unlinked',
      date: new Date(),
      userId,
      notes: `Unlinked from driver: ${previousDriverName}`
    });

    await violation.save();
    return violation;
  },

  /**
   * Bulk link multiple violations to a driver
   * @param {string[]} violationIds - Array of violation IDs
   * @param {string} driverId - Driver ID to link
   * @param {string} userId - User performing the action
   * @param {string} companyId - Company ID for tenant isolation
   * @returns {Object} Result with success/failure counts
   */
  async bulkLinkViolations(violationIds, driverId, userId, companyId) {
    // Verify driver belongs to the company
    const driver = await Driver.findOne({ _id: driverId, companyId });
    if (!driver) {
      throw new Error('Driver not found or does not belong to your company');
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const violationId of violationIds) {
      try {
        await Violation.findOneAndUpdate(
          { _id: violationId, companyId },
          {
            driverId,
            $push: {
              history: {
                action: 'driver_linked',
                date: new Date(),
                userId,
                notes: `Bulk linked to driver: ${driver.firstName} ${driver.lastName}`
              }
            }
          }
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ violationId, error: error.message });
      }
    }

    return results;
  },

  /**
   * Get violations linked to a specific driver
   * @param {string} driverId - Driver ID
   * @param {string} companyId - Company ID for tenant isolation
   * @param {Object} filters - Optional filters (page, limit, basic, status)
   * @returns {Object} Paginated violations with total count
   */
  async getDriverViolations(driverId, companyId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      basic,
      status,
      sortBy = 'violationDate',
      sortOrder = 'desc'
    } = filters;

    const query = { driverId, companyId };

    if (basic) query.basic = basic;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [violations, total] = await Promise.all([
      Violation.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('vehicleId', 'unitNumber')
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
   * Calculate CSA impact for a specific driver
   * @param {string} driverId - Driver ID
   * @param {string} companyId - Company ID for tenant isolation
   * @returns {Object} CSA impact with risk score, BASIC breakdown, and violations
   */
  async getDriverCSAImpact(driverId, companyId) {
    // Verify driver exists and belongs to company
    const driver = await Driver.findOne({ _id: driverId, companyId })
      .select('firstName lastName employeeId status')
      .lean();

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Get all violations for this driver (last 24 months)
    const twoYearsAgo = new Date();
    twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 24);

    const violations = await Violation.find({
      driverId,
      companyId,
      violationDate: { $gte: twoYearsAgo }
    }).lean();

    // Calculate points per BASIC category
    const basicBreakdown = this._calculateBasicBreakdown(violations);

    // Calculate total weighted points
    const totalPoints = Object.values(basicBreakdown).reduce(
      (sum, cat) => sum + cat.weightedPoints,
      0
    );

    // Determine risk level
    const riskLevel = this._determineRiskLevel(totalPoints, violations.length);

    return {
      driver: {
        _id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        fullName: `${driver.firstName} ${driver.lastName}`,
        employeeId: driver.employeeId,
        status: driver.status
      },
      totalPoints,
      totalViolations: violations.length,
      oosViolations: violations.filter(v => v.outOfService).length,
      riskLevel,
      basicBreakdown,
      recentViolations: violations
        .sort((a, b) => new Date(b.violationDate) - new Date(a.violationDate))
        .slice(0, 5)
        .map(v => ({
          _id: v._id,
          date: v.violationDate,
          basic: v.basic,
          description: v.description,
          severityWeight: v.severityWeight,
          weightedSeverity: v.weightedSeverity,
          outOfService: v.outOfService,
          status: v.status
        }))
    };
  },

  /**
   * Get top risk drivers for a company
   * @param {string} companyId - Company ID for tenant isolation
   * @param {number} limit - Number of drivers to return
   * @returns {Object[]} Array of drivers with risk scores
   */
  async getTopRiskDrivers(companyId, limit = 5) {
    // Get all violations from last 24 months with drivers
    const twoYearsAgo = new Date();
    twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 24);

    const driverViolationStats = await Violation.aggregate([
      {
        $match: {
          companyId: require('mongoose').Types.ObjectId.createFromHexString(companyId),
          driverId: { $ne: null },
          violationDate: { $gte: twoYearsAgo }
        }
      },
      {
        $group: {
          _id: '$driverId',
          totalViolations: { $sum: 1 },
          totalPoints: { $sum: '$severityWeight' },
          totalWeightedPoints: { $sum: '$weightedSeverity' },
          oosCount: { $sum: { $cond: ['$outOfService', 1, 0] } },
          basics: { $addToSet: '$basic' }
        }
      },
      {
        $sort: { totalWeightedPoints: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driver'
        }
      },
      {
        $unwind: '$driver'
      },
      {
        $project: {
          _id: '$driver._id',
          firstName: '$driver.firstName',
          lastName: '$driver.lastName',
          employeeId: '$driver.employeeId',
          status: '$driver.status',
          totalViolations: 1,
          totalPoints: 1,
          totalWeightedPoints: 1,
          oosCount: 1,
          basicsAffected: { $size: '$basics' }
        }
      }
    ]);

    // Calculate risk level for each driver
    return driverViolationStats.map(driver => ({
      ...driver,
      fullName: `${driver.firstName} ${driver.lastName}`,
      riskLevel: this._determineRiskLevel(driver.totalWeightedPoints, driver.totalViolations)
    }));
  },

  /**
   * Get violations without a linked driver
   * @param {string} companyId - Company ID for tenant isolation
   * @param {Object} filters - Optional filters (page, limit, basic)
   * @returns {Object} Paginated unassigned violations
   */
  async getUnassignedViolations(companyId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      basic,
      sortBy = 'violationDate',
      sortOrder = 'desc'
    } = filters;

    const query = { companyId, driverId: null };

    if (basic) query.basic = basic;

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [violations, total] = await Promise.all([
      Violation.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('vehicleId', 'unitNumber')
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
   * Calculate BASIC category breakdown with time-weighted points
   * @private
   */
  _calculateBasicBreakdown(violations) {
    const now = new Date();
    const breakdown = {};

    // Initialize all BASIC categories
    const basicCategories = [
      'unsafe_driving',
      'hours_of_service',
      'vehicle_maintenance',
      'controlled_substances',
      'driver_fitness',
      'crash_indicator'
    ];

    basicCategories.forEach(basic => {
      breakdown[basic] = {
        name: this._getBasicName(basic),
        count: 0,
        totalPoints: 0,
        weightedPoints: 0,
        oosCount: 0
      };
    });

    // Calculate points for each violation
    violations.forEach(violation => {
      const basic = violation.basic;
      if (!breakdown[basic]) return;

      // Calculate time weight
      const violationDate = new Date(violation.violationDate);
      const yearsAgo = Math.floor((now - violationDate) / (365.25 * 24 * 60 * 60 * 1000));
      const timeWeight = TIME_WEIGHT_FACTORS[yearsAgo] || 0;

      breakdown[basic].count++;
      breakdown[basic].totalPoints += violation.severityWeight || 0;
      breakdown[basic].weightedPoints += (violation.severityWeight || 0) * timeWeight;

      if (violation.outOfService) {
        breakdown[basic].oosCount++;
      }
    });

    return breakdown;
  },

  /**
   * Determine risk level based on points and violation count
   * @private
   */
  _determineRiskLevel(totalWeightedPoints, violationCount) {
    // High risk: 30+ weighted points OR 5+ violations
    if (totalWeightedPoints >= 30 || violationCount >= 5) {
      return 'High';
    }
    // Medium risk: 15-29 weighted points OR 2-4 violations
    if (totalWeightedPoints >= 15 || violationCount >= 2) {
      return 'Medium';
    }
    // Low risk: < 15 points AND < 2 violations
    return 'Low';
  },

  /**
   * Get human-readable BASIC name
   * @private
   */
  _getBasicName(basic) {
    const names = {
      unsafe_driving: 'Unsafe Driving',
      hours_of_service: 'Hours of Service',
      vehicle_maintenance: 'Vehicle Maintenance',
      controlled_substances: 'Controlled Substances/Alcohol',
      driver_fitness: 'Driver Fitness',
      crash_indicator: 'Crash Indicator'
    };
    return names[basic] || basic;
  }
};

module.exports = driverCSAService;
