const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    // Ownership
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Location
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required'],
      index: true,
    },

    // Position within container (e.g., "Drawer 1", "Shelf A")
    position: {
      type: String,
      trim: true,
      maxlength: [50, 'Position cannot exceed 50 characters'],
    },

    // Basic Info
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // Alternate names for search
    alternateNames: [{
      type: String,
      trim: true,
      maxlength: [100, 'Alternate name cannot exceed 100 characters'],
    }],

    // Category
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },

    // Item Type
    itemType: {
      type: String,
      enum: ['tool', 'supply', 'part', 'consumable', 'equipment', 'other'],
      default: 'other',
    },

    // Product Details
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },

    model: {
      type: String,
      trim: true,
      maxlength: [50, 'Model cannot exceed 50 characters'],
    },

    sku: {
      type: String,
      trim: true,
      maxlength: [50, 'SKU cannot exceed 50 characters'],
    },

    barcode: {
      type: String,
      trim: true,
      maxlength: [50, 'Barcode cannot exceed 50 characters'],
    },

    // Size/Dimensions
    size: {
      type: String,
      trim: true,
      maxlength: [50, 'Size cannot exceed 50 characters'],
    },

    // Tags for filtering
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag cannot exceed 30 characters'],
    }],

    // Quantity
    quantity: {
      value: {
        type: Number,
        default: 1,
        min: [0, 'Quantity cannot be negative'],
      },
      unit: {
        type: String,
        enum: ['each', 'box', 'pack', 'lb', 'oz', 'kg', 'g', 'l', 'ml', 'ft', 'in', 'm', 'cm'],
        default: 'each',
      },
      minAlert: {
        type: Number,
        min: 0,
        default: null,
      },
    },

    // Value tracking
    value: {
      purchasePrice: {
        type: Number,
        min: 0,
      },
      currentValue: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        maxlength: 3,
      },
      purchaseDate: {
        type: Date,
      },
      vendor: {
        type: String,
        trim: true,
        maxlength: [100, 'Vendor cannot exceed 100 characters'],
      },
    },

    // Images
    images: [{
      url: {
        type: String,
        required: true,
      },
      thumbnailUrl: {
        type: String,
      },
      isPrimary: {
        type: Boolean,
        default: false,
      },
      caption: {
        type: String,
        trim: true,
        maxlength: [200, 'Caption cannot exceed 200 characters'],
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],

    // Perishable info (for Milestone 3)
    perishable: {
      isPerishable: {
        type: Boolean,
        default: false,
      },
      // Printed expiration date on package
      expirationDate: {
        type: Date,
      },
      // User's extended "use by" date (when they're comfortable using it)
      extendedExpirationDate: {
        type: Date,
      },
      batchNumber: {
        type: String,
        trim: true,
      },
    },

    // Location history
    locationHistory: [{
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
      },
      movedAt: {
        type: Date,
        default: Date.now,
      },
      movedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],

    // Consumable tracking
    consumedAt: {
      type: Date,
      default: null,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
itemSchema.index({ ownerId: 1, locationId: 1 });
itemSchema.index({ ownerId: 1, isActive: 1 });
itemSchema.index({ ownerId: 1, categoryId: 1 });
itemSchema.index({ ownerId: 1, 'tags': 1 });
itemSchema.index(
  { name: 'text', description: 'text', alternateNames: 'text', brand: 'text', model: 'text' },
  { weights: { name: 10, alternateNames: 8, brand: 5, model: 5, description: 1 } }
);

// Virtual: Primary image
itemSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

// Virtual: Is low stock
itemSchema.virtual('isLowStock').get(function () {
  if (!this.quantity.minAlert) return false;
  return this.quantity.value <= this.quantity.minAlert;
});

// Virtual: Is expired
itemSchema.virtual('isExpired').get(function () {
  if (!this.perishable.isPerishable || !this.perishable.expirationDate) return false;
  return new Date() > new Date(this.perishable.expirationDate);
});

/**
 * Static: Get items for a location
 * @param {ObjectId} locationId - Location ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Items
 */
itemSchema.statics.findByLocation = async function (locationId, options = {}) {
  const query = { locationId, isActive: true };

  if (options.categoryId) {
    query.categoryId = options.categoryId;
  }

  if (options.itemType) {
    query.itemType = options.itemType;
  }

  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }

  let queryBuilder = this.find(query);

  if (options.populate) {
    queryBuilder = queryBuilder
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon');
  }

  if (options.sort) {
    queryBuilder = queryBuilder.sort(options.sort);
  } else {
    queryBuilder = queryBuilder.sort({ name: 1 });
  }

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  if (options.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }

  return queryBuilder.lean();
};

/**
 * Static: Search items
 * @param {ObjectId} ownerId - Owner ID
 * @param {String} searchText - Search query
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Matching items
 */
itemSchema.statics.search = async function (ownerId, searchText, options = {}) {
  const query = {
    ownerId,
    isActive: true,
    $text: { $search: searchText },
  };

  if (options.categoryId) {
    query.categoryId = options.categoryId;
  }

  if (options.locationId) {
    query.locationId = options.locationId;
  }

  let queryBuilder = this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });

  if (options.populate) {
    queryBuilder = queryBuilder
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon');
  }

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  return queryBuilder.lean();
};

