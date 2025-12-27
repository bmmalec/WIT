const Item = require('../models/Item');
const Location = require('../models/Location');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const permissionService = require('./permissionService');

class ItemService {
  /**
   * Create a new item
   * @param {ObjectId} userId - User creating the item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} Created item
   */
  async create(userId, data) {
    // Verify location exists and user has access
    const location = await Location.findById(data.locationId);
    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    // Check permission (need at least contributor)
    const hasAccess = await permissionService.canAccessLocation(userId, data.locationId, 'contributor');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to add items to this location', 'FORBIDDEN');
    }

    // Verify category if provided
    if (data.categoryId) {
      const category = await Category.findById(data.categoryId);
      if (!category || !category.isActive) {
        throw AppError.badRequest('Invalid category', 'INVALID_CATEGORY');
      }
    }

    // Create item
    const item = new Item({
      ...data,
      ownerId: location.ownerId, // Item belongs to location owner
    });

    await item.save();

    // Populate for response
    await item.populate('categoryId', 'name icon color');
    await item.populate('locationId', 'name icon type');

    return item.toJSON();
  }

  /**
   * Get item by ID
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} itemId - Item ID
   * @returns {Promise<Object>} Item
   */
  async getById(userId, itemId) {
    const item = await Item.findById(itemId)
      .populate('categoryId', 'name icon color slug')
      .populate('locationId', 'name icon type path')
      .populate('ownerId', 'name email');

    if (!item || !item.isActive) {
      throw AppError.notFound('Item not found', 'ITEM_NOT_FOUND');
    }

    // Check access
    const hasAccess = await permissionService.canAccessLocation(userId, item.locationId._id, 'viewer');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view this item', 'FORBIDDEN');
    }

    return item.toJSON();
  }

  /**
   * Get items for a location
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} locationId - Location ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Items
   */
  async getByLocation(userId, locationId, options = {}) {
    // Check access
    const hasAccess = await permissionService.canAccessLocation(userId, locationId, 'viewer');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view items in this location', 'FORBIDDEN');
    }

    const items = await Item.findByLocation(locationId, {
      ...options,
      populate: true,
    });

    return items;
  }

  /**
   * Search items
   * @param {ObjectId} userId - Requesting user
   * @param {String} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching items
   */
  async search(userId, query, options = {}) {
    // Get accessible location IDs
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);

    // Search within accessible locations
    const items = await Item.find({
      locationId: { $in: accessibleIds },
      isActive: true,
      $text: { $search: query },
    }, { score: { $meta: 'textScore' } })
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon type')
      .sort({ score: { $meta: 'textScore' } })
      .limit(options.limit || 50)
      .lean();

    return items;
  }

  /**
   * Update an item
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} itemId - Item ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated item
   */
  async update(userId, itemId, updates) {
    const item = await Item.findById(itemId);

    if (!item || !item.isActive) {
      throw AppError.notFound('Item not found', 'ITEM_NOT_FOUND');
    }

    // Check permission (need at least editor)
    const hasAccess = await permissionService.canAccessLocation(userId, item.locationId, 'editor');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to edit this item', 'FORBIDDEN');
    }

    // Validate category if being updated
    if (updates.categoryId) {
      const category = await Category.findById(updates.categoryId);
      if (!category || !category.isActive) {
        throw AppError.badRequest('Invalid category', 'INVALID_CATEGORY');
      }
    }

    // Don't allow changing owner or location via update (use move for location)
    delete updates.ownerId;
    delete updates.locationId;

    // Apply updates
    Object.assign(item, updates);
    await item.save();

    // Populate for response
    await item.populate('categoryId', 'name icon color');
    await item.populate('locationId', 'name icon type');

    return item.toJSON();
  }

  /**
   * Move item to new location
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} itemId - Item ID
   * @param {ObjectId} newLocationId - New location ID
   * @returns {Promise<Object>} Updated item
   */
  async move(userId, itemId, newLocationId) {
    const item = await Item.findById(itemId);

    if (!item || !item.isActive) {
      throw AppError.notFound('Item not found', 'ITEM_NOT_FOUND');
    }

    // Check permission on current location
    const hasCurrentAccess = await permissionService.canAccessLocation(userId, item.locationId, 'editor');
    if (!hasCurrentAccess) {
      throw AppError.forbidden('You do not have permission to move this item', 'FORBIDDEN');
    }

    // Check permission on new location
    const hasNewAccess = await permissionService.canAccessLocation(userId, newLocationId, 'contributor');
    if (!hasNewAccess) {
      throw AppError.forbidden('You do not have permission to move items to this location', 'FORBIDDEN');
    }

    // Verify new location exists
    const newLocation = await Location.findById(newLocationId);
    if (!newLocation || !newLocation.isActive) {
      throw AppError.notFound('Destination location not found', 'LOCATION_NOT_FOUND');
    }

    // Move the item
    await item.moveTo(newLocationId, userId);

    // Populate for response
    await item.populate('categoryId', 'name icon color');
    await item.populate('locationId', 'name icon type');

    return item.toJSON();
  }

  /**
   * Delete an item (soft delete)
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} itemId - Item ID
   * @returns {Promise<void>}
   */
  async delete(userId, itemId) {
    const item = await Item.findById(itemId);

    if (!item || !item.isActive) {
      throw AppError.notFound('Item not found', 'ITEM_NOT_FOUND');
    }

    // Check permission (need at least editor)
    const hasAccess = await permissionService.canAccessLocation(userId, item.locationId, 'editor');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to delete this item', 'FORBIDDEN');
    }

    // Soft delete
    item.isActive = false;
    await item.save();

    // Update location count
    await Location.findByIdAndUpdate(item.locationId, { $inc: { itemCount: -1 } });
  }

  /**
   * Adjust item quantity
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} itemId - Item ID
   * @param {Number} adjustment - Amount to adjust
   * @returns {Promise<Object>} Updated item
   */
  async adjustQuantity(userId, itemId, adjustment) {
    const item = await Item.findById(itemId);

    if (!item || !item.isActive) {
      throw AppError.notFound('Item not found', 'ITEM_NOT_FOUND');
    }

    // Check permission (need at least contributor for quantity adjustments)
    const hasAccess = await permissionService.canAccessLocation(userId, item.locationId, 'contributor');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to adjust this item', 'FORBIDDEN');
    }

    await item.adjustQuantity(adjustment);

    await item.populate('categoryId', 'name icon color');
    await item.populate('locationId', 'name icon type');

    return item.toJSON();
  }

  /**
   * Get all categories (tree structure)
   * @param {ObjectId} userId - Requesting user (for custom categories)
   * @returns {Promise<Array>} Category tree
   */
  async getCategories(userId) {
    return Category.getTree(userId);
  }

  /**
   * Get low stock items for user
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Low stock items
   */
  async getLowStock(userId) {
    // Get accessible location IDs
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);

    return Item.find({
      locationId: { $in: accessibleIds },
      isActive: true,
      'quantity.minAlert': { $exists: true, $ne: null },
      $expr: { $lte: ['$quantity.value', '$quantity.minAlert'] },
    })
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon type')
      .sort({ 'quantity.value': 1 })
      .lean();
  }
}

module.exports = new ItemService();
