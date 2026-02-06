const Alert = require('../models/Alert');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const Violation = require('../models/Violation');
const Company = require('../models/Company');
const Task = require('../models/Task');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const { SMS_BASICS_THRESHOLDS } = require('../config/fmcsaCompliance');

/**
 * Alert Service - Manages alert creation, escalation, and resolution
 */
const alertService = {
  /**
   * Create or update an alert
   */
  async createAlert(alertData) {
    const { alert, created } = await Alert.findOrCreateAlert(alertData);
    return { alert, created };
  },

  /**
   * Dismiss an alert with audit trail
   */
  async dismissAlert(alertId, userId, reason) {
    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    return alert.dismiss(userId, reason);
  },

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId, userId, notes) {
    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;
    alert.resolutionNotes = notes;
    await alert.save();

    return alert;
  },

  /**
   * Get alerts for a company with filtering
   */
  async getAlerts(companyId, options = {}) {
    const {
      type,
      category,
      status = 'active',
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = -1
    } = options;

    const query = { companyId };

    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ type: 1, [sortBy]: sortOrder }) // Critical first
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('entityId')
        .populate('dismissedBy', 'firstName lastName')
        .lean(),
      Alert.countDocuments(query)
    ]);

    // Group by type
    const grouped = {
      critical: alerts.filter(a => a.type === 'critical'),
      warning: alerts.filter(a => a.type === 'warning'),
      info: alerts.filter(a => a.type === 'info')
    };

    return {
      alerts,
      grouped,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  },

  /**
   * Get alert counts by type
   */
  async getAlertCounts(companyId) {
    const counts = await Alert.aggregate([
      { $match: { companyId: companyId, status: 'active' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    return {
      critical: counts.find(c => c._id === 'critical')?.count || 0,
      warning: counts.find(c => c._id === 'warning')?.count || 0,
      info: counts.find(c => c._id === 'info')?.count || 0,
      total: counts.reduce((sum, c) => sum + c.count, 0)
    };
  },

  /**
   * Get dismissed alerts (audit trail)
   */
  async getDismissedAlerts(companyId, limit = 100) {
    return Alert.find({
      companyId,
      status: 'dismissed'
    })
      .sort('-dismissedAt')
      .limit(limit)
      .populate('dismissedBy', 'firstName lastName')
      .lean();
  },

  /**
   * Generate alerts for a company based on current data
   * This replaces the inline alert generation in dashboard.js
   */
  async generateAlerts(companyId) {
    const company = await Company.findById(companyId);
    if (!company) throw new Error('Company not found');

    const alertPromises = [];

    // 1. Driver document alerts
    const drivers = await Driver.find({
      companyId,
      status: 'active',
      isDeleted: { $ne: true }
    });

    for (const driver of drivers) {
      const driverName = `${driver.firstName} ${driver.lastName}`;

      // CDL expiration
      if (driver.cdl?.expiryDate) {
        const daysRemaining = this._getDaysRemaining(driver.cdl.expiryDate);

        if (daysRemaining < 0) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'critical',
            category: 'driver',
            title: 'CDL Expired',
            message: `${driverName}'s CDL expired ${Math.abs(daysRemaining)} days ago`,
            entityType: 'driver',
            entityId: driver._id,
            daysRemaining,
            deduplicationKey: `driver-cdl-expired-${driver._id}`
          }));
        } else if (daysRemaining <= 30) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'warning',
            category: 'driver',
            title: 'CDL Expiring Soon',
            message: `${driverName}'s CDL expires in ${daysRemaining} days`,
            entityType: 'driver',
            entityId: driver._id,
            daysRemaining,
            deduplicationKey: `driver-cdl-expiring-${driver._id}`
          }));
        }
      }

      // Medical card expiration
      if (driver.medicalCard?.expiryDate) {
        const daysRemaining = this._getDaysRemaining(driver.medicalCard.expiryDate);

        if (daysRemaining < 0) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'critical',
            category: 'driver',
            title: 'Medical Card Expired',
            message: `${driverName}'s medical card expired ${Math.abs(daysRemaining)} days ago`,
            entityType: 'driver',
            entityId: driver._id,
            daysRemaining,
            deduplicationKey: `driver-medical-expired-${driver._id}`
          }));
        } else if (daysRemaining <= 30) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'warning',
            category: 'driver',
            title: 'Medical Card Expiring Soon',
            message: `${driverName}'s medical card expires in ${daysRemaining} days`,
            entityType: 'driver',
            entityId: driver._id,
            daysRemaining,
            deduplicationKey: `driver-medical-expiring-${driver._id}`
          }));
        }
      }

      // Clearinghouse query overdue
      if (driver.clearinghouse?.lastQueryDate) {
        const daysSinceQuery = this._getDaysSince(driver.clearinghouse.lastQueryDate);
        if (daysSinceQuery > 365) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'critical',
            category: 'driver',
            title: 'Clearinghouse Query Overdue',
            message: `${driverName}'s annual clearinghouse query is ${daysSinceQuery - 365} days overdue`,
            entityType: 'driver',
            entityId: driver._id,
            daysRemaining: -(daysSinceQuery - 365),
            deduplicationKey: `driver-clearinghouse-overdue-${driver._id}`
          }));
        } else if (daysSinceQuery > 335) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'warning',
            category: 'driver',
            title: 'Clearinghouse Query Due Soon',
            message: `${driverName}'s annual clearinghouse query due in ${365 - daysSinceQuery} days`,
            entityType: 'driver',
            entityId: driver._id,
            daysRemaining: 365 - daysSinceQuery,
            deduplicationKey: `driver-clearinghouse-due-${driver._id}`
          }));
        }
      }
    }

    // 2. Vehicle inspection alerts
    const vehicles = await Vehicle.find({
      companyId,
      status: 'active',
      isDeleted: { $ne: true }
    });

    for (const vehicle of vehicles) {
      const vehicleName = vehicle.unitNumber || vehicle.vin;

      if (vehicle.annualInspection?.nextDueDate) {
        const daysRemaining = this._getDaysRemaining(vehicle.annualInspection.nextDueDate);

        if (daysRemaining < 0) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'critical',
            category: 'vehicle',
            title: 'Annual Inspection Overdue',
            message: `${vehicleName}'s annual inspection is ${Math.abs(daysRemaining)} days overdue`,
            entityType: 'vehicle',
            entityId: vehicle._id,
            daysRemaining,
            deduplicationKey: `vehicle-inspection-overdue-${vehicle._id}`
          }));
        } else if (daysRemaining <= 30) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'warning',
            category: 'vehicle',
            title: 'Annual Inspection Due Soon',
            message: `${vehicleName}'s annual inspection due in ${daysRemaining} days`,
            entityType: 'vehicle',
            entityId: vehicle._id,
            daysRemaining,
            deduplicationKey: `vehicle-inspection-due-${vehicle._id}`
          }));
        }
      }
    }

    // 3. DataQ challenge alerts
    const pendingDataQ = await Violation.countDocuments({
      companyId,
      'dataQChallenge.status': { $in: ['pending', 'under_review'] },
      isDeleted: { $ne: true }
    });

    if (pendingDataQ > 0) {
      alertPromises.push(this.createAlert({
        companyId,
        type: 'info',
        category: 'violation',
        title: 'DataQ Challenges Pending',
        message: `${pendingDataQ} DataQ challenge(s) awaiting response`,
        entityType: 'company',
        entityId: companyId,
        metadata: { count: pendingDataQ },
        deduplicationKey: `dataq-pending-${companyId}`
      }));
    }

    // 4. Out-of-service violations
    const oosViolations = await Violation.find({
      companyId,
      outOfService: true,
      status: 'open',
      isDeleted: { $ne: true }
    });

    for (const violation of oosViolations) {
      const daysSince = this._getDaysSince(violation.violationDate);

      alertPromises.push(this.createAlert({
        companyId,
        type: 'critical',
        category: 'violation',
        title: 'Out-of-Service Violation',
        message: `OOS violation (${violation.violationCode}) unresolved for ${daysSince} days`,
        entityType: 'violation',
        entityId: violation._id,
        metadata: {
          code: violation.violationCode,
          daysSince
        },
        deduplicationKey: `oos-violation-${violation._id}`
      }));
    }

    // 5. SMS BASIC threshold alerts
    if (company.smsBasics) {
      const basicKeys = ['unsafeDriving', 'hoursOfService', 'vehicleMaintenance',
                         'controlledSubstances', 'driverFitness', 'crashIndicator'];

      for (const key of basicKeys) {
        const percentile = company.smsBasics[key];
        if (percentile === null || percentile === undefined) continue;

        const threshold = SMS_BASICS_THRESHOLDS[key];
        if (!threshold) continue;

        if (percentile >= threshold.criticalThreshold) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'critical',
            category: 'basics',
            title: `${threshold.name} at Critical Level`,
            message: `${threshold.name} BASIC at ${percentile}% (critical threshold: ${threshold.criticalThreshold}%)`,
            entityType: 'company',
            entityId: companyId,
            metadata: {
              basic: key,
              percentile,
              threshold: threshold.criticalThreshold
            },
            deduplicationKey: `basic-critical-${key}-${companyId}`
          }));
        } else if (percentile >= threshold.threshold) {
          alertPromises.push(this.createAlert({
            companyId,
            type: 'warning',
            category: 'basics',
            title: `${threshold.name} Above Threshold`,
            message: `${threshold.name} BASIC at ${percentile}% (warning threshold: ${threshold.threshold}%)`,
            entityType: 'company',
            entityId: companyId,
            metadata: {
              basic: key,
              percentile,
              threshold: threshold.threshold
            },
            deduplicationKey: `basic-warning-${key}-${companyId}`
          }));
        }
      }
    }

    // 6. Document expiration alerts
    const expiringDocs = await Document.find({
      companyId,
      expiryDate: { $exists: true, $ne: null },
      status: { $ne: 'expired' },
      isDeleted: { $ne: true }
    });

    for (const doc of expiringDocs) {
      const daysRemaining = this._getDaysRemaining(doc.expiryDate);

      if (daysRemaining < 0) {
        alertPromises.push(this.createAlert({
          companyId,
          type: 'critical',
          category: 'document',
          title: 'Document Expired',
          message: `${doc.name} expired ${Math.abs(daysRemaining)} days ago`,
          entityType: 'document',
          entityId: doc._id,
          daysRemaining,
          deduplicationKey: `document-expired-${doc._id}`
        }));
      } else if (daysRemaining <= 30) {
        alertPromises.push(this.createAlert({
          companyId,
          type: 'warning',
          category: 'document',
          title: 'Document Expiring Soon',
          message: `${doc.name} expires in ${daysRemaining} days`,
          entityType: 'document',
          entityId: doc._id,
          daysRemaining,
          deduplicationKey: `document-expiring-${doc._id}`
        }));
      }
    }

    // 7. Task overdue alerts
    const overdueTasks = await Task.find({
      companyId,
      status: { $in: ['not_started', 'in_progress', 'overdue'] },
      dueDate: { $lt: new Date() }
    });

    for (const task of overdueTasks) {
      const daysOverdue = this._getDaysSince(task.dueDate);

      alertPromises.push(this.createAlert({
        companyId,
        type: daysOverdue >= 7 || task.priority === 'high' ? 'critical' : 'warning',
        category: 'driver', // Tasks often relate to driver compliance
        title: 'Task Overdue',
        message: `"${task.title}" is ${daysOverdue} day(s) overdue`,
        entityType: 'task',
        entityId: task._id,
        daysRemaining: -daysOverdue,
        metadata: {
          priority: task.priority,
          assignedToName: task.assignedToName,
          linkedTo: task.linkedTo
        },
        deduplicationKey: `task-overdue-${task._id}`
      }));
    }

    // Tasks due soon (within 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const tasksDueSoon = await Task.find({
      companyId,
      status: { $in: ['not_started', 'in_progress'] },
      dueDate: { $gte: new Date(), $lte: threeDaysFromNow }
    });

    for (const task of tasksDueSoon) {
      const daysRemaining = this._getDaysRemaining(task.dueDate);

      alertPromises.push(this.createAlert({
        companyId,
        type: task.priority === 'high' ? 'warning' : 'info',
        category: 'driver',
        title: 'Task Due Soon',
        message: `"${task.title}" due in ${daysRemaining} day(s)`,
        entityType: 'task',
        entityId: task._id,
        daysRemaining,
        metadata: {
          priority: task.priority,
          assignedToName: task.assignedToName
        },
        deduplicationKey: `task-due-soon-${task._id}`
      }));
    }

    // 8. Maintenance due alerts
    const maintenanceRecords = await MaintenanceRecord.find({
      companyId,
      nextServiceDate: { $exists: true, $ne: null },
      status: 'completed'
    }).populate('vehicleId', 'unitNumber');

    for (const record of maintenanceRecords) {
      if (!record.vehicleId) continue;

      const vehicleName = record.vehicleId.unitNumber || 'Unknown Vehicle';
      const daysRemaining = this._getDaysRemaining(record.nextServiceDate);

      if (daysRemaining < 0) {
        alertPromises.push(this.createAlert({
          companyId,
          type: 'critical',
          category: 'vehicle',
          title: 'Maintenance Overdue',
          message: `${vehicleName} - ${record.recordType.replace(/_/g, ' ')} is ${Math.abs(daysRemaining)} days overdue`,
          entityType: 'maintenance',
          entityId: record._id,
          daysRemaining,
          metadata: {
            vehicleId: record.vehicleId._id,
            recordType: record.recordType
          },
          deduplicationKey: `maintenance-overdue-${record._id}`
        }));
      } else if (daysRemaining <= 7) {
        alertPromises.push(this.createAlert({
          companyId,
          type: 'warning',
          category: 'vehicle',
          title: 'Maintenance Due Soon',
          message: `${vehicleName} - ${record.recordType.replace(/_/g, ' ')} due in ${daysRemaining} days`,
          entityType: 'maintenance',
          entityId: record._id,
          daysRemaining,
          metadata: {
            vehicleId: record.vehicleId._id,
            recordType: record.recordType
          },
          deduplicationKey: `maintenance-due-${record._id}`
        }));
      }
    }

    // Auto-resolve alerts where conditions no longer exist
    const autoResolved = await this.autoResolveAlerts(companyId);

    // Execute all alert creations
    const results = await Promise.all(alertPromises);

    return {
      total: results.length,
      created: results.filter(r => r.created).length,
      updated: results.filter(r => !r.created).length,
      autoResolved
    };
  },

  /**
   * Escalate alerts that have been unresolved for too long
   * Called by cron job
   */
  async escalateAlerts() {
    const escalationRules = [
      // OOS violations unresolved > 24 hours
      {
        query: {
          category: 'violation',
          'metadata.daysSince': { $gte: 1 },
          status: 'active',
          escalationLevel: { $lt: 3 }
        },
        condition: (alert) => alert.metadata?.daysSince >= 1
      },
      // Expired CDL > 7 days
      {
        query: {
          title: 'CDL Expired',
          status: 'active',
          escalationLevel: { $lt: 3 }
        },
        condition: (alert) => Math.abs(alert.daysRemaining) >= 7
      },
      // Any critical alert > 3 days old
      {
        query: {
          type: 'critical',
          status: 'active',
          escalationLevel: { $lt: 3 },
          createdAt: { $lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        },
        condition: () => true
      }
    ];

    let totalEscalated = 0;

    for (const rule of escalationRules) {
      const alerts = await Alert.find(rule.query);

      for (const alert of alerts) {
        if (rule.condition(alert)) {
          await alert.escalate();
          totalEscalated++;
        }
      }
    }

    return totalEscalated;
  },

  /**
   * Auto-resolve alerts when conditions are met
   */
  async autoResolveAlerts(companyId) {
    let resolvedCount = 0;

    // Auto-resolve CDL/Medical alerts where the document is now valid
    const driverAlerts = await Alert.find({
      companyId,
      status: 'active',
      category: 'driver',
      entityType: 'driver',
      title: { $in: ['CDL Expired', 'CDL Expiring Soon', 'Medical Card Expired', 'Medical Card Expiring Soon'] }
    });

    for (const alert of driverAlerts) {
      const driver = await Driver.findById(alert.entityId);
      if (!driver || driver.status !== 'active') {
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.resolutionNotes = 'Auto-resolved: driver no longer active';
        await alert.save();
        resolvedCount++;
        continue;
      }

      const isCdlAlert = alert.title.includes('CDL');
      const expiryDate = isCdlAlert ? driver.cdl?.expiryDate : driver.medicalCard?.expiryDate;
      if (expiryDate) {
        const daysRemaining = this._getDaysRemaining(expiryDate);
        const isExpiredAlert = alert.title.includes('Expired');
        // Resolve if the document is now valid (>30 days out for "expiring soon", >0 for "expired")
        if ((isExpiredAlert && daysRemaining > 0) || (!isExpiredAlert && daysRemaining > 30)) {
          alert.status = 'resolved';
          alert.resolvedAt = new Date();
          alert.resolutionNotes = 'Auto-resolved: document renewed';
          await alert.save();
          resolvedCount++;
        }
      }
    }

    // Auto-resolve vehicle inspection alerts where inspection is now current
    const vehicleAlerts = await Alert.find({
      companyId,
      status: 'active',
      category: 'vehicle',
      entityType: 'vehicle',
      title: { $in: ['Annual Inspection Overdue', 'Annual Inspection Due Soon'] }
    });

    for (const alert of vehicleAlerts) {
      const vehicle = await Vehicle.findById(alert.entityId);
      if (!vehicle || vehicle.status === 'sold') {
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.resolutionNotes = 'Auto-resolved: vehicle no longer active';
        await alert.save();
        resolvedCount++;
        continue;
      }

      if (vehicle.annualInspection?.nextDueDate) {
        const daysRemaining = this._getDaysRemaining(vehicle.annualInspection.nextDueDate);
        if (daysRemaining > 30) {
          alert.status = 'resolved';
          alert.resolvedAt = new Date();
          alert.resolutionNotes = 'Auto-resolved: inspection completed';
          await alert.save();
          resolvedCount++;
        }
      }
    }

    // Auto-resolve document expiration alerts where document status changed
    const docAlerts = await Alert.find({
      companyId,
      status: 'active',
      category: 'document',
      entityType: 'document',
      title: { $in: ['Document Expired', 'Document Expiring Soon'] }
    });

    for (const alert of docAlerts) {
      const doc = await Document.findById(alert.entityId);
      if (!doc || doc.isDeleted) {
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.resolutionNotes = 'Auto-resolved: document removed';
        await alert.save();
        resolvedCount++;
        continue;
      }

      if (doc.expiryDate) {
        const daysRemaining = this._getDaysRemaining(doc.expiryDate);
        const isExpiredAlert = alert.title === 'Document Expired';
        if ((isExpiredAlert && daysRemaining > 0) || (!isExpiredAlert && daysRemaining > 30)) {
          alert.status = 'resolved';
          alert.resolvedAt = new Date();
          alert.resolutionNotes = 'Auto-resolved: document renewed';
          await alert.save();
          resolvedCount++;
        }
      }
    }

    return resolvedCount;
  },

  /**
   * Generate alerts for all companies (called by cron job)
   */
  async generateAlertsForAllCompanies() {
    const companies = await Company.find({ isDeleted: { $ne: true } }).select('_id name');

    const results = {
      companiesProcessed: 0,
      totalCreated: 0,
      totalUpdated: 0,
      errors: []
    };

    for (const company of companies) {
      try {
        const result = await this.generateAlerts(company._id);
        results.companiesProcessed++;
        results.totalCreated += result.created;
        results.totalUpdated += result.updated;
      } catch (error) {
        console.error(`[AlertService] Error generating alerts for company ${company._id}:`, error.message);
        results.errors.push({ companyId: company._id, error: error.message });
      }
    }

    // Also run escalation check
    try {
      const escalated = await this.escalateAlerts();
      results.escalated = escalated;
    } catch (error) {
      console.error('[AlertService] Error escalating alerts:', error.message);
    }

    return results;
  },

  // ============================================
  // SINGLE-RESOURCE ALERT GENERATION (Real-time)
  // Called from model post-save hooks
  // ============================================

  /**
   * Generate alerts for a single driver (called from Driver model post-save hook)
   */
  async generateDriverAlerts(companyId, driverId) {
    const driver = await Driver.findById(driverId);
    if (!driver || driver.status !== 'active') return { created: 0, updated: 0 };

    const alertPromises = [];
    const driverName = `${driver.firstName} ${driver.lastName}`;

    // CDL expiration
    if (driver.cdl?.expiryDate) {
      const daysRemaining = this._getDaysRemaining(driver.cdl.expiryDate);
      if (daysRemaining < 0) {
        alertPromises.push(this.createAlert({
          companyId, type: 'critical', category: 'driver',
          title: 'CDL Expired',
          message: `${driverName}'s CDL expired ${Math.abs(daysRemaining)} days ago`,
          entityType: 'driver', entityId: driver._id, daysRemaining,
          deduplicationKey: `driver-cdl-expired-${driver._id}`
        }));
      } else if (daysRemaining <= 30) {
        alertPromises.push(this.createAlert({
          companyId, type: 'warning', category: 'driver',
          title: 'CDL Expiring Soon',
          message: `${driverName}'s CDL expires in ${daysRemaining} days`,
          entityType: 'driver', entityId: driver._id, daysRemaining,
          deduplicationKey: `driver-cdl-expiring-${driver._id}`
        }));
      }
    }

    // Medical card expiration
    if (driver.medicalCard?.expiryDate) {
      const daysRemaining = this._getDaysRemaining(driver.medicalCard.expiryDate);
      if (daysRemaining < 0) {
        alertPromises.push(this.createAlert({
          companyId, type: 'critical', category: 'driver',
          title: 'Medical Card Expired',
          message: `${driverName}'s medical card expired ${Math.abs(daysRemaining)} days ago`,
          entityType: 'driver', entityId: driver._id, daysRemaining,
          deduplicationKey: `driver-medical-expired-${driver._id}`
        }));
      } else if (daysRemaining <= 30) {
        alertPromises.push(this.createAlert({
          companyId, type: 'warning', category: 'driver',
          title: 'Medical Card Expiring Soon',
          message: `${driverName}'s medical card expires in ${daysRemaining} days`,
          entityType: 'driver', entityId: driver._id, daysRemaining,
          deduplicationKey: `driver-medical-expiring-${driver._id}`
        }));
      }
    }

    // Clearinghouse query
    if (driver.clearinghouse?.lastQueryDate) {
      const daysSinceQuery = this._getDaysSince(driver.clearinghouse.lastQueryDate);
      if (daysSinceQuery > 365) {
        alertPromises.push(this.createAlert({
          companyId, type: 'critical', category: 'driver',
          title: 'Clearinghouse Query Overdue',
          message: `${driverName}'s annual clearinghouse query is ${daysSinceQuery - 365} days overdue`,
          entityType: 'driver', entityId: driver._id, daysRemaining: -(daysSinceQuery - 365),
          deduplicationKey: `driver-clearinghouse-overdue-${driver._id}`
        }));
      } else if (daysSinceQuery > 335) {
        alertPromises.push(this.createAlert({
          companyId, type: 'warning', category: 'driver',
          title: 'Clearinghouse Query Due Soon',
          message: `${driverName}'s annual clearinghouse query due in ${365 - daysSinceQuery} days`,
          entityType: 'driver', entityId: driver._id, daysRemaining: 365 - daysSinceQuery,
          deduplicationKey: `driver-clearinghouse-due-${driver._id}`
        }));
      }
    }

    const results = await Promise.all(alertPromises);
    return { created: results.filter(r => r.created).length, updated: results.filter(r => !r.created).length };
  },

  /**
   * Generate alerts for a single vehicle (called from Vehicle model post-save hook)
   */
  async generateVehicleAlerts(companyId, vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.status === 'sold') return { created: 0, updated: 0 };

    const alertPromises = [];
    const vehicleName = vehicle.unitNumber || vehicle.vin;

    // Annual inspection
    if (vehicle.annualInspection?.nextDueDate) {
      const daysRemaining = this._getDaysRemaining(vehicle.annualInspection.nextDueDate);
      if (daysRemaining < 0) {
        alertPromises.push(this.createAlert({
          companyId, type: 'critical', category: 'vehicle',
          title: 'Annual Inspection Overdue',
          message: `${vehicleName}'s annual inspection is ${Math.abs(daysRemaining)} days overdue`,
          entityType: 'vehicle', entityId: vehicle._id, daysRemaining,
          deduplicationKey: `vehicle-inspection-overdue-${vehicle._id}`
        }));
      } else if (daysRemaining <= 30) {
        alertPromises.push(this.createAlert({
          companyId, type: 'warning', category: 'vehicle',
          title: 'Annual Inspection Due Soon',
          message: `${vehicleName}'s annual inspection due in ${daysRemaining} days`,
          entityType: 'vehicle', entityId: vehicle._id, daysRemaining,
          deduplicationKey: `vehicle-inspection-due-${vehicle._id}`
        }));
      }
    }

    const results = await Promise.all(alertPromises);
    return { created: results.filter(r => r.created).length, updated: results.filter(r => !r.created).length };
  },

  /**
   * Generate alerts for a single document (called from Document model post-save hook)
   */
  async generateDocumentAlerts(companyId, documentId) {
    const doc = await Document.findById(documentId);
    if (!doc || !doc.expiryDate) return { created: 0, updated: 0 };

    const alertPromises = [];
    const daysRemaining = this._getDaysRemaining(doc.expiryDate);

    if (daysRemaining < 0) {
      alertPromises.push(this.createAlert({
        companyId, type: 'critical', category: 'document',
        title: 'Document Expired',
        message: `${doc.name} expired ${Math.abs(daysRemaining)} days ago`,
        entityType: 'document', entityId: doc._id, daysRemaining,
        deduplicationKey: `document-expired-${doc._id}`
      }));
    } else if (daysRemaining <= 30) {
      alertPromises.push(this.createAlert({
        companyId, type: 'warning', category: 'document',
        title: 'Document Expiring Soon',
        message: `${doc.name} expires in ${daysRemaining} days`,
        entityType: 'document', entityId: doc._id, daysRemaining,
        deduplicationKey: `document-expiring-${doc._id}`
      }));
    }

    const results = await Promise.all(alertPromises);
    return { created: results.filter(r => r.created).length, updated: results.filter(r => !r.created).length };
  },

  /**
   * Generate alerts for newly synced FMCSA inspections
   * @param {string} companyId - Company ID
   * @param {Array} newInspections - Array of inspection objects from sync
   * @returns {object} { created, total }
   */
  async generateNewInspectionAlerts(companyId, newInspections) {
    if (!newInspections || newInspections.length === 0) {
      return { created: 0, total: 0 };
    }

    const alertPromises = [];

    for (const inspection of newInspections) {
      const reportNum = inspection.reportNumber || 'Unknown';
      const inspDate = inspection.inspectionDate
        ? new Date(inspection.inspectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Unknown date';
      const state = inspection.state || 'Unknown';
      const hasOOS = inspection.vehicleOOS || inspection.driverOOS || inspection.hazmatOOS;
      const violationCount = inspection.totalViolations || inspection.violations?.length || 0;

      if (hasOOS) {
        // Critical alert for OOS violations
        const oosTypes = [];
        if (inspection.vehicleOOS) oosTypes.push('Vehicle');
        if (inspection.driverOOS) oosTypes.push('Driver');
        if (inspection.hazmatOOS) oosTypes.push('Hazmat');

        alertPromises.push(this.createAlert({
          companyId,
          type: 'critical',
          category: 'violation',
          title: 'Out-of-Service Inspection',
          message: `${oosTypes.join(' & ')} OOS on ${inspDate} in ${state} (Report #${reportNum}) — ${violationCount} violation(s)`,
          entityType: 'inspection',
          entityId: companyId,
          metadata: {
            reportNumber: reportNum,
            inspectionDate: inspection.inspectionDate,
            state,
            vehicleOOS: inspection.vehicleOOS,
            driverOOS: inspection.driverOOS,
            hazmatOOS: inspection.hazmatOOS,
            violationCount
          },
          deduplicationKey: `inspection-oos-${reportNum}`
        }));
      } else if (violationCount > 0) {
        // Warning alert for inspections with violations
        alertPromises.push(this.createAlert({
          companyId,
          type: 'warning',
          category: 'violation',
          title: 'New Inspection with Violations',
          message: `${violationCount} violation(s) found on ${inspDate} in ${state} (Report #${reportNum})`,
          entityType: 'inspection',
          entityId: companyId,
          metadata: {
            reportNumber: reportNum,
            inspectionDate: inspection.inspectionDate,
            state,
            violationCount
          },
          deduplicationKey: `inspection-violations-${reportNum}`
        }));
      } else {
        // Info alert for clean inspections
        alertPromises.push(this.createAlert({
          companyId,
          type: 'info',
          category: 'violation',
          title: 'Clean Inspection',
          message: `Clean inspection on ${inspDate} in ${state} (Report #${reportNum})`,
          entityType: 'inspection',
          entityId: companyId,
          metadata: {
            reportNumber: reportNum,
            inspectionDate: inspection.inspectionDate,
            state
          },
          deduplicationKey: `inspection-clean-${reportNum}`
        }));
      }
    }

    const results = await Promise.all(alertPromises);

    return {
      created: results.filter(r => r.created).length,
      total: results.length
    };
  },

  // Helper methods
  _getDaysRemaining(date) {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  },

  _getDaysSince(date) {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now - target;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
};

module.exports = alertService;
