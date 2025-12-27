# API_PATTERNS.md
## Code Patterns & Examples for Claude Code

---

## Model Pattern

```javascript
// server/models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  // Always include owner reference
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Required fields with validation
  primaryName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  
  // Optional fields with defaults
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Arrays
  alternateNames: [{
    type: String,
    trim: true
  }],
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Nested objects
  value: {
    purchasePrice: Number,
    currentValue: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // References
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
    index: true
  },
  
  // Enums
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  
  // Booleans with defaults
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt, updatedAt
});

// Indexes
itemSchema.index({ ownerId: 1, locationId: 1 });
itemSchema.index({ 
  primaryName: 'text', 
  alternateNames: 'text', 
  description: 'text',
  tags: 'text'
});

// Instance methods
itemSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.primaryName,
    // ... omit sensitive fields
  };
};

// Static methods
itemSchema.statics.findByLocation = function(locationId) {
  return this.find({ locationId, isActive: true });
};

// Pre-save hooks
itemSchema.pre('save', function(next) {
  // Normalize tags to lowercase
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase());
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);
```

---

## Controller Pattern

```javascript
// server/controllers/itemController.js
const itemService = require('../services/itemService');
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * @route   GET /api/items
 * @desc    Get all items for user
 * @access  Private
 */
exports.getItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, location, category, search } = req.query;
    
    const result = await itemService.getItems(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      locationId: location,
      category,
      search
    });
    
    res.json({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/items/:id
 * @desc    Get single item
 * @access  Private
 */
exports.getItem = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(req.user._id, req.params.id);
    
    if (!item) {
      throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/items
 * @desc    Create new item
 * @access  Private
 */
exports.createItem = async (req, res, next) => {
  try {
    // Validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }
    
    const item = await itemService.createItem(req.user._id, req.body);
    
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/items/:id
 * @desc    Update item
 * @access  Private
 */
exports.updateItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }
    
    const item = await itemService.updateItem(req.user._id, req.params.id, req.body);
    
    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete item
 * @access  Private
 */
exports.deleteItem = async (req, res, next) => {
  try {
    await itemService.deleteItem(req.user._id, req.params.id);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
```

---

## Service Pattern

```javascript
// server/services/itemService.js
const Item = require('../models/Item');
const Location = require('../models/Location');
const permissionService = require('./permissionService');
const AppError = require('../utils/AppError');

class ItemService {
  /**
   * Get paginated items for user
   */
  async getItems(userId, options = {}) {
    const { page = 1, limit = 20, locationId, category, search } = options;
    
    // Build query
    const query = { isActive: true };
    
    // Get accessible locations
    const accessibleLocations = await permissionService.getAccessibleLocationIds(userId);
    query.locationId = { $in: accessibleLocations };
    
    // Apply filters
    if (locationId) {
      // Verify user has access to this specific location
      if (!accessibleLocations.some(id => id.equals(locationId))) {
        throw new AppError('Access denied to location', 403, 'FORBIDDEN');
      }
      query.locationId = locationId;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      Item.find(query)
        .populate('locationId', 'name path')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query)
    ]);
    
    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Get single item by ID
   */
  async getItemById(userId, itemId) {
    const item = await Item.findById(itemId)
      .populate('locationId', 'name path')
      .lean();
    
    if (!item) {
      return null;
    }
    
    // Check permission
    const hasAccess = await permissionService.canAccessLocation(
      userId, 
      item.locationId._id, 
      'view'
    );
    
    if (!hasAccess) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
    
    return item;
  }
  
  /**
   * Create new item
   */
  async createItem(userId, data) {
    // Verify user can add to location
    const hasAccess = await permissionService.canAccessLocation(
      userId,
      data.locationId,
      'create'
    );
    
    if (!hasAccess) {
      throw new AppError('Cannot add items to this location', 403, 'FORBIDDEN');
    }
    
    // Create item
    const item = new Item({
      ...data,
      ownerId: userId
    });
    
    await item.save();
    
    // Update location item count
    await Location.findByIdAndUpdate(data.locationId, {
      $inc: { itemCount: 1 }
    });
    
    return item;
  }
  
  /**
   * Update item
   */
  async updateItem(userId, itemId, data) {
    const item = await Item.findById(itemId);
    
    if (!item) {
      throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
    }
    
    // Check permission
    const hasAccess = await permissionService.canAccessLocation(
      userId,
      item.locationId,
      'update'
    );
    
    if (!hasAccess) {
      throw new AppError('Cannot edit this item', 403, 'FORBIDDEN');
    }
    
    // Don't allow changing owner
    delete data.ownerId;
    
    // Handle location change
    if (data.locationId && !data.locationId.equals(item.locationId)) {
      const canMoveFrom = await permissionService.canAccessLocation(userId, item.locationId, 'delete');
      const canMoveTo = await permissionService.canAccessLocation(userId, data.locationId, 'create');
      
      if (!canMoveFrom || !canMoveTo) {
        throw new AppError('Cannot move item between these locations', 403, 'FORBIDDEN');
      }
      
      // Update counts
      await Location.findByIdAndUpdate(item.locationId, { $inc: { itemCount: -1 } });
      await Location.findByIdAndUpdate(data.locationId, { $inc: { itemCount: 1 } });
      
      // Add to history
      item.locationHistory.push({
        locationId: item.locationId,
        movedAt: new Date(),
        movedBy: userId
      });
    }
    
    // Update fields
    Object.assign(item, data);
    await item.save();
    
    return item;
  }
  
  /**
   * Delete item (soft delete)
   */
  async deleteItem(userId, itemId) {
    const item = await Item.findById(itemId);
    
    if (!item) {
      throw new AppError('Item not found', 404, 'ITEM_NOT_FOUND');
    }
    
    const hasAccess = await permissionService.canAccessLocation(
      userId,
      item.locationId,
      'delete'
    );
    
    if (!hasAccess) {
      throw new AppError('Cannot delete this item', 403, 'FORBIDDEN');
    }
    
    item.isActive = false;
    await item.save();
    
    // Update location count
    await Location.findByIdAndUpdate(item.locationId, {
      $inc: { itemCount: -1 }
    });
  }
}

module.exports = new ItemService();
```

