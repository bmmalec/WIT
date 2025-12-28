const shoppingListService = require('../services/shoppingListService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get user's shopping list
 * @route   GET /api/shopping-list
 * @access  Private
 */
exports.getList = asyncHandler(async (req, res) => {
  const list = await shoppingListService.getList(req.user._id);

  res.status(200).json({
    success: true,
    data: { list },
  });
});

/**
 * @desc    Add item to shopping list
 * @route   POST /api/shopping-list/items
 * @access  Private
 */
exports.addItem = asyncHandler(async (req, res) => {
  const list = await shoppingListService.addItem(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { list },
    message: 'Item added to shopping list',
  });
});

/**
 * @desc    Update item in shopping list
 * @route   PUT /api/shopping-list/items/:itemId
 * @access  Private
 */
exports.updateItem = asyncHandler(async (req, res) => {
  const list = await shoppingListService.updateItem(
    req.user._id,
    req.params.itemId,
    req.body
  );

  res.status(200).json({
    success: true,
    data: { list },
    message: 'Item updated',
  });
});

/**
 * @desc    Mark item as purchased
 * @route   PUT /api/shopping-list/items/:itemId/purchased
 * @access  Private
 */
exports.markPurchased = asyncHandler(async (req, res) => {
  const result = await shoppingListService.markPurchased(
    req.user._id,
    req.params.itemId,
    req.body
  );

  res.status(200).json({
    success: true,
    data: result,
    message: 'Item marked as purchased',
  });
});

/**
 * @desc    Mark item as skipped
 * @route   PUT /api/shopping-list/items/:itemId/skipped
 * @access  Private
 */
exports.markSkipped = asyncHandler(async (req, res) => {
  const list = await shoppingListService.markSkipped(req.user._id, req.params.itemId);

  res.status(200).json({
    success: true,
    data: { list },
    message: 'Item skipped',
  });
});

/**
 * @desc    Remove item from shopping list
 * @route   DELETE /api/shopping-list/items/:itemId
 * @access  Private
 */
exports.removeItem = asyncHandler(async (req, res) => {
  const list = await shoppingListService.removeItem(req.user._id, req.params.itemId);

  res.status(200).json({
    success: true,
    data: { list },
    message: 'Item removed from list',
  });
});

/**
 * @desc    Clear purchased items
 * @route   DELETE /api/shopping-list/purchased
 * @access  Private
 */
exports.clearPurchased = asyncHandler(async (req, res) => {
  const list = await shoppingListService.clearPurchased(req.user._id);

  res.status(200).json({
    success: true,
    data: { list },
    message: 'Purchased items cleared',
  });
});

/**
 * @desc    Get shopping suggestions
 * @route   GET /api/shopping-list/suggestions
 * @access  Private
 */
exports.getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await shoppingListService.getSuggestions(req.user._id);

  res.status(200).json({
    success: true,
    data: { suggestions },
  });
});

/**
 * @desc    Add item from suggestion
 * @route   POST /api/shopping-list/suggestions/:itemId
 * @access  Private
 */
exports.addFromSuggestion = asyncHandler(async (req, res) => {
  const list = await shoppingListService.addFromSuggestion(
    req.user._id,
    req.params.itemId,
    req.body.source || 'consumed'
  );

  res.status(201).json({
    success: true,
    data: { list },
    message: 'Suggestion added to shopping list',
  });
});
