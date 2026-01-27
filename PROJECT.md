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
- **Authentication:** JWT + bcryptjs
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

## Current Status (Jan 2026)

### Completed
- Full authentication system with RBAC
- Driver/Vehicle/Violation management
- Document management with expiration alerts
- CSA score tracking and estimation
- Stripe billing integration (live mode)
- Landing page + public CSA Checker
- Dark/light mode theming
- All P0-P4 API tests passing
- Free trial limits (1 driver, 1 vehicle, 1 company)
- **Full security audit & remediation (32 vulnerabilities fixed)**
  - Rate limiting, NoSQL injection prevention, XSS sanitization
  - Helmet security headers, CORS hardening, JWT algorithm pinning
  - File upload security, admin audit logging, error sanitization
- **Email notification system (Resend)** - 9 email types with branded templates
  - Welcome, email verification, password reset, payment success/failure
  - Trial ending, company invitation, compliance alert digest, report email
  - Email preferences UI in Settings, EmailLog audit trail
- **Audit log system** - Full route instrumentation across all API endpoints
  - AuditLog model with action/resource/detail tracking
  - Company-scoped audit log tab in Settings (admin/owner only)
  - Export to CSV support
- **Per-email rate limiting** - Auth rate limiter keys on IP+email so blocking one email doesn't block others
- **Rate limit countdown UI** - Login page shows exact countdown timer when rate limited
- **Comprehensive admin panel overhaul** - Analytics, user/company power tools, system operations
  - Analytics dashboard with MRR, churn, signup trends, revenue by plan, active users, top companies
  - User power tools: create, bulk actions, force password reset, detail drawer with login history
  - Company power tools: edit (DOT read-only), activate/deactivate, member role management
  - Email log viewer with search/filter and detail modal
  - Announcement system with global dismissible banners
  - Feature flags with `useFeatureFlag()` hook and FeatureFlagContext
  - Maintenance mode with middleware, admin toggle, and auto-retry maintenance page
  - System health monitoring: DB status, uptime, memory, service status

### In Progress
- Marketing and user acquisition
- Mobile responsiveness improvements
- Authenticated file download endpoint (replaces static /uploads)

### Future
- SMS alerts
- Full Clearinghouse integration
- Document OCR
- Mobile app
- httpOnly cookie JWT storage (replaces localStorage)
- Refresh token rotation

---

## Changelog

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
- Rotate MongoDB credentials in Atlas dashboard
- Rotate OpenAI API key in OpenAI dashboard
- Remove `.env` from git history (`git filter-branch` or BFG)
- Add authenticated file download endpoint to replace static `/uploads`
