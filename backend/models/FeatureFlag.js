const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, match: /^[a-z0-9_]+$/ },
  description: { type: String, required: true },
  enabled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
