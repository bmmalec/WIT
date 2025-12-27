# Milestone 4: Bulk Import & Projects
## WIT (Where Is It) - User Stories with Agent Tasks

**Duration:** Weeks 14-18
**Stories:** 22 total
**Depends On:** Milestone 3

---

## Epic 9: Bulk Import System

### US-9.1.1: Start Bulk Session
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to start a bulk import session.

#### DATABASE Agent Tasks:
- [ ] Create `server/models/BulkSession.js`:
  - `userId` - ObjectId, required, indexed
  - `status` - enum: ['active', 'paused', 'completed', 'cancelled']
  - `currentLocationId` - ObjectId, ref: 'Location'
  - `defaultCategory` - String
  - `items` - Array of pending items:
    - `tempId` - String (for frontend tracking)
    - `imageUrl` - String
    - `name` - String
    - `category` - String
    - `quantity` - Number
    - `locationId` - ObjectId
    - `status` - enum: ['pending', 'confirmed', 'rejected']
    - `aiGuesses` - Array
    - `upcData` - Object
  - `stats.scanned` - Number
  - `stats.confirmed` - Number
  - `stats.rejected` - Number
  - `startedAt` - Date
  - `completedAt` - Date
  - `timestamps` - true

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create BulkSession model for US-9.1.1.

Create server/models/BulkSession.js for tracking bulk import sessions.
Items array holds pending items before commit.
Track stats: scanned, confirmed, rejected counts.
Session can be paused and resumed.
Expire sessions after 7 days of inactivity.
```

#### BACKEND Agent Tasks:
- [ ] Create `server/services/bulkService.js`:
  - `createSession(userId, locationId, defaultCategory)` - Start session
  - `getActiveSession(userId)` - Get current active session
  - `updateSession(sessionId, updates)` - Update target location
- [ ] Create `server/controllers/bulkController.js`
- [ ] Create `server/routes/bulk.js`:
  - POST `/api/bulk/sessions` - Create session
  - GET `/api/bulk/sessions/active` - Get active session
  - PUT `/api/bulk/sessions/:id` - Update session

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement bulk session management for US-9.1.1.

Create:
1. server/services/bulkService.js
2. server/controllers/bulkController.js  
3. server/routes/bulk.js

createSession: 
- Only one active session per user
- If existing active, return it
- Set currentLocationId and optional defaultCategory

Routes:
- POST /api/bulk/sessions - create/get session
- GET /api/bulk/sessions/active - get active
- PUT /api/bulk/sessions/:id - update location/category
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/pages/BulkImportPage.js`:
  - "Start Bulk Import" flow
  - Location selector for target
  - Optional default category
  - Begin scanning button
- [ ] Create `client/js/components/BulkSessionBar.js`:
  - Persistent bar showing active session
  - Current location display
  - Item count
  - End session button

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create bulk import start UI for US-9.1.1.

Create:
1. client/js/pages/BulkImportPage.js
2. client/js/components/BulkSessionBar.js

BulkImportPage:
- Step 1: Select target location
- Step 2: Optional default category
- Step 3: Start scanning button

BulkSessionBar (sticky):
- Shows "Working on: [Location Name]"
- Item count: "15 items scanned"
- Change location button
- End session button
```

---

### US-9.1.2: Set Target Location ("Working on Bin X")
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to set which container I'm working on.

#### FRONTEND Agent Tasks:
- [ ] Prominent location display in BulkSessionBar
- [ ] All scans auto-assigned to current location
- [ ] Visual confirmation of target

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Implement target location display for US-9.1.2.

Update BulkSessionBar:
- Large, prominent "Working on: [Location]" display
- Location icon
- Breadcrumb path shown
- All scanned items auto-assigned here
- Visual indicator (colored border matching location)
```

---

### US-9.1.3: Change Target Location
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to change bins during a session.

