const mongoose = require('mongoose');

const reportHistorySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedByEmail: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['dqf', 'vehicle', 'violations', 'audit', 'document-expiration', 'drug-alcohol', 'dataq-history', 'accident-summary', 'maintenance-costs'],
    index: true
  },
  reportName: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true,
    enum: ['csv', 'xlsx']
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  selectedFields: {
    type: [String],
    default: []
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportTemplate'
  },
  templateName: {
    type: String
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  rowCount: {
    type: Number
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Static constant for retention period
reportHistorySchema.statics.RETENTION_DAYS = 90;

// Static method to calculate expiration date
reportHistorySchema.statics.calculateExpiresAt = function() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + this.RETENTION_DAYS);
  return expiresAt;
};

// Pre-save hook to set expiresAt if not already set
reportHistorySchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + 90);
  }
  next();
});

// Virtual for formatted file size
reportHistorySchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return '0 KB';

  if (this.fileSize < 1024) {
    return `${this.fileSize} B`;
  } else if (this.fileSize < 1024 * 1024) {
    return `${(this.fileSize / 1024).toFixed(1)} KB`;
  } else {
    return `${(this.fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }
});

// Virtual for days until expiry
reportHistorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return 0;

  const now = new Date();
  const diffTime = this.expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Query indexes
reportHistorySchema.index({ companyId: 1, generatedAt: -1 });
reportHistorySchema.index({ companyId: 1, reportType: 1, generatedAt: -1 });

// TTL index - uses the expiresAt field value for expiration
reportHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ReportHistory', reportHistorySchema);
