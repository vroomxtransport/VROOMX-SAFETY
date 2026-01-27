const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['transactional', 'billing', 'compliance', 'report'],
    required: true
  },
  resendId: {
    type: String
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'bounced'],
    default: 'sent'
  },
  error: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
emailLogSchema.index({ userId: 1, createdAt: -1 });
emailLogSchema.index({ category: 1, createdAt: -1 });
emailLogSchema.index({ resendId: 1 });
emailLogSchema.index({ to: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
