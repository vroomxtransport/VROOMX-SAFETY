# Architecture

**Analysis Date:** 2026-02-03

## Pattern Overview

**Overall:** Multi-layered monolith with clear separation between backend API (Express + MongoDB) and frontend SPA (React 18 + Vite). Multi-tenancy via company isolation on every API endpoint. Fire-and-forget patterns for non-blocking operations (email, audit logging).

**Key Characteristics:**
- Request-scoped company context: Every authenticated request sets `req.companyFilter` for tenant isolation
- Multi-company users: Users can belong to multiple companies with per-company roles and permissions
- Middleware-driven security: Auth → Company isolation → Permission checks form the stack
- Service-layer processing: Business logic (AI, compliance calculations, email) lives in `services/`
- Fire-and-forget operations: Audit logging, email sending, and cron jobs never block API responses
- Route-level data handling: No controllers; route handlers build queries, call services, return responses

## Layers

**Frontend Layer:**
- Purpose: React 18 SPA with Vite build tooling; handles UI rendering, routing, and user interactions
- Location: `frontend/src/`
- Contains: Pages, components (modal/table/form), context providers, API client utilities
- Depends on: `utils/api.js` (Axios instance with auth interceptors), `context/AuthContext` (user state)
- Used by: Browser clients (desktop, mobile web)

**API Layer (Express Middleware Stack):**
- Purpose: HTTP request processing with security, rate limiting, body parsing, logging
- Location: `backend/server.js` (middleware chain definition)
- Contains: Helmet (security headers), CORS, rate limiting, body parsing, maintenance mode checks
- Order: Helmet → CORS → Rate Limit (global 100/30s + auth 15/30s) → Body Parsing → Morgan (dev) → Maintenance → Routes → 404 → Error Handler
- Special: Stripe webhook (`/api/billing/webhook`) bypasses JSON parsing to preserve raw body for signature verification

**Route Layer:**
- Purpose: HTTP endpoint definitions and request validation
- Location: `backend/routes/` (31 route modules)
- Contains: GET/POST/PUT/PATCH/DELETE handlers with `asyncHandler` wrapper, request validation via `express-validator`
- Pattern: Named routes before parameterized `/:id` routes (Express evaluates top-to-bottom)
- Key files:
  - `backend/routes/index.js`: Central router mounting all 31 sub-routers
  - `backend/routes/drivers.js`: Driver CRUD, alerts, stats, document upload
  - `backend/routes/vehicles.js`: Vehicle CRUD, maintenance records, inspections
  - `backend/routes/violations.js`: Violation CRUD, DataQ submission, AI analysis
  - `backend/routes/billing.js`: Subscription management, Stripe webhook
  - `backend/routes/admin.js`: Super-admin endpoints (users, companies, feature flags)
  - `backend/routes/ai.js`: AI-powered endpoints (DataQ analysis, document extraction)

**Authentication & Authorization Layer:**
- Purpose: JWT validation, company context setup, permission enforcement
- Location: `backend/middleware/auth.js`
- Flow: `protect` (verify JWT) → `restrictToCompany` (set context) → `checkPermission` (per-resource) or `authorize` (per-role)
- Token storage: httpOnly cookie (primary), Authorization header fallback
- Request augmentation: Sets `req.user`, `req.companyFilter`, `req.userRole`, `req.userPermissions`
- Roles: owner, admin, safety_manager, dispatcher, driver, viewer
- Permissions: Per-company per-resource (e.g., drivers.view, vehicles.edit)

**Service Layer:**
- Purpose: Encapsulate domain logic (AI integration, compliance calculations, email, document processing)
- Location: `backend/services/` (~20 modules)
- Pattern: Object literals exporting async methods (not ES6 classes)
- Key services:
  - `openaiVisionService.js`: Document extraction (PDFs use Responses API, images use Chat Completions)
  - `aiService.js`: Claude integration for compliance Q&A
  - `emailService.js`: Nodemailer + Resend integration; fire-and-forget with error swallowing
  - `auditService.js`: Async audit logging with field-level diffs; never throws
  - `complianceScoreService.js`: CSA score and DataQ opportunity calculations
  - `csaAlertService.js`: Alert generation for driver compliance
  - `stripeService.js`: Subscription lifecycle (create, update, cancel, webhook processing)
  - `samsaraService.js`: External Samsara API integration (DVIRs, vehicle data)

