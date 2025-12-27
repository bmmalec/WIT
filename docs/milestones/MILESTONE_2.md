# Milestone 2: Items & Categories
## WIT (Where Is It) Inventory System

**Duration:** Weeks 5-7
**Focus:** Item Management, Categories, Values, Images

---

## Milestone Overview

| Metric | Count |
|--------|-------|
| Total Stories | 20 |
| P0 (Critical) | 10 |
| P1 (High) | 7 |
| P2 (Medium) | 3 |

**Depends On:** Milestone 1 (Locations must exist)

---

## Epic 4: Item Management

### US-4.1.1: Create Item Manually
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | DATABASE → BACKEND → FRONTEND |

**Story:** As a user, I want to manually add items to track my inventory.

**Acceptance Criteria:**
- [ ] "Add Item" button in location view
- [ ] Form: name, description, category, quantity
- [ ] Optional: brand, model, size, tags
- [ ] Position within container
- [ ] Location item count updated

**Technical Notes:**
- DATABASE: Create Item model with full schema
- Include perishable sub-document (for M3)
- Include value sub-document

---

### US-4.1.2: View Item Details
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to view item details.

**Acceptance Criteria:**
- [ ] Click item to open detail view
- [ ] Shows all item fields
- [ ] Shows location path
- [ ] Shows creation/update dates
- [ ] Edit and delete buttons (with permission)

---

### US-4.1.3: Edit Item
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user with edit permission, I want to update item details.

**Acceptance Criteria:**
- [ ] Edit form pre-filled
- [ ] Can update all editable fields
- [ ] Update timestamp recorded

---

### US-4.1.4: Delete Item
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user with delete permission, I want to delete an item.

**Acceptance Criteria:**
- [ ] Delete button with confirmation
- [ ] Soft delete (mark inactive)
- [ ] Location count updated

---

### US-4.1.5: Move Item
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to move an item to a different location.

**Acceptance Criteria:**
- [ ] "Move" option in item menu
- [ ] Location tree picker
- [ ] Update item's locationId
- [ ] Update counts on old/new locations
- [ ] Add to locationHistory

---

### US-4.1.6: Duplicate Item
| Field | Value |
|-------|-------|
| Priority | P2 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to duplicate an item.

**Acceptance Criteria:**
- [ ] "Duplicate" option in menu
- [ ] Opens edit form with copied data
- [ ] New item created

---

### US-4.2.1: Assign Category
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to assign a category to items.

**Acceptance Criteria:**
- [ ] Category dropdown in item form
- [ ] Hierarchical category selection
- [ ] Subcategory based on parent
- [ ] Category filter in item lists

---

### US-4.2.2: Assign Item Type
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | XS (1) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to designate item types (tool, supply, part, consumable).

**Acceptance Criteria:**
- [ ] Item type field
- [ ] Options: Tool, Supply, Part, Consumable, Equipment
- [ ] Type affects available fields

---

### US-4.2.3: Add Tags
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to add tags to items.

**Acceptance Criteria:**
- [ ] Tag input (multi-select, autocomplete)
- [ ] Suggest existing tags
- [ ] Create new tags on the fly
- [ ] Filter by tags in search

---

### US-4.2.4: View Default Categories
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | DATABASE |

**Story:** As a user, I want pre-defined categories.

**Acceptance Criteria:**
- [ ] Categories seeded: Tools, Hardware, Plumbing, Electrical, Building Materials, Paint, Safety, Automotive, Garden, Food, Household, Electronics
- [ ] Each has subcategories
- [ ] Each has icon

---

### US-4.2.5: Create Custom Category
| Field | Value |
|-------|-------|
| Priority | P2 |
| Complexity | M (3) |
| Agent | DATABASE → BACKEND → FRONTEND |

**Story:** As a user, I want to create custom categories.

