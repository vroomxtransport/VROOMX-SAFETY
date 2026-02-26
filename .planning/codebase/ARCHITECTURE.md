# Architecture

**Analysis Date:** 2026-02-25

## Pattern Overview

**Overall:** Multi-tenant SaaS with layered monolith backend and SPA frontend

**Key Characteristics:**
- Company-scoped multi-tenancy: every DB query filtered by `companyId` set in middleware
- User-level billing with company-level resource enforcement
- FMCSA external data pipeline with 6-step orchestrator running on cron schedule
- Fire-and-forget patterns for non-critical paths (email, audit logging)
- Route-inline handlers (no separate controllers directory — all logic lives in route files)

## Layers

**HTTP Entry (Backend):**
- Purpose: Security hardening, rate limiting, body parsing, maintenance gate
- Location: `backend/server.js`
- Contains: Helmet CSP, CORS, Redis-backed rate limiter, raw-body bypass for Stripe webhook, Morgan logging
- Depends on: Nothing (top of stack)
- Used by: All API requests

**Routes Layer:**
- Purpose: Route definition, auth middleware composition, request handling, response formatting
- Location: `backend/routes/` (38 route files + `backend/routes/index.js` as registry)
- Contains: Express Router instances with inline handler logic (no separate controllers)
- Depends on: Middleware layer, Services layer, Models layer
- Used by: `server.js` via `app.use('/api', routes)`

**Middleware Layer:**
- Purpose: Authentication, authorization, multi-tenant isolation, subscription enforcement, file upload
- Location: `backend/middleware/`
- Files:
  - `backend/middleware/auth.js` — `protect`, `authorize`, `checkPermission`, `restrictToCompany`, `requireCompanyAdmin`, `requireCompanyOwner`, `requireSuperAdmin`
  - `backend/middleware/subscriptionLimits.js` — driver/vehicle/company count enforcement, AI query quotas
  - `backend/middleware/errorHandler.js` — `asyncHandler`, `AppError`, global error handler, 404 handler
  - `backend/middleware/upload.js` — Multer with UUID filenames, MIME+extension validation, path traversal protection
  - `backend/middleware/maintenance.js` — maintenance mode gate
  - `backend/middleware/demoGuard.js` — blocks write operations for demo users
- Depends on: Models (User), Services (stripe)
- Used by: Routes

**Services Layer:**
- Purpose: Business logic, external API integration, document processing, notifications
- Location: `backend/services/`
- All services export plain object literals with async methods (not classes)
- Depends on: Models layer, external APIs
- Used by: Routes, Cron jobs in server.js

**Models Layer:**
- Purpose: MongoDB schema definitions and data access
- Location: `backend/models/`
- All models have `companyId` field for tenant isolation
- Single index file: `backend/models/index.js`
- Depends on: Mongoose, nothing else
- Used by: Services, Routes, Middleware

**Frontend Application Layer:**
- Purpose: React SPA with route-based code splitting, auth-gated navigation
- Location: `frontend/src/`
- Depends on: Backend API via `frontend/src/utils/api.js`
- Used by: End users via browser

## Data Flow

**Standard Authenticated API Request:**

1. Client sends request with httpOnly cookie or `Authorization: Bearer <token>` header
2. `globalLimiter` checks rate limit (100/30s per IP via Redis or in-memory)
3. `express.json()` parses body (bypassed for `/api/billing/webhook`)
4. Route's `protect` middleware verifies JWT, loads user with populated company data
5. `restrictToCompany` sets `req.companyFilter = { companyId }`, `req.userRole`, `req.userPermissions`
6. Optional `authorize()` or `checkPermission()` checks role/permission
7. `asyncHandler`-wrapped route handler executes business logic against models using `req.companyFilter`
8. `auditService.log()` called fire-and-forget for write operations
9. Response returned as `{ success: true, data: ... }` or error bubbles to global handler

**FMCSA Sync Pipeline (6-Step Orchestrator):**

1. Triggered by cron (every 6h) or manual API call
2. `fmcsaSyncService.syncCompanyData()` — fetches CSA BASIC scores from SAFER API
3. `fmcsaInspectionService.syncViolationsFromDataHub()` — pulls violation details from FMCSA DataHub
4. `fmcsaViolationService.syncViolationHistory()` — imports inspection stats from SaferWebAPI
5. `entityLinkingService.linkViolationsForCompany()` — links violations to Driver/Vehicle records
6. `dataQAnalysisService.runBulkAnalysis()` — scores violations for DataQ challenge eligibility
7. `violationScannerService.scanCompanyViolations()` — flags health check issues
8. `complianceScoreService.calculateScore()` — recalculates weighted compliance score (docs 25%, violations 30%, D&A 15%, DQF 20%, vehicle 10%)
9. Updates `Company.fmcsaData.syncStatus` with timestamps and error log

**Authentication Flow:**

1. POST `/api/auth/login` → validates credentials → issues JWT (httpOnly cookie) + refresh token (returned in body)
2. Frontend stores access token in memory (`authToken` variable in `frontend/src/utils/api.js`), refresh token in sessionStorage
3. On 401: Axios interceptor attempts `/auth/refresh` with sessionStorage token, queues concurrent requests
4. `AuthContext.jsx` calls `/auth/me` on mount to restore session; retries once with refresh if 401

