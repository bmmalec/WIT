const express = require('express');
const { query } = require('express-validator');
const exportController = require('../controllers/exportController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const exportFilterRules = [
  query('locationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid location ID'),
  query('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  query('expirationStatus')
    .optional()
    .isIn(['expired', 'expiring_soon', 'expiring_month', 'no_expiration'])
    .withMessage('Invalid expiration status'),
  query('lowStock')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('lowStock must be true or false'),
];

// Routes
router.get('/items/csv', exportFilterRules, validate, exportController.exportItemsCSV);
router.get('/locations/csv', exportController.exportLocationsCSV);
router.get('/backup', exportController.exportBackup);
router.get('/report', exportController.exportReport);
router.get('/preview', exportFilterRules, validate, exportController.getExportPreview);

module.exports = router;
