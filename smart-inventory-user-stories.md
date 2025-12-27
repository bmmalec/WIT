# Smart Inventory System - User Stories & Status Report
## Development Tracking Document for Claude Code

---

## Document Information

| Field | Value |
|-------|-------|
| Project | Smart Inventory & Tool Management System |
| Version | 1.0 |
| Created | December 2024 |
| Last Updated | December 2024 |
| Total Stories | 156 |
| Completed | 0 |
| In Progress | 0 |
| Not Started | 156 |

---

## Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Not Started | ⬜ | Work has not begun |
| In Progress | 🟡 | Currently being developed |
| In Review | 🔵 | Code complete, needs testing |
| Completed | ✅ | Fully implemented and tested |
| Blocked | 🔴 | Blocked by dependency or issue |
| Deferred | ⏸️ | Postponed to future phase |

## Priority Legend

| Priority | Description |
|----------|-------------|
| P0 | Critical - Must have for MVP |
| P1 | High - Important for launch |
| P2 | Medium - Nice to have |
| P3 | Low - Future enhancement |

## Complexity Legend

| Complexity | Story Points | Description |
|------------|--------------|-------------|
| XS | 1 | Few hours |
| S | 2 | Half day to 1 day |
| M | 3 | 1-2 days |
| L | 5 | 3-5 days |
| XL | 8 | 1+ week |

---

# EPIC 1: Authentication & User Management

## 1.1 User Registration

### US-1.1.1: Email Registration
| Field | Value |
|-------|-------|
| **ID** | US-1.1.1 |
| **Title** | User Email Registration |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a new user, I want to register with my email and password so that I can create an account and start tracking my inventory.

**Acceptance Criteria:**
- [ ] User can enter email, password, and name
- [ ] Email must be valid format and unique
- [ ] Password must be minimum 8 characters with complexity requirements
- [ ] Password confirmation must match
- [ ] User receives confirmation email (optional for MVP)
- [ ] Account is created in database with hashed password
- [ ] User is automatically logged in after registration
- [ ] Appropriate error messages for validation failures

**Technical Notes:**
- Use bcrypt for password hashing (min 10 rounds)
- Implement email uniqueness check before creation
- Return JWT token on successful registration

---

### US-1.1.2: Google OAuth Registration
| Field | Value |
|-------|-------|
| **ID** | US-1.1.2 |
| **Title** | Google OAuth Registration |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a new user, I want to register using my Google account so that I can quickly create an account without remembering another password.

**Acceptance Criteria:**
- [ ] "Sign up with Google" button is visible
- [ ] Clicking initiates Google OAuth flow
- [ ] User grants permission and is redirected back
- [ ] Account is created with Google profile info
- [ ] User is logged in and redirected to dashboard
- [ ] If email already exists, link accounts or show error

**Technical Notes:**
- Use Passport.js with Google OAuth 2.0 strategy
- Store Google ID for future logins

---

### US-1.1.3: Apple OAuth Registration
| Field | Value |
|-------|-------|
| **ID** | US-1.1.3 |
| **Title** | Apple Sign In Registration |
| **Status** | ⬜ Not Started |
| **Priority** | P3 |
| **Complexity** | L (5) |
| **Sprint** | Phase 9 (iOS) |

**User Story:**
As an iOS user, I want to register using my Apple ID so that I can use Sign in with Apple for privacy and convenience.

**Acceptance Criteria:**
- [ ] "Sign in with Apple" button available
- [ ] Apple OAuth flow initiates correctly
- [ ] Handles Apple's private email relay
- [ ] Account created and user logged in
- [ ] Works on both web and iOS app

**Technical Notes:**
- Required for iOS App Store
- Handle Apple's email hiding feature

---

## 1.2 User Login

### US-1.2.1: Email/Password Login
| Field | Value |
|-------|-------|
| **ID** | US-1.2.1 |
| **Title** | Email/Password Login |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a registered user, I want to log in with my email and password so that I can access my inventory.

**Acceptance Criteria:**
- [ ] Login form with email and password fields
- [ ] Successful login returns JWT token
- [ ] Token stored in localStorage/secure cookie
- [ ] User redirected to dashboard
- [ ] Invalid credentials show error message
- [ ] Account lockout after 5 failed attempts (15 min)
- [ ] "Remember me" option extends token expiry

**Technical Notes:**
- JWT expiry: 30 days default, 90 days with "remember me"
- Implement rate limiting on login endpoint

---

### US-1.2.2: Google OAuth Login
| Field | Value |
|-------|-------|
| **ID** | US-1.2.2 |
| **Title** | Google OAuth Login |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a user with a Google-linked account, I want to log in with Google so that I don't need to remember my password.

**Acceptance Criteria:**
- [ ] "Login with Google" button visible
- [ ] OAuth flow completes successfully
- [ ] Existing account found by Google ID or email
- [ ] JWT token issued and user logged in
- [ ] Error if no matching account found

---

### US-1.2.3: Password Reset
| Field | Value |
|-------|-------|
| **ID** | US-1.2.3 |
| **Title** | Password Reset Flow |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a user who forgot my password, I want to reset it via email so that I can regain access to my account.

**Acceptance Criteria:**
- [ ] "Forgot password" link on login page
- [ ] Enter email to receive reset link
- [ ] Reset email sent with secure token
- [ ] Token expires after 1 hour
- [ ] Reset page allows new password entry
- [ ] Password updated and user can log in
- [ ] Old sessions invalidated

**Technical Notes:**
- Use crypto.randomBytes for token generation
- Store hashed token in database

---

### US-1.2.4: Logout
| Field | Value |
|-------|-------|
| **ID** | US-1.2.4 |
| **Title** | User Logout |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a logged-in user, I want to log out so that I can secure my account when I'm done.

**Acceptance Criteria:**
- [ ] Logout button visible in navigation
- [ ] Clicking clears JWT token
- [ ] User redirected to login page
- [ ] Protected routes no longer accessible
- [ ] Optional: Invalidate token server-side

---

## 1.3 User Profile

### US-1.3.1: View Profile
| Field | Value |
|-------|-------|
| **ID** | US-1.3.1 |
| **Title** | View User Profile |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a user, I want to view my profile so that I can see my account information.

**Acceptance Criteria:**
- [ ] Profile page shows name, email, avatar
- [ ] Shows account creation date
- [ ] Shows subscription tier
- [ ] Shows number of locations/items
- [ ] Navigation to edit profile

---

### US-1.3.2: Edit Profile
| Field | Value |
|-------|-------|
| **ID** | US-1.3.2 |
| **Title** | Edit User Profile |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a user, I want to edit my profile so that I can update my name and avatar.

**Acceptance Criteria:**
- [ ] Edit form with name field
- [ ] Avatar upload (image file)
- [ ] Avatar preview before save
- [ ] Changes saved to database
- [ ] Success confirmation message

---

### US-1.3.3: Change Password
| Field | Value |
|-------|-------|
| **ID** | US-1.3.3 |
| **Title** | Change Password |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a user, I want to change my password so that I can maintain account security.

**Acceptance Criteria:**
- [ ] Requires current password verification
- [ ] New password with confirmation
- [ ] Password complexity validation
- [ ] Success message on change
- [ ] Email notification of password change

---

### US-1.3.4: Delete Account
| Field | Value |
|-------|-------|
| **ID** | US-1.3.4 |
| **Title** | Delete Account |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a user, I want to delete my account so that I can remove all my data from the system.

**Acceptance Criteria:**
- [ ] Delete option in settings
- [ ] Confirmation dialog with warning
- [ ] Requires password re-entry
- [ ] All user data deleted (items, locations, shares)
- [ ] Images deleted from storage
- [ ] Account cannot be recovered
- [ ] User logged out and redirected

---

## 1.4 User Settings

### US-1.4.1: General Settings
| Field | Value |
|-------|-------|
| **ID** | US-1.4.1 |
| **Title** | General Settings Page |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 2 |

**User Story:**
As a user, I want to configure general settings so that I can customize my experience.

**Acceptance Criteria:**
- [ ] Settings page with sections
- [ ] Theme selection (light/dark/system)
- [ ] Default view preference (grid/list/tree)
- [ ] Settings persist across sessions
- [ ] Changes apply immediately

---

### US-1.4.2: Notification Settings
| Field | Value |
|-------|-------|
| **ID** | US-1.4.2 |
| **Title** | Notification Preferences |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a user, I want to configure notification settings so that I receive only the alerts I want.

**Acceptance Criteria:**
- [ ] Toggle for expiration alerts
- [ ] Toggle for low stock alerts
- [ ] Toggle for sharing notifications
- [ ] Email notification preferences
- [ ] Push notification preferences (PWA)

---

---

# EPIC 2: Hierarchical Location Management

## 2.1 Top-Level Locations

### US-2.1.1: Create Top-Level Location
| Field | Value |
|-------|-------|
| **ID** | US-2.1.1 |
| **Title** | Create Top-Level Location |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want to create top-level locations (house, warehouse, storage unit) so that I can organize my inventory by physical property.

**Acceptance Criteria:**
- [ ] "Add Location" button on dashboard
- [ ] Form with name, type selection, description
- [ ] Location type options: House, Warehouse, Storage Unit, Office, Vehicle, Custom
- [ ] Optional address fields for physical locations
- [ ] Optional icon/color selection
- [ ] Location created with user as owner
- [ ] Location appears in location tree

**Technical Notes:**
- parentId = null for top-level
- Initialize path as ",{id},"
- depth = 0

---

### US-2.1.2: View Location Tree
| Field | Value |
|-------|-------|
| **ID** | US-2.1.2 |
| **Title** | View Location Hierarchy |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want to view my locations in a tree structure so that I can see the complete hierarchy.

**Acceptance Criteria:**
- [ ] Tree view showing all locations
- [ ] Expandable/collapsible nodes
- [ ] Shows location type icons
- [ ] Shows item count per location
- [ ] Shows shared locations with indicator
- [ ] Click to navigate to location
- [ ] Drag-drop to move (optional for MVP)

---

### US-2.1.3: Edit Location
| Field | Value |
|-------|-------|
| **ID** | US-2.1.3 |
| **Title** | Edit Location Details |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a location owner, I want to edit location details so that I can update the name, description, or settings.

**Acceptance Criteria:**
- [ ] Edit button on location page
- [ ] Form pre-filled with current values
- [ ] Can update name, description, icon, color
- [ ] Can update address (top-level only)
- [ ] Save updates to database
- [ ] Changes reflected immediately

---

### US-2.1.4: Delete Location
| Field | Value |
|-------|-------|
| **ID** | US-2.1.4 |
| **Title** | Delete Location |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a location owner, I want to delete a location so that I can remove it when no longer needed.

**Acceptance Criteria:**
- [ ] Delete option in location menu
- [ ] Warning if location has items/children
- [ ] Option to move items or delete all
- [ ] Option to move children or delete all
- [ ] Confirmation dialog
- [ ] Cascading delete if confirmed
- [ ] Location removed from tree

**Technical Notes:**
- Update item counts on parent locations
- Delete all shares for location

---

## 2.2 Sub-Locations (Rooms, Areas)

### US-2.2.1: Create Sub-Location
| Field | Value |
|-------|-------|
| **ID** | US-2.2.1 |
| **Title** | Create Sub-Location |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want to create sub-locations within a parent location so that I can organize areas like rooms or zones.

**Acceptance Criteria:**
- [ ] "Add Sub-location" button within parent
- [ ] Form with name, type, description
- [ ] Type suggestions based on parent (e.g., House → Garage, Basement)
- [ ] Position/sort order field
- [ ] Created as child of parent location
- [ ] Inherits accessibility from parent
- [ ] Appears in tree under parent

**Technical Notes:**
- parentId = parent location ID
- path = parent.path + "{id},"
- depth = parent.depth + 1

---