/**
 * Static: Get low stock items
 * @param {ObjectId} ownerId - Owner ID
 * @returns {Promise<Array>} Low stock items
 */
itemSchema.statics.getLowStock = async function (ownerId) {
  return this.find({
    ownerId,
    isActive: true,
    'quantity.minAlert': { $exists: true, $ne: null },
    $expr: { $lte: ['$quantity.value', '$quantity.minAlert'] },
  })
    .populate('locationId', 'name icon')
    .sort({ 'quantity.value': 1 })
    .lean();
};

/**
 * Static: Get expiring items
 * @param {ObjectId} ownerId - Owner ID
 * @param {Number} daysAhead - Days to look ahead
 * @returns {Promise<Array>} Expiring items
 */
itemSchema.statics.getExpiring = async function (ownerId, daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    ownerId,
    isActive: true,
    'perishable.isPerishable': true,
    'perishable.expirationDate': { $lte: futureDate },
  })
    .populate('locationId', 'name icon')
    .sort({ 'perishable.expirationDate': 1 })
    .lean();
};

/**
 * Instance: Move item to new location
 * @param {ObjectId} newLocationId - New location ID
 * @param {ObjectId} movedBy - User who moved the item
 */
itemSchema.methods.moveTo = async function (newLocationId, movedBy) {
  const Location = mongoose.model('Location');

  // Add to location history
  this.locationHistory.push({
    locationId: this.locationId,
    movedAt: new Date(),
    movedBy,
  });

  // Update counts
  await Location.findByIdAndUpdate(this.locationId, { $inc: { itemCount: -1 } });
  await Location.findByIdAndUpdate(newLocationId, { $inc: { itemCount: 1 } });

  // Update location
  this.locationId = newLocationId;
  await this.save();
};

/**
 * Instance: Adjust quantity
 * @param {Number} adjustment - Amount to adjust (positive or negative)
 */
itemSchema.methods.adjustQuantity = async function (adjustment) {
  const newValue = this.quantity.value + adjustment;
  if (newValue < 0) {
    throw new Error('Quantity cannot be negative');
  }
  this.quantity.value = newValue;
  await this.save();
};

/**
 * Instance: Mark as consumed
 */
itemSchema.methods.markConsumed = async function () {
  this.consumedAt = new Date();
  if (this.quantity.value > 0) {
    this.quantity.value = 0;
  }
  this.isActive = false;
  await this.save();
};

/**
 * Pre-save: Update location item count for new items
 */
itemSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Location = mongoose.model('Location');
    await Location.findByIdAndUpdate(this.locationId, { $inc: { itemCount: 1 } });
  }
  next();
});

/**
 * Post-remove: Decrement location item count
 */
itemSchema.post('remove', async function (doc) {
  const Location = mongoose.model('Location');
  await Location.findByIdAndUpdate(doc.locationId, { $inc: { itemCount: -1 } });
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
