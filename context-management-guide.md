# Context Management Guide for Claude Code
## Strategies for Large Project Development

---

## The Problem

Claude Code has a context window limit. As you work through 156 user stories:
- Earlier conversation history gets truncated
- Claude may forget architectural decisions
- Code patterns may become inconsistent
- You'll need to re-explain project structure

## Solution Strategies

---

## Strategy 1: Project State File (CRITICAL)

Maintain a `PROJECT_STATE.md` file that Claude reads at the start of each session.

```bash
# At the start of EVERY new session or conversation:
"Read PROJECT_STATE.md and continue from where we left off"
```

### What to Include in PROJECT_STATE.md:
- Current phase/sprint
- Last completed story
- Next story to work on
- Key architectural decisions made
- File structure overview
- Any blockers or notes

**I've created a template below (PROJECT_STATE.md)**

---

## Strategy 2: Modular Development Sessions

Break work into focused sessions:

### Session Types:

**1. Single Story Session**
```
"Read PROJECT_STATE.md. We're implementing US-4.1.1 (Create Item Manually). 
Here's the current Item model: [paste model code]
Implement the controller and route."
```

**2. Epic Session**
```
"Read PROJECT_STATE.md. We're completing Epic 2 (Locations).
Remaining stories: US-2.2.1, US-2.2.2, US-2.2.3.
Let's work through these sequentially."
```

**3. Integration Session**
```
"Read PROJECT_STATE.md. We need to integrate the search service 
with the existing item controller. Here's the current structure: [paste]"
```

**4. Bug Fix Session**
```
"Read PROJECT_STATE.md. There's an issue with US-3.1.1 (sharing).
Error: [paste error]. Here's the relevant code: [paste]"
```

---

## Strategy 3: Code Snapshots

Before ending a session, ask Claude to generate summaries:

```
"Before we end, please:
1. Summarize what we implemented today
2. List any pending tasks
3. Note any architectural decisions
4. Update the PROJECT_STATE.md content"
```

### Key Files to Snapshot:
- Models (schema definitions)
- Route definitions
- Service interfaces
- Environment variables needed

---

## Strategy 4: Architectural Decision Records (ADRs)

Keep a running log of WHY decisions were made:

```markdown
## ADR-001: Using Materialized Path for Location Hierarchy
**Date:** 2024-12-XX
**Decision:** Use materialized path pattern (path field with comma-separated IDs)
**Reason:** Efficient ancestor/descendant queries, simpler than nested sets
**Alternatives Considered:** Nested sets, adjacency list with recursive CTE

## ADR-002: JWT Storage
**Date:** 2024-12-XX
**Decision:** Store JWT in httpOnly cookie, not localStorage
**Reason:** XSS protection
```

---

## Strategy 5: Chunked Prompts

When providing context, be strategic:

### ❌ Bad (Too Much Context):
```
"Here's my entire codebase [10,000 lines]. Fix the bug."
```

### ✅ Good (Focused Context):
```
"Working on US-5.2.1 (AI Identification).

Current file structure:
- /server/services/aiService.js (needs implementation)
- /server/controllers/identifyController.js (exists, needs update)

Here's the existing identifyController.js:
[paste only relevant code]

Implement aiService.js following the pattern in our other services."
```

---

## Strategy 6: Reference File Pattern

Create reference files Claude can read:

### `/docs/ARCHITECTURE.md`
```markdown
# Architecture Overview

## Tech Stack
- Node.js 20 + Express
- MongoDB 7 + Mongoose
- Vue.js 3 (frontend)

## Key Patterns
- MVC structure
- JWT auth with httpOnly cookies
- Materialized path for hierarchies
- Service layer for business logic

## File Structure
server/
  controllers/  # Route handlers
  models/       # Mongoose schemas
  services/     # Business logic
  routes/       # Express routes
  middleware/   # Auth, validation, etc.
```

### `/docs/API_PATTERNS.md`
```markdown
# API Patterns

## Standard Response Format
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}

## Error Response Format
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}

## Controller Pattern
exports.getItems = async (req, res, next) => {
  try {
    const items = await itemService.getItems(req.user._id, req.query);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};
```

### Start of Session:
```
"Read /docs/ARCHITECTURE.md and /docs/API_PATTERNS.md, 
then implement US-4.1.1 following these patterns."
```

---

## Strategy 7: Test-Driven Anchoring

