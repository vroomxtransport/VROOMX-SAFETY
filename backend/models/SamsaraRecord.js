const mongoose = require('mongoose');

const samsaraRecordSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true
  },
  recordType: {
    type: String,
    enum: ['driver', 'vehicle'],
    required: true
  },
  samsaraId: {
    type: String,
    required: true
  },
  samsaraData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Extracted fields for easy display/matching
  displayName: String,
  identifier: String, // License number for drivers, VIN for vehicles
  status: {
    type: String,
    enum: ['pending', 'matched', 'created', 'skipped'],
    default: 'pending'
  },
  linkedRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'linkedRecordModel'
  },
  linkedRecordModel: {
    type: String,
    enum: ['Driver', 'Vehicle']
  },
  linkedAt: Date,
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique samsara record per company
samsaraRecordSchema.index({ companyId: 1, samsaraId: 1, recordType: 1 }, { unique: true });

// Index for finding pending records
samsaraRecordSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('SamsaraRecord', samsaraRecordSchema);
