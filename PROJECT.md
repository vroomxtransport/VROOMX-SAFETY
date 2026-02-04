# VroomX Safety - Project Documentation

## Overview

**VroomX Safety** is an AI-powered FMCSA compliance management platform designed for small and medium-sized trucking companies (1-50 trucks). The platform helps motor carriers maintain DOT compliance through automated tracking, alerts, and document management.

**Live URLs:**
- Frontend: https://vroomxsafety.com (Netlify)
- Backend: https://vroomx-safety.onrender.com (Render)

**Email:** Google Workspace on `vroomxsafety.com` domain
- Admin: admin@vroomxsafety.com
- Transactional (Resend): noreply@vroomxsafety.com
- Support (reply-to): support@vroomxsafety.com

**Status:** MVP Production-Ready

---

## Tech Stack

### Frontend
- **Framework:** React 18 + React Router 6
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom navy/orange theme)
- **UI Libraries:** Recharts, React Icons, React DatePicker, React Hot Toast
- **State Management:** React Context API (AuthContext, ThemeContext, FeatureFlagContext)
- **HTTP Client:** Axios
- **PDF Generation:** jsPDF + jsPDF-AutoTable

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (httpOnly cookie) + bcryptjs
- **AI Integration:** Anthropic Claude API, OpenAI API (Chat Completions + Responses API for PDF)
- **Payments:** Stripe (live mode with metered billing)
- **File Uploads:** Multer (10MB limit)
- **Email:** Resend SDK (transactional + notification emails) via Google Workspace domain
- **Scheduling:** node-cron

---

## Project Structure

```
TRUCKING COMPLIANCE HUB1/
├── backend/
│   ├── config/           # Database, FMCSA compliance config
│   ├── middleware/       # Auth, uploads, error handling, subscription limits, maintenance mode
│   ├── models/           # 23 Mongoose models
│   ├── routes/           # 26 API route files
│   ├── services/         # 11 business logic services
│   ├── templates/        # Email/document templates
│   ├── uploads/          # File storage
│   └── server.js         # Express entry point (port 5001)
│
├── frontend/
│   ├── src/
│   │   ├── components/   # 25 reusable components
│   │   ├── pages/        # 37 page components (incl. 7 admin pages)
│   │   ├── context/      # AuthContext, ThemeContext, FeatureFlagContext
│   │   ├── utils/        # API client, helpers
│   │   ├── data/         # Static data, blog posts
│   │   └── App.jsx       # Main routing
│   └── vite.config.js    # Vite config with API proxy
│
├── MOCKUPS/              # UI design mockups
├── MARKETING/            # Marketing materials
└── *.md                  # Documentation files
```

---

## Core Features

### Compliance Modules
1. **Driver Qualification Files (DQF)** - 49 CFR 391
   - CDL tracking with expiration alerts
   - Medical card validity (2-year tracking)
   - MVR reviews and employment history
   - Clearinghouse queries

2. **Vehicle Management** - 49 CFR 396
   - Annual DOT inspection tracking
   - Maintenance records and DVIR logging
   - Registration expiration alerts

3. **Violation & CSA Management**
   - Roadside inspection tracking
   - DataQ challenge workflow
   - SMS BASIC categorization
   - CSA score estimation

4. **Drug & Alcohol Program** - 49 CFR 382
   - Random testing records (50% drug, 10% alcohol)
   - Clearinghouse reporting
   - Return-to-Duty tracking

5. **Document Management**
   - Multi-category storage
   - Expiration tracking (7/30/60-day alerts)
   - AI document classification

### AI Features
- **VroomX AI Assistant** - Natural language compliance Q&A (Claude AI)
- **Regulation Assistant** - FMCSA regulation lookup
- **Document Intelligence** - Auto-classification via OpenAI Vision (images + PDF support)
- **Smart Maintenance Upload** - AI extracts invoice/work order data from photos and PDFs (OpenAI Responses API)
- **CSA Estimator** - Calculate potential CSA impact
- **DataQ Challenge System** - AI-powered violation analysis, challenge scoring, and professional letter generation

### Business Features
- **Free CSA Checker** - Public carrier lookup tool
- **Multi-Company Support** - Manage multiple DOT numbers
- **Team Management** - Role-based access control
- **Ticket System** - Support tickets
- **Damage Claims Tracking**

### Super Admin Panel
- **Analytics Dashboard** - MRR, churn rate, signup trends, revenue by plan, active users, top companies (Recharts)
- **User Power Tools** - Create users, bulk suspend/unsuspend/delete, force password reset, user detail drawer with login history & audit log
- **Company Power Tools** - Edit company (DOT read-only), activate/deactivate, member role management, member removal
- **Email Log Viewer** - Paginated list with search/filter by recipient, status, category, date range; detail modal
- **Announcements** - Create/edit/toggle site-wide banners (info/warning/critical), date ranges, optional links
- **Feature Flags** - Create/edit/toggle feature flags with validated keys; consumed via `useFeatureFlag()` hook
- **Maintenance Mode** - Toggle maintenance mode; non-admin users see maintenance page; auto-retry health check
- **System Health** - Database status, uptime, memory usage, service status (Email/Stripe/OpenAI)
- **Audit Logging** - Full route instrumentation across all API endpoints; company-scoped audit log tab in Settings

---

## Pricing (Per-Driver Billing)

| Plan  | Price     | Drivers Included | Extra Driver |
|-------|-----------|------------------|--------------|
| Solo  | $19/mo    | 1                | N/A          |
| Fleet | $39/mo    | 3                | +$6/driver   |
| Pro   | $89/mo    | 10               | +$5/driver   |

**In-app upgrades:** Users can upgrade Solo→Fleet, Solo→Pro, or Fleet→Pro at any time. Stripe calculates prorated credit for unused time on the old plan and charges the difference immediately. Preview modal shows exact charge before confirming.

---

## Database Models (23)

1. User, Company, Driver, Vehicle
2. Violation, DrugAlcoholTest, Document
3. Alert, Ticket, DamageClaim, Accident
4. ComplianceScore, CompanyInvitation, Lead
5. CSAScoreHistory, MaintenanceRecord, Task
6. ChecklistTemplate, ChecklistAssignment
7. AuditLog, EmailLog
8. Announcement, FeatureFlag, SystemConfig

---

## Key API Endpoints

| Route              | Purpose                          |
|--------------------|----------------------------------|
| /api/auth          | Authentication & user management |
| /api/drivers       | Driver CRUD + documents          |
| /api/vehicles      | Vehicle CRUD + maintenance       |
| /api/violations    | Violation tracking + DataQ       |
| /api/documents     | Document management              |
| /api/dashboard     | Compliance overview + alerts     |
| /api/billing       | Stripe subscription management   |
| /api/ai            | AI chat completions              |
| /api/csa           | CSA score estimation             |
| /api/reports       | PDF report generation            |
| /api/admin         | Super admin panel (analytics, users, companies, emails, announcements, features, maintenance, system) |
| /api/audit         | Company-scoped audit logs        |
| /api/announcements | Public active announcements      |
| /api/features      | Public active feature flags      |

---

## Development Setup

### Backend
```bash
cd backend
npm install
npm run dev  # Starts on port 5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Starts on port 5173
```

### Required Environment Variables
- MONGODB_URI
- JWT_SECRET
- STRIPE_SECRET_KEY (+ metered pricing IDs)
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- FRONTEND_URL
- RESEND_API_KEY
- EMAIL_FROM (default: `VroomX Safety <noreply@vroomxsafety.com>`)
- EMAIL_REPLY_TO (default: `support@vroomxsafety.com`)

---

## Market Context

- **Target:** 580,000+ active US motor carriers (99%+ have <10 trucks)
- **TAM:** $9.8B software market, growing to $16.4B by 2032
- **Differentiation:** AI-powered, flat per-driver pricing, modern tech stack

---

## Current Status (Feb 2026)

### Validated (Shipped)

**v2.0 Enhanced Reports Module (2026-02-04):**
- ✓ CSV/Excel export for all 9 report types with UTF-8 encoding
- ✓ Unified filtering: date presets, multi-select drivers/vehicles, status filters
- ✓ DQF extended with 49 CFR 391.51 fields (Clearinghouse, MVR, employment verification)
- ✓ 5 new FMCSA reports: Document Expiration, Drug & Alcohol, DataQ History, Accident, Maintenance Cost
- ✓ Report builder with field selection, templates, and 10-row preview
- ✓ Report history with 90-day retention and re-download capability
- ✓ Pre-built FMCSA templates (DQF Audit, Vehicle Inspection, Violations Summary)

