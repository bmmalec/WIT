# Milestone 3: AI, Search & Food Tracking
## WIT (Where Is It) Inventory System

**Duration:** Weeks 8-13
**Focus:** AI Image Recognition, UPC Scanning, Smart Search, Expiration System

---

## Milestone Overview

| Metric | Count |
|--------|-------|
| Total Stories | 38 |
| P0 (Critical) | 18 |
| P1 (High) | 14 |
| P2 (Medium) | 4 |
| P3 (Low) | 2 |

**Depends On:** Milestone 2 (Items must exist)

---

## Epic 5: AI Image Recognition

### US-5.1.1: Access Device Camera
| Priority | P0 | Complexity | M (3) |
**Story:** Access camera for scanning items.
**Criteria:**
- [ ] Camera permission request
- [ ] Works with front/back camera (mobile) and webcam (desktop)
- [ ] Clear permission denied message

---

### US-5.1.2: Capture Single Item
| Priority | P0 | Complexity | S (2) |
**Story:** Capture a photo of an item for identification.
**Criteria:**
- [ ] Capture button in camera view
- [ ] Preview after capture
- [ ] Retake option

---

### US-5.1.3: Capture Multiple Items
| Priority | P1 | Complexity | M (3) |
**Story:** Photograph 5-10 items at once.
**Criteria:**
- [ ] "Multi-item" mode
- [ ] AI detects each item separately
- [ ] Grid view with each identified item

---

### US-5.2.1: Single Item Identification
| Priority | P0 | Complexity | L (5) |
**Story:** AI identifies item from photo.
**Criteria:**
- [ ] Send to Claude Vision API
- [ ] Receive identification with confidence
- [ ] Show category suggestion
- [ ] Processing time < 3 seconds

**Technical Notes:**
```javascript
// Claude Vision API call structure
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } },
      { type: 'text', text: IDENTIFICATION_PROMPT }
    ]
  }]
});
```

---

### US-5.2.2: Top N Guesses Display
| Priority | P0 | Complexity | S (2) |
**Story:** Show top 3-5 identification guesses.
**Criteria:**
- [ ] Display guesses with confidence scores
- [ ] User can select correct guess
- [ ] "None of these" for manual entry

---

### US-5.2.3: Multi-Item Detection
| Priority | P1 | Complexity | L (5) |
**Story:** Detect multiple items in one photo.
**Criteria:**
- [ ] AI returns array of items
- [ ] Each with name, category, count, confidence
- [ ] User confirms/edits each

---

### US-5.2.4: Quantity Estimation
| Priority | P1 | Complexity | M (3) |
**Story:** AI estimates quantity for identical items.
**Criteria:**
- [ ] Shows "Estimated: 5 items"
- [ ] User can adjust

---

### US-5.2.6: Value Estimation
| Priority | P2 | Complexity | M (3) |
**Story:** AI estimates item value.
**Criteria:**
- [ ] Returns value range ($50-100)
- [ ] User can accept or override

---

### US-5.3.1: Confirm Identification
| Priority | P0 | Complexity | S (2) |
**Story:** Confirm or edit AI identification.
**Criteria:**
- [ ] All fields editable
- [ ] Must select location before saving

---

### US-5.3.2: Select Storage Location
| Priority | P0 | Complexity | S (2) |
**Story:** Select where to store scanned item.
**Criteria:**
- [ ] Location tree picker
- [ ] Recently used locations
- [ ] Position within location

---

### US-5.3.3: Quick Scan Loop
| Priority | P1 | Complexity | M (3) |
**Story:** Continuously scan multiple items.
**Criteria:**
- [ ] "Scan Another" after saving
- [ ] Camera stays active
- [ ] Counter shows items scanned

---

## Epic 6: UPC & Barcode Scanning

### US-6.1.1: Scan UPC Barcode
| Priority | P0 | Complexity | M (3) |
**Story:** Scan product barcodes.
**Criteria:**
- [ ] "Scan Barcode" mode
- [ ] Detects UPC, EAN, Code128
- [ ] Auto-capture on detection

**Tech:** QuaggaJS for web barcode detection

---

### US-6.1.2: UPC Database Lookup
| Priority | P0 | Complexity | M (3) |
**Story:** Lookup product details by UPC.
**Criteria:**
- [ ] Query Open Food Facts API
- [ ] Retrieve name, brand, description, image
- [ ] For food: nutrition, allergens
- [ ] Cache results locally

---

### US-6.1.3: Manual UPC Entry
| Priority | P2 | Complexity | S (2) |
**Story:** Manually enter UPC when scanning fails.
**Criteria:**
- [ ] UPC input field
- [ ] Triggers lookup on complete

---

### US-6.1.4: UPC Not Found Handling
| Priority | P1 | Complexity | S (2) |
**Story:** Handle when UPC isn't in database.
**Criteria:**
- [ ] "Not found" message
- [ ] Option to use AI identification
- [ ] Option for manual entry

---

## Epic 7: Food & Expiration System

### US-7.1.1: Enter Printed Expiration Date
| Priority | P0 | Complexity | S (2) |
**Story:** Enter expiration date from package.
**Criteria:**
- [ ] Date picker for perishable items
- [ ] Shows days until expiration

---

### US-7.1.2: Enter Extended Expiration Date
| Priority | P1 | Complexity | S (2) |
**Story:** Enter when user is comfortable using item.
**Criteria:**
- [ ] Secondary date field
- [ ] Used for personal tracking

---

