# Milestone 1: Foundation
## WIT (Where Is It) - User Stories with Agent Tasks

**Duration:** Weeks 1-4
**Stories:** 36 total

---

## Pre-Milestone: Project Initialization

### INIT-001: Project Setup
**Status:** ✅ Complete

#### ARCHITECT Tasks:
- [x] Create `server/config/database.js` - MongoDB Atlas connection
- [x] Create `server/utils/AppError.js` - Custom error class
- [x] Create `server/middleware/errorHandler.js` - Global error handler
- [x] Create `server/app.js` - Express app configuration
- [x] Create `server/server.js` - Entry point
- [x] Verify folder structure matches architecture
- [ ] Update `docs/ADR.md` with initial decisions

**Prompt:**
```
You are the ARCHITECT agent for WIT (Where Is It).

Read: docs/agents/ARCHITECT_AGENT.md
Read: docs/ARCHITECTURE.md

Task: Initialize the Express application foundation.

Create these files:
1. server/config/database.js - MongoDB connection using mongoose
2. server/utils/AppError.js - Custom error class with statusCode, code, details
3. server/middleware/errorHandler.js - Global error handler
4. server/app.js - Express setup with helmet, cors, morgan, cookie-parser, JSON parsing
5. server/server.js - Connects to DB, starts server on PORT

Follow patterns in ARCHITECTURE.md. Use dotenv for config.
```

---

## Epic 1: Authentication & User Management

### US-1.1.1: User Email Registration
**Priority:** P0 | **Complexity:** M (3) | **Status:** ✅ Complete

**Story:** As a new user, I want to register with my email and password so that I can create an account.

#### DATABASE Agent Tasks:
- [x] Create `server/models/User.js` with schema:
  - `email` - String, required, unique, lowercase, trimmed, validated
  - `passwordHash` - String, required
  - `name` - String, required, trimmed, max 100
  - `avatar` - String (URL), optional
  - `settings.theme` - String, enum: ['light', 'dark', 'system'], default: 'system'
  - `settings.defaultView` - String, enum: ['grid', 'list'], default: 'grid'
  - `settings.notifications` - Boolean, default: true
  - `subscription.tier` - String, enum: ['free', 'premium'], default: 'free'
  - `subscription.stripeCustomerId` - String, optional
  - `subscription.expiresAt` - Date, optional
  - `loginAttempts` - Number, default: 0
  - `lockUntil` - Date, optional
  - `timestamps` - true
- [x] Add indexes: `{ email: 1 }` unique
- [x] Add instance method: `comparePassword(candidatePassword)` - returns Promise<boolean>
- [x] Add instance method: `generateAuthToken()` - returns JWT string
- [x] Add instance method: `isLocked()` - returns boolean
- [x] Add static method: `findByEmail(email)` - returns User or null
- [x] Add pre-save hook: hash password if modified
- [x] Update `docs/interfaces/models.md` with User interface

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-1.1.1 section)

Task: Create the User model for US-1.1.1.

Create server/models/User.js with all fields, methods, and indexes listed in the task.
Use bcryptjs for password hashing (10 rounds).
Use jsonwebtoken for token generation.

After completion, update docs/interfaces/models.md with the User interface.
```

#### BACKEND Agent Tasks:
- [x] Create `server/services/authService.js`:
  - `register(email, password, name)` - Creates user, returns user without password
  - Validates email not already registered (throw 409 DUPLICATE_EMAIL)
  - Hashes password before saving
- [x] Create `server/controllers/authController.js`:
  - `register(req, res, next)` - Handles POST /api/auth/register
  - Sets JWT in httpOnly cookie
  - Returns `{ success: true, data: { user } }`
- [x] Create `server/routes/auth.js`:
  - POST `/register` with validation rules
- [x] Create `server/middleware/validate.js` - Validation error handler
- [x] Register auth routes in `server/app.js`
- [x] Update `docs/interfaces/api-endpoints.md`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/interfaces/models.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-1.1.1 section)

Task: Implement registration endpoint for US-1.1.1.

Create:
1. server/services/authService.js - register() method
2. server/controllers/authController.js - register handler
3. server/routes/auth.js - POST /register route
4. server/middleware/validate.js - validation middleware

Validation rules:
- email: required, valid email format
- password: required, min 8 chars
- name: required, max 100 chars

Set JWT in httpOnly cookie (30 days).
Update docs/interfaces/api-endpoints.md when done.
```

#### FRONTEND Agent Tasks:
- [x] Create `client/js/api.js` - Base API client with error handling
- [x] Create `client/js/components/RegisterForm.js`:
  - Email, password, confirm password, name inputs
  - Client-side validation
  - Error display
  - Loading state
  - Success redirect
