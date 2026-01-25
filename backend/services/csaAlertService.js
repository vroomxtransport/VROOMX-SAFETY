/**
 * CSA Alert Service
 *
 * Monitors CSA score changes and creates alerts when:
 * - BASICs cross intervention thresholds
 * - Scores significantly increase (>10% change)
 * - Critical compliance issues detected
 */

const CSAScoreHistory = require('../models/CSAScoreHistory');
const Alert = require('../models/Alert');
const Company = require('../models/Company');

const csaAlertService = {
  /**
   * Check for significant changes and create alerts
   * Call this after each history record
   *
   * @param {string} companyId - MongoDB ObjectId of the company
   * @returns {Array} - Array of created alerts
   */
  async checkAndCreateAlerts(companyId) {
    try {
      const company = await Company.findById(companyId).select('name ownerId');
      if (!company) {
        console.error('[CSA Alert] Company not found:', companyId);
        return [];
      }

      const scoreAlerts = await CSAScoreHistory.checkForAlerts(companyId);
      const createdAlerts = [];

      for (const alert of scoreAlerts) {
        try {
          // Create deduplication key to prevent duplicates
          const deduplicationKey = `csa-${alert.basic}-${alert.type}-${Math.floor(alert.percentile / 10) * 10}`;

          // Check if similar alert exists recently (last 24 hours)
          const existingAlert = await Alert.findOne({
            companyId,
            category: 'csa_score',
            deduplicationKey,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          });

          if (!existingAlert) {
            const basicDisplayNames = {
              unsafeDriving: 'Unsafe Driving',
              hoursOfService: 'Hours of Service',
              vehicleMaintenance: 'Vehicle Maintenance',
              controlledSubstances: 'Controlled Substances',
              driverFitness: 'Driver Fitness',
              crashIndicator: 'Crash Indicator'
            };

            const newAlert = await Alert.create({
              companyId,
              type: alert.type === 'critical' ? 'critical' : 'warning',
              category: 'csa_score',
              title: `${basicDisplayNames[alert.basic]} ${alert.type === 'critical' ? 'Critical' : 'Alert'}`,
              message: alert.message,
              entityType: 'company',
              entityId: companyId,
              metadata: {
                basic: alert.basic,
                percentile: alert.percentile,
                threshold: alert.threshold,
                change: alert.change || null
              },
              deduplicationKey,
              status: 'active'
            });

            createdAlerts.push(newAlert);
            console.log(`[CSA Alert] Created ${alert.type} alert for ${company.name}: ${alert.message}`);
          }
        } catch (err) {
          // Skip duplicate key errors (alert already exists)
          if (err.code !== 11000) {
            console.error('[CSA Alert] Error creating alert:', err.message);
          }
        }
      }

      return createdAlerts;
    } catch (error) {
      console.error('[CSA Alert] Error in checkAndCreateAlerts:', error.message);
      return [];
    }
  },

  /**
   * Get active CSA alerts for a company
   *
   * @param {string} companyId - MongoDB ObjectId of the company
   * @returns {Array} - Array of active alerts
   */
  async getActiveAlerts(companyId) {
    try {
      return await Alert.find({
        companyId,
        category: 'csa_score',
        status: 'active'
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('[CSA Alert] Error getting alerts:', error.message);
      return [];
    }
  },

  /**
   * Auto-resolve alerts when scores improve below thresholds
   *
   * @param {string} companyId - MongoDB ObjectId of the company
   * @param {object} currentBasics - Current BASIC scores
   */
  async checkForResolution(companyId, currentBasics) {
    try {
      const thresholds = {
        unsafeDriving: 65,
        hoursOfService: 65,
        vehicleMaintenance: 80,
        controlledSubstances: 80,
        driverFitness: 80,
        crashIndicator: 65
      };

      for (const [basic, threshold] of Object.entries(thresholds)) {
        const currentScore = currentBasics[basic];

        // If score is now below threshold, resolve related alerts
        if (currentScore !== null && currentScore < threshold) {
          await Alert.updateMany(
            {
              companyId,
              category: 'csa_score',
              'metadata.basic': basic,
              status: 'active'
            },
            {
              status: 'auto_resolved',
              resolvedAt: new Date(),
              resolutionNotes: `Score improved to ${currentScore}%, below threshold of ${threshold}%`
            }
          );
        }
      }
    } catch (error) {
      console.error('[CSA Alert] Error checking for resolution:', error.message);
    }
  }
};

module.exports = csaAlertService;
