const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for users
const userSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Business Information
  companyName: {
    type: String,
    trim: true
  },
  businessIndustry: {
    type: String,
    enum: ['technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'education', 'real-estate', 'consulting', 'other']
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+']
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // User Status and Role
  role: {
    type: String,
    enum: ['user', 'admin', 'partner'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Verification and Security
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

userSchema.methods.verifyEmail = function() {
  this.isEmailVerified = true;
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  this.status = 'active';
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' }).sort({ lastLogin: -1 });
};

userSchema.statics.findPendingUsers = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

userSchema.statics.getRecentUsers = function(limit = 5) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name email role status createdAt lastLogin');
};

userSchema.statics.searchUsers = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: regex },
      { email: regex },
      { companyName: regex }
    ]
  }).sort({ createdAt: -1 });
};

// Virtual for full profile completion
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const fields = ['name', 'email', 'phoneNumber', 'companyName', 'businessIndustry', 'companySize', 'website', 'description'];
  
  fields.forEach(field => {
    if (this[field] && this[field].toString().trim() !== '') {
      completion += 1;
    }
  });
  
  return Math.round((completion / fields.length) * 100);
});

// Virtual for user display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    return ret;
  }
});
userSchema.set('toObject', { virtuals: true });

// Create and export the model
const User = mongoose.model('User', userSchema);

module.exports = User;


