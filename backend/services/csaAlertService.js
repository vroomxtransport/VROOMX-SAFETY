/**
 * CSA Alert Service
 *
 * Monitors CSA score changes and creates alerts when:
 * - BASICs cross intervention thresholds
 * - Scores significantly increase (>10% change)
 * - Critical compliance issues detected
 * - Scores improve (DataQ challenge accepted or violation aging)
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
          }
        } catch (err) {
          // Skip duplicate key errors (alert already exists)
          if (err.code !== 11000) {
            console.error('[CSA Alert] Error creating alert:', err.message);
          }
        }
      }

      // Also check for significant score changes (>=5% move in either direction)
      try {
        const recentHistory = await CSAScoreHistory.find({ companyId })
          .sort({ recordedAt: -1 })
          .limit(2)
          .lean();

        if (recentHistory.length === 2) {
          const current = recentHistory[0];
          const previous = recentHistory[1];

          const basicDisplayNames = {
            unsafeDriving: 'Unsafe Driving',
            hoursOfService: 'Hours of Service',
            vehicleMaintenance: 'Vehicle Maintenance',
            controlledSubstances: 'Controlled Substances',
            driverFitness: 'Driver Fitness',
            crashIndicator: 'Crash Indicator'
          };

          for (const [basic, displayName] of Object.entries(basicDisplayNames)) {
            const curVal = current.basics?.[basic]?.percentile ?? current.basics?.[basic];
            const prevVal = previous.basics?.[basic]?.percentile ?? previous.basics?.[basic];
            if (curVal == null || prevVal == null) continue;

            const change = curVal - prevVal;
            if (Math.abs(change) < 5) continue;

            const today = new Date().toISOString().split('T')[0];

            if (change > 0) {
              // Score worsened
              const deduplicationKey = `csa-worsened-${basic}-${today}`;
              try {
                const result = await Alert.findOrCreateAlert({
                  companyId,
                  type: change >= 10 ? 'critical' : 'warning',
                  category: 'csa_score',
                  title: `${displayName} Score Increased`,
                  message: `Your ${displayName} score increased from ${prevVal}% to ${curVal}% (+${change}). ${change >= 10 ? 'Immediate attention recommended.' : 'Monitor closely.'}`,
                  entityType: 'company',
                  entityId: companyId,
                  metadata: { basic, previousPercentile: prevVal, currentPercentile: curVal, change },
                  deduplicationKey
                });
                if (result?.created) createdAlerts.push(result.alert);
              } catch (err) {
                if (err.code !== 11000) console.error('[CSA Alert] Worsening alert error:', err.message);
              }
            } else {
              // Score improved
              const deduplicationKey = `csa-improved-${basic}-${today}`;
              try {
                const result = await Alert.findOrCreateAlert({
                  companyId,
                  type: 'info',
                  category: 'csa_score',
                  title: `${displayName} Score Improved`,
                  message: `Your ${displayName} score decreased from ${prevVal}% to ${curVal}% (${change}). Good progress!`,
                  entityType: 'company',
                  entityId: companyId,
                  metadata: { basic, previousPercentile: prevVal, currentPercentile: curVal, change },
                  deduplicationKey
                });
                if (result?.created) createdAlerts.push(result.alert);
              } catch (err) {
                if (err.code !== 11000) console.error('[CSA Alert] Improvement alert error:', err.message);
              }
            }
          }
        }
      } catch (err) {
        console.error('[CSA Alert] Score change detection error:', err.message);
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
  /**
   * Check for score improvements and create positive alerts.
   * Called after DataQ challenge accepted or during daily cron.
   *
   * @param {string} companyId - Company ID
   * @param {object} options
   * @param {string} options.trigger - 'dataq_accepted' | 'time_decay'
   * @param {string} [options.violationId] - The violation that triggered this (for DataQ)
   * @param {number} [options.minImprovement] - Minimum percentile drop to trigger alert (default 5)
   * @returns {Array} Created alerts
   */
  async checkForImprovements(companyId, options = {}) {
    try {
      const {
        trigger = 'time_decay',
        violationId = null,
        minImprovement = 5
      } = options;

      // Get the most recent history snapshot as baseline
      const previousSnapshot = await CSAScoreHistory.getLatest(companyId);
      if (!previousSnapshot) return [];

      // Calculate current scores fresh (lazy require to avoid circular deps)
      const csaCalculatorService = require('./csaCalculatorService');
      const currentScores = await csaCalculatorService.calculateAllBasics(companyId);

      // Map snake_case calculator keys to camelCase history keys
      const keyMap = {
        unsafe_driving: 'unsafeDriving',
        hours_of_service: 'hoursOfService',
        vehicle_maintenance: 'vehicleMaintenance',
        controlled_substances: 'controlledSubstances',
        driver_fitness: 'driverFitness',
        crash_indicator: 'crashIndicator'
      };

      const basicDisplayNames = {
        unsafeDriving: 'Unsafe Driving',
        hoursOfService: 'Hours of Service',
        vehicleMaintenance: 'Vehicle Maintenance',
        controlledSubstances: 'Controlled Substances',
        driverFitness: 'Driver Fitness',
        crashIndicator: 'Crash Indicator'
      };

      const createdAlerts = [];

      for (const [snakeKey, camelKey] of Object.entries(keyMap)) {
        const previousPercentile = previousSnapshot.basics[camelKey]?.percentile;
        const currentPercentile = currentScores[snakeKey]?.estimatedPercentile;

        if (previousPercentile == null || currentPercentile == null) continue;

        const improvement = previousPercentile - currentPercentile;
        if (improvement < minImprovement) continue;

        const today = new Date().toISOString().split('T')[0];
        const deduplicationKey = `csa-improvement-${camelKey}-${today}`;

        const reasonText = trigger === 'dataq_accepted'
          ? 'following a successful DataQ challenge'
          : 'due to violation aging (time-weighted decay)';

        try {
          const result = await Alert.findOrCreateAlert({
            companyId,
            type: 'info',
            category: 'csa_score',
            title: `CSA Score Improved: ${basicDisplayNames[camelKey]}`,
            message: `Your ${basicDisplayNames[camelKey]} score decreased from ${previousPercentile}% to ${currentPercentile}% ${reasonText}.`,
            entityType: 'company',
            entityId: companyId,
            metadata: {
              basic: camelKey,
              previousPercentile,
              currentPercentile,
              improvement,
              trigger,
              violationId: violationId || null
            },
            deduplicationKey
          });

          if (result.created) {
            createdAlerts.push(result.alert);
          }
        } catch (err) {
          if (err.code !== 11000) {
            console.error('[CSA Alert] Error creating improvement alert:', err.message);
          }
        }
      }

      return createdAlerts;
    } catch (error) {
      console.error('[CSA Alert] Error in checkForImprovements:', error.message);
      return [];
    }
  },

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