### US-2.2.2: View Sub-Location Path
| Field | Value |
|-------|-------|
| **ID** | US-2.2.2 |
| **Title** | View Location Breadcrumb Path |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want to see the full path to a location so that I know exactly where it is in the hierarchy.

**Acceptance Criteria:**
- [ ] Breadcrumb navigation showing full path
- [ ] Format: "My House > Garage > Tool Chest > Drawer 3"
- [ ] Each segment is clickable
- [ ] Clicking navigates to that location
- [ ] Works at any depth level

---

### US-2.2.3: Move Location
| Field | Value |
|-------|-------|
| **ID** | US-2.2.3 |
| **Title** | Move Location to Different Parent |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | L (5) |
| **Sprint** | Phase 2, Week 7 |

**User Story:**
As a user, I want to move a location to a different parent so that I can reorganize my hierarchy.

**Acceptance Criteria:**
- [ ] Move option in location menu
- [ ] Tree picker to select new parent
- [ ] Cannot move to own descendant
- [ ] Updates path for location and all descendants
- [ ] Updates depth for all affected locations
- [ ] Item counts updated on old/new parents
- [ ] Confirmation before move

**Technical Notes:**
- Requires recursive path update
- Use MongoDB bulk operations

---

## 2.3 Storage Containers

### US-2.3.1: Create Storage Container
| Field | Value |
|-------|-------|
| **ID** | US-2.3.1 |
| **Title** | Create Storage Container |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want to create storage containers (bins, cabinets, shelves) so that I can track where items are stored.

**Acceptance Criteria:**
- [ ] Add container within room/area
- [ ] Container types: Drawer Cabinet, Shelving, Bin Rack, Tool Chest, etc.
- [ ] Capacity configuration (slots, unlimited)
- [ ] Position labels (Drawer 1, Shelf A, Bin 3)
- [ ] Created as child of parent
- [ ] Shows capacity usage

---

### US-2.3.2: Configure Container Capacity
| Field | Value |
|-------|-------|
| **ID** | US-2.3.2 |
| **Title** | Set Container Capacity |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want to set capacity for containers so that I can see how full they are.

**Acceptance Criteria:**
- [ ] Capacity type selection (unlimited, slots, volume)
- [ ] Max capacity input
- [ ] Unit selection (items, bins, cubic inches)
- [ ] Current usage calculated from items
- [ ] Visual capacity indicator (progress bar)
- [ ] Warning when near/at capacity

---

### US-2.3.3: View Container Contents
| Field | Value |
|-------|-------|
| **ID** | US-2.3.3 |
| **Title** | View Items in Container |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want to view all items in a container so that I can see what's stored there.

**Acceptance Criteria:**
- [ ] Item list/grid for selected container
- [ ] Shows item images, names, quantities
- [ ] Filter and sort options
- [ ] Quick actions (edit, move, delete)
- [ ] Empty state with "Add Item" prompt

---

## 2.4 Location Types

### US-2.4.1: System Location Types
| Field | Value |
|-------|-------|
| **ID** | US-2.4.1 |
| **Title** | Default Location Types |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 3 |

**User Story:**
As a user, I want pre-defined location types so that I can quickly set up my hierarchy with common options.

**Acceptance Criteria:**
- [ ] Property types: House, Warehouse, Storage Unit, Office, Vehicle
- [ ] Room types: Garage, Basement, Attic, Kitchen, Bedroom, Workshop, Shed
- [ ] Warehouse zones: Inbound, Staging, Racking, Floor, Outbound
- [ ] Container types: Drawer Cabinet, Shelving, Bin Rack, Tool Chest, Pegboard, etc.
- [ ] Each type has icon, suggested children, default capacity
- [ ] Seeded on database initialization

---

### US-2.4.2: Custom Location Types
| Field | Value |
|-------|-------|
| **ID** | US-2.4.2 |
| **Title** | Create Custom Location Types |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to create custom location types so that I can define types specific to my needs.

**Acceptance Criteria:**
- [ ] "Create Type" option in settings
- [ ] Name, icon, category (property/room/container)
- [ ] Suggested sub-types configuration
- [ ] Default capacity settings
- [ ] Custom type appears in type selection
- [ ] Can edit/delete custom types

---

---

# EPIC 3: Location Sharing & Permissions

## 3.1 Invite Users

### US-3.1.1: Invite User by Email
| Field | Value |
|-------|-------|
| **ID** | US-3.1.1 |
| **Title** | Invite User to Location |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | L (5) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a location owner, I want to invite other users to my location so that they can view or manage the inventory.

**Acceptance Criteria:**
- [ ] "Share" button on location page
- [ ] Enter email address of invitee
- [ ] Select permission level (Viewer, Contributor, Editor, Manager)
- [ ] Option to include sub-locations
- [ ] Invitation email sent with link
- [ ] Invitation stored as pending
- [ ] Invitee can accept without existing account

**Technical Notes:**
- Generate secure invite token
- Token expires in 7 days
- If invitee has no account, prompt registration on accept

---

### US-3.1.2: Accept Invitation
| Field | Value |
|-------|-------|
| **ID** | US-3.1.2 |
| **Title** | Accept Location Invitation |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As an invited user, I want to accept an invitation so that I can access the shared location.

**Acceptance Criteria:**
- [ ] Invitation link opens acceptance page
- [ ] Shows location name and permission level
- [ ] "Accept" button for logged-in users
- [ ] Prompts login/register if not logged in
- [ ] Share record updated to accepted
- [ ] Location appears in user's "Shared with Me"
- [ ] Confirmation message shown

---

### US-3.1.3: Decline Invitation
| Field | Value |
|-------|-------|
| **ID** | US-3.1.3 |
| **Title** | Decline Location Invitation |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As an invited user, I want to decline an invitation so that I don't see unwanted locations.

**Acceptance Criteria:**
- [ ] "Decline" button on invitation page
- [ ] Share record marked as declined
- [ ] Inviter can see declined status
- [ ] Location does not appear for invitee

---

### US-3.1.4: Share Link Generation
| Field | Value |
|-------|-------|
| **ID** | US-3.1.4 |
| **Title** | Generate Shareable Link |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a location owner, I want to generate a shareable link so that anyone with the link can join.

**Acceptance Criteria:**
- [ ] "Get Shareable Link" option
- [ ] Select permission level for link
- [ ] Generate unique URL
- [ ] Option to set expiry date
- [ ] Option to limit number of uses
- [ ] Copy link to clipboard
- [ ] Can revoke/regenerate link

---

## 3.2 Manage Permissions

### US-3.2.1: View Location Members
| Field | Value |
|-------|-------|
| **ID** | US-3.2.1 |
| **Title** | View Location Members |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a location manager, I want to see all members with access so that I can manage permissions.

**Acceptance Criteria:**
- [ ] Members list on share settings page
- [ ] Shows name, email, permission level
- [ ] Shows pending invitations
- [ ] Shows how access was granted (direct, inherited)
- [ ] Filter by permission level

---

### US-3.2.2: Change User Permission
| Field | Value |
|-------|-------|
| **ID** | US-3.2.2 |
| **Title** | Modify User Permission |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a location manager, I want to change a user's permission level so that I can adjust their access.

**Acceptance Criteria:**
- [ ] Permission dropdown for each member
- [ ] Options: Viewer, Contributor, Editor, Manager
- [ ] Confirmation before changing
- [ ] Changes take effect immediately
- [ ] Cannot demote self below Manager
- [ ] Notification to affected user (optional)

---

### US-3.2.3: Revoke Access
| Field | Value |
|-------|-------|
| **ID** | US-3.2.3 |
| **Title** | Revoke User Access |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a location manager, I want to revoke a user's access so that they can no longer see the location.

**Acceptance Criteria:**
- [ ] "Remove" button for each member
- [ ] Confirmation dialog
- [ ] Share record marked as revoked
- [ ] Location removed from user's view
- [ ] User's items remain (owned by them)
- [ ] Notification to removed user (optional)

---

### US-3.2.4: Permission Inheritance
| Field | Value |
|-------|-------|
| **ID** | US-3.2.4 |
| **Title** | Inherit Permissions to Children |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a location manager, I want permissions to inherit to sub-locations so that I don't have to share each one individually.

**Acceptance Criteria:**
- [ ] "Include sub-locations" toggle when sharing
- [ ] If enabled, user can access all descendants
- [ ] Inherited access shown differently than direct
- [ ] Can override inherited permission at sub-level
- [ ] Revoking parent access removes inherited access

**Technical Notes:**
- Permission check walks up the tree if no direct share
- Store inheritToChildren flag on share record

---

### US-3.2.5: Transfer Ownership
| Field | Value |
|-------|-------|
| **ID** | US-3.2.5 |
| **Title** | Transfer Location Ownership |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a location owner, I want to transfer ownership so that another user becomes the owner.

**Acceptance Criteria:**
- [ ] "Transfer Ownership" option in settings
- [ ] Select existing member as new owner
- [ ] Confirmation with warning
- [ ] Old owner becomes Manager
- [ ] New owner has full control
- [ ] All sub-locations transferred

---

## 3.3 Shared Locations View

### US-3.3.1: View Shared With Me
| Field | Value |
|-------|-------|
| **ID** | US-3.3.1 |
| **Title** | View Locations Shared With Me |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a user, I want to see locations shared with me so that I can access them easily.

**Acceptance Criteria:**
- [ ] "Shared with Me" section on dashboard
- [ ] Lists all accepted shared locations
- [ ] Shows owner name and permission level
- [ ] Click to navigate to location
- [ ] Pending invitations shown separately

---

### US-3.3.2: Leave Shared Location
| Field | Value |
|-------|-------|
| **ID** | US-3.3.2 |
| **Title** | Leave Shared Location |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 1, Week 4 |

**User Story:**
As a shared member, I want to leave a shared location so that it no longer appears in my account.

**Acceptance Criteria:**
- [ ] "Leave" option in shared location menu
- [ ] Confirmation dialog
- [ ] Share record updated
- [ ] Location removed from user's view
- [ ] Owner notified (optional)

---

---

# EPIC 4: Item Management

## 4.1 Basic Item CRUD

### US-4.1.1: Create Item Manually
| Field | Value |
|-------|-------|
| **ID** | US-4.1.1 |
| **Title** | Add Item Manually |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to manually add items so that I can inventory items without scanning.

**Acceptance Criteria:**
- [ ] "Add Item" button in location view
- [ ] Form with: name, description, category, quantity
- [ ] Optional: brand, model, size, tags
- [ ] Optional: image upload
- [ ] Position within container
- [ ] Item saved to database
- [ ] Location item count updated

---

### US-4.1.2: View Item Details
| Field | Value |
|-------|-------|
| **ID** | US-4.1.2 |
| **Title** | View Item Details |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to view item details so that I can see all information about an item.

**Acceptance Criteria:**
- [ ] Click item to open detail view
- [ ] Shows all item fields
- [ ] Shows primary image and gallery
- [ ] Shows location path
- [ ] Shows creation/update dates
- [ ] Shows AI identification data (if any)
- [ ] Edit and delete buttons (with permission)

---

### US-4.1.3: Edit Item
| Field | Value |
|-------|-------|
| **ID** | US-4.1.3 |
| **Title** | Edit Item Details |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user with edit permission, I want to update item details so that I can correct or enhance information.

**Acceptance Criteria:**
- [ ] Edit button on item detail page
- [ ] Form pre-filled with current values
- [ ] Can update all editable fields
- [ ] Can add/remove images
- [ ] Save updates to database
- [ ] Update timestamp recorded

---

### US-4.1.4: Delete Item
| Field | Value |
|-------|-------|
| **ID** | US-4.1.4 |
| **Title** | Delete Item |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user with delete permission, I want to delete an item so that I can remove it from inventory.

