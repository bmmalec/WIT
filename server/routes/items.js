const express = require('express');
const { body, param, query } = require('express-validator');
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createItemRules = [
  body('locationId')
    .isMongoId()
    .withMessage('Valid location ID is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('itemType')
    .optional()
    .isIn(['tool', 'supply', 'part', 'consumable', 'equipment', 'other'])
    .withMessage('Invalid item type'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand cannot exceed 50 characters'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Model cannot exceed 50 characters'),
  body('quantity.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity must be 0 or greater'),
  body('quantity.unit')
    .optional()
    .isIn(['each', 'box', 'pack', 'lb', 'oz', 'kg', 'g', 'l', 'ml', 'ft', 'in', 'm', 'cm'])
    .withMessage('Invalid quantity unit'),
  body('value.purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be 0 or greater'),
  body('value.currentValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current value must be 0 or greater'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('alternateNames')
    .optional()
    .isArray()
    .withMessage('Alternate names must be an array'),
];

const updateItemRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid item ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('itemType')
    .optional()
    .isIn(['tool', 'supply', 'part', 'consumable', 'equipment', 'other'])
    .withMessage('Invalid item type'),
];

const itemIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid item ID'),
];

const moveItemRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid item ID'),
  body('locationId')
    .isMongoId()
    .withMessage('Valid destination location ID is required'),
];

const adjustQuantityRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid item ID'),
  body('adjustment')
    .isFloat()
    .withMessage('Adjustment must be a number'),
];

const searchRules = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters'),
];

// Routes
router.get('/search', searchRules, validate, itemController.search);
router.get('/low-stock', itemController.getLowStock);

router.post('/', createItemRules, validate, itemController.create);
router.get('/:id', itemIdRule, validate, itemController.getById);
router.put('/:id', updateItemRules, validate, itemController.update);
router.delete('/:id', itemIdRule, validate, itemController.delete);
router.put('/:id/move', moveItemRules, validate, itemController.move);
router.put('/:id/quantity', adjustQuantityRules, validate, itemController.adjustQuantity);

module.exports = router;