**v1 FMCSA Data Sync Overhaul (2026-02-03):**
- ✓ Automatic 6-hour FMCSA data sync with 5-step orchestrator pipeline
- ✓ Violation model as single source of truth with sync/linking metadata
- ✓ Entity linking auto-matches violations to drivers (CDL) and vehicles (license plate)
- ✓ Vehicle Safety tab with OOS rate and BASIC breakdown
- ✓ DataQ analysis automatically scores violations for challenge potential
- ✓ Dashboard sync status with manual refresh and toast notifications
- ✓ Unlinked violations review page for manual entity assignment

**Previous:**
- ✓ Full authentication system with RBAC
- ✓ Driver/Vehicle/Violation management
- ✓ Document management with expiration alerts
- ✓ CSA score tracking and estimation
- ✓ Stripe billing integration (live mode)
- ✓ Landing page + public CSA Checker
- ✓ Dark/light mode theming
- ✓ Full security audit & remediation (32 vulnerabilities fixed)
- ✓ Email notification system (Resend) - 9 email types
- ✓ Audit log system with route instrumentation
- ✓ Comprehensive admin panel overhaul
- ✓ MVP Hardening (JWT, error handlers, rate limiting)

### In Progress
- Marketing and user acquisition
- Mobile responsiveness improvements
- Authenticated file download endpoint (replaces static /uploads)

### Future (Tier 2+)
- Empty states for all list pages
- Email preference enforcement (check opt-out before sending)
- Database compound indexes (drivers, documents, users)
- SEO meta tags (react-helmet-async, OG tags)
- Accessibility improvements (ARIA labels, dialog roles)
- Stripe webhook retry & dunning
- Request ID logging
- SMS alerts
- Full Clearinghouse integration
- ELD data import (Motive/Samsara API)
- Mobile PWA
- Safety training / LMS module
- httpOnly cookie JWT storage (replaces localStorage)
- Refresh token rotation
- Sentry APM / error monitoring
- BullMQ job queue (replaces node-cron for sync)
- Configurable sync frequency per company
- Sync health dashboard with job monitoring

---

## Changelog

### 2026-02-03 (Dark Mode & Sidebar UI Fixes)
- **Fix:** Dark mode persisting after logout causing invisible text on public pages
  - Root cause: `logout()` in AuthContext cleared auth state but not the theme localStorage key
  - When users enabled dark mode in-app and logged out, public pages (login, landing, blog, register) showed washed-out/invisible text due to light text colors on light backgrounds
  - Fix: Clear `vroomx-theme` localStorage and remove `.dark` class on logout
  - Defense-in-depth: All public pages now force light mode on mount
  - Files: `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`, `frontend/src/pages/Blog.jsx`, `frontend/src/pages/Landing.jsx`
- **UI:** Sidebar text and icon enhancements for better visibility and scannability
  - Section headers: Added orange gradient accent bar, increased font size (11px→12px), improved contrast
  - Icon containers: Added 32px rounded background with orange tint, distinct hover/active states
  - Text contrast: Improved from zinc-600/white-70 to zinc-700/white-80
  - Hover effect: Nav items lift slightly (-0.5px) with soft shadow on hover
  - Active state: Orange-50 background with shadow and left accent bar
  - Files: `frontend/src/components/Layout.jsx`, `frontend/src/index.css`

### 2026-02-02 (AI-Powered DataQ Challenge System)
- **Feature:** AI-Powered DataQ Challenge Analysis
  - Automatic identification of challengeable violations with scoring algorithm (0-100)
  - Scoring factors: violation age, OOS status, severity weight, error-prone codes, BASIC category
  - Challenge potential categories: High (75+), Medium (50-74), Low (<50)
  - Estimated CSA impact calculation if challenge is accepted
  - Evidence checklist recommendations per challenge type
  - Files: `backend/services/dataQAnalysisService.js` (new)
- **Feature:** AI DataQ Letter Generation
  - Professional DataQ challenge letter generation with CFR citations
  - Two new Claude AI prompts: `dataQChallengeAnalyzer` (JSON analysis) and `dataQLetterGenerator` (formal letters)
  - Challenge types: data_error, policy_violation, procedural_error, not_responsible
  - Files: `backend/services/aiService.js`
- **Feature:** DataQ Dashboard (`/app/dataq-dashboard`)
  - Summary stats: success rate, open challenges, accepted count, CSA points saved
  - Challenge status breakdown: pending, under review, accepted, denied, withdrawn
  - Average processing time tracking
  - AI-identified opportunities list with expandable analysis
  - How It Works section explaining the 3-step process
  - Files: `frontend/src/pages/DataQDashboard.jsx` (new)
- **Feature:** DataQ Opportunities Component
  - Card-based display with circular score indicators
  - Expandable details showing analysis factors and deductions
  - Estimated CSA impact per violation
  - One-click "Generate Challenge Letter" action
  - Files: `frontend/src/components/DataQOpportunities.jsx` (new)
- **Feature:** DataQ Letter Generation Modal
  - 5-step wizard: Analysis → Challenge Type → Letter Preview → Evidence Checklist → Submit
  - Deep AI analysis fetch option for detailed insights
  - Letter copy/download functionality
  - Evidence checklist with required/obtained tracking
  - Files: `frontend/src/components/DataQLetterModal.jsx` (new)
- **UI:** Violations page DataQ integration
  - New "DataQ Opportunities" tab with AI badge
  - AI badges on high-potential violations (75+ score) in list view
  - Quick access to letter generation from opportunities tab
  - Files: `frontend/src/pages/Violations.jsx`
- **API:** New DataQ endpoints
  - `POST /api/ai/analyze-dataq-opportunities` - Bulk violation analysis
  - `POST /api/ai/analyze-violation/:id` - Deep single violation analysis
  - `POST /api/ai/generate-dataq-letter/:id` - Generate challenge letter
  - `GET /api/violations/dataq-opportunities` - List ranked opportunities
  - `GET /api/violations/dataq-dashboard` - Dashboard statistics
  - `PUT /api/violations/:id/dataq/letter` - Save generated letter
  - `PUT /api/violations/:id/dataq/evidence` - Update evidence checklist
  - Files: `backend/routes/ai.js`, `backend/routes/violations.js`
- **Model:** Extended Violation schema
  - Added `dataQChallenge.aiAnalysis` (score, factors, confidence, recommendation, generatedAt)
  - Added `dataQChallenge.generatedLetter` (content, generatedAt, challengeType)
  - Added `dataQChallenge.evidenceChecklist` (item, required, obtained, documentUrl, notes)
  - Files: `backend/models/Violation.js`
- **UI:** Sidebar navigation updates
  - Added "Violations" link under MANAGEMENT section (`/app/violations`)
  - Added "DataQ Challenges" link with AI badge (`/app/dataq-dashboard`)
  - Removed redirect from `/app/violations` to `/app/compliance` - now renders Violations page
  - Files: `frontend/src/components/Layout.jsx`, `frontend/src/App.jsx`

### 2026-02-02 (Admin Panel Enhancements)
- **Feature:** Revenue Dashboard (`/admin/revenue`)
  - MRR (Monthly Recurring Revenue) with 12-month trend chart
  - MRR growth rate calculation (month-over-month)
  - Churn rate tracking with 6-month trend
  - Revenue breakdown by plan (Solo/Fleet/Pro) with pie chart
  - Failed payments table with user details
  - Upgrade/downgrade tracking (30-day window)
  - Files: `backend/routes/admin.js`, `frontend/src/pages/admin/AdminRevenue.jsx`
- **Feature:** Platform Alerts Panel (`/admin/alerts`)
  - Real-time alerts for critical platform events
  - Alert types: failed payments, high churn (>5%), trial expiring, service down, data integrity issues, open tickets
  - Severity levels: critical (red), warning (yellow), info (blue)
  - Clickable alerts linking to relevant admin pages
  - Summary cards showing alert counts by severity
  - Files: `backend/routes/admin.js`, `frontend/src/pages/admin/AdminAlerts.jsx`
- **Feature:** Support Tickets Admin View (`/admin/tickets`)
  - View all tickets across all companies (platform-wide)
  - Filter by status (open, in_progress, resolved, closed)
  - Filter by priority (urgent, high, medium, low)
  - Search by subject/description
  - Quick status change dropdown per ticket
  - Stats cards showing ticket counts by status
  - Company and user context for each ticket
  - Files: `backend/routes/admin.js`, `frontend/src/pages/admin/AdminTickets.jsx`
- **Feature:** User Analytics API (`GET /api/admin/user-analytics`)
  - DAU (Daily Active Users), WAU (Weekly), MAU (Monthly)
  - Login trend aggregation (30 days)
  - Top active companies by login frequency
  - Inactive users detection (no login in 30+ days)
  - New vs returning user breakdown
  - File: `backend/routes/admin.js`
