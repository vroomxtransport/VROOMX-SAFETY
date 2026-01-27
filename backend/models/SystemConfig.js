const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

systemConfigSchema.statics.getValue = async function(key, defaultValue = null) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : defaultValue;
};

systemConfigSchema.statics.setValue = async function(key, value, userId) {
  return this.findOneAndUpdate({ key }, { value, updatedBy: userId }, { upsert: true, new: true });
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