- [x] Create `client/js/pages/RegisterPage.js` - Registration page
- [x] Create `client/css/styles.css` - Form styling
- [x] Add route in `client/js/router.js`

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Read: docs/agents/FRONTEND_AGENT.md
Read: docs/interfaces/api-endpoints.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-1.1.1 section)

Task: Create registration UI for US-1.1.1.

Create:
1. client/js/api.js - API client with fetch wrapper
2. client/js/components/RegisterForm.js - Vue component
3. client/js/pages/RegisterPage.js - Page component
4. Update client/index.html with app mount point

Form fields: email, password, confirmPassword, name
Include validation, loading states, error handling.
Use Tailwind CSS for styling.
```

---

### US-1.2.1: Email/Password Login
**Priority:** P0 | **Complexity:** S (2) | **Status:** ✅ Complete

**Story:** As a registered user, I want to log in with my email and password.

#### DATABASE Agent Tasks:
- [x] Add method to User model: `incrementLoginAttempts()` - handles lockout logic
- [x] Add method to User model: `resetLoginAttempts()` - clears on successful login
- [x] Update `docs/interfaces/models.md`

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/interfaces/models.md

Task: Add login attempt tracking to User model for US-1.2.1.

Add to server/models/User.js:
1. incrementLoginAttempts() - increment attempts, lock after 5 failures for 2 hours
2. resetLoginAttempts() - reset attempts and lockUntil on successful login

Update docs/interfaces/models.md.
```

#### BACKEND Agent Tasks:
- [x] Add to `server/services/authService.js`:
  - `login(email, password)` - Validates credentials, handles lockout
  - Throws 401 INVALID_CREDENTIALS or 423 ACCOUNT_LOCKED
- [x] Add to `server/controllers/authController.js`:
  - `login(req, res, next)` - Handles POST /api/auth/login
- [x] Add to `server/routes/auth.js`:
  - POST `/login` with validation
- [x] Update `docs/interfaces/api-endpoints.md`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/interfaces/models.md

Task: Implement login endpoint for US-1.2.1.

Add to authService.js:
- login(email, password) - verify credentials, handle lockout

Add to authController.js:
- login handler

Add to routes/auth.js:
- POST /login

Check lockout before validating password. Reset attempts on success.
Set JWT in httpOnly cookie.
```

#### FRONTEND Agent Tasks:
- [x] Create `client/js/components/LoginForm.js`:
  - Email, password inputs
  - "Remember me" checkbox
  - "Forgot password" link
  - Error display (including lockout message)
- [x] Create `client/js/pages/LoginPage.js`
- [x] Add route in router

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Read: docs/agents/FRONTEND_AGENT.md
Read: docs/interfaces/api-endpoints.md

Task: Create login UI for US-1.2.1.

Create:
1. client/js/components/LoginForm.js
2. client/js/pages/LoginPage.js

Include error handling for locked accounts.
Add "Forgot password" link (implement later).
Redirect to dashboard on success.
```

---

### US-1.2.4: Logout
**Priority:** P0 | **Complexity:** XS (1) | **Status:** ✅ Complete

**Story:** As a logged-in user, I want to log out.

#### BACKEND Agent Tasks:
- [x] Add to `server/controllers/authController.js`:
  - `logout(req, res)` - Clears token cookie
- [x] Add to `server/routes/auth.js`:
  - POST `/logout`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement logout for US-1.2.4.

Add logout handler that clears the token cookie.
POST /api/auth/logout - clears httpOnly cookie, returns success.
```

#### FRONTEND Agent Tasks:
- [x] Add logout button to navigation
- [x] Call logout API on click
- [x] Clear local state
- [x] Redirect to login

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add logout functionality for US-1.2.4.

Add logout button to navigation/header.
On click: call POST /api/auth/logout, clear app state, redirect to /login.
```

---

### US-1.3.1: View Profile
**Priority:** P1 | **Complexity:** S (2) | **Status:** ✅ Complete

**Story:** As a user, I want to view my profile.

#### BACKEND Agent Tasks:
- [x] Create `server/middleware/auth.js`:
  - `protect` - Verifies JWT, attaches user to req
  - `optionalAuth` - Attaches user if token exists, continues if not
- [x] Add to `server/controllers/authController.js`:
  - `getMe(req, res)` - Returns current user
- [x] Add to `server/routes/auth.js`:
  - GET `/me` (protected)

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement profile view for US-1.3.1.

