const mongoose = require('mongoose');

const knownInspectionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  inspectionDate: Date,
  location: {
    city: String,
    state: String
  },
  inspectionLevel: {
    type: Number,
    min: 1,
    max: 6
  },
  result: {
    type: String,
    enum: ['clean', 'violation'],
    required: true
  },
  inMcmis: {
    type: Boolean,
    default: false
  },
  mcmisReportNumber: String,
  dataqFiled: {
    type: Boolean,
    default: false
  },
  dataqCaseNumber: String,
  source: {
    type: String,
    enum: ['driver_report', 'inspection_receipt', 'manual_entry', 'fmcsa_sync'],
    default: 'manual_entry'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
knownInspectionSchema.index({ companyId: 1, inspectionDate: -1 });

module.exports = mongoose.model('KnownInspection', knownInspectionSchema);
