const mongoose = require('mongoose');
const Item = require('../models/Item');
const Location = require('../models/Location');
const Category = require('../models/Category');
const permissionService = require('./permissionService');

class AnalyticsService {
  /**
   * Get accessible location IDs as ObjectIds for aggregation
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Array of ObjectId
   */
  async _getLocationIds(userId) {
    const ids = await permissionService.getAccessibleLocationIds(userId);
    return ids.map(id => new mongoose.Types.ObjectId(id));
  }

  /**
   * Get overview statistics for user's inventory
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Overview stats
   */
  async getOverview(userId) {
    // Get all accessible location IDs for the user
    const locationIds = await this._getLocationIds(userId);

    // Get total items count and value
    const itemStats = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$value.amount', 0] },
                { $ifNull: ['$quantity.value', 1] },
              ],
            },
          },
          totalQuantity: { $sum: { $ifNull: ['$quantity.value', 1] } },
          perishableCount: {
            $sum: { $cond: ['$isPerishable', 1, 0] },
          },
        },
      },
    ]);

    const stats = itemStats[0] || {
      totalItems: 0,
      totalValue: 0,
      totalQuantity: 0,
      perishableCount: 0,
    };

    // Get location count
    const locationCount = locationIds.length;

    // Get low stock count
    const lowStockCount = await Item.countDocuments({
      locationId: { $in: locationIds },
      isActive: true,
      'quantity.minimum': { $gt: 0 },
      $expr: { $lt: ['$quantity.value', '$quantity.minimum'] },
    });

    // Get expiring soon count (within 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = await Item.countDocuments({
      locationId: { $in: locationIds },
      isActive: true,
      isPerishable: true,
      expirationDate: { $lte: sevenDaysFromNow, $gt: now },
    });

    // Get expired count
    const expiredCount = await Item.countDocuments({
      locationId: { $in: locationIds },
      isActive: true,
      isPerishable: true,
      expirationDate: { $lt: now },
    });

    return {
      totalItems: stats.totalItems,
      totalValue: Math.round(stats.totalValue * 100) / 100,
      totalQuantity: stats.totalQuantity,
      locationCount,
      perishableCount: stats.perishableCount,
      lowStockCount,
      expiringSoonCount,
      expiredCount,
    };
  }

  /**
   * Get items breakdown by category
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Category breakdown
   */
  async getByCategory(userId) {
    const locationIds = await this._getLocationIds(userId);

    const breakdown = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          totalValue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$value.amount', 0] },
                { $ifNull: ['$quantity.value', 1] },
              ],
            },
          },
          totalQuantity: { $sum: { $ifNull: ['$quantity.value', 1] } },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalValue: { $round: ['$totalValue', 2] },
          totalQuantity: 1,
          name: { $ifNull: ['$category.name', 'Uncategorized'] },
          icon: { $ifNull: ['$category.icon', '📦'] },
          color: { $ifNull: ['$category.color', '#6B7280'] },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return breakdown;
  }

  /**
   * Get items breakdown by location
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Location breakdown
   */
  async getByLocation(userId) {
    const locationIds = await this._getLocationIds(userId);

    const breakdown = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$locationId',
          count: { $sum: 1 },
          totalValue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$value.amount', 0] },
                { $ifNull: ['$quantity.value', 1] },
              ],
            },
          },
          totalQuantity: { $sum: { $ifNull: ['$quantity.value', 1] } },
        },
      },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'location',
        },
      },
      {
        $unwind: '$location',
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalValue: { $round: ['$totalValue', 2] },
          totalQuantity: 1,
          name: '$location.name',
          icon: '$location.icon',
          type: '$location.type',
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return breakdown;
  }

  /**
   * Get expiration forecast
   * @param {ObjectId} userId - User ID
   * @param {number} days - Number of days to forecast (default 30)
   * @returns {Promise<Object>} Expiration forecast
   */
  async getExpirationForecast(userId, days = 30) {
    const locationIds = await this._getLocationIds(userId);

    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Get items expiring in the forecast period grouped by week
    const forecast = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: true,
          isPerishable: true,
          expirationDate: { $gte: now, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$expirationDate' },
          },
          count: { $sum: 1 },
          items: {
            $push: {
              _id: '$_id',
              name: '$name',
              expirationDate: '$expirationDate',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get already expired items
    const expired = await Item.find({
      locationId: { $in: locationIds },
      isActive: true,
      isPerishable: true,
      expirationDate: { $lt: now },
    })
      .select('name expirationDate locationId')
      .populate('locationId', 'name icon')
      .sort({ expirationDate: -1 })
      .limit(10)
      .lean();

    return {
      forecast,
      expired,
      summary: {
        expiredCount: await Item.countDocuments({
          locationId: { $in: locationIds },
          isActive: true,
          isPerishable: true,
          expirationDate: { $lt: now },
        }),
        expiringThisWeek: await Item.countDocuments({
          locationId: { $in: locationIds },
          isActive: true,
          isPerishable: true,
          expirationDate: {
            $gte: now,
            $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
        expiringThisMonth: await Item.countDocuments({
          locationId: { $in: locationIds },
          isActive: true,
          isPerishable: true,
          expirationDate: { $gte: now, $lte: endDate },
        }),
      },
    };
  }

  /**
   * Get consumption trends
   * @param {ObjectId} userId - User ID
   * @param {number} days - Number of days to analyze (default 30)
   * @returns {Promise<Object>} Consumption trends
   */
  async getConsumptionTrends(userId, days = 30) {
    const locationIds = await this._getLocationIds(userId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get consumed and discarded items grouped by day
    const trends = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: false,
          statusReason: { $in: ['consumed', 'discarded'] },
          statusChangedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$statusChangedAt' } },
            reason: '$statusReason',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Reshape into daily data
    const dailyData = {};
    trends.forEach(item => {
      const date = item._id.date;
      if (!dailyData[date]) {
        dailyData[date] = { date, consumed: 0, discarded: 0 };
      }
      dailyData[date][item._id.reason] = item.count;
    });

    // Get totals
    const totals = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: false,
          statusReason: { $in: ['consumed', 'discarded'] },
          statusChangedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$statusReason',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalConsumed = totals.find(t => t._id === 'consumed')?.count || 0;
    const totalDiscarded = totals.find(t => t._id === 'discarded')?.count || 0;
    const wasteRate = totalConsumed + totalDiscarded > 0
      ? Math.round((totalDiscarded / (totalConsumed + totalDiscarded)) * 100)
      : 0;

    // Get top consumed items (by category)
    const topCategories = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: false,
          statusReason: 'consumed',
          statusChangedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          name: { $ifNull: ['$category.name', 'Uncategorized'] },
          icon: { $ifNull: ['$category.icon', '📦'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return {
      daily: Object.values(dailyData),
      totals: {
        consumed: totalConsumed,
        discarded: totalDiscarded,
        wasteRate,
      },
      topCategories,
    };
  }

  /**
   * Get storage type distribution
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Storage type breakdown
   */
  async getStorageDistribution(userId) {
    const locationIds = await this._getLocationIds(userId);

    const distribution = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: true,
          isPerishable: true,
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$storageType', 'pantry'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const labels = {
      pantry: { name: 'Pantry', icon: '🏠', color: '#F59E0B' },
      refrigerated: { name: 'Refrigerated', icon: '❄️', color: '#3B82F6' },
      frozen: { name: 'Frozen', icon: '🧊', color: '#8B5CF6' },
    };

    return distribution.map(item => ({
      type: item._id,
      count: item.count,
      ...labels[item._id] || { name: item._id, icon: '📦', color: '#6B7280' },
    }));
  }

  /**
   * Get value by location (for treemap/chart)
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Value distribution
   */
  async getValueDistribution(userId) {
    const locationIds = await this._getLocationIds(userId);

    const distribution = await Item.aggregate([
      {
        $match: {
          locationId: { $in: locationIds },
          isActive: true,
          'value.amount': { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$locationId',
          totalValue: {
            $sum: {
              $multiply: [
                '$value.amount',
                { $ifNull: ['$quantity.value', 1] },
              ],
            },
          },
          itemCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'location',
        },
      },
      {
        $unwind: '$location',
      },
      {
        $project: {
          locationId: '$_id',
          name: '$location.name',
          icon: '$location.icon',
          totalValue: { $round: ['$totalValue', 2] },
          itemCount: 1,
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
    ]);

    return distribution;
  }
}

module.exports = new AnalyticsService();
