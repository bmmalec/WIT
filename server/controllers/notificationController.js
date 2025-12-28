const notificationService = require('../services/notificationService');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Get notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const { status, type, limit = 20, skip = 0 } = req.query;

  const notifications = await notificationService.getNotifications(req.user._id, {
    status,
    type,
    limit: parseInt(limit, 10),
    skip: parseInt(skip, 10),
  });

  const unreadCount = await notificationService.getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    data: { count },
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user._id, req.params.id);

  if (!notification) {
    throw AppError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * @desc    Dismiss notification
 * @route   PUT /api/notifications/:id/dismiss
 * @access  Private
 */
exports.dismiss = asyncHandler(async (req, res) => {
  const notification = await notificationService.dismiss(req.user._id, req.params.id);

  if (!notification) {
    throw AppError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

/**
 * @desc    Dismiss all notifications
 * @route   PUT /api/notifications/dismiss-all
 * @access  Private
 */
exports.dismissAll = asyncHandler(async (req, res) => {
  await notificationService.dismissAll(req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications dismissed',
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const deleted = await notificationService.delete(req.user._id, req.params.id);

  if (!deleted) {
    throw AppError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted',
  });
});

/**
 * @desc    Get notification settings
 * @route   GET /api/notifications/settings
 * @access  Private
 */
exports.getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      settings: user.settings?.notifications || {},
    },
  });
});

/**
 * @desc    Update notification settings
 * @route   PUT /api/notifications/settings
 * @access  Private
 */
exports.updateSettings = asyncHandler(async (req, res) => {
  const { enabled, email, inApp } = req.body;

  const updates = {};

  if (typeof enabled === 'boolean') {
    updates['settings.notifications.enabled'] = enabled;
  }

  if (email) {
    if (typeof email.enabled === 'boolean') {
      updates['settings.notifications.email.enabled'] = email.enabled;
    }
    if (typeof email.expiration === 'boolean') {
      updates['settings.notifications.email.expiration'] = email.expiration;
    }
    if (typeof email.lowStock === 'boolean') {
      updates['settings.notifications.email.lowStock'] = email.lowStock;
    }
    if (email.frequency && ['immediate', 'daily', 'weekly'].includes(email.frequency)) {
      updates['settings.notifications.email.frequency'] = email.frequency;
    }
    if (email.expirationDaysAhead && email.expirationDaysAhead >= 1 && email.expirationDaysAhead <= 30) {
      updates['settings.notifications.email.expirationDaysAhead'] = email.expirationDaysAhead;
    }
    if (typeof email.digestHour === 'number' && email.digestHour >= 0 && email.digestHour <= 23) {
      updates['settings.notifications.email.digestHour'] = email.digestHour;
    }
  }

  if (inApp) {
    if (typeof inApp.enabled === 'boolean') {
      updates['settings.notifications.inApp.enabled'] = inApp.enabled;
    }
    if (typeof inApp.expiration === 'boolean') {
      updates['settings.notifications.inApp.expiration'] = inApp.expiration;
    }
    if (typeof inApp.lowStock === 'boolean') {
      updates['settings.notifications.inApp.lowStock'] = inApp.lowStock;
    }
    if (typeof inApp.shoppingList === 'boolean') {
      updates['settings.notifications.inApp.shoppingList'] = inApp.shoppingList;
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: {
      settings: user.settings?.notifications,
    },
    message: 'Notification settings updated',
  });
});

/**
 * @desc    Send test email notification
 * @route   POST /api/notifications/test-email
 * @access  Private
 */
exports.sendTestEmail = asyncHandler(async (req, res) => {
  await notificationService.sendTestEmail(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Test email sent',
  });
});

/**
 * @desc    Manually trigger notification check
 * @route   POST /api/notifications/check
 * @access  Private
 */
exports.triggerCheck = asyncHandler(async (req, res) => {
  const { type, sendEmail = false } = req.body;

  let result = null;

  if (type === 'expiration' || !type) {
    result = await notificationService.checkExpirations(req.user._id, sendEmail);
  }

  if (type === 'lowStock' || !type) {
    const lowStockResult = await notificationService.checkLowStock(req.user._id, sendEmail);
    result = result || lowStockResult;
  }

  res.status(200).json({
    success: true,
    data: { notification: result },
    message: result ? 'Notifications checked and created' : 'No items need attention',
  });
});