Create server/middleware/auth.js:
- protect middleware: verify JWT from cookie, attach user to req
- optionalAuth middleware: attach user if exists, continue if not

Add to authController:
- getMe(req, res) - return req.user (exclude passwordHash)

Add route: GET /api/auth/me (protected)
```

#### FRONTEND Agent Tasks:
- [x] Create `client/js/pages/ProfilePage.js`:
  - Display name, email, avatar
  - Show subscription tier
  - Show account creation date
  - Edit button link

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create profile view for US-1.3.1.

Create client/js/pages/ProfilePage.js:
- Fetch user from GET /api/auth/me
- Display profile information
- Add Edit Profile button
```

---

### US-1.3.2: Edit Profile
**Priority:** P1 | **Complexity:** S (2) | **Status:** ✅ Complete

**Story:** As a user, I want to edit my profile.

#### BACKEND Agent Tasks:
- [x] Add to `server/services/authService.js`:
  - `updateProfile(userId, updates)` - Updates name, avatar
- [x] Add to `server/controllers/authController.js`:
  - `updateMe(req, res)` - Handles PUT /api/auth/me
- [x] Add to `server/routes/auth.js`:
  - PUT `/me` (protected)

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement profile update for US-1.3.2.

Add updateProfile(userId, { name, avatar }) to authService.
Add updateMe handler to authController.
Add PUT /api/auth/me route (protected).

Only allow updating name and avatar.
```

#### FRONTEND Agent Tasks:
- [x] Create `client/js/components/ProfileForm.js`:
  - Edit name
  - Upload/change avatar
  - Save button
- [x] Add edit mode to ProfilePage

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create profile edit form for US-1.3.2.

Create client/js/components/ProfileForm.js:
- Name input (pre-filled)
- Avatar upload/URL input
- Save and Cancel buttons

Integrate with ProfilePage.
```

---

### US-1.3.3: Change Password
**Priority:** P1 | **Complexity:** S (2) | **Status:** ✅ Complete

**Story:** As a user, I want to change my password.

#### BACKEND Agent Tasks:
- [x] Add to `server/services/authService.js`:
  - `changePassword(userId, currentPassword, newPassword)` - Validates current, updates
- [x] Add to `server/controllers/authController.js`:
  - `changePassword(req, res)`
- [x] Add to `server/routes/auth.js`:
  - PUT `/me/password` (protected)

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement password change for US-1.3.3.

Add changePassword(userId, currentPassword, newPassword) to authService:
- Verify current password
- Hash and save new password
- Throw 401 if current password wrong

Add route: PUT /api/auth/me/password
```

#### FRONTEND Agent Tasks:
- [x] Create `client/js/components/ChangePasswordForm.js`:
  - Current password
  - New password
  - Confirm new password
  - Client-side validation
- [x] Add to ProfilePage or Settings

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create password change form for US-1.3.3.

Create client/js/components/ChangePasswordForm.js:
- Current password input
- New password input (min 8 chars)
- Confirm password input
- Show success/error messages
```

---

### US-1.4.1: General Settings
**Priority:** P1 | **Complexity:** M (3) | **Status:** ✅ Complete

**Story:** As a user, I want to configure general settings (theme, default view).

#### BACKEND Agent Tasks:
- [x] Add to `server/services/authService.js`:
  - `updateSettings(userId, settings)` - Updates user.settings
- [x] Add to `server/controllers/authController.js`:
  - `updateSettings(req, res)`
- [x] Add to `server/routes/auth.js`:
  - PUT `/me/settings` (protected)

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement settings update for US-1.4.1.

Add updateSettings(userId, settings) to authService.
Validate: theme in ['light','dark','system'], defaultView in ['grid','list'].
Add route: PUT /api/auth/me/settings
```

#### FRONTEND Agent Tasks:
- [x] Create `client/js/pages/SettingsPage.js`:
  - Theme selector (light/dark/system)
  - Default view selector (grid/list)
  - Notification toggle
  - Save button
- [x] Apply theme to app on change
- [x] Add settings route

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create settings page for US-1.4.1.

Create client/js/pages/SettingsPage.js:
- Theme dropdown
- Default view dropdown
- Notifications toggle
- Auto-save or Save button

Apply theme changes immediately to document.
```

---

## Epic 2: Hierarchical Location Management

### US-2.1.1: Create Top-Level Location
**Priority:** P0 | **Complexity:** M (3) | **Status:** ✅ Complete

**Story:** As a user, I want to create top-level locations (house, warehouse, storage unit).

