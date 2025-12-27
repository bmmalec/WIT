# API Endpoints
## WIT (Where Is It) - REST API

**Last Updated:** 2024-12-26
**Updated By:** BACKEND Agent

---

## Authentication API

Base path: `/api/auth`

### POST /api/auth/register

Create a new user account.

**Auth:** None (public)

**Rate Limit:** 10 requests / 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "minimum8chars",
  "name": "John Doe"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters
- `name`: Required, maximum 100 characters

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null,
      "settings": {
        "theme": "system",
        "defaultView": "grid",
        "notifications": true
      },
      "subscription": {
        "tier": "free",
        "stripeCustomerId": null,
        "expiresAt": null
      },
      "createdAt": "2024-12-26T...",
      "updatedAt": "2024-12-26T..."
    }
  },
  "message": "Registration successful"
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Invalid input
- `409 DUPLICATE_EMAIL`: Email already registered

**Cookie Set:** `token` (httpOnly, 30 days)

---

### POST /api/auth/login

Login with email and password.

**Auth:** None (public)

**Rate Limit:** 10 requests / 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  },
  "message": "Login successful"
}
```

**Errors:**
- `401 INVALID_CREDENTIALS`: Wrong email or password
- `423 ACCOUNT_LOCKED`: Too many failed attempts (locked for 2 hours)

**Cookie Set:** `token` (httpOnly, 30 days)

---

### POST /api/auth/logout

Logout current user.

**Auth:** None (public)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookie Cleared:** `token`

---

### GET /api/auth/me

Get current authenticated user.

**Auth:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

**Errors:**
- `401 UNAUTHORIZED`: Not logged in or invalid token

---

### PUT /api/auth/me

Update current user profile.

**Auth:** Required

**Request Body:**
```json
{
  "name": "New Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Validation:**
- `name`: Optional, maximum 100 characters
- `avatar`: Optional, valid URL

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  },
  "message": "Profile updated"
}
```

---

### PUT /api/auth/me/password

Change current user password.

**Auth:** Required

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Validation:**
- `currentPassword`: Required
- `newPassword`: Required, minimum 8 characters

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `401 INVALID_PASSWORD`: Current password is incorrect

---

### PUT /api/auth/me/settings

Update user settings.

**Auth:** Required

**Request Body:**
```json
{
  "theme": "dark",
  "defaultView": "list",
  "notifications": false
}
```

**Validation:**
- `theme`: Optional, one of: `light`, `dark`, `system`
- `defaultView`: Optional, one of: `grid`, `list`
- `notifications`: Optional, boolean

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  },
  "message": "Settings updated"
}
```

---

## Common Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 423 | Locked |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Locations API

Base path: `/api/locations`

All location endpoints require authentication.

### POST /api/locations

Create a new location.

**Auth:** Required

**Request Body:**
```json
{
  "name": "My House",
  "type": "house",
  "description": "Main residence",
  "icon": "🏠",
  "color": "#3B82F6",
  "parentId": null,
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "USA"
  },
  "capacity": {
    "type": "unlimited"
  }
}
```

**Validation:**
- `name`: Required, max 100 chars
- `type`: Required, one of: house, warehouse, storage_unit, office, vehicle, room, zone, container, garage, basement, attic, kitchen, bedroom, bathroom, workshop, living_room, closet, cabinet, drawer, shelf, box, bin, custom
- `description`: Optional, max 500 chars
- `customType`: Optional, max 50 chars (required when type is 'custom')
- `icon`: Optional
- `color`: Optional, valid hex color (#RRGGBB)
- `parentId`: Optional, valid MongoDB ObjectId
- `address.*`: Optional strings
- `capacity.type`: Optional, one of: unlimited, slots, volume
- `capacity.max`: Optional, positive integer

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "location": {
      "_id": "...",
      "ownerId": "...",
      "name": "My House",
      "type": "house",
      "description": "Main residence",
      "icon": "🏠",
      "color": "#3B82F6",
      "parentId": null,
      "path": ",abc123,",
      "depth": 0,
      "address": { ... },
      "itemCount": 0,
      "childCount": 0,
      "capacity": { "type": "unlimited" },
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "message": "Location created successfully"
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Invalid input
- `404 PARENT_NOT_FOUND`: Parent location doesn't exist
- `403 FORBIDDEN`: Parent location belongs to another user

---

### GET /api/locations

Get all locations for current user.

**Auth:** Required

**Query Parameters:**
- `parentId`: Filter by parent (use `null` for top-level)
- `includeInactive`: Include soft-deleted locations (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "locations": [ ... ]
  },
  "count": 5
}
```

---

### GET /api/locations/tree

Get location tree (nested structure) for current user.

**Auth:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tree": [
      {
        "_id": "...",
        "name": "My House",
        "type": "house",
        "children": [
          {
            "_id": "...",
            "name": "Garage",
            "type": "garage",
            "children": [ ... ]
          }
        ]
      }
    ]
  }
}
```

---

### GET /api/locations/:id

Get a single location.

**Auth:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "location": { ... }
  }
}
```

**Errors:**
- `404 LOCATION_NOT_FOUND`: Location doesn't exist
- `403 FORBIDDEN`: No access to this location

---

### GET /api/locations/:id/breadcrumb

Get location with ancestor path (for breadcrumb navigation).

**Auth:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Toolbox",
    "type": "container",
    "ancestors": [
      { "_id": "...", "name": "My House", "type": "house" },
      { "_id": "...", "name": "Garage", "type": "garage" }
    ]
  }
}
```

---

### PUT /api/locations/:id

Update a location.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "icon": "📦",
  "color": "#10B981"
}
```

**Validation:**
- Same as POST, but all fields optional
- Cannot change `parentId` (use move endpoint - future)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "location": { ... }
  },
  "message": "Location updated successfully"
}
```

---

### DELETE /api/locations/:id

Soft delete a location.

**Auth:** Required

**Query Parameters:**
- `cascade`: Delete all child locations too (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

**Errors:**
- `400 HAS_CHILDREN`: Location has children (use cascade=true)
- `404 LOCATION_NOT_FOUND`: Location doesn't exist
- `403 FORBIDDEN`: No access to this location

---

*More endpoints will be added as they are implemented.*
