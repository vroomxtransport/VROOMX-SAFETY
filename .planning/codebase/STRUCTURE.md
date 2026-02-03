# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
trucking-compliance-hub/
├── backend/                          # Express.js API server
│   ├── server.js                    # Entry point, middleware chain, cron jobs
│   ├── package.json                 # Dependencies, npm scripts
│   ├── .env.example                 # Required environment variables template
│   ├── config/                      # Configuration modules
│   │   ├── database.js              # MongoDB connection
│   │   ├── fmcsaCompliance.js       # FMCSA compliance rules and DQF requirements
│   │   └── ...                      # Other config files
│   ├── middleware/                  # Express middleware
│   │   ├── auth.js                  # JWT verification, company isolation, permissions
│   │   ├── errorHandler.js          # Global error handler, asyncHandler wrapper, AppError class
│   │   ├── upload.js                # Multer configuration (10MB, UUID filenames, validation)
│   │   ├── subscriptionLimits.js    # Plan limit enforcement before resource creation
│   │   ├── maintenance.js           # Maintenance mode check
│   │   ├── demoGuard.js             # Block write operations for demo users
│   │   └── ...                      # Other middleware
│   ├── models/                      # Mongoose schemas (~25 models)
│   │   ├── User.js                  # Multi-company support, subscription, permissions
│   │   ├── Company.js               # Company profile, settings, feature flags
│   │   ├── Driver.js                # Personal info, CDL, medical card, FMCSA docs
│   │   ├── Vehicle.js               # Vehicle details, DVIRs, maintenance records
│   │   ├── Violation.js             # FMCSA violations, DataQ status, AI analysis
│   │   ├── Ticket.js                # Safety tickets
│   │   ├── Accident.js              # Accident records
│   │   ├── DamageClaim.js           # Damage claim records
│   │   ├── FMCSAInspection.js        # FMCSA inspection records
│   │   ├── Inspection.js            # Vehicle inspection records
│   │   ├── MaintenanceRecord.js      # Vehicle maintenance history
│   │   ├── Document.js              # Uploaded documents (with encryption)
│   │   ├── AuditLog.js              # Immutable audit trail, 2-year TTL
│   │   ├── AlertLog.js              # Driver compliance alerts
│   │   ├── EmailLog.js              # Email delivery tracking
│   │   ├── FeatureFlag.js           # A/B testing and feature toggles
│   │   ├── Task.js                  # Work tasks/assignments
│   │   ├── ChecklistTemplate.js      # Compliance checklist templates
│   │   ├── ChecklistAssignment.js    # User checklist assignments
│   │   ├── CSAScoreHistory.js        # Historical CSA score tracking
│   │   ├── SamsaraRecord.js          # External Samsara sync records
│   │   ├── SystemConfig.js           # Platform-wide configuration
│   │   ├── ScheduledReport.js        # Report generation schedules
│   │   ├── AIQueryUsage.js           # AI API usage tracking for billing
│   │   └── index.js                 # Centralized model exports
│   ├── services/                    # Business logic modules (~20 services)
│   │   ├── auditService.js          # Fire-and-forget audit logging with diffs
│   │   ├── emailService.js          # Nodemailer + Resend integration
│   │   ├── openaiVisionService.js    # Document extraction (PDFs, images)
│   │   ├── aiService.js             # Claude integration for Q&A
│   │   ├── complianceScoreService.js # CSA score calculation
│   │   ├── csaAlertService.js       # Alert generation
│   │   ├── csaCalculatorService.js   # CSA component calculations
│   │   ├── driverCSAService.js       # Driver-specific CSA logic
│   │   ├── stripeService.js          # Stripe subscription lifecycle
│   │   ├── fmcsaService.js           # FMCSA API integration
│   │   ├── fmcsaViolationService.js  # FMCSA violation processing
│   │   ├── fmcsaInspectionService.js # FMCSA inspection data
│   │   ├── samsaraService.js         # Samsara API integration
│   │   ├── pdfService.js             # PDF generation (compliance reports)
│   │   ├── alertService.js           # Alert orchestration
│   │   ├── dataAuditService.js       # Data quality validation
│   │   ├── dataQAnalysisService.js   # DataQ opportunity analysis
│   │   ├── documentIntelligenceService.js  # Document parsing/classification
│   │   ├── aiUsageService.js         # AI quota tracking and enforcement
│   │   ├── scheduledReportService.js # Report scheduling and generation
│   │   ├── templateGeneratorService.js # Template creation
│   │   └── index.js                 # Service exports (if centralized)
│   ├── routes/                      # API endpoints (31 route modules)
│   │   ├── index.js                 # Central router mounting all sub-routers
│   │   ├── auth.js                  # /api/auth/* (login, register, logout, password reset)
│   │   ├── drivers.js               # /api/drivers/* (CRUD, alerts, stats, documents)
│   │   ├── vehicles.js              # /api/vehicles/* (CRUD, maintenance, inspections)
│   │   ├── violations.js            # /api/violations/* (CRUD, DataQ, AI analysis)
│   │   ├── tickets.js               # /api/tickets/*
│   │   ├── drugAlcohol.js           # /api/drug-alcohol/* (drug/alcohol test records)
│   │   ├── documents.js             # /api/documents/* (upload, download, encryption)
│   │   ├── dashboard.js             # /api/dashboard/* (overview, metrics, refresh)
│   │   ├── accidents.js             # /api/accidents/*
│   │   ├── reports.js               # /api/reports/* (compliance reports)
│   │   ├── scheduledReports.js       # /api/scheduled-reports/*
│   │   ├── inspections.js           # /api/inspections/* (vehicle inspections)
│   │   ├── ai.js                    # /api/ai/* (AI endpoints: analyze, extract, generate)
│   │   ├── damageClaims.js          # /api/damage-claims/*
│   │   ├── companies.js             # /api/companies/* (multi-company management)
│   │   ├── billing.js               # /api/billing/* (subscription, Stripe webhook)
│   │   ├── invitations.js           # /api/invitations/* (user invites)
│   │   ├── csaChecker.js            # /api/csa-checker/* (CSA impact tools)
│   │   ├── csa.js                   # /api/csa/* (CSA management endpoints)
│   │   ├── fmcsaLookup.js           # /api/fmcsa/* (FMCSA data lookup)
│   │   ├── admin.js                 # /api/admin/* (super-admin endpoints)
│   │   ├── tasks.js                 # /api/tasks/*
│   │   ├── checklists.js            # /api/checklists/*
│   │   ├── maintenance.js           # /api/maintenance/*
│   │   ├── audit.js                 # /api/audit/* (audit log viewing)
│   │   ├── announcements.js         # /api/announcements/*
│   │   ├── features.js              # /api/features/* (feature flag endpoints)
│   │   ├── seed.js                  # /api/seed/* (data seeding for demo/testing)
│   │   ├── templates.js             # /api/templates/*
│   │   └── integrations.js          # /api/integrations/* (third-party integrations)
│   ├── controllers/                 # Empty (business logic lives in routes/services)
│   ├── utils/                       # Utility functions
│   │   ├── searchUtils.js           # Regex escaping, query building
│   │   ├── pdfUtils.js              # PDF generation helpers
│   │   ├── errorUtils.js            # Error utility functions
│   │   └── ...                      # Other utility modules
│   ├── scripts/                     # One-off scripts
│   │   ├── seed.js                  # Database seeding script
│   │   └── ...                      # Other scripts
│   ├── templates/                   # Email and PDF templates (EJS)
│   │   ├── emailTemplates/          # Email HTML templates
│   │   └── pdfTemplates/            # PDF generation templates
│   ├── reports/                     # Report generation modules
│   ├── uploads/                     # File upload storage (generated at runtime)
│   │   └── {category}/              # Organized by document type
│   └── node_modules/                # Installed dependencies
├── frontend/                         # React 18 + Vite SPA
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js               # Vite configuration, API proxy
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── package.json                 # Dependencies, npm scripts
│   ├── src/
│   │   ├── main.jsx                 # React mount point, app provider wrapping
│   │   ├── App.jsx                  # Route definitions, ProtectedRoute wrappers
│   │   ├── index.css                # Global CSS (Tailwind imports)
│   │   ├── pages/                   # Page components (one per route)
│   │   │   ├── Landing.jsx          # Public landing page
│   │   │   ├── Login.jsx            # Auth page
│   │   │   ├── Register.jsx         # Auth page
│   │   │   ├── Dashboard.jsx        # Main dashboard (lazy-loaded)
│   │   │   ├── Compliance.jsx       # Compliance overview (lazy-loaded)
│   │   │   ├── Drivers.jsx          # Driver list page
│   │   │   ├── DriverDetail.jsx     # Driver detail page
│   │   │   ├── Vehicles.jsx         # Vehicle list page
│   │   │   ├── VehicleDetail.jsx    # Vehicle detail page
│   │   │   ├── Violations.jsx       # Violations list
│   │   │   ├── Tickets.jsx          # Safety tickets
│   │   │   ├── DamageClaims.jsx     # Damage claims
│   │   │   ├── DrugAlcohol.jsx      # Drug/alcohol records
│   │   │   ├── Documents.jsx        # Document library
│   │   │   ├── Reports.jsx          # Compliance reports
│   │   │   ├── ScheduledReports.jsx # Scheduled report management
│   │   │   ├── InspectionHistory.jsx # Inspection records
│   │   │   ├── Settings.jsx         # User/company settings
│   │   │   ├── Billing.jsx          # Subscription/billing
│   │   │   ├── RegulationAssistant.jsx # AI Q&A page
│   │   │   ├── AlertsDashboard.jsx  # Alert management
│   │   │   ├── Tasks.jsx            # Task management
│   │   │   ├── Checklists.jsx       # Checklist management
│   │   │   ├── Maintenance.jsx      # Maintenance records
│   │   │   ├── Accidents.jsx        # Accident records
│   │   │   ├── Policies.jsx         # Policy pages
│   │   │   ├── Integrations.jsx     # Integration settings
│   │   │   ├── DataQDashboard.jsx   # DataQ opportunities
│   │   │   ├── CSACheckerPage.jsx   # CSA impact calculator
│   │   │   ├── NotFound.jsx         # 404 page
│   │   │   ├── admin/               # Admin pages (super_admin only)
│   │   │   │   ├── AdminLayout.jsx  # Admin page wrapper
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminUsers.jsx   # User management
│   │   │   │   ├── AdminCompanies.jsx # Company management
│   │   │   │   ├── AdminAuditLogs.jsx # Audit log viewer
│   │   │   │   ├── AdminEmails.jsx  # Email log viewer
│   │   │   │   ├── AdminAnnouncements.jsx
│   │   │   │   ├── AdminFeatureFlags.jsx # Feature flag management
│   │   │   │   ├── AdminDataIntegrity.jsx # Data audit tools
│   │   │   │   ├── AdminRevenue.jsx # Revenue/usage tracking
│   │   │   │   ├── AdminAlerts.jsx
│   │   │   │   └── AdminTickets.jsx
│   │   │   └── designs/             # Design demos
│   │   │       ├── EnterpriseDemo.jsx
│   │   │       ├── MinimalistDemo.jsx
│   │   │       └── ...              # Other design variants
│   │   ├── components/              # Reusable components
│   │   │   ├── Layout.jsx           # Main app layout (nav, sidebar)
│   │   │   ├── LoadingSpinner.jsx   # Loading indicator
│   │   │   ├── Modal.jsx            # Generic modal wrapper
│   │   │   ├── DataTable.jsx        # Sortable, paginated table
│   │   │   ├── StatusBadge.jsx      # Status display component
│   │   │   ├── ErrorBoundary.jsx    # Error boundary for render errors
│   │   │   ├── PageTransition.jsx   # Page animation wrapper
│   │   │   ├── CompanySwitcher.jsx  # Multi-company selector
│   │   │   ├── DemoBanner.jsx       # Demo mode indicator
│   │   │   ├── ChatWidget.jsx       # AI chat widget
│   │   │   ├── VroomXLogo.jsx       # Brand logo
│   │   │   ├── settings/            # Settings tab components
│   │   │   │   ├── ProfileTab.jsx
│   │   │   │   ├── SecurityTab.jsx
│   │   │   │   ├── BillingTab.jsx
│   │   │   │   ├── CompaniesTab.jsx
│   │   │   │   ├── UsersTab.jsx
│   │   │   │   ├── AuditLogTab.jsx
│   │   │   │   ├── AppearanceTab.jsx
│   │   │   │   ├── NotificationsTab.jsx
│   │   │   │   ├── DataAuditTab.jsx
│   │   │   │   ├── AddUserModal.jsx
│   │   │   │   ├── InviteMemberModal.jsx
│   │   │   │   └── AddCompanyModal.jsx
│   │   │   ├── landing/             # Landing page sections
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── FeaturesSection.jsx
│   │   │   │   ├── PricingSection.jsx
│   │   │   │   ├── TestimonialsSection.jsx
│   │   │   │   ├── FAQSection.jsx
│   │   │   │   ├── CTASection.jsx
│   │   │   │   └── FooterSection.jsx
│   │   │   ├── drivers/             # Driver-specific components
│   │   │   ├── vehicles/            # Vehicle-specific components
│   │   │   ├── violations/          # Violation components
│   │   │   │   └── DataQOpportunities.jsx
│   │   │   ├── tickets/             # Ticket components
│   │   │   ├── reports/             # Report components
│   │   │   ├── fmcsa/               # FMCSA-related components
│   │   │   │   └── InspectionsTabContent.jsx
│   │   │   ├── AIChat/              # AI chat components
│   │   │   │   └── ChatWidget.jsx
│   │   │   ├── CSAEstimatorContent.jsx
│   │   │   ├── DataQLetterModal.jsx
│   │   │   ├── SamsaraMatchingModal.jsx
│   │   │   ├── InspectionUploadContent.jsx
│   │   │   └── ...                  # Other components
│   │   ├── context/                 # React context providers
│   │   │   ├── AuthContext.jsx      # User/companies/subscription state
│   │   │   ├── ThemeContext.jsx     # Dark mode toggle
│   │   │   └── FeatureFlagContext.jsx # Feature flag consumer
│   │   ├── utils/                   # Utility functions and API client
│   │   │   ├── api.js               # Axios instance with auth interceptors, 45+ API service objects
│   │   │   ├── formatters.js        # Date, currency, text formatting
│   │   │   ├── validators.js        # Input validation rules
│   │   │   ├── dateUtils.js         # Date calculations
│   │   │   ├── constants.js         # App-wide constants
│   │   │   └── ...                  # Other utils
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useInView.js         # Intersection observer hook
│   │   │   └── ...                  # Other hooks
│   │   ├── services/                # Frontend services (if any)
│   │   ├── data/                    # Static data files
│   │   │   ├── complianceData.js    # FMCSA compliance rules
│   │   │   ├── alertTypes.js        # Alert type definitions
│   │   │   └── ...                  # Other static data
│   │   └── assets/                  # Images, icons, fonts
│   │       ├── images/
│   │       ├── icons/
│   │       └── fonts/
│   ├── public/                      # Static assets (served directly)
│   ├── dist/                        # Production build output
│   └── node_modules/                # Installed dependencies
├── .planning/                        # GSD planning documents
│   └── codebase/                    # Architecture/structure/testing/concerns docs
├── .git/                            # Git repository
├── .gitignore                       # Git ignore patterns
├── CLAUDE.md                        # Developer instructions (this file)
├── PROJECT.md                       # Project overview and changelog
├── README.md                        # Public project README
└── DOCS/                            # Additional documentation
```

## Directory Purposes

**Backend Entry:**
- `backend/server.js`: Main server file; defines middleware stack, connects DB, starts cron jobs

**Backend Configuration:**
- `backend/config/`: Environment-specific setup, database connection, FMCSA rules
- Files: `database.js` (Mongoose connection), `fmcsaCompliance.js` (rules + DQF requirements), `.env.example`

**Backend Middleware:**
- `backend/middleware/`: HTTP middleware functions
- Key files:
  - `auth.js`: JWT verification, company isolation, permission checks
  - `errorHandler.js`: Global error handler, AppError class, asyncHandler wrapper
  - `upload.js`: Multer configuration (10MB, UUID names, MIME validation)
  - `subscriptionLimits.js`: Plan limit enforcement before resource creation

**Backend Models:**
- `backend/models/`: Mongoose schemas (all company-scoped)
- 25 models covering drivers, vehicles, violations, documents, audits, etc.
- All have `companyId` indexed for tenant isolation

**Backend Services:**
- `backend/services/`: Business logic (AI, email, compliance, external APIs)
- 20 services: auditService, emailService, openaiVisionService, aiService, stripeService, samsaraService, etc.
- Pattern: Object literals with async methods; fire-and-forget for non-blocking operations

**Backend Routes:**
- `backend/routes/`: API endpoint definitions (31 modules)
- Central router at `index.js` mounts all sub-routers under `/api`
- Named routes before parameterized routes (Express evaluation order)

**Frontend Pages:**
- `frontend/src/pages/`: One component per route
- ~57 page files covering auth, dashboard, resources (drivers/vehicles/violations), settings, admin

**Frontend Components:**
- `frontend/src/components/`: Reusable UI components
- Organized by feature/domain (settings/, landing/, drivers/, violations/, etc.)
- Core components: Layout, Modal, DataTable, LoadingSpinner, ErrorBoundary

**Frontend Context:**
- `frontend/src/context/`: Global state management
- AuthContext: user, companies, activeCompany, subscription
- ThemeContext: dark mode toggle
- FeatureFlagContext: feature flag consumer

**Frontend Utils:**
- `frontend/src/utils/`: Utility functions and API client
- `api.js`: Axios instance with interceptors, 45+ API service objects (driversAPI, vehiclesAPI, etc.)
- Other utils: formatters, validators, date helpers, constants

## Key File Locations

**Entry Points:**
- `backend/server.js`: Backend entry point; middleware + cron job definitions
- `frontend/src/main.jsx`: React DOM mount point
- `frontend/src/App.jsx`: Route definitions and layout
- `frontend/vite.config.js`: Vite build and dev server config

**Configuration:**
- `backend/.env.example`: Required env vars template
- `backend/config/database.js`: MongoDB connection setup
- `backend/config/fmcsaCompliance.js`: FMCSA compliance rules
- `frontend/vite.config.js`: Vite configuration (API proxy, build output)
- `frontend/tailwind.config.js`: Tailwind CSS theme configuration

**Core Logic:**
- `backend/middleware/auth.js`: JWT, company isolation, permissions
- `backend/services/auditService.js`: Fire-and-forget audit logging
- `backend/services/emailService.js`: Email sending (Nodemailer + Resend)
- `backend/services/openaiVisionService.js`: Document extraction (PDFs, images)
- `backend/services/stripeService.js`: Subscription lifecycle
- `frontend/context/AuthContext.jsx`: User/company state
- `frontend/utils/api.js`: All API service methods

**Testing:**
- Backend: No dedicated test files in codebase (Jest configured but empty)
- Frontend: No dedicated test files (Vitest could be configured)

## Naming Conventions

**Files:**
- Backend routes: `drivers.js`, `vehicles.js` (plural, kebab-case if multi-word)
- Backend services: `auditService.js`, `emailService.js` (camelCase + Service suffix)
- Backend models: `Driver.js`, `Vehicle.js` (PascalCase, singular)
- Frontend pages: `Drivers.jsx`, `DriverDetail.jsx` (PascalCase)
- Frontend components: `Layout.jsx`, `DataTable.jsx` (PascalCase)
- Frontend utils: `api.js`, `formatters.js` (camelCase, lowercase)
- Context files: `AuthContext.jsx`, `ThemeContext.jsx` (PascalCase + Context suffix)

**Directories:**
- Feature folders: lowercase plural (e.g., `settings/`, `landing/`, `drivers/`)
- Utility folders: lowercase (e.g., `utils/`, `services/`, `models/`)
- Page folders: match page name pattern

**Functions:**
- Async handlers in routes: `asyncHandler(async (req, res) => {})`
- Middleware: `protect`, `restrictToCompany`, `checkPermission`, `authorize`
- Service methods: `log()`, `diff()`, `sendEmail()` (camelCase)
- React hooks: `useAuth()`, `useFeatureFlag()` (use prefix)

**Variables:**
- Database queries: `const drivers = await Driver.find(...)`
- Axios requests: `const response = await api.get('/drivers')`
- React state: `const [drivers, setDrivers] = useState([])`
- Company context: `req.companyFilter = { companyId }`

**Types:**
- Models: `Driver`, `Vehicle`, `Violation` (PascalCase)
- Errors: `AppError` (PascalCase)
- Context: `AuthContext`, `ThemeContext` (PascalCase)

## Where to Add New Code

**New Feature (e.g., add "Incidents" module):**
1. **Backend:**
   - Create model: `backend/models/Incident.js` with `companyId` field
   - Create service: `backend/services/incidentService.js` (if business logic needed)
   - Create route: `backend/routes/incidents.js` with CRUD endpoints
   - Mount route: Add `const incidentRoutes = require('./incidents')` and `router.use('/incidents', incidentRoutes)` to `backend/routes/index.js`
   - Update auth: Add permission checks via `checkPermission('incidents', 'view')`
2. **Frontend:**
   - Create page: `frontend/src/pages/Incidents.jsx` (list view)
   - Create detail page: `frontend/src/pages/IncidentDetail.jsx` (detail view)
   - Create component folder: `frontend/src/components/incidents/` (modal, form, etc.)
   - Add routes: Add to `frontend/src/App.jsx` within ProtectedRoute wrapper
   - Add API service: Add `incidentsAPI` object to `frontend/src/utils/api.js`
3. **Update database:** Run migration script to add `companyId` index to Incident collection

**New Component/Module (e.g., add "Compliance Calendar"):**
- Frontend component: `frontend/src/components/ComplianceCalendar.jsx`
- Use: Import and render in relevant pages
- Styling: Use Tailwind classes; follow existing component patterns

**Utilities:**
- Shared helpers: `frontend/src/utils/newHelper.js`
- Backend utilities: `backend/utils/newUtil.js`
- Always use services for business logic; utils for pure functions

## Special Directories

**`backend/uploads/`:**
- Purpose: File storage for uploaded documents
- Generated: Yes, created at runtime
- Committed: No (added to .gitignore)
- Structure: Organized by category: `uploads/drivers/`, `uploads/vehicles/`, etc.
- Security: No direct static serving; files accessed through authenticated endpoint `/api/documents/:id/download`

**`backend/templates/`:**
- Purpose: Email and PDF template files (EJS format)
- Generated: No
- Committed: Yes
- Usage: Referenced by `emailService.js` and `pdfService.js`
- Pattern: `templates/emails/welcome.ejs`, `templates/pdfs/report.ejs`

**`backend/scripts/`:**
- Purpose: One-off utility scripts (database seeding, migrations)
- Generated: No
- Committed: Yes
- Run: `node scripts/seed.js --fresh` (demo data seeding)

**`frontend/public/`:**
- Purpose: Static assets served directly (images, SVGs, manifests)
- Generated: No
- Committed: Yes
- Usage: Reference from HTML/CSS as `/filename`

**`frontend/dist/`:**
- Purpose: Production build output
- Generated: Yes (`npm run build`)
- Committed: No (added to .gitignore)
- Output: HTML, minified JS/CSS, assets

**`.planning/codebase/`:**
- Purpose: GSD planning documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes, created by `/gsd:map-codebase`
- Committed: Yes
- Contents: Reference docs for code generation

---

*Structure analysis: 2026-02-03*
