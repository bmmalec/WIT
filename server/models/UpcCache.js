/**
 * UPC Cache Model
 * Caches product lookups from external APIs
 */

const mongoose = require('mongoose');

const upcCacheSchema = new mongoose.Schema(
  {
    // Barcode/UPC code
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // Barcode format (upc, ean, etc.)
    format: {
      type: String,
      trim: true,
    },

    // Product found
    found: {
      type: Boolean,
      default: false,
    },

    // Product info
    name: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
    },

    // Product image URL
    imageUrl: {
      type: String,
      trim: true,
    },

    // Nutrition info (for food products)
    nutrition: {
      servingSize: String,
      calories: Number,
      fat: Number,
      carbs: Number,
      protein: Number,
      sodium: Number,
      sugar: Number,
      fiber: Number,
    },

    // Ingredients
    ingredients: {
      type: String,
      trim: true,
    },

    // Allergens
    allergens: [{
      type: String,
      trim: true,
    }],

    // Source API
    source: {
      type: String,
      enum: ['open_food_facts', 'upc_database', 'manual', 'unknown'],
      default: 'unknown',
    },

    // Raw API response (for debugging)
    rawData: {
      type: mongoose.Schema.Types.Mixed,
    },

    // When this was fetched
    fetchedAt: {
      type: Date,
      default: Date.now,
    },

    // Cache expiration (30 days default)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic cache expiration
upcCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Static: Find by code if not expired
 */
upcCacheSchema.statics.findByCode = async function (code) {
  const cached = await this.findOne({
    code,
    expiresAt: { $gt: new Date() },
  });
  return cached;
};

/**
 * Static: Cache a product lookup result
 */
upcCacheSchema.statics.cacheResult = async function (code, data) {
  const cacheData = {
    code,
    found: data.found || false,
    name: data.name,
    brand: data.brand,
    description: data.description,
    category: data.category,
    imageUrl: data.imageUrl,
    nutrition: data.nutrition,
    ingredients: data.ingredients,
    allergens: data.allergens,
    source: data.source || 'unknown',
    format: data.format,
    rawData: data.rawData,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };

  return this.findOneAndUpdate(
    { code },
    cacheData,
    { upsert: true, new: true }
  );
};

const UpcCache = mongoose.model('UpcCache', upcCacheSchema);

module.exports = UpcCache;
