/**
 * Label Controller
 * Handles label and QR code generation requests
 */

const labelService = require('../services/labelService');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Get available label sizes
 * @route   GET /api/labels/sizes
 * @access  Private
 */
exports.getLabelSizes = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      sizes: labelService.LABEL_SIZES,
    },
  });
});

/**
 * @desc    Generate label for a single item
 * @route   GET /api/labels/item/:id
 * @access  Private
 */
exports.getItemLabel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qrSize } = req.query;

  const label = await labelService.generateItemLabel(id, req.user._id, {
    qrSize: qrSize ? parseInt(qrSize, 10) : 200,
  });

  res.status(200).json({
    success: true,
    data: { label },
  });
});

/**
 * @desc    Generate label for a single location
 * @route   GET /api/labels/location/:id
 * @access  Private
 */
exports.getLocationLabel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qrSize } = req.query;

  const label = await labelService.generateLocationLabel(id, req.user._id, {
    qrSize: qrSize ? parseInt(qrSize, 10) : 200,
  });

  res.status(200).json({
    success: true,
    data: { label },
  });
});

/**
 * @desc    Generate batch labels for multiple items
 * @route   POST /api/labels/items/batch
 * @access  Private
 */
exports.getBatchItemLabels = asyncHandler(async (req, res) => {
  const { itemIds, qrSize } = req.body;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw AppError.badRequest('itemIds array is required', 'INVALID_INPUT');
  }

  if (itemIds.length > 100) {
    throw AppError.badRequest('Maximum 100 items per batch', 'BATCH_TOO_LARGE');
  }

  const result = await labelService.generateBatchItemLabels(itemIds, req.user._id, {
    qrSize: qrSize || 200,
  });

  res.status(200).json({
    success: true,
    data: {
      labels: result.labels,
      errors: result.errors,
      totalRequested: itemIds.length,
      totalGenerated: result.labels.length,
    },
  });
});

/**
 * @desc    Generate batch labels for multiple locations
 * @route   POST /api/labels/locations/batch
 * @access  Private
 */
exports.getBatchLocationLabels = asyncHandler(async (req, res) => {
  const { locationIds, qrSize } = req.body;

  if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
    throw AppError.badRequest('locationIds array is required', 'INVALID_INPUT');
  }

  if (locationIds.length > 100) {
    throw AppError.badRequest('Maximum 100 locations per batch', 'BATCH_TOO_LARGE');
  }

  const result = await labelService.generateBatchLocationLabels(locationIds, req.user._id, {
    qrSize: qrSize || 200,
  });

  res.status(200).json({
    success: true,
    data: {
      labels: result.labels,
      errors: result.errors,
      totalRequested: locationIds.length,
      totalGenerated: result.labels.length,
    },
  });
});

/**
 * @desc    Generate labels for all items in a location
 * @route   GET /api/labels/location/:id/items
 * @access  Private
 */
exports.getLocationItemLabels = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qrSize } = req.query;

  const result = await labelService.generateLocationItemLabels(id, req.user._id, {
    qrSize: qrSize ? parseInt(qrSize, 10) : 200,
  });

  res.status(200).json({
    success: true,
    data: {
      labels: result.labels,
      errors: result.errors,
      totalGenerated: result.labels.length,
    },
  });
});
