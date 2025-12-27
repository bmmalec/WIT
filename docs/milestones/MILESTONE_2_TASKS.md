# Milestone 2: Items & Categories
## WIT (Where Is It) - User Stories with Agent Tasks

**Duration:** Weeks 5-7
**Stories:** 20 total
**Depends On:** Milestone 1

---

## Epic 4: Item Management

### US-4.1.1: Create Item Manually
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to manually add items to track my inventory.

#### DATABASE Agent Tasks:
- [ ] Create `server/models/Item.js` with schema:
  - `ownerId` - ObjectId, ref: 'User', required, indexed
  - `locationId` - ObjectId, ref: 'Location', required, indexed
  - `primaryName` - String, required, trimmed, max 200
  - `alternateNames` - [String], for search
  - `description` - String, max 2000
  - `category` - String, indexed
  - `subcategory` - String
  - `itemType` - String, enum: ['tool', 'supply', 'part', 'consumable', 'equipment', 'other']
  - `brand` - String, max 100
  - `model` - String, max 100
  - `serialNumber` - String
  - `upc` - String, indexed
  - `tags` - [String], lowercase
  - `quantity` - Number, default: 1, min: 0
  - `unit` - String, default: 'each'
  - `minQuantity` - Number (for low stock alerts)
  - `value.purchasePrice` - Number
  - `value.purchaseDate` - Date
  - `value.purchasedFrom` - String
  - `value.currentValue` - Number
  - `value.currency` - String, default: 'USD'
  - `value.estimatedByAI` - Boolean
  - `condition` - String, enum: ['new', 'like_new', 'good', 'fair', 'poor']
  - `images` - Array of { url, thumbnailUrl, isPrimary, uploadedAt }
  - `perishable.isPerishable` - Boolean, default: false
  - `perishable.printedExpirationDate` - Date
  - `perishable.extendedExpirationDate` - Date
  - `perishable.expirationColor` - { period, color, colorName, targetDate }
  - `perishable.storageType` - enum: ['pantry', 'refrigerated', 'frozen']
  - `notes` - String
  - `customFields` - Map
  - `locationHistory` - [{ locationId, movedAt, movedBy }]
  - `isActive` - Boolean, default: true
  - `consumedAt` - Date
  - `timestamps` - true
- [ ] Add indexes:
  - `{ ownerId: 1, locationId: 1 }`
  - `{ primaryName: 'text', alternateNames: 'text', description: 'text', tags: 'text' }`
  - `{ ownerId: 1, category: 1 }`
  - `{ upc: 1 }`
- [ ] Add static methods:
  - `findByLocation(locationId)` - Items in location
  - `search(userId, query, options)` - Full-text search
- [ ] Update `docs/interfaces/models.md`

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_2_TASKS.md (US-4.1.1 section)

Task: Create the Item model for US-4.1.1.

Create server/models/Item.js with ALL fields listed in the task.
This is a large model - include everything for future features.

Add text index for search across name, alternateNames, description, tags.
Update docs/interfaces/models.md.
```

#### BACKEND Agent Tasks:
- [ ] Create `server/services/itemService.js`:
  - `create(userId, data)` - Create item with permission check
  - `getAll(userId, options)` - Paginated list with filters
  - `getById(userId, itemId)` - Single item
  - `getByLocation(userId, locationId, options)` - Items in location
- [ ] Create `server/controllers/itemController.js`:
  - `create(req, res)` - POST /api/items
  - `getAll(req, res)` - GET /api/items
  - `getOne(req, res)` - GET /api/items/:id
- [ ] Create `server/routes/items.js`
- [ ] Update `docs/interfaces/api-endpoints.md`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/interfaces/models.md

Task: Implement item creation for US-4.1.1.

Create:
1. server/services/itemService.js - create, getAll, getById, getByLocation
2. server/controllers/itemController.js - handlers
3. server/routes/items.js - routes (all protected)

For create:
- Verify user can add to locationId (permission: 'contributor' or higher)
- Increment location.itemCount

Pagination: page, limit, sort params
Filters: location, category, tags, search

Update docs/interfaces/api-endpoints.md.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ItemForm.js`:
  - Basic: name, description, category, quantity
  - Details: brand, model, serial, condition
  - Value: purchase price, date, vendor, current value
  - Tags input
  - Location picker (pre-selected if from location view)
