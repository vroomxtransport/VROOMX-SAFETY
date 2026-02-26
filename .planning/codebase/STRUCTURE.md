# Codebase Structure

**Analysis Date:** 2026-02-25

## Directory Layout

```
project-root/
├── backend/                    # Express.js API server
│   ├── config/                 # Database connection
│   ├── middleware/             # Auth, upload, error, rate-limit, maintenance
│   ├── models/                 # Mongoose schemas (40 models)
│   ├── routes/                 # Express routers with inline handlers (38 modules)
│   ├── services/               # Business logic + external integrations (39 services)
│   ├── utils/                  # Logger, regex escape helper
│   ├── templates/              # Email HTML templates
│   ├── uploads/                # File storage (category subdirs, gitignored)
│   ├── scripts/                # One-off admin scripts
│   ├── reports/                # Generated report output directory
│   └── server.js               # Entry point, middleware chain, cron jobs
├── frontend/                   # React 18 + Vite SPA
│   └── src/
│       ├── assets/             # Static assets, global CSS
│       ├── components/         # Reusable UI components
│       │   ├── layout/         # App shell: Layout, Sidebar, AppHeader, navConfig
│       │   ├── landing/        # Public marketing sections
│       │   ├── AIChat/         # Floating chat widget
│       │   ├── settings/       # Settings tab components
│       │   ├── reports/        # Report builder components
│       │   ├── filters/        # Filter sidebar/panel components
│       │   ├── fmcsa/          # FMCSA-specific display components
│       │   ├── csa-checker/    # Public CSA checker tool components
│       │   ├── clearinghouse/  # Clearinghouse workflow components
│       │   ├── claims/         # Damage claim components
│       │   ├── tickets/        # Support ticket components
│       │   ├── blog/           # Blog listing/article components
│       │   ├── admin/          # Super admin UI components
│       │   └── ui/             # Generic primitives
│       ├── context/            # React contexts (AuthContext, ThemeContext)
│       ├── data/               # Static data files (blog posts, landing copy, form options)
│       ├── hooks/              # Custom React hooks
│       ├── pages/              # Page-level components (one per route)
│       │   ├── admin/          # Super admin pages
│       │   ├── dashboard/      # Dashboard sub-components
│       │   ├── driver-detail/  # Driver detail sub-components
│       │   ├── vehicle-detail/ # Vehicle detail sub-components
│       │   └── designs/        # Dev-only design demos (never shown in prod)
│       ├── services/           # Frontend-side service utilities
│       ├── utils/              # api.js (Axios + all API service objects), helpers, analytics
│       ├── App.jsx             # Route definitions + route guards
│       └── main.jsx            # Vite entry point
├── DOCS/                       # Project documentation
├── .planning/                  # GSD planning docs
│   └── codebase/               # Codebase analysis (this directory)
└── CLAUDE.md                   # AI assistant instructions
```

## Directory Purposes

**`backend/config/`:**
- Purpose: Database connection setup
- Key files: `backend/config/database.js` (Mongoose connect with error handling)

**`backend/middleware/`:**
- Purpose: Express middleware for auth, authorization, file upload, error handling, maintenance mode
- Key files:
  - `backend/middleware/auth.js` — `protect`, `restrictToCompany`, `authorize`, `checkPermission`, `requireSuperAdmin`
  - `backend/middleware/subscriptionLimits.js` — plan enforcement for driver/vehicle/company/AI query limits
  - `backend/middleware/errorHandler.js` — `asyncHandler`, `AppError`, global error handler
  - `backend/middleware/upload.js` — Multer configuration (UUID filenames, MIME validation, path traversal protection)
  - `backend/middleware/maintenance.js` — maintenance mode toggle
  - `backend/middleware/demoGuard.js` — blocks writes for demo users

**`backend/models/`:**
- Purpose: Mongoose schema definitions; every model is company-scoped with `companyId` field
- Key models:
  - `backend/models/User.js` — multi-company membership via embedded `companies[]` array
  - `backend/models/Company.js` — DOT/MC numbers, SMS BASICs, FMCSA sync status, compliance score
  - `backend/models/Driver.js` — driver records with DQF fields
  - `backend/models/Vehicle.js` — vehicle records with inspection status
  - `backend/models/Violation.js` — FMCSA violations populated by `fmcsaInspectionService`
  - `backend/models/AuditLog.js` — 2-year TTL audit trail
  - `backend/models/Integration.js` — Samsara API integration config per company
  - `backend/models/index.js` — barrel export for all models

**`backend/routes/`:**
- Purpose: API route definitions with inline handler logic (no separate controllers)
- Entry: `backend/routes/index.js` — mounts all 38 modules under `/api`
- Notable routes:
  - `backend/routes/auth.js` — login, register, refresh, logout, password reset, demo login
  - `backend/routes/drivers.js` — CRUD + CSA impact, document upload
  - `backend/routes/violations.js` — violations CRUD + DataQ workflow
  - `backend/routes/billing.js` — Stripe subscription management + webhook (raw body)
  - `backend/routes/dashboard.js` — dashboard aggregation, FMCSA sync trigger
  - `backend/routes/admin.js` — super admin platform management (~73KB, largest route file)
  - `backend/routes/reports.js` — report generation (~100KB, comprehensive report system)
  - `backend/routes/csaChecker.js` — public DOT lookup for CSA checker lead magnet