**Acceptance Criteria:**
- [ ] Delete button on item detail/card
- [ ] Confirmation dialog
- [ ] Soft delete (mark inactive) or hard delete
- [ ] Images cleaned up
- [ ] Location item count updated
- [ ] Activity log entry created

---

### US-4.1.5: Move Item
| Field | Value |
|-------|-------|
| **ID** | US-4.1.5 |
| **Title** | Move Item to Different Location |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 2, Week 7 |

**User Story:**
As a user, I want to move an item to a different location so that I can update its physical position.

**Acceptance Criteria:**
- [ ] "Move" option in item menu
- [ ] Location tree picker
- [ ] Select new position within location
- [ ] Update item's locationId and position
- [ ] Update counts on old/new locations
- [ ] Add entry to locationHistory
- [ ] Confirmation message

---

### US-4.1.6: Duplicate Item
| Field | Value |
|-------|-------|
| **ID** | US-4.1.6 |
| **Title** | Duplicate Item |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 7 |

**User Story:**
As a user, I want to duplicate an item so that I can quickly add similar items.

**Acceptance Criteria:**
- [ ] "Duplicate" option in item menu
- [ ] Opens edit form with copied data
- [ ] User can modify before saving
- [ ] New item created with new ID
- [ ] Same or different location

---

## 4.2 Item Categorization

### US-4.2.1: Assign Category
| Field | Value |
|-------|-------|
| **ID** | US-4.2.1 |
| **Title** | Assign Category to Item |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to assign a category to items so that I can organize them by type.

**Acceptance Criteria:**
- [ ] Category dropdown in item form
- [ ] Hierarchical category selection
- [ ] Subcategory selection based on parent
- [ ] Can change category at any time
- [ ] Category filter in item lists

---

### US-4.2.2: Assign Item Type
| Field | Value |
|-------|-------|
| **ID** | US-4.2.2 |
| **Title** | Assign Item Type |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to designate item types (tool, supply, part, consumable) so that I can track usage patterns.

**Acceptance Criteria:**
- [ ] Item type field in form
- [ ] Options: Tool, Supply, Part, Consumable, Equipment
- [ ] Type affects available fields (consumables have expiration)
- [ ] Type filter in searches

---

### US-4.2.3: Add Tags
| Field | Value |
|-------|-------|
| **ID** | US-4.2.3 |
| **Title** | Add Tags to Item |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to add tags to items so that I can create custom groupings.

**Acceptance Criteria:**
- [ ] Tag input field (multi-select, autocomplete)
- [ ] Suggest existing tags
- [ ] Create new tags on the fly
- [ ] Remove tags easily
- [ ] Filter by tags in search

---

### US-4.2.4: View Default Categories
| Field | Value |
|-------|-------|
| **ID** | US-4.2.4 |
| **Title** | System Default Categories |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want pre-defined categories so that I can quickly categorize common items.

**Acceptance Criteria:**
- [ ] Categories seeded: Tools, Hardware, Plumbing, Electrical, Building Materials, Paint, Safety, Automotive, Garden, Food, Household, Electronics
- [ ] Each has subcategories
- [ ] Each has appropriate icon
- [ ] Food category has special handling

---

### US-4.2.5: Create Custom Category
| Field | Value |
|-------|-------|
| **ID** | US-4.2.5 |
| **Title** | Create Custom Category |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to create custom categories so that I can organize items my way.

**Acceptance Criteria:**
- [ ] "Add Category" option in settings
- [ ] Name, icon, color, parent category
- [ ] Custom categories appear in selection
- [ ] Can edit/delete custom categories
- [ ] Deleting moves items to "Uncategorized"

---

## 4.3 Item Value Tracking

### US-4.3.1: Enter Purchase Info
| Field | Value |
|-------|-------|
| **ID** | US-4.3.1 |
| **Title** | Record Purchase Information |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 6 |

**User Story:**
As a user, I want to record purchase information so that I can track what I paid.

**Acceptance Criteria:**
- [ ] Purchase price field
- [ ] Purchase date field
- [ ] Vendor/store field
- [ ] Receipt image upload (optional)
- [ ] Currency selection

---

### US-4.3.2: Set Current Value
| Field | Value |
|-------|-------|
| **ID** | US-4.3.2 |
| **Title** | Set Item Current Value |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 2, Week 6 |

**User Story:**
As a user, I want to set current value so that I can track depreciation or appreciation.

**Acceptance Criteria:**
- [ ] Current value field
- [ ] Defaults to purchase price if set
- [ ] Can update anytime
- [ ] Value history tracking (optional)

---

### US-4.3.3: AI Value Estimation
| Field | Value |
|-------|-------|
| **ID** | US-4.3.3 |
| **Title** | AI Estimated Value |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want the AI to estimate item value so that I have a reference point.

**Acceptance Criteria:**
- [ ] During AI identification, estimate value
- [ ] Shows range (e.g., "$50-100")
- [ ] Based on item type, brand, condition
- [ ] User can accept or override
- [ ] Stored separately from user-entered value

---

### US-4.3.4: View Inventory Value Report
| Field | Value |
|-------|-------|
| **ID** | US-4.3.4 |
| **Title** | Total Inventory Value |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a user, I want to see total inventory value so that I can understand my asset worth.

**Acceptance Criteria:**
- [ ] Total value dashboard widget
- [ ] Value by location breakdown
- [ ] Value by category breakdown
- [ ] Use currentValue, fall back to purchasePrice
- [ ] Export value report

---

## 4.4 Item Quantities

### US-4.4.1: Set Item Quantity
| Field | Value |
|-------|-------|
| **ID** | US-4.4.1 |
| **Title** | Set Item Quantity |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to set item quantities so that I can track how many I have.

**Acceptance Criteria:**
- [ ] Quantity field (default 1)
- [ ] Unit selection (each, box, lb, oz, etc.)
- [ ] Quick increment/decrement buttons
- [ ] Cannot be negative

---

### US-4.4.2: Set Minimum Quantity Alert
| Field | Value |
|-------|-------|
| **ID** | US-4.4.2 |
| **Title** | Low Stock Alert Threshold |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 6 |

**User Story:**
As a user, I want to set minimum quantities so that I'm alerted when stock is low.

**Acceptance Criteria:**
- [ ] Minimum quantity field
- [ ] If quantity <= min, show warning
- [ ] Low stock items on dashboard
- [ ] Optional notification

---

### US-4.4.3: Adjust Quantity
| Field | Value |
|-------|-------|
| **ID** | US-4.4.3 |
| **Title** | Quick Quantity Adjustment |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to quickly adjust quantities so that I can track usage.

**Acceptance Criteria:**
- [ ] +/- buttons on item card
- [ ] Quick quantity input
- [ ] Reason for adjustment (optional)
- [ ] Activity log entry

---

### US-4.4.4: Mark Item Consumed
| Field | Value |
|-------|-------|
| **ID** | US-4.4.4 |
| **Title** | Mark Consumable as Used |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 6 |

**User Story:**
As a user, I want to mark consumables as used so that they're removed from active inventory.

**Acceptance Criteria:**
- [ ] "Mark as Consumed" button for consumables
- [ ] Decrements quantity or marks inactive
- [ ] consumedAt timestamp recorded
- [ ] Can undo within 24 hours
- [ ] Shows in consumed items history

---

## 4.5 Item Images

### US-4.5.1: Upload Item Image
| Field | Value |
|-------|-------|
| **ID** | US-4.5.1 |
| **Title** | Upload Item Image |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 8 |

**User Story:**
As a user, I want to upload images of items so that I can identify them visually.

**Acceptance Criteria:**
- [ ] Image upload in item form
- [ ] Drag-drop or file picker
- [ ] Image preview before save
- [ ] Multiple images per item
- [ ] Mark one as primary
- [ ] Image compression (max 1024px)
- [ ] Thumbnail generation

---

### US-4.5.2: Capture Image from Camera
| Field | Value |
|-------|-------|
| **ID** | US-4.5.2 |
| **Title** | Camera Capture for Items |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 8 |

**User Story:**
As a user, I want to capture images with my camera so that I can quickly photograph items.

**Acceptance Criteria:**
- [ ] Camera button in image section
- [ ] Opens device camera (or webcam)
- [ ] Preview captured image
- [ ] Retake option
- [ ] Use captured image for item
- [ ] Works on mobile and desktop

**Technical Notes:**
- Use navigator.mediaDevices.getUserMedia()
- Request camera permission

---

### US-4.5.3: View Image Gallery
| Field | Value |
|-------|-------|
| **ID** | US-4.5.3 |
| **Title** | View Item Image Gallery |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 3, Week 8 |

**User Story:**
As a user, I want to view all images for an item so that I can see it from different angles.

**Acceptance Criteria:**
- [ ] Gallery view on item detail page
- [ ] Click to enlarge/lightbox
- [ ] Navigate between images
- [ ] Set primary image
- [ ] Delete images

---

## 4.6 Alternate Names

### US-4.6.1: Add Alternate Names
| Field | Value |
|-------|-------|
| **ID** | US-4.6.1 |
| **Title** | Add Item Alternate Names |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 2, Week 5 |

**User Story:**
As a user, I want to add alternate names so that I can find items by different terms.

**Acceptance Criteria:**
- [ ] Alternate names field (multi-input)
- [ ] Add multiple alternate names
- [ ] Search includes alternate names
- [ ] AI suggestions for common alternates
- [ ] Remove alternate names easily

---

---

# EPIC 5: AI Image Recognition

## 5.1 Camera & Image Capture

### US-5.1.1: Access Device Camera
| Field | Value |
|-------|-------|
| **ID** | US-5.1.1 |
| **Title** | Access Camera for Scanning |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 8 |

**User Story:**
As a user, I want to access my camera so that I can scan items for identification.

**Acceptance Criteria:**
- [ ] "Scan Item" button on main navigation
- [ ] Requests camera permission
- [ ] Opens camera view
- [ ] Works with front/back camera (mobile)
- [ ] Works with webcam (desktop)
- [ ] Clear permission denied message
- [ ] Camera settings (resolution, facing)

---

### US-5.1.2: Capture Single Item
| Field | Value |
|-------|-------|
| **ID** | US-5.1.2 |
| **Title** | Capture Single Item Image |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 3, Week 8 |

**User Story:**
As a user, I want to capture a photo of an item so that I can have it identified.

**Acceptance Criteria:**
- [ ] Capture button in camera view
- [ ] Image preview after capture
- [ ] Retake option
- [ ] Use photo option
- [ ] Photo sent for identification
- [ ] Loading indicator during processing

---

### US-5.1.3: Capture Multiple Items
| Field | Value |
|-------|-------|
| **ID** | US-5.1.3 |
| **Title** | Capture Multiple Items at Once |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want to capture multiple items in one photo so that I can quickly inventory several items.

**Acceptance Criteria:**
- [ ] "Multi-item" mode option
- [ ] Capture photo of 5-10 items
- [ ] AI detects each item separately
- [ ] Shows grid with each identified item
- [ ] Can confirm/edit each item
- [ ] Add all or selected to inventory

---

## 5.2 AI Identification

### US-5.2.1: Single Item Identification
| Field | Value |
|-------|-------|
| **ID** | US-5.2.1 |
| **Title** | AI Identify Single Item |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | L (5) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want the AI to identify an item from a photo so that I don't have to manually enter details.

**Acceptance Criteria:**
- [ ] Send image to Claude Vision API
- [ ] Receive identification with confidence score
- [ ] Show primary name and description
- [ ] Show category suggestion
- [ ] Show alternate names
- [ ] Processing time < 3 seconds
- [ ] Graceful error handling

**Technical Notes:**
- Use claude-3-5-sonnet-20241022 with vision
- Implement structured prompt for consistent output
- Parse JSON response

---

### US-5.2.2: Top N Guesses Display
| Field | Value |
|-------|-------|
| **ID** | US-5.2.2 |
| **Title** | Show Top Identification Guesses |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want to see the top 3-5 guesses so that I can select the correct identification.

