const mongoose = require('mongoose');

// Define the schema for form submissions
const formSchema = new mongoose.Schema({
  // Form identification
  formType: {
    type: String,
    required: true,
    enum: ['residential', 'commercial', 'auto'],
    index: true
  },
  
  // Personal Information (Common to all forms)
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  birthDate: {
    type: String,
    required: true
  },
  
  // Membership and Insurance Information
  aaaMembershipId: {
    type: String,
    required: true,
    trim: true
  },
  insurancePolicyNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Ownership Information
  ownerType: {
    type: String,
    required: true,
    enum: ['myself', 'other']
  },
  ownerFullName: {
    type: String,
    trim: true,
    required: function() {
      return this.ownerType === 'other';
    }
  },
  ownerPhone: {
    type: String,
    trim: true,
    required: function() {
      return this.ownerType === 'other';
    }
  },
  
  // Residential/Commercial specific fields
  propertyType: {
    type: String,
    enum: ['singleFamily', 'condo', 'apartment', 'office', 'retail', 'industrial'],
    required: function() {
      return this.formType === 'residential' || this.formType === 'commercial';
    }
  },
  propertyAddress: {
    type: String,
    trim: true,
    required: function() {
      return this.formType === 'residential' || this.formType === 'commercial';
    }
  },
  
  // Auto specific fields
  vin: {
    type: String,
    trim: true,
    maxlength: 17,
    required: function() {
      return this.formType === 'auto';
    }
  },
  
  // Reference/Tech ID
  techId: {
    type: String,
    required: true,
    trim: true
  },
  
  // File Information (store file names/paths)
  // File attachments - stored as individual fields
  licenseFront: {
    originalname: String,
    size: Number,
    mimetype: String,
    data: String // base64 data
  },
  licenseBack: {
    originalname: String,
    size: Number,
    mimetype: String,
    data: String // base64 data
  },
  proofOfResidency: {
    originalname: String,
    size: Number,
    mimetype: String,
    data: String // base64 data
  },
  registration: {
    originalname: String,
    size: Number,
    mimetype: String,
    data: String // base64 data
  },
  licensePlate: {
    originalname: String,
    size: Number,
    mimetype: String,
    data: String // base64 data
  },
  insuranceProof: {
    originalname: String,
    size: Number,
    mimetype: String,
    data: String // base64 data
  },
  
  // Email Information
  emailSent: {
    type: Boolean,
    default: false
  },
  emailMessageId: {
    type: String,
    trim: true
  },
  userConfirmationSent: {
    type: Boolean,
    default: false
  },
  userConfirmationMessageId: {
    type: String,
    trim: true
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    trim: true
  },
  paymentAmount: {
    type: Number,
    min: 0
  },
  
  // Status and Processing
  status: {
    type: String,
    enum: ['submitted', 'processing', 'approved', 'rejected', 'completed'],
    default: 'submitted',
    index: true
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'form_submissions'
});

// Indexes for better query performance
formSchema.index({ email: 1, submittedAt: -1 });
formSchema.index({ formType: 1, status: 1 });
formSchema.index({ paymentStatus: 1 });

// Pre-save middleware to update the updatedAt field
formSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
formSchema.methods.markAsProcessed = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return this.save();
};

formSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  return this.save();
};

formSchema.methods.updatePaymentStatus = function(status, paymentIntentId = null) {
  this.paymentStatus = status;
  if (paymentIntentId) {
    this.paymentIntentId = paymentIntentId;
  }
  return this.save();
};

// Static methods
formSchema.statics.findByEmail = function(email) {
  return this.find({ email: email }).sort({ submittedAt: -1 });
};

formSchema.statics.findByFormType = function(formType) {
  return this.find({ formType: formType }).sort({ submittedAt: -1 });
};

formSchema.statics.findPendingPayments = function() {
  return this.find({ paymentStatus: 'pending' }).sort({ submittedAt: -1 });
};

formSchema.statics.getSubmissionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$formType',
        count: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0]
          }
        },
        processing: {
          $sum: {
            $cond: [{ $eq: ['$status', 'processing'] }, 1, 0]
          }
        },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Virtual for full name display
formSchema.virtual('displayName').get(function() {
  return this.fullName || 'Unknown User';
});

// Virtual for submission age
formSchema.virtual('submissionAge').get(function() {
  const now = new Date();
  const submitted = this.submittedAt;
  const diffTime = Math.abs(now - submitted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtual fields are serialized
formSchema.set('toJSON', { virtuals: true });
formSchema.set('toObject', { virtuals: true });

// Create and export the model
const FormSubmission = mongoose.model('FormSubmission', formSchema);

module.exports = FormSubmission;

