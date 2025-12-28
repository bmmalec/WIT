const bulkSessionService = require('../services/bulkSessionService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Start a new bulk import session
 * @route   POST /api/bulk-sessions
 * @access  Private (Contributor+)
 */
exports.startSession = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.startSession(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { session },
    message: 'Bulk import session started',
  });
});

/**
 * @desc    Get current active session
 * @route   GET /api/bulk-sessions/active
 * @access  Private
 */
exports.getActiveSession = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.getActiveSession(req.user._id);

  res.status(200).json({
    success: true,
    data: { session },
  });
});

/**
 * @desc    Get session by ID
 * @route   GET /api/bulk-sessions/:id
 * @access  Private
 */
exports.getById = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.getById(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { session },
  });
});

/**
 * @desc    Change target location
 * @route   PUT /api/bulk-sessions/:id/target-location
 * @access  Private
 */
exports.changeTargetLocation = asyncHandler(async (req, res) => {
  const { locationId } = req.body;
  const session = await bulkSessionService.changeTargetLocation(
    req.user._id,
    req.params.id,
    locationId
  );

  res.status(200).json({
    success: true,
    data: { session },
    message: 'Target location updated',
  });
});

/**
 * @desc    Add pending item to session
 * @route   POST /api/bulk-sessions/:id/items
 * @access  Private
 */
exports.addPendingItem = asyncHandler(async (req, res) => {
  const result = await bulkSessionService.addPendingItem(
    req.user._id,
    req.params.id,
    req.body
  );

  res.status(201).json({
    success: true,
    data: result,
    message: 'Item added to session',
  });
});

/**
 * @desc    Update pending item
 * @route   PUT /api/bulk-sessions/:id/items/:tempId
 * @access  Private
 */
exports.updatePendingItem = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.updatePendingItem(
    req.user._id,
    req.params.id,
    req.params.tempId,
    req.body
  );

  res.status(200).json({
    success: true,
    data: { session },
    message: 'Item updated',
  });
});

/**
 * @desc    Remove pending item (reject)
 * @route   DELETE /api/bulk-sessions/:id/items/:tempId
 * @access  Private
 */
exports.removePendingItem = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.removePendingItem(
    req.user._id,
    req.params.id,
    req.params.tempId
  );

  res.status(200).json({
    success: true,
    data: { session },
    message: 'Item removed from session',
  });
});

/**
 * @desc    Commit session (save all items to inventory)
 * @route   POST /api/bulk-sessions/:id/commit
 * @access  Private
 */
exports.commitSession = asyncHandler(async (req, res) => {
  const result = await bulkSessionService.commitSession(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: result,
    message: `${result.committed} items added to inventory`,
  });
});

/**
 * @desc    Pause session
 * @route   POST /api/bulk-sessions/:id/pause
 * @access  Private
 */
exports.pauseSession = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.pauseSession(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { session },
    message: 'Session paused',
  });
});

/**
 * @desc    Resume a paused session
 * @route   POST /api/bulk-sessions/:id/resume
 * @access  Private
 */
exports.resumeSession = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.resumeSession(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { session },
    message: 'Session resumed',
  });
});

/**
 * @desc    Cancel session
 * @route   POST /api/bulk-sessions/:id/cancel
 * @access  Private
 */
exports.cancelSession = asyncHandler(async (req, res) => {
  const session = await bulkSessionService.cancelSession(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { session },
    message: 'Session cancelled',
  });
});

/**
 * @desc    Get session history
 * @route   GET /api/bulk-sessions
 * @access  Private
 */
exports.getSessionHistory = asyncHandler(async (req, res) => {
  const { limit, skip } = req.query;
  const sessions = await bulkSessionService.getSessionHistory(req.user._id, {
    limit: limit ? parseInt(limit) : undefined,
    skip: skip ? parseInt(skip) : undefined,
  });

  res.status(200).json({
    success: true,
    data: { sessions },
    count: sessions.length,
  });
});
