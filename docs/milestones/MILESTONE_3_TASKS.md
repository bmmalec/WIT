# Milestone 3: AI, Search & Food Tracking
## WIT (Where Is It) - User Stories with Agent Tasks

**Duration:** Weeks 8-13
**Stories:** 38 total
**Depends On:** Milestone 2

---

## Epic 5: AI Image Recognition

### US-5.1.1: Access Device Camera
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to access my camera to photograph items.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/CameraCapture.js`:
  - Request camera permission
  - Handle permission denied gracefully
  - Support front/back camera switch (mobile)
  - Video stream display
  - Capture button
  - Preview captured image
  - Retake option
- [ ] Create `client/js/utils/camera.js`:
  - `requestCameraAccess()` - Returns stream or throws
  - `captureFrame(video)` - Returns blob
  - `stopStream(stream)` - Cleanup

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create camera capture component for US-5.1.1.

Create:
1. client/js/components/CameraCapture.js
2. client/js/utils/camera.js

CameraCapture component:
- Request camera with getUserMedia
- Show permission error message if denied
- Display video stream
- Camera switch button (mobile)
- Large capture button
- After capture: show preview with Retake/Use buttons

Emit 'capture' event with image blob.
```

---

### US-5.2.1: Single Item Identification
**Priority:** P0 | **Complexity:** L (5) | **Status:** ⬜ Not Started

**Story:** As a user, I want AI to identify an item from my photo.

#### BACKEND Agent Tasks:
- [ ] Create `server/config/claude.js`:
  - Anthropic client initialization
  - API key from environment
- [ ] Create `server/services/aiService.js`:
  - `identifyItem(imageBase64)` - Send to Claude Vision
  - Returns: { guesses: [{ name, confidence, category, description }], estimatedQuantity, estimatedValue, condition }
- [ ] Create `server/controllers/identifyController.js`:
  - `identifyImage(req, res)` - POST /api/identify/image
- [ ] Create `server/routes/identify.js`
- [ ] Create prompt template for item identification

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md

Task: Implement AI item identification for US-5.2.1.

Create:
1. server/config/claude.js - Anthropic client setup
2. server/services/aiService.js - identifyItem method
3. server/controllers/identifyController.js
4. server/routes/identify.js

aiService.identifyItem(imageBase64):
- Call Claude Vision API (claude-sonnet-4-20250514)
- Use structured prompt requesting JSON response
- Parse response into: guesses[], quantity, value range, condition

Prompt should ask for:
- Top 5 item guesses with confidence (0-1)
- Category for each guess
- Estimated quantity if multiple
- Condition assessment
- Value estimate range

Return structured JSON.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/IdentificationResult.js`:
  - Show loading spinner during API call
  - Display top guesses as selectable cards
  - Confidence percentage for each
  - Category tags
  - "None of these" option
- [ ] Create `client/js/pages/ScanPage.js`:
  - Camera capture
  - Send to API
  - Show results
  - Flow to item creation

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create identification UI for US-5.2.1.

Create:
1. client/js/components/IdentificationResult.js
2. client/js/pages/ScanPage.js

IdentificationResult:
- Show captured image thumbnail
- List of guesses as clickable cards
- Each shows: name, confidence bar, category
- Highlight on select
- "None of these - enter manually" option

ScanPage flow:
1. Show CameraCapture
2. On capture: show loading, call POST /api/identify/image
3. Show IdentificationResult
4. On select: proceed to item form pre-filled
```

---

### US-5.2.2: Top N Guesses Display
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to see multiple identification guesses.

#### FRONTEND Agent Tasks:
- [ ] Enhance IdentificationResult:
  - Show 5 guesses max
  - Confidence as percentage and bar
  - Sort by confidence
  - Visual indication of "best guess"

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Enhance guess display for US-5.2.2.

Update IdentificationResult:
- Show up to 5 guesses
- First guess highlighted as "Best Match"
- Confidence shown as "87% confident"
- Progress bar visualization
- Sort by confidence descending
```

---

### US-5.3.1: Confirm Identification
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to confirm or edit the AI identification.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ConfirmItemForm.js`:
  - Pre-filled from AI guess
  - All fields editable
  - AI values shown as suggestions
  - Required: name, location
- [ ] Show captured image

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create confirmation form for US-5.3.1.

Create client/js/components/ConfirmItemForm.js:
- Pre-fill from selected AI guess
- Name field (editable, pre-filled)
- Category (editable, pre-filled)
- Quantity (from AI estimate)
- Condition (from AI)
- Show "AI suggested" labels
- All fields editable
- Location picker (required)
- Save button

