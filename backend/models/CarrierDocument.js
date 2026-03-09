const mongoose = require('mongoose');

const carrierDocumentSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  docType: {
    type: String,
    required: true,
    enum: ['ucr', 'boc3', 'biennial_update', 'mcs90', 'w9', 'cert_of_authority', 'notice_of_assignment', 'insurance_cert', 'ifta', 'irp', 'other']
  },
  name: { type: String, required: true },
  status: { type: String, enum: ['valid', 'expired', 'due_soon', 'missing'], default: 'missing' },
  expirationDate: { type: Date },
  fileUrl: { type: String },
  notes: { type: String },
  lastUpdated: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

carrierDocumentSchema.index({ companyId: 1, docType: 1 });

// Auto-calculate status based on expiration date
carrierDocumentSchema.pre('save', function(next) {
  if (this.expirationDate) {
    const now = new Date();
    const daysUntil = Math.ceil((this.expirationDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) this.status = 'expired';
    else if (daysUntil <= 30) this.status = 'due_soon';
    else this.status = 'valid';
  }
  next();
});

module.exports = mongoose.model('CarrierDocument', carrierDocumentSchema);
