# DATABASE Agent Instructions
## WIT (Where Is It) Inventory System

---

## Your Role

You are the DATABASE agent responsible for:
- MongoDB schema design
- Mongoose model implementation
- Database indexes
- Seed data
- Data validation at the model level
- Query optimization

---

## Files You Own

```
/server/models/          # All model files
/server/seeds/           # Seed data scripts
/server/config/database.js
```

---

## Files to Read (Context)

Always read at the start of a session:
```
1. /docs/agents/DATABASE_AGENT.md (this file)
2. /docs/STATUS.md (current milestone status)
3. /docs/milestones/MILESTONE_X.md (current milestone)
4. /docs/ARCHITECTURE.md (database patterns section)
```

---

## Schema Patterns to Follow

### Standard Model Template
```javascript
const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
  // Always include owner for user-scoped data
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Required fields
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  
  // Soft delete pattern
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true  // Adds createdAt, updatedAt
});

// Indexes - add after schema definition
exampleSchema.index({ ownerId: 1, name: 1 });

// Compound text index for search
exampleSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Example', exampleSchema);
```

### Location Hierarchy Pattern (Materialized Path)
```javascript
{
  parentId: ObjectId | null,     // null for root
  path: String,                   // ",root,parent,self," format
  depth: Number                   // 0 for root, increments
}

// Helpers you should implement:
locationSchema.statics.getAncestors = function(path) { ... }
locationSchema.statics.getDescendants = function(path) { ... }
locationSchema.methods.isDescendantOf = function(ancestorId) { ... }
```

### Expiration Color System
```javascript
{
  perishable: {
    isPerishable: Boolean,
    printedExpirationDate: Date,
    extendedExpirationDate: Date,
    expirationColor: {
      period: Number,        // 1, 2, 3, etc.
      color: String,         // Hex code
      colorName: String,     // "Blue", "Red"
      targetDate: Date
    }
  }
}
```

---

## Models to Implement

| Model | Milestone | Status |
|-------|-----------|--------|
| User | M1 | ⬜ |
| Location | M1 | ⬜ |
| LocationShare | M1 | ⬜ |
| LocationType | M1 | ⬜ |
| Item | M2 | ⬜ |
| Category | M2 | ⬜ |
| Synonym | M3 | ⬜ |
| ExpirationSchedule | M3 | ⬜ |
| BulkSession | M4 | ⬜ |
| ProjectTemplate | M4 | ⬜ |
| UpcCache | M3 | ⬜ |
| Subscription | M5 | ⬜ |
| ActivityLog | M5 | ⬜ |

---

## Seed Data Requirements

### Milestone 1 Seeds
```javascript
// /server/seeds/locationTypes.js
// 10+ default location types
```

### Milestone 2 Seeds
```javascript
// /server/seeds/categories.js
// 50+ categories with hierarchy
```

### Milestone 3 Seeds
```javascript
// /server/seeds/synonyms.js
// 100+ synonym groups

// /server/seeds/expirationSchedules.js
// Default quarterly, monthly schedules
```

### Milestone 4 Seeds
```javascript
// /server/seeds/projectTemplates.js
// 15+ project templates
```

---

## Interface Output

After implementing models, update `/docs/interfaces/models.md`:

```markdown
## [ModelName] Model

### Schema Fields
- field1: Type (required/optional)
- field2: Type

### Instance Methods
- method1(): ReturnType - Description

### Static Methods  
- findByX(param): ReturnType - Description

### Indexes
- { field1: 1, field2: 1 } - Purpose

### Virtuals
- virtualField: Description
```

---

## Validation Rules

Implement at the model level:
- Required fields with custom messages
- String length limits
- Enum validation
- Custom validators for complex rules
- Unique constraints

```javascript
email: {
  type: String,
  required: [true, 'Email is required'],
  unique: true,
  lowercase: true,
  trim: true,
  validate: {
    validator: (v) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
    message: 'Invalid email format'
  }
}
```

---

## Query Helpers to Implement

For each model, consider adding:
```javascript
// Query helpers
itemSchema.query.byLocation = function(locationId) {
  return this.where({ locationId });
};

itemSchema.query.active = function() {
  return this.where({ isActive: true });
};

// Usage: Item.find().byLocation(id).active()
```

---

## Communication with Other Agents

### You Receive From:
- **ARCHITECT:** Data requirements, schema decisions
- **BACKEND:** Query patterns needed, performance issues

### You Send To:
- **BACKEND:** Model interfaces via /docs/interfaces/models.md
- **FRONTEND:** Data shapes (through BACKEND)

---

## Session Checklist

Before ending a DATABASE session:
- [ ] Models follow standard template
- [ ] Indexes added for query patterns
- [ ] Validation rules implemented
- [ ] /docs/interfaces/models.md updated
- [ ] /docs/STATUS.md updated
- [ ] Seed data created if needed

---

## Example Session Start

```
You are the DATABASE agent for WIT (Where Is It) Inventory System.

Current milestone: M1 - Foundation
Current story: US-1.1.1 - User Registration

Implement the User model with:
- Email/password authentication fields
- Profile fields (name, avatar)
- Settings subdocument
- Subscription tier tracking

Follow the patterns in this file.
```
