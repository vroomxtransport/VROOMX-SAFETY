const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  order: {
    type: Number,
    default: 0
  },
  required: {
    type: Boolean,
    default: true
  },
  daysToComplete: {
    type: Number,
    min: 0
  }
});

const checklistTemplateSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['onboarding', 'audit', 'maintenance', 'file_review', 'custom'],
    default: 'custom'
  },
  items: [checklistItemSchema],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for common queries
checklistTemplateSchema.index({ companyId: 1, category: 1 });
checklistTemplateSchema.index({ companyId: 1, isActive: 1 });

// Virtual for item count
checklistTemplateSchema.virtual('itemCount').get(function() {
  return this.items?.length || 0;
});

// Ensure virtuals are included
checklistTemplateSchema.set('toJSON', { virtuals: true });
checklistTemplateSchema.set('toObject', { virtuals: true });

// Pre-built default templates (seeded on first load)
checklistTemplateSchema.statics.getDefaultTemplates = function() {
  return [
    {
      name: 'New Hire Driver Compliance',
      description: 'Complete checklist for onboarding new CDL drivers per FMCSA requirements',
      category: 'onboarding',
      isDefault: true,
      items: [
        { title: 'Employment Application (49 CFR 391.21)', description: 'Complete driver employment application', order: 1, required: true },
        { title: 'CDL Copy & Verification', description: 'Copy of valid CDL and verify with issuing state', order: 2, required: true },
        { title: 'Medical Certificate', description: 'Current medical examiner certificate', order: 3, required: true },
        { title: 'MVR Review', description: 'Motor Vehicle Record from each state driven in past 3 years', order: 4, required: true },
        { title: 'Road Test or Certificate', description: 'Road test certification or equivalent experience', order: 5, required: true },
        { title: 'Pre-Employment Drug Test', description: 'Negative pre-employment drug screen', order: 6, required: true },
        { title: 'Clearinghouse Query', description: 'FMCSA Drug & Alcohol Clearinghouse query', order: 7, required: true },
        { title: 'Previous Employer Inquiry', description: 'Safety performance history from previous employers (3 years)', order: 8, required: true },
        { title: 'Annual Certification of Violations', description: 'Driver certification of violations (49 CFR 391.27)', order: 9, required: true },
        { title: 'Receipt of Regulations', description: 'Acknowledgment of receiving FMCSR regulations', order: 10, required: true }
      ]
    },
    {
      name: 'Annual Driver File Review',
      description: 'Yearly review of driver qualification file for compliance',
      category: 'file_review',
      isDefault: true,
      items: [
        { title: 'CDL Expiration Check', description: 'Verify CDL is current and not expired', order: 1, required: true },
        { title: 'Medical Certificate Expiration', description: 'Verify medical certificate is current', order: 2, required: true },
        { title: 'Annual MVR Review', description: 'Pull and review current MVR', order: 3, required: true },
        { title: 'Annual Certification of Violations', description: 'Obtain new annual certification', order: 4, required: true },
        { title: 'Clearinghouse Annual Query', description: 'Perform annual Clearinghouse query', order: 5, required: true },
        { title: 'Training Records Review', description: 'Verify required training is current', order: 6, required: false },
        { title: 'Performance Evaluation', description: 'Document driver safety performance review', order: 7, required: false }
      ]
    },
    {
      name: 'Vehicle Inspection File Setup',
      description: 'Required documentation for new vehicles',
      category: 'maintenance',
      isDefault: true,
      items: [
        { title: 'Title/Registration', description: 'Copy of vehicle title or registration', order: 1, required: true },
        { title: 'Annual DOT Inspection', description: 'Current annual inspection sticker and certificate', order: 2, required: true },
        { title: 'Insurance Card', description: 'Proof of insurance in vehicle', order: 3, required: true },
        { title: 'IFTA Decals', description: 'Current IFTA decals if applicable', order: 4, required: false },
        { title: 'IRP Cab Card', description: 'International Registration Plan cab card', order: 5, required: false },
        { title: 'Preventive Maintenance Schedule', description: 'Establish PM schedule and document', order: 6, required: true },
        { title: 'Emergency Equipment Check', description: 'Fire extinguisher, triangles, spare fuses', order: 7, required: true }
      ]
    },
    {
      name: 'Audit Readiness - Entry Level',
      description: 'Prepare for FMCSA new entrant or compliance audit',
      category: 'audit',
      isDefault: true,
      items: [
        { title: 'Driver Qualification Files Complete', description: 'All DQ files have required documents', order: 1, required: true },
        { title: 'Vehicle Maintenance Records', description: 'Maintenance records for all vehicles', order: 2, required: true },
        { title: 'Hours of Service Records', description: 'ELD or paper logs available for 6 months', order: 3, required: true },
        { title: 'Drug & Alcohol Program', description: 'D&A policy, testing records, Clearinghouse compliance', order: 4, required: true },
        { title: 'Accident Register', description: 'Complete accident register for 3 years', order: 5, required: true },
        { title: 'DVIR Records', description: 'Driver Vehicle Inspection Reports available', order: 6, required: true },
        { title: 'Insurance Documentation', description: 'Proof of required insurance levels', order: 7, required: true },
        { title: 'Operating Authority', description: 'MC authority and USDOT number current', order: 8, required: true }
      ]
    }
  ];
};

module.exports = mongoose.model('ChecklistTemplate', checklistTemplateSchema);
