const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'overdue'],
    default: 'not_started'
  },
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedToType: {
    type: String,
    enum: ['driver', 'staff', 'admin'],
    default: 'staff'
  },
  assignedToName: {
    type: String,
    trim: true
  },
  // Linking to other entities
  linkedTo: {
    type: {
      type: String,
      enum: ['driver', 'vehicle', 'violation', 'document', 'audit', 'none'],
      default: 'none'
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId
    },
    refName: {
      type: String
    }
  },
  // Auto-generation tracking
  source: {
    type: String,
    enum: ['manual', 'auto_compliance'],
    default: 'manual'
  },
  category: {
    type: String,
    enum: ['general', 'expiring_doc', 'missing_dqf', 'violation', 'maintenance', 'onboarding'],
    default: 'general'
  },
  // Recurring task support
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    intervalDays: {
      type: Number,
      min: 1,
      max: 365
    },
    nextDueDate: Date,
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }
  },
  // Reminders
  reminders: [{
    date: Date,
    type: {
      type: String,
      enum: ['email', 'in_app'],
      default: 'in_app'
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  // Completion tracking
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  completionNotes: String,
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Notes/comments
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

// Indexes for common queries
taskSchema.index({ companyId: 1, status: 1 });
taskSchema.index({ companyId: 1, dueDate: 1 });
taskSchema.index({ companyId: 1, assignedTo: 1 });
taskSchema.index({ companyId: 1, priority: 1 });
taskSchema.index({ 'linkedTo.type': 1, 'linkedTo.refId': 1 });

// Virtual for overdue check
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (this.status === 'completed') return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status
taskSchema.pre('save', function(next) {
  // Auto-update status to overdue if past due date
  if (this.status !== 'completed' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  next();
});

// Static method to create recurring task instance
taskSchema.statics.createRecurringInstance = async function(parentTask) {
  if (!parentTask.recurring.enabled || !parentTask.recurring.intervalDays) {
    return null;
  }

  const newDueDate = new Date(parentTask.dueDate);
  newDueDate.setDate(newDueDate.getDate() + parentTask.recurring.intervalDays);

  const newTask = new this({
    companyId: parentTask.companyId,
    title: parentTask.title,
    description: parentTask.description,
    dueDate: newDueDate,
    priority: parentTask.priority,
    status: 'not_started',
    assignedTo: parentTask.assignedTo,
    assignedToType: parentTask.assignedToType,
    assignedToName: parentTask.assignedToName,
    linkedTo: parentTask.linkedTo,
    recurring: {
      enabled: true,
      intervalDays: parentTask.recurring.intervalDays,
      parentTaskId: parentTask._id
    },
    createdBy: parentTask.createdBy
  });

  return await newTask.save();
};

// Ensure virtuals are included in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
