const mongoose = require('mongoose');

const correctiveActionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  inspectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FMCSAInspection'
  },
  violationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Violation'
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  actionType: {
    type: String,
    enum: ['repair', 'training', 'policy_change', 'document_update', 'other'],
    default: 'other'
  },
  completedDate: {
    type: Date
  },
  completedBy: {
    type: String
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed'],
    default: 'planned'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
correctiveActionSchema.index({ companyId: 1, inspectionId: 1 });
correctiveActionSchema.index({ companyId: 1, violationId: 1 });

module.exports = mongoose.model('CorrectiveAction', correctiveActionSchema);
