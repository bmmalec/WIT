# ARCHITECTURE.md
## Smart Inventory System - Technical Architecture

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | Express.js | 4.x |
| Database | MongoDB | 7.x |
| ODM | Mongoose | 8.x |
| Auth | JWT + bcrypt | |
| Validation | express-validator | |
| Image Processing | Sharp | |
| Frontend | Vue.js | 3.x |
| CSS | Tailwind CSS | 3.x |
| AI | Anthropic Claude API | |
| Payments | Stripe | |
| Barcode | QuaggaJS | |

---

## Project Structure

```
smart-inventory/
├── server/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   ├── claude.js        # Anthropic API config
│   │   ├── stripe.js        # Stripe config
│   │   └── index.js         # Config aggregator
│   │
│   ├── controllers/         # Route handlers (thin)
│   │   ├── authController.js
│   │   ├── locationController.js
│   │   ├── itemController.js
│   │   └── ...
│   │
│   ├── services/            # Business logic (thick)
│   │   ├── authService.js
│   │   ├── locationService.js
│   │   ├── itemService.js
│   │   ├── searchService.js
│   │   ├── aiService.js
│   │   └── ...
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Location.js
│   │   ├── Item.js
│   │   └── ...
│   │
│   ├── routes/              # Express route definitions
│   │   ├── index.js         # Route aggregator
│   │   ├── auth.js
│   │   ├── locations.js
│   │   ├── items.js
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   ├── permissions.js   # Location permission checks
│   │   ├── validate.js      # Request validation
│   │   ├── upload.js        # Multer config
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js  # Global error handler
│   │
│   ├── utils/
│   │   ├── helpers.js       # General utilities
│   │   ├── locationPath.js  # Path manipulation
│   │   ├── fuzzyMatch.js    # Search utilities
│   │   └── periodCalculator.js # Expiration periods
│   │
│   ├── seeds/               # Database seed data
│   │   ├── locationTypes.js
│   │   ├── categories.js
│   │   ├── synonyms.js
│   │   └── projectTemplates.js
│   │
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
│
├── client/
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── app.js
│   │   ├── api.js           # API client
│   │   ├── router.js
│   │   ├── components/
│   │   └── pages/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
│
├── uploads/                  # Local file storage
├── docs/                     # Documentation
├── tests/                    # Test files
├── .env.example
├── package.json
└── README.md
```

---

## Design Patterns

### 1. MVC + Service Layer

```
Request → Route → Controller → Service → Model → Database
                      ↓
                  Response
```

- **Controllers:** Handle HTTP, call services, return responses
- **Services:** Business logic, can call multiple models
- **Models:** Data access, schema validation

### 2. Thin Controller, Thick Service

```javascript
// ✅ Good - Controller is thin
exports.createItem = async (req, res, next) => {
  try {
    const item = await itemService.create(req.user._id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// ❌ Bad - Controller has business logic
exports.createItem = async (req, res, next) => {
  try {
    // Don't do validation/business logic here
    const location = await Location.findById(req.body.locationId);
    if (location.ownerId.toString() !== req.user._id.toString()) {
      // Permission check belongs in service/middleware
    }
    // ...
  }
};
```

### 3. Error Handling Pattern

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

// Usage in service
if (!location) {
  throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
}

// Global error handler catches all
app.use(errorHandler);
```

### 4. Authentication Flow

```
1. Login: Email/Password → Verify → Generate JWT → Set httpOnly cookie
2. Request: Cookie sent → auth middleware → Verify JWT → req.user set
3. Protected route: Check req.user exists
4. Permission route: Check user has access to resource
```

---

## Database Patterns

### 1. Materialized Path (Locations)

```javascript
// Location hierarchy using materialized path
{
  _id: "loc3",
  name: "Drawer 1",
  parentId: "loc2",
  path: ",loc1,loc2,loc3,",  // Full ancestry
  depth: 2
}

// Find all ancestors
Location.find({ 
  path: { $regex: `,${locationId},` }
});

// Find all descendants  
Location.find({
  path: { $regex: `^${location.path}` }
});
```

### 2. Permission Checking

```javascript
// Check if user can access location
async function canAccessLocation(userId, locationId, requiredPermission) {
  // 1. Check if owner
  const location = await Location.findById(locationId);
  if (location.ownerId.equals(userId)) return true;
  
  // 2. Check direct share
  const share = await LocationShare.findOne({
    locationId,
    userId,
    status: 'accepted'
  });
  if (share && hasPermission(share.permission, requiredPermission)) {
    return true;
  }
  
  // 3. Check inherited permissions (walk up tree)
  const ancestors = getAncestorIds(location.path);
  const inheritedShare = await LocationShare.findOne({
    locationId: { $in: ancestors },
    userId,
    status: 'accepted',
    inheritToChildren: true
  });
  
  return inheritedShare && hasPermission(inheritedShare.permission, requiredPermission);
}
```

### 3. Text Search with Synonyms

```javascript
async function searchItems(userId, query) {
  // 1. Get accessible locations
  const locationIds = await getAccessibleLocationIds(userId);
  
  // 2. Expand query with synonyms
  const synonyms = await Synonym.find({
    $or: [
      { canonicalName: { $regex: query, $options: 'i' } },
      { synonyms: { $regex: query, $options: 'i' } }
    ]
  });
  const expandedTerms = [query, ...synonyms.flatMap(s => [s.canonicalName, ...s.synonyms])];
  
  // 3. Search with expanded terms
  return Item.find({
    locationId: { $in: locationIds },
    $or: [
      { $text: { $search: expandedTerms.join(' ') } },
      { primaryName: { $regex: query, $options: 'i' } },
      { alternateNames: { $regex: query, $options: 'i' } }
    ]
  });
}
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Optional success message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### HTTP Status Codes Used
| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Authentication

### JWT Structure
```javascript
{
  "userId": "ObjectId",
  "email": "user@example.com",
  "tier": "premium",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Cookie Configuration
```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
});
```

---

## File Upload

### Image Processing Pipeline
```
Upload → Validate → Process with Sharp → Generate Thumbnail → Save to Storage
```

### Sharp Configuration
```javascript
const processedImage = await sharp(buffer)
  .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer();

const thumbnail = await sharp(buffer)
  .resize(200, 200, { fit: 'cover' })
  .jpeg({ quality: 70 })
  .toBuffer();
```

---

## AI Integration

### Claude Vision Request Pattern
```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64Image
        }
      },
      {
        type: 'text',
        text: IDENTIFICATION_PROMPT
      }
    ]
  }]
});
```

---

## Caching Strategy (Future)

```
Redis keys:
- user:{id}:locations - User's location tree
- location:{id}:items:count - Item count cache
- search:{hash} - Search result cache (5 min TTL)
- upc:{code} - UPC lookup cache (30 day TTL)
```

---

## Security Checklist

- [x] Passwords hashed with bcrypt (min 10 rounds)
- [x] JWT in httpOnly cookies
- [x] CORS configured for specific origins
- [x] Rate limiting on auth endpoints
- [x] Input validation on all endpoints
- [x] SQL/NoSQL injection prevention (Mongoose)
- [x] XSS prevention (no innerHTML, sanitize output)
- [x] CSRF protection (sameSite cookies)
- [ ] Helmet.js for HTTP headers (to implement)

---

## Testing Strategy

```
tests/
├── unit/
│   ├── services/
│   └── utils/
├── integration/
│   ├── auth.test.js
│   ├── locations.test.js
│   └── items.test.js
└── e2e/
    └── (future)
```

### Test Database
```javascript
// Use separate test database
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});
```

---

*Reference this file when implementing new features to maintain consistency.*
