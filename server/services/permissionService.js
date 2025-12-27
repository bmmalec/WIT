const LocationShare = require('../models/LocationShare');
const Location = require('../models/Location');

// Permission level hierarchy
const PERMISSION_LEVELS = {
  viewer: 1,
  contributor: 2,
  editor: 3,
  manager: 4,
  owner: 5, // Implicit, not stored in shares
};

class PermissionService {
  /**
   * Check if user can access a location with required permission
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} locationId - Location ID
   * @param {string} requiredPermission - Minimum required permission
   * @returns {Promise<boolean>} Whether user has access
   */
  async canAccessLocation(userId, locationId, requiredPermission = 'viewer') {
    const location = await Location.findById(locationId);
    if (!location) return false;

    // Owner always has full access
    if (location.ownerId.toString() === userId.toString()) {
      return true;
    }

    // Check direct share on this location
    const directShare = await LocationShare.findOne({
      locationId,
      userId,
      status: 'accepted',
    });

    if (directShare) {
      return PERMISSION_LEVELS[directShare.permission] >= PERMISSION_LEVELS[requiredPermission];
    }

    // Check inherited shares from parent locations
    if (location.path) {
      const ancestorIds = location.path
        .split(',')
        .filter(id => id && id !== location._id.toString());

      if (ancestorIds.length > 0) {
        const inheritedShare = await LocationShare.findOne({
          locationId: { $in: ancestorIds },
          userId,
          status: 'accepted',
          inheritToChildren: true,
        }).sort({ createdAt: -1 }); // Most recent takes precedence

        if (inheritedShare) {
          return PERMISSION_LEVELS[inheritedShare.permission] >= PERMISSION_LEVELS[requiredPermission];
        }
      }
    }

    return false;
  }

  /**
   * Get all location IDs a user can access
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array<ObjectId>>} Accessible location IDs
   */
  async getAccessibleLocationIds(userId) {
    // Get owned locations
    const ownedLocations = await Location.find({ ownerId: userId, isActive: true })
      .select('_id')
      .lean();
    const ownedIds = ownedLocations.map(l => l._id);

    // Get directly shared locations
    const shares = await LocationShare.find({
      userId,
      status: 'accepted',
    }).lean();

    const sharedIds = shares.map(s => s.locationId);

    // For shares that inherit to children, get all descendant locations
    const inheritedShares = shares.filter(s => s.inheritToChildren);
    const inheritedLocations = [];

    for (const share of inheritedShares) {
      const location = await Location.findById(share.locationId);
      if (location) {
        const descendants = await Location.find({
          path: { $regex: `,${share.locationId},` },
          isActive: true,
        }).select('_id').lean();
        inheritedLocations.push(...descendants.map(d => d._id));
      }
    }

    // Combine and deduplicate
    const allIds = [...ownedIds, ...sharedIds, ...inheritedLocations];
    const uniqueIds = [...new Set(allIds.map(id => id.toString()))];

    return uniqueIds;
  }

  /**
   * Get user's permission level for a location
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} locationId - Location ID
   * @returns {Promise<string|null>} Permission level or null
   */
  async getPermissionLevel(userId, locationId) {
    const location = await Location.findById(locationId);
    if (!location) return null;

    // Owner has highest permission
    if (location.ownerId.toString() === userId.toString()) {
      return 'owner';
    }

    // Check direct share
    const directShare = await LocationShare.findOne({
      locationId,
      userId,
      status: 'accepted',
    });

    if (directShare) {
      return directShare.permission;
    }

    // Check inherited shares
    if (location.path) {
      const ancestorIds = location.path
        .split(',')
        .filter(id => id && id !== location._id.toString());

      if (ancestorIds.length > 0) {
        const inheritedShare = await LocationShare.findOne({
          locationId: { $in: ancestorIds },
          userId,
          status: 'accepted',
          inheritToChildren: true,
        }).sort({ createdAt: -1 });

        if (inheritedShare) {
          return inheritedShare.permission;
        }
      }
    }

    return null;
  }

  /**
   * Check if user is the owner of a location
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} locationId - Location ID
   * @returns {Promise<boolean>} Whether user is owner
   */
  async isOwner(userId, locationId) {
    const location = await Location.findById(locationId);
    if (!location) return false;
    return location.ownerId.toString() === userId.toString();
  }

  /**
   * Get permission level value for comparison
   * @param {string} permission - Permission name
   * @returns {number} Permission level value
   */
  getPermissionValue(permission) {
    return PERMISSION_LEVELS[permission] || 0;
  }

  /**
   * Check if one permission is higher than or equal to another
   * @param {string} permission - Permission to check
   * @param {string} required - Required permission
   * @returns {boolean} Whether permission meets requirement
   */
  meetsRequirement(permission, required) {
    return PERMISSION_LEVELS[permission] >= PERMISSION_LEVELS[required];
  }
}

module.exports = new PermissionService();
