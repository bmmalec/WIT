/**
 * Image Routes
 * Routes for image upload and management
 */

const express = require('express');
const multer = require('multer');
const { param, body } = require('express-validator');
const imageController = require('../controllers/imageController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { SETTINGS } = require('../services/imageService');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: SETTINGS.maxFileSize,
    files: 10, // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    if (SETTINGS.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${SETTINGS.allowedMimeTypes.join(', ')}`), false);
    }
  },
});

// All routes require authentication
router.use(protect);

// Validation rules
const itemIdRule = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID'),
];

const imageIndexRule = [
  param('imageIndex')
    .isInt({ min: 0 })
    .withMessage('Invalid image index'),
];

const reorderRule = [
  body('order')
    .isArray({ min: 1 })
    .withMessage('Order must be an array'),
  body('order.*')
    .isInt({ min: 0 })
    .withMessage('Order indices must be non-negative integers'),
];

// Routes
router.post(
  '/:itemId/images',
  itemIdRule,
  validate,
  upload.array('images', 10),
  imageController.uploadImages
);

router.delete(
  '/:itemId/images/:imageIndex',
  [...itemIdRule, ...imageIndexRule],
  validate,
  imageController.deleteImage
);

router.put(
  '/:itemId/images/:imageIndex/primary',
  [...itemIdRule, ...imageIndexRule],
  validate,
  imageController.setPrimaryImage
);

router.put(
  '/:itemId/images/reorder',
  [...itemIdRule, ...reorderRule],
  validate,
  imageController.reorderImages
);

module.exports = router;