Show captured image as reference.
```

---

### US-5.3.2: Select Storage Location
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to select where to store the scanned item.

#### FRONTEND Agent Tasks:
- [ ] Integrate LocationTree picker into ConfirmItemForm
- [ ] Add "Recent Locations" quick select
- [ ] Store last used location in localStorage
- [ ] Position within container (optional)

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add location selection for US-5.3.2.

Update ConfirmItemForm:
- Add LocationTree picker
- Show "Recent Locations" (last 5 used) for quick select
- Remember last location in localStorage
- Required field validation
- Optional: position within location
```

---

## Epic 6: UPC & Barcode Scanning

### US-6.1.1: Scan UPC Barcode
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to scan product barcodes.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/BarcodeScanner.js`:
  - Integrate QuaggaJS library
  - Configure for UPC, EAN, Code128
  - Real-time scanning
  - Visual feedback (scanning box)
  - Audio beep on detection
  - Return detected code
- [ ] Add to ScanPage as alternate mode

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create barcode scanner for US-6.1.1.

Create client/js/components/BarcodeScanner.js:
- Use QuaggaJS library
- Configure readers: upc_reader, ean_reader, code_128_reader
- Show camera with scanning overlay
- Highlight detected barcode area
- Play beep sound on successful scan
- Emit 'detected' event with code

Add barcode mode toggle to ScanPage.
```

---

### US-6.1.2: UPC Database Lookup
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to lookup product details by UPC.

#### DATABASE Agent Tasks:
- [ ] Create `server/models/UpcCache.js`:
  - `upc` - String, required, unique, indexed
  - `name` - String
  - `brand` - String
  - `description` - String
  - `category` - String
  - `imageUrl` - String
  - `nutrition` - Object (for food)
  - `ingredients` - String
  - `allergens` - [String]
  - `source` - String (which API)
  - `fetchedAt` - Date
  - `timestamps` - true

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create UPC cache model for US-6.1.2.

Create server/models/UpcCache.js to cache UPC lookups.
Include fields for food products: nutrition, ingredients, allergens.
TTL: 30 days (can be refreshed).
```

#### BACKEND Agent Tasks:
- [ ] Create `server/services/upcService.js`:
  - `lookup(upc)` - Check cache, then API
  - Query Open Food Facts API
  - Cache results
  - Return product data or null
- [ ] Add to identifyController:
  - `lookupUpc(req, res)` - POST /api/identify/upc

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement UPC lookup for US-6.1.2.

Create server/services/upcService.js:

lookup(upc):
1. Check UpcCache for existing entry (< 30 days old)
2. If found, return cached data
3. If not, query Open Food Facts API:
   https://world.openfoodfacts.org/api/v0/product/{upc}.json
4. Parse response: name, brand, image, category, nutrition
5. Cache result
6. Return data

Add POST /api/identify/upc route.
Handle "not found" gracefully.
```

#### FRONTEND Agent Tasks:
- [ ] On barcode detect:
  - Call UPC lookup API
  - Show loading
  - Display product info if found
  - Show "Not found" with options if not

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Handle UPC lookup results for US-6.1.2.

After barcode detected:
1. Call POST /api/identify/upc
2. Show loading spinner
3. If found: display product card with image, name, brand
4. If not found: show message with options:
   - "Try AI identification"
   - "Enter manually"
5. On confirm: proceed to ConfirmItemForm
```

---

## Epic 7: Food & Expiration System

### US-7.1.1: Enter Printed Expiration Date
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to enter the expiration date from a package.

#### FRONTEND Agent Tasks:
- [ ] Add expiration section to ItemForm (for perishable items):
  - "This is perishable" toggle
  - Printed expiration date picker
  - Days until expiration display
- [ ] Conditionally show for food categories

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add expiration date input for US-7.1.1.

Update ItemForm:
- Add "Perishable item" toggle
- When enabled, show:
  - Expiration date picker
  - Calculate and show "X days from now"
  - Storage type dropdown (Pantry/Fridge/Freezer)

Show by default for Food category.
```

---

### US-7.2.1: Configure Expiration Period
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to set my expiration period type (monthly, quarterly).

#### DATABASE Agent Tasks:
- [ ] Create `server/models/ExpirationSchedule.js`:
  - `userId` - ObjectId, required, unique
  - `periodType` - enum: ['monthly', 'quarterly', 'semi_annual', 'annual']
  - `startDate` - Date (when period 1 starts)
  - `colors` - Array of 6: [{ period, color, colorName, startDate, endDate }]
  - `timestamps` - true
- [ ] Add instance method: `getCurrentPeriod()` - Returns current period info
- [ ] Add instance method: `getPeriodForDate(date)` - Returns period for any date

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create ExpirationSchedule model for US-7.2.1.

Create server/models/ExpirationSchedule.js:
- One schedule per user
- periodType determines period length
- colors array holds 6 periods (rolling)
- startDate is when period 1 begins