---

## Route Pattern

```javascript
// server/routes/items.js
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Validation rules
const createItemValidation = [
  body('primaryName')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 200 }).withMessage('Name too long'),
  body('locationId')
    .notEmpty().withMessage('Location is required')
    .isMongoId().withMessage('Invalid location ID'),
  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Quantity must be positive'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
];

const updateItemValidation = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('primaryName')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  body('locationId')
    .optional()
    .isMongoId()
];

// Routes
router.get('/', itemController.getItems);
router.get('/:id', param('id').isMongoId(), itemController.getItem);
router.post('/', createItemValidation, itemController.createItem);
router.put('/:id', updateItemValidation, itemController.updateItem);
router.delete('/:id', param('id').isMongoId(), itemController.deleteItem);

module.exports = router;
```

---

## Middleware Patterns

### Auth Middleware
```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  try {
    // Get token from cookie or header
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      throw new AppError('Not authorized', 401, 'UNAUTHORIZED');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-passwordHash');
    }
    next();
  } catch {
    next(); // Continue without user
  }
};
```

### Error Handler Middleware
```javascript
// server/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'SERVER_ERROR';
  let details = err.details || null;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    message = 'Validation failed';
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
```

---

## Utility Patterns

### AppError Class
```javascript
// server/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Async Handler (optional alternative to try/catch)
```javascript
// server/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

// Usage:
const asyncHandler = require('../utils/asyncHandler');

exports.getItems = asyncHandler(async (req, res) => {
  const items = await itemService.getItems(req.user._id);
  res.json({ success: true, data: items });
});
```

---

## Frontend API Client Pattern

```javascript
// client/js/api.js
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include', // Include cookies
      ...options
    };
    
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(data.error.message, data.error.code, response.status);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error', 'NETWORK_ERROR', 0);
    }
  }
  
  // Convenience methods
  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url);
  }
  
  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }
  
  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Export singleton
const api = new ApiClient();

// API methods
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
};

export const items = {
  list: (params) => api.get('/items', params),
  get: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`)
};

export const locations = {
  tree: () => api.get('/locations/tree'),
  get: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`)
};

export default api;
```

---

## Test Pattern

```javascript
// tests/integration/items.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/app');
const User = require('../../server/models/User');
const Item = require('../../server/models/Item');
const Location = require('../../server/models/Location');

describe('Items API', () => {
  let authToken;
  let testUser;
  let testLocation;
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
  });
  
  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Item.deleteMany({});
    await Location.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Test User'
    });
    
    // Create test location
    testLocation = await Location.create({
      ownerId: testUser._id,
      name: 'Test Location',
      type: 'house',
      path: `,${mongoose.Types.ObjectId()},`,
      depth: 0
    });
    
    // Get auth token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    authToken = res.headers['set-cookie'][0];
  });
  
  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Cookie', authToken)
        .send({
          primaryName: 'Test Hammer',
          locationId: testLocation._id,
          category: 'tools'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.primaryName).toBe('Test Hammer');
    });
    
    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Cookie', authToken)
        .send({
          locationId: testLocation._id
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
    
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({
          primaryName: 'Test',
          locationId: testLocation._id
        });
      
      expect(res.status).toBe(401);
    });
  });
  
  describe('GET /api/items', () => {
    beforeEach(async () => {
      // Create test items
      await Item.create([
        { primaryName: 'Hammer', locationId: testLocation._id, ownerId: testUser._id },
        { primaryName: 'Screwdriver', locationId: testLocation._id, ownerId: testUser._id }
      ]);
    });
    
    it('should return paginated items', async () => {
      const res = await request(app)
        .get('/api/items')
        .set('Cookie', authToken);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });
    
    it('should filter by search', async () => {
      const res = await request(app)
        .get('/api/items?search=hammer')
        .set('Cookie', authToken);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
```

---

*Use these patterns consistently throughout the project for maintainable code.*
