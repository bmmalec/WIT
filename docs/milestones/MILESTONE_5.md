# Milestone 5: Monetization, PWA & iOS
## WIT (Where Is It) Inventory System

**Duration:** Weeks 19-30
**Focus:** AdSense, Subscriptions, PWA, Reports, iOS App

---

## Milestone Overview

| Metric | Count |
|--------|-------|
| Total Stories | 30 |
| P0 (Critical) | 14 |
| P1 (High) | 10 |
| P2 (Medium) | 6 |

**Depends On:** Milestones 1-4 (Core functionality complete)

---

## Epic 11: Monetization

### US-11.1.1: Banner Ad Display
| Priority | P1 | Complexity | M (3) |
**Story:** Display non-intrusive banner ads for free users.
**Criteria:**
- [ ] Banner on dashboard
- [ ] Banner on search results
- [ ] Responsive ad units
- [ ] AdSense code integrated

---

### US-11.1.2: Interstitial Ads
| Priority | P2 | Complexity | S (2) |
**Story:** Interstitial ads at natural break points.
**Criteria:**
- [ ] After bulk import complete
- [ ] Max 1 per 30-minute session
- [ ] Skip after 5 seconds

---

### US-11.1.3: Ad-Free for Premium
| Priority | P0 | Complexity | S (2) |
**Story:** Premium users see no ads.
**Criteria:**
- [ ] Check subscription tier
- [ ] No ad components rendered
- [ ] No ad network requests

---

### US-11.2.1: Free Tier Limits
| Priority | P0 | Complexity | M (3) |
**Story:** Enforce free tier limits.
**Criteria:**
- [ ] Max 3 top-level locations
- [ ] Max 500 items
- [ ] Max 2 shared users per location
- [ ] Friendly upgrade prompt at limit

---

### US-11.2.2: Premium Tier Features
| Priority | P0 | Complexity | M (3) |
**Story:** Premium subscription benefits.
**Criteria:**
- [ ] Unlimited locations
- [ ] Unlimited items
- [ ] Unlimited sharing
- [ ] No ads
- [ ] Advanced reports
- [ ] Data export

---

### US-11.2.3: Stripe Checkout
| Priority | P0 | Complexity | L (5) |
**Story:** Subscribe via Stripe.
**Criteria:**
- [ ] "Upgrade" button for free users
- [ ] Pricing page
- [ ] Stripe Checkout session
- [ ] Payment updates subscription
- [ ] Confirmation email

---

### US-11.2.4: Manage Subscription
| Priority | P0 | Complexity | M (3) |
**Story:** Manage subscription via Stripe portal.
**Criteria:**
- [ ] "Manage Subscription" link
- [ ] Stripe Customer Portal
- [ ] Update payment, view invoices, cancel

---

### US-11.2.5: Handle Subscription Webhooks
| Priority | P0 | Complexity | M (3) |
**Story:** Process Stripe webhooks.
**Criteria:**
- [ ] Webhook endpoint
- [ ] Verify signature
- [ ] Handle subscription events
- [ ] Update user records

---

## Epic 12: PWA & Mobile

### US-12.1.1: Service Worker
| Priority | P0 | Complexity | M (3) |
**Story:** App works offline.
**Criteria:**
- [ ] Service worker registered
- [ ] Static assets cached
- [ ] Offline indicator
- [ ] Read operations work offline

---

### US-12.1.2: Web App Manifest
| Priority | P0 | Complexity | S (2) |
**Story:** App installable on devices.
**Criteria:**
- [ ] manifest.json configured
- [ ] App icons all sizes
- [ ] Theme colors
- [ ] Display: standalone

---

### US-12.1.3: Install Prompt
| Priority | P1 | Complexity | S (2) |
**Story:** Prompt users to install.
**Criteria:**
- [ ] Custom install prompt
- [ ] Appears after 2nd visit
- [ ] Dismiss option

---

### US-12.1.4: Push Notifications
| Priority | P2 | Complexity | L (5) |
**Story:** Push notifications for alerts.
**Criteria:**
- [ ] Permission request
- [ ] Expiration alerts
- [ ] Low stock alerts
- [ ] Click opens app

---

### US-12.2.1: Responsive Design
| Priority | P0 | Complexity | M (3) |
**Story:** Works well on mobile.
**Criteria:**
- [ ] Responsive all pages
- [ ] Touch-friendly (44x44px targets)
- [ ] Mobile navigation
- [ ] Tested iOS and Android

