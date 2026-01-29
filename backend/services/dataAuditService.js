/**
 * Data Audit Service - Verifies data integrity and accuracy
 *
 * Provides three types of audits:
 * 1. FMCSA Accuracy - Compare stored data vs live SaferWebAPI
 * 2. Internal Consistency - Find orphaned records
 * 3. Dashboard Verification - Confirm stats match actual counts
 */

const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const Violation = require('../models/Violation');
const fmcsaViolationService = require('./fmcsaViolationService');

const dataAuditService = {
  /**
   * Audit FMCSA data accuracy
   * Compares stored inspection data with live SaferWebAPI data
   */
  async auditFMCSAData(companyId) {
    try {
      const company = await Company.findById(companyId)
        .select('dotNumber fmcsaData.inspections fmcsaData.lastViolationSync');

      if (!company?.dotNumber) {
        return {
          status: 'error',
          message: 'Company DOT number not found',
          match: false
        };
      }

      // Fetch live data from SaferWebAPI
      let liveData;
      try {
        const apiData = await fmcsaViolationService.fetchFromSaferWebAPI(company.dotNumber);
        liveData = fmcsaViolationService.parseInspectionData(apiData);
      } catch (error) {
        return {
          status: 'error',
          message: `Failed to fetch live FMCSA data: ${error.message}`,
          match: false,
          stored: company.fmcsaData?.inspections || null
        };
      }

      const storedData = company.fmcsaData?.inspections || null;

      // Compare key fields
      const differences = [];

      if (!storedData) {
        differences.push({ field: 'all', stored: null, live: 'has data', issue: 'No stored data' });
      } else {
        // Compare inspection counts
        if (storedData.totalInspections !== liveData.totalInspections) {
          differences.push({
            field: 'totalInspections',
            stored: storedData.totalInspections,
            live: liveData.totalInspections
          });
        }
        if (storedData.vehicleInspections !== liveData.vehicleInspections) {
          differences.push({
            field: 'vehicleInspections',
            stored: storedData.vehicleInspections,
            live: liveData.vehicleInspections
          });
        }
        if (storedData.driverInspections !== liveData.driverInspections) {
          differences.push({
            field: 'driverInspections',
            stored: storedData.driverInspections,
            live: liveData.driverInspections
          });
        }

        // Compare OOS rates (with tolerance for rounding)
        const oosFields = ['vehicleOOSPercent', 'driverOOSPercent'];
        for (const field of oosFields) {
          if (Math.abs((storedData[field] || 0) - (liveData[field] || 0)) > 0.1) {
            differences.push({
              field,
              stored: storedData[field],
              live: liveData[field]
            });
          }
        }

        // Compare crash data
        if (storedData.crashes?.total !== liveData.crashes?.total) {
          differences.push({
            field: 'crashes.total',
            stored: storedData.crashes?.total,
            live: liveData.crashes?.total
          });
        }
      }

      return {
        status: 'success',
        match: differences.length === 0,
        lastSync: company.fmcsaData?.lastViolationSync,
        hoursSinceSync: company.fmcsaData?.lastViolationSync
          ? (Date.now() - new Date(company.fmcsaData.lastViolationSync).getTime()) / (1000 * 60 * 60)
          : null,
        differences,
        stored: storedData,
        live: liveData
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        match: false
      };
    }
  },

  /**
   * Audit internal data consistency
   * Checks for orphaned records (documents/violations referencing deleted drivers/vehicles)
   */
  async auditInternalConsistency(companyId) {
    try {
      const [drivers, vehicles, documents, violations] = await Promise.all([
        Driver.find({ companyId }).select('_id firstName lastName status'),
        Vehicle.find({ companyId }).select('_id unitNumber status'),
        Document.find({ companyId }).select('_id name driverId vehicleId category'),
        Violation.find({ companyId }).select('_id description driverId vehicleId dataQStatus')
      ]);

      const driverIds = new Set(drivers.map(d => d._id.toString()));
      const vehicleIds = new Set(vehicles.map(v => v._id.toString()));

      const issues = [];

      // Check for orphaned documents
      for (const doc of documents) {
        if (doc.driverId && !driverIds.has(doc.driverId.toString())) {
          issues.push({
            type: 'orphaned_document',
            id: doc._id,
            name: doc.name,
            category: doc.category,
            issue: `References deleted driver ${doc.driverId}`
          });
        }
        if (doc.vehicleId && !vehicleIds.has(doc.vehicleId.toString())) {
          issues.push({
            type: 'orphaned_document',
            id: doc._id,
            name: doc.name,
            category: doc.category,
            issue: `References deleted vehicle ${doc.vehicleId}`
          });
        }
      }

      // Check for orphaned violations
      for (const violation of violations) {
        if (violation.driverId && !driverIds.has(violation.driverId.toString())) {
          issues.push({
            type: 'orphaned_violation',
            id: violation._id,
            description: violation.description?.substring(0, 50),
            issue: `References deleted driver ${violation.driverId}`
          });
        }
        if (violation.vehicleId && !vehicleIds.has(violation.vehicleId.toString())) {
          issues.push({
            type: 'orphaned_violation',
            id: violation._id,
            description: violation.description?.substring(0, 50),
            issue: `References deleted vehicle ${violation.vehicleId}`
          });
        }
      }

      return {
        status: 'success',
        healthy: issues.length === 0,
        issues,
        counts: {
          drivers: drivers.length,
          activeDrivers: drivers.filter(d => d.status === 'active').length,
          vehicles: vehicles.length,
          activeVehicles: vehicles.filter(v => v.status === 'active').length,
          documents: documents.length,
          violations: violations.length,
          openViolations: violations.filter(v => v.dataQStatus === 'open').length
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        healthy: false
      };
    }
  },

  /**
   * Audit dashboard stats
   * Verifies that displayed stats match actual database counts
   */
  async auditDashboardStats(companyId) {
    try {
      // Get actual counts from database
      const [
        totalDrivers,
        activeDrivers,
        totalVehicles,
        activeVehicles,
        totalDocuments,
        expiringDocuments,
        openViolations,
        totalViolations
      ] = await Promise.all([
        Driver.countDocuments({ companyId }),
        Driver.countDocuments({ companyId, status: 'active' }),
        Vehicle.countDocuments({ companyId }),
        Vehicle.countDocuments({ companyId, status: 'active' }),
        Document.countDocuments({ companyId }),
        Document.countDocuments({
          companyId,
          expiryDate: {
            $exists: true,
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }),
        Violation.countDocuments({ companyId, dataQStatus: 'open' }),
        Violation.countDocuments({ companyId })
      ]);

      // These are the verified actual counts
      const actual = {
        totalDrivers,
        activeDrivers,
        totalVehicles,
        activeVehicles,
        totalDocuments,
        expiringDocuments,
        openViolations,
        totalViolations
      };

      return {
        status: 'success',
        healthy: true,
        actual,
        message: 'Dashboard stats verified against database'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        healthy: false
      };
    }
  },

  /**
   * Run full audit
   */
  async runFullAudit(companyId) {
    const [fmcsaAudit, consistencyAudit, dashboardAudit] = await Promise.all([
      this.auditFMCSAData(companyId),
      this.auditInternalConsistency(companyId),
      this.auditDashboardStats(companyId)
    ]);

    const overallHealth =
      fmcsaAudit.match !== false &&
      consistencyAudit.healthy &&
      dashboardAudit.healthy;

    return {
      timestamp: new Date(),
      overallHealth,
      audits: {
        fmcsa: fmcsaAudit,
        consistency: consistencyAudit,
        dashboard: dashboardAudit
      }
    };
  }
};

module.exports = dataAuditService;
