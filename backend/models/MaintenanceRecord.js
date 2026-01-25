const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  // Record type per FMCSA 49 CFR Part 396
  recordType: {
    type: String,
    enum: [
      'preventive_maintenance',
      'annual_inspection',
      'repair',
      'tire_service',
      'brake_service',
      'oil_change',
      'dot_inspection',
      'roadside_repair',
      'recall',
      'other'
    ],
    required: true
  },
  // Service details
  serviceDate: {
    type: Date,
    required: [true, 'Service date is required']
  },
  odometerReading: {
    type: Number,
    min: 0
  },
  engineHours: {
    type: Number,
    min: 0
  },
  // Provider/location
  provider: {
    name: {
      type: String,
      trim: true,
      maxlength: 200
    },
    address: String,
    phone: String,
    mechanic: String
  },
  // Description of work
  description: {
    type: String,
    required: [true, 'Description of work is required'],
    trim: true,
    maxlength: 2000
  },
  // Parts replaced/used
  partsUsed: [{
    partName: String,
    partNumber: String,
    quantity: {
      type: Number,
      default: 1
    },
    cost: Number
  }],
  // Costs
  laborCost: {
    type: Number,
    default: 0,
    min: 0
  },
  partsCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  // Next service scheduling
  nextServiceDate: Date,
  nextServiceMileage: Number,
  // For DOT/Annual inspections
  inspectionResult: {
    type: String,
    enum: ['passed', 'passed_with_defects', 'failed', 'na'],
    default: 'na'
  },
  defectsFound: [{
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'major', 'oos'], // out-of-service
      default: 'minor'
    },
    corrected: {
      type: Boolean,
      default: false
    },
    correctedDate: Date
  }],
  // Documents/attachments
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['invoice', 'inspection_report', 'photo', 'warranty', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Warranty info
  warranty: {
    covered: {
      type: Boolean,
      default: false
    },
    claimNumber: String,
    notes: String
  },
  // Labels/tags for filtering
  tags: [{
    type: String,
    trim: true
  }],
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'completed'
  },
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
  notes: String
}, {
  timestamps: true
});

// Indexes for common queries
maintenanceRecordSchema.index({ companyId: 1, vehicleId: 1 });
maintenanceRecordSchema.index({ companyId: 1, serviceDate: -1 });
maintenanceRecordSchema.index({ companyId: 1, recordType: 1 });
maintenanceRecordSchema.index({ vehicleId: 1, serviceDate: -1 });
maintenanceRecordSchema.index({ nextServiceDate: 1 });

// Virtual for days until next service
maintenanceRecordSchema.virtual('daysUntilNextService').get(function() {
  if (!this.nextServiceDate) return null;
  const now = new Date();
  const next = new Date(this.nextServiceDate);
  const diffTime = next - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for service overdue status
maintenanceRecordSchema.virtual('isOverdue').get(function() {
  if (!this.nextServiceDate) return false;
  return new Date() > this.nextServiceDate;
});

// Pre-save to calculate total cost
maintenanceRecordSchema.pre('save', function(next) {
  // Calculate parts cost from partsUsed array
  if (this.partsUsed && this.partsUsed.length > 0) {
    this.partsCost = this.partsUsed.reduce((sum, part) => {
      return sum + ((part.cost || 0) * (part.quantity || 1));
    }, 0);
  }

  // Calculate total cost
  this.totalCost = (this.laborCost || 0) + (this.partsCost || 0);

  next();
});

// Static method to get upcoming services
maintenanceRecordSchema.statics.getUpcomingServices = async function(companyId, daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    companyId,
    nextServiceDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
    .populate('vehicleId', 'unitNumber type make model')
    .sort('nextServiceDate');
};

// Static method to get overdue services
maintenanceRecordSchema.statics.getOverdueServices = async function(companyId) {
  return this.find({
    companyId,
    nextServiceDate: { $lt: new Date() }
  })
    .populate('vehicleId', 'unitNumber type make model')
    .sort('nextServiceDate');
};

// Static method to get vehicle maintenance history
maintenanceRecordSchema.statics.getVehicleHistory = async function(vehicleId, limit = 50) {
  return this.find({ vehicleId })
    .sort('-serviceDate')
    .limit(limit)
    .populate('createdBy', 'firstName lastName');
};

// Ensure virtuals are included
maintenanceRecordSchema.set('toJSON', { virtuals: true });
maintenanceRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
