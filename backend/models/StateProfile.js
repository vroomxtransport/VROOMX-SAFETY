const mongoose = require('mongoose');
const defaultProfiles = require('../config/stateProfiles');

const stateProfileSchema = new mongoose.Schema({
  stateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 2
  },
  stateName: String,
  approvalRates: {
    overall: { type: Number, default: 0.40 },
    byType: {
      data_error: Number,
      policy_violation: Number,
      procedural_error: Number,
      not_responsible: Number
    }
  },
  averageProcessingDays: { type: Number, default: 45 },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: 'moderate'
  },
  challengeCount: { type: Number, default: 0 },
  acceptedCount: { type: Number, default: 0 },
  deniedCount: { type: Number, default: 0 },
  lastUpdated: Date,
  notes: String
}, { timestamps: true });

/**
 * Get or lazy-seed a state profile.
 * Returns the profile for the given state code, creating from defaults if not found.
 */
stateProfileSchema.statics.getOrSeed = async function(stateCode) {
  if (!stateCode) return null;
  const code = stateCode.toUpperCase();

  let profile = await this.findOne({ stateCode: code });
  if (profile) return profile;

  const defaults = defaultProfiles[code];
  if (!defaults) return null;

  try {
    profile = await this.create({
      stateCode: code,
      stateName: defaults.name,
      approvalRates: { overall: defaults.approvalRate },
      averageProcessingDays: defaults.avgDays,
      difficulty: defaults.difficulty
    });
    return profile;
  } catch (err) {
    // Race condition — another process may have created it
    if (err.code === 11000) {
      return this.findOne({ stateCode: code });
    }
    throw err;
  }
};

module.exports = mongoose.model('StateProfile', stateProfileSchema);