- **UI:** Updated admin sidebar navigation
  - Added Revenue, Alerts, Tickets to navigation
  - Reordered for better workflow: Dashboard → Revenue → Alerts → Users → Companies → Tickets → ...
  - Files: `frontend/src/pages/admin/AdminLayout.jsx`, `frontend/src/App.jsx`

### 2026-02-02 (Samsara Integration Fixes)
- **Fix:** Samsara driver creation validation error
  - When creating a new driver from Samsara data via the "+" button, validation failed due to missing required fields
  - Now populates CDL fields from Samsara (`licenseNumber`, `licenseState`) with defaults for missing data
  - Defaults: CDL class 'A', CDL expiry 1 year from now, medical card expiry 2 years from now
  - Users can update placeholder values with real data after creation
  - File: `backend/services/samsaraService.js` (`createFromSamsara()` function)
- **Fix:** Samsara API `fuelPercent` → `fuelPercents` typo
  - Vehicle telematics refresh was failing with "Invalid stat type(s): fuelPercent"
  - Samsara API uses plural `fuelPercents` for the stat type parameter
  - Fixed in both API request and response mapping
  - File: `backend/services/samsaraService.js` (`getVehicleStats()` and `mapSamsaraTelematics()`)
- **Fix:** Samsara API 4-type limit error
  - Vehicle telematics was failing with "Vehicle stats are currently restricted to 4 types"
  - Was requesting 5 types: gps, obdOdometerMeters, gpsOdometerMeters, fuelPercents, engineStates
  - Removed `engineStates` (least critical) to stay within Samsara's 4-type limit
  - Removed engine status display from Vehicle Detail telematics card
  - Files: `backend/services/samsaraService.js`, `frontend/src/pages/VehicleDetail.jsx`
- **Feature:** Automatic Samsara data fetching
  - **On page load**: Vehicle telematics auto-refresh when viewing a Samsara-linked vehicle detail page
    - Silent background fetch (no loading spinner, errors logged but not shown)
    - Manual refresh button still available as fallback
    - File: `frontend/src/pages/VehicleDetail.jsx`
  - **Hourly cron job**: Syncs all Samsara integrations with `autoSync: true`
    - Runs at :30 past every hour
    - Updates drivers, vehicles, DVIRs, and HOS data
    - Updates `lastSyncAt` timestamp on success
    - Logs errors per-integration without stopping other syncs
    - File: `backend/server.js`
  - Users can toggle auto-sync on/off from the Integrations page settings

### 2026-02-02 (Samsara Vehicle Telematics)
- **Feature:** Samsara Vehicle Telematics - Pull real-time vehicle data from Samsara
  - New Vehicle model field: `samsaraTelematics` for storing live data
    - `currentMileage` - Odometer reading in miles (converted from meters)
    - `odometerSource` - Whether data comes from OBD or GPS
    - `location` - GPS coordinates, address, speed, heading
    - `fuelPercent` - Fuel level percentage (0-100)
    - `engineRunning` - Engine on/off status
    - `engineHours` - Total engine runtime
    - `lastUpdated` - Timestamp of last update
  - New Service methods in `samsaraService.js`:
    - `getVehicleStats()` - Fetch telematics from Samsara `/fleet/vehicles/stats` API
    - `syncVehicleTelematics()` - Update a vehicle's telematics from Samsara
    - `mapSamsaraTelematics()` - Convert Samsara stats to VroomX format
  - Updated `matchRecord()` - Now fetches telematics when matching vehicles
  - New Route: `POST /api/integrations/samsara/refresh-telematics/:vehicleId`
  - Files: `backend/models/Vehicle.js`, `backend/services/samsaraService.js`, `backend/routes/integrations.js`
- **UI:** Vehicle Detail telematics card
  - Shows only for vehicles linked to Samsara (`samsaraId` present)
  - Displays: Current mileage, Location (with Google Maps link), Fuel level (progress bar), Engine status
  - "Refresh" button to pull latest data from Samsara
  - Files: `frontend/src/pages/VehicleDetail.jsx`
- **API:** Added `integrationsAPI` to frontend API client
  - All Samsara integration methods centralized
  - `refreshTelematics(vehicleId)` for telematics refresh
  - Files: `frontend/src/utils/api.js`
- **Feature:** Samsara DVIR Import (Driver-Linked)
  - New Driver model field: `samsaraDvirs` array for storing inspection reports
    - `samsaraId` - Samsara DVIR ID
    - `vehicleName` - Which vehicle was inspected
    - `inspectionType` - pre_trip, post_trip, or other
    - `inspectedAt`, `submittedAt` - Timestamps
    - `location` - GPS coordinates and address
    - `defectsFound` - Boolean flag
    - `defects` - Array of defect details (category, description, isMajor, resolved)
    - `safeToOperate` - Vehicle safe to operate flag
  - New Service methods in `samsaraService.js`:
    - `getDvirs()` - Fetch DVIRs from Samsara `/fleet/dvirs` API
    - `syncDriverDvirs()` - Sync DVIRs and link to drivers by samsaraId
  - Updated `syncAll()` - Now syncs DVIRs after drivers
  - Files: `backend/models/Driver.js`, `backend/services/samsaraService.js`
- **UI:** Driver Detail DVIRs card
  - Shows only for drivers linked to Samsara (`samsaraId` present)
  - Displays: Recent DVIRs (last 10), expandable details
  - Each DVIR shows: inspection type, date, vehicle, defect count
  - Expandable to show: safe to operate status, location, defect details
  - Defects show: category, description, major flag, resolved status
  - Files: `frontend/src/pages/DriverDetail.jsx`

### 2026-01-31 (Sidebar Reorganization & Integrations)
- **Sidebar:** Reorganized navigation structure
  - New "COMPANY FILES" section: Policies, Templates, Checklists, Documents
  - Updated "TOOLS" section: Reports, Integrations
  - Added icons: `FiBookOpen`, `FiLink`
  - Files: `frontend/src/components/Layout.jsx`
- **New Page:** Policies (`/app/policies`)
  - Company policy document management
  - Upload, view, download, delete policies
  - Categories: Safety, HR, Operations, Compliance, Driver, Maintenance, Drug & Alcohol, Accident, Training
  - Search and filter functionality
  - Files: `frontend/src/pages/Policies.jsx`
- **New Page:** Integrations (`/app/integrations`)
  - Samsara fleet management integration UI
  - Connect/disconnect with API key authentication
  - Sync status display (drivers, vehicles, HOS logs)
  - Manual sync trigger and auto-sync settings
  - Data mapping options (drivers, vehicles, HOS)
  - Placeholder for future integrations (Geotab, Motive)
  - Actual brand logos: Samsara owl, Geotab, Motive
  - Files: `frontend/src/pages/Integrations.jsx`, `frontend/public/images/integrations/`
- **Routes:** Added `/app/policies` and `/app/integrations` routes
  - Files: `frontend/src/App.jsx`
- **Backend:** Samsara Integration API
  - New Model: `backend/models/Integration.js` - Stores encrypted API keys per company
  - New Service: `backend/services/samsaraService.js` - Samsara API client
    - `validateApiKey()` - Validate API key with Samsara
    - `getDrivers()` - Fetch drivers from Samsara
    - `getVehicles()` - Fetch vehicles from Samsara
    - `getHOSLogs()` - Fetch HOS data
    - `syncAll()` - Full sync operation
  - New Routes: `backend/routes/integrations.js`
    - `GET /api/integrations/samsara/status` - Get connection status
    - `POST /api/integrations/samsara/connect` - Connect with API key
    - `POST /api/integrations/samsara/disconnect` - Disconnect integration
    - `POST /api/integrations/samsara/sync` - Trigger manual sync
    - `PUT /api/integrations/samsara/settings` - Update sync settings
  - Features: Encrypted credential storage, company isolation, audit logging
  - Fix: Graceful handling of permission errors (HOS requires ELD permissions)
    - Each sync operation handled independently
    - Partial sync succeeds even if one endpoint lacks permissions
    - Clear error messages for missing permissions
- **Feature:** Samsara Manual Matching Workflow
  - New Model: `backend/models/SamsaraRecord.js` - Store pending Samsara data for matching
  - Added `samsaraId` field to Driver and Vehicle models for linking
  - New Service methods: `getPendingRecords()`, `matchRecord()`, `createFromSamsara()`
  - New Routes:
    - `GET /api/integrations/samsara/pending` - Get unmatched records
    - `POST /api/integrations/samsara/match` - Match to existing VroomX record
    - `POST /api/integrations/samsara/create` - Create new record from Samsara
    - `POST /api/integrations/samsara/skip` - Skip/ignore a record
  - New Component: `frontend/src/components/SamsaraMatchingModal.jsx`
  - UI: Pending matches banner with "Review Matches" button
  - User flow: Sync → Review pending → Match/Create/Skip each record
  - Once matched, future syncs auto-update linked records