- [ ] Create `client/js/components/ItemCard.js`:
  - Thumbnail image
  - Name, category
  - Quantity badge
  - Location path
  - Click to view details
- [ ] Create `client/js/pages/ItemsPage.js`:
  - Grid/list toggle
  - Filters sidebar
  - Pagination
- [ ] Add "Add Item" button to location detail

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Read: docs/agents/FRONTEND_AGENT.md
Read: docs/interfaces/api-endpoints.md

Task: Create item UI for US-4.1.1.

Create:
1. client/js/components/ItemForm.js - multi-section form
2. client/js/components/ItemCard.js - grid display card
3. client/js/pages/ItemsPage.js - items listing

ItemForm sections:
- Basic Info (name*, category, quantity)
- Details (brand, model, condition) - collapsible
- Value (purchase info) - collapsible
- Tags

Use Tailwind for styling. Add form validation.
```

---

### US-4.1.2: View Item Details
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to view all details of an item.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/pages/ItemDetailPage.js`:
  - Hero image with gallery dots
  - All item fields organized in sections
  - Location breadcrumb
  - Edit / Delete buttons
  - History section (location moves)
- [ ] Create `client/js/components/ItemImageGallery.js`:
  - Main image display
  - Thumbnail strip
  - Lightbox on click

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create item detail page for US-4.1.2.

Create:
1. client/js/pages/ItemDetailPage.js
2. client/js/components/ItemImageGallery.js

Layout:
- Left: Image gallery
- Right: Item info (name, category, quantity, value)
- Below: Description, details tabs
- Actions: Edit, Move, Delete buttons

Show location breadcrumb at top.
```

---

### US-4.1.3: Edit Item
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user with edit permission, I want to update item details.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/itemService.js`:
  - `update(userId, itemId, updates)` - Update with permission check
- [ ] Add to `server/controllers/itemController.js`:
  - `update(req, res)` - PUT /api/items/:id
- [ ] Add route

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement item update for US-4.1.3.

Add update(userId, itemId, updates) to itemService:
- Verify user has 'contributor' or higher on item's location
- Don't allow changing ownerId
- Track if locationId changes (handle in US-4.1.5)

Add PUT /api/items/:id route.
```

#### FRONTEND Agent Tasks:
- [ ] Add edit mode to ItemForm
- [ ] Add Edit button to ItemDetailPage
- [ ] Pre-fill form with existing data

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add item editing for US-4.1.3.

Update ItemForm to accept existing item data.
Add Edit button to ItemDetailPage.
Navigate to edit form or show inline/modal.
Show "Update" button instead of "Create".
```

---

### US-4.1.4: Delete Item
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user with delete permission, I want to delete an item.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/itemService.js`:
  - `delete(userId, itemId)` - Soft delete (isActive = false)
  - Decrement location.itemCount
- [ ] Add route: DELETE `/api/items/:id`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement item deletion for US-4.1.4.

Add delete(userId, itemId) to itemService:
- Verify user has 'editor' or higher permission
- Set isActive = false
- Decrement location.itemCount

Add DELETE /api/items/:id route.
```

#### FRONTEND Agent Tasks:
- [ ] Add Delete button to ItemDetailPage
- [ ] Confirmation dialog
- [ ] Redirect to items list after delete

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add item deletion for US-4.1.4.

Add Delete button (trash icon) to ItemDetailPage.
Show confirmation dialog: "Delete [Item Name]?"
On confirm: call DELETE API, redirect to items list.
Show success toast.
```

---

### US-4.1.5: Move Item
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to move an item to a different location.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/itemService.js`:
  - `move(userId, itemId, newLocationId)` - Move with history
  - Verify permission on both locations
  - Update counts on old and new location
  - Add to locationHistory
- [ ] Add route: POST `/api/items/:id/move`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement item move for US-4.1.5.

