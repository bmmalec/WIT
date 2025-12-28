/**
 * Export Service
 * Handles data export in CSV and JSON formats
 */

const Item = require('../models/Item');
const Location = require('../models/Location');
const Category = require('../models/Category');
const User = require('../models/User');
const permissionService = require('./permissionService');

/**
 * Get all accessible items for a user with full details
 */
const getExportableItems = async (userId, filters = {}) => {
  // Get accessible location IDs
  const accessibleLocationIds = await permissionService.getAccessibleLocationIds(userId);

  const query = {
    locationId: { $in: accessibleLocationIds },
    isActive: true,
  };

  // Apply filters
  if (filters.locationId) {
    // Get all descendant locations if filtering by location
    const location = await Location.findById(filters.locationId);
    if (location) {
      const descendants = await Location.find({
        path: { $regex: `^${location.path}` },
      }).select('_id');
      const locationIds = [location._id, ...descendants.map(d => d._id)];
      query.locationId = { $in: locationIds.filter(id => accessibleLocationIds.some(a => a.equals(id))) };
    }
  }

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.expirationStatus) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    switch (filters.expirationStatus) {
      case 'expired':
        query.expirationDate = { $lt: now };
        break;
      case 'expiring_soon':
        query.expirationDate = { $gte: now, $lte: weekFromNow };
        break;
      case 'expiring_month':
        query.expirationDate = { $gte: now, $lte: monthFromNow };
        break;
      case 'no_expiration':
        query.expirationDate = null;
        break;
    }
  }

  if (filters.lowStock) {
    query.$expr = {
      $and: [
        { $ne: ['$lowStockThreshold', null] },
        { $lte: ['$quantity', '$lowStockThreshold'] },
      ],
    };
  }

  const items = await Item.find(query)
    .populate('locationId', 'name path type')
    .populate('categoryId', 'name icon')
    .populate('createdBy', 'name email')
    .sort({ name: 1 });

  return items;
};

/**
 * Generate CSV content from items
 */
