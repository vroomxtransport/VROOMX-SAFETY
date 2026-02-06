const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 5000
  },
  category: {
    type: String,
    enum: ['bug', 'feature_request', 'ui_issue', 'other'],
    default: 'bug'
  },
  page: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 5000
  }
}, {
  timestamps: true
});

bugReportSchema.index({ companyId: 1 });
bugReportSchema.index({ userId: 1 });
bugReportSchema.index({ status: 1 });
bugReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BugReport', bugReportSchema);