#### DATABASE Agent Tasks:
- [x] Create `server/models/Location.js` with schema:
  - `ownerId` - ObjectId, ref: 'User', required, indexed
  - `name` - String, required, trimmed, max 100
  - `description` - String, optional, max 500
  - `type` - String, required (house, warehouse, storage_unit, office, vehicle, room, zone, container, custom)
  - `customType` - String, optional (when type is 'custom')
  - `icon` - String, optional
  - `color` - String, optional (hex)
  - `parentId` - ObjectId, ref: 'Location', optional, indexed
  - `path` - String, required (materialized path: ",id1,id2,")
  - `depth` - Number, required, default: 0
  - `address.street` - String
  - `address.city` - String
  - `address.state` - String
  - `address.zip` - String
  - `address.country` - String
  - `itemCount` - Number, default: 0 (cached)
  - `childCount` - Number, default: 0 (cached)
  - `capacity.type` - String, enum: ['unlimited', 'slots', 'volume']
  - `capacity.max` - Number
  - `capacity.used` - Number
  - `isActive` - Boolean, default: true
  - `timestamps` - true
- [x] Add indexes:
  - `{ ownerId: 1, parentId: 1 }`
  - `{ path: 1 }`
  - `{ ownerId: 1, name: 'text' }`
- [x] Add static methods:
  - `getTree(ownerId)` - Returns full tree for user
  - `getAncestors(path)` - Returns ancestor locations
  - `getDescendants(locationId)` - Returns all children recursively
- [x] Add instance methods:
  - `isDescendantOf(ancestorId)` - Check if location is under ancestor
  - `getFullPath()` - Returns array of ancestor names
- [x] Create `server/models/LocationType.js` for custom types
- [x] Update `docs/interfaces/models.md`

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-2.1.1 section)

Task: Create Location model for US-2.1.1.

Create server/models/Location.js with:
- All fields listed in the task
- Materialized path pattern (path field like ",id1,id2,id3,")
- Static methods: getTree, getAncestors, getDescendants
- Instance methods: isDescendantOf, getFullPath

Update docs/interfaces/models.md.
```

#### BACKEND Agent Tasks:
- [x] Create `server/services/locationService.js`:
  - `create(ownerId, data)` - Creates location with proper path/depth
  - `getAll(ownerId)` - Gets all locations for user
  - `getTree(ownerId)` - Gets hierarchical tree
  - `getById(userId, locationId)` - Gets single location with permission check
- [x] Create `server/controllers/locationController.js`:
  - `create(req, res)` - POST handler
  - `getAll(req, res)` - GET / handler
  - `getTree(req, res)` - GET /tree handler
  - `getOne(req, res)` - GET /:id handler
- [x] Create `server/routes/locations.js`:
  - All routes protected
  - POST `/` - Create location
  - GET `/` - List locations
  - GET `/tree` - Get tree structure
  - GET `/:id` - Get single location
- [x] Register routes in app.js
- [x] Update `docs/interfaces/api-endpoints.md`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/interfaces/models.md

Task: Implement location creation for US-2.1.1.

Create:
1. server/services/locationService.js - create, getAll, getTree, getById
2. server/controllers/locationController.js - handlers
3. server/routes/locations.js - routes (all protected)

For create: if no parentId, set path = ",{newId}," and depth = 0
For tree: return nested structure with children arrays

Update docs/interfaces/api-endpoints.md.
```

#### FRONTEND Agent Tasks:
- [x] Create `client/js/components/LocationForm.js`:
  - Name input
  - Type selector (with icons)
  - Description textarea
  - Address fields (collapsible)
  - Parent selector (for sub-locations)
- [x] Create `client/js/components/LocationCard.js`:
  - Shows location with type icon
  - Item count badge
  - Click to navigate
- [x] Create `client/js/pages/DashboardPage.js`:
  - "My Locations" section
  - "Add Location" button
  - Grid of LocationCards
- [x] Add modal for location creation

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Read: docs/agents/FRONTEND_AGENT.md
Read: docs/interfaces/api-endpoints.md

Task: Create location UI for US-2.1.1.

Create:
1. client/js/components/LocationForm.js - creation form
2. client/js/components/LocationCard.js - display card
3. client/js/pages/DashboardPage.js - main dashboard

