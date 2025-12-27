# PROJECT_STATE.md
## WIT (Where Is It) - Inventory System

---

## 🎯 Current Focus

| Field | Value |
|-------|-------|
| **Project Name** | WIT - Where Is It |
| **Current Milestone** | M1: Foundation |
| **Current Epic** | Epic 1: Authentication |
| **Current Story** | US-1.1.1: User Email Registration |
| **Current Agent** | Not assigned |
| **Story Status** | ⬜ Not Started |
| **Last Updated** | 2024-12-XX |

---

## 📂 Document Structure

```
/docs/
├── PROJECT_STATE.md          # This file - read first!
├── STATUS.md                 # Detailed status tracking
├── ARCHITECTURE.md           # Tech stack & patterns
├── API_PATTERNS.md           # Code examples
├── ADR.md                    # Architectural decisions
├── agents/
│   ├── AGENTS_GUIDE.md       # Multi-agent strategy
│   ├── DATABASE_AGENT.md     # Database agent instructions
│   ├── BACKEND_AGENT.md      # Backend agent instructions
│   ├── FRONTEND_AGENT.md     # Frontend agent instructions
│   └── ARCHITECT_AGENT.md    # Architect agent instructions
├── milestones/
│   ├── MILESTONE_1.md        # Foundation (Auth, Locations, Sharing)
│   ├── MILESTONE_2.md        # Items & Categories
│   ├── MILESTONE_3.md        # AI, Search & Food Tracking
│   ├── MILESTONE_4.md        # Bulk Import & Projects
│   └── MILESTONE_5.md        # Monetization, PWA & iOS
└── interfaces/
    ├── models.md             # Model interfaces (DB → BE)
    ├── api-endpoints.md      # API specs (BE → FE)
    └── api-requests.md       # Frontend needs (FE → BE)
```

---

## 🤖 Agent Quick Start

### DATABASE Agent
```
You are the DATABASE agent for WIT (Where Is It).
Read: /docs/agents/DATABASE_AGENT.md
Read: /docs/milestones/MILESTONE_1.md
Read: /docs/STATUS.md
Task: [describe task]
```

### BACKEND Agent
```
You are the BACKEND agent for WIT (Where Is It).
Read: /docs/agents/BACKEND_AGENT.md
Read: /docs/milestones/MILESTONE_1.md
Read: /docs/interfaces/models.md
Task: [describe task]
```

### FRONTEND Agent
```
You are the FRONTEND agent for WIT (Where Is It).
Read: /docs/agents/FRONTEND_AGENT.md
Read: /docs/milestones/MILESTONE_1.md
Read: /docs/interfaces/api-endpoints.md
Task: [describe task]
```

### ARCHITECT Agent
```
You are the ARCHITECT agent for WIT (Where Is It).
Read: /docs/agents/ARCHITECT_AGENT.md
Read: /docs/ARCHITECTURE.md
Read: /docs/STATUS.md
Task: [describe task]
```

---

## 📊 Progress Overview

### Milestones
| Milestone | Stories | Status |
|-----------|---------|--------|
| M1: Foundation | 36 | 🔵 Current |
| M2: Items | 20 | ⬜ Not Started |
| M3: AI/Search/Food | 38 | ⬜ Not Started |
| M4: Bulk/Projects | 22 | ⬜ Not Started |
| M5: Monetization/iOS | 30 | ⬜ Not Started |

### Current Milestone: M1 - Foundation
```
Epic 1: Authentication     ⬜ 0/10 stories
Epic 2: Locations         ⬜ 0/10 stories  
Epic 3: Sharing           ⬜ 0/9 stories
```

See `/docs/STATUS.md` for detailed story tracking.

---

## 🏗️ Project Structure

```
wit/
├── docs/                     # Documentation (see above)
├── server/
│   ├── config/
│   │   ├── database.js       # ⬜ Not created
│   │   └── index.js          # ⬜ Not created
│   ├── controllers/
│   │   └── authController.js # ⬜ Not created
│   ├── models/
│   │   └── User.js           # ⬜ Not created
│   ├── routes/
│   │   └── auth.js           # ⬜ Not created
│   ├── services/
│   │   └── authService.js    # ⬜ Not created
│   ├── middleware/
│   │   └── auth.js           # ⬜ Not created
│   ├── seeds/
│   ├── app.js                # ⬜ Not created
│   └── server.js             # ⬜ Not created
├── client/
│   └── (to be created)
├── package.json              # ⬜ Not created
├── .env.example              # ⬜ Not created
└── README.md                 # ⬜ Not created
```

**Legend:** ✅ Complete | 🟡 In Progress | ⬜ Not Created

---

## 🔧 Tech Stack Confirmed

| Component | Technology | Notes |
|-----------|------------|-------|
| Backend | Node.js 20 + Express | |
| Database | MongoDB 7 + Mongoose | |
| Auth | JWT + bcrypt | httpOnly cookies |
| Frontend | HTML5 + Vue.js 3 | PWA |
| AI | Claude API | Vision for item ID |
| Payments | Stripe | Subscriptions |