**`backend/services/`:**
- Purpose: All business logic; plain object literal exports with async methods
- FMCSA pipeline services:
  - `backend/services/fmcsaSyncOrchestrator.js` — coordinates 6-step sync pipeline
  - `backend/services/fmcsaSyncService.js` — CSA BASIC scores from SAFER
  - `backend/services/fmcsaInspectionService.js` — violations from FMCSA DataHub
  - `backend/services/fmcsaViolationService.js` — inspection stats from SaferWebAPI
  - `backend/services/entityLinkingService.js` — links violations to Driver/Vehicle records
  - `backend/services/dataQAnalysisService.js` — DataQ challenge eligibility scoring
  - `backend/services/violationScannerService.js` — health check violation scanner
  - `backend/services/complianceScoreService.js` — 5-component weighted compliance score (0-100)
- AI services:
  - `backend/services/openaiVisionService.js` — document extraction (PDFs via Responses API, images via Chat Completions)
  - `backend/services/aiService.js` — Claude integration for compliance Q&A
- Infrastructure services:
  - `backend/services/emailService.js` — Resend API, fire-and-forget, logs to `EmailLog`
  - `backend/services/stripeService.js` — Stripe subscription lifecycle
  - `backend/services/auditService.js` — fire-and-forget audit logging with field-level diff
  - `backend/services/alertService.js` — alert generation + escalation for all companies
  - `backend/services/samsaraService.js` — Samsara telematics API sync
  - `backend/services/pdfService.js` — PDF report generation
  - `backend/services/scheduledReportService.js` — cron-driven report delivery

**`backend/utils/`:**
- Purpose: Shared utility functions
- Key files:
  - `backend/utils/logger.js` — production-safe logger with sensitive field sanitization

**`backend/uploads/`:**
- Purpose: File storage for user-uploaded documents; never served statically
- Subdirectories: `documents/`, `drivers/`, `vehicles/`, `violations/`, `drug-alcohol/`, `accidents/`, `maintenance/`, `logos/`, `temp/`
- Files served through `GET /api/documents/:id/download` with auth checks

**`frontend/src/App.jsx`:**
- Purpose: Complete route map for the application
- Contains: `<ProtectedRoute>`, `<PublicRoute>`, `<SuperAdminRoute>` guards; all route definitions; lazy loading with `lazyWithRetry`

**`frontend/src/context/`:**
- Purpose: Cross-cutting React state
- `AuthContext.jsx` — user, companies, activeCompany, subscription; login/logout/register/switchCompany/hasPermission
- `ThemeContext.jsx` — dark/light mode toggle

**`frontend/src/utils/api.js`:**
- Purpose: Single Axios instance + all ~45 API service objects
- Token management: access token in memory, refresh token in sessionStorage
- Interceptors: auto token refresh on 401, maintenance mode detection on 503
- All API calls go through named service objects (e.g., `driversAPI.getAll()`, `billingAPI.subscribe()`)

**`frontend/src/pages/`:**
- Purpose: One page component per route
- Heavy pages are lazy-loaded: `Dashboard`, `Compliance`, `ComplianceReport`, `DriverDetail`, `VehicleDetail`, `Billing`, `Settings`, `Reports`
- All admin pages under `frontend/src/pages/admin/` are lazy-loaded and `SuperAdminRoute`-protected

**`frontend/src/components/layout/`:**
- Purpose: App shell components
- `Layout.jsx` — outer shell with sidebar + header + `<Outlet>` for page content
- `Sidebar.jsx` — collapsible navigation with grouped sections
- `AppHeader.jsx` — top bar with user menu, alerts bell, company switcher
- `navConfig.js` — navigation item definitions (path, icon, label, section grouping)

**`frontend/src/components/landing/`:**
- Purpose: Public marketing page sections
- Key sections: `HeroSection.jsx`, `FeaturesSection.jsx`, `PricingSection.jsx`, `TestimonialsSection.jsx` (ROI calculator), `CTASection.jsx`, `FAQSection.jsx`, `FooterSection.jsx`
- Data: `frontend/src/data/landingData.js`

**`frontend/src/data/`:**
- Purpose: Static data for frontend (not fetched from API)
- `blogPosts.js` — blog article data (id, slug, date, isoDate, content)
- `landingData.js` — marketing copy, pricing tiers, feature lists, value props
- `claimOptions.js`, `ticketOptions.js`, `rdrTypes.js` — form select options

## Key File Locations

**Entry Points:**
- `backend/server.js` — backend HTTP server entry
- `frontend/src/main.jsx` — frontend Vite/React entry
- `frontend/src/App.jsx` — all frontend routes