Add move(userId, itemId, newLocationId) to itemService:
1. Get item, verify exists
2. Verify user has 'contributor' on old location
3. Verify user has 'contributor' on new location
4. Decrement old location itemCount
5. Increment new location itemCount
6. Push to item.locationHistory
7. Update item.locationId
8. Save

Add POST /api/items/:id/move route.
Body: { locationId }
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/MoveItemDialog.js`:
  - Location tree picker
  - Current location shown
  - Confirm button
- [ ] Add Move button to ItemDetailPage

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create move item dialog for US-4.1.5.

Create client/js/components/MoveItemDialog.js:
- Show current location
- Location tree for selection
- Highlight selected destination
- "Move" button

Add Move button to ItemDetailPage actions.
After move: refresh item details, show success.
```

---

### US-4.2.1: Assign Category
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to assign a category to items.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/CategoryPicker.js`:
  - Two-level dropdown (category → subcategory)
  - Search/filter
  - Category icons
  - "Other" option
- [ ] Integrate into ItemForm

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create category picker for US-4.2.1.

Create client/js/components/CategoryPicker.js:
- Dropdown with category list
- On select: show subcategories
- Search to filter
- Show icons next to categories
- Support "Other" with custom input

Integrate into ItemForm.
```

---

### US-4.2.4: View Default Categories
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want pre-defined categories.

#### DATABASE Agent Tasks:
- [ ] Create `server/seeds/categories.js`:
  - Tools: Hand Tools, Power Tools, Measuring, Safety Equipment
  - Hardware: Fasteners, Brackets, Hinges, Hooks
  - Plumbing: Pipes, Fittings, Valves, Fixtures
  - Electrical: Wire, Outlets, Switches, Lighting
  - Building Materials: Lumber, Drywall, Insulation, Roofing
  - Paint: Interior, Exterior, Stains, Primers
  - Automotive: Fluids, Parts, Accessories, Tools
  - Garden: Plants, Tools, Fertilizer, Pots
  - Food: Canned, Dry Goods, Frozen, Refrigerated, Beverages
  - Household: Cleaning, Paper Products, Storage
  - Electronics: Cables, Components, Devices
  - Office: Supplies, Paper, Equipment
- [ ] Each with icon and subcategories

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create categories seed data for US-4.2.4.

Create server/seeds/categories.js:

Export array of categories, each with:
- name (slug)
- label (display)
- icon (emoji)
- subcategories: [{ name, label }]

Include 12+ main categories with 4-8 subcategories each.
Cover: Tools, Hardware, Plumbing, Electrical, Building, Paint, Automotive, Garden, Food, Household, Electronics, Office
```

#### BACKEND Agent Tasks:
- [ ] Create `server/routes/categories.js`:
  - GET `/api/categories` - Return all categories
- [ ] Load categories from seed file or database

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Create categories endpoint for US-4.2.4.

Create server/routes/categories.js:
- GET /api/categories - return all categories with subcategories

Can load from seed file directly (no DB needed for static data).
```

---

### US-4.2.3: Add Tags
**Priority:** P1 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to add tags to items for organization.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/TagInput.js`:
  - Multi-select input
  - Autocomplete from existing tags
  - Create new tags on Enter
  - Remove tags with X
  - Lowercase normalization

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create tag input component for US-4.2.3.

Create client/js/components/TagInput.js:
- Input field that creates tags
- Press Enter or comma to add tag
- Click X to remove
- Autocomplete from existing user tags
- Convert to lowercase
- Max tag length: 30 chars

Integrate into ItemForm.
```

---

### US-4.3.1: Enter Purchase Info
**Priority:** P1 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to record purchase information.

#### FRONTEND Agent Tasks:
- [ ] Add purchase section to ItemForm:
  - Purchase price (currency input)
  - Purchase date (date picker)
  - Purchased from (text input)
  - Currency selector
- [ ] Show in ItemDetailPage

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add purchase info fields for US-4.3.1.

Add to ItemForm collapsible "Purchase Info" section:
- Price input with currency symbol
- Date picker (defaults to today)
- Vendor/store text input
- Currency dropdown (USD, EUR, GBP, etc.)

