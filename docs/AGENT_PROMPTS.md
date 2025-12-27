# WIT - Agent Prompts Quick Reference
## Copy-Paste Prompts for Claude Code Sessions

---

## How to Use

1. Start a new Claude Code session
2. Copy the appropriate prompt below
3. Paste and run
4. Follow the agent's output

---

## Project Initialization

### ARCHITECT: Initialize Project
```
You are the ARCHITECT agent for WIT (Where Is It) inventory system.

Read these files:
- docs/agents/ARCHITECT_AGENT.md
- docs/ARCHITECTURE.md
- docs/milestones/MILESTONE_1_TASKS.md (INIT-001 section)

Task: Initialize the Express application foundation.

Create these files:
1. server/config/database.js - MongoDB Atlas connection
2. server/utils/AppError.js - Custom error class
3. server/middleware/errorHandler.js - Global error handler
4. server/app.js - Express app with middleware
5. server/server.js - Entry point

Follow patterns in ARCHITECTURE.md.
```

---

## Milestone 1: Foundation

### DATABASE: User Model (US-1.1.1)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-1.1.1 section)

Task: Create the User model.

Create server/models/User.js with:
- All fields from the task list
- Password hashing with bcrypt
- JWT generation method
- Login attempt tracking

Update docs/interfaces/models.md when complete.
```

### BACKEND: Auth Registration (US-1.1.1)
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/interfaces/models.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-1.1.1 section)

Task: Implement user registration endpoint.

Create:
1. server/services/authService.js - register method
2. server/controllers/authController.js - register handler
3. server/routes/auth.js - POST /register route
4. server/middleware/validate.js

Update docs/interfaces/api-endpoints.md when complete.
```

### FRONTEND: Registration Form (US-1.1.1)
```
You are the FRONTEND agent for WIT (Where Is It).

Read: docs/agents/FRONTEND_AGENT.md
Read: docs/interfaces/api-endpoints.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-1.1.1 section)

Task: Create registration UI.

Create:
1. client/js/api.js - API client
2. client/js/components/RegisterForm.js - Vue component
3. client/js/pages/RegisterPage.js - Page component

Include validation, loading states, error handling.
```

### DATABASE: Location Model (US-2.1.1)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-2.1.1 section)

Task: Create the Location model with materialized path.

Create server/models/Location.js with:
- All fields from the task list
- Materialized path pattern for hierarchy
- Static methods: getTree, getAncestors, getDescendants
- Instance methods: isDescendantOf, getFullPath

Update docs/interfaces/models.md when complete.
```

### DATABASE: LocationShare Model (US-3.1.1)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_1_TASKS.md (US-3.1.1 section)

Task: Create the LocationShare model for permissions.

Create server/models/LocationShare.js with:
- All fields from the task list
- Invite token generation
- Permission levels: viewer, contributor, editor, manager

Update docs/interfaces/models.md when complete.
```

---

## Milestone 2: Items

### DATABASE: Item Model (US-4.1.1)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_2_TASKS.md (US-4.1.1 section)

Task: Create the Item model.

Create server/models/Item.js with ALL fields listed.
This is a large model - include perishable, value, images.
Add text index for search.

Update docs/interfaces/models.md when complete.
```

### DATABASE: Categories Seed (US-4.2.4)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_2_TASKS.md (US-4.2.4 section)

Task: Create categories seed data.

Create server/seeds/categories.js with:
- 12+ main categories
- 4-8 subcategories each
- Icons for each category

Categories: Tools, Hardware, Plumbing, Electrical, Building, Paint, Automotive, Garden, Food, Household, Electronics, Office
```

---

## Milestone 3: AI & Search

### BACKEND: AI Identification (US-5.2.1)
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/milestones/MILESTONE_3_TASKS.md (US-5.2.1 section)

Task: Implement AI item identification.

Create:
1. server/config/claude.js - Anthropic client
2. server/services/aiService.js - identifyItem method
3. server/controllers/identifyController.js
4. server/routes/identify.js

Call Claude Vision API, return structured guesses.
```

### DATABASE: Synonyms Seed (US-8.3.2)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_3_TASKS.md (US-8.3.2 section)

Task: Create synonyms seed data.

Create server/seeds/synonyms.js with 100+ entries.

Include synonyms for: Tools, Hardware, Plumbing, Electrical, Paint, Automotive, Food, Garden items.
```

---

## Milestone 4: Bulk & Projects

### DATABASE: BulkSession Model (US-9.1.1)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_4_TASKS.md (US-9.1.1 section)

Task: Create BulkSession model.

Create server/models/BulkSession.js for bulk import sessions.
Track pending items, stats, current location.
```

### DATABASE: Project Templates Seed (US-10.1.3)
```
You are the DATABASE agent for WIT (Where Is It).

Read: docs/agents/DATABASE_AGENT.md
Read: docs/milestones/MILESTONE_4_TASKS.md (US-10.1.3 section)

Task: Create project templates seed data.

Create server/seeds/projectTemplates.js with 15+ templates.

Include: Plumbing (4), Electrical (4), Drywall (3), Painting (2), Automotive (3+) projects with realistic tool lists.
```

---

## Milestone 5: Monetization

### BACKEND: Stripe Integration (US-11.2.3)
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/agents/BACKEND_AGENT.md
Read: docs/milestones/MILESTONE_5_TASKS.md (US-11.2.3 section)

Task: Implement Stripe checkout.

Create:
1. server/config/stripe.js
2. server/services/stripeService.js
3. server/routes/subscription.js

Implement checkout session creation, portal, and webhook handling.
```

---

## General Prompts

### Continue from Last Session
```
You are the [AGENT] agent for WIT (Where Is It).

Read: docs/STATUS.md
Read: docs/milestones/MILESTONE_X_TASKS.md

Last completed: US-X.X.X
Continue with: US-X.X.X

[Paste any relevant context]
```

### Fix a Bug
```
You are the [AGENT] agent for WIT (Where Is It).

There's an issue with US-X.X.X.

Error: [paste error]

Relevant file: [file path]
[paste code if helpful]

Please fix.
```

### Add Tests
```
You are the BACKEND agent for WIT (Where Is It).

Read: docs/API_PATTERNS.md (test section)

Task: Add tests for [feature].

Create tests/integration/[feature].test.js
Test: happy path, validation errors, auth errors, edge cases.
```

---

## Status Update Prompt

After completing work:
```
Update docs/STATUS.md:
- Mark US-X.X.X as ✅ Complete
- Add to session log: date, agent, stories, outcome
- Note any blockers or decisions
```
