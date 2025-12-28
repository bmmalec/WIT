const Item = require('../models/Item');
const Location = require('../models/Location');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const permissionService = require('./permissionService');
const { fuzzySearch, getSuggestions } = require('../utils/fuzzyMatch');
const synonymService = require('./synonymService');

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
   * @param {String} options.locationId - Filter by location
   * @param {String} options.categoryId - Filter by category
   * @param {String} options.expirationStatus - Filter by expiration status ('expired', 'expiring', 'fresh', 'perishable')
   * @param {String} options.storageType - Filter by storage type ('pantry', 'refrigerated', 'frozen')
   * @returns {Promise<Array>} Matching items
   */
  async search(userId, query, options = {}) {
    // Get accessible location IDs
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);

    // Build base filter query (without text search)
    const baseFilter = {
      locationId: { $in: accessibleIds },
      isActive: true,
    };

    // Apply location filter (must be in accessible locations)
    if (options.locationId) {
      if (accessibleIds.map(id => id.toString()).includes(options.locationId)) {
        baseFilter.locationId = options.locationId;
      }
    }

    // Apply category filter
    if (options.categoryId) {
      baseFilter.categoryId = options.categoryId;
    }

    // Apply storage type filter
    if (options.storageType) {
      baseFilter['perishable.storageType'] = options.storageType;
    }

    // Apply expiration status filter
    if (options.expirationStatus) {
      const now = new Date();
      switch (options.expirationStatus) {
        case 'expired':
          baseFilter['perishable.isPerishable'] = true;
          baseFilter['perishable.expirationDate'] = { $lt: now };
          break;
        case 'expiring':
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          baseFilter['perishable.isPerishable'] = true;
          baseFilter['perishable.expirationDate'] = { $gte: now, $lte: thirtyDaysFromNow };
          break;
        case 'fresh':
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          baseFilter['perishable.isPerishable'] = true;
          baseFilter['perishable.expirationDate'] = { $gt: futureDate };
          break;
        case 'perishable':
          baseFilter['perishable.isPerishable'] = true;
          break;
      }
    }

    const limit = options.limit || 50;
    const fuzzyThreshold = options.fuzzyThreshold || 5; // Use fuzzy if fewer than this many results

    // Expand query with synonyms
    const { expandedTerms, synonymsFound } = await synonymService.expandQuery(query);
    const expandedQuery = expandedTerms.join(' ');

    // First, try text search with expanded query (includes synonyms)
    let textSearchItems = [];
    try {
      const textSearchQuery = { ...baseFilter, $text: { $search: expandedQuery } };
      textSearchItems = await Item.find(textSearchQuery, { score: { $meta: 'textScore' } })
        .populate('categoryId', 'name icon color')
        .populate('locationId', 'name icon type')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();
    } catch (err) {
      // Text search may fail if no text index - continue with fuzzy only
      console.warn('Text search failed, falling back to fuzzy search:', err.message);
    }

    // If we have enough results, return them
    if (textSearchItems.length >= fuzzyThreshold) {
      return {
        items: textSearchItems,
        fuzzyMatches: 0,
        suggestions: [],
        synonymsUsed: synonymsFound ? expandedTerms.filter(t => t.toLowerCase() !== query.toLowerCase()) : [],
        searchMethod: synonymsFound ? 'text+synonyms' : 'text',
      };
    }

    // Not enough results - do fuzzy search
    const existingIds = new Set(textSearchItems.map(item => item._id.toString()));

    // Get all items matching base filter for fuzzy search
    const allItems = await Item.find(baseFilter)
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon type')
      .lean();

    // Perform fuzzy search with all expanded terms
    let allFuzzyResults = [];
    for (const term of expandedTerms) {
      const results = fuzzySearch(term, allItems, {
        fields: ['name', 'alternateNames', 'brand', 'model', 'description'],
        minSimilarity: 0.4,
        limit: limit,
      });
      allFuzzyResults.push(...results);
    }

    // Deduplicate and sort fuzzy results by score
    const seenIds = new Set();
    const uniqueFuzzyResults = allFuzzyResults
      .filter(result => {
        const id = result.item._id.toString();
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      })
      .sort((a, b) => b.score - a.score);

    // Filter out items already in text search results
    const fuzzyMatches = uniqueFuzzyResults
      .filter(result => !existingIds.has(result.item._id.toString()))
      .slice(0, limit)
      .map(result => ({
        ...result.item,
        _fuzzyScore: result.score,
        _fuzzyMatchedField: result.matchedField,
      }));

    // Combine results: exact matches first, then fuzzy matches
    const combinedItems = [...textSearchItems, ...fuzzyMatches].slice(0, limit);

    // Generate "Did you mean?" suggestions if few or no results
    let suggestions = [];
    if (combinedItems.length < 3) {
      const allNames = allItems.flatMap(item => [
        item.name,
        ...(item.alternateNames || []),
      ]).filter(Boolean);
      suggestions = getSuggestions(query, [...new Set(allNames)], 3);
    }

    // Determine search method used
    let searchMethod = 'fuzzy';
    if (textSearchItems.length > 0) {
      searchMethod = synonymsFound ? 'text+synonyms+fuzzy' : 'text+fuzzy';
    } else if (synonymsFound) {
      searchMethod = 'synonyms+fuzzy';
    }

    return {
      items: combinedItems,
      fuzzyMatches: fuzzyMatches.length,
      suggestions: suggestions.map(s => s.term),
      synonymsUsed: synonymsFound ? expandedTerms.filter(t => t.toLowerCase() !== query.toLowerCase()) : [],
      searchMethod,
    };
  }

  /**
   * Get autocomplete suggestions for search
   * @param {ObjectId} userId - Requesting user
   * @param {string} query - Partial search query (min 2 chars)
   * @param {Object} options - Options
   * @param {number} options.limit - Max suggestions (default 10)
   * @returns {Promise<Object>} { suggestions: Array<{ text, type, item? }> }
   */
  async autocomplete(userId, query, options = {}) {
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    const limit = options.limit || 10;
    const queryLower = query.toLowerCase().trim();

    // Get accessible location IDs
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);

    // Find items matching the query prefix
    const items = await Item.find({
      locationId: { $in: accessibleIds },
      isActive: true,
      $or: [
        { name: { $regex: queryLower, $options: 'i' } },
        { alternateNames: { $regex: queryLower, $options: 'i' } },
        { brand: { $regex: queryLower, $options: 'i' } },
        { tags: { $regex: queryLower, $options: 'i' } },
      ],
    })
      .select('name alternateNames brand locationId')
      .populate('locationId', 'name')
      .limit(50)
      .lean();

    // Build suggestions from items
    const suggestionMap = new Map();

    for (const item of items) {
      // Add item name
      if (item.name.toLowerCase().includes(queryLower)) {
        const key = item.name.toLowerCase();
        if (!suggestionMap.has(key)) {
          suggestionMap.set(key, {
            text: item.name,
            type: 'item',
            location: item.locationId?.name,
            itemId: item._id,
          });
        }
      }

      // Add matching alternate names
      for (const altName of (item.alternateNames || [])) {
        if (altName.toLowerCase().includes(queryLower)) {
          const key = altName.toLowerCase();
          if (!suggestionMap.has(key)) {
            suggestionMap.set(key, {
              text: altName,
              type: 'alternate',
              primaryName: item.name,
              itemId: item._id,
            });
          }
        }
      }

      // Add matching brands
      if (item.brand && item.brand.toLowerCase().includes(queryLower)) {
        const key = `brand:${item.brand.toLowerCase()}`;
        if (!suggestionMap.has(key)) {
          suggestionMap.set(key, {
            text: item.brand,
            type: 'brand',
          });
        }
      }
    }

    // Convert to array and sort
    let suggestions = Array.from(suggestionMap.values());

    // Sort: exact prefix matches first, then by type, then alphabetically
    suggestions.sort((a, b) => {
      const aStartsWith = a.text.toLowerCase().startsWith(queryLower);
      const bStartsWith = b.text.toLowerCase().startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Prioritize items over brands
      const typeOrder = { item: 0, alternate: 1, brand: 2 };
      const aOrder = typeOrder[a.type] ?? 3;
      const bOrder = typeOrder[b.type] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;

      return a.text.localeCompare(b.text);
    });

    // Limit results
    suggestions = suggestions.slice(0, limit);

    return { suggestions };
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

  /**
   * Mark item as consumed
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} itemId - Item ID
   * @returns {Promise<void>}
   */
  async consume(userId, itemId) {
    const item = await Item.findById(itemId);

    if (!item || !item.isActive) {
      throw AppError.notFound('Item not found', 'ITEM_NOT_FOUND');
    }

    // Check permission (need at least contributor)
    const hasAccess = await permissionService.canAccessLocation(userId, item.locationId, 'contributor');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to modify this item', 'FORBIDDEN');
    }

    await item.markConsumed();

    // Update location count
    await Location.findByIdAndUpdate(item.locationId, { $inc: { itemCount: -1 } });
  }

  /**
   * Mark item as discarded
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} itemId - Item ID
   * @returns {Promise<void>}
   */
  async discard(userId, itemId) {
    const item = await Item.findById(itemId);

    if (!item || !item.isActive) {
      throw AppError.notFound('Item not found', 'ITEM_NOT_FOUND');
    }

    // Check permission (need at least contributor)
    const hasAccess = await permissionService.canAccessLocation(userId, item.locationId, 'contributor');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to modify this item', 'FORBIDDEN');
    }

    await item.markDiscarded();

    // Update location count
    await Location.findByIdAndUpdate(item.locationId, { $inc: { itemCount: -1 } });
  }

  /**
   * Get items by expiration status
   * @param {ObjectId} userId - Requesting user
   * @param {Object} options - Filter options
   * @param {string} options.status - 'expired', 'current', 'expiring-soon', 'all'
   * @param {number} options.periodIndex - Specific period index to filter by
   * @param {number} options.currentPeriodIndex - Current period index for status calculation
   * @returns {Promise<Object>} Items grouped by status with counts
   */
  async getByExpirationStatus(userId, options = {}) {
    const { status = 'all', periodIndex, currentPeriodIndex } = options;

    // Get accessible location IDs
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);

    // Base query - only perishable items
    const baseQuery = {
      locationId: { $in: accessibleIds },
      isActive: true,
      'perishable.isPerishable': true,
    };

    // If filtering by specific period index
    if (periodIndex !== undefined && periodIndex !== null) {
      baseQuery['perishable.expirationPeriodIndex'] = periodIndex;
    }

    // If filtering by status and we have current period index
    if (status !== 'all' && currentPeriodIndex !== undefined) {
      switch (status) {
        case 'expired':
          // Items with period index less than current period
          baseQuery['perishable.expirationPeriodIndex'] = { $lt: currentPeriodIndex };
          break;
        case 'current':
          // Items in current period
          baseQuery['perishable.expirationPeriodIndex'] = currentPeriodIndex;
          break;
        case 'expiring-soon':
          // Items expiring in current or next period
          baseQuery['perishable.expirationPeriodIndex'] = {
            $gte: currentPeriodIndex,
            $lte: currentPeriodIndex + 1,
          };
          break;
        case 'future':
          // Items with period index greater than current period
          baseQuery['perishable.expirationPeriodIndex'] = { $gt: currentPeriodIndex };
          break;
      }
    }

    const items = await Item.find(baseQuery)
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon type')
      .sort({ 'perishable.expirationPeriodIndex': 1, name: 1 })
      .lean();

    // If we have current period index, add status to each item
    if (currentPeriodIndex !== undefined) {
      items.forEach(item => {
        const idx = item.perishable?.expirationPeriodIndex;
        if (idx === null || idx === undefined) {
          item.expirationStatus = 'unknown';
        } else if (idx < currentPeriodIndex) {
          item.expirationStatus = 'expired';
        } else if (idx === currentPeriodIndex) {
          item.expirationStatus = 'current';
        } else {
          item.expirationStatus = 'future';
        }
      });
    }

    // Calculate counts by status
    const counts = {
      total: items.length,
      expired: 0,
      current: 0,
      future: 0,
      unknown: 0,
    };

    if (currentPeriodIndex !== undefined) {
      items.forEach(item => {
        const status = item.expirationStatus || 'unknown';
        counts[status] = (counts[status] || 0) + 1;
      });
    }

    return { items, counts };
  }

  /**
   * Get consumption history (recently consumed and discarded items)
   * @param {ObjectId} userId - Requesting user
   * @param {Object} options - Query options
   * @param {string} options.type - 'all', 'consumed', 'discarded'
   * @param {number} options.limit - Max items to return
   * @param {number} options.days - Days to look back (default 30)
   * @returns {Promise<Object>} { items, stats }
   */
  async getConsumptionHistory(userId, options = {}) {
    const { type = 'all', limit = 20, days = 30 } = options;

    // Get accessible location IDs
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    const baseQuery = {
      locationId: { $in: accessibleIds },
      isActive: false, // Consumed/discarded items are inactive
    };

    // Filter by type
    if (type === 'consumed') {
      baseQuery.consumedAt = { $gte: startDate };
    } else if (type === 'discarded') {
      baseQuery.discardedAt = { $gte: startDate };
    } else {
      // All - either consumed or discarded
      baseQuery.$or = [
        { consumedAt: { $gte: startDate } },
        { discardedAt: { $gte: startDate } },
      ];
    }

    // Fetch items
    const items = await Item.find(baseQuery)
      .populate('categoryId', 'name icon color')
      .populate('locationId', 'name icon type')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    // Add type field to each item
    items.forEach(item => {
      if (item.consumedAt) {
        item.historyType = 'consumed';
        item.historyDate = item.consumedAt;
      } else if (item.discardedAt) {
        item.historyType = 'discarded';
        item.historyDate = item.discardedAt;
      }
    });

    // Calculate stats for the period
    const allConsumed = await Item.countDocuments({
      locationId: { $in: accessibleIds },
      consumedAt: { $gte: startDate },
    });

    const allDiscarded = await Item.countDocuments({
      locationId: { $in: accessibleIds },
      discardedAt: { $gte: startDate },
    });

    return {
      items,
      stats: {
        consumed: allConsumed,
        discarded: allDiscarded,
        total: allConsumed + allDiscarded,
        days,
      },
    };
  }
}

module.exports = new ItemService();