Add modal/dialog for location creation.
Show locations in a grid on dashboard.
```

---

### US-2.1.2: View Location Tree
**Priority:** P0 | **Complexity:** M (3) | **Status:** ✅ Complete

**Story:** As a user, I want to view my locations in a tree structure.

#### FRONTEND Agent Tasks:
- [x] Create `client/js/components/LocationTree.js`:
  - Recursive tree rendering
  - Expand/collapse nodes
  - Type icons
  - Item count badges
  - Click to select/navigate
  - Drag and drop (future)
- [x] Create `client/js/components/LocationTreeNode.js`:
  - Single node with expand button
  - Children indentation
  - Hover actions
- [x] Add tree view toggle to dashboard
- [x] Connect tree to location modal operations (edit, delete, add child)

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Read: docs/agents/FRONTEND_AGENT.md

Task: Create location tree component for US-2.1.2.

Create:
1. client/js/components/LocationTree.js - recursive tree
2. client/js/components/LocationTreeNode.js - single node

Features:
- Expand/collapse with arrow icons
- Indentation based on depth
- Show item counts
- Click to select
- Icons based on location type
```

---

### US-2.1.3: Edit Location
**Priority:** P0 | **Complexity:** S (2) | **Status:** ✅ Complete

**Story:** As a location owner, I want to edit location details.

#### BACKEND Agent Tasks:
- [x] Add to `server/services/locationService.js`:
  - `update(userId, locationId, updates)` - Updates location
  - Verify ownership
- [x] Add to `server/controllers/locationController.js`:
  - `update(req, res)` - PUT handler
- [x] Add to `server/routes/locations.js`:
  - PUT `/:id`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement location update for US-2.1.3.

Add update(userId, locationId, updates) to locationService.
Verify user owns location or has Manager permission.
Add PUT /api/locations/:id route.
```

#### FRONTEND Agent Tasks:
- [x] Add edit mode to LocationForm
- [x] Add edit button to location detail/card
- [x] Pre-fill form with existing data
- [x] Edit via hover actions in tree view and card view

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add location editing for US-2.1.3.

Update LocationForm to support edit mode.
Add Edit button to LocationCard/LocationDetail.
Pre-fill form, show "Update" instead of "Create".
```

---

### US-2.1.4: Delete Location
**Priority:** P0 | **Complexity:** M (3) | **Status:** ✅ Complete

**Story:** As a location owner, I want to delete a location.

#### BACKEND Agent Tasks:
- [x] Add to `server/services/locationService.js`:
  - `delete(userId, locationId, options)` - Soft delete
  - Options: `{ cascade }` - deletes all descendants
  - Handle children check and cascade delete
- [x] Add to `server/controllers/locationController.js`:
  - `delete(req, res)` - DELETE handler
- [x] Add to `server/routes/locations.js`:
  - DELETE `/:id`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement location deletion for US-2.1.4.

Add delete(userId, locationId, options) to locationService:
- Check for children and items
- If cascade: delete all descendants
- If moveItemsTo: move items to another location
- Soft delete (isActive = false)

Add DELETE /api/locations/:id route.
Query params: cascade, moveItemsTo
```

#### FRONTEND Agent Tasks:
- [x] Enhanced delete confirmation dialog in DashboardPage.js:
  - Warning message with location name
  - Show child/item counts with visual indicators
  - Cascade delete checkbox for locations with children
  - Button disabled until cascade confirmed (when has children)
  - Button text changes to "Delete All" when cascade enabled
- [x] Delete button on LocationCard hover
- [x] Delete button on LocationTreeNode hover
- [x] API client updated with cascade parameter support

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create location delete dialog for US-2.1.4.

Create client/js/components/DeleteLocationDialog.js:
- Show warning with item/child counts
- Radio options: Move contents / Delete all
- Location picker if moving
- Require confirmation

Add delete option to location actions menu.
```

---

### US-2.2.1: Create Sub-Location
**Priority:** P0 | **Complexity:** M (3) | **Status:** ✅ Complete

**Story:** As a user, I want to create sub-locations within a parent.

#### BACKEND Agent Tasks:
- [x] Update `server/services/locationService.js` create method:
  - If parentId provided:
    - Get parent location
    - Verify user has access to parent
    - Set path = `${parent.path}${newId},`
    - Set depth = parent.depth + 1
    - Increment parent.childCount

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Update location creation for sub-locations (US-2.2.1).

Modify locationService.create():
- If parentId is provided:
  - Verify parent exists and user has access
  - Calculate path: parent.path + newId + ","
  - Set depth: parent.depth + 1
  - Increment parent.childCount

Return created location with full path.
```

#### FRONTEND Agent Tasks:
- [x] Add "Add Sub-location" button to tree node (+ icon on hover)
- [x] Pre-select parent in LocationForm when creating from parent
- [x] Modal title changes to "Add Sub-Location" when parent selected
- [x] Shows "Adding to: [parent name]" indicator in modal
- [x] LocationForm receives parentId prop and includes in API call

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add sub-location creation for US-2.2.1.

Add "Add Sub-location" button to location detail view.
When clicked, open LocationForm with parent pre-selected.
Suggest appropriate child types based on parent (e.g., Room types for House).
```

