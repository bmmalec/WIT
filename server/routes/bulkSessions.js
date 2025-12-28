const express = require('express');
const { body, param, query } = require('express-validator');
const bulkSessionController = require('../controllers/bulkSessionController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const startSessionRules = [
  body('targetLocationId')
    .isMongoId()
    .withMessage('Valid target location ID is required'),
  body('defaultCategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
];

const sessionIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),
];

const changeLocationRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('locationId')
    .isMongoId()
    .withMessage('Valid location ID is required'),
];

const addItemRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('locationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid location ID'),
  body('itemType')
    .optional()
    .isIn(['tool', 'supply', 'part', 'consumable', 'equipment', 'other'])
    .withMessage('Invalid item type'),
];

const updateItemRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),
  param('tempId')
    .notEmpty()
    .withMessage('Item temp ID is required'),
];

const removeItemRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID'),
  param('tempId')
    .notEmpty()
    .withMessage('Item temp ID is required'),
];

// Routes
router.get('/', bulkSessionController.getSessionHistory);
router.get('/active', bulkSessionController.getActiveSession);
router.post('/', startSessionRules, validate, bulkSessionController.startSession);
router.get('/:id', sessionIdRule, validate, bulkSessionController.getById);
router.put('/:id/target-location', changeLocationRules, validate, bulkSessionController.changeTargetLocation);
router.post('/:id/items', addItemRules, validate, bulkSessionController.addPendingItem);
router.put('/:id/items/:tempId', updateItemRules, validate, bulkSessionController.updatePendingItem);
router.delete('/:id/items/:tempId', removeItemRules, validate, bulkSessionController.removePendingItem);
router.post('/:id/commit', sessionIdRule, validate, bulkSessionController.commitSession);
router.post('/:id/cancel', sessionIdRule, validate, bulkSessionController.cancelSession);

module.exports = router;
