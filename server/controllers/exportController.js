/**
 * Export Controller
 * Handles data export requests
 */

const exportService = require('../services/exportService');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Export items as CSV
 * @route   GET /api/export/items/csv
 * @access  Private
 */
exports.exportItemsCSV = asyncHandler(async (req, res) => {
  const { locationId, categoryId, expirationStatus, lowStock } = req.query;

  const filters = {};
  if (locationId) filters.locationId = locationId;
  if (categoryId) filters.categoryId = categoryId;
  if (expirationStatus) filters.expirationStatus = expirationStatus;
  if (lowStock === 'true') filters.lowStock = true;

  const result = await exportService.generateItemsCSV(req.user._id, filters);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.content);
});

/**
 * @desc    Export locations as CSV
 * @route   GET /api/export/locations/csv
 * @access  Private
 */
exports.exportLocationsCSV = asyncHandler(async (req, res) => {
  const result = await exportService.generateLocationsCSV(req.user._id);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.content);
});

/**
 * @desc    Export full backup as JSON
 * @route   GET /api/export/backup
 * @access  Private
 */
exports.exportBackup = asyncHandler(async (req, res) => {
  const result = await exportService.generateJSONBackup(req.user._id);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.content);
});

/**
 * @desc    Generate inventory report
 * @route   GET /api/export/report
 * @access  Private
 */
exports.exportReport = asyncHandler(async (req, res) => {
  const result = await exportService.generateInventoryReport(req.user._id);

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.content);
});

/**
 * @desc    Get export preview (count of items to be exported)
 * @route   GET /api/export/preview
 * @access  Private
 */
exports.getExportPreview = asyncHandler(async (req, res) => {
  const { locationId, categoryId, expirationStatus, lowStock } = req.query;

  const filters = {};
  if (locationId) filters.locationId = locationId;
  if (categoryId) filters.categoryId = categoryId;
  if (expirationStatus) filters.expirationStatus = expirationStatus;
  if (lowStock === 'true') filters.lowStock = true;

  const items = await exportService.getExportableItems(req.user._id, filters);

  res.status(200).json({
    success: true,
    data: {
      itemCount: items.length,
      filters: {
        locationId: locationId || null,
        categoryId: categoryId || null,
        expirationStatus: expirationStatus || null,
        lowStock: lowStock === 'true',
      },
    },
  });
});
