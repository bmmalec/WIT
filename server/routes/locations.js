const express = require('express');
const { body, param, query } = require('express-validator');
const locationController = require('../controllers/locationController');
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { getTypeValues } = require('../seeds/locationTypes');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get valid location types from seed data
const validLocationTypes = getTypeValues();

// Validation rules
const createLocationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(validLocationTypes)
    .withMessage('Invalid location type'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('customType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Custom type cannot exceed 50 characters'),
  body('icon')
    .optional()
    .trim(),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color (e.g., #FF5733)'),
  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent ID'),
  body('address.street')
    .optional()
    .trim(),
  body('address.city')
    .optional()
    .trim(),
  body('address.state')
    .optional()
    .trim(),
  body('address.zip')
    .optional()
    .trim(),
  body('address.country')
    .optional()
    .trim(),
  body('capacity.type')
    .optional()
    .isIn(['unlimited', 'slots', 'volume'])
    .withMessage('Capacity type must be unlimited, slots, or volume'),
  body('capacity.max')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity max must be a positive integer'),
];

const updateLocationRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid location ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('type')
    .optional()
    .isIn(validLocationTypes)
    .withMessage('Invalid location type'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('customType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Custom type cannot exceed 50 characters'),
  body('icon')
    .optional()
    .trim(),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
];

const idParamRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid location ID'),
];

// Routes
router.post('/', createLocationRules, validate, locationController.create);
router.get('/', locationController.getAll);
router.get('/tree', locationController.getTree);
router.get('/:id', idParamRule, validate, locationController.getOne);
router.get('/:id/breadcrumb', idParamRule, validate, locationController.getBreadcrumb);
router.get('/:id/items', idParamRule, validate, itemController.getByLocation);
router.put('/:id', updateLocationRules, validate, locationController.update);
router.delete('/:id', idParamRule, validate, locationController.delete);

module.exports = router;
