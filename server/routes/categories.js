const express = require('express');
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all categories (tree structure)
router.get('/', itemController.getCategories);

module.exports = router;
