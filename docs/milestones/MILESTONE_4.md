# Milestone 4: Bulk Import & Projects
## WIT (Where Is It) Inventory System

**Duration:** Weeks 14-18
**Focus:** Bulk Scanning Sessions, Project Templates, Tool Suggestions

---

## Milestone Overview

| Metric | Count |
|--------|-------|
| Total Stories | 22 |
| P0 (Critical) | 12 |
| P1 (High) | 7 |
| P2 (Medium) | 3 |

**Depends On:** Milestone 3 (AI Recognition & Search)

---

## Epic 9: Bulk Import System

### US-9.1.1: Start Bulk Session
| Priority | P0 | Complexity | M (3) |
**Story:** Start a bulk import session.
**Criteria:**
- [ ] "Bulk Import" button
- [ ] Select starting location (target bin)
- [ ] Optional default category
- [ ] Session created and stored

---

### US-9.1.2: Set Target Location ("Working on Bin X")
| Priority | P0 | Complexity | S (2) |
**Story:** Set which bin I'm working on.
**Criteria:**
- [ ] Prominent "Working on: Bin 2" indicator
- [ ] All scans go to this location
- [ ] Persists until changed

---

### US-9.1.3: Change Target Location
| Priority | P0 | Complexity | S (2) |
**Story:** Change target bins during session.
**Criteria:**
- [ ] "Change Bin" button always accessible
- [ ] Previous scans retain their location
- [ ] New location becomes target

---

### US-9.1.4: Pause and Resume Session
| Priority | P1 | Complexity | S (2) |
**Story:** Pause and resume sessions.
**Criteria:**
- [ ] "Pause" button
- [ ] Session saved with state
- [ ] "Resume" option
- [ ] Sessions expire after 7 days

---

### US-9.1.5: View Session History
| Priority | P2 | Complexity | S (2) |
**Story:** View past bulk sessions.
**Criteria:**
- [ ] List of completed sessions
- [ ] Date, items imported, locations

---

### US-9.2.1: Rapid-Fire Scanning
| Priority | P0 | Complexity | M (3) |
**Story:** Quickly scan items in sequence.
**Criteria:**
- [ ] Camera stays active between scans
- [ ] Capture → Identify → Quick confirm loop
- [ ] Running count displayed
- [ ] Audio feedback on success

---

### US-9.2.2: Multi-Item Bulk Scan
| Priority | P0 | Complexity | L (5) |
**Story:** Scan 5-10 items at once.
**Criteria:**
- [ ] "Multi-Item" mode
- [ ] AI identifies each
- [ ] Grid view for confirmation
- [ ] Specify quantity per item

---

### US-9.2.3: Quantity Input During Bulk
| Priority | P0 | Complexity | S (2) |
**Story:** Set quantity when scanning.
**Criteria:**
- [ ] Quantity input on confirmation
- [ ] Default from AI estimate
- [ ] Quick +/- buttons

---

### US-9.2.4: Bulk Barcode Scanning
| Priority | P1 | Complexity | M (3) |
**Story:** Rapidly scan barcodes.
**Criteria:**
- [ ] "Barcode Mode" in bulk import
- [ ] Continuous detection
- [ ] Auto-scan on detect
- [ ] Beep on success

---

### US-9.2.5: Bulk Expiration Color Assignment
| Priority | P1 | Complexity | S (2) |
**Story:** Quick expiration color in bulk mode.
**Criteria:**
- [ ] Color picker on confirmation
- [ ] Current period as default
- [ ] One-tap selection

---

### US-9.3.1: Review Pending Items
| Priority | P0 | Complexity | M (3) |
**Story:** Review all scanned items before saving.
**Criteria:**
- [ ] "Review" shows pending items
- [ ] Image, name, quantity, location
- [ ] Status: pending, confirmed, rejected
- [ ] Filter by status

---

### US-9.3.2: Edit Pending Item
| Priority | P0 | Complexity | S (2) |
**Story:** Edit item before commit.
**Criteria:**
- [ ] Click to edit
- [ ] Change name, category, quantity, location
- [ ] Mark as confirmed

