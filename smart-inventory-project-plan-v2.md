# Smart Inventory & Tool Management System
## Project Plan & Development Roadmap - Version 2.0

---

## 1. Executive Summary

**Project Name:** ToolVault / StockSmart (TBD)

**Purpose:** A comprehensive, multi-tenant inventory management system supporting hierarchical storage locations, AI-powered item identification, smart search, food/perishable tracking with color-coded expiration, multi-user collaboration with granular permissions, and project-based tool recommendations.

**Target Users:** 
- Homeowners managing multiple properties
- Families sharing inventory across households
- Small businesses and warehouses
- Preppers and food storage enthusiasts
- DIY enthusiasts and makers

**Key Differentiators:**
- Unlimited hierarchical location nesting
- Color-coded expiration system (no date math needed)
- Multi-tenant with granular sharing permissions
- AI + UPC hybrid identification
- "Tools for Project" recommendations

---

## 2. Core Features Overview

### 2.1 Hierarchical Location System

```
User Account
├── My House
│   ├── Garage
│   │   ├── Pegboard Wall
│   │   │   └── Section A, B, C
│   │   ├── Tool Chest
│   │   │   └── Drawer 1, 2, 3...
│   │   └── Shelving Unit
│   │       └── Shelf 1, 2, 3...
│   ├── Basement
│   │   ├── Food Storage Rack
│   │   │   └── Bin 1, 2, 3...
│   │   └── Freezer
│   │       └── Drawer 1, 2...
│   └── Kitchen Pantry
│       └── Shelf 1, 2, 3...
├── Storage Unit #42
│   ├── Rack A
│   │   └── Shelf 1, 2, 3...
│   └── Floor Section
├── Dad's House (shared access)
│   └── Garage
│       └── ...
└── Business Warehouse
    ├── Inbound Staging
    ├── Racking
    │   ├── Aisle A
    │   │   └── Rack 1, 2, 3...
    │   └── Aisle B
    ├── Floor Storage
    └── Outbound Staging
```

**Location Types (Pre-defined Templates):**

| Type | Typical Sub-locations |
|------|----------------------|
| House/Home | Garage, Basement, Attic, Kitchen, Bedroom, Shed, Workshop |
| Warehouse | Inbound, Staging, Racking, Floor, Outbound, Receiving, Shipping |
| Storage Unit | Main Area, Shelving, Floor |
| Office | Supply Closet, Desk, Cabinet |
| Vehicle | Truck Bed, Tool Box, Cab Storage |
| Custom | User-defined |

**Storage Container Types:**
- Bin Rack System
- Drawer Cabinet
- Shelving Unit
- Pegboard Wall
- Tool Chest
- Magnetic Strip
- Parts Organizer
- Freezer/Refrigerator
- Pantry Shelving
- Pallet Racking
- Custom

---

### 2.2 Multi-Tenant Architecture & Permissions

**Tenant Model:**
- Each user has their own account (tenant)
- Users can create unlimited top-level locations
- Locations can be shared with other users
- Sharing can occur at any level of hierarchy

**Permission Levels:**

| Permission | View | Add Items | Edit Items | Delete Items | Manage Location | Invite Users |
|------------|------|-----------|------------|--------------|-----------------|--------------|
| Viewer | ✓ | | | | | |
| Contributor | ✓ | ✓ | Own items | Own items | | |
| Editor | ✓ | ✓ | ✓ | ✓ | | |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Sharing Features:**
- Invite via email
- Share link with permission level
- Inherit permissions from parent location (optional)
- Override permissions at sub-location level
- Activity log per location
- Transfer ownership

---

### 2.3 Enhanced Item Categorization

**Primary Categories:**
```
├── Tools
│   ├── Hand Tools
│   ├── Power Tools
│   ├── Measuring & Layout
│   ├── Cutting Tools
│   └── Specialty Tools
├── Hardware & Fasteners
│   ├── Screws
│   ├── Nails
│   ├── Bolts & Nuts
│   ├── Anchors
│   └── Brackets & Hangers
├── Plumbing
│   ├── Pipes & Fittings
│   ├── Valves
│   ├── Fixtures
│   └── Supplies
├── Electrical
│   ├── Wire & Cable
│   ├── Boxes & Covers
│   ├── Switches & Outlets
│   └── Lighting
├── Building Materials
├── Paint & Finishing
├── Safety Equipment
├── Automotive
├── Garden & Outdoor
├── Food & Consumables (special handling)
│   ├── Canned Goods
│   ├── Dry Goods
│   ├── Frozen
│   ├── Refrigerated
│   └── Beverages
├── Household Supplies
├── Electronics
└── Custom Categories
```

**Item Value Tracking:**
- User-entered purchase price
- User-entered current value
- AI-estimated value (based on item identification)
- Depreciation tracking (optional)
- Total inventory value calculations
- Value by location/category reports

---

### 2.4 Food & Perishable Tracking

#### UPC/Barcode Integration
- Scan UPC codes for automatic item details
- Integration with Open Food Facts API (free)
- Fallback to AI identification
- Manual entry option
- Nutrition info capture (optional)

#### Expiration Date System

**Three Date Fields:**
1. **Printed Expiration Date** - What's on the package
2. **Extended Expiration Date** - When user is actually comfortable using it
3. **Expiration Category** - Color-coded period system

#### 🎨 Color-Coded Expiration System

**Concept:** Instead of constantly checking dates, users apply color stickers when storing items. At a glance, they know what's expired and what to use first.

**Expiration Periods:**
- Monthly (12 colors/year)
- Quarterly (4-6 colors rotating)
- Semi-Annual (2-4 colors)
- Annual (custom)

**Example - Quarterly System:**

| Quarter | Color | Sticker |
|---------|-------|---------|
| Q1 (Jan-Mar) | 🔵 Blue | Blue dot |
| Q2 (Apr-Jun) | 🔴 Red | Red dot |
| Q3 (Jul-Sep) | 🟢 Green | Green dot |
| Q4 (Oct-Dec) | 🟠 Orange | Orange dot |
| Q5 (next year) | 🟤 Brown | Brown dot |
| Q6 (next year) | 🟣 Purple | Purple dot |

**How It Works:**
1. User configures their expiration period (quarterly, monthly, etc.)
2. System generates color schedule for next 6-12 periods
3. When storing item, user selects target expiration period
4. System shows which color sticker to apply
5. Dashboard shows "Expired" items (past periods) in red
6. "Expiring Soon" (current period) in yellow
7. "Fresh" (future periods) in green

