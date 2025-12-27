# Milestone 5: Monetization, PWA & iOS
## WIT (Where Is It) - User Stories with Agent Tasks

**Duration:** Weeks 19-30
**Stories:** 30 total
**Depends On:** Milestones 1-4

---

## Epic 11: Monetization

### US-11.2.1: Free Tier Limits
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a product owner, I want to enforce free tier limits.

#### BACKEND Agent Tasks:
- [ ] Create `server/middleware/tierLimits.js`:
  - `checkLocationLimit` - Max 3 top-level locations
  - `checkItemLimit` - Max 500 items
  - `checkShareLimit` - Max 2 shared users per location
- [ ] Create `server/services/subscriptionService.js`:
  - `getTierLimits(tier)` - Return limits for tier
  - `checkLimit(userId, limitType)` - Check if at limit
- [ ] Add limit checks to relevant routes

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement tier limits for US-11.2.1.

Create server/middleware/tierLimits.js:
- checkLocationLimit: free = 3 top-level, premium = unlimited
- checkItemLimit: free = 500 total, premium = unlimited
- checkShareLimit: free = 2 per location, premium = unlimited

Apply to:
- POST /api/locations (location limit)
- POST /api/items (item limit)
- POST /api/locations/:id/share (share limit)

Return 403 with upgrade prompt when limit hit.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/UpgradePrompt.js`:
  - Show when limit reached
  - Explains limit and benefits of premium
  - "Upgrade" button
  - "Maybe Later" dismiss
- [ ] Show limits in settings

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create upgrade prompt for US-11.2.1.

Create client/js/components/UpgradePrompt.js:
- Modal/dialog when limit hit
- Shows which limit: "You've reached the free tier limit of X"
- Lists premium benefits
- "Upgrade to Premium" button
- "Not Now" dismiss

Add limit display to settings page.
```

---

### US-11.2.3: Stripe Checkout
**Priority:** P0 | **Complexity:** L (5) | **Status:** ⬜ Not Started

**Story:** As a user, I want to subscribe via Stripe.

#### BACKEND Agent Tasks:
- [ ] Create `server/config/stripe.js`:
  - Stripe client initialization
- [ ] Create `server/services/stripeService.js`:
  - `createCheckoutSession(userId)` - Create Stripe checkout
  - `createPortalSession(customerId)` - Customer portal
  - `handleWebhook(event)` - Process webhook events
- [ ] Create `server/controllers/subscriptionController.js`
- [ ] Create `server/routes/subscription.js`:
  - POST `/api/subscription/checkout` - Create checkout session
  - POST `/api/subscription/portal` - Customer portal
  - POST `/api/subscription/webhook` - Stripe webhook

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement Stripe checkout for US-11.2.3.

Create:
1. server/config/stripe.js - Stripe client
2. server/services/stripeService.js
3. server/controllers/subscriptionController.js
4. server/routes/subscription.js

createCheckoutSession(userId):
- Create Stripe Checkout Session
- Mode: subscription
- Success/cancel URLs
- Include user email
- Return session URL

Webhook handler for:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/pages/PricingPage.js`:
  - Free vs Premium comparison
  - Price display
  - "Upgrade Now" button
  - Redirects to Stripe Checkout
- [ ] Handle return from Stripe

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create pricing page for US-11.2.3.

Create client/js/pages/PricingPage.js:
- Two-column comparison: Free vs Premium
- Feature checklist for each
- Price: $X/month or $X/year
- "Upgrade Now" button
- On click: POST /api/subscription/checkout, redirect to Stripe

Handle success/cancel return URLs.
```

---

### US-11.2.5: Handle Subscription Webhooks
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a system, I want to process Stripe webhooks.

#### BACKEND Agent Tasks:
- [ ] Implement webhook handlers in stripeService:
  - `checkout.session.completed` - Activate subscription
  - `customer.subscription.updated` - Update tier/dates
  - `customer.subscription.deleted` - Downgrade to free
  - `invoice.payment_failed` - Handle failed payment
- [ ] Update User model when subscription changes

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement webhook handlers for US-11.2.5.

Update stripeService.handleWebhook(event):

checkout.session.completed:
- Get userId from metadata
- Update user: tier='premium', stripeCustomerId, expiresAt

customer.subscription.updated:
- Update expiresAt from subscription

customer.subscription.deleted:
- Set user tier='free', clear expiresAt

invoice.payment_failed:
- Log warning, could notify user