**Acceptance Criteria:**
- [ ] Display top 3-5 guesses with confidence
- [ ] Primary guess highlighted
- [ ] User can select correct guess
- [ ] Selected guess used for item name
- [ ] "None of these" option for manual entry

---

### US-5.2.3: Multi-Item Detection
| Field | Value |
|-------|-------|
| **ID** | US-5.2.3 |
| **Title** | Detect Multiple Items in Image |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | L (5) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want the AI to detect multiple items in one photo so that I can catalog several items at once.

**Acceptance Criteria:**
- [ ] AI prompt requests multi-item detection
- [ ] Response includes array of items
- [ ] Each item has name, category, count, confidence
- [ ] UI shows each item separately
- [ ] User can confirm/edit each
- [ ] Estimated count for identical items

---

### US-5.2.4: Quantity Estimation
| Field | Value |
|-------|-------|
| **ID** | US-5.2.4 |
| **Title** | Estimate Quantity of Items |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want the AI to estimate quantity when multiple identical items are visible.

**Acceptance Criteria:**
- [ ] AI estimates count for identical items
- [ ] Shows "Estimated: 5 items" with confidence
- [ ] User can adjust quantity
- [ ] Works for screws, bolts, similar items

---

### US-5.2.5: Item Condition Assessment
| Field | Value |
|-------|-------|
| **ID** | US-5.2.5 |
| **Title** | AI Assess Item Condition |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want the AI to assess item condition so that I have an objective rating.

**Acceptance Criteria:**
- [ ] AI assesses: New, Good, Fair, Poor
- [ ] Based on visible wear, rust, damage
- [ ] Condition shown with identification
- [ ] User can override assessment

---

### US-5.2.6: Value Estimation
| Field | Value |
|-------|-------|
| **ID** | US-5.2.6 |
| **Title** | AI Estimate Item Value |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want the AI to estimate value so that I have a reference for item worth.

**Acceptance Criteria:**
- [ ] AI estimates value range ($50-100)
- [ ] Based on item type, brand, condition
- [ ] Shown as "AI Estimated" value
- [ ] User can accept or enter own value
- [ ] Note: estimate only, not definitive

---

## 5.3 Confirmation & Saving

### US-5.3.1: Confirm Identification
| Field | Value |
|-------|-------|
| **ID** | US-5.3.1 |
| **Title** | Confirm AI Identification |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want to confirm or edit the AI identification so that correct information is saved.

**Acceptance Criteria:**
- [ ] Identification results shown for review
- [ ] All fields editable
- [ ] "Confirm" button to accept
- [ ] Quick edit for common changes
- [ ] Must select location before saving

---

### US-5.3.2: Select Storage Location
| Field | Value |
|-------|-------|
| **ID** | US-5.3.2 |
| **Title** | Select Storage Location for Scanned Item |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want to select where to store the item so that it's added to the correct location.

**Acceptance Criteria:**
- [ ] Location picker after identification
- [ ] Tree navigation of locations
- [ ] Recently used locations
- [ ] Favorite locations
- [ ] Position within location (optional)

---

### US-5.3.3: Quick Scan Loop
| Field | Value |
|-------|-------|
| **ID** | US-5.3.3 |
| **Title** | Continuous Scanning Mode |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 9 |

**User Story:**
As a user, I want to quickly scan multiple items in a row so that I can inventory efficiently.

**Acceptance Criteria:**
- [ ] After saving, option to "Scan Another"
- [ ] Camera stays active
- [ ] Remember last used location
- [ ] Counter shows items scanned
- [ ] "Done" button to exit loop

---

---

# EPIC 6: UPC & Barcode Scanning

## 6.1 Barcode Scanning

### US-6.1.1: Scan UPC Barcode
| Field | Value |
|-------|-------|
| **ID** | US-6.1.1 |
| **Title** | Scan UPC/Barcode |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 10 |

**User Story:**
As a user, I want to scan product barcodes so that I can automatically get product details.

**Acceptance Criteria:**
- [ ] "Scan Barcode" mode in camera
- [ ] Detects UPC, EAN, Code128 barcodes
- [ ] Visual indicator when barcode detected
- [ ] Automatic capture on detection
- [ ] Works in various lighting conditions

**Technical Notes:**
- Use QuaggaJS for web barcode detection
- Native barcode scanner for iOS

---

### US-6.1.2: UPC Database Lookup
| Field | Value |
|-------|-------|
| **ID** | US-6.1.2 |
| **Title** | Lookup Product by UPC |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 3, Week 10 |

**User Story:**
As a user, I want the system to look up product details by UPC so that I don't have to enter them manually.

**Acceptance Criteria:**
- [ ] Query Open Food Facts API with UPC
- [ ] Retrieve: product name, brand, description, image
- [ ] For food: nutrition info, allergens
- [ ] Cache results in local database
- [ ] Fallback to AI if not found in database

**Technical Notes:**
- Open Food Facts API is free and open
- Consider UPCitemdb as secondary source
- Cache with 30-day expiry

---

### US-6.1.3: Manual UPC Entry
| Field | Value |
|-------|-------|
| **ID** | US-6.1.3 |
| **Title** | Manual UPC Entry |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 3, Week 10 |

**User Story:**
As a user, I want to manually enter a UPC code so that I can look up products when scanning fails.

**Acceptance Criteria:**
- [ ] UPC input field option
- [ ] Numeric keyboard on mobile
- [ ] Lookup triggers on complete UPC
- [ ] Same lookup process as scanned

---

### US-6.1.4: UPC Not Found Handling
| Field | Value |
|-------|-------|
| **ID** | US-6.1.4 |
| **Title** | Handle UPC Not Found |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 3, Week 10 |

**User Story:**
As a user, I want clear options when a UPC isn't found so that I can still add the item.

**Acceptance Criteria:**
- [ ] "Not found in database" message
- [ ] Option to use AI identification instead
- [ ] Option to enter details manually
- [ ] Option to skip and save basic record
- [ ] Option to contribute to database (future)

---

---

# EPIC 7: Food & Perishable Tracking

## 7.1 Expiration Date Entry

### US-7.1.1: Enter Printed Expiration Date
| Field | Value |
|-------|-------|
| **ID** | US-7.1.1 |
| **Title** | Enter Package Expiration Date |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 11 |

**User Story:**
As a user, I want to enter the expiration date printed on packages so that I can track when items expire.

**Acceptance Criteria:**
- [ ] Date picker for expiration date
- [ ] Only shows for perishable items
- [ ] Accepts various date formats
- [ ] Optional field
- [ ] Shows days until expiration

---

### US-7.1.2: Enter Extended Expiration Date
| Field | Value |
|-------|-------|
| **ID** | US-7.1.2 |
| **Title** | Enter Extended Use-By Date |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 11 |

**User Story:**
As a user, I want to enter an extended expiration date so that I can track when I'm actually comfortable using the item.

**Acceptance Criteria:**
- [ ] Secondary date field
- [ ] Must be same or after printed date
- [ ] Explanation: "When are you comfortable using this?"
- [ ] Used for personal tracking
- [ ] Overrides printed date for alerts

---

### US-7.1.3: OCR Expiration Date
| Field | Value |
|-------|-------|
| **ID** | US-7.1.3 |
| **Title** | Read Expiration Date from Image |
| **Status** | ⬜ Not Started |
| **Priority** | P3 |
| **Complexity** | L (5) |
| **Sprint** | Phase 4, Week 12 |

**User Story:**
As a user, I want the system to read expiration dates from package photos so that I don't have to type them.

**Acceptance Criteria:**
- [ ] AI attempts to read date from image
- [ ] Supports common date formats
- [ ] Shows detected date for confirmation
- [ ] User can correct if wrong
- [ ] Optional feature (not blocking)

---

## 7.2 Color-Coded Expiration System

### US-7.2.1: Configure Expiration Period
| Field | Value |
|-------|-------|
| **ID** | US-7.2.1 |
| **Title** | Set Expiration Period Type |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 4, Week 11 |

**User Story:**
As a user, I want to configure my expiration period (monthly, quarterly) so that the color system matches my preference.

**Acceptance Criteria:**
- [ ] Period selection in settings
- [ ] Options: Monthly, Quarterly, Semi-Annual, Annual, Custom
- [ ] Start date selection
- [ ] Period preview showing date ranges
- [ ] Changes apply to new items

---

### US-7.2.2: Configure Color Scheme
| Field | Value |
|-------|-------|
| **ID** | US-7.2.2 |
| **Title** | Set Expiration Colors |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 4, Week 11 |

**User Story:**
As a user, I want to set colors for each period so that they match my sticker colors.

**Acceptance Criteria:**
- [ ] 6-color scheme configuration
- [ ] Color picker for each period
- [ ] Color name field (Blue, Red, etc.)
- [ ] Preview of color sequence
- [ ] Reset to default option
- [ ] Accessibility patterns option

---

### US-7.2.3: View Current Period
| Field | Value |
|-------|-------|
| **ID** | US-7.2.3 |
| **Title** | See Current Period and Color |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 11 |

**User Story:**
As a user, I want to see the current period and color so that I know which stickers are expired.

**Acceptance Criteria:**
- [ ] Dashboard widget showing current period
- [ ] Shows: "Current: Q4 2024 - Orange"
- [ ] Shows date range of current period
- [ ] Shows previous periods as "EXPIRED"
- [ ] Visual color indicator

---

### US-7.2.4: View Color Schedule
| Field | Value |
|-------|-------|
| **ID** | US-7.2.4 |
| **Title** | View Full Color Schedule |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 11 |

**User Story:**
As a user, I want to see the full color schedule so that I know which color to use for future items.

**Acceptance Criteria:**
- [ ] Table showing next 6-8 periods
- [ ] Shows: Period, Date Range, Color, Status
- [ ] Status: Expired, Current, Fresh
- [ ] Expired periods highlighted
- [ ] Printable format option

---

### US-7.2.5: Assign Expiration Color to Item
| Field | Value |
|-------|-------|
| **ID** | US-7.2.5 |
| **Title** | Assign Expiration Color When Storing |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 4, Week 12 |

**User Story:**
As a user, I want to select which period to assign to an item so that I know which color sticker to apply.

**Acceptance Criteria:**
- [ ] Color period selector for perishable items
- [ ] Shows color swatch and period name
- [ ] Shows target date range
- [ ] "Apply [Color] sticker" instruction
- [ ] Saves period and color to item record
- [ ] Quick selection for common periods (current +1, +2)

---

### US-7.2.6: View Items by Expiration Color
| Field | Value |
|-------|-------|
| **ID** | US-7.2.6 |
| **Title** | Filter Items by Expiration Color |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 12 |

**User Story:**
As a user, I want to filter items by their expiration color so that I can find items that need to be used.

**Acceptance Criteria:**
- [ ] Filter by: All, Expired, Current, Fresh
- [ ] Filter by specific color
- [ ] Shows count per color/status
- [ ] Sorted by age within filter
- [ ] Works across all locations

---

## 7.3 Expiration Dashboard

### US-7.3.1: Expiration Overview Widget
| Field | Value |
|-------|-------|
| **ID** | US-7.3.1 |
| **Title** | Expiration Dashboard Widget |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 4, Week 13 |

**User Story:**
As a user, I want a dashboard widget showing expiration status so that I can quickly see what needs attention.

**Acceptance Criteria:**
- [ ] Widget on main dashboard
- [ ] Shows: Expired count, Expiring Soon count, Fresh count
- [ ] Color-coded sections
- [ ] Click to drill down to items
- [ ] Updates in real-time

---

### US-7.3.2: Expired Items List
| Field | Value |
|-------|-------|
| **ID** | US-7.3.2 |
| **Title** | View All Expired Items |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 13 |

**User Story:**
As a user, I want to see all expired items so that I can use or discard them.

