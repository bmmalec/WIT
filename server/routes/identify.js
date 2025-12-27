/**
 * Identify Routes
 * Routes for AI-powered item identification
 */

const express = require('express');
const { body } = require('express-validator');
const identifyController = require('../controllers/identifyController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const imageValidation = [
  body('image')
    .notEmpty()
    .withMessage('Image is required'),
  body('mediaType')
    .optional()
    .isIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    .withMessage('Invalid media type'),
];

/**
 * @route   POST /api/identify/image
 * @desc    Identify item from image using AI
 * @access  Private
 */
router.post('/image', imageValidation, validate, identifyController.identifyImage);

/**
 * @route   POST /api/identify/describe
 * @desc    Get quick description of item from image
 * @access  Private
 */
router.post('/describe', imageValidation, validate, identifyController.describeImage);

// UPC validation rules
const upcValidation = [
  body('code')
    .notEmpty()
    .withMessage('Barcode is required')
    .isString()
    .withMessage('Barcode must be a string'),
];

/**
 * @route   POST /api/identify/upc
 * @desc    Lookup product by UPC/barcode
 * @access  Private
 */
router.post('/upc', upcValidation, validate, identifyController.lookupUpc);

module.exports = router;
