const mongoose = require('mongoose');

const csaScoreHistorySchema = new mongoose.Schema({
  // Reference to the company
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // DOT number for quick lookups
  dotNumber: {
    type: String,
    required: true,
    index: true
  },

  // When this snapshot was recorded
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  // SMS BASIC Percentiles (the core data)
  basics: {
    unsafeDriving: {
      percentile: { type: Number, min: 0, max: 100, default: null },
      status: { type: String, enum: ['ok', 'alert', 'critical'], default: 'ok' }
    },
    hoursOfService: {
      percentile: { type: Number, min: 0, max: 100, default: null },
      status: { type: String, enum: ['ok', 'alert', 'critical'], default: 'ok' }
    },
    vehicleMaintenance: {
      percentile: { type: Number, min: 0, max: 100, default: null },
      status: { type: String, enum: ['ok', 'alert', 'critical'], default: 'ok' }
    },
    controlledSubstances: {
      percentile: { type: Number, min: 0, max: 100, default: null },
      status: { type: String, enum: ['ok', 'alert', 'critical'], default: 'ok' }
    },
    driverFitness: {
      percentile: { type: Number, min: 0, max: 100, default: null },
      status: { type: String, enum: ['ok', 'alert', 'critical'], default: 'ok' }
    },
    crashIndicator: {
      percentile: { type: Number, min: 0, max: 100, default: null },
      status: { type: String, enum: ['ok', 'alert', 'critical'], default: 'ok' }
    }
  },

  // Additional context data
  metadata: {
    totalInspections: { type: Number, default: 0 },
    inspections24Months: { type: Number, default: 0 },
    totalCrashes: { type: Number, default: 0 },
    crashes24Months: { type: Number, default: 0 },
    operatingStatus: { type: String },
    vehicleOOSRate: { type: Number },
    driverOOSRate: { type: Number },
    dataSource: {
      type: String,
      enum: ['FMCSA_SAFER', 'MANUAL_ENTRY', 'API_IMPORT'],
      default: 'FMCSA_SAFER'
    }
  },

  // Calculated changes from previous record
  changes: {
    unsafeDriving: { type: Number, default: 0 },
    hoursOfService: { type: Number, default: 0 },
    vehicleMaintenance: { type: Number, default: 0 },
    controlledSubstances: { type: Number, default: 0 },
    driverFitness: { type: Number, default: 0 },
    crashIndicator: { type: Number, default: 0 }
  },

  // Overall trend direction
  overallTrend: {
    type: String,
    enum: ['improving', 'stable', 'worsening'],
    default: 'stable'
  }

}, {
  timestamps: true
});

// Compound indexes for efficient queries
csaScoreHistorySchema.index({ companyId: 1, recordedAt: -1 });
csaScoreHistorySchema.index({ dotNumber: 1, recordedAt: -1 });

// Static method: Get history for a company
csaScoreHistorySchema.statics.getHistory = async function(companyId, options = {}) {
  const {
    days = 90,
    limit = 100,
    startDate = null,
    endDate = null
  } = options;

  const query = { companyId };

  if (startDate && endDate) {
    query.recordedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    query.recordedAt = { $gte: cutoffDate };
  }

  return this.find(query)
    .sort({ recordedAt: 1 })
    .limit(limit)
    .lean();
};

// Static method: Get latest record
csaScoreHistorySchema.statics.getLatest = async function(companyId) {
  return this.findOne({ companyId })
    .sort({ recordedAt: -1 })
    .lean();
};

// Static method: Get trend summary
csaScoreHistorySchema.statics.getTrendSummary = async function(companyId, days = 30) {
  const history = await this.getHistory(companyId, { days });

  if (history.length < 2) {
    return {
      hasEnoughData: false,
      message: 'Need at least 2 data points for trend analysis'
    };
  }

  const first = history[0];
  const last = history[history.length - 1];

  const trends = {};
  const basicKeys = [
    'unsafeDriving', 'hoursOfService', 'vehicleMaintenance',
    'controlledSubstances', 'driverFitness', 'crashIndicator'
  ];

  let improvingCount = 0;
  let worseningCount = 0;

  for (const key of basicKeys) {
    const startVal = first.basics[key]?.percentile;
    const endVal = last.basics[key]?.percentile;

    if (startVal !== null && endVal !== null) {
      const change = endVal - startVal;
      trends[key] = {
        start: startVal,
        end: endVal,
        change,
        trend: change < -2 ? 'improving' : change > 2 ? 'worsening' : 'stable'
      };

      if (change < -2) improvingCount++;
      if (change > 2) worseningCount++;
    } else {
      trends[key] = { start: startVal, end: endVal, change: null, trend: 'unknown' };
    }
  }

  return {
    hasEnoughData: true,
    dataPoints: history.length,
    dateRange: {
      start: first.recordedAt,
      end: last.recordedAt
    },
    trends,
    summary: {
      improvingBasics: improvingCount,
      worseningBasics: worseningCount,
      overallTrend: improvingCount > worseningCount ? 'improving' :
                    worseningCount > improvingCount ? 'worsening' : 'stable'
    }
  };
};

// Static method: Check for significant changes (for alerts)
csaScoreHistorySchema.statics.checkForAlerts = async function(companyId) {
  const latest = await this.getLatest(companyId);
  if (!latest) return [];

  const alerts = [];
  const thresholds = {
    unsafeDriving: { alert: 65, critical: 80 },
    hoursOfService: { alert: 65, critical: 80 },
    vehicleMaintenance: { alert: 80, critical: 90 },
    controlledSubstances: { alert: 80, critical: 90 },
    driverFitness: { alert: 80, critical: 90 },
    crashIndicator: { alert: 65, critical: 80 }
  };

  const basicNames = {
    unsafeDriving: 'Unsafe Driving',
    hoursOfService: 'Hours of Service',
    vehicleMaintenance: 'Vehicle Maintenance',
    controlledSubstances: 'Controlled Substances',
    driverFitness: 'Driver Fitness',
    crashIndicator: 'Crash Indicator'
  };

  for (const [key, value] of Object.entries(latest.basics)) {
    const percentile = value?.percentile;
    const threshold = thresholds[key];

    if (percentile !== null && threshold) {
      // Check if crossed critical threshold
      if (percentile >= threshold.critical) {
        alerts.push({
          type: 'critical',
          basic: key,
          percentile,
          threshold: threshold.critical,
          message: `${basicNames[key]} is at ${percentile}% (critical threshold: ${threshold.critical}%)`
        });
      }
      // Check if crossed alert threshold
      else if (percentile >= threshold.alert) {
        alerts.push({
          type: 'alert',
          basic: key,
          percentile,
          threshold: threshold.alert,
          message: `${basicNames[key]} is at ${percentile}% (alert threshold: ${threshold.alert}%)`
        });
      }

      // Check for significant increase from previous
      const change = latest.changes[key];
      if (change && change >= 10) {
        alerts.push({
          type: 'increase',
          basic: key,
          percentile,
          change,
          message: `${basicNames[key]} increased by ${change}% since last update`
        });
      }
    }
  }

  return alerts;
};

const CSAScoreHistory = mongoose.model('CSAScoreHistory', csaScoreHistorySchema);

module.exports = CSAScoreHistory;