**Data Access Layer:**
- Purpose: Mongoose models defining schema, validation, and database operations
- Location: `backend/models/` (~25 models)
- Pattern: All models include `companyId` indexed for tenant isolation
- Key models:
  - `User.js`: Multi-company support via `companies[]` array, `activeCompanyId`, legacy `companyId`
  - `Driver.js`: Personal info, CDL, medical card, Samsara integration, FMCSA documents
  - `Vehicle.js`: Vehicle details, DVIRs, maintenance records, inspections
  - `Violation.js`: FMCSA violations, DataQ status tracking, AI analysis results
  - `Company.js`: Company profile, subscription info, feature flags
  - `AuditLog.js`: Immutable audit records with 2-year TTL, company-scoped
  - Integration models: `FMCSAInspection.js`, `Accident.js`, `DamageClaim.js`, `SamsaraRecord.js`

**Scheduled Jobs Layer:**
- Purpose: Background tasks on cron schedules
- Location: `backend/server.js` (cron job definitions at startup)
- Jobs:
  - 6 AM: Alert generation + email digest send
  - Every 6 hours: Alert escalation check
  - 9 AM: Trial ending notifications (3 days out)

## Data Flow

**Authentication Flow:**

1. Frontend sends login request (`email`, `password`) to `/api/auth/login`
2. Backend verifies credentials, creates JWT token
3. Frontend stores token in memory and localStorage as fallback
4. Frontend axios interceptor attaches token to all subsequent requests
5. Backend `protect` middleware verifies JWT; 401 on failure triggers frontend redirect to `/login`

**Multi-Company Data Request Flow:**

1. Authenticated request arrives at route handler (e.g., `GET /api/drivers`)
2. `restrictToCompany` middleware:
   - Extracts `req.user.activeCompanyId` (currently selected company)
   - Finds user's membership in that company
   - Sets `req.companyFilter = { companyId: activeCompanyId }`
   - Sets `req.userRole` and `req.userPermissions` from membership
3. Permission middleware (e.g., `checkPermission('drivers', 'view')`) checks `req.userPermissions`
4. Route handler builds Mongoose query: `Driver.find({ ...req.companyFilter, ...filters })`
5. Response includes only data for active company

**Audit Logging Flow:**

1. Route handler completes CRUD operation (e.g., `driver.save()`)
2. Handler calls `auditService.log(req, 'create', 'driver', driver._id, { summary })`
3. Service fires async `AuditLog.create()` but does NOT await
4. If logging fails, error is logged to console; request continues
5. Audit logs appear in admin panel, searchable by company/user/resource

**Email Delivery Flow:**

1. Service needs to send email (e.g., `emailService.sendTrialEnding(user)`)
2. Function fires async email creation but does NOT await or block
3. Returns promise that's not awaited by caller
4. If Resend API call fails, error logged to console; user sees no impact
5. Email delivery tracked in `EmailLog` model for debugging

**State Management (Frontend):**

- `AuthContext.jsx`: Manages `user`, `companies`, `activeCompany`, `subscription`
- On mount, calls `/api/auth/me` to restore session from httpOnly cookie
- On login, stores token and user data
- On logout, clears token and redirects to `/login`
- Company switcher updates `user.activeCompanyId`; subsequent requests use new company context

## Key Abstractions

**Company Filter:**
- Purpose: Enforce tenant isolation on every database query
- Pattern: Every route handler receives `req.companyFilter = { companyId }` from `restrictToCompany`
- Usage: `Driver.find({ ...req.companyFilter, status: 'active' })`
- Effect: Guarantees no data leakage between companies

**AsyncHandler Wrapper:**
- Purpose: Eliminate try-catch boilerplate in route handlers
- Pattern: Wrap async route handlers: `asyncHandler(async (req, res) => { ... })`
- Implementation: `const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`
- Effect: Any thrown error automatically passed to global error handler

**Service Object Pattern:**
- Purpose: Organize business logic without ES6 class boilerplate
- Pattern:
  ```javascript
  const auditService = {
    log(req, action, resource, resourceId, details) { ... },
    diff(before, after) { ... }
  };
  module.exports = auditService;
  ```
- Effect: Simple function calls with no `this` context confusion

**Permission Matrix:**
- Purpose: Fine-grained access control per company per resource
- Structure: `membership.permissions = { drivers: { view: true, create: true, edit: false }, ... }`
- Middleware: `checkPermission('drivers', 'view')` checks `req.userPermissions.drivers.view`
- Pattern: Owners and admins bypass permission checks (always allowed)

**Regex Escaping for Search:**
- Purpose: Prevent NoSQL injection in user-provided search strings
- Pattern: All search queries use `escapeRegex()` before building regex: `{ firstName: { $regex: escapeRegex(search) } }`
- Implementation: Escapes special characters: `.^$*+?{}[]\|`

## Entry Points

