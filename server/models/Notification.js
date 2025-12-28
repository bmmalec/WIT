const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // User receiving the notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Notification type
    type: {
      type: String,
      enum: ['expiration', 'low_stock', 'shopping_reminder', 'system'],
      required: true,
    },

    // Notification title
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    // Notification message/body
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Optional link/action
    actionUrl: {
      type: String,
      default: null,
    },

    // Related items (for expiration/low stock notifications)
    relatedItems: [{
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
      },
      name: String,
      expirationDate: Date,
      quantity: Number,
      locationName: String,
    }],

    // Notification status
    status: {
      type: String,
      enum: ['unread', 'read', 'dismissed'],
      default: 'unread',
    },

    // Delivery channels used
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      emailSentAt: {
        type: Date,
        default: null,
      },
    },

    // Read timestamp
    readAt: {
      type: Date,
      default: null,
    },

    // Priority level (affects ordering)
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },

    // Expiration for auto-cleanup (notifications older than this will be deleted)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static: Get unread count for user
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, status: 'unread' });
};

// Static: Get notifications for user with pagination
notificationSchema.statics.getForUser = function (userId, options = {}) {
  const {
    status = null,
    type = null,
    limit = 20,
    skip = 0,
  } = options;

  const query = { userId };

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static: Mark all as read for user
notificationSchema.statics.markAllRead = function (userId) {
  return this.updateMany(
    { userId, status: 'unread' },
    { $set: { status: 'read', readAt: new Date() } }
  );
};

// Static: Dismiss all for user
notificationSchema.statics.dismissAll = function (userId) {
  return this.updateMany(
    { userId, status: { $ne: 'dismissed' } },
    { $set: { status: 'dismissed' } }
  );
};

// Static: Create expiration notification
notificationSchema.statics.createExpirationNotification = async function (userId, items, daysAhead) {
  const count = items.length;
  const urgentCount = items.filter(i => {
    const daysUntil = Math.ceil((new Date(i.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 1;
  }).length;

  let priority = 'normal';
  if (urgentCount > 0) priority = 'urgent';
  else if (count >= 5) priority = 'high';

  const title = urgentCount > 0
    ? `${urgentCount} item${urgentCount > 1 ? 's' : ''} expiring today!`
    : `${count} item${count > 1 ? 's' : ''} expiring soon`;

  const message = items.slice(0, 5).map(i => {
    const daysUntil = Math.ceil((new Date(i.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    const dayText = daysUntil <= 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    return `${i.name} expires ${dayText}`;
  }).join('; ');

  return this.create({
    userId,
    type: 'expiration',
    title,
    message: count > 5 ? `${message}; and ${count - 5} more...` : message,
    relatedItems: items.slice(0, 10).map(i => ({
      itemId: i._id,
      name: i.name,
      expirationDate: i.expirationDate,
      locationName: i.locationId?.name || 'Unknown location',
    })),
    priority,
    actionUrl: '/dashboard',
  });
};

// Static: Create low stock notification
notificationSchema.statics.createLowStockNotification = async function (userId, items) {
  const count = items.length;

  const title = `${count} item${count > 1 ? 's' : ''} running low`;

  const message = items.slice(0, 5).map(i => {
    return `${i.name}: ${i.quantity?.value || 0} remaining (min: ${i.quantity?.minimum || 0})`;
  }).join('; ');

  return this.create({
    userId,
    type: 'low_stock',
    title,
    message: count > 5 ? `${message}; and ${count - 5} more...` : message,
    relatedItems: items.slice(0, 10).map(i => ({
      itemId: i._id,
      name: i.name,
      quantity: i.quantity?.value,
      locationName: i.locationId?.name || 'Unknown location',
    })),
    priority: 'normal',
    actionUrl: '/dashboard',
  });
};

// Instance: Mark as read
notificationSchema.methods.markRead = function () {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Instance: Dismiss
notificationSchema.methods.dismiss = function () {
  this.status = 'dismissed';
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
