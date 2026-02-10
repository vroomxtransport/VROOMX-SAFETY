const mongoose = require('mongoose');

const dataQMonthlyReportSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  challengesFiled: {
    type: Number,
    default: 0
  },
  challengesWon: {
    type: Number,
    default: 0
  },
  challengesLost: {
    type: Number,
    default: 0
  },
  challengesPending: {
    type: Number,
    default: 0
  },
  severityPointsRemoved: {
    type: Number,
    default: 0
  },
  estimatedPercentileImprovement: {
    type: Number,
    default: 0
  },
  estimatedInsuranceSavings: {
    type: Number,
    default: 0
  },
  generatedAt: Date
}, {
  timestamps: true
});

// Compound unique index to ensure one report per company per month
dataQMonthlyReportSchema.index(
  { companyId: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model('DataQMonthlyReport', dataQMonthlyReportSchema);
