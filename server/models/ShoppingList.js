const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema({
  // Item name (required)
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },

  // Quantity needed
  quantity: {
    value: {
      type: Number,
      default: 1,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['each', 'box', 'pack', 'lb', 'oz', 'kg', 'g', 'l', 'ml', 'ft', 'in', 'm', 'cm'],
      default: 'each',
    },
  },

  // Optional reference to original inventory item
  sourceItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null,
  },

  // Source of the suggestion
  source: {
    type: String,
    enum: ['manual', 'consumed', 'low_stock', 'expired'],
    default: 'manual',
  },

  // Target location to add item when purchased
  targetLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null,
  },

  // Category for the item
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'purchased', 'skipped'],
    default: 'pending',
  },

  // Optional notes
  notes: {
    type: String,
    trim: true,
    maxlength: 200,
  },

  // Estimated price
  estimatedPrice: {
    type: Number,
    min: 0,
    default: null,
  },

  // Priority (1 = highest)
  priority: {
    type: Number,
    enum: [1, 2, 3],
    default: 2,
  },

  // When purchased
  purchasedAt: {
    type: Date,
    default: null,
  },

  // Added at
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const shoppingListSchema = new mongoose.Schema(
  {
    // Owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // List name
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Shopping List',
    },

    // Items in the list
    items: [shoppingItemSchema],

    // List status
    isActive: {
      type: Boolean,
      default: true,
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

// Virtual: Pending items count
shoppingListSchema.virtual('pendingCount').get(function () {
  return this.items.filter(item => item.status === 'pending').length;
});

// Virtual: Purchased items count
shoppingListSchema.virtual('purchasedCount').get(function () {
  return this.items.filter(item => item.status === 'purchased').length;
});

// Virtual: Total estimated cost
shoppingListSchema.virtual('estimatedTotal').get(function () {
  return this.items
    .filter(item => item.status === 'pending' && item.estimatedPrice)
    .reduce((sum, item) => sum + (item.estimatedPrice * item.quantity.value), 0);
});

/**
 * Get or create active shopping list for user
 */
shoppingListSchema.statics.getOrCreateForUser = async function (userId) {
  let list = await this.findOne({ userId, isActive: true })
    .populate('items.targetLocationId', 'name icon')
    .populate('items.categoryId', 'name icon color')
    .populate('items.sourceItemId', 'name images');

  if (!list) {
    list = new this({ userId });
    await list.save();
  }

  return list;
};

/**
 * Add item to list
 */
shoppingListSchema.methods.addItem = function (itemData) {
  // Check for duplicate by name (case-insensitive)
  const existing = this.items.find(
    item => item.name.toLowerCase() === itemData.name.toLowerCase() && item.status === 'pending'
  );

  if (existing) {
    // Update quantity instead of adding duplicate
    existing.quantity.value += itemData.quantity?.value || 1;
    return existing;
  }

  this.items.push({
    name: itemData.name,
    quantity: itemData.quantity || { value: 1, unit: 'each' },
    sourceItemId: itemData.sourceItemId || null,
    source: itemData.source || 'manual',
    targetLocationId: itemData.targetLocationId || null,
    categoryId: itemData.categoryId || null,
    notes: itemData.notes || null,
    estimatedPrice: itemData.estimatedPrice || null,
    priority: itemData.priority || 2,
  });

  return this.items[this.items.length - 1];
};

/**
 * Mark item as purchased
 */
shoppingListSchema.methods.markPurchased = function (itemId) {
  const item = this.items.id(itemId);
  if (item) {
    item.status = 'purchased';
    item.purchasedAt = new Date();
    return true;
  }
  return false;
};

/**
 * Mark item as skipped
 */
shoppingListSchema.methods.markSkipped = function (itemId) {
  const item = this.items.id(itemId);
  if (item) {
    item.status = 'skipped';
    return true;
  }
  return false;
};

/**
 * Remove item from list
 */
shoppingListSchema.methods.removeItem = function (itemId) {
  const item = this.items.id(itemId);
  if (item) {
    item.deleteOne();
    return true;
  }
  return false;
};

/**
 * Clear purchased items
 */
shoppingListSchema.methods.clearPurchased = function () {
  this.items = this.items.filter(item => item.status !== 'purchased');
};

/**
 * Clear all items
 */
shoppingListSchema.methods.clearAll = function () {
  this.items = [];
};

const ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);

module.exports = ShoppingList;
