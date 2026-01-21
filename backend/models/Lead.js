const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  dotNumber: {
    type: String,
    trim: true
  },
  mcNumber: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    default: 'csa-checker',
    enum: ['csa-checker', 'website', 'referral', 'blog', 'other']
  },
  csaSnapshot: {
    unsafeDriving: Number,
    hosCompliance: Number,
    vehicleMaintenance: Number,
    crashIndicator: Number,
    controlledSubstances: Number,
    hazmatCompliance: Number,
    driverFitness: Number,
    alertCount: Number,
    fetchedAt: Date
  },
  aiAnalysis: {
    summary: String,
    criticalIssues: [String],
    recommendations: [String],
    dataQOpportunities: [{
      violation: String,
      reason: String,
      estimatedImpact: String
    }],
    actionPlan: [String],
    generatedAt: Date
  },
  convertedToTrial: {
    type: Boolean,
    default: false
  },
  convertedToPaid: {
    type: Boolean,
    default: false
  },
  emailSequenceStatus: {
    type: String,
    enum: ['pending', 'sent_welcome', 'sent_day2', 'sent_day5', 'sent_day7', 'completed', 'unsubscribed'],
    default: 'pending'
  },
  lastEmailSentAt: Date,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for efficient queries
leadSchema.index({ email: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ source: 1 });
leadSchema.index({ convertedToTrial: 1 });
leadSchema.index({ emailSequenceStatus: 1, lastEmailSentAt: 1 });

// Static method to get stats for social proof
leadSchema.statics.getMonthlyStats = async function() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const stats = await this.aggregate([
    {
      $facet: {
        thisMonth: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $count: 'count' }
        ],
        total: [
          { $count: 'count' }
        ],
        conversions: [
          { $match: { convertedToTrial: true } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  return {
    checksThisMonth: stats[0].thisMonth[0]?.count || 0,
    totalChecks: stats[0].total[0]?.count || 0,
    trialConversions: stats[0].conversions[0]?.count || 0
  };
};

// Instance method to check if email already exists
leadSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

module.exports = mongoose.model('Lead', leadSchema);
