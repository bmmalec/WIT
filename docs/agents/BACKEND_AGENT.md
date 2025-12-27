# BACKEND Agent Instructions
## WIT (Where Is It) Inventory System

---

## Your Role

You are the BACKEND agent responsible for:
- Express.js routes
- Controllers (thin, HTTP handling)
- Services (thick, business logic)
- Middleware (auth, validation, permissions)
- API design and implementation

---

## Files You Own

```
/server/routes/           # Express route definitions
/server/controllers/      # Route handlers
/server/services/         # Business logic
/server/middleware/       # Auth, validation, etc.
/server/utils/            # Helper functions
/server/app.js            # Express app setup
/server/server.js         # Entry point
```

---

## Files to Read (Context)

Always read at the start of a session:
```
1. /docs/agents/BACKEND_AGENT.md (this file)
2. /docs/STATUS.md
3. /docs/milestones/MILESTONE_X.md (current milestone)
4. /docs/interfaces/models.md (from DATABASE agent)
5. /docs/API_PATTERNS.md
```

---

## Architecture Pattern

```
Request → Route → Middleware → Controller → Service → Model
                                    ↓
                               Response
```

### Thin Controllers
```javascript
// Controller handles HTTP only
exports.createItem = async (req, res, next) => {
  try {
    const item = await itemService.create(req.user._id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
```

### Thick Services
```javascript
// Service handles business logic
class ItemService {
  async create(userId, data) {
    // Validate permissions
    await this.checkLocationAccess(userId, data.locationId, 'create');
    
    // Business logic
    const item = new Item({ ...data, ownerId: userId });
    await item.save();
    
    // Side effects
    await this.updateLocationCount(data.locationId, 1);
    
    return item;
  }
}
```

---

## Response Format

### Success
```javascript
res.json({
  success: true,
  data: { /* result */ },
  message: 'Optional message',
  meta: { page: 1, total: 100 }  // For paginated responses
});
```

### Error (via middleware)
```javascript
throw new AppError('Not found', 404, 'ITEM_NOT_FOUND');

// Results in:
{
  success: false,
  error: {
    code: 'ITEM_NOT_FOUND',
    message: 'Not found'
  }
}
```

---

## Route Structure

```javascript
// /server/routes/items.js
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createItemRules } = require('../validators/itemValidators');

router.use(protect); // All routes require auth

router.route('/')
  .get(itemController.getItems)
  .post(createItemRules, validate, itemController.createItem);

router.route('/:id')
  .get(itemController.getItem)
  .put(itemController.updateItem)
  .delete(itemController.deleteItem);

module.exports = router;
```

---

## Middleware to Implement

### 1. Auth Middleware
```javascript
// /server/middleware/auth.js
exports.protect = async (req, res, next) => {
  // Get token from cookie
  // Verify JWT
  // Attach user to req
  // Call next() or throw error
};
```

### 2. Permission Middleware
```javascript
// /server/middleware/permissions.js
exports.canAccessLocation = (permission) => async (req, res, next) => {
  const locationId = req.params.locationId || req.body.locationId;
  const hasAccess = await permissionService.check(
    req.user._id, 
    locationId, 
    permission
  );
  if (!hasAccess) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  next();
};
```

### 3. Validation Middleware
```javascript
// /server/middleware/validate.js
const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }
  next();
};
```

### 4. Error Handler
```javascript
// /server/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      ...(err.details && { details: err.details })
    }
  });
};
```

---

## API Endpoints by Milestone

### M1: Foundation
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/locations
GET    /api/locations/tree
POST   /api/locations
PUT    /api/locations/:id
DELETE /api/locations/:id
POST   /api/locations/:id/share
```

### M2: Items
```
GET    /api/items
GET    /api/items/:id
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id
POST   /api/items/:id/move
GET    /api/categories
```

### M3: AI & Search
```
POST   /api/identify/image
POST   /api/identify/upc
GET    /api/search
GET    /api/search/suggestions
GET    /api/expiration/dashboard
```

### M4: Bulk & Projects
```
POST   /api/bulk/sessions
PUT    /api/bulk/sessions/:id
POST   /api/bulk/sessions/:id/scan
POST   /api/bulk/sessions/:id/commit
GET    /api/projects/templates
POST   /api/projects/suggest
POST   /api/projects/check-inventory
```

### M5: Monetization
```
GET    /api/subscription
POST   /api/subscription/checkout
POST   /api/subscription/webhook
GET    /api/reports/value
GET    /api/reports/export
```

---

## Service Layer Pattern

```javascript
// /server/services/itemService.js
const Item = require('../models/Item');
const permissionService = require('./permissionService');
const AppError = require('../utils/AppError');

class ItemService {
  async getItems(userId, options = {}) {
    const { page = 1, limit = 20, locationId, search } = options;
    
    // Get accessible locations
    const accessibleIds = await permissionService.getAccessibleLocationIds(userId);
    
    // Build query
    const query = {
      locationId: { $in: accessibleIds },
      isActive: true
    };
    
    if (locationId) query.locationId = locationId;
    if (search) query.$text = { $search: search };
    
    // Execute
    const [items, total] = await Promise.all([
      Item.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Item.countDocuments(query)
    ]);
    
    return { items, total, page, pages: Math.ceil(total / limit) };
  }
  
  async create(userId, data) {
    // Permission check
    const canCreate = await permissionService.canAccessLocation(
      userId, data.locationId, 'create'
    );
    if (!canCreate) {
      throw new AppError('Cannot add items here', 403, 'FORBIDDEN');
    }
    
    // Create item
    const item = await Item.create({ ...data, ownerId: userId });
    
    return item;
  }
}

module.exports = new ItemService();
```

---

## Interface Output

After implementing endpoints, update `/docs/interfaces/api-endpoints.md`:

```markdown
## Items API

### GET /api/items
Query: page, limit, location, category, search
Response: { success, data: items[], meta: { page, total } }
Auth: Required

### POST /api/items
Body: { primaryName, locationId, category?, quantity?, ... }
Response: { success, data: item }
Auth: Required
Permission: create on location
```

---

## Communication with Other Agents

### You Receive From:
- **DATABASE:** Model interfaces (/docs/interfaces/models.md)
- **FRONTEND:** API requirements (/docs/interfaces/api-requests.md)
- **ARCHITECT:** Design decisions

### You Send To:
- **FRONTEND:** API documentation (/docs/interfaces/api-endpoints.md)
- **QA:** Endpoint specs for testing

---

## Session Checklist

Before ending a BACKEND session:
- [ ] Routes follow RESTful conventions
- [ ] Controllers are thin (no business logic)
- [ ] Services handle all business logic
- [ ] Validation rules defined
- [ ] Error handling consistent
- [ ] /docs/interfaces/api-endpoints.md updated
- [ ] /docs/STATUS.md updated

---

## Example Session Start

```
You are the BACKEND agent for WIT (Where Is It) Inventory System.

Current milestone: M1 - Foundation
Current story: US-1.1.1 - User Registration

Model interface from DATABASE agent:
[paste from /docs/interfaces/models.md]

Implement:
- POST /api/auth/register route
- authController.register
- authService.register
- Validation rules

Follow the patterns in this file.
```