**Benefits:**
- No date math while shopping in storage
- Visual scanning for oldest items
- Use FIFO naturally
- Works in low-light (basement, freezer)
- Color-blind accessible (patterns/shapes option)

**Color Schedule Management:**
```javascript
// User sees:
Current Period: Q4 2024 (October - December)
Current Color: 🟠 Orange

Your Color Schedule:
| Period | Dates | Color | Status |
|--------|-------|-------|--------|
| Q2 2024 | Apr-Jun | 🔴 Red | ⚠️ EXPIRED |
| Q3 2024 | Jul-Sep | 🟢 Green | ⚠️ EXPIRED |
| Q4 2024 | Oct-Dec | 🟠 Orange | 📍 CURRENT |
| Q1 2025 | Jan-Mar | 🔵 Blue | Fresh |
| Q2 2025 | Apr-Jun | 🟤 Brown | Fresh |
| Q3 2025 | Jul-Sep | 🟣 Purple | Fresh |
```

---

### 2.5 AI Image Recognition (Enhanced)

**Capabilities:**
- Single item identification
- Multi-item detection (5-10 items)
- Quantity estimation
- Brand/model detection when visible
- Condition assessment
- Value estimation
- Food item recognition
- Expiration date OCR (read dates from packages)

**Identification Sources:**
1. Claude Vision API (primary)
2. UPC Database lookup
3. User synonym database
4. Category inference

---

### 2.6 Smart Search (Enhanced)

**Search Features:**
- Full-text search across all fields
- Fuzzy matching (typos, misspellings)
- Synonym expansion
- Cross-location search
- Category filtering
- Location filtering
- Expiration status filtering
- Value range filtering
- "Did you mean?" suggestions
- Recent searches
- Saved searches

**Example Searches:**
```
"pulley puller" → finds "Bearing Extractor"
"red sticker items" → finds items expiring in Q2
"expired food basement" → finds expired items in basement
"tools over $100" → finds high-value tools
"plumbing Dad's house" → finds plumbing items at shared location
```

---

### 2.7 Mass Import / Bulk Scanning

**Bulk Session Workflow:**
1. Start bulk session
2. Select target location (any level in hierarchy)
3. Set default category (optional)
4. Begin scanning
5. Each scan: AI identifies → User confirms/edits → Next
6. Change target location anytime ("Now working on Bin 5")
7. Review all pending items
8. Commit to inventory

**Multi-Item Scanning:**
- Layout 5-10 items
- Single capture
- AI identifies each
- Grid overlay for confirmation
- Quantity input per item

**Food Bulk Mode:**
- Rapid UPC scanning
- Auto-populate from database
- Quick expiration color selection
- Running total display

---

### 2.8 Tools for Project (Job Kit Builder)

**Features:**
- Natural language job description
- AI-generated tool/material lists
- Pre-defined project templates
- Check inventory availability across all locations
- Show item locations
- Generate shopping list
- Save custom project kits
- Share kits with other users

**Project Categories:**
- Plumbing
- Electrical
- Drywall & Finishing
- Painting
- Flooring
- Roofing
- Automotive
- Landscaping
- HVAC
- Appliance Repair
- Custom

---

### 2.9 Monetization - AdSense Integration

**Ad Placements:**
- Banner ad on dashboard (non-intrusive)
- Interstitial after bulk import completion
- Native ads in search results (marked as sponsored)
- Banner in reports/exports

**Premium Tier (Ad-Free + Features):**
- No advertisements
- Unlimited locations
- Unlimited shared users
- API access
- Priority AI processing
- Advanced reports
- Data export
- White-label option

**Free Tier Limits:**
- 3 top-level locations
- 500 items
- 2 shared users per location
- Ads displayed
- Basic reports

---

## 3. Technical Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│   Web App (PWA)     │   iOS App           │   Android App (Future)      │
│   - HTML5/JS        │   - Swift/SwiftUI   │   - Kotlin                  │
│   - Camera/Scanner  │   - Native Camera   │   - Native Camera           │
└─────────┬───────────┴──────────┬──────────┴────────────┬────────────────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │ HTTPS
                    ┌────────────▼────────────┐
                    │     LOAD BALANCER       │
                    │     (nginx/AWS ALB)     │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                          API LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    Auth     │  │    Core     │  │   Image     │  │   Search    │    │
│  │   Service   │  │    API      │  │   Service   │  │   Service   │    │
│  │  (JWT/OAuth)│  │  (Express)  │  │  (Sharp)    │  │  (Elastic)  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                         DATA LAYER                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │    MongoDB      │  │     Redis       │  │   File Storage  │         │
│  │  (Primary DB)   │  │    (Cache)      │  │   (S3/Local)    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │Claude Vision│  │  UPC API    │  │  AdSense    │  │   Email     │    │
│  │    API      │  │(OpenFoodFacts)│ │             │  │  (SendGrid) │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, JavaScript (Vue.js 3) | Web interface |
| PWA | Service Workers, Workbox | Offline capability |
| Backend | Node.js 20+ Express.js | REST API server |
| Database | MongoDB 7+ with Mongoose | Primary data store |
| Cache | Redis | Session, frequently accessed data |
| Search | MongoDB Atlas Search or Elasticsearch | Full-text, fuzzy search |
| Image Processing | Sharp.js | Optimization, thumbnails |
| Barcode | QuaggaJS (web), native (iOS) | UPC scanning |
| AI Vision | Anthropic Claude API | Item identification |
| UPC Data | Open Food Facts API | Food product details |
| Auth | JWT + bcrypt + OAuth2 | Authentication |
| File Storage | AWS S3 or local | Images |
| Ads | Google AdSense | Monetization |
| Email | SendGrid or AWS SES | Invitations, notifications |
| iOS | Swift/SwiftUI | Native mobile app |

### 3.3 Multi-Tenant Data Isolation

```javascript
// Every query includes tenant context
// Option 1: User ID filtering (simpler)
Item.find({ userId: req.user._id, ...query })

// Option 2: Location-based access (for sharing)
const accessibleLocations = await getAccessibleLocations(req.user._id);
Item.find({ locationId: { $in: accessibleLocations }, ...query })
```

---

## 4. Database Schema Design

### 4.1 Collections Overview

