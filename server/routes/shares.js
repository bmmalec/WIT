const express = require('express');
const { body, param } = require('express-validator');
const shareController = require('../controllers/shareController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const inviteRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid location ID'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('permission')
    .notEmpty()
    .withMessage('Permission is required')
    .isIn(['viewer', 'contributor', 'editor', 'manager'])
    .withMessage('Invalid permission level'),
  body('inheritToChildren')
    .optional()
    .isBoolean()
    .withMessage('inheritToChildren must be a boolean'),
];

const updateShareRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid share ID'),
  body('permission')
    .notEmpty()
    .withMessage('Permission is required')
    .isIn(['viewer', 'contributor', 'editor', 'manager'])
    .withMessage('Invalid permission level'),
];

const shareIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid share ID'),
];

const tokenRule = [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid token format'),
];

// Routes for location shares (mounted under /locations/:id)
router.post('/locations/:id/share', inviteRules, validate, shareController.invite);
router.get('/locations/:id/shares', shareIdRule.slice(0, 1), validate, shareController.getShares);

// Routes for user's shares
router.get('/shares', shareController.getMyShares);
router.get('/shares/pending', shareController.getPendingInvites);
router.post('/shares/accept/:token', tokenRule, validate, shareController.acceptInvite);
router.post('/shares/decline/:token', tokenRule, validate, shareController.declineInvite);
router.put('/shares/:id', updateShareRules, validate, shareController.updateShare);
router.delete('/shares/:id', shareIdRule, validate, shareController.revokeShare);

module.exports = router;