Use tests as context anchors:

```
"Here's the test file for the Item service:
[paste test file]

Implement the service to pass these tests."
```

Tests serve as:
- Documentation of expected behavior
- Verification that context is maintained
- Clear acceptance criteria

---

## Strategy 8: Git Commit Checkpoints

After each story completion:

```bash
git add .
git commit -m "US-4.1.1: Create Item Manually - Complete

Implemented:
- Item model with full schema
- itemController.createItem()
- POST /api/items route
- Validation middleware

Next: US-4.1.2 View Item Details"
```

If context is lost, you can reference git history:
```
"Here's the git log for recent changes: [paste]
Continue from US-4.1.2"
```

---

## Strategy 9: Session Handoff Template

Use this template when ending/starting sessions:

### End of Session:
```
"Generate a SESSION_HANDOFF with:
1. Stories completed this session
2. Current file being worked on
3. Any incomplete work
4. Next steps
5. Any issues encountered"
```

### Start of Session:
```
"Here's the handoff from last session:
[paste SESSION_HANDOFF]

Read PROJECT_STATE.md and continue."
```

---

## Strategy 10: Complexity Batching

Group related stories to minimize context switching:

### Good Batching:
```
Session 1: US-1.1.1, US-1.1.2, US-1.2.1, US-1.2.2 (All Auth)
Session 2: US-2.1.1, US-2.1.2, US-2.1.3 (Location CRUD)
Session 3: US-2.2.1, US-2.2.2, US-2.2.3 (Sub-locations)
```

### Bad Batching:
```
Session 1: US-1.1.1 (Auth), US-4.1.1 (Items), US-8.1.1 (Search)
# Too much context switching!
```

---

## Practical Workflow Example

### Day 1, Session 1:
```
1. "Initialize the project. Create package.json, folder structure, 
    and basic Express server. Follow the file structure in 
    smart-inventory-project-plan-v2.md"

2. [Claude creates files]

3. "Update PROJECT_STATE.md with what we've created"

4. [End session, commit code]
```

### Day 1, Session 2:
```
1. "Read PROJECT_STATE.md. Let's implement US-1.1.1 User Registration.
    Here's our current server/app.js: [paste]"

2. [Claude implements]

3. "Generate tests for the registration endpoint"

4. "Update PROJECT_STATE.md, mark US-1.1.1 complete"

5. [End session, commit]
```

### Day 2, Session 1:
```
1. "Read PROJECT_STATE.md and continue with US-1.2.1"
   
   # Claude now knows:
   # - Project structure
   # - What's been completed
   # - Current patterns being used
```

---

## Quick Reference Commands

### Starting a Session:
```
"Read PROJECT_STATE.md, ARCHITECTURE.md, and the current status 
of Epic [X]. Continue from US-X.X.X."
```

### Context Recovery:
```
"I'm working on [project name]. Here's the current state:
- Phase: [X]
- Last completed: US-X.X.X
- Working on: US-X.X.X
- Key files: [list relevant files]

[Paste relevant code snippets]

Continue implementation."
```

### Ending a Session:
```
"Before ending:
1. Update PROJECT_STATE.md
2. List what was completed
3. Note any pending items
4. Suggest next session's focus"
```

### Getting Unstuck:
```
"I've lost context. Here's my current codebase structure:
[paste tree output or file list]

Here's PROJECT_STATE.md:
[paste content]

What should we work on next?"
```

---

## Anti-Patterns to Avoid

### ❌ Don't:
- Start sessions without providing context
- Work on unrelated stories in one session
- Forget to update PROJECT_STATE.md
- Paste entire codebase when only one file matters
- Let conversations run too long without checkpoints

### ✅ Do:
- Always start with PROJECT_STATE.md
- Focus sessions on related stories
- Commit after each story
- Provide focused, relevant context
- Take breaks to checkpoint progress

---

## Files You Should Maintain

| File | Purpose | Update Frequency |
|------|---------|------------------|
| PROJECT_STATE.md | Current progress, next steps | Every session |
| ARCHITECTURE.md | Tech decisions, patterns | When patterns change |
| API_PATTERNS.md | Code style guide | Rarely |
| ADR.md | Decision log | When decisions made |
| User Stories doc | Status tracking | After each story |

---

*Following these strategies will help maintain consistency across 
the entire development process, even as context resets between sessions.*
