const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Permission schema for per-company access control
const permissionSchema = {
  drivers: {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  vehicles: {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  violations: {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  drugAlcohol: {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  documents: {
    view: { type: Boolean, default: false },
    upload: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  reports: {
    view: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
  }
};

// Company membership schema - allows user to belong to multiple companies
const companyMembershipSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'safety_manager', 'dispatcher', 'driver', 'viewer'],
    default: 'viewer'
  },
  permissions: permissionSchema,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        // Require at least one uppercase, one lowercase, one number, one special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },

  // Stripe billing info (subscription tied to USER, not company)
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free_trial', 'owner_operator', 'small_fleet', 'fleet_pro', 'solo', 'fleet', 'pro', 'starter', 'professional', 'complete'],
      default: 'free_trial'
    },
    stripeSubscriptionId: String,
    stripePriceId: String,
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'pending_payment'],
      default: 'trialing'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    trialEndsAt: Date
  },

  // Multi-company support - user can belong to multiple companies
  companies: [companyMembershipSchema],

  // Currently active company for session context
  activeCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },

  // Legacy fields for backward compatibility during migration
  // These will be removed after migration
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  role: {
    type: String,
    enum: ['admin', 'safety_manager', 'dispatcher', 'driver', 'viewer'],
    default: 'viewer'
  },
  permissions: permissionSchema,

  isActive: {
    type: Boolean,
    default: true
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendedAt: Date,
  suspendedReason: String,
  lastLogin: {
    type: Date
  },
  passwordResetToken: String, // Stored as SHA-256 hash
  passwordResetExpires: Date,
  passwordChangedAt: Date, // Set on password change/logout to invalidate old tokens

  // Email preferences and verification
  emailPreferences: {
    compliance_alerts: { type: Boolean, default: true },
    billing: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    product_updates: { type: Boolean, default: true }
  },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for subscription limits based on plan
userSchema.virtual('limits').get(function() {
  const plans = {
    free_trial: { maxCompanies: 1, maxDriversPerCompany: 1, maxVehiclesPerCompany: 1 },
    owner_operator: { maxCompanies: 1, maxDriversPerCompany: 1, maxVehiclesPerCompany: 1 },
    small_fleet: { maxCompanies: 3, maxDriversPerCompany: Infinity, maxVehiclesPerCompany: Infinity },
    fleet_pro: { maxCompanies: 10, maxDriversPerCompany: Infinity, maxVehiclesPerCompany: Infinity },
    // Legacy plan mappings
    solo: { maxCompanies: 1, maxDriversPerCompany: 1, maxVehiclesPerCompany: 1 },
    fleet: { maxCompanies: 3, maxDriversPerCompany: Infinity, maxVehiclesPerCompany: Infinity },
    pro: { maxCompanies: 10, maxDriversPerCompany: Infinity, maxVehiclesPerCompany: Infinity },
    complete: { maxCompanies: 10, maxDriversPerCompany: Infinity, maxVehiclesPerCompany: Infinity }
  };
  return plans[this.subscription?.plan] || plans.free_trial;
});

// Virtual to check if subscription is active
userSchema.virtual('isSubscriptionActive').get(function() {
  const activeStatuses = ['trialing', 'active'];
  return activeStatuses.includes(this.subscription?.status);
});

// Virtual for days remaining in trial
userSchema.virtual('trialDaysRemaining').get(function() {
  if (this.subscription?.status !== 'trialing' || !this.subscription?.trialEndsAt) {
    return 0;
  }
  const now = new Date();
  const trialEnd = new Date(this.subscription.trialEndsAt);
  const diff = trialEnd - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method to get role for a specific company
userSchema.methods.getRoleForCompany = function(companyId) {
  const membership = this.companies.find(
    c => c.companyId.toString() === companyId.toString()
  );
  return membership?.role || null;
};

// Method to get permissions for a specific company
userSchema.methods.getPermissionsForCompany = function(companyId) {
  const membership = this.companies.find(
    c => c.companyId.toString() === companyId.toString()
  );
  return membership?.permissions || null;
};

// Method to check if user has access to a company
userSchema.methods.hasAccessToCompany = function(companyId) {
  return this.companies.some(
    c => c.companyId.toString() === companyId.toString() && c.isActive
  );
};

// Method to get count of owned companies
userSchema.methods.getOwnedCompanyCount = function() {
  return this.companies.filter(c => c.role === 'owner' && c.isActive).length;
};

// Static method to get default permissions for a role
userSchema.statics.getDefaultPermissionsForRole = function(role) {
  const rolePermissions = {
    owner: {
      drivers: { view: true, edit: true, delete: true },
      vehicles: { view: true, edit: true, delete: true },
      violations: { view: true, edit: true, delete: true },
      drugAlcohol: { view: true, edit: true, delete: true },
      documents: { view: true, upload: true, delete: true },
      reports: { view: true, export: true }
    },
    admin: {
      drivers: { view: true, edit: true, delete: true },
      vehicles: { view: true, edit: true, delete: true },
      violations: { view: true, edit: true, delete: true },
      drugAlcohol: { view: true, edit: true, delete: true },
      documents: { view: true, upload: true, delete: true },
      reports: { view: true, export: true }
    },
    safety_manager: {
      drivers: { view: true, edit: true, delete: false },
      vehicles: { view: true, edit: true, delete: false },
      violations: { view: true, edit: true, delete: false },
      drugAlcohol: { view: true, edit: true, delete: false },
      documents: { view: true, upload: true, delete: false },
      reports: { view: true, export: true }
    },
    dispatcher: {
      drivers: { view: true, edit: false, delete: false },
      vehicles: { view: true, edit: false, delete: false },
      violations: { view: true, edit: false, delete: false },
      drugAlcohol: { view: false, edit: false, delete: false },
      documents: { view: true, upload: false, delete: false },
      reports: { view: true, export: false }
    },
    driver: {
      drivers: { view: false, edit: false, delete: false },
      vehicles: { view: true, edit: false, delete: false },
      violations: { view: false, edit: false, delete: false },
      drugAlcohol: { view: false, edit: false, delete: false },
      documents: { view: false, upload: false, delete: false },
      reports: { view: false, export: false }
    },
    viewer: {
      drivers: { view: true, edit: false, delete: false },
      vehicles: { view: true, edit: false, delete: false },
      violations: { view: true, edit: false, delete: false },
      drugAlcohol: { view: false, edit: false, delete: false },
      documents: { view: true, upload: false, delete: false },
      reports: { view: true, export: false }
    }
  };
  return rolePermissions[role] || rolePermissions.viewer;
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'companies.companyId': 1 });
userSchema.index({ activeCompanyId: 1 });
userSchema.index({ stripeCustomerId: 1 });
userSchema.index({ isSuperAdmin: 1 });

module.exports = mongoose.model('User', userSchema);