Methods:
- getCurrentPeriod() - based on today's date
- getPeriodForDate(date) - for any date
- generateSchedule() - populate colors array based on periodType and startDate
```

#### BACKEND Agent Tasks:
- [ ] Create `server/services/expirationService.js`:
  - `getSchedule(userId)` - Get or create schedule
  - `updateSchedule(userId, settings)` - Update period type, start date
  - `calculatePeriods(periodType, startDate)` - Generate 6 periods
- [ ] Create `server/controllers/expirationController.js`
- [ ] Create `server/routes/expiration.js`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement expiration schedule for US-7.2.1.

Create:
1. server/services/expirationService.js
2. server/controllers/expirationController.js
3. server/routes/expiration.js

getSchedule: return user's schedule, create default if none
updateSchedule: update periodType/startDate, regenerate periods

Period calculation:
- Monthly: each month is a period
- Quarterly: 3 months per period
- Semi-annual: 6 months per period
- Annual: 12 months per period

Generate 6 periods starting from startDate.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/pages/ExpirationSettingsPage.js`:
  - Period type dropdown
  - Start date picker
  - Preview of generated schedule
  - Save button

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create expiration settings page for US-7.2.1.

Create client/js/pages/ExpirationSettingsPage.js:
- Period type selector: Monthly, Quarterly, Semi-Annual, Annual
- Start date picker
- Preview table showing next 6 periods with dates
- Save button

Show in Settings section.
```

---

### US-7.2.2: Configure Color Scheme
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to set colors for each expiration period.

#### FRONTEND Agent Tasks:
- [ ] Enhance ExpirationSettingsPage:
  - Color picker for each of 6 periods
  - Color name input (e.g., "Blue", "Red")
  - Preview of color sequence
  - Default colors: Blue, Green, Yellow, Orange, Red, Purple
- [ ] Create `client/js/components/ColorPicker.js`

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add color configuration for US-7.2.2.

Update ExpirationSettingsPage:
- List of 6 periods with color pickers
- Each row: Period number, date range, color picker, color name input
- Default colors: #3B82F6, #22C55E, #EAB308, #F97316, #EF4444, #A855F7
- Show visual preview strip of all colors

Create simple ColorPicker component or use native input[type=color].
```

---

### US-7.2.5: Assign Expiration Color to Item
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to select an expiration period when storing food.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ExpirationColorPicker.js`:
  - Show current period highlighted
  - 6 color swatches
  - Click to select
  - Show "Apply [Color] sticker" instruction
  - Quick buttons: "Current", "Next", "In 2 periods"

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create expiration color picker for US-7.2.5.

Create client/js/components/ExpirationColorPicker.js:
- Fetch user's color schedule
- Display 6 color swatches in a row
- Current period highlighted with ring
- Past periods grayed/disabled
- On select: show period date range
- Display: "Apply [COLOR] sticker to this item"

Integrate into ItemForm for perishable items.
```

---

### US-7.3.1: Expiration Overview Widget
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want a dashboard widget showing expiration status.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/itemService.js`:
  - `getExpirationSummary(userId)` - Count by status
- [ ] Add route: GET `/api/items/expiration-summary`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement expiration summary for US-7.3.1.

Add getExpirationSummary(userId) to itemService:
- Query perishable items
- Count by status:
  - expired: printedExpirationDate < today
  - expiringSoon: within current period
  - fresh: beyond current period
- Return counts and item IDs

Add GET /api/items/expiration-summary route.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ExpirationWidget.js`:
  - Three sections: Expired, Expiring Soon, Fresh
  - Count badges with colors (red, yellow, green)
  - Click to drill down to list
  - Current period indicator

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create expiration widget for US-7.3.1.

Create client/js/components/ExpirationWidget.js:
- Header: "Food Expiration Status"
- Three boxes:
  - Red: "X Expired" (click to view)
  - Yellow: "X Expiring Soon"
  - Green: "X Fresh"
- Current period display
- Add to DashboardPage

Clicking a section filters the items list.
```

---

## Epic 8: Smart Search

### US-8.1.1: Search by Item Name
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to search items by name.

#### BACKEND Agent Tasks:
- [ ] Enhance `server/services/itemService.js`:
  - `search(userId, query, options)` - Full search implementation
  - Use MongoDB text index
  - Include accessible locations (owned + shared)
  - Support pagination, sorting, filters
- [ ] Add route: GET `/api/search`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement item search for US-8.1.1.

Enhance itemService.search(userId, query, options):
1. Get all accessible locationIds (owned + shared)
2. Build query:
   - $text: { $search: query }
   - locationId: { $in: accessibleLocations }
   - isActive: true
3. Apply filters from options (location, category, tags)
4. Sort by relevance (textScore) or specified field
5. Paginate

Add GET /api/search route.
Query params: q, location, category, page, limit, sort
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/SearchBar.js`:
  - Search input with debounce (300ms)
  - Search icon
  - Clear button
  - Submit on enter
