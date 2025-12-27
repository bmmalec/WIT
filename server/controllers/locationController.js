const locationService = require('../services/locationService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Create a new location
 * @route   POST /api/locations
 * @access  Private
 */
exports.create = asyncHandler(async (req, res) => {
  const location = await locationService.create(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { location },
    message: 'Location created successfully',
  });
});

/**
 * @desc    Get all locations for current user
 * @route   GET /api/locations
 * @access  Private
 */
exports.getAll = asyncHandler(async (req, res) => {
  const { parentId, includeInactive } = req.query;

  const options = {
    includeInactive: includeInactive === 'true',
    parentId: parentId === 'null' ? null : parentId,
  };

  const locations = await locationService.getAll(req.user._id, options);

  res.status(200).json({
    success: true,
    data: { locations },
    count: locations.length,
  });
});

/**
 * @desc    Get location tree for current user
 * @route   GET /api/locations/tree
 * @access  Private
 */
exports.getTree = asyncHandler(async (req, res) => {
  const tree = await locationService.getTree(req.user._id);

  res.status(200).json({
    success: true,
    data: { tree },
  });
});

/**
 * @desc    Get a single location
 * @route   GET /api/locations/:id
 * @access  Private
 */
exports.getOne = asyncHandler(async (req, res) => {
  const location = await locationService.getById(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { location },
  });
});

/**
 * @desc    Get location with ancestors (breadcrumb)
 * @route   GET /api/locations/:id/breadcrumb
 * @access  Private
 */
exports.getBreadcrumb = asyncHandler(async (req, res) => {
  const result = await locationService.getWithAncestors(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Update a location
 * @route   PUT /api/locations/:id
 * @access  Private
 */
exports.update = asyncHandler(async (req, res) => {
  const location = await locationService.update(req.user._id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: { location },
    message: 'Location updated successfully',
  });
});

/**
 * @desc    Delete a location
 * @route   DELETE /api/locations/:id
 * @access  Private
 */
exports.delete = asyncHandler(async (req, res) => {
  const { cascade } = req.query;

  await locationService.delete(req.user._id, req.params.id, {
    cascade: cascade === 'true',
  });

  res.status(200).json({
    success: true,
    message: 'Location deleted successfully',
  });
});