#### FRONTEND Agent Tasks:
- [ ] "Change" button on BulkSessionBar
- [ ] Location picker modal
- [ ] Update session on server
- [ ] Previously scanned items keep their original location

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add location change for US-9.1.3.

Add to BulkSessionBar:
- "Change" button next to location
- Opens LocationTree picker
- On select: update session, show confirmation
- Note: previous items keep their location
```

---

### US-9.2.1: Rapid-Fire Scanning
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to quickly scan items in sequence.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/bulkService.js`:
  - `addItem(sessionId, itemData)` - Add pending item to session
  - Item includes: imageUrl, name, category, aiGuesses, quantity
- [ ] Add route: POST `/api/bulk/sessions/:id/items`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement bulk item addition for US-9.2.1.

Add addItem(sessionId, itemData) to bulkService:
- Add to session.items array
- Set status: 'pending'
- Assign current locationId
- Increment stats.scanned
- Return updated session

Add POST /api/bulk/sessions/:id/items route.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/RapidScanView.js`:
  - Camera stays active
  - Capture → identify → quick confirm loop
  - Auto-advance after confirm
  - Running counter
  - Sound effects for success
  - Minimal UI during scanning

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create rapid-fire scanning for US-9.2.1.

Create client/js/components/RapidScanView.js:
- Full-screen camera
- Large capture button
- After capture:
  1. Show quick preview
  2. Call AI identification
  3. Show top guess with Accept/Edit
  4. On accept: add to session, camera ready
- Running counter: "12 items scanned"
- Sound: beep on success
- Minimal UI - focus on speed
```

---

### US-9.2.3: Quantity Input During Bulk
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to set quantity when scanning.

#### FRONTEND Agent Tasks:
- [ ] Add quantity input to quick confirm
- [ ] Default from AI estimate
- [ ] +/- buttons for fast adjustment
- [ ] Skip with quantity = 1

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add quantity to bulk scanning for US-9.2.3.

Update RapidScanView quick confirm:
- Show quantity input (default from AI or 1)
- Large +/- buttons
- Number input for direct entry
- "1" is default, just tap confirm to skip
```

---

### US-9.3.1: Review Pending Items
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to review all scanned items before saving.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/bulkService.js`:
  - `getSession(sessionId)` - Full session with items
- [ ] Items should include all pending data

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement session retrieval for US-9.3.1.

Add getSession(sessionId) to bulkService:
- Return full session with items array
- Include all item data for review
- Group by status if helpful
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/BulkReviewList.js`:
  - List all pending items
  - Image thumbnail, name, quantity, location
  - Status indicator (pending/confirmed/rejected)
  - Filter by status
  - Edit button per item
  - Reject button per item

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create bulk review list for US-9.3.1.

Create client/js/components/BulkReviewList.js:
- Grid/list of all session items
- Each item shows: thumbnail, name, qty, location
- Status badge (pending/confirmed/rejected)
- Actions: Edit, Confirm, Reject
- Filter tabs: All, Pending, Confirmed, Rejected
- Stats summary at top
```

---

### US-9.3.2: Edit Pending Item
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to edit items before committing.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/bulkService.js`:
  - `updateItem(sessionId, itemTempId, updates)` - Update pending item
- [ ] Add route: PUT `/api/bulk/sessions/:id/items/:itemId`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement pending item update for US-9.3.2.

Add updateItem(sessionId, itemTempId, updates):
- Find item by tempId in session.items
- Update allowed fields: name, category, quantity, locationId
- Set status to 'confirmed' after edit

Add PUT /api/bulk/sessions/:id/items/:itemId route.
```

#### FRONTEND Agent Tasks:
- [ ] Edit modal/drawer for pending item
- [ ] Pre-filled form
- [ ] Save marks as confirmed
- [ ] Return to list

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add pending item editing for US-9.3.2.

