# Model Interfaces
## WIT (Where Is It) - Database Models

**Last Updated:** 2024-12-26
**Updated By:** DATABASE Agent

---

## User Model

### Schema Fields

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `email` | String | Yes | - | Unique, lowercase, trimmed, validated format |
| `passwordHash` | String | Yes | - | bcrypt hashed, excluded from queries by default |
| `name` | String | Yes | - | Max 100 chars, trimmed |
| `avatar` | String | No | null | URL to avatar image |
| `settings.theme` | String | No | 'system' | Enum: 'light', 'dark', 'system' |
| `settings.defaultView` | String | No | 'grid' | Enum: 'grid', 'list' |
| `settings.notifications` | Boolean | No | true | Email notifications enabled |
| `subscription.tier` | String | No | 'free' | Enum: 'free', 'premium' |
| `subscription.stripeCustomerId` | String | No | null | Stripe customer ID |
| `subscription.expiresAt` | Date | No | null | Premium expiration date |
| `loginAttempts` | Number | No | 0 | Failed login counter |
| `lockUntil` | Date | No | null | Account lock expiration |
| `createdAt` | Date | Auto | - | Timestamp |
| `updatedAt` | Date | Auto | - | Timestamp |

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `comparePassword(candidatePassword)` | Promise\<Boolean\> | Compares plaintext password with stored hash |
| `generateAuthToken()` | String | Generates JWT with userId, email, tier |
| `isLocked()` | Boolean | Returns true if account is currently locked |
| `incrementLoginAttempts()` | Promise | Increments attempts, locks after 5 failures for 2 hours |
| `resetLoginAttempts()` | Promise | Resets attempts and lock on successful login |

### Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `findByEmail(email)` | Promise\<User\|null\> | Finds user by email (case-insensitive) |
| `findByEmailWithPassword(email)` | Promise\<User\|null\> | Finds user with passwordHash included |

### Indexes

| Fields | Type | Purpose |
|--------|------|---------|
| `{ email: 1 }` | Unique | Fast email lookup, prevent duplicates |

### Virtuals

| Name | Description |
|------|-------------|
| `isCurrentlyLocked` | Returns true if lockUntil > now |

### JSON Transform

The following fields are automatically removed when converting to JSON:
- `passwordHash`
- `loginAttempts`
- `lockUntil`
- `__v`

### Usage Examples

```javascript
// Create user (password is auto-hashed on save)
const user = new User({
  email: 'user@example.com',
  passwordHash: 'plaintext-password', // Will be hashed
  name: 'John Doe'
});
await user.save();

// Find and verify password
const user = await User.findByEmailWithPassword('user@example.com');
const isValid = await user.comparePassword('plaintext-password');

// Generate JWT
const token = user.generateAuthToken();

// Check lock status
if (user.isLocked()) {
  throw new Error('Account is locked');
}
```

---

## Location Model

### Schema Fields

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `ownerId` | ObjectId | Yes | - | Reference to User, indexed |
| `name` | String | Yes | - | Max 100 chars, trimmed |
| `description` | String | No | - | Max 500 chars |
| `type` | String | Yes | - | Enum: house, warehouse, storage_unit, office, vehicle, room, zone, container, garage, basement, attic, kitchen, bedroom, bathroom, workshop, living_room, closet, cabinet, drawer, shelf, box, bin, custom |
| `customType` | String | No | - | Custom type label when type='custom' |
| `icon` | String | No | - | Icon identifier or emoji |
| `color` | String | No | - | Hex color (e.g., '#FF5733') |
| `parentId` | ObjectId | No | null | Reference to parent Location, indexed |
| `path` | String | Yes | - | Materialized path: ",id1,id2,id3," |
| `depth` | Number | Yes | 0 | Nesting depth (0 = top-level) |
| `address.street` | String | No | - | Street address |
| `address.city` | String | No | - | City |
| `address.state` | String | No | - | State/Province |
| `address.zip` | String | No | - | ZIP/Postal code |
| `address.country` | String | No | - | Country |
| `itemCount` | Number | No | 0 | Cached count of items |
| `childCount` | Number | No | 0 | Cached count of child locations |
| `capacity.type` | String | No | 'unlimited' | Enum: 'unlimited', 'slots', 'volume' |
| `capacity.max` | Number | No | - | Maximum capacity |
| `capacity.used` | Number | No | 0 | Current usage |
| `isActive` | Boolean | No | true | Soft delete flag |
| `createdAt` | Date | Auto | - | Timestamp |
| `updatedAt` | Date | Auto | - | Timestamp |

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `isDescendantOf(ancestorId)` | Boolean | Checks if location is under the given ancestor |
| `getFullPath()` | Promise\<Array\<String\>\> | Returns array of ancestor names including self |

### Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getTree(ownerId)` | Promise\<Array\> | Returns full nested tree for user |
| `getAncestors(path)` | Promise\<Array\> | Returns ancestor locations from path |
| `getDescendants(locationId)` | Promise\<Array\> | Returns all children recursively |

### Indexes

| Fields | Type | Purpose |
|--------|------|---------|
| `{ ownerId: 1 }` | Standard | Fast user location lookup |
| `{ parentId: 1 }` | Standard | Fast child lookup |
| `{ ownerId: 1, parentId: 1 }` | Compound | Combined owner+parent queries |
| `{ path: 1 }` | Standard | Ancestor/descendant queries |
| `{ ownerId: 1, name: 'text' }` | Text | Full-text search |

### Materialized Path Pattern

The `path` field stores the full ancestry as a comma-delimited string of IDs:
- Format: `,id1,id2,id3,` (leading and trailing commas)
- Top-level: `,{ownId},`
- Nested: `,{rootId},{parentId},{ownId},`

Benefits:
- Fast ancestor queries with string matching
- Single query to find all descendants
- No recursive queries needed

### Usage Examples

```javascript
// Create top-level location
const location = new Location({
  ownerId: userId,
  name: 'My House',
  type: 'house',
  path: `,${newId},`,
  depth: 0
});
await location.save();

// Create nested location
const room = new Location({
  ownerId: userId,
  name: 'Garage',
  type: 'garage',
  parentId: houseId,
  path: `${house.path}${newId},`,
  depth: house.depth + 1
});

// Get full tree
const tree = await Location.getTree(userId);

// Get ancestors
const ancestors = await Location.getAncestors(location.path);

// Check ancestry
if (location.isDescendantOf(houseId)) {
  console.log('Location is inside house');
}
```

---

*More models will be added as they are implemented.*
