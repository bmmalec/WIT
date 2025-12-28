const ShoppingList = require('../models/ShoppingList');
const Item = require('../models/Item');
const AppError = require('../utils/AppError');
const permissionService = require('./permissionService');

class ShoppingListService {
  /**
   * Get or create the user's active shopping list
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Shopping list
   */
  async getList(userId) {
    const list = await ShoppingList.getOrCreateForUser(userId);
    return list.toJSON();
  }

  /**
   * Add item to shopping list
   * @param {ObjectId} userId - User ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} Updated list
   */
  async addItem(userId, itemData) {
    const list = await ShoppingList.getOrCreateForUser(userId);

    // Validate target location if provided
    if (itemData.targetLocationId) {
      const hasAccess = await permissionService.canAccessLocation(
        userId,
        itemData.targetLocationId,
        'contributor'
      );
      if (!hasAccess) {
        throw AppError.forbidden('You do not have access to this location', 'FORBIDDEN');
      }
    }

    list.addItem(itemData);
    await list.save();

    // Re-populate for response
    await list.populate('items.targetLocationId', 'name icon');
    await list.populate('items.categoryId', 'name icon color');

    return list.toJSON();
  }

  /**
   * Update item in shopping list
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} itemId - Item ID in list
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated list
   */
  async updateItem(userId, itemId, updates) {
    const list = await ShoppingList.findOne({ userId, isActive: true });

    if (!list) {
      throw AppError.notFound('Shopping list not found', 'LIST_NOT_FOUND');
    }

    const item = list.items.id(itemId);
    if (!item) {
      throw AppError.notFound('Item not found in list', 'ITEM_NOT_FOUND');
    }

    // Apply updates
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.quantity !== undefined) item.quantity = updates.quantity;
    if (updates.notes !== undefined) item.notes = updates.notes;
    if (updates.priority !== undefined) item.priority = updates.priority;
    if (updates.estimatedPrice !== undefined) item.estimatedPrice = updates.estimatedPrice;
    if (updates.targetLocationId !== undefined) item.targetLocationId = updates.targetLocationId;
    if (updates.categoryId !== undefined) item.categoryId = updates.categoryId;

    await list.save();

    await list.populate('items.targetLocationId', 'name icon');
    await list.populate('items.categoryId', 'name icon color');

