const express = require('express');
const { body, param } = require('express-validator');
const shoppingListController = require('../controllers/shoppingListController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const addItemRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('quantity.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity must be 0 or greater'),
  body('quantity.unit')
    .optional()
    .isIn(['each', 'box', 'pack', 'lb', 'oz', 'kg', 'g', 'l', 'ml', 'ft', 'in', 'm', 'cm'])
    .withMessage('Invalid quantity unit'),
  body('targetLocationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid location ID'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('priority')
    .optional()
    .isIn([1, 2, 3])
    .withMessage('Priority must be 1, 2, or 3'),
  body('estimatedPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be 0 or greater'),
];

const updateItemRules = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('quantity.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity must be 0 or greater'),
  body('priority')
    .optional()
    .isIn([1, 2, 3])
    .withMessage('Priority must be 1, 2, or 3'),
];

const itemIdRule = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID'),
];

// Routes
router.get('/', shoppingListController.getList);
router.get('/suggestions', shoppingListController.getSuggestions);

router.post('/items', addItemRules, validate, shoppingListController.addItem);
router.put('/items/:itemId', updateItemRules, validate, shoppingListController.updateItem);
router.delete('/items/:itemId', itemIdRule, validate, shoppingListController.removeItem);
router.put('/items/:itemId/purchased', itemIdRule, validate, shoppingListController.markPurchased);
router.put('/items/:itemId/skipped', itemIdRule, validate, shoppingListController.markSkipped);

router.post('/suggestions/:itemId', itemIdRule, validate, shoppingListController.addFromSuggestion);
router.delete('/purchased', shoppingListController.clearPurchased);

module.exports = router;