```javascript
// ============================================
// 1. USERS
// ============================================
users: {
  _id: ObjectId,
  email: String,                      // Unique, indexed
  passwordHash: String,
  name: String,
  avatar: String,                     // URL
  
  settings: {
    theme: String,                    // "light" | "dark" | "system"
    defaultView: String,              // "grid" | "list" | "tree"
    cameraPreferences: {
      resolution: String,
      autoCapture: Boolean
    },
    expirationSystem: {
      enabled: Boolean,
      period: String,                 // "monthly" | "quarterly" | "semiannual" | "annual"
      colorScheme: [{
        period: Number,               // 1, 2, 3, etc.
        color: String,                // hex code
        name: String,                 // "Blue", "Red", etc.
        pattern: String               // For color-blind: "solid", "striped", "dotted"
      }],
      startDate: Date                 // When color rotation started
    },
    notifications: {
      expirationAlerts: Boolean,
      lowStockAlerts: Boolean,
      sharingAlerts: Boolean
    }
  },
  
  subscription: {
    tier: String,                     // "free" | "premium" | "business"
    validUntil: Date,
    stripeCustomerId: String
  },
  
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}

// ============================================
// 2. LOCATIONS (Hierarchical)
// ============================================
locations: {
  _id: ObjectId,
  
  // Ownership
  ownerId: ObjectId,                  // User who created/owns
  
  // Hierarchy
  parentId: ObjectId | null,          // null = top-level location
  path: String,                       // Materialized path: ",parent1,parent2,this,"
  depth: Number,                      // 0 = top-level, 1 = child, etc.
  
  // Details
  name: String,                       // "My House", "Garage", "Bin 3"
  type: String,                       // "house" | "warehouse" | "storage_unit" | "room" | "container" | "custom"
  subType: String,                    // "garage" | "basement" | "drawer_cabinet" | etc.
  description: String,
  icon: String,                       // Icon identifier
  color: String,                      // For visual distinction
  
  // Capacity (for containers)
  capacity: {
    type: String,                     // "unlimited" | "slots" | "volume" | "weight"
    max: Number,
    unit: String
  },
  
  // Position within parent
  position: String,                   // "Drawer 1", "Shelf A", "A-1-3"
  sortOrder: Number,                  // For custom ordering
  
  // Cached counts (updated on item changes)
  itemCount: Number,
  childLocationCount: Number,
  totalValue: Number,
  
  // Metadata
  address: {                          // For top-level locations
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes for locations:
// - { ownerId: 1, parentId: 1 }
// - { path: 1 }
// - { ownerId: 1, type: 1 }

// ============================================
// 3. LOCATION SHARES (Permissions)
// ============================================
locationShares: {
  _id: ObjectId,
  locationId: ObjectId,               // Which location is shared
  userId: ObjectId,                   // Who it's shared with
  
  permission: String,                 // "viewer" | "contributor" | "editor" | "manager"
  
  inheritToChildren: Boolean,         // Apply to all sub-locations
  
  invitedBy: ObjectId,                // Who sent the invite
  invitedAt: Date,
  acceptedAt: Date | null,
  
  status: String,                     // "pending" | "accepted" | "declined" | "revoked"
  
  // For pending invites
  inviteToken: String,
  inviteEmail: String,                // If invitee doesn't have account yet
  expiresAt: Date
}

// ============================================
// 4. LOCATION TYPES (Templates)
// ============================================
locationTypes: {
  _id: ObjectId,
  userId: ObjectId | null,            // null = system default
  
  name: String,                       // "Warehouse", "Drawer Cabinet"
  category: String,                   // "property" | "room" | "container"
  icon: String,
  
  suggestedSubTypes: [String],        // For properties: ["garage", "basement", ...]
  suggestedContainers: [String],      // For rooms: ["shelving", "pegboard", ...]
  suggestedPositions: [String],       // For containers: ["Drawer 1", "Shelf A", ...]
  
  defaultCapacity: Object,
  
  isSystemDefault: Boolean,
  createdAt: Date
}

// ============================================
// 5. ITEMS (Inventory) - Enhanced
// ============================================
items: {
  _id: ObjectId,
  
  // Ownership & Location
  ownerId: ObjectId,                  // User who added the item
  locationId: ObjectId,               // Current storage location
  position: String,                   // Position within location
  
  // Identification
  primaryName: String,
  alternateNames: [String],
  description: String,
  
  // Categorization
  category: String,                   // "tools" | "food" | "hardware" | etc.
  subcategory: String,
  tags: [String],
  itemType: String,                   // "tool" | "supply" | "part" | "consumable" | "equipment"
  
  // Quantity
  quantity: Number,
  unit: String,                       // "each" | "box" | "lb" | "oz" | etc.
  minQuantity: Number,                // Alert threshold
  
  // Value
  value: {
    purchasePrice: Number,
    purchaseDate: Date,
    currentValue: Number,
    aiEstimatedValue: Number,
    currency: String                  // "USD" | "EUR" | etc.
  },
  
  // Product Info
  brand: String,
  model: String,
  sku: String,
  upc: String,                        // Barcode
  size: String,
  specifications: Object,             // Flexible key-value
  
  // Images
  images: [{
    url: String,
    thumbnailUrl: String,
    isPrimary: Boolean,
    capturedAt: Date
  }],
  
  // AI Recognition Data
  aiIdentification: {
    confidence: Number,
    alternatives: [{
      name: String,
      confidence: Number
    }],
    estimatedValue: Number,
    identifiedAt: Date
  },
  
  // ============================================
  // FOOD/PERISHABLE SPECIFIC FIELDS
  // ============================================
  perishable: {
    isPerishable: Boolean,
    
    // Traditional dates
    printedExpirationDate: Date,      // What's on package
    extendedExpirationDate: Date,     // User's comfortable use-by
    
    // Color-coded system
    expirationColor: {
      period: Number,                 // Which period (1, 2, 3, etc.)
      color: String,                  // "#0000FF" (blue)
      colorName: String,              // "Blue"
      targetDate: Date,               // End of that period
      assignedAt: Date
    },
    
    // Food-specific
    storageType: String,              // "pantry" | "refrigerated" | "frozen"
    nutritionInfo: Object,            // From UPC database
    allergens: [String],
    servingsRemaining: Number
  },
  
  // Status
  condition: String,                  // "new" | "good" | "fair" | "poor"
  isActive: Boolean,
  isConsumed: Boolean,                // For consumables
  consumedAt: Date,
  
  // History
  locationHistory: [{
    locationId: ObjectId,
    movedAt: Date,
    movedBy: ObjectId
  }],
  
  notes: String,
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,
  updatedBy: ObjectId
}

// Indexes for items:
// - { ownerId: 1, locationId: 1 }
// - { ownerId: 1, primaryName: "text", alternateNames: "text", description: "text", tags: "text" }
// - { ownerId: 1, category: 1, subcategory: 1 }
// - { "perishable.expirationColor.period": 1 }
// - { upc: 1 }

// ============================================
// 6. SYNONYMS
// ============================================
synonyms: {
  _id: ObjectId,
  userId: ObjectId | null,            // null = system-wide
  
  canonicalName: String,
  synonyms: [String],
  category: String,
  
  isSystemDefault: Boolean,
  createdAt: Date
}

// ============================================
// 7. CATEGORIES
// ============================================
categories: {
  _id: ObjectId,
  userId: ObjectId | null,            // null = system default
  
  name: String,
  parentId: ObjectId | null,          // For subcategories
  icon: String,
  color: String,
  
  // For food categories
  defaultStorageType: String,         // "pantry" | "refrigerated" | "frozen"
  typicalShelfLife: Number,           // Days
  
  isSystemDefault: Boolean,
  sortOrder: Number,
  createdAt: Date
}

// ============================================
// 8. PROJECT TEMPLATES
// ============================================
projectTemplates: {
  _id: ObjectId,
  userId: ObjectId | null,
  
  name: String,
  category: String,
  description: String,
  
  requiredTools: [{
    itemName: String,
    category: String,
    priority: String,                 // "essential" | "recommended" | "optional"
    notes: String,
    alternatives: [String]
  }],
  
  requiredMaterials: [{
    itemName: String,
    quantity: Number,
    unit: String,
    notes: String
  }],
  
  safetyItems: [{
    itemName: String,
    priority: String
  }],
  
  tips: [String],
  estimatedTime: String,
  difficulty: String,                 // "beginner" | "intermediate" | "advanced"
  
  isPublic: Boolean,                  // Share with community
  isSystemDefault: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}

// ============================================
// 9. BULK IMPORT SESSIONS
// ============================================
bulkSessions: {
  _id: ObjectId,
  userId: ObjectId,
  
  status: String,                     // "active" | "paused" | "completed" | "cancelled"
  
  currentLocationId: ObjectId,        // "Working on Bin X"
  defaultCategory: String,
  
  items: [{
    tempId: String,
    imageUrl: String,
    
    // From AI/UPC
    suggested: {
      name: String,
      category: String,
      confidence: Number,
      upcData: Object
    },
    
    // User confirmed
    confirmed: {
      name: String,
      category: String,
      quantity: Number,
      expirationColor: Object         // For food items
    },
    
    locationId: ObjectId,             // May differ from session default
    status: String                    // "pending" | "confirmed" | "rejected" | "committed"
  }],
  
  stats: {
    totalScanned: Number,
    confirmed: Number,
    rejected: Number,
    committed: Number
  },
  
  startedAt: Date,
  lastActivityAt: Date,
  completedAt: Date
}

// ============================================
// 10. ACTIVITY LOG
// ============================================
activityLog: {
  _id: ObjectId,
  userId: ObjectId,                   // Who performed action
  
  action: String,                     // "item.create" | "item.update" | "location.share" | etc.
  
  targetType: String,                 // "item" | "location" | "user"
  targetId: ObjectId,
  targetName: String,                 // Cached for display
  
  locationId: ObjectId,               // Where it happened
  
  details: Object,                    // Action-specific details
  
  timestamp: Date
}

// ============================================
// 11. UPC CACHE
// ============================================
upcCache: {
  _id: ObjectId,
  upc: String,                        // Indexed, unique
  
  productName: String,
  brand: String,
  category: String,
  description: String,
  imageUrl: String,
  
  nutritionInfo: Object,
  allergens: [String],
  
  source: String,                     // "openfoodfacts" | "upcitemdb" | "user"
  
  fetchedAt: Date,
  expiresAt: Date                     // Re-fetch after this
}

// ============================================
// 12. EXPIRATION COLOR SCHEDULES
// ============================================
expirationSchedules: {
  _id: ObjectId,
  userId: ObjectId,
  
  name: String,                       // "Quarterly" | "Monthly" | custom
  periodType: String,                 // "monthly" | "quarterly" | "semiannual" | "annual" | "custom"
  periodLengthDays: Number,           // For custom
  
  colors: [{
    sequence: Number,                 // 1, 2, 3, etc.
    color: String,                    // Hex code
    name: String,                     // "Blue", "Red"
    pattern: String                   // "solid" | "striped" | "dotted" | "checkered"
  }],
  
  startDate: Date,                    // When this schedule starts
  
  isActive: Boolean,
  isDefault: Boolean,
  
  createdAt: Date
}

// ============================================
// 13. SAVED SEARCHES
// ============================================
savedSearches: {
  _id: ObjectId,
  userId: ObjectId,
  
  name: String,
  query: String,
  filters: Object,
  
  isQuickAccess: Boolean,             // Show on dashboard
  
  createdAt: Date,
  lastUsedAt: Date
}

// ============================================
// 14. SUBSCRIPTIONS & BILLING
// ============================================
subscriptions: {
  _id: ObjectId,
  userId: ObjectId,
  
  tier: String,                       // "free" | "premium" | "business"
  status: String,                     // "active" | "cancelled" | "past_due"
  
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  
  limits: {
    maxLocations: Number,
    maxItems: Number,
    maxSharedUsers: Number,
    apiAccess: Boolean,
    adsEnabled: Boolean
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5. API Endpoints Design

### 5.1 Authentication
```
POST   /api/auth/register              - Create account
POST   /api/auth/login                 - Login (JWT)
POST   /api/auth/logout                - Logout
POST   /api/auth/refresh               - Refresh token
POST   /api/auth/forgot-password       - Request reset
POST   /api/auth/reset-password        - Reset password
GET    /api/auth/me                    - Get current user
PUT    /api/auth/me                    - Update profile
POST   /api/auth/oauth/google          - Google OAuth
POST   /api/auth/oauth/apple           - Apple OAuth
```

### 5.2 Locations (Hierarchical)
```
GET    /api/locations                  - List top-level locations
GET    /api/locations/tree             - Full location tree
GET    /api/locations/:id              - Get location with children
GET    /api/locations/:id/items        - Get items in location
GET    /api/locations/:id/path         - Get full path to location
POST   /api/locations                  - Create location
PUT    /api/locations/:id              - Update location
DELETE /api/locations/:id              - Delete location (cascade option)
POST   /api/locations/:id/move         - Move to different parent