**Backend Server Entry:**
- Location: `backend/server.js`
- Triggers: `npm run dev` (nodemon) or `npm start` (production)
- Responsibilities:
  1. Validate environment variables at startup (JWT_SECRET, MONGODB_URI, Stripe keys in prod)
  2. Connect to MongoDB
  3. Configure Helmet, CORS, rate limiting, body parsing
  4. Mount all route modules under `/api`
  5. Start cron jobs for alerts and notifications
  6. Listen on PORT (default 5000)

**Frontend Entry:**
- Location: `frontend/src/main.jsx`
- Triggers: `npm run dev` (Vite dev server on 5173) or `npm run build` (production build)
- Responsibilities:
  1. Mount React app to `#root` DOM element
  2. Wrap app with `AuthProvider` (session restoration)
  3. Wrap app with `FeatureFlagProvider` (feature toggles)
  4. Define routes with `ProtectedRoute`, `PublicRoute`, `SuperAdminRoute` wrappers

**Frontend Routes (App.jsx):**
- Location: `frontend/src/App.jsx`
- Public routes: `/`, `/login`, `/register`, `/pricing`, `/csa-checker`, `/blog`
- Protected routes: `/app/drivers`, `/app/vehicles`, `/app/violations`, `/app/dashboard`, `/app/settings`
- Admin routes: `/admin/*` (super_admin only)
- Route structure: Lazy-loaded pages (Dashboard, Compliance) to reduce bundle

**API Route Registration:**
- Location: `backend/routes/index.js`
- Pattern: Central router imports 31 sub-modules and mounts each under its prefix
- Example: `router.use('/drivers', driverRoutes)` → all driver endpoints are `/api/drivers/*`

## Error Handling

**Strategy:** Centralized global error handler with AppError custom class and asyncHandler wrapper

**Patterns:**

**Route Handler Pattern:**
```javascript
router.get('/', asyncHandler(async (req, res) => {
  // Any throw or Promise.reject bubbles to global errorHandler
  const drivers = await Driver.find(req.companyFilter);
  res.json({ success: true, drivers });
}));
```

**Custom Error Class:**
```javascript
throw new AppError('Driver not found', 404);
// Caught by errorHandler, responds with:
// { success: false, message: 'Driver not found' }
```

**Special Mongoose Errors Handled:**
- `CastError`: Invalid ObjectId → 404 "Resource not found"
- `ValidationError`: Schema validation fails → 400 with field messages (or generic in production)
- Duplicate key (11000): → 400 "A record with this value already exists"

**JWT Errors:**
- `JsonWebTokenError`: Malformed token → 401 "Invalid token. Please log in again"
- `TokenExpiredError`: Expired JWT → 401 "Your token has expired. Please log in again"

**Frontend Error Handling:**
- Axios interceptor catches 401 → redirects to `/login` (except on `/auth/me` calls)
- Axios interceptor catches 503 with `code: 'MAINTENANCE_MODE'` → displays maintenance banner
- React ErrorBoundary catches component render errors → displays error UI

## Cross-Cutting Concerns

**Logging:**
- Backend: Morgan in development (method, URL, status, response time, user ID)
- Frontend: Console logging for debugging; no production error logging setup
- Audit logging: Fire-and-forget via `auditService.log()` after CRUD operations

**Validation:**
- Backend: `express-validator` for request body/query validation at route level
- Example: `body('email').isEmail().normalizeEmail()`
- Errors collected and returned as 400 with field messages
- Frontend: React form components with onBlur/onChange validation (no centralized validator)

**Authentication:**
- Backend: JWT (HS256) in httpOnly cookie + Authorization header
- Frontend: Token in memory (cleared on page close); localStorage as fallback
- Refresh: No refresh token; session expires with JWT expiration
- Multi-company: User selects active company; subsequent requests scoped to that company

**Company Isolation:**
- Every model has `companyId` field indexed for query performance
- Every authenticated route receives `req.companyFilter = { companyId }`
- Super admins bypass company checks (role === 'super_admin')
- Violations of isolation cause 403 "No access to this company"

**Rate Limiting:**
- Global: 100 requests per 30 seconds per IP
- Auth endpoints: 15 requests per 30 seconds per IP+email (prevents brute force)
- Stripe webhook: No rate limit (requires signature verification)

**Subscription Enforcement:**
- Middleware `subscriptionLimits.js` checks plan limits before resource creation
- Plans: solo (1 driver), fleet (3 included + $6/extra), pro (10 included + $5/extra)
- Blocked operations: Creating drivers when limit reached returns 403 "Plan limit exceeded"

---

*Architecture analysis: 2026-02-03*