---

### US-9.3.3: Reject Pending Item
| Priority | P0 | Complexity | XS (1) |
**Story:** Reject incorrectly scanned items.
**Criteria:**
- [ ] "Reject" button
- [ ] Not included in commit
- [ ] Can undo rejection

---

### US-9.3.4: Commit All Items
| Priority | P0 | Complexity | M (3) |
**Story:** Commit confirmed items to inventory.
**Criteria:**
- [ ] "Commit" button
- [ ] Confirmation with total count
- [ ] All items saved to database
- [ ] Session marked complete

---

### US-9.3.5: Bulk Import Summary
| Priority | P1 | Complexity | S (2) |
**Story:** Summary after bulk import.
**Criteria:**
- [ ] Total items, by location, by category
- [ ] Rejected count
- [ ] Time taken

---

## Epic 10: Tools for Project

### US-10.1.1: View Project Templates
| Priority | P0 | Complexity | S (2) |
**Story:** Browse project templates.
**Criteria:**
- [ ] Templates by category
- [ ] Search/filter templates
- [ ] Name, description, difficulty

---

### US-10.1.2: View Template Details
| Priority | P0 | Complexity | S (2) |
**Story:** View full tool list for template.
**Criteria:**
- [ ] Tools: Essential, Recommended, Optional
- [ ] Materials with quantities
- [ ] Safety items
- [ ] Tips

---

### US-10.1.3: Default Project Templates
| Priority | P0 | Complexity | M (3) |
**Story:** Built-in templates for common projects.
**Criteria:**
- [ ] 15+ default templates
- [ ] Plumbing, Electrical, Drywall, Painting, Automotive
- [ ] Seeded on initialization

---

### US-10.1.4: Create Custom Template
| Priority | P2 | Complexity | M (3) |
**Story:** Create my own templates.
**Criteria:**
- [ ] "Create Template" button
- [ ] Add tools with priority
- [ ] Add materials
- [ ] Save to user's templates

---

### US-10.2.1: Describe Job for Suggestions
| Priority | P0 | Complexity | M (3) |
**Story:** Describe job in plain language.
**Criteria:**
- [ ] Text input for description
- [ ] Examples for guidance
- [ ] Submit for AI analysis

---

### US-10.2.2: AI Generate Tool List
| Priority | P0 | Complexity | L (5) |
**Story:** AI suggests tools based on job description.
**Criteria:**
- [ ] Send to Claude
- [ ] Receive structured tool list
- [ ] Categorized by priority
- [ ] Response < 5 seconds

---

### US-10.3.1: Check Tool Availability
| Priority | P0 | Complexity | M (3) |
**Story:** Check if I have required tools.
**Criteria:**
- [ ] "Check My Inventory" button
- [ ] Shows: ✓ Have, ✗ Missing, ? Unknown
- [ ] Fuzzy + synonym matching
- [ ] Shows location if found

---

### US-10.3.2: View Tool Locations
| Priority | P0 | Complexity | S (2) |
**Story:** See where each found tool is.
**Criteria:**
- [ ] Full path for each tool
- [ ] Group by location
- [ ] Click to navigate

---

### US-10.3.3: Generate Shopping List
| Priority | P1 | Complexity | M (3) |
**Story:** Shopping list for missing items.
**Criteria:**
- [ ] Lists missing tools and materials
- [ ] Prioritized
- [ ] Export options (copy, print)

---

### US-10.3.4: Save Project Kit
| Priority | P2 | Complexity | S (2) |
**Story:** Save tool list as reusable kit.
**Criteria:**
- [ ] "Save as Kit" button
- [ ] Name the kit
- [ ] Access from saved kits

---

## Milestone Exit Criteria

- [ ] Bulk import session workflow complete
- [ ] Can rapidly scan 20+ items to bins
- [ ] Multi-item scanning works
- [ ] Project templates browsable
- [ ] AI suggests tools for job descriptions
- [ ] Inventory check finds tools across locations
- [ ] All P0 stories complete