---

### US-2.2.2: View Location Breadcrumb Path
**Priority:** P1 | **Complexity:** S (2) | **Status:** ✅ Complete

**Story:** As a user, I want to see the full path to a location.

#### FRONTEND Agent Tasks:
- [x] Create `client/js/components/Breadcrumb.js`:
  - Shows: Home > House > Garage > Toolbox
  - Each segment clickable (navigates to that location)
  - Current location not a link
  - Collapse middle items with "..." dropdown when too many
- [x] Add breadcrumb to location detail slide-out panel
- [x] Add getBreadcrumb method to API client
- [x] Create location detail panel with full location info

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create breadcrumb component for US-2.2.2.

Create client/js/components/Breadcrumb.js:
- Accept array of { id, name } ancestors
- Render as clickable links
- Last item (current) is plain text
- Responsive: collapse middle items on mobile

Add to location detail page header.
```

---

### US-2.3.1: Create Storage Container
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to create storage containers with capacity configuration.

#### DATABASE Agent Tasks:
- [ ] Ensure Location model has capacity fields (done in US-2.1.1)
- [ ] Add container-specific location types to seeds

#### BACKEND Agent Tasks:
- [ ] Ensure locationService.create handles capacity configuration
- [ ] Add validation for capacity fields

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Add container capacity handling for US-2.3.1.

Update locationService.create to handle capacity:
- capacity.type: 'unlimited' | 'slots' | 'volume'
- capacity.max: number (required if not unlimited)
- capacity.used: starts at 0

Validate capacity.max > 0 when type is not 'unlimited'.
```

#### FRONTEND Agent Tasks:
- [ ] Add capacity configuration to LocationForm:
  - Show only for container types
  - Type selector (unlimited/slots/volume)
  - Max capacity input
  - Unit label input (e.g., "drawers", "cubic feet")

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add capacity configuration to location form for US-2.3.1.

Update LocationForm:
- Show capacity section for container types
- Capacity type dropdown
- Max capacity number input (hidden if unlimited)
- Visual capacity indicator preview
```

---

### US-2.4.1: System Location Types
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want pre-defined location types with icons.

#### DATABASE Agent Tasks:
- [ ] Create `server/seeds/locationTypes.js`:
  - Property types: house, warehouse, storage_unit, office, vehicle
  - Room types: garage, basement, attic, kitchen, bedroom, bathroom, workshop, living_room
  - Zone types: inbound, staging, racking, floor, outbound
  - Container types: drawer_cabinet, shelving, bin_rack, tool_chest, pegboard, closet, cabinet
- [ ] Include icon names and default colors for each

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Task: Create location types seed data for US-2.4.1.

Create server/seeds/locationTypes.js:

Export array of location types with:
- name (slug format)
- label (display name)
- category: 'property' | 'room' | 'zone' | 'container'
- icon (emoji or icon name)
- color (default hex color)
- allowedChildren (array of type names that can be children)

Include 20+ types covering home, warehouse, and storage scenarios.
```

---

## Epic 3: Location Sharing & Permissions

### US-3.1.1: Invite User by Email
**Priority:** P0 | **Complexity:** L (5) | **Status:** ⬜ Not Started

**Story:** As a location owner, I want to invite other users to access my location.

#### DATABASE Agent Tasks:
- [ ] Create `server/models/LocationShare.js`:
  - `locationId` - ObjectId, ref: 'Location', required, indexed
  - `userId` - ObjectId, ref: 'User', optional (null until accepted)
  - `email` - String, required (invitee email)
  - `permission` - String, enum: ['viewer', 'contributor', 'editor', 'manager'], required
  - `inheritToChildren` - Boolean, default: true
  - `status` - String, enum: ['pending', 'accepted', 'declined', 'revoked'], default: 'pending'
  - `inviteToken` - String, unique (for invite link)
  - `invitedBy` - ObjectId, ref: 'User', required
  - `invitedAt` - Date, default: now
  - `acceptedAt` - Date, optional
  - `expiresAt` - Date (invite expiration)
  - `timestamps` - true
- [ ] Add indexes:
  - `{ locationId: 1, email: 1 }` unique
  - `{ userId: 1, status: 1 }`
  - `{ inviteToken: 1 }`
- [ ] Update `docs/interfaces/models.md`

