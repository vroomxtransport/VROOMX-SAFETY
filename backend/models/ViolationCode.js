const mongoose = require('mongoose');

const violationCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  basic: {
    type: String,
    enum: ['unsafe_driving', 'hours_of_service', 'vehicle_maintenance', 'controlled_substances', 'driver_fitness', 'crash_indicator', 'hazmat']
  },
  severityWeight: {
    type: Number,
    enum: [1, 3, 5, 7, 10]
  },
  oosWeight: Number,
  fmcsrSection: String,
  fmcsrText: String,
  cvsaOosCriteria: String,
  commonOfficerErrors: [String],
  challengeAngles: [String],
  isMovingViolation: {
    type: Boolean,
    default: false
  },
  lastUpdated: Date
}, { timestamps: true });

violationCodeSchema.index({ code: 1 });
violationCodeSchema.index({ basic: 1 });

module.exports = mongoose.model('ViolationCode', violationCodeSchema);
