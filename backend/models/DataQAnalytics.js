const mongoose = require('mongoose');

const dataQAnalyticsSchema = new mongoose.Schema({
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  totalFiled: {
    type: Number,
    default: 0
  },
  totalWon: {
    type: Number,
    default: 0
  },
  totalLost: {
    type: Number,
    default: 0
  },
  totalPending: {
    type: Number,
    default: 0
  },
  overallSuccessRate: {
    type: Number,
    default: 0
  },
  byViolationType: [{
    violationType: String,
    filed: Number,
    won: Number,
    successRate: Number
  }],
  byState: [{
    stateCode: String,
    filed: Number,
    won: Number,
    successRate: Number,
    avgResponseDays: Number
  }],
  byRdrType: [{
    rdrType: String,
    filed: Number,
    won: Number,
    successRate: Number
  }],
  triagePredictionAccuracy: Number,
  weightAdjustments: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Compound index for fast lookups by period type and date range
dataQAnalyticsSchema.index({ period: 1, periodStart: 1 });

module.exports = mongoose.model('DataQAnalytics', dataQAnalyticsSchema);
