const mongoose = require('mongoose');
const crypto = require('crypto');

const companyInvitationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  role: {
    type: String,
    enum: ['admin', 'safety_manager', 'dispatcher', 'driver', 'viewer'],
    required: true,
    default: 'viewer'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  acceptedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'canceled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Generate unique invitation token before saving
companyInvitationSchema.pre('save', function(next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  if (!this.expiresAt) {
    // Default: 7 days from now
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Virtual to check if invitation is expired
companyInvitationSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual to check if invitation can be accepted
companyInvitationSchema.virtual('canAccept').get(function() {
  return this.status === 'pending' && !this.isExpired;
});

// Method to mark as accepted
companyInvitationSchema.methods.markAccepted = function() {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  return this.save();
};

// Method to cancel invitation
companyInvitationSchema.methods.cancel = function() {
  this.status = 'canceled';
  return this.save();
};

// Static method to find pending invitation by token
companyInvitationSchema.statics.findPendingByToken = function(token) {
  return this.findOne({
    token,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('companyId', 'name dotNumber')
    .populate('invitedBy', 'firstName lastName email');
};

// Static method to get pending invitations for an email
companyInvitationSchema.statics.findPendingByEmail = function(email) {
  return this.find({
    email: email.toLowerCase(),
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('companyId', 'name dotNumber')
    .populate('invitedBy', 'firstName lastName email');
};

// Indexes
companyInvitationSchema.index({ token: 1 });
companyInvitationSchema.index({ email: 1, status: 1 });
companyInvitationSchema.index({ companyId: 1, status: 1 });
companyInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-delete expired

module.exports = mongoose.model('CompanyInvitation', companyInvitationSchema);
