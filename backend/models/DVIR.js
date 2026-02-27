const mongoose = require('mongoose');

const INSPECTION_ITEMS = [
  'Air Compressor', 'Air Lines', 'Battery', 'Body', 'Brake Accessories',
  'Brakes (Parking)', 'Brakes (Service)', 'Clutch', 'Coupling Devices',
  'Defroster/Heater', 'Drive Line', 'Engine', 'Exhaust', 'Fifth Wheel',
  'Fluid Levels', 'Frame & Assembly', 'Front Axle', 'Fuel Tanks',
  'Horn', 'Lights (Head/Stop/Tail/Dash/Turn)', 'Mirrors', 'Muffler',
  'Oil Pressure', 'Radiator', 'Rear End', 'Reflectors', 'Safety Equipment',
  'Springs', 'Starter', 'Steering', 'Suspension', 'Tires', 'Tire Chains',
  'Transmission', 'Trip Recorder', 'Wheels & Rims', 'Windows', 'Windshield Wipers', 'Other'
];

const dvirSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  trailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  inspectionType: {
    type: String,
    enum: ['pre_trip', 'post_trip'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  odometer: Number,
  location: {
    address: String,
    city: String,
    state: String,
    latitude: Number,
    longitude: Number
  },

  // Inspection items checklist
  items: [{
    category: {
      type: String,
      enum: INSPECTION_ITEMS,
      required: true
    },
    condition: {
      type: String,
      enum: ['satisfactory', 'defective'],
      required: true
    },
    notes: String
  }],

  // Defects found
  defectsFound: {
    type: Boolean,
    default: false
  },
  defects: [{
    item: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['minor', 'major', 'out_of_service'],
      default: 'minor'
    },
    photoUrl: String
  }],

  safeToOperate: {
    type: Boolean,
    required: true,
    default: true
  },

  // Signatures
  driverSignature: String,
  driverSignedAt: Date,
  mechanicSignature: String,
  mechanicSignedAt: Date,

  // Repair tracking
  repairsNeeded: {
    type: Boolean,
    default: false
  },
  repairsCompleted: {
    type: Boolean,
    default: false
  },
  repairDate: Date,
  repairNotes: String,
  repairedBy: String,

  // Status
  status: {
    type: String,
    enum: ['open', 'repairs_needed', 'resolved'],
    default: 'open'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-set status based on defects
dvirSchema.pre('save', function(next) {
  if (this.defectsFound && !this.repairsCompleted) {
    this.status = 'repairs_needed';
    this.repairsNeeded = true;
  } else if (this.defectsFound && this.repairsCompleted) {
    this.status = 'resolved';
  } else {
    this.status = 'open';
  }
  next();
});

// Indexes
dvirSchema.index({ companyId: 1, date: -1 });
dvirSchema.index({ companyId: 1, vehicleId: 1 });
dvirSchema.index({ companyId: 1, driverId: 1 });
dvirSchema.index({ companyId: 1, status: 1 });

dvirSchema.statics.INSPECTION_ITEMS = INSPECTION_ITEMS;

module.exports = mongoose.model('DVIR', dvirSchema);