**DATABASE Prompt:**
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md

Task: Create LocationShare model for US-3.1.1.

Create server/models/LocationShare.js with all fields listed.
Invite token should be generated with crypto.randomBytes.
Add unique compound index on locationId + email.

Update docs/interfaces/models.md.
```

#### BACKEND Agent Tasks:
- [ ] Create `server/services/shareService.js`:
  - `invite(userId, locationId, email, permission, inheritToChildren)`
  - `getPendingInvites(email)` - Get invites for email
  - `getSharesForLocation(locationId)` - Get all shares for location
  - `getSharesForUser(userId)` - Get locations shared with user
- [ ] Create `server/services/permissionService.js`:
  - `canAccessLocation(userId, locationId, requiredPermission)` - Check permission
  - `getAccessibleLocationIds(userId)` - All locations user can access
  - `getPermissionLevel(userId, locationId)` - Get user's permission
- [ ] Create `server/controllers/shareController.js`:
  - `invite(req, res)` - POST /locations/:id/share
  - `getShares(req, res)` - GET /locations/:id/shares
- [ ] Add routes to locations.js
- [ ] Update `docs/interfaces/api-endpoints.md`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/interfaces/models.md

Task: Implement location sharing for US-3.1.1.

Create:
1. server/services/shareService.js - invite, getPendingInvites, getSharesForLocation
2. server/services/permissionService.js - canAccessLocation, getAccessibleLocationIds
3. server/controllers/shareController.js - invite, getShares handlers

Routes:
- POST /api/locations/:id/share - invite user
- GET /api/locations/:id/shares - list shares

Check that inviter has Manager permission on location.
Generate secure invite token.
Set expiration to 7 days.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/ShareDialog.js`:
  - Email input
  - Permission level dropdown
  - "Include sub-locations" checkbox
  - Send invite button
- [ ] Create `client/js/components/ShareList.js`:
  - List of current shares
  - Status badges (pending, accepted)
  - Permission level display
  - Remove button
- [ ] Add Share button to location actions

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Read: docs/agents/FRONTEND_AGENT.md

Task: Create sharing UI for US-3.1.1.

Create:
1. client/js/components/ShareDialog.js - invite form
2. client/js/components/ShareList.js - current shares list

ShareDialog:
- Email input with validation
- Permission dropdown: Viewer, Contributor, Editor, Manager
- Checkbox for inherit to children
- Send button

Add Share button to location detail page.
```

---

### US-3.1.2: Accept Invitation
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As an invited user, I want to accept a location sharing invitation.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/shareService.js`:
  - `acceptInvite(userId, inviteToken)` - Accept and link to user
  - Validate token and expiration
  - Update status to 'accepted'
  - Set userId and acceptedAt
- [ ] Create `server/controllers/inviteController.js`:
  - `getInvite(req, res)` - GET /invites/:token (public info)
  - `acceptInvite(req, res)` - POST /invites/:token/accept (authenticated)
- [ ] Create `server/routes/invites.js`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement invite acceptance for US-3.1.2.

Add to shareService:
- getInviteByToken(token) - get invite info
- acceptInvite(userId, token) - accept invite, link to user

Create inviteController and routes:
- GET /api/invites/:token - get invite details (public)
- POST /api/invites/:token/accept - accept (authenticated)

Validate:
- Token exists and not expired
- Status is 'pending'
- User email matches invite email (optional, for security)
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/pages/InvitePage.js`:
  - Show location name and inviter
  - Show permission level being granted
  - Accept / Decline buttons
  - Redirect to login if not authenticated
- [ ] Add route for `/invite/:token`

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create invite acceptance page for US-3.1.2.

Create client/js/pages/InvitePage.js:
- Fetch invite details by token
- Show: location name, owner, permission level
- Accept button (requires login)
- Decline button
- Redirect to dashboard after accepting
```

---

### US-3.2.1: View Location Members
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a location manager, I want to see all members with access.

#### FRONTEND Agent Tasks:
- [ ] Enhance `client/js/components/ShareList.js`:
  - Show member name, email, avatar
  - Show permission level
  - Show how access was granted (direct vs inherited)
  - Show pending invites separately
- [ ] Create location members tab/section

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Enhance member list for US-3.2.1.

Update ShareList component:
- Group by: Owner, Managers, Editors, Contributors, Viewers
- Show avatar, name, email
- Badge for pending invites
- Indicate inherited access with icon
- Show invite date for pending
```

---

### US-3.2.2: Change User Permission
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a location manager, I want to change a user's permission level.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/shareService.js`:
  - `updatePermission(userId, shareId, newPermission)` - Update permission