# Sharing
GET    /api/locations/:id/shares       - List shares for location
POST   /api/locations/:id/shares       - Invite user
PUT    /api/locations/:id/shares/:shareId - Update permission
DELETE /api/locations/:id/shares/:shareId - Revoke access
POST   /api/locations/shares/accept    - Accept invitation
GET    /api/locations/shared-with-me   - Locations shared with current user
```

### 5.3 Location Types
```
GET    /api/location-types             - List all types
GET    /api/location-types/:id         - Get type details
POST   /api/location-types             - Create custom type
PUT    /api/location-types/:id         - Update type
DELETE /api/location-types/:id         - Delete custom type
```

### 5.4 Items
```
GET    /api/items                      - List items (paginated, filtered)
GET    /api/items/:id                  - Get single item
POST   /api/items                      - Create item (manual)
PUT    /api/items/:id                  - Update item
DELETE /api/items/:id                  - Delete/archive item
POST   /api/items/:id/move             - Move to different location
POST   /api/items/:id/consume          - Mark as consumed
POST   /api/items/:id/duplicate        - Duplicate item
GET    /api/items/:id/history          - Get item history
```

### 5.5 Item Identification
```
POST   /api/identify/image             - Upload image, get AI identification
POST   /api/identify/upc               - Lookup by UPC code
POST   /api/identify/batch             - Identify multiple images
GET    /api/identify/recent            - Recent identifications
```

### 5.6 Search
```
GET    /api/search                     - Main search endpoint
  ?q=query                             - Search query
  &location=id                         - Filter by location
  &category=tools                      - Filter by category
  &expiration=expired|expiring|fresh   - Filter by expiration status
  &minValue=100&maxValue=500           - Value range
  &fuzzy=true                          - Enable fuzzy matching
  