**Configuration:**
- `backend/routes/index.js` — API route registry (all 38 modules)
- `backend/middleware/auth.js` — auth + tenant isolation exports
- `backend/middleware/subscriptionLimits.js` — plan enforcement middleware

**Core Logic:**
- `backend/services/fmcsaSyncOrchestrator.js` — FMCSA data pipeline
- `backend/services/complianceScoreService.js` — compliance scoring algorithm
- `backend/services/alertService.js` — alert generation for all companies
- `frontend/src/utils/api.js` — all frontend API calls

**Models:**
- `backend/models/User.js` — user + multi-company membership schema
- `backend/models/Company.js` — company + FMCSA data + compliance score
- `backend/models/Violation.js` — FMCSA violation records
- `backend/models/Driver.js` — driver + DQF fields
- `backend/models/index.js` — model barrel exports

**Testing:**
- No test files found in active source paths (tests referenced in `backend/package.json` scripts only)

## Naming Conventions

**Backend Files:**
- Route files: lowercase, camelCase (e.g., `drugAlcohol.js`, `csaChecker.js`, `cleanInspections.js`)
- Service files: camelCase with `Service` suffix (e.g., `alertService.js`, `complianceScoreService.js`)
- Model files: PascalCase matching model name (e.g., `Driver.js`, `CSAScoreHistory.js`, `FMCSAInspection.js`)
- Middleware files: lowercase, descriptive (e.g., `auth.js`, `errorHandler.js`, `subscriptionLimits.js`)

**Frontend Files:**
- Page components: PascalCase (e.g., `Dashboard.jsx`, `DriverDetail.jsx`, `CSACheckerPage.jsx`)
- Shared components: PascalCase (e.g., `DataTable.jsx`, `StatusBadge.jsx`, `LoadingSpinner.jsx`)
- Utility files: camelCase (e.g., `api.js`, `helpers.js`, `analytics.js`)
- Context files: PascalCase with `Context` suffix (e.g., `AuthContext.jsx`, `ThemeContext.jsx`)

**API Routes:**
- All mounted under `/api/` prefix
- Kebab-case path segments matching route files (e.g., `/api/drug-alcohol`, `/api/csa-checker`, `/api/damage-claims`)
- Named routes must come before parameterized `/:id` routes within each file (Express top-to-bottom evaluation)

**Database:**
- Model names: PascalCase singular (e.g., `Driver`, `Company`, `FMCSAInspection`)
- Collection names: Mongoose auto-pluralizes (e.g., `drivers`, `companies`, `fmcsainspections`)
- All schemas include `companyId` for tenant isolation; all include Mongoose `timestamps: true`

## Where to Add New Code

**New API Resource (e.g., "permits"):**
- Route handler: Create `backend/routes/permits.js` with Express Router
- Register: Add to `backend/routes/index.js` with `router.use('/permits', permitRoutes)`
- Model: Create `backend/models/Permit.js` with `companyId` field
- Service (if needed): Create `backend/services/permitService.js` as plain object literal
- Frontend API: Add `permitsAPI` export to `frontend/src/utils/api.js`
- Page: Create `frontend/src/pages/Permits.jsx`
- Route: Add to `frontend/src/App.jsx` under `<ProtectedRoute>`
- Nav: Add entry to `frontend/src/components/layout/navConfig.js`

**New Background Job:**
- Add cron schedule in `backend/server.js` with overlap guard boolean flag
- Use `logger.cron()` for logging

**New Landing Section:**
- Add section component to `frontend/src/components/landing/`
- Export from `frontend/src/components/landing/index.js`
- Data constants belong in `frontend/src/data/landingData.js`

**New Admin Panel Page:**
- Create page in `frontend/src/pages/admin/`
- Register as lazy-loaded route in `frontend/src/App.jsx` under `/admin` with `<SuperAdminRoute>`
- Backend: Add to `backend/routes/admin.js` with `requireSuperAdmin` middleware

**New Service:**
- Create `backend/services/{name}Service.js` as plain object literal: `const myService = { async doThing(companyId) { ... } }; module.exports = myService;`

**New Email Template:**
- HTML template: `backend/templates/`
- Send via `emailService.js` (fire-and-forget pattern; never await in request handlers)

**Utilities:**
- Backend helpers: `backend/utils/`
- Frontend helpers: `frontend/src/utils/helpers.js`

## Special Directories

**`backend/uploads/`:**
- Purpose: User-uploaded files organized by category
- Generated: At runtime by `upload.js` middleware
- Committed: No (gitignored); directory structure created automatically

**`backend/reports/`:**
- Purpose: Generated PDF report output
- Generated: Yes, at runtime
- Committed: No

**`frontend/src/pages/designs/`:**
- Purpose: Design demos for development previews only
- Generated: No
- Committed: Yes, but routes only render when `import.meta.env.DEV` is true

**`.planning/`:**
- Purpose: GSD project planning documents, phase tracking, codebase analysis
- Committed: Yes

---

*Structure analysis: 2026-02-25*
