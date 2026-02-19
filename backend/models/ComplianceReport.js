const mongoose = require('mongoose');

const complianceReportSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },

  // AI Analysis Results
  overallRisk: {
    type: String,
    enum: ['critical', 'at_risk', 'needs_attention', 'good', 'excellent'],
    required: true
  },
  overallScore: Number,
  executiveSummary: String,

  // Category Scores
  categoryScores: {
    csa_basics: {
      score: Number,
      status: String,
      summary: String
    },
    driver_qualification: {
      score: Number,
      status: String,
      summary: String
    },
    vehicle_maintenance: {
      score: Number,
      status: String,
      summary: String
    },
    drug_alcohol: {
      score: Number,
      status: String,
      summary: String
    },
    documentation: {
      score: Number,
      status: String,
      summary: String
    }
  },

  // Findings
  findings: [{
    category: {
      type: String,
      enum: ['csa_basics', 'driver_qualification', 'vehicle_maintenance', 'drug_alcohol', 'documentation']
    },
    title: String,
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info']
    },
    description: String,
    regulation: String,
    currentValue: String,
    threshold: String
  }],

  // Prioritized Action Items
  actionItems: [{
    priority: Number,
    title: String,
    description: String,
    category: String,
    effort: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    deadline: String
  }],

  // Metadata
  dataSnapshot: mongoose.Schema.Types.Mixed,
  aiTokensUsed: Number

}, {
  timestamps: true
});

// Index for fetching latest report per company
complianceReportSchema.index({ companyId: 1, generatedAt: -1 });

module.exports = mongoose.model('ComplianceReport', complianceReportSchema);