### US-7.2.1: Configure Expiration Period
| Priority | P0 | Complexity | M (3) |
**Story:** Set expiration period type (monthly, quarterly).
**Criteria:**
- [ ] Period selection in settings
- [ ] Options: Monthly, Quarterly, Semi-Annual, Annual
- [ ] Start date selection
- [ ] Preview showing date ranges

---

### US-7.2.2: Configure Color Scheme
| Priority | P0 | Complexity | M (3) |
**Story:** Set colors for each period.
**Criteria:**
- [ ] 6-color scheme configuration
- [ ] Color picker for each period
- [ ] Color name field
- [ ] Preview of sequence

---

### US-7.2.3: View Current Period
| Priority | P0 | Complexity | S (2) |
**Story:** See current period and color.
**Criteria:**
- [ ] Dashboard widget: "Current: Q4 2024 - Orange"
- [ ] Previous periods marked "EXPIRED"

---

### US-7.2.4: View Color Schedule
| Priority | P0 | Complexity | S (2) |
**Story:** View full color schedule.
**Criteria:**
- [ ] Table: Period, Date Range, Color, Status
- [ ] Printable format option

---

### US-7.2.5: Assign Expiration Color to Item
| Priority | P0 | Complexity | M (3) |
**Story:** Select period when storing item.
**Criteria:**
- [ ] Color period selector
- [ ] "Apply [Color] sticker" instruction
- [ ] Quick selection for common periods

---

### US-7.2.6: View Items by Expiration Color
| Priority | P0 | Complexity | S (2) |
**Story:** Filter items by expiration color.
**Criteria:**
- [ ] Filter: All, Expired, Current, Fresh
- [ ] Filter by specific color
- [ ] Count per status

---

### US-7.3.1: Expiration Overview Widget
| Priority | P0 | Complexity | M (3) |
**Story:** Dashboard widget showing expiration status.
**Criteria:**
- [ ] Expired count, Expiring Soon, Fresh
- [ ] Color-coded sections
- [ ] Click to drill down

---

### US-7.3.2: Expired Items List
| Priority | P0 | Complexity | S (2) |
**Story:** View all expired items.
**Criteria:**
- [ ] List with name, location, how long expired
- [ ] Quick actions: Consume, Discard

---

### US-7.3.3: Expiring Soon List
| Priority | P0 | Complexity | S (2) |
**Story:** View items expiring in current period.
**Criteria:**
- [ ] Sorted by urgency
- [ ] "Use first" recommendations

---

### US-7.4.1: Storage Type (Pantry/Fridge/Freezer)
| Priority | P1 | Complexity | XS (1) |
**Story:** Specify food storage type.
**Criteria:**
- [ ] Options: Pantry, Refrigerated, Frozen
- [ ] Filter by storage type

---

### US-7.4.4: Color-Blind Accessibility
| Priority | P2 | Complexity | M (3) |
**Story:** Patterns for color-blind users.
**Criteria:**
- [ ] Enable patterns option
- [ ] Pattern options: Solid, Striped, Dotted, Checkered

---

## Epic 8: Smart Search

### US-8.1.1: Search by Item Name
| Priority | P0 | Complexity | M (3) |
**Story:** Search items by name.
**Criteria:**
- [ ] Search box with debounce
- [ ] Searches primary and alternate names
- [ ] Case-insensitive

---

### US-8.1.2: Full-Text Search
| Priority | P0 | Complexity | M (3) |
**Story:** Search across all text fields.
**Criteria:**
- [ ] MongoDB text index
- [ ] Relevance-based ranking
- [ ] Results < 500ms

---

### US-8.1.3-5: Filters
| Priority | P0-P1 | Complexity | S (2) each |
**Story:** Filter by location, category, expiration status.
**Criteria:**
- [ ] Location filter
- [ ] Category filter
- [ ] Expiration status filter
- [ ] Filters combine

---

### US-8.2.1: Typo Tolerance
| Priority | P0 | Complexity | M (3) |
**Story:** Search with typo tolerance.
**Criteria:**
- [ ] Fuzzy matching (Levenshtein distance 1-2)
- [ ] "wrech" finds "wrench"

---

### US-8.2.2: "Did You Mean?" Suggestions
| Priority | P1 | Complexity | M (3) |
**Story:** Suggest corrections when few results.
**Criteria:**
- [ ] "Did you mean: bearing extractor?"
- [ ] Click to search suggestion

---

### US-8.3.1: Synonym Expansion
| Priority | P0 | Complexity | M (3) |
**Story:** Search includes synonyms.
**Criteria:**
- [ ] "pulley puller" finds "bearing extractor"
- [ ] Bidirectional matching

---

### US-8.3.2: System Synonyms
| Priority | P0 | Complexity | S (2) |
**Story:** Built-in synonyms for common tools.
**Criteria:**
- [ ] 100+ pre-defined synonym groups
- [ ] Seeded on initialization

---

### US-8.4.1: Search Autocomplete
| Priority | P1 | Complexity | M (3) |
**Story:** Autocomplete suggestions while typing.
**Criteria:**
- [ ] Suggestions after 2 characters
- [ ] Keyboard navigation
- [ ] Max 10 suggestions

---

### US-8.4.4: Cross-Location Search
| Priority | P0 | Complexity | S (2) |
**Story:** Search across all accessible locations.
**Criteria:**
- [ ] Includes owned and shared locations
- [ ] Respects permissions
- [ ] Shows location path in results

---

## Milestone Exit Criteria

- [ ] Camera capture works on web/mobile
- [ ] AI identifies items with 80%+ accuracy
- [ ] UPC scanning works for food products
- [ ] Color-coded expiration system complete
- [ ] Smart search finds items with wrong names
- [ ] Synonym expansion working
- [ ] All P0 stories complete
