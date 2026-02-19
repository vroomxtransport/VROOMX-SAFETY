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
      // Use REAL SMS data from company.smsBasics — never use estimated scores for alerts
      const company = await Company.findById(companyId).select('name ownerId smsBasics');
      if (!company) {
        console.error('[CSA Alert] Company not found:', companyId);
        return [];
      }

      const smsBasics = company.smsBasics || {};
      const createdAlerts = [];

      const thresholds = {
        unsafeDriving: { threshold: 65, critical: 80, name: 'Unsafe Driving' },
        hoursOfService: { threshold: 65, critical: 80, name: 'Hours of Service' },
        vehicleMaintenance: { threshold: 80, critical: 90, name: 'Vehicle Maintenance' },
        controlledSubstances: { threshold: 80, critical: 90, name: 'Controlled Substances' },
        driverFitness: { threshold: 80, critical: 90, name: 'Driver Fitness' },
        crashIndicator: { threshold: 65, critical: 80, name: 'Crash Indicator' }
      };

      // Create threshold alerts from REAL SMS percentiles only
      for (const [basic, config] of Object.entries(thresholds)) {
        const percentile = smsBasics[basic];
        if (percentile == null) continue; // Skip — no real FMCSA data

        if (percentile >= config.critical) {
          const deduplicationKey = `csa-${basic}-critical-${Math.floor(percentile / 10) * 10}`;
          try {
            const result = await Alert.findOrCreateAlert({
              companyId,
              type: 'critical',
              category: 'csa_score',
              title: `${config.name} Critical`,
              message: `Your ${config.name} BASIC is at ${percentile}%, above the ${config.critical}% critical threshold. Prioritize addressing violations in this category.`,
              entityType: 'company',
              entityId: companyId,
              metadata: { basic, percentile, threshold: config.critical, dataSource: 'fmcsa_sms' },
              deduplicationKey
            });
            if (result?.created) createdAlerts.push(result.alert);
          } catch (err) {
            if (err.code !== 11000) console.error('[CSA Alert] Error:', err.message);
          }
        } else if (percentile >= config.threshold) {
          const deduplicationKey = `csa-${basic}-warning-${Math.floor(percentile / 10) * 10}`;
          try {
            const result = await Alert.findOrCreateAlert({
              companyId,
              type: 'warning',
              category: 'csa_score',
              title: `${config.name} Alert`,
              message: `Your ${config.name} BASIC is at ${percentile}%, above the ${config.threshold}% intervention threshold. Consider addressing violations to reduce your score.`,
              entityType: 'company',
              entityId: companyId,
              metadata: { basic, percentile, threshold: config.threshold, dataSource: 'fmcsa_sms' },
              deduplicationKey
            });
            if (result?.created) createdAlerts.push(result.alert);
          } catch (err) {
            if (err.code !== 11000) console.error('[CSA Alert] Error:', err.message);
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

      // Compare current REAL SMS data against most recent history snapshot
      const company = await Company.findById(companyId).select('smsBasics');
      if (!company?.smsBasics) return [];

      const previousSnapshot = await CSAScoreHistory.getLatest(companyId);
      if (!previousSnapshot) return [];

      const basicDisplayNames = {
        unsafeDriving: 'Unsafe Driving',
        hoursOfService: 'Hours of Service',
        vehicleMaintenance: 'Vehicle Maintenance',
        controlledSubstances: 'Controlled Substances',
        driverFitness: 'Driver Fitness',
        crashIndicator: 'Crash Indicator'
      };

      const createdAlerts = [];

      for (const [camelKey, displayName] of Object.entries(basicDisplayNames)) {
        const currentPercentile = company.smsBasics[camelKey];
        const previousPercentile = previousSnapshot.basics?.[camelKey]?.percentile ?? previousSnapshot.basics?.[camelKey];

        if (currentPercentile == null || previousPercentile == null) continue;

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
            title: `CSA Score Improved: ${displayName}`,
            message: `Your ${displayName} score decreased from ${previousPercentile}% to ${currentPercentile}% ${reasonText}.`,
            entityType: 'company',
            entityId: companyId,
            metadata: {
              basic: camelKey,
              previousPercentile,
              currentPercentile,
              improvement,
              trigger,
              violationId: violationId || null,
              dataSource: 'fmcsa_sms'
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
