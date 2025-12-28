const express = require('express');
const { param, body, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const notificationIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID'),
];

const getNotificationsRules = [
  query('status')
    .optional()
    .isIn(['unread', 'read', 'dismissed'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['expiration', 'low_stock', 'shopping_reminder', 'system'])
    .withMessage('Invalid type'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be 0 or greater'),
];

const updateSettingsRules = [
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('enabled must be a boolean'),
  body('email.enabled')
    .optional()
    .isBoolean()
    .withMessage('email.enabled must be a boolean'),
  body('email.expiration')
    .optional()
    .isBoolean()
    .withMessage('email.expiration must be a boolean'),
  body('email.lowStock')
    .optional()
    .isBoolean()
    .withMessage('email.lowStock must be a boolean'),
  body('email.frequency')
    .optional()
    .isIn(['immediate', 'daily', 'weekly'])
    .withMessage('email.frequency must be immediate, daily, or weekly'),
  body('email.expirationDaysAhead')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('email.expirationDaysAhead must be between 1 and 30'),
  body('email.digestHour')
    .optional()
    .isInt({ min: 0, max: 23 })
    .withMessage('email.digestHour must be between 0 and 23'),
  body('inApp.enabled')
    .optional()
    .isBoolean()
    .withMessage('inApp.enabled must be a boolean'),
  body('inApp.expiration')
    .optional()
    .isBoolean()
    .withMessage('inApp.expiration must be a boolean'),
  body('inApp.lowStock')
    .optional()
    .isBoolean()
    .withMessage('inApp.lowStock must be a boolean'),
  body('inApp.shoppingList')
    .optional()
    .isBoolean()
    .withMessage('inApp.shoppingList must be a boolean'),
];

const triggerCheckRules = [
  body('type')
    .optional()
    .isIn(['expiration', 'lowStock'])
    .withMessage('type must be expiration or lowStock'),
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('sendEmail must be a boolean'),
];

// Routes
router.get('/', getNotificationsRules, validate, notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/settings', notificationController.getSettings);

router.put('/settings', updateSettingsRules, validate, notificationController.updateSettings);
router.put('/read-all', notificationController.markAllRead);
router.put('/dismiss-all', notificationController.dismissAll);
router.put('/:id/read', notificationIdRule, validate, notificationController.markRead);
router.put('/:id/dismiss', notificationIdRule, validate, notificationController.dismiss);

router.post('/test-email', notificationController.sendTestEmail);
router.post('/check', triggerCheckRules, validate, notificationController.triggerCheck);

router.delete('/:id', notificationIdRule, validate, notificationController.deleteNotification);

module.exports = router;