Add to BulkReviewList:
- Click Edit opens item form modal
- Pre-filled with scanned data
- Edit: name, category, quantity, location
- Save: marks item confirmed, closes modal
```

---

### US-9.3.4: Commit All Items
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to commit all confirmed items to my inventory.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/bulkService.js`:
  - `commit(sessionId)` - Create real items from confirmed
  - Create Item documents for each confirmed item
  - Update location item counts
  - Mark session as completed
  - Return summary
- [ ] Add route: POST `/api/bulk/sessions/:id/commit`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement bulk commit for US-9.3.4.

Add commit(sessionId) to bulkService:
1. Get session, verify status is active
2. Filter items with status 'confirmed' or 'pending'
3. For each item:
   - Create Item document
   - Increment location.itemCount
4. Update session stats
5. Set session status to 'completed'
6. Return summary: { created, skipped, byLocation }

Add POST /api/bulk/sessions/:id/commit route.
```

#### FRONTEND Agent Tasks:
- [ ] Commit button on review page
- [ ] Confirmation dialog with counts
- [ ] Progress indicator during commit
- [ ] Success summary page
- [ ] Option to start new session

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create commit flow for US-9.3.4.

Add to BulkImportPage:
- "Commit X Items" button
- Confirmation: "Add X items to inventory?"
- Shows breakdown by location
- Progress bar during commit
- Success page with summary:
  - X items added
  - By location breakdown
  - "Start New Session" button
```

---

## Epic 10: Tools for Project

### US-10.1.3: Default Project Templates
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want built-in project templates.

#### DATABASE Agent Tasks:
- [ ] Create `server/models/ProjectTemplate.js`:
  - `name` - String, required
  - `description` - String
  - `category` - String (plumbing, electrical, etc.)
  - `difficulty` - enum: ['easy', 'medium', 'hard']
  - `estimatedTime` - String
  - `tools.essential` - [{ name, alternatives }]
  - `tools.recommended` - [{ name }]
  - `tools.optional` - [{ name }]
  - `materials` - [{ name, quantity, unit }]
  - `safetyItems` - [String]
  - `tips` - [String]
  - `isSystem` - Boolean

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create ProjectTemplate model for US-10.1.3.

Create server/models/ProjectTemplate.js for project templates.
Tools categorized: essential (must have), recommended, optional.
Each tool can have alternatives.
Include materials with quantities.
```

- [ ] Create `server/seeds/projectTemplates.js`:
  - 15+ templates covering common DIY projects

**DATABASE Prompt (seeds):**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create project templates seed data for US-10.1.3.

Create server/seeds/projectTemplates.js with 15+ templates:

Plumbing:
- Fix Leaky Faucet
- Replace Toilet
- Clear Clogged Drain
- Install Water Heater

Electrical:
- Replace Outlet
- Install Ceiling Fan
- Add Light Switch
- Install Doorbell

Drywall:
- Patch Drywall Hole
- Hang Drywall Sheet
- Tape and Mud Joints

Painting:
- Paint Room Interior
- Paint Exterior Trim

Automotive:
- Change Oil
- Replace Brake Pads
- Change Tire

Include realistic tool lists and materials.
```

#### BACKEND Agent Tasks:
- [ ] Create `server/services/projectService.js`:
  - `getTemplates(category)` - List templates
  - `getTemplate(templateId)` - Get full template
- [ ] Create routes: GET `/api/projects/templates`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement project templates API for US-10.1.3.

Create:
1. server/services/projectService.js
2. server/controllers/projectController.js
3. server/routes/projects.js

Routes:
- GET /api/projects/templates - list all, filter by category
- GET /api/projects/templates/:id - get full template
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/pages/ProjectsPage.js`:
  - Template browser
  - Category filter
  - Search
  - Template cards
- [ ] Create `client/js/components/ProjectTemplateCard.js`

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create project templates UI for US-10.1.3.

Create:
1. client/js/pages/ProjectsPage.js
2. client/js/components/ProjectTemplateCard.js

ProjectsPage:
- Category filter tabs
- Search input
- Grid of template cards

ProjectTemplateCard:
- Name, difficulty badge, time estimate
- Brief description
- "View Details" button
```