Verify webhook signature for security.
```

---

### US-11.1.1: Banner Ad Display
**Priority:** P1 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a product owner, I want banner ads for free users.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/AdBanner.js`:
  - Google AdSense integration
  - Only show for free tier
  - Responsive ad unit
  - Positions: dashboard, search results
- [ ] Create `client/js/utils/ads.js`:
  - Check if user is free tier
  - Load AdSense script conditionally

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add banner ads for US-11.1.1.

Create:
1. client/js/components/AdBanner.js
2. client/js/utils/ads.js

AdBanner:
- Conditionally render if user.tier === 'free'
- Include AdSense code slot
- Responsive sizes
- Placeholder during load

Add to: Dashboard (bottom), Search (sidebar)
```

---

## Epic 12: PWA & Mobile

### US-12.1.1: Service Worker
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want the app to work offline.

#### FRONTEND Agent Tasks:
- [ ] Create `client/sw.js`:
  - Install event: cache static assets
  - Fetch event: cache-first for static, network-first for API
  - Activate event: clean old caches
- [ ] Register service worker in app.js
- [ ] Cache strategy:
  - Static assets: cache forever
  - API responses: network-first with fallback
  - Images: cache with expiration

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create service worker for US-12.1.1.

Create client/sw.js:
- Cache static assets on install
- Cache API responses for offline access
- Network-first for API calls
- Cache-first for static files
- Clean up old caches on activate

Register in index.html or app.js.
Handle offline indicator in UI.
```

---

### US-12.1.2: Web App Manifest
**Priority:** P0 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to install the app on my device.

#### FRONTEND Agent Tasks:
- [ ] Create `client/manifest.json`:
  - name, short_name
  - Icons (192, 512, maskable)
  - start_url
  - display: standalone
  - theme_color, background_color
  - orientation
- [ ] Create app icons
- [ ] Link manifest in index.html

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create web app manifest for US-12.1.2.

Create client/manifest.json:
{
  "name": "WIT - Where Is It",
  "short_name": "WIT",
  "description": "Smart inventory management",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "icons": [...]
}

Add link in index.html head.
```

---

### US-12.1.3: Install Prompt
**Priority:** P1 | **Complexity:** S (2) | **Status:** ⬜ Not Started

**Story:** As a user, I want to be prompted to install the app.

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/components/InstallPrompt.js`:
  - Listen for beforeinstallprompt event
  - Show custom prompt after 2nd visit
  - "Install App" and "Not Now" buttons
  - Store dismissal in localStorage
  - Don't show if already installed

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create install prompt for US-12.1.3.

Create client/js/components/InstallPrompt.js:
- Listen for 'beforeinstallprompt' event
- Store event for later use
- Show prompt after 2nd visit (track in localStorage)
- Custom banner: "Install WIT for quick access"
- "Install" button triggers prompt
- "Maybe Later" dismisses for 7 days
- Hide if already in standalone mode
```

---

### US-12.2.1: Responsive Design
**Priority:** P0 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a mobile user, I want the app to work well on my phone.

#### FRONTEND Agent Tasks:
- [ ] Audit all pages for mobile responsiveness
- [ ] Create mobile navigation (hamburger/bottom tabs)
- [ ] Touch-friendly buttons (min 44x44px)
- [ ] Mobile-optimized forms
- [ ] Test on iOS and Android

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Ensure responsive design for US-12.2.1.

Audit and update all components:
- Mobile-first responsive layouts
- Bottom navigation bar for mobile
- Touch targets minimum 44x44px
- Full-width buttons on mobile
- Collapsible sidebar
- Stack columns on narrow screens

Test breakpoints: 320px, 375px, 768px, 1024px
```

---

## Epic 13: Reports & Analytics

### US-13.1.1: Inventory Value Report
**Priority:** P1 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a user, I want to see my total inventory value.

#### BACKEND Agent Tasks:
- [ ] Create `server/services/reportService.js`:
  - `getValueReport(userId)` - Aggregate item values
  - Group by location, category
  - Return totals and breakdowns
- [ ] Add route: GET `/api/reports/value`

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement value report for US-13.1.1.

Create server/services/reportService.js:

getValueReport(userId):
- Aggregate value.currentValue for all active items
- Group by location (with path)
- Group by category
- Return:
  {
    totalValue: number,
    byLocation: [{ locationId, path, value }],
    byCategory: [{ category, value, itemCount }],
    currency: 'USD'
  }