GET    /api/search/suggestions         - Autocomplete
GET    /api/search/saved               - Saved searches
POST   /api/search/saved               - Save a search
DELETE /api/search/saved/:id           - Delete saved search
```

### 5.7 Categories
```
GET    /api/categories                 - List all categories
GET    /api/categories/tree            - Category tree
POST   /api/categories                 - Create custom category
PUT    /api/categories/:id             - Update category
DELETE /api/categories/:id             - Delete category
```

### 5.8 Synonyms
```
GET    /api/synonyms                   - List synonyms
POST   /api/synonyms                   - Add synonym
PUT    /api/synonyms/:id               - Update
DELETE /api/synonyms/:id               - Delete
```

### 5.9 Expiration System
```
GET    /api/expiration/schedules       - Get user's schedules
POST   /api/expiration/schedules       - Create schedule
PUT    /api/expiration/schedules/:id   - Update schedule
DELETE /api/expiration/schedules/:id   - Delete schedule
GET    /api/expiration/current         - Get current period & color
GET    /api/expiration/dashboard       - Expiration overview
GET    /api/expiration/expired         - List expired items
GET    /api/expiration/expiring-soon   - List items expiring in current period
```

### 5.10 Bulk Import
```
POST   /api/bulk/sessions              - Start bulk session
GET    /api/bulk/sessions/:id          - Get session status
PUT    /api/bulk/sessions/:id          - Update session (change location)
POST   /api/bulk/sessions/:id/scan     - Add scanned item
PUT    /api/bulk/sessions/:id/items/:itemId - Confirm/edit item
DELETE /api/bulk/sessions/:id/items/:itemId - Reject item
POST   /api/bulk/sessions/:id/commit   - Commit all confirmed items
DELETE /api/bulk/sessions/:id          - Cancel session
GET    /api/bulk/sessions              - List user's sessions
```

### 5.11 Projects
```
GET    /api/projects/templates         - List templates
GET    /api/projects/templates/:id     - Get template
POST   /api/projects/templates         - Create custom template
PUT    /api/projects/templates/:id     - Update template
DELETE /api/projects/templates/:id     - Delete template
POST   /api/projects/suggest           - AI suggest tools for job
POST   /api/projects/check-inventory   - Check availability of tools
POST   /api/projects/generate-list     - Generate shopping list
```

### 5.12 Reports & Analytics
```
GET    /api/reports/inventory-value    - Total value by location/category
GET    /api/reports/expiration         - Expiration summary
GET    /api/reports/activity           - Activity log
GET    /api/reports/low-stock          - Items below minimum
GET    /api/reports/export             - Export data (CSV/JSON)
```

### 5.13 Images
```
POST   /api/images/upload              - Upload image
GET    /api/images/:id                 - Get image
DELETE /api/images/:id                 - Delete image
```

### 5.14 User Settings
```
GET    /api/settings                   - Get all settings
PUT    /api/settings                   - Update settings
GET    /api/settings/expiration        - Get expiration settings
PUT    /api/settings/expiration        - Update expiration settings
```

### 5.15 Subscriptions
```
GET    /api/subscription               - Get current subscription
POST   /api/subscription/checkout      - Create checkout session
POST   /api/subscription/portal        - Customer portal link
POST   /api/subscription/webhook       - Stripe webhook
```

---

## 6. Color-Coded Expiration System - Detailed Design

### 6.1 System Configuration

```javascript
// User's expiration configuration
{
  period: "quarterly",  // monthly | quarterly | semiannual | annual | custom
  customPeriodDays: null,  // Only for custom
  
  // Rolling 6-period color scheme
  colors: [
    { sequence: 1, color: "#3B82F6", name: "Blue", pattern: "solid" },
    { sequence: 2, color: "#EF4444", name: "Red", pattern: "solid" },
    { sequence: 3, color: "#22C55E", name: "Green", pattern: "solid" },
    { sequence: 4, color: "#F97316", name: "Orange", pattern: "solid" },
    { sequence: 5, color: "#78350F", name: "Brown", pattern: "solid" },
    { sequence: 6, color: "#A855F7", name: "Purple", pattern: "solid" }
  ],
  
  startDate: "2024-01-01",  // Q1 2024 is period 1 (Blue)
  
  // Accessibility options
  usePatterns: false,  // Add patterns for color-blind users
  showColorName: true  // Display name alongside color
}
```

### 6.2 Period Calculation Logic

```javascript
// Calculate current period number
function getCurrentPeriod(config) {
  const now = new Date();
  const start = new Date(config.startDate);
  
  let periodLength;
  switch (config.period) {
    case 'monthly': periodLength = 30; break;
    case 'quarterly': periodLength = 91; break;
    case 'semiannual': periodLength = 182; break;
    case 'annual': periodLength = 365; break;
    case 'custom': periodLength = config.customPeriodDays; break;
  }
  
  const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const currentPeriod = Math.floor(daysSinceStart / periodLength) + 1;
  
  return currentPeriod;
}

