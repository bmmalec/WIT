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

*More endpoints will be added as they are implemented.*
