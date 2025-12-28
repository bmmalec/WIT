const express = require('express');
const { param, body, query } = require('express-validator');
const labelController = require('../controllers/labelController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const itemIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid item ID'),
];

const locationIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid location ID'),
];

const qrSizeRule = [
  query('qrSize')
    .optional()
    .isInt({ min: 100, max: 500 })
    .withMessage('QR size must be between 100 and 500'),
];

const batchItemsRule = [
  body('itemIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('itemIds must be an array with 1-100 items'),
  body('itemIds.*')
    .isMongoId()
    .withMessage('Invalid item ID in array'),
  body('qrSize')
    .optional()
    .isInt({ min: 100, max: 500 })
    .withMessage('QR size must be between 100 and 500'),
];

const batchLocationsRule = [
  body('locationIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('locationIds must be an array with 1-100 locations'),
  body('locationIds.*')
    .isMongoId()
    .withMessage('Invalid location ID in array'),
  body('qrSize')
    .optional()
    .isInt({ min: 100, max: 500 })
    .withMessage('QR size must be between 100 and 500'),
];

// Routes
router.get('/sizes', labelController.getLabelSizes);
router.get('/item/:id', itemIdRule, qrSizeRule, validate, labelController.getItemLabel);
router.get('/location/:id', locationIdRule, qrSizeRule, validate, labelController.getLocationLabel);
router.get('/location/:id/items', locationIdRule, qrSizeRule, validate, labelController.getLocationItemLabels);
router.post('/items/batch', batchItemsRule, validate, labelController.getBatchItemLabels);
router.post('/locations/batch', batchLocationsRule, validate, labelController.getBatchLocationLabels);

module.exports = router;
