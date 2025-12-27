const itemService = require('../services/itemService');
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
  const { q, limit } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(200).json({
      success: true,
      data: { items: [] },
      count: 0,
    });
  }

  const items = await itemService.search(req.user._id, q, {
    limit: limit ? parseInt(limit) : 50,
  });

  res.status(200).json({
    success: true,
    data: { items },
    count: items.length,
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
