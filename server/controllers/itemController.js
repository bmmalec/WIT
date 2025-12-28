const itemService = require('../services/itemService');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Create a new item
 * @route   POST /api/items
 * @access  Private (Contributor+)
 */
exports.create = asyncHandler(async (req, res) => {
  const item = await itemService.create(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { item },
    message: 'Item created successfully',
  });
});

/**
 * @desc    Get item by ID
 * @route   GET /api/items/:id
 * @access  Private (Viewer+)
 */
exports.getById = asyncHandler(async (req, res) => {
  const item = await itemService.getById(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { item },
  });
});

/**
 * @desc    Get items for a location
 * @route   GET /api/locations/:id/items
 * @access  Private (Viewer+)
 */
exports.getByLocation = asyncHandler(async (req, res) => {
  const { categoryId, itemType, sort, limit, skip } = req.query;

  const items = await itemService.getByLocation(req.user._id, req.params.id, {
    categoryId,
    itemType,
    sort: sort ? JSON.parse(sort) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    skip: skip ? parseInt(skip) : undefined,
  });

  res.status(200).json({
    success: true,
    data: { items },
    count: items.length,
  });
});

/**
 * @desc    Search items
 * @route   GET /api/items/search
 * @access  Private
 */
exports.search = asyncHandler(async (req, res) => {
  const { q, limit, locationId, categoryId, expirationStatus, storageType } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        items: [],
        fuzzyMatches: 0,
        suggestions: [],
        searchMethod: 'none',
      },
      count: 0,
    });
  }

  const result = await itemService.search(req.user._id, q, {
    limit: limit ? parseInt(limit) : 50,
    locationId,
    categoryId,
    expirationStatus,
    storageType,
  });

  // Save to recent searches (async, don't wait)
  req.user.addRecentSearch(q).catch(err => {
    console.error('Failed to save recent search:', err);
  });

  res.status(200).json({
    success: true,
    data: {
      items: result.items,
      fuzzyMatches: result.fuzzyMatches,
      suggestions: result.suggestions,
      synonymsUsed: result.synonymsUsed || [],
      searchMethod: result.searchMethod,
    },
    count: result.items.length,
  });
});

/**
 * @desc    Get autocomplete suggestions
 * @route   GET /api/items/autocomplete
 * @access  Private
 * @query   q - Search query (min 2 chars)
 * @query   limit - Max suggestions (default 10)
 */
exports.autocomplete = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;

  const result = await itemService.autocomplete(req.user._id, q, {
    limit: limit ? parseInt(limit) : 10,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Update an item
 * @route   PUT /api/items/:id
 * @access  Private (Editor+)
 */
exports.update = asyncHandler(async (req, res) => {
  const item = await itemService.update(req.user._id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: { item },
    message: 'Item updated successfully',
  });
});

/**
 * @desc    Move item to new location
 * @route   PUT /api/items/:id/move
 * @access  Private (Editor+)
 */
exports.move = asyncHandler(async (req, res) => {
  const { locationId } = req.body;
  const item = await itemService.move(req.user._id, req.params.id, locationId);

  res.status(200).json({
    success: true,
    data: { item },
    message: 'Item moved successfully',
  });
});

/**
 * @desc    Delete an item
 * @route   DELETE /api/items/:id
 * @access  Private (Editor+)
 */
exports.delete = asyncHandler(async (req, res) => {
  await itemService.delete(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Item deleted successfully',
  });
});

/**
 * @desc    Adjust item quantity
 * @route   PUT /api/items/:id/quantity
 * @access  Private (Contributor+)
 */
exports.adjustQuantity = asyncHandler(async (req, res) => {
  const { adjustment } = req.body;
  const item = await itemService.adjustQuantity(req.user._id, req.params.id, adjustment);

  res.status(200).json({
    success: true,
    data: { item },
    message: 'Quantity adjusted',
  });
});

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await itemService.getCategories(req.user._id);

  res.status(200).json({
    success: true,
    data: { categories },
  });
});

/**
 * @desc    Get low stock items
 * @route   GET /api/items/low-stock
 * @access  Private
 */
exports.getLowStock = asyncHandler(async (req, res) => {
  const items = await itemService.getLowStock(req.user._id);

  res.status(200).json({
    success: true,
    data: { items },
    count: items.length,
  });
});

/**
 * @desc    Mark item as consumed
 * @route   PUT /api/items/:id/consume
 * @access  Private (Contributor+)
 */
exports.consume = asyncHandler(async (req, res) => {
  await itemService.consume(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Item marked as consumed',
  });
});

/**
 * @desc    Mark item as discarded
 * @route   PUT /api/items/:id/discard
 * @access  Private (Contributor+)
 */
exports.discard = asyncHandler(async (req, res) => {
  await itemService.discard(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Item marked as discarded',
  });
});

/**
 * @desc    Get consumption history (consumed and discarded items)
 * @route   GET /api/items/consumption-history
 * @access  Private
 * @query   type - 'all', 'consumed', 'discarded'
 * @query   limit - Max items to return (default 20)
 * @query   days - Days to look back (default 30)
 */
exports.getConsumptionHistory = asyncHandler(async (req, res) => {
  const { type, limit, days } = req.query;

  const result = await itemService.getConsumptionHistory(req.user._id, {
    type: type || 'all',
    limit: limit ? parseInt(limit) : 20,
    days: days ? parseInt(days) : 30,
  });

  res.status(200).json({
    success: true,
    data: {
      items: result.items,
      stats: result.stats,
    },
  });
});

/**
 * @desc    Get items by expiration status/color
 * @route   GET /api/items/expiring
 * @access  Private
 * @query   status - 'expired', 'current', 'expiring-soon', 'future', 'all'
 * @query   periodIndex - Specific period index to filter by
 * @query   currentPeriodIndex - Current period index for status calculation
 */
exports.getByExpirationStatus = asyncHandler(async (req, res) => {
  const { status, periodIndex, currentPeriodIndex } = req.query;

  const result = await itemService.getByExpirationStatus(req.user._id, {
    status: status || 'all',
    periodIndex: periodIndex !== undefined ? parseInt(periodIndex) : undefined,
    currentPeriodIndex: currentPeriodIndex !== undefined ? parseInt(currentPeriodIndex) : undefined,
  });

  res.status(200).json({
    success: true,
    data: {
      items: result.items,
      counts: result.counts,
    },
  });
});

/**
 * @desc    Get recent searches for current user
 * @route   GET /api/items/recent-searches
 * @access  Private
 */
exports.getRecentSearches = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('recentSearches');

  res.status(200).json({
    success: true,
    data: {
      searches: user?.recentSearches || [],
    },
  });
});

/**
 * @desc    Clear recent search history
 * @route   DELETE /api/items/recent-searches
 * @access  Private
 */
exports.clearRecentSearches = asyncHandler(async (req, res) => {
  await req.user.clearRecentSearches();

  res.status(200).json({
    success: true,
    message: 'Search history cleared',
  });
});
