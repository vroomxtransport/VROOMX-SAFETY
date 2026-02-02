const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption key from environment or generate a default (should be set in production)
const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || 'vroomx-integration-key-32chars!!';
const IV_LENGTH = 16;

// Encrypt function
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Decrypt function
const decrypt = (text) => {
  if (!text) return null;
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
};

const integrationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['samsara', 'geotab', 'motive', 'keeptruckin'],
    required: true
  },
  apiKey: {
    type: String, // Stored encrypted
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'disconnected', 'error', 'syncing'],
    default: 'active'
  },
  lastSyncAt: {
    type: Date,
    default: null
  },
  syncInProgress: {
    type: Boolean,
    default: false
  },
  syncConfig: {
    syncDrivers: { type: Boolean, default: true },
    syncVehicles: { type: Boolean, default: true },
    syncHOS: { type: Boolean, default: true },
    autoSync: { type: Boolean, default: false },
    syncInterval: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' }
  },
  stats: {
    drivers: { type: Number, default: 0 },
    vehicles: { type: Number, default: 0 },
    hosLogs: { type: Number, default: 0 }
  },
  error: {
    type: String,
    default: null
  },
  metadata: {
    organizationId: String,
    organizationName: String,
    connectedAt: Date,
    lastValidatedAt: Date
  }
}, {
  timestamps: true
});

// Compound index for unique provider per company
integrationSchema.index({ companyId: 1, provider: 1 }, { unique: true });

// Pre-save middleware to encrypt API key
integrationSchema.pre('save', function(next) {
  if (this.isModified('apiKey') && this.apiKey && !this.apiKey.includes(':')) {
    // Only encrypt if it's not already encrypted (doesn't contain ':' separator)
    this.apiKey = encrypt(this.apiKey);
  }
  next();
});

// Method to get decrypted API key
integrationSchema.methods.getDecryptedApiKey = function() {
  return decrypt(this.apiKey);
};

// Method to update sync stats
integrationSchema.methods.updateStats = async function(stats) {
  this.stats = { ...this.stats, ...stats };
  this.lastSyncAt = new Date();
  this.syncInProgress = false;
  this.error = null;
  await this.save();
};

// Method to set error state
integrationSchema.methods.setError = async function(errorMessage) {
  this.status = 'error';
  this.error = errorMessage;
  this.syncInProgress = false;
  await this.save();
};

// Static method to find active integration for a company
integrationSchema.statics.findActiveByCompany = function(companyId, provider) {
  return this.findOne({
    companyId,
    provider,
    status: { $in: ['active', 'error'] }
  });
};

// Export encryption functions for use in service
integrationSchema.statics.encrypt = encrypt;
integrationSchema.statics.decrypt = decrypt;

module.exports = mongoose.model('Integration', integrationSchema);