**Acceptance Criteria:**
- [ ] List of all items past expiration
- [ ] Shows: Name, location, how long expired
- [ ] Grouped by period
- [ ] Quick actions: Mark consumed, Discard, Extend
- [ ] Warning about oldest items

---

### US-7.3.3: Expiring Soon List
| Field | Value |
|-------|-------|
| **ID** | US-7.3.3 |
| **Title** | View Items Expiring Soon |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 13 |

**User Story:**
As a user, I want to see items expiring in the current period so that I can prioritize using them.

**Acceptance Criteria:**
- [ ] List of items in current period
- [ ] Shows: Name, location, days remaining
- [ ] Sorted by urgency
- [ ] "Use first" recommendations
- [ ] Quick actions available

---

### US-7.3.4: Expiration Alerts
| Field | Value |
|-------|-------|
| **ID** | US-7.3.4 |
| **Title** | Expiration Notifications |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 4, Week 13 |

**User Story:**
As a user, I want notifications when items are expiring so that I don't forget about them.

**Acceptance Criteria:**
- [ ] Configurable alert timing (start of period, weekly)
- [ ] Push notification (PWA)
- [ ] Email digest option
- [ ] Shows count of expiring items
- [ ] Link to expiring items list

---

## 7.4 Food-Specific Features

### US-7.4.1: Storage Type (Pantry/Fridge/Freezer)
| Field | Value |
|-------|-------|
| **ID** | US-7.4.1 |
| **Title** | Food Storage Type |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 4, Week 12 |

**User Story:**
As a user, I want to specify storage type (pantry, refrigerated, frozen) so that I know where food should be stored.

**Acceptance Criteria:**
- [ ] Storage type field for food items
- [ ] Options: Pantry, Refrigerated, Frozen
- [ ] Affects typical shelf life calculations
- [ ] Filter by storage type
- [ ] Auto-suggest based on category

---

### US-7.4.2: Nutrition Information
| Field | Value |
|-------|-------|
| **ID** | US-7.4.2 |
| **Title** | Store Nutrition Information |
| **Status** | ⬜ Not Started |
| **Priority** | P3 |
| **Complexity** | M (3) |
| **Sprint** | Phase 4, Week 12 |

**User Story:**
As a user, I want to see nutrition information for food items so that I can make informed choices.

**Acceptance Criteria:**
- [ ] Nutrition panel display
- [ ] Data from UPC database
- [ ] Calories, fat, carbs, protein, sodium
- [ ] Serving size info
- [ ] View only (not editable)

---

### US-7.4.3: Allergen Tracking
| Field | Value |
|-------|-------|
| **ID** | US-7.4.3 |
| **Title** | Track Food Allergens |
| **Status** | ⬜ Not Started |
| **Priority** | P3 |
| **Complexity** | S (2) |
| **Sprint** | Phase 4, Week 12 |

**User Story:**
As a user, I want to see allergens in food items so that I can avoid unsafe foods.

**Acceptance Criteria:**
- [ ] Allergen tags on food items
- [ ] Data from UPC database
- [ ] Common allergens highlighted
- [ ] Filter by allergen-free
- [ ] Allergen warnings

---

### US-7.4.4: Color-Blind Accessibility
| Field | Value |
|-------|-------|
| **ID** | US-7.4.4 |
| **Title** | Expiration Patterns for Color-Blind |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 4, Week 13 |

**User Story:**
As a color-blind user, I want patterns in addition to colors so that I can distinguish expiration periods.

**Acceptance Criteria:**
- [ ] Enable patterns option in settings
- [ ] Pattern options: Solid, Striped, Dotted, Checkered, etc.
- [ ] Pattern shown alongside color
- [ ] Sticker labels show pattern
- [ ] Works with any color scheme

---

---

# EPIC 8: Smart Search

## 8.1 Basic Search

### US-8.1.1: Search by Item Name
| Field | Value |
|-------|-------|
| **ID** | US-8.1.1 |
| **Title** | Search Items by Name |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 5, Week 14 |

**User Story:**
As a user, I want to search for items by name so that I can find them quickly.

**Acceptance Criteria:**
- [ ] Search box on dashboard and items page
- [ ] Type to search (debounced)
- [ ] Searches primary name and alternate names
- [ ] Results show as user types
- [ ] Minimum 2 characters to search
- [ ] Case-insensitive matching

---

### US-8.1.2: Full-Text Search
| Field | Value |
|-------|-------|
| **ID** | US-8.1.2 |
| **Title** | Search Item Descriptions and Tags |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 5, Week 14 |

**User Story:**
As a user, I want to search across all text fields so that I can find items by any keyword.

**Acceptance Criteria:**
- [ ] Searches: name, alternates, description, tags
- [ ] MongoDB text index used
- [ ] Relevance-based ranking
- [ ] Highlights matching terms
- [ ] Fast results (<500ms)

---

### US-8.1.3: Filter by Location
| Field | Value |
|-------|-------|
| **ID** | US-8.1.3 |
| **Title** | Filter Search by Location |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 14 |

**User Story:**
As a user, I want to filter search results by location so that I can find items in a specific place.

**Acceptance Criteria:**
- [ ] Location filter dropdown
- [ ] Select any location in hierarchy
- [ ] Includes items in sub-locations
- [ ] Filter combines with text search
- [ ] Clear filter option

---

### US-8.1.4: Filter by Category
| Field | Value |
|-------|-------|
| **ID** | US-8.1.4 |
| **Title** | Filter Search by Category |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 14 |

**User Story:**
As a user, I want to filter by category so that I can narrow down results.

**Acceptance Criteria:**
- [ ] Category filter dropdown
- [ ] Includes subcategory drill-down
- [ ] Combines with other filters
- [ ] Shows count per category
- [ ] Multi-select option

---

### US-8.1.5: Filter by Expiration Status
| Field | Value |
|-------|-------|
| **ID** | US-8.1.5 |
| **Title** | Filter by Expiration Status |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 14 |

**User Story:**
As a user, I want to filter by expiration status so that I can find items needing attention.

**Acceptance Criteria:**
- [ ] Filter options: All, Expired, Expiring, Fresh
- [ ] Only applies to perishable items
- [ ] Combines with other filters
- [ ] Shows count per status

---

## 8.2 Fuzzy Matching

### US-8.2.1: Typo Tolerance
| Field | Value |
|-------|-------|
| **ID** | US-8.2.1 |
| **Title** | Search with Typo Tolerance |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 5, Week 14 |

**User Story:**
As a user, I want search to be forgiving of typos so that I can find items even with spelling errors.

**Acceptance Criteria:**
- [ ] Fuzzy matching enabled by default
- [ ] Levenshtein distance of 1-2 allowed
- [ ] "wrech" finds "wrench"
- [ ] "hammar" finds "hammer"
- [ ] Fuzzy results ranked lower than exact

**Technical Notes:**
- Implement using MongoDB Atlas Search or fuzzball.js
- Consider phonetic matching (Soundex)

---

### US-8.2.2: "Did You Mean?" Suggestions
| Field | Value |
|-------|-------|
| **ID** | US-8.2.2 |
| **Title** | Search Suggestions |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 5, Week 15 |

**User Story:**
As a user, I want "Did you mean?" suggestions so that I can correct my search.

**Acceptance Criteria:**
- [ ] When few/no results, suggest alternatives
- [ ] Based on fuzzy matches and synonyms
- [ ] "Did you mean: bearing extractor?"
- [ ] Click suggestion to search
- [ ] Shows when exact match confidence is low

---

## 8.3 Synonym System

### US-8.3.1: Synonym Expansion
| Field | Value |
|-------|-------|
| **ID** | US-8.3.1 |
| **Title** | Search Using Synonyms |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 5, Week 15 |

**User Story:**
As a user, I want search to include synonyms so that I find items even with different terminology.

**Acceptance Criteria:**
- [ ] Search "pulley puller" finds "bearing extractor"
- [ ] Synonym database consulted during search
- [ ] Expands query with synonym terms
- [ ] Shows matched via synonym indicator
- [ ] Works bidirectionally

---

### US-8.3.2: System Synonyms
| Field | Value |
|-------|-------|
| **ID** | US-8.3.2 |
| **Title** | Default Synonym Database |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 15 |

**User Story:**
As a user, I want built-in synonyms for common tools so that search works out of the box.

**Acceptance Criteria:**
- [ ] 100+ pre-defined synonym groups
- [ ] Covers: hand tools, power tools, fasteners
- [ ] Examples: Crescent wrench ↔ adjustable wrench
- [ ] Seeded on database initialization
- [ ] Cannot be deleted (system-level)

---

### US-8.3.3: User-Added Synonyms
| Field | Value |
|-------|-------|
| **ID** | US-8.3.3 |
| **Title** | Add Custom Synonyms |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 15 |

**User Story:**
As a user, I want to add my own synonyms so that search works with my terminology.

**Acceptance Criteria:**
- [ ] "Add Synonym" option in settings
- [ ] Link custom term to canonical name
- [ ] User synonyms checked in search
- [ ] Can edit/delete user synonyms
- [ ] Scoped to user account

---

## 8.4 Search UX

### US-8.4.1: Search Autocomplete
| Field | Value |
|-------|-------|
| **ID** | US-8.4.1 |
| **Title** | Autocomplete Suggestions |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 5, Week 15 |

**User Story:**
As a user, I want autocomplete suggestions as I type so that I can find items faster.

**Acceptance Criteria:**
- [ ] Suggestions appear after 2 characters
- [ ] Shows matching item names
- [ ] Shows category/location context
- [ ] Keyboard navigation (up/down/enter)
- [ ] Click to select and search
- [ ] Max 10 suggestions

---

### US-8.4.2: Recent Searches
| Field | Value |
|-------|-------|
| **ID** | US-8.4.2 |
| **Title** | Recent Search History |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 15 |

**User Story:**
As a user, I want to see my recent searches so that I can repeat common searches.

**Acceptance Criteria:**
- [ ] Show last 10 searches
- [ ] Appear when search box focused
- [ ] Click to re-run search
- [ ] Clear history option
- [ ] Stored per user

---

### US-8.4.3: Saved Searches
| Field | Value |
|-------|-------|
| **ID** | US-8.4.3 |
| **Title** | Save Favorite Searches |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 15 |

**User Story:**
As a user, I want to save frequent searches so that I can access them quickly.

**Acceptance Criteria:**
- [ ] "Save Search" button on results page
- [ ] Name the saved search
- [ ] Saves query and all filters
- [ ] Access from search dropdown
- [ ] Edit/delete saved searches
- [ ] Quick access on dashboard (optional)

---

### US-8.4.4: Cross-Location Search
| Field | Value |
|-------|-------|
| **ID** | US-8.4.4 |
| **Title** | Search Across All Locations |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 5, Week 14 |

**User Story:**
As a user, I want to search across all my locations so that I can find items anywhere.

**Acceptance Criteria:**
- [ ] Default search is across all accessible locations
- [ ] Includes owned and shared locations
- [ ] Respects permission levels
- [ ] Shows location path in results
- [ ] Quick navigate to item's location

---

---

# EPIC 9: Bulk Import System

## 9.1 Bulk Session Management

### US-9.1.1: Start Bulk Session
| Field | Value |
|-------|-------|
| **ID** | US-9.1.1 |
| **Title** | Start Bulk Import Session |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 6, Week 16 |

**User Story:**
As a user, I want to start a bulk import session so that I can quickly inventory many items.

**Acceptance Criteria:**
- [ ] "Bulk Import" button on main navigation
- [ ] Select starting location (target bin)
- [ ] Optional: set default category
- [ ] Session created and stored
- [ ] Enters bulk scanning mode

---

### US-9.1.2: Set Target Location ("Working on Bin X")
| Field | Value |
|-------|-------|
| **ID** | US-9.1.2 |
| **Title** | Set Current Target Location |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 16 |