// Get color for a period
function getColorForPeriod(period, config) {
  const colorCount = config.colors.length;
  const colorIndex = (period - 1) % colorCount;
  return config.colors[colorIndex];
}

// Get status of an item's expiration
function getExpirationStatus(item, currentPeriod) {
  const itemPeriod = item.perishable.expirationColor.period;
  
  if (itemPeriod < currentPeriod) return 'expired';
  if (itemPeriod === currentPeriod) return 'expiring';
  return 'fresh';
}
```

### 6.3 User Interface Elements

**Period Selector (when storing item):**
```
┌─────────────────────────────────────────────┐
│  When should this item expire?              │
├─────────────────────────────────────────────┤
│  Current: Q4 2024 (🟠 Orange)               │
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 🔵  │ │ 🔴  │ │ 🟢  │ │ 🟠  │ │ 🟤  │   │
│  │ Q1  │ │ Q2  │ │ Q3  │ │ Q4  │ │ Q1  │   │
│  │ EXP │ │ EXP │ │ EXP │ │ NOW │ │ '25 │   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
│                                             │
│  ┌─────┐                                    │
│  │ 🟣  │  ← Apply PURPLE sticker            │
│  │ Q2  │    Expires: Apr-Jun 2025           │
│  │ '25 │                                    │
│  └─────┘                                    │
│                                             │
│  [Confirm: Purple Sticker for Q2 2025]      │
└─────────────────────────────────────────────┘
```

**Dashboard Expiration Widget:**
```
┌─────────────────────────────────────────────┐
│  📅 Expiration Overview                     │
├─────────────────────────────────────────────┤
│                                             │
│  ⚠️ EXPIRED (use immediately or discard)    │
│  ┌──────────────────────────────────────┐   │
│  │ 🔵 Q1 2024: 3 items                  │   │
│  │ 🔴 Q2 2024: 5 items                  │   │
│  │ 🟢 Q3 2024: 2 items                  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ⏰ EXPIRING NOW (use first)                │
│  ┌──────────────────────────────────────┐   │
│  │ 🟠 Q4 2024: 12 items                 │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ✅ FRESH                                   │
│  ┌──────────────────────────────────────┐   │
│  │ 🟤 Q1 2025: 8 items                  │   │
│  │ 🟣 Q2 2025: 15 items                 │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [View All Expiring Items]                  │
└─────────────────────────────────────────────┘
```

---

## 7. Permission System - Detailed Design

### 7.1 Permission Resolution

```javascript
// Get effective permission for a user on a location
async function getEffectivePermission(userId, locationId) {
  // 1. Check if user is owner
  const location = await Location.findById(locationId);
  if (location.ownerId.equals(userId)) {
    return 'owner';
  }
  
  // 2. Check direct share
  const directShare = await LocationShare.findOne({
    locationId,
    userId,
    status: 'accepted'
  });
  
  if (directShare) {
    return directShare.permission;
  }
  
  // 3. Check inherited permissions (walk up the tree)
  if (location.parentId) {
    const ancestors = await getAncestors(locationId);
    
    for (const ancestor of ancestors) {
      const inheritedShare = await LocationShare.findOne({
        locationId: ancestor._id,
        userId,
        status: 'accepted',
        inheritToChildren: true
      });
      
      if (inheritedShare) {
        return inheritedShare.permission;
      }
    }
  }
  
  // 4. No access
  return null;
}

