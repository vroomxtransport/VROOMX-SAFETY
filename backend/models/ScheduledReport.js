const mongoose = require('mongoose');

const scheduledReportSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['dqf', 'vehicle-maintenance', 'violations', 'audit', 'csa'],
    index: true
  },
  reportName: {
    type: String,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly']
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    default: 1 // Monday
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  time: {
    type: String,
    default: '09:00',
    match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  recipients: [{
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  }],
  format: {
    type: String,
    enum: ['pdf', 'csv', 'both'],
    default: 'pdf'
  },
  filters: {
    startDate: Date,
    endDate: Date,
    driverId: mongoose.Schema.Types.ObjectId,
    vehicleId: mongoose.Schema.Types.ObjectId,
    status: String
  },
  lastRun: {
    type: Date,
    default: null
  },
  lastRunStatus: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: null
  },
  lastRunError: {
    type: String,
    default: null
  },
  nextRun: {
    type: Date,
    index: true
  },
  runCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient cron job queries
scheduledReportSchema.index({ nextRun: 1, isActive: 1 });
scheduledReportSchema.index({ companyId: 1, isActive: 1 });

// Virtual for report type display name
scheduledReportSchema.virtual('reportDisplayName').get(function() {
  const names = {
    'dqf': 'Driver Qualification Files',
    'vehicle-maintenance': 'Vehicle Maintenance',
    'violations': 'Violations Summary',
    'audit': 'Comprehensive Audit',
    'csa': 'CSA/SMS BASICs'
  };
  return this.reportName || names[this.reportType] || this.reportType;
});

// Virtual for frequency display
scheduledReportSchema.virtual('frequencyDisplay').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  switch (this.frequency) {
    case 'daily':
      return `Daily at ${this.time}`;
    case 'weekly':
      return `Every ${days[this.dayOfWeek]} at ${this.time}`;
    case 'monthly':
      const suffix = this.dayOfMonth === 1 ? 'st' :
                     this.dayOfMonth === 2 ? 'nd' :
                     this.dayOfMonth === 3 ? 'rd' : 'th';
      return `Monthly on the ${this.dayOfMonth}${suffix} at ${this.time}`;
    default:
      return this.frequency;
  }
});

// Ensure virtuals are included in JSON output
scheduledReportSchema.set('toJSON', { virtuals: true });
scheduledReportSchema.set('toObject', { virtuals: true });

// Pre-save middleware to calculate nextRun
scheduledReportSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('frequency') || this.isModified('dayOfWeek') ||
      this.isModified('dayOfMonth') || this.isModified('time') || this.isModified('isActive')) {
    this.nextRun = this.calculateNextRun();
  }
  next();
});

// Method to calculate next run time
scheduledReportSchema.methods.calculateNextRun = function() {
  if (!this.isActive) return null;

  const now = new Date();
  const [hours, minutes] = this.time.split(':').map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (this.frequency) {
    case 'daily':
      // If today's time has passed, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'weekly':
      // Calculate days until next occurrence of dayOfWeek
      const currentDay = now.getDay();
      let daysUntil = this.dayOfWeek - currentDay;

      if (daysUntil < 0 || (daysUntil === 0 && nextRun <= now)) {
        daysUntil += 7;
      }

      nextRun.setDate(nextRun.getDate() + daysUntil);
      nextRun.setHours(hours, minutes, 0, 0);
      break;

    case 'monthly':
      // Set to dayOfMonth, handling month overflow
      nextRun.setDate(Math.min(this.dayOfMonth, this.getDaysInMonth(nextRun)));
      nextRun.setHours(hours, minutes, 0, 0);

      // If this month's date has passed, go to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(Math.min(this.dayOfMonth, this.getDaysInMonth(nextRun)));
        nextRun.setHours(hours, minutes, 0, 0);
      }
      break;
  }

  return nextRun;
};

// Helper to get days in month
scheduledReportSchema.methods.getDaysInMonth = function(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Static method to find all due reports
scheduledReportSchema.statics.findDueReports = function() {
  return this.find({
    isActive: true,
    nextRun: { $lte: new Date() }
  }).populate('createdBy', 'firstName lastName email').populate('companyId', 'name dotNumber');
};

// Static method to get schedules for a company
scheduledReportSchema.statics.getForCompany = function(companyId) {
  return this.find({ companyId, isActive: true })
    .populate('createdBy', 'firstName lastName email')
    .sort('-createdAt');
};

const ScheduledReport = mongoose.model('ScheduledReport', scheduledReportSchema);

module.exports = ScheduledReport;
