const analyticsService = require('../services/analyticsService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get overview statistics
 * @route   GET /api/analytics/overview
 * @access  Private
 */
exports.getOverview = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getOverview(req.user._id);

  res.status(200).json({
    success: true,
    data: { overview },
  });
});

/**
 * @desc    Get items breakdown by category
 * @route   GET /api/analytics/by-category
 * @access  Private
 */
exports.getByCategory = asyncHandler(async (req, res) => {
  const breakdown = await analyticsService.getByCategory(req.user._id);

  res.status(200).json({
    success: true,
    data: { breakdown },
  });
});

/**
 * @desc    Get items breakdown by location
 * @route   GET /api/analytics/by-location
 * @access  Private
 */
exports.getByLocation = asyncHandler(async (req, res) => {
  const breakdown = await analyticsService.getByLocation(req.user._id);

  res.status(200).json({
    success: true,
    data: { breakdown },
  });
});

/**
 * @desc    Get expiration forecast
 * @route   GET /api/analytics/expiration-forecast
 * @access  Private
 */
exports.getExpirationForecast = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const forecast = await analyticsService.getExpirationForecast(req.user._id, days);

  res.status(200).json({
    success: true,
    data: { forecast },
  });
});

/**
 * @desc    Get consumption trends
 * @route   GET /api/analytics/consumption-trends
 * @access  Private
 */
exports.getConsumptionTrends = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const trends = await analyticsService.getConsumptionTrends(req.user._id, days);

  res.status(200).json({
    success: true,
    data: { trends },
  });
});

/**
 * @desc    Get storage type distribution
 * @route   GET /api/analytics/storage-distribution
 * @access  Private
 */
exports.getStorageDistribution = asyncHandler(async (req, res) => {
  const distribution = await analyticsService.getStorageDistribution(req.user._id);

  res.status(200).json({
    success: true,
    data: { distribution },
  });
});

/**
 * @desc    Get value distribution by location
 * @route   GET /api/analytics/value-distribution
 * @access  Private
 */
exports.getValueDistribution = asyncHandler(async (req, res) => {
  const distribution = await analyticsService.getValueDistribution(req.user._id);

  res.status(200).json({
    success: true,
    data: { distribution },
  });
});

/**
 * @desc    Get all analytics data (combined endpoint)
 * @route   GET /api/analytics/all
 * @access  Private
 */
exports.getAll = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;

  const [
    overview,
    byCategory,
    byLocation,
    expirationForecast,
    consumptionTrends,
    storageDistribution,
    valueDistribution,
  ] = await Promise.all([
    analyticsService.getOverview(req.user._id),
    analyticsService.getByCategory(req.user._id),
    analyticsService.getByLocation(req.user._id),
    analyticsService.getExpirationForecast(req.user._id, days),
    analyticsService.getConsumptionTrends(req.user._id, days),
    analyticsService.getStorageDistribution(req.user._id),
    analyticsService.getValueDistribution(req.user._id),
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview,
      byCategory,
      byLocation,
      expirationForecast,
      consumptionTrends,
      storageDistribution,
      valueDistribution,
    },
  });
});