### 2026-01-30 (Driver-Level CSA Attribution - Phase 4)
- **Feature:** Driver-Level CSA Attribution - Link violations to drivers and track CSA impact
  - New Service: `backend/services/driverCSAService.js` - Driver linking, CSA calculations, risk scoring
    - `linkViolationToDriver()` - Link violation to driver with audit trail
    - `unlinkViolation()` - Remove driver link with audit trail
    - `bulkLinkViolations()` - Bulk link multiple violations to a driver
    - `getDriverViolations()` - Get violations linked to a driver
    - `getDriverCSAImpact()` - Calculate risk score, BASIC breakdown, total points
    - `getTopRiskDrivers()` - Get drivers ranked by CSA impact
    - `getUnassignedViolations()` - Get violations without driver links
  - New Routes added to `backend/routes/violations.js`:
    - `GET /api/violations/unassigned` - Get unassigned violations
    - `POST /api/violations/bulk-link` - Bulk link violations to driver
    - `PUT /api/violations/:id/link-driver` - Link driver to violation
    - `DELETE /api/violations/:id/link-driver` - Unlink driver from violation
  - New Routes added to `backend/routes/drivers.js`:
    - `GET /api/drivers/risk-ranking` - Get top risk drivers by CSA impact
    - `GET /api/drivers/:id/csa` - Get driver's CSA impact and risk score
    - `GET /api/drivers/:id/violations` - Get driver's linked violations
- **UI:** Violations page driver linking
  - Link Driver button for unassigned violations
  - Driver dropdown selector modal
  - Unlink button for assigned violations
  - Driver filter (All/Unassigned/Specific driver)
  - Driver name now links to driver profile
  - Files: `frontend/src/pages/Violations.jsx`
- **UI:** DriverDetail CSA Impact section
  - Risk score indicator (High/Medium/Low)
  - Total violations, points, and OOS count
  - BASIC category breakdown with weighted points
  - Recent violations list with unlink button
  - Link to all driver violations
  - Files: `frontend/src/pages/DriverDetail.jsx`
- **Dashboard:** Top Risk Drivers card
  - Shows top 5 drivers by CSA impact
  - Risk level badge, violation count, weighted points
  - Link to driver profile
  - Files: `frontend/src/pages/Dashboard.jsx`
- **API Client:** New methods added to `frontend/src/utils/api.js`
  - driversAPI: `getRiskRanking()`, `getCSAImpact()`, `getViolations()`
  - violationsAPI: `linkDriver()`, `unlinkDriver()`, `getUnassigned()`, `bulkLink()`

### 2026-01-30 (FMCSA Inspection History - Phase 3)
- **Feature:** FMCSA Inspection History - View detailed inspection records
  - New Service: `backend/services/fmcsaInspectionService.js` - CRUD operations, filtering, stats, SaferWebAPI sync
  - New Routes: Added to `backend/routes/inspections.js`:
    - `GET /api/inspections/fmcsa` - List inspections with pagination and filters
    - `GET /api/inspections/fmcsa/:id` - Single inspection detail
    - `GET /api/inspections/fmcsa/stats` - Statistics and breakdown
    - `GET /api/inspections/fmcsa/violations` - All violations from inspections
    - `GET /api/inspections/fmcsa/recent` - Recent inspections for dashboard
    - `POST /api/inspections/fmcsa/sync` - Trigger SaferWebAPI sync
  - Uses existing `FMCSAInspection` model
- **UI:** New Inspection History page at `/app/inspection-history`
  - Table with sortable columns (date, state, level, violations)
  - Expandable rows showing violation details (code, description, BASIC, severity, OOS)
  - Filters: BASIC category, inspection level, date range, OOS only
  - Export to CSV functionality
  - Stats cards showing totals and OOS counts
  - Files: `frontend/src/pages/InspectionHistory.jsx`, `frontend/src/utils/api.js`
- **Dashboard:** Recent Inspections card added
  - Shows last 5 inspections with status indicators
  - Link to full inspection history
  - File: `frontend/src/pages/Dashboard.jsx`

### 2026-01-30 (Bug Fixes - Phase 1 & 2)
- **Fix:** Route ordering bug in `backend/routes/scheduledReports.js`
  - Moved `/types/available` route BEFORE `/:id` parameterized route
  - Prevents Express from matching `/types/available` as an ID
- **Fix:** Invalid enum value in `backend/models/ScheduledReport.js`
  - Removed `null` from `lastRunStatus` enum array
  - Mongoose handles null via `default: null`, not as enum value

### 2026-01-29 (Automated Report Scheduling)
- **Feature:** Automated Report Scheduling - Schedule recurring reports delivered via email
  - New Model: `backend/models/ScheduledReport.js` - Stores schedule configuration (frequency, recipients, report type, time, etc.)
  - New Service: `backend/services/scheduledReportService.js` - Handles CRUD, PDF generation to buffer, email delivery with attachments
  - New Routes: `backend/routes/scheduledReports.js` - CRUD endpoints + run-now + toggle active status
  - Cron Job: Added hourly scheduled report processor to `backend/server.js`
  - Email Template: `backend/templates/scheduled-report.html` - Customized template for scheduled reports
  - Supported report types: DQF, Vehicle Maintenance, Violations, Audit, CSA/SMS BASICs
  - Frequencies: Daily, Weekly (choose day), Monthly (choose date)
- **UI:** New Scheduled Reports page at `/app/scheduled-reports`
  - List view with schedule status, next run time, last run status
  - Create/Edit modal with frequency, day/time, recipient configuration
  - Run Now button to trigger immediate report delivery
  - Pause/Resume toggle for each schedule
  - Delete with confirmation
  - Files: `frontend/src/pages/ScheduledReports.jsx`, `frontend/src/App.jsx`, `frontend/src/utils/api.js`

### 2026-01-29 (Industry Benchmarking Feature)
- **Feature:** Industry Benchmarking - Compare carrier OOS rates against national averages
  - Backend: New `GET /api/csa/benchmark` endpoint returning vehicle/driver OOS rates vs. FMCSA national averages (20.72% vehicle, 5.51% driver)
  - Calculates status (better/average/worse) based on comparison to national rates
  - Includes peer group classification (small/medium/large/enterprise based on fleet size)
  - File: `backend/routes/csa.js`
- **UI:** Benchmark card added to Dashboard
  - Visual comparison bars showing your OOS rate vs national average
  - Color-coded status indicators (green=better, yellow=average, red=worse)
  - Overall status badge (Above Average / Mixed / Below Average)
  - Inspection and OOS counts displayed
  - Link to detailed compliance view
  - Files: `frontend/src/pages/Dashboard.jsx`, `frontend/src/utils/api.js`

### 2026-01-29 (Data Integrity Monitor Cleanup)
- **Feature:** Added cleanup functionality to Data Integrity Monitor admin panel
  - Delete orphaned records (records with missing/invalid companyId) by model or all at once
  - Delete records with invalid foreign key references (driverId, vehicleId)
  - Backend service methods: `deleteOrphanedRecords()`, `deleteAllOrphanedRecords()`, `deleteInvalidReferences()`
  - API endpoints: `DELETE /api/admin/data-integrity/orphaned/:resource`, `DELETE /api/admin/data-integrity/orphaned`, `DELETE /api/admin/data-integrity/invalid-refs/:resource/:field`
  - Files: `backend/services/dataIntegrityService.js`, `backend/routes/admin.js`
- **UI:** Frontend cleanup buttons in Data Integrity Monitor
  - "Fix All" button to delete all orphaned records across all models
  - Individual "Delete" buttons for each resource with issues
  - Confirmation dialogs before deletion (prevent accidental data loss)
  - Success/error feedback messages with deletion counts
  - Loading spinners during deletion operations
  - File: `frontend/src/pages/admin/AdminDataIntegrity.jsx`, `frontend/src/utils/api.js`
- **Fix:** IPv6 rate limiting warning (`ERR_ERL_KEY_GEN_IPV6`)
  - Custom `keyGenerator` functions now use `ipKeyGenerator` helper from express-rate-limit
  - Properly handles IPv6 addresses to prevent rate limit bypass
  - Files: `backend/server.js` (authLimiter), `backend/routes/fmcsaLookup.js` (syncLimiter)

### 2026-01-28 (CSA Score Analyzer UX Improvements)
- **Feature:** Structured AI analysis format in email/PDF reports
  - AI prompt now requests structured output with emoji headers: 📊 QUICK SUMMARY, ⚠️ ISSUES FOUND, ✅ YOUR 3-STEP ACTION PLAN
  - Email template formats each section with color-coded boxes (blue summary, amber issues, green action plan)
  - PDF template uses same formatting for consistent presentation
  - Fallback analysis (when AI unavailable) also uses structured format
  - Files: `backend/routes/csaChecker.js`, `backend/services/emailService.js`, `backend/services/pdfService.js`, `backend/templates/csa-report.html`, `backend/templates/csa-report-pdf.html`
