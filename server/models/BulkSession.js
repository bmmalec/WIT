const mongoose = require('mongoose');

/**
 * BulkSession Schema
 * Stores state for bulk import sessions
 */
const bulkSessionSchema = new mongoose.Schema(
  {
    // User who owns this session
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Current target location for new items
    targetLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },

    // Optional default category for new items
    defaultCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    // Session status
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },

    // Pending items (not yet committed to inventory)
    pendingItems: [{
      // Temporary ID for this pending item
      tempId: {
        type: String,
        required: true,
      },
      // Item data (same structure as Item model)
      name: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
      itemType: {
        type: String,
        enum: ['tool', 'supply', 'part', 'consumable', 'equipment', 'other'],
        default: 'other',
      },
      brand: String,
      model: String,
      quantity: {
        value: { type: Number, default: 1 },
        unit: { type: String, default: 'each' },
      },
      images: [{
        url: String,
        thumbnailUrl: String,
        isPrimary: { type: Boolean, default: false },
      }],
      alternateNames: [String],
      tags: [String],
      barcode: {
        code: String,
        type: String,
      },
      perishable: {
        isPerishable: { type: Boolean, default: false },
        expirationDate: Date,
        storageType: {
          type: String,
          enum: ['pantry', 'refrigerated', 'frozen'],
        },
        expirationPeriodIndex: Number,
      },
      // Location at time of scan (may differ from current target)
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true,
      },
      // Identification source
      source: {
        type: String,
        enum: ['manual', 'ai-scan', 'barcode', 'upc-lookup'],
        default: 'manual',
      },
      // Confidence score for AI identifications
      confidence: Number,
      // Whether user has reviewed/edited this item
      reviewed: {
        type: Boolean,
        default: false,
      },
      // Timestamp when scanned
      scannedAt: {
        type: Date,
        default: Date.now,
      },
    }],

    // Session statistics
    stats: {
      totalScanned: { type: Number, default: 0 },
      committed: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
    },

    // Session name/notes
    name: {
      type: String,
      trim: true,
      default: '',
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // When the session started
    startedAt: {
      type: Date,
      default: Date.now,
    },

    // When the session was completed/cancelled
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bulkSessionSchema.index({ userId: 1, status: 1 });
bulkSessionSchema.index({ userId: 1, createdAt: -1 });

// Virtual for pending item count
bulkSessionSchema.virtual('pendingCount').get(function () {
  return this.pendingItems.length;
});

// Instance method: Add a pending item
bulkSessionSchema.methods.addPendingItem = function (itemData) {
  const tempId = new mongoose.Types.ObjectId().toString();

  this.pendingItems.push({
    tempId,
    ...itemData,
    locationId: itemData.locationId || this.targetLocationId,
    categoryId: itemData.categoryId || this.defaultCategoryId,
    scannedAt: new Date(),
  });

  this.stats.totalScanned += 1;

  return tempId;
};

// Instance method: Remove a pending item
bulkSessionSchema.methods.removePendingItem = function (tempId) {
  const index = this.pendingItems.findIndex(p => p.tempId === tempId);
  if (index !== -1) {
    this.pendingItems.splice(index, 1);
    this.stats.rejected += 1;
    return true;
  }
  return false;
};

// Instance method: Update a pending item
bulkSessionSchema.methods.updatePendingItem = function (tempId, updates) {
  const item = this.pendingItems.find(p => p.tempId === tempId);
  if (item) {
    Object.assign(item, updates, { reviewed: true });
    return true;
  }
  return false;
};

// Instance method: Change target location
bulkSessionSchema.methods.changeTargetLocation = function (locationId) {
  this.targetLocationId = locationId;
};

// Instance method: Complete session
bulkSessionSchema.methods.complete = function () {
  this.status = 'completed';
  this.endedAt = new Date();
};

// Instance method: Cancel session
bulkSessionSchema.methods.cancel = function () {
  this.status = 'cancelled';
  this.endedAt = new Date();
};

// Instance method: Pause session
bulkSessionSchema.methods.pause = function () {
  if (this.status === 'active') {
    this.status = 'paused';
    return true;
  }
  return false;
};

// Instance method: Resume session
bulkSessionSchema.methods.resume = function () {
  if (this.status === 'paused') {
    this.status = 'active';
    return true;
  }
  return false;
};

// Static method: Get active session for user
bulkSessionSchema.statics.getActiveSession = function (userId) {
  return this.findOne({ userId, status: 'active' })
    .populate('targetLocationId', 'name icon type')
    .populate('defaultCategoryId', 'name icon color');
};

// Static method: Get active or paused session for user (resumable)
bulkSessionSchema.statics.getResumableSession = function (userId) {
  return this.findOne({ userId, status: { $in: ['active', 'paused'] } })
    .populate('targetLocationId', 'name icon type')
    .populate('defaultCategoryId', 'name icon color');
};

// Transform output
bulkSessionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('BulkSession', bulkSessionSchema);
