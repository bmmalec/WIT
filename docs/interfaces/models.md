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

*More models will be added as they are implemented.*
