const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const Violation = require('../models/Violation');
const Accident = require('../models/Accident');
const DrugAlcoholTest = require('../models/DrugAlcoholTest');
const Ticket = require('../models/Ticket');
const DamageClaim = require('../models/DamageClaim');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Company = require('../models/Company');
const User = require('../models/User');

/**
 * Data Integrity Service
 * Monitors data quality and identifies issues across all models
 */
const dataIntegrityService = {
  /**
   * Run a quick health check (lightweight, for dashboard card)
   */
  async runQuickCheck() {
    const startTime = Date.now();

    try {
      const [orphaned, missingFields, invalidRefs] = await Promise.all([
        this.checkOrphanedRecords(),
        this.checkMissingRequiredFields(),
        this.checkInvalidReferences()
      ]);

      const issues = {
        orphanedRecords: orphaned,
        missingFields: missingFields,
        invalidReferences: invalidRefs
      };

      const summary = this._calculateSummary(issues);
      const healthScore = this._calculateHealthScore(summary);

      return {
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        healthScore,
        summary,
        issues
      };
    } catch (error) {
      console.error('Data integrity quick check failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  },

  /**
   * Run comprehensive check (all checks, for detail page)
   */
  async runFullCheck() {
    const startTime = Date.now();

    try {
      const [orphaned, missingFields, invalidRefs, staleness, duplicates, futureDates] = await Promise.all([
        this.checkOrphanedRecords(),
        this.checkMissingRequiredFields(),
        this.checkInvalidReferences(),
        this.checkDataStaleness(),
        this.checkDuplicates(),
        this.checkFutureDates()
      ]);

      const issues = {
        orphanedRecords: orphaned,
        missingFields: missingFields,
        invalidReferences: invalidRefs,
        staleness: staleness,
        duplicates: duplicates,
        futureDates: futureDates
      };

      const summary = this._calculateSummary(issues);
      const healthScore = this._calculateHealthScore(summary);

      return {
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        healthScore,
        summary,
        issues,
        totalRecordsChecked: await this._getTotalRecordCount()
      };
    } catch (error) {
      console.error('Data integrity full check failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  },

  /**
   * Check for orphaned records (missing company reference)
   */
  async checkOrphanedRecords() {
    const results = {
      severity: 'critical',
      description: 'Records with missing or invalid company reference',
      total: 0,
      details: []
    };

    // Models that require companyId
    const modelsToCheck = [
      { model: Driver, name: 'Driver' },
      { model: Vehicle, name: 'Vehicle' },
      { model: Document, name: 'Document' },
      { model: Violation, name: 'Violation' },
      { model: Accident, name: 'Accident' },
      { model: DrugAlcoholTest, name: 'DrugAlcoholTest' },
      { model: Ticket, name: 'Ticket' },
      { model: DamageClaim, name: 'DamageClaim' },
      { model: MaintenanceRecord, name: 'MaintenanceRecord' }
    ];

    // Get all valid company IDs
    const validCompanyIds = await Company.distinct('_id');
    const validCompanyIdSet = new Set(validCompanyIds.map(id => id.toString()));

    for (const { model, name } of modelsToCheck) {
      try {
        // Find records with null companyId
        const nullCompanyCount = await model.countDocuments({ companyId: null });

        // Find records with companyId not in valid companies
        const allRecords = await model.find({ companyId: { $ne: null } }).select('companyId').lean();
        const invalidCompanyCount = allRecords.filter(
          r => r.companyId && !validCompanyIdSet.has(r.companyId.toString())
        ).length;

        const orphanCount = nullCompanyCount + invalidCompanyCount;

        if (orphanCount > 0) {
          results.details.push({
            resource: name,
            count: orphanCount,
            nullCompany: nullCompanyCount,
            invalidCompany: invalidCompanyCount
          });
          results.total += orphanCount;
        }
      } catch (err) {
        console.error(`Error checking orphaned ${name}:`, err.message);
      }
    }

    return results;
  },

  /**
   * Check for missing required fields
   */
  async checkMissingRequiredFields() {
    const results = {
      severity: 'warning',
      description: 'Active records missing critical fields',
      total: 0,
      details: []
    };

    // Drivers missing CDL
    const driversNoCDL = await Driver.countDocuments({
      status: 'active',
      $or: [
        { 'cdl.number': null },
        { 'cdl.number': '' },
        { 'cdl.number': { $exists: false } }
      ]
    });
    if (driversNoCDL > 0) {
      results.details.push({ resource: 'Driver', field: 'CDL Number', count: driversNoCDL });
      results.total += driversNoCDL;
    }

    // Drivers missing medical card
    const driversNoMedical = await Driver.countDocuments({
      status: 'active',
      $or: [
        { 'medicalCard.expiryDate': null },
        { 'medicalCard.expiryDate': { $exists: false } }
      ]
    });
    if (driversNoMedical > 0) {
      results.details.push({ resource: 'Driver', field: 'Medical Card Expiry', count: driversNoMedical });
      results.total += driversNoMedical;
    }

    // Vehicles missing VIN
    const vehiclesNoVIN = await Vehicle.countDocuments({
      status: { $in: ['active', 'maintenance'] },
      $or: [
        { vin: null },
        { vin: '' },
        { vin: { $exists: false } }
      ]
    });
    if (vehiclesNoVIN > 0) {
      results.details.push({ resource: 'Vehicle', field: 'VIN', count: vehiclesNoVIN });
      results.total += vehiclesNoVIN;
    }

    // Vehicles missing license plate
    const vehiclesNoPlate = await Vehicle.countDocuments({
      status: { $in: ['active', 'maintenance'] },
      type: { $ne: 'trailer' },
      $or: [
        { licensePlate: null },
        { licensePlate: '' },
        { licensePlate: { $exists: false } }
      ]
    });
    if (vehiclesNoPlate > 0) {
      results.details.push({ resource: 'Vehicle', field: 'License Plate', count: vehiclesNoPlate });
      results.total += vehiclesNoPlate;
    }

    // Documents missing file path
    const docsNoFile = await Document.countDocuments({
      $or: [
        { filePath: null },
        { filePath: '' },
        { filePath: { $exists: false } }
      ]
    });
    if (docsNoFile > 0) {
      results.details.push({ resource: 'Document', field: 'File Path', count: docsNoFile });
      results.total += docsNoFile;
    }

    // Violations missing basic category
    const violationsNoBasic = await Violation.countDocuments({
      $or: [
        { basic: null },
        { basic: '' },
        { basic: { $exists: false } }
      ]
    });
    if (violationsNoBasic > 0) {
      results.details.push({ resource: 'Violation', field: 'BASIC Category', count: violationsNoBasic });
      results.total += violationsNoBasic;
    }

    return results;
  },

  /**
   * Check for invalid references (broken foreign keys)
   */
  async checkInvalidReferences() {
    const results = {
      severity: 'critical',
      description: 'Records referencing non-existent related records',
      total: 0,
      details: []
    };

    // Get valid IDs for lookups
    const validDriverIds = new Set((await Driver.distinct('_id')).map(id => id.toString()));
    const validVehicleIds = new Set((await Vehicle.distinct('_id')).map(id => id.toString()));
    const validUserIds = new Set((await User.distinct('_id')).map(id => id.toString()));

    // Violations with invalid driverId
    const violationsWithDriver = await Violation.find({ driverId: { $ne: null } }).select('driverId').lean();
    const invalidViolationDrivers = violationsWithDriver.filter(
      v => v.driverId && !validDriverIds.has(v.driverId.toString())
    ).length;
    if (invalidViolationDrivers > 0) {
      results.details.push({ resource: 'Violation', reference: 'driverId', count: invalidViolationDrivers });
      results.total += invalidViolationDrivers;
    }

    // Documents with invalid driverId
    const docsWithDriver = await Document.find({ driverId: { $ne: null } }).select('driverId').lean();
    const invalidDocDrivers = docsWithDriver.filter(
      d => d.driverId && !validDriverIds.has(d.driverId.toString())
    ).length;
    if (invalidDocDrivers > 0) {
      results.details.push({ resource: 'Document', reference: 'driverId', count: invalidDocDrivers });
      results.total += invalidDocDrivers;
    }

    // Documents with invalid vehicleId
    const docsWithVehicle = await Document.find({ vehicleId: { $ne: null } }).select('vehicleId').lean();
    const invalidDocVehicles = docsWithVehicle.filter(
      d => d.vehicleId && !validVehicleIds.has(d.vehicleId.toString())
    ).length;
    if (invalidDocVehicles > 0) {
      results.details.push({ resource: 'Document', reference: 'vehicleId', count: invalidDocVehicles });
      results.total += invalidDocVehicles;
    }

    // MaintenanceRecords with invalid vehicleId
    const maintenanceWithVehicle = await MaintenanceRecord.find({ vehicleId: { $ne: null } }).select('vehicleId').lean();
    const invalidMaintenanceVehicles = maintenanceWithVehicle.filter(
      m => m.vehicleId && !validVehicleIds.has(m.vehicleId.toString())
    ).length;
    if (invalidMaintenanceVehicles > 0) {
      results.details.push({ resource: 'MaintenanceRecord', reference: 'vehicleId', count: invalidMaintenanceVehicles });
      results.total += invalidMaintenanceVehicles;
    }

    // DrugAlcoholTests with invalid driverId
    const testsWithDriver = await DrugAlcoholTest.find({ driverId: { $ne: null } }).select('driverId').lean();
    const invalidTestDrivers = testsWithDriver.filter(
      t => t.driverId && !validDriverIds.has(t.driverId.toString())
    ).length;
    if (invalidTestDrivers > 0) {
      results.details.push({ resource: 'DrugAlcoholTest', reference: 'driverId', count: invalidTestDrivers });
      results.total += invalidTestDrivers;
    }

    return results;
  },

  /**
   * Check for stale data (not updated recently)
   */
  async checkDataStaleness() {
    const results = {
      severity: 'info',
      description: 'Records with potential stale data',
      total: 0,
      details: []
    };

    const now = new Date();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);

    // Companies with no activity in 90+ days
    const staleCompanies = await Company.countDocuments({
      updatedAt: { $lt: ninetyDaysAgo }
    });
    if (staleCompanies > 0) {
      results.details.push({ resource: 'Company', threshold: '90 days', count: staleCompanies });
      results.total += staleCompanies;
    }

    // Active drivers not updated in 1 year
    const staleDrivers = await Driver.countDocuments({
      status: 'active',
      updatedAt: { $lt: oneYearAgo }
    });
    if (staleDrivers > 0) {
      results.details.push({ resource: 'Driver', threshold: '1 year', count: staleDrivers });
      results.total += staleDrivers;
    }

    // Active vehicles not updated in 1 year
    const staleVehicles = await Vehicle.countDocuments({
      status: { $in: ['active', 'maintenance'] },
      updatedAt: { $lt: oneYearAgo }
    });
    if (staleVehicles > 0) {
      results.details.push({ resource: 'Vehicle', threshold: '1 year', count: staleVehicles });
      results.total += staleVehicles;
    }

    return results;
  },

  /**
   * Check for potential duplicates
   */
  async checkDuplicates() {
    const results = {
      severity: 'warning',
      description: 'Potential duplicate records detected',
      total: 0,
      details: []
    };

    // Duplicate drivers (same first + last name + DOB within same company)
    const duplicateDrivers = await Driver.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      {
        $group: {
          _id: {
            companyId: '$companyId',
            firstName: { $toLower: '$firstName' },
            lastName: { $toLower: '$lastName' },
            dob: '$dateOfBirth'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicateDrivers.length > 0) {
      const totalDuplicateDrivers = duplicateDrivers.reduce((sum, d) => sum + d.count - 1, 0);
      results.details.push({
        resource: 'Driver',
        groups: duplicateDrivers.length,
        count: totalDuplicateDrivers,
        criteria: 'Same name + DOB'
      });
      results.total += totalDuplicateDrivers;
    }

    // Duplicate vehicles (same VIN)
    const duplicateVehicles = await Vehicle.aggregate([
      { $match: { vin: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: { vin: { $toLower: '$vin' } },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicateVehicles.length > 0) {
      const totalDuplicateVehicles = duplicateVehicles.reduce((sum, v) => sum + v.count - 1, 0);
      results.details.push({
        resource: 'Vehicle',
        groups: duplicateVehicles.length,
        count: totalDuplicateVehicles,
        criteria: 'Same VIN'
      });
      results.total += totalDuplicateVehicles;
    }

    return results;
  },

  /**
   * Check for invalid future dates
   */
  async checkFutureDates() {
    const results = {
      severity: 'warning',
      description: 'Records with suspicious future dates',
      total: 0,
      details: []
    };

    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Violations with future date
    const futureViolations = await Violation.countDocuments({
      violationDate: { $gt: now }
    });
    if (futureViolations > 0) {
      results.details.push({ resource: 'Violation', field: 'violationDate', count: futureViolations });
      results.total += futureViolations;
    }

    // Accidents with future date
    const futureAccidents = await Accident.countDocuments({
      accidentDate: { $gt: now }
    });
    if (futureAccidents > 0) {
      results.details.push({ resource: 'Accident', field: 'accidentDate', count: futureAccidents });
      results.total += futureAccidents;
    }

    // Drug tests with future date
    const futureTests = await DrugAlcoholTest.countDocuments({
      testDate: { $gt: now }
    });
    if (futureTests > 0) {
      results.details.push({ resource: 'DrugAlcoholTest', field: 'testDate', count: futureTests });
      results.total += futureTests;
    }

    // CDL expiry dates too far in future (>10 years)
    const tenYearsFromNow = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
    const suspiciousCDL = await Driver.countDocuments({
      'cdl.expiryDate': { $gt: tenYearsFromNow }
    });
    if (suspiciousCDL > 0) {
      results.details.push({ resource: 'Driver', field: 'CDL expiry (>10 years)', count: suspiciousCDL });
      results.total += suspiciousCDL;
    }

    return results;
  },

  /**
   * Get details for a specific resource type
   */
  async getResourceDetails(resource) {
    const details = {
      resource,
      timestamp: new Date(),
      issues: []
    };

    const Model = this._getModelByName(resource);
    if (!Model) {
      return { success: false, error: `Unknown resource: ${resource}` };
    }

    // Get sample of problematic records
    const validCompanyIds = new Set((await Company.distinct('_id')).map(id => id.toString()));

    // Orphaned records
    const orphaned = await Model.find({ companyId: null })
      .limit(20)
      .select('_id companyId createdAt')
      .lean();

    if (orphaned.length > 0) {
      details.issues.push({
        type: 'orphaned',
        severity: 'critical',
        records: orphaned.map(r => ({ id: r._id, createdAt: r.createdAt }))
      });
    }

    // Records with invalid company reference
    const allRecords = await Model.find({ companyId: { $ne: null } })
      .limit(1000)
      .select('_id companyId createdAt')
      .lean();

    const invalidCompanyRecords = allRecords
      .filter(r => r.companyId && !validCompanyIds.has(r.companyId.toString()))
      .slice(0, 20);

    if (invalidCompanyRecords.length > 0) {
      details.issues.push({
        type: 'invalidCompanyRef',
        severity: 'critical',
        records: invalidCompanyRecords.map(r => ({
          id: r._id,
          companyId: r.companyId,
          createdAt: r.createdAt
        }))
      });
    }

    return { success: true, details };
  },

  // Helper methods
  _getModelByName(name) {
    const models = {
      Driver, Vehicle, Document, Violation, Accident,
      DrugAlcoholTest, Ticket, DamageClaim, MaintenanceRecord,
      Company, User
    };
    return models[name];
  },

  _calculateSummary(issues) {
    const summary = { critical: 0, warning: 0, info: 0, total: 0 };

    for (const [, check] of Object.entries(issues)) {
      if (check.total > 0) {
        summary[check.severity] += check.total;
        summary.total += check.total;
      }
    }

    return summary;
  },

  _calculateHealthScore(summary) {
    // Start at 100, deduct points for issues
    let score = 100;

    // Critical issues: -5 points each (max -50)
    score -= Math.min(summary.critical * 5, 50);

    // Warnings: -2 points each (max -30)
    score -= Math.min(summary.warning * 2, 30);

    // Info: -0.5 points each (max -10)
    score -= Math.min(summary.info * 0.5, 10);

    return Math.max(0, Math.round(score));
  },

  async _getTotalRecordCount() {
    const counts = await Promise.all([
      Driver.countDocuments(),
      Vehicle.countDocuments(),
      Document.countDocuments(),
      Violation.countDocuments(),
      Accident.countDocuments(),
      DrugAlcoholTest.countDocuments(),
      Ticket.countDocuments(),
      DamageClaim.countDocuments(),
      MaintenanceRecord.countDocuments()
    ]);
    return counts.reduce((a, b) => a + b, 0);
  },

  // ============================================================
  // CLEANUP METHODS
  // ============================================================

  /**
   * Delete orphaned records for a specific model
   * Returns count of deleted records
   */
  async deleteOrphanedRecords(resourceName) {
    const Model = this._getModelByName(resourceName);
    if (!Model) {
      return { success: false, error: `Unknown resource: ${resourceName}` };
    }

    // Get all valid company IDs
    const validCompanyIds = await Company.distinct('_id');
    const validCompanyIdSet = new Set(validCompanyIds.map(id => id.toString()));

    let deletedCount = 0;

    // Delete records with null companyId
    const nullResult = await Model.deleteMany({ companyId: null });
    deletedCount += nullResult.deletedCount;

    // Find and delete records with invalid companyId
    const allRecords = await Model.find({ companyId: { $ne: null } }).select('_id companyId').lean();
    const invalidIds = allRecords
      .filter(r => r.companyId && !validCompanyIdSet.has(r.companyId.toString()))
      .map(r => r._id);

    if (invalidIds.length > 0) {
      const invalidResult = await Model.deleteMany({ _id: { $in: invalidIds } });
      deletedCount += invalidResult.deletedCount;
    }

    return {
      success: true,
      resource: resourceName,
      deletedCount
    };
  },

  /**
   * Delete all orphaned records across all models
   */
  async deleteAllOrphanedRecords() {
    const modelsToClean = ['Driver', 'Vehicle', 'Document', 'Violation', 'Accident',
                          'DrugAlcoholTest', 'Ticket', 'DamageClaim', 'MaintenanceRecord'];

    const results = [];
    let totalDeleted = 0;

    for (const modelName of modelsToClean) {
      const result = await this.deleteOrphanedRecords(modelName);
      if (result.success) {
        results.push({ resource: modelName, deleted: result.deletedCount });
        totalDeleted += result.deletedCount;
      }
    }

    return {
      success: true,
      totalDeleted,
      details: results
    };
  },

  /**
   * Delete records with invalid references for a specific model and reference field
   */
  async deleteInvalidReferences(resourceName, referenceField) {
    const Model = this._getModelByName(resourceName);
    if (!Model) {
      return { success: false, error: `Unknown resource: ${resourceName}` };
    }

    // Determine which IDs are valid based on the reference field
    let validIdSet;
    if (referenceField === 'driverId') {
      const validIds = await Driver.distinct('_id');
      validIdSet = new Set(validIds.map(id => id.toString()));
    } else if (referenceField === 'vehicleId') {
      const validIds = await Vehicle.distinct('_id');
      validIdSet = new Set(validIds.map(id => id.toString()));
    } else if (referenceField === 'userId') {
      const validIds = await User.distinct('_id');
      validIdSet = new Set(validIds.map(id => id.toString()));
    } else {
      return { success: false, error: `Unknown reference field: ${referenceField}` };
    }

    // Find records with invalid references
    const query = { [referenceField]: { $ne: null } };
    const allRecords = await Model.find(query).select(`_id ${referenceField}`).lean();
    const invalidIds = allRecords
      .filter(r => r[referenceField] && !validIdSet.has(r[referenceField].toString()))
      .map(r => r._id);

    let deletedCount = 0;
    if (invalidIds.length > 0) {
      const result = await Model.deleteMany({ _id: { $in: invalidIds } });
      deletedCount = result.deletedCount;
    }

    return {
      success: true,
      resource: resourceName,
      referenceField,
      deletedCount
    };
  }
};

module.exports = dataIntegrityService;
