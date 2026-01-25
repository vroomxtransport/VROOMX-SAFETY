const mongoose = require('mongoose');

const assignedItemSchema = new mongoose.Schema({
  templateItemId: {
    type: mongoose.Schema.Types.ObjectId
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  order: Number,
  required: {
    type: Boolean,
    default: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  notes: String,
  dueDate: Date
});

const checklistAssignmentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistTemplate',
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  // What this checklist is assigned to
  assignedTo: {
    type: {
      type: String,
      enum: ['driver', 'vehicle', 'company', 'audit'],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId
    },
    name: {
      type: String
    }
  },
  // Items copied from template at assignment time
  items: [assignedItemSchema],
  // Overall status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  dueDate: Date,
  completedAt: Date,
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
checklistAssignmentSchema.index({ companyId: 1, status: 1 });
checklistAssignmentSchema.index({ companyId: 1, 'assignedTo.type': 1, 'assignedTo.refId': 1 });
checklistAssignmentSchema.index({ templateId: 1 });

// Virtual for progress percentage
checklistAssignmentSchema.virtual('progress').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  const completed = this.items.filter(item => item.completed).length;
  return Math.round((completed / this.items.length) * 100);
});

// Virtual for required items progress
checklistAssignmentSchema.virtual('requiredProgress').get(function() {
  if (!this.items) return { completed: 0, total: 0, percentage: 0 };
  const required = this.items.filter(item => item.required);
  const completed = required.filter(item => item.completed).length;
  return {
    completed,
    total: required.length,
    percentage: required.length > 0 ? Math.round((completed / required.length) * 100) : 100
  };
});

// Virtual for items summary
checklistAssignmentSchema.virtual('itemsSummary').get(function() {
  if (!this.items) return { total: 0, completed: 0, remaining: 0 };
  const completed = this.items.filter(item => item.completed).length;
  return {
    total: this.items.length,
    completed,
    remaining: this.items.length - completed
  };
});

// Pre-save middleware to update status based on items
checklistAssignmentSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    const completed = this.items.filter(item => item.completed).length;

    if (completed === 0) {
      this.status = 'not_started';
    } else if (completed === this.items.length) {
      this.status = 'completed';
      if (!this.completedAt) {
        this.completedAt = new Date();
      }
    } else {
      this.status = 'in_progress';
      this.completedAt = null;
    }
  }
  next();
});

// Static method to create assignment from template
checklistAssignmentSchema.statics.createFromTemplate = async function(templateId, assignmentData, userId) {
  const ChecklistTemplate = mongoose.model('ChecklistTemplate');
  const template = await ChecklistTemplate.findById(templateId);

  if (!template) {
    throw new Error('Template not found');
  }

  // Copy items from template
  const items = template.items.map(item => ({
    templateItemId: item._id,
    title: item.title,
    description: item.description,
    order: item.order,
    required: item.required,
    completed: false,
    dueDate: item.daysToComplete && assignmentData.dueDate
      ? new Date(new Date(assignmentData.dueDate).getTime() - (item.daysToComplete * 24 * 60 * 60 * 1000))
      : null
  }));

  const assignment = new this({
    companyId: assignmentData.companyId,
    templateId: template._id,
    templateName: template.name,
    assignedTo: assignmentData.assignedTo,
    items,
    dueDate: assignmentData.dueDate,
    createdBy: userId
  });

  return await assignment.save();
};

// Ensure virtuals are included
checklistAssignmentSchema.set('toJSON', { virtuals: true });
checklistAssignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ChecklistAssignment', checklistAssignmentSchema);
