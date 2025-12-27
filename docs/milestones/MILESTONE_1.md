# Milestone 1: Foundation
## WIT (Where Is It) Inventory System

**Duration:** Weeks 1-4
**Focus:** Authentication, Location Hierarchy, Sharing & Permissions

---

## Milestone Overview

| Metric | Count |
|--------|-------|
| Total Stories | 36 |
| P0 (Critical) | 24 |
| P1 (High) | 10 |
| P2 (Medium) | 2 |

---

## Epic 1: Authentication & User Management

### US-1.1.1: User Email Registration
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | DATABASE → BACKEND → FRONTEND |

**Story:** As a new user, I want to register with my email and password so that I can create an account.

**Acceptance Criteria:**
- [ ] User can enter email, password, and name
- [ ] Email must be valid and unique
- [ ] Password minimum 8 characters
- [ ] Password hashed with bcrypt
- [ ] User automatically logged in after registration
- [ ] JWT token set in httpOnly cookie

**Technical Notes:**
- DATABASE: Create User model
- BACKEND: POST /api/auth/register
- FRONTEND: RegisterForm component

---

### US-1.1.2: Google OAuth Registration
| Field | Value |
|-------|-------|
| Priority | P2 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a new user, I want to register using Google so that I can quickly create an account.

**Acceptance Criteria:**
- [ ] "Sign up with Google" button visible
- [ ] OAuth flow completes successfully
- [ ] Account created with Google profile info
- [ ] User logged in and redirected to dashboard

---

### US-1.2.1: Email/Password Login
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a registered user, I want to log in with my email and password.

**Acceptance Criteria:**
- [ ] Login form with email and password
- [ ] Successful login returns JWT in cookie
- [ ] Invalid credentials show error message
- [ ] Account lockout after 5 failed attempts
- [ ] "Remember me" option

---

### US-1.2.2: Google OAuth Login
| Field | Value |
|-------|-------|
| Priority | P2 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user with Google-linked account, I want to log in with Google.

**Acceptance Criteria:**
- [ ] "Login with Google" button visible
- [ ] OAuth flow works
- [ ] JWT issued on success

---

### US-1.2.3: Password Reset
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user who forgot my password, I want to reset it via email.

**Acceptance Criteria:**
- [ ] "Forgot password" link on login
- [ ] Email sent with reset token
- [ ] Token expires after 1 hour
- [ ] Password updated successfully

---

### US-1.2.4: Logout
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | XS (1) |
| Agent | BACKEND → FRONTEND |

**Story:** As a logged-in user, I want to log out.

**Acceptance Criteria:**
- [ ] Logout button in navigation
- [ ] Clears JWT cookie
- [ ] Redirects to login page

---

### US-1.3.1: View Profile
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to view my profile.

**Acceptance Criteria:**
- [ ] Profile page shows name, email, avatar
- [ ] Shows subscription tier
- [ ] Shows account creation date

---

### US-1.3.2: Edit Profile
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to edit my profile.

**Acceptance Criteria:**
- [ ] Can update name
- [ ] Can upload avatar
- [ ] Changes saved to database

---

### US-1.3.3: Change Password
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to change my password.

**Acceptance Criteria:**
- [ ] Requires current password
- [ ] New password with confirmation
- [ ] Password complexity validation

---

### US-1.4.1: General Settings
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | M (3) |
| Agent | DATABASE → BACKEND → FRONTEND |

**Story:** As a user, I want to configure general settings.

**Acceptance Criteria:**
- [ ] Theme selection (light/dark/system)
- [ ] Default view preference
- [ ] Settings persist across sessions

---

## Epic 2: Hierarchical Location Management

### US-2.1.1: Create Top-Level Location
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | DATABASE → BACKEND → FRONTEND |

**Story:** As a user, I want to create top-level locations (house, warehouse, storage unit).

**Acceptance Criteria:**
- [ ] "Add Location" button on dashboard
- [ ] Form with name, type, description
- [ ] Location types: House, Warehouse, Storage Unit, Office, Vehicle, Custom
- [ ] Optional address fields
- [ ] Location created with user as owner

**Technical Notes:**
- DATABASE: Create Location model with materialized path
- parentId = null for top-level
- path = ",{id},"
- depth = 0

---

### US-2.1.2: View Location Tree
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to view my locations in a tree structure.

**Acceptance Criteria:**
- [ ] Tree view showing all locations
- [ ] Expandable/collapsible nodes
- [ ] Shows location type icons
- [ ] Shows item count per location
- [ ] Click to navigate

---

### US-2.1.3: Edit Location
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a location owner, I want to edit location details.

**Acceptance Criteria:**
- [ ] Edit form pre-filled with current values
- [ ] Can update name, description, icon
- [ ] Changes reflected immediately

---

### US-2.1.4: Delete Location
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a location owner, I want to delete a location.

**Acceptance Criteria:**
- [ ] Warning if location has items/children
- [ ] Option to move or delete contents
- [ ] Cascading delete if confirmed

---

### US-2.2.1: Create Sub-Location
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to create sub-locations within a parent.

**Acceptance Criteria:**
- [ ] "Add Sub-location" button within parent
- [ ] Type suggestions based on parent
- [ ] Created as child with correct path and depth

---

### US-2.2.2: View Location Breadcrumb Path
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | FRONTEND |

**Story:** As a user, I want to see the full path to a location.

**Acceptance Criteria:**
- [ ] Breadcrumb: "My House > Garage > Tool Chest"
- [ ] Each segment clickable
- [ ] Works at any depth

---

### US-2.3.1: Create Storage Container
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to create storage containers (bins, cabinets, shelves).

