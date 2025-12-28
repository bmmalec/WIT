/**
 * Notification Service
 * Handles creating, sending, and managing notifications
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const Item = require('../models/Item');
const emailService = require('./emailService');
const permissionService = require('./permissionService');

class NotificationService {
  /**
   * Check and create expiration notifications for a user
   * @param {ObjectId} userId - User ID
   * @param {boolean} sendEmail - Whether to send email notification
   * @returns {Promise<Object|null>} Created notification or null
   */
  async checkExpirations(userId, sendEmail = false) {
    const user = await User.findById(userId);
    if (!user) return null;

    const settings = user.settings?.notifications;
    if (!settings?.enabled) return null;

    // Get user's accessible locations
    const locationIds = await permissionService.getAccessibleLocationIds(userId);
    if (locationIds.length === 0) return null;

    // Get days ahead from user settings
    const daysAhead = settings.email?.expirationDaysAhead || 7;

    // Find expiring items
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const expiringItems = await Item.find({
      locationId: { $in: locationIds },
      isActive: true,
      isPerishable: true,
      expirationDate: { $lte: futureDate, $gte: now },
    })
      .populate('locationId', 'name')
      .sort({ expirationDate: 1 })
      .lean();

    if (expiringItems.length === 0) return null;

    // Create in-app notification if enabled
    let notification = null;
    if (settings.inApp?.enabled && settings.inApp?.expiration) {
      notification = await Notification.createExpirationNotification(
        userId,
        expiringItems,
        daysAhead
      );
    }

    // Send email if enabled and requested
    if (sendEmail && settings.email?.enabled && settings.email?.expiration) {
      try {
        await emailService.sendExpirationAlert(user, expiringItems);
        if (notification) {
          notification.channels.email = true;
          notification.channels.emailSentAt = new Date();
          await notification.save();
        }
      } catch (error) {
        console.error('Failed to send expiration email:', error.message);
      }
    }

    return notification;
  }

  /**
   * Check and create low stock notifications for a user
   * @param {ObjectId} userId - User ID
   * @param {boolean} sendEmail - Whether to send email notification
   * @returns {Promise<Object|null>} Created notification or null
   */
  async checkLowStock(userId, sendEmail = false) {
    const user = await User.findById(userId);
    if (!user) return null;

    const settings = user.settings?.notifications;
    if (!settings?.enabled) return null;

    // Get user's accessible locations
    const locationIds = await permissionService.getAccessibleLocationIds(userId);
    if (locationIds.length === 0) return null;

    // Find low stock items
    const lowStockItems = await Item.find({
      locationId: { $in: locationIds },
      isActive: true,
      'quantity.minimum': { $gt: 0 },
      $expr: { $lt: ['$quantity.value', '$quantity.minimum'] },
    })
      .populate('locationId', 'name')
      .sort({ 'quantity.value': 1 })
      .lean();

    if (lowStockItems.length === 0) return null;

    // Create in-app notification if enabled
    let notification = null;
    if (settings.inApp?.enabled && settings.inApp?.lowStock) {
      notification = await Notification.createLowStockNotification(userId, lowStockItems);
    }

    // Send email if enabled and requested
    if (sendEmail && settings.email?.enabled && settings.email?.lowStock) {
      try {
        await emailService.sendLowStockAlert(user, lowStockItems);
        if (notification) {
          notification.channels.email = true;
          notification.channels.emailSentAt = new Date();
          await notification.save();
        }
      } catch (error) {
        console.error('Failed to send low stock email:', error.message);
      }
    }

    return notification;
  }

  /**
   * Send daily/weekly digest for a user
   * @param {ObjectId} userId - User ID
   * @param {string} frequency - 'daily' or 'weekly'
   * @returns {Promise<boolean>} Whether digest was sent
   */
  async sendDigest(userId, frequency) {
    const user = await User.findById(userId);
    if (!user) return false;

    const settings = user.settings?.notifications;
    if (!settings?.enabled || !settings.email?.enabled) return false;
    if (settings.email?.frequency !== frequency) return false;

    // Get user's accessible locations
    const locationIds = await permissionService.getAccessibleLocationIds(userId);
    if (locationIds.length === 0) return false;

    const daysAhead = settings.email?.expirationDaysAhead || 7;
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Get expiring items if enabled
    let expiringItems = [];
    if (settings.email?.expiration) {
      expiringItems = await Item.find({
        locationId: { $in: locationIds },
        isActive: true,
        isPerishable: true,
        expirationDate: { $lte: futureDate, $gte: now },
      })
        .populate('locationId', 'name')
        .sort({ expirationDate: 1 })
        .lean();
    }

    // Get low stock items if enabled
    let lowStockItems = [];
    if (settings.email?.lowStock) {
      lowStockItems = await Item.find({
        locationId: { $in: locationIds },
        isActive: true,
        'quantity.minimum': { $gt: 0 },
        $expr: { $lt: ['$quantity.value', '$quantity.minimum'] },
      })
        .populate('locationId', 'name')
        .sort({ 'quantity.value': 1 })
        .lean();
    }

    // Nothing to report
    if (expiringItems.length === 0 && lowStockItems.length === 0) {
      return false;
    }

    try {
      await emailService.sendDigest(user, {
        expiringItems,
        lowStockItems,
        frequency,
      });

      // Update last digest sent timestamp
      await User.updateOne(
        { _id: userId },
        { $set: { 'settings.notifications.email.lastDigestSent': new Date() } }
      );

      return true;
    } catch (error) {
      console.error('Failed to send digest:', error.message);
      return false;
    }
  }

  /**
   * Process all users for digest emails
   * @param {string} frequency - 'daily' or 'weekly'
   */
  async processDigests(frequency) {
    console.log(`Processing ${frequency} digests...`);

    const currentHour = new Date().getHours();

    // Find users who want this frequency and have this digest hour
    const users = await User.find({
      'settings.notifications.enabled': true,
      'settings.notifications.email.enabled': true,
      'settings.notifications.email.frequency': frequency,
      'settings.notifications.email.digestHour': currentHour,
    }).select('_id');

    console.log(`Found ${users.length} users for ${frequency} digest at hour ${currentHour}`);

    let sent = 0;
    for (const user of users) {
      const result = await this.sendDigest(user._id, frequency);
      if (result) sent++;
    }

    console.log(`Sent ${sent} ${frequency} digest emails`);
  }

  /**
   * Get notifications for a user
   * @param {ObjectId} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Notifications
   */
  async getNotifications(userId, options = {}) {
    return Notification.getForUser(userId, options);
  }

  /**
   * Get unread notification count
   * @param {ObjectId} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    return Notification.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markRead(userId, notificationId) {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) return null;
    return notification.markRead();
  }

  /**
   * Mark all notifications as read
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAllRead(userId) {
    return Notification.markAllRead(userId);
  }

  /**
   * Dismiss notification
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async dismiss(userId, notificationId) {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) return null;
    return notification.dismiss();
  }

  /**
   * Dismiss all notifications
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async dismissAll(userId) {
    return Notification.dismissAll(userId);
  }

  /**
   * Delete a notification
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} notificationId - Notification ID
   * @returns {Promise<boolean>} Whether deleted
   */
  async delete(userId, notificationId) {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    return result.deletedCount > 0;
  }

  /**
   * Create a custom notification
   * @param {ObjectId} userId - User ID
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async create(userId, data) {
    return Notification.create({
      userId,
      ...data,
    });
  }

  /**
   * Send test notification to verify email settings
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object>} Send result
   */
  async sendTestEmail(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    return emailService.send({
      to: user.email,
      subject: '[WIT] Test Notification',
      html: emailService.wrapEmail(`
        <h2 style="color: #1F2937; margin-bottom: 20px;">Test Notification</h2>
        <p style="color: #4B5563; margin-bottom: 20px;">
          This is a test email to verify your notification settings are working correctly.
        </p>
        <p style="color: #4B5563;">
          If you received this email, your email notifications are configured properly!
        </p>
      `),
    });
  }
}

module.exports = new NotificationService();
