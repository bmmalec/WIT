const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
        message: 'Invalid email format',
      },
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include in queries by default
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    avatar: {
      type: String,
      default: null,
    },

    // User settings subdocument
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      defaultView: {
        type: String,
        enum: ['grid', 'list'],
        default: 'grid',
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },

    // Subscription tracking
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free',
      },
      stripeCustomerId: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },

    // Login attempt tracking for security
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });

// Virtual for checking if account is currently locked
userSchema.virtual('isCurrentlyLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// Pre-save hook: Hash password if modified
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Need to explicitly select passwordHash since it's excluded by default
  const user = await this.constructor.findById(this._id).select('+passwordHash');
  if (!user) return false;
  return bcrypt.compare(candidatePassword, user.passwordHash);
};

// Instance method: Generate JWT auth token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      tier: this.subscription.tier,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

// Instance method: Check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Instance method: Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Instance method: Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Static method: Find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method: Find user by email with password (for auth)
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+passwordHash');
};

// Transform output (remove sensitive fields)
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