Display in ItemDetailPage value section.
```

---

### US-4.4.1: Set Item Quantity
**Priority:** P0 | **Complexity:** XS (1) | **Status:** ⬜ Not Started

**Story:** As a user, I want to set item quantities.

#### FRONTEND Agent Tasks:
- [ ] Add quantity input to ItemForm:
  - Number input with min 0
  - Unit dropdown (each, box, pack, lb, oz, gallon, etc.)
  - Default: 1 each
- [ ] Show quantity badge on ItemCard

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add quantity fields for US-4.4.1.

Add to ItemForm:
- Quantity number input (min: 0, default: 1)
- Unit dropdown with common units
- +/- buttons for quick adjust

Show quantity prominently on ItemCard.
```

---

### US-4.4.3: Adjust Quantity
**Priority:** P1 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to quickly adjust quantities.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/itemService.js`:
  - `adjustQuantity(userId, itemId, delta)` - Increment/decrement
- [ ] Add route: PATCH `/api/items/:id/quantity`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement quantity adjustment for US-4.4.3.

Add adjustQuantity(userId, itemId, delta) to itemService:
- delta can be positive or negative
- Ensure quantity doesn't go below 0

Add PATCH /api/items/:id/quantity route.
Body: { delta: number }
```

#### FRONTEND Agent Tasks:
- [ ] Add +/- buttons to ItemCard
- [ ] Inline quantity edit on ItemDetailPage
- [ ] Optimistic update with rollback

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add quick quantity adjust for US-4.4.3.

Add to ItemCard:
- Small +/- buttons
- Click to adjust by 1
- Update optimistically

Add to ItemDetailPage:
- Editable quantity field
- +/- buttons
- Save on blur
```

---

### US-4.5.1: Upload Item Image
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to upload images of items.

#### BACKEND Agent Tasks:
- [ ] Create `server/middleware/upload.js`:
  - Multer configuration
  - File type validation (jpeg, png, gif, webp)
  - Size limit (10MB)
- [ ] Create `server/services/imageService.js`:
  - `processImage(file)` - Resize, compress, create thumbnail
  - Uses Sharp.js
  - Returns { url, thumbnailUrl }
- [ ] Add to `server/controllers/itemController.js`:
  - `uploadImage(req, res)` - POST /api/items/:id/images
- [ ] Add route with multer middleware

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement image upload for US-4.5.1.

Create:
1. server/middleware/upload.js - Multer config
2. server/services/imageService.js - Sharp processing

processImage should:
- Resize to max 1024x1024 (maintain aspect)
- Create 200x200 thumbnail
- Convert to JPEG quality 85
- Save to uploads/ folder
- Return URLs

Add POST /api/items/:id/images route.
Accept multipart form data.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ImageUpload.js`:
  - Drag and drop zone
  - File picker button
  - Preview before upload
  - Progress indicator
  - Multiple file support
- [ ] Integrate into ItemForm
- [ ] Show thumbnails with remove option

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create image upload component for US-4.5.1.

Create client/js/components/ImageUpload.js:
- Drag & drop zone with visual feedback
- Click to browse
- Preview images before upload
- Upload progress bar
- Support multiple images
- Set primary image option
- Remove image button

Integrate into ItemForm.
```

---

### US-4.6.1: Add Alternate Names
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to add alternate names for better search.

#### FRONTEND Agent Tasks:
- [ ] Add alternate names input to ItemForm:
  - Multi-value input (like tags)
  - Suggestions from synonyms
  - Help text explaining purpose

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add alternate names field for US-4.6.1.

Add to ItemForm:
- "Also known as" multi-input field
- Reuse TagInput component pattern
- Help text: "Add other names to help find this item"
- Example: "Phillips screwdriver" → "crosshead screwdriver"

Search should include these alternate names.
```

---

## Milestone 2 Completion Checklist

- [ ] Item model created with all fields
- [ ] Item CRUD operations working
- [ ] Category system implemented
- [ ] Image upload and processing working
- [ ] Quantity management working
- [ ] Item search working
- [ ] `docs/interfaces/models.md` updated
- [ ] `docs/interfaces/api-endpoints.md` updated
- [ ] `docs/STATUS.md` shows all M2 stories complete
- [ ] Git commit: "Milestone 2 Complete: Items & Categories"