- [ ] Create `client/js/pages/SearchPage.js`:
  - Search bar at top
  - Results grid
  - No results state

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create search UI for US-8.1.1.

Create:
1. client/js/components/SearchBar.js
2. client/js/pages/SearchPage.js

SearchBar:
- Input with search icon
- Debounce 300ms
- Clear (X) button
- Emit search event

SearchPage:
- SearchBar prominent at top
- Results as ItemCards grid
- "No results" state with suggestions
- Loading state
```

---

### US-8.1.3: Filter by Location
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to filter search results by location.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/SearchFilters.js`:
  - Location dropdown/tree
  - Category dropdown
  - Include children toggle
- [ ] Add filter sidebar to SearchPage

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add search filters for US-8.1.3.

Create client/js/components/SearchFilters.js:
- Location filter (tree dropdown)
- "Include sub-locations" checkbox
- Category filter
- Clear filters button

Add as sidebar or collapsible panel on SearchPage.
Update search query when filters change.
```

---

### US-8.2.1: Typo Tolerance
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want search to find items even with typos.

#### BACKEND Agent Tasks:
- [ ] Create `server/utils/fuzzyMatch.js`:
  - `levenshteinDistance(a, b)` - Calculate distance
  - `fuzzySearch(query, candidates, maxDistance)` - Find matches
- [ ] Enhance search to include fuzzy matches for primary names

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement fuzzy matching for US-8.2.1.

Create server/utils/fuzzyMatch.js:
- levenshteinDistance(str1, str2) - returns edit distance
- fuzzySearch(query, items, options) - finds items within distance

Enhance search:
1. First, do exact text search
2. If few results (< 5), also do fuzzy match on primaryName
3. Distance tolerance: 1 for short words, 2 for longer
4. Merge results, remove duplicates
```

---

### US-8.3.1: Synonym Expansion
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want search to find items by synonyms.

#### DATABASE Agent Tasks:
- [ ] Create `server/models/Synonym.js`:
  - `canonicalName` - String, required, indexed
  - `synonyms` - [String], indexed
  - `category` - String (optional, for context)
  - `isSystem` - Boolean, default: true

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create Synonym model for US-8.3.1.

Create server/models/Synonym.js:
- canonicalName: the "official" term
- synonyms: array of alternative names
- bidirectional search (any term finds all related)

Example: 
{ canonicalName: "wrench", synonyms: ["spanner", "adjustable wrench"] }
```

#### BACKEND Agent Tasks:
- [ ] Create `server/services/synonymService.js`:
  - `expandQuery(term)` - Returns array of synonyms
  - `getAllSynonyms(term)` - Finds all related terms
- [ ] Integrate into search service

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement synonym expansion for US-8.3.1.

Create server/services/synonymService.js:
- expandQuery(term): find Synonym doc where term matches canonicalName or is in synonyms array, return all related terms
- Example: expandQuery("spanner") returns ["spanner", "wrench", "adjustable wrench"]

Integrate into search:
1. Expand search query to include synonyms
2. Include all terms in text search
```

---

### US-8.3.2: System Synonyms
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want built-in synonyms for common items.

#### DATABASE Agent Tasks:
- [ ] Create `server/seeds/synonyms.js`:
  - 100+ synonym groups
  - Tools: wrench/spanner, pliers/grips, screwdriver/driver
  - Hardware: bolt/screw, nail/brad, nut/fastener
  - Materials: lumber/wood/timber, drywall/sheetrock/gypsum
  - Food: soda/pop/cola, chips/crisps

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create synonyms seed data for US-8.3.2.

Create server/seeds/synonyms.js with 100+ entries:

Tools:
- wrench, spanner, adjustable wrench
- pliers, grips, needle-nose
- screwdriver, driver, Phillips, flathead
- hammer, mallet, sledge
- saw, handsaw, hacksaw
- drill, driver, impact driver
- level, spirit level
- tape measure, measuring tape

Hardware:
- screw, bolt, fastener
- nail, brad, tack
- nut, lock nut
- washer, spacer
- bracket, brace, angle

Continue for: Plumbing, Electrical, Paint, Automotive, Food, Garden
```

---

## Milestone 3 Completion Checklist

- [ ] Camera capture working
- [ ] AI identification returning results
- [ ] UPC scanning and lookup working
- [ ] Expiration color system complete
- [ ] Search with filters working
- [ ] Synonym expansion working
- [ ] Fuzzy matching working
- [ ] All interfaces updated
- [ ] Git commit: "Milestone 3 Complete: AI, Search & Food Tracking"