**Acceptance Criteria:**
- [ ] "Add Category" in settings
- [ ] Name, icon, color, parent
- [ ] Custom categories appear in selection
- [ ] Can edit/delete custom categories

---

### US-4.3.1: Enter Purchase Info
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to record purchase information.

**Acceptance Criteria:**
- [ ] Purchase price field
- [ ] Purchase date field
- [ ] Vendor/store field
- [ ] Currency selection

---

### US-4.3.2: Set Current Value
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | XS (1) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to set current value.

**Acceptance Criteria:**
- [ ] Current value field
- [ ] Defaults to purchase price
- [ ] Can update anytime

---

### US-4.4.1: Set Item Quantity
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | XS (1) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to set item quantities.

**Acceptance Criteria:**
- [ ] Quantity field (default 1)
- [ ] Unit selection (each, box, lb, oz)
- [ ] Quick increment/decrement
- [ ] Cannot be negative

---

### US-4.4.2: Set Minimum Quantity Alert
| Field | Value |
|-------|-------|
| Priority | P2 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to set minimum quantities for alerts.

**Acceptance Criteria:**
- [ ] Minimum quantity field
- [ ] Warning when at/below minimum
- [ ] Low stock items on dashboard

---

### US-4.4.3: Adjust Quantity
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to quickly adjust quantities.

**Acceptance Criteria:**
- [ ] +/- buttons on item card
- [ ] Quick quantity input
- [ ] Activity log entry

---

### US-4.4.4: Mark Item Consumed
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to mark consumables as used.

**Acceptance Criteria:**
- [ ] "Mark as Consumed" button
- [ ] Decrements quantity or marks inactive
- [ ] consumedAt timestamp
- [ ] Shows in consumed history

---

### US-4.5.1: Upload Item Image
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to upload images of items.

**Acceptance Criteria:**
- [ ] Image upload in item form
- [ ] Drag-drop or file picker
- [ ] Image preview
- [ ] Multiple images per item
- [ ] Mark one as primary
- [ ] Compression + thumbnail generation

---

### US-4.5.3: View Image Gallery
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | FRONTEND |

**Story:** As a user, I want to view all images for an item.

**Acceptance Criteria:**
- [ ] Gallery view on detail page
- [ ] Click to enlarge/lightbox
- [ ] Navigate between images
- [ ] Set primary image

---

### US-4.6.1: Add Alternate Names
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to add alternate names for search.

**Acceptance Criteria:**
- [ ] Alternate names field (multi-input)
- [ ] Search includes alternate names
- [ ] Remove alternate names easily

---

## Implementation Order

### Week 5: Basic Items
**DATABASE Agent:**
- US-4.1.1: Item model (full schema)
- US-4.2.4: Category model + seeds

**BACKEND Agent:**
- US-4.1.1-4: Item CRUD endpoints
- US-4.2.1: Category assignment
- US-4.4.1: Quantity handling

**FRONTEND Agent:**
- ItemForm component
- ItemCard component
- ItemDetail page
- CategoryPicker component

### Week 6: Values & Images
**BACKEND Agent:**
- US-4.3.1-2: Value tracking
- US-4.5.1: Image upload (Sharp.js)

**FRONTEND Agent:**
- US-4.3.1-2: Value fields
- US-4.5.1: ImageUpload component
- US-4.5.3: Gallery component

### Week 7: Advanced Features
**BACKEND Agent:**
- US-4.1.5: Move item
- US-4.4.2-4: Quantity features
- US-4.6.1: Alternate names

**FRONTEND Agent:**
- US-4.1.5: LocationPicker for move
- US-4.4.3: Quick quantity adjust
- US-4.2.3: Tag input component

---

## Milestone Exit Criteria

- [ ] Items can be created with full details
- [ ] Items organized by category
- [ ] Images upload and display correctly
- [ ] Items can be moved between locations
- [ ] Quantity tracking works
- [ ] Value tracking works
- [ ] All P0 stories complete
