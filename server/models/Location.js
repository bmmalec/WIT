const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      required: [true, 'Location type is required'],
      enum: [
        'house',
        'warehouse',
        'storage_unit',
        'office',
        'vehicle',
        'room',
        'zone',
        'container',
        'garage',
        'basement',
        'attic',
        'kitchen',
        'bedroom',
        'bathroom',
        'workshop',
        'living_room',
        'closet',
        'cabinet',
        'drawer',
        'shelf',
        'box',
        'bin',
        'custom',
      ],
    },
    customType: {
      type: String,
      trim: true,
      maxlength: [50, 'Custom type cannot exceed 50 characters'],
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
      ref: 'Location',
      default: null,
      index: true,
    },
    // Materialized path pattern: ",id1,id2,id3,"
    path: {
      type: String,
      required: true,
      index: true,
    },
    depth: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    // Cached counts for performance
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    childCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    capacity: {
      type: {
        type: String,
        enum: ['unlimited', 'slots', 'volume'],
        default: 'unlimited',
      },
      max: {
        type: Number,
        min: 0,
      },
      used: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
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

// Compound indexes
locationSchema.index({ ownerId: 1, parentId: 1 });
locationSchema.index({ ownerId: 1, name: 'text' });

// Virtual for children (populated on demand)
locationSchema.virtual('children', {
  ref: 'Location',
  localField: '_id',
  foreignField: 'parentId',
});

/**
 * Static: Get full location tree for a user
 * @param {ObjectId} ownerId - User ID
 * @returns {Promise<Array>} Nested tree structure
 */
locationSchema.statics.getTree = async function (ownerId) {
  const locations = await this.find({ ownerId, isActive: true })
    .sort({ depth: 1, name: 1 })
    .lean();

  // Build tree structure
  const locationMap = new Map();
  const roots = [];

  // First pass: create map of all locations
  locations.forEach((loc) => {
    loc.children = [];
    locationMap.set(loc._id.toString(), loc);
  });

  // Second pass: build tree
  locations.forEach((loc) => {
    if (loc.parentId) {
      const parent = locationMap.get(loc.parentId.toString());
      if (parent) {
        parent.children.push(loc);
      }
    } else {
      roots.push(loc);
    }
  });

  return roots;
};

/**
 * Static: Get ancestor locations from path
 * @param {String} path - Materialized path
 * @returns {Promise<Array>} Ancestor locations in order
 */
locationSchema.statics.getAncestors = async function (path) {
  if (!path || path === ',') return [];

  // Extract IDs from path (format: ",id1,id2,id3,")
  const ids = path
    .split(',')
    .filter((id) => id.length > 0)
    .map((id) => new mongoose.Types.ObjectId(id));

  if (ids.length === 0) return [];

  // Remove the last ID (current location)
  ids.pop();

  if (ids.length === 0) return [];

  const ancestors = await this.find({ _id: { $in: ids } }).lean();

  // Sort by path order
  const idOrder = new Map(ids.map((id, index) => [id.toString(), index]));
  ancestors.sort((a, b) => idOrder.get(a._id.toString()) - idOrder.get(b._id.toString()));

  return ancestors;
};

/**
 * Static: Get all descendant locations
 * @param {ObjectId} locationId - Parent location ID
 * @returns {Promise<Array>} All descendant locations
 */
locationSchema.statics.getDescendants = async function (locationId) {
  const location = await this.findById(locationId);
  if (!location) return [];

  // Find all locations whose path contains this location's ID
  const pathPattern = new RegExp(`,${locationId.toString()},`);
  return this.find({
    path: pathPattern,
    _id: { $ne: locationId },
    isActive: true,
  }).sort({ depth: 1, name: 1 });
};

/**
 * Instance: Check if this location is a descendant of another
 * @param {ObjectId} ancestorId - Potential ancestor ID
 * @returns {Boolean}
 */
locationSchema.methods.isDescendantOf = function (ancestorId) {
  if (!this.path) return false;
  return this.path.includes(`,${ancestorId.toString()},`);
};

/**
 * Instance: Get full path as array of location names
 * @returns {Promise<Array<String>>} Array of ancestor names including self
 */
locationSchema.methods.getFullPath = async function () {
  const ancestors = await this.constructor.getAncestors(this.path);
  const names = ancestors.map((a) => a.name);
  names.push(this.name);
  return names;
};

/**
 * Pre-save: Validate parent exists and belongs to same owner
 */
locationSchema.pre('save', async function (next) {
  if (this.parentId && this.isModified('parentId')) {
    const parent = await this.constructor.findById(this.parentId);

    if (!parent) {
      return next(new Error('Parent location not found'));
    }

    if (parent.ownerId.toString() !== this.ownerId.toString()) {
      return next(new Error('Parent location must belong to the same owner'));
    }

    // Prevent circular references
    if (this._id && parent.path.includes(`,${this._id.toString()},`)) {
      return next(new Error('Circular reference detected'));
    }
  }

  next();
});

/**
 * Post-save: Update parent's childCount
 */
locationSchema.post('save', async function (doc) {
  if (doc.parentId) {
    await this.constructor.findByIdAndUpdate(doc.parentId, {
      $inc: { childCount: 1 },
    });
  }
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
