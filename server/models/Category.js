const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    // User who created this category (null for system categories)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1, sortOrder: 1 });
categorySchema.index({ isSystem: 1, isActive: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

/**
 * Static: Get all categories as tree
 * @param {ObjectId} ownerId - Optional user ID for custom categories
 * @returns {Promise<Array>} Nested tree structure
 */
categorySchema.statics.getTree = async function (ownerId = null) {
  const query = { isActive: true };

  // Get system categories and user's custom categories
  if (ownerId) {
    query.$or = [{ isSystem: true }, { ownerId }];
  } else {
    query.isSystem = true;
  }

  const categories = await this.find(query)
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Build tree structure
  const categoryMap = new Map();
  const roots = [];

  // First pass: create map
  categories.forEach((cat) => {
    cat.subcategories = [];
    categoryMap.set(cat._id.toString(), cat);
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId.toString());
      if (parent) {
        parent.subcategories.push(cat);
      }
    } else {
      roots.push(cat);
    }
  });

  return roots;
};

/**
 * Static: Get flat list of categories
 * @param {ObjectId} ownerId - Optional user ID for custom categories
 * @returns {Promise<Array>} Flat list
 */
categorySchema.statics.getList = async function (ownerId = null) {
  const query = { isActive: true };

  if (ownerId) {
    query.$or = [{ isSystem: true }, { ownerId }];
  } else {
    query.isSystem = true;
  }

  return this.find(query)
    .populate('parentId', 'name slug icon')
    .sort({ sortOrder: 1, name: 1 })
    .lean();
};

/**
 * Static: Find by slug
 * @param {String} slug - Category slug
 * @returns {Promise<Object>} Category
 */
categorySchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

/**
 * Pre-save: Generate slug if not provided
 */
categorySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