---

## 📐 Architectural Decisions Made

### ADR-001: Location Hierarchy Pattern
- **Decision:** Materialized path pattern
- **Implementation:** `path` field with format `",id1,id2,id3,"`
- **Reason:** Efficient ancestor/descendant queries

### ADR-002: Authentication Strategy
- **Decision:** JWT in httpOnly cookies
- **Implementation:** 30-day expiry, refresh token flow
- **Reason:** XSS protection over localStorage

### ADR-003: Multi-tenancy Approach
- **Decision:** Shared database, user ID filtering
- **Implementation:** Every query includes `userId` or permission check
- **Reason:** Simpler than separate databases, sufficient isolation

*(Add more as decisions are made)*

---

## 🗃️ Database Models Status

| Model | Status | Key Fields |
|-------|--------|------------|
| User | ⬜ | email, passwordHash, name, settings, subscription |
| Location | ⬜ | ownerId, parentId, path, depth, name, type |
| LocationShare | ⬜ | locationId, userId, permission, inheritToChildren |
| Item | ⬜ | ownerId, locationId, primaryName, category, perishable |
| Synonym | ⬜ | canonicalName, synonyms[], category |
| BulkSession | ⬜ | userId, status, currentLocationId, items[] |
| ProjectTemplate | ⬜ | name, category, requiredTools[], requiredMaterials[] |
| ExpirationSchedule | ⬜ | userId, periodType, colors[], startDate |

---

## 🛣️ API Routes Status

### Auth Routes (`/api/auth`)
| Method | Route | Controller | Status |
|--------|-------|------------|--------|
| POST | /register | authController.register | ⬜ |
| POST | /login | authController.login | ⬜ |
| POST | /logout | authController.logout | ⬜ |
| GET | /me | authController.getMe | ⬜ |

### Location Routes (`/api/locations`)
| Method | Route | Controller | Status |
|--------|-------|------------|--------|
| GET | / | locationController.getAll | ⬜ |
| GET | /tree | locationController.getTree | ⬜ |
| POST | / | locationController.create | ⬜ |
| ... | ... | ... | ... |

*(Expand as routes are implemented)*

---

## 🔌 Environment Variables Needed

```bash
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/wit

# JWT
JWT_SECRET=                    # ⬜ Need to generate
JWT_EXPIRE=30d

# Claude API
ANTHROPIC_API_KEY=             # ⬜ Need to add

# Stripe (Milestone 5)
STRIPE_SECRET_KEY=             # ⬜ Future
STRIPE_WEBHOOK_SECRET=         # ⬜ Future
```

---

## 📝 Session Notes

### Last Session (Date: YYYY-MM-DD)
```
What was done:
- (nothing yet)

Issues encountered:
- None

Decisions made:
- None

Left off at:
- Ready to begin project initialization
```

### Next Session Plan
```
1. Initialize Node.js project
2. Set up folder structure
3. Create basic Express server
4. Set up MongoDB connection
5. Begin US-1.1.1 User Registration
```

---

## 🐛 Known Issues / Technical Debt

```
None yet
```

---

## 📚 Reference Files

When starting a session, Claude should also read:
- `/docs/ARCHITECTURE.md` - Tech patterns
- `/docs/API_PATTERNS.md` - Code style
- `smart-inventory-user-stories.md` - Full story details

---

## 🔄 How to Update This File

After each session:
1. Update "Current Focus" section
2. Move completed stories to "Completed Stories"
3. Update file structure status
4. Add any new ADRs
5. Update "Session Notes"
6. Note any new issues

**Template for completed story:**
```
- US-X.X.X: [Story Title] ✅ (Date completed)
  Files: [list files created/modified]
  Notes: [any relevant notes]
```

---

## ⚡ Quick Start for New Session

### Option 1: Single Agent Session
```
You are the [DATABASE/BACKEND/FRONTEND] agent for WIT (Where Is It).

Read these files:
1. /docs/agents/[AGENT]_AGENT.md
2. /docs/STATUS.md  
3. /docs/milestones/MILESTONE_1.md

Current story: US-X.X.X - [Title]
[Additional context if needed]

Begin implementation.
```

### Option 2: General Session
```
Read /docs/PROJECT_STATE.md and /docs/STATUS.md.

I'm working on WIT (Where Is It) inventory system.
Current milestone: M1 - Foundation
Current story: US-X.X.X

Continue from where we left off.
```

---

## 🔄 End of Session Checklist

Before ending any session:
- [ ] Update /docs/STATUS.md with story progress
- [ ] Update interface files if models/APIs changed
- [ ] Note any blockers or decisions
- [ ] Commit code with story ID in message
- [ ] Update this file's "Current Focus" section

---

*Last Updated: [DATE]*
*Updated By: [AGENT/SESSION]*