const generateItemsCSV = async (userId, filters = {}) => {
  const items = await getExportableItems(userId, filters);

  // CSV header
  const headers = [
    'Name',
    'Alternate Names',
    'Description',
    'Location',
    'Location Path',
    'Category',
    'Quantity',
    'Unit',
    'Low Stock Threshold',
    'Barcode',
    'Brand',
    'Model',
    'Storage Type',
    'Expiration Date',
    'Extended Expiration Date',
    'Purchase Price',
    'Current Value',
    'Estimated Value',
    'Tags',
    'Notes',
    'Created At',
    'Updated At',
  ];

  const rows = items.map(item => [
    escapeCSV(item.name),
    escapeCSV((item.alternateNames || []).join('; ')),
    escapeCSV(item.description || ''),
    escapeCSV(item.locationId?.name || ''),
    escapeCSV(getLocationPath(item.locationId)),
    escapeCSV(item.categoryId?.name || ''),
    item.quantity || 0,
    escapeCSV(item.unit || ''),
    item.lowStockThreshold || '',
    escapeCSV(item.barcode || ''),
    escapeCSV(item.brand || ''),
    escapeCSV(item.model || ''),
    escapeCSV(item.storageType || ''),
    item.expirationDate ? formatDate(item.expirationDate) : '',
    item.extendedExpirationDate ? formatDate(item.extendedExpirationDate) : '',
    item.value?.purchase || '',
    item.value?.current || '',
    item.value?.estimated || '',
    escapeCSV((item.tags || []).join('; ')),
    escapeCSV(item.notes || ''),
    formatDateTime(item.createdAt),
    formatDateTime(item.updatedAt),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return {
    content: csv,
    filename: `wit-items-export-${formatFilename(new Date())}.csv`,
    itemCount: items.length,
  };
};

/**
 * Generate locations CSV
 */
const generateLocationsCSV = async (userId) => {
  const accessibleLocationIds = await permissionService.getAccessibleLocationIds(userId);

  const locations = await Location.find({ _id: { $in: accessibleLocationIds } })
    .populate('ownerId', 'name email')
    .sort({ path: 1 });

  const headers = [
    'Name',
    'Type',
    'Description',
    'Path',
    'Icon',
    'Address Street',
    'Address City',
    'Address State',
    'Address Zip',
    'Address Country',
    'Capacity Type',
    'Capacity Max',
    'Capacity Used',
    'Owner',
    'Created At',
  ];

  const rows = locations.map(loc => [
    escapeCSV(loc.name),
    escapeCSV(loc.type || ''),
    escapeCSV(loc.description || ''),
    escapeCSV(loc.path || ''),
    escapeCSV(loc.icon || ''),
    escapeCSV(loc.address?.street || ''),
    escapeCSV(loc.address?.city || ''),
    escapeCSV(loc.address?.state || ''),
    escapeCSV(loc.address?.zip || ''),
    escapeCSV(loc.address?.country || ''),
    escapeCSV(loc.capacity?.type || 'unlimited'),
    loc.capacity?.max || '',
    loc.capacity?.used || 0,
    escapeCSV(loc.ownerId?.name || ''),
    formatDateTime(loc.createdAt),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return {
    content: csv,
    filename: `wit-locations-export-${formatFilename(new Date())}.csv`,
    locationCount: locations.length,
  };
};

/**
 * Generate full JSON backup
 */
const generateJSONBackup = async (userId) => {
  const user = await User.findById(userId).select('-password');
  const accessibleLocationIds = await permissionService.getAccessibleLocationIds(userId);

  // Get all data
  const [locations, items, categories] = await Promise.all([
    Location.find({ _id: { $in: accessibleLocationIds } }).lean(),
    Item.find({ locationId: { $in: accessibleLocationIds }, isActive: true }).lean(),
    Category.find().lean(),
  ]);

  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    data: {
      locations: locations.map(loc => ({
        ...loc,
        _id: loc._id.toString(),
        ownerId: loc.ownerId?.toString(),
        parentId: loc.parentId?.toString(),
      })),
      items: items.map(item => ({
        ...item,
        _id: item._id.toString(),
        locationId: item.locationId?.toString(),
        categoryId: item.categoryId?.toString(),
        createdBy: item.createdBy?.toString(),
      })),
      categories: categories.map(cat => ({
        ...cat,
        _id: cat._id.toString(),
      })),
    },
    summary: {
      locationCount: locations.length,
      itemCount: items.length,
      categoryCount: categories.length,
    },
  };

  return {
    content: JSON.stringify(backup, null, 2),
    filename: `wit-backup-${formatFilename(new Date())}.json`,
    summary: backup.summary,
  };
};

/**
 * Generate inventory report (summary CSV)
 */
const generateInventoryReport = async (userId) => {
  const accessibleLocationIds = await permissionService.getAccessibleLocationIds(userId);

  // Get summary data
  const [itemsByLocation, itemsByCategory, expirationSummary, valueSummary] = await Promise.all([
    // Items by location
    Item.aggregate([
      { $match: { locationId: { $in: accessibleLocationIds }, isActive: true } },
      { $group: { _id: '$locationId', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
      { $unwind: '$location' },
      { $project: { name: '$location.name', count: 1, totalQuantity: 1 } },
      { $sort: { count: -1 } },
    ]),

    // Items by category
    Item.aggregate([
      { $match: { locationId: { $in: accessibleLocationIds }, isActive: true } },
      { $group: { _id: '$categoryId', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$category.name', 'Uncategorized'] }, count: 1, totalQuantity: 1 } },
      { $sort: { count: -1 } },
    ]),

    // Expiration summary
    Item.aggregate([
      { $match: { locationId: { $in: accessibleLocationIds }, isActive: true, expirationDate: { $ne: null } } },
      {
        $project: {
          status: {
            $cond: {
              if: { $lt: ['$expirationDate', new Date()] },
              then: 'Expired',
              else: {
                $cond: {
                  if: { $lt: ['$expirationDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] },
                  then: 'Expiring This Week',
                  else: {
                    $cond: {
                      if: { $lt: ['$expirationDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] },
                      then: 'Expiring This Month',
                      else: 'Good',
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Value summary
    Item.aggregate([
      { $match: { locationId: { $in: accessibleLocationIds }, isActive: true } },
      {
        $group: {
          _id: null,
          totalPurchaseValue: { $sum: '$value.purchase' },
          totalCurrentValue: { $sum: '$value.current' },
          totalEstimatedValue: { $sum: '$value.estimated' },
          itemsWithValue: { $sum: { $cond: [{ $gt: ['$value.current', 0] }, 1, 0] } },
        },
      },
    ]),
  ]);

  // Build report sections
  const sections = [];

  // Header
  sections.push('WIT INVENTORY REPORT');
  sections.push(`Generated: ${new Date().toLocaleString()}`);
  sections.push('');

  // Summary
  const totalItems = itemsByLocation.reduce((sum, loc) => sum + loc.count, 0);
  const totalQuantity = itemsByLocation.reduce((sum, loc) => sum + loc.totalQuantity, 0);
  sections.push('=== OVERALL SUMMARY ===');
  sections.push(`Total Unique Items: ${totalItems}`);
  sections.push(`Total Quantity: ${totalQuantity}`);
  sections.push(`Total Locations: ${itemsByLocation.length}`);
  sections.push(`Total Categories: ${itemsByCategory.length}`);
  sections.push('');

  // Value summary
  if (valueSummary.length > 0) {
    const vs = valueSummary[0];
    sections.push('=== VALUE SUMMARY ===');
    sections.push(`Total Purchase Value: $${(vs.totalPurchaseValue || 0).toFixed(2)}`);
    sections.push(`Total Current Value: $${(vs.totalCurrentValue || 0).toFixed(2)}`);
    sections.push(`Total Estimated Value: $${(vs.totalEstimatedValue || 0).toFixed(2)}`);
    sections.push(`Items with Value Data: ${vs.itemsWithValue || 0}`);
    sections.push('');
  }

  // Expiration summary
  sections.push('=== EXPIRATION STATUS ===');
  expirationSummary.forEach(es => {
    sections.push(`${es._id}: ${es.count} items`);
  });
  sections.push('');

  // Items by location
  sections.push('=== ITEMS BY LOCATION ===');
  sections.push('Location,Item Count,Total Quantity');
  itemsByLocation.forEach(loc => {
    sections.push(`${escapeCSV(loc.name)},${loc.count},${loc.totalQuantity}`);
  });
  sections.push('');

  // Items by category
  sections.push('=== ITEMS BY CATEGORY ===');
  sections.push('Category,Item Count,Total Quantity');
  itemsByCategory.forEach(cat => {
    sections.push(`${escapeCSV(cat.name)},${cat.count},${cat.totalQuantity}`);
  });

  return {
    content: sections.join('\n'),
    filename: `wit-inventory-report-${formatFilename(new Date())}.txt`,
    summary: {
      totalItems,
      totalQuantity,
      locationCount: itemsByLocation.length,
      categoryCount: itemsByCategory.length,
    },
  };
};

// Helper functions
const escapeCSV = (str) => {
  if (str === null || str === undefined) return '';
  const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toISOString();
};

const formatFilename = (date) => {
  return date.toISOString().split('T')[0];
};

const getLocationPath = (location) => {
  if (!location) return '';
  if (location.path) {
    // Convert path like ",id1,id2," to readable format
    return location.name; // Simplified - full path would require additional lookups
  }
  return location.name || '';
};

module.exports = {
  generateItemsCSV,
  generateLocationsCSV,
  generateJSONBackup,
  generateInventoryReport,
  getExportableItems,
};
