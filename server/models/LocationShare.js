const mongoose = require('mongoose');
const crypto = require('crypto');

const locationShareSchema = new mongoose.Schema(
  {
    // The location being shared
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    // The user who has access (null until invite is accepted)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Email of the invited user
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Permission level
    permission: {
      type: String,
      enum: ['viewer', 'contributor', 'editor', 'manager'],
      required: true,
    },
    // Whether permission applies to child locations
    inheritToChildren: {
      type: Boolean,
      default: true,
    },
    // Invitation status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'revoked'],
      default: 'pending',
    },
    // Unique token for invite link
    inviteToken: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    // Who sent the invitation
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // When the invitation was sent
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    // When the invitation was accepted
    acceptedAt: {
      type: Date,
      default: null,
    },
    // When the invitation expires
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index: one invite per email per location
locationShareSchema.index({ locationId: 1, email: 1 }, { unique: true });

// Index for finding user's shares
locationShareSchema.index({ userId: 1, status: 1 });

// Index for finding by invite token
locationShareSchema.index({ inviteToken: 1 });

// Index for finding pending invites by email
locationShareSchema.index({ email: 1, status: 1 });

/**
 * Generate a secure invite token
 */
locationShareSchema.statics.generateInviteToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Find pending invites for an email
 */
locationShareSchema.statics.findPendingInvites = async function (email) {
  const now = new Date();
  return this.find({
    email: email.toLowerCase(),
    status: 'pending',
    expiresAt: { $gt: now },
  })
    .populate('locationId', 'name type icon')
    .populate('invitedBy', 'name email')
    .lean();
};

/**
 * Find shares for a location
 */
locationShareSchema.statics.findByLocation = async function (locationId) {
  return this.find({ locationId })
    .populate('userId', 'name email avatar')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Find accepted shares for a user
 */
locationShareSchema.statics.findByUser = async function (userId) {
  return this.find({
    userId,
    status: 'accepted',
  })
    .populate('locationId', 'name type icon path')
    .populate('invitedBy', 'name email')
    .lean();
};

/**
 * Check if user has access to a location
 */
locationShareSchema.statics.hasAccess = async function (userId, locationId, requiredPermission = 'viewer') {
  const permissionLevels = {
    viewer: 1,
    contributor: 2,
    editor: 3,
    manager: 4,
  };

  const share = await this.findOne({
    locationId,
    userId,
    status: 'accepted',
  });

  if (!share) return false;

  return permissionLevels[share.permission] >= permissionLevels[requiredPermission];
};

/**
 * Get user's permission level for a location
 */
locationShareSchema.statics.getPermission = async function (userId, locationId) {
  const share = await this.findOne({
    locationId,
    userId,
    status: 'accepted',
  });

  return share ? share.permission : null;
};

/**
 * Pre-save middleware to generate invite token if not set
 */
locationShareSchema.pre('save', function (next) {
  if (this.isNew && !this.inviteToken && this.status === 'pending') {
    this.inviteToken = this.constructor.generateInviteToken();
  }
  next();
});

/**
 * Instance method to accept the invitation
 */
locationShareSchema.methods.accept = async function (userId) {
  this.status = 'accepted';
  this.userId = userId;
  this.acceptedAt = new Date();
  this.inviteToken = undefined; // Clear the token
  return this.save();
};

/**
 * Instance method to decline the invitation
 */
locationShareSchema.methods.decline = async function () {
  this.status = 'declined';
  this.inviteToken = undefined;
  return this.save();
};

/**
 * Instance method to revoke the share
 */
locationShareSchema.methods.revoke = async function () {
  this.status = 'revoked';
  this.inviteToken = undefined;
  return this.save();
};

/**
 * Check if invitation has expired
 */
locationShareSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

const LocationShare = mongoose.model('LocationShare', locationShareSchema);

module.exports = LocationShare;