**User Story:**
As a user, I want to set which bin I'm working on so that all scanned items go to that location.

**Acceptance Criteria:**
- [ ] Prominent "Working on: Bin 2" indicator
- [ ] Click to change target location
- [ ] Quick location picker
- [ ] All subsequent scans use this location
- [ ] Confirmation when changing mid-session

---

### US-9.1.3: Change Target Location
| Field | Value |
|-------|-------|
| **ID** | US-9.1.3 |
| **Title** | Change Target Location Mid-Session |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 16 |

**User Story:**
As a user, I want to change target bins during a session so that I can continue with a different container.

**Acceptance Criteria:**
- [ ] "Change Bin" button always accessible
- [ ] Location picker appears
- [ ] New location becomes target
- [ ] Previous scans retain their location
- [ ] Running count resets or continues (configurable)

---

### US-9.1.4: Pause and Resume Session
| Field | Value |
|-------|-------|
| **ID** | US-9.1.4 |
| **Title** | Pause and Resume Bulk Session |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 16 |

**User Story:**
As a user, I want to pause and resume a session so that I can take breaks without losing progress.

**Acceptance Criteria:**
- [ ] "Pause" button in session
- [ ] Session saved with current state
- [ ] "Resume" option on bulk import page
- [ ] Resumes with same target location
- [ ] Shows pending items from previous scans
- [ ] Sessions expire after 7 days

---

### US-9.1.5: View Session History
| Field | Value |
|-------|-------|
| **ID** | US-9.1.5 |
| **Title** | View Past Bulk Sessions |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 16 |

**User Story:**
As a user, I want to see past bulk sessions so that I can review what was imported.

**Acceptance Criteria:**
- [ ] List of completed sessions
- [ ] Shows: date, items imported, locations
- [ ] Click to see session details
- [ ] Cannot re-edit completed sessions

---

## 9.2 Bulk Scanning

### US-9.2.1: Rapid-Fire Scanning
| Field | Value |
|-------|-------|
| **ID** | US-9.2.1 |
| **Title** | Quick Sequential Scanning |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 6, Week 17 |

**User Story:**
As a user, I want to rapidly scan items in sequence so that I can inventory quickly.

**Acceptance Criteria:**
- [ ] Camera stays active between scans
- [ ] Capture, identify, quick confirm loop
- [ ] Minimal UI between scans
- [ ] Running count displayed
- [ ] Audio feedback on successful scan
- [ ] Target location persists

---

### US-9.2.2: Multi-Item Bulk Scan
| Field | Value |
|-------|-------|
| **ID** | US-9.2.2 |
| **Title** | Scan Multiple Items at Once |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | L (5) |
| **Sprint** | Phase 6, Week 17 |

**User Story:**
As a user, I want to photograph 5-10 items at once so that I can speed up inventory.

**Acceptance Criteria:**
- [ ] "Multi-Item" mode option
- [ ] Capture photo of multiple items
- [ ] AI identifies each item
- [ ] Grid view shows each identified item
- [ ] Confirm all or edit individual items
- [ ] Specify quantity per item
- [ ] All assigned to current target location

---

### US-9.2.3: Quantity Input During Bulk
| Field | Value |
|-------|-------|
| **ID** | US-9.2.3 |
| **Title** | Set Quantity During Bulk Scan |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 17 |

**User Story:**
As a user, I want to set quantity when scanning so that I can note multiples.

**Acceptance Criteria:**
- [ ] Quantity input on confirmation screen
- [ ] Default from AI estimate
- [ ] Quick +/- buttons
- [ ] Number input for exact count
- [ ] Saves with item record

---

### US-9.2.4: Bulk Barcode Scanning
| Field | Value |
|-------|-------|
| **ID** | US-9.2.4 |
| **Title** | Rapid Barcode Scanning |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 6, Week 17 |

**User Story:**
As a user, I want to rapidly scan barcodes so that I can inventory food items quickly.

**Acceptance Criteria:**
- [ ] "Barcode Mode" in bulk import
- [ ] Continuous barcode detection
- [ ] Auto-scan on detection
- [ ] UPC lookup automatic
- [ ] Add to queue without stopping
- [ ] Beep on successful scan

---

### US-9.2.5: Bulk Expiration Color Assignment
| Field | Value |
|-------|-------|
| **ID** | US-9.2.5 |
| **Title** | Quick Expiration Color in Bulk |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 17 |

**User Story:**
As a user, I want to quickly assign expiration colors during bulk scanning.

**Acceptance Criteria:**
- [ ] Color picker on confirmation screen
- [ ] Shows current period color as default
- [ ] One-tap color selection
- [ ] "Apply [Color] sticker" reminder
- [ ] Saves with item

---

## 9.3 Review and Commit

### US-9.3.1: Review Pending Items
| Field | Value |
|-------|-------|
| **ID** | US-9.3.1 |
| **Title** | Review All Pending Items |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 6, Week 18 |

**User Story:**
As a user, I want to review all scanned items before saving so that I can catch errors.

**Acceptance Criteria:**
- [ ] "Review" button shows pending items
- [ ] List/grid of all items in session
- [ ] Shows: image, name, quantity, location
- [ ] Status: pending, confirmed, rejected
- [ ] Can filter by status
- [ ] Total count displayed

---

### US-9.3.2: Edit Pending Item
| Field | Value |
|-------|-------|
| **ID** | US-9.3.2 |
| **Title** | Edit Item Before Commit |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 18 |

**User Story:**
As a user, I want to edit pending items so that I can correct any errors.

**Acceptance Criteria:**
- [ ] Click item to edit
- [ ] Can change: name, category, quantity, location
- [ ] Can change expiration color
- [ ] Save updates to pending queue
- [ ] Mark as confirmed after edit

---

### US-9.3.3: Reject Pending Item
| Field | Value |
|-------|-------|
| **ID** | US-9.3.3 |
| **Title** | Reject Item from Bulk Import |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | XS (1) |
| **Sprint** | Phase 6, Week 18 |

**User Story:**
As a user, I want to reject items that were scanned incorrectly.

**Acceptance Criteria:**
- [ ] "Reject" button on pending item
- [ ] Item marked as rejected
- [ ] Not included in commit
- [ ] Can undo rejection
- [ ] Rejected count shown

---

### US-9.3.4: Commit All Items
| Field | Value |
|-------|-------|
| **ID** | US-9.3.4 |
| **Title** | Commit Bulk Import to Inventory |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 6, Week 18 |

**User Story:**
As a user, I want to commit all confirmed items so that they're added to my inventory.

**Acceptance Criteria:**
- [ ] "Commit" button on review page
- [ ] Confirmation with total count
- [ ] All confirmed items saved to database
- [ ] Location counts updated
- [ ] Session marked as completed
- [ ] Summary report shown

---

### US-9.3.5: Bulk Import Summary
| Field | Value |
|-------|-------|
| **ID** | US-9.3.5 |
| **Title** | Session Completion Summary |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 6, Week 18 |

**User Story:**
As a user, I want a summary after bulk import so that I know what was added.

**Acceptance Criteria:**
- [ ] Shows: total items, by location, by category
- [ ] Shows: rejected count
- [ ] Shows: total time taken
- [ ] Option to view imported items
- [ ] Option to start new session

---

---

# EPIC 10: Tools for Project

## 10.1 Project Templates

### US-10.1.1: View Project Templates
| Field | Value |
|-------|-------|
| **ID** | US-10.1.1 |
| **Title** | Browse Project Templates |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 7, Week 19 |

**User Story:**
As a user, I want to browse project templates so that I can find relevant tool lists.

**Acceptance Criteria:**
- [ ] Project templates page
- [ ] Categories: Plumbing, Electrical, Drywall, etc.
- [ ] Search/filter templates
- [ ] Shows: name, description, difficulty
- [ ] Click to view details

---

### US-10.1.2: View Template Details
| Field | Value |
|-------|-------|
| **ID** | US-10.1.2 |
| **Title** | View Template Tool List |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 7, Week 19 |

**User Story:**
As a user, I want to see the full tool list for a template so that I can prepare for a job.

**Acceptance Criteria:**
- [ ] Template detail page
- [ ] Tools grouped: Essential, Recommended, Optional
- [ ] Materials list with quantities
- [ ] Safety items
- [ ] Tips and notes
- [ ] Estimated time/difficulty

---

### US-10.1.3: Default Project Templates
| Field | Value |
|-------|-------|
| **ID** | US-10.1.3 |
| **Title** | System Default Templates |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 7, Week 19 |

**User Story:**
As a user, I want built-in templates for common projects so that I have useful starting points.

**Acceptance Criteria:**
- [ ] 15+ default templates
- [ ] Plumbing: Pipe repair, faucet replacement, toilet repair
- [ ] Electrical: Outlet, switch, light fixture
- [ ] Drywall: Patch, full sheet
- [ ] Painting: Interior room
- [ ] Automotive: Oil change, brake pads
- [ ] Seeded on initialization

---

### US-10.1.4: Create Custom Template
| Field | Value |
|-------|-------|
| **ID** | US-10.1.4 |
| **Title** | Create Custom Project Template |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 7, Week 19 |

**User Story:**
As a user, I want to create my own templates so that I can save common project configurations.

**Acceptance Criteria:**
- [ ] "Create Template" button
- [ ] Form: name, category, description
- [ ] Add tools with priority levels
- [ ] Add materials with quantities
- [ ] Add tips/notes
- [ ] Save to user's templates
- [ ] Can edit/delete custom templates

---

## 10.2 AI Tool Suggestions

### US-10.2.1: Describe Job for Suggestions
| Field | Value |
|-------|-------|
| **ID** | US-10.2.1 |
| **Title** | Natural Language Job Description |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 7, Week 20 |

**User Story:**
As a user, I want to describe a job in plain language so that I get AI-suggested tools.

**Acceptance Criteria:**
- [ ] Text input for job description
- [ ] Examples shown for guidance
- [ ] "What do you need to do?"
- [ ] Accepts free-form text
- [ ] Submit for AI analysis

**Examples:**
- "Fix a leaky pipe under the kitchen sink"
- "Replace the garbage disposal"
- "Install a new ceiling fan"

---

### US-10.2.2: AI Generate Tool List
| Field | Value |
|-------|-------|
| **ID** | US-10.2.2 |
| **Title** | AI Suggest Tools for Job |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | L (5) |
| **Sprint** | Phase 7, Week 20 |

**User Story:**
As a user, I want AI to suggest tools based on my job description so that I don't forget anything.

**Acceptance Criteria:**
- [ ] Send job description to Claude
- [ ] Receive structured tool list
- [ ] Tools categorized by priority
- [ ] Materials list included
- [ ] Safety items included
- [ ] Tips for the job
- [ ] Response time < 5 seconds

**Technical Notes:**
- Use structured prompt
- Return JSON format
- Include reasoning/notes

---

### US-10.2.3: View AI Suggestions
| Field | Value |
|-------|-------|
| **ID** | US-10.2.3 |
| **Title** | Display AI Tool Suggestions |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 7, Week 20 |

**User Story:**
As a user, I want to see the AI suggestions clearly so that I can review the recommended tools.

**Acceptance Criteria:**
- [ ] Display tools grouped by priority
- [ ] Essential tools highlighted
- [ ] Recommended tools listed
- [ ] Optional tools listed
- [ ] Materials with quantities
- [ ] Can edit/remove items
- [ ] Save as custom template option

---

## 10.3 Inventory Check

### US-10.3.1: Check Tool Availability
| Field | Value |
|-------|-------|
| **ID** | US-10.3.1 |
| **Title** | Check Inventory for Required Tools |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 7, Week 20 |

**User Story:**
As a user, I want to check if I have the required tools so that I know what I'm missing.

