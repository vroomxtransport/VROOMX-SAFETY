const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  message: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetAudience: { type: String, enum: ['all', 'admins', 'solo', 'fleet', 'starter', 'professional'], default: 'all' },
  linkUrl: { type: String },
  linkText: { type: String },
}, { timestamps: true });

announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
module.exports = mongoose.model('Announcement', announcementSchema);