Add GET /api/reports/value route.
Premium feature check.
```

#### FRONTEND Agent Tasks:
- [ ] Create `client/js/pages/ReportsPage.js`:
  - Value overview card
  - By location breakdown (chart)
  - By category breakdown (chart)
- [ ] Use charts library (Chart.js)

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Create value report page for US-13.1.1.

Create client/js/pages/ReportsPage.js:
- Total value hero card
- Pie chart: value by category
- Bar chart: value by location
- Use Chart.js library

Gate behind premium tier check.
```

---

### US-13.2.1: Export to CSV
**Priority:** P1 | **Complexity:** M (3) | **Status:** ⬜ Not Started

**Story:** As a premium user, I want to export my inventory.

#### BACKEND Agent Tasks:
- [ ] Add to `server/services/reportService.js`:
  - `exportItems(userId, format)` - Generate CSV/JSON
  - Include all item fields
  - Include location path
- [ ] Add route: GET `/api/reports/export`
- [ ] Premium-only middleware

**BACKEND Prompt:**
```
You are the BACKEND agent for WIT (Where Is It).

Task: Implement CSV export for US-13.2.1.

Add exportItems(userId, format) to reportService:
- Query all active items
- Include: name, category, quantity, location path, value, etc.
- Generate CSV string
- Return as downloadable file

Add GET /api/reports/export?format=csv route.
Premium only - check tier.
Set Content-Type and Content-Disposition headers.
```

#### FRONTEND Agent Tasks:
- [ ] Add export button to ReportsPage
- [ ] Format selector (CSV, JSON)
- [ ] Download trigger

**FRONTEND Prompt:**
```
You are the FRONTEND agent for WIT (Where Is It).

Task: Add export functionality for US-13.2.1.

Add to ReportsPage:
- "Export Data" button
- Dropdown: CSV, JSON
- On click: call export API, trigger download
- Show premium gate for free users
```

---

## Epic 14: iOS Application (Summary)

### US-14.1.1 - US-14.4.3: iOS App Development
**Priority:** P0-P1 | **Status:** ⬜ Not Started

The iOS app is a native Swift/SwiftUI implementation. Key stories:

#### ARCHITECT Agent Tasks:
- [ ] Define iOS project structure
- [ ] Document API client requirements
- [ ] Define data models for iOS
- [ ] Plan offline sync strategy

**ARCHITECT Prompt:**
```
You are the ARCHITECT agent for WIT (Where Is It).

Task: Plan iOS app architecture for Epic 14.

Document in docs/IOS_ARCHITECTURE.md:
1. Project structure (Swift/SwiftUI)
2. API client design (matches web API)
3. Authentication flow (Keychain for token)
4. Core Data models for offline
5. Sync strategy
6. Camera/barcode integration
7. Push notification setup
```

---

## iOS Development Notes

The iOS app requires a native iOS developer. Key tasks:

1. **Project Setup** (US-14.1.1)
   - Xcode project with SwiftUI
   - SPM dependencies
   - Environment configuration

2. **API Client** (US-14.1.2)
   - URLSession-based client
   - Matches all web API endpoints
   - Token management with Keychain

3. **Authentication** (US-14.1.3)
   - Sign in with Apple
   - Email/password
   - Secure token storage

4. **Core Features** (US-14.2.x)
   - Location browser with tree
   - Item management
   - Native camera for scanning
   - AVFoundation barcode detection

5. **Offline Mode** (US-14.3.4)
   - Core Data local storage
   - Background sync
   - Conflict resolution

6. **App Store** (US-14.4.x)
   - App icons and screenshots
   - TestFlight beta
   - App Store submission

---

## Milestone 5 Completion Checklist

- [ ] Free tier limits enforced
- [ ] Stripe subscription working
- [ ] Webhooks processing correctly
- [ ] PWA installable
- [ ] Works offline (basic)
- [ ] Responsive on mobile
- [ ] Value report working
- [ ] CSV export working
- [ ] iOS app on TestFlight
- [ ] All interfaces updated
- [ ] Git commit: "Milestone 5 Complete: Monetization, PWA & iOS"

---

## Full Project Completion

After Milestone 5:
- [ ] All 146 user stories complete
- [ ] Full test coverage
- [ ] Documentation complete
- [ ] Production deployment ready
- [ ] iOS app submitted to App Store
- [ ] Launch! 🚀