- **Feature:** Email consent checkbox for legal compliance
  - Added required checkbox before "Send Free Report" button
  - Text: "I consent to receive emails from VroomX Safety including this report and promotional content."
  - Button disabled until consent given
  - File: `frontend/src/components/CSAChecker.jsx`
- **UI:** Simplified success view after email capture
  - Replaced full inline report with clean "Report Sent!" confirmation
  - Shows carrier name and "Check your inbox" message
  - Directs users to email for full PDF report
  - File: `frontend/src/components/CSAChecker.jsx`

### 2026-01-28 (CSA Score Analyzer Email Reports)
- **Feature:** CSA Score Analyzer now sends email reports with PDF attachment
  - PDF generation using Puppeteer (@sparticuz/chromium for cloud deployment)
  - Professional branded email template with BASIC scores, risk level, AI analysis
  - Risk level calculation (HIGH/MODERATE/LOW) based on FMCSA thresholds
  - Fire-and-forget email sending (doesn't block response)
  - Files: `backend/services/pdfService.js` (new), `backend/templates/csa-report.html` (new), `backend/templates/csa-report-pdf.html` (new), `backend/services/emailService.js`, `backend/services/fmcsaService.js`, `backend/routes/csaChecker.js`, `frontend/src/components/CSAChecker.jsx`

### 2026-01-28 (Text Visibility & Public Page Fixes)
- **Fix:** Text invisible on mobile and other browsers with OS dark mode enabled
  - Root cause: ThemeContext applies `dark` class based on OS preference, but public pages (Landing, Pricing) use hardcoded light colors that don't respond to dark class
  - Fix: Added `useEffect` hook to force light mode on public pages by removing `dark` class on mount
  - Files: `frontend/src/pages/Landing.jsx`, `frontend/src/pages/Pricing.jsx`
- **Fix:** companyId reference error in FMCSA routes
  - File: `backend/routes/fmcsa.js`

### 2026-01-28 (FMCSA Import & Driver Enhancements)
- **Feature:** FMCSA inspection/violation import
  - Import inspections and violations from FMCSA SAFER system
  - Files: Multiple FMCSA-related route and service files
- **Feature:** Added Clearinghouse Expiry, MVR Due Date, and Hire Date columns to drivers list
  - File: `frontend/src/pages/Drivers.jsx`
- **Dependency:** Added lodash for search debounce functionality

### 2026-01-28 (Standalone Pricing Page)
- **Feature:** Created standalone Pricing page at `/pricing`
  - 3 pricing tiers: Solo ($19/mo), Fleet ($39/mo), Pro ($89/mo)
  - Feature comparison matrix
  - FAQ accordion with billing questions
  - Trust badges (FMCSA compliance, SSL secured, 99.9% uptime)
  - File: `frontend/src/pages/Pricing.jsx`
- **UI:** Updated "Get Started" header button to navigate to `/pricing` instead of scrolling to pricing section
- **Fix:** Blurry text on CSA Score Analyzer section

### 2026-01-28 (5 UX Bug Fixes)
- **Fix:** Search functionality improvements with debounce
- **Fix:** Notifications display issues
- **Fix:** FMCSA sync error handling
- **Fix:** Vehicle and driver detail views
- Files: Multiple frontend components

### 2026-01-28 (Admin Panel & Compliance Improvements)
- **Feature:** Data Integrity Monitor in Admin Panel
  - Identifies data inconsistencies across the system
  - File: Admin panel routes and components
- **UI:** Improved sidebar section header visibility
  - File: `frontend/src/components/Layout.jsx`
- **Fix:** Object.entries errors on Compliance page when data is null/undefined
  - File: `frontend/src/pages/Compliance.jsx`

### 2026-01-28 (CSA Scoring & Dashboard)
- **Feature:** Improved CSA scoring with FMCSA methodology
  - Real vs Estimated indicators for score accuracy
  - Better threshold calculations
  - File: `frontend/src/components/CSATrends.jsx`, related services
- **Fix:** Dashboard metrics sync — 5 major fixes
  - Corrected data aggregation for compliance metrics
  - File: `frontend/src/pages/Dashboard.jsx`, backend routes
- **Fix:** VIN validation now accepts 16-17 characters (was strictly 17)
  - Some older vehicles have 16-character VINs
  - File: `backend/models/Vehicle.js`
- **Fix:** Vehicle details not showing in profile view
  - File: `frontend/src/pages/Vehicles.jsx`

### 2026-01-28 (In-App Plan Upgrade with Stripe Proration)
- **Feature:** Users can upgrade subscription plans (Solo→Fleet, Solo→Pro, Fleet→Pro) directly from the Billing page with automatic Stripe proration
  - Backend: Added `previewUpgrade()` using `stripe.invoices.createPreview()` and `upgradePlan()` using `stripe.subscriptions.update()` with `proration_behavior: 'create_prorations'`
  - Routes: `POST /api/billing/preview-upgrade` (returns prorated charge preview) and `POST /api/billing/upgrade` (executes the upgrade)
  - Frontend: Plan card buttons now show "Upgrade to Fleet/Pro" when on a lower plan. Confirmation modal displays current plan, new plan, prorated charge today, and new monthly price
  - Existing `customer.subscription.updated` webhook handler syncs plan changes automatically
  - Files: `backend/services/stripeService.js`, `backend/routes/billing.js`, `frontend/src/utils/api.js`, `frontend/src/pages/Billing.jsx`

### 2026-01-28 (Audit Follow-Up — JWT Cookie Migration + 3 Fixes)
- **Security:** Migrated JWT authentication from localStorage to httpOnly cookies. Eliminates XSS token theft vector.
  - Backend: Added `cookie-parser` middleware, `setTokenCookie()` helper sets httpOnly/secure/sameSite cookie on login, register, password update, company switch, and admin impersonate. Added `POST /api/auth/logout` to clear cookie. Auth middleware checks `req.cookies.token` first, falls back to `Authorization` header.
  - Frontend: Axios instance uses `withCredentials: true` (sends cookies automatically). Removed localStorage token storage, request interceptor, and Authorization header management. AuthContext validates session via `GET /api/auth/me` on mount.
  - Files: `backend/server.js`, `backend/middleware/auth.js`, `backend/routes/auth.js`, `backend/routes/companies.js`, `backend/routes/admin.js`, `frontend/src/utils/api.js`, `frontend/src/context/AuthContext.jsx`
- **Security:** Added `checkPermission('dashboard', 'edit')` to 6 remaining unprotected dashboard write routes: `/refresh-fmcsa`, `/alerts/:id/dismiss`, `/alerts/:id/resolve`, `/alerts/escalate`, `/alerts/dismiss-bulk`, `/compliance-score/calculate`.
  - File: `backend/routes/dashboard.js`
- **Security:** Added `escapeRegex()` to checklists search endpoint (was missed in prior fix).
  - File: `backend/routes/checklists.js`
- **Fix:** Document download UI now uses authenticated download endpoint instead of direct `fileUrl`. Added `downloadDocument()` helper with blob fetch and browser download trigger.
  - File: `frontend/src/pages/Documents.jsx`

### 2026-01-28 (Static Analysis Audit Remediation — 9 Fixes)
- **Security:** Fixed tenant isolation — replaced 44 occurrences of legacy `req.user.companyId._id || req.user.companyId` with `req.companyFilter.companyId` across 13 route files. Prevents multi-company users from writing data to stale/wrong company.
  - Files: `drivers.js`, `documents.js`, `vehicles.js`, `accidents.js`, `violations.js`, `damageClaims.js`, `drugAlcohol.js`, `tickets.js`, `inspections.js`, `dashboard.js`, `reports.js`, `csa.js`, `templates.js`
- **Security:** Added `checkPermission()` middleware to all previously unprotected endpoints in tasks (10 routes), maintenance (14 routes), checklists (12 routes), and dashboard write endpoints (2 routes). Enforces role-based access control.
  - Files: `backend/routes/tasks.js`, `backend/routes/maintenance.js`, `backend/routes/checklists.js`, `backend/routes/dashboard.js`
- **Security:** Added field whitelists (`allowedFields` pattern) to prevent mass assignment in POST create and PUT update endpoints. Only explicitly listed fields are accepted from `req.body`.
  - Files: `backend/routes/vehicles.js`, `backend/routes/tasks.js`, `backend/routes/accidents.js`, `backend/routes/violations.js`, `backend/routes/documents.js` (PUT only, POST already whitelisted)
- **Security:** Added `escapeRegex()` to tasks.js and maintenance.js search endpoints to prevent regex DoS/injection. Drivers, vehicles, documents already had this fix.
  - Files: `backend/routes/tasks.js`, `backend/routes/maintenance.js`
- **Security:** Deleted `VROOMX-SAFETY.env` from disk (contained production secrets). File was never committed to git (`.gitignore` `*.env` pattern covered it).
- **Feature:** Created authenticated document download route `GET /api/documents/:id/download` with company-scoped access control, file streaming, and proper Content-Type headers. Replaces direct `fileUrl` access pattern.
  - File: `backend/routes/documents.js`
- **Fix:** Audit log company attribution now uses `req.companyFilter?.companyId` (middleware-validated) as primary source instead of searching user's companies array. Falls back gracefully for admin-panel routes.
  - File: `backend/services/auditService.js`
- **Fix:** In-memory rate limit Maps in AI and CSA Checker routes now have periodic cleanup (every 5 minutes) to prevent unbounded memory growth.
  - Files: `backend/routes/ai.js`, `backend/routes/csaChecker.js`
- **Fix:** Subscription limits virtual now correctly maps `solo`, `fleet`, `pro` plans (replaced stale `starter`/`professional` mappings). Paying users were incorrectly falling back to `free_trial` limits.
  - File: `backend/models/User.js`

### 2026-01-28 (UI Changes — Driver/Vehicle Forms, CSA Charts, Archives)
- **UI:** Moved 24-Month Score Projection chart from CSA Estimator and Compliance Overview tab into the Score Trends module (CSATrends.jsx). Cleaned up unused imports and state from source files.
  - Files: `frontend/src/pages/CSAEstimator.jsx`, `frontend/src/pages/Compliance.jsx`, `frontend/src/components/CSATrends.jsx`
- **UI:** Moved "Welcome back!" toast notification into AI Chat panel as a system welcome message
  - Files: `frontend/src/pages/Login.jsx`, `frontend/src/components/AIChat/ChatWidget.jsx`
- **Feature:** Driver form overhaul — removed Employee ID (now optional), added: Driver Type (Company Driver / Owner-Operator), Address (street/city/state/zip), CDL Endorsements (multi-checkbox: H/N/P/S/T/X), CDL Restrictions (comma-separated text), MVR Expiry Date, Clearinghouse Expiry Date, Termination Date (shown only for terminated drivers)
  - Files: `backend/models/Driver.js`, `backend/routes/drivers.js`, `frontend/src/pages/Drivers.jsx`
- **Feature:** Driver Archive system — terminated drivers auto-archive with 3-year DQF retention countdown. "Archived" tab on Drivers page shows terminated drivers with "Can be deleted after MM/DD/YYYY" or "Safe to delete" badges. Restore button to unarchive.
  - Backend: `isArchived`, `archivedAt`, `retentionExpiresAt` fields, pre-save hook on status→terminated, `PATCH /api/drivers/:id/restore` endpoint, `?archived=true` query filter
  - Frontend: Active/Archived tab bar, archived table with retention info, restore handler
  - Files: `backend/models/Driver.js`, `backend/routes/drivers.js`, `frontend/src/pages/Drivers.jsx`
- **Feature:** Vehicle form expansion — added: Color, GVWR, Tire Size, Ownership (Owned/Leased/Financed), IFTA Decal #, Date Added to Fleet, Date Removed from Fleet, Cab Card Expiry, Annual Expiry
  - Files: `backend/models/Vehicle.js`, `frontend/src/pages/Vehicles.jsx`

### 2026-01-28 (Secret Rotation & Env Var Verification)
- **Security:** Rotated MongoDB Atlas password (`info_db_user`) — new password generated, `MONGODB_URI` updated in Render
- **Security:** Rotated OpenAI API key — new key created, old key deleted, `OPENAI_API_KEY` updated in Render
- **Security:** Rotated Resend API key — new key created, old key deleted, `RESEND_API_KEY` updated in Render
- **Verified:** All 13 production env vars confirmed set in Render dashboard (`NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SOLO_PRICE_ID`, `STRIPE_FLEET_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- **Verified:** `.env` never committed to git history — BFG purge not needed
- **Verified:** Post-redeploy health check passed — `{"status":"healthy","database":"connected"}` with 36s uptime

### 2026-01-28 (MVP Hardening — Tier 0+1 Deployment Fixes)
- **Security:** Changed JWT expiry from 7d to 1h in `render.yaml`
  - File: `render.yaml`
- **Security:** Added production env var validation at startup — server exits with clear error if missing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SOLO_PRICE_ID`, `STRIPE_FLEET_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `RESEND_API_KEY`, `FRONTEND_URL`
  - File: `backend/server.js`
- **Security:** Added weak JWT_SECRET length warning (< 32 chars)
  - File: `backend/server.js`
- **Stability:** Added `process.on('uncaughtException')` handler — logs + exits in production
- **Stability:** Updated `process.on('unhandledRejection')` — now exits in production (was log-only)
  - File: `backend/server.js`
- **Stability:** Health check (`/health`) now pings MongoDB and returns DB status; returns 503 if disconnected
  - File: `backend/server.js`
- **Fix:** Driver/vehicle creation race condition — wrapped in MongoDB transactions (`session.startTransaction` → `countDocuments` → `create` → `commit`) to prevent subscription limit bypass via concurrent requests
  - Files: `backend/routes/drivers.js`, `backend/routes/vehicles.js`
  - Added race condition warning comments to: `backend/middleware/subscriptionLimits.js`
- **Cleanup:** Removed ~45 debug `console.log` statements from 9 backend files (sensitive data like webhook events, price IDs, user IDs, DOT sync data)
  - Files: `stripeService.js` (13), `admin.js` (4), `fmcsaSyncService.js` (9), `fmcsaService.js` (12), `alertService.js` (2), `csaAlertService.js` (1), `emailService.js` (3), `dashboard.js` (1), `auth.js` (1)
- **UX:** Created `ErrorBoundary.jsx` — React class component catching render errors with dark-themed fallback UI, "Try Again" and "Reload Page" buttons. Wrapped `<App />` in ErrorBoundary.
  - Files: `frontend/src/components/ErrorBoundary.jsx` (new), `frontend/src/main.jsx`
- **UX:** Created `NotFound.jsx` — 404 page with "Go Home" and "Go to Dashboard" links. Replaced catch-all redirect with proper 404 page.
  - Files: `frontend/src/pages/NotFound.jsx` (new), `frontend/src/App.jsx`
- **UX:** Created `ConfirmDialog.jsx` — reusable modal replacing browser `confirm()`. Supports danger/warning/info variants. Migrated Billing.jsx cancel subscription flow.
  - Files: `frontend/src/components/ConfirmDialog.jsx` (new), `frontend/src/pages/Billing.jsx`
- **Fix:** Added 15-second Axios request timeout to prevent indefinite hangs
  - File: `frontend/src/utils/api.js`
- **Docs:** Added dev-only comment to Vite proxy config
  - File: `frontend/vite.config.js`
- **Analysis:** Updated `roadmap.html` competitive landscape — replaced 16 broad competitors with 7 focused (VroomX + 4 direct competitors + Samsara/Motive/J.J. Keller for context). Added Direct Competitors Deep Dive section with DOTDriverFiles, FleetDrive360, My Safety Manager, AvatarFleet profiles. Updated feature matrix and gap analysis.
  - File: `roadmap.html`

### 2026-01-27 (Maintenance AI Smart Upload Fix)
- **Fix:** AI smart upload not extracting data from PDF invoices — maintenance form fields stayed empty after upload
  - Root cause: `extractMaintenanceData()` used OpenAI Chat Completions API with `image_url` content type, which only supports images (JPEG, PNG, GIF, WebP). PDF invoices sent as `data:application/pdf;base64,...` were rejected by OpenAI.
  - Fix: Added PDF detection — PDFs now use OpenAI Responses API (`openai.responses.create()`) with `input_file` content type. Images continue using the existing Chat Completions `image_url` approach.
  - File: `backend/services/openaiVisionService.js`
- **Fix:** Moved `POST /smart-upload` route before parameterized `/:id` routes in Express — best practice to prevent route matching conflicts
  - File: `backend/routes/maintenance.js`
- **Fix:** Silent failure when AI extraction fails — user saw no feedback. Now shows error toast: "Could not extract data from document. Please fill in details manually."
  - File: `frontend/src/pages/Maintenance.jsx`

### 2026-01-27 (Dashboard Layout)
- **UI:** Compacted Compliance Score card — reduced gauge from 224px to 160px, score text from 6xl to 5xl, tightened padding/margins throughout
- **UI:** Moved Compliance Trend chart from middle of dashboard to bottom (after alerts/birthdays/status row)
  - File: `frontend/src/pages/Dashboard.jsx`

### 2026-01-27 (Admin Panel Overhaul)
- **Feature:** Comprehensive admin panel overhaul with analytics, power tools, and system operations
  - **Backend — New Models:** `Announcement.js` (message, type, dates, audience), `FeatureFlag.js` (key, description, enabled), `SystemConfig.js` (key-value store with static helpers)
  - **Backend — Maintenance Middleware:** `backend/middleware/maintenance.js` — checks SystemConfig for `maintenance_mode`, returns 503 for non-admin requests, caches 30s, superadmins bypass via JWT peek, `bustCache()` export
  - **Backend — Public Routes:** `backend/routes/announcements.js` (GET active), `backend/routes/features.js` (GET active flag keys)
  - **Backend — Admin Endpoints (~20 new):**
    - Analytics: `GET /api/admin/analytics` (signups, active users, MRR, churn, top companies via aggregation)
    - User tools: `POST /users`, `POST /users/bulk` (suspend/unsuspend/delete, max 50), `POST /users/:id/force-reset`, `GET /users/:id/login-history`, `GET /users/:id/audit-log`
    - Company tools: `PATCH /companies/:id` (DOT blocked), `DELETE /companies/:companyId/members/:userId`, `PATCH /companies/:companyId/members/:userId`
    - System: `GET /system` (DB, uptime, memory, services), `GET /emails` (paginated), `GET /emails/:id`, `GET /emails/stats`
    - Announcements CRUD + toggle, Feature Flags CRUD + toggle, Maintenance get/set
  - **Frontend — New Components:** `AnalyticsCharts.jsx`, `UserDetailDrawer.jsx`, `AdminEmails.jsx`, `AdminAnnouncements.jsx`, `AdminFeatureFlags.jsx`, `AnnouncementBanner.jsx`, `MaintenancePage.jsx`, `FeatureFlagContext.jsx`
  - **Frontend — Enhanced Pages:** AdminDashboard (analytics + system health + maintenance toggle), AdminUsers (add user, bulk actions, force reset, checkbox selection, detail drawer), AdminCompanies (edit modal, status toggle, member role/removal)
  - **Frontend — Wiring:** 25+ new adminAPI methods, announcementsAPI export, 503 maintenance interceptor, 3 new admin routes, FeatureFlagProvider wrapping, AnnouncementBanner in Layout
  - Files modified: 26 files, 3,927 lines added
- **Fix:** Feature flags page crash — `TypeError: t.map is not a function` because frontend read `response.data.flags` but backend returns `response.data.features`
  - File: `frontend/src/pages/admin/AdminFeatureFlags.jsx`
- **Fix:** System Health panel showing all red dots, "Unknown" database, "N/A" uptime/memory — 3 bugs:
  1. Data nesting mismatch: frontend stored `response.data` but needed `response.data.system`
  2. Service key mismatch: frontend used `email` but backend returns `resend`; also checked `.status === 'operational'` but backend returns booleans
  3. Missing emailStats: backend `/admin/system` didn't include email counts — added sent/delivered/failed (24h)
  - Files: `frontend/src/pages/admin/AdminDashboard.jsx`, `backend/routes/admin.js`

### 2026-01-27 (Stripe Webhook Fix)
- **Fix:** Stripe webhooks failing (8/8 failed) — subscriptions not updating after payment
  - Root cause: `express.json()` middleware parsed the request body before the webhook route's `express.raw()` could capture it. Stripe's `constructEvent()` needs the raw Buffer for HMAC signature verification, but received a parsed JS object instead → signature verification failed → all webhooks rejected → subscription never synced to MongoDB
  - Fix: Skip `express.json()` for `/api/billing/webhook` path so `express.raw()` in the billing route can capture the raw body
  - File: `backend/server.js`
- **Fix:** Manually synced test user `safety@horizonstartransport.com` subscription from `free_trial` to `solo/active` in MongoDB after confirming Stripe charge went through

### 2026-01-27 (Audit Log & Rate Limiting)
- **Feature:** Full audit log system with route instrumentation across all API endpoints
  - New files: `backend/models/AuditLog.js`, `backend/services/auditService.js`, `backend/routes/audit.js`
  - New frontend: `frontend/src/components/settings/AuditLogTab.jsx` — company-scoped audit log tab in Settings (admin/owner only) with CSV export
  - Instrumented all routes: auth, admin, companies, billing, drivers, vehicles, violations, documents, drugAlcohol, accidents, tickets, damageClaims, maintenance, tasks, checklists
  - Registered in: `backend/routes/index.js`, `backend/models/index.js`, `frontend/src/pages/Settings.jsx`
- **Fix:** Auth rate limiter blocked all emails when one email hit the limit — was keyed on IP only
  - Changed `keyGenerator` to `${req.ip}:${email}` so rate limiting is per-IP-per-email
  - File: `backend/server.js`
- **Feature:** Rate limit countdown timer on login page
  - Shows exact time remaining when rate limited (reads `RateLimit-Reset` header)
  - Live countdown display with disabled button showing "Locked (MM:SS)"
  - Added CORS `exposedHeaders` for rate limit headers
  - Files: `frontend/src/pages/Login.jsx`, `backend/server.js`
- **Fix:** Generic password validation error on reset-password page — now shows specific validation message
  - File: `backend/routes/auth.js`
- **Feature:** Password reset confirmation email sent after successful reset
  - File: `backend/routes/auth.js`, `backend/services/emailService.js`

### 2026-01-27 (Production Fixes & Email Testing)
- **Fix:** Added `trust proxy` setting for Render deployment — `express-rate-limit` was throwing `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on every request because Render's reverse proxy sets `X-Forwarded-For` but Express wasn't configured to trust it
  - File: `backend/server.js`
- **Fix:** Corrected production backend URL in PROJECT.md from `vroomx-safety-api.onrender.com` to `vroomx-safety.onrender.com`
- **Fix:** EmailLog missing required `from` field — all audit log writes were silently failing (Mongoose validation error caught but not visible). Added `from: FROM` to both success and failure log paths.
  - File: `backend/services/emailService.js`
- **Fix:** Resend SDK v2 error handling — SDK returns `{ data, error }` without throwing. Code was logging failed sends as "sent". Added `result.error` check to properly detect and log Resend rejections.
  - File: `backend/services/emailService.js`
- **Fix:** `sendReport()` null attachment — report email route passes `null` for PDF buffer, but `sendReport()` always attached it. Resend silently rejected the null attachment. Now skips attachment when `pdfBuffer` is null.
  - File: `backend/services/emailService.js`
- **Infra:** Added `RESEND_API_KEY` to Render environment variables — emails were silently skipped without it

#### Email System Test Results (2026-01-27)

All 6 testable email types verified on production with real Resend delivery:

| Email Type | Template | Status | Delivery Confirmed |
|------------|----------|--------|--------------------|
| Welcome | welcome | SENT | Yes |
| Email Verification | email-verification | SENT | Yes |
| Password Reset | password-reset | SENT | Yes |
| Company Invitation | company-invitation | SENT | Yes |
| Compliance Alert Digest | compliance-alert-digest | SENT | Yes |
| Report Email | report | SENT | Yes |

**Not tested (require external triggers):**
- Payment Success / Payment Failed — requires Stripe webhook events (will trigger on real payments)
- Trial Ending — requires user with trial ending in 2-3 days (cron runs at 9 AM daily)

**EmailLog audit trail:** All sent emails now properly logged with Resend message IDs in the `emaillogs` MongoDB collection.

### 2025-01-26
- **Limits:** Restricted free trial to 1 driver, 1 vehicle, 1 company (was 3/3/1)
  - Files: `backend/middleware/subscriptionLimits.js`, `backend/models/User.js`
  - Users on trial must subscribe to add more resources
- **UI:** Changed "Start Free Trial" to "Subscribe" on Billing page plan buttons
  - File: `frontend/src/pages/Billing.jsx`
  - Affected: Solo, Fleet, and Pro plan cards
- **Fix:** React Error #31 in BillingTab.jsx - Objects were being rendered directly instead of accessing nested properties (`.owned`, `.current`)
  - File: `frontend/src/components/settings/BillingTab.jsx`
  - Lines 48, 60, 72: Changed `currentUsage?.companies` to `currentUsage?.companies?.owned`, etc.
- **Added:** PROJECT.md - Comprehensive project documentation

### 2026-01-27 (Email System Completion)
- **Feature:** Added 3 missing frontend pages for email token flows
  - `frontend/src/pages/VerifyEmail.jsx` — handles `/verify-email?token=xxx` from verification emails
  - `frontend/src/pages/ResetPassword.jsx` — handles `/reset-password?token=xxx` from password reset emails
  - `frontend/src/pages/AcceptInvitation.jsx` — handles `/accept-invitation?token=xxx` from company invite emails
- **Feature:** "Forgot password?" link on Login page — sends reset email inline
  - File: `frontend/src/pages/Login.jsx`
- **Fix:** Email preferences field name mismatch — NotificationsTab was sending camelCase keys (`complianceAlerts`) but backend expects snake_case (`compliance_alerts`). Now aligned.
  - File: `frontend/src/components/settings/NotificationsTab.jsx`
- **Added:** API client methods for `forgotPassword`, `resetPassword`, `verifyEmail`
  - File: `frontend/src/utils/api.js`
- **Added:** Routes in App.jsx for verify-email, reset-password, accept-invitation
  - File: `frontend/src/App.jsx`

### 2026-01-27 (Google Workspace Email)
- **Infra:** Connected `vroomxsafety.com` domain to Google Workspace
  - Admin email: `admin@vroomxsafety.com`
  - Resend domain verified for transactional email delivery
  - Recommended aliases: `noreply@vroomxsafety.com` (FROM), `support@vroomxsafety.com` (REPLY_TO)

### 2026-01-27 (Email Notification System)
- **Feature:** Full email notification system using Resend SDK
  - New files: `backend/services/emailService.js`, `backend/models/EmailLog.js`, 10 HTML templates in `backend/templates/`
  - 9 email types: welcome, email verification, password reset, payment success/failure, trial ending, company invitation, compliance alert digest, report email
  - Branded HTML templates with VroomX Safety navy/orange theme, inline CSS for email client compatibility
  - Fire-and-forget pattern — emails never block app flow
  - Graceful degradation — works without Resend API key configured
  - EmailLog model for audit trail (tracks every send with Resend message ID)
  - User email preferences (compliance_alerts, billing, reports, product_updates)
  - New auth routes: forgot-password, reset-password, verify-email, email-preferences
  - Wired into: registration (welcome + verification), Stripe webhooks (payment success/failure), company invitations, daily 6 AM alert digest cron, 9 AM trial ending cron, report email route
  - Frontend: NotificationsTab in Settings with toggle switches per category
  - Modified files: `auth.js`, `stripeService.js`, `companies.js`, `server.js`, `reports.js`, `Settings.jsx`, `api.js`
  - Package: `resend` added to backend

### 2026-01-27 (Bug Fixes & Polish)
- **Fix:** Restored `database.js` crash-on-failure behavior - was silently continuing without MongoDB connection
  - File: `backend/config/database.js`
- **Fix:** Accidents route using wrong permission module (`violations` instead of `accidents`) across all 6 handlers
  - File: `backend/routes/accidents.js`
- **Fix:** Dynamic Tailwind classes on Landing page badges not compiling (`bg-${var}-50` pattern)
  - File: `frontend/src/pages/Landing.jsx` - replaced with static class maps
- **Fix:** Auth redirect pointing to `/dashboard` instead of `/app/dashboard`
  - File: `frontend/src/App.jsx`
- **Cleanup:** Removed 35 console.log/console.error statements leaking debug info in production
  - Files: 16 frontend files (AuthContext, Reports, Register, Tickets, Tasks, Maintenance, CSAEstimator, DrugAlcohol, Settings, Documents, Accidents, AlertsDashboard, Violations, Checklists, DamageClaims, CompanySwitcher)
- **Polish:** Search input now responsive (`w-40 lg:w-64` instead of fixed `w-64`)
  - File: `frontend/src/components/Layout.jsx`
- **A11y:** Added ARIA labels to search input and notifications button
  - File: `frontend/src/components/Layout.jsx`
- **Docs:** Updated `.env.example` with 11 missing production variables (Stripe, AI, JWT refresh, frontend URL)
  - File: `backend/.env.example`

### 2026-01-26
- **Fix:** Free trial usage display showed ∞ instead of 1 for driver/vehicle limits
  - File: `backend/middleware/subscriptionLimits.js` (lines 234, 238)
  - Changed `plan === 'solo'` to `(plan === 'solo' || plan === 'free_trial')`
- **Security Audit:** Full-stack security audit performed (32 vulnerabilities found)
  - **7 CRITICAL:** Exposed credentials in .env, NoSQL injection via regex, unprotected seed endpoint, Puppeteer HTTPS bypass, XSS via dangerouslySetInnerHTML, JWT in localStorage, Stripe webhook validation
  - **12 HIGH:** Missing rate limiting, weak passwords, file upload path traversal, unauth file access, long JWT expiry, admin impersonation gaps, RBAC bypass, mass assignment, unhashed reset tokens, no email verification, no brute force protection, privilege escalation
  - **13 MEDIUM:** CORS config, incomplete Helmet, debug logs, error info leak, no magic bytes validation, SSN exposure, no HIPAA controls, no audit trail, subscription gaps, Morgan header logging, no CSRF, no data retention policy
  - **Full remediation applied** - all 15 code fixes implemented and verified

#### Security Fixes Applied (2026-01-26 / 2026-01-27)

**CRITICAL Fixes:**
1. **JWT Secret Rotated** - Replaced weak predictable secret with 128-char cryptographic hex string; reduced expiry from 7d to 1h
   - Files: `backend/.env`
2. **NoSQL Injection Fixed** - Added `escapeRegex()` to all search endpoints to prevent regex injection attacks
   - Files: `backend/routes/drivers.js`, `backend/routes/documents.js`, `backend/routes/vehicles.js`
3. **Seed Endpoint Protected** - Added `protect` + `requireSuperAdmin` middleware; blocked entirely in production
   - File: `backend/routes/seed.js`
4. **Puppeteer HTTPS Fixed** - `ignoreHTTPSErrors` now only `true` in development, `false` in production
   - File: `backend/services/fmcsaService.js`
5. **XSS Prevention** - Added DOMPurify sanitization for `dangerouslySetInnerHTML` in blog content
   - File: `frontend/src/components/blog/ArticleModal.jsx`
   - Package added: `dompurify`
6. **Stripe Webhook Hardened** - Explicit `StripeSignatureVerificationError` handling; generic error messages
   - File: `backend/routes/billing.js`

**HIGH Fixes:**
7. **Rate Limiting Added** - Global: 200 req/15min on `/api`; Auth: 15 req/15min on login/register
   - File: `backend/server.js`
   - Package added: `express-rate-limit`
8. **Password Strength** - Now requires uppercase, lowercase, number, and special character
   - File: `backend/models/User.js`
9. **File Upload Security** - Path traversal prevention, upload folder whitelist, MIME+extension validation, filename sanitization
   - File: `backend/middleware/upload.js`
10. **Static Uploads Removed** - `express.static('/uploads')` removed to prevent unauthorized file access
    - File: `backend/server.js`
11. **Admin Security** - Self-modification blocked, impersonation reduced to 30min, super admin impersonation blocked, audit logging added
    - File: `backend/routes/admin.js`
12. **Auth Middleware Hardened** - JWT algorithm restricted to HS256, legacy RBAC role fallback removed
    - File: `backend/middleware/auth.js`
13. **Mass Assignment Prevention** - Driver update endpoint now uses field whitelist; SSN excluded from detail views
    - File: `backend/routes/drivers.js`

**MEDIUM Fixes:**
14. **Debug Logs Removed** - Removed 4 console.log statements leaking subscription/registration info
    - File: `backend/routes/auth.js`
15. **Error Sanitization** - Duplicate key and validation errors use generic messages in production; 404 handler hides URL path in production
    - File: `backend/middleware/errorHandler.js`
16. **Server Hardening** - Full Helmet config (CSP, HSTS, X-Frame-Options), CORS fails closed without FRONTEND_URL, env var validation at startup, custom Morgan format excludes auth headers
    - File: `backend/server.js`

#### Security Test Results (2026-01-27)

| Test | Expected | Result |
|------|----------|--------|
| Login auth (wrong creds) | 401 | PASS |
| Seed endpoint (no auth) | 401 | PASS |
| Seed endpoint (regular user) | 403 | PASS |
| Uploads directory | 404 | PASS |
| Health endpoint | 200 | PASS |
| NoSQL injection (`search=.*`) | 0 results | PASS |
| X-Content-Type-Options header | Present | PASS |
| HSTS header | Present | PASS |
| X-Frame-Options header | Present | PASS |
| CORS (evil origin) | Blocked | PASS |

#### Remaining Manual Actions
- ~~Rotate MongoDB credentials in Atlas dashboard~~ — **Done 2026-01-28**
- ~~Rotate OpenAI API key in OpenAI dashboard~~ — **Done 2026-01-28**
- ~~Rotate Resend API key~~ — **Done 2026-01-28**
- ~~Remove `.env` from git history~~ — **Not needed** (never committed)
- Add authenticated file download endpoint to replace static `/uploads`
