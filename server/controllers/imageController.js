/**
 * Image Controller
 * Handles image upload operations for items
 */

const asyncHandler = require('express-async-handler');
const imageService = require('../services/imageService');
const itemService = require('../services/itemService');
const AppError = require('../utils/AppError');

/**
 * @desc    Upload images for an item
 * @route   POST /api/items/:itemId/images
 * @access  Private
 */
exports.uploadImages = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  if (!req.files || req.files.length === 0) {
    throw AppError.badRequest('No images uploaded', 'NO_IMAGES');
  }

  // Get the item and verify permissions
  const item = await itemService.getById(req.user._id, itemId);

  // Process each uploaded image
  const uploadedImages = [];
  const errors = [];

  for (const file of req.files) {
    try {
      const imageInfo = await imageService.processImage(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      uploadedImages.push({
        url: imageInfo.url,
        thumbnailUrl: imageInfo.thumbnailUrl,
        isPrimary: item.images.length === 0 && uploadedImages.length === 0, // First image is primary
        uploadedAt: new Date(),
      });
    } catch (error) {
      errors.push({
        filename: file.originalname,
        error: error.message,
      });
    }
  }

  if (uploadedImages.length === 0) {
    throw AppError.badRequest('Failed to process any images', 'UPLOAD_FAILED', { errors });
  }

  // Add images to item
  item.images.push(...uploadedImages);
  await item.save();

  res.status(201).json({
    success: true,
    data: {
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined,
    },
  });
});

/**
 * @desc    Delete an image from an item
 * @route   DELETE /api/items/:itemId/images/:imageIndex
 * @access  Private
 */
exports.deleteImage = asyncHandler(async (req, res) => {
  const { itemId, imageIndex } = req.params;
  const index = parseInt(imageIndex, 10);

  // Get the item and verify permissions
  const item = await itemService.getById(req.user._id, itemId);

  if (index < 0 || index >= item.images.length) {
    throw AppError.badRequest('Invalid image index', 'INVALID_INDEX');
  }

  const imageToDelete = item.images[index];
  const wasPrimary = imageToDelete.isPrimary;

  // Delete the image file
  await imageService.deleteImagesByUrls([imageToDelete]);

  // Remove from item
  item.images.splice(index, 1);

  // If deleted image was primary and there are other images, make the first one primary
  if (wasPrimary && item.images.length > 0) {
    item.images[0].isPrimary = true;
  }

  await item.save();

  res.json({
    success: true,
    message: 'Image deleted',
    data: {
      images: item.images,
    },
  });
});

/**
 * @desc    Set primary image for an item
 * @route   PUT /api/items/:itemId/images/:imageIndex/primary
 * @access  Private
 */
exports.setPrimaryImage = asyncHandler(async (req, res) => {
  const { itemId, imageIndex } = req.params;
  const index = parseInt(imageIndex, 10);

  // Get the item and verify permissions
  const item = await itemService.getById(req.user._id, itemId);

  if (index < 0 || index >= item.images.length) {
    throw AppError.badRequest('Invalid image index', 'INVALID_INDEX');
  }

  // Update primary status
  item.images.forEach((img, i) => {
    img.isPrimary = i === index;
  });

  await item.save();

  res.json({
    success: true,
    message: 'Primary image updated',
    data: {
      images: item.images,
    },
  });
});

/**
 * @desc    Reorder images for an item
 * @route   PUT /api/items/:itemId/images/reorder
 * @access  Private
 */
exports.reorderImages = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { order } = req.body; // Array of image indices in new order

  // Get the item and verify permissions
  const item = await itemService.getById(req.user._id, itemId);

  if (!Array.isArray(order) || order.length !== item.images.length) {
    throw AppError.badRequest('Invalid order array', 'INVALID_ORDER');
  }

  // Validate indices
  const indices = new Set(order);
  if (indices.size !== order.length || !order.every(i => i >= 0 && i < item.images.length)) {
    throw AppError.badRequest('Invalid indices in order array', 'INVALID_INDICES');
  }

  // Reorder images
  const reorderedImages = order.map(i => item.images[i]);
  item.images = reorderedImages;

  await item.save();

  res.json({
    success: true,
    message: 'Images reordered',
    data: {
      images: item.images,
    },
  });
});