**Acceptance Criteria:**
- [ ] "Check My Inventory" button
- [ ] Searches inventory for each tool
- [ ] Shows: ✓ Have, ✗ Missing, ? Unknown
- [ ] Fuzzy matching for tool names
- [ ] Synonym matching included
- [ ] Shows location if found
- [ ] Handles similar items (e.g., "wrench" matches "adjustable wrench")

---

### US-10.3.2: View Tool Locations
| Field | Value |
|-------|-------|
| **ID** | US-10.3.2 |
| **Title** | Show Where Tools Are Located |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 7, Week 20 |

**User Story:**
As a user, I want to see where each found tool is located so that I can gather them.

**Acceptance Criteria:**
- [ ] For each "Have" tool, show location
- [ ] Full path (My House > Garage > Tool Chest)
- [ ] Click to navigate to item
- [ ] Group by location for efficient gathering
- [ ] "All locations" view for planning

---

### US-10.3.3: Generate Shopping List
| Field | Value |
|-------|-------|
| **ID** | US-10.3.3 |
| **Title** | Generate Shopping List for Missing Items |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 7, Week 20 |

**User Story:**
As a user, I want a shopping list for missing tools so that I can buy what I need.

**Acceptance Criteria:**
- [ ] "Generate Shopping List" button
- [ ] Lists all missing tools and materials
- [ ] Prioritized (essential first)
- [ ] Quantities for materials
- [ ] Export options (copy, print, share)
- [ ] Check off as purchased

---

### US-10.3.4: Save Project Kit
| Field | Value |
|-------|-------|
| **ID** | US-10.3.4 |
| **Title** | Save as Project Kit |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 7, Week 20 |

**User Story:**
As a user, I want to save a tool list as a kit so that I can reuse it.

**Acceptance Criteria:**
- [ ] "Save as Kit" button
- [ ] Name the kit
- [ ] Saves tool list and materials
- [ ] Access from saved kits
- [ ] Can run inventory check anytime
- [ ] Edit kit later

---

---

# EPIC 11: Monetization

## 11.1 AdSense Integration

### US-11.1.1: Banner Ad Display
| Field | Value |
|-------|-------|
| **ID** | US-11.1.1 |
| **Title** | Display Banner Advertisements |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a free user, I see non-intrusive banner ads so that the service remains free.

**Acceptance Criteria:**
- [ ] Banner ad on dashboard
- [ ] Banner ad on search results
- [ ] Responsive ad units
- [ ] Non-intrusive placement
- [ ] Loads without blocking content
- [ ] AdSense code integrated

---

### US-11.1.2: Interstitial Ads
| Field | Value |
|-------|-------|
| **ID** | US-11.1.2 |
| **Title** | Interstitial Ads at Checkpoints |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | S (2) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a free user, I see interstitial ads at natural break points.

**Acceptance Criteria:**
- [ ] Interstitial after bulk import complete
- [ ] Interstitial after project kit generation
- [ ] Max 1 per session (30 min)
- [ ] Skip button after 5 seconds
- [ ] Tracks display frequency

---

### US-11.1.3: Ad-Free for Premium
| Field | Value |
|-------|-------|
| **ID** | US-11.1.3 |
| **Title** | Hide Ads for Premium Users |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a premium user, I don't see any ads so that I have a clean experience.

**Acceptance Criteria:**
- [ ] Check subscription tier before rendering ads
- [ ] No ad components for premium/business
- [ ] Ad slots hidden or removed
- [ ] No ad network requests made

---

## 11.2 Subscription Tiers

### US-11.2.1: Free Tier Limits
| Field | Value |
|-------|-------|
| **ID** | US-11.2.1 |
| **Title** | Enforce Free Tier Limits |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 22 |

**User Story:**
As a free user, I have limited features so that I'm incentivized to upgrade.

**Acceptance Criteria:**
- [ ] Max 3 top-level locations
- [ ] Max 500 items total
- [ ] Max 2 shared users per location
- [ ] Ads displayed
- [ ] Limits checked on create operations
- [ ] Friendly upgrade prompt when limit reached

---

### US-11.2.2: Premium Tier Features
| Field | Value |
|-------|-------|
| **ID** | US-11.2.2 |
| **Title** | Premium Subscription Benefits |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 22 |

**User Story:**
As a premium user, I have expanded features so that I get value from my subscription.

**Acceptance Criteria:**
- [ ] Unlimited locations
- [ ] Unlimited items
- [ ] Unlimited shared users
- [ ] No advertisements
- [ ] Priority AI processing
- [ ] Advanced reports
- [ ] Data export (CSV, JSON)

---

### US-11.2.3: Stripe Checkout
| Field | Value |
|-------|-------|
| **ID** | US-11.2.3 |
| **Title** | Subscribe via Stripe |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | L (5) |
| **Sprint** | Phase 8, Week 22 |

**User Story:**
As a user, I want to subscribe using Stripe so that I can upgrade to premium.

**Acceptance Criteria:**
- [ ] "Upgrade" button visible to free users
- [ ] Pricing page with tier comparison
- [ ] Stripe Checkout session created
- [ ] Redirect to Stripe payment page
- [ ] Successful payment updates subscription
- [ ] Confirmation email sent
- [ ] User redirected back to app

---

### US-11.2.4: Manage Subscription
| Field | Value |
|-------|-------|
| **ID** | US-11.2.4 |
| **Title** | Subscription Management Portal |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 22 |

**User Story:**
As a subscriber, I want to manage my subscription so that I can update payment or cancel.

**Acceptance Criteria:**
- [ ] "Manage Subscription" link in settings
- [ ] Opens Stripe Customer Portal
- [ ] Can update payment method
- [ ] Can view invoices
- [ ] Can cancel subscription
- [ ] Changes reflected in app

---

### US-11.2.5: Handle Subscription Webhooks
| Field | Value |
|-------|-------|
| **ID** | US-11.2.5 |
| **Title** | Process Stripe Webhooks |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 22 |

**User Story:**
As the system, I process Stripe webhooks so that subscription changes are reflected.

**Acceptance Criteria:**
- [ ] Webhook endpoint configured
- [ ] Verify webhook signature
- [ ] Handle: subscription.created
- [ ] Handle: subscription.updated
- [ ] Handle: subscription.deleted
- [ ] Handle: invoice.payment_failed
- [ ] Update user subscription record

---

---

# EPIC 12: PWA & Mobile Experience

## 12.1 Progressive Web App

### US-12.1.1: Service Worker
| Field | Value |
|-------|-------|
| **ID** | US-12.1.1 |
| **Title** | Implement Service Worker |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a user, I want the app to work offline so that I can access inventory without internet.

**Acceptance Criteria:**
- [ ] Service worker registered
- [ ] Static assets cached
- [ ] API responses cached (read operations)
- [ ] Offline indicator shown
- [ ] Graceful degradation
- [ ] Background sync for write operations

---

### US-12.1.2: Web App Manifest
| Field | Value |
|-------|-------|
| **ID** | US-12.1.2 |
| **Title** | PWA Manifest |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a user, I want to install the app on my device so that I can access it like a native app.

**Acceptance Criteria:**
- [ ] manifest.json configured
- [ ] App name and short name
- [ ] Icons in multiple sizes
- [ ] Theme and background colors
- [ ] Start URL configured
- [ ] Display mode: standalone

---

### US-12.1.3: Install Prompt
| Field | Value |
|-------|-------|
| **ID** | US-12.1.3 |
| **Title** | PWA Install Prompt |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a user, I want an install prompt so that I can easily add the app to my home screen.

**Acceptance Criteria:**
- [ ] Custom install prompt UI
- [ ] Appears after 2nd visit
- [ ] "Install App" button
- [ ] Uses beforeinstallprompt event
- [ ] Dismiss option
- [ ] Don't show again if dismissed

---

### US-12.1.4: Push Notifications
| Field | Value |
|-------|-------|
| **ID** | US-12.1.4 |
| **Title** | Push Notifications |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | L (5) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a user, I want push notifications so that I'm alerted to important events.

**Acceptance Criteria:**
- [ ] Request notification permission
- [ ] Subscribe to push service
- [ ] Store subscription on server
- [ ] Send notifications for: expirations, low stock, shares
- [ ] Notification click opens app
- [ ] Unsubscribe option

---

## 12.2 Mobile Optimization

### US-12.2.1: Responsive Design
| Field | Value |
|-------|-------|
| **ID** | US-12.2.1 |
| **Title** | Mobile-Responsive UI |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a mobile user, I want the app to work well on my phone so that I can use it while in the workshop.

**Acceptance Criteria:**
- [ ] Responsive layout for all pages
- [ ] Touch-friendly tap targets (44x44px min)
- [ ] Mobile-first navigation
- [ ] Collapsible sidebar on mobile
- [ ] Optimized for portrait orientation
- [ ] Tested on iOS and Android

---

### US-12.2.2: Touch Gestures
| Field | Value |
|-------|-------|
| **ID** | US-12.2.2 |
| **Title** | Mobile Touch Gestures |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 23 |

**User Story:**
As a mobile user, I want touch gestures so that I can navigate efficiently.

**Acceptance Criteria:**
- [ ] Swipe to go back
- [ ] Pull to refresh on lists
- [ ] Swipe actions on items (delete, edit)
- [ ] Pinch to zoom on images
- [ ] Long press for context menu

---

---

# EPIC 13: Reports & Analytics

## 13.1 Inventory Reports

### US-13.1.1: Inventory Value Report
| Field | Value |
|-------|-------|
| **ID** | US-13.1.1 |
| **Title** | Total Inventory Value Report |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a user, I want to see total inventory value so that I understand my asset worth.

**Acceptance Criteria:**
- [ ] Report page with value breakdown
- [ ] Total value across all locations
- [ ] Value by location (tree view)
- [ ] Value by category
- [ ] Value by item type
- [ ] Uses currentValue, falls back to purchasePrice

---

### US-13.1.2: Low Stock Report
| Field | Value |
|-------|-------|
| **ID** | US-13.1.2 |
| **Title** | Low Stock Items Report |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a user, I want to see items below minimum quantity so that I can restock.

**Acceptance Criteria:**
- [ ] List of items at/below minimum quantity
- [ ] Shows: name, current qty, min qty, location
- [ ] Sorted by urgency (lowest first)
- [ ] Filter by location/category
- [ ] Export option

---

### US-13.1.3: Expiration Report
| Field | Value |
|-------|-------|
| **ID** | US-13.1.3 |
| **Title** | Expiration Status Report |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | S (2) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a user, I want a comprehensive expiration report so that I can manage perishables.

**Acceptance Criteria:**
- [ ] Summary: expired, expiring, fresh counts
- [ ] Breakdown by color/period
- [ ] Breakdown by location
- [ ] Breakdown by category
- [ ] Value of expired items
- [ ] Printable format

---

### US-13.1.4: Activity Log
| Field | Value |
|-------|-------|
| **ID** | US-13.1.4 |
| **Title** | View Activity Log |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a user, I want to see activity history so that I can track changes.

**Acceptance Criteria:**
- [ ] Activity log page
- [ ] Shows: action, user, item/location, timestamp
- [ ] Filter by action type
- [ ] Filter by date range
- [ ] Filter by user (for shared locations)
- [ ] Pagination

---

## 13.2 Data Export

### US-13.2.1: Export to CSV
| Field | Value |
|-------|-------|
| **ID** | US-13.2.1 |
| **Title** | Export Inventory to CSV |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a premium user, I want to export my inventory to CSV so that I can use it in spreadsheets.

**Acceptance Criteria:**
- [ ] "Export" button in reports
- [ ] Select: all items, or filtered
- [ ] CSV file downloaded
- [ ] Includes all item fields
- [ ] Includes location path
- [ ] Premium feature only

---

### US-13.2.2: Export to JSON
| Field | Value |
|-------|-------|
| **ID** | US-13.2.2 |
| **Title** | Export Data to JSON |
| **Status** | ⬜ Not Started |
| **Priority** | P2 |
| **Complexity** | M (3) |
| **Sprint** | Phase 8, Week 21 |

