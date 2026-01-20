const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Driver is required']
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },

  // Ticket Details
  ticketNumber: {
    type: String,
    trim: true
  },
  ticketDate: {
    type: Date,
    required: [true, 'Ticket date is required']
  },
  description: {
    type: String,
    required: [true, 'Ticket description is required']
  },
  ticketType: {
    type: String,
    enum: ['speeding', 'logbook', 'equipment', 'parking', 'weight', 'lane_violation', 'red_light', 'stop_sign', 'reckless', 'other'],
    default: 'other'
  },

  // Location
  location: {
    city: String,
    state: String,
    address: String
  },
  issuingAgency: String,
  officerName: String,
  officerBadge: String,

  // Status
  status: {
    type: String,
    enum: ['open', 'pending_court', 'fighting', 'dismissed', 'paid', 'points_reduced', 'deferred'],
    default: 'open'
  },

  // Court Information
  courtDate: Date,
  courtName: String,
  courtAddress: String,
  courtDecision: {
    type: String,
    enum: ['not_yet', 'guilty', 'not_guilty', 'reduced', 'dismissed', 'deferred'],
    default: 'not_yet'
  },
  courtNotes: String,

  // Attorney Information
  attorney: {
    name: String,
    firm: String,
    phone: String,
    email: String,
    retainerPaid: { type: Boolean, default: false },
    retainerAmount: Number
  },

  // DataQ Challenge (if applicable)
  dataQDecision: {
    type: String,
    enum: ['not_filed', 'pending', 'accepted', 'denied'],
    default: 'not_filed'
  },
  dataQCaseNumber: String,
  dataQFiledDate: Date,
  dataQDecisionDate: Date,
  dataQNotes: String,

  // Financial
  fineAmount: {
    type: Number,
    default: 0
  },
  fineReduced: Number,
  finePaid: {
    type: Boolean,
    default: false
  },
  paymentDate: Date,
  paymentMethod: String,

  // Points
  points: {
    type: Number,
    default: 0
  },
  pointsReduced: Number,
  pointsOnRecord: {
    type: Boolean,
    default: false
  },

  // Impact Assessment
  affectsCsr: { // CSA score
    type: Boolean,
    default: false
  },
  affectsInsurance: {
    type: Boolean,
    default: false
  },
  reportedToInsurance: {
    type: Boolean,
    default: false
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['citation', 'court_documents', 'attorney_docs', 'proof_of_payment', 'dismissal', 'other']
    },
    uploadDate: { type: Date, default: Date.now },
    documentUrl: String
  }],

  // Reminders
  reminders: [{
    reminderDate: Date,
    reminderType: { type: String, enum: ['court_date', 'payment_due', 'follow_up', 'other'] },
    message: String,
    sent: { type: Boolean, default: false },
    acknowledged: { type: Boolean, default: false }
  }],

  // Notes
  notes: String,
  internalNotes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
ticketSchema.virtual('daysUntilCourt').get(function() {
  if (!this.courtDate) return null;
  const now = new Date();
  const court = new Date(this.courtDate);
  return Math.ceil((court - now) / (1000 * 60 * 60 * 24));
});

ticketSchema.virtual('totalCost').get(function() {
  const fine = this.fineReduced || this.fineAmount || 0;
  const attorney = this.attorney?.retainerAmount || 0;
  return fine + attorney;
});

ticketSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'dismissed') return false;
  if (this.courtDate && new Date(this.courtDate) < new Date()) return true;
  return false;
});

// Indexes
ticketSchema.index({ companyId: 1, ticketDate: -1 });
ticketSchema.index({ driverId: 1, ticketDate: -1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ courtDate: 1 });
ticketSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