**Acceptance Criteria:**
- [ ] Container types: Drawer Cabinet, Shelving, Bin Rack, Tool Chest, etc.
- [ ] Capacity configuration (slots, unlimited)
- [ ] Position labels (Drawer 1, Shelf A)

---

### US-2.3.2: Configure Container Capacity
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to set capacity for containers.

**Acceptance Criteria:**
- [ ] Capacity type (unlimited, slots, volume)
- [ ] Max capacity input
- [ ] Visual capacity indicator

---

### US-2.3.3: View Container Contents
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to view all items in a container.

**Acceptance Criteria:**
- [ ] Item list/grid for container
- [ ] Shows images, names, quantities
- [ ] Empty state with "Add Item" prompt

---

### US-2.4.1: System Location Types
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | DATABASE |

**Story:** As a user, I want pre-defined location types.

**Acceptance Criteria:**
- [ ] Property types: House, Warehouse, Storage Unit, Office, Vehicle
- [ ] Room types: Garage, Basement, Attic, Kitchen, Workshop
- [ ] Warehouse zones: Inbound, Staging, Racking, Floor, Outbound
- [ ] Container types: Drawer Cabinet, Shelving, Bin Rack, Tool Chest, Pegboard
- [ ] Seeded on initialization

---

## Epic 3: Location Sharing & Permissions

### US-3.1.1: Invite User by Email
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | L (5) |
| Agent | DATABASE → BACKEND → FRONTEND |

**Story:** As a location owner, I want to invite other users to my location.

**Acceptance Criteria:**
- [ ] "Share" button on location page
- [ ] Enter email address
- [ ] Select permission level (Viewer, Contributor, Editor, Manager)
- [ ] Option to include sub-locations
- [ ] Invitation email sent
- [ ] Pending invitation stored

**Technical Notes:**
- DATABASE: Create LocationShare model
- BACKEND: Email service integration

---

### US-3.1.2: Accept Invitation
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | M (3) |
| Agent | BACKEND → FRONTEND |

**Story:** As an invited user, I want to accept an invitation.

**Acceptance Criteria:**
- [ ] Invitation link opens acceptance page
- [ ] Shows location name and permission level
- [ ] Prompts login/register if needed
- [ ] Location appears in "Shared with Me"

---

### US-3.1.3: Decline Invitation
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | XS (1) |
| Agent | BACKEND → FRONTEND |

**Story:** As an invited user, I want to decline an invitation.

**Acceptance Criteria:**
- [ ] "Decline" button on invitation page
- [ ] Share marked as declined

---

### US-3.2.1: View Location Members
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a location manager, I want to see all members with access.

**Acceptance Criteria:**
- [ ] Members list with name, email, permission
- [ ] Shows pending invitations
- [ ] Shows how access was granted (direct, inherited)

---

### US-3.2.2: Change User Permission
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a location manager, I want to change a user's permission level.

**Acceptance Criteria:**
- [ ] Permission dropdown for each member
- [ ] Changes take effect immediately
- [ ] Cannot demote self below Manager

---

### US-3.2.3: Revoke Access
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a location manager, I want to revoke a user's access.

**Acceptance Criteria:**
- [ ] "Remove" button for each member
- [ ] Confirmation dialog
- [ ] Location removed from user's view

---

### US-3.2.4: Permission Inheritance
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | M (3) |
| Agent | BACKEND |

**Story:** As a location manager, I want permissions to inherit to sub-locations.

**Acceptance Criteria:**
- [ ] "Include sub-locations" toggle when sharing
- [ ] User can access all descendants
- [ ] Can override at sub-level

---

### US-3.3.1: View Shared With Me
| Field | Value |
|-------|-------|
| Priority | P0 |
| Complexity | S (2) |
| Agent | BACKEND → FRONTEND |

**Story:** As a user, I want to see locations shared with me.

**Acceptance Criteria:**
- [ ] "Shared with Me" section on dashboard
- [ ] Shows owner name and permission level
- [ ] Pending invitations shown separately

---

### US-3.3.2: Leave Shared Location
| Field | Value |
|-------|-------|
| Priority | P1 |
| Complexity | XS (1) |
| Agent | BACKEND → FRONTEND |

**Story:** As a shared member, I want to leave a shared location.

**Acceptance Criteria:**
- [ ] "Leave" option in menu
- [ ] Confirmation dialog
- [ ] Location removed from view

---

## Implementation Order

### Week 1: Project Setup
1. Initialize project structure
2. Set up Express + MongoDB
3. Configure environment

### Week 2: Authentication
**DATABASE Agent:**
- US-1.1.1: User model

**BACKEND Agent:**
- US-1.1.1: Registration endpoint
- US-1.2.1: Login endpoint
- US-1.2.4: Logout endpoint

**FRONTEND Agent:**
- US-1.1.1: Register form
- US-1.2.1: Login form

### Week 3: Locations
**DATABASE Agent:**
- US-2.1.1: Location model
- US-2.4.1: LocationType model + seeds

**BACKEND Agent:**
- US-2.1.1-4: Location CRUD
- US-2.2.1: Sub-location creation
- US-2.3.1-3: Container management

**FRONTEND Agent:**
- US-2.1.2: Location tree
- US-2.2.2: Breadcrumbs
- Location forms

### Week 4: Sharing
**DATABASE Agent:**
- US-3.1.1: LocationShare model

**BACKEND Agent:**
- US-3.1.1-3: Invitation flow
- US-3.2.1-4: Permission management
- US-3.3.1-2: Shared locations

**FRONTEND Agent:**
- Share dialog
- Members management UI
- Shared locations view

---

## Milestone Exit Criteria

- [ ] Users can register and login
- [ ] Users can create hierarchical locations
- [ ] Locations can be shared with granular permissions
- [ ] Permission inheritance works
- [ ] All P0 stories complete
- [ ] Basic test coverage