**Frontend Route Guard Flow:**

1. `AuthContext` fetches `/auth/me` → sets `isAuthenticated`, `user`, `subscription`
2. `<ProtectedRoute>` redirects to `/login` if not authenticated; redirects to `/app/billing` if `subscription.status === 'pending_payment'`
3. `<PublicRoute>` redirects to `/app/dashboard` if already authenticated
4. `<SuperAdminRoute>` checks `user.isSuperAdmin`

**State Management:**

- Server state: Direct API calls from components via service objects in `frontend/src/utils/api.js`
- Auth/session state: React Context (`frontend/src/context/AuthContext.jsx`)
- Theme state: React Context (`frontend/src/context/ThemeContext.jsx`)
- No global state library (Redux, Zustand, etc.) — component-level state with Context for cross-cutting concerns

## Key Abstractions

**Multi-Tenant Company Filter:**
- Purpose: Enforces data isolation so users only see their company's records
- Implementation: `restrictToCompany` middleware sets `req.companyFilter = { companyId }` which all DB queries use as a filter
- File: `backend/middleware/auth.js` lines 137–191
- Super admins bypass this filter

**asyncHandler Wrapper:**
- Purpose: Eliminates try/catch boilerplate in route handlers
- Pattern: `router.get('/path', protect, asyncHandler(async (req, res) => { ... }))`
- File: `backend/middleware/errorHandler.js` line 65

**Audit Service (Fire-and-Forget):**
- Purpose: Non-blocking audit trail for all CRUD operations
- Pattern: `auditService.log(req, 'create', 'driver', driver._id, { name: driver.name })`
- File: `backend/services/auditService.js`
- Never throws; logs to `AuditLog` model with 2-year TTL

**API Service Objects (Frontend):**
- Purpose: Typed API methods organized by domain, eliminating ad-hoc `api.get()` calls in components
- Pattern: Named exports like `driversAPI`, `vehiclesAPI`, `billingAPI` (~45 total)
- File: `frontend/src/utils/api.js`

**FMCSA Sync Orchestrator:**
- Purpose: Coordinates multi-source external data pipeline, reports partial success per step
- File: `backend/services/fmcsaSyncOrchestrator.js`
- Two modes: `syncCompany()` (full, sequential) and `syncCompanyFast()` (parallel steps 2+3, for manual trigger)

**Compliance Score Service:**
- Purpose: Aggregates 5 data domains into single 0-100 score for a company
- Weights: documentStatus 25%, violations 30%, drugAlcohol 15%, dqfCompleteness 20%, vehicleInspection 10%
- File: `backend/services/complianceScoreService.js`
- Cached daily; must call `calculateScore()` explicitly after data changes to get fresh value

## Entry Points

**Backend Server:**
- Location: `backend/server.js`
- Triggers: `node backend/server.js` or `npm run dev` in backend directory
- Responsibilities: Middleware chain setup, route mounting, DB connection, cron scheduling, graceful shutdown

**Route Registry:**
- Location: `backend/routes/index.js`
- Triggers: Required by `server.js`
- Responsibilities: Mounts all 38 route modules under `/api`, applies `demoGuard` globally

**Frontend Entry:**
- Location: `frontend/src/main.jsx` (Vite entry point)
- Triggers: Browser load or `npm run dev`
- Responsibilities: Renders `<App>` wrapped in `AuthProvider`, `ThemeContext`, React Router `BrowserRouter`

**Frontend App Router:**
- Location: `frontend/src/App.jsx`
- Triggers: React render
- Responsibilities: Route definitions for all ~35 pages, code-split lazy loading for heavy pages, route guard composition

## Error Handling

**Strategy:** Centralized error handler with `asyncHandler` wrapper to propagate errors automatically

**Patterns:**
- All route handlers wrap with `asyncHandler()` — no manual try/catch needed
- Custom `AppError` class carries `statusCode` and `isOperational` flag
- Global handler (`backend/middleware/errorHandler.js`) normalizes Mongoose errors (CastError → 404, ValidationError → 400, duplicate key → 400), JWT errors → 401
- Stack traces included only when `NODE_ENV=development`
- Uncaught exceptions and unhandled rejections cause process exit in production (process manager restarts)

## Cross-Cutting Concerns

**Logging:** `backend/utils/logger.js` — sanitizes sensitive fields (password, token, apiKey, cookie, ssn), suppresses info/debug in production, always logs warn/error, prefixed cron logging

**Validation:** Mongoose schema-level validation (enum, match, required); route-level manual validation for business rules; `escapeRegex()` utility for all user-supplied search strings

**Authentication:** httpOnly cookie as primary token transport; in-memory `authToken` as fallback; refresh tokens in sessionStorage; token rotation on refresh

**File Upload:** Multer with UUID-renamed files stored in `backend/uploads/{category}/`; MIME type + file extension double-validation; path traversal protection; served only through authenticated download endpoints (no static file serving)

**Subscription Enforcement:** `subscriptionLimits.js` middleware applied before resource creation routes; checks both driver/vehicle count limits and AI query quotas by plan

---

*Architecture analysis: 2026-02-25*