---

## Epic 13: Reports & Analytics

### US-13.1.1: Inventory Value Report
| Priority | P1 | Complexity | M (3) |
**Story:** See total inventory value.
**Criteria:**
- [ ] Total value across locations
- [ ] Value by location
- [ ] Value by category

---

### US-13.1.2: Low Stock Report
| Priority | P1 | Complexity | S (2) |
**Story:** See items below minimum.
**Criteria:**
- [ ] List at/below minimum
- [ ] Sorted by urgency
- [ ] Export option

---

### US-13.1.3: Expiration Report
| Priority | P1 | Complexity | S (2) |
**Story:** Comprehensive expiration report.
**Criteria:**
- [ ] Summary by status
- [ ] Breakdown by color/period
- [ ] Value of expired items

---

### US-13.1.4: Activity Log
| Priority | P2 | Complexity | M (3) |
**Story:** View activity history.
**Criteria:**
- [ ] Action, user, item, timestamp
- [ ] Filter by type, date, user
- [ ] Pagination

---

### US-13.2.1: Export to CSV
| Priority | P1 | Complexity | M (3) |
**Story:** Export inventory to CSV.
**Criteria:**
- [ ] All items or filtered
- [ ] All fields included
- [ ] Premium feature

---

### US-13.2.2: Export to JSON
| Priority | P2 | Complexity | M (3) |
**Story:** Export data to JSON for backup.
**Criteria:**
- [ ] All data (items, locations, settings)
- [ ] Hierarchical structure
- [ ] Premium feature

---

## Epic 14: iOS Application

### US-14.1.1: iOS Project Setup
| Priority | P0 | Complexity | M (3) |
**Criteria:**
- [ ] Xcode project (Swift/SwiftUI)
- [ ] Folder structure
- [ ] SPM dependencies

---

### US-14.1.2: iOS API Client
| Priority | P0 | Complexity | M (3) |
**Criteria:**
- [ ] HTTP client
- [ ] All endpoints accessible
- [ ] JWT handling
- [ ] Error handling

---

### US-14.1.3: iOS Authentication
| Priority | P0 | Complexity | M (3) |
**Criteria:**
- [ ] Login/Register screens
- [ ] Sign in with Apple
- [ ] Secure token storage (Keychain)

---

### US-14.1.4: iOS Navigation
| Priority | P0 | Complexity | M (3) |
**Criteria:**
- [ ] Tab bar navigation
- [ ] Home, Scan, Locations, Search, Settings

---

### US-14.2.1: iOS Location Browser
| Priority | P0 | Complexity | M (3) |
**Criteria:**
- [ ] Tree view
- [ ] Drill-down navigation
- [ ] Pull to refresh

---

### US-14.2.2: iOS Item Management
| Priority | P0 | Complexity | L (5) |
**Criteria:**
- [ ] List, detail, edit views
- [ ] Delete, move
- [ ] Image gallery

---

### US-14.2.3: iOS Camera Scanning
| Priority | P0 | Complexity | L (5) |
**Criteria:**
- [ ] Native camera
- [ ] Send to AI
- [ ] Display results

---

### US-14.2.4: iOS Barcode Scanner
| Priority | P0 | Complexity | M (3) |
**Criteria:**
- [ ] AVFoundation barcode detection
- [ ] Real-time scanning
- [ ] UPC lookup

---

### US-14.3.4: iOS Offline Mode
| Priority | P1 | Complexity | L (5) |
**Criteria:**
- [ ] Core Data local storage
- [ ] Sync when online
- [ ] Conflict resolution

---

### US-14.4.1: App Store Assets
| Priority | P0 | Complexity | M (3) |
**Criteria:**
- [ ] App icon
- [ ] Screenshots all devices
- [ ] Description, keywords

---

### US-14.4.3: App Store Submission
| Priority | P0 | Complexity | S (2) |
**Criteria:**
- [ ] Complete metadata
- [ ] Submit for review
- [ ] Address feedback

---

## Milestone Exit Criteria

- [ ] AdSense displaying for free users
- [ ] Stripe subscriptions working
- [ ] Tier limits enforced
- [ ] PWA installable and works offline
- [ ] Reports generating correctly
- [ ] iOS app on TestFlight
- [ ] iOS app submitted to App Store
- [ ] All P0 stories complete