    return list.toJSON();
  }

  /**
   * Mark item as purchased
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} itemId - Item ID in list
   * @param {Object} options - Options for adding to inventory
   * @returns {Promise<Object>} Updated list and optionally created item
   */
  async markPurchased(userId, itemId, options = {}) {
    const list = await ShoppingList.findOne({ userId, isActive: true });

    if (!list) {
      throw AppError.notFound('Shopping list not found', 'LIST_NOT_FOUND');
    }

    const item = list.items.id(itemId);
    if (!item) {
      throw AppError.notFound('Item not found in list', 'ITEM_NOT_FOUND');
    }

    list.markPurchased(itemId);
    await list.save();

    let createdItem = null;

    // Optionally add to inventory
    if (options.addToInventory && item.targetLocationId) {
      const Location = require('../models/Location');
      const location = await Location.findById(item.targetLocationId);

      if (location) {
        const newItem = new Item({
          name: item.name,
          quantity: item.quantity,
          categoryId: item.categoryId,
          locationId: item.targetLocationId,
          ownerId: location.ownerId,
          value: options.actualPrice ? {
            purchasePrice: options.actualPrice,
            purchaseDate: new Date(),
          } : undefined,
        });

        await newItem.save();
        createdItem = newItem.toJSON();
      }
    }

    await list.populate('items.targetLocationId', 'name icon');
    await list.populate('items.categoryId', 'name icon color');

    return {
      list: list.toJSON(),
      createdItem,
    };
  }

  /**
   * Mark item as skipped
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} itemId - Item ID in list
   * @returns {Promise<Object>} Updated list
   */
  async markSkipped(userId, itemId) {
    const list = await ShoppingList.findOne({ userId, isActive: true });

    if (!list) {
      throw AppError.notFound('Shopping list not found', 'LIST_NOT_FOUND');
    }

    if (!list.markSkipped(itemId)) {
      throw AppError.notFound('Item not found in list', 'ITEM_NOT_FOUND');
    }

    await list.save();

    await list.populate('items.targetLocationId', 'name icon');
    await list.populate('items.categoryId', 'name icon color');

    return list.toJSON();
  }

  /**
   * Remove item from list
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} itemId - Item ID in list
   * @returns {Promise<Object>} Updated list
   */
  async removeItem(userId, itemId) {
    const list = await ShoppingList.findOne({ userId, isActive: true });

    if (!list) {
      throw AppError.notFound('Shopping list not found', 'LIST_NOT_FOUND');
    }

    if (!list.removeItem(itemId)) {
      throw AppError.notFound('Item not found in list', 'ITEM_NOT_FOUND');
    }

    await list.save();

    await list.populate('items.targetLocationId', 'name icon');
    await list.populate('items.categoryId', 'name icon color');

    return list.toJSON();
  }

  /**
   * Clear purchased items from list
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Updated list
   */
  async clearPurchased(userId) {
    const list = await ShoppingList.findOne({ userId, isActive: true });

    if (!list) {
      throw AppError.notFound('Shopping list not found', 'LIST_NOT_FOUND');
    }

    list.clearPurchased();
    await list.save();

    return list.toJSON();
  }

  /**
   * Get suggestions based on consumed/low stock items
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Suggested items
   */
  async getSuggestions(userId) {
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);

    // Get recently consumed items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const consumedItems = await Item.find({
      locationId: { $in: accessibleIds },
      consumedAt: { $gte: thirtyDaysAgo },
    })
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon')
      .sort({ consumedAt: -1 })
      .limit(10)
      .lean();

    // Get low stock items
    const lowStockItems = await Item.find({
      locationId: { $in: accessibleIds },
      isActive: true,
      'quantity.minAlert': { $exists: true, $ne: null },
      $expr: { $lte: ['$quantity.value', '$quantity.minAlert'] },
    })
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon')
      .sort({ 'quantity.value': 1 })
      .limit(10)
      .lean();

    // Get expired items that might need replacement
    const now = new Date();
    const expiredItems = await Item.find({
      locationId: { $in: accessibleIds },
      isActive: true,
      'perishable.isPerishable': true,
      'perishable.expirationDate': { $lt: now },
    })
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon')
      .sort({ 'perishable.expirationDate': 1 })
      .limit(10)
      .lean();

    return {
      consumed: consumedItems.map(item => ({
        ...item,
        suggestionSource: 'consumed',
      })),
      lowStock: lowStockItems.map(item => ({
        ...item,
        suggestionSource: 'low_stock',
      })),
      expired: expiredItems.map(item => ({
        ...item,
        suggestionSource: 'expired',
      })),
    };
  }

  /**
   * Add suggestion to shopping list
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sourceItemId - Source item ID
   * @param {string} source - Suggestion source type
   * @returns {Promise<Object>} Updated list
   */
  async addFromSuggestion(userId, sourceItemId, source) {
    const item = await Item.findById(sourceItemId)
      .populate('categoryId')
      .populate('locationId');

    if (!item) {
      throw AppError.notFound('Source item not found', 'ITEM_NOT_FOUND');
    }

    const list = await ShoppingList.getOrCreateForUser(userId);

    list.addItem({
      name: item.name,
      quantity: { value: 1, unit: item.quantity?.unit || 'each' },
      sourceItemId: item._id,
      source: source,
      targetLocationId: item.locationId?._id,
      categoryId: item.categoryId?._id,
      estimatedPrice: item.value?.purchasePrice || null,
    });

    await list.save();

    await list.populate('items.targetLocationId', 'name icon');
    await list.populate('items.categoryId', 'name icon color');

    return list.toJSON();
  }
}

module.exports = new ShoppingListService();
