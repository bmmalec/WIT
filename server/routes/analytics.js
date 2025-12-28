const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Analytics endpoints
router.get('/overview', analyticsController.getOverview);
router.get('/by-category', analyticsController.getByCategory);
router.get('/by-location', analyticsController.getByLocation);
router.get('/expiration-forecast', analyticsController.getExpirationForecast);
router.get('/consumption-trends', analyticsController.getConsumptionTrends);
router.get('/storage-distribution', analyticsController.getStorageDistribution);
router.get('/value-distribution', analyticsController.getValueDistribution);
router.get('/all', analyticsController.getAll);

module.exports = router;
