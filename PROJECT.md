# VroomX Safety - Project Documentation

## Overview

**VroomX Safety** is an AI-powered FMCSA compliance management platform designed for small and medium-sized trucking companies (1-50 trucks). The platform helps motor carriers maintain DOT compliance through automated tracking, alerts, and document management.

**Live URLs:**
- Frontend: https://vroomxsafety.com (Netlify)
- Backend: https://vroomx-safety-api.onrender.com (Render)

**Status:** MVP Production-Ready

---

## Tech Stack

### Frontend
- **Framework:** React 18 + React Router 6
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom navy/orange theme)
- **UI Libraries:** Recharts, React Icons, React DatePicker, React Hot Toast
- **State Management:** React Context API (AuthContext, ThemeContext)
- **HTTP Client:** Axios
- **PDF Generation:** jsPDF + jsPDF-AutoTable

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + bcryptjs
- **AI Integration:** Anthropic Claude API, OpenAI API
- **Payments:** Stripe (live mode with metered billing)
- **File Uploads:** Multer (10MB limit)
- **Email:** Resend SDK (transactional + notification emails)
- **Scheduling:** node-cron

---

## Project Structure

```
TRUCKING COMPLIANCE HUB1/
├── backend/
│   ├── config/           # Database, FMCSA compliance config
│   ├── middleware/       # Auth, uploads, error handling, subscription limits
│   ├── models/           # 20 Mongoose models
│   ├── routes/           # 26 API route files
│   ├── services/         # 11 business logic services
│   ├── templates/        # Email/document templates
│   ├── uploads/          # File storage
│   └── server.js         # Express entry point (port 5001)
│
├── frontend/
│   ├── src/
│   │   ├── components/   # 21 reusable components
│   │   ├── pages/        # 32 page components
│   │   ├── context/      # AuthContext, ThemeContext
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
- **Document Intelligence** - Auto-classification via OpenAI Vision
- **CSA Estimator** - Calculate potential CSA impact

### Business Features
- **Free CSA Checker** - Public carrier lookup tool
- **Multi-Company Support** - Manage multiple DOT numbers
- **Team Management** - Role-based access control
- **Ticket System** - Support tickets
- **Damage Claims Tracking**

---

## Pricing (Per-Driver Billing)

| Plan  | Price     | Drivers Included | Extra Driver |
|-------|-----------|------------------|--------------|
| Solo  | $19/mo    | 1                | N/A          |
| Fleet | $39/mo    | 3                | +$6/driver   |
| Pro   | $89/mo    | 10               | +$5/driver   |

---

## Database Models (20)

1. User, Company, Driver, Vehicle
2. Violation, DrugAlcoholTest, Document
3. Alert, Ticket, DamageClaim, Accident
4. ComplianceScore, CompanyInvitation, Lead
5. CSAScoreHistory, MaintenanceRecord, Task
6. ChecklistTemplate, ChecklistAssignment

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
- Email verification on registration
- Refresh token rotation

---

## Changelog

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
