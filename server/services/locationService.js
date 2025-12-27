const Location = require('../models/Location');
const AppError = require('../utils/AppError');

class LocationService {
  /**
   * Create a new location
   * @param {ObjectId} ownerId - User ID
   * @param {Object} data - Location data
   * @returns {Promise<Object>} Created location
   */
  async create(ownerId, data) {
    const { name, description, type, customType, icon, color, parentId, address, capacity } = data;

    let path;
    let depth = 0;

    // If parentId provided, get parent and build path
    if (parentId) {
      const parent = await Location.findById(parentId);

      if (!parent) {
        throw AppError.notFound('Parent location not found', 'PARENT_NOT_FOUND');
      }

      if (parent.ownerId.toString() !== ownerId.toString()) {
        throw AppError.forbidden('Parent location does not belong to you', 'FORBIDDEN');
      }

      if (!parent.isActive) {
        throw AppError.badRequest('Cannot create location under inactive parent', 'INACTIVE_PARENT');
      }

      depth = parent.depth + 1;
      // Path will be set after we have the new ID
    }

    // Create the location (path set temporarily)
    const location = new Location({
      ownerId,
      name,
      description,
      type,
      customType: type === 'custom' ? customType : undefined,
      icon,
      color,
      parentId: parentId || null,
      path: ',temp,', // Temporary, will be updated
      depth,
      address,
      capacity,
    });

    // Now set the correct path with the new ID
    if (parentId) {
      const parent = await Location.findById(parentId);
      location.path = `${parent.path}${location._id},`;
    } else {
      location.path = `,${location._id},`;
    }

    await location.save();

    // Update parent's childCount
    if (parentId) {
      await Location.findByIdAndUpdate(parentId, {
        $inc: { childCount: 1 },
      });
    }

    return location.toJSON();
  }

  /**
   * Get all locations for a user
   * @param {ObjectId} ownerId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Locations
   */
  async getAll(ownerId, options = {}) {
    const { includeInactive = false, parentId } = options;

    const query = { ownerId };

    if (!includeInactive) {
      query.isActive = true;
    }

    if (parentId !== undefined) {
      query.parentId = parentId || null;
    }

    const locations = await Location.find(query)
      .sort({ depth: 1, name: 1 })
      .lean();

    return locations;
  }

  /**
   * Get location tree for a user
   * @param {ObjectId} ownerId - User ID
   * @returns {Promise<Array>} Nested tree structure
   */
  async getTree(ownerId) {
    return Location.getTree(ownerId);
  }

  /**
   * Get a single location by ID
   * @param {ObjectId} userId - User ID (for permission check)
   * @param {ObjectId} locationId - Location ID
   * @returns {Promise<Object>} Location
   */
  async getById(userId, locationId) {
    const location = await Location.findById(locationId);

    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    // Check ownership (later we'll add sharing permission check)
    if (location.ownerId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this location', 'FORBIDDEN');
    }

    return location.toJSON();
  }

  /**
   * Update a location
   * @param {ObjectId} userId - User ID (for permission check)
   * @param {ObjectId} locationId - Location ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated location
   */
  async update(userId, locationId, updates) {
    const location = await Location.findById(locationId);

    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    if (location.ownerId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this location', 'FORBIDDEN');
    }

    // Allowed fields to update
    const allowedUpdates = ['name', 'description', 'type', 'customType', 'icon', 'color', 'address', 'capacity'];

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        if (field === 'address' || field === 'capacity') {
          // Merge nested objects
          location[field] = { ...location[field]?.toObject?.() || location[field], ...updates[field] };
        } else {
          location[field] = updates[field];
        }
      }
    }

    // Handle customType
    if (location.type !== 'custom') {
      location.customType = undefined;
    }

    await location.save();

    return location.toJSON();
  }

  /**
   * Delete (soft delete) a location
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} locationId - Location ID
   * @param {Object} options - Delete options
   * @returns {Promise<void>}
   */
  async delete(userId, locationId, options = {}) {
    const { cascade = false } = options;

    const location = await Location.findById(locationId);

    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    if (location.ownerId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this location', 'FORBIDDEN');
    }

    // Check for children
    const childCount = await Location.countDocuments({
      parentId: locationId,
      isActive: true,
    });

    if (childCount > 0 && !cascade) {
      throw AppError.badRequest(
        'Location has child locations. Use cascade=true to delete all.',
        'HAS_CHILDREN',
        { childCount }
      );
    }

    // TODO: Check for items (when Item model is implemented)

    if (cascade) {
      // Soft delete all descendants
      const descendants = await Location.getDescendants(locationId);
      const descendantIds = descendants.map((d) => d._id);

      await Location.updateMany(
        { _id: { $in: [...descendantIds, locationId] } },
        { isActive: false }
      );
    } else {
      location.isActive = false;
      await location.save();
    }

    // Update parent's childCount
    if (location.parentId) {
      await Location.findByIdAndUpdate(location.parentId, {
        $inc: { childCount: -1 },
      });
    }
  }

  /**
   * Get location with ancestors (breadcrumb)
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} locationId - Location ID
   * @returns {Promise<Object>} Location with ancestors
   */
  async getWithAncestors(userId, locationId) {
    const location = await this.getById(userId, locationId);
    const ancestors = await Location.getAncestors(location.path);

    return {
      ...location,
      ancestors,
    };
  }
}

module.exports = new LocationService();
