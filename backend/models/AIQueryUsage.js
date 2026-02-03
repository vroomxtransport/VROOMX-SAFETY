const mongoose = require('mongoose');

const aiQueryUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  month: {
    type: String, // Format: "2026-02" for Feb 2026
    required: true,
    index: true
  },
  count: {
    type: Number,
    default: 0
  },
  totalInputTokens: {
    type: Number,
    default: 0
  },
  totalOutputTokens: {
    type: Number,
    default: 0
  },
  lastQueryAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient monthly lookups
aiQueryUsageSchema.index({ userId: 1, month: 1 }, { unique: true });

// TTL index - auto-delete after 13 months (keep 1 year + buffer)
aiQueryUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 34214400 });

module.exports = mongoose.model('AIQueryUsage', aiQueryUsageSchema);
