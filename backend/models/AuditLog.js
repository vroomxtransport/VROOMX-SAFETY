const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change', 'impersonate', 'invite', 'export', 'upload', 'bulk_action', 'force_reset', 'toggle']
  },
  resource: {
    type: String,
    required: true,
    enum: ['driver', 'vehicle', 'violation', 'document', 'drug_alcohol_test', 'accident', 'ticket', 'damage_claim', 'maintenance', 'checklist', 'task', 'user', 'company', 'alert', 'invitation', 'subscription', 'announcement', 'feature_flag', 'system_config', 'email']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: {
    type: String
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Query indexes
auditLogSchema.index({ companyId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL: auto-delete after 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 730 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
