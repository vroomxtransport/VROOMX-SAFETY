const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Alert classification
  type: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true,
    index: true
  },

  category: {
    type: String,
    enum: ['driver', 'vehicle', 'violation', 'basics', 'document', 'drug_alcohol', 'csa_score'],
    required: true,
    index: true
  },

  // Alert content
  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // Related entity
  entityType: {
    type: String,
    enum: ['driver', 'vehicle', 'violation', 'document', 'company', 'drug_alcohol_test'],
    index: true
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel'
  },

  entityModel: {
    type: String,
    enum: ['Driver', 'Vehicle', 'Violation', 'Document', 'Company', 'DrugAlcoholTest']
  },

  // Additional context
  daysRemaining: {
    type: Number
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed
  },

  // Escalation tracking
  escalationLevel: {
    type: Number,
    default: 0
  },

  firstOccurrence: {
    type: Date,
    default: Date.now
  },

  lastEscalatedAt: {
    type: Date
  },

  // Status management
  status: {
    type: String,
    enum: ['active', 'dismissed', 'resolved', 'auto_resolved'],
    default: 'active',
    index: true
  },

  // Dismissal tracking
  dismissedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  dismissedAt: {
    type: Date
  },

  dismissalReason: {
    type: String
  },

  // Resolution tracking
  resolvedAt: {
    type: Date
  },

  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  resolutionNotes: {
    type: String
  },

  // Auto-resolve condition (e.g., "document.status === 'valid'")
  autoResolveCondition: {
    type: String
  },

  // Deduplication key - prevents duplicate alerts for same issue
  deduplicationKey: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
alertSchema.index({ companyId: 1, status: 1, type: 1 });
alertSchema.index({ companyId: 1, category: 1, status: 1 });
alertSchema.index({ companyId: 1, entityType: 1, entityId: 1 });
alertSchema.index({ deduplicationKey: 1, companyId: 1 }, { unique: true, sparse: true });

// Static method to find or create alert (prevents duplicates)
alertSchema.statics.findOrCreateAlert = async function(alertData) {
  const deduplicationKey = alertData.deduplicationKey ||
    `${alertData.category}-${alertData.entityType}-${alertData.entityId}-${alertData.title}`;

  // Check for existing active alert with same dedup key
  const existing = await this.findOne({
    companyId: alertData.companyId,
    deduplicationKey,
    status: 'active'
  });

  if (existing) {
    // Update existing alert if needed
    existing.message = alertData.message;
    existing.daysRemaining = alertData.daysRemaining;
    existing.metadata = alertData.metadata;
    await existing.save();
    return { alert: existing, created: false };
  }

  // Create new alert
  const alert = await this.create({
    ...alertData,
    deduplicationKey
  });

  return { alert, created: true };
};

// Static method to auto-resolve alerts for an entity
alertSchema.statics.autoResolveForEntity = async function(entityType, entityId, companyId) {
  const result = await this.updateMany(
    {
      companyId,
      entityType,
      entityId,
      status: 'active'
    },
    {
      status: 'auto_resolved',
      resolvedAt: new Date()
    }
  );

  return result.modifiedCount;
};

// Instance method to dismiss
alertSchema.methods.dismiss = async function(userId, reason) {
  this.status = 'dismissed';
  this.dismissedBy = userId;
  this.dismissedAt = new Date();
  this.dismissalReason = reason;
  await this.save();
  return this;
};

// Instance method to escalate
alertSchema.methods.escalate = async function() {
  this.escalationLevel += 1;
  this.lastEscalatedAt = new Date();

  // Upgrade type if escalating
  if (this.type === 'info' && this.escalationLevel >= 2) {
    this.type = 'warning';
  } else if (this.type === 'warning' && this.escalationLevel >= 3) {
    this.type = 'critical';
  }

  await this.save();
  return this;
};

// Virtual for time since first occurrence
alertSchema.virtual('daysSinceFirstOccurrence').get(function() {
  if (!this.firstOccurrence) return 0;
  const diffMs = Date.now() - this.firstOccurrence.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

// Pre-save: set entityModel based on entityType
alertSchema.pre('save', function(next) {
  if (this.entityType) {
    const modelMap = {
      driver: 'Driver',
      vehicle: 'Vehicle',
      violation: 'Violation',
      document: 'Document',
      company: 'Company',
      drug_alcohol_test: 'DrugAlcoholTest'
    };
    this.entityModel = modelMap[this.entityType];
  }
  next();
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