**User Story:**
As a premium user, I want to export my data to JSON for backup or migration.

**Acceptance Criteria:**
- [ ] Export all data option
- [ ] Includes: items, locations, settings
- [ ] JSON file downloaded
- [ ] Hierarchical structure preserved
- [ ] Premium feature only

---

---

# EPIC 14: iOS Application

## 14.1 iOS Foundation

### US-14.1.1: iOS Project Setup
| Field | Value |
|-------|-------|
| **ID** | US-14.1.1 |
| **Title** | Initialize iOS Project |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 24 |

**User Story:**
As a developer, I need to set up the iOS project so that we can build the mobile app.

**Acceptance Criteria:**
- [ ] Xcode project created
- [ ] Swift/SwiftUI architecture
- [ ] Folder structure established
- [ ] CocoaPods/SPM configured
- [ ] Build configurations set up
- [ ] Git integration

---

### US-14.1.2: iOS API Client
| Field | Value |
|-------|-------|
| **ID** | US-14.1.2 |
| **Title** | iOS API Client |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 24 |

**User Story:**
As an iOS user, I need the app to communicate with the server.

**Acceptance Criteria:**
- [ ] HTTP client implemented
- [ ] All API endpoints accessible
- [ ] JWT authentication handling
- [ ] Token refresh logic
- [ ] Error handling
- [ ] Offline request queue

---

### US-14.1.3: iOS Authentication
| Field | Value |
|-------|-------|
| **ID** | US-14.1.3 |
| **Title** | iOS Login/Register |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 24-25 |

**User Story:**
As an iOS user, I want to log in and register so that I can access my account.

**Acceptance Criteria:**
- [ ] Login screen
- [ ] Registration screen
- [ ] Email/password authentication
- [ ] Sign in with Apple
- [ ] Secure token storage (Keychain)
- [ ] Biometric unlock option

---

### US-14.1.4: iOS Navigation
| Field | Value |
|-------|-------|
| **ID** | US-14.1.4 |
| **Title** | iOS Navigation Structure |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 25 |

**User Story:**
As an iOS user, I want intuitive navigation so that I can easily access features.

**Acceptance Criteria:**
- [ ] Tab bar navigation
- [ ] Tabs: Home, Scan, Locations, Search, Settings
- [ ] Navigation stack for drill-down
- [ ] Swipe gestures
- [ ] iOS design guidelines followed

---

## 14.2 iOS Core Features

### US-14.2.1: iOS Location Browser
| Field | Value |
|-------|-------|
| **ID** | US-14.2.1 |
| **Title** | Browse Locations on iOS |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 26 |

**User Story:**
As an iOS user, I want to browse my locations so that I can navigate my inventory.

**Acceptance Criteria:**
- [ ] Location tree view
- [ ] Expandable/collapsible nodes
- [ ] Tap to drill down
- [ ] Breadcrumb navigation
- [ ] Pull to refresh
- [ ] Search within locations

---

### US-14.2.2: iOS Item Management
| Field | Value |
|-------|-------|
| **ID** | US-14.2.2 |
| **Title** | Manage Items on iOS |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | L (5) |
| **Sprint** | Phase 9, Week 26-27 |

**User Story:**
As an iOS user, I want to view and manage items so that I can update my inventory.

**Acceptance Criteria:**
- [ ] Item list view
- [ ] Item detail view
- [ ] Edit item form
- [ ] Delete with confirmation
- [ ] Move item between locations
- [ ] Image gallery

---

### US-14.2.3: iOS Camera Scanning
| Field | Value |
|-------|-------|
| **ID** | US-14.2.3 |
| **Title** | Native Camera Scanning |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | L (5) |
| **Sprint** | Phase 9, Week 27 |

**User Story:**
As an iOS user, I want to use my camera to scan items so that I can add them quickly.

**Acceptance Criteria:**
- [ ] Native camera integration
- [ ] Full-screen camera view
- [ ] Capture and preview
- [ ] Send to AI for identification
- [ ] Display results
- [ ] Confirm and save flow

---

### US-14.2.4: iOS Barcode Scanner
| Field | Value |
|-------|-------|
| **ID** | US-14.2.4 |
| **Title** | Native Barcode Scanning |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 27 |

**User Story:**
As an iOS user, I want to scan barcodes natively so that I can add products quickly.

**Acceptance Criteria:**
- [ ] AVFoundation barcode detection
- [ ] Real-time scanning
- [ ] Visual feedback on detect
- [ ] Automatic capture
- [ ] UPC lookup

---

### US-14.2.5: iOS Search
| Field | Value |
|-------|-------|
| **ID** | US-14.2.5 |
| **Title** | Search on iOS |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 27 |

**User Story:**
As an iOS user, I want to search my inventory so that I can find items.

**Acceptance Criteria:**
- [ ] Search bar
- [ ] Real-time results
- [ ] Filters accessible
- [ ] Recent searches
- [ ] Navigate to results

---

## 14.3 iOS Advanced Features

### US-14.3.1: iOS Bulk Scanning
| Field | Value |
|-------|-------|
| **ID** | US-14.3.1 |
| **Title** | Bulk Import on iOS |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | L (5) |
| **Sprint** | Phase 9, Week 28-29 |

**User Story:**
As an iOS user, I want bulk scanning mode so that I can inventory quickly on mobile.

**Acceptance Criteria:**
- [ ] Start bulk session
- [ ] Set target location
- [ ] Rapid-fire scanning
- [ ] Review pending items
- [ ] Commit to inventory

---

### US-14.3.2: iOS Expiration System
| Field | Value |
|-------|-------|
| **ID** | US-14.3.2 |
| **Title** | Expiration on iOS |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 28 |

**User Story:**
As an iOS user, I want to manage expiration colors so that I can track perishables.

**Acceptance Criteria:**
- [ ] View color schedule
- [ ] Assign color when adding food
- [ ] Expiration dashboard widget
- [ ] Filter by expiration status

---

### US-14.3.3: iOS Projects
| Field | Value |
|-------|-------|
| **ID** | US-14.3.3 |
| **Title** | Projects on iOS |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 29 |

**User Story:**
As an iOS user, I want to use Tools for Project so that I can prepare for jobs on the go.

**Acceptance Criteria:**
- [ ] Browse templates
- [ ] Describe job (voice input option)
- [ ] View AI suggestions
- [ ] Check inventory
- [ ] Generate shopping list

---

### US-14.3.4: iOS Offline Mode
| Field | Value |
|-------|-------|
| **ID** | US-14.3.4 |
| **Title** | iOS Offline Support |
| **Status** | ⬜ Not Started |
| **Priority** | P1 |
| **Complexity** | L (5) |
| **Sprint** | Phase 9, Week 29 |

**User Story:**
As an iOS user, I want offline access so that I can use the app without internet.

**Acceptance Criteria:**
- [ ] Core Data for local storage
- [ ] Sync locations and items
- [ ] Offline read access
- [ ] Queue offline changes
- [ ] Sync when online
- [ ] Conflict resolution

---

## 14.4 iOS Release

### US-14.4.1: iOS App Store Assets
| Field | Value |
|-------|-------|
| **ID** | US-14.4.1 |
| **Title** | App Store Preparation |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | M (3) |
| **Sprint** | Phase 9, Week 30 |

**User Story:**
As a developer, I need to prepare App Store assets for submission.

**Acceptance Criteria:**
- [ ] App icon (all sizes)
- [ ] Screenshots (all devices)
- [ ] App description
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL

---

### US-14.4.2: iOS TestFlight
| Field | Value |
|-------|-------|
| **ID** | US-14.4.2 |
| **Title** | TestFlight Beta |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 9, Week 30 |

**User Story:**
As a developer, I want to distribute beta via TestFlight so that users can test.

**Acceptance Criteria:**
- [ ] Archive and upload to App Store Connect
- [ ] Configure TestFlight
- [ ] Invite beta testers
- [ ] Collect feedback
- [ ] Fix critical issues

---

### US-14.4.3: iOS App Store Submission
| Field | Value |
|-------|-------|
| **ID** | US-14.4.3 |
| **Title** | Submit to App Store |
| **Status** | ⬜ Not Started |
| **Priority** | P0 |
| **Complexity** | S (2) |
| **Sprint** | Phase 9, Week 30 |

**User Story:**
As a developer, I want to submit to the App Store so that users can download.

**Acceptance Criteria:**
- [ ] Complete app metadata
- [ ] Submit for review
- [ ] Address any rejection feedback
- [ ] App approved and live

---

---

# Status Summary

## By Epic

| Epic | Total Stories | Completed | In Progress | Not Started |
|------|---------------|-----------|-------------|-------------|
| 1. Authentication | 14 | 0 | 0 | 14 |
| 2. Locations | 12 | 0 | 0 | 12 |
| 3. Sharing | 10 | 0 | 0 | 10 |
| 4. Items | 20 | 0 | 0 | 20 |
| 5. AI Recognition | 12 | 0 | 0 | 12 |
| 6. UPC/Barcode | 4 | 0 | 0 | 4 |
| 7. Food/Expiration | 14 | 0 | 0 | 14 |
| 8. Smart Search | 12 | 0 | 0 | 12 |
| 9. Bulk Import | 12 | 0 | 0 | 12 |
| 10. Projects | 10 | 0 | 0 | 10 |
| 11. Monetization | 7 | 0 | 0 | 7 |
| 12. PWA/Mobile | 6 | 0 | 0 | 6 |
| 13. Reports | 6 | 0 | 0 | 6 |
| 14. iOS App | 17 | 0 | 0 | 17 |
| **TOTAL** | **156** | **0** | **0** | **156** |

## By Priority

| Priority | Count | Completed |
|----------|-------|-----------|
| P0 (Critical) | 78 | 0 |
| P1 (High) | 45 | 0 |
| P2 (Medium) | 26 | 0 |
| P3 (Low) | 7 | 0 |

## By Phase

| Phase | Weeks | Stories | Status |
|-------|-------|---------|--------|
| Phase 1: Foundation | 1-4 | ~28 | Not Started |
| Phase 2: Items | 5-7 | ~18 | Not Started |
| Phase 3: AI/UPC | 8-10 | ~16 | Not Started |
| Phase 4: Food/Expiration | 11-13 | ~14 | Not Started |
| Phase 5: Search | 14-15 | ~12 | Not Started |
| Phase 6: Bulk Import | 16-18 | ~12 | Not Started |
| Phase 7: Projects | 19-20 | ~10 | Not Started |
| Phase 8: Monetization/PWA | 21-23 | ~19 | Not Started |
| Phase 9: iOS | 24-30 | ~17 | Not Started |

---

# Working with Claude Code

## How to Use This Document

1. **Start a Phase:** Tell Claude Code which phase/week you're starting
2. **Pick a Story:** Reference stories by ID (e.g., "Let's work on US-1.1.1")
3. **Implement:** Claude Code will implement the acceptance criteria
4. **Update Status:** After completion, update the story status
5. **Iterate:** Move to the next story

## Example Prompts for Claude Code

```
"Let's start Phase 1. Begin with US-1.1.1 - User Email Registration"

"I've tested US-1.1.1, please mark it as complete and move to US-1.2.1"

"Let's work on all the authentication stories in Phase 1 Week 2"

"Show me the status of Epic 2: Location Management"

"What are all the P0 stories that are not yet started?"
```

## Story Dependencies

Some stories have implicit dependencies:
- Authentication (Epic 1) must be complete before most other features
- Basic Location CRUD (2.1.x) before Sharing (Epic 3)
- Basic Items (4.1.x) before AI Identification (Epic 5)
- AI Identification (Epic 5) before Bulk Import (Epic 9)

---

*Document Version: 1.0*
*Total User Stories: 156*
*Created: December 2024*
