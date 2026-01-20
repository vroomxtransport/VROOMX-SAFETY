const mongoose = require('mongoose');

const componentScoreSchema = new mongoose.Schema({
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  breakdown: {
    type: mongoose.Schema.Types.Mixed
  }
}, { _id: false });

const complianceScoreSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  date: {
    type: Date,
    required: true,
    index: true
  },

  // Overall score (0-100, higher is better)
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },

  // Component scores
  components: {
    documentStatus: componentScoreSchema,
    violations: componentScoreSchema,
    drugAlcohol: componentScoreSchema,
    dqfCompleteness: componentScoreSchema,
    vehicleInspection: componentScoreSchema
  },

  // Trend data
  previousScore: {
    type: Number,
    min: 0,
    max: 100
  },

  change: {
    type: Number
  },

  trend: {
    type: String,
    enum: ['improving', 'declining', 'stable']
  },

  // Raw metrics used for calculation (for debugging/auditing)
  metrics: {
    // Document metrics
    totalDocuments: Number,
    validDocuments: Number,
    expiredDocuments: Number,
    dueSoonDocuments: Number,
    missingDocuments: Number,

    // Violation metrics
    totalViolations: Number,
    openViolations: Number,
    timeWeightedSeverity: Number,

    // Drug/Alcohol metrics
    requiredTests: Number,
    completedTests: Number,
    randomDrugTestRate: Number,
    randomAlcoholTestRate: Number,

    // DQF metrics
    totalDrivers: Number,
    compliantDrivers: Number,
    averageDqfCompleteness: Number,

    // Vehicle metrics
    totalVehicles: Number,
    vehiclesWithCurrentInspection: Number
  }
}, {
  timestamps: true
});

// Compound index for company + date queries
complianceScoreSchema.index({ companyId: 1, date: -1 });

// Static method to get latest score
complianceScoreSchema.statics.getLatest = async function(companyId) {
  return this.findOne({ companyId })
    .sort({ date: -1 })
    .lean();
};

// Static method to get score history
complianceScoreSchema.statics.getHistory = async function(companyId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    companyId,
    date: { $gte: startDate }
  })
    .sort({ date: 1 })
    .lean();
};

// Static method to get score trend
complianceScoreSchema.statics.getTrend = async function(companyId, days = 7) {
  const history = await this.getHistory(companyId, days);

  if (history.length < 2) {
    return { trend: 'stable', change: 0 };
  }

  const oldest = history[0].overallScore;
  const latest = history[history.length - 1].overallScore;
  const change = latest - oldest;

  let trend = 'stable';
  if (change > 2) trend = 'improving';
  else if (change < -2) trend = 'declining';

  return { trend, change, history };
};

const ComplianceScore = mongoose.model('ComplianceScore', complianceScoreSchema);

module.exports = ComplianceScore;
