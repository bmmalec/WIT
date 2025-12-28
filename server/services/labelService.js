/**
 * Label Service
 * Generates QR codes and label data for items and locations
 */

const QRCode = require('qrcode');
const Item = require('../models/Item');
const Location = require('../models/Location');
const permissionService = require('./permissionService');

// Label sizes in mm
const LABEL_SIZES = {
  small: { width: 25, height: 25, name: 'Small (1" x 1")' },
  medium: { width: 50, height: 25, name: 'Medium (2" x 1")' },
  large: { width: 50, height: 50, name: 'Large (2" x 2")' },
  shelf: { width: 100, height: 50, name: 'Shelf (4" x 2")' },
};

/**
 * Generate QR code as data URL
 */
const generateQRCode = async (data, options = {}) => {
  const qrOptions = {
    type: 'image/png',
    width: options.size || 200,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  };

  try {
    const dataUrl = await QRCode.toDataURL(data, qrOptions);
    return dataUrl;
  } catch (err) {
    console.error('QR code generation failed:', err);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate label data for an item
 */
const generateItemLabel = async (itemId, userId, options = {}) => {
  const item = await Item.findById(itemId)
    .populate('locationId', 'name path')
    .populate('categoryId', 'name icon');

  if (!item) {
    throw new Error('Item not found');
  }

  // Check permissions
  const accessibleLocationIds = await permissionService.getAccessibleLocationIds(userId);
  const hasAccess = accessibleLocationIds.some(id => id.equals(item.locationId._id));
  if (!hasAccess) {
    throw new Error('Access denied');
  }

  // Generate QR code with item URL
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const itemUrl = `${baseUrl}/item/${item._id}`;
  const qrCode = await generateQRCode(itemUrl, { size: options.qrSize || 200 });

  // Build label data
  const labelData = {
    type: 'item',
    id: item._id.toString(),
    name: item.name,
    barcode: item.barcode || null,
    location: item.locationId?.name || 'Unknown',
    category: item.categoryId?.name || null,
    categoryIcon: item.categoryId?.icon || null,
    quantity: item.quantity,
    unit: item.unit || null,
    expirationDate: item.expirationDate ? formatDate(item.expirationDate) : null,
    qrCode,
    url: itemUrl,
    generatedAt: new Date().toISOString(),
  };

  return labelData;
};

/**
 * Generate label data for a location
 */
const generateLocationLabel = async (locationId, userId, options = {}) => {
  const location = await Location.findById(locationId);

  if (!location) {
    throw new Error('Location not found');
  }

  // Check permissions
  const accessibleLocationIds = await permissionService.getAccessibleLocationIds(userId);
  const hasAccess = accessibleLocationIds.some(id => id.equals(location._id));
  if (!hasAccess) {
    throw new Error('Access denied');
  }

  // Get location path for display
  let locationPath = location.name;
  if (location.path) {
    const pathIds = location.path.split(',').filter(Boolean);
    if (pathIds.length > 0) {
      const ancestors = await Location.find({ _id: { $in: pathIds } }).select('name');
      const ancestorNames = pathIds.map(id => {
        const ancestor = ancestors.find(a => a._id.toString() === id);
        return ancestor?.name || '';
      }).filter(Boolean);
      if (ancestorNames.length > 0) {
        locationPath = [...ancestorNames, location.name].join(' > ');
      }
    }
  }

  // Generate QR code with location URL
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const locationUrl = `${baseUrl}/location/${location._id}`;
  const qrCode = await generateQRCode(locationUrl, { size: options.qrSize || 200 });

  // Get item count
  const itemCount = await Item.countDocuments({ locationId: location._id, isActive: true });

  // Build label data
  const labelData = {
    type: 'location',
    id: location._id.toString(),
    name: location.name,
    icon: location.icon || '📍',
    locationType: location.type,
    path: locationPath,
    itemCount,
    qrCode,
    url: locationUrl,
    generatedAt: new Date().toISOString(),
  };

  return labelData;
};

/**
 * Generate batch labels for multiple items
 */
const generateBatchItemLabels = async (itemIds, userId, options = {}) => {
  const labels = [];
  const errors = [];

  for (const itemId of itemIds) {
    try {
      const label = await generateItemLabel(itemId, userId, options);
      labels.push(label);
    } catch (err) {
      errors.push({ itemId, error: err.message });
    }
  }

  return { labels, errors };
};

/**
 * Generate batch labels for multiple locations
 */
const generateBatchLocationLabels = async (locationIds, userId, options = {}) => {
  const labels = [];
  const errors = [];

  for (const locationId of locationIds) {
    try {
      const label = await generateLocationLabel(locationId, userId, options);
      labels.push(label);
    } catch (err) {
      errors.push({ locationId, error: err.message });
    }
  }

  return { labels, errors };
};

/**
 * Generate labels for all items in a location
 */
const generateLocationItemLabels = async (locationId, userId, options = {}) => {
  // Check permissions
  const accessibleLocationIds = await permissionService.getAccessibleLocationIds(userId);
  const hasAccess = accessibleLocationIds.some(id => id.toString() === locationId);
  if (!hasAccess) {
    throw new Error('Access denied');
  }

  // Get all items in location
  const items = await Item.find({ locationId, isActive: true }).select('_id');
  const itemIds = items.map(item => item._id.toString());

  return generateBatchItemLabels(itemIds, userId, options);
};

// Helper function
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

module.exports = {
  LABEL_SIZES,
  generateQRCode,
  generateItemLabel,
  generateLocationLabel,
  generateBatchItemLabels,
  generateBatchLocationLabels,
  generateLocationItemLabels,
};