// Check if user can perform action
function canPerformAction(permission, action) {
  const permissions = {
    viewer: ['view'],
    contributor: ['view', 'create', 'update_own', 'delete_own'],
    editor: ['view', 'create', 'update', 'delete'],
    manager: ['view', 'create', 'update', 'delete', 'manage_location', 'invite'],
    owner: ['view', 'create', 'update', 'delete', 'manage_location', 'invite', 'transfer', 'delete_location']
  };
  
  return permissions[permission]?.includes(action) || false;
}
```

### 7.2 Sharing UI

```
┌─────────────────────────────────────────────┐
│  Share "Dad's House"                        │
├─────────────────────────────────────────────┤
│                                             │
│  Owner: You                                 │
│                                             │
│  ─────────────────────────────────────      │
│  Shared With:                               │
│  ─────────────────────────────────────      │
│                                             │
│  👤 dad@email.com                           │
│     Permission: [Editor ▼]                  │
│     Includes sub-locations: ☑️              │
│     [Remove]                                │
│                                             │
│  👤 brother@email.com                       │
│     Permission: [Viewer ▼]                  │
│     Includes sub-locations: ☑️              │
│     [Remove]                                │
│                                             │
│  ─────────────────────────────────────      │
│  Invite Someone:                            │
│  ─────────────────────────────────────      │
│                                             │
│  Email: [_______________________]           │
│  Permission: [Contributor ▼]                │
│  Include sub-locations: ☑️                  │
│                                             │
│  [Send Invitation]                          │
│                                             │
│  ─────────────────────────────────────      │
│  🔗 Share Link (anyone with link can join)  │
│  Permission: [Viewer ▼]                     │
│  [Copy Link]                                │
└─────────────────────────────────────────────┘
```

---

## 8. Development Roadmap - Revised

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Multi-tenant core with hierarchical locations

#### Week 1: Project Setup
- [ ] Node.js/Express project structure
- [ ] MongoDB connection with Mongoose
- [ ] Environment configuration
- [ ] Basic HTML5 frontend scaffold
- [ ] CSS framework setup (Tailwind)
- [ ] Development tooling (ESLint, nodemon)

#### Week 2: Authentication
- [ ] User registration/login
- [ ] JWT authentication
- [ ] Password hashing
- [ ] Protected routes middleware
- [ ] Basic user settings
- [ ] OAuth placeholders (Google, Apple)

#### Week 3: Hierarchical Locations
- [ ] Location model with materialized path
- [ ] Location CRUD operations
- [ ] Tree traversal utilities
- [ ] Location types (system defaults)
- [ ] Custom location types
- [ ] Frontend: Location tree view

#### Week 4: Location Sharing & Permissions
- [ ] LocationShare model
- [ ] Permission checking middleware
- [ ] Invite flow (email)
- [ ] Accept/decline invitations
- [ ] Permission inheritance
- [ ] Frontend: Share dialog

**Deliverable:** Multi-user system with hierarchical shared locations

---

### Phase 2: Item Management (Weeks 5-7)
**Goal:** Full item CRUD with categories and values

#### Week 5: Basic Items
- [ ] Item model (enhanced schema)
- [ ] Item CRUD operations
- [ ] Category system (hierarchical)
- [ ] Default categories seed data
- [ ] Custom categories
- [ ] Frontend: Item forms

#### Week 6: Value & Product Info
- [ ] Value tracking (purchase, current, estimated)
- [ ] Brand/model/SKU fields
- [ ] Specifications (flexible key-value)
- [ ] Condition tracking
- [ ] Item history
- [ ] Frontend: Value displays, reports

#### Week 7: Multi-location Features
- [ ] Move item between locations
- [ ] Cross-location search
- [ ] Location-based item counts (cached)
- [ ] Item duplication
- [ ] Bulk item operations
- [ ] Frontend: Drag-drop move

**Deliverable:** Complete item management across locations

---

### Phase 3: AI & Image Recognition (Weeks 8-10)
**Goal:** Camera capture and AI identification

#### Week 8: Image Infrastructure
- [ ] Image upload with Sharp.js
- [ ] Thumbnail generation
- [ ] S3 integration (optional)
- [ ] Camera capture (HTML5 MediaDevices)
- [ ] Image gallery per item
- [ ] Frontend: Camera component

#### Week 9: AI Identification
- [ ] Claude Vision API integration
- [ ] Identification prompt engineering
- [ ] Multi-item detection
- [ ] Confidence scoring
- [ ] Value estimation
- [ ] Frontend: Identification UI

#### Week 10: UPC & Barcode
- [ ] QuaggaJS barcode scanning
- [ ] Open Food Facts API integration
- [ ] UPC cache database
- [ ] Fallback to AI when no UPC match
- [ ] Frontend: Barcode scanner mode

**Deliverable:** Scan items → AI/UPC identifies → Confirm workflow

---

### Phase 4: Food & Expiration System (Weeks 11-13)
**Goal:** Color-coded expiration tracking

#### Week 11: Expiration Core
- [ ] Expiration schedule model
- [ ] Period calculation logic
- [ ] Color scheme configuration
- [ ] Default quarterly schedule
- [ ] Current period indicator
- [ ] Frontend: Schedule setup wizard

#### Week 12: Food Item Features
- [ ] Perishable item fields
- [ ] Expiration color assignment
- [ ] Nutrition info storage
- [ ] Allergen tracking
- [ ] Storage type (pantry/fridge/freezer)
- [ ] Frontend: Food item form

#### Week 13: Expiration Dashboard
- [ ] Expired items query
- [ ] Expiring soon alerts
- [ ] Expiration reports
- [ ] Color-coded item displays
- [ ] Notification system
- [ ] Frontend: Expiration dashboard widget

**Deliverable:** Full color-coded expiration system

---

### Phase 5: Smart Search (Weeks 14-15)
**Goal:** Find items even with wrong names

#### Week 14: Search Engine
- [ ] MongoDB text search setup
- [ ] Fuzzy matching (Levenshtein)
- [ ] Synonym database & expansion
- [ ] Search result ranking
- [ ] Cross-location search with permissions
- [ ] Frontend: Search UI

#### Week 15: Search Enhancements
- [ ] "Did you mean?" suggestions
- [ ] Autocomplete
- [ ] Saved searches
- [ ] Recent searches
- [ ] Search analytics
- [ ] Advanced filters UI

**Deliverable:** Smart search finds "pulley puller" → "bearing extractor"

---

### Phase 6: Bulk Import (Weeks 16-18)
**Goal:** Rapid mass inventory loading

#### Week 16: Bulk Session Core
- [ ] Bulk session model
- [ ] Session create/manage API
- [ ] "Working on Bin X" state
- [ ] Add scanned items to session
- [ ] Session persistence (resume later)

#### Week 17: Multi-Item Scanning
- [ ] Enhanced AI prompt (multiple items)
- [ ] Quantity estimation
- [ ] Grid layout detection
- [ ] Batch image processing
- [ ] Frontend: Bulk mode UI

#### Week 18: Review & Commit
- [ ] Pending items review queue
- [ ] Batch confirm/edit
- [ ] Commit workflow
- [ ] Session summary
- [ ] Rollback capability
- [ ] Frontend: Review screen

**Deliverable:** Rapid-fire mode for 20+ bins

---

### Phase 7: Projects & Recommendations (Weeks 19-20)
**Goal:** "Tools for Project" feature

#### Week 19: Project Templates
- [ ] Template model
- [ ] Default templates (10+)
- [ ] Custom template creation
- [ ] Template categories
- [ ] Frontend: Template browser

#### Week 20: AI Suggestions & Inventory Check
- [ ] Natural language job input
- [ ] Claude-powered tool suggestions
- [ ] Inventory availability check
- [ ] Shopping list generation
- [ ] Save custom kits
- [ ] Frontend: Project wizard

**Deliverable:** Describe job → Get tools → Check inventory

---

### Phase 8: Monetization & Polish (Weeks 21-23)
**Goal:** AdSense, subscriptions, production-ready

#### Week 21: AdSense Integration
- [ ] Ad placement components
- [ ] Responsive ad units
- [ ] Ad-free logic for premium
- [ ] Ad performance tracking

#### Week 22: Subscriptions
- [ ] Subscription tiers model
- [ ] Stripe integration
- [ ] Checkout flow
- [ ] Customer portal
- [ ] Tier limit enforcement
- [ ] Frontend: Upgrade prompts

#### Week 23: PWA & Polish
- [ ] Service worker
- [ ] Web app manifest
- [ ] Offline capability
- [ ] Push notifications
- [ ] Performance optimization
- [ ] Error handling polish
- [ ] User onboarding

**Deliverable:** Production-ready PWA with monetization

---

### Phase 9: iOS App (Weeks 24-30)
**Goal:** Native iOS application

#### Weeks 24-25: iOS Foundation
- [ ] Xcode project (Swift/SwiftUI)
- [ ] API client
- [ ] Authentication
- [ ] Navigation structure

#### Weeks 26-27: Core Features
- [ ] Location browser
- [ ] Item management
- [ ] Native camera
- [ ] Barcode scanner

#### Weeks 28-29: Advanced Features
- [ ] Bulk scanning mode
- [ ] Expiration system
- [ ] Projects
- [ ] Offline mode

#### Week 30: Polish & Release
- [ ] iOS-specific UX
- [ ] App Store assets
- [ ] TestFlight beta
- [ ] App Store submission

**Deliverable:** iOS app on App Store

---

## 9. File Structure - Updated

```
inventory-system/
├── server/
│   ├── config/
│   │   ├── database.js
│   │   ├── claude.js
│   │   ├── stripe.js
│   │   ├── s3.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── locationController.js
│   │   ├── shareController.js
│   │   ├── itemController.js
│   │   ├── categoryController.js
│   │   ├── identifyController.js
│   │   ├── searchController.js
│   │   ├── bulkController.js
│   │   ├── expirationController.js
│   │   ├── projectController.js
│   │   ├── reportController.js
│   │   ├── imageController.js
│   │   ├── subscriptionController.js
│   │   └── settingsController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Location.js
│   │   ├── LocationShare.js
│   │   ├── LocationType.js
│   │   ├── Item.js
│   │   ├── Category.js
│   │   ├── Synonym.js
│   │   ├── ExpirationSchedule.js
│   │   ├── ProjectTemplate.js
│   │   ├── BulkSession.js
│   │   ├── UpcCache.js
│   │   ├── ActivityLog.js
│   │   ├── SavedSearch.js
│   │   └── Subscription.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── locations.js
│   │   ├── shares.js
│   │   ├── items.js
│   │   ├── categories.js
│   │   ├── identify.js
│   │   ├── search.js
│   │   ├── bulk.js
│   │   ├── expiration.js
│   │   ├── projects.js
│   │   ├── reports.js
│   │   ├── images.js
│   │   ├── subscriptions.js
│   │   └── settings.js
│   ├── services/
│   │   ├── aiService.js
│   │   ├── upcService.js
│   │   ├── imageService.js
│   │   ├── searchService.js
│   │   ├── expirationService.js
│   │   ├── permissionService.js
│   │   ├── emailService.js
│   │   └── stripeService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── permissions.js
│   │   ├── upload.js
│   │   ├── rateLimiter.js
│   │   ├── tierLimits.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── locationPath.js
│   │   ├── fuzzyMatch.js
│   │   ├── periodCalculator.js
│   │   └── helpers.js
│   ├── seeds/
│   │   ├── locationTypes.js
│   │   ├── categories.js
│   │   ├── synonyms.js
│   │   ├── projectTemplates.js
│   │   └── expirationSchedules.js
│   ├── app.js
│   └── server.js
├── client/
│   ├── index.html
│   ├── css/
│   │   ├── tailwind.css
│   │   └── custom.css
│   ├── js/
│   │   ├── app.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── router.js
│   │   ├── components/
│   │   │   ├── LocationTree.js
│   │   │   ├── ItemCard.js
│   │   │   ├── Scanner.js
│   │   │   ├── BarcodeScanner.js
│   │   │   ├── BulkMode.js
│   │   │   ├── SearchBar.js
│   │   │   ├── ExpirationPicker.js
│   │   │   ├── ShareDialog.js
│   │   │   ├── ProjectWizard.js
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Locations.js
│   │   │   ├── Items.js
│   │   │   ├── Scan.js
│   │   │   ├── BulkImport.js
│   │   │   ├── Search.js
│   │   │   ├── Expiration.js
│   │   │   ├── Projects.js
│   │   │   ├── Settings.js
│   │   │   └── ...
│   │   └── utils/
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   ├── manifest.json
│   └── sw.js
├── uploads/
├── ios/
│   └── InventoryApp/
│       ├── Models/
│       ├── Views/
│       ├── ViewModels/
│       ├── Services/
│       └── ...
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ...
├── package.json
├── .env.example
└── README.md
```

---

## 10. Environment Variables - Updated

```bash
# .env.example

# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/inventory

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=90d

# Claude API
ANTHROPIC_API_KEY=your-anthropic-key

# Image Storage
STORAGE_TYPE=local  # local | s3
UPLOAD_DIR=./uploads
# S3 (if STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1

# UPC API
OPEN_FOOD_FACTS_API=https://world.openfoodfacts.org/api/v0

# Email (for invitations)
EMAIL_SERVICE=sendgrid  # sendgrid | ses
SENDGRID_API_KEY=
FROM_EMAIL=noreply@yourdomain.com

# Stripe (subscriptions)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_BUSINESS=price_xxx

# Google AdSense
ADSENSE_CLIENT_ID=ca-pub-xxxxxxxx
ADSENSE_SLOT_BANNER=xxxxxxxx
ADSENSE_SLOT_INTERSTITIAL=xxxxxxxx

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# Frontend
CLIENT_URL=http://localhost:3000
```

---

## 11. Default Seed Data Summary

| Data Type | Count | Examples |
|-----------|-------|----------|
| Location Types | 15+ | House, Warehouse, Storage Unit, Vehicle, Room types, Container types |
| Categories | 50+ | Tools (hand, power), Hardware, Plumbing, Electrical, Food (canned, frozen, etc.) |
| Synonyms | 100+ | Bearing Extractor ↔ Pulley Puller, Sawzall ↔ Reciprocating Saw |
| Project Templates | 15+ | Copper Pipe Repair, Outlet Installation, Drywall Patch, Oil Change |
| Expiration Schedules | 3 | Monthly, Quarterly, Semi-Annual |
| Color Schemes | 2 | Standard (6 colors), Extended (12 colors) |

---

## 12. Success Metrics - Updated

### Technical Metrics
- API response time: <200ms (non-AI)
- AI identification: <3 seconds
- Search results: <500ms
- Page load: <2 seconds
- Image upload: <1 second

### Business Metrics
- User registration → first item added: <5 minutes
- Bulk import: 20 items in <5 minutes
- Search accuracy (find with wrong name): >85%
- Premium conversion rate target: 5%
- User retention (30-day): 40%

### Quality Metrics
- AI identification accuracy: >80%
- UPC lookup success rate: >70%
- User-reported bugs per week: <5

---

## 13. Next Steps

1. **Review this expanded plan** - Any missing features?
2. **Finalize project name**
3. **Confirm tech stack choices**
4. **Set up development environment**
5. **Begin Phase 1, Week 1**

---

*Document Version: 2.0*
*Created: December 2024*
*Major additions: Hierarchical locations, Multi-tenancy, Permissions, Food tracking, Color-coded expiration*