---

### US-10.2.2: AI Generate Tool List
**Priority:** P0 | **Complexity:** L (5) | **Status:** ⬜ Not Started

**Story:** As a user, I want AI to suggest tools based on my job description.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/aiService.js`:
  - `suggestTools(jobDescription)` - Call Claude for tool suggestions
  - Return structured list: essential, recommended, materials
- [ ] Add route: POST `/api/projects/suggest`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement AI tool suggestions for US-10.2.2.

Add suggestTools(jobDescription) to aiService:
- Call Claude with job description
- Request structured JSON response:
  {
    tools: { essential: [], recommended: [], optional: [] },
    materials: [{ name, quantity, unit }],
    safetyItems: [],
    tips: [],
    estimatedDifficulty: 'easy'|'medium'|'hard',
    estimatedTime: '2-3 hours'
  }

Add POST /api/projects/suggest route.
Body: { description }
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ProjectWizard.js`:
  - Step 1: Describe your project (text area)
  - Step 2: AI generates suggestions
  - Step 3: Review and check inventory

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create project wizard for US-10.2.2.

Create client/js/components/ProjectWizard.js:
- Step 1: "What do you need to do?"
  - Large text area
  - Examples: "fix leaky kitchen faucet", "hang a ceiling fan"
  - "Get Suggestions" button
- Step 2: Show AI results
  - Tools list (essential/recommended)
  - Materials list
  - Safety items
  - Tips
- "Check My Inventory" button
```

---

### US-10.3.1: Check Tool Availability
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to see which tools I already have.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/projectService.js`:
  - `checkInventory(userId, toolList)` - Check which tools user has
  - Use fuzzy matching and synonyms
  - Return: have[], missing[], maybe[]
- [ ] Add route: POST `/api/projects/check-inventory`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement inventory check for US-10.3.1.

Add checkInventory(userId, toolList) to projectService:
1. For each tool in list:
   - Expand with synonyms
   - Search user's items (fuzzy match)
   - Categorize: have (exact/close match), maybe (partial), missing
2. For "have" items, include locationId and path

Return:
{
  have: [{ tool, matchedItem, location }],
  maybe: [{ tool, possibleMatches }],
  missing: [{ tool }]
}
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/InventoryCheckResult.js`:
  - ✓ Have (green) - with location
  - ? Maybe (yellow) - confirm matches
  - ✗ Missing (red)
  - Clickable locations to navigate

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create inventory check results for US-10.3.1.

Create client/js/components/InventoryCheckResult.js:
- Three sections:
  - ✓ You Have (green): tool name, location path
  - ? Might Have (yellow): tool name, possible matches to confirm
  - ✗ Need to Get (red): tool name
- Click location to navigate
- "Generate Shopping List" button for missing items
```

---

### US-10.3.3: Generate Shopping List
**Priority:** P1 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want a shopping list for missing items.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ShoppingList.js`:
  - List of missing tools and materials
  - Checkboxes for selection
  - Copy to clipboard
  - Print option
  - Share option (future)

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create shopping list for US-10.3.3.

Create client/js/components/ShoppingList.js:
- List missing tools
- List missing materials with quantities
- Grouped by category
- Checkboxes to track while shopping
- "Copy List" button (plain text)
- "Print" button
- Store list in localStorage for persistence
```

---

## Milestone 4 Completion Checklist

- [ ] Bulk session management working
- [ ] Rapid-fire scanning working
- [ ] Review and commit flow working
- [ ] Project templates available
- [ ] AI tool suggestions working
- [ ] Inventory check working
- [ ] Shopping list generation working
- [ ] All interfaces updated
- [ ] Git commit: "Milestone 4 Complete: Bulk Import & Projects"
