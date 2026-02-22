const mongoose = require('mongoose');

const clearinghouseQuerySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  queryType: {
    type: String,
    enum: ['full', 'limited'],
    required: [true, 'Query type is required']
  },
  queryDate: {
    type: Date,
    required: [true, 'Query date is required']
  },
  queryPurpose: {
    type: String,
    enum: ['pre_employment', 'annual', 'other'],
    required: [true, 'Query purpose is required']
  },
  result: {
    type: String,
    enum: ['clear', 'violation_found', 'pending'],
    required: [true, 'Query result is required']
  },
  consent: {
    obtained: { type: Boolean, default: false },
    consentDate: Date,
    consentMethod: { type: String, enum: ['electronic', 'paper'] },
    documentUrl: String
  },
  confirmationNumber: {
    type: String,
    trim: true
  },
  resultDocumentUrl: String,
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
clearinghouseQuerySchema.index({ companyId: 1, queryDate: -1 });
clearinghouseQuerySchema.index({ driverId: 1, queryDate: -1 });
clearinghouseQuerySchema.index({ companyId: 1, queryPurpose: 1 });

// After saving a query, sync to Driver.clearinghouse so the pre-save hook
// recalculates clearinghouseStatus automatically
clearinghouseQuerySchema.post('save', async function(doc) {
  try {
    const Driver = mongoose.model('Driver');
    const driver = await Driver.findById(doc.driverId);
    if (driver) {
      // Only update if this query is newer than the existing one
      const existingDate = driver.clearinghouse?.lastQueryDate;
      if (!existingDate || new Date(doc.queryDate) >= new Date(existingDate)) {
        driver.clearinghouse = {
          lastQueryDate: doc.queryDate,
          queryType: doc.queryType,
          status: doc.result,
          consentDate: doc.consent?.consentDate || driver.clearinghouse?.consentDate,
          expiryDate: new Date(new Date(doc.queryDate).setFullYear(
            new Date(doc.queryDate).getFullYear() + 1
          ))
        };
        await driver.save();
      }
    }
  } catch (err) {
    // Fire-and-forget: log but don't fail the query save
    console.error('[ClearinghouseQuery] Driver sync failed:', err.message);
  }
});

module.exports = mongoose.model('ClearinghouseQuery', clearinghouseQuerySchema);