- [ ] Add to `server/controllers/shareController.js`:
  - `updateShare(req, res)` - PUT handler
- [ ] Add route: PUT `/api/shares/:id`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement permission change for US-3.2.2.

Add updatePermission(userId, shareId, newPermission) to shareService.
Verify user has Manager permission on the location.
Cannot change your own permission.

Add PUT /api/shares/:id route.
```

#### FRONTEND Agent Tasks:
- [ ] Add permission dropdown to each member row
- [ ] Auto-save on change
- [ ] Show confirmation for demotions

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add permission editing for US-3.2.2.

Add permission dropdown to ShareList member rows.
On change: call PUT /api/shares/:id
Show confirmation if demoting someone.
Disable for self and owner.
```

---

### US-3.2.3: Revoke Access
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a location manager, I want to revoke a user's access.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/shareService.js`:
  - `revokeAccess(userId, shareId)` - Set status to 'revoked'
- [ ] Add route: DELETE `/api/shares/:id`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement access revocation for US-3.2.3.

Add revokeAccess(userId, shareId) to shareService.
Set status to 'revoked' (soft delete).
Cannot revoke owner or self.

Add DELETE /api/shares/:id route.
```

#### FRONTEND Agent Tasks:
- [ ] Add remove button to member rows
- [ ] Confirmation dialog
- [ ] Refresh list after removal

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add access revocation for US-3.2.3.

Add Remove button (X or trash icon) to ShareList rows.
Show confirmation: "Remove [Name]'s access to [Location]?"
Call DELETE /api/shares/:id on confirm.
```

---

### US-3.2.4: Permission Inheritance
**Priority:** P1 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a location manager, I want permissions to inherit to sub-locations.

#### BACKEND Agent Tasks:
- [ ] Update `server/services/permissionService.js`:
  - `canAccessLocation` should check inherited permissions
  - Walk up the location path to find shares with `inheritToChildren: true`
- [ ] Add query helper to get effective permission

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement permission inheritance for US-3.2.4.

Update permissionService.canAccessLocation():
1. Check direct share on locationId
2. If not found, get location's ancestors from path
3. Check for shares on ancestors where inheritToChildren = true
4. Return highest permission found

Cache results for performance.
```

---

### US-3.3.1: View Shared With Me
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to see locations shared with me.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/shareService.js`:
  - `getSharedWithUser(userId)` - Get all accepted shares
- [ ] Add to `server/controllers/shareController.js`:
  - `getSharedWithMe(req, res)` - GET /shares/with-me
- [ ] Add route

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement shared locations view for US-3.3.1.

Add getSharedWithUser(userId) to shareService.
Return shares with status='accepted', populate location details.

Add GET /api/shares/with-me route.
```

#### FRONTEND Agent Tasks:
- [ ] Add "Shared with Me" section to Dashboard
- [ ] Show shared locations with owner name and permission
- [ ] Different styling from owned locations

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add shared locations section for US-3.3.1.

Add "Shared with Me" section to DashboardPage.
Fetch from GET /api/shares/with-me.
Show:
- Location name and type
- Owner name
- Your permission level
- Different background/border from owned locations
```

---

### US-3.3.2: Leave Shared Location
**Priority:** P1 | **Complexity:** XS (1) | **Status:** ⬜ Not Started

**Story:** As a shared member, I want to leave a shared location.

#### BACKEND Agent Tasks:
- [ ] Add route: POST `/api/shares/:id/leave`
- [ ] Update share status to 'revoked' (self-revoke)

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement leave functionality for US-3.3.2.

Add POST /api/shares/:id/leave route.
User can only leave shares where they are the userId.
Set status to 'revoked'.
```

#### FRONTEND Agent Tasks:
- [ ] Add "Leave" option to shared location menu
- [ ] Confirmation dialog

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add leave option for US-3.3.2.

Add "Leave" menu item for shared locations.
Show confirmation: "Leave [Location]? You'll lose access."
Call POST /api/shares/:id/leave on confirm.
Remove from UI after success.
```

---

## Milestone 1 Completion Checklist

- [ ] All DATABASE tasks complete
- [ ] All BACKEND tasks complete
- [ ] All FRONTEND tasks complete
- [ ] `docs/interfaces/models.md` updated with all models
- [ ] `docs/interfaces/api-endpoints.md` updated with all endpoints
- [ ] `docs/STATUS.md` shows all M1 stories complete
- [ ] Manual testing passed
- [ ] Git commit: "Milestone 1 Complete: Foundation"
